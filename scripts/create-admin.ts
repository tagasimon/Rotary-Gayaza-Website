/**
 * Create (or reset) an admin user.
 *   npm run admin:create -- --email you@club.org --name "Your Name" --role SUPER_ADMIN --password 'long-password'
 * In the Docker image:  node dist/create-admin.js --email ... --password ...
 * If --password is omitted, a strong one is generated and printed once.
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const db = new PrismaClient();
const arg = (k: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

async function main() {
  const email = (arg("email") || process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  if (!email) throw new Error("--email is required");
  const name = arg("name") || "Club Administrator";
  const role = (arg("role") || "SUPER_ADMIN") as Role;
  if (!Object.values(Role).includes(role)) throw new Error(`--role must be one of ${Object.values(Role).join(", ")}`);
  const generated = !arg("password");
  const password = arg("password") || randomBytes(12).toString("base64url");
  if (password.length < 10) throw new Error("Password must be at least 10 characters");
  const passwordHash = await bcrypt.hash(password, 11);
  await db.user.upsert({
    where: { email },
    update: { passwordHash, role, active: true, failedLogins: 0, lockedUntil: null },
    create: { email, name, role, passwordHash },
  });
  console.log(`Admin ready: ${email} (${role})`);
  if (generated) console.log(`Temporary password: ${password}\nChange it after first login.`);
}

main().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => db.$disconnect());
