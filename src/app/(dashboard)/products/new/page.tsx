import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import ProductImageUpload from "@/components/ProductImageUpload";

async function addProduct(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const name  = (formData.get("name") as string)?.trim();
  const sku   = (formData.get("sku")  as string)?.trim().toUpperCase();
  const desc  = (formData.get("description") as string)?.trim() || null;
  const image = (formData.get("image") as string) || null;
  const qty   = Math.max(0, parseInt(formData.get("quantity") as string) || 0);
  const price = Math.max(0, parseFloat(formData.get("price") as string) || 0);

  // Security: strict validation
  if (!name || name.length < 2 || name.length > 200) return;
  if (!sku || sku.length < 3 || sku.length > 50) return;

  const exists = await prisma.product.findUnique({ where: { sku } });
  if (exists) return;

  await prisma.product.create({ 
    data: { name, sku, description: desc, image, quantity: qty, price } 
  });
  
  revalidatePath("/products");
  redirect("/products");
}

export default async function NewProductPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") redirect("/dashboard");

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div className="page-title">Thêm sản phẩm mới</div>
          <div className="breadcrumb">
            <span>TechPortal</span><span>›</span>
            <a href="/products" style={{ color: "var(--fg-secondary)" }}>Kho sản phẩm</a>
            <span>›</span>
            <span style={{ color: "var(--fg-secondary)" }}>Thêm mới</span>
          </div>
        </div>
        <span className="badge badge-blue">🛡️ Chỉ dành cho Admin</span>
      </header>

      <div className="page-body animate-in">
        <div style={{ maxWidth: "800px" }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">📦 Nhập thông tin sản phẩm</span>
            </div>
            <div className="card-body">
              <form action={addProduct} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div className="form-group">
                    <label className="form-label">Tên sản phẩm <span className="required">*</span></label>
                    <input type="text" name="name" required minLength={2} maxLength={200} className="form-input" placeholder="Tên sản phẩm..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mã SKU <span className="required">*</span></label>
                    <input type="text" name="sku" required minLength={3} maxLength={50} className="form-input font-mono" placeholder="Mã SKU..." />
                  </div>
                </div>

                <ProductImageUpload />

                <div className="form-group">
                  <label className="form-label">Mô tả chi tiết</label>
                  <textarea name="description" rows={4} className="form-input" style={{ resize: "vertical" }} placeholder="Mô tả kỹ thuật, thông số..." />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div className="form-group">
                    <label className="form-label">Số lượng nhập kho</label>
                    <input type="number" name="quantity" defaultValue={0} min={0} className="form-input font-mono" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Đơn giá (VNĐ)</label>
                    <input type="number" name="price" defaultValue={0} min={0} step={1000} className="form-input font-mono" />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    ＋ Xác nhận thêm vào kho
                  </button>
                  <a href="/products" className="btn btn-secondary">Hủy bỏ</a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
