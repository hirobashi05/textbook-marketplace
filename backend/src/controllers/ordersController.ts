import { TransactionStatus } from "@prisma/client";
import { purchaseListing } from "../services/orderService.js";
import { toPrismaTransactionStatus } from "../utils/enums.js";
import { AppError, asyncHandler } from "../utils/errors.js";
import { prisma } from "../utils/prisma.js";
import { toOrderResponse } from "../utils/serializers.js";

const orderInclude = {
  listing: {
    include: {
      textbook: true,
      seller: { select: { uid: true, name: true } }
    }
  }
};

const sellerTransitions = new Map<TransactionStatus, TransactionStatus[]>([
  [TransactionStatus.PURCHASED, [TransactionStatus.AWAITING_SELLER_CONFIRMATION]],
  [TransactionStatus.AWAITING_SELLER_CONFIRMATION, [TransactionStatus.PREPARING_SHIPMENT]],
  [TransactionStatus.PREPARING_SHIPMENT, [TransactionStatus.SHIPPED]]
]);
const buyerTransitions = new Map<TransactionStatus, TransactionStatus[]>([
  [TransactionStatus.SHIPPED, [TransactionStatus.COMPLETED]]
]);
const cancellationSources = new Set<TransactionStatus>([
  TransactionStatus.PURCHASED,
  TransactionStatus.AWAITING_SELLER_CONFIRMATION,
  TransactionStatus.PREPARING_SHIPMENT
]);

export const createOrder = asyncHandler(async (req, res) => {
  const result = await purchaseListing({
    buyerId: req.user!.uid,
    listingId: req.body.listingId,
    shippingAddress: req.body.shippingAddress,
    shippingFee: req.body.shippingFee
  });
  res.status(201).json(result);
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { buyerId: req.user!.uid },
    include: orderInclude,
    orderBy: { createdAt: "desc" }
  });
  res.json(orders.map(toOrderResponse));
});

export const listMySalesOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { listing: { sellerId: req.user!.uid } },
    include: orderInclude,
    orderBy: { createdAt: "desc" }
  });
  res.json(orders.map(toOrderResponse));
});

export const updateTransactionStatus = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: orderInclude
  });
  if (!order) {
    throw new AppError(404, "NOT_FOUND", "注文が見つかりません");
  }

  const targetStatus = toPrismaTransactionStatus(req.body.transactionStatus);
  const isSeller = order.listing.sellerId === req.user!.uid;
  const isBuyer = order.buyerId === req.user!.uid;
  if (!isSeller && !isBuyer) {
    throw new AppError(403, "FORBIDDEN", "この取引のステータスは更新できません");
  }

  const canRequestCancellation =
    targetStatus === TransactionStatus.CANCELLATION_REQUESTED &&
    cancellationSources.has(order.transactionStatus);
  const canTransition = Boolean(
    canRequestCancellation ||
      (isSeller && sellerTransitions.get(order.transactionStatus)?.includes(targetStatus)) ||
      (isBuyer && buyerTransitions.get(order.transactionStatus)?.includes(targetStatus))
  );
  if (!canTransition) {
    throw new AppError(409, "INVALID_TRANSACTION_STATUS_TRANSITION", "許可されていない取引ステータスの変更です");
  }

  const result = await prisma.$transaction(async (tx) => {
    const changed = await tx.order.updateMany({
      where: { id: order.id, transactionStatus: order.transactionStatus },
      data: { transactionStatus: targetStatus }
    });
    if (changed.count !== 1) {
      throw new AppError(409, "TRANSACTION_STATUS_CONFLICT", "取引状態が更新されています。再読み込みしてください");
    }
    return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
  });

  res.json(toOrderResponse(result));
});
