"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [inviteCode, setInviteCode]   = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, inviteCode }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/login?registered=true");
      } else {
        setError(data.error || "Đăng ký thất bại");
      }
    } catch (err) {
      setError("Có lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-base)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <div className="animate-in" style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚡</div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Tham gia TechPortal</h1>
          <p style={{ color: "var(--fg-muted)", fontSize: "14px", marginTop: "4px" }}>
            Hệ thống Quản lý Kỹ thuật viên (Nội bộ)
          </p>
        </div>

        <div className="card" style={{ padding: "32px" }}>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: "20px" }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div className="form-group">
              <label className="form-label">Họ và tên</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email công việc</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <input
                type="password"
                required
                minLength={10}
                className="form-input"
                placeholder="Tối thiểu 10 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mã mời (Email người giới thiệu) <span className="required">*</span></label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="Nhập Email của một thành viên đã được duyệt"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ marginTop: "8px" }}
            >
              {loading ? "Đang xử lý..." : "Gửi yêu cầu gia nhập"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "var(--fg-muted)" }}>
            Đã có tài khoản? <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>Đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
