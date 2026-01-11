"use client";

import { useQuery } from "@tanstack/react-query";
import PageShell from "@/components/layouts/PageShell";
import PageHeader from "@/components/layouts/PageHeader";
import Card, { CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { promotionService } from "@/services/promotionService";
import { formatCurrency } from "@/lib/format";
import { FiTag, FiCalendar } from "react-icons/fi";
import { Promotion } from "@/lib/types";
import { routes } from "@/lib/config/routes";

export default function PromotionsPage() {
  const { data: promotions, isLoading, isError, refetch } = useQuery({
    queryKey: ["promotions", "public"],
    queryFn: () => promotionService.getPromotions(),
  });

  const activePromotions = promotions?.filter((p: Promotion) => {
    const now = new Date();
    const startDate = new Date(p.startDate);
    const endDate = new Date(p.endDate);
    return p.isActive && now >= startDate && now <= endDate;
  }) || [];

  return (
    <PageShell>
      <PageHeader
        title="Khuyến mãi"
        breadcrumbs={[
          { label: "Trang chủ", href: routes.home },
          { label: "Khuyến mãi" },
        ]}
      />
      <main className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            title="Không thể tải khuyến mãi"
            description="Vui lòng thử lại sau"
            action={{ label: "Thử lại", onClick: () => refetch() }}
          />
        ) : activePromotions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FiTag className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-600">Hiện tại không có khuyến mãi nào</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activePromotions.map((promotion: Promotion) => (
              <Card key={promotion.id} className="hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200 [@media(prefers-reduced-motion:reduce)]:hover:translate-y-0">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FiTag className="w-5 h-5 text-orange-500" />
                        <h3 className="text-xl font-semibold text-secondary-900">
                          {promotion.name}
                        </h3>
                      </div>
                      {promotion.code && (
                        <Badge variant="success" className="mb-2">
                          Mã: {promotion.code}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {promotion.description && (
                    <p className="text-secondary-600 mb-4">{promotion.description}</p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-secondary-600">
                      <FiCalendar className="w-4 h-4" />
                      <span>
                        {new Date(promotion.startDate).toLocaleDateString("vi-VN")} - 
                        {" "}{new Date(promotion.endDate).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    
                    {promotion.type === "percentage" && (
                      <p className="text-lg font-semibold text-orange-600">
                        Giảm {promotion.value}%
                      </p>
                    )}
                    {promotion.type === "fixed" && (
                      <p className="text-lg font-semibold text-orange-600">
                        Giảm {formatCurrency(promotion.value)}
                      </p>
                    )}
                    {promotion.type === "free_shipping" && (
                      <p className="text-lg font-semibold text-orange-600">
                        Miễn phí vận chuyển
                      </p>
                    )}
                    
                    {promotion.minPurchaseAmount && (
                      <p className="text-sm text-secondary-500">
                        Áp dụng cho đơn hàng từ {formatCurrency(promotion.minPurchaseAmount)}
                      </p>
                    )}
                  </div>
                  
                  {promotion.usageLimit && (
                    <p className="text-xs text-secondary-500">
                      Còn {promotion.usageLimit - (promotion.usageCount || 0)} lượt sử dụng
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </PageShell>
  );
}

