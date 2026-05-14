"use client";

import { useState, useRef } from "react";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  defaultValue?: string;
}

export default function ImageUpload({ onUpload, defaultValue = "" }: ImageUploadProps) {
  const [preview, setPreview] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Hiển thị preview ngay lập tức
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Bắt đầu upload
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        onUpload(data.url);
      } else {
        alert(data.error || "Upload thất bại");
      }
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi khi tải ảnh lên");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card" style={{ padding: "24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div 
        onClick={() => fileInputRef.current?.click()}
        style={{ 
          width: "100%", 
          height: "200px", 
          borderRadius: "12px", 
          background: "var(--bg-base)", 
          border: "1px dashed var(--border)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "var(--transition-base)",
          overflow: "hidden",
          position: "relative"
        }}
      >
        {preview ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📸</div>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>Tải ảnh lên</div>
            <div style={{ fontSize: "11px", color: "var(--fg-muted)" }}>Hỗ trợ JPG, PNG, WebP</div>
          </>
        )}

        {uploading && (
          <div style={{ 
            position: "absolute", 
            inset: 0, 
            background: "rgba(0,0,0,0.6)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            fontSize: "12px",
            color: "white"
          }}>
            Đang tải lên...
          </div>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        style={{ display: "none" }} 
        accept="image/*"
      />
      
      <p style={{ marginTop: "12px", fontSize: "11px", color: "var(--fg-muted)" }}>
        Nhấp vào khung để chọn hoặc thay đổi ảnh minh họa.
      </p>
    </div>
  );
}
