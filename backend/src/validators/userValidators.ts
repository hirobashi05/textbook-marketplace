import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("email の形式が正しくありません").transform((email) => email.toLowerCase()),
  name: z.string().trim().min(1, "name は必須です").max(80, "name は80文字以内です"),
  password: z.string().min(8, "password は8文字以上です")
});

