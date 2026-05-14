import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

function sanitizeString(val: unknown, maxLen: number): string {
  return String(val ?? "").trim().slice(0, maxLen);
}

interface ArticleBody {
  title?: string;
  content?: string;
  published?: boolean;
  images?: string[];
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ArticleBody = {};
  try { 
    body = await req.json(); 
  } catch { 
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); 
  }

  const title     = sanitizeString(body.title, 300);
  const content   = sanitizeString(body.content, 50000);
  const published = body.published === true;

  if (!title || !content) {
    return NextResponse.json({ error: "Thiếu tiêu đề hoặc nội dung" }, { status: 400 });
  }

  // Validate images array
  let articleImages: string[] = [];
  if (Array.isArray(body.images)) {
    articleImages = (body.images as unknown[])
      .map((u) => sanitizeString(u, 200))
      .filter((u) => u.startsWith("/uploads/articles/") || u.includes("cloudinary.com"))
      .slice(0, 10);
  }

  try {
    const article = await prisma.article.create({
      data: {
        title,
        content,
        images: JSON.stringify(articleImages),
        published: published,
        isApproved: false, // Default: needs Admin approval
        authorId: token.id as string,
      },
      select: { id: true, title: true, published: true, isApproved: true },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error: unknown) {
    console.error("[articles_post] error:", error);
    return NextResponse.json({ error: "Lưu bài viết thất bại" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, published: true,
      isApproved: true,
      createdAt: true,
      author: { select: { name: true } },
    },
  });

  return NextResponse.json(articles);
}
