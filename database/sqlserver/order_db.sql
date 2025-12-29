-- =============================================
-- Order Database Schema
-- FurniMart Order Service
-- Created: December 29, 2025
-- =============================================

USE master;
GO

-- Drop database if exists (for development only)
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'order_db')
BEGIN
    ALTER DATABASE order_db SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE order_db;
    PRINT 'Existing database dropped';
END
GO

-- Create Order Database
CREATE DATABASE order_db;
PRINT 'Database order_db created successfully';
GO

USE order_db;
GO

-- =============================================
-- Table: Orders
-- Description: Stores order information
-- =============================================
CREATE TABLE Orders (
    order_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    order_number NVARCHAR(50) UNIQUE NOT NULL,
    order_date DATETIME NOT NULL DEFAULT GETDATE(),
    status NVARCHAR(50) NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(18, 2) NOT NULL,
    payment_method NVARCHAR(50),
    payment_status NVARCHAR(50) DEFAULT 'pending',
    
    -- Shipping Information
    shipping_address NVARCHAR(MAX) NOT NULL,
    shipping_city NVARCHAR(100),
    shipping_state NVARCHAR(100),
    shipping_zip NVARCHAR(20),
    shipping_country NVARCHAR(100) DEFAULT 'Vietnam',
    shipping_latitude DECIMAL(10, 8),
    shipping_longitude DECIMAL(11, 8),
    
    -- Billing Information
    billing_address NVARCHAR(MAX),
    billing_city NVARCHAR(100),
    billing_state NVARCHAR(100),
    billing_zip NVARCHAR(20),
    billing_country NVARCHAR(100) DEFAULT 'Vietnam',
    
    -- Customer Information
    customer_name NVARCHAR(255) NOT NULL,
    customer_phone NVARCHAR(20) NOT NULL,
    customer_email NVARCHAR(255),
    
    -- Pricing Details
    subtotal DECIMAL(18, 2) NOT NULL,
    shipping_fee DECIMAL(18, 2) DEFAULT 0,
    tax_amount DECIMAL(18, 2) DEFAULT 0,
    discount_amount DECIMAL(18, 2) DEFAULT 0,
    discount_code NVARCHAR(50),
    
    -- Additional Information
    notes NVARCHAR(MAX),
    estimated_delivery_date DATETIME,
    actual_delivery_date DATETIME,
    tracking_number NVARCHAR(100),
    
    -- Cancellation
    cancelled_at DATETIME,
    cancellation_reason NVARCHAR(MAX),
    
    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT CK_Orders_Status CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    CONSTRAINT CK_Orders_PaymentStatus CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded'))
);
PRINT 'Table Orders created successfully';
GO

-- =============================================
-- Table: OrderItems
-- Description: Stores order line items
-- =============================================
CREATE TABLE OrderItems (
    order_item_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name NVARCHAR(255) NOT NULL,
    product_sku NVARCHAR(100),
    product_image NVARCHAR(500),
    quantity INT NOT NULL,
    unit_price DECIMAL(18, 2) NOT NULL,
    subtotal DECIMAL(18, 2) NOT NULL,
    discount DECIMAL(18, 2) DEFAULT 0,
    tax DECIMAL(18, 2) DEFAULT 0,
    total_price DECIMAL(18, 2) NOT NULL,
    
    -- Product Variants (JSON format)
    product_attributes NVARCHAR(MAX), -- {"color": "Red", "size": "Large"}
    
    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (order_id) 
        REFERENCES Orders(order_id) ON DELETE CASCADE,
    CONSTRAINT CK_OrderItems_Quantity CHECK (quantity > 0),
    CONSTRAINT CK_OrderItems_UnitPrice CHECK (unit_price >= 0)
);
PRINT 'Table OrderItems created successfully';
GO

-- =============================================
-- Table: OrderStatusHistory
-- Description: Tracks order status changes
-- =============================================
CREATE TABLE OrderStatusHistory (
    status_history_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    old_status NVARCHAR(50),
    new_status NVARCHAR(50) NOT NULL,
    changed_by INT, -- user_id who made the change
    changed_by_name NVARCHAR(255),
    changed_by_role NVARCHAR(50), -- 'customer', 'admin', 'system'
    change_reason NVARCHAR(MAX),
    notes NVARCHAR(MAX),
    ip_address NVARCHAR(50),
    user_agent NVARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT FK_OrderStatusHistory_Orders FOREIGN KEY (order_id) 
        REFERENCES Orders(order_id) ON DELETE CASCADE
);
PRINT 'Table OrderStatusHistory created successfully';
GO

-- =============================================
-- Table: Invoices
-- Description: Stores invoice information
-- =============================================
CREATE TABLE Invoices (
    invoice_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    invoice_number NVARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATETIME NOT NULL DEFAULT GETDATE(),
    due_date DATETIME,
    status NVARCHAR(50) NOT NULL DEFAULT 'unpaid',
    
    -- Amounts
    subtotal DECIMAL(18, 2) NOT NULL,
    tax_amount DECIMAL(18, 2) DEFAULT 0,
    discount_amount DECIMAL(18, 2) DEFAULT 0,
    shipping_fee DECIMAL(18, 2) DEFAULT 0,
    total_amount DECIMAL(18, 2) NOT NULL,
    paid_amount DECIMAL(18, 2) DEFAULT 0,
    remaining_amount AS (total_amount - paid_amount) PERSISTED,
    
    -- Payment Information
    payment_method NVARCHAR(50),
    payment_date DATETIME,
    payment_reference NVARCHAR(100),
    payment_gateway NVARCHAR(50), -- 'VNPay', 'MoMo', 'COD', etc.
    transaction_id NVARCHAR(100),
    
    -- Additional
    notes NVARCHAR(MAX),
    pdf_url NVARCHAR(500),
    
    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT FK_Invoices_Orders FOREIGN KEY (order_id) 
        REFERENCES Orders(order_id) ON DELETE CASCADE,
    CONSTRAINT CK_Invoices_Status CHECK (status IN ('unpaid', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded'))
);
PRINT 'Table Invoices created successfully';
GO

-- =============================================
-- Indexes for Performance Optimization
-- =============================================

-- Orders table indexes
CREATE INDEX IX_Orders_UserId ON Orders(user_id);
CREATE INDEX IX_Orders_OrderNumber ON Orders(order_number);
CREATE INDEX IX_Orders_Status ON Orders(status);
CREATE INDEX IX_Orders_OrderDate ON Orders(order_date DESC);
CREATE INDEX IX_Orders_CustomerEmail ON Orders(customer_email);
CREATE INDEX IX_Orders_CustomerPhone ON Orders(customer_phone);

-- OrderItems table indexes
CREATE INDEX IX_OrderItems_OrderId ON OrderItems(order_id);
CREATE INDEX IX_OrderItems_ProductId ON OrderItems(product_id);

-- OrderStatusHistory table indexes
CREATE INDEX IX_OrderStatusHistory_OrderId ON OrderStatusHistory(order_id);
CREATE INDEX IX_OrderStatusHistory_CreatedAt ON OrderStatusHistory(created_at DESC);

-- Invoices table indexes
CREATE INDEX IX_Invoices_OrderId ON Invoices(order_id);
CREATE INDEX IX_Invoices_InvoiceNumber ON Invoices(invoice_number);
CREATE INDEX IX_Invoices_Status ON Invoices(status);
CREATE INDEX IX_Invoices_InvoiceDate ON Invoices(invoice_date DESC);

PRINT 'Indexes created successfully';
GO

-- =============================================
-- Trigger: Auto-update Orders.updated_at
-- =============================================
CREATE TRIGGER TR_Orders_UpdatedAt
ON Orders
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Orders
    SET updated_at = GETDATE()
    FROM Orders o
    INNER JOIN inserted i ON o.order_id = i.order_id;
END
GO

-- =============================================
-- Trigger: Auto-update OrderItems.updated_at
-- =============================================
CREATE TRIGGER TR_OrderItems_UpdatedAt
ON OrderItems
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE OrderItems
    SET updated_at = GETDATE()
    FROM OrderItems oi
    INNER JOIN inserted i ON oi.order_item_id = i.order_item_id;
END
GO

-- =============================================
-- Trigger: Auto-update Invoices.updated_at
-- =============================================
CREATE TRIGGER TR_Invoices_UpdatedAt
ON Invoices
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Invoices
    SET updated_at = GETDATE()
    FROM Invoices inv
    INNER JOIN inserted i ON inv.invoice_id = i.invoice_id;
END
GO

-- =============================================
-- Trigger: Log status changes to OrderStatusHistory
-- =============================================
CREATE TRIGGER TR_Orders_StatusChange
ON Orders
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF UPDATE(status)
    BEGIN
        INSERT INTO OrderStatusHistory (order_id, old_status, new_status, changed_by_name, notes)
        SELECT 
            i.order_id,
            d.status,
            i.status,
            'System',
            'Status changed from ' + ISNULL(d.status, 'NULL') + ' to ' + i.status
        FROM inserted i
        INNER JOIN deleted d ON i.order_id = d.order_id
        WHERE i.status != d.status;
    END
END
GO

-- =============================================
-- Stored Procedure: Get Order Details
-- =============================================
CREATE PROCEDURE sp_GetOrderDetails
    @order_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get order info
    SELECT * FROM Orders WHERE order_id = @order_id;
    
    -- Get order items
    SELECT * FROM OrderItems WHERE order_id = @order_id;
    
    -- Get status history
    SELECT * FROM OrderStatusHistory 
    WHERE order_id = @order_id 
    ORDER BY created_at DESC;
    
    -- Get invoice
    SELECT * FROM Invoices WHERE order_id = @order_id;
END
GO

-- =============================================
-- Stored Procedure: Create New Order
-- =============================================
CREATE PROCEDURE sp_CreateOrder
    @user_id INT,
    @order_number NVARCHAR(50),
    @total_amount DECIMAL(18, 2),
    @customer_name NVARCHAR(255),
    @customer_phone NVARCHAR(20),
    @customer_email NVARCHAR(255),
    @shipping_address NVARCHAR(MAX),
    @shipping_city NVARCHAR(100),
    @payment_method NVARCHAR(50),
    @subtotal DECIMAL(18, 2),
    @shipping_fee DECIMAL(18, 2) = 0,
    @tax_amount DECIMAL(18, 2) = 0,
    @discount_amount DECIMAL(18, 2) = 0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Insert order
        INSERT INTO Orders (
            user_id, order_number, total_amount, customer_name, 
            customer_phone, customer_email, shipping_address, shipping_city,
            payment_method, subtotal, shipping_fee, tax_amount, discount_amount
        )
        VALUES (
            @user_id, @order_number, @total_amount, @customer_name,
            @customer_phone, @customer_email, @shipping_address, @shipping_city,
            @payment_method, @subtotal, @shipping_fee, @tax_amount, @discount_amount
        );
        
        DECLARE @new_order_id INT = SCOPE_IDENTITY();
        
        -- Create invoice
        DECLARE @invoice_number NVARCHAR(50) = 'INV-' + @order_number;
        INSERT INTO Invoices (
            order_id, invoice_number, subtotal, tax_amount, 
            discount_amount, shipping_fee, total_amount
        )
        VALUES (
            @new_order_id, @invoice_number, @subtotal, @tax_amount,
            @discount_amount, @shipping_fee, @total_amount
        );
        
        COMMIT TRANSACTION;
        
        -- Return new order id
        SELECT @new_order_id AS order_id;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- =============================================
-- Stored Procedure: Update Order Status
-- =============================================
CREATE PROCEDURE sp_UpdateOrderStatus
    @order_id INT,
    @new_status NVARCHAR(50),
    @changed_by INT = NULL,
    @changed_by_name NVARCHAR(255) = 'System',
    @notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    BEGIN TRY
        DECLARE @old_status NVARCHAR(50);
        
        -- Get current status
        SELECT @old_status = status FROM Orders WHERE order_id = @order_id;
        
        -- Update order status
        UPDATE Orders 
        SET status = @new_status,
            cancelled_at = CASE WHEN @new_status = 'cancelled' THEN GETDATE() ELSE cancelled_at END,
            actual_delivery_date = CASE WHEN @new_status = 'delivered' THEN GETDATE() ELSE actual_delivery_date END
        WHERE order_id = @order_id;
        
        -- Insert status history (manual entry, trigger also logs)
        INSERT INTO OrderStatusHistory (
            order_id, old_status, new_status, changed_by, changed_by_name, notes
        )
        VALUES (
            @order_id, @old_status, @new_status, @changed_by, @changed_by_name, @notes
        );
        
        COMMIT TRANSACTION;
        
        SELECT 'Success' AS result;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- =============================================
-- Function: Calculate Order Total
-- =============================================
CREATE FUNCTION fn_CalculateOrderTotal
(
    @order_id INT
)
RETURNS DECIMAL(18, 2)
AS
BEGIN
    DECLARE @total DECIMAL(18, 2);
    
    SELECT @total = SUM(total_price)
    FROM OrderItems
    WHERE order_id = @order_id;
    
    RETURN ISNULL(@total, 0);
END
GO

-- =============================================
-- View: Order Summary
-- =============================================
CREATE VIEW vw_OrderSummary
AS
SELECT 
    o.order_id,
    o.order_number,
    o.order_date,
    o.status,
    o.customer_name,
    o.customer_phone,
    o.customer_email,
    o.total_amount,
    o.payment_status,
    o.payment_method,
    COUNT(oi.order_item_id) AS item_count,
    SUM(oi.quantity) AS total_quantity,
    i.invoice_number,
    i.status AS invoice_status
FROM Orders o
LEFT JOIN OrderItems oi ON o.order_id = oi.order_id
LEFT JOIN Invoices i ON o.order_id = i.order_id
GROUP BY 
    o.order_id, o.order_number, o.order_date, o.status,
    o.customer_name, o.customer_phone, o.customer_email,
    o.total_amount, o.payment_status, o.payment_method,
    i.invoice_number, i.status;
GO

-- =============================================
-- Insert Sample Data for Testing
-- =============================================
PRINT 'Inserting sample data...';

-- Sample Order 1
INSERT INTO Orders (
    user_id, order_number, status, customer_name, customer_phone, customer_email,
    shipping_address, shipping_city, shipping_state, shipping_country,
    payment_method, payment_status, subtotal, shipping_fee, tax_amount, 
    discount_amount, total_amount
)
VALUES (
    1, 'ORD-2025-00001', 'pending', 'Nguyễn Văn A', '0901234567', 'nguyenvana@gmail.com',
    '123 Nguyễn Huệ, Quận 1', 'Hồ Chí Minh', 'Hồ Chí Minh', 'Vietnam',
    'COD', 'pending', 13500000, 50000, 1350000, 0, 14900000
);

DECLARE @order1_id INT = SCOPE_IDENTITY();

-- Sample Order Items for Order 1
INSERT INTO OrderItems (order_id, product_id, product_name, product_sku, quantity, unit_price, subtotal, total_price)
VALUES 
    (@order1_id, 1, 'Sofa 3 Chỗ Ngồi Cao Cấp', 'SOFA-001', 1, 8000000, 8000000, 8000000),
    (@order1_id, 2, 'Bàn Trà Gỗ Sồi', 'TABLE-001', 1, 3500000, 3500000, 3500000),
    (@order1_id, 3, 'Đèn Trang Trí Hiện Đại', 'LAMP-001', 2, 1000000, 2000000, 2000000);

-- Sample Invoice for Order 1
INSERT INTO Invoices (
    order_id, invoice_number, status, subtotal, tax_amount, 
    shipping_fee, discount_amount, total_amount
)
VALUES (
    @order1_id, 'INV-2025-00001', 'unpaid', 13500000, 1350000, 
    50000, 0, 14900000
);

-- Sample Order 2
INSERT INTO Orders (
    user_id, order_number, status, customer_name, customer_phone, customer_email,
    shipping_address, shipping_city, shipping_state, shipping_country,
    payment_method, payment_status, subtotal, shipping_fee, tax_amount, 
    discount_amount, total_amount, actual_delivery_date
)
VALUES (
    2, 'ORD-2025-00002', 'delivered', 'Trần Thị B', '0912345678', 'tranthib@gmail.com',
    '456 Lê Lợi, Quận 3', 'Hồ Chí Minh', 'Hồ Chí Minh', 'Vietnam',
    'VNPay', 'paid', 5000000, 30000, 500000, 250000, 5280000, GETDATE()
);

DECLARE @order2_id INT = SCOPE_IDENTITY();

-- Sample Order Items for Order 2
INSERT INTO OrderItems (order_id, product_id, product_name, product_sku, quantity, unit_price, subtotal, total_price)
VALUES 
    (@order2_id, 4, 'Ghế Làm Việc Ergonomic', 'CHAIR-001', 2, 2500000, 5000000, 5000000);

-- Sample Invoice for Order 2
INSERT INTO Invoices (
    order_id, invoice_number, status, subtotal, tax_amount, 
    shipping_fee, discount_amount, total_amount, paid_amount, 
    payment_method, payment_date, payment_reference
)
VALUES (
    @order2_id, 'INV-2025-00002', 'paid', 5000000, 500000, 
    30000, 250000, 5280000, 5280000,
    'VNPay', GETDATE(), 'VNPAY-20251229-001'
);

PRINT 'Sample data inserted successfully';
GO

-- =============================================
-- Database Statistics
-- =============================================
PRINT '================================================';
PRINT 'Order Database Created Successfully!';
PRINT '================================================';
PRINT 'Tables:';
PRINT '  - Orders (with 2 sample records)';
PRINT '  - OrderItems (with 4 sample records)';
PRINT '  - OrderStatusHistory (auto-populated by trigger)';
PRINT '  - Invoices (with 2 sample records)';
PRINT '';
PRINT 'Features:';
PRINT '  - Auto-increment IDs';
PRINT '  - Foreign key constraints';
PRINT '  - Check constraints for data integrity';
PRINT '  - Indexes for performance';
PRINT '  - Triggers for auto-updates';
PRINT '  - Stored procedures for common operations';
PRINT '  - Views for reporting';
PRINT '';
PRINT 'Ready for use!';
PRINT '================================================';
GO
