-- ================================================
-- GHN Integration - Database Migration
-- Purpose: Add GHN tracking fields to Orders table
-- Date: 2025
-- ================================================

USE SuLi_Coffee;

-- Add GHN tracking columns to Orders table
ALTER TABLE Orders 
ADD COLUMN GHNOrderCode VARCHAR(50) DEFAULT NULL COMMENT 'Mã đơn hàng GHN',
ADD COLUMN GHNTransId VARCHAR(50) DEFAULT NULL COMMENT 'Mã vận đơn GHN',
ADD COLUMN GHNSortingCode VARCHAR(50) DEFAULT NULL COMMENT 'Mã phân loại GHN',
ADD COLUMN GHNTotalFee INT DEFAULT NULL COMMENT 'Phí ship GHN (VND)',
ADD COLUMN GHNExpectedDeliveryTime DATETIME DEFAULT NULL COMMENT 'Thời gian giao hàng dự kiến';

-- Create index for faster GHN order lookups
CREATE INDEX idx_ghn_order_code ON Orders(GHNOrderCode);

-- Add comment to table
ALTER TABLE Orders COMMENT = 'Bảng đơn hàng - Updated with GHN integration';

-- Display updated structure
DESCRIBE Orders;

-- ================================================
-- Migration Complete
-- ================================================
-- Next steps:
-- 1. Run this migration on your database
-- 2. Update backend/models/Orders.js to include new fields
-- 3. Uncomment the GHN save code in placeOrder.js (line ~480)
-- ================================================
