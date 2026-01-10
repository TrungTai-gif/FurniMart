"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import PageShell from "@/components/layouts/PageShell";
import ProductGrid from "@/components/product/ProductGrid";
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
  const heroButtonText = heroSettings?.buttonText || "Mua Sắm Ngay";
  const heroButtonLink = heroSettings?.buttonLink || "/products";

  return (
    <div className="min-h-screen w-full bg-background font-sans text-secondary-900">
      {/* 1. HERO SECTION - Immersive */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-secondary-900 to-secondary-950" />
        <div className="absolute inset-0 opacity-40">
          <Image
            src={heroImageUrl}
            alt="FurniMart hero"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-secondary-950/80 via-secondary-950/40 to-transparent" />

        <PageShell className="relative z-10 py-24 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div className="space-y-6 text-white">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-widest">
                Bộ sưu tập mới 2024
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight">
                {heroSettings?.title || "Nội thất chuẩn gu, chuẩn chất"}
              </h1>
              <p className="text-base md:text-lg text-secondary-100 max-w-xl">
                {heroSettings?.subtitle ||
                  "Thiết kế tinh giản, vật liệu bền vững, nâng tầm mọi không gian sống."}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href={heroButtonLink}>
                  <Button size="lg" className="px-8">
                    {heroButtonText}
                  </Button>
                </Link>
                <Link href="/categories">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="border border-white/30 text-white hover:bg-white/10"
                  >
                    Khám phá danh mục
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  label: "Khách hàng hài lòng",
                  value: "25K+",
                  note: "Khắp Việt Nam",
                },
                {
                  label: "Thiết kế mới mỗi tuần",
                  value: "120+",
                  note: "Theo xu hướng",
                },
                {
                  label: "Đánh giá trung bình",
                  value: "4.9/5",
                  note: "Từ 3.2K reviews",
                },
                {
                  label: "Tư vấn 1-1",
                  value: "Free",
                  note: "Đặt lịch dễ dàng",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/15 bg-white/10 p-5 text-white backdrop-blur"
                >
                  <p className="text-2xl font-semibold">{item.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-secondary-200">
                    {item.label}
                  </p>
                  <p className="mt-3 text-sm text-secondary-100">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </PageShell>
      </section>

      {/* 2. TRUST SIGNALS */}
      <section className="bg-white border-b border-secondary-100">
        <PageShell className="py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "🛡️",
                title: "Bảo hành dài hạn",
                description: "2 năm cho toàn bộ sản phẩm",
              },
              {
                icon: "🚚",
                title: "Giao hàng thông minh",
                description: "Miễn phí đơn từ 5 triệu",
              },
              {
                icon: "💳",
                title: "Thanh toán linh hoạt",
                description: "Trả góp 0% - xử lý nhanh",
              },
              {
                icon: "🧑‍💼",
                title: "Tư vấn tận tâm",
                description: "KTS hỗ trợ 24/7",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-4 rounded-xl border border-secondary-100 bg-secondary-50/80 p-4"
              >
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <h4 className="font-semibold text-sm uppercase tracking-wide">
                    {item.title}
                  </h4>
                  <p className="text-xs text-secondary-500">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </PageShell>
      </section>

      {/* 3. CATEGORIES */}
      {categories.length > 0 && (
        <Section>
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-primary-600 font-bold tracking-widest text-xs uppercase mb-2 block">
                Bộ sưu tập
              </span>
              <Heading level={2}>Chọn theo không gian</Heading>
            </div>
            <Link href="/categories" className="hidden md:block">
              <Button variant="ghost" size="sm">
                Xem tất cả →
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug || category.id}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary-100"
              >
                {category.image ? (
                  <Image
                    src={normalizeImageUrl(category.image) || category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-secondary-300">
                    <span className="text-4xl">🛋️</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  <p className="text-xs opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    Khám phá →
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
            Weekly selection
          </span>
          <Heading level={2} className="mb-4">
            Thiết kế mới nhất
          </Heading>
          <p className="text-secondary-500 max-w-2xl mx-auto">
            Nâng cấp không gian sống với những thiết kế vừa cập bến FurniMart.
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

      {/* 5. DESIGN SERVICE */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=900&q=80"
              alt="Tư vấn thiết kế"
              fill
              className="object-cover"
            />
            <div className="absolute bottom-6 left-6 rounded-2xl bg-white/90 p-5 shadow-xl">
              <p className="text-sm uppercase tracking-[0.3em] text-secondary-400">
                Design Lab
              </p>
              <p className="text-lg font-semibold text-secondary-900">
                Phối cảnh thực tế
              </p>
              <p className="text-xs text-secondary-500">
                Bản vẽ 2D/3D trong 48h
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <span className="text-primary-600 font-bold tracking-widest text-xs uppercase">
              Dịch vụ thiết kế
            </span>
            <Heading level={2} className="leading-tight">
              Biến ý tưởng thành không gian sống hoàn hảo
            </Heading>
            <p className="text-secondary-500 leading-relaxed">
              Đội ngũ kiến trúc sư FurniMart đồng hành từ ý tưởng, phối màu đến
              tối ưu công năng. Nhận tư vấn miễn phí theo diện tích và ngân sách.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Tư vấn 1-1 theo phong cách",
                "Bản vẽ & bảng màu cá nhân hóa",
                "Gợi ý sản phẩm phù hợp",
                "Theo dõi tiến độ thi công",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-secondary-100 bg-white p-4"
                >
                  <span className="text-primary-600">✓</span>
                  <p className="text-sm text-secondary-700">{item}</p>
                </div>
              ))}
            </div>
            <Link href="/contact">
              <Button size="lg">Đặt lịch tư vấn</Button>
            </Link>
          </div>
        </div>
      </Section>

      {/* 6. BEST SELLING */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4 space-y-6">
            <span className="text-error font-bold tracking-widest text-xs uppercase">
              Best sellers
            </span>
            <Heading level={2} className="leading-tight">
              Được yêu thích nhất tháng
            </Heading>
            <p className="text-secondary-500 leading-relaxed">
              Những sản phẩm được khách hàng tin dùng và đánh giá cao nhất. Đừng
              bỏ lỡ các lựa chọn must-have cho tổ ấm.
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

      {/* 7. INSPIRATION LOOKBOOK */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-primary-600 font-bold tracking-widest text-xs uppercase">
              Inspiration
            </span>
            <Heading level={2} className="leading-tight">
              Biến không gian thành nơi bạn muốn trở về
            </Heading>
            <p className="text-secondary-500 leading-relaxed">
              Gợi ý phối hợp sofa, bàn trà và decor theo xu hướng mới. Mỗi góc
              nhà là một tuyên ngôn phong cách riêng.
            </p>
            <Link href="/products?sort=newest">
              <Button variant="outline" size="lg">
                Khám phá bộ sưu tập
              </Button>
            </Link>
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            {[
              "/images/hero/hero-banner.jpg",
              "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80",
              "https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=600&q=80",
              "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?auto=format&fit=crop&w=600&q=80",
            ].map((src, index) => (
              <div
                key={src}
                className={`relative overflow-hidden rounded-2xl ${index === 0 ? "row-span-2 h-full" : "h-40 md:h-48"
                  }`}
              >
                <Image
                  src={src}
                  alt="Không gian nội thất"
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 1024px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 8. PROMOTION BANNER */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-900" />
        <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay" />

        <PageShell className="relative z-10 text-center text-white">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ưu đãi đặc biệt mùa hè
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
                Săn deal ngay
              </Button>
            </Link>
          </div>
        </PageShell>
      </section>

      {/* 9. REVIEWS */}
      {recentReviews && recentReviews.length > 0 && (
        <Section>
          <Heading level={2} className="text-center mb-12">
            Khách hàng nói gì?
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

      {/* 10. NEWSLETTER */}
      <Section background="stone">
        <div className="rounded-3xl border border-secondary-100 bg-white p-10 md:p-14 text-center">
          <span className="text-primary-600 font-bold tracking-widest text-xs uppercase mb-3 block">
            Cập nhật xu hướng
          </span>
          <Heading level={2} className="mb-4">
            Nhận bộ sưu tập mới mỗi tuần
          </Heading>
          <p className="text-secondary-500 max-w-2xl mx-auto mb-8">
            Đăng ký email để nhận ưu đãi độc quyền, ý tưởng decor và dự án mới
            nhất từ FurniMart.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <input
              type="email"
              placeholder="Email của bạn"
              className="w-full sm:w-80 rounded-full border border-secondary-200 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button size="lg" className="px-8">
              Đăng ký ngay
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
