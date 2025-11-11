import { PrismaClient, $Enums } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'rileyhaase090@gmail.com';
const ADMIN_PASSWORD = 'Admin1';
const SALT_ROUNDS = 12;

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      role: $Enums.Role.ADMIN,
      passwordHash,
    },
    update: {
      role: $Enums.Role.ADMIN,
      passwordHash,
    },
  });

  console.log(`Admin ensured for ${ADMIN_EMAIL}`);
}

async function run() {
  try {
    await main();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Failed to ensure admin user: ${message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void run();
