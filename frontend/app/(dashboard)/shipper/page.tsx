"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { orderService } from "@/services/orderService";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import PageHeader from "@/components/layouts/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { Order } from "@/lib/types";
import Link from "next/link";
import { formatCurrency, formatShippingAddress } from "@/lib/format";
import { routes } from "@/lib/config/routes";

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case "READY_TO_SHIP":
      return "bg-info/10 text-info";
    case "SHIPPING":
      return "bg-info/10 text-info";
    case "DELIVERED":
      return "bg-success/10 text-success";
    case "FAILED_DELIVERY":
      return "bg-danger/10 text-danger";
    default:
      return "bg-secondary-100 text-secondary-700";
  }
};

const getStatusLabel = (status: string) => {
  switch (status?.toUpperCase()) {
    case "READY_TO_SHIP":
      return "Sẵn sàng giao";
    case "SHIPPING":
      return "Đang giao";
    case "DELIVERED":
      return "Đã giao";
    case "FAILED_DELIVERY":
      return "Giao thất bại";
    default:
      return status;
  }
};

export default function ShipperDashboard() {
  const { user } = useAuthStore();
  const branchId = user?.branchId;

  const { data: orders, isLoading, isError, refetch } = useQuery({
    queryKey: ["orders", "shipper", branchId],
    queryFn: () => orderService.getOrdersForShipper(),
    enabled: !!branchId,
  });

  const readyToShipCount = orders?.filter((o: Order) => o.status.toUpperCase() === "READY_TO_SHIP").length || 0;
  const shippingCount = orders?.filter((o: Order) => o.status.toUpperCase() === "SHIPPING").length || 0;
  const deliveredCount = orders?.filter((o: Order) => o.status.toUpperCase() === "DELIVERED").length || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Giao hàng"
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
        ) : isError ? (
          <ErrorState
            title="Không thể tải dữ liệu"
            description="Vui lòng thử lại sau"
            action={{ label: "Thử lại", onClick: () => refetch() }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card variant="outline">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-secondary-500">
                    Đơn sẵn sàng giao
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-medium text-info">{readyToShipCount}</p>
                  )}
                </CardContent>
              </Card>

              <Card variant="outline">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-secondary-500">
                    Đang giao
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-medium text-info">{shippingCount}</p>
                  )}
                </CardContent>
              </Card>

              <Card variant="outline">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-secondary-500">
                    Đã giao
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-medium text-success">{deliveredCount}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Đơn hàng được phân công</CardTitle>
                  <Link
                    href={routes.shipper.deliveries}
                    className="text-sm text-secondary-900 hover:text-secondary-700 font-medium transition-colors duration-200"
                  >
                    Xem tất cả →
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : !orders || orders.length === 0 ? (
                  <EmptyState
                    title="Chưa có đơn hàng nào được phân công"
                    description="Đơn hàng được phân công sẽ hiển thị tại đây"
                  />
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order: Order) => (
                      <Link
                        key={order.id}
                        href={routes.shipper.deliveryDetail(order.id)}
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
                              {typeof order.shippingAddress === 'string'
                                ? order.shippingAddress
                                : formatShippingAddress(order.shippingAddress)}
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

