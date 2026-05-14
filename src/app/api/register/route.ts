import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Cấu hình bảo mật nâng cao
const REGISTRATION_COOLDOWN = 10 * 60 * 1000; // 10 phút
const MAX_INVITES_PER_USER = 3; // Giới hạn mỗi người chỉ được bảo lãnh 3 người

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, inviteCode } = body;

    if (!name || !email || !password || !inviteCode) {
      return NextResponse.json({ error: "Thông tin không đầy đủ" }, { status: 400 });
    }

    // 🛡️ 1. Kiểm tra người giới thiệu (Inviter)
    const inviter = await prisma.user.findUnique({
      where: { 
        email: inviteCode.toLowerCase(),
        isApproved: true 
      }
    });

    if (!inviter) {
      return NextResponse.json({ 
        error: "Người giới thiệu không tồn tại hoặc chưa được phê duyệt." 
      }, { status: 403 });
    }

    // 🛡️ 2. Kiểm tra giới hạn bảo lãnh (Hạn mức)
    // Nếu không phải ADMIN thì bị giới hạn số lượng bảo lãnh
    if (inviter.role !== "ADMIN") {
      const inviteCount = await prisma.user.count({
        where: { invitedBy: inviter.email }
      });

      if (inviteCount >= MAX_INVITES_PER_USER) {
        return NextResponse.json({ 
          error: "Thành viên này đã hết hạn mức bảo lãnh (Tối đa 3 người)." 
        }, { status: 403 });
      }
    }

    // 🛡️ 3. Chặn Account Flood (IP Cooldown)
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const recentRegistration = await prisma.user.findFirst({
      where: {
        registrationIp: ip,
        createdAt: { gte: new Date(Date.now() - REGISTRATION_COOLDOWN) }
      }
    });

    if (recentRegistration) {
      return NextResponse.json({ error: "Thao tác quá nhanh." }, { status: 429 });
    }

    // 🛡️ 4. Chống User Enumeration
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      return NextResponse.json({ 
        message: "Yêu cầu đã được ghi nhận. Vui lòng chờ Admin duyệt." 
      }, { status: 201 });
    }

    if (password.length < 10) {
      return NextResponse.json({ error: "Mật khẩu quá ngắn." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // 🛡️ 5. Lưu thông tin người bảo lãnh để truy cứu trách nhiệm
    await prisma.user.create({
      data: {
        name: String(name).trim().slice(0, 50),
        email: email.toLowerCase(),
        passwordHash,
        role: "TECHNICIAN",
        isApproved: false,
        registrationIp: ip,
        invitedBy: inviter.email // Lưu vết người bảo lãnh
      }
    });

    return NextResponse.json({ 
      message: "Yêu cầu đã được ghi nhận. Vui lòng chờ Admin duyệt." 
    }, { status: 201 });

  } catch (error) {
    console.error("[register_hardened_v2_error]", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
