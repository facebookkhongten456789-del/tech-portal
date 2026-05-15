export default function PolicyPage() {
  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div className="page-title">Chính sách & Quy định Hệ thống</div>
          <div className="breadcrumb">
            <span>TechPortal</span><span>›</span>
            <span style={{ color: "var(--fg-secondary)" }}>Điều khoản sử dụng nội bộ</span>
          </div>
        </div>
      </header>

      <div className="page-body animate-in">
        <div className="product-form-grid" style={{ gridTemplateColumns: "1fr 300px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            <section className="card" style={{ padding: "32px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--accent)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                🛡️ 1. Chính sách Bảo mật Dữ liệu
              </h2>
              <div style={{ color: "var(--fg-secondary)", lineHeight: "1.8", fontSize: "14px" }}>
                <p style={{ marginBottom: "12px" }}>
                  TechPortal cam kết bảo vệ tuyệt đối thông tin cá nhân và dữ liệu kỹ thuật của mọi thành viên. Mọi truy cập vào hệ thống đều được giám sát và lưu nhật ký (Audit Log) để đảm bảo tính an toàn.
                </p>
                <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <li>Dữ liệu mật khẩu được mã hóa bằng thuật toán Bcrypt cấp độ cao.</li>
                  <li>Địa chỉ IP và thời gian truy cập được ghi lại để chống tấn công Brute Force.</li>
                  <li>Thông tin về dự án và tài chính chỉ dành riêng cho tài khoản có thẩm quyền (Admin).</li>
                </ul>
              </div>
            </section>

            <section className="card" style={{ padding: "32px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--green)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                🤝 2. Trách nhiệm Thành viên
              </h2>
              <div style={{ color: "var(--fg-secondary)", lineHeight: "1.8", fontSize: "14px" }}>
                <p style={{ marginBottom: "12px" }}>
                  Khi tham gia TechPortal, kỹ thuật viên đồng ý tuân thủ các quy tắc sau:
                </p>
                <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <li>Không chia sẻ tài khoản đăng nhập cho bất kỳ ai ngoài tổ chức.</li>
                  <li>Chỉ bảo lãnh (Invite) những nhân sự thực sự tin cậy và có chuyên môn.</li>
                  <li>Mọi thông tin về giá nhập và tồn kho được coi là bí mật kinh doanh.</li>
                  <li>Báo cáo ngay cho Admin nếu phát hiện bất kỳ dấu hiệu xâm nhập bất thường nào.</li>
                </ul>
              </div>
            </section>

            <section className="card" style={{ padding: "32px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--yellow)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                ⚙️ 3. Quyền hạn của Quản trị viên
              </h2>
              <div style={{ color: "var(--fg-secondary)", lineHeight: "1.8", fontSize: "14px" }}>
                <p>
                  Admin có quyền đình chỉ hoặc xóa vĩnh viễn các tài khoản vi phạm chính sách bảo mật mà không cần thông báo trước. Các dữ liệu được ghi nhận là giả mạo hoặc spam sẽ bị dọn dẹp định kỳ để tối ưu hóa hiệu năng hệ thống.
                </p>
              </div>
            </section>

          </div>

          <aside>
            <div className="card" style={{ padding: "24px", position: "sticky", top: "84px", background: "rgba(59, 130, 246, 0.05)", borderColor: "var(--border-accent)" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px" }}>📝 Thông tin bổ sung</h3>
              <div style={{ fontSize: "12px", color: "var(--fg-muted)", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <strong>Phiên bản:</strong> 1.5.2 (Hardened)
                </div>
                <div>
                  <strong>Cập nhật cuối:</strong> 15/05/2026
                </div>
                <div style={{ paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                  Mọi thắc mắc về điều khoản vui lòng liên hệ bộ phận kỹ thuật thông qua hệ thống Zalo Group nội bộ.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
