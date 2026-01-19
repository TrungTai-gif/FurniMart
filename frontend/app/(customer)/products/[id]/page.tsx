"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Link from "next/link";
import { productService } from "@/services/productService";
import { branchService } from "@/services/branchService";
import { cartService } from "@/services/cartService";
import { orderService } from "@/services/orderService";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import Card, { CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { formatCurrency } from "@/lib/format";
import { Review, Order, OrderItem } from "@/lib/types";
import { toast } from "react-toastify";
import ProductGallery from "@/components/product/ProductGallery";
import TabsControlled from "@/components/ui/TabsControlled";
import Badge from "@/components/ui/Badge";
import { reviewService } from "@/services/reviewService";
import {
  FiShoppingCart,
  FiArrowRight,
  FiPlus,
  FiMinus,
  FiStar,
  FiCheck,
  FiMapPin,
  FiTruck,
  FiShield,
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/config/routes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewSchema } from "@/lib/validation";
import * as z from "zod";
import Section from "@/components/ui/Section";
import Heading from "@/components/ui/Heading";
import EmptyState from "@/components/ui/EmptyState";

// Update document title when product loads
function useProductSEO(
  product: { name?: string; description?: string } | undefined
) {
  useEffect(() => {
    if (product && typeof document !== "undefined") {
      document.title = `${product.name || "Sản phẩm"} - FurniMart Collections`;
    }
  }, [product]);
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const { addItem } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productService.getProduct(productId),
    enabled: !!productId && productId !== "undefined",
  });

  useProductSEO(product);

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchService.getBranches(),
  });

  const { 
    data: inventory, 
    isLoading: isLoadingInventory, 
    isError: isInventoryError,
    refetch: refetchInventory 
  } = useQuery({
    queryKey: ["inventory", selectedBranch, productId],
    queryFn: async () => {
      try {
        const result = await branchService.getBranchInventory(selectedBranch, productId);
        console.log("Inventory result:", result);
        if (result && result.length > 0) {
          console.log("First inventory item:", result[0]);
          console.log("availableQuantity:", result[0].availableQuantity);
          console.log("quantity:", result[0].quantity);
          console.log("reservedQuantity:", result[0].reservedQuantity);
        }
        return result || [];
      } catch (error) {
        console.error("Error fetching inventory:", error);
        // Return empty array on error to prevent UI crash
        return [];
      }
    },
    enabled: !!selectedBranch && !!productId,
    retry: 2,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (selectedBranch && productId) {
      // Reset quantity when branch changes
      setQuantity(1);
      // Invalidate and refetch inventory
      queryClient.invalidateQueries({
        queryKey: ["inventory", selectedBranch, productId],
      });
    }
  }, [selectedBranch, productId, queryClient]);

  const { data: reviews } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => reviewService.getProductReviews(productId),
    enabled: !!productId,
  });

  const { data: myOrders } = useQuery({
    queryKey: ["orders", "my"],
    queryFn: () => orderService.getMyOrders(),
    enabled: isAuthenticated && !!productId,
  });

  const hasPurchasedProduct = myOrders?.some((order: Order) => {
    const orderStatus =
      typeof order.status === "string" ? order.status.toUpperCase() : "";
    if (orderStatus !== "DELIVERED" && orderStatus !== "COMPLETED")
      return false;
    return order.items?.some(
      (item: OrderItem) =>
        (item.productId?.toString() || item.productId) === productId
    );
  });

  const hasReviewed = reviews?.some(
    (review: Review) =>
      (review.customerId?.toString() || review.customerId) ===
      (user?.id?.toString() || user?.id)
  );
  const canReview = isAuthenticated && hasPurchasedProduct && !hasReviewed;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: { productId: productId, rating: 5, comment: "" },
  });

  const rating = watch("rating");

  const createReviewMutation = useMutation({
    mutationFn: (data: z.infer<typeof reviewSchema>) =>
      reviewService.create({
        ...data,
        customerName: user?.fullName || user?.name || "Khách hàng",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      toast.success("Đánh giá sản phẩm thành công");
      setReviewModalOpen(false);
      reset();
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) =>
      toast.error(error?.response?.data?.message || "Không thể tạo đánh giá"),
  });

  const handleAddToCart = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
      router.push(`/auth/login?redirect=/products/${productId}`);
      return;
    }

    if (!selectedBranch) {
      toast.error("Vui lòng chọn chi nhánh");
      return;
    }

    // Check if inventory is still loading
    if (isLoadingInventory) {
      toast.info("Đang kiểm tra tồn kho, vui lòng đợi...");
      return;
    }

    // Check if there was an error loading inventory
    if (isInventoryError) {
      toast.error("Không thể kiểm tra tồn kho. Vui lòng thử lại sau.");
      return;
    }

    // Check inventory availability
    const inventoryItem = inventory && inventory.length > 0 ? inventory[0] : null;
    // Calculate availableQuantity: prefer availableQuantity, fallback to quantity - reservedQuantity
    const availableQty = inventoryItem?.availableQuantity !== undefined && inventoryItem?.availableQuantity !== null
      ? inventoryItem.availableQuantity
      : (inventoryItem?.quantity ?? 0) - (inventoryItem?.reservedQuantity ?? 0);
    
    console.log("Add to cart check:", {
      inventoryItem,
      availableQty,
      availableQuantity: inventoryItem?.availableQuantity,
      quantity: inventoryItem?.quantity,
      reservedQuantity: inventoryItem?.reservedQuantity,
      requestedQuantity: quantity,
    });
    
    if (!inventory || inventory.length === 0 || availableQty < quantity) {
      toast.error(
        inventory && inventory.length > 0
          ? `Chi nhánh này chỉ còn ${availableQty} sản phẩm`
          : "Chi nhánh này không có sản phẩm này trong kho"
      );
      return;
    }

    if (quantity <= 0) {
      toast.error("Số lượng phải > 0");
      return;
    }

    try {
      addItem({
        productId: product.id,
        product,
        quantity,
        branchId: selectedBranch || undefined,
        price: discountedPrice,
      });
      await cartService.addToCart(
        product.id,
        quantity,
        selectedBranch || undefined
      );
      toast.success("Đã thêm vào giỏ hàng");
    } catch {
      toast.error("Không thể thêm vào giỏ hàng");
    }
  };

  const handleBuyNow = async () => {
    // Check if product exists
    if (!product) {
      toast.error("Sản phẩm không tồn tại");
      return;
    }

    // Same validation as handleAddToCart
    if (!selectedBranch) {
      toast.error("Vui lòng chọn chi nhánh");
      return;
    }

    if (isLoadingInventory) {
      toast.info("Đang kiểm tra tồn kho, vui lòng đợi...");
      return;
    }

    if (isInventoryError) {
      toast.error("Không thể kiểm tra tồn kho. Vui lòng thử lại sau.");
      return;
    }

    const inventoryItem = inventory && inventory.length > 0 ? inventory[0] : null;
    const availableQty = inventoryItem?.availableQuantity !== undefined && inventoryItem?.availableQuantity !== null
      ? inventoryItem.availableQuantity
      : (inventoryItem?.quantity ?? 0) - (inventoryItem?.reservedQuantity ?? 0);
    
    if (!inventory || inventory.length === 0 || availableQty < quantity) {
      toast.error(
        inventory && inventory.length > 0
          ? `Chi nhánh này chỉ còn ${availableQty} sản phẩm`
          : "Chi nhánh này không có sản phẩm này trong kho"
      );
      return;
    }

    if (quantity <= 0) {
      toast.error("Số lượng phải > 0");
      return;
    }

    try {
      // Add to cart
      addItem({
        productId: product.id,
        product,
        quantity,
        branchId: selectedBranch || undefined,
        price: discountedPrice,
      });
      await cartService.addToCart(
        product.id,
        quantity,
        selectedBranch || undefined
      );
      
      // Navigate to checkout immediately
      toast.success("Đang chuyển đến trang thanh toán...");
      window.location.href = "/checkout";
    } catch {
      toast.error("Không thể thêm vào giỏ hàng");
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen grid place-items-center">
        <Skeleton className="w-96 h-96" />
      </div>
    );
  if (isError || !product)
    return (
      <ErrorState
        title="Không tìm thấy sản phẩm"
        action={{
          label: "Quay lại",
          onClick: () => router.push(routes.products),
        }}
      />
    );

  const hasDiscount = Boolean(
    product.discount && product.discount > 0 && product.price > 0
  );
  const discountedPrice = hasDiscount
    ? Math.max(product.price - (product.discount || 0), 0)
    : product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.discount || 0) / product.price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Section size="sm" className="pb-0 pt-4 md:pt-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-sm text-secondary-500 mb-8 overflow-x-auto whitespace-nowrap pb-2 no-scrollbar">
          <Link
            href={routes.home}
            className="hover:text-primary-600 transition-colors"
          >
            Trang chủ
          </Link>
          <span className="mx-2 text-secondary-300">/</span>
          <Link
            href={routes.products}
            className="hover:text-primary-600 transition-colors"
          >
            Sản phẩm
          </Link>
          <span className="mx-2 text-secondary-300">/</span>
          <span className="text-secondary-900 font-medium truncate">
            {product.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Gallery - 7 cols */}
          <div className="lg:col-span-7">
            <ProductGallery
              images={product.images || []}
              modelUrl={product.modelUrl}
              productName={product.name}
            />
          </div>

          {/* Product Info - 5 cols */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                {product.isFeatured && (
                  <Badge
                    variant="success"
                    className="tracking-wider text-[10px] uppercase font-bold px-2 py-0.5"
                  >
                    Best Seller
                  </Badge>
                )}
                {hasDiscount && (
                  <Badge
                    variant="danger"
                    className="tracking-wider text-[10px] uppercase font-bold px-2 py-0.5"
                  >
                    -
                    {discountPercent}
                    %
                  </Badge>
                )}
                {(typeof product.category === "object"
                  ? product.category?.name
                  : product.category) && (
                  <Badge
                    variant="default"
                    className="tracking-wider text-[10px] uppercase font-bold px-2 py-0.5 text-secondary-500"
                  >
                    {typeof product.category === "object"
                      ? product.category.name
                      : product.category}
                  </Badge>
                )}
              </div>

              <Heading level={1} className="mb-4 leading-tight">
                {product.name}
              </Heading>

              <div className="flex items-baseline gap-4 mb-6">
                <span className="text-4xl font-bold text-primary-700 tracking-tight">
                  {formatCurrency(discountedPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-xl text-secondary-400 line-through decoration-secondary-300">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>

              {/* Rating / Status */}
              <div className="flex items-center justify-between py-5 border-y border-secondary-100">
                {product.rating ? (
                  <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="flex text-accent-500 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={cn(
                            "w-5 h-5",
                            i < Math.floor(product.rating || 0) &&
                              "fill-current"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-secondary-700 underline underline-offset-4 decoration-secondary-300">
                      {product.reviewCount || 0} đánh giá
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-secondary-400 italic">
                    Chưa có đánh giá
                  </span>
                )}

                <div className="flex items-center gap-2 text-sm bg-secondary-50 px-3 py-1.5 rounded-full">
                  {product.status === "active" || product.isActive ? (
                    <>
                      <FiCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-medium">
                        Còn hàng
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-error" />
                      <span className="text-error font-medium">Hết hàng</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-8">
              {product.colors && product.colors.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-secondary-900 mb-3 block uppercase tracking-wide">
                    Màu sắc
                  </span>
                  <div className="flex gap-3">
                    {product.colors.map((color, idx) => (
                      <button
                        key={idx}
                        className={cn(
                          "w-10 h-10 rounded-full border border-secondary-200 shadow-sm transition-all hover:scale-110",
                          "focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                        )}
                        style={{
                          backgroundColor:
                            color === "đen"
                              ? "#111"
                              : color === "trắng"
                              ? "#fff"
                              : "#888",
                        }}
                        title={color}
                        aria-label={`Chọn màu ${color}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {isAuthenticated ? (
                <div className="space-y-4">
                  {branches && branches.length > 0 && (
                    <div className="bg-secondary-50 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-secondary-900 flex items-center gap-2">
                          <FiMapPin className="text-secondary-500" /> Tình trạng
                          kho hàng
                        </span>
                        {selectedBranch && (
                          <>
                            {isLoadingInventory ? (
                              <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100">
                                Đang kiểm tra...
                              </span>
                            ) : isInventoryError ? (
                              <button
                                onClick={() => refetchInventory()}
                                className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100 hover:bg-red-100 transition-colors"
                                title="Nhấn để thử lại"
                              >
                                Lỗi - Thử lại
                              </button>
                            ) : inventory && inventory.length > 0 ? (
                              (() => {
                                const invItem = inventory[0];
                                // Calculate availableQuantity: prefer availableQuantity, fallback to quantity - reservedQuantity
                                const availableQty = invItem?.availableQuantity !== undefined && invItem?.availableQuantity !== null
                                  ? invItem.availableQuantity
                                  : (invItem?.quantity ?? 0) - (invItem?.reservedQuantity ?? 0);
                                
                                console.log("Display inventory status:", {
                                  invItem,
                                  availableQty,
                                  availableQuantity: invItem?.availableQuantity,
                                  quantity: invItem?.quantity,
                                  reservedQuantity: invItem?.reservedQuantity,
                                });
                                
                                return availableQty > 0 ? (
                                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                    Có sẵn {availableQty} sp
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                                    Hết hàng tại chi nhánh này
                                  </span>
                                );
                              })()
                            ) : (
                              <span className="text-xs font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                Không có trong kho
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="relative">
                        <select
                          className="w-full pl-3 pr-8 py-2.5 bg-white border border-secondary-200 rounded-lg text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all outline-none appearance-none"
                          value={selectedBranch}
                          onChange={(e) => setSelectedBranch(e.target.value)}
                        >
                          <option value="">
                            Chọn chi nhánh để kiểm tra...
                          </option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                        <FiCheck className="absolute right-3 top-3 text-secondary-400 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-2">
                    {/* Quantity */}
                    <div className="flex items-center border border-secondary-200 rounded-xl bg-white p-1 shadow-sm">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="p-3 hover:bg-secondary-50 rounded-lg text-secondary-600 transition-colors"
                      >
                        <FiMinus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-bold text-secondary-900">
                        {quantity}
                      </span>
                      <button
                        onClick={() => {
                          const invItem = inventory && inventory.length > 0 ? inventory[0] : null;
                          const availableQty = invItem?.availableQuantity ?? invItem?.quantity ?? 0;
                          setQuantity((q) => Math.min(q + 1, availableQty));
                        }}
                        className="p-3 hover:bg-secondary-50 rounded-lg text-secondary-600 transition-colors"
                        disabled={
                          !inventory ||
                          inventory.length === 0 ||
                          ((inventory[0]?.availableQuantity ?? inventory[0]?.quantity ?? 0) <= quantity)
                        }
                      >
                        <FiPlus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Add to Cart & Buy Now */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 text-base border-2 border-primary-300 hover:border-primary-400 hover:bg-primary-50 transition-all"
                        onClick={handleAddToCart}
                        disabled={
                          (product.status !== "active" && !product.isActive) ||
                          !selectedBranch ||
                          isLoadingInventory ||
                          isInventoryError ||
                          (inventory &&
                            inventory.length > 0 &&
                            ((inventory[0]?.availableQuantity ?? inventory[0]?.quantity ?? 0) < quantity))
                        }
                      >
                        <FiShoppingCart className="w-5 h-5 mr-2" /> Thêm vào giỏ
                      </Button>
                      <Button
                        variant="primary"
                        size="lg"
                        className="flex-1 text-base shadow-xl shadow-primary-500/20 hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all"
                        onClick={handleBuyNow}
                        disabled={
                          (product.status !== "active" && !product.isActive) ||
                          !selectedBranch ||
                          isLoadingInventory ||
                          isInventoryError ||
                          (inventory &&
                            inventory.length > 0 &&
                            ((inventory[0]?.availableQuantity ?? inventory[0]?.quantity ?? 0) < quantity))
                        }
                      >
                        Mua ngay <FiArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-linear-to-br from-secondary-50 to-white p-6 rounded-2xl text-center border border-secondary-100 shadow-sm relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-secondary-900 font-bold mb-1 text-lg">
                      Bạn muốn mua sản phẩm này?
                    </p>
                    <p className="text-sm text-secondary-500 mb-6">
                      Đăng nhập ngay để hưởng ưu đãi thành viên & tích điểm
                    </p>
                    <Button
                      variant="outline"
                      className="w-full bg-white hover:bg-secondary-50"
                      onClick={() =>
                        router.push(
                          `/auth/login?redirect=/products/${productId}`
                        )
                      }
                    >
                      Đăng nhập / Đăng ký
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Policies */}
            <div className="grid grid-cols-2 gap-4 py-6 text-sm text-secondary-600 border-t border-secondary-100">
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-secondary-50 rounded-full mt-0.5">
                  <FiTruck className="w-4 h-4 text-secondary-500" />
                </div>
                <div>
                  <span className="font-medium block text-secondary-900">
                    Miễn phí vận chuyển
                  </span>
                  <span className="text-xs text-secondary-500">
                    Cho đơn hàng {">"} 5.000.000đ
                  </span>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-secondary-50 rounded-full mt-0.5">
                  <FiShield className="w-4 h-4 text-secondary-500" />
                </div>
                <div>
                  <span className="font-medium block text-secondary-900">
                    Bảo hành 2 năm
                  </span>
                  <span className="text-xs text-secondary-500">
                    Chính hãng 100%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Details Tabs */}
      <Section background="stone" className="mt-16 py-16">
        <div className="max-w-4xl mx-auto">
          <TabsControlled
            tabs={[
              { id: "desc", label: "Mô tả chi tiết" },
              { id: "specs", label: "Thông số kỹ thuật" },
              {
                id: "reviews",
                label: `Đánh giá khách hàng (${reviews?.length || 0})`,
              },
            ]}
            defaultTab="desc"
          >
            {(activeTab) => (
              <div className="py-8 bg-white p-8 rounded-2xl shadow-sm border border-secondary-100 min-h-100">
                {activeTab === "desc" && (
                  <div className="prose prose-stone max-w-none text-secondary-600 leading-relaxed marker:text-primary-500">
                    <p>{product.description}</p>
                    {/* Placeholder for richer content later */}
                    <p className="text-secondary-400 italic mt-4 text-sm">
                      * Màu sắc thực tế có thể chênh lệch nhẹ do ánh sáng chụp
                      ảnh.
                    </p>
                  </div>
                )}
                {activeTab === "specs" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    {product.material && (
                      <div className="flex justify-between py-3 border-b border-secondary-100">
                        <span className="text-secondary-500">Chất liệu</span>
                        <span className="font-medium text-secondary-900">
                          {product.material}
                        </span>
                      </div>
                    )}
                    {product.dimensions && (
                      <div className="flex justify-between py-3 border-b border-secondary-100">
                        <span className="text-secondary-500">Kích thước</span>
                        <span className="font-medium text-secondary-900">
                          {typeof product.dimensions === "string"
                            ? product.dimensions
                            : `${product.dimensions.length || 0}x${
                                product.dimensions.width || 0
                              }x${product.dimensions.height || 0} ${
                                product.dimensions.unit || "cm"
                              }`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-3 border-b border-secondary-100">
                      <span className="text-secondary-500">Thương hiệu</span>
                      <span className="font-medium text-secondary-900">
                        FurniMart
                      </span>
                    </div>
                  </div>
                )}
                {activeTab === "reviews" && (
                  <div className="space-y-8">
                    {canReview && (
                      <div className="bg-primary-50 p-6 rounded-xl flex items-center justify-between border border-primary-100">
                        <div>
                          <h4 className="font-bold text-primary-900 mb-1">
                            Chia sẻ trải nghiệm của bạn
                          </h4>
                          <p className="text-sm text-primary-700">
                            Đánh giá của bạn giúp cộng đồng mua sắm tốt hơn
                          </p>
                        </div>
                        <Button
                          variant="primary"
                          onClick={() => setReviewModalOpen(true)}
                        >
                          Viết đánh giá
                        </Button>
                      </div>
                    )}

                    {reviews?.length === 0 && !canReview && (
                      <EmptyState
                        icon={
                          <FiStar className="w-12 h-12 text-secondary-300" />
                        }
                        title="Chưa có đánh giá"
                        description="Sản phẩm này chưa có bài đánh giá nào."
                      />
                    )}

                    {reviews?.map((review: Review) => (
                      <div
                        key={review.id}
                        className="border-b border-secondary-100 pb-8 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center font-bold text-secondary-500 text-sm">
                            {(review.customerName || "K").charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-secondary-900 text-sm">
                              {review.customerName || "Khách hàng"}
                            </div>
                            <div className="flex text-accent-500 text-xs mt-0.5">
                              {[...Array(5)].map((_, i) => (
                                <FiStar
                                  key={i}
                                  className={cn(
                                    "w-3 h-3",
                                    i < review.rating && "fill-current"
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-secondary-400 ml-auto">
                            Đã mua hàng
                          </span>
                        </div>
                        <p className="text-secondary-600 leading-relaxed mt-3 pl-12 text-sm">
                          {review.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsControlled>
        </div>
      </Section>

      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Đánh giá sản phẩm"
      >
        <form
          onSubmit={handleSubmit((data) => createReviewMutation.mutate(data))}
          className="space-y-6"
        >
          <input type="hidden" {...register("productId")} value={productId} />

          <div className="text-center">
            <p className="text-sm text-secondary-500 mb-3">
              Bạn cảm thấy sản phẩm thế nào?
            </p>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setValue("rating", star)}
                  className="text-4xl text-secondary-200 hover:text-accent-400 focus:text-accent-500 transition-colors transform hover:scale-110 duration-200"
                >
                  <FiStar
                    className={
                      star <= rating
                        ? "fill-accent-500 text-accent-500 shadow-glow"
                        : ""
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <Textarea
            {...register("comment")}
            placeholder="Hãy chia sẻ những điều bạn thích về sản phẩm này..."
            rows={4}
            className="resize-none"
          />
          <Button
            type="submit"
            variant="primary"
            className="w-full text-base py-3"
            isLoading={createReviewMutation.isPending}
          >
            Gửi đánh giá
          </Button>
        </form>
      </Modal>
    </div>
  );
}
