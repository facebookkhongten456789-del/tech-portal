import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Cấu hình giới hạn
const REGISTRATION_COOLDOWN = 5 * 60 * 1000; // 5 phút mỗi IP

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 🛡️ Fix Mass Assignment: Chỉ bóc tách các trường được phép
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Thông tin không hợp lệ" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Mật khẩu không đạt yêu cầu bảo mật" }, { status: 400 });
    }

    // 🛡️ Chặn Account Flood (Spam): Kiểm tra IP
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    
    const recentRegistration = await prisma.user.findFirst({
      where: {
        registrationIp: ip,
        createdAt: { gte: new Date(Date.now() - REGISTRATION_COOLDOWN) }
      }
    });

    if (recentRegistration) {
      return NextResponse.json({ 
        error: "Thao tác quá nhanh. Vui lòng thử lại sau vài phút." 
      }, { status: 429 });
    }

    // 🛡️ Fix User Enumeration: Dùng thông báo chung cho lỗi tồn tại
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      // Vẫn trả về lỗi nhưng không khẳng định là do email (hoặc dùng thông báo ít gợi ý hơn)
      return NextResponse.json({ error: "Yêu cầu đăng ký không thể thực hiện" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // 🛡️ Đảm bảo role và isApproved luôn an toàn
    await prisma.user.create({
      data: {
        name: String(name).trim().slice(0, 50),
        email: email.toLowerCase(),
        passwordHash,
        role: "TECHNICIAN",
        isApproved: false,
        registrationIp: ip
      }
    });

    // 🛡️ Fix UserId Leaked: Không trả về ID trong response
    return NextResponse.json({ 
      message: "Yêu cầu đã được ghi nhận. Vui lòng chờ quản trị viên phê duyệt." 
    }, { status: 201 });

  } catch (error) {
    console.error("[register_security_error]", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
