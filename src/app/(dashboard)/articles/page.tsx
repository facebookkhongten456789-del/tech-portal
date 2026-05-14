import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";

async function deleteArticle(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).isApproved) redirect("/login");

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
  if (!session || !(session.user as any).isApproved) redirect("/login");

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
  if (!session || session.user?.role !== "ADMIN" || !(session.user as any).isApproved) return;
  const id = formData.get("id") as string;
  if (!id) return;
  await prisma.article.update({ where: { id }, data: { isApproved: true } });
  revalidatePath("/articles");
}

export default async function ArticlesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isApproved = (session.user as any).isApproved === true;
  const isAdmin = session.user?.role === "ADMIN" && isApproved;
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
        {isApproved && (
          <Link href="/articles/new" className="btn btn-primary">
            ＋ Đăng bài mới
          </Link>
        )}
      </header>

      <div className="page-body animate-in">
        {!isApproved && (
          <div className="alert alert-warning" style={{ marginBottom: "20px" }}>
            ⚠️ Chế độ xem: Tài khoản của bạn đang chờ phê duyệt. Bạn không thể đăng bài hoặc chỉnh sửa nội dung lúc này.
          </div>
        )}

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

        <div className="section-header">
          <div className="section-title">Danh sách bài viết</div>
        </div>

        {articles.length === 0 ? (
          <div className="card" style={{ padding: "64px", textAlign: "center", color: "var(--fg-muted)" }}>
            📭 Chưa có bài viết nào.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {articles.map((article) => {
              const canAct = (article.author.id === userId || isAdmin) && isApproved;
              let imgList: string[] = [];
              try { imgList = JSON.parse(article.images); } catch { imgList = []; }
              const thumb = imgList[0] ?? null;

              return (
                <div key={article.id} className="card" style={{ display: "flex", gap: "16px", padding: "0", overflow: "hidden" }}>
                  {thumb && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={thumb} alt="thumb" style={{ width: "120px", objectFit: "cover" }} />
                  )}
                  <div style={{ flex: 1, padding: "16px 16px 16px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                          <span className={`badge ${article.published ? "badge-green" : "badge-gray"}`}>{article.published ? "Đã đăng" : "Nháp"}</span>
                          <span className={`badge ${article.isApproved ? "badge-green" : "badge-yellow"}`}>{article.isApproved ? "Đã duyệt" : "Chờ duyệt"}</span>
                        </div>
                        <Link href={`/articles/${article.id}`} style={{ fontWeight: 700, fontSize: "15px" }}>{article.title}</Link>
                        <div className="text-xs text-muted">✍️ {article.author.name}</div>
                      </div>
                      {canAct && (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <Link href={`/articles/${article.id}`} className="btn btn-ghost btn-sm">Xem</Link>
                          <form action={deleteArticle}>
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
