import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

/* ─── Server Actions ─── */

async function addMember(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") throw new Error("Không có quyền");

  const name     = (formData.get("name") as string)?.trim();
  const email    = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const role     = formData.get("role") as string;

  if (!name || !email || !password) return;
  if (name.length > 100 || email.length > 200) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
  if (!["ADMIN", "TECHNICIAN"].includes(role)) return;
  if (password.length < 6 || password.length > 100) return;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return; // email đã tồn tại

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { name, email, passwordHash, role } });
  revalidatePath("/members");
}

async function deleteMember(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") throw new Error("Không có quyền");

  const id = formData.get("id") as string;
  if (!id) return;
  if (id === session.user.id) throw new Error("Không thể tự xóa");

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) return;

  await prisma.user.delete({ where: { id } });
  revalidatePath("/members");
}

/* ─── Page ─── */
export default async function MembersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = session.user?.role === "ADMIN";

  // Redirect technicians — they shouldn't see members management
  if (!isAdmin) redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const techCount  = users.filter((u) => u.role === "TECHNICIAN").length;

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div className="page-title">Quản lý Thành viên</div>
          <div className="breadcrumb">
            <span>TechPortal</span><span>›</span>
            <span style={{ color: "var(--fg-secondary)" }}>Thành viên</span>
          </div>
        </div>
        <span className="badge badge-blue">🛡️ Chỉ dành cho Admin</span>
      </header>

      <div className="page-body animate-in">
        {/* Stats */}
        <div className="page-section">
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            <div className="stat-card blue">
              <div className="stat-icon blue">👥</div>
              <div className="stat-label">Tổng thành viên</div>
              <div className="stat-value">{users.length}</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-icon blue">🛡️</div>
              <div className="stat-label">Quản trị viên</div>
              <div className="stat-value">{adminCount}</div>
            </div>
            <div className="stat-card purple">
              <div className="stat-icon purple">🔧</div>
              <div className="stat-label">Kỹ thuật viên</div>
              <div className="stat-value">{techCount}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", alignItems: "start" }}>
          {/* Table */}
          <div className="page-section">
            <div className="section-header">
              <div className="section-title">Danh sách thành viên</div>
              <span className="text-sm text-muted">{users.length} tài khoản</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Thành viên</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Ngày tham gia</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const initials = (user.name || user.email).slice(0, 2).toUpperCase();
                    const isSelf = user.id === session.user?.id;
                    return (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div className="avatar" style={{ width: "34px", height: "34px", fontSize: "12px" }}>
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500, fontSize: "13px" }}>
                                {user.name || "—"}
                                {isSelf && (
                                  <span className="badge badge-gray" style={{ marginLeft: "6px", fontSize: "10px" }}>bạn</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="font-mono text-sm text-muted">{user.email}</td>
                        <td>
                          <span className={user.role === "ADMIN" ? "chip chip-admin" : "chip chip-tech"}>
                            {user.role === "ADMIN" ? "🛡️ Admin" : "🔧 Technician"}
                          </span>
                        </td>
                        <td className="text-sm text-muted">
                          {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td>
                          {isSelf ? (
                            <span className="text-xs text-muted">—</span>
                          ) : (
                            <form action={deleteMember}>
                              <input type="hidden" name="id" value={user.id} />
                              <button type="submit" className="btn btn-danger btn-sm">Xóa</button>
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

          {/* Add form */}
          <div className="page-section">
            <div className="section-header">
              <div className="section-title">Thêm thành viên mới</div>
            </div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">👤 Thông tin tài khoản</span>
              </div>
              <div className="card-body">
                <form action={addMember} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div className="form-group">
                    <label className="form-label">Họ và tên <span className="required">*</span></label>
                    <input type="text" name="name" required maxLength={100} className="form-input" placeholder="Nguyễn Văn A" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email <span className="required">*</span></label>
                    <input type="email" name="email" required maxLength={200} className="form-input" placeholder="name@company.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mật khẩu <span className="required">*</span></label>
                    <input type="password" name="password" required minLength={6} maxLength={100} className="form-input" placeholder="Tối thiểu 6 ký tự" />
                    <span className="form-hint">Mật khẩu sẽ được mã hóa bcrypt (cost 12)</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vai trò</label>
                    <select name="role" className="form-input">
                      <option value="TECHNICIAN">🔧 Kỹ thuật viên (Technician)</option>
                      <option value="ADMIN">🛡️ Quản trị viên (Admin)</option>
                    </select>
                  </div>

                  {/* Role description */}
                  <div className="card" style={{ padding: "12px", background: "var(--bg-base)", fontSize: "12px", color: "var(--fg-secondary)", lineHeight: "1.7" }}>
                    <div><strong style={{ color: "var(--fg-primary)" }}>🛡️ Admin:</strong> Toàn quyền — thêm/xóa thành viên, sản phẩm, bài viết của người khác.</div>
                    <div style={{ marginTop: "6px" }}><strong style={{ color: "var(--fg-primary)" }}>🔧 Technician:</strong> Xem kho, cập nhật số lượng, đăng bài viết (chỉ xóa bài của mình).</div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-full">
                    ＋ Tạo tài khoản
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
