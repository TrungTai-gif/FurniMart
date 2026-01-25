"use client";

import PageShell from "@/components/layouts/PageShell";
import PageHeader from "@/components/layouts/PageHeader";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FiRefreshCw, FiTruck, FiShield, FiCreditCard } from "react-icons/fi";

const policyItems = [
  {
    title: "Chính sách đổi trả",
    description:
      "Đổi trả trong 7 ngày nếu sản phẩm còn nguyên vẹn, chưa qua sử dụng và đầy đủ phụ kiện.",
    highlights: ["Đặt lịch đổi trả online", "Hỗ trợ thu hồi tận nhà", "Theo dõi tiến trình 24/7"],
    icon: FiRefreshCw,
  },
  {
    title: "Chính sách vận chuyển",
    description:
      "Phí vận chuyển tối ưu theo khoảng cách và kích thước. Miễn phí nội thành cho đơn từ 500.000đ.",
    highlights: ["Giao nhanh 24-48h", "Hẹn giờ giao linh hoạt", "Có nhân viên lắp đặt"],
    icon: FiTruck,
  },
  {
    title: "Chính sách bảo hành",
    description:
      "Sản phẩm được bảo hành chính hãng. Hệ thống nhắc lịch bảo dưỡng định kỳ.",
    highlights: ["Bảo hành điện tử", "Hỗ trợ kỹ thuật tận nơi", "Linh kiện thay thế chính hãng"],
    icon: FiShield,
  },
  {
    title: "Chính sách thanh toán",
    description:
      "Hỗ trợ COD, thẻ ngân hàng, chuyển khoản và các ví điện tử phổ biến.",
    highlights: ["Bảo mật 3D Secure", "Trả góp linh hoạt", "Thông báo giao dịch tức thì"],
    icon: FiCreditCard,
  },
];

export default function PolicyPage() {
  return (
    <PageShell>
      <PageHeader
        title="Chính sách"
        description="Minh bạch trong mọi trải nghiệm mua sắm của bạn tại FurniMart."
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Chính sách" },
        ]}
      />
      <main className="space-y-8">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Cam kết phục vụ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-secondary-600">
              FurniMart áp dụng các tiêu chuẩn dịch vụ thống nhất trên toàn hệ thống, đảm bảo
              quyền lợi rõ ràng và hỗ trợ kịp thời trong suốt hành trình mua sắm của bạn.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {policyItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} hoverable>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-900">{item.title}</h3>
                      <p className="mt-2 text-sm text-secondary-600">{item.description}</p>
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm text-secondary-600">
                    {item.highlights.map((highlight) => (
                      <div key={highlight} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary-500" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </PageShell>
  );
}

