import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

async function addProduct(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN" || !(session.user as any).isApproved) {
    redirect("/dashboard");
  }

  const name = formData.get("name") as string;
  const sku = formData.get("sku") as string;
  const price = parseFloat(formData.get("price") as string) || 0;
  const stock = parseInt(formData.get("stock") as string) || 0;
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;

  if (!name || !sku) return;

  try {
    await prisma.product.create({
      data: { name, sku, price, stock, category, description },
    });
    revalidatePath("/products");
  } catch (err) {
    console.error("[add_product_error]", err);
  }
  redirect("/products");
}

export default async function NewProductPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isApproved = (session.user as any).isApproved === true;
  const isAdmin = session.user?.role === "ADMIN" && isApproved;

  if (!isAdmin) redirect("/products");

  return (
    <>
      <header className="page-header" style={{ background: "transparent", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="page-header-left">
          <div className="page-title" style={{ fontSize: "18px", letterSpacing: "0.02em" }}>Nhập kho sản phẩm mới</div>
          <div className="breadcrumb">
            <span>TechPortal</span><span>›</span>
            <span>Kho hàng</span><span>›</span>
            <span style={{ color: "var(--accent)" }}>Thêm mới</span>
          </div>
        </div>
      </header>

      <div className="page-body animate-in" style={{ maxWidth: "1000px", margin: "0 auto", position: "relative" }}>
        
        {/* Decorative Grid Background for Form Area */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, height: "400px",
          backgroundImage: "linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          zIndex: -1,
          maskImage: "linear-gradient(to bottom, black, transparent)",
          pointerEvents: "none"
        }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "32px", alignItems: "start" }}>
          
          {/* Main Form Card */}
          <div className="card" style={{ padding: "32px", background: "rgba(10, 10, 10, 0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{ fontSize: "24px" }}>📦</span>
                <h2 style={{ fontSize: "20px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Thông tin chi tiết</h2>
              </div>
              <p style={{ color: "var(--fg-muted)", fontSize: "13px" }}>Vui lòng điền đầy đủ các thông tin kỹ thuật của sản phẩm để lưu trữ vào hệ thống.</p>
            </div>

            <form action={addProduct} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div className="form-group">
                  <label className="form-label">Tên sản phẩm <span className="required">*</span></label>
                  <input name="name" className="form-input" placeholder="Ví dụ: Camera IP Hikvision 2MP" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Mã SKU <span className="required">*</span></label>
                  <input name="sku" className="form-input" placeholder="Ví dụ: HKV-2MP-001" required />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div className="form-group">
                  <label className="form-label">Giá nhập (VNĐ)</label>
                  <input name="price" type="number" className="form-input" placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Số lượng nhập</label>
                  <input name="stock" type="number" className="form-input" placeholder="0" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Danh mục sản phẩm</label>
                <select name="category" className="form-input" style={{ appearance: "none" }}>
                  <option value="Thiết bị an ninh">Thiết bị an ninh</option>
                  <option value="Phụ kiện mạng">Phụ kiện mạng</option>
                  <option value="Linh kiện máy tính">Linh kiện máy tính</option>
                  <option value="Dụng cụ kỹ thuật">Dụng cụ kỹ thuật</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả chi tiết</label>
                <textarea 
                  name="description" 
                  className="form-input" 
                  rows={5} 
                  placeholder="Thông tin thêm về cấu hình, bảo hành..."
                  style={{ resize: "none" }}
                />
              </div>

              <div style={{ marginTop: "12px", display: "flex", gap: "12px" }}>
                <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1, height: "48px", fontSize: "15px", fontWeight: 700 }}>
                  ⚡ Xác nhận nhập kho
                </button>
                <Link href="/products" className="btn btn-secondary btn-lg" style={{ height: "48px" }}>
                  Hủy bỏ
                </Link>
              </div>
            </form>
          </div>

          {/* Sidebar / Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="card" style={{ padding: "24px", background: "rgba(59, 130, 246, 0.05)", borderColor: "rgba(59, 130, 246, 0.2)" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", color: "var(--accent)" }}>🛡️ Hướng dẫn</h3>
              <ul style={{ paddingLeft: "18px", color: "var(--fg-secondary)", fontSize: "12px", lineHeight: "1.8" }}>
                <li>Mã SKU là duy nhất cho mỗi sản phẩm.</li>
                <li>Giá nhập nên được kiểm tra kỹ với hóa đơn.</li>
                <li>Sản phẩm sau khi thêm sẽ hiển thị ngay lập tức trong kho.</li>
              </ul>
            </div>

            <div className="card" style={{ padding: "24px", textAlign: "center", borderStyle: "dashed" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>📸</div>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Ảnh minh họa</div>
              <div style={{ fontSize: "11px", color: "var(--fg-muted)" }}>Tính năng tải ảnh đang được cập nhật...</div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
