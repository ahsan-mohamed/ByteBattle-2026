import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma";

/**
 * Ensures exactly one Admin account exists, matching ADMIN_USERNAME/ADMIN_PASSWORD
 * from the environment. This keeps admin credential management simple (env vars,
 * per spec section 39) while still storing a proper bcrypt hash in Postgres rather
 * than comparing plaintext on every login.
 *
 * If the env password changes between deploys, the stored hash is updated to match -
 * so rotating ADMIN_PASSWORD in your hosting provider's env settings is enough.
 */
export async function bootstrapAdmin(): Promise<void> {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.warn(
      "ADMIN_USERNAME / ADMIN_PASSWORD not set - skipping admin bootstrap. Admin login will fail until these are configured."
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.admin.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });
}
