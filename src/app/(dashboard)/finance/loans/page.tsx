import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoansPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") redirect("/dashboard");

  const loans = await prisma.loan.findMany({
    orderBy: { createdAt: "desc" }
  });

  const totalDebt = await prisma.loan.aggregate({
    where: { status: "ACTIVE" },
    _sum: { amount: true }
  });

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div className="page-title">Khoản vay & Tín dụng</div>
          <div className="breadcrumb">
            <span>TechPortal</span><span>›</span>
            <span>Tài chính</span><span>›</span>
            <span style={{ color: "var(--fg-secondary)" }}>Nợ phải trả</span>
          </div>
        </div>
        <button className="btn btn-primary btn-sm">➕ Đăng ký khoản vay mới</button>
      </header>

      <div className="page-body animate-in">
        {/* Debt Overview */}
        <div className="page-section">
          <div className="card" style={{ 
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(168, 85, 247, 0.1))",
            padding: "32px",
            border: "1px solid rgba(239, 68, 68, 0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--fg-secondary)", marginBottom: "8px" }}>TỔNG DƯ NỢ HIỆN TẠI</div>
                <div style={{ fontSize: "36px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--red)" }}>
                  { (totalDebt._sum.amount || 0).toLocaleString("vi-VN") } <span style={{ fontSize: "18px" }}>VNĐ</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", color: "var(--fg-muted)" }}>Hạn mức tín dụng an toàn</div>
                <div style={{ fontSize: "18px", fontWeight: 700 }}>500,000,000 đ</div>
              </div>
            </div>
          </div>
        </div>

        {/* Loans Table */}
        <div className="page-section">
          <div className="section-header">
            <div className="section-title">📝 Danh sách các khoản tín dụng</div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Chủ nợ / Ngân hàng</th>
                  <th>Số tiền gốc</th>
                  <th>Lãi suất</th>
                  <th>Kỳ hạn</th>
                  <th>Ngày vay</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-empty">Hệ thống hiện không có khoản vay nào.</td>
                  </tr>
                ) : (
                  loans.map((loan) => (
                    <tr key={loan.id}>
                      <td><div style={{ fontWeight: 600 }}>{loan.lender}</div></td>
                      <td style={{ fontWeight: 700 }}>{loan.amount.toLocaleString("vi-VN")} đ</td>
                      <td><span className="badge badge-yellow">{loan.interest}%/năm</span></td>
                      <td>{loan.term} tháng</td>
                      <td className="text-sm">{new Date(loan.startDate).toLocaleDateString("vi-VN")}</td>
                      <td>
                        <span className={loan.status === "ACTIVE" ? "badge badge-red" : "badge badge-green"}>
                          {loan.status === "ACTIVE" ? "Đang nợ" : "Đã tất toán"}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm">Chi tiết</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Note Section */}
        <div className="alert alert-info" style={{ marginTop: "24px" }}>
          💡 <strong>Lưu ý:</strong> Mọi khoản vay cần có sự phê duyệt của Hội đồng quản trị trước khi cập nhật vào hệ thống TechPortal.
        </div>
      </div>
    </>
  );
}
