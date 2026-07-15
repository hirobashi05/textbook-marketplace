import { z } from "zod";
import { transactionStatuses } from "../utils/enums.js";

export const createOrderSchema = z.object({
  listingId: z.string().min(1, "listingId は必須です"),
  shippingAddress: z.string().trim().min(1, "shippingAddress は必須です").max(300, "shippingAddress は300文字以内です"),
  shippingFee: z.number().int("shippingFee は整数です")
});

export const updateTransactionStatusSchema = z.object({
  transactionStatus: z.enum(transactionStatuses)
});

export const purchasePointsSchema = z.object({
  amount: z.number().int("amount は整数です").min(100, "ポイント購入は100pt以上です").max(100000, "ポイント購入は100000pt以下です"),
  paymentMethod: z.enum(["credit_card", "convenience_store", "campus_coop"]),
  providerReference: z.string().trim().max(120, "providerReference は120文字以内です").optional()
});
