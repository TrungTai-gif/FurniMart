"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { registerSchema } from "@/lib/validation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import { notifications } from "@/lib/notifications";
import type { z } from "zod";
import AuthLayout from "@/components/layouts/AuthLayout";

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur", // Validate on blur
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const fullName = `${data.lastName} ${data.firstName}`.trim();

      const response = await authService.register(
        data.email,
        data.password,
        fullName,
        data.phone || undefined
      );
      setAuth(response);

      if (typeof document !== "undefined") {
        document.cookie = `accessToken=${response.accessToken}; path=/; max-age=3600`;
        document.cookie = `refreshToken=${response.refreshToken}; path=/; max-age=604800`;
        document.cookie = `role=${response.user.role}; path=/; max-age=3600`;
      }

      notifications.register.success(
        response.user.name || response.user.fullName || "bạn"
      );

      setTimeout(() => {
        router.push("/");
      }, 300);
    } catch (error: unknown) {
      let errorMessage = "Đăng ký thất bại.";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { status?: number, data?: { message?: string } } };
        const status = axiosError.response?.status;
        const msg = axiosError.response?.data?.message;

        if (status === 409) {
          errorMessage = "Email đã được sử dụng. Vui lòng dùng email khác.";
        } else if (msg) {
          errorMessage = msg;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      notifications.register.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Tạo tài khoản FurniMart"
      subtitle="Nội thất cao cấp • Giao nhanh • Bảo hành rõ ràng"
      className="max-w-md lg:max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Họ"
            {...register("lastName")}
            error={errors.lastName?.message}
            placeholder="Nguyễn"
          />
          <Input
            label="Tên"
            {...register("firstName")}
            error={errors.firstName?.message}
            placeholder="Văn A"
          />
        </div>

        {/* Email (Mandatory) */}
        <Input
          label="Email"
          type="email"
          {...register("email")}
          error={errors.email?.message}
          placeholder="vd: tenban@gmail.com"
        />

        {/* Phone (Optional) */}
        <div className="relative">
          <Input
            label="Số điện thoại (không bắt buộc)"
            type="tel"
            {...register("phone")}
            error={errors.phone?.message}
            placeholder="vd: 09xxxxxxxx"
          />
          {!errors.phone && (
            <p className="mt-1.5 text-xs text-secondary-400">
              Dùng để liên hệ hỗ trợ khi cần
            </p>
          )}
        </div>

        {/* Password Fields */}
        <PasswordInput
          label="Mật khẩu"
          {...register("password")}
          error={errors.password?.message}
          placeholder="Tối thiểu 8 ký tự"
        />

        <PasswordInput
          label="Nhập lại mật khẩu"
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
          placeholder="Tối thiểu 8 ký tự"
        />

        {/* Terms */}
        <div className="text-xs text-secondary-500 leading-relaxed pt-2">
          Bằng việc đăng ký, bạn đồng ý với{" "}
          <Link href="/policy" className="text-primary-600 hover:text-primary-700 font-medium underline-offset-2 hover:underline">
            Điều khoản dịch vụ
          </Link>{" "}
          &{" "}
          <Link href="/policy" className="text-primary-600 hover:text-primary-700 font-medium underline-offset-2 hover:underline">
            Chính sách bảo mật
          </Link>{" "}
          của FurniMart.
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full text-base font-semibold shadow-md hover:shadow-lg transition-all"
          isLoading={isLoading || isSubmitting}
        >
          Tạo tài khoản
        </Button>
      </form>

      <div className="text-center text-sm mt-6">
        <span className="text-secondary-500">Đã có tài khoản? </span>
        <Link href="/auth/login" className="text-primary-600 font-semibold hover:text-primary-700 hover:underline underline-offset-2 transition-colors">
          Đăng nhập
        </Link>
      </div>
    </AuthLayout>
  );
}
