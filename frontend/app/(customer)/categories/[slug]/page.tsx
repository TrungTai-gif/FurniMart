"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { categoryService } from "@/services/categoryService";
import { productService } from "@/services/productService";
import PageShell from "@/components/layouts/PageShell";
import PageHeader from "@/components/layouts/PageHeader";
import ProductGrid from "@/components/product/ProductGrid";
import FilterSidebar from "@/components/product/FilterSidebar";
import Select from "@/components/ui/Select";
import Pagination from "@/components/ui/Pagination";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { useState } from "react";

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [filters, setFilters] = useState({
    categoryId: "",
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    rating: undefined as number | undefined,
  });
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");

  const { data: category, isLoading: categoryLoading, isError: categoryError } = useQuery({
    queryKey: ["category", slug],
    queryFn: () => categoryService.getCategoryBySlug(slug),
  });

  const { data: products, isLoading: productsLoading, isError: productsError, refetch } = useQuery({
    queryKey: ["products", "category", slug, filters, page, sortBy],
    queryFn: () =>
      productService.getProducts({
        categoryId: category?.id || filters.categoryId || undefined,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        page,
        limit: 12,
      }),
    enabled: !!category,
  });

  if (categoryLoading) {
    return (
      <PageShell>
        <PageHeader title="Danh mục" />
        <Skeleton className="h-64 w-full" />
      </PageShell>
    );
  }

  if (categoryError || !category) {
    return (
      <PageShell>
        <PageHeader title="Danh mục" />
        <ErrorState
          title="Không tìm thấy danh mục"
          description="Danh mục không tồn tại hoặc đã bị xóa"
          action={{ label: "Quay lại", onClick: () => window.location.href = "/categories" }}
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title={category.name}
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Danh mục", href: "/categories" },
          { label: category.name },
        ]}
      />
      <main className="space-y-6">
        {category.description && (
          <div className="bg-secondary-50 rounded-lg p-6">
            <p className="text-secondary-700">{category.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <FilterSidebar
              categories={[]}
              filters={filters}
              onFilterChange={(newFilters) => {
                setFilters({
                  categoryId: newFilters.categoryId || "",
                  minPrice: newFilters.minPrice,
                  maxPrice: newFilters.maxPrice,
                  rating: newFilters.rating,
                });
                setPage(1);
              }}
            />
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3 space-y-4">
            {/* Sort Bar */}
            <div className="flex items-center justify-between py-3 bg-secondary-50 rounded-md px-4 mb-4">
              <p className="text-sm font-medium text-secondary-700">
                {products?.total ? `${products.total} sản phẩm` : "Đang tải..."}
              </p>
              <Select
                options={[
                  { value: "newest", label: "Mới nhất" },
                  { value: "price_asc", label: "Giá tăng dần" },
                  { value: "price_desc", label: "Giá giảm dần" },
                  { value: "name_asc", label: "Tên A-Z" },
                ]}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-48"
              />
            </div>

            {/* Products */}
            {productsError ? (
              <ErrorState
                title="Không thể tải sản phẩm"
                description="Vui lòng thử lại sau"
                action={{ label: "Thử lại", onClick: () => refetch() }}
              />
            ) : (
              <>
                <ProductGrid
                  products={products?.items}
                  isLoading={productsLoading}
                  columns={3}
                />
                {products && products.totalPages > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={products.totalPages}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </PageShell>
  );
}

