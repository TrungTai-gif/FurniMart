import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

const statusColors: Record<string, string> = {
  pending: '#FFB800',
  confirmed: '#2196F3',
  processing: '#9C27B0',
  shipping: '#FF9800',
  delivered: '#4CAF50',
  cancelled: '#f44336',
};

export default function OrdersScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const address = !item.shippingAddress
      ? 'Chưa có địa chỉ'
      : typeof item.shippingAddress === 'string'
      ? item.shippingAddress
      : item.shippingAddress && typeof item.shippingAddress === 'object'
      ? `${item.shippingAddress.street || ''}, ${item.shippingAddress.ward || ''}, ${item.shippingAddress.district || ''}, ${item.shippingAddress.city || ''}`
      : 'Chưa có địa chỉ';

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('OrderDetail' as never, { orderId: item._id } as never)}
        activeOpacity={0.7}
      >
        <Card style={styles.orderCard} variant="elevated">
          <View style={styles.orderHeader}>
            <View style={styles.orderIdContainer}>
              <Ionicons name="receipt-outline" size={20} color={colors.secondary} style={styles.orderIcon} />
              <Text style={styles.orderId}>Đơn hàng #{item._id ? item._id.slice(-6) : 'N/A'}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColors[item.status] || colors.gray[500] },
              ]}
            >
              <Text style={styles.statusText}>
                {statusLabels[item.status] || item.status || 'N/A'}
              </Text>
            </View>
          </View>
          <View style={styles.orderInfoRow}>
            <Ionicons name="time-outline" size={16} color={colors.gray[500]} />
            <Text style={styles.orderDate}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
            </Text>
          </View>
          <View style={styles.orderInfoRow}>
            <Ionicons name="map-outline" size={16} color={colors.gray[500]} />
            <Text style={styles.orderAddress} numberOfLines={1}>
              {address}
            </Text>
          </View>
          <View style={styles.orderFooter}>
            <Text style={styles.orderTotal}>
              {(item.totalPrice || 0).toLocaleString('vi-VN')}đ
            </Text>
            <View style={styles.orderItemsContainer}>
              <Ionicons name="cube-outline" size={16} color={colors.gray[500]} />
              <Text style={styles.orderItems}>
                {item.items?.length || 0} sản phẩm
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFB800" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={colors.gray[300]} style={{ marginBottom: spacing.md }} />
            <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
            <Text style={styles.emptySubtext}>Đơn hàng của bạn sẽ hiển thị ở đây</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
  },
  orderCard: {
    marginBottom: spacing.lg,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderIcon: {
    marginRight: spacing.xs,
  },
  orderId: {
    ...typography.h4,
    color: colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  statusText: {
    color: colors.white,
    ...typography.labelSmall,
    fontWeight: '600',
  },
  orderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  orderDate: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  orderAddress: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  orderTotal: {
    ...typography.h3,
    color: colors.secondary,
  },
  orderItemsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  orderItems: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    minHeight: 400,
  },
  emptyText: {
    ...typography.h4,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.bodySmall,
    color: colors.gray[400],
    textAlign: 'center',
  },
});

