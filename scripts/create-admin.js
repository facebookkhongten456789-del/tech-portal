const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@techportal.com";
  const password = "admin123"; // Bạn hãy đổi mật khẩu này sau khi đăng nhập!
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Tài khoản admin đã tồn tại.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  
  await prisma.user.create({
    data: {
      name: "Administrator",
      email,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("------------------------------------------");
  console.log("TẠO TÀI KHOẢN ADMIN THÀNH CÔNG!");
  console.log("Email: " + email);
  console.log("Mật khẩu: " + password);
  console.log("------------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
