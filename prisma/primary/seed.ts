import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaClient } from '../../node_modules/.prisma/primary';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@local.com';
  const plainPassword = process.env.SEED_ADMIN_PASSWORD || 'admin';
  const name = process.env.SEED_ADMIN_NAME || 'Admin';
  const role = (process.env.SEED_ADMIN_ROLE as 'ADMIN' | 'USER') || 'ADMIN';

  const password = await bcrypt.hash(
    plainPassword,
    Number(process.env.BCRYPT_SALT_ROUNDS || 10),
  );

  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password,
      role,
      updatedAt: new Date(),
    },
    create: {
      id: randomUUID(),
      email,
      name,
      password,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`Usuário seed garantido: ${email} (${role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
