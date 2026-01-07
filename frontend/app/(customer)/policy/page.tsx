"use client";

import PageShell from "@/components/layouts/PageShell";
import PageHeader from "@/components/layouts/PageHeader";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function PolicyPage() {
  return (
    <PageShell>
      <PageHeader
        title="Chính sách"
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Chính sách" },
        ]}
      />
      <main className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Chính sách bán hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">1. Chính sách đổi trả</h3>
              <p className="text-secondary-600">
                Khách hàng có thể đổi trả sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng với điều kiện sản phẩm còn nguyên vẹn, chưa qua sử dụng.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">2. Chính sách vận chuyển</h3>
              <p className="text-secondary-600">
                Phí vận chuyển được tính dựa trên khoảng cách và kích thước sản phẩm. Giao hàng miễn phí cho đơn hàng trên 500.000đ trong nội thành.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">3. Chính sách bảo hành</h3>
              <p className="text-secondary-600">
                Tất cả sản phẩm đều được bảo hành theo chính sách của nhà sản xuất. Vui lòng liên hệ với chúng tôi để được hỗ trợ bảo hành.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">4. Chính sách thanh toán</h3>
              <p className="text-secondary-600">
                Chúng tôi chấp nhận thanh toán bằng tiền mặt (COD), thẻ ngân hàng, và các ví điện tử phổ biến.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageShell>
  );
}

