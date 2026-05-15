import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET không được thiết lập.");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const ip = (req as any)?.headers?.["x-forwarded-for"] || "127.0.0.1";
        const userAgent = (req as any)?.headers?.["user-agent"] || "unknown";

        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        // 🛡️ Fix Audit: Nếu user không tồn tại, trả về null (Generic error)
        if (!user) {
          await prisma.auditLog.create({
            data: { event: "LOGIN_FAIL_NOT_FOUND", email: credentials.email, ip, userAgent, details: "Email not registered" }
          });
          throw new Error("Thông tin đăng nhập không chính xác hoặc tài khoản chưa được phê duyệt.");
        }

        // 🛡️ Brute Force Check
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
          const waitTime = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 1000 / 60);
          throw new Error(`Tài khoản bị khóa tạm thời do nhập sai nhiều lần. Vui lòng thử lại sau ${waitTime} phút.`);
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          const newFailedAttempts = user.failedAttempts + 1;
          const lockoutUntil = newFailedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

          await prisma.user.update({
            where: { id: user.id },
            data: { failedAttempts: newFailedAttempts, lockoutUntil: lockoutUntil }
          });

          await prisma.auditLog.create({
            data: { 
              event: "LOGIN_FAIL_PASSWORD", 
              userId: user.id, 
              email: user.email, 
              ip, 
              userAgent, 
              details: `Attempts: ${newFailedAttempts}${lockoutUntil ? ' - LOCKED' : ''}` 
            }
          });

          throw new Error("Thông tin đăng nhập không chính xác hoặc tài khoản chưa được phê duyệt.");
        }

        // 🛡️ Check Approval
        if (!user.isApproved) {
          await prisma.auditLog.create({
            data: { event: "LOGIN_FAIL_PENDING", userId: user.id, email: user.email, ip, userAgent }
          });
          throw new Error("Tài khoản của bạn đang chờ phê duyệt. Vui lòng liên hệ Admin.");
        }

        // 🛡️ Login Success
        await prisma.user.update({
          where: { id: user.id },
          data: { failedAttempts: 0, lockoutUntil: null, lastLogin: new Date(), lastIp: ip }
        });

        await prisma.auditLog.create({
          data: { event: "LOGIN_SUCCESS", userId: user.id, email: user.email, ip, userAgent }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isApproved: user.isApproved,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.isApproved = (user as any).isApproved;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        (session.user as any).isApproved = token.isApproved as boolean;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { 
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
    updateAge: 2 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
