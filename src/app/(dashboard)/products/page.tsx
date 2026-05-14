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
export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { category } = await searchParams;
  const isApproved = (session.user as any).isApproved === true;
  const isAdmin = session.user?.role === "ADMIN" && isApproved;

  // Filter logic
  const where = category ? { category } : {};
  const products = await prisma.product.findMany({ 
    where,
    orderBy: { createdAt: "desc" } 
  });

  const totalQty   = products.reduce((s, p) => (p.isOutOfStock || p.stock === 0) ? s : s + p.stock, 0);
  const lowStock   = products.filter((p) => !p.isOutOfStock && p.stock > 0 && p.stock < 5).length;
  const outOfStockCount = products.filter((p) => p.isOutOfStock || p.stock === 0).length;

  const categories = [
    { label: "Tất cả", value: "" },
    { label: "📱 Điện thoại", value: "Điện thoại" },
    { label: "🔌 Linh kiện điện thoại", value: "Linh kiện điện thoại" },
    { label: "🛡️ Thiết bị an ninh", value: "Thiết bị an ninh" },
    { label: "🌐 Phụ kiện mạng", value: "Phụ kiện mạng" },
    { label: "💻 Linh kiện", value: "Linh kiện máy tính" },
  ];

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div className="page-title">Kho sản phẩm {category ? `› ${category}` : ""}</div>
          <div className="breadcrumb">
            <span>TechPortal</span><span>›</span>
            <span>Quản lý Kho</span>
            {category && (
              <><span>›</span><span style={{ color: "var(--accent)" }}>{category}</span></>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {isAdmin && (
            <Link href="/products/new" className="btn btn-primary">
              ＋ Thêm sản phẩm
            </Link>
          )}
        </div>
      </header>

      <div className="page-body animate-in">
        {/* Category Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", overflowX: "auto", paddingBottom: "8px" }}>
          {categories.map((cat) => {
            const active = (category || "") === (cat.value || "");
            return (
              <Link 
                key={cat.label}
                href={cat.value ? `/products?category=${encodeURIComponent(cat.value)}` : "/products"}
                className={`btn ${active ? "btn-primary" : "btn-secondary"}`}
                style={{ borderRadius: "99px", fontSize: "12px", padding: "6px 16px" }}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>

        <div className="page-section">
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
            <div className="stat-card blue">
              <div className="stat-icon blue">📦</div>
              <div className="stat-label">Loại mặt hàng</div>
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
                  <th>Danh mục</th>
                  <th>Mã SKU</th>
                  <th>Tên sản phẩm</th>
                  <th>Số lượng</th>
                  <th>Đơn giá</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={7} className="table-empty">Không tìm thấy sản phẩm nào trong danh mục này.</td></tr>
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
                    <td>
                      <span className="chip" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>
                        {p.category || "Chưa phân loại"}
                      </span>
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
                            <button type="submit" className="btn btn-ghost btn-sm text-red" title="Xóa">🗑️</button>
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
