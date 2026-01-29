import { db } from "./index";
import { users } from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "changeme";

  const existingUser = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (existingUser) {
    console.log(`User "${username}" already exists. Skipping seed.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    username,
    passwordHash,
  });

  console.log(`Admin user "${username}" created successfully.`);
  console.log("Please change the default password after first login.");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
