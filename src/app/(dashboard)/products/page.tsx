import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

/* ─── Server Actions (bảo mật: verify session trong mỗi action) ─── */

async function updateQuantity(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") return;

  const id  = formData.get("id") as string;
  const qty = Math.max(0, parseInt(formData.get("quantity") as string) || 0);
  if (!id) return;

  await prisma.product.update({ 
    where: { id }, 
    data: { quantity: qty, isOutOfStock: qty === 0 } // Tự động gỡ OutOfStock nếu qty > 0
  });
  revalidatePath("/products");
}

async function toggleOutOfStock(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") return;

  const id = formData.get("id") as string;
  const current = formData.get("current") === "true";
  if (!id) return;

  await prisma.product.update({ 
    where: { id }, 
    data: { isOutOfStock: !current } 
  });
  revalidatePath("/products");
}

async function deleteProduct(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Không có quyền");
  }
  const id = formData.get("id") as string;
  if (!id) return;

  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) return;

  await prisma.product.delete({ where: { id } });
  revalidatePath("/products");
}

/* ─── Page ─── */
export default async function ProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = session.user?.role === "ADMIN";

  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  const totalQty   = products.reduce((s, p) => s + p.quantity, 0);
  const lowStock   = products.filter((p) => p.quantity < 5).length;
  const outOfStockCount = products.filter((p) => p.isOutOfStock || p.quantity === 0).length;

  return (
    <>
      {/* Header */}
      <header className="page-header">
        <div className="page-header-left">
          <div className="page-title">Kho sản phẩm</div>
          <div className="breadcrumb">
            <span>TechPortal</span><span>›</span>
            <span style={{ color: "var(--fg-secondary)" }}>Quản lý Kho</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {isAdmin && (
            <Link href="/products/new" className="btn btn-primary">
              ＋ Thêm sản phẩm
            </Link>
          )}
          {isAdmin && (
            <span className="badge badge-blue">🛡️ Quyền Admin</span>
          )}
        </div>
      </header>

      <div className="page-body animate-in">
        {/* Role notice */}
        {!isAdmin && (
          <div className="alert alert-info" style={{ marginBottom: "20px" }}>
            🔧 Vai trò Kỹ thuật viên: Bạn có thể xem kho và theo dõi tình trạng sản phẩm.
          </div>
        )}

        {/* Stat strip */}
        <div className="page-section">
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
            <div className="stat-card blue">
              <div className="stat-icon blue">📦</div>
              <div className="stat-label">Tổng mặt hàng</div>
              <div className="stat-value">{products.length}</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon green">🔢</div>
              <div className="stat-label">Tổng tồn kho</div>
              <div className="stat-value">{totalQty}</div>
            </div>
            <div className="stat-card yellow">
              <div className="stat-icon yellow">⚠️</div>
              <div className="stat-label">Sắp hết hàng</div>
              <div className="stat-value" style={{ color: lowStock > 0 ? "var(--yellow)" : "inherit" }}>
                {lowStock}
              </div>
            </div>
            <div className="stat-card red">
              <div className="stat-icon red">🚫</div>
              <div className="stat-label">Hết hàng</div>
              <div className="stat-value" style={{ color: outOfStockCount > 0 ? "var(--red)" : "inherit" }}>
                {outOfStockCount}
              </div>
            </div>
          </div>
        </div>

        <div className="page-section">
          <div className="section-header">
            <div className="section-title">Danh sách sản phẩm đang quản lý</div>
            <span className="text-sm text-muted">{products.length} mặt hàng</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Ảnh mẫu</th>
                  <th>Mã SKU</th>
                  <th>Tên sản phẩm</th>
                  <th>Số lượng tồn</th>
                  <th>Đơn giá</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty">
                      <div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div>
                      Kho trống — chưa có sản phẩm nào
                    </td>
                  </tr>
                ) : products.map((p) => (
                  <tr key={p.id} style={{ opacity: p.isOutOfStock ? 0.6 : 1 }}>
                    <td>
                      <div style={{ width: "40px", height: "40px", borderRadius: "4px", overflow: "hidden", background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                        {p.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={p.image} alt="thumb" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "var(--fg-muted)" }}>N/A</div>
                        )}
                      </div>
                    </td>
                    <td><span className="font-mono text-sm badge badge-gray">{p.sku}</span></td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div className="text-xs text-muted" style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.description}</div>
                    </td>
                    <td>
                      {isAdmin ? (
                        <form action={updateQuantity} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <input type="hidden" name="id" value={p.id} />
                          <input
                            type="number"
                            name="quantity"
                            defaultValue={p.quantity}
                            min={0}
                            className="form-input font-mono"
                            style={{ width: "75px", padding: "4px 8px", fontSize: "12px" }}
                          />
                          <button type="submit" className="btn btn-ghost btn-sm" title="Cập nhật số lượng">💾</button>
                        </form>
                      ) : (
                        <span className={`badge ${p.isOutOfStock || p.quantity === 0 ? "badge-red" : p.quantity < 5 ? "badge-yellow" : "badge-green"}`}>
                          {p.quantity}
                        </span>
                      )}
                    </td>
                    <td className="font-mono text-sm">
                      {p.price.toLocaleString("vi-VN")}₫
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <Link href={`/products/${p.id}`} className="btn btn-ghost btn-sm">Xem</Link>
                        {isAdmin && (
                          <>
                            <form action={toggleOutOfStock}>
                              <input type="hidden" name="id" value={p.id} />
                              <input type="hidden" name="current" value={String(p.isOutOfStock)} />
                              <button type="submit" className={`btn btn-sm ${p.isOutOfStock ? "btn-secondary" : "btn-danger"}`}>
                                {p.isOutOfStock ? "Bỏ hết hàng" : "Hết hàng"}
                              </button>
                            </form>
                            <form action={deleteProduct}>
                              <input type="hidden" name="id" value={p.id} />
                              <button type="submit" className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }}>Xóa</button>
                            </form>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
