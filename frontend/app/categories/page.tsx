"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { SERVICES } from "@/lib/config";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function CategoriesPage() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories", "all"],
    queryFn: async () => {
      const res = await fetch(`${SERVICES.CATEGORY}/categories`);
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="text-2xl font-bold text-primary-700 mb-6 block"
          >
            FurniMart
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">
            Danh mục sản phẩm
          </h1>
          <p className="text-slate-600 mt-2">
            Khám phá các danh mục sản phẩm nội thất của chúng tôi
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-200 h-48 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories?.items?.map((category: Category) => (
              <Link
                key={category.id}
                href={`/products?categoryId=${category.id}`}
                className="group"
              >
                <div className="bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg p-8 min-h-48 flex flex-col justify-between hover:shadow-lg transition group-hover:from-primary-200">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary-700 transition">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-primary-700 font-semibold mt-4 group-hover:translate-x-1 transition">
                    Xem sản phẩm <FiArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
