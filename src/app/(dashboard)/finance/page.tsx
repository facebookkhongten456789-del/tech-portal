import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import AddTransactionModal from "@/components/AddTransactionModal";

async function addTransaction(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") return;

  const type = formData.get("type") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;

  if (!type || isNaN(amount) || !category) return;

  try {
    await prisma.transaction.create({
      data: { type, amount, category, description }
    });
    revalidatePath("/finance");
  } catch (err) {
    console.error("[add_transaction_error]", err);
  }
}

export default async function FinancePage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") redirect("/dashboard");

  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
    take: 15
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
          <button className="btn btn-secondary btn-sm">📅 Báo cáo</button>
          <AddTransactionModal addAction={addTransaction} />
        </div>
      </header>

      <div className="page-body animate-in">
        {/* Financial Overview Cards */}
        <div className="stat-grid" style={{ marginBottom: "32px" }}>
          <div className="stat-card" style={{ borderLeft: "4px solid var(--accent)" }}>
            <div className="stat-icon" style={{ background: "rgba(59, 130, 246, 0.1)", color: "var(--accent)" }}>💵</div>
            <div className="stat-label">Số dư hiện tại</div>
            <div className="stat-value">{balance.toLocaleString("vi-VN")} <span style={{ fontSize: "14px" }}>đ</span></div>
            <div className="stat-sub text-green">Cập nhật lúc: {new Date().toLocaleTimeString("vi-VN")}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: "4px solid var(--green)" }}>
            <div className="stat-icon" style={{ background: "rgba(34, 197, 94, 0.1)", color: "var(--green)" }}>📈</div>
            <div className="stat-label">Tổng thu nhập</div>
            <div className="stat-value" style={{ color: "var(--green)" }}>{ (totalIncome._sum.amount || 0).toLocaleString("vi-VN") }</div>
            <div className="stat-sub">Tổng cộng từ trước đến nay</div>
          </div>
          <div className="stat-card" style={{ borderLeft: "4px solid var(--red)" }}>
            <div className="stat-icon" style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--red)" }}>📉</div>
            <div className="stat-label">Tổng chi tiêu</div>
            <div className="stat-value" style={{ color: "var(--red)" }}>{ (totalExpense._sum.amount || 0).toLocaleString("vi-VN") }</div>
            <div className="stat-sub">Tổng cộng từ trước đến nay</div>
          </div>
        </div>

        <div className="product-form-grid" style={{ gridTemplateColumns: "1fr 350px" }}>
          {/* Recent Transactions List */}
          <div className="page-section">
            <div className="section-header">
              <div className="section-title">📊 Nhật ký giao dịch</div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Nội dung</th>
                    <th>Phân loại</th>
                    <th>Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="table-empty">Chưa có dữ liệu giao dịch nào.</td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="text-sm">{new Date(t.date).toLocaleDateString("vi-VN")}</td>
                        <td><div style={{ fontWeight: 600 }}>{t.description}</div></td>
                        <td><span className="badge badge-gray">{t.category}</span></td>
                        <td style={{ fontWeight: 700, color: t.type === "INCOME" ? "var(--green)" : "var(--red)" }}>
                          {t.type === "INCOME" ? "+" : "-"}{t.amount.toLocaleString("vi-VN")} đ
                        </td>
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
              <div className="card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "8px" }}>
                      <span>Dự án kỹ thuật</span>
                      <span>{balance > 0 ? "Ổn định" : "Cần lưu ý"}</span>
                    </div>
                    <div style={{ height: "8px", background: "var(--bg-elevated)", borderRadius: "99px" }}>
                      <div style={{ width: "100%", height: "100%", background: "var(--accent)", borderRadius: "99px" }}></div>
                    </div>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--fg-secondary)", lineHeight: "1.8" }}>
                    👉 Mọi giao dịch được ghi lại đều sẽ cập nhật trực tiếp vào số dư khả dụng của doanh nghiệp.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
