import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

/* ─── Server Actions ─── */

async function updateQuantity(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN" || !(session.user as any).isApproved) return;

  const id  = formData.get("id") as string;
  const qty = Math.max(0, parseInt(formData.get("stock") as string) || 0);
  if (!id) return;

  await prisma.product.update({ 
    where: { id }, 
    data: { stock: qty, isOutOfStock: qty === 0 }
  });
  revalidatePath("/products");
}

async function toggleOutOfStock(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN" || !(session.user as any).isApproved) return;

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
  if (!session || session.user?.role !== "ADMIN" || !(session.user as any).isApproved) return;
  
  const id = formData.get("id") as string;
  if (!id) return;

  await prisma.product.delete({ where: { id } });
  revalidatePath("/products");
}

/* ─── Page ─── */
export default async function ProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isApproved = (session.user as any).isApproved === true;
  const isAdmin = session.user?.role === "ADMIN" && isApproved;

  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  const totalQty   = products.reduce((s, p) => s + p.stock, 0);
  const lowStock   = products.filter((p) => p.stock < 5).length;
  const outOfStockCount = products.filter((p) => p.isOutOfStock || p.stock === 0).length;

  return (
    <>
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
        {!isApproved && (
          <div className="alert alert-warning" style={{ marginBottom: "20px" }}>
            ⚠️ Chế độ xem: Tài khoản của bạn chưa được phê duyệt. Bạn có thể xem kho hàng nhưng không thể thay đổi dữ liệu.
          </div>
        )}

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
              <div className="stat-value">{lowStock}</div>
            </div>
            <div className="stat-card red">
              <div className="stat-icon red">🚫</div>
              <div className="stat-label">Hết hàng</div>
              <div className="stat-value">{outOfStockCount}</div>
            </div>
          </div>
        </div>

        <div className="page-section">
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
                  <tr><td colSpan={6} className="table-empty">Kho trống</td></tr>
                ) : products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="avatar" style={{ borderRadius: "4px", width: "40px", height: "40px" }}>
                        {p.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={p.image} alt="thumb" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : "📦"}
                      </div>
                    </td>
                    <td><span className="badge badge-gray font-mono">{p.sku}</span></td>
                    <td>{p.name}</td>
                    <td>
                      {isAdmin ? (
                        <form action={updateQuantity} style={{ display: "flex", gap: "6px" }}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="number" name="stock" defaultValue={p.stock} min={0} className="form-input" style={{ width: "70px" }} />
                          <button type="submit" className="btn btn-ghost btn-sm">💾</button>
                        </form>
                      ) : (
                        <span className={`badge ${p.stock < 5 ? "badge-yellow" : "badge-green"}`}>{p.stock}</span>
                      )}
                    </td>
                    <td className="font-mono">{p.price.toLocaleString()}₫</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <Link href={`/products/${p.id}`} className="btn btn-ghost btn-sm">Xem</Link>
                        {isAdmin && (
                          <form action={toggleOutOfStock}>
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="current" value={String(p.isOutOfStock)} />
                            <button type="submit" className={`btn btn-ghost btn-sm ${p.isOutOfStock ? "text-green" : "text-yellow"}`} title={p.isOutOfStock ? "Đánh dấu còn hàng" : "Đánh dấu hết hàng"}>
                              {p.isOutOfStock ? "✅" : "🚫"}
                            </button>
                          </form>
                        )}
                        {isAdmin && (
                          <form action={deleteProduct}>
                            <input type="hidden" name="id" value={p.id} />
                            <button type="submit" className="btn btn-ghost btn-sm text-red" title="Xóa sản phẩm">🗑️</button>
                          </form>
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
