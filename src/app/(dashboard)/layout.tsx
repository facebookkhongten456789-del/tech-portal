import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import ApprovalStatusGuard from "@/components/ApprovalStatusGuard";

interface NavLink {
  href: string;
  icon: string;
  label: string;
  adminOnly?: boolean;
  approvedOnly?: boolean;
}

interface NavGroup {
  section: string;
  links: NavLink[];
}

const NAV_ITEMS: NavGroup[] = [
  {
    section: "TỔNG QUAN",
    links: [
      { href: "/dashboard", icon: "📊", label: "Bảng điều khiển" },
    ],
  },
  {
    section: "KHO HÀNG",
    links: [
      { href: "/products", icon: "📦", label: "Danh sách sản phẩm" },
      { href: "/products/new", icon: "➕", label: "Thêm sản phẩm", adminOnly: true, approvedOnly: true },
    ],
  },
  {
    section: "NỘI DUNG",
    links: [
      { href: "/articles", icon: "📰", label: "Tất cả bài viết" },
      { href: "/articles/new", icon: "✍️", label: "Đăng bài mới", approvedOnly: true },
    ],
  },
  {
    section: "HỆ THỐNG",
    links: [
      { href: "/members", icon: "👥", label: "Phê duyệt thành viên", adminOnly: true, approvedOnly: true },
    ],
  },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const initials = (session.user?.name || session.user?.email || "?")
    .slice(0, 2)
    .toUpperCase();
  const isAdmin = session.user?.role === "ADMIN";
  const isApproved = (session.user as any).isApproved === true;

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">⚡</div>
          <span className="sidebar-brand-name">TechPortal</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((group) => {
            // Ép kiểu NavLink tường minh để tránh lỗi Type Error trên Vercel
            const filteredLinks = group.links.filter((link: NavLink) => {
              const needsAdmin = link.adminOnly === true;
              const needsApproval = link.approvedOnly === true;
              
              if (needsAdmin && !isAdmin) return false;
              if (needsApproval && !isApproved) return false;
              
              return true;
            });

            if (filteredLinks.length === 0) return null;

            return (
              <div key={group.section}>
                <div className="sidebar-section-label">{group.section}</div>
                {filteredLinks.map((link: NavLink) => (
                  <Link key={link.href} href={link.href} className="sidebar-link">
                    <span className="sidebar-link-icon">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {session.user?.name || session.user?.email}
              </div>
              <div className="sidebar-user-role">
                <span className={isAdmin ? "chip chip-admin" : "chip chip-tech"}>
                  {isAdmin ? "⬡ Admin" : "🔧 Technician"}
                </span>
                {!isApproved && <span className="chip chip-tech" style={{ marginLeft: "4px", background: "var(--yellow)", color: "black" }}>Guest</span>}
              </div>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-content">
        <ApprovalStatusGuard />
        {children}
      </div>
    </div>
  );
}
