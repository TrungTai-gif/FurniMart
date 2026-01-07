import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = [
  "/",
  "/products",
  "/categories",
  "/branches",
  "/reviews",
  "/promotions",
  "/faq",
  "/contact",
  "/policy",
];
const authRoutes = ["/auth/login", "/auth/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken =
    request.cookies.get("accessToken")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Allow public routes
  if (
    isPublicRoute &&
    !pathname.startsWith("/account") &&
    !pathname.startsWith("/orders") &&
    !pathname.startsWith("/checkout")
  ) {
    return NextResponse.next();
  }

  // Handle auth routes
  if (isAuthRoute) {
    if (accessToken) {
      // Redirect to appropriate dashboard based on role
      const role = request.cookies.get("role")?.value;
      const redirectUrl = request.nextUrl.searchParams.get("redirect");

      if (redirectUrl) {
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }

      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Protected routes
  if (!accessToken) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
