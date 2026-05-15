"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [inviteCode, setInviteCode]   = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState(false);

  // Generate simple math captcha
  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaQuestion(`${n1} + ${n2}`);
    setCaptchaAnswer("");
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, inviteCode, captchaAnswer, captchaQuestion }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(data.error || "Đăng ký thất bại");
        generateCaptcha(); // Reset captcha on error
      }
    } catch (err) {
      setError("Hệ thống đang bận hoặc lỗi 502. Vui lòng thử lại sau.");
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
            Cảm ơn bạn đã đăng ký. Vui lòng chờ Quản trị viên phê duyệt tài khoản trước khi đăng nhập.<br/>
            Hệ thống sẽ chuyển hướng về trang đăng nhập sau vài giây...
          </p>
        </div>
      </div>
    );
  }

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
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>🛡️</div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Đăng ký Kỹ thuật viên</h1>
          <p style={{ color: "var(--fg-muted)", fontSize: "14px", marginTop: "4px" }}>
            Hệ thống giám sát nội bộ TechPortal
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
              <input type="text" required className="form-input" placeholder="Nguyễn Văn A" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email công việc</label>
              <input type="email" required className="form-input" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu (Tối thiểu 10 ký tự)</label>
              <input type="password" required minLength={10} className="form-input" placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email người giới thiệu <span className="required">*</span></label>
              <input type="email" required className="form-input" placeholder="Email của một thành viên đã được duyệt" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
            </div>

            {/* Math CAPTCHA UI */}
            <div className="form-group" style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              <label className="form-label" style={{ color: "var(--accent)", fontWeight: 700 }}>Xác minh bảo mật (Captcha)</label>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                <div style={{ 
                  background: "var(--bg-elevated)", 
                  padding: "8px 16px", 
                  borderRadius: "4px", 
                  fontFamily: "var(--font-mono)", 
                  fontWeight: 800,
                  fontSize: "18px",
                  letterSpacing: "2px"
                }}>
                  {captchaQuestion} = ?
                </div>
                <input 
                  type="number" 
                  required 
                  className="form-input" 
                  style={{ width: "80px", textAlign: "center", fontSize: "18px" }}
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="?"
                />
              </div>
              <p style={{ fontSize: "11px", color: "var(--fg-muted)", marginTop: "10px" }}>
                Nhập kết quả phép tính để xác minh bạn không phải robot.
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ marginTop: "8px" }}
            >
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
