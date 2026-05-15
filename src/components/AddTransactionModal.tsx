"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddTransactionModal({ addAction }: { addAction: (formData: FormData) => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await addAction(formData);
    setLoading(false);
    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={() => setIsOpen(true)}>
        ➕ Thêm giao dịch
      </button>

      {isOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div className="card animate-in" style={{ width: "100%", maxWidth: "500px", padding: "32px", background: "var(--bg-base)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800 }}>TẠO GIAO DỊCH MỚI</h2>
              <button onClick={() => setIsOpen(false)} style={{ fontSize: "20px", color: "var(--fg-muted)" }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">Loại giao dịch</label>
                <select name="type" className="form-input" required>
                  <option value="INCOME">🟢 Thu nhập (Cộng tiền)</option>
                  <option value="EXPENSE">🔴 Chi tiêu (Trừ tiền)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Số tiền (VNĐ)</label>
                <input name="amount" type="number" className="form-input" placeholder="0" required />
              </div>

              <div className="form-group">
                <label className="form-label">Phân loại</label>
                <select name="category" className="form-input" required>
                  <option value="Dự án">Dự án kỹ thuật</option>
                  <option value="Lương">Lương nhân sự</option>
                  <option value="Vật tư">Vật tư & Linh kiện</option>
                  <option value="Khác">Chi phí khác</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả nội dung</label>
                <textarea name="description" className="form-input" rows={3} placeholder="Ví dụ: Thanh toán dự án camera A..." required />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? "Đang lưu..." : "⚡ Xác nhận lưu"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsOpen(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
