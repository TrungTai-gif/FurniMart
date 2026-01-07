"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Button from "@/components/ui/Button";
import PageShell from "@/components/layouts/PageShell";
import ProductGrid from "@/components/product/ProductGrid";
import HeroBanner from "@/components/common/HeroBanner";
import Image from "next/image";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { settingsService } from "@/services/settingsService";
import { reviewService } from "@/services/reviewService";
import ErrorState from "@/components/ui/ErrorState";
import Section from "@/components/ui/Section";
import Heading from "@/components/ui/Heading";
import { normalizeImageUrl } from "@/lib/imageUtils";

export default function HomePage() {
  // Data Fetching
  const {
    data: featuredData,
    isLoading: featuredLoading,
    isError: featuredError,
  } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => productService.getFeaturedProducts(8),
  });

  const { data: bestsellingData, isLoading: bestsellingLoading } = useQuery({
    queryKey: ["products", "bestselling"],
    queryFn: () => productService.getProducts({ limit: 4, page: 1 }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories", "home"],
    queryFn: () => categoryService.getCategories(),
  });

  const { data: heroSettings } = useQuery({
    queryKey: ["heroSettings"],
    queryFn: () => settingsService.getHeroSettings(),
  });

  const { data: recentReviews } = useQuery({
    queryKey: ["reviews", "recent"],
    queryFn: async () => {
      const products = featuredData?.items?.slice(0, 3) || [];
      const reviewsPromises = products.map((p) =>
        reviewService.getProductReviews(p.id).catch(() => [])
      );
      const reviewsArrays = await Promise.all(reviewsPromises);
      return reviewsArrays.flat().slice(0, 3);
    },
    enabled: !!featuredData,
  });

  const featuredProducts = featuredData?.items || [];
  const bestsellingProducts = bestsellingData?.items || [];
  const categories = categoriesData?.slice(0, 6) || [];

  const heroImageUrl =
    normalizeImageUrl(heroSettings?.imageUrl) || "/images/hero/hero-banner.jpg";

  return (
    <div className="min-h-screen w-full bg-background font-sans text-secondary-900">
      {/* 1. HERO SECTION - Full Width */}
      <section className="width-full">
        <HeroBanner
          imageUrl={heroImageUrl}
          title={heroSettings?.title || "Sống Đẳng Cấp"}
          subtitle={heroSettings?.subtitle || "Nội Thất Tinh Tế"}
          description="Khám phá bộ sưu tập nội thất độc quyền, nâng tầm không gian sống của bạn."
          buttonText="Mua Sắm Ngay"
          buttonLink="/products"
          className="shadow-none rounded-none"
        />
      </section>

      {/* 2. TRUST SIGNALS - Minimal */}
      <section className="bg-white border-b border-secondary-100 py-8">
        <PageShell>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <span className="text-3xl">🛡️</span>
              <div className="text-left">
                <h4 className="font-semibold text-sm uppercase tracking-wide">
                  Bảo hành 2 năm
                </h4>
                <p className="text-xs text-secondary-500">Cho mọi sản phẩm</p>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <span className="text-3xl">🚚</span>
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wide">
                  Miễn phí vẫn chuyển
                </h4>
                <p className="text-xs text-secondary-500">
                  Đơn hàng &gt; 5 triệu
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <span className="text-3xl">💳</span>
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wide">
                  Trả góp 0%
                </h4>
                <p className="text-xs text-secondary-500">Thủ tục đơn giản</p>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <span className="text-3xl">📞</span>
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wide">
                  Hỗ trợ 24/7
                </h4>
                <p className="text-xs text-secondary-500">Hotline: 1900 xxxx</p>
              </div>
            </div>
          </div>
        </PageShell>
      </section>

      {/* 3. CATEGORIES - Modern Grid */}
      {categories.length > 0 && (
        <Section>
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="text-primary-600 font-bold tracking-widest text-xs uppercase mb-2 block">
                Bộ Sưu Tập
              </span>
              <Heading level={2}>Danh Mục Nổi Bật</Heading>
            </div>
            <Link href="/categories" className="hidden md:block">
              <Button variant="ghost" size="sm">
                Xem tất cả &rarr;
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug || category.id}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-secondary-100"
              >
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-secondary-300">
                    <span className="text-4xl">🛋️</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  <p className="text-xs opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    Khám phá &rarr;
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* 4. FEATURED PRODUCTS */}
      <Section background="stone">
        <div className="text-center mb-12">
          <span className="text-accent-600 font-bold tracking-widest text-xs uppercase mb-2 block">
            Weekly Selection
          </span>
          <Heading level={2} className="mb-4">
            Sản Phẩm Mới Nhất
          </Heading>
          <p className="text-secondary-500 max-w-2xl mx-auto">
            Nâng cấp không gian sống với những thiết kế mới nhất vừa cập bến
            FurniMart.
          </p>
        </div>

        {featuredError ? (
          <ErrorState title="Không thể tải sản phẩm" />
        ) : (
          <ProductGrid
            products={featuredProducts}
            isLoading={featuredLoading}
            columns={4}
          />
        )}

        <div className="text-center mt-10">
          <Link href="/products">
            <Button variant="outline" size="lg" className="px-8">
              Xem tất cả sản phẩm
            </Button>
          </Link>
        </div>
      </Section>

      {/* 5. BEST SELLING (Split Section) */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Content */}
          <div className="lg:col-span-4 space-y-6">
            <span className="text-error font-bold tracking-widest text-xs uppercase">
              Best Sellers
            </span>
            <Heading level={2} className="leading-tight">
              Được Yêu Thích <br /> Nhất Tháng
            </Heading>
            <p className="text-secondary-500 leading-relaxed">
              Những sản phẩm được khách hàng tin dùng và đánh giá cao nhất. Đừng
              bỏ lỡ những must-have items cho tổ ấm của bạn.
            </p>
            <Link href="/products?sort=rating">
              <Button
                variant="primary"
                size="lg"
                className="mt-4 shadow-lg shadow-primary-500/30"
              >
                Mua ngay
              </Button>
            </Link>
          </div>

          {/* Right: Product Grid (Compact) */}
          <div className="lg:col-span-8">
            <ProductGrid
              products={bestsellingProducts}
              isLoading={bestsellingLoading}
              columns={2}
              showActions={false}
            />
          </div>
        </div>
      </Section>

      {/* 6. PROMOTION BANNER */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-900" />
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay" />

        <PageShell className="relative z-10 text-center text-white">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ưu Đãi Đặc Biệt Mùa Hè
          </h2>
          <p className="text-lg md:text-xl text-primary-100 max-w-xl mx-auto mb-8">
            Giảm giá lên đến 50% cho bộ sưu tập phòng khách. Thời gian có hạn!
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/promotions">
              <Button
                variant="primary"
                className="bg-white text-primary-900 hover:bg-white/90 border-transparent shadow-xl"
              >
                Săn Deal Ngay
              </Button>
            </Link>
          </div>
        </PageShell>
      </section>

      {/* 7. REVIEWS (Simple Cards) */}
      {recentReviews && recentReviews.length > 0 && (
        <Section>
          <Heading level={2} className="text-center mb-12">
            Khách Hàng Nói Gì?
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recentReviews.slice(0, 3).map((review) => (
              <div
                key={review.id}
                className="bg-secondary-50 p-8 rounded-2xl relative"
              >
                <span className="text-6xl text-secondary-200 absolute top-4 left-4 font-serif leading-none">
                  &ldquo;
                </span>
                <div className="relative z-10">
                  <div className="flex text-accent-500 mb-4 text-sm">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>{i < review.rating ? "★" : "☆"}</span>
                    ))}
                  </div>
                  <p className="text-secondary-700 mb-6 italic leading-relaxed">
                    {review.comment}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary-200 rounded-full flex items-center justify-center font-bold text-secondary-500">
                      {(review.user?.name || "K").charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-secondary-900">
                        {review.user?.name || "Khách hàng"}
                      </h5>
                      <p className="text-xs text-secondary-500">
                        Verified Buyer
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
