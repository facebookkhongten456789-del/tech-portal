import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import ProductForm from "@/components/ProductForm";

async function addProduct(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN" || !(session.user as any).isApproved) {
    redirect("/dashboard");
  }

  const name = formData.get("name") as string;
  const sku = formData.get("sku") as string;
  const price = parseFloat(formData.get("price") as string) || 0;
  const stock = parseInt(formData.get("stock") as string) || 0;
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const image = formData.get("image") as string; // Lấy URL ảnh từ form

  if (!name || !sku) return;

  try {
    await prisma.product.create({
      data: { name, sku, price, stock, category, description, image },
    });
    revalidatePath("/products");
  } catch (err) {
    console.error("[add_product_error]", err);
  }
  redirect("/products");
}

export default async function NewProductPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isApproved = (session.user as any).isApproved === true;
  const isAdmin = session.user?.role === "ADMIN" && isApproved;

  if (!isAdmin) redirect("/products");

  return (
    <>
      <header className="page-header" style={{ background: "transparent", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="page-header-left">
          <div className="page-title" style={{ fontSize: "18px", letterSpacing: "0.02em" }}>Nhập kho sản phẩm mới</div>
          <div className="breadcrumb">
            <span>TechPortal</span><span>›</span>
            <span>Kho hàng</span><span>›</span>
            <span style={{ color: "var(--accent)" }}>Thêm mới</span>
          </div>
        </div>
      </header>

      <div className="page-body animate-in" style={{ maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
        
        {/* Decorative Grid Background */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, height: "400px",
          backgroundImage: "linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          zIndex: -1,
          maskImage: "linear-gradient(to bottom, black, transparent)",
          pointerEvents: "none"
        }} />

        <ProductForm addProductAction={addProduct} />
      </div>
    </>
  );
}
