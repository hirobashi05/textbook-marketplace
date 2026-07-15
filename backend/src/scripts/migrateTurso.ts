import fs from "node:fs/promises";
import path from "node:path";
import { createClient, type InStatement } from "@libsql/client";
import { env } from "../config/env.js";

async function migrateTurso() {
  if (!env.TURSO_DATABASE_URL) {
    throw new Error("TURSO_DATABASE_URL is required");
  }
  if (env.TURSO_DATABASE_URL.startsWith("libsql:") && !env.TURSO_AUTH_TOKEN) {
    throw new Error("TURSO_AUTH_TOKEN is required for a remote Turso database");
  }

  const client = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN
  });

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "_app_migrations" (
        "name" TEXT NOT NULL PRIMARY KEY,
        "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const appliedRows = await client.execute('SELECT "name" FROM "_app_migrations"');
    const applied = new Set(appliedRows.rows.map((row) => String(row.name)));
    const migrationsRoot = path.resolve(process.cwd(), "prisma", "migrations");
    const entries = await fs.readdir(migrationsRoot, { withFileTypes: true });
    const migrationNames = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    for (const migrationName of migrationNames) {
      if (applied.has(migrationName)) {
        continue;
      }

      const sql = await fs.readFile(
        path.join(migrationsRoot, migrationName, "migration.sql"),
        "utf8"
      );
      const statements: InStatement[] = sql
        .split(";\n")
        .map((statement) => statement.trim())
        .filter(Boolean);

      statements.push({
        sql: 'INSERT INTO "_app_migrations" ("name") VALUES (?)',
        args: [migrationName]
      });

      await client.migrate(statements);
      console.log(`Applied Turso migration: ${migrationName}`);
    }

    console.log("Turso migrations are up to date");
  } finally {
    client.close();
  }
}

migrateTurso().catch((error) => {
  console.error(error);
  process.exit(1);
});
