import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import { Address, User } from '../../types';
import { colors, spacing, borderRadius, shadows, typography } from '../../theme';

export default function AddressScreen() {
  const { user, updateUser } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    street: '',
    ward: '',
    district: '',
    city: '',
    isDefault: false,
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const userData = await userService.getProfile();
      const addressList = userData.addresses || [];
      console.log('📦 Loaded addresses:', addressList.length, addressList);
      setAddresses(addressList);
      // Update authStore để đồng bộ
      updateUser(userData);
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone || !formData.street || !formData.ward || !formData.district || !formData.city) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      let updatedUser: User;
      if (editingAddress) {
        updatedUser = await userService.updateAddress(editingAddress._id!, formData);
      } else {
        updatedUser = await userService.addAddress(formData);
      }

      console.log('✅ Address saved, updated user:', updatedUser);
      console.log('📦 Updated addresses:', updatedUser.addresses);

      // Update authStore trước
      updateUser(updatedUser);

      // Reload addresses từ server để đảm bảo có _id
      await loadAddresses();

      setModalVisible(false);
      resetForm();

      // Delay alert một chút để UI update trước
      setTimeout(() => {
        Alert.alert('Thành công', editingAddress ? 'Cập nhật địa chỉ thành công' : 'Thêm địa chỉ thành công');
      }, 100);
    } catch (error: any) {
      console.error('❌ Error saving address:', error);
      const errorMessage = typeof error?.message === 'string' ? error.message : (error?.message?.toString() || 'Không thể lưu địa chỉ');
      Alert.alert('Lỗi', errorMessage);
    }
  };

  const handleDelete = (addressId: string) => {
    Alert.alert(
      'Xóa địa chỉ',
      'Bạn có chắc muốn xóa địa chỉ này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.deleteAddress(addressId);
              await loadAddresses();
              Alert.alert('Thành công', 'Đã xóa địa chỉ');
            } catch (error: any) {
              const errorMessage = typeof error?.message === 'string' ? error.message : (error?.message?.toString() || 'Không thể xóa địa chỉ');
              Alert.alert('Lỗi', errorMessage);
            }
          },
        },
      ]
    );
  };

  const openEditModal = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        name: address.name,
        phone: address.phone,
        street: address.street,
        ward: address.ward,
        district: address.district,
        city: address.city,
        isDefault: address.isDefault || false,
      });
    } else {
      resetForm();
    }
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingAddress(null);
    setFormData({
      name: '',
      phone: '',
      street: '',
      ward: '',
      district: '',
      city: '',
      isDefault: false,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="map-outline" size={64} color={colors.gray[300]} style={{ marginBottom: spacing.md }} />
            <Text style={styles.emptyText}>Chưa có địa chỉ nào</Text>
            <Text style={styles.emptySubtext}>Thêm địa chỉ để dễ dàng đặt hàng</Text>
          </View>
        ) : (
          addresses.map((address, index) => (
            <View key={address._id || `address-${index}`} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <Text style={styles.addressName}>{String(address.name || '')}</Text>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Mặc định</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressPhone}>{String(address.phone || '')}</Text>
              <Text style={styles.addressText}>
                {String(address.street || '')}, {String(address.ward || '')}, {String(address.district || '')}, {String(address.city || '')}
              </Text>
              <View style={styles.addressActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(address)}
                >
                  <Text style={styles.editButtonText}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(address._id!)}
                >
                  <Ionicons name="trash" size={16} color={colors.white} style={{ marginRight: 4 }} />
                  <Text style={styles.deleteButtonText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => openEditModal()}
      >
        <Text style={styles.addButtonText}>+ Thêm địa chỉ mới</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
            </Text>

            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Họ và tên"
                placeholderTextColor={colors.gray[400]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại"
                placeholderTextColor={colors.gray[400]}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Số nhà, tên đường"
                placeholderTextColor={colors.gray[400]}
                value={formData.street}
                onChangeText={(text) => setFormData({ ...formData, street: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Phường/Xã"
                placeholderTextColor={colors.gray[400]}
                value={formData.ward}
                onChangeText={(text) => setFormData({ ...formData, ward: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Quận/Huyện"
                placeholderTextColor={colors.gray[400]}
                value={formData.district}
                onChangeText={(text) => setFormData({ ...formData, district: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Tỉnh/Thành phố"
                placeholderTextColor={colors.gray[400]}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
              />

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
              >
                <View style={[styles.checkbox, formData.isDefault && styles.checkboxChecked]}>
                  {formData.isDefault && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Đặt làm địa chỉ mặc định</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    paddingBottom: 100,
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
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.gray[400],
    textAlign: 'center',
  },
  addressCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    margin: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  addressName: {
    ...typography.h4,
    color: colors.text.primary,
  },
  defaultBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  defaultBadgeText: {
    color: colors.white,
    ...typography.labelSmall,
    fontWeight: '600',
  },
  addressPhone: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  addressText: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  addressActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  editButtonText: {
    color: colors.white,
    ...typography.buttonSmall,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.error,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: colors.white,
    ...typography.buttonSmall,
  },
  addButton: {
    backgroundColor: colors.primary,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.md,
  },
  addButtonText: {
    color: colors.white,
    ...typography.button,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalTitle: {
    ...typography.h3,
    marginBottom: spacing.lg,
    color: colors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...typography.body,
    backgroundColor: colors.gray[50],
    color: colors.text.primary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    ...typography.body,
    color: colors.text.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.text.primary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    ...typography.button,
    color: colors.white,
  },
});

