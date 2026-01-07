"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FiTag, FiCopy, FiCheck } from "react-icons/fi";
import { useState } from "react";
import { SERVICES } from "@/lib/config";
import { toast } from "react-toastify";

interface Promotion {
  id: string;
  name: string;
  type: "percentage" | "fixed" | "free_shipping" | "buy_x_get_y";
  value?: number;
  code?: string;
  maxUsage?: number;
  usedCount?: number;
  startDate?: string;
  endDate?: string;
  description?: string;
}

function PromotionCard({ promo }: { promo: Promotion }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    if (promo.code) {
      navigator.clipboard.writeText(promo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Đã sao chép mã!");
    }
  };

  const getPromotionLabel = () => {
    switch (promo.type) {
      case "percentage":
        return `Giảm ${promo.value}%`;
      case "fixed":
        return `Giảm ${(promo.value || 0).toLocaleString("vi-VN")}đ`;
      case "free_shipping":
        return "Miễn phí vận chuyển";
      case "buy_x_get_y":
        return "Mua kèm ưu đãi";
      default:
        return "Khuyến mãi";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden border-l-4 border-primary-600">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FiTag className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">{promo.name}</h3>
              <p className="text-sm text-primary-600 font-semibold">
                {getPromotionLabel()}
              </p>
            </div>
          </div>
        </div>

        {promo.description && (
          <p className="text-sm text-slate-600 mb-4">{promo.description}</p>
        )}

        <div className="space-y-3">
          {promo.code && (
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-100 px-3 py-2 rounded font-mono text-sm font-bold text-slate-900">
                {promo.code}
              </code>
              <button
                onClick={handleCopyCode}
                className="p-2 hover:bg-slate-100 rounded transition"
              >
                {copied ? (
                  <FiCheck className="w-5 h-5 text-green-600" />
                ) : (
                  <FiCopy className="w-5 h-5 text-slate-600" />
                )}
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-xs">
            {promo.startDate && (
              <div>
                <span className="text-slate-500">Từ</span>
                <p className="font-semibold text-slate-900">
                  {new Date(promo.startDate).toLocaleDateString("vi-VN")}
                </p>
              </div>
            )}
            {promo.endDate && (
              <div>
                <span className="text-slate-500">Đến</span>
                <p className="font-semibold text-slate-900">
                  {new Date(promo.endDate).toLocaleDateString("vi-VN")}
                </p>
              </div>
            )}
          </div>

          {promo.maxUsage && (
            <div className="text-xs">
              <span className="text-slate-500">Lượt sử dụng</span>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                <div
                  className="bg-primary-600 h-2 rounded-full transition"
                  style={{
                    width: `${
                      ((promo.usedCount || 0) / promo.maxUsage) * 100
                    }%`,
                  }}
                />
              </div>
              <p className="text-slate-600 mt-1">
                {promo.usedCount || 0} / {promo.maxUsage}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PromotionsPage() {
  const { data: promotions, isLoading } = useQuery({
    queryKey: ["promotions"],
    queryFn: async () => {
      const res = await fetch(`${SERVICES.PROMOTION}/promotions`);
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/"
            className="text-2xl font-bold mb-6 block hover:opacity-90"
          >
            FurniMart
          </Link>
          <h1 className="text-4xl font-bold">Khuyến mãi & Voucher</h1>
          <p className="text-primary-100 mt-2">
            Tìm những mã giảm giá tốt nhất để tiết kiệm khi mua sắm
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-200 h-48 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {!promotions?.items || promotions.items.length === 0 ? (
              <div className="text-center py-16">
                <FiTag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Không có khuyến mãi nào
                </h2>
                <p className="text-slate-600">
                  Vui lòng quay lại sau để xem các khuyến mãi mới
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promotions.items.map((promo: Promotion) => (
                  <PromotionCard key={promo.id} promo={promo} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* How to use section */}
      <section className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
            Cách sử dụng mã khuyến mãi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Sao chép mã khuyến mãi
              </h3>
              <p className="text-slate-600">
                Nhấp vào nút sao chép bên cạnh mã để sao chép vào clipboard
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Thêm sản phẩm vào giỏ
              </h3>
              <p className="text-slate-600">
                Duyệt và chọn các sản phẩm bạn muốn mua
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Áp dụng tại thanh toán
              </h3>
              <p className="text-slate-600">
                Dán mã vào ô "Mã khuyến mãi" khi thanh toán
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
