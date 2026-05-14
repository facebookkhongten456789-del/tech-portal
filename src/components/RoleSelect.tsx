"use client";

import { useTransition } from "react";

export default function RoleSelect({ 
  userId, 
  currentRole, 
  changeRoleAction 
}: { 
  userId: string, 
  currentRole: string, 
  changeRoleAction: (formData: FormData) => Promise<void> 
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <select 
        name="role" 
        defaultValue={currentRole} 
        disabled={isPending}
        className="form-input" 
        style={{ 
          width: "130px", 
          padding: "4px 8px", 
          fontSize: "12px", 
          height: "30px",
          opacity: isPending ? 0.6 : 1,
          cursor: isPending ? "not-allowed" : "pointer"
        }}
        onChange={(e) => {
          const newRole = e.target.value;
          const formData = new FormData();
          formData.append("id", userId);
          formData.append("role", newRole);
          
          startTransition(async () => {
            await changeRoleAction(formData);
          });
        }}
      >
        <option value="TECHNICIAN">🔧 Technician</option>
        <option value="ADMIN">🛡️ Admin</option>
      </select>
      {isPending && <span className="text-xs" style={{ color: "var(--accent)" }}>Đang lưu...</span>}
    </div>
  );
}
