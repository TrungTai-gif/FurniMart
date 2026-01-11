import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { colors, spacing, borderRadius, shadows, typography } from '../../theme';
import { getImageUrl } from '../../config/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
// import { View3D } from 'expo-3d-model-view'; // Uncomment when 3D models are available

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const productId = (route.params as any)?.productId;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [show3D, setShow3D] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();
  const { toast, showSuccess, showError, hideToast } = useToast();

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const data = await productService.getById(productId);
      setProduct(data);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải thông tin sản phẩm');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      if (product.stock === 0) {
        showError('Sản phẩm đã hết hàng! 😢');
        return;
      }
      if (quantity > product.stock) {
        showError(`Chỉ còn ${String(Number(product.stock || 0))} sản phẩm trong kho!`);
        return;
      }
      addItem(product, quantity);
      showSuccess(`Đã thêm ${quantity} "${product.name}" vào giỏ hàng! 🛒`);
    }
  };

  if (loading || !product) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const finalPrice = (product.discount || 0) > 0
    ? (product.price || 0) - (product.discount || 0)
    : (product.price || 0);

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
      <ScrollView style={styles.scrollView}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setSelectedImageIndex(index);
            }}
          >
            {product.images?.map((image, index) => (
              <Image
                key={index}
                source={{ uri: getImageUrl(image) }}
                style={styles.productImage}
              />
            ))}
          </ScrollView>
          {product.images && product.images.length > 1 && (
            <View style={styles.imageIndicators}>
              {product.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === selectedImageIndex && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{String(product.name || '')}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>{String(Number(finalPrice || 0).toLocaleString('vi-VN'))}đ</Text>
            {product.discount > 0 && (
              <>
                <Text style={styles.oldPrice}>
                  {String(Number(product.price || 0).toLocaleString('vi-VN'))}đ
                </Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    -{String(Math.round(((product.discount || 0) / (product.price || 1)) * 100))}%
                  </Text>
                </View>
              </>
            )}
          </View>

          {product.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>
                ⭐ {String(Number(product.rating || 0).toFixed(1))} ({String(Number(product.reviewCount || 0))} đánh giá)
              </Text>
            </View>
          )}

          <Text style={styles.description}>{String(product.description || '')}</Text>

          {/* 3D View Toggle */}
          <TouchableOpacity
            style={styles.view3DButton}
            onPress={() => setShow3D(!show3D)}
          >
            <Text style={styles.view3DText}>
              {show3D ? 'Ẩn' : 'Xem'} chế độ 3D
            </Text>
          </TouchableOpacity>

          {show3D && product.images?.[0] && (
            <View style={styles.view3DContainer}>
              <Text style={styles.view3DNote}>
                Chế độ xem 3D (nếu có model 3D)
              </Text>
              <View style={styles.view3DPlaceholder}>
                <Text style={styles.view3DPlaceholderText}>
                  3D Model Viewer
                </Text>
                <Text style={styles.view3DPlaceholderSubtext}>
                  Cần file 3D model (.glb/.gltf) để hiển thị
                </Text>
              </View>
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Số lượng:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.stockText}>Còn {String(Number(product.stock || 0))} sản phẩm</Text>
          </View>

          {/* Add to Cart Button */}
          <Button
            title={product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
            onPress={handleAddToCart}
            variant="primary"
            size="large"
            disabled={product.stock === 0}
            icon={<Ionicons name="bag-add" size={20} color={colors.white} />}
            style={styles.addToCartButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width,
    height: 400,
    resizeMode: 'cover',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  infoContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginTop: -borderRadius.xl,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  productName: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  price: {
    ...typography.h1,
    color: colors.secondary,
  },
  oldPrice: {
    ...typography.h4,
    color: colors.gray[500],
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  discountText: {
    color: colors.white,
    ...typography.labelSmall,
    fontWeight: 'bold',
  },
  ratingContainer: {
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  view3DButton: {
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  view3DText: {
    ...typography.label,
    color: colors.text.primary,
  },
  view3DContainer: {
    marginBottom: spacing.lg,
  },
  view3DNote: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  view3DPlaceholder: {
    height: 200,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
  },
  view3DPlaceholderText: {
    ...typography.h4,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  view3DPlaceholderSubtext: {
    ...typography.bodySmall,
    color: colors.gray[400],
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  quantityLabel: {
    ...typography.label,
    color: colors.text.primary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[50],
  },
  quantityButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValue: {
    minWidth: 50,
    textAlign: 'center',
    ...typography.label,
    color: colors.text.primary,
  },
  stockText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  addToCartButton: {
    marginTop: spacing.sm,
  },
  quantityButtonText: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '600',
  },
});

