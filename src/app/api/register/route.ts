import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ thông tin" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu phải ít nhất 6 ký tự" }, { status: 400 });
    }

    // Kiểm tra email tồn tại
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      return NextResponse.json({ error: "Email này đã được đăng ký" }, { status: 400 });
    }

    // Mã hóa mật khẩu
    const passwordHash = await bcrypt.hash(password, 12);

    // Tạo người dùng mới (mặc định là TECHNICIAN)
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "TECHNICIAN",
      }
    });

    return NextResponse.json({ message: "Đăng ký thành công", userId: user.id }, { status: 201 });

  } catch (error) {
    console.error("[register_api_error]", error);
    return NextResponse.json({ error: "Có lỗi xảy ra trên hệ thống" }, { status: 500 });
  }
}
