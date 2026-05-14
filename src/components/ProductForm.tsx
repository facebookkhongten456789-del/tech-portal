"use client";

import { useState } from "react";
import Link from "next/link";
import ImageUpload from "./ImageUpload";

interface ProductFormProps {
  addProductAction: (formData: FormData) => Promise<void>;
}

export default function ProductForm({ addProductAction }: ProductFormProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    if (imageUrl) {
      formData.set("image", imageUrl);
    }
    
    await addProductAction(formData);
    setLoading(false);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "32px", alignItems: "start" }}>
      {/* Main Form Card */}
      <div className="card" style={{ padding: "32px", background: "rgba(10, 10, 10, 0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ fontSize: "24px" }}>📦</span>
            <h2 style={{ fontSize: "20px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Thông tin chi tiết</h2>
          </div>
          <p style={{ color: "var(--fg-muted)", fontSize: "13px" }}>Vui lòng điền đầy đủ các thông tin kỹ thuật của sản phẩm để lưu trữ vào hệ thống.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div className="form-group">
              <label className="form-label">Tên sản phẩm <span className="required">*</span></label>
              <input name="name" className="form-input" placeholder="Ví dụ: Camera IP Hikvision 2MP" required />
            </div>
            <div className="form-group">
              <label className="form-label">Mã SKU <span className="required">*</span></label>
              <input name="sku" className="form-input" placeholder="Ví dụ: HKV-2MP-001" required />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div className="form-group">
              <label className="form-label">Giá nhập (VNĐ)</label>
              <input name="price" type="number" className="form-input" placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Số lượng nhập</label>
              <input name="stock" type="number" className="form-input" placeholder="0" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Danh mục sản phẩm</label>
            <select name="category" className="form-input" style={{ appearance: "none" }}>
              <option value="Điện thoại">📱 Điện thoại</option>
              <option value="Linh kiện điện thoại">🔌 Linh kiện điện thoại</option>
              <option value="Thiết bị an ninh">🛡️ Thiết bị an ninh</option>
              <option value="Phụ kiện mạng">🌐 Phụ kiện mạng</option>
              <option value="Linh kiện máy tính">💻 Linh kiện máy tính</option>
              <option value="Dụng cụ kỹ thuật">🔧 Dụng cụ kỹ thuật</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Mô tả chi tiết</label>
            <textarea 
              name="description" 
              className="form-input" 
              rows={5} 
              placeholder="Thông tin thêm về cấu hình, bảo hành..."
              style={{ resize: "none" }}
            />
          </div>

          <div style={{ marginTop: "12px", display: "flex", gap: "12px" }}>
            <button 
              type="submit" 
              className="btn btn-primary btn-lg" 
              disabled={loading}
              style={{ flex: 1, height: "48px", fontSize: "15px", fontWeight: 700 }}
            >
              {loading ? "Đang xử lý..." : "⚡ Xác nhận nhập kho"}
            </button>
            <Link href="/products" className="btn btn-secondary btn-lg" style={{ height: "48px" }}>
              Hủy bỏ
            </Link>
          </div>
        </form>
      </div>

      {/* Sidebar / Image Upload */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ position: "sticky", top: "84px" }}>
          <div style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--accent)" }}>
            🖼️ Ảnh minh họa
          </div>
          <ImageUpload onUpload={(url) => setImageUrl(url)} />
          
          <div className="card" style={{ padding: "20px", marginTop: "24px", background: "rgba(59, 130, 246, 0.05)", borderColor: "rgba(59, 130, 246, 0.2)" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>🛡️ Hướng dẫn</h3>
            <ul style={{ paddingLeft: "18px", color: "var(--fg-secondary)", fontSize: "12px", lineHeight: "1.8" }}>
              <li>Tải ảnh rõ nét để kỹ thuật viên dễ nhận diện.</li>
              <li>Mã SKU là duy nhất cho mỗi mặt hàng.</li>
              <li>Giá nhập nên được kiểm tra kỹ với hóa đơn.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
