import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = session.user?.role === "ADMIN";

  const [usersCount, productsCount, articlesCount, lowStockCount, draftCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.article.count({ where: { published: true } }),
      prisma.product.count({ where: { quantity: { lt: 5 } } }),
      prisma.article.count({ where: { published: false } }),
    ]);

  const recentProducts = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { id: true, name: true, sku: true, quantity: true, updatedAt: true },
  });

  const recentArticles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      published: true,
      createdAt: true,
      author: { select: { name: true } },
    },
  });

  return (
    <>
      {/* Header */}
      <header className="page-header">
        <div className="page-header-left">
          <div className="page-title">Dashboard</div>
          <div className="breadcrumb">
            <span>TechPortal</span>
            <span>›</span>
            <span style={{ color: "var(--fg-secondary)" }}>Tổng quan</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="status-dot online pulse" />
          <span className="text-sm text-muted">Hệ thống hoạt động bình thường</span>
        </div>
      </header>

      <div className="page-body animate-in">
        {/* Role Banner */}
        <div className={`role-banner ${isAdmin ? "admin" : "tech"}`}>
          <div className="role-banner-icon">{isAdmin ? "🛡️" : "🔧"}</div>
          <div>
            <div className="role-banner-title">
              Xin chào, {session.user?.name || session.user?.email}!
            </div>
            <div className="role-banner-desc">
              {isAdmin
                ? "Bạn đang đăng nhập với vai trò Quản trị viên — có toàn quyền quản lý hệ thống."
                : "Bạn đang đăng nhập với vai trò Kỹ thuật viên — có thể xem và cập nhật dữ liệu kho."}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="page-section">
          <div className="section-header">
            <div className="section-title">Số liệu hệ thống</div>
          </div>
          <div className="stat-grid">
            <div className="stat-card blue">
              <div className="stat-icon blue">👥</div>
              <div className="stat-label">Thành viên</div>
              <div className="stat-value">{usersCount}</div>
              <div className="stat-sub">Tài khoản đang hoạt động</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon green">📦</div>
              <div className="stat-label">Sản phẩm trong kho</div>
              <div className="stat-value">{productsCount}</div>
              <div className="stat-sub">Mặt hàng đang quản lý</div>
            </div>
            {lowStockCount > 0 && (
              <div className="stat-card red">
                <div className="stat-icon red">⚠️</div>
                <div className="stat-label">Cần nhập thêm hàng</div>
                <div className="stat-value" style={{ color: "var(--red)" }}>
                  {lowStockCount}
                </div>
                <div className="stat-sub">Sản phẩm dưới 5 đơn vị</div>
              </div>
            )}
            <div className="stat-card yellow">
              <div className="stat-icon yellow">📝</div>
              <div className="stat-label">Bài viết đã đăng</div>
              <div className="stat-value">{articlesCount}</div>
              <div className="stat-sub">{draftCount} bài đang là nháp</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="page-section">
          <div className="section-header">
            <div className="section-title">Truy cập nhanh hệ thống</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "16px" }}>
            {/* Products Group */}
            <div className="card" style={{ padding: "16px", background: "var(--bg-base)" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--fg-muted)", marginBottom: "12px", textTransform: "uppercase" }}>📦 Kho sản phẩm</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Link href="/products" className="btn btn-secondary btn-full" style={{ justifyContent: "flex-start" }}>🔍 Xem danh sách kho</Link>
                {isAdmin && <Link href="/products/new" className="btn btn-primary btn-full" style={{ justifyContent: "flex-start" }}>➕ Thêm sản phẩm mới</Link>}
              </div>
            </div>

            {/* Articles Group */}
            <div className="card" style={{ padding: "16px", background: "var(--bg-base)" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--fg-muted)", marginBottom: "12px", textTransform: "uppercase" }}>📰 Bài viết kỹ thuật</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Link href="/articles" className="btn btn-secondary btn-full" style={{ justifyContent: "flex-start" }}>📑 Tất cả bài viết</Link>
                <Link href="/articles/new" className="btn btn-primary btn-full" style={{ justifyContent: "flex-start" }}>✍️ Đăng bài viết mới</Link>
              </div>
            </div>

            {/* Admin Group */}
            {isAdmin && (
              <div className="card" style={{ padding: "16px", background: "var(--bg-base)" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--fg-muted)", marginBottom: "12px", textTransform: "uppercase" }}>🛡️ Quản trị hệ thống</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link href="/members" className="btn btn-secondary btn-full" style={{ justifyContent: "flex-start" }}>👥 Quản lý thành viên</Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* Recent Products */}
          <div className="page-section">
            <div className="section-header">
              <div className="section-title">Sản phẩm cập nhật gần đây</div>
              <Link href="/products" className="btn btn-ghost btn-sm">Xem tất cả →</Link>
            </div>
            <div className="card">
              <table style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Tên sản phẩm</th>
                    <th>Số lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProducts.length === 0 ? (
                    <tr><td colSpan={2} className="table-empty">Chưa có dữ liệu</td></tr>
                  ) : recentProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{p.name}</div>
                        <div className="text-xs text-muted font-mono">{p.sku}</div>
                      </td>
                      <td>
                        <span className={`badge ${p.quantity < 5 ? "badge-red" : "badge-green"}`}>
                          {p.quantity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Articles */}
          <div className="page-section">
            <div className="section-header">
              <div className="section-title">Bài viết mới nhất</div>
              <Link href="/articles" className="btn btn-ghost btn-sm">Xem tất cả →</Link>
            </div>
            <div className="card">
              <table style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentArticles.length === 0 ? (
                    <tr><td colSpan={2} className="table-empty">Chưa có bài viết</td></tr>
                  ) : recentArticles.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{a.title}</div>
                        <div className="text-xs text-muted">{a.author.name}</div>
                      </td>
                      <td>
                        <span className={`badge ${a.published ? "badge-green" : "badge-gray"}`}>
                          {a.published ? "Đã đăng" : "Nháp"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
