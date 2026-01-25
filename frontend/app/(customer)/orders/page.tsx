"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { orderService } from "@/services/orderService";
import { useAuthStore } from "@/store/authStore";
import Card, { CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import PageShell from "@/components/layouts/PageShell";
import PageHeader from "@/components/layouts/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { formatCurrency, formatDate } from "@/lib/format";
import { Order, OrderItem } from "@/lib/types";
import { useState } from "react";
import OrderStatusBadge from "@/components/order/OrderStatusBadge";
import Pagination from "@/components/ui/Pagination";

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, user, accessToken, role, _hasHydrated } = useAuthStore();
  const [page, setPage] = useState(1);

  // Check authentication - redirect to login if not authenticated
  // Wait for hydration before checking
  useEffect(() => {
    if (!_hasHydrated) {
      return; // Wait for state to be restored
    }
    
    if (!isAuthenticated || !accessToken || !user) {
      router.push("/auth/login?redirect=/orders");
      return;
    }
    // Only allow customer role
    if (role && role !== "customer") {
      router.push("/");
      return;
    }
  }, [_hasHydrated, isAuthenticated, accessToken, user, role, router]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["orders", "my", page],
    queryFn: () => orderService.getMyOrders(),
    enabled: isAuthenticated && !!accessToken && !!user && role === "customer",
  });

  // Don't render if not hydrated or not authenticated
  if (!_hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated || !accessToken || !user || role !== "customer") {
    return null;
  }

  return (
    <PageShell>
      <PageHeader
        title="Đơn hàng của tôi"
        breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Đơn hàng" }]}
      />
      <main className="space-y-6">

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent>
                  <Skeleton className="h-6 w-1/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            title="Không thể tải đơn hàng"
            description="Vui lòng thử lại sau"
            action={{ label: "Thử lại", onClick: () => refetch() }}
          />
        ) : !data || data.length === 0 ? (
          <EmptyState
            title="Bạn chưa có đơn hàng nào"
            description="Bắt đầu mua sắm để tạo đơn hàng đầu tiên"
            action={{ label: "Tiếp tục mua sắm", onClick: () => window.location.href = "/products" }}
          />
        ) : (
          <>
            <div className="space-y-4">
              {data.filter((order: Order) => order && order.id).map((order: Order) => (
          <Card key={order.id} variant="outline">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-secondary-900">
                    Đơn hàng #{order.id.slice(0, 8)}
                  </h3>
                  <p className="text-sm text-secondary-600 mt-1">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="space-y-2 mb-4">
                {order.items?.map((item: OrderItem, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm text-secondary-700">
                    <span>
                      {item.product?.name || "Sản phẩm"} x {item.quantity}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-secondary-200">
                <div>
                  <p className="text-sm text-secondary-600">Tổng cộng</p>
                  <p className="text-xl font-semibold text-secondary-900">
                    {formatCurrency(order.totalAmount || order.totalPrice || 0)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/orders/${order.id}`} prefetch={false}>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      Chi tiết
                      <span>→</span>
                    </Button>
                  </Link>
                  {/* 2: Cancel order - chỉ khi chưa PACKING */}
                  {(order.status === "pending" || 
                    order.status === "PENDING_CONFIRMATION" || 
                    order.status === "confirmed" || 
                    order.status === "CONFIRMED") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
                          try {
                            await orderService.cancelOrder(order.id);
                            window.location.reload();
                          } catch (error: unknown) {
                            const message = error instanceof Error ? error.message : "Không thể hủy đơn hàng";
                            alert(message);
                          }
                        }
                      }}
                    >
                      Hủy đơn
                    </Button>
                  )}
                </div>
              </div>
                </CardContent>
              </Card>
              ))}
            </div>

          </>
        )}
      </main>
    </PageShell>
  );
}

