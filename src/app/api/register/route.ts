import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Cấu hình bảo mật nâng cao
const REGISTRATION_COOLDOWN = 10 * 60 * 1000; // 10 phút
const MAX_INVITES_PER_USER = 5; // Tăng lên 5 người

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    const body = await req.json();
    const { name, email, password, inviteCode, captchaAnswer, captchaQuestion } = body;

    // 🛡️ 1. Xác thực Math CAPTCHA (Chống Bot)
    // Câu hỏi có dạng "X + Y"
    if (!captchaAnswer || !captchaQuestion) {
      return NextResponse.json({ error: "Vui lòng xác minh mã Captcha." }, { status: 400 });
    }

    const [num1, operator, num2] = captchaQuestion.split(" ");
    const expected = parseInt(num1) + parseInt(num2);
    
    if (parseInt(captchaAnswer) !== expected) {
      await prisma.auditLog.create({
        data: { event: "REGISTER_CAPTCHA_FAIL", email, ip, userAgent, details: `Wrong answer: ${captchaAnswer}` }
      });
      return NextResponse.json({ error: "Mã xác nhận (Captcha) không chính xác." }, { status: 400 });
    }

    if (!name || !email || !password || !inviteCode) {
      return NextResponse.json({ error: "Thông tin không đầy đủ." }, { status: 400 });
    }

    // 🛡️ 2. Kiểm tra người giới thiệu (STRICT VALIDATION)
    const inviter = await prisma.user.findUnique({
      where: { 
        email: inviteCode.toLowerCase(),
        isApproved: true 
      }
    });

    if (!inviter) {
      await prisma.auditLog.create({
        data: { event: "REGISTER_INVITE_FAIL", email, ip, userAgent, details: `Invalid invite code: ${inviteCode}` }
      });
      return NextResponse.json({ 
        error: "Mã mời không hợp lệ hoặc người bảo lãnh chưa được duyệt." 
      }, { status: 403 });
    }

    // 🛡️ 3. Kiểm tra giới hạn bảo lãnh
    if (inviter.role !== "ADMIN") {
      const inviteCount = await prisma.user.count({
        where: { invitedBy: inviter.email }
      });

      if (inviteCount >= MAX_INVITES_PER_USER) {
        return NextResponse.json({ 
          error: "Thành viên này đã hết hạn mức bảo lãnh." 
        }, { status: 403 });
      }
    }

    // 🛡️ 4. Chặn Account Flood (IP Cooldown)
    const recentRegistration = await prisma.user.findFirst({
      where: {
        registrationIp: ip,
        createdAt: { gte: new Date(Date.now() - REGISTRATION_COOLDOWN) }
      }
    });

    if (recentRegistration) {
      return NextResponse.json({ error: "Thao tác quá nhanh. Thử lại sau 10 phút." }, { status: 429 });
    }

    // 🛡️ 5. Chống User Enumeration
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      return NextResponse.json({ 
        message: "Yêu cầu đã được ghi nhận. Vui lòng chờ phê duyệt." 
      }, { status: 201 });
    }

    if (password.length < 10) {
      return NextResponse.json({ error: "Mật khẩu quá ngắn." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // 🛡️ 6. Tạo tài khoản & Ghi log
    const newUser = await prisma.user.create({
      data: {
        name: String(name).trim().slice(0, 50),
        email: email.toLowerCase(),
        passwordHash,
        role: "TECHNICIAN",
        isApproved: false,
        registrationIp: ip,
        invitedBy: inviter.email
      }
    });

    await prisma.auditLog.create({
      data: { 
        event: "REGISTER_SUCCESS", 
        userId: newUser.id,
        email: newUser.email,
        ip, 
        userAgent,
        details: `Invited by ${inviter.email}`
      }
    });

    return NextResponse.json({ 
      message: "Yêu cầu đã được ghi nhận. Vui lòng chờ phê duyệt." 
    }, { status: 201 });

  } catch (error) {
    console.error("[register_hardened_v3_error]", error);
    return NextResponse.json({ error: "Lỗi hệ thống (502/500). Vui lòng thử lại." }, { status: 500 });
  }
}
