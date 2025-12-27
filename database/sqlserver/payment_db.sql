-- Payment Database Schema
-- FurniMart Payment & After-Sale Service

USE master;
GO

-- Create Payment Database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'payment_db')
BEGIN
    CREATE DATABASE payment_db;
END
GO

USE payment_db;
GO

-- ================================================
-- Bảng Payments: Lưu thông tin thanh toán
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Payments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Payments] (
        [payment_id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        [order_id] UNIQUEIDENTIFIER NOT NULL,
        [user_id] UNIQUEIDENTIFIER NOT NULL,
        [payment_method] NVARCHAR(50) NOT NULL, -- VNPAY, ZaloPay, MoMo, COD
        [amount] DECIMAL(18, 2) NOT NULL,
        [currency] NVARCHAR(10) DEFAULT 'VND',
        [status] NVARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED, CANCELLED
        [transaction_id] NVARCHAR(255) NULL, -- ID từ payment gateway
        [gateway_response] NVARCHAR(MAX) NULL, -- Response từ gateway (JSON)
        [payment_url] NVARCHAR(500) NULL, -- URL redirect
        [callback_data] NVARCHAR(MAX) NULL, -- Callback data từ IPN (JSON)
        [verified_at] DATETIME2 NULL,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        
        INDEX idx_order_id (order_id),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_transaction_id (transaction_id)
    );
END
GO

-- ================================================
-- Bảng PaymentTransactions: Log tất cả giao dịch
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PaymentTransactions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[PaymentTransactions] (
        [transaction_log_id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        [payment_id] UNIQUEIDENTIFIER NOT NULL,
        [action] NVARCHAR(100) NOT NULL, -- CREATE, CALLBACK, VERIFY, UPDATE_STATUS
        [request_data] NVARCHAR(MAX) NULL, -- Request data (JSON)
        [response_data] NVARCHAR(MAX) NULL, -- Response data (JSON)
        [ip_address] NVARCHAR(50) NULL,
        [user_agent] NVARCHAR(500) NULL,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        
        FOREIGN KEY (payment_id) REFERENCES Payments(payment_id),
        INDEX idx_payment_id (payment_id),
        INDEX idx_created_at (created_at)
    );
END
GO

-- ================================================
-- Bảng AfterSaleRequests: Yêu cầu hậu mãi
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AfterSaleRequests]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[AfterSaleRequests] (
        [request_id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        [order_id] UNIQUEIDENTIFIER NOT NULL,
        [user_id] UNIQUEIDENTIFIER NOT NULL,
        [request_type] NVARCHAR(50) NOT NULL, -- WARRANTY, RETURN, REFUND, EXCHANGE, ASSEMBLY
        [reason] NVARCHAR(500) NOT NULL,
        [description] NVARCHAR(MAX) NULL,
        [attachments] NVARCHAR(MAX) NULL, -- JSON array of image URLs
        [status] NVARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, IN_PROGRESS, COMPLETED, CANCELLED
        [priority] NVARCHAR(20) DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
        [assigned_to] UNIQUEIDENTIFIER NULL, -- Staff ID xử lý
        [resolution_notes] NVARCHAR(MAX) NULL,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        [resolved_at] DATETIME2 NULL,
        
        INDEX idx_order_id (order_id),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
    );
END
GO

-- ================================================
-- Bảng AfterSaleStatusLogs: Log thay đổi trạng thái
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AfterSaleStatusLogs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[AfterSaleStatusLogs] (
        [log_id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        [request_id] UNIQUEIDENTIFIER NOT NULL,
        [old_status] NVARCHAR(50) NULL,
        [new_status] NVARCHAR(50) NOT NULL,
        [changed_by] UNIQUEIDENTIFIER NOT NULL, -- User ID hoặc Staff ID
        [notes] NVARCHAR(MAX) NULL,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        
        FOREIGN KEY (request_id) REFERENCES AfterSaleRequests(request_id),
        INDEX idx_request_id (request_id),
        INDEX idx_created_at (created_at)
    );
END
GO

-- ================================================
-- Bảng Refunds: Hoàn tiền
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Refunds]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Refunds] (
        [refund_id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        [payment_id] UNIQUEIDENTIFIER NOT NULL,
        [request_id] UNIQUEIDENTIFIER NULL, -- Liên kết với yêu cầu hậu mãi (nếu có)
        [amount] DECIMAL(18, 2) NOT NULL,
        [reason] NVARCHAR(500) NOT NULL,
        [refund_method] NVARCHAR(50) NULL, -- ORIGINAL_PAYMENT, BANK_TRANSFER
        [bank_account] NVARCHAR(MAX) NULL, -- JSON: bank details
        [status] NVARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
        [processed_at] DATETIME2 NULL,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        
        FOREIGN KEY (payment_id) REFERENCES Payments(payment_id),
        FOREIGN KEY (request_id) REFERENCES AfterSaleRequests(request_id),
        INDEX idx_payment_id (payment_id),
        INDEX idx_request_id (request_id),
        INDEX idx_status (status)
    );
END
GO

-- ================================================
-- Bảng WarrantyClaims: Chi tiết bảo hành
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[WarrantyClaims]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[WarrantyClaims] (
        [claim_id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        [request_id] UNIQUEIDENTIFIER NOT NULL,
        [order_id] UNIQUEIDENTIFIER NOT NULL,
        [product_id] UNIQUEIDENTIFIER NOT NULL,
        [warranty_type] NVARCHAR(50) NOT NULL, -- MANUFACTURER, EXTENDED, STORE
        [issue_description] NVARCHAR(MAX) NOT NULL,
        [warranty_start_date] DATE NOT NULL,
        [warranty_end_date] DATE NOT NULL,
        [service_center] NVARCHAR(255) NULL, -- Tên trung tâm bảo hành
        [technician_assigned] NVARCHAR(255) NULL,
        [estimated_completion] DATE NULL,
        [actual_completion] DATE NULL,
        [parts_replaced] NVARCHAR(MAX) NULL, -- JSON array
        [service_cost] DECIMAL(18, 2) DEFAULT 0, -- Chi phí nếu có
        [notes] NVARCHAR(MAX) NULL,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        
        FOREIGN KEY (request_id) REFERENCES AfterSaleRequests(request_id),
        INDEX idx_request_id (request_id),
        INDEX idx_order_id (order_id),
        INDEX idx_product_id (product_id)
    );
END
GO

-- ================================================
-- Bảng AssemblyBookings: Đặt lịch lắp đặt
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AssemblyBookings]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[AssemblyBookings] (
        [booking_id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        [order_id] UNIQUEIDENTIFIER NOT NULL,
        [user_id] UNIQUEIDENTIFIER NOT NULL,
        [address] NVARCHAR(500) NOT NULL,
        [city] NVARCHAR(100) NOT NULL,
        [district] NVARCHAR(100) NOT NULL,
        [ward] NVARCHAR(100) NULL,
        [phone] NVARCHAR(20) NOT NULL,
        [preferred_date] DATE NOT NULL,
        [preferred_time_slot] NVARCHAR(50) NOT NULL, -- MORNING (8-12), AFTERNOON (13-17), EVENING (18-20)
        [scheduled_date] DATETIME2 NULL,
        [technician_id] UNIQUEIDENTIFIER NULL, -- ID nhân viên kỹ thuật
        [status] NVARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
        [estimated_duration] INT NULL, -- Thời gian dự kiến (phút)
        [actual_duration] INT NULL,
        [service_fee] DECIMAL(18, 2) DEFAULT 0,
        [payment_status] NVARCHAR(50) DEFAULT 'UNPAID', -- UNPAID, PAID, WAIVED
        [customer_notes] NVARCHAR(MAX) NULL,
        [technician_notes] NVARCHAR(MAX) NULL,
        [completion_photos] NVARCHAR(MAX) NULL, -- JSON array of image URLs
        [customer_signature] NVARCHAR(MAX) NULL, -- Base64 hoặc URL
        [rating] INT NULL, -- 1-5 stars
        [feedback] NVARCHAR(MAX) NULL,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        [completed_at] DATETIME2 NULL,
        
        INDEX idx_order_id (order_id),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_scheduled_date (scheduled_date)
    );
END
GO

-- ================================================
-- Bảng ReturnItems: Chi tiết sản phẩm trả hàng
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ReturnItems]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ReturnItems] (
        [return_item_id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        [request_id] UNIQUEIDENTIFIER NOT NULL,
        [product_id] UNIQUEIDENTIFIER NOT NULL,
        [quantity] INT NOT NULL,
        [return_reason] NVARCHAR(500) NOT NULL,
        [condition] NVARCHAR(50) NOT NULL, -- NEW, USED, DAMAGED, DEFECTIVE
        [refund_amount] DECIMAL(18, 2) NOT NULL,
        [inspection_notes] NVARCHAR(MAX) NULL,
        [approved] BIT DEFAULT 0,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        
        FOREIGN KEY (request_id) REFERENCES AfterSaleRequests(request_id),
        INDEX idx_request_id (request_id),
        INDEX idx_product_id (product_id)
    );
END
GO

-- ================================================
-- Bảng PaymentMethods: Phương thức thanh toán
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PaymentMethods]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[PaymentMethods] (
        [method_id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        [method_code] NVARCHAR(50) NOT NULL UNIQUE, -- VNPAY, MOMO, ZALOPAY, COD, BANK_TRANSFER
        [method_name] NVARCHAR(100) NOT NULL,
        [description] NVARCHAR(500) NULL,
        [icon_url] NVARCHAR(500) NULL,
        [is_active] BIT DEFAULT 1,
        [config] NVARCHAR(MAX) NULL, -- JSON: API keys, endpoints, etc
        [display_order] INT DEFAULT 0,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE()
    );
    
    -- Insert default payment methods
    INSERT INTO PaymentMethods (method_code, method_name, description, display_order) VALUES
        ('COD', 'Cash on Delivery', N'Thanh toán khi nhận hàng', 1),
        ('VNPAY', 'VNPay', N'Thanh toán qua VNPay', 2),
        ('MOMO', 'MoMo', N'Thanh toán qua ví MoMo', 3),
        ('ZALOPAY', 'ZaloPay', N'Thanh toán qua ZaloPay', 4),
        ('BANK_TRANSFER', 'Bank Transfer', N'Chuyển khoản ngân hàng', 5);
END
GO

-- ================================================
-- Triggers: Auto-update updated_at
-- ================================================
CREATE OR ALTER TRIGGER trg_Payments_UpdatedAt
ON Payments
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Payments 
    SET updated_at = GETDATE()
    FROM Payments p
    INNER JOIN inserted i ON p.payment_id = i.payment_id;
END;
GO

CREATE OR ALTER TRIGGER trg_AfterSaleRequests_UpdatedAt
ON AfterSaleRequests
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE AfterSaleRequests 
    SET updated_at = GETDATE()
    FROM AfterSaleRequests a
    INNER JOIN inserted i ON a.request_id = i.request_id;
END;
GO

CREATE OR ALTER TRIGGER trg_Refunds_UpdatedAt
ON Refunds
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Refunds 
    SET updated_at = GETDATE()
    FROM Refunds r
    INNER JOIN inserted i ON r.refund_id = i.refund_id;
END;
GO

CREATE OR ALTER TRIGGER trg_AssemblyBookings_UpdatedAt
ON AssemblyBookings
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE AssemblyBookings 
    SET updated_at = GETDATE()
    FROM AssemblyBookings a
    INNER JOIN inserted i ON a.booking_id = i.booking_id;
END;
GO

PRINT 'Payment database schema created successfully with all tables!';
GO


