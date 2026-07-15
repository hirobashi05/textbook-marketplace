import fs from "node:fs/promises";
import path from "node:path";
import type { PaymentSetting } from "@prisma/client";
import { prisma } from "../utils/prisma.js";

export const storedPaymentMethods = ["credit_card", "convenience_store"] as const;
export const cardBrands = ["visa", "mastercard", "jcb", "amex", "diners", "discover", "other"] as const;
export const convenienceStoreChains = [
  "seven_eleven",
  "familymart",
  "lawson",
  "ministop",
  "daily_yamazaki",
  "seicomart",
  "other"
] as const;

export type StoredPaymentMethod = (typeof storedPaymentMethods)[number];
export type CardBrand = (typeof cardBrands)[number];
export type ConvenienceStoreChain = (typeof convenienceStoreChains)[number];

export type CreditCardSettings = {
  holderName: string;
  brand: CardBrand;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
};

export type ConvenienceStoreSettings = {
  chain: ConvenienceStoreChain;
  payerName: string;
  payerPhone: string;
};

export type PaymentSettings = {
  preferredMethod: StoredPaymentMethod;
  creditCard: CreditCardSettings | null;
  convenienceStore: ConvenienceStoreSettings | null;
  updatedAt: string | null;
};

const paymentSettingsRoot = path.resolve(process.cwd(), "storage", "payment-settings");

function getPaymentSettingsPath(userId: string) {
  return path.join(paymentSettingsRoot, `${userId}.json`);
}

export function resolvePreferredMethod(value: string | null | undefined): StoredPaymentMethod {
  return value === "convenience_store" ? "convenience_store" : "credit_card";
}

export function buildDefaultPaymentSettings(preferredMethod?: string | null): PaymentSettings {
  return {
    preferredMethod: resolvePreferredMethod(preferredMethod),
    creditCard: null,
    convenienceStore: null,
    updatedAt: null
  };
}

function toPaymentSettings(record: PaymentSetting): PaymentSettings {
  const creditCard =
    record.cardHolderName &&
    record.cardBrand &&
    record.cardLast4 &&
    record.cardExpiryMonth !== null &&
    record.cardExpiryYear !== null
      ? {
          holderName: record.cardHolderName,
          brand: record.cardBrand as CardBrand,
          last4: record.cardLast4,
          expiryMonth: record.cardExpiryMonth,
          expiryYear: record.cardExpiryYear
        }
      : null;
  const convenienceStore =
    record.convenienceStoreChain &&
    record.conveniencePayerName &&
    record.conveniencePayerPhone
      ? {
          chain: record.convenienceStoreChain as ConvenienceStoreChain,
          payerName: record.conveniencePayerName,
          payerPhone: record.conveniencePayerPhone
        }
      : null;

  return {
    preferredMethod: resolvePreferredMethod(record.preferredMethod),
    creditCard,
    convenienceStore,
    updatedAt: record.updatedAt.toISOString()
  };
}

function toPaymentSettingData(
  settings: Omit<PaymentSettings, "updatedAt">,
  updatedAt = new Date()
) {
  return {
    preferredMethod: resolvePreferredMethod(settings.preferredMethod),
    cardHolderName: settings.creditCard?.holderName ?? null,
    cardBrand: settings.creditCard?.brand ?? null,
    cardLast4: settings.creditCard?.last4 ?? null,
    cardExpiryMonth: settings.creditCard?.expiryMonth ?? null,
    cardExpiryYear: settings.creditCard?.expiryYear ?? null,
    convenienceStoreChain: settings.convenienceStore?.chain ?? null,
    conveniencePayerName: settings.convenienceStore?.payerName ?? null,
    conveniencePayerPhone: settings.convenienceStore?.payerPhone ?? null,
    updatedAt
  };
}

async function readLegacyPaymentSettings(userId: string, preferredMethod?: string | null) {
  try {
    const content = await fs.readFile(getPaymentSettingsPath(userId), "utf8");
    const parsed = JSON.parse(content) as PaymentSettings;
    const normalized: PaymentSettings = {
      ...buildDefaultPaymentSettings(preferredMethod),
      ...parsed,
      preferredMethod: resolvePreferredMethod(parsed.preferredMethod)
    };
    const parsedUpdatedAt = normalized.updatedAt ? new Date(normalized.updatedAt) : new Date();
    const updatedAt = Number.isNaN(parsedUpdatedAt.getTime()) ? new Date() : parsedUpdatedAt;
    const data = toPaymentSettingData(normalized, updatedAt);
    const stored = await prisma.paymentSetting.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data
    });

    return toPaymentSettings(stored);
  } catch {
    return null;
  }
}

export async function readPaymentSettings(userId: string, preferredMethod?: string | null) {
  const stored = await prisma.paymentSetting.findUnique({ where: { userId } });

  if (stored) {
    return toPaymentSettings(stored);
  }

  return (
    (await readLegacyPaymentSettings(userId, preferredMethod)) ??
    buildDefaultPaymentSettings(preferredMethod)
  );
}

export async function writePaymentSettings(
  userId: string,
  settings: Omit<PaymentSettings, "updatedAt">
) {
  const data = toPaymentSettingData(settings);
  const [stored] = await prisma.$transaction([
    prisma.paymentSetting.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data
    }),
    prisma.user.update({
      where: { uid: userId },
      data: { paymentMethod: resolvePreferredMethod(settings.preferredMethod) }
    })
  ]);

  return toPaymentSettings(stored);
}
