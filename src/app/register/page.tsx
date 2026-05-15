"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TurnstileWidget from "@/components/TurnstileWidget";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [inviteCode, setInviteCode]   = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError("Vui lòng hoàn thành xác minh bảo mật.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, inviteCode, turnstileToken }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(data.error || "Đăng ký thất bại");
      }
    } catch (err) {
      setError("Lỗi hệ thống. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card" style={{ padding: "40px", textAlign: "center", maxWidth: "450px" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>✅</div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px" }}>Yêu cầu đã được gửi</h2>
          <p style={{ color: "var(--fg-secondary)", lineHeight: "1.6" }}>
            Hệ thống sẽ chuyển hướng về trang đăng nhập sau vài giây...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div className="animate-in" style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>🛡️</div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Đăng ký Thành viên</h1>
        </div>

        <div className="card" style={{ padding: "32px" }}>
          {error && <div className="alert alert-error" style={{ marginBottom: "20px" }}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div className="form-group">
              <label className="form-label">Họ và tên</label>
              <input type="text" required className="form-input" placeholder="Họ tên đầy đủ" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email công việc</label>
              <input type="email" required className="form-input" placeholder="email@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu (Tối thiểu 10 ký tự)</label>
              <input type="password" required minLength={10} className="form-input" placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email người giới thiệu <span className="required">*</span></label>
              <input type="email" required className="form-input" placeholder="Người bảo lãnh đã được duyệt" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
            </div>

            {/* Cloudflare Turnstile */}
            <TurnstileWidget 
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""} 
              onVerify={(token) => setTurnstileToken(token)} 
            />

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || !turnstileToken}>
              {loading ? "Đang xử lý..." : "⚡ Xác nhận đăng ký"}
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
