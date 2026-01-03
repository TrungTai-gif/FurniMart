'use client';

import { useQuery, useMutation, useQueryClient } from 'react-query';
import DashboardLayout from '@components/layouts/DashboardLayout';
import PageContainer from '@components/layouts/PageContainer';
import EmptyState from '@components/EmptyState';
import { promotionService } from '@services/promotionService';
import { useRequireAuth } from '@hooks/useRequireAuth';
import { toast } from 'react-toastify';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit, FiTrash2, FiX, FiTag, FiSearch, FiPercent, FiDollarSign } from 'react-icons/fi';

export default function AdminPromotionsPage() {
  const { user, isLoading } = useRequireAuth({ requiredRole: 'admin' });
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: promotions = [] } = useQuery(
    ['promotions', 'admin'],
    () => promotionService.getAll(),
    { enabled: !isLoading && user?.role === 'admin' }
  );

  const filteredPromotions = useMemo(() => {
    let filtered = promotions;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter((promo: any) => {
        if (statusFilter === 'active') return promo.isActive;
        if (statusFilter === 'inactive') return !promo.isActive;
        return true;
      });
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((promo: any) => {
        return promo.code?.toLowerCase().includes(query) || 
               promo.name?.toLowerCase().includes(query);
      });
    }
    
    return filtered;
  }, [promotions, statusFilter, searchQuery]);

  const createMutation = useMutation(
    (data: any) => promotionService.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['promotions']);
        setIsModalOpen(false);
        reset();
        toast.success('Tạo khuyến mãi thành công');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Tạo khuyến mãi thất bại');
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => promotionService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['promotions']);
        setIsModalOpen(false);
        setEditingPromotion(null);
        reset();
        toast.success('Cập nhật khuyến mãi thành công');
      },
    }
  );

  const deleteMutation = useMutation(
    (id: string) => promotionService.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['promotions']);
        toast.success('Xóa khuyến mãi thành công');
      },
    }
  );

  const onSubmit = (data: any) => {
    if (editingPromotion) {
      updateMutation.mutate({ id: editingPromotion._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="admin" title="Quản lý khuyến mãi" description="Tạo và quản lý các mã khuyến mãi">
        <PageContainer className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" title="Quản lý khuyến mãi" description="Tạo và quản lý các mã khuyến mãi">
      <PageContainer className="py-6 sm:py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b border-gray-200 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Danh sách khuyến mãi</h2>
              <p className="text-sm text-gray-600">Tổng cộng: {promotions.length} khuyến mãi</p>
            </div>
            <button
              onClick={() => {
                setEditingPromotion(null);
                reset();
                setIsModalOpen(true);
              }}
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
            >
              <FiPlus size={18} /> Tạo khuyến mãi
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã hoặc tên khuyến mãi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm appearance-none bg-white cursor-pointer transition-all min-w-[160px]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </select>
          </div>

          {/* Promotions Table */}
          {filteredPromotions.length === 0 ? (
            <EmptyState
              icon={<FiTag size={64} className="text-gray-400" />}
              title={promotions.length === 0 ? "Không có khuyến mãi nào" : "Không tìm thấy khuyến mãi"}
              description={promotions.length === 0 ? "Tạo khuyến mãi mới để bắt đầu" : "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-4 px-4 text-left text-sm font-bold text-secondary">Mã</th>
                    <th className="py-4 px-4 text-left text-sm font-bold text-secondary">Tên</th>
                    <th className="py-4 px-4 text-left text-sm font-bold text-secondary">Loại</th>
                    <th className="py-4 px-4 text-left text-sm font-bold text-secondary">Giá trị</th>
                    <th className="py-4 px-4 text-left text-sm font-bold text-secondary">Trạng thái</th>
                    <th className="py-4 px-4 text-left text-sm font-bold text-secondary">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPromotions.map((promo: any, index: number) => (
                    <tr 
                      key={promo._id} 
                      className="hover:bg-gray-50 transition-colors animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <td className="py-4 px-4 font-mono font-semibold text-gray-900">{promo.code}</td>
                      <td className="py-4 px-4 font-semibold text-gray-900">{promo.name}</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800 border-2 border-blue-200">
                          {promo.type === 'percentage' && <FiPercent size={12} />}
                          {promo.type === 'fixed' && <FiDollarSign size={12} />}
                          {promo.type === 'free_shipping' && <FiTag size={12} />}
                          {promo.type === 'percentage' ? 'Phần trăm' : 
                           promo.type === 'fixed' ? 'Cố định' : 'Miễn phí vận chuyển'}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-primary">
                        {promo.type === 'percentage' ? `${promo.value}%` : 
                         promo.type === 'fixed' ? `${promo.value.toLocaleString('vi-VN')}₫` : 
                         'Miễn phí'}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 ${
                          promo.isActive 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {promo.isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingPromotion(promo);
                              reset(promo);
                              setIsModalOpen(true);
                            }}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all hover:scale-110"
                            title="Chỉnh sửa"
                          >
                            <FiEdit size={18} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Xóa khuyến mãi này?')) {
                                deleteMutation.mutate(promo._id);
                              }
                            }}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all hover:scale-110"
                            title="Xóa"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageContainer>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingPromotion ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi mới'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingPromotion(null);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mã khuyến mãi <span className="text-error">*</span>
                </label>
                <input 
                  {...register('code', { required: true })} 
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono"
                  placeholder="PROMO2024"
                />
                {errors.code && <p className="text-error text-sm mt-2">Mã là bắt buộc</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên <span className="text-error">*</span>
                </label>
                <input 
                  {...register('name', { required: true })} 
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Tên khuyến mãi"
                />
                {errors.name && <p className="text-error text-sm mt-2">Tên là bắt buộc</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Loại <span className="text-error">*</span>
                </label>
                <select 
                  {...register('type', { required: true })} 
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white"
                >
                  <option value="percentage">Phần trăm</option>
                  <option value="fixed">Cố định</option>
                  <option value="free_shipping">Miễn phí vận chuyển</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Giá trị <span className="text-error">*</span>
                </label>
                <input 
                  type="number" 
                  {...register('value', { required: true })} 
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="0"
                />
                {errors.value && <p className="text-error text-sm mt-2">Giá trị là bắt buộc</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Số lượng tối đa</label>
                <input 
                  type="number" 
                  {...register('maxUsage')} 
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Không giới hạn"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit" 
                  className="btn-primary flex-1 py-3 shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                >
                  {editingPromotion ? 'Cập nhật' : 'Tạo khuyến mãi'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingPromotion(null);
                    reset();
                  }}
                  className="btn-secondary flex-1 py-3"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
