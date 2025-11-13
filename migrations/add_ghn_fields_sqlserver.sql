-- ================================================
-- GHN Integration - SQL Server Migration
-- Purpose: Add GHN tracking fields to Orders table
-- Date: 2025-11-14
-- ================================================

USE SuLi_Coffee;
GO

-- Check if columns already exist before adding
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Orders]') AND name = 'GHNOrderCode')
BEGIN
    ALTER TABLE [dbo].[Orders]
    ADD GHNOrderCode NVARCHAR(50) NULL;
    PRINT 'Added GHNOrderCode column';
END
ELSE
BEGIN
    PRINT 'GHNOrderCode column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Orders]') AND name = 'GHNTransId')
BEGIN
    ALTER TABLE [dbo].[Orders]
    ADD GHNTransId NVARCHAR(50) NULL;
    PRINT 'Added GHNTransId column';
END
ELSE
BEGIN
    PRINT 'GHNTransId column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Orders]') AND name = 'GHNSortingCode')
BEGIN
    ALTER TABLE [dbo].[Orders]
    ADD GHNSortingCode NVARCHAR(50) NULL;
    PRINT 'Added GHNSortingCode column';
END
ELSE
BEGIN
    PRINT 'GHNSortingCode column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Orders]') AND name = 'GHNTotalFee')
BEGIN
    ALTER TABLE [dbo].[Orders]
    ADD GHNTotalFee INT NULL;
    PRINT 'Added GHNTotalFee column';
END
ELSE
BEGIN
    PRINT 'GHNTotalFee column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Orders]') AND name = 'GHNExpectedDeliveryTime')
BEGIN
    ALTER TABLE [dbo].[Orders]
    ADD GHNExpectedDeliveryTime DATETIME NULL;
    PRINT 'Added GHNExpectedDeliveryTime column';
END
ELSE
BEGIN
    PRINT 'GHNExpectedDeliveryTime column already exists';
END
GO

-- Create index for faster GHN order lookups (if not exists)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_ghn_order_code' AND object_id = OBJECT_ID(N'[dbo].[Orders]'))
BEGIN
    CREATE INDEX idx_ghn_order_code ON [dbo].[Orders](GHNOrderCode);
    PRINT 'Created index idx_ghn_order_code';
END
ELSE
BEGIN
    PRINT 'Index idx_ghn_order_code already exists';
END
GO

-- Display updated structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Orders'
AND COLUMN_NAME LIKE 'GHN%'
ORDER BY ORDINAL_POSITION;
GO

PRINT '================================================';
PRINT 'Migration Complete!';
PRINT '================================================';
PRINT 'Added columns:';
PRINT '  - GHNOrderCode (NVARCHAR(50)) - Mã đơn hàng GHN';
PRINT '  - GHNTransId (NVARCHAR(50)) - Mã vận đơn GHN';
PRINT '  - GHNSortingCode (NVARCHAR(50)) - Mã phân loại GHN';
PRINT '  - GHNTotalFee (INT) - Phí ship GHN (VND)';
PRINT '  - GHNExpectedDeliveryTime (DATETIME) - Thời gian giao hàng dự kiến';
PRINT '';
PRINT 'Next steps:';
PRINT '  1. Update backend/models/Orders.js to include new fields';
PRINT '  2. Backend code has been updated to save GHN data';
PRINT '================================================';
GO
