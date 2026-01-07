import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletService } from '../../services/walletService';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function WalletScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');

  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet', user?.userId],
    queryFn: () => walletService.getMyWallet(),
    enabled: !!user
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['wallet-transactions', user?.userId],
    queryFn: () => walletService.getTransactions(),
    enabled: !!user
  });

  const depositMutation = useMutation({
    mutationFn: (data: any) => walletService.deposit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setShowDeposit(false);
      setAmount('');
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (data: any) => walletService.withdraw(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setShowWithdraw(false);
      setAmount('');
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
        <Text style={styles.balanceAmount}>
          {wallet ? (wallet.balance - wallet.lockedBalance).toLocaleString('vi-VN') : '0'} VNĐ
        </Text>
        <Text style={styles.totalLabel}>
          Tổng: {wallet?.balance.toLocaleString('vi-VN')} VNĐ
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.depositButton]}
          onPress={() => setShowDeposit(true)}
        >
          <Ionicons name="arrow-down" size={20} color="#fff" />
          <Text style={styles.actionText}>Nạp tiền</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.withdrawButton]}
          onPress={() => setShowWithdraw(true)}
        >
          <Ionicons name="arrow-up" size={20} color="#fff" />
          <Text style={styles.actionText}>Rút tiền</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactions}>
        <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
        ) : (
          transactions.map((tx: any) => (
            <View key={tx._id} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionType}>{tx.type}</Text>
                <Text style={styles.transactionDate}>
                  {new Date(tx.createdAt).toLocaleString('vi-VN')}
                </Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  (tx.type.includes('deposit') || tx.type.includes('refund')) && styles.positiveAmount,
                ]}
              >
                {(tx.type.includes('deposit') || tx.type.includes('refund')) ? '+' : '-'}
                {tx.amount.toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>
          ))
        )}
      </View>

      <Modal visible={showDeposit} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nạp tiền</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập số tiền"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  if (amount && parseFloat(amount) > 0) {
                    depositMutation.mutate({ amount: parseFloat(amount) });
                  }
                }}
              >
                <Text style={styles.modalButtonText}>Xác nhận</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeposit(false);
                  setAmount('');
                }}
              >
                <Text style={styles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showWithdraw} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rút tiền</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập số tiền"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  if (amount && parseFloat(amount) > 0) {
                    withdrawMutation.mutate({ amount: parseFloat(amount) });
                  }
                }}
              >
                <Text style={styles.modalButtonText}>Xác nhận</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowWithdraw(false);
                  setAmount('');
                }}
              >
                <Text style={styles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  balanceCard: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  depositButton: {
    backgroundColor: '#10b981',
  },
  withdrawButton: {
    backgroundColor: '#ef4444',
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
  },
  transactions: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  transactionItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  positiveAmount: {
    color: '#10b981',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

