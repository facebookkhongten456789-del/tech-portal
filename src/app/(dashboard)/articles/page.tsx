import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";

async function deleteArticle(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const id = formData.get("id") as string;
  if (!id) return;

  const article = await prisma.article.findUnique({
    where: { id },
    select: { authorId: true },
  });
  if (!article) return;
  if (article.authorId !== session.user?.id && session.user?.role !== "ADMIN") return;

  await prisma.article.delete({ where: { id } });
  revalidatePath("/articles");
}

async function togglePublish(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const id        = formData.get("id") as string;
  const published = formData.get("published") === "true";
  if (!id) return;

  const article = await prisma.article.findUnique({
    where: { id },
    select: { authorId: true },
  });
  if (!article) return;
  if (article.authorId !== session.user?.id && session.user?.role !== "ADMIN") return;

  await prisma.article.update({ where: { id }, data: { published: !published } });
  revalidatePath("/articles");
}

async function approveArticle(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") return;
  const id = formData.get("id") as string;
  if (!id) return;
  await prisma.article.update({ where: { id }, data: { isApproved: true } });
  revalidatePath("/articles");
}

export default async function ArticlesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = session.user?.role === "ADMIN";
  const userId  = session.user!.id;

  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, published: true,
      isApproved: true,
      createdAt: true, images: true,
      author: { select: { id: true, name: true } },
    },
  });

  const publishedCount = articles.filter((a) => a.published).length;
  const draftCount     = articles.filter((a) => !a.published).length;
  const myCount        = articles.filter((a) => a.author.id === userId).length;

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div className="page-title">Bài viết & Thông báo</div>
          <div className="breadcrumb">
            <span>TechPortal</span><span>›</span>
            <span style={{ color: "var(--fg-secondary)" }}>Bài viết</span>
          </div>
        </div>
        <Link href="/articles/new" className="btn btn-primary">
          ＋ Đăng bài mới
        </Link>
      </header>

      <div className="page-body animate-in">
        {/* Stats */}
        <div className="page-section">
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
            <div className="stat-card blue">
              <div className="stat-icon blue">📝</div>
              <div className="stat-label">Tổng bài viết</div>
              <div className="stat-value">{articles.length}</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon green">✅</div>
              <div className="stat-label">Đã đăng</div>
              <div className="stat-value">{publishedCount}</div>
            </div>
            <div className="stat-card" style={{ background: "var(--bg-surface)" }}>
              <div className="stat-icon" style={{ background: "var(--bg-elevated)" }}>📄</div>
              <div className="stat-label">Bản nháp</div>
              <div className="stat-value">{draftCount}</div>
            </div>
            <div className="stat-card purple">
              <div className="stat-icon purple">✍️</div>
              <div className="stat-label">Bài của bạn</div>
              <div className="stat-value">{myCount}</div>
            </div>
          </div>
        </div>

        {/* Article list */}
        <div className="section-header">
          <div className="section-title">Danh sách bài viết</div>
          <span className="text-sm text-muted">{articles.length} bài</span>
        </div>

        {articles.length === 0 ? (
          <div className="card" style={{ padding: "64px", textAlign: "center", color: "var(--fg-muted)" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
            <div style={{ fontWeight: 600, marginBottom: "8px" }}>Chưa có bài viết nào</div>
            <div className="text-sm text-muted" style={{ marginBottom: "20px" }}>
              Hãy là người đầu tiên chia sẻ kiến thức kỹ thuật!
            </div>
            <Link href="/articles/new" className="btn btn-primary">＋ Đăng bài đầu tiên</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {articles.map((article) => {
              const canAct = article.author.id === userId || isAdmin;
              let imgList: string[] = [];
              try { imgList = JSON.parse(article.images); } catch { imgList = []; }
              const thumb = imgList[0] ?? null;

              return (
                <div
                  key={article.id}
                  className="card"
                  style={{
                    display: "flex",
                    gap: "16px",
                    padding: "0",
                    overflow: "hidden",
                    borderLeft: `3px solid ${article.published ? (article.isApproved ? "var(--green)" : "var(--yellow)") : "var(--fg-muted)"}`,
                    transition: "border-color .2s, transform .2s",
                  }}
                >
                  {/* Thumbnail */}
                  {thumb && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={thumb}
                      alt="thumbnail"
                      style={{ width: "120px", objectFit: "cover", flexShrink: 0 }}
                    />
                  )}

                  <div style={{ flex: 1, padding: "16px 16px 16px 0", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Badges row */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "6px" }}>
                          <span className={`badge ${article.published ? "badge-green" : "badge-gray"}`}>
                            {article.published ? "✅ Đã đăng" : "📄 Nháp"}
                          </span>
                          <span className={`badge ${article.isApproved ? "badge-green" : "badge-yellow"}`}>
                            {article.isApproved ? "🛡️ Đã duyệt" : "⏳ Chờ duyệt"}
                          </span>
                          {article.author.id === userId && (
                            <span className="badge badge-purple">của bạn</span>
                          )}
                          {imgList.length > 0 && (
                            <span className="badge badge-gray">🖼️ {imgList.length} ảnh</span>
                          )}
                        </div>

                        {/* Title */}
                        <Link
                          href={`/articles/${article.id}`}
                          style={{ fontWeight: 700, fontSize: "15px", display: "block", marginBottom: "4px" }}
                        >
                          {article.title}
                        </Link>

                        {/* Meta */}
                        <div className="text-xs text-muted">
                          ✍️ {article.author.name} &nbsp;·&nbsp;
                          {new Date(article.createdAt).toLocaleDateString("vi-VN", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      {canAct && (
                        <div style={{ display: "flex", gap: "6px", flexShrink: 0, flexWrap: "wrap" }}>
                          {isAdmin && !article.isApproved && (
                            <form action={approveArticle} style={{ display: "inline" }}>
                              <input type="hidden" name="id" value={article.id} />
                              <button type="submit" className="btn btn-primary btn-sm">Duyệt bài</button>
                            </form>
                          )}
                          <Link href={`/articles/${article.id}`} className="btn btn-ghost btn-sm">Xem</Link>
                          <form action={togglePublish} style={{ display: "inline" }}>
                            <input type="hidden" name="id" value={article.id} />
                            <input type="hidden" name="published" value={String(article.published)} />
                            <button
                              type="submit"
                              className={`btn btn-sm ${article.published ? "btn-secondary" : "btn-primary"}`}
                            >
                              {article.published ? "Gỡ xuống" : "Đăng"}
                            </button>
                          </form>
                          <form action={deleteArticle} style={{ display: "inline" }}>
                            <input type="hidden" name="id" value={article.id} />
                            <button type="submit" className="btn btn-danger btn-sm">Xóa</button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
