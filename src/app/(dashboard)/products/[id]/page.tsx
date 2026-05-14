import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

type Params = Promise<{ id: string }>;

export default async function ProductDetailsPage({ params }: { params: Params }) {
  const { id } = await params;
  
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const product = await prisma.product.findUnique({
    where: { id: id },
  });

  if (!product) notFound();

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div className="page-title">{product.name}</div>
          <div className="breadcrumb">
            <span>TechPortal</span><span>›</span>
            <Link href="/products">Sản phẩm</Link><span>›</span>
            <span style={{ color: "var(--fg-secondary)" }}>Chi tiết</span>
          </div>
        </div>
        <Link href="/products" className="btn btn-secondary btn-sm">
          ← Quay lại danh sách
        </Link>
      </header>

      <div className="page-body animate-in">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "24px", alignItems: "start" }}>
          {/* Main Info */}
          <div className="card" style={{ padding: "32px" }}>
            <div style={{ display: "flex", gap: "24px", marginBottom: "32px" }}>
              <div style={{ width: "180px", height: "180px", borderRadius: "12px", overflow: "hidden", background: "var(--bg-elevated)", border: "1px solid var(--border)", flexShrink: 0 }}>
                {product.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>📦</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>{product.name}</h1>
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  <span className="badge badge-gray font-mono">SKU: {product.sku}</span>
                  <span className={`badge ${product.isOutOfStock ? "badge-red" : "badge-green"}`}>
                    {product.isOutOfStock ? "Tạm hết hàng" : "Đang kinh doanh"}
                  </span>
                </div>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--accent)" }}>
                  {product.price.toLocaleString("vi-VN")}₫
                </div>
              </div>
            </div>

            <div className="divider" />

            <div className="section-title" style={{ marginBottom: "12px" }}>Mô tả sản phẩm / Thông tin chi tiết</div>
            <div style={{ color: "var(--fg-secondary)", lineHeight: "1.8", whiteSpace: "pre-wrap", fontSize: "14px" }}>
              {product.description || "Chưa có mô tả chi tiết cho sản phẩm này."}
            </div>
          </div>

          {/* Sidebar Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="card" style={{ padding: "20px" }}>
              <div className="section-title" style={{ marginBottom: "16px" }}>Trạng thái kho</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="text-muted">Số lượng hiện tại:</span>
                  <span style={{ fontWeight: 700, color: product.quantity < 5 ? "var(--red)" : "var(--green)" }}>{product.quantity}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="text-muted">Cập nhật lần cuối:</span>
                  <span className="text-xs">{new Date(product.updatedAt).toLocaleString("vi-VN")}</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "20px", background: "var(--bg-base)" }}>
              <div style={{ fontSize: "12px", color: "var(--fg-muted)", textAlign: "center" }}>
                Dữ liệu được quản lý bởi hệ thống TechPortal
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
