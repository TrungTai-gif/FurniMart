"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FiSearch, FiFilter, FiStar } from "react-icons/fi";
import { SERVICES } from "@/lib/config";

interface Product {
  id: string;
  name: string;
  price: number;
  discount?: number;
  images?: string[];
  rating?: number;
  categoryId?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch(`${SERVICES.CATEGORY}/categories`);
      return res.json();
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", search, selectedCategory, sortBy, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategory) params.append("categoryId", selectedCategory);
      params.append("page", page.toString());
      params.append("limit", "12");

      const res = await fetch(
        `${SERVICES.PRODUCT}/products?${params.toString()}`
      );
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="text-2xl font-bold text-primary-700 mb-6 block"
          >
            FurniMart
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Sản phẩm</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <div className="hidden lg:block space-y-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Tìm kiếm
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nhập tên sản phẩm..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Danh mục
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Tất cả</option>
                {categories?.items?.map((cat: Category) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Sắp xếp
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
                <option value="rating">Đánh giá cao</option>
              </select>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Mobile Filter Bar */}
            <div className="lg:hidden mb-6 flex gap-2">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
              />
              <button className="px-4 py-2 border border-slate-300 rounded-lg flex items-center gap-2">
                <FiFilter className="w-4 h-4" /> Bộ lọc
              </button>
            </div>

            {/* Product Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-slate-200 h-64 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products?.items?.map((product: Product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="group bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition"
                    >
                      <div className="bg-slate-100 h-64 flex items-center justify-center overflow-hidden">
                        {product.images?.[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-primary-600 transition">
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-lg font-bold text-primary-600">
                            {product.price.toLocaleString("vi-VN")}đ
                          </span>
                          {product.rating && (
                            <div className="flex items-center gap-1">
                              <FiStar className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">
                                {product.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {products?.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-12">
                    {[...Array(products.totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`px-4 py-2 rounded-lg transition ${
                          page === i + 1
                            ? "bg-primary-600 text-white"
                            : "bg-white border border-slate-300 hover:border-primary-600"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
