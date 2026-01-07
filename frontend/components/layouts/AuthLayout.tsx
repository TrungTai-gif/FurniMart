import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/common/Logo";
import { cn } from "@/lib/utils";

const AUTH_BG_IMAGE = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2000&auto=format&fit=crop";

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    className?: string;
}

export default function AuthLayout({ children, title, subtitle, className }: AuthLayoutProps) {
    return (
        <div className="min-h-screen bg-white w-full flex">
            {/* Left Column - Image & Branding (Desktop Only) */}
            <div className="hidden lg:flex w-1/2 relative bg-secondary-100 overflow-hidden">
                <Image
                    src={AUTH_BG_IMAGE}
                    alt="FurniMart Interior"
                    fill
                    className="object-cover blur-[2px] opacity-90 scale-105"
                    priority
                />
                <div className="absolute inset-0 bg-secondary-900/10" />
                <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12 text-center pointer-events-none z-10">
                    <h2 className="text-5xl font-bold tracking-tight mb-4 drop-shadow-md">FurniMart</h2>
                    <p className="text-xl font-medium tracking-wide drop-shadow-md opacity-95">
                        Đăng nhập để trải nghiệm mua sắm nội thất đẳng cấp
                    </p>
                </div>
            </div>

            {/* Right Column - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <Link href="/" className="inline-block mb-3 lg:hidden">
                            <Logo size="md" />
                        </Link>
                        <h1 className="text-3xl font-bold text-secondary-900 tracking-tight">
                            {title}
                        </h1>
                        <p className="text-secondary-500 mt-2 text-sm sm:text-base">
                            {subtitle}
                        </p>
                    </div>

                    <div className={cn("bg-white lg:shadow-soft rounded-xl lg:p-4 lg:border lg:border-secondary-100/50", className)}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
