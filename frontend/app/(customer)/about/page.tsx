"use client";

import PageShell from "@/components/layouts/PageShell";
import PageHeader from "@/components/layouts/PageHeader";
import Card, { CardContent } from "@/components/ui/Card";
import { textPresets, sectionSpacing } from "@/lib/design-system";

export default function AboutPage() {
  return (
    <PageShell>
      <PageHeader
        title="Về FurniMart"
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Về FurniMart" },
        ]}
      />
      <main className={sectionSpacing.md}>
        <Card>
          <CardContent className="p-8">
            <div className="prose max-w-none">
              <h2 className={`${textPresets.heading2} mb-4`}>Giới thiệu về FurniMart</h2>
              <p className={`${textPresets.body} mb-4`}>
                FurniMart là hệ thống thương mại điện tử chuyên về nội thất đa chi nhánh, 
                mang đến cho khách hàng những sản phẩm nội thất chất lượng cao với dịch vụ 
                chuyên nghiệp và tiện lợi.
              </p>
              <h3 className={`${textPresets.heading3} mt-6 mb-3`}>Tầm nhìn</h3>
              <p className={`${textPresets.body} mb-4`}>
                Trở thành thương hiệu nội thất hàng đầu, mang đến không gian sống đẹp và 
                tiện nghi cho mọi gia đình Việt Nam.
              </p>
              <h3 className={`${textPresets.heading3} mt-6 mb-3`}>Sứ mệnh</h3>
              <p className={`${textPresets.body} mb-4`}>
                Cung cấp các sản phẩm nội thất đa dạng, chất lượng với giá cả hợp lý, 
                kèm theo dịch vụ chăm sóc khách hàng tận tâm.
              </p>
              <h3 className={`${textPresets.heading3} mt-6 mb-3`}>Giá trị cốt lõi</h3>
              <ul className={`list-disc list-inside ${textPresets.body} space-y-2`}>
                <li>Chất lượng sản phẩm đảm bảo</li>
                <li>Dịch vụ khách hàng chuyên nghiệp</li>
                <li>Giao hàng nhanh chóng, an toàn</li>
                <li>Giá cả cạnh tranh</li>
                <li>Đổi trả dễ dàng</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageShell>
  );
}

