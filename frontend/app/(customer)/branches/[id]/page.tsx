"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { branchService } from "@/services/branchService";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import PageShell from "@/components/layouts/PageShell";
import PageHeader from "@/components/layouts/PageHeader";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";

export default function BranchDetailPage() {
  const params = useParams();
  const branchId = params.id as string;

  const { data: branch, isLoading, isError } = useQuery({
    queryKey: ["branch", branchId],
    queryFn: () => branchService.getBranch(branchId),
  });

  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ["inventory", branchId],
    queryFn: () => branchService.getBranchInventory(branchId),
    enabled: !!branchId,
  });

  return (
    <PageShell>
      <PageHeader
        title={branch?.name || "Chi nhánh"}
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Chi nhánh", href: "/branches" },
          { label: branch?.name || "..." },
        ]}
      />
      <main className="space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-8 w-1/4" />
            <Card>
              <CardContent>
                <Skeleton className="h-6 w-full mb-4" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>
        ) : isError || !branch ? (
          <ErrorState
            title="Không tìm thấy chi nhánh"
            description="Chi nhánh không tồn tại hoặc đã bị xóa"
            action={{ label: "Quay lại", onClick: () => window.location.href = "/branches" }}
          />
        ) : (

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin chi nhánh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-secondary-500">Địa chỉ</p>
              <p className="font-semibold">
                {typeof branch.address === 'string' 
                  ? branch.address 
                  : branch.address 
                    ? `${branch.address.street || ''}, ${branch.address.ward || ''}, ${branch.address.district || ''}, ${branch.address.city || ''}`
                    : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary-500">Số điện thoại</p>
              <p className="font-semibold">{branch.phone}</p>
            </div>
            {branch.email && (
              <div>
                <p className="text-sm text-secondary-500">Email</p>
                <p className="font-semibold">{branch.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tồn kho</CardTitle>
          </CardHeader>
          <CardContent>
            {inventoryLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : inventory && inventory.length > 0 ? (
              <div className="space-y-2">
                {inventory.slice(0, 10).map((item: { product?: { name: string }; quantity?: number }, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.product?.name || "Sản phẩm"}</span>
                    <span className="font-semibold">{item.quantity || 0}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Chưa có thông tin tồn kho"
                description="Tồn kho sẽ được hiển thị khi có dữ liệu"
              />
            )}
          </CardContent>
        </Card>
        </div>
        )}
      </main>
    </PageShell>
  );
}

