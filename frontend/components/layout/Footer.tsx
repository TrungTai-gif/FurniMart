"use client";

import Link from "next/link";
import PageShell from "@/components/layouts/PageShell";
import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";
import { FiFacebook, FiInstagram, FiYoutube, FiMail, FiPhone, FiMapPin } from "react-icons/fi";

export default function Footer() {
  const { data: generalSettings } = useQuery({
    queryKey: ["generalSettings"],
    queryFn: () => settingsService.getGeneralSettings(),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <footer className="bg-secondary-900 text-secondary-300 mt-auto w-full max-w-full overflow-x-hidden">
      <PageShell className="py-16 md:py-20 w-full max-w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8 w-full max-w-full">
          {/* Company Info */}
          <div>
            <h3 className="text-white text-lg font-medium mb-4 tracking-tight">
              {generalSettings?.siteName || "FurniMart"}
            </h3>
            <p className="text-sm text-secondary-400 leading-relaxed mb-4">
              {generalSettings?.siteDescription || "Hệ thống mua sắm nội thất đa chi nhánh tại TP.HCM"}
            </p>
            {/* Social Media Links */}
            <div className="flex gap-4 mt-6">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-400 hover:text-white transition-colors duration-200"
                aria-label="Facebook"
              >
                <FiFacebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-400 hover:text-white transition-colors duration-200"
                aria-label="Instagram"
              >
                <FiInstagram className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-400 hover:text-white transition-colors duration-200"
                aria-label="YouTube"
              >
                <FiYoutube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Thông tin */}
          <div>
            <h4 className="text-white font-medium mb-4 text-sm tracking-tight">THÔNG TIN</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-secondary-400 hover:text-white transition-colors duration-200">
                  Về FurniMart
                </Link>
              </li>
              <li>
                <Link href="/policy" className="text-secondary-400 hover:text-white transition-colors duration-200">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="/policy" className="text-secondary-400 hover:text-white transition-colors duration-200">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link href="/policy" className="text-secondary-400 hover:text-white transition-colors duration-200">
                  Chính sách đổi trả
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-secondary-400 hover:text-white transition-colors duration-200">
                  Câu hỏi thường gặp
                </Link>
              </li>
            </ul>
          </div>

          {/* Sản phẩm */}
          <div>
            <h4 className="text-white font-medium mb-4 text-sm tracking-tight">SẢN PHẨM</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/products" className="text-secondary-400 hover:text-white transition-colors duration-200">
                  Tất cả sản phẩm
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-secondary-400 hover:text-white transition-colors duration-200">
                  Danh mục
                </Link>
              </li>
              <li>
                <Link href="/promotions" className="text-secondary-400 hover:text-white transition-colors duration-200">
                  Khuyến mãi
                </Link>
              </li>
              <li>
                <Link href="/branches" className="text-secondary-400 hover:text-white transition-colors duration-200">
                  Chi nhánh
                </Link>
              </li>
            </ul>
          </div>

          {/* Thông tin liên hệ */}
          <div>
            <h4 className="text-white font-medium mb-4 text-sm tracking-tight">Thông tin liên hệ</h4>
            <ul className="space-y-3 text-sm">
              {generalSettings?.address && (
                <li className="flex items-start gap-2 text-secondary-400">
                  <FiMapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{generalSettings.address}</span>
                </li>
              )}
              {generalSettings?.contactPhone && (
                <li className="flex items-center gap-2 text-secondary-400">
                  <FiPhone className="w-5 h-5 flex-shrink-0" />
                  <a href={`tel:${generalSettings.contactPhone}`} className="hover:text-white transition-colors duration-200">
                    {generalSettings.contactPhone}
                  </a>
                </li>
              )}
              {generalSettings?.contactEmail && (
                <li className="flex items-center gap-2 text-secondary-400">
                  <FiMail className="w-5 h-5 flex-shrink-0" />
                  <a href={`mailto:${generalSettings.contactEmail}`} className="hover:text-white transition-colors duration-200">
                    {generalSettings.contactEmail}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-secondary-800 text-center text-sm text-secondary-500">
          <p>&copy; {new Date().getFullYear()} {generalSettings?.siteName || "FurniMart"}. All rights reserved.</p>
        </div>
      </PageShell>
    </footer>
  );
}

