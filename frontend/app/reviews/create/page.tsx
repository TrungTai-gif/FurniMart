'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productService } from '@services/productService';
import { reviewService } from '@services/reviewService';
import { orderService } from '@services/orderService';
import { useRequireAuth } from '@hooks/useRequireAuth';
import { useAuthStore } from '@store/authStore';
import MainLayout from '@components/layouts/MainLayout';
import PageContainer from '@components/layouts/PageContainer';
import Breadcrumbs from '@components/Breadcrumbs';
import EmptyState from '@components/EmptyState';
import LoadingSpinner from '@components/LoadingSpinner';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { FiStar, FiArrowLeft, FiX, FiImage, FiCheckCircle } from 'react-icons/fi';
import { Product } from '@types';

function CreateReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get('productId');
  const { user, isLoading: authLoading } = useRequireAuth({ requiredRole: 'customer' });
  const { user: authUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const { data: product, isLoading: productLoading } = useQuery<Product>(
    ['product', productId],
    () => productService.getById(productId!),
    { enabled: !!productId }
  );

  const { data: myOrders = [] } = useQuery<any[]>(
    ['orders', 'my-orders'],
    () => orderService.getMyOrders(),
    { enabled: !authLoading && !!user }
  );

  const createReviewMutation = useMutation(
    (data: { productId: string; rating: number; comment: string; customerName: string; images?: string[] }) =>
      reviewService.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reviews', productId]);
        queryClient.invalidateQueries(['product', productId]);
        toast.success('Đánh giá đã được gửi thành công!');
        router.push(`/products/${productId}`);
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Gửi đánh giá thất bại');
      },
    }
  );

  const hasPurchased = myOrders.some((order: any) => {
    if (order.status !== 'delivered') return false;
    return order.items?.some((item: any) => 
      (item.productId || item.product?._id) === productId
    );
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImageUrls((prev) => [...prev, result]);
        setImages((prev) => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productId) {
      toast.error('Không tìm thấy sản phẩm');
      return;
    }

    if (!comment.trim()) {
      toast.error('Vui lòng nhập đánh giá');
      return;
    }

    if (!hasPurchased) {
      toast.error('Bạn chỉ có thể đánh giá sản phẩm đã mua');
      return;
    }

    createReviewMutation.mutate({
      productId,
      rating,
      comment: comment.trim(),
      customerName: authUser?.name || user?.name || 'Khách hàng',
      images: images.length > 0 ? images : undefined,
    });
  };

  if (authLoading || productLoading) {
    return (
      <MainLayout>
        <PageContainer className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text="Đang tải..." />
        </PageContainer>
      </MainLayout>
    );
  }

  if (!user || user.role !== 'customer') {
    return (
      <MainLayout>
        <PageContainer className="flex items-center justify-center py-20">
          <EmptyState
            icon={<FiStar size={64} className="text-gray-400" />}
            title="Cần đăng nhập"
            description="Bạn cần đăng nhập để đánh giá sản phẩm"
            actionLabel="Đăng nhập"
            actionHref="/auth/login"
          />
        </PageContainer>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <PageContainer className="flex items-center justify-center py-20">
          <EmptyState
            icon={<FiX size={64} className="text-gray-400" />}
            title="Không tìm thấy sản phẩm"
            description="Sản phẩm không tồn tại hoặc đã bị xóa"
            actionLabel="Quay lại danh sách sản phẩm"
            actionHref="/products"
          />
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <header className="bg-gradient-to-br from-secondary via-secondary/95 to-secondary/90 text-white py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
        <PageContainer className="relative z-10">
          <Breadcrumbs 
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Sản phẩm', href: '/products' },
              { label: product.name, href: `/products/${productId}` },
              { label: 'Đánh giá' }
            ]}
            className="mb-4 text-white/80"
          />
          <Link 
            href={`/products/${productId}`} 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <FiArrowLeft size={18} /> Quay lại
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">Đánh giá sản phẩm</h1>
          <p className="text-gray-200 text-lg">{product.name}</p>
        </PageContainer>
      </header>

      <PageContainer className="py-8 sm:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Product Info */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-4">
              {product.images && product.images.length > 0 && (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
                <p className="text-lg font-semibold text-primary">
                  {product.price.toLocaleString('vi-VN')}₫
                  {product.discount && product.discount > 0 && (
                    <span className="ml-2 text-green-600 text-base">-{product.discount}%</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {!hasPurchased && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-yellow-800 font-semibold flex items-center gap-2">
                <FiX size={18} />
                Bạn chỉ có thể đánh giá sản phẩm đã mua và đã được giao hàng.
              </p>
            </div>
          )}

          {/* Review Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">Viết đánh giá của bạn</h2>

            {/* Rating */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Đánh giá sao <span className="text-error">*</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-5xl transition-all hover:scale-110"
                  >
                    <FiStar
                      className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-3 font-medium">
                {rating === 1 && '⭐ Rất không hài lòng'}
                {rating === 2 && '⭐⭐ Không hài lòng'}
                {rating === 3 && '⭐⭐⭐ Bình thường'}
                {rating === 4 && '⭐⭐⭐⭐ Hài lòng'}
                {rating === 5 && '⭐⭐⭐⭐⭐ Rất hài lòng'}
              </p>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Đánh giá chi tiết <span className="text-error">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                required
              />
            </div>

            {/* Images */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FiImage size={16} />
                Hình ảnh (tùy chọn)
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
                <p className="text-xs text-gray-500">
                  Tối đa 5MB mỗi ảnh. Hỗ trợ: JPG, PNG, GIF
                </p>

                {/* Image Preview */}
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={createReviewMutation.isLoading || !hasPurchased}
                className="btn-primary flex-1 py-4 text-lg shadow-lg shadow-primary/30 hover:scale-105 transition-transform disabled:opacity-50"
              >
                {createReviewMutation.isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Đang gửi...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FiCheckCircle size={18} />
                    Gửi đánh giá
                  </span>
                )}
              </button>
              <Link 
                href={`/products/${productId}`} 
                className="btn-secondary py-4 px-6 hover:scale-105 transition-transform"
              >
                Hủy
              </Link>
            </div>
          </form>
        </div>
      </PageContainer>
    </MainLayout>
  );
}

export default function CreateReviewPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <PageContainer className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" text="Đang tải..." />
          </PageContainer>
        </MainLayout>
      }
    >
      <CreateReviewContent />
    </Suspense>
  );
}
