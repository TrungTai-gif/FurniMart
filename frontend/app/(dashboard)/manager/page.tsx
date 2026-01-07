"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboardService";
import { orderService } from "@/services/orderService";
import { useAuthStore } from "@/store/authStore";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import PageHeader from "@/components/layouts/PageHeader";
import ErrorState from "@/components/ui/ErrorState";
import { formatCurrency } from "@/lib/format";
import { Order } from "@/lib/types";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { routes } from "@/lib/config/routes";

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    PENDING_CONFIRMATION: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    PACKING: "Đang đóng gói",
    READY_TO_SHIP: "Sẵn sàng giao",
    SHIPPING: "Đang giao",
    DELIVERED: "Đã giao",
    COMPLETED: "Hoàn tất",
    CANCELLED: "Đã hủy",
    FAILED_DELIVERY: "Giao thất bại",
    // Legacy
    confirmed: "Đã xác nhận",
    packing: "Đang đóng gói",
    shipping: "Đang giao",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
    OUT_FOR_DELIVERY: "Đang giao",
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: string) => {
  const normalized = status.toUpperCase();
  if (normalized === "CONFIRMED" || normalized === "DELIVERED" || normalized === "COMPLETED") {
    return "bg-success/10 text-success";
  }
  if (normalized === "PENDING_CONFIRMATION" || normalized === "PACKING" || normalized === "READY_TO_SHIP" || normalized === "SHIPPING") {
    return "bg-warning/10 text-warning";
  }
  if (normalized === "CANCELLED" || normalized === "FAILED_DELIVERY") {
    return "bg-error/10 text-error";
  }
  return "bg-secondary-100 text-secondary-700";
};

export default function ManagerDashboard() {
  const { user } = useAuthStore();
  const branchId = user?.branchId;

  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", "branch", branchId],
    queryFn: () => dashboardService.getBranchStats(branchId || ""),
    enabled: !!branchId,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", "manager", branchId],
    queryFn: () => orderService.getOrders(1, 10),
    enabled: !!branchId,
  });

  if (!branchId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard Quản lý chi nhánh"
          breadcrumbs={[{ label: "Dashboard" }]}
        />
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-stone-500">
              <p className="text-lg font-medium mb-2">Bạn chưa được gán cho chi nhánh nào</p>
              <p className="text-sm">Vui lòng liên hệ quản trị viên để được gán chi nhánh.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Quản lý chi nhánh"
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      {/* Stats Cards */}
      {isError ? (
        <ErrorState
          title="Không thể tải thống kê"
          description="Vui lòng thử lại sau"
          action={{ label: "Thử lại", onClick: () => refetch() }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="outline">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-secondary-500">
                Tổng đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-3xl font-medium text-secondary-900">{stats?.totalOrders || 0}</p>
              )}
            </CardContent>
          </Card>

          <Card variant="outline">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-secondary-500">
                Doanh thu
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
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
                Đơn chờ xử lý
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-3xl font-medium text-warning">
                  {stats?.pendingOrders || 0}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Đơn hàng gần đây</CardTitle>
            <Link href={routes.manager.orders}>
              <Button variant="ghost" size="sm">
                Xem tất cả →
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !orders?.items || orders.items.length === 0 ? (
            <div className="text-center py-8 text-stone-500">
              Chưa có đơn hàng nào
            </div>
          ) : (
            <div className="space-y-4">
              {orders.items.slice(0, 5).map((order: Order) => (
                <Link
                  key={order.id}
                  href={`/manager/orders`}
                  className="block p-4 bg-secondary-50 rounded-md border border-secondary-200 hover:border-secondary-300 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-secondary-900">
                          Đơn hàng #{order.id.slice(-8).toUpperCase()}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(order.status)}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-secondary-600 mt-1">
                        {order.user?.fullName || order.user?.name || "Khách hàng"} • {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-secondary-900">
                        {formatCurrency(order.totalPrice || order.totalAmount || 0)}
                      </p>
                      <p className="text-xs text-secondary-500 mt-1">
                        {order.items?.length || 0} sản phẩm
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
