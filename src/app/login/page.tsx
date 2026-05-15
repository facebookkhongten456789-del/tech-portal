"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import TurnstileWidget from "@/components/TurnstileWidget";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (searchParams.get("registered")) {
      setSuccessMsg("Đăng ký thành công! Vui lòng đăng nhập.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError("Vui lòng hoàn thành xác minh bảo mật.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await signIn("credentials", { 
        email, 
        password, 
        turnstileToken, 
        redirect: false 
      });
      
      if (res?.error) {
        setError(res.error || "Email hoặc mật khẩu không chính xác.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
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
      position: "relative",
      overflow: "hidden",
    }}>
      <div className="animate-in" style={{ width: "100%", maxWidth: "400px", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "52px", height: "52px",
            background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
            borderRadius: "14px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px",
            margin: "0 auto 14px",
          }} className="animate-float">⚡</div>
          <h1 style={{ fontSize: "22px", fontWeight: 800 }}>TechPortal</h1>
          <p style={{ color: "var(--fg-muted)", fontSize: "13px", marginTop: "4px" }}>
            Hệ thống Quản lý Nội bộ
          </p>
        </div>

        <div className="card" style={{ padding: "28px" }}>
          <div style={{ marginBottom: "22px" }}>
            <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Đăng nhập</div>
          </div>

          {successMsg && <div className="alert alert-success" style={{ marginBottom: "16px" }}>✅ {successMsg}</div>}
          {error && <div className="alert alert-error" style={{ marginBottom: "16px" }}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="email@company.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" placeholder="••••••••" required />
            </div>

            {/* Turnstile for Login */}
            <TurnstileWidget 
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""} 
              onVerify={(token) => setTurnstileToken(token)} 
            />

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || !turnstileToken}>
              {loading ? "Đang xác thực..." : "Đăng nhập →"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "var(--fg-muted)" }}>
            Chưa có tài khoản? <Link href="/register" style={{ color: "var(--accent)", fontWeight: 600 }}>Đăng ký ngay</Link>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "11px", color: "var(--fg-muted)" }}>
          Chỉ dành cho nhân viên được cấp quyền
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
