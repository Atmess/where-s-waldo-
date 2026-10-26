// prisma/seed.js
const { PrismaClient } = require ('../generated/prisma/index.js');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding character targets...');

  // Define your targets with percentage bounding boxes (0 to 100%)
  const targets = [
    {
      name: 'waldo',
      imageName: 'urban-maze',
      minX: 40.0,
      maxX: 45.5,
      minY: 74.0,
      maxY: 79.5,
    },
    {
      name: 'wenda',
      imageName: 'urban-maze',
      minX: 22.0,
      maxX: 26.5,
      minY: 32.0,
      maxY: 37.0,
    },
    {
      name: 'woof',
      imageName: 'urban-maze',
      minX: 35.0,
      maxX: 39.0,
      minY: 45.0,
      maxY: 49.5,
    },
    {
      name: 'wizard',
      imageName: 'urban-maze',
      minX: 61.0,
      maxX: 65.5,
      minY: 52.0,
      maxY: 57.0,
    },
    {
      name: 'odlaw',
      imageName: 'urban-maze',
      minX: 81.0,
      maxX: 85.5,
      minY: 22.0,
      maxY: 27.0,
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
  });