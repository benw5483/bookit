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

const dbPath = getDbPath();
ensureDbDirectory(dbPath);

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// Run migrations automatically
try {
  const migrationsFolder = join(process.cwd(), "src/db/migrations");
  if (existsSync(migrationsFolder)) {
    migrate(db, { migrationsFolder });
    console.log("[DB] Migrations applied successfully");
  }
} catch (error) {
  console.error("[DB] Migration error:", error);
}

// Seed initial user if not exists
async function seedInitialUser() {
  const username = process.env.INITIAL_USERNAME || process.env.ADMIN_USERNAME;
  const password = process.env.INITIAL_PASSWORD || process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return;
  }

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!existingUser) {
      const passwordHash = await bcrypt.hash(password, 12);
      await db.insert(users).values({ username, passwordHash });
      console.log(`[DB] Initial user "${username}" created`);
    }
  } catch (error) {
    console.error("[DB] Seed error:", error);
  }
}

seedInitialUser();
