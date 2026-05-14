const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    where: { role: "ADMIN" },
    data: { isApproved: true }
  });
  console.log("Đã duyệt tất cả Admin!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
