# Frontend - FurniMart

Next.js 16 frontend application for FurniMart product management system.

## Tính năng (Features)

- 🏠 **Trang chủ** - Hiển thị sản phẩm nổi bật
- 📦 **Danh sách sản phẩm** - Duyệt, tìm kiếm, lọc sản phẩm
- 🏷️ **Danh mục** - Xem danh mục sản phẩm
- 🎉 **Khuyến mãi** - Xem và sao chép mã khuyến mãi

## Cấu trúc dự án (Project Structure)

```
frontend/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Trang chủ
│   ├── globals.css          # Global styles
│   ├── products/
│   │   └── page.tsx         # Danh sách sản phẩm
│   ├── categories/
│   │   └── page.tsx         # Danh sách danh mục
│   └── promotions/
│       └── page.tsx         # Danh sách khuyến mãi
├── lib/
│   └── config.ts            # API configuration
├── middleware.ts             # Next.js middleware
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── tailwind.config.ts       # Tailwind CSS config
└── next.config.ts           # Next.js config
```

## Các trang (Pages)

### 1. Trang chủ (`/`)

- Hiển thị sản phẩm nổi bật
- Navigation links tới các trang chính
- Hero section với CTA button

### 2. Sản phẩm (`/products`)

- Danh sách sản phẩm với pagination
- Tìm kiếm sản phẩm
- Lọc theo danh mục
- Sắp xếp (giá, đánh giá)
- Responsive grid (1-3 cột)

### 3. Danh mục (`/categories`)

- Hiển thị tất cả danh mục
- Click vào danh mục để lọc sản phẩm
- Beautiful card design

### 4. Khuyến mãi (`/promotions`)

- Hiển thị tất cả khuyến mãi/voucher
- Copy mã khuyến mãi
- Hiển thị ngày hết hạn
- Theo dõi lượt sử dụng
- Hướng dẫn sử dụng

## Kết nối APIs

Frontend kết nối đến các backend services:

```javascript
// lib/config.ts
export const SERVICES = {
  PRODUCT: "http://localhost:3004/api", // Product Service
  CATEGORY: "http://localhost:3013/api", // Category Service
  PROMOTION: "http://localhost:3016/api", // Promotion Service
  REVIEW: "http://localhost:3007/api", // Review Service
};
```

## Cài đặt (Installation)

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build cho production
npm run build

# Chạy production server
npm start
```

## Environment Variables

Tạo file `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Dependencies

- **next** (16.1.1) - React framework
- **react** (19.2.3) - UI library
- **@tanstack/react-query** (5.90.16) - Server state management
- **axios** (1.13.2) - HTTP client
- **tailwindcss** (4.x) - CSS framework
- **react-icons** (5.5.0) - Icon library
- **zod** (3.25.76) - Schema validation
- **react-hook-form** (7.69.0) - Form handling

## Styling

- **Tailwind CSS 4** với custom color palette
- Responsive design (mobile-first)
- Custom components (Button, Card, etc.)
- Animation effects

## Next Steps

1. **Thêm Product Detail Page** - `/products/[id]` để xem chi tiết sản phẩm
2. **Thêm Shopping Cart** - Giỏ hàng functionality
3. **Thêm Checkout** - Quy trình thanh toán
4. **Authentication** - Login/Register pages
5. **Review Management** - Đánh giá sản phẩm

## Chạy toàn bộ hệ thống (Running Full System)

```bash
# Terminal 1: Product Service
cd services/product-service
npm install
npm start

# Terminal 2: Category Service
cd services/category-service
npm install
npm start

# Terminal 3: Promotion Service
cd services/promotion-service
npm install
npm start

# Terminal 4: Frontend
cd frontend
npm install
npm run dev

# Truy cập http://localhost:3000
```

## API Endpoints

### Product Service (3004)

- `GET /api/products` - Danh sách sản phẩm
- `GET /api/products/:id` - Chi tiết sản phẩm
- `GET /api/products/featured` - Sản phẩm nổi bật

### Category Service (3013)

- `GET /api/categories` - Danh sách danh mục

### Promotion Service (3016)

- `GET /api/promotions` - Danh sách khuyến mãi
- `POST /api/promotions/apply` - Áp dụng khuyến mãi

### Review Service (3007)

- `GET /api/reviews/:productId` - Đánh giá của sản phẩm
- `POST /api/reviews` - Tạo đánh giá mới

---

**Tạo bởi:** FurniMart Development Team
**Ngày tạo:** January 7, 2025
