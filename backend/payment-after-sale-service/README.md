# Payment & After-Sale Service

Microservice quản lý thanh toán và dịch vụ hậu mãi cho hệ thống FurniMart.

## 📋 Tổng Quan

Service này xử lý:

- Thanh toán trực tuyến (VNPay, MoMo, ZaloPay, COD)
- Xử lý callback/IPN từ payment gateways
- Quản lý yêu cầu hậu mãi (bảo hành, trả hàng, đổi trả)
- Đặt lịch lắp đặt sản phẩm
- Hoàn tiền

## 🗄️ Database

- **Database**: `payment_db`
- **Tables** (9 tables):
  - `Payments` - Thông tin thanh toán
  - `PaymentTransactions` - Log transactions
  - `PaymentMethods` - Phương thức thanh toán
  - `AfterSaleRequests` - Yêu cầu hậu mãi
  - `AfterSaleStatusLogs` - Log thay đổi trạng thái
  - `Refunds` - Hoàn tiền
  - `WarrantyClaims` - Bảo hành
  - `AssemblyBookings` - Đặt lịch lắp đặt
  - `ReturnItems` - Chi tiết sản phẩm trả hàng

## 🛠️ Technology Stack

- Node.js 18
- Express.js
- SQL Server (mssql)
- Payment Gateways: VNPay, MoMo, ZaloPay
- express-validator (input validation)

## 🚀 Chạy Service

### Với Docker Compose (Khuyến nghị)

```bash
# Từ thư mục root của project
docker-compose up payment-after-sale-service

# Hoặc chạy background
docker-compose up -d payment-after-sale-service

# Xem logs
docker-compose logs -f payment-after-sale-service

# Dừng service
docker-compose stop payment-after-sale-service
```

### Chạy Local (Development)

```bash
cd backend/payment-after-sale-service

# Cài đặt dependencies
npm install

# Tạo file .env (copy từ .env.example)
# Cập nhật credentials cho payment gateways

# Chạy development mode
npm run dev
```

## ⚙️ Environment Variables

```env
# Server
PORT=5003
NODE_ENV=development

# Database
SQL_SERVER_HOST=sqlserver
SQL_SERVER_PORT=1433
SQL_SERVER_USER=sa
SQL_SERVER_PASSWORD=FurniMart@2024

# CORS
CORS_ORIGIN=*

# VNPay Configuration
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

# MoMo Configuration
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key

# ZaloPay Configuration
ZALOPAY_APP_ID=your_app_id
ZALOPAY_KEY1=your_key1
ZALOPAY_KEY2=your_key2
```

## 📡 API Endpoints

### Health Check

#### GET `/health`

**Response:**
```json
{
  "status": "OK",
  "service": "payment-after-sale-service",
  "timestamp": "2025-12-22T08:00:00.000Z",
  "database": "connected"
}
```

---

## 💰 Payment APIs

### 1. Create Payment

**POST** `/api/payments`

Tạo payment mới và nhận payment URL.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "order_id": "uuid",
  "amount": 1000000,
  "payment_method": "VNPAY",
  "return_url": "http://your-app.com/payment/return"
}
```

**Payment Methods:**
- `VNPAY` - VNPay
- `MOMO` - MoMo
- `ZALOPAY` - ZaloPay
- `COD` - Cash on Delivery

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Payment created successfully",
  "data": {
    "payment_id": "uuid",
    "order_id": "uuid",
    "amount": 1000000,
    "payment_method": "VNPAY",
    "status": "PENDING",
    "payment_url": "https://sandbox.vnpayment.vn/..."
  }
}
```

### 2. Get Payment by ID

**GET** `/api/payments/:id`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "payment": {
      "payment_id": "uuid",
      "order_id": "uuid",
      "user_id": "uuid",
      "payment_method": "VNPAY",
      "amount": 1000000,
      "status": "SUCCESS",
      "transaction_id": "12345678",
      "created_at": "2025-12-22T08:00:00.000Z"
    }
  }
}
```

### 3. Get User's Payments

**GET** `/api/payments/user/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit` (optional) - Số lượng kết quả (default: 50)
- `offset` (optional) - Offset (default: 0)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "payments": [...],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 10
    }
  }
}
```

### 4. Payment Gateway Callbacks

Các endpoints này được gọi tự động bởi payment gateways:

- `GET /api/payments/vnpay/ipn` - VNPay IPN callback
- `POST /api/payments/momo/ipn` - MoMo IPN callback
- `POST /api/payments/zalopay/callback` - ZaloPay callback

---

## 🔄 After-Sale APIs

### 1. Create After-Sale Request

**POST** `/api/aftersale`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "order_id": "uuid",
  "request_type": "WARRANTY",
  "reason": "Product defect",
  "description": "Detailed description...",
  "attachments": ["url1", "url2"],
  "priority": "NORMAL"
}
```

**Request Types:**
- `WARRANTY` - Bảo hành
- `RETURN` - Trả hàng
- `REFUND` - Hoàn tiền
- `EXCHANGE` - Đổi hàng
- `ASSEMBLY` - Lắp đặt

**Priority:**
- `LOW`, `NORMAL`, `HIGH`, `URGENT`

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "After-sale request created successfully",
  "data": {
    "request": {
      "request_id": "uuid",
      "order_id": "uuid",
      "request_type": "WARRANTY",
      "status": "PENDING",
      "created_at": "2025-12-22T08:00:00.000Z"
    }
  }
}
```

### 2. Get Request by ID

**GET** `/api/aftersale/:id`

**Headers:**
```
Authorization: Bearer <access_token>
```

### 3. Get User's Requests

**GET** `/api/aftersale/user/me`

**Query Parameters:**
- `request_type` (optional) - Filter by type
- `status` (optional) - Filter by status

### 4. Update Request Status (Admin/Seller only)

**PUT** `/api/aftersale/:id/status`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "APPROVED",
  "notes": "Request approved. Processing..."
}
```

**Statuses:**
- `PENDING`, `APPROVED`, `REJECTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`

---

## 🔧 Assembly Booking APIs

### 1. Create Assembly Booking

**POST** `/api/assembly`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "order_id": "uuid",
  "address": "123 Main Street",
  "city": "Ho Chi Minh",
  "district": "District 1",
  "ward": "Ward 1",
  "phone": "+84123456789",
  "preferred_date": "2025-12-25",
  "preferred_time_slot": "MORNING",
  "service_fee": 200000,
  "customer_notes": "Please call before coming"
}
```

**Time Slots:**
- `MORNING` - 8:00-12:00
- `AFTERNOON` - 13:00-17:00
- `EVENING` - 18:00-20:00

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Assembly booking created successfully",
  "data": {
    "booking": {
      "booking_id": "uuid",
      "order_id": "uuid",
      "status": "PENDING",
      "preferred_date": "2025-12-25",
      "preferred_time_slot": "MORNING",
      "created_at": "2025-12-22T08:00:00.000Z"
    }
  }
}
```

### 2. Schedule Booking (Admin/Branch Manager only)

**PUT** `/api/assembly/:id/schedule`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "scheduled_date": "2025-12-25T09:00:00.000Z",
  "technician_id": "uuid",
  "estimated_duration": 120
}
```

### 3. Add Customer Feedback

**POST** `/api/assembly/:id/feedback`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "rating": 5,
  "feedback": "Excellent service!"
}
```

---

## 🧪 Testing

### Test với curl (Windows PowerShell):

#### 1. Health Check
```powershell
curl.exe http://localhost:5003/health
```

#### 2. Create Payment (cần token)
```powershell
$token = "your_access_token"
$body = @{
    order_id = "uuid-here"
    amount = 1000000
    payment_method = "VNPAY"
} | ConvertTo-Json

curl.exe -X POST http://localhost:5003/api/payments `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $body
```

#### 3. Create After-Sale Request
```powershell
$body = @{
    order_id = "uuid-here"
    request_type = "WARRANTY"
    reason = "Product defect"
    description = "Screen not working"
    priority = "HIGH"
} | ConvertTo-Json

curl.exe -X POST http://localhost:5003/api/aftersale `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $body
```

### Test với Postman:

**Base URL:** `http://localhost:5003`

1. Import collection với các endpoints trên
2. Set Authorization header với token từ Identity Service
3. Test các flows:
   - Payment creation → Callback → Status check
   - After-sale request → Admin approval → Resolution
   - Assembly booking → Scheduling → Completion

---

## 📁 Cấu Trúc Thư Mục

```
payment-after-sale-service/
├── src/
│   ├── config/
│   │   ├── index.js              # App configuration
│   │   └── database.js           # Database connection
│   ├── controllers/
│   │   ├── payment.controller.js
│   │   ├── aftersale.controller.js
│   │   └── assembly.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   ├── models/
│   │   ├── payment.model.js
│   │   ├── aftersale.model.js
│   │   └── assembly.model.js
│   ├── routes/
│   │   ├── payment.routes.js
│   │   ├── aftersale.routes.js
│   │   └── assembly.routes.js
│   ├── services/
│   │   ├── vnpay.service.js
│   │   ├── momo.service.js
│   │   └── zalopay.service.js
│   └── server.js
├── Dockerfile
├── package.json
└── README.md
```

## 🔒 Security Features

- Payment gateway signature verification
- JWT authentication
- Input validation với express-validator
- SQL injection protection (parameterized queries)
- Rate limiting
- CORS configuration
- Helmet.js security headers

## 💡 Payment Gateway Integration

### VNPay
- Sandbox URL: https://sandbox.vnpayment.vn
- Docs: https://sandbox.vnpayment.vn/apis/docs/

### MoMo
- Test environment endpoint provided
- Docs: https://developers.momo.vn/

### ZaloPay
- Sandbox endpoint provided
- Docs: https://docs.zalopay.vn/

## 📝 Notes

- Payment gateway credentials phải được cập nhật trong production
- Callbacks/IPNs phải được expose publicly hoặc qua ngrok cho testing
- Tất cả transactions đều được log để audit
- Service sử dụng UTC timezone

## 🚧 Future Enhancements

- [ ] Refund automation
- [ ] Recurring payments
- [ ] Payment installments
- [ ] SMS notifications
- [ ] Email notifications
- [ ] Advanced reporting
- [ ] Fraud detection

## 📞 Support

Nếu gặp vấn đề, kiểm tra:

1. Database connection (SQL Server đang chạy?)
2. Environment variables đã đúng chưa?
3. Payment gateway credentials đã được set chưa?
4. Logs của service: `docker-compose logs payment-after-sale-service`

## ✅ Status

**COMPLETED** - Service đã được implement đầy đủ và sẵn sàng sử dụng!
