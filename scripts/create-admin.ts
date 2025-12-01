import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { Role } from "../src/lib/prisma-constants";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@henrys.club";
  const password = "password123";
  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: Role.ADMIN,
      passwordHash: hashedPassword,
    },
    create: {
      email,
      name: "Admin User",
      role: Role.ADMIN,
      passwordHash: hashedPassword,
    },
  });

  console.log(`Admin user created/updated: ${user.email} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
