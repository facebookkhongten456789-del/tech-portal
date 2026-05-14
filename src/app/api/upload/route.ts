import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { v2 as cloudinary } from "cloudinary";

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

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

    // 4. Chuyển đổi File sang Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 5. Upload lên Cloudinary bằng Promise wrapper cho upload_stream
    const uploadToCloudinary = () => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: "tech-portal/articles", // Tổ chức thư mục trên Cloudinary
            resource_type: "auto",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });
    };

    const result = (await uploadToCloudinary()) as any;

    // Trả về URL từ Cloudinary
    return NextResponse.json({
      url: result.secure_url,
    });

  } catch (err) {
    console.error("[upload_cloudinary] error:", err);
    return NextResponse.json({ error: "Upload lên đám mây thất bại" }, { status: 500 });
  }
}
