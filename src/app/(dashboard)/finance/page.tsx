import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function FinancePage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") redirect("/dashboard");

  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
    take: 10
  });

  const totalIncome = await prisma.transaction.aggregate({
    where: { type: "INCOME" },
    _sum: { amount: true }
  });

  const totalExpense = await prisma.transaction.aggregate({
    where: { type: "EXPENSE" },
    _sum: { amount: true }
  });

  const balance = (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0);

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div className="page-title">Quản trị Tài chính</div>
          <div className="breadcrumb">
            <span>TechPortal</span><span>›</span>
            <span style={{ color: "var(--fg-secondary)" }}>Dòng tiền & Lợi nhuận</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-secondary btn-sm">📅 Báo cáo tháng</button>
          <button className="btn btn-primary btn-sm">➕ Thêm giao dịch</button>
        </div>
      </header>

      <div className="page-body animate-in">
        {/* Financial Overview Cards */}
        <div className="stat-grid" style={{ marginBottom: "32px" }}>
          <div className="stat-card" style={{ borderLeft: "4px solid var(--accent)" }}>
            <div className="stat-icon" style={{ background: "rgba(59, 130, 246, 0.1)", color: "var(--accent)" }}>💵</div>
            <div className="stat-label">Số dư hiện tại</div>
            <div className="stat-value">{balance.toLocaleString("vi-VN")} <span style={{ fontSize: "14px" }}>đ</span></div>
            <div className="stat-sub text-green">▲ 12% so với tháng trước</div>
          </div>
          <div className="stat-card" style={{ borderLeft: "4px solid var(--green)" }}>
            <div className="stat-icon" style={{ background: "rgba(34, 197, 94, 0.1)", color: "var(--green)" }}>📈</div>
            <div className="stat-label">Tổng thu nhập</div>
            <div className="stat-value" style={{ color: "var(--green)" }}>{ (totalIncome._sum.amount || 0).toLocaleString("vi-VN") }</div>
            <div className="stat-sub">Tháng 05/2026</div>
          </div>
          <div className="stat-card" style={{ borderLeft: "4px solid var(--red)" }}>
            <div className="stat-icon" style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--red)" }}>📉</div>
            <div className="stat-label">Tổng chi tiêu</div>
            <div className="stat-value" style={{ color: "var(--red)" }}>{ (totalExpense._sum.amount || 0).toLocaleString("vi-VN") }</div>
            <div className="stat-sub">Tháng 05/2026</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "28px" }}>
          {/* Recent Transactions List */}
          <div className="page-section">
            <div className="section-header">
              <div className="section-title">📊 Nhật ký giao dịch gần đây</div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Mục chi/thu</th>
                    <th>Phân loại</th>
                    <th>Số tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="table-empty">Chưa có dữ liệu giao dịch nào.</td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="text-sm">{new Date(t.date).toLocaleDateString("vi-VN")}</td>
                        <td><div style={{ fontWeight: 600 }}>{t.description || "Giao dịch không tên"}</div></td>
                        <td><span className="badge badge-gray">{t.category}</span></td>
                        <td style={{ fontWeight: 700, color: t.type === "INCOME" ? "var(--green)" : "var(--red)" }}>
                          {t.type === "INCOME" ? "+" : "-"}{t.amount.toLocaleString("vi-VN")} đ
                        </td>
                        <td><span className="badge badge-green">Thành công</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Stats Sidebar */}
          <div>
            <div className="page-section">
              <div className="section-header">
                <div className="section-title">🏢 Phân bổ ngân sách</div>
              </div>
              <div className="card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                      <span>Dự án kỹ thuật</span>
                      <span>65%</span>
                    </div>
                    <div style={{ height: "6px", background: "var(--bg-elevated)", borderRadius: "99px" }}>
                      <div style={{ width: "65%", height: "100%", background: "var(--accent)", borderRadius: "99px" }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                      <span>Lương nhân sự</span>
                      <span>20%</span>
                    </div>
                    <div style={{ height: "6px", background: "var(--bg-elevated)", borderRadius: "99px" }}>
                      <div style={{ width: "20%", height: "100%", background: "var(--purple)", borderRadius: "99px" }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                      <span>Vật tư & Linh kiện</span>
                      <span>15%</span>
                    </div>
                    <div style={{ height: "6px", background: "var(--bg-elevated)", borderRadius: "99px" }}>
                      <div style={{ width: "15%", height: "100%", background: "var(--yellow)", borderRadius: "99px" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "20px", marginTop: "24px", background: "var(--accent-subtle)", border: "1px solid var(--border-accent)" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>💡 Lời khuyên tài chính</div>
              <p style={{ fontSize: "12px", color: "var(--fg-secondary)", lineHeight: "1.6" }}>
                Bạn nên duy trì số dư tối thiểu gấp 2 lần chi phí vận hành hàng tháng để đảm bảo an toàn tín dụng cho các dự án lớn.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
