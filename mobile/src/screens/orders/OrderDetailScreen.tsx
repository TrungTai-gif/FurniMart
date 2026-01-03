import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { orderService } from '../../services/orderService';
import { Order } from '../../types';
import { colors, spacing, borderRadius, shadows, typography } from '../../theme';
import Card from '../../components/Card';

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao hàng',
  delivered: 'Đã giao hàng',
  cancelled: 'Đã hủy',
};

export default function OrderDetailScreen() {
  const route = useRoute();
  const orderId = (route.params as any)?.orderId;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const data = await orderService.getById(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !order) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFB800" />
      </View>
    );
  }

  const getAddressString = (): string => {
    if (!order.shippingAddress) {
      return 'Chưa có địa chỉ';
    }
    if (typeof order.shippingAddress === 'string') {
      return order.shippingAddress;
    }
    if (typeof order.shippingAddress === 'object') {
      const addr = order.shippingAddress;
      const parts = [
        addr.street || '',
        addr.ward || '',
        addr.district || '',
        addr.city || ''
      ].filter(part => part.trim() !== '');
      return parts.length > 0 ? parts.join(', ') : 'Chưa có địa chỉ';
    }
    return 'Chưa có địa chỉ';
  };
  
  const address = getAddressString();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Order Status */}
      <Card style={styles.section} variant="elevated">
        <View style={styles.sectionHeader}>
          <Ionicons name="time-outline" size={24} color={colors.secondary} />
          <Text style={styles.sectionTitle}>Trạng thái đơn hàng</Text>
        </View>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {String(statusLabels[order.status] || order.status || 'N/A')}
          </Text>
        </View>
      </Card>

      {/* Order Items */}
      <Card style={styles.section} variant="elevated">
        <View style={styles.sectionHeader}>
          <Ionicons name="cube-outline" size={24} color={colors.secondary} />
          <Text style={styles.sectionTitle}>Sản phẩm</Text>
        </View>
        {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
          order.items.map((item, index) => {
            if (!item) return null;
            
            const productName = String(item.productName || 'Sản phẩm');
            const quantity = Number(item.quantity || 0);
            const price = Number(item.price || 0);
            const itemKey = item.productId || `item-${index}`;
            
            return (
              <View key={itemKey} style={styles.orderItem}>
                <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                  <Ionicons name="image-outline" size={32} color={colors.gray[400]} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>
                    {productName}
                  </Text>
                  <View style={styles.itemDetails}>
                    <View style={styles.itemDetailRow}>
                      <Ionicons name="cube-outline" size={16} color={colors.gray[500]} />
                      <Text style={styles.itemQuantity}>
                        Số lượng: {String(quantity)}
                      </Text>
                    </View>
                    <Text style={styles.itemPrice}>
                      {String(price.toLocaleString('vi-VN'))}đ
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyItems}>
            <Text style={styles.emptyItemsText}>Không có sản phẩm nào</Text>
          </View>
        )}
      </Card>

      {/* Shipping Address */}
      <Card style={styles.section} variant="elevated">
        <View style={styles.sectionHeader}>
          <Ionicons name="map-outline" size={24} color={colors.secondary} />
          <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
        </View>
        <Text style={styles.addressText}>{String(address || 'Chưa có địa chỉ')}</Text>
      </Card>

      {/* Order Summary */}
      <Card style={styles.section} variant="elevated">
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text-outline" size={24} color={colors.secondary} />
          <Text style={styles.sectionTitle}>Tổng kết</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tạm tính:</Text>
          <Text style={styles.summaryValue}>
            {String(Number(order.totalPrice || 0).toLocaleString('vi-VN'))}đ
          </Text>
        </View>
        {order.totalDiscount && Number(order.totalDiscount) > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Giảm giá:</Text>
            <Text style={[styles.summaryValue, styles.discountValue]}>
              -{String(Number(order.totalDiscount || 0).toLocaleString('vi-VN'))}đ
            </Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalValue}>
            {String(Number(order.totalPrice || 0).toLocaleString('vi-VN'))}đ
          </Text>
        </View>
      </Card>

      {/* Payment Info */}
      <Card style={styles.section} variant="elevated">
        <View style={styles.sectionHeader}>
          <Ionicons name="wallet-outline" size={24} color={colors.secondary} />
          <Text style={styles.sectionTitle}>Thanh toán</Text>
        </View>
        <View style={styles.paymentRow}>
          <Ionicons name="wallet-outline" size={16} color={colors.gray[500]} />
          <Text style={styles.paymentText}>
            Phương thức: {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : order.paymentMethod === 'bank' ? 'Chuyển khoản ngân hàng' : String(order.paymentMethod || 'COD')}
          </Text>
        </View>
        <View style={styles.paymentRow}>
          <Ionicons name={order.isPaid ? 'checkmark-circle' : 'time-outline'} size={16} color={order.isPaid ? colors.success : colors.warning} />
          <Text style={[styles.paymentStatus, order.isPaid && styles.paymentStatusPaid]}>
            Trạng thái: {String(order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán')}
          </Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  statusContainer: {
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  statusText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    backgroundColor: colors.gray[100],
  },
  itemImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  itemDetails: {
    gap: spacing.xs,
  },
  itemDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  itemQuantity: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  itemPrice: {
    ...typography.h4,
    color: colors.secondary,
  },
  addressText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  summaryValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  discountValue: {
    color: colors.success,
  },
  totalRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  totalLabel: {
    ...typography.h4,
    color: colors.text.primary,
  },
  totalValue: {
    ...typography.h2,
    color: colors.secondary,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  paymentText: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  paymentStatus: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  paymentStatusPaid: {
    color: colors.success,
    fontWeight: '600',
  },
  emptyItems: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyItemsText: {
    ...typography.body,
    color: colors.text.secondary,
  },
});

