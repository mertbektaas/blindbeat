const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({ adapter });

async function verifyDatabaseConnection() {
  await prisma.$queryRaw`SELECT 1`;
  return true;
}

async function disconnectDatabase() {
  await prisma.$disconnect();
}

module.exports = {
  prisma,
  verifyDatabaseConnection,
  disconnectDatabase
};
