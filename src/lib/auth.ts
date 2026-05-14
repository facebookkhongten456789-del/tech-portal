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
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) return null;

        // 🛡️ Fix 6: Brute Force Protection - Kiểm tra tài khoản có đang bị khóa không
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
          const waitTime = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 1000 / 60);
          throw new Error(`Tài khoản bị khóa tạm thời. Vui lòng thử lại sau ${waitTime} phút.`);
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          // Tăng số lần thử sai
          const newFailedAttempts = user.failedAttempts + 1;
          const lockoutUntil = newFailedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // Khóa 15 phút

          await prisma.user.update({
            where: { id: user.id },
            data: { 
              failedAttempts: newFailedAttempts,
              lockoutUntil: lockoutUntil
            }
          });

          if (lockoutUntil) {
            throw new Error("Sai mật khẩu quá nhiều lần. Tài khoản đã bị khóa 15 phút.");
          }
          return null;
        }

        // 🛡️ Đăng nhập thành công: Reset trạng thái và cập nhật thông tin truy cập
        const ip = (req as any)?.headers?.["x-forwarded-for"] || "127.0.0.1";
        
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            failedAttempts: 0, 
            lockoutUntil: null,
            lastLogin: new Date(),
            lastIp: ip
          }
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
      } else if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, isApproved: true }
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.isApproved = dbUser.isApproved;
        }
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
    maxAge: 24 * 60 * 60, // 24 giờ
    updateAge: 2 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
