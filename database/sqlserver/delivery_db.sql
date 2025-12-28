-- =============================================
-- FurniMart Delivery Service Database Schema + Seed Data
-- Version: 2025-12-25 Improved & Microservices Compliant
-- =============================================
USE master;
GO

-- Tạo database nếu chưa tồn tại
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'delivery_db')
BEGIN
    CREATE DATABASE delivery_db;
    PRINT 'Database delivery_db đã được tạo.';
END
GO

USE delivery_db;
GO

-- =============================================
-- 1. Users (Tham chiếu từ Identity Service - KHÔNG lưu password)
-- =============================================
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
GO

CREATE TABLE Users (
    user_id UNIQUEIDENTIFIER PRIMARY KEY,  -- Lấy từ identity_db, KHÔNG DEFAULT NEWID()
    full_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    role NVARCHAR(50) NOT NULL
        CHECK (role IN ('Admin', 'BranchManager', 'DeliveryStaff', 'Seller')),
    phone NVARCHAR(20),
    branch_id UNIQUEIDENTIFIER NULL,  -- Nếu có chi nhánh
    created_at DATETIME DEFAULT GETUTCDATE(),
    updated_at DATETIME DEFAULT GETUTCDATE()
);
GO

-- Index
CREATE NONCLUSTERED INDEX IX_Users_Email ON Users(email);
CREATE NONCLUSTERED INDEX IX_Users_Role ON Users(role);
GO

-- Seed Users (dữ liệu tham chiếu - user_id giả lập từ identity_db)
-- Lưu ý: user_id này phải khớp với Id thật trong identity_db.Users
-- Bạn có thể lấy user_id thật từ identity_db sau khi seed
INSERT INTO Users (user_id, full_name, email, role, phone)
VALUES
    ('00000001-0001-0000-0000-000000000001', N'Quản trị hệ thống', 'admin@furnimart.vn', 'Admin', '0900000000'),
    ('00000002-0002-0000-0000-000000000002', N'Nguyễn Văn A - Nhân viên giao hàng 1', 'staff1@furnimart.vn', 'DeliveryStaff', '0912345678'),
    ('00000003-0003-0000-0000-000000000003', N'Trần Thị B - Nhân viên giao hàng 2', 'staff2@furnimart.vn', 'DeliveryStaff', '0912345679');
GO

PRINT 'Users table created and seeded (tham chiếu từ identity_db).';
GO

-- =============================================
-- 2. Orders (Đơn hàng gốc từ hệ thống bán hàng)
-- =============================================
IF OBJECT_ID('Orders', 'U') IS NOT NULL DROP TABLE Orders;
GO

CREATE TABLE Orders (
    order_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    order_code NVARCHAR(50) NOT NULL UNIQUE,
    customer_name NVARCHAR(255) NOT NULL,
    customer_phone NVARCHAR(20),
    delivery_address NVARCHAR(1000) NOT NULL,
    delivery_city NVARCHAR(100) NOT NULL,
    delivery_district NVARCHAR(100) NOT NULL,
    delivery_ward NVARCHAR(100),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    total_amount DECIMAL(18,2),
    status NVARCHAR(50) NOT NULL
        CHECK (status IN ('Pending', 'Confirmed', 'Cancelled', 'Completed')),
    created_at DATETIME DEFAULT GETUTCDATE(),
    updated_at DATETIME DEFAULT GETUTCDATE()
);
GO

-- Seed Orders
INSERT INTO Orders (order_code, customer_name, customer_phone, delivery_address, delivery_city, delivery_district, status)
VALUES
    ('DH001', N'Nguyễn Văn A', '0987654321', N'123 Lê Lợi, Phường Bến Nghé, Quận 1', N'TP. Hồ Chí Minh', N'Quận 1', 'Pending'),
    ('DH002', N'Trần Thị B', '0987654322', N'456 Trần Hưng Đạo, Phường 7, Quận 5', N'TP. Hồ Chí Minh', N'Quận 5', 'Confirmed');
GO

-- =============================================
-- 3. Deliveries
-- =============================================
IF OBJECT_ID('Deliveries', 'U') IS NOT NULL DROP TABLE Deliveries;
GO

CREATE TABLE Deliveries (
    delivery_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    order_id UNIQUEIDENTIFIER NOT NULL,
    delivery_staff_id UNIQUEIDENTIFIER NULL,  -- Tham chiếu Users.user_id
    priority NVARCHAR(20) DEFAULT 'Normal',
    estimated_delivery_date DATE,
    delivery_status NVARCHAR(50) NOT NULL
        CHECK (delivery_status IN ('Pending','Assigned','InTransit','Delivered','Failed','Cancelled','Returned')),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    notes NVARCHAR(500),
    created_at DATETIME DEFAULT GETUTCDATE(),
    updated_at DATETIME DEFAULT GETUTCDATE(),
    assigned_at DATETIME NULL,
    picked_up_at DATETIME NULL,
    delivered_at DATETIME NULL,
    CONSTRAINT FK_Deliveries_Orders FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    CONSTRAINT FK_Deliveries_Users FOREIGN KEY (delivery_staff_id) REFERENCES Users(user_id)
);
GO

-- Seed Deliveries
INSERT INTO Deliveries (order_id, delivery_staff_id, delivery_status)
SELECT
    (SELECT TOP 1 order_id FROM Orders WHERE order_code = 'DH001'),
    (SELECT TOP 1 user_id FROM Users WHERE email = 'staff1@furnimart.vn'),
    'Assigned';

INSERT INTO Deliveries (order_id, delivery_staff_id, delivery_status)
SELECT
    (SELECT TOP 1 order_id FROM Orders WHERE order_code = 'DH002'),
    NULL,
    'Pending';
GO

-- =============================================
-- 4. Delivery_Status_History
-- =============================================
IF OBJECT_ID('Delivery_Status_History', 'U') IS NOT NULL DROP TABLE Delivery_Status_History;
GO

CREATE TABLE Delivery_Status_History (
    history_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    delivery_id UNIQUEIDENTIFIER NOT NULL,
    previous_status NVARCHAR(50),
    new_status NVARCHAR(50) NOT NULL,
    changed_by UNIQUEIDENTIFIER NULL,  -- Tham chiếu Users.user_id
    changed_by_type NVARCHAR(20) DEFAULT 'System',
    notes NVARCHAR(500),
    location NVARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT FK_History_Deliveries FOREIGN KEY (delivery_id) REFERENCES Deliveries(delivery_id),
    CONSTRAINT FK_History_Users FOREIGN KEY (changed_by) REFERENCES Users(user_id)
);
GO

-- Seed History
INSERT INTO Delivery_Status_History (delivery_id, previous_status, new_status, changed_by_type)
SELECT delivery_id, NULL, 'Pending', 'System'
FROM Deliveries WHERE delivery_status = 'Pending';

INSERT INTO Delivery_Status_History (delivery_id, previous_status, new_status, changed_by_type)
SELECT delivery_id, 'Pending', 'Assigned', 'Staff'
FROM Deliveries WHERE delivery_status = 'Assigned';
GO

-- =============================================
-- 5. Delivery_Proofs
-- =============================================
IF OBJECT_ID('Delivery_Proofs', 'U') IS NOT NULL DROP TABLE Delivery_Proofs;
GO

CREATE TABLE Delivery_Proofs (
    proof_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    delivery_id UNIQUEIDENTIFIER NOT NULL,
    proof_type NVARCHAR(50) DEFAULT 'Photo',
    file_url NVARCHAR(1000) NOT NULL,
    file_name NVARCHAR(255),
    file_type NVARCHAR(100),
    file_size BIGINT,
    description NVARCHAR(500),
    uploaded_by UNIQUEIDENTIFIER NULL,  -- Tham chiếu Users.user_id
    created_at DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Proofs_Deliveries FOREIGN KEY (delivery_id) REFERENCES Deliveries(delivery_id),
    CONSTRAINT FK_Proofs_Users FOREIGN KEY (uploaded_by) REFERENCES Users(user_id)
);
GO

-- Seed Proofs (mẫu)
INSERT INTO Delivery_Proofs (delivery_id, proof_type, file_url, file_name, file_type, uploaded_by)
SELECT
    (SELECT TOP 1 delivery_id FROM Deliveries WHERE delivery_status = 'Assigned'),
    'Photo',
    '/uploads/delivery-proof-1.jpg',
    'proof_customer_sign.jpg',
    'image/jpeg',
    (SELECT TOP 1 user_id FROM Users WHERE email = 'staff1@furnimart.vn');
GO

PRINT '=====================================';
PRINT 'Database delivery_db + seed data đã được tạo thành công!';
PRINT 'Sẵn sàng test API delivery service.';
PRINT 'Lưu ý: Users chỉ là tham chiếu - password ở identity_db.';
PRINT '=====================================';
GO