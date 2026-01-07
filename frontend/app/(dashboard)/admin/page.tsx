"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboardService";
import { branchService } from "@/services/branchService";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import PageHeader from "@/components/layouts/PageHeader";
import ErrorState from "@/components/ui/ErrorState";
import { formatCurrency } from "@/lib/format";
import { Branch } from "@/lib/types";
import dynamic from "next/dynamic";
import Link from "next/link";
import { routes } from "@/lib/config/routes";

// Lazy load charts
const RevenueChart = dynamic(() => import("@/components/dashboard/RevenueChart"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-64" />,
});

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => dashboardService.getStats(),
  });

  const { data: revenue, isLoading: revenueLoading, isError: revenueError, refetch: refetchRevenue } = useQuery({
    queryKey: ["dashboard", "revenue"],
    queryFn: () => dashboardService.getRevenueChart(30),
  });

  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ["branches", "all"],
    queryFn: () => branchService.getBranches(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Quản trị"
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      {/* Stats Cards */}
      {statsError ? (
        <ErrorState
          title="Không thể tải thống kê"
          description="Vui lòng thử lại sau"
          action={{ label: "Thử lại", onClick: () => refetchStats() }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card variant="outline">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-secondary-500">
                Tổng đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-3xl font-medium text-secondary-900">{stats?.totalOrders || 0}</p>
              )}
            </CardContent>
          </Card>

          <Card variant="outline">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-secondary-500">
                Tổng doanh thu
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-3xl font-medium text-secondary-900">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card variant="outline">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-secondary-500">
                Tổng sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-3xl font-medium text-secondary-900">{stats?.totalProducts || 0}</p>
              )}
            </CardContent>
          </Card>

          <Card variant="outline">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-secondary-500">
                Tổng người dùng
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-3xl font-medium text-secondary-900">{stats?.totalUsers || 0}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Chart */}
      {revenueError ? (
        <ErrorState
          title="Không thể tải biểu đồ doanh thu"
          description="Vui lòng thử lại sau"
          action={{ label: "Thử lại", onClick: () => refetchRevenue() }}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo thời gian</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="w-full h-64" />
            ) : (
              <RevenueChart data={revenue || []} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Branch Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Báo cáo theo chi nhánh</CardTitle>
            <Link
              href={routes.admin.branches}
              className="text-sm text-secondary-900 hover:text-secondary-700 font-medium transition-colors duration-200"
            >
              Xem tất cả →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {branchesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !branches || branches.length === 0 ? (
            <div className="text-center py-8 text-stone-500">
              Chưa có chi nhánh nào
            </div>
          ) : (
            <div className="space-y-4">
              {branches.slice(0, 5).map((branch: Branch) => (
                <div
                  key={branch.id}
                  className="flex items-center justify-between p-4 bg-secondary-50 rounded-md border border-secondary-200 hover:border-secondary-300 transition-colors duration-200"
                >
                  <div>
                    <h4 className="font-medium text-secondary-900">{branch.name}</h4>
                    <p className="text-sm text-secondary-600 mt-1">
                      {typeof branch.address === 'string'
                        ? branch.address
                        : `${branch.address?.street || ''}, ${branch.address?.ward || ''}, ${branch.address?.district || ''}, ${branch.address?.city || ''}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-secondary-500">Doanh thu</p>
                    <p className="font-medium text-secondary-900">
                      {formatCurrency(branch.totalRevenue || 0)}
                    </p>
                    <p className="text-xs text-secondary-500 mt-1">
                      {branch.totalOrders || 0} đơn hàng
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

