"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { orderService } from "@/services/orderService";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import PageHeader from "@/components/layouts/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { Order } from "@/lib/types";
import Link from "next/link";
import { formatCurrency, formatShippingAddress } from "@/lib/format";
import { routes } from "@/lib/config/routes";

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case "CONFIRMED":
      return "bg-success/10 text-success";
    case "PACKING":
      return "bg-warning/10 text-warning";
    case "OUT_FOR_DELIVERY":
      return "bg-info/10 text-info";
    case "DELIVERED":
      return "bg-success/10 text-success";
    default:
      return "bg-secondary-100 text-secondary-700";
  }
};

const getStatusLabel = (status: string) => {
  switch (status?.toUpperCase()) {
    case "CONFIRMED":
      return "Đã xác nhận";
    case "PACKING":
      return "Đang đóng gói";
    case "OUT_FOR_DELIVERY":
      return "Đang giao";
    case "DELIVERED":
      return "Đã giao";
    default:
      return status;
  }
};

export default function EmployeeDashboard() {
  const { user } = useAuthStore();
  const branchId = user?.branchId;

  const { data: orders, isLoading, isError, refetch } = useQuery({
    queryKey: ["orders", "employee", branchId],
    queryFn: () => orderService.getOrders(1, 10, { status: "CONFIRMED" }),
    enabled: !!branchId,
  });

  const confirmedCount = orders?.items?.filter((o: Order) => o.status === "CONFIRMED" || o.status === "confirmed").length || 0;
  const packingCount = orders?.items?.filter((o: Order) => o.status === "PACKING").length || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Nhân viên"
        breadcrumbs={[{ label: "Dashboard" }]}
      />
      <div className="space-y-6">
        {!branchId ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-stone-600">
                Bạn chưa được gán cho chi nhánh nào. Vui lòng liên hệ quản trị viên.
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card variant="outline">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-secondary-500">
                    Đơn chờ xác nhận
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-medium text-warning">{confirmedCount}</p>
                  )}
                </CardContent>
              </Card>

              <Card variant="outline">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-secondary-500">
                    Đơn đang đóng gói
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-medium text-info">{packingCount}</p>
                  )}
                </CardContent>
              </Card>

              <Card variant="outline">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-secondary-500">
                    Tổng đơn hàng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-medium text-secondary-900">{orders?.total || 0}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Đơn hàng gần đây</CardTitle>
                  <Link
                    href="/employee/orders"
                    className="text-sm text-secondary-900 hover:text-secondary-700 font-medium transition-colors duration-200"
                  >
                    Xem tất cả →
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {isError ? (
                  <ErrorState
                    title="Không thể tải đơn hàng"
                    description="Vui lòng thử lại sau"
                    action={{ label: "Thử lại", onClick: () => refetch() }}
                  />
                ) : isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : !orders?.items || orders.items.length === 0 ? (
                  <div className="text-center py-8 text-stone-500">
                    Chưa có đơn hàng nào
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders?.items.filter((order: Order) => order && order.id).slice(0, 5).map((order: Order) => (
                      <Link
                        key={order.id}
                        href={`/employee/orders/${order.id}`}
                        prefetch={false}
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
                              {formatShippingAddress(order.shippingAddress)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-secondary-900">
                              {formatCurrency(order.totalPrice || order.totalAmount || 0)}
                            </p>
                            <p className="text-xs text-secondary-500 mt-1">
                              {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

