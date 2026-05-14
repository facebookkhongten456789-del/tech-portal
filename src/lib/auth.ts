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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;
        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isPasswordValid) return null;
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
        // Cập nhật trạng thái mới nhất từ DB để không cần logout/login lại
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
    maxAge: 24 * 60 * 60, // 24 giờ (giới hạn truy cập)
    updateAge: 2 * 60 * 60, // Cập nhật session mỗi 2 giờ nếu có hoạt động
  },
  secret: process.env.NEXTAUTH_SECRET,
};
