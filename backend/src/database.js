const path = require("node:path");
const dotenv = require("dotenv");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

dotenv.config({
  path: path.resolve(__dirname, "../../.env")
});

const configuredDatabaseUrl = process.env.DATABASE_URL;
const testDatabasePort = process.env.POSTGRES_HOST_PORT || "5433";
const connectionString =
  process.env.NODE_ENV === "test" && configuredDatabaseUrl?.includes("@postgres:5432")
    ? configuredDatabaseUrl.replace(
        "@postgres:5432",
        `@127.0.0.1:${testDatabasePort}`
    )
    : configuredDatabaseUrl;

const adapter = new PrismaPg({
  connectionString
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
