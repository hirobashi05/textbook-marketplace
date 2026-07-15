import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

function createPrismaClient() {
  if (!env.TURSO_DATABASE_URL) {
    return new PrismaClient();
  }

  if (env.TURSO_DATABASE_URL.startsWith("libsql:") && !env.TURSO_AUTH_TOKEN) {
    throw new Error("TURSO_AUTH_TOKEN is required for a remote Turso database");
  }

  const adapter = new PrismaLibSQL({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN
  });

  return new PrismaClient({ adapter });
}

export const prisma = createPrismaClient();
