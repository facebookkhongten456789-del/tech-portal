import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ArticleEditor from "@/components/ArticleEditor";

export default async function NewArticlePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <header className="page-header">
        <div className="page-header-left">
          <div className="page-title">Đăng bài viết mới</div>
          <div className="breadcrumb">
            <span>TechPortal</span><span>›</span>
            <Link href="/articles" style={{ color: "var(--fg-secondary)" }}>Bài viết</Link>
            <span>›</span>
            <span style={{ color: "var(--fg-secondary)" }}>Bài mới</span>
          </div>
        </div>
        <span className="badge badge-purple">
          ✍️ Đăng bởi: {session.user?.name || session.user?.email}
        </span>
      </header>

      <div className="page-body animate-in">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "28px", alignItems: "start" }}>
          {/* Main editor */}
          <div>
            <div className="section-header">
              <div className="section-title">Soạn thảo nội dung</div>
            </div>
            <div className="card" style={{ padding: "24px" }}>
              <ArticleEditor />
            </div>
          </div>

          {/* Tips panel */}
          <div style={{ position: "sticky", top: "80px" }}>
            <div className="section-header">
              <div className="section-title">Hướng dẫn</div>
            </div>
            <div className="card" style={{ padding: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "12px", color: "var(--fg-secondary)", lineHeight: "1.7" }}>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--fg-primary)", marginBottom: "4px" }}>📝 Markdown</div>
                  <code style={{ fontFamily: "monospace", display: "block", background: "var(--bg-elevated)", padding: "8px", borderRadius: "4px", fontSize: "11px" }}>
                    **in đậm** _nghiêng_<br/>
                    # Tiêu đề 1<br/>
                    ## Tiêu đề 2<br/>
                    - Danh sách<br/>
                    &gt; Trích dẫn<br/>
                    `code inline`<br/>
                    ```code block```
                  </code>
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--fg-primary)", marginBottom: "4px" }}>🖼️ Ảnh</div>
                  Dùng nút toolbar để tải ảnh lên. Tối đa 5MB/ảnh, định dạng JPG/PNG/GIF/WebP.
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--fg-primary)", marginBottom: "4px" }}>📋 Quy tắc</div>
                  Nội dung phải liên quan đến kỹ thuật, chuyên nghiệp, không spam hoặc công kích.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
