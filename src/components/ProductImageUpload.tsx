"use client";

import { useState, useRef } from "react";

export default function ProductImageUpload({ defaultValue = "" }: { defaultValue?: string }) {
  const [image, setImage] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setImage(data.url);
      } else {
        alert(data.error || "Upload lỗi");
      }
    } catch {
      alert("Lỗi upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">Hình ảnh sản phẩm mẫu</label>
      <input type="hidden" name="image" value={image} />
      <div style={{ display: "flex", gap: "12px", alignItems: "start" }}>
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{ 
            width: "100px", height: "100px", borderRadius: "8px", border: "2px dashed var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            background: "var(--bg-elevated)", position: "relative", overflow: "hidden"
          }}
        >
          {image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={image} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: "24px", color: "var(--fg-muted)" }}>📷</span>
          )}
          {uploading && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "10px" }}>
              ⏳...
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>
            {image ? "Thay đổi ảnh" : "Tải ảnh lên"}
          </button>
          <div className="form-hint" style={{ marginTop: "4px" }}>Hỗ trợ JPG, PNG, WebP (Max 5MB)</div>
        </div>
      </div>
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        style={{ display: "none" }} 
        onChange={handleFileChange} 
      />
    </div>
  );
}
