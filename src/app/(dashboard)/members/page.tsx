import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import DeleteMemberButton from "@/components/DeleteMemberButton";
import RoleSelect from "@/components/RoleSelect";

/* ─── Server Actions ─── */

async function approveMember(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") return;

  const id = formData.get("id") as string;
  if (!id) return;

  try {
    await prisma.user.update({
      where: { id },
      data: { isApproved: true }
    });
    revalidatePath("/members");
  } catch (err) {
    console.error("[approve_error]", err);
  }
}

async function changeRole(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") return;

  const id = formData.get("id") as string;
  const role = formData.get("role") as string;

  if (!id || !role || (role !== "ADMIN" && role !== "TECHNICIAN")) return;
  if (id === session.user.id) return;

  try {
    await prisma.user.update({
      where: { id },
      data: { role }
    });
    revalidatePath("/members");
  } catch (err) {
    console.error("[change_role_error]", err);
  }
}

async function deleteMember(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") return;

  const id = formData.get("id") as string;
  if (!id || id === session.user.id) return;

  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/members");
  } catch (err) {
    console.error("[delete_member_error]", err);
    redirect("/members?error=delete_failed");
  }
}

async function cleanupAllPending() {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") return;

  try {
    await prisma.user.deleteMany({
      where: { isApproved: false }
    });
    revalidatePath("/members");
  } catch (err) {
    console.error("[cleanup_pending_error]", err);
  }
}

/* ─── Page ─── */
export default async function MembersPage({ searchParams }: { searchParams: Promise<{ error?: string, success?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = session.user?.role === "ADMIN";
  if (!isAdmin) redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
  });

  const params = await searchParams;
  const error = params.error;
  const success = params.success;

  const pendingUsers = users.filter(u => !u.isApproved);
  const approvedUsers = users.filter(u => u.isApproved);
  const adminCount = users.filter(u => u.role === "ADMIN").length;
  const techCount = users.filter(u => u.role === "TECHNICIAN" && u.isApproved).length;

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div className="page-title">Quản lý Thành viên</div>
          <div className="breadcrumb">
            <span>TechPortal</span><span>›</span>
            <span style={{ color: "var(--fg-secondary)" }}>Phê duyệt & Quyền hạn</span>
          </div>
        </div>
        <span className="badge badge-blue">🛡️ Quyền Admin</span>
      </header>

      <div className="page-body animate-in">
        {/* Stats */}
        <div className="page-section" style={{ marginBottom: "32px" }}>
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            <div className="stat-card blue">
              <div className="stat-icon blue">👥</div>
              <div className="stat-label">Tổng thành viên</div>
              <div className="stat-value">{users.length}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: "4px solid var(--yellow)", background: "rgba(245, 158, 11, 0.05)" }}>
              <div className="stat-icon" style={{ background: "var(--yellow)", color: "black" }}>⏳</div>
              <div className="stat-label">Chờ phê duyệt</div>
              <div className="stat-value" style={{ color: "var(--yellow)" }}>{pendingUsers.length}</div>
            </div>
            <div className="stat-card purple">
              <div className="stat-icon purple">🛡️</div>
              <div className="stat-label">Quản trị viên</div>
              <div className="stat-value">{adminCount}</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon green">🔧</div>
              <div className="stat-label">Kỹ thuật viên</div>
              <div className="stat-value">{techCount}</div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error === "delete_failed" && <div className="alert alert-error" style={{ marginBottom: "20px" }}>❌ Không thể xóa thành viên này.</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: "20px" }}>✅ Thao tác thành công!</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

          <div className="page-section">
            <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="section-title" style={{ color: "var(--yellow)" }}>⏳ Yêu cầu chờ duyệt ({pendingUsers.length})</div>
              {pendingUsers.length > 0 && (
                <form action={cleanupAllPending}>
                  <button type="submit" className="btn btn-ghost btn-sm text-red" style={{ fontSize: "11px" }}>
                    🗑️ Dọn dẹp tất cả yêu cầu rác
                  </button>
                </form>
              )}
            </div>
            {pendingUsers.length === 0 ? (
              <div className="card" style={{ padding: "20px", textAlign: "center", color: "var(--fg-muted)" }}>
                Không có yêu cầu đăng ký mới nào.
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Thành viên</th>
                      <th>Email</th>
                      <th>Ngày đăng ký</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((u) => (
                      <tr key={u.id}>
                        <td><div style={{ fontWeight: 600 }}>{u.name}</div></td>
                        <td className="font-mono text-sm">{u.email}</td>
                        <td className="text-sm">
                          <span className="badge badge-gray" style={{ fontSize: "10px" }}>👤 Bởi: {u.invitedBy || "Hệ thống"}</span>
                        </td>
                        <td className="text-sm">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <form action={approveMember}>
                              <input type="hidden" name="id" value={u.id} />
                              <button type="submit" className="btn btn-primary btn-sm">Duyệt</button>
                            </form>
                            <form action={deleteMember}>
                              <input type="hidden" name="id" value={u.id} />
                              <button type="submit" className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }}>Từ chối</button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="page-section">
            <div className="section-header">
              <div className="section-title">👥 Danh sách thành viên chính thức</div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Thành viên</th>
                    <th>Email</th>
                    <th>Vai trò / Cấp quyền</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedUsers.map((user) => {
                    const initials = (user.name || user.email).slice(0, 2).toUpperCase();
                    const isSelf = user.id === session.user?.id;
                    return (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div className="avatar" style={{ width: "34px", height: "34px", fontSize: "12px" }}>
                              {initials}
                            </div>
                            <div style={{ fontWeight: 500, fontSize: "13px" }}>
                              {user.name} {isSelf && <span className="badge badge-gray" style={{ marginLeft: "6px" }}>bạn</span>}
                            </div>
                          </div>
                        </td>
                        <td className="font-mono text-sm text-muted">{user.email}</td>
                        <td>
                          {isSelf ? (
                            <span className="chip chip-admin">🛡️ Admin (Chính bạn)</span>
                          ) : (
                            <RoleSelect
                              userId={user.id}
                              currentRole={user.role}
                              changeRoleAction={changeRole}
                            />
                          )}
                        </td>
                        <td>
                          {!isSelf && (
                            <form action={deleteMember}>
                              <input type="hidden" name="id" value={user.id} />
                              <DeleteMemberButton memberId={user.id} />
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
