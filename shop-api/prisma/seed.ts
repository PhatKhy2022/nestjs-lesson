// Fills the database with demo data. Run: npm run db:seed
// Safe to run many times: upsert updates existing rows instead of duplicating them.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient, Role } from '../src/generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@shop.dev' },
    update: {},
    create: {
      email: 'admin@shop.dev',
      name: 'Admin',
      passwordHash,
      role: Role.ADMIN,
    },
  });
  await prisma.user.upsert({
    where: { email: 'an@shop.dev' },
    update: {},
    create: { email: 'an@shop.dev', name: 'An', passwordHash },
  });

  const products = [
    { sku: 'KB-001', name: 'Keyboard', price: '49.00', stock: 120 },
    { sku: 'MS-001', name: 'Mouse', price: '19.50', stock: 300 },
    { sku: 'MN-001', name: 'Monitor', price: '189.00', stock: 15 },
    { sku: 'CB-001', name: 'USB-C Cable', price: '9.99', stock: 0 },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }

  console.log('Seeded 2 users (password: Password123!) and 4 products.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
