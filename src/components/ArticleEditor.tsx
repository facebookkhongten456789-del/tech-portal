"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ArticleEditor() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle]           = useState("");
  const [content, setContent]       = useState("");
  const [images, setImages]         = useState<string[]>([]);
  const [published, setPublished]   = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  /* ── Insert formatting ── */
  const insertFormat = useCallback((before: string, after = before) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const selected = value.slice(s, e) || "text";
    const newVal = value.slice(0, s) + before + selected + after + value.slice(e);
    setContent(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + selected.length);
    }, 0);
  }, []);

  /* ── Upload image ── */
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Upload lỗi"); continue; }
        const url: string = data.url;
        setImages((prev) => [...prev, url]);
        setContent((prev) => prev + `\n\n![${file.name}](${url})\n`);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { setError("Tiêu đề và nội dung là bắt buộc."); return; }
    
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          images,
          published,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/articles");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lưu bài thất bại");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Title */}
      <div className="form-group">
        <label className="form-label">Tiêu đề bài viết <span className="required">*</span></label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={300}
          required
          className="form-input"
          style={{ fontSize: "16px", fontWeight: 600, padding: "12px" }}
          placeholder="Nhập tiêu đề bài viết..."
        />
      </div>

      {/* Toolbar */}
      <div>
        <label className="form-label" style={{ marginBottom: "6px", display: "block" }}>
          Nội dung <span className="required">*</span>
        </label>
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "4px", padding: "8px 10px",
          background: "var(--bg-elevated)", borderRadius: "6px 6px 0 0",
          border: "1px solid var(--border)", borderBottom: "none",
        }}>
          <button type="button" className="btn btn-ghost btn-sm" style={{ fontWeight: 800, fontSize: "11px" }} onClick={() => insertFormat("**", "**")} title="Bold">B</button>
          <button type="button" className="btn btn-ghost btn-sm" style={{ fontStyle: "italic", fontSize: "11px" }} onClick={() => insertFormat("_", "_")} title="Italic">I</button>
          <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: "11px" }} onClick={() => insertFormat("~~", "~~")} title="Strike">~~</button>
          <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: "11px" }} onClick={() => insertFormat("# ", "")} title="H1">H1</button>
          <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: "11px" }} onClick={() => insertFormat("## ", "")} title="H2">H2</button>
          <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: "11px" }} onClick={() => setContent(c => c + "\n\n---\n\n")} title="Divider">—</button>
          <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: "11px" }} onClick={() => insertFormat("- ", "")} title="Bullet List">• List</button>
          <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: "11px" }} onClick={() => insertFormat("1. ", "")} title="Numbered List">1. List</button>
          <button type="button" className="btn btn-ghost btn-sm" style={{ fontFamily: "monospace", fontSize: "11px" }} onClick={() => insertFormat("`", "`")} title="Inline Code">` Code`</button>
          <button type="button" className="btn btn-ghost btn-sm" style={{ fontFamily: "monospace", fontSize: "11px" }} onClick={() => insertFormat("```\n", "\n```")} title="Code Block">```</button>
          <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: "11px" }} onClick={() => insertFormat("> ", "")} title="Quote">&gt; Quote</button>
          
          <div style={{ width: "1px", background: "var(--border)", margin: "0 4px" }} />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            title="Chèn ảnh"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ fontSize: "11px" }}
          >
            {uploading ? "⏳ Đang tải..." : "🖼️ Chèn ảnh"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          maxLength={50000}
          rows={18}
          placeholder="Viết nội dung bài viết ở đây...&#10;&#10;Hỗ trợ Markdown: **in đậm**, _in nghiêng_, # Tiêu đề, - danh sách, > trích dẫn, ```code block```"
          className="form-input font-mono"
          style={{ borderRadius: "0 0 6px 6px", resize: "vertical", lineHeight: "1.7", fontSize: "13px" }}
        />
        <span className="form-hint">{content.length}/50,000 ký tự · Markdown được hỗ trợ</span>
      </div>

      {/* Uploaded images preview */}
      {images.length > 0 && (
        <div>
          <label className="form-label" style={{ marginBottom: "8px", display: "block" }}>
            Ảnh đính kèm ({images.length})
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {images.map((url, i) => (
              <div key={i} style={{ position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`upload ${i+1}`}
                  style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--border)" }}
                />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  style={{
                    position: "absolute", top: "-6px", right: "-6px",
                    width: "18px", height: "18px", borderRadius: "50%",
                    background: "var(--red)", color: "white",
                    fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publish toggle */}
      <div className="card" style={{ padding: "14px 16px", background: "var(--bg-base)" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            style={{ accentColor: "var(--accent)", width: "16px", height: "16px" }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: "13px" }}>
              {published ? "📢 Đăng công khai" : "📄 Lưu nháp"}
            </div>
            <div className="text-xs text-muted">
              {published
                ? "Bài viết sẽ hiển thị với tất cả thành viên sau khi Admin duyệt"
                : "Chỉ bạn có thể xem — có thể đăng sau"}
            </div>
          </div>
        </label>
      </div>

      {/* Error */}
      {error && <div className="alert alert-error">⚠ {error}</div>}

      {/* Actions */}
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary btn-lg"
          style={{ flex: 1 }}
        >
          {submitting ? "⏳ Đang lưu..." : published ? "📢 Đăng bài" : "💾 Lưu nháp"}
        </button>
        <Link href="/articles" className="btn btn-secondary btn-lg">Hủy</Link>
      </div>
    </form>
  );
}
