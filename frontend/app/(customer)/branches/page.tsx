"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { branchService } from "@/services/branchService";
import Card, { CardContent } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import PageShell from "@/components/layouts/PageShell";
import PageHeader from "@/components/layouts/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { routes } from "@/lib/config/routes";

export default function BranchesPage() {
  const { data: branches, isLoading, isError, refetch } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchService.getBranches(),
  });

  return (
    <PageShell>
      <PageHeader
        title="Chi nhánh"
        breadcrumbs={[{ label: "Trang chủ", href: routes.home }, { label: "Chi nhánh" }]}
      />
      <main className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent>
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            title="Không thể tải danh sách chi nhánh"
            description="Vui lòng thử lại sau"
            action={{ label: "Thử lại", onClick: () => refetch() }}
          />
        ) : branches && branches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.filter(branch => branch && branch.id).map((branch) => (
              <Link key={branch.id} href={routes.branchDetail(branch.id)} prefetch={false}>
                <Card className="hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200 cursor-pointer [@media(prefers-reduced-motion:reduce)]:hover:translate-y-0">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-secondary-900">{branch.name}</h3>
                    <p className="text-secondary-600 mb-2">
                      {typeof branch.address === 'string' 
                        ? branch.address 
                        : branch.address 
                          ? `${branch.address.street || ''}, ${branch.address.ward || ''}, ${branch.address.district || ''}, ${branch.address.city || ''}`
                          : 'N/A'}
                    </p>
                    <p className="text-secondary-500 text-sm">{branch.phone}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có chi nhánh nào"
            description="Chi nhánh sẽ được hiển thị tại đây khi có dữ liệu"
          />
        )}
      </main>
    </PageShell>
  );
}

