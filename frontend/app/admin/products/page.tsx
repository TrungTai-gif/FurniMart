'use client';

import { useQuery, useMutation, useQueryClient } from 'react-query';
import DashboardLayout from '@components/layouts/DashboardLayout';
import PageContainer from '@components/layouts/PageContainer';
import EmptyState from '@components/EmptyState';
import { productService } from '@services/productService';
import { categoryService } from '@services/categoryService';
import { useRequireAuth } from '@hooks/useRequireAuth';
import { toast } from 'react-toastify';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit, FiTrash2, FiImage, FiX, FiSearch, FiPackage } from 'react-icons/fi';
import { ProductForm } from '@types';
import { uploadService } from '@services/uploadService';

export default function AdminProductsPage() {
  const { user, isLoading } = useRequireAuth({ requiredRole: 'admin' });
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductForm>();

  const { data: products = [], error: productsError, isLoading: productsLoading } = useQuery(
    ['products', 'admin'],
    () => productService.getAll({ limit: 100 }),
    {
      enabled: !isLoading && user?.role === 'admin',
      retry: 1,
      onError: (error: any) => {
        console.error('Error fetching products:', error);
      }
    }
  );

  const { data: categories = [] } = useQuery(
    ['categories'],
    () => categoryService.getAll(),
    { enabled: !isLoading && user?.role === 'admin' }
  );

  const filteredProducts = products.filter((product: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return product.name.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query);
  });

  const createMutation = useMutation(
    (data: ProductForm) => productService.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products']);
        toast.success('Tạo sản phẩm thành công');
        setIsModalOpen(false);
        setImages([]);
        reset();
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || error?.message || 'Tạo sản phẩm thất bại';
        if (error?.response?.status !== 401) {
          toast.error(errorMessage);
        }
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<ProductForm> }) =>
      productService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products']);
        toast.success('Cập nhật sản phẩm thành công');
        setIsModalOpen(false);
        setEditingProduct(null);
        setImages([]);
        reset();
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || error?.message || 'Cập nhật sản phẩm thất bại';
        if (error?.response?.status !== 401) {
          toast.error(errorMessage);
        }
      },
    }
  );

  const deleteMutation = useMutation(
    (id: string) => productService.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products']);
        toast.success('Xóa sản phẩm thành công');
      },
    }
  );

  if (isLoading) {
    return (
      <DashboardLayout role="admin" title="Quản lý sản phẩm" description="Thêm, sửa, xóa sản phẩm">
        <PageContainer className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      toast.error('Vui lòng chọn ít nhất một file');
      return;
    }

    if (files.length + images.length > 10) {
      toast.error('Tối đa 10 ảnh cho mỗi sản phẩm');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    const invalidFiles = Array.from(files).filter(file => file.size > maxSize);
    if (invalidFiles.length > 0) {
      toast.error(`Một số file vượt quá 5MB: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setUploading(true);
    try {
      const fileArray = Array.from(files);
      const uploadResults = await uploadService.uploadImages(fileArray);

      const resultsArray = Array.isArray(uploadResults) ? uploadResults : [uploadResults];

      const newImageUrls = resultsArray.map((result) => {
        if (result?.url?.startsWith('/')) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
          const baseUrl = apiUrl.replace('/api', '');
          return `${baseUrl}${result.url}`;
        }
        return result?.url || '';
      }).filter(url => url);

      if (newImageUrls.length > 0) {
        setImages((prev) => [...prev, ...newImageUrls]);
        toast.success(`Đã upload ${newImageUrls.length} ảnh thành công`);
      } else {
        toast.error('Không có ảnh nào được upload thành công');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Upload ảnh thất bại';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: ProductForm) => {
    if (!editingProduct && images.length === 0) {
      toast.error('Vui lòng thêm ít nhất một hình ảnh cho sản phẩm');
      return;
    }

    const submitData = {
      ...data,
      images: images.length > 0 ? images : undefined,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct._id, data: submitData });
    } else {
      createMutation.mutate(submitData as ProductForm);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setImages(product.images || []);
    reset({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      categoryId: product.categoryId,
      discount: product.discount,
    });
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout role="admin" title="Quản lý sản phẩm" description="Thêm, sửa, xóa sản phẩm">
      <PageContainer className="py-6 sm:py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">Danh sách sản phẩm</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tổng cộng: {products.length} sản phẩm</p>
            </div>
            <button
              onClick={() => {
                setEditingProduct(null);
                setImages([]);
                reset();
                setIsModalOpen(true);
              }}
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
            >
              <FiPlus size={18} /> Thêm sản phẩm
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm theo tên hoặc danh mục..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
              />
            </div>
          </div>

          {/* Products Table */}
          {productsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
            </div>
          ) : productsError ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FiPackage size={32} className="text-red-500" />
              </div>
              <p className="text-red-600 font-semibold mb-2">Lỗi khi tải danh sách sản phẩm</p>
              <p className="text-gray-600 text-sm">Vui lòng thử lại sau</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={<FiPackage size={64} className="text-gray-400" />}
              title={products.length === 0 ? "Không có sản phẩm nào" : "Không tìm thấy sản phẩm"}
              description={products.length === 0 ? "Thêm sản phẩm mới để bắt đầu" : "Thử thay đổi từ khóa tìm kiếm"}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="py-4 px-4 text-left text-sm font-bold text-secondary dark:text-gray-200">Hình ảnh</th>
                    <th className="py-4 px-4 text-left text-sm font-bold text-secondary dark:text-gray-200">Tên sản phẩm</th>
                    <th className="py-4 px-4 text-left text-sm font-bold text-secondary dark:text-gray-200">Giá</th>
                    <th className="py-4 px-4 text-left text-sm font-bold text-secondary dark:text-gray-200">Tồn kho</th>
                    <th className="py-4 px-4 text-left text-sm font-bold text-secondary dark:text-gray-200">Danh mục</th>
                    <th className="py-4 px-4 text-left text-sm font-bold text-secondary dark:text-gray-200">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product: any, index: number) => (
                    <tr
                      key={product._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors animate-fade-in-up border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <td className="py-4 px-4">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">
                            🛋️
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-900 dark:text-white">{product.name}</td>
                      <td className="py-4 px-4 font-bold text-primary">{product.price.toLocaleString('vi-VN')}₫</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${product.stock > 10 ? 'bg-green-100 text-green-800' :
                            product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                          }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{product.category}</td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all hover:scale-110"
                            title="Chỉnh sửa"
                          >
                            <FiEdit size={18} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
                                deleteMutation.mutate(product._id);
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6 text-gray-900 dark:text-white">
              <h2 className="text-2xl sm:text-3xl font-bold">
                {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingProduct(null);
                  setImages([]);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tên sản phẩm <span className="text-error">*</span>
                </label>
                <input
                  {...register('name', { required: true })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Nhập tên sản phẩm"
                />
                {errors.name && <p className="text-error text-sm mt-2">Tên là bắt buộc</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Mô tả <span className="text-error">*</span>
                </label>
                <textarea
                  {...register('description', { required: true })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
                  placeholder="Nhập mô tả sản phẩm"
                />
                {errors.description && <p className="text-error text-sm mt-2">Mô tả là bắt buộc</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Giá (VNĐ) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    {...register('price', { required: true, min: 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Tồn kho <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    {...register('stock', { required: true, min: 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Giảm giá (%)</label>
                  <input
                    type="number"
                    {...register('discount', { min: 0, max: 100 })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Danh mục <span className="text-error">*</span>
                </label>
                <select
                  {...register('category', { required: true })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((cat: any) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Hình ảnh sản phẩm <span className="text-error">*</span>
                </label>
                <div className="space-y-3">
                  <label className="btn-secondary cursor-pointer inline-flex items-center gap-2">
                    <FiImage size={18} />
                    {uploading ? 'Đang upload...' : 'Chọn ảnh'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500">Tối đa 10 ảnh, mỗi ảnh tối đa 5MB</p>

                  {/* Image Preview */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-3">
                      {images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <FiX size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="btn-primary flex-1 py-3 shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                >
                  {editingProduct ? 'Cập nhật' : 'Tạo sản phẩm'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingProduct(null);
                    setImages([]);
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
