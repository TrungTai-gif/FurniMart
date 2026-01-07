"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FiArrowRight, FiStar } from "react-icons/fi";

interface Product {
  id: string;
  name: string;
  price: number;
  discount?: number;
  images?: string[];
  isFeatured?: boolean;
  rating?: number;
}

export default function HomePage() {
  const { data: featuredProducts, isLoading } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
          }/products/featured`
        );
        if (!response.ok) return [];
        return response.json();
      } catch {
        return [];
      }
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-700">FurniMart</h1>
          <div className="flex gap-6">
            <Link
              href="/products"
              className="hover:text-primary-600 transition"
            >
              Sản phẩm
            </Link>
            <Link
              href="/categories"
              className="hover:text-primary-600 transition"
            >
              Danh mục
            </Link>
            <Link
              href="/promotions"
              className="hover:text-primary-600 transition"
            >
              Khuyến mãi
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-6">
          <h2 className="text-5xl md:text-6xl font-bold text-slate-900">
            Nội thất chất lượng cho nhà của bạn
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Khám phá bộ sưu tập nội thất hiện đại với giá cạnh tranh từ các chi
            nhánh FurniMart
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition font-semibold"
          >
            Khám phá ngay <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-12">
          <h3 className="text-3xl font-bold text-slate-900">
            Sản phẩm nổi bật
          </h3>
          <Link
            href="/products?featured=true"
            className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-2"
          >
            Xem tất cả <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-200 h-64 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts?.slice(0, 4).map((product: Product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group"
              >
                <div className="bg-slate-100 rounded-lg overflow-hidden h-64 mb-4 flex items-center justify-center group-hover:bg-slate-200 transition">
                  {product.images?.[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  )}
                </div>
                <h4 className="font-semibold text-slate-900 group-hover:text-primary-600 transition line-clamp-2">
                  {product.name}
                </h4>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-primary-600">
                    {product.price.toLocaleString("vi-VN")}đ
                  </span>
                  {product.rating && (
                    <div className="flex items-center gap-1">
                      <FiStar className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {product.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Categories Section */}
      <section className="bg-gradient-to-r from-slate-100 to-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-3xl font-bold text-slate-900">
              Danh mục sản phẩm
            </h3>
            <Link
              href="/categories"
              className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-2"
            >
              Xem tất cả <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-center text-slate-600 mb-8">
            Duyệt qua các danh mục để tìm sản phẩm yêu thích của bạn
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 FurniMart. Tất cả quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  );
}
