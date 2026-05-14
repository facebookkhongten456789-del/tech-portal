import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Lấy toàn bộ dữ liệu từ các bảng chính
    const [users, products, articles] = await Promise.all([
      prisma.user.findMany(),
      prisma.product.findMany(),
      prisma.article.findMany(),
    ]);

    const backupData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      counts: {
        users: users.length,
        products: products.length,
        articles: articles.length,
      },
      data: {
        users,
        products,
        articles,
      }
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="techportal_backup_${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("[backup_api_error]", error);
    return NextResponse.json({ error: "Lỗi khi tạo bản sao lưu" }, { status: 500 });
  }
}
