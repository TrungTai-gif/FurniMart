import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/cartStore';
import { colors, spacing, borderRadius, shadows, typography } from '../../theme';
import { getImageUrl } from '../../config/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';

export default function CartScreen() {
  const navigation = useNavigation();
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems, clearCart } = useCartStore();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const handleCheckout = () => {
    if (items.length === 0) {
      showError('Giỏ hàng trống! Vui lòng thêm sản phẩm! 🛒');
      return;
    }
    navigation.navigate('Checkout' as never);
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    Alert.alert(
      'Xóa sản phẩm',
      `Bạn có chắc muốn xóa "${productName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            removeItem(productId);
            showSuccess('Đã xóa sản phẩm khỏi giỏ hàng! 🗑️');
          },
        },
      ]
    );
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number, productName: string) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId, productName);
      return;
    }
    updateQuantity(productId, newQuantity);
    if (newQuantity > 1) {
      showSuccess(`Đã cập nhật số lượng "${productName}"! ✏️`);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const finalPrice = (item.product.price || 0) - (item.product.discount || 0);
    
    return (
      <Card style={styles.cartItem} variant="elevated">
        <View style={styles.cartItemContent}>
          <Image
            source={{ uri: getImageUrl(item.product.images?.[0]) }}
            style={styles.itemImage}
          />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>
              {String(item.product.name || '')}
            </Text>
            <Text style={styles.itemPrice}>
              {finalPrice.toLocaleString('vi-VN')}đ
            </Text>
            <View style={styles.itemControls}>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleUpdateQuantity(item.product._id, item.quantity - 1, item.product.name)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove-circle" size={24} color={colors.secondary} />
                </TouchableOpacity>
                <View style={styles.quantityValueContainer}>
                  <Text style={styles.quantityValue}>{item.quantity}</Text>
                </View>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleUpdateQuantity(item.product._id, item.quantity + 1, item.product.name)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle" size={24} color={colors.secondary} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleRemoveItem(item.product._id, item.product.name)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
        />
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={80} color={colors.gray[300]} />
          <Text style={styles.emptyText}>Giỏ hàng trống</Text>
          <Text style={styles.emptySubtext}>Thêm sản phẩm vào giỏ hàng để bắt đầu mua sắm</Text>
          <Button
            title="Mua sắm ngay"
            onPress={() => navigation.navigate('Products' as never)}
            variant="primary"
            size="medium"
            icon={<Ionicons name="storefront" size={18} color={colors.white} />}
            style={styles.shopButton}
          />
        </View>
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
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.product._id}
        contentContainerStyle={styles.listContent}
      />
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalPrice}>
            {getTotalPrice().toLocaleString('vi-VN')}đ
          </Text>
        </View>
        <Button
          title={`Thanh toán (${getTotalItems()} sản phẩm)`}
          onPress={handleCheckout}
          variant="primary"
          size="large"
          icon={<Ionicons name="wallet" size={20} color={colors.white} />}
          style={styles.checkoutButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
  },
  cartItem: {
    marginBottom: spacing.lg,
  },
  cartItemContent: {
    flexDirection: 'row',
  },
  itemImage: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
    resizeMode: 'cover',
    marginRight: spacing.md,
    backgroundColor: colors.gray[100],
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  itemPrice: {
    ...typography.h3,
    color: colors.secondary,
    marginBottom: spacing.md,
  },
  itemControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[50],
  },
  quantityButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValueContainer: {
    minWidth: 40,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    ...typography.label,
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  footer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderTopWidth: 2,
    borderTopColor: colors.gray[200],
    ...shadows.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  totalLabel: {
    ...typography.h4,
    color: colors.text.primary,
  },
  totalPrice: {
    ...typography.h2,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  checkoutButton: {
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    minHeight: 400,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontWeight: 'bold',
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  shopButton: {
    marginTop: spacing.md,
    minWidth: 200,
  },
});

