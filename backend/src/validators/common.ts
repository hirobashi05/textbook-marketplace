import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().min(1, "id は必須です")
});

