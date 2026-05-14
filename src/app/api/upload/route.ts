import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "articles");

export async function POST(req: NextRequest) {
  // 1. Auth check
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 2. Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Chỉ cho phép file ảnh: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    // 3. Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File quá lớn. Tối đa 5MB" },
        { status: 400 }
      );
    }

    // 4. Sanitize & generate safe filename
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const randomName = crypto.randomBytes(16).toString("hex");
    const filename = `${Date.now()}-${randomName}.${ext}`;

    // 5. Ensure upload dir exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // 6. Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

    return NextResponse.json({
      url: `/uploads/articles/${filename}`,
    });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json({ error: "Upload thất bại" }, { status: 500 });
  }
}
