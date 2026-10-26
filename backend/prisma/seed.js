// prisma/seed.js
require('dotenv').config();

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../generated/prisma/index.js');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding character targets...');

const targets = [
    {
      name: 'waldo',
      imageName: 'urban-maze',
      minX: 40.5,
      maxX: 45.5,
      minY: 72.5,
      maxY: 77.5,
    },
    {
      name: 'wenda',
      imageName: 'urban-maze',
      minX: 41.0,
      maxX: 46.0,
      minY: 58.0,
      maxY: 62.5,
    },
    {
      name: 'woof',
      imageName: 'urban-maze',
      minX: 55.0,
      maxX: 60.0,
      minY: 28.5,
      maxY: 33.0,
    },
    {
      name: 'wizard',
      imageName: 'urban-maze',
      minX: 63.5,
      maxX: 68.0,
      minY: 75.5,
      maxY: 80.0,
    },
    {
      name: 'odlaw',
      imageName: 'urban-maze',
      minX: 56.5,
      maxX: 61.5,
      minY: 93.5,
      maxY: 98.0,
    },
  ];
  for (const target of targets) {
    await prisma.target.upsert({
      where: { name: target.name },
      update: target,
      create: target,
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });