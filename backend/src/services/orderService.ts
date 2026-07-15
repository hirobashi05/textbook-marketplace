import {
  ListingStatus,
  OrderStatus,
  PointTransactionType,
  Prisma,
  TransactionStatus,
  UserStatus
} from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../utils/errors.js";
import { toApiListingStatus, toApiOrderStatus } from "../utils/enums.js";

type CreateOrderInput = {
  buyerId: string;
  listingId: string;
  shippingAddress: string;
  shippingFee: number;
};

export async function purchaseListing(input: CreateOrderInput) {
  if (input.shippingFee < 0) {
    throw new AppError(400, "INVALID_SHIPPING_FEE", "送料は0以上で入力してください");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({
        where: { id: input.listingId },
        select: {
          id: true,
          sellerId: true,
          sellingPrice: true,
          status: true
        }
      });

      if (!listing) {
        throw new AppError(404, "LISTING_NOT_FOUND", "出品が見つかりません");
      }

      if (listing.status !== ListingStatus.AVAILABLE) {
        throw new AppError(409, "LISTING_NOT_AVAILABLE", "この教科書は現在購入できません");
      }

      if (listing.sellerId === input.buyerId) {
        throw new AppError(403, "CANNOT_BUY_OWN_LISTING", "自分の出品は購入できません");
      }

      const buyer = await tx.user.findUnique({
        where: { uid: input.buyerId },
        select: { points: true, userStatus: true }
      });

      if (!buyer || buyer.userStatus !== UserStatus.ACTIVE) {
        throw new AppError(403, "USER_NOT_ACTIVE", "このユーザーは現在購入できません");
      }

      const totalAmount = listing.sellingPrice + input.shippingFee;

      if (buyer.points < totalAmount) {
        throw new AppError(402, "INSUFFICIENT_POINTS", "ポイント残高が不足しています");
      }

      const order = await tx.order.create({
        data: {
          listingId: listing.id,
          buyerId: input.buyerId,
          shippingAddress: input.shippingAddress,
          shippingFee: input.shippingFee,
          totalAmount,
          paymentMethod: "points",
          status: OrderStatus.PAID,
          transactionStatus: TransactionStatus.AWAITING_SELLER_CONFIRMATION
        }
      });

      const updated = await tx.listing.updateMany({
        where: {
          id: listing.id,
          status: ListingStatus.AVAILABLE
        },
        data: {
          status: ListingStatus.SOLD
        }
      });

      if (updated.count !== 1) {
        throw new AppError(409, "PURCHASE_CONFLICT", "同時購入が発生したため購入できませんでした");
      }

      const buyerUpdate = await tx.user.updateMany({
        where: {
          uid: input.buyerId,
          points: {
            gte: totalAmount
          }
        },
        data: {
          points: {
            decrement: totalAmount
          }
        }
      });

      if (buyerUpdate.count !== 1) {
        throw new AppError(402, "INSUFFICIENT_POINTS", "ポイント残高が不足しています");
      }

      const seller = await tx.user.update({
        where: { uid: listing.sellerId },
        data: {
          points: {
            increment: totalAmount
          }
        },
        select: {
          points: true
        }
      });

      const updatedBuyer = await tx.user.findUniqueOrThrow({
        where: { uid: input.buyerId },
        select: {
          points: true
        }
      });

      await tx.pointTransaction.createMany({
        data: [
          {
            userId: input.buyerId,
            type: PointTransactionType.TEXTBOOK_PURCHASE,
            amount: -totalAmount,
            balanceAfter: updatedBuyer.points,
            orderId: order.id,
            description: "教科書購入"
          },
          {
            userId: listing.sellerId,
            type: PointTransactionType.TEXTBOOK_SALE,
            amount: totalAmount,
            balanceAfter: seller.points,
            orderId: order.id,
            description: "教科書販売による獲得"
          }
        ]
      });

      return {
        orderId: order.id,
        listingId: order.listingId,
        buyerId: order.buyerId,
        status: toApiOrderStatus(order.status),
        orderStatus: toApiOrderStatus(order.status),
        transactionStatus: "awaiting_seller_confirmation" as const,
        listingStatus: toApiListingStatus(ListingStatus.SOLD),
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        buyerPointsBalance: updatedBuyer.points,
        sellerPointsBalance: seller.points,
        message: "購入が完了しました"
      };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "PURCHASE_CONFLICT", "この出品はすでに購入されています");
    }

    throw error;
  }
}
