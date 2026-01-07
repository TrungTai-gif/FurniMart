"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { orderService } from "@/services/orderService";
import PageHeader from "@/components/layouts/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import FilterBar from "@/components/dashboard/FilterBar";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Badge from "@/components/ui/Badge";
import { Order } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { FiPackage } from "react-icons/fi";
import { toast } from "react-toastify";
import Link from "next/link";

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "default" }> = {
    PENDING_CONFIRMATION: { label: "Chờ xác nhận", variant: "warning" },
    CONFIRMED: { label: "Đã xác nhận", variant: "success" },
    PACKING: { label: "Đang đóng gói", variant: "warning" },
    READY_TO_SHIP: { label: "Sẵn sàng giao", variant: "info" },
    SHIPPING: { label: "Đang giao", variant: "info" },
    DELIVERED: { label: "Đã giao", variant: "success" },
    COMPLETED: { label: "Hoàn tất", variant: "success" },
    CANCELLED: { label: "Đã hủy", variant: "danger" },
    FAILED_DELIVERY: { label: "Giao thất bại", variant: "danger" },
    RETURNING: { label: "Đang hoàn", variant: "warning" },
    RETURNED: { label: "Đã hoàn", variant: "info" },
    // Legacy
    NEW: { label: "Mới", variant: "info" },
    OUT_FOR_DELIVERY: { label: "Đang giao", variant: "info" },
  };
  const normalized = status.toUpperCase();
  return statusMap[normalized] || { label: status, variant: "info" };
};

export default function ManagerOrdersPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const limit = 10;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["manager", "orders", user?.branchId, page, search, statusFilter],
    queryFn: () => orderService.getOrders(page, limit, {
      ...(search && { search }),
      ...(statusFilter !== "all" && { status: statusFilter }),
    }),
    enabled: !!user?.branchId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      orderService.updateStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager", "orders"] });
      toast.success("Cập nhật trạng thái thành công");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Không thể cập nhật trạng thái";
      toast.error(message);
    },
  });

  const columns = [
    {
      key: "id",
      header: "Mã đơn",
      render: (order: Order) => (
        <span className="font-mono text-xs">#{order.id.slice(-8).toUpperCase()}</span>
      ),
    },
    {
      key: "customer",
      header: "Khách hàng",
      render: (order: Order) => (
        <div>
          <p className="font-medium">{order.user?.fullName || order.user?.name || "N/A"}</p>
          <p className="text-xs text-stone-500">{order.user?.email}</p>
        </div>
      ),
    },
    {
      key: "items",
      header: "Sản phẩm",
      render: (order: Order) => (
        <span className="text-sm">{order.items?.length || 0} sản phẩm</span>
      ),
    },
    {
      key: "total",
      header: "Tổng tiền",
      render: (order: Order) => (
        <span className="font-semibold text-emerald-600">
          {formatCurrency(order.totalPrice || order.totalAmount || 0)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (order: Order) => {
        const statusInfo = getStatusBadge(order.status);
        return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
      },
    },
    {
      key: "createdAt",
      header: "Ngày tạo",
      render: (order: Order) => (
        <span className="text-sm text-stone-600">
          {new Date(order.createdAt).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (order: Order) => {
        const status = order.status.toUpperCase();
        return (
          <div className="flex gap-2">
            {status === "PENDING_CONFIRMATION" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (window.confirm("Xác nhận đơn hàng này?")) {
                    updateStatusMutation.mutate({ orderId: order.id, status: "CONFIRMED" });
                  }
                }}
                isLoading={updateStatusMutation.isPending}
              >
                Xác nhận
              </Button>
            )}
            <Link href={`/manager/orders/${order.id}`} prefetch={false}>
              <Button variant="ghost" size="sm">
                Chi tiết
              </Button>
            </Link>
          </div>
        );
      },
    },
  ];

  if (!user?.branchId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Quản lý đơn hàng"
          breadcrumbs={[{ label: "Dashboard", href: "/manager" }, { label: "Đơn hàng" }]}
        />
        <EmptyState
          title="Bạn chưa được gán cho chi nhánh nào"
          description="Vui lòng liên hệ quản trị viên để được gán chi nhánh"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý đơn hàng"
        breadcrumbs={[
          { label: "Dashboard", href: "/manager" },
          { label: "Đơn hàng" },
        ]}
      />
      <div className="space-y-6">
        <DataTable
          columns={columns}
          data={data?.items || []}
          isLoading={isLoading}
          toolbar={
            <FilterBar
              search={{
                value: search,
                onChange: setSearch,
                placeholder: "Tìm kiếm đơn hàng...",
              }}
              filters={
                <Select
                  options={[
                    { value: "all", label: "Tất cả trạng thái" },
                    { value: "PENDING_CONFIRMATION", label: "Chờ xác nhận" },
                    { value: "CONFIRMED", label: "Đã xác nhận" },
                    { value: "PACKING", label: "Đang đóng gói" },
                    { value: "READY_TO_SHIP", label: "Sẵn sàng giao" },
                    { value: "SHIPPING", label: "Đang giao" },
                    { value: "DELIVERED", label: "Đã giao" },
                    { value: "COMPLETED", label: "Hoàn tất" },
                    { value: "CANCELLED", label: "Đã hủy" },
                    { value: "FAILED_DELIVERY", label: "Giao thất bại" },
                  ]}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-48"
                />
              }
            />
          }
          emptyState={
            <EmptyState
              icon={<FiPackage className="w-16 h-16 text-stone-300" />}
              title="Chưa có đơn hàng nào"
              description="Đơn hàng của chi nhánh sẽ hiển thị tại đây"
            />
          }
          pagination={
            data
              ? {
                currentPage: page,
                totalPages: data?.totalPages || 1,
                onPageChange: setPage,
              }
              : undefined
          }
        />
        {isError && (
          <ErrorState
            title="Không thể tải đơn hàng"
            description="Vui lòng thử lại sau"
            action={{ label: "Thử lại", onClick: () => refetch() }}
          />
        )}
      </div>
    </div>
  );
}

