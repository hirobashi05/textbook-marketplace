import { z } from "zod";
import {
  cardBrands,
  convenienceStoreChains,
  storedPaymentMethods
} from "../services/paymentSettingsService.js";

const currentYear = new Date().getFullYear();

const creditCardSettingsSchema = z.object({
  holderName: z.string().trim().min(1, "カード名義は必須です").max(80, "カード名義は80文字以内です"),
  brand: z.enum(cardBrands),
  last4: z.string().regex(/^\d{4}$/, "カード番号下4桁を入力してください"),
  expiryMonth: z.number().int("有効期限(月)は整数です").min(1, "有効期限(月)は1以上です").max(12, "有効期限(月)は12以下です"),
  expiryYear: z
    .number()
    .int("有効期限(年)は整数です")
    .min(currentYear, `有効期限(年)は${currentYear}以上です`)
    .max(currentYear + 20, `有効期限(年)は${currentYear + 20}以下です`)
});

const convenienceStoreSettingsSchema = z.object({
  chain: z.enum(convenienceStoreChains),
  payerName: z.string().trim().min(1, "支払人名は必須です").max(80, "支払人名は80文字以内です"),
  payerPhone: z.string().trim().regex(/^\d{10,11}$/, "電話番号は10桁または11桁の数字で入力してください")
});

export const updatePaymentSettingsSchema = z
  .object({
    preferredMethod: z.enum(storedPaymentMethods),
    creditCard: creditCardSettingsSchema.nullable(),
    convenienceStore: convenienceStoreSettingsSchema.nullable()
  })
  .superRefine((data, ctx) => {
    if (data.preferredMethod === "credit_card" && !data.creditCard) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["creditCard"],
        message: "クレジットカード設定を入力してください"
      });
    }

    if (data.preferredMethod === "convenience_store" && !data.convenienceStore) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["convenienceStore"],
        message: "コンビニ払い設定を入力してください"
      });
    }
  });
