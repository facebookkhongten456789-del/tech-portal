"use client";

import { useSession } from "next-auth/react";

export default function ApprovalStatusGuard() {
  const { data: session } = useSession();

  if (!session || (session.user as any).isApproved) return null;

  return (
    <div style={{
      background: "linear-gradient(90deg, #f59e0b, #d97706)",
      color: "white",
      padding: "8px 16px",
      fontSize: "13px",
      fontWeight: 600,
      textAlign: "center",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      position: "sticky",
      top: 0,
      zIndex: 1000,
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    }}>
      <span style={{ fontSize: "16px" }}>⏳</span>
      <span>Tài khoản của bạn đang chờ quản trị viên phê duyệt. Bạn hiện đang ở chế độ "Chỉ xem", các chức năng thêm/sửa/xóa sẽ bị khóa.</span>
    </div>
  );
}
