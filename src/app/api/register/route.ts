import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyTurnstile } from "@/lib/turnstile";

const REGISTRATION_COOLDOWN = 10 * 60 * 1000;
const MAX_INVITES_PER_USER = 5;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    const body = await req.json();
    const { name, email, password, inviteCode, turnstileToken } = body;

    // 🛡️ 1. Xác thực Cloudflare Turnstile (Bot Protection)
    if (!turnstileToken) {
      return NextResponse.json({ error: "Vui lòng hoàn thành xác minh bảo mật." }, { status: 400 });
    }

    const isValid = await verifyTurnstile(turnstileToken);
    if (!isValid) {
      await prisma.auditLog.create({
        data: { event: "REGISTER_BOT_DETECTED", email, ip, userAgent, details: "Turnstile verification failed" }
      });
      return NextResponse.json({ error: "Xác minh bảo mật thất bại. Bạn có phải là robot?" }, { status: 400 });
    }

    // 🛡️ 2. Validate Inputs
    if (!name || !email || !password || !inviteCode) {
      return NextResponse.json({ error: "Thông tin không đầy đủ." }, { status: 400 });
    }

    // 🛡️ 3. Kiểm tra người giới thiệu
    const inviter = await prisma.user.findUnique({
      where: { email: inviteCode.toLowerCase(), isApproved: true }
    });

    if (!inviter) {
      return NextResponse.json({ error: "Mã mời không hợp lệ hoặc người bảo lãnh chưa được duyệt." }, { status: 403 });
    }

    // 🛡️ 4. Hạn mức & Cooldown
    if (inviter.role !== "ADMIN") {
      const inviteCount = await prisma.user.count({ where: { invitedBy: inviter.email } });
      if (inviteCount >= MAX_INVITES_PER_USER) return NextResponse.json({ error: "Thành viên này đã hết hạn mức bảo lãnh." }, { status: 403 });
    }

    const recentRegistration = await prisma.user.findFirst({
      where: { registrationIp: ip, createdAt: { gte: new Date(Date.now() - REGISTRATION_COOLDOWN) } }
    });
    if (recentRegistration) return NextResponse.json({ error: "Thao tác quá nhanh. Thử lại sau 10 phút." }, { status: 429 });

    // 🛡️ 5. User Enum Protection
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return NextResponse.json({ message: "Yêu cầu đã được ghi nhận. Vui lòng chờ phê duyệt." }, { status: 201 });

    if (password.length < 10) return NextResponse.json({ error: "Mật khẩu quá ngắn." }, { status: 400 });

    // 🛡️ 6. Create User
    const passwordHash = await bcrypt.hash(password, 12);
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
      data: { event: "REGISTER_SUCCESS", userId: newUser.id, email: newUser.email, ip, userAgent, details: `Invited by ${inviter.email}` }
    });

    return NextResponse.json({ message: "Yêu cầu đã được ghi nhận. Vui lòng chờ phê duyệt." }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: "Lỗi hệ thống. Vui lòng thử lại sau." }, { status: 500 });
  }
}
