"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { categoryService } from "@/services/categoryService";
import PageShell from "@/components/layouts/PageShell";
import PageHeader from "@/components/layouts/PageHeader";
import Card, { CardContent } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { normalizeImageUrl } from "@/lib/imageUtils";

export default function CategoriesPage() {
  const { data: categories, isLoading, isError, refetch } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getCategories(),
  });

  return (
    <PageShell>
      <PageHeader
        title="Danh mục sản phẩm"
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Danh mục" },
        ]}
      />
      <main className="space-y-8">
        <section className="rounded-2xl border border-secondary-200 bg-gradient-to-br from-white via-white to-secondary-50 p-6 md:p-8">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
              Khám phá bộ sưu tập
            </p>
            <h2 className="text-2xl font-semibold text-secondary-900 md:text-3xl">
              Danh mục được sắp xếp rõ ràng, dễ lựa chọn
            </h2>
            <p className="text-secondary-600">
              Chọn danh mục phù hợp để xem nhanh các sản phẩm nổi bật, chất liệu mới và xu hướng
              đang được yêu thích.
            </p>
          </div>
        </section>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} variant="elevated">
                <CardContent className="p-5">
                  <Skeleton className="h-40 w-full rounded-xl mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            title="Không thể tải danh mục"
            description="Vui lòng thử lại sau"
            action={{ label: "Thử lại", onClick: () => refetch() }}
          />
        ) : categories && categories.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => {
              const imageUrl = normalizeImageUrl(category.image) || category.image;
              const initial = category.name?.charAt(0)?.toUpperCase() || "D";
              return (
                <Link key={category.id} href={`/products?categoryId=${category.id}`}>
                  <Card
                    variant="elevated"
                    hoverable
                    className="group h-full overflow-hidden border-secondary-100"
                  >
                    <div className="relative h-44 w-full overflow-hidden bg-secondary-100">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={category.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 via-secondary-100 to-secondary-200">
                          <span className="text-3xl font-semibold text-primary-700">
                            {initial}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-secondary-700 shadow-sm">
                        Bộ sưu tập
                      </span>
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-700">
                            {category.name}
                          </h3>
                          {category.description && (
                            <p className="mt-2 text-sm text-secondary-600 line-clamp-2">
                              {category.description}
                            </p>
                          )}
                        </div>
                        <span className="mt-1 text-sm font-medium text-primary-600">→</span>
                      </div>
                      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-secondary-500">
                        Xem sản phẩm
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card variant="outline">
            <CardContent className="py-12">
              <div className="text-center text-secondary-500">
                <p>Chưa có danh mục nào</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </PageShell>
  );
}
