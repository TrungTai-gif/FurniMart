import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { productService, categoryService } from '../../services/productService';
import { Product, Category } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { colors, spacing, borderRadius, shadows, typography } from '../../theme';
import { getImageUrl } from '../../config/api';
import Button from '../../components/Button';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';

export default function ProductsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    (route.params as any)?.categoryId || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const { addItem } = useCartStore();
  const { toast, showSuccess, showError, hideToast } = useToast();

  useEffect(() => {
    loadCategories();
    loadAllProducts();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter products client-side
  useEffect(() => {
    filterProducts();
  }, [selectedCategory, debouncedSearch, allProducts]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadAllProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAll();
      setAllProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      showError('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...allProducts];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((product) => {
        // Check categoryId first (ObjectId)
        if ((product as any).categoryId) {
          const categoryId = String((product as any).categoryId);
          if (categoryId === selectedCategory) {
            return true;
          }
        }

        // Check category as object with _id
        if (product.category && typeof product.category === 'object' && (product.category as any)._id) {
          const categoryId = String((product.category as any)._id);
          if (categoryId === selectedCategory) {
            return true;
          }
        }

        // Check category as string (category name or ID)
        if (typeof product.category === 'string') {
          // Try matching as ID first
          if (product.category === selectedCategory) {
            return true;
          }
          // If not, find category by name
          const category = categories.find(cat => cat._id === selectedCategory);
          if (category && product.category === category.name) {
            return true;
          }
        }

        return false;
      });

      console.log('Filtered products count:', filtered.length, 'for category:', selectedCategory);
      console.log('Sample products:', filtered.slice(0, 2).map(p => ({
        name: p.name,
        category: p.category,
        categoryId: (p as any).categoryId
      })));
    }

    // Filter by search query
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase().trim();
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query))
      );
    }

    // Sort products: newest first, then by name
    filtered.sort((a, b) => {
      // First by creation date (newest first)
      if (a.createdAt && b.createdAt) {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        if (dateB !== dateA) {
          return dateB - dateA;
        }
      }
      // Then by name alphabetically
      return a.name.localeCompare(b.name, 'vi');
    });

    setProducts(filtered);
  };

  const handleAddToCart = (product: Product) => {
    if (product.stock === 0) {
      showError('Sản phẩm đã hết hàng! 😢');
      return;
    }
    addItem(product, 1);
    showSuccess(`Đã thêm "${product.name}" vào giỏ hàng! 🛒`);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail' as never, { productId: item._id } as never)}
      activeOpacity={0.8}
    >
      <View style={styles.productImageContainer}>
        <Image
          source={{ uri: getImageUrl(item.images?.[0]) }}
          style={styles.productImage}
        />
        {item.discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              -{String(Math.round(((item.discount || 0) / (item.price || 1)) * 100))}%
            </Text>
          </View>
        )}
        {item.stock === 0 && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Hết hàng</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {String(item.name || '')}
        </Text>
        <View style={styles.productPriceRow}>
          <Text style={styles.productPrice}>
            {item.discount
              ? (item.price - item.discount).toLocaleString('vi-VN')
              : item.price.toLocaleString('vi-VN')}
            đ
          </Text>
          {item.discount > 0 && (
            <Text style={styles.productOldPrice}>
              {String(Number(item.price || 0).toLocaleString('vi-VN'))}đ
            </Text>
          )}
        </View>
        <View style={styles.productFooter}>
          <View style={styles.stockInfo}>
            <Ionicons name="checkmark-circle-outline" size={12} color={item.stock > 0 ? colors.success : colors.error} />
            <Text style={styles.stockText}>{String(Number(item.stock || 0))}</Text>
          </View>
          <Button
            title="Thêm"
            onPress={() => handleAddToCart(item)}
            variant="primary"
            size="small"
            icon={<Ionicons name="bag-add" size={12} color={colors.white} />}
            style={styles.addToCartButton}
            disabled={item.stock === 0}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && products.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.gray[500]} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm sản phẩm..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle-outline" size={20} color={colors.gray[500]} />
          </TouchableOpacity>
        )}
      </View>

      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              !selectedCategory && styles.filterChipActive,
            ]}
            onPress={() => setSelectedCategory(null)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="apps"
              size={16}
              color={!selectedCategory ? colors.white : colors.text.secondary}
              style={styles.filterIcon}
            />
            <Text
              style={[
                styles.filterChipText,
                !selectedCategory && styles.filterChipTextActive,
              ]}
            >
              Tất cả
            </Text>
          </TouchableOpacity>
          {categories.map((category) => {
            const getCategoryIcon = (name: string) => {
              const nameLower = name.toLowerCase();
              if (nameLower.includes('sofa') || nameLower.includes('ghế dài')) return 'couch-outline';
              if (nameLower.includes('ghế') || nameLower.includes('chair')) return 'cube-outline'; // Changed from chair-outline (doesn't exist)
              if (nameLower.includes('bàn') || nameLower.includes('table')) return 'restaurant-outline';
              if (nameLower.includes('giường') || nameLower.includes('bed')) return 'bed-outline';
              if (nameLower.includes('tủ') || nameLower.includes('cabinet')) return 'archive-outline';
              return 'grid-outline';
            };

            const isActive = selectedCategory === category._id;

            return (
              <TouchableOpacity
                key={category._id}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
                onPress={() => {
                  console.log('Selected category:', category._id, category.name);
                  setSelectedCategory(category._id);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={getCategoryIcon(category.name) as any}
                  size={16}
                  color={isActive ? colors.white : colors.secondary}
                  style={styles.filterIcon}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không tìm thấy sản phẩm</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md + 4,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    ...shadows.sm,
    elevation: 2,
  },
  searchIcon: {
    marginLeft: spacing.xs,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm + 2,
    paddingLeft: spacing.xl + 4,
    backgroundColor: colors.gray[50],
    fontSize: 15,
    paddingRight: spacing.md,
    ...typography.bodySmall,
    height: 44,
  },
  filterScrollView: {
    backgroundColor: colors.white,
    maxHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    minHeight: 52,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    marginRight: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.gray[300],
    minHeight: 40,
    justifyContent: 'center',
    gap: spacing.xs + 2,
    ...shadows.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.md,
    elevation: 3,
    transform: [{ scale: 1.05 }],
  },
  filterIcon: {
    marginRight: 0,
  },
  filterChipText: {
    ...typography.labelSmall,
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  listContent: {
    padding: spacing.sm + 2,
    paddingBottom: spacing.xl,
  },
  row: {
    justifyContent: 'space-between',
    gap: spacing.sm + 2,
  },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    width: '48%',
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
    elevation: 2,
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
    backgroundColor: colors.gray[50],
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: colors.gray[100],
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.xs + 2,
    right: spacing.xs + 2,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    zIndex: 1,
  },
  discountText: {
    ...typography.labelSmall,
    color: colors.white,
    fontWeight: '700',
    fontSize: 11,
    lineHeight: 14,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    ...typography.label,
    color: colors.white,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: spacing.sm + 2,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm + 2,
  },
  productName: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs + 2,
    minHeight: 38,
    fontSize: 13,
    lineHeight: 18,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  productPrice: {
    ...typography.h4,
    color: colors.secondary,
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 20,
  },
  productOldPrice: {
    ...typography.labelSmall,
    color: colors.gray[400],
    textDecorationLine: 'line-through',
    fontSize: 11,
    lineHeight: 14,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  stockText: {
    ...typography.labelSmall,
    color: colors.gray[500],
    fontSize: 10,
    lineHeight: 12,
  },
  addToCartButton: {
    flex: 0,
    minWidth: 70,
    paddingHorizontal: spacing.xs + 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    minHeight: 300,
    paddingTop: spacing.xxl * 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
    textAlign: 'center',
    fontSize: 15,
  },
});

