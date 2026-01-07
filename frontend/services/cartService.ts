import apiClient from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { CartItem, Product } from "@/lib/types";
import { productService } from "./productService";

// Backend returns CartDocument with items array
interface CartResponse {
  items: CartItem[];
  userId?: string;
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const cartService = {
  getCart: async (): Promise<CartItem[]> => {
    const response = await apiClient.get<CartResponse>(
      endpoints.cart.get
    );
    // Backend returns CartDocument with items array
    const items = response.data?.items || [];
    // Fetch product info for items that don't have it
    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const itemAny = item as any;
        let product = item.product || {} as Product;
        let price = Number(item.price) || Number(itemAny.price) || Number(product?.price) || 0;
        
        // If product info is missing, fetch it from product service
        if (!product?.id && !product?.name && item.productId) {
          try {
            const fetchedProduct = await productService.getProduct(item.productId);
            product = fetchedProduct;
            price = price || Number(fetchedProduct.price) || 0;
          } catch (error) {
            // If product fetch fails, use fallback
            console.warn(`Failed to fetch product ${item.productId}:`, error);
          }
        }
        
        return {
          ...item,
          id: item.id || itemAny._id || `temp-${Date.now()}-${Math.random()}`,
          productId: item.productId || product?.id || itemAny.product?._id || '',
          price: price, // Ensure price is always a number
          product: {
            ...product,
            images: product?.images || [],
            name: product?.name || 'Sản phẩm',
            id: product?.id || item.productId || itemAny.product?._id || '',
            price: product?.price || price, // Ensure product.price is also set
          } as Product,
        };
      })
    );
    
    return itemsWithProducts;
  },

  syncCart: async (items: Array<{ productId: string; quantity: number; branchId?: string }>): Promise<CartItem[]> => {
    const response = await apiClient.post<CartResponse>(endpoints.cart.sync, { items });
    // Backend returns CartDocument with items array
    const backendItems = response.data?.items || [];
    // Ensure all items have required fields including price
    return backendItems.map(item => {
      const itemAny = item as any;
      const product = item.product || {} as Product;
      const price = Number(item.price) || Number(itemAny.price) || Number(product?.price) || 0;
      return {
        ...item,
        id: item.id || itemAny._id || `temp-${Date.now()}-${Math.random()}`,
        productId: item.productId || product?.id || itemAny.product?._id || '',
        price: price,
        product: {
          ...product,
          images: product?.images || [],
          name: product?.name || 'Sản phẩm',
          id: product?.id || item.productId || itemAny.product?._id || '',
          price: product?.price || price,
        } as Product,
      };
    });
  },

  addToCart: async (
    productId: string,
    quantity: number,
    branchId?: string
  ): Promise<CartItem> => {
    const response = await apiClient.post<CartResponse>(
      endpoints.cart.add,
      { productId, quantity, branchId }
    );
    // Backend returns CartDocument, but we need the last item added
    // In practice, backend should return the updated cart or the added item
    // For now, we'll return the first item or create a temporary one
    const items = response.data?.items || [];
    const lastItem = items[items.length - 1];
    if (lastItem) {
      const itemAny = lastItem as any;
      const product = lastItem.product || {} as Product;
      const price = Number(lastItem.price) || Number(itemAny.price) || Number(product?.price) || 0;
      return {
        ...lastItem,
        id: lastItem.id || itemAny._id || `temp-${Date.now()}-${Math.random()}`,
        productId: lastItem.productId || product?.id || itemAny.product?._id || productId,
        price: price,
        product: {
          ...product,
          images: product?.images || [],
          name: product?.name || 'Sản phẩm',
          id: product?.id || lastItem.productId || itemAny.product?._id || productId,
          price: product?.price || price,
        } as Product,
      };
    }
    // Fallback: create a minimal cart item
    return { 
      productId, 
      quantity, 
      branchId, 
      price: 0, 
      product: {} as Product, 
      id: "" 
    };
  },

  updateCartItem: async (productId: string, quantity: number): Promise<CartItem> => {
    const response = await apiClient.put<CartResponse>(
      endpoints.cart.update(productId),
      { quantity }
    );
    // Backend returns CartDocument, find the updated item
    const items = response.data?.items || [];
    const foundItem = items.find(item => item.productId === productId);
    if (foundItem) {
      const itemAny = foundItem as any;
      const product = foundItem.product || {} as Product;
      const price = Number(foundItem.price) || Number(itemAny.price) || Number(product?.price) || 0;
      return {
        ...foundItem,
        id: foundItem.id || itemAny._id || `temp-${Date.now()}-${Math.random()}`,
        productId: foundItem.productId || product?.id || itemAny.product?._id || productId,
        price: price,
        product: {
          ...product,
          images: product?.images || [],
          name: product?.name || 'Sản phẩm',
          id: product?.id || foundItem.productId || itemAny.product?._id || productId,
          price: product?.price || price,
        } as Product,
      };
    }
    // Fallback: create a minimal cart item
    return { 
      productId, 
      quantity, 
      price: 0, 
      product: {} as Product, 
      id: "" 
    };
  },

  removeFromCart: async (productId: string): Promise<void> => {
    await apiClient.delete(endpoints.cart.remove(productId));
  },

  clearCart: async (): Promise<void> => {
    await apiClient.delete(endpoints.cart.clear);
  },
};

