import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import { existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import bcrypt from "bcryptjs";

function getDbPath(): string {
  const dbUrl = process.env.DATABASE_URL || "file:./data/bookit.db";
  return dbUrl.replace("file:", "");
}

function ensureDbDirectory(dbPath: string): void {
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

async function main() {
  console.log("[Migrate] Starting database migration...");

  const dbPath = getDbPath();
  console.log("[Migrate] Database path:", dbPath);

  ensureDbDirectory(dbPath);

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");

  const db = drizzle(sqlite, { schema });

  // Run migrations
  const migrationsFolder = join(process.cwd(), "src/db/migrations");
  console.log("[Migrate] Migrations folder:", migrationsFolder);

  if (existsSync(migrationsFolder)) {
    migrate(db, { migrationsFolder });
    console.log("[Migrate] Migrations applied successfully");
  } else {
    console.log("[Migrate] No migrations folder found");
  }

  // Seed initial user if not exists
  const username = process.env.INITIAL_USERNAME || process.env.ADMIN_USERNAME;
  const password = process.env.INITIAL_PASSWORD || process.env.ADMIN_PASSWORD;

  if (username && password) {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!existingUser) {
      const passwordHash = await bcrypt.hash(password, 12);
      await db.insert(users).values({ username, passwordHash });
      console.log(`[Migrate] Initial user "${username}" created`);
    } else {
      console.log(`[Migrate] User "${username}" already exists`);
    }
  }

  sqlite.close();
  console.log("[Migrate] Done");
}

main().catch((error) => {
  console.error("[Migrate] Error:", error);
  process.exit(1);
});
