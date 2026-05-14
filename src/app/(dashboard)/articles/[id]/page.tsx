import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

async function deleteThisArticle(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const id = formData.get("id") as string;
  if (!id) return;
  const a = await prisma.article.findUnique({ where: { id }, select: { authorId: true } });
  if (!a) return;
  if (a.authorId !== session.user?.id && session.user?.role !== "ADMIN") return;
  await prisma.article.delete({ where: { id } });
  redirect("/articles");
}

// Tiny Markdown → HTML renderer (safe, no XSS)
function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>")
    .replace(/```[\s\S]*?```/g, (m) => `<pre><code>${m.slice(3, -3).trim()}</code></pre>`)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
      // Allow Cloudinary and relative uploads
      const isSafe = src.startsWith("https://res.cloudinary.com/") || src.startsWith("/uploads/");
      if (!isSafe) return "";
      return `<a href="${src}" target="_blank" rel="noopener noreferrer">
        <img src="${src}" alt="${alt}" style="max-width:100%;border-radius:12px;margin:12px 0;border:1px solid var(--border);cursor:zoom-in;transition:var(--transition-base);" />
      </a>`;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
      const safe = href.startsWith("http") ? href : "";
      return safe ? `<a href="${safe}" target="_blank" rel="noopener noreferrer">${text}</a>` : text;
    })
    .replace(/^---$/gm, "<hr/>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hpublcodie])/gm, "")
    .replace(/^(.+)$/gm, (line) =>
      line.startsWith("<") ? line : `<p>${line}</p>`
    );
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  // Validate ID format (cuid is alphanumeric)
  if (!/^[a-z0-9]+$/.test(id)) notFound();

  const article = await prisma.article.findUnique({
    where: { id },
    select: {
      id: true, title: true, content: true, images: true,
      published: true, isApproved: true,
      createdAt: true, updatedAt: true,
      author: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  if (!article) notFound();

  // Technician can only see published and approved articles (or their own)
  const isAdmin  = session.user?.role === "ADMIN";
  const isAuthor = article.author.id === session.user?.id;
  if (!article.published && !isAdmin && !isAuthor) notFound();
  if (article.published && !article.isApproved && !isAdmin && !isAuthor) notFound();

  let images: string[] = [];
  try { images = JSON.parse(article.images); } catch { images = []; }

  const renderedHtml = renderMarkdown(article.content);

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div className="page-title">Chi tiết bài viết</div>
          <div className="breadcrumb">
            <span>TechPortal</span><span>›</span>
            <Link href="/articles" style={{ color: "var(--fg-secondary)" }}>Bài viết</Link>
            <span>›</span>
            <span style={{ color: "var(--fg-secondary)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {article.title}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link href="/articles" className="btn btn-secondary btn-sm">← Quay lại</Link>
          {(isAdmin || isAuthor) && (
            <form action={deleteThisArticle}>
              <input type="hidden" name="id" value={article.id} />
              <button type="submit" className="btn btn-danger btn-sm">Xóa bài</button>
            </form>
          )}
        </div>
      </header>

      <div className="page-body animate-in">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "28px", alignItems: "start" }}>
          {/* Article content */}
          <article className="card" style={{ padding: "32px" }}>
            {/* Status badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
              <span className={`badge ${article.published ? "badge-green" : "badge-gray"}`}>
                {article.published ? "✅ Đã đăng" : "📄 Nháp"}
              </span>
              <span className={`badge ${article.isApproved ? "badge-green" : "badge-yellow"}`}>
                {article.isApproved ? "🛡️ Đã duyệt" : "⏳ Chờ duyệt"}
              </span>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: "24px", fontWeight: 800, lineHeight: 1.3, marginBottom: "16px" }}>
              {article.title}
            </h1>

            {/* Author & date */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid var(--border)" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "linear-gradient(135deg,var(--accent),#8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 700, flexShrink: 0,
              }}>
                {(article.author.name || article.author.email).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "13px" }}>
                  {article.author.name || article.author.email}
                  <span className={article.author.role === "ADMIN" ? "chip chip-admin" : "chip chip-tech"} style={{ marginLeft: "6px" }}>
                    {article.author.role}
                  </span>
                </div>
                <div className="text-xs text-muted">
                  {new Date(article.createdAt).toLocaleDateString("vi-VN", {
                    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </div>
              </div>
            </div>


            {/* Rendered content */}
            <div
              style={{ lineHeight: "1.8", fontSize: "14px", color: "var(--fg-secondary)" }}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </article>

          {/* Sidebar info */}
          <div style={{ position: "sticky", top: "80px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Approval status */}
            <div className="card" style={{ padding: "16px" }}>
              <div style={{ fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--fg-muted)", marginBottom: "10px" }}>
                🛡️ Trạng thái nội dung
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: article.isApproved ? "var(--green)" : "var(--yellow)" }} />
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>
                    {article.isApproved ? "Đã được phê duyệt" : "Chờ quản trị viên duyệt"}
                  </span>
                </div>
                <div className="text-xs text-muted" style={{ lineHeight: "1.5" }}>
                  {article.isApproved 
                    ? "Bài viết này đã được Admin kiểm duyệt và cho phép hiển thị rộng rãi."
                    : "Bài viết này đang trong hàng đợi kiểm duyệt. Admin sẽ sớm xem xét."}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="card" style={{ padding: "16px" }}>
              <div style={{ fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--fg-muted)", marginBottom: "10px" }}>
                📋 Thông tin
              </div>
              {[
                { label: "Tác giả", value: article.author.name || article.author.email },
                { label: "Ngày tạo", value: new Date(article.createdAt).toLocaleDateString("vi-VN") },
                { label: "Cập nhật", value: new Date(article.updatedAt).toLocaleDateString("vi-VN") },
                { label: "Số ảnh", value: `${images.length} ảnh` },
                { label: "Độ dài", value: `${article.content.length.toLocaleString()} ký tự` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: "12px" }}>
                  <span style={{ color: "var(--fg-muted)" }}>{label}</span>
                  <span style={{ fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        article h1 { font-size: 20px; font-weight: 700; margin: 20px 0 10px; color: var(--fg-primary); }
        article h2 { font-size: 17px; font-weight: 600; margin: 16px 0 8px; color: var(--fg-primary); }
        article h3 { font-size: 15px; font-weight: 600; margin: 14px 0 6px; color: var(--fg-primary); }
        article p  { margin: 8px 0; }
        article strong { color: var(--fg-primary); }
        article code { background: var(--bg-elevated); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; }
        article pre  { background: var(--bg-base); padding: 16px; border-radius: 8px; overflow-x: auto; margin: 12px 0; border: 1px solid var(--border); }
        article pre code { background: none; padding: 0; }
        article blockquote { border-left: 3px solid var(--accent); padding-left: 14px; margin: 12px 0; color: var(--fg-secondary); }
        article li { margin-left: 20px; margin-bottom: 4px; }
        article hr { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
        article a  { color: var(--accent); text-decoration: underline; }
      `}</style>
    </>
  );
}
