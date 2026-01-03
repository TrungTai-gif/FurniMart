# FurniMart - Nền Tảng Thương Mại Điện Tử Microservices

**FurniMart** là một hệ thống thương mại điện tử hiện đại chuyên về nội thất, được xây dựng dựa trên kiến trúc **Microservices**. Dự án áp dụng các công nghệ tiên tiến nhất hiện nay để đảm bảo khả năng mở rộng, hiệu suất và trải nghiệm người dùng tối ưu.

## 🚀 Công Nghệ Sử Dụng

### Backend (Microservices)
*   **Framework**: [NestJS](https://nestjs.com/) (Node.js)
*   **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose ODM)
*   **Communication**: REST API (qua API Gateway)
*   **API Gateway**: NestJS + `http-proxy-middleware`

### Frontend
*   **Framework**: [Next.js](https://nextjs.org/) (React)
*   **Styling**: Tailwind CSS
*   **State Management**: React Context / Hooks

### DevOps & Infrastructure
*   **Containerization**: Docker & Docker Compose
*   **API Documentation**: Swagger (OpenAPI)

## 📦 Danh Sách Microservices (Server API)

Hệ thống được chia nhỏ thành các dịch vụ độc lập, mỗi dịch vụ đảm nhận một chức năng cụ thể và chạy trên một port riêng biệt. API Gateway đóng vai trò là điểm truy cập duy nhất.

| Tên Dịch Vụ | Port | Đường Dẫn API (Base Path) | Chức Năng Chính |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `3001` | `/api` | Cổng chính, điều hướng request, xác thực trung tâm. |
| **Auth Service** | `3002` | `/api/auth` | Đăng ký, Đăng nhập, Quản lý Token (JWT). |
| **User Service** | `3003` | `/api/users` | Quản lý hồ sơ người dùng, địa chỉ giao hàng. |
| **Product Service** | `3004` | `/api/products` | Quản lý sản phẩm, tồn kho cơ bản. |
| **Order Service** | `3005` | `/api/orders` | Tạo đơn hàng, quản lý trạng thái đơn hàng. |
| **Shipping Service** | `3006` | `/api/shipping` | Tính phí vận chuyển, quản lý giao hàng. |
| **Review Service** | `3007` | `/api/reviews` | Đánh giá, bình luận sản phẩm. |
| **Chat Service** | `3008` | `/api/chat` | Chat thời gian thực giữa khách và CSKH. |
| **Warehouse Service** | `3009` | `/api/warehouse` | Quản lý kho hàng nhập/xuất chi tiết. |
| **Dispute Service** | `3010` | `/api/disputes` | Xử lý khiếu nại, hoàn trả. |
| **Settings Service** | `3011` | `/api/settings` | Cấu hình hệ thống, banner, cài đặt chung. |
| **Upload Service** | `3012` | `/api/upload` | Upload và quản lý hình ảnh/video (Cloudinary/S3). |
| **Category Service** | `3013` | `/api/categories` | Quản lý danh mục sản phẩm. |
| **Dashboard Service** | `3014` | `/api/dashboard` | Thống kê, báo cáo doanh thu cho Admin/Manager. |
| **Payment Service** | `3015` | `/api/payments` | Tích hợp cổng thanh toán (VNPAY, Momo...). |
| **Promotion Service** | `3016` | `/api/promotions` | Quản lý mã giảm giá, chương trình khuyến mãi. |
| **Branch Service** | `3017` | `/api/branches` | Quản lý chi nhánh cửa hàng vật lý. |
| **Wallet Service** | `3018` | `/api/wallet` | Ví điện tử nội bộ, xu tích lũy. |

## 🛠️ Hướng Dẫn Cài Đặt & Chạy

### Yêu cầu
*   [Docker Desktop](https://www.docker.com/products/docker-desktop) (đã cài đặt và đang chạy)
*   [Node.js](https://nodejs.org/) (tùy chọn, để chạy script seed local)

### 1. Khởi chạy hệ thống
Sử dụng Docker Compose để build và chạy toàn bộ hệ thống (Frontend + 17 Backend Services + Database):

```bash
docker compose up -d --build
```

### 2. Khởi tạo Dữ liệu Mẫu (Database Seeding)
Để việc test dễ dàng hơn, hãy chạy script tạo dữ liệu mẫu:

```bash
# B1: Cài đặt thư viện cần thiết
npm install mongoose bcryptjs ts-node typescript @types/node @types/mongoose @types/bcryptjs --save-dev

# B2: Chạy lệnh seed
npx ts-node scripts/seed.ts
```

## 🔑 Tài Khoản Truy Cập (Demo Credentials)

| Vai Trò | Email | Mật khẩu | Quyền Hạn |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@furnimart.com` | `password123` | Toàn quyền hệ thống, xem Dashboard. |
| **Manager** | `manager@furnimart.com` | `password123` | Quản lý chi nhánh, duyệt đơn hàng. |
| **Employee** | `employee@furnimart.com` | `password123` | Xử lý đơn hàng, chat với khách. |
| **Shipper** | `shipper@furnimart.com` | `password123` | Xem đơn giao, cập nhật trạng thái giao. |
| **Customer** | `customer@furnimart.com` | `password123` | Mua hàng, xem lịch sử đơn, đánh giá. |

## 🔗 Các Đường Dẫn Chính

*   **Frontend (Khách hàng)**: [http://localhost:3000](http://localhost:3000)
*   **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin) (Cần đăng nhập Admin)
*   **API Gateway**: [http://localhost:3001/api](http://localhost:3001/api)

---
© 2026 FurniMart Team.
