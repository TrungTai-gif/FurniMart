"use client";

import { useAuthStore } from "@/store/authStore";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PageShell from "@/components/layouts/PageShell";
import PageHeader from "@/components/layouts/PageHeader";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import { toast } from "react-toastify";
import Link from "next/link";
import type { AxiosError } from "axios";
import {
  FiEdit,
  FiMapPin,
  FiCreditCard,
  FiAlertCircle,
  FiMessageSquare,
} from "react-icons/fi";
import { routes } from "@/lib/config/routes";

export default function AccountPage() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || user?.name || "",
    phone: user?.phone || "",
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof formData) => userService.updateProfile(data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
      // Update auth store with new user data
      setUser(updatedUser);
      toast.success("Cập nhật thông tin thành công");
      setIsEditing(false);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      console.error("Update profile error:", error);
      toast.error(
        error.response?.data?.message || "Không thể cập nhật thông tin"
      );
    },
  });

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const quickActions = [
    {
      title: "Địa chỉ giao hàng",
      description: "Quản lý địa chỉ nhận hàng",
      href: routes.customer.addresses,
      icon: FiMapPin,
      cta: "Quản lý địa chỉ",
    },
    {
      title: "Ví điện tử",
      description: "Xem số dư và lịch sử",
      href: routes.customer.wallet,
      icon: FiCreditCard,
      cta: "Xem ví",
    },
    {
      title: "Đánh giá",
      description: "Theo dõi đánh giá của bạn",
      href: routes.customer.reviews,
      icon: FiEdit,
      cta: "Xem đánh giá",
    },
    {
      title: "Hỗ trợ trực tuyến",
      description: "Chat với nhân viên hỗ trợ",
      href: routes.customer.chat,
      icon: FiMessageSquare,
      cta: "Mở chat",
    },
    {
      title: "Thanh toán",
      description: "Xem lịch sử thanh toán",
      href: routes.customer.payments,
      icon: FiCreditCard,
      cta: "Xem thanh toán",
    },
    {
      title: "Yêu cầu hỗ trợ",
      description: "Đổi trả, bảo hành, lắp ráp",
      href: routes.customer.disputes,
      icon: FiAlertCircle,
      cta: "Tạo yêu cầu",
    },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Tài khoản"
        breadcrumbs={[
          { label: "Trang chủ", href: routes.home },
          { label: "Tài khoản" },
        ]}
      />
      <main className="space-y-8">
        <Card variant="outline" className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 px-6 py-5 text-white">
            <p className="text-sm text-white/80">Trung tâm tài khoản</p>
            <h2 className="text-2xl font-semibold">
              Xin chào, {user.fullName || user.name}
            </h2>
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-16 w-16 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center text-xl font-semibold">
                  {(user.fullName || user.name || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-semibold text-secondary-900">
                    {user.fullName || user.name}
                  </p>
                  <p className="text-sm text-secondary-500">{user.email}</p>
                  {user.phone && (
                    <p className="text-sm text-secondary-500">{user.phone}</p>
                  )}
                  <p className="text-xs uppercase tracking-wide text-secondary-400 mt-1">
                    {user.role}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (isEditing) {
                    setIsEditing(false);
                    setFormData({
                      fullName: user?.fullName || user?.name || "",
                      phone: user?.phone || "",
                    });
                  } else {
                    setIsEditing(true);
                  }
                }}
              >
                <FiEdit className="w-4 h-4 mr-2" />
                {isEditing ? "Hủy chỉnh sửa" : "Chỉnh sửa thông tin"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-6 lg:gap-8">
          <Card variant="outline">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Thông tin cá nhân
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Họ và tên"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="Số điện thoại"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={updateProfileMutation.isPending}
                      className="flex-1"
                    >
                      Lưu
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          fullName: user?.fullName || user?.name || "",
                          phone: user?.phone || "",
                        });
                      }}
                    >
                      Hủy
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-secondary-500 mb-1">Họ và tên</p>
                    <p className="font-medium text-secondary-900">
                      {user.fullName || user.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-500 mb-1">Email</p>
                    <p className="font-medium text-secondary-900">
                      {user.email}
                    </p>
                  </div>
                  {user.phone && (
                    <div>
                      <p className="text-sm text-secondary-500 mb-1">
                        Số điện thoại
                      </p>
                      <p className="font-medium text-secondary-900">
                        {user.phone}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-secondary-500 mb-1">Vai trò</p>
                    <p className="font-medium text-secondary-900 capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="outline">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Tiện ích nhanh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <div
                      key={action.title}
                      className="flex flex-col justify-between rounded-xl border border-secondary-100 bg-secondary-50/60 p-4 transition hover:border-primary-200 hover:bg-white"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                            <Icon className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="font-semibold text-secondary-900">
                              {action.title}
                            </p>
                            <p className="text-sm text-secondary-500">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Link href={action.href} className="mt-4">
                        <Button variant="outline" className="w-full">
                          {action.cta}
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </PageShell>
  );
}
