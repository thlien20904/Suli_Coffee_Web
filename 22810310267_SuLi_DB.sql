DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;





-- 1. Bảng Users
CREATE TABLE "Users" (
    "Id" SERIAL PRIMARY KEY,
    "Username" VARCHAR(50) UNIQUE NOT NULL,
    "Email" VARCHAR(50) UNIQUE NOT NULL,
    "PasswordHash" VARCHAR(255) NOT NULL,
    "FullName" VARCHAR(100),
    "Phone" VARCHAR(15),
    "Address" TEXT,
    "Province" VARCHAR(100),
    "District" VARCHAR(100),
    "Ward" VARCHAR(100),
    "Role" VARCHAR(20) NOT NULL DEFAULT 'User',
    "OTPCode" VARCHAR(10),
    "OTPExpiry" TIMESTAMP,
    "ResetToken" VARCHAR(100),
    "ResetTokenExpiry" TIMESTAMP,
    "AvatarUrl" VARCHAR(255),
    "CreatedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng AccRole
CREATE TABLE "AccRole" (
    "RoleId" SERIAL PRIMARY KEY,
    "RoleName" VARCHAR(100) NOT NULL
);

-- 3. Bảng Account
CREATE TABLE "Account" (
    "AccountId" SERIAL PRIMARY KEY,
    "DisplayName" VARCHAR(100) NOT NULL,
    "UserName" VARCHAR(50) NOT NULL,
    "PassWord" VARCHAR(50) NOT NULL,
    "RoleName" VARCHAR(50) NOT NULL
);

-- 4. Bảng TableFood
CREATE TABLE "TableFood" (
    "TableId" SERIAL PRIMARY KEY,
    "TableName" VARCHAR(100),
    "TrangThai" VARCHAR(100)
);

-- 5. Bảng Category
CREATE TABLE "Category" (
    "CategoryId" SERIAL PRIMARY KEY,
    "CategoryName" VARCHAR(100) NOT NULL
);

-- 6. Bảng Ingredient
CREATE TABLE "Ingredient" (
    "IngredientId" SERIAL PRIMARY KEY,
    "IngredientName" VARCHAR(100) NOT NULL,
    "SoLuong" INTEGER NOT NULL DEFAULT 0,
    "PhanLoai" VARCHAR(50) NOT NULL,
    "ImageURL" VARCHAR(255) NOT NULL,
    "LastUpdated" DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 7. Bảng Size
CREATE TABLE "Size" (
    "SizeID" SERIAL PRIMARY KEY,
    "SizeName" VARCHAR(50) NOT NULL,
    "ExtraPrice" INTEGER NOT NULL
);

-- 8. Bảng Topping
CREATE TABLE "Topping" (
    "ToppingID" SERIAL PRIMARY KEY,
    "ToppingName" VARCHAR(100) NOT NULL,
    "ToppingPrice" INTEGER NOT NULL
);

-- 9. Bảng PhuongThucThanhToan
CREATE TABLE "PhuongThucThanhToan" (
    "Id" SERIAL PRIMARY KEY,
    "TenPhuongThuc" VARCHAR(255) NOT NULL
);

-- 10. Bảng OrderStatus
CREATE TABLE "OrderStatus" (
    "StatusId" SERIAL PRIMARY KEY,
    "StatusName" VARCHAR(50) NOT NULL UNIQUE
);

-- 11. Bảng PaymentStatus
CREATE TABLE "PaymentStatus" (
    "PaymentStatusId" SERIAL PRIMARY KEY,
    "PaymentStatusName" VARCHAR(50) NOT NULL UNIQUE
);

-- 12. Bảng Vouchers
CREATE TABLE "Vouchers" (
    "VoucherId" SERIAL PRIMARY KEY,
    "Code" VARCHAR(50) UNIQUE NOT NULL,
    "DiscountAmount" DECIMAL(18,3),
    "DiscountPercentage" DECIMAL(5,2),
    "MinOrderAmount" DECIMAL(18,3),
    "ExpiryDate" TIMESTAMP NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "MaxUsage" INTEGER,
    "UsedCount" INTEGER DEFAULT 0,
    "Description" VARCHAR(255)
);

-- 13. Bảng CuaHang
CREATE TABLE "CuaHang" (
    "CuaHangId" SERIAL PRIMARY KEY,
    "CuaHangName" VARCHAR(255) NOT NULL,
    "Address" TEXT NOT NULL,
    "Province" VARCHAR(100) NOT NULL,
    "District" VARCHAR(100) NOT NULL,
    "Ward" VARCHAR(100) NOT NULL,
    "Phone" VARCHAR(20) NOT NULL,
    "ShopId" VARCHAR(50),
    "ProvinceId" INTEGER,
    "DistrictId" INTEGER,
    "WardCode" VARCHAR(20),
    "Latitude" DECIMAL(10,8),
    "Longitude" DECIMAL(11,8),
    "Opening_Hours" VARCHAR(50),
    "Image_URL" VARCHAR(255),
    "Created_At" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Bảng Food
CREATE TABLE "Food" (
    "FoodId" SERIAL PRIMARY KEY,
    "FoodName" VARCHAR(100) NOT NULL,
    "CategoryId" INTEGER,
    "IngredientId" INTEGER,
    "Price" DECIMAL(18, 3) NOT NULL DEFAULT 0,
    "Discount" DECIMAL(5, 2) DEFAULT 0,
    "DiscountPrice" DECIMAL(18, 3) GENERATED ALWAYS AS ("Price" - ("Price" * "Discount" / 100)) STORED,
    "Stock" INTEGER NOT NULL DEFAULT 0,
    "Description" TEXT,
    "ImageURL" VARCHAR(255),
    "CreatedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedDate" TIMESTAMP,
    "Status" BOOLEAN DEFAULT true,
    FOREIGN KEY ("CategoryId") REFERENCES "Category"("CategoryId"),
    FOREIGN KEY ("IngredientId") REFERENCES "Ingredient"("IngredientId")
);

-- 15. Bảng FoodIngredient
CREATE TABLE "FoodIngredient" (
    "FoodIngredientId" SERIAL PRIMARY KEY,
    "FoodId" INTEGER,
    "IngredientId" INTEGER,
    "Quantity" INTEGER NOT NULL,
    FOREIGN KEY ("FoodId") REFERENCES "Food"("FoodId"),
    FOREIGN KEY ("IngredientId") REFERENCES "Ingredient"("IngredientId")
);

-- 16. Bảng GioHang
CREATE TABLE "GioHang" (
    "GioHangID" SERIAL PRIMARY KEY,
    "Id" INTEGER NOT NULL,
    "FoodId" INTEGER NOT NULL,
    "SoLuong" INTEGER NOT NULL DEFAULT 1 CHECK ("SoLuong" > 0),
    "SizeID" INTEGER,
    "TotalPrice" DECIMAL(18,3) NOT NULL,
    FOREIGN KEY ("Id") REFERENCES "Users"("Id"),
    FOREIGN KEY ("FoodId") REFERENCES "Food"("FoodId"),
    FOREIGN KEY ("SizeID") REFERENCES "Size"("SizeID")
);

-- 17. Bảng Notifications
CREATE TABLE "Notifications" (
    "NotificationId" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "Title" VARCHAR(100),
    "Message" TEXT,
    "IsRead" BOOLEAN DEFAULT false,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("UserId") REFERENCES "Users"("Id")
);

-- 18. Bảng DeliveryAddresses
CREATE TABLE "DeliveryAddresses" (
    "DeliveryAddressId" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "Address" TEXT NOT NULL,
    "Province" VARCHAR(100) NOT NULL,
    "ProvinceId" INTEGER,
    "District" VARCHAR(100) NOT NULL,
    "DistrictId" INTEGER,
    "Ward" VARCHAR(100) NOT NULL,
    "WardCode" VARCHAR(20),
    "ReceiverName" VARCHAR(100),
    "Phone" VARCHAR(20),
    "IsDefault" BOOLEAN NOT NULL DEFAULT false,
    "CreatedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "Latitude" DECIMAL(10,8),
    "Longitude" DECIMAL(11,8),
    FOREIGN KEY ("UserId") REFERENCES "Users"("Id")
);

-- 19. Bảng Staff
CREATE TABLE "Staff" (
    "StaffId" SERIAL PRIMARY KEY,
    "FullName" VARCHAR(100) NOT NULL,
    "Phone" VARCHAR(15),
    "DateOfBirth" DATE,
    "Email" VARCHAR(50),
    "Gender" VARCHAR(50),
    "AccountId" INTEGER,
    "RoleId" INTEGER,
    FOREIGN KEY ("AccountId") REFERENCES "Account"("AccountId"),
    FOREIGN KEY ("RoleId") REFERENCES "AccRole"("RoleId")
);

-- 20. Bảng Warehouse
CREATE TABLE "Warehouse" (
    "WarehouseId" SERIAL PRIMARY KEY,
    "IngredientId" INTEGER,
    "SoLuong" INTEGER NOT NULL DEFAULT 0,
    "DateUpdate" DATE NOT NULL DEFAULT CURRENT_DATE,
    FOREIGN KEY ("IngredientId") REFERENCES "Ingredient"("IngredientId")
);

-- 21. Bảng UserVouchers
CREATE TABLE "UserVouchers" (
    "UserVoucherId" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "VoucherId" INTEGER NOT NULL,
    "IsUsed" BOOLEAN DEFAULT false,
    "ReceivedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("UserId") REFERENCES "Users"("Id"),
    FOREIGN KEY ("VoucherId") REFERENCES "Vouchers"("VoucherId"),
    UNIQUE ("UserId", "VoucherId")
);

-- 22. Bảng Orders
CREATE TABLE "Orders" (
    "OrderId" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "CuaHangId" INTEGER,
    "OrderDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "TotalAmount" DECIMAL(18, 3) NOT NULL,
    "PaymentMethodId" INTEGER NOT NULL,
    "StatusId" INTEGER NOT NULL,
    "PaymentStatusId" INTEGER,
    "DeliveryAddress" TEXT,
    "Province" VARCHAR(100),
    "District" VARCHAR(100),
    "Ward" VARCHAR(100),
    "Phone" VARCHAR(20),
    "Note" TEXT,
    "VoucherId" INTEGER,
    "ClientOrderCode" VARCHAR(50),
    FOREIGN KEY ("UserId") REFERENCES "Users"("Id"),
    FOREIGN KEY ("CuaHangId") REFERENCES "CuaHang"("CuaHangId"),
    FOREIGN KEY ("PaymentMethodId") REFERENCES "PhuongThucThanhToan"("Id"),
    FOREIGN KEY ("StatusId") REFERENCES "OrderStatus"("StatusId"),
    FOREIGN KEY ("PaymentStatusId") REFERENCES "PaymentStatus"("PaymentStatusId"),
    FOREIGN KEY ("VoucherId") REFERENCES "Vouchers"("VoucherId")
);

-- 23. Bảng OrderDetails
CREATE TABLE "OrderDetails" (
    "OrderDetailId" SERIAL PRIMARY KEY,
    "OrderId" INTEGER NOT NULL,
    "FoodId" INTEGER NOT NULL,
    "SizeId" INTEGER,
    "ToppingId" INTEGER,
    "Quantity" INTEGER NOT NULL DEFAULT 1 CHECK ("Quantity" > 0),
    "Price" DECIMAL(18, 3) NOT NULL,
    FOREIGN KEY ("OrderId") REFERENCES "Orders"("OrderId") ON DELETE CASCADE,
    FOREIGN KEY ("FoodId") REFERENCES "Food"("FoodId"),
    FOREIGN KEY ("SizeId") REFERENCES "Size"("SizeID"),
    FOREIGN KEY ("ToppingId") REFERENCES "Topping"("ToppingID")
);

-- 24. Bảng OrderDetails_Topping
CREATE TABLE "OrderDetails_Topping" (
    "OrderDetailsToppingID" SERIAL PRIMARY KEY,
    "OrderDetailId" INTEGER NOT NULL,
    "ToppingId" INTEGER NOT NULL,
    FOREIGN KEY ("OrderDetailId") REFERENCES "OrderDetails"("OrderDetailId") ON DELETE CASCADE,
    FOREIGN KEY ("ToppingId") REFERENCES "Topping"("ToppingID") ON DELETE CASCADE
);

-- 25. Bảng ShippingOrders
CREATE TABLE "ShippingOrders" (
    "ShippingOrderId" SERIAL PRIMARY KEY,
    "OrderId" INTEGER NOT NULL,
    "ShopId" VARCHAR(50) NOT NULL,
    "GHNOrderCode" VARCHAR(50),
    "Status" VARCHAR(50),
    "Fee" DECIMAL(18,3),
    "COD" DECIMAL(18,3),
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("OrderId") REFERENCES "Orders"("OrderId")
);

-- 26. Bảng FoodDimensions
CREATE TABLE "FoodDimensions" (
    "DimensionId" SERIAL PRIMARY KEY,
    "FoodId" INTEGER NOT NULL,
    "Length" INTEGER NOT NULL DEFAULT 10,
    "Width" INTEGER NOT NULL DEFAULT 10,
    "Height" INTEGER NOT NULL DEFAULT 15,
    "Weight" INTEGER NOT NULL DEFAULT 300,
    "CreatedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("FoodId") REFERENCES "Food"("FoodId")
);

-- 27. Bảng Invoice
CREATE TABLE "Invoice" (
    "InvoiceId" SERIAL PRIMARY KEY,
    "TableId" INTEGER,
    "DateCheckIn" DATE NOT NULL DEFAULT CURRENT_DATE,
    "DateCheckOut" DATE,
    "TrangThai" INTEGER,
    FOREIGN KEY ("TableId") REFERENCES "TableFood"("TableId")
);

-- 28. Bảng InvoiceDetail
CREATE TABLE "InvoiceDetail" (
    "InvoiceDetailId" SERIAL PRIMARY KEY,
    "InvoiceId" INTEGER,
    "FoodId" INTEGER,
    "SoLuong" INTEGER NOT NULL DEFAULT 0,
    "Price" DECIMAL(18, 3) NOT NULL,
    FOREIGN KEY ("InvoiceId") REFERENCES "Invoice"("InvoiceId"),
    FOREIGN KEY ("FoodId") REFERENCES "Food"("FoodId")
);

-- 29. Bảng GioHang_Topping
CREATE TABLE "GioHang_Topping" (
    "GioHangToppingID" SERIAL PRIMARY KEY,
    "GioHangID" INTEGER NOT NULL,
    "ToppingID" INTEGER NOT NULL,
    FOREIGN KEY ("GioHangID") REFERENCES "GioHang"("GioHangID") ON DELETE CASCADE,
    FOREIGN KEY ("ToppingID") REFERENCES "Topping"("ToppingID") ON DELETE CASCADE
);

-- Chèn dữ liệu mẫu cho PostgreSQL
-- Lưu ý: Đảm bảo chạy theo thứ tự để tránh vi phạm foreign key

-- 1. Bảng Users (cập nhật AvatarUrl với URL Supabase)
INSERT INTO "Users" ("Username", "Email", "PasswordHash", "FullName", "Phone", "Address", "Province", "District", "Ward", "Role", "AvatarUrl")
VALUES
    ('admin', 'thuylien2k4@gmail.com', '1', 'Thùy Liên', '0366413924', '72 Thành Thái', 'TP Hồ Chí Minh', 'Quận 10', 'Phường 14', 'admin', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/Avatar/a.png'),
    ('user1', 'lien@gmail.com', '1', 'Liên Nguyễn', '0987654321', '39 Nguyễn Thị Minh Khai', 'TP Hồ Chí Minh', 'Quận 1', 'Phường Bến Nghé', 'User', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/Avatar/a.png'),
    ('tlienn', 'example2@gmail.com', 'Tlien2004@', 'Nguyễn Văn A', '0901122334', '101 Nguyễn Văn Linh', 'Đà Nẵng', 'Thanh Khê', 'Phường Nam Dương', 'User', NULL),
    ('user3', 'example3@gmail.com', '1', 'Lê Thị B', '0905678999', '54 Trần Hưng Đạo', 'Cần Thơ', 'Ninh Kiều', 'Phường An Cư', 'User', NULL);


-- 2. Bảng AccRole
INSERT INTO "AccRole" ("RoleName")
VALUES
    ('Quản lý'),
    ('Pha chế'),
    ('Phục vụ');

-- 3. Bảng Account
INSERT INTO "Account" ("DisplayName", "UserName", "PassWord", "RoleName")
VALUES
    ('Admin', 'admin', '1', 'Admin'),
    ('Nguyễn Văn Quản', 'manager1', '123456', 'Quản lý'),
    ('Trần Thị Pha', 'phache1', '123456', 'Pha chế'),
    ('Lê Văn Chế', 'phache2', '123456', 'Pha chế'),
    ('Phạm Thị Phục', 'phucvu1', '123456', 'Phục vụ'),
    ('Hoàng Văn Vụ', 'phucvu2', '123456', 'Phục vụ');

-- 4. Bảng TableFood
INSERT INTO "TableFood" ("TableName", "TrangThai")
VALUES
    ('Table 1', 'Đã có khách'),
    ('Table 2', 'Đã có khách'),
    ('Table 3', 'Bàn Trống'),
    ('Table 4', 'Bàn Trống'),
    ('Table 5', 'Đã có khách'),
    ('Table 6', 'Bàn Trống'),
    ('Table 7', 'Bàn Trống'),
    ('Table 8', 'Đã có khách'),
    ('Table 9', 'Bàn Trống'),
    ('Table 10', 'Bàn Trống'),
    ('Table 11', 'Bàn Trống'),
    ('Table 12', 'Bàn Trống');

-- 5. Bảng Category
INSERT INTO "Category" ("CategoryName")
VALUES
    ('Cà phê'),
    ('Trà sữa'),
    ('Thức uống đá xay'),
    ('Bánh & Snack'),
    ('Trà trái cây');

-- 6. Bảng Ingredient (cập nhật ImageURL với URL Supabase)
INSERT INTO "Ingredient" ("IngredientName", "SoLuong", "PhanLoai", "ImageURL", "LastUpdated")
VALUES
    ('Coffee', 100, 'gói', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/coffee.png', '2024-08-05'),
    ('Sữa', 500, 'chai', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/sua.png', '2024-08-05'),
    ('Đường', 200, 'gói', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/duong.png', '2024-08-05'),
    ('Trà', 75, 'gói', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/tra.png', '2024-08-05'),
    ('Táo', 50, 'quả', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/tao.png', '2024-08-05'),
    ('Trân châu', 100, 'túi', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/tranchau.png', '2024-08-05'),
    ('Matcha', 120, 'gói', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/matcha.png', '2024-08-05'),
    ('Yến mạch', 130, 'gói', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/yenmach.png', '2024-08-05'),
    ('Caramel', 140, 'lọ', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/caramel.png', '2024-08-05'),
    ('Muối', 125, 'gói', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/muoi.png', '2024-08-05'),
    ('Hạnh nhân', 115, 'lọ', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/hanhnhan.png', '2024-08-05'),
    ('Bơ', 120, 'quả', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/bo.png', '2024-08-05'),
    ('Kem', 150, 'hộp', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/kem.png', '2024-08-05'),
    ('Choco Chip', 130, 'gói', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/choco_chip.png', '2024-08-05'),
    ('Mochi kem phúc bồn tử', 120, 'cái', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/mochi_kpbt.png', '2024-08-05'),
    ('Mochi kem việt quất', 120, 'cái', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/mochi_kvq.png', '2024-08-05'),
    ('Mochi kem chocolate', 120, 'cái', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/mochi_kemchoco.png', '2024-08-05'),
    ('Mousse gấu chocolate', 110, 'cái', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/mousse_gau.png', '2024-08-05'),
    ('Bánh mỳ', 150, 'ổ', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/banhmy.png', '2024-08-05'),
    ('Sữa đặc', 160, 'hộp', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/suadac.png', '2024-08-05'),
    ('Cam', 135, 'quả', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/cam.png', '2024-08-05'),
    ('Sả', 125, 'cây', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/sa.png', '2024-08-05'),
    ('Hạt sen', 115, 'túi', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/hatsen.png', '2024-08-05'),
    ('Vải', 140, 'quả', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/vai.png', '2024-08-05'),
    ('Mứt Yuzu', 120, 'lọ', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/yuzu.png', '2024-08-05'),
    ('Đào', 120, 'hộp', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/dao.png', '2024-08-05'),
    ('Bánh Gấu', 120, 'gói', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/banhgau.png', '2024-08-05'),
    ('Sương Sáo', 120, 'cốc', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/suongsao.png', '2024-08-05'),
    ('Dâu', 120, 'quả', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/dau.png', '2024-08-05'),
    ('Bim Bim Ngô', 120, 'gói', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/bimbimngo.png', '2024-08-05'),
    ('Bim Bim Sữa Dừa', 120, 'gói', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/nguyenlieu/bimbimsuadua.png', '2024-08-05');

-- 7. Bảng Food (cập nhật ImageURL với URL Supabase)
INSERT INTO "Food" ("FoodName", "CategoryId", "IngredientId", "Price", "Discount", "Stock", "Description", "ImageURL", "CreatedDate", "UpdatedDate", "Status")
VALUES
    ('Trà xanh espresso marble', 1, 1, 45000, 10, 50, 'Trà xanh kết hợp espresso thơm ngon', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/Cafe/traxanhespresso.png', CURRENT_TIMESTAMP, NULL, true),
    ('Bạc xỉu lắc sữa yến mạch', 1, 1, 50000, 5, 40, 'Cà phê sữa pha cùng sữa yến mạch', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/Cafe/bacxiulsyenmach.png', CURRENT_TIMESTAMP, NULL, true),
    ('Bạc xỉu lắc caramel muối', 1, 1, 55000, 7, 45, 'Cà phê sữa lắc cùng caramel muối', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/Cafe/bacxiulacmuoi.png', CURRENT_TIMESTAMP, NULL, true),
    ('Bạc xỉu lắc hạnh nhân nướng', 1, 1, 55000, 8, 35, 'Cà phê sữa kết hợp hạnh nhân nướng', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/Cafe/bacxiulachanhnhan.png', CURRENT_TIMESTAMP, NULL, true),
    ('Bơ arabica', 1, 1, 60000, 12, 25, 'Cà phê Arabica với vị béo của bơ', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/Cafe/bo_arabica.png', CURRENT_TIMESTAMP, NULL, true),
    ('Đường đen sữa đá', 1, 1, 30000, 0, 60, 'Cà phê sữa đá với đường đen', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/Cafe/duongdensuada.png', CURRENT_TIMESTAMP, NULL, true),
    ('Cà phê sữa đá', 1, 1, 25000, 0, 70, 'Cà phê pha sữa đặc', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/Cafe/cafesuada.png', CURRENT_TIMESTAMP, NULL, true),
    ('Cà phê sữa nóng', 1, 1, 25000, 0, 30, 'Cà phê sữa nóng thơm ngon', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/Cafe/cafesuanong.png', CURRENT_TIMESTAMP, NULL, true),
    ('Bạc xỉu', 1, 1, 30000, 5, 50, 'Bạc xỉu nguyên bản với nhiều sữa', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/Cafe/bac_xiu.png', CURRENT_TIMESTAMP, NULL, true),
    ('Cà phê đen', 1, 1, 20000, 0, 80, 'Cà phê đen truyền thống', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/Cafe/cafeden.png', CURRENT_TIMESTAMP, NULL, true),
    ('Trà sữa trân châu đường đen', 2, 2, 35000, 10, 40, 'Trà sữa kết hợp trân châu đường đen', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/trasua/tstcduongden.png', CURRENT_TIMESTAMP, NULL, true),
    ('Trà sữa olong', 2, 2, 30000, 5, 50, 'Trà sữa vị Olong đặc biệt', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/trasua/ts_olong.png', CURRENT_TIMESTAMP, NULL, true),
    ('Trà sữa olong tứ quý bơ', 2, 2, 35000, 7, 30, 'Trà sữa Olong với bơ thơm béo', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/trasua/ts_olongtqbo.png', CURRENT_TIMESTAMP, NULL, true),
    ('Trà sữa olong nướng sương sáo', 2, 2, 35000, 5, 35, 'Trà sữa Olong kết hợp sương sáo', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/trasua/ts_olongss.png', CURRENT_TIMESTAMP, NULL, true),
    ('Trà đen macchiato', 2, 2, 30000, 5, 45, 'Trà đen phủ lớp macchiato béo mịn', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/trasua/tradenmacchiato.png', CURRENT_TIMESTAMP, NULL, true),
    ('Hồng trà sữa trân châu', 2, 2, 30000, 5, 50, 'Hồng trà sữa truyền thống với trân châu', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/trasua/hongtrasua.png', CURRENT_TIMESTAMP, NULL, true),
    ('Frosty phin-gato', 3, 3, 40000, 10, 30, 'Phin cà phê kết hợp bánh gato', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/tudx/frosty_phin.png', CURRENT_TIMESTAMP, NULL, true),
    ('Frosty cà phê đường đen', 3, 3, 40000, 10, 30, 'Cà phê đá xay với đường đen', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/tudx/frosty_cfduongden.png', CURRENT_TIMESTAMP, NULL, true),
    ('Frosty bánh kem dâu', 3, 3, 45000, 8, 25, 'Bánh kem dâu đá xay mát lạnh', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/tudx/frosty_banhkemdau.png', CURRENT_TIMESTAMP, NULL, true),
    ('Frosty choco chip', 3, 3, 45000, 8, 25, 'Socola chip kết hợp đá xay', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/tudx/frosty_choco.png', CURRENT_TIMESTAMP, NULL, true),
    ('Frosty caramel', 3, 3, 45000, 8, 25, 'Caramel thơm béo cùng đá xay', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/tudx/frosty_caramel.png', CURRENT_TIMESTAMP, NULL, true),
    ('Butter croissant', 4, 4, 25000, 5, 20, 'Bánh sừng bò bơ thơm ngon', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/banh/Butter_croissant.png', CURRENT_TIMESTAMP, NULL, true),
    ('Mochi kem phúc bồn tử', 4, 4, 30000, 5, 15, 'Mochi nhân kem vị phúc bồn tử', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/banh/mochi_phucbt.png', CURRENT_TIMESTAMP, NULL, true),
    ('Mochi kem việt quất', 4, 4, 30000, 5, 15, 'Mochi nhân kem vị việt quất', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/banh/mochi_vietquat.png', CURRENT_TIMESTAMP, NULL, true),
    ('Mochi kem chocolate', 4, 4, 30000, 5, 15, 'Mochi nhân kem vị chocolate', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/banh/mochi_kemchocolate.png', CURRENT_TIMESTAMP, NULL, true),
    ('Mousse gấu chocolate', 4, 4, 35000, 5, 15, 'Mousse socola hình gấu dễ thương', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/banh/mousse_gauchoco.png', CURRENT_TIMESTAMP, NULL, true),
    ('Bánh mì Việt Nam', 4, 4, 15000, 0, 50, 'Bánh mì truyền thống Việt Nam', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/banh/banhmyvn.png', CURRENT_TIMESTAMP, NULL, true),
    ('Bim bim ngô', 4, 4, 10000, 0, 100, 'Snack vị ngô giòn tan', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/banh/bimbimngo.png', CURRENT_TIMESTAMP, NULL, true),
    ('Bim bim sữa dừa', 4, 4, 10000, 0, 100, 'Snack sữa dừa thơm ngon', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/banh/bimbimsuadua.png', CURRENT_TIMESTAMP, NULL, true),
    ('Bánh gấu', 4, 4, 15000, 0, 50, 'Bánh gấu nhân kem', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/banh/banhgau.png', CURRENT_TIMESTAMP, NULL, true),
    ('Trà đào cam xả', 5, 5, 40000, 5, 30, 'Trà đào tươi kết hợp cam và xả', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/ttc/tradaocamsa.png', CURRENT_TIMESTAMP, NULL, true),
    ('Olong tứ quý sen', 5, 5, 35000, 5, 30, 'Trà Olong kết hợp hương sen', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/ttc/olongtuquysen.png', CURRENT_TIMESTAMP, NULL, true),
    ('Đào kombucha', 5, 5, 45000, 5, 25, 'Trà đào lên men Kombucha tốt cho sức khỏe', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/ttc/dao_kombucha.png', CURRENT_TIMESTAMP, NULL, true),
    ('Trà vải', 5, 5, 35000, 5, 30, 'Trà vải tươi mát', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/ttc/travai.png', CURRENT_TIMESTAMP, NULL, true),
    ('Trà yuzu kombucha', 5, 5, 50000, 5, 20, 'Trà Yuzu Nhật Bản kết hợp Kombucha', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/ttc/yuzu_kombucha.png', CURRENT_TIMESTAMP, NULL, true);

-- 8. Bảng Size
INSERT INTO "Size" ("SizeName", "ExtraPrice")
VALUES
    ('Nhỏ', 0),
    ('Vừa', 6000),
    ('Lớn', 16000);

-- 9. Bảng Topping
INSERT INTO "Topping" ("ToppingName", "ToppingPrice")
VALUES
    ('Thạch Sương Sáo', 10000),
    ('Thạch Kim Quất', 10000),
    ('Thạch Cà Phê', 10000),
    ('Foam Phô Mai', 10000),
    ('Shot Espresso', 10000),
    ('Sốt Caramel', 10000),
    ('Trân châu trắng', 10000),
    ('Đá miếng', 5000),
    ('Hạt sen', 10000),
    ('Trái vải', 10000),
    ('Kem phô mai Macchiato', 10000);

-- 10. Bảng FoodIngredient (sau khi có Food và Ingredient)
INSERT INTO "FoodIngredient" ("FoodId", "IngredientId", "Quantity")
VALUES
    (1, 1, 1), (1, 2, 1), (1, 7, 1),
    (2, 1, 1), (2, 2, 1), (2, 8, 1),
    (3, 1, 1), (3, 2, 1), (3, 9, 1), (3, 10, 1),
    (4, 1, 1), (4, 2, 1), (4, 11, 1),
    (5, 1, 1), (5, 2, 1), (5, 12, 1),
    (6, 1, 1), (6, 3, 1), (6, 2, 1),
    (7, 1, 1), (7, 2, 1),
    (8, 1, 1), (8, 2, 1),
    (9, 1, 1), (9, 2, 1),
    (10, 1, 1), (10, 3, 1),
    (11, 4, 1), (11, 2, 1), (11, 6, 1), (11, 3, 1),
    (12, 4, 1), (12, 2, 1),
    (13, 4, 1), (13, 2, 1), (13, 12, 1),
    (14, 4, 1), (14, 2, 1), (14, 28, 1),
    (15, 4, 1), (15, 2, 1),
    (16, 4, 1), (16, 2, 1), (16, 6, 1),
    (17, 4, 1), (17, 2, 1), (17, 13, 1), (17, 6, 1),
    (18, 4, 1), (18, 2, 1), (18, 13, 1), (18, 3, 1),
    (19, 4, 1), (19, 2, 1), (19, 13, 1), (19, 29, 1),
    (20, 4, 1), (20, 2, 1), (20, 13, 1), (20, 14, 1),
    (21, 4, 1), (21, 2, 1), (21, 13, 1), (21, 9, 1),
    (22, 19, 1), (22, 20, 1),
    (23, 15, 1),
    (24, 16, 1),
    (25, 17, 1),
    (26, 18, 1),
    (27, 19, 1),
    (28, 30, 1),
    (29, 31, 1),
    (30, 27, 1),
    (31, 4, 1), (31, 26, 1), (31, 22, 1), (31, 21, 1),
    (32, 4, 1), (32, 23, 1),
    (33, 4, 1), (33, 26, 1),
    (34, 4, 1), (34, 24, 1),
    (35, 4, 1), (35, 25, 1);

-- 11. Bảng FoodDimensions (sau khi có Food)
INSERT INTO "FoodDimensions" ("FoodId", "Length", "Width", "Height", "Weight")
VALUES
    (1, 10, 10, 15, 250), (2, 10, 10, 15, 300), (3, 10, 10, 15, 350),
    (4, 10, 10, 15, 300), (5, 10, 10, 15, 400), (6, 8, 8, 12, 200),
    (7, 8, 8, 12, 200), (8, 8, 8, 10, 180), (9, 8, 8, 12, 250),
    (10, 8, 8, 10, 150), (11, 12, 12, 18, 400), (12, 12, 12, 18, 350),
    (13, 12, 12, 18, 400), (14, 12, 12, 18, 380), (15, 12, 12, 18, 350),
    (16, 12, 12, 18, 400), (17, 15, 15, 20, 500), (18, 15, 15, 20, 450),
    (19, 15, 15, 20, 500), (20, 15, 15, 20, 450), (21, 15, 15, 20, 450),
    (22, 15, 10, 5, 100), (23, 8, 8, 8, 80), (24, 8, 8, 8, 80),
    (25, 8, 8, 8, 80), (26, 10, 10, 6, 120), (27, 20, 10, 5, 200),
    (28, 15, 10, 3, 50), (29, 15, 10, 3, 50), (30, 12, 8, 4, 60),
    (31, 12, 12, 18, 350), (32, 12, 12, 18, 300), (33, 12, 12, 18, 400),
    (34, 12, 12, 18, 350), (35, 12, 12, 18, 400);

-- 12. Bảng Invoice (sau khi có TableFood)
INSERT INTO "Invoice" ("TableId", "DateCheckIn", "DateCheckOut", "TrangThai")
VALUES
    (1, '2024-08-06', '2024-08-06', 0),
    (2, '2024-08-06', '2024-08-06', 0),
    (5, '2024-08-06', '2024-08-06', 0),
    (8, '2024-08-06', '2024-08-06', 0);

-- 13. Bảng InvoiceDetail (sau khi có Invoice và Food)
INSERT INTO "InvoiceDetail" ("InvoiceId", "FoodId", "SoLuong", "Price")
VALUES
    (1, 1, 2, 45000), (1, 2, 1, 50000),
    (2, 3, 1, 55000), (2, 4, 2, 55000),
    (3, 29, 3, 10000), (3, 1, 2, 45000), (3, 19, 1, 45000),
    (4, 9, 2, 30000), (4, 12, 2, 30000);

-- 14. Bảng Staff (sau khi có AccRole và Account)
INSERT INTO "Staff" ("FullName", "Phone", "DateOfBirth", "Email", "Gender", "AccountId", "RoleId")
VALUES
    ('Nguyen Hai Duong', '0985082004', '2004-08-05', 'billduongg@gmail.com', 'Nam', 1, 1),
    ('Nguyen Minh Hoang', '0985082005', '2004-08-06', 'staff2@gmail.com', 'Nam', NULL, 2),
    ('Nguyen Bao Han', '0985082029', '2004-08-16', 'staff1@gmail.com', 'Nam', NULL, 2),
    ('Nguyen Thi Hoai Suong', '0985082006', '2004-08-07', 'staff3@gmail.com', 'Nam', NULL, 3),
    ('Dieu Thuy Lien', '0985082007', '2004-08-08', 'staff4@gmail.com', 'Nam', NULL, 3),
    ('Vu Hoang Anh', '0985082008', '2004-08-09', 'staff5@gmail.com', 'Nam', NULL, 3),
    ('Vu Hoang Em', '0985082009', '2004-08-10', 'staff6@gmail.com', 'Nữ', NULL, 3);

-- Cập nhật Gender nếu cần (script gốc có UPDATE cho 'True'/'False', nhưng INSERT đã dùng 'Nam'/'Nữ')
-- Nếu dữ liệu có 'True'/'False', chạy:
-- UPDATE "Staff" SET "Gender" = CASE WHEN "Gender" = 'True' THEN 'Nam' WHEN "Gender" = 'False' THEN 'Nữ' END;

-- 15. Bảng Warehouse (sau khi có Ingredient)
INSERT INTO "Warehouse" ("IngredientId", "SoLuong", "DateUpdate")
VALUES
    (1, 100, CURRENT_DATE),
    (2, 50, CURRENT_DATE),
    (3, 200, CURRENT_DATE),
    (4, 75, CURRENT_DATE);

-- 16. Bảng PhuongThucThanhToan
INSERT INTO "PhuongThucThanhToan" ("TenPhuongThuc")
VALUES
    ('VN Pay'),
    ('COD'),
    ('QR CODE');

-- 17. Bảng OrderStatus
INSERT INTO "OrderStatus" ("StatusName")
VALUES
    ('Đặt hàng thành công'),
    ('Đang chuẩn bị đơn hàng'),
    ('Đang giao hàng'),
    ('Giao hàng thành công'),
    ('Đã hủy');

select *from "PaymentStatus";
-- 18. Bảng PaymentStatus
INSERT INTO "PaymentStatus" ("PaymentStatusName")
VALUES
    ('Chờ thanh toán'),
    ('Đã thanh toán'),
    ('Thanh toán thất bại'),
    ('Đã hoàn tiền');

-- 19. Bảng CuaHang (cập nhật Image_URL với URL Supabase)
INSERT INTO "CuaHang" (
    "CuaHangName",
    "Address",
    "Ward",
    "District",
    "Province",
    "Phone",
    "ShopId",
    "ProvinceId",
    "DistrictId",
    "WardCode",
    "Latitude",
    "Longitude",
    "Opening_Hours",
    "Image_URL"
)
VALUES
-- HCM
('SuLi Coffee HCM Nguyễn Trãi', '120 Nguyễn Trãi', 'Phường 5', 'Quận 5', 'TP Hồ Chí Minh', '0123456794', '2510549',
 202, 1445, '05008', 10.762622, 106.660172, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a1.png'),
('SuLi Coffee HCM Phan Xích Long', '34 Phan Xích Long', 'Phường 2', 'Quận Phú Nhuận', 'TP Hồ Chí Minh', '0123456795', '2510550',
 202, 1452, '02014', 10.799120, 106.677456, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a2.png'),
('SuLi Coffee HCM Tô Hiến Thành', '98 Tô Hiến Thành', 'Phường 15', 'Quận 10', 'TP Hồ Chí Minh', '0123456796', '2510551',
 202, 1449, '10153', 10.774000, 106.667000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a3.png'),
('SuLi Coffee HCM Nguyễn Đình Chiểu', '210 Nguyễn Đình Chiểu', 'Phường 6', 'Quận 3', 'TP Hồ Chí Minh', '0123456797', '2510552',
 202, 1442, '03006', 10.779000, 106.692000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a4.png'),
('SuLi Coffee HCM Điện Biên Phủ', '375 Điện Biên Phủ', 'Phường 15', 'Bình Thạnh', 'TP Hồ Chí Minh', '0123456798', '2510553',
 202, 1450, '15152', 10.800000, 106.700000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a5.png'),
('SuLi Coffee HCM Trường Sa', '245 Trường Sa', 'Phường 14', 'Phú Nhuận', 'TP Hồ Chí Minh', '0123456799', '2510554',
 202, 1452, '0214', 10.799000, 106.684000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a6.png'),
('SuLi Coffee HCM Đinh Tiên Hoàng', '142 Đinh Tiên Hoàng', 'Phường Đa Kao', 'Quận 1', 'TP Hồ Chí Minh', '0123456700', '2510555',
 202, 1441, '0103', 10.790000, 106.699000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a7.png'),
('SuLi Coffee HCM Lê Quang Định', '400 Lê Quang Định', 'Phường 11', 'Bình Thạnh', 'TP Hồ Chí Minh', '0123456701', '2510556',
 202, 1450, '1511', 10.812000, 106.700000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a8.png'),
('SuLi Coffee HCM Cộng Hòa', '198 Cộng Hòa', 'Phường 12', 'Tân Bình', 'TP Hồ Chí Minh', '0123456702', '2510557',
 202, 1454, '1212', 10.801941, 106.647484, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a9.png'),
('SuLi Coffee HCM Quang Trung', '99 Quang Trung', 'Phường 10', 'Gò Vấp', 'TP Hồ Chí Minh', '0123456703', '2510558',
 202, 1457, '1010', 10.823000, 106.687000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a10.png'),

-- HN (ShopId thống nhất 198043)
('SuLi Coffee HN Nguyễn Chí Thanh', '45 Nguyễn Chí Thanh', 'Phường Láng Hạ', 'Đống Đa', 'Hà Nội', '0123456704', '198043',
 201, 113, '1102', 21.028000, 105.800000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a1.png'),
('SuLi Coffee HN Kim Mã', '123 Kim Mã', 'Phường Giảng Võ', 'Ba Đình', 'Hà Nội', '0123456705', '198043',
 201, 111, '1002', 21.033000, 105.820000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a2.png'),
('SuLi Coffee HN Trần Duy Hưng', '321 Trần Duy Hưng', 'Phường Trung Hòa', 'Cầu Giấy', 'Hà Nội', '0123456706', '198043',
 201, 112, '1207', 21.015000, 105.800000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a3.png'),
('SuLi Coffee HN Bạch Mai', '75 Bạch Mai', 'Phường Thanh Nhàn', 'Hai Bà Trưng', 'Hà Nội', '0123456707', '198043',
 201, 114, '1403', 21.005000, 105.840000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a4.png'),
('SuLi Coffee HN Hồ Tùng Mậu', '65 Hồ Tùng Mậu', 'Phường Mai Dịch', 'Cầu Giấy', 'Hà Nội', '0123456708', '198043',
 201, 112, '1203', 21.040000, 105.770000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a5.png'),
('SuLi Coffee HN Lê Văn Lương', '120 Lê Văn Lương', 'Phường Nhân Chính', 'Thanh Xuân', 'Hà Nội', '0123456709', '198043',
 201, 116, '1604', 21.010000, 105.800000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a6.png'),
('SuLi Coffee HN Giải Phóng', '201 Giải Phóng', 'Phường Phương Liệt', 'Hoàng Mai', 'Hà Nội', '0123456710', '198043',
 201, 115, '1507', 20.990000, 105.850000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a7.png'),
('SuLi Coffee HN Nguyễn Trãi', '188 Nguyễn Trãi', 'Phường Thượng Đình', 'Thanh Xuân', 'Hà Nội', '0123456711', '198043',
 201, 116, '1607', 20.980000, 105.790000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a8.png'),
('SuLi Coffee HN Cầu Giấy', '55 Cầu Giấy', 'Phường Quan Hoa', 'Cầu Giấy', 'Hà Nội', '0123456712', '198043',
 201, 112, '1206', 21.030000, 105.800000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a9.png'),
('SuLi Coffee HN Xuân Thủy', '10 Xuân Thủy', 'Phường Dịch Vọng Hậu', 'Cầu Giấy', 'Hà Nội', '0123456713', '198043',
 201, 112, '1205', 21.040000, 105.780000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a10.png'),

-- Đà Nẵng
('SuLi Coffee Đà Nẵng Lê Duẩn', '88 Lê Duẩn', 'Phường Hải Châu 1', 'Hải Châu', 'Đà Nẵng', '0123456714', '2510569',
 203, 505, '0501', 16.075000, 108.220000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a1.png'),
('SuLi Coffee Đà Nẵng Nguyễn Văn Linh', '101 Nguyễn Văn Linh', 'Phường Nam Dương', 'Thanh Khê', 'Đà Nẵng', '0123456715', '2510570',
 203, 506, '0605', 16.060000, 108.210000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a2.png'),
('SuLi Coffee Đà Nẵng Trần Phú', '55 Trần Phú', 'Phường Thạch Thang', 'Hải Châu', 'Đà Nẵng', '0123456716', '2510571',
 203, 505, '0503', 16.068000, 108.220000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a3.png'),

-- Cần Thơ
('SuLi Coffee Cần Thơ Trần Hưng Đạo', '54 Trần Hưng Đạo', 'Phường An Cư', 'Ninh Kiều', 'Cần Thơ', '0123456720', '2510572',
 204, 609, '0901', 10.035000, 105.780000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a7.png'),
('SuLi Coffee Cần Thơ 30 Tháng 4', '80 30 Tháng 4', 'Phường Xuân Khánh', 'Ninh Kiều', 'Cần Thơ', '0123456721', '2510573',
 204, 609, '0903', 10.030000, 105.770000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a8.png'),
('SuLi Coffee Cần Thơ Mậu Thân', '15 Mậu Thân', 'Phường An Hòa', 'Ninh Kiều', 'Cần Thơ', '0123456722', '2510574',
 204, 609, '0902', 10.035000, 105.765000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a9.png'),
('SuLi Coffee Cần Thơ Nguyễn Văn Cừ', '99 Nguyễn Văn Cừ', 'Phường Xuân Khánh', 'Ninh Kiều', 'Cần Thơ', '0123456723', '2510575',
 204, 609, '0903', 10.040000, 105.770000, '7:00-21:30', 'https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/cuahang/a10.png');
-- 20. Bảng Vouchers
INSERT INTO "Vouchers" ("Code", "DiscountAmount", "DiscountPercentage", "MinOrderAmount", "ExpiryDate", "IsActive", "MaxUsage", "Description")
VALUES
    ('FREESHIP', 20000, NULL, 50000, '2025-04-30 23:59:59', true, 100, 'Miễn phí vận chuyển cho đơn từ 50.000đ'),
    ('GIAM30K', 30000, NULL, 99000, '2025-04-30 23:59:59', true, 100, 'Giảm ngay 30.000đ cho đơn từ 99.000đ'),
    ('GIAM20K', 20000, NULL, 60000, '2025-04-30 23:59:59', true, 50, 'Giảm ngay 20.000đ cho đơn từ 60.000đ'),
    ('GIAM10KM', NULL, 10.00, 500000, '2025-04-30 23:59:59', true, 200, 'Giảm 10% cho đơn từ 500.000đ'),
    ('GIAM30KM', NULL, 10.00, 250000, '2025-04-30 23:59:59', true, 200, 'Giảm 10% cho đơn từ 250.000đ');

-- 21. Bảng DeliveryAddresses (sau khi có Users)
INSERT INTO "DeliveryAddresses" (
    "UserId",
    "Address",
    "Province",
    "ProvinceId",
    "District",
    "DistrictId",
    "Ward",
    "WardCode",
    "ReceiverName",
    "Phone",
    "IsDefault"
)
VALUES
    (1, '123 Đường Láng', 'Hà Nội', 201, 'Đống Đa', 1482, 'Láng Hạ', '1A0706', 'Thùy Liên', '0366413924', true),
    (1, '456 Nguyễn Trãi', 'Hà Nội', 201, 'Thanh Xuân', 1454, 'Thượng Đình', '1A1007', 'Thùy Liên', '0366413924', false),
    (2, '789 Lê Lợi', 'TP Hồ Chí Minh', 202, 'Quận 1', 1442, 'Bến Nghé', '21211', 'Liên Nguyễn', '0987654321', true);

-- Các UPDATE chuẩn hóa (nếu cần, nhưng dữ liệu INSERT đã dùng 'TP Hồ Chí Minh')
-- UPDATE "Orders" SET "Province" = 'TP Hồ Chí Minh' WHERE "Province" = 'Hồ Chí Minh';
-- UPDATE "DeliveryAddresses" SET "Province" = 'TP Hồ Chí Minh' WHERE "Province" = 'Hồ Chí Minh';
-- UPDATE "Users" SET "Province" = 'TP Hồ Chí Minh' WHERE "Province" = 'Hồ Chí Minh';
-- ===============================
-- Bảng OrderReviews - đánh giá từng món hàng
-- ===============================
CREATE TABLE "OrderReviews" (
    "ReviewId" SERIAL PRIMARY KEY,
    "OrderId" INT NOT NULL,
    "OrderDetailId" INT NOT NULL,       -- đánh giá từng món
    "UserId" INT NOT NULL,
    "Rating" SMALLINT NOT NULL CHECK ("Rating" >= 1 AND "Rating" <= 5),
    "Comment" TEXT,
    "Images" JSONB,                     -- Mảng URL ảnh
    "Videos" JSONB,                     -- Mảng URL video
    "CreatedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Khóa ngoại
    CONSTRAINT "fk_order" FOREIGN KEY ("OrderId") REFERENCES "Orders"("OrderId") ON DELETE CASCADE,
    CONSTRAINT "fk_orderdetail" FOREIGN KEY ("OrderDetailId") REFERENCES "OrderDetails"("OrderDetailId") ON DELETE CASCADE,
    CONSTRAINT "fk_user" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE
);

-- Index để truy vấn nhanh theo OrderId và OrderDetailId
CREATE INDEX "idx_orderreviews_orderid" ON "OrderReviews"("OrderId");
CREATE INDEX "idx_orderreviews_orderdetailid" ON "OrderReviews"("OrderDetailId");



ALTER TABLE "Orders" 
ADD COLUMN "ShippingFee" DECIMAL(18, 3) DEFAULT 0 NOT NULL,
ADD COLUMN "DiscountAmount" DECIMAL(18, 3) DEFAULT 0 NOT NULL;

-- Kiểm tra Users có data không
select *from "CuaHang";

SELECT * FROM "OrderStatus" WHERE "StatusName" = 'Đã hủy';
SELECT * FROM "CuaHang" LIMIT 1;

select *from "Users" 
select *from "PaymentStatus";
select *from "PhuongThucThanhToan";
select *from "Orders";
select *from "OrderDetails";
select *from "Vouchers";
DELETE FROM "Users"
WHERE "Id" IN (15);