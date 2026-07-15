import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().default("file:./dev.db"),
  TURSO_DATABASE_URL: z.string().url().optional(),
  TURSO_AUTH_TOKEN: z.string().min(1).optional(),
  UPLOAD_STORAGE: z.enum(["filesystem", "data_url"]).default("filesystem"),
  JWT_SECRET: z.string().min(16).default("dev-secret-change-me-12345"),
  UNIVERSITY_EMAIL_DOMAINS: z.string().min(3).default("keio.jp,keio.ac.jp,*.keio.ac.jp"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  PORT: z.coerce.number().int().positive().default(4000)
});

export const env = envSchema.parse(process.env);
