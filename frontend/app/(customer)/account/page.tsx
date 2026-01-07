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

  // Update formData when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || user.name || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof formData) => userService.updateProfile(data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
      // Update auth store with new user data
      setUser(updatedUser);
      toast.success("Cập nhật thông tin thành công");
      setIsEditing(false);
    },
    onError: (error: any) => {
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

  return (
    <PageShell>
      <PageHeader
        title="Tài khoản"
        breadcrumbs={[
          { label: "Trang chủ", href: routes.home },
          { label: "Tài khoản" },
        ]}
      />
      <main className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
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
                <>
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
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="w-full mt-4"
                  >
                    <FiEdit className="w-4 h-4 mr-2" />
                    Chỉnh sửa thông tin
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card variant="outline">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Địa chỉ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-secondary-600 mb-4">
                  Quản lý địa chỉ giao hàng
                </p>
                <Link href={routes.customer.addresses}>
                  <Button variant="outline">
                    <FiMapPin className="w-4 h-4 mr-2" />
                    Quản lý địa chỉ
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card variant="outline">
              <CardHeader>
                <CardTitle>Ví điện tử</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-secondary-600 mb-4">
                  Xem số dư và lịch sử giao dịch
                </p>
                <Link href={routes.customer.wallet}>
                  <Button variant="outline">
                    <FiCreditCard className="w-4 h-4 mr-2" />
                    Xem ví
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card variant="outline">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Đánh giá
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-secondary-600 mb-4">
                  Xem và quản lý đánh giá của bạn
                </p>
                <Link href={routes.customer.reviews}>
                  <Button variant="outline">
                    <FiEdit className="w-4 h-4 mr-2" />
                    Xem đánh giá
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card variant="outline">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Hỗ trợ khách hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-secondary-600 mb-4">
                  Chat với nhân viên hỗ trợ
                </p>
                <Link href={routes.customer.chat}>
                  <Button variant="outline">
                    <FiMessageSquare className="w-4 h-4 mr-2" />
                    Mở chat
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card variant="outline">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Lịch sử thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-secondary-600 mb-4">
                  Xem lịch sử thanh toán
                </p>
                <Link href={routes.customer.payments}>
                  <Button variant="outline">
                    <FiCreditCard className="w-4 h-4 mr-2" />
                    Xem thanh toán
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card variant="outline">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Yêu cầu hỗ trợ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-secondary-600 mb-4">
                  Đổi trả, bảo hành, lắp ráp
                </p>
                <Link href={routes.customer.disputes}>
                  <Button variant="outline">
                    <FiAlertCircle className="w-4 h-4 mr-2" />
                    Tạo yêu cầu
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
