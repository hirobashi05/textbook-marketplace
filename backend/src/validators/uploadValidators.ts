import { z } from "zod";

export const uploadImageSchema = z.object({
  fileName: z.string().trim().min(1, "fileName は必須です").max(200, "fileName は200文字以内です"),
  dataUrl: z.string().trim().min(1, "画像データは必須です").max(2_000_000, "画像データが大きすぎます")
});
