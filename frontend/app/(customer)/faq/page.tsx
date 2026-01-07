"use client";

import PageShell from "@/components/layouts/PageShell";
import PageHeader from "@/components/layouts/PageHeader";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function FAQPage() {
  return (
    <PageShell>
      <PageHeader
        title="Câu hỏi thường gặp"
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "FAQ" },
        ]}
      />
      <main className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Câu hỏi thường gặp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">1. Làm thế nào để đặt hàng?</h3>
              <p className="text-secondary-600">
                Bạn có thể duyệt sản phẩm, thêm vào giỏ hàng và tiến hành thanh toán. Hệ thống sẽ xử lý đơn hàng của bạn.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">2. Tôi có thể xem sản phẩm tại chi nhánh không?</h3>
              <p className="text-secondary-600">
                Có, bạn có thể xem tồn kho và địa chỉ các chi nhánh trên trang web. Vui lòng liên hệ trực tiếp với chi nhánh để được hỗ trợ xem sản phẩm.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">3. Phương thức thanh toán nào được chấp nhận?</h3>
              <p className="text-secondary-600">
                Chúng tôi chấp nhận nhiều phương thức thanh toán như COD, VNPay, MoMo, và ví điện tử.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">4. Thời gian giao hàng là bao lâu?</h3>
              <p className="text-secondary-600">
                Thời gian giao hàng phụ thuộc vào chi nhánh và địa chỉ giao hàng. Bạn sẽ nhận được thông tin cụ thể sau khi đặt hàng.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageShell>
  );
}

