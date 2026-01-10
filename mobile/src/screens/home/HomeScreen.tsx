import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { productService, categoryService } from '../../services/productService';
import { Product, Category } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { colors, spacing, borderRadius, shadows, typography } from '../../theme';
import { getImageUrl } from '../../config/api';
import Button from '../../components/Button';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { addItem } = useCartStore();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    showSuccess(`Đã thêm "${product.name}" vào giỏ hàng! 🛒`);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.getAll({ limit: 10 }),
        categoryService.getAll(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      // Only show error if it's a network error
      const errorMessage = error?.message || 'Lỗi kết nối. Vui lòng kiểm tra kết nối mạng.';
      if (errorMessage.includes('Network') || errorMessage.includes('kết nối') || errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) {
        // Show error only once - use a debounced approach
        showError('Lỗi kết nối. Vui lòng kiểm tra kết nối mạng.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryLight, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Ionicons name="storefront" size={36} color={colors.white} />
            </View>
            <Text style={styles.headerTitle}>FurniMart</Text>
            <Text style={styles.headerSubtitle}>Nội thất cao cấp cho mọi nhà</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>10K+</Text>
                <Text style={styles.statLabel}>Sản phẩm</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>50K+</Text>
                <Text style={styles.statLabel}>Khách hàng</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>4.8★</Text>
                <Text style={styles.statLabel}>Đánh giá</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Categories */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Danh mục sản phẩm</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Products' as never)}>
                <Text style={styles.seeAllText}>Xem tất cả →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category._id}
                  style={styles.categoryCard}
                  onPress={() => navigation.navigate('Products' as never, { categoryId: category._id } as never)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryIconContainer}>
                    <Ionicons name="layers-outline" size={24} color={colors.secondary} />
                  </View>
                  <Text style={styles.categoryName}>{String(category.name || '')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sản phẩm nổi bật</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Products' as never)}>
              <Text style={styles.seeAllText}>Xem tất cả →</Text>
            </TouchableOpacity>
          </View>
          {products.length === 0 ? (
            <View style={styles.emptyProducts}>
              <Ionicons name="cube-outline" size={48} color={colors.gray[300]} />
              <Text style={styles.emptyProductsText}>Chưa có sản phẩm nào</Text>
            </View>
          ) : (
            products.map((product) => (
              <TouchableOpacity
                key={product._id}
                style={styles.productCard}
                onPress={() => navigation.navigate('ProductDetail' as never, { productId: product._id } as never)}
                activeOpacity={0.8}
              >
                <View style={styles.productImageContainer}>
                  <Image
                    source={{ uri: getImageUrl(product.images?.[0]) }}
                    style={styles.productImage}
                  />
                  {product.discount > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>
                        -{String(Math.round(((product.discount || 0) / (product.price || 1)) * 100))}%
                      </Text>
                    </View>
                  )}
                  {product.stock === 0 && (
                    <View style={styles.outOfStockOverlay}>
                      <Text style={styles.outOfStockText}>Hết hàng</Text>
                    </View>
                  )}
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {String(product.name || '')}
                  </Text>
                  <View style={styles.productPriceRow}>
                    <Text style={styles.productPrice}>
                      {String(Number(product.discount
                        ? ((product.price || 0) - (product.discount || 0))
                        : (product.price || 0)).toLocaleString('vi-VN'))}đ
                    </Text>
                    {product.discount > 0 && (
                      <Text style={styles.productOldPrice}>
                        {String(Number(product.price || 0).toLocaleString('vi-VN'))}đ
                      </Text>
                    )}
                  </View>
                  <View style={styles.productFooter}>
                    <View style={styles.stockInfo}>
                      <Ionicons name="checkmark-circle-outline" size={14} color={product.stock > 0 ? colors.success : colors.error} />
                      <Text style={styles.stockText}>Còn {String(Number(product.stock || 0))} sản phẩm</Text>
                    </View>
                    <Button
                      title="Thêm"
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      variant="primary"
                      size="small"
                      icon={<Ionicons name="bag-add" size={14} color={colors.white} />}
                      style={styles.addToCartButton}
                      disabled={product.stock === 0}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.white,
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '500',
  },
  section: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  seeAllText: {
    ...typography.label,
    color: colors.secondary,
    fontWeight: '600',
  },
  categoriesContainer: {
    paddingRight: spacing.lg,
  },
  categoryCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginRight: spacing.md,
    minWidth: 110,
    alignItems: 'center',
    ...shadows.md,
    borderWidth: 2,
    borderColor: colors.gray[200],
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryName: {
    ...typography.label,
    color: colors.text.primary,
    textAlign: 'center',
  },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.lg,
    borderWidth: 2,
    borderColor: colors.gray[200],
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    height: 220,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: colors.gray[100],
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  discountText: {
    ...typography.labelSmall,
    color: colors.white,
    fontWeight: 'bold',
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
    ...typography.h4,
    color: colors.white,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: spacing.lg,
  },
  productName: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    minHeight: 48,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  productPrice: {
    ...typography.h3,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  productOldPrice: {
    ...typography.bodySmall,
    color: colors.gray[500],
    textDecorationLine: 'line-through',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stockText: {
    ...typography.bodySmall,
    color: colors.gray[500],
  },
  addToCartButton: {
    flex: 0,
    minWidth: 100,
  },
  emptyProducts: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyProductsText: {
    ...typography.body,
    color: colors.gray[500],
    marginTop: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...typography.h3,
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});

