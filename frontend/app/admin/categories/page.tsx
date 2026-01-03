'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import DashboardLayout from '@components/layouts/DashboardLayout';
import PageContainer from '@components/layouts/PageContainer';
import EmptyState from '@components/EmptyState';
import { categoryService } from '@services/categoryService';
import { useRequireAuth } from '@hooks/useRequireAuth';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit, FiTrash2, FiX, FiTag, FiSearch } from 'react-icons/fi';

interface CategoryForm {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
}

export default function AdminCategoriesPage() {
  const { user, isLoading } = useRequireAuth({ requiredRole: 'admin' });
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryForm>();

  const { data: categories = [] } = useQuery<any[]>(
    ['categories', 'all'],
    () => categoryService.getAll(true),
    { enabled: !isLoading && user?.role === 'admin' }
  );

  const filteredCategories = categories.filter((cat: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return cat.name?.toLowerCase().includes(query) ||
      cat.slug?.toLowerCase().includes(query);
  });

  const createMutation = useMutation(
    (data: CategoryForm) => categoryService.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['categories']);
        toast.success('Tạo danh mục thành công');
        setIsModalOpen(false);
        reset();
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<CategoryForm> }) =>
      categoryService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['categories']);
        toast.success('Cập nhật danh mục thành công');
        setIsModalOpen(false);
        setEditingCategory(null);
        reset();
      },
    }
  );

  const deleteMutation = useMutation(
    (id: string) => categoryService.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['categories']);
        toast.success('Xóa danh mục thành công');
      },
    }
  );

  if (isLoading) {
    return (
      <DashboardLayout role="admin" title="Quản lý danh mục" description="Thêm, sửa, xóa danh mục sản phẩm">
        <PageContainer className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const onSubmit = (data: CategoryForm) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <DashboardLayout role="admin" title="Quản lý danh mục" description="Thêm, sửa, xóa danh mục sản phẩm">
      <PageContainer className="py-6 sm:py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">Danh sách danh mục</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tổng cộng: {categories.length} danh mục</p>
            </div>
            <button
              onClick={() => {
                setEditingCategory(null);
                reset();
                setIsModalOpen(true);
              }}
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
            >
              <FiPlus size={18} /> Thêm danh mục
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm danh mục theo tên hoặc slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
              />
            </div>
          </div>

          {/* Categories Table */}
          {filteredCategories.length === 0 ? (
            <EmptyState
              icon={<FiTag size={64} className="text-gray-400" />}
              title={categories.length === 0 ? "Không có danh mục nào" : "Không tìm thấy danh mục"}
              description={categories.length === 0 ? "Thêm danh mục mới để bắt đầu" : "Thử thay đổi từ khóa tìm kiếm"}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="py-4 px-4 text-left text-sm font-bold text-secondary dark:text-gray-200">Tên</th>
                    <th className="py-4 px-4 text-left text-sm font-bold text-secondary dark:text-gray-200">Slug</th>
                    <th className="py-4 px-4 text-left text-sm font-bold text-secondary dark:text-gray-200">Mô tả</th>
                    <th className="py-4 px-4 text-left text-sm font-bold text-secondary dark:text-gray-200">Trạng thái</th>
                    <th className="py-4 px-4 text-left text-sm font-bold text-secondary dark:text-gray-200">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCategories.map((category: any, index: number) => (
                    <tr
                      key={category._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors animate-fade-in-up border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <td className="py-4 px-4 font-semibold text-gray-900 dark:text-white">{category.name}</td>
                      <td className="py-4 px-4 font-mono text-sm text-gray-600 dark:text-gray-400">{category.slug}</td>
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">{category.description || '-'}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 ${category.isActive
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                          }`}>
                          {category.isActive ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingCategory(category);
                              reset({
                                name: category.name,
                                slug: category.slug,
                                description: category.description,
                              });
                              setIsModalOpen(true);
                            }}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all hover:scale-110"
                            title="Chỉnh sửa"
                          >
                            <FiEdit size={18} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Bạn có chắc muốn xóa danh mục này?')) {
                                deleteMutation.mutate(category._id);
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCategory(null);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tên danh mục <span className="text-error">*</span>
                </label>
                <input
                  {...register('name', { required: true })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Nhập tên danh mục"
                />
                {errors.name && <p className="text-error text-sm mt-2">Tên là bắt buộc</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Slug <span className="text-error">*</span>
                </label>
                <input
                  {...register('slug', { required: true })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono"
                  placeholder="ten-danh-muc"
                />
                {errors.slug && <p className="text-error text-sm mt-2">Slug là bắt buộc</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mô tả</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
                  placeholder="Nhập mô tả danh mục"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="btn-primary flex-1 py-3 shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                >
                  {editingCategory ? 'Cập nhật' : 'Tạo danh mục'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingCategory(null);
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
