"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import Input from "@/components/ui/Input";
import PageShell from "@/components/layouts/PageShell";
import PageHeader from "@/components/layouts/PageHeader";
import ErrorState from "@/components/ui/ErrorState";
import { useDebounce } from "@/hooks/useDebounce";
import ProductGrid from "@/components/product/ProductGrid";
import FilterSidebar from "@/components/product/FilterSidebar";
import Select from "@/components/ui/Select";
import Pagination from "@/components/ui/Pagination";
import { FiSearch, FiFilter } from "react-icons/fi";
import Drawer from "@/components/ui/Drawer";
import { routes } from "@/lib/config/routes";
import Section from "@/components/ui/Section";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    categoryId: "",
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    rating: undefined as number | undefined,
  });
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 500);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getCategories(),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["products", debouncedSearch, filters, page, sortBy],
    queryFn: () =>
      productService.getProducts({
        search: debouncedSearch || undefined,
        categoryId: filters.categoryId || undefined,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        page,
        limit: 12,
      }),
  });

  return (
    <div className="min-h-screen bg-background">
      <PageShell className="pt-6 md:pt-8">
        <PageHeader
          title="Sản phẩm"
          breadcrumbs={[{ label: "Trang chủ", href: routes.home }, { label: "Sản phẩm" }]}
        />
      </PageShell>

      <Section size="md" className="pt-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-12"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12 w-full max-w-full overflow-x-hidden">
          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block lg:col-span-1 w-full max-w-full">
            <FilterSidebar
              categories={categories}
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
          <div className="lg:col-span-3 space-y-6 w-full max-w-full overflow-x-hidden">
            {/* Sort Bar */}
            <div className="flex items-center justify-between py-3 bg-secondary-50 rounded-md px-4 mb-4">
              <p className="text-sm font-medium text-secondary-700">
                {data?.total ? `${data.total} sản phẩm` : "Đang tải..."}
              </p>
              <div className="flex items-center gap-4">
                {/* Mobile Filter Button */}
                {(() => {
                  const activeFilterCount = [
                    filters.categoryId ? 1 : 0,
                    filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0,
                    filters.rating !== undefined ? 1 : 0,
                  ].reduce((a, b) => a + b, 0);

                  return (
                    <button
                      onClick={() => setMobileFilterOpen(true)}
                      className="lg:hidden flex items-center gap-2 px-4 py-2 border border-secondary-300 rounded-md text-sm font-medium text-secondary-700 hover:bg-white hover:border-primary-500 transition-colors relative"
                    >
                      <FiFilter className="w-4 h-4" />
                      Bộ lọc
                      {activeFilterCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  );
                })()}
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
            </div>

            {/* Products */}
            {isError ? (
              <ErrorState
                title="Không thể tải sản phẩm"
                description="Vui lòng thử lại sau"
                action={{ label: "Thử lại", onClick: () => refetch() }}
              />
            ) : (
              <>
                <ProductGrid
                  products={data?.items}
                  isLoading={isLoading}
                  columns={3}
                />
                {data && data.totalPages > 1 && (
                  <div className="pt-8">
                    <Pagination
                      currentPage={page}
                      totalPages={data.totalPages}
                      onPageChange={setPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        <Drawer
          isOpen={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
          title="Bộ lọc"
        >
          <FilterSidebar
            categories={categories}
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
        </Drawer>
      </Section>
    </div>
  );
}

