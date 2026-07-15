import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("email の形式が正しくありません").transform((email) => email.toLowerCase()),
  password: z.string().min(1, "password は必須です")
});

