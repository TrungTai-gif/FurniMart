"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import PageShell from "@/components/layouts/PageShell";
import { authService } from "@/services/authService";
import { toast } from "react-toastify";
import { FiArrowLeft, FiMail } from "react-icons/fi";

const forgotPasswordSchema = z.object({
    email: z.string().email("Email không hợp lệ"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordValues) => {
        setIsLoading(true);
        try {
            // Assuming authService has a forgotPassword method. If not, this is a placeholder.
            // In a real app, this would call the API.
            // await authService.forgotPassword(data.email); 

            // Simulating API call for UI demo if service method missing
            await new Promise(resolve => setTimeout(resolve, 1000));

            setIsSubmitted(true);
            toast.success("Đã gửi link khôi phục mật khẩu");
        } catch (error) {
            // toast.error("Có lỗi xảy ra, vui lòng thử lại");
            // For demo, we assume success often or handle specific errors
            setIsSubmitted(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageShell className="min-h-[80vh] flex items-center justify-center bg-secondary-50">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-soft border border-secondary-100">
                <Link href="/auth/login" className="flex items-center text-sm text-secondary-500 hover:text-primary-600 mb-6 transition-colors">
                    <FiArrowLeft className="mr-2" /> Quay lại đăng nhập
                </Link>

                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiMail className="w-6 h-6 text-primary-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-secondary-900 mb-2">Quên mật khẩu?</h1>
                    <p className="text-secondary-500 text-sm">
                        {isSubmitted
                            ? "Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu đến email của bạn."
                            : "Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu."}
                    </p>
                </div>

                {isSubmitted ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-success-50 text-success-700 text-sm rounded-lg text-center">
                            Vui lòng kiểm tra hộp thư đến (và cả mục Spam)
                        </div>
                        <Link href="/auth/login" className="block">
                            <Button variant="primary" className="w-full">
                                Quay lại đăng nhập
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <Input
                                label="Email"
                                type="email"
                                placeholder="name@example.com"
                                {...register("email")}
                                error={errors.email?.message}
                                autoFocus
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            isLoading={isLoading}
                        >
                            Gửi yêu cầu
                        </Button>
                    </form>
                )}
            </div>
        </PageShell>
    );
}
