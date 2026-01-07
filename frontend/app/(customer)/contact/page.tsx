"use client";

import { useQuery } from "@tanstack/react-query";
import PageShell from "@/components/layouts/PageShell";
import PageHeader from "@/components/layouts/PageHeader";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { settingsService } from "@/services/settingsService";
import { FiMail, FiPhone, FiMapPin, FiClock } from "react-icons/fi";

export default function ContactPage() {
  const { data: generalSettings } = useQuery({
    queryKey: ["generalSettings"],
    queryFn: () => settingsService.getGeneralSettings(),
  });

  return (
    <PageShell>
      <PageHeader
        title="Liên hệ"
        description="Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ với chúng tôi qua các kênh sau:"
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Liên hệ" },
        ]}
      />
      <main className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiMapPin className="w-5 h-5 text-primary-600" />
                Địa chỉ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary-600">
                {generalSettings?.address || "Đang cập nhật"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiPhone className="w-5 h-5 text-primary-600" />
                Điện thoại
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a 
                href={`tel:${generalSettings?.contactPhone || ""}`}
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                {generalSettings?.contactPhone || "Đang cập nhật"}
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiMail className="w-5 h-5 text-primary-600" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a 
                href={`mailto:${generalSettings?.contactEmail || ""}`}
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                {generalSettings?.contactEmail || "Đang cập nhật"}
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiClock className="w-5 h-5 text-primary-600" />
                Giờ làm việc
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary-600">
                Thứ 2 - Chủ nhật: 8:00 - 22:00
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hỗ trợ khách hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-secondary-600 mb-4">
              Đội ngũ hỗ trợ của chúng tôi sẵn sàng phục vụ bạn từ 8:00 đến 22:00 hàng ngày.
              Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email hoặc điện thoại.
            </p>
            <div className="space-y-2 text-sm text-secondary-600">
              <p>• Hỗ trợ đặt hàng và thanh toán</p>
              <p>• Tư vấn sản phẩm</p>
              <p>• Xử lý khiếu nại và đổi trả</p>
              <p>• Hỗ trợ kỹ thuật</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageShell>
  );
}

