import bcrypt from "bcryptjs";
import { PointPurchaseStatus, PointTransactionType, Prisma } from "@prisma/client";
import { env } from "../config/env.js";
import {
  readPaymentSettings,
  writePaymentSettings
} from "../services/paymentSettingsService.js";
import { prisma } from "../utils/prisma.js";
import { AppError, asyncHandler } from "../utils/errors.js";
import {
  toPaymentSettingsResponse,
  toPointPurchaseResponse,
  toPointTransactionResponse,
  toUserResponse
} from "../utils/serializers.js";
import { assertActiveUser } from "../services/userService.js";

function isAllowedUniversityEmail(email: string) {
  const domain = email.split("@").pop()?.toLowerCase();

  if (!domain) {
    return false;
  }

  return env.UNIVERSITY_EMAIL_DOMAINS.split(",").some((pattern) => {
    const normalized = pattern.trim().replace(/^@/, "").toLowerCase();

    if (normalized.startsWith("*.")) {
      const suffix = normalized.slice(2);
      return domain.endsWith(`.${suffix}`);
    }

    return domain === normalized;
  });
}

export const createUser = asyncHandler(async (req, res) => {
  const { email, name, password } = req.body;

  if (!isAllowedUniversityEmail(email)) {
    throw new AppError(400, "EMAIL_DOMAIN_NOT_ALLOWED", "慶應義塾大学のメールアドレスのみ登録できます");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash
      }
    });

    res.status(201).json(toUserResponse(user));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "EMAIL_ALREADY_EXISTS", "この email はすでに登録されています");
    }

    throw error;
  }
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { uid: req.user!.uid }
  });

  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "認証情報が無効です");
  }

  res.json(toUserResponse(user));
});

export const purchasePoints = asyncHandler(async (req, res) => {
  assertActiveUser(req.user!);

  const { amount, paymentMethod, providerReference } = req.body;

  const result = await prisma.$transaction(async (tx) => {
    const purchase = await tx.pointPurchase.create({
      data: {
        userId: req.user!.uid,
        amount,
        paymentMethod,
        providerReference,
        status: PointPurchaseStatus.PAID
      }
    });

    const user = await tx.user.update({
      where: { uid: req.user!.uid },
      data: {
        points: {
          increment: amount
        },
        paymentMethod
      }
    });

    await tx.pointTransaction.create({
      data: {
        userId: user.uid,
        type: PointTransactionType.POINT_PURCHASE,
        amount,
        balanceAfter: user.points,
        pointPurchaseId: purchase.id,
        description: "ポイント購入"
      }
    });

    return {
      purchase,
      user
    };
  });

  res.status(201).json({
    pointPurchase: toPointPurchaseResponse(result.purchase),
    user: toUserResponse(result.user),
    message: "ポイントを購入しました"
  });
});

export const listMyPointPurchases = asyncHandler(async (req, res) => {
  const purchases = await prisma.pointPurchase.findMany({
    where: { userId: req.user!.uid },
    orderBy: { createdAt: "desc" }
  });

  res.json(purchases.map(toPointPurchaseResponse));
});

export const listMyPointTransactions = asyncHandler(async (req, res) => {
  const transactions = await prisma.pointTransaction.findMany({
    where: { userId: req.user!.uid },
    orderBy: { createdAt: "desc" }
  });

  res.json(transactions.map(toPointTransactionResponse));
});

export const getMyPaymentSettings = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { uid: req.user!.uid },
    select: {
      paymentMethod: true
    }
  });

  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "認証情報が無効です");
  }

  const settings = await readPaymentSettings(req.user!.uid, user.paymentMethod);
  res.json(toPaymentSettingsResponse(settings));
});

export const updateMyPaymentSettings = asyncHandler(async (req, res) => {
  const settings = await writePaymentSettings(req.user!.uid, req.body);

  res.json({
    paymentSettings: toPaymentSettingsResponse(settings),
    message: "支払い設定を更新しました"
  });
});
