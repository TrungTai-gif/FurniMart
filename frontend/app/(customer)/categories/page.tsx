"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { categoryService } from "@/services/categoryService";
import PageShell from "@/components/layouts/PageShell";
import PageHeader from "@/components/layouts/PageHeader";
import Card, { CardContent } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";

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
      <main className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link key={category.id} href={`/products?categoryId=${category.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                    {category.description && (
                      <p className="text-secondary-600 text-sm line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
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

