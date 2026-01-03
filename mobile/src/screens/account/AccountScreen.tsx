import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/userService';
import { User } from '../../types';
import { colors, spacing, borderRadius, shadows, typography } from '../../theme';

export default function AccountScreen() {
  const navigation = useNavigation();
  const { user, logout, updateUser } = useAuthStore();
  const [userData, setUserData] = useState<User | null>(user);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await userService.getProfile();
      setUserData(data);
      updateUser(data);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Info */}
      <View style={styles.userSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userData?.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{String(userData?.name || 'Người dùng')}</Text>
        <Text style={styles.userEmail}>{String(userData?.email || '')}</Text>
        {userData?.phone && (
          <Text style={styles.userPhone}>{String(userData.phone)}</Text>
        )}
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Orders' as never)}
        >
          <Ionicons name="document-text-outline" size={24} color={colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuItemText}>Đơn hàng của tôi</Text>
          <Ionicons name="chevron-forward-outline" size={20} color={colors.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Address' as never)}
        >
          <Ionicons name="map-outline" size={24} color={colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuItemText}>Địa chỉ</Text>
          <Ionicons name="chevron-forward-outline" size={20} color={colors.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Wallet' as never)}
        >
          <Ionicons name="wallet-outline" size={24} color={colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuItemText}>Ví của tôi</Text>
          <Ionicons name="chevron-forward-outline" size={20} color={colors.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={loadUserData}
        >
          <Ionicons name="refresh-circle-outline" size={24} color={colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuItemText}>Làm mới thông tin</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  userSection: {
    backgroundColor: colors.white,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
    elevation: 2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
    elevation: 4,
    borderWidth: 4,
    borderColor: colors.white,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.white,
  },
  userName: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  userEmail: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  userPhone: {
    ...typography.body,
    color: colors.text.secondary,
  },
  menuSection: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  menuIcon: {
    marginRight: spacing.md,
  },
  menuItemText: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  logoutSection: {
    padding: spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: colors.error,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
    elevation: 3,
  },
  logoutButtonText: {
    color: colors.white,
    ...typography.button,
  },
});

