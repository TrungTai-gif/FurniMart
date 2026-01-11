import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { orderService } from '../../services/orderService';
import { userService } from '../../services/userService';
import { paymentService } from '../../services/paymentService';
import { promotionService } from '../../services/promotionService';
import { Address } from '../../types';
import { colors, spacing, borderRadius, shadows, typography } from '../../theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [promotionCode, setPromotionCode] = useState('');
  const [promotionDiscount, setPromotionDiscount] = useState(0);
  const [appliedPromotion, setAppliedPromotion] = useState<any>(null);
  const { toast, showSuccess, showError, hideToast } = useToast();

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const userData = await userService.getProfile();
      if (userData.addresses && userData.addresses.length > 0) {
        setAddresses(userData.addresses);
        const defaultAddress = userData.addresses.find(addr => addr.isDefault) || userData.addresses[0];
        setSelectedAddress(defaultAddress);
      }
    } catch (error) {
      // Error loading addresses
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      showError('Vui lòng chọn địa chỉ giao hàng! 📍');
      return;
    }

    if (items.length === 0) {
      showError('Giỏ hàng trống! Vui lòng thêm sản phẩm! 🛒');
      return;
    }

    // Validate phone number
    const phoneNumber = selectedAddress?.phone || user?.phone;
    if (!phoneNumber) {
      showError('Vui lòng cập nhật số điện thoại trong địa chỉ giao hàng! 📱');
      return;
    }

    setLoading(true);
    try {
      // Format shipping address as string if it's an object
      let shippingAddressString: string;
      if (typeof selectedAddress === 'string') {
        shippingAddressString = selectedAddress;
      } else if (selectedAddress) {
        shippingAddressString = `${selectedAddress.street}, ${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.city}`;
      } else {
        throw new Error('Địa chỉ giao hàng không hợp lệ');
      }

      const orderData = {
        items: items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: (item.product.price || 0) - (item.product.discount || 0),
        })),
        shippingAddress: shippingAddressString,
        phone: phoneNumber,
        paymentMethod: paymentMethod || 'cod',
        promotionId: appliedPromotion?.promotionId,
      };

      const result = await orderService.create(orderData);

      if (paymentMethod !== 'cod' && result._id) {
        try {
          await paymentService.create({
            orderId: result._id,
            method: paymentMethod,
            amount: getTotalPrice() - promotionDiscount,
          });
        } catch (error) {
          // Payment creation failed, continue with order
        }
      }

      clearCart();
      showSuccess('Đơn hàng đã được đặt thành công! 🎉');

      // Navigate to orders after a short delay
      setTimeout(() => {
        navigation.navigate('Orders' as never);
      }, 1500);
    } catch (error: any) {
      let errorMessage = 'Không thể đặt hàng';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = typeof error.message === 'string' ? error.message : 'Không thể đặt hàng';
      } else if (error.response?.data) {
        errorMessage = typeof error.response.data === 'string'
          ? error.response.data
          : JSON.stringify(error.response.data);
      }

      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
      <ScrollView style={styles.scrollView}>
        {/* Progress Steps */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <Text style={styles.progressText}>Đơn hàng</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <Text style={styles.progressText}>Địa chỉ</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <Text style={styles.progressText}>Thanh toán</Text>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt-outline" size={24} color={colors.secondary} />
            <Text style={styles.sectionTitle}>Đơn hàng</Text>
          </View>
          {items.map((item) => {
            const finalPrice = (item.product.price || 0) - (item.product.discount || 0);
            return (
              <View key={item.product._id} style={styles.orderItem}>
                <Text style={styles.orderItemName}>{item.product.name}</Text>
                <Text style={styles.orderItemPrice}>
                  {finalPrice.toLocaleString('vi-VN')}đ x {item.quantity}
                </Text>
              </View>
            );
          })}
          {promotionDiscount > 0 && (
            <View style={styles.discountRow}>
              <Text style={styles.discountLabel}>Giảm giá:</Text>
              <Text style={styles.discountPrice}>
                -{promotionDiscount.toLocaleString('vi-VN')}đ
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng:</Text>
            <Text style={styles.totalPrice}>
              {(getTotalPrice() - promotionDiscount).toLocaleString('vi-VN')}đ
            </Text>
          </View>
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Address' as never)}
            >
              <Text style={styles.linkText}>Quản lý địa chỉ</Text>
            </TouchableOpacity>
          </View>
          {addresses.length > 0 ? (
            <>
              {addresses.map((address) => (
                <TouchableOpacity
                  key={address._id}
                  style={[
                    styles.addressCard,
                    selectedAddress?._id === address._id && styles.addressCardSelected,
                  ]}
                  onPress={() => setSelectedAddress(address)}
                >
                  <Text style={styles.addressName}>{String(address.name || '')}</Text>
                  <Text style={styles.addressPhone}>{String(address.phone || '')}</Text>
                  <Text style={styles.addressText}>
                    {String(address.street || '')}, {String(address.ward || '')}, {String(address.district || '')}, {String(address.city || '')}
                  </Text>
                  {address.isDefault && (
                    <Text style={styles.defaultBadge}>Mặc định</Text>
                  )}
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => navigation.navigate('Address' as never)}
            >
              <Text style={styles.addAddressText}>+ Thêm địa chỉ</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Promotion Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mã khuyến mãi (tùy chọn)</Text>
          <View style={styles.promotionRow}>
            <TextInput
              style={styles.promotionInput}
              placeholder="Nhập mã khuyến mãi"
              value={promotionCode}
              onChangeText={setPromotionCode}
            />
            <TouchableOpacity
              style={styles.promotionButton}
              onPress={async () => {
                if (promotionCode) {
                  try {
                    const response = await promotionService.apply({
                      code: promotionCode,
                      items: items.map(item => ({ productId: item.product._id, quantity: item.quantity })),
                      totalAmount: getTotalPrice(),
                    });
                    const result = response.data;
                    setPromotionDiscount(result.discount || 0);
                    setAppliedPromotion(result);
                    showSuccess('Áp dụng mã khuyến mãi thành công!');
                  } catch (error: any) {
                    showError(error.message || 'Mã khuyến mãi không hợp lệ');
                  }
                }
              }}
            >
              <Text style={styles.promotionButtonText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
          {appliedPromotion && (
            <Text style={styles.promotionSuccess}>
              ✓ Đã áp dụng: {appliedPromotion.promotionName} (-{promotionDiscount.toLocaleString('vi-VN')} VNĐ)
            </Text>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cod' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('cod')}
          >
            <Text style={styles.paymentOptionText}>Thanh toán khi nhận hàng (COD)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'momo' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('momo')}
          >
            <Text style={styles.paymentOptionText}>MoMo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'zalopay' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('zalopay')}
          >
            <Text style={styles.paymentOptionText}>ZaloPay</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'stripe' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('stripe')}
          >
            <Text style={styles.paymentOptionText}>Thẻ tín dụng (Stripe)</Text>
          </TouchableOpacity>
        </View>

        {/* Place Order Button */}
        <View style={styles.footer}>
          <Button
            title={`Đặt hàng - ${(getTotalPrice() - promotionDiscount).toLocaleString('vi-VN')}đ`}
            onPress={handlePlaceOrder}
            variant="primary"
            size="large"
            loading={loading}
            disabled={loading || !selectedAddress || items.length === 0}
            icon={<Ionicons name="checkmark-circle" size={20} color={colors.white} />}
            style={styles.placeOrderButton}
          />
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  progressStep: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[300],
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    transform: [{ scale: 1.2 }],
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.gray[200],
    marginHorizontal: spacing.sm,
    top: -10,
  },
  progressText: {
    ...typography.label,
    color: colors.text.secondary,
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  orderItemName: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  orderItemPrice: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  totalLabel: {
    ...typography.h4,
    color: colors.text.primary,
  },
  totalPrice: {
    ...typography.h2,
    color: colors.primary,
  },
  addressCard: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  addressCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08', // 5-10% opacity
  },
  addressName: {
    ...typography.label,
    color: colors.text.primary,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  addressPhone: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  addressText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  defaultBadge: {
    ...typography.labelSmall,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  // ...
  promotionSuccess: {
    ...typography.labelSmall,
    color: colors.success,
    marginTop: spacing.xs,
  },
  addAddressButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  addAddressText: {
    ...typography.button,
    color: colors.primary,
  },
  linkText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  paymentOption: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  paymentOptionText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    ...shadows.lg,
  },
  placeOrderButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.md,
  },
  placeOrderButtonText: {
    ...typography.button,
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: colors.gray[400],
  },
  promotionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  promotionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    ...typography.body,
    color: colors.text.primary,
  },
  promotionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
  },
  promotionButtonText: {
    ...typography.button,
    color: colors.white,
    fontSize: 14,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  discountLabel: {
    ...typography.body,
    color: colors.success,
  },
  discountPrice: {
    ...typography.body,
    fontWeight: '600',
    color: colors.success,
  },
});

