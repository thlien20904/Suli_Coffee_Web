USE master;
GO
ALTER DATABASE WebAppDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
GO
DROP DATABASE IF EXISTS WebAppDB;
GO
CREATE DATABASE WebAppDB;
GO
USE WebAppDB;
GO

-- 1. Bảng Users
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) UNIQUE NOT NULL,
    Email NVARCHAR(50) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NULL,
    Phone NVARCHAR(15) NULL,
    Address NVARCHAR(255) NULL,
    Province NVARCHAR(100) NULL,
    District NVARCHAR(100) NULL,
    Ward NVARCHAR(100) NULL,
    Role NVARCHAR(20) NOT NULL DEFAULT 'User',
    OTPCode NVARCHAR(10) NULL,
    OTPExpiry DATETIME NULL,
    ResetToken NVARCHAR(100) NULL,
    ResetTokenExpiry DATETIME NULL,
    AvatarUrl NVARCHAR(255) NULL,
    CreatedDate DATETIME DEFAULT GETDATE()
);
GO

-- 2. Bảng AccRole
CREATE TABLE AccRole (
    RoleId INT IDENTITY PRIMARY KEY,
    RoleName NVARCHAR(100) NOT NULL
);
GO

-- 3. Bảng Account
CREATE TABLE Account (
    AccountId INT IDENTITY PRIMARY KEY,
    DisplayName NVARCHAR(100) NOT NULL,
    UserName NVARCHAR(50) NOT NULL,
    PassWord NVARCHAR(50) NOT NULL,
    RoleName NVARCHAR(50) NOT NULL
);
GO

-- 4. Bảng TableFood
CREATE TABLE TableFood (
    TableId INT IDENTITY PRIMARY KEY,
    TableName NVARCHAR(100),
    TrangThai NVARCHAR(100)
);
GO

-- 5. Bảng Category
CREATE TABLE Category (
    CategoryId INT PRIMARY KEY IDENTITY,
    CategoryName NVARCHAR(100) NOT NULL
);
GO

-- 6. Bảng Ingredient
CREATE TABLE Ingredient (
    IngredientId INT PRIMARY KEY IDENTITY,
    IngredientName NVARCHAR(100) NOT NULL,
    SoLuong INT NOT NULL DEFAULT 0,
    PhanLoai NVARCHAR(50) NOT NULL,
    ImageURL NVARCHAR(255) NOT NULL,
    LastUpdated DATE NOT NULL DEFAULT GETDATE()
);
GO

-- 7. Bảng Size
CREATE TABLE Size (
    SizeID INT IDENTITY(1,1) PRIMARY KEY,
    SizeName NVARCHAR(50) NOT NULL,
    ExtraPrice INT NOT NULL
);
GO

-- 8. Bảng Topping
CREATE TABLE Topping (
    ToppingID INT IDENTITY(1,1) PRIMARY KEY,
    ToppingName NVARCHAR(100) NOT NULL,
    ToppingPrice INT NOT NULL
);
GO

-- 9. Bảng PhuongThucThanhToan
CREATE TABLE PhuongThucThanhToan (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TenPhuongThuc NVARCHAR(255) NOT NULL
);
GO

-- 10. Bảng OrderStatus
CREATE TABLE OrderStatus (
    StatusId INT PRIMARY KEY IDENTITY(1,1),
    StatusName NVARCHAR(50) NOT NULL UNIQUE
);
GO

-- 11. Bảng PaymentStatus
CREATE TABLE PaymentStatus (
    PaymentStatusId INT PRIMARY KEY IDENTITY(1,1),
    PaymentStatusName NVARCHAR(50) NOT NULL UNIQUE
);
GO

-- 12. Bảng Vouchers
CREATE TABLE Vouchers (
    VoucherId INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(50) UNIQUE NOT NULL,
    DiscountAmount DECIMAL(18,3) NULL,
    DiscountPercentage DECIMAL(5,2) NULL,
    MinOrderAmount DECIMAL(18,3) NULL,
    ExpiryDate VARCHAR(20) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    MaxUsage INT NULL,
    UsedCount INT DEFAULT 0,
    Description NVARCHAR(255) NULL
);
GO

-- 13. Bảng CuaHang
CREATE TABLE CuaHang (
    CuaHangId INT IDENTITY(1,1) PRIMARY KEY,
    CuaHangName NVARCHAR(255) NOT NULL,
    Address NVARCHAR(500) NOT NULL,
    Province NVARCHAR(100) NOT NULL,
    District NVARCHAR(100) NOT NULL,
    Ward NVARCHAR(100) NOT NULL,
    Phone NVARCHAR(20) NOT NULL,
    ShopId NVARCHAR(50),
    ProvinceId INT,
    DistrictId INT,
    WardCode NVARCHAR(20),
    Latitude DECIMAL(10,8),
    Longitude DECIMAL(11,8),
    Opening_Hours NVARCHAR(50),
    Image_URL NVARCHAR(255),
    Created_At DATETIME2 DEFAULT GETDATE(),
    Updated_At DATETIME2 DEFAULT GETDATE()
);
GO

-- 14. Bảng Food
CREATE TABLE Food (
    FoodId INT PRIMARY KEY IDENTITY,
    FoodName NVARCHAR(100) NOT NULL,
    CategoryId INT,
    IngredientId INT,
    Price DECIMAL(18, 3) NOT NULL DEFAULT 0,
    Discount DECIMAL(5, 2) DEFAULT 0,
    DiscountPrice AS (Price - (Price * Discount / 100)),
    Stock INT NOT NULL DEFAULT 0,
    Description NVARCHAR(500) NULL,
    ImageURL NVARCHAR(255) NULL,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL,
    Status BIT DEFAULT 1,
    FOREIGN KEY (CategoryId) REFERENCES Category(CategoryId),
    FOREIGN KEY (IngredientId) REFERENCES Ingredient(IngredientId)
);
GO

-- 15. Bảng FoodIngredient
CREATE TABLE FoodIngredient (
    FoodIngredientId INT PRIMARY KEY IDENTITY,
    FoodId INT,
    IngredientId INT,
    Quantity INT NOT NULL,
    FOREIGN KEY (FoodId) REFERENCES Food(FoodId),
    FOREIGN KEY (IngredientId) REFERENCES Ingredient(IngredientId)
);
GO

-- 16. Bảng GioHang
CREATE TABLE GioHang (
    GioHangID INT PRIMARY KEY IDENTITY,
    Id INT NOT NULL,
    FoodId INT NOT NULL,
    SoLuong INT NOT NULL DEFAULT 1 CHECK (SoLuong > 0),
    SizeID INT NULL,
    TotalPrice DECIMAL(18,3) NOT NULL,
    FOREIGN KEY (Id) REFERENCES Users(Id),
    FOREIGN KEY (FoodId) REFERENCES Food(FoodId),
    FOREIGN KEY (SizeID) REFERENCES Size(SizeID)
);
GO

-- 17. Bảng Notifications
CREATE TABLE Notifications (
    NotificationId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Title NVARCHAR(100),
    Message NVARCHAR(255),
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

CREATE TABLE DeliveryAddresses (
    DeliveryAddressId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Address NVARCHAR(255) NOT NULL,
    Province NVARCHAR(100) NOT NULL,
    ProvinceId INT NULL,
    District NVARCHAR(100) NOT NULL,
    DistrictId INT NULL,
    Ward NVARCHAR(100) NOT NULL,
    WardCode NVARCHAR(20) NULL,
    ReceiverName NVARCHAR(100) NULL,
    Phone NVARCHAR(20) NULL,
    IsDefault BIT NOT NULL DEFAULT 0,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO



-- 19. Bảng Staff
CREATE TABLE Staff (
    StaffId INT PRIMARY KEY IDENTITY,
    FullName NVARCHAR(100) NOT NULL,
    Phone NVARCHAR(15),
    DateOfBirth DATE NULL,
    Email NVARCHAR(50) NULL,
    Gender NVARCHAR(50) NULL,
    AccountId INT,
    RoleId INT,
    FOREIGN KEY (AccountId) REFERENCES Account(AccountId),
    FOREIGN KEY (RoleId) REFERENCES AccRole(RoleId)
);
GO

-- 20. Bảng Warehouse
CREATE TABLE Warehouse (
    WarehouseId INT PRIMARY KEY IDENTITY,
    IngredientId INT,
    SoLuong INT NOT NULL DEFAULT 0,
    DateUpdate DATE NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (IngredientId) REFERENCES Ingredient(IngredientId)
);
GO

-- 21. Bảng UserVouchers
CREATE TABLE UserVouchers (
    UserVoucherId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    VoucherId INT NOT NULL,
    IsUsed BIT DEFAULT 0,
    ReceivedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (VoucherId) REFERENCES Vouchers(VoucherId),
    UNIQUE(UserId, VoucherId)
);
GO

-- 22. Bảng Orders
CREATE TABLE Orders (
    OrderId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    CuaHangId INT NULL,
    OrderDate DATETIME NOT NULL DEFAULT GETDATE(),
    TotalAmount DECIMAL(18, 3) NOT NULL,
    PaymentMethodId INT NOT NULL,
    StatusId INT NOT NULL,
    PaymentStatusId INT NULL,
    DeliveryAddress NVARCHAR(255) NULL,
    Province NVARCHAR(100) NULL,
    District NVARCHAR(100) NULL,
    Ward NVARCHAR(100) NULL,
    Phone NVARCHAR(20) NULL,
    Note NVARCHAR(255) NULL,
    VoucherId INT NULL,
    ClientOrderCode NVARCHAR(50) NULL,
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (CuaHangId) REFERENCES CuaHang(CuaHangId),
    FOREIGN KEY (PaymentMethodId) REFERENCES PhuongThucThanhToan(Id),
    FOREIGN KEY (StatusId) REFERENCES OrderStatus(StatusId),
    FOREIGN KEY (PaymentStatusId) REFERENCES PaymentStatus(PaymentStatusId),
    FOREIGN KEY (VoucherId) REFERENCES Vouchers(VoucherId)
);
GO

-- 23. Bảng OrderDetails
CREATE TABLE OrderDetails (
    OrderDetailId INT PRIMARY KEY IDENTITY(1,1),
    OrderId INT NOT NULL,
    FoodId INT NOT NULL,
    SizeId INT NULL,
    ToppingId INT NULL,
    Quantity INT NOT NULL DEFAULT 1 CHECK (Quantity > 0),
    Price DECIMAL(18, 3) NOT NULL,
    FOREIGN KEY (OrderId) REFERENCES Orders(OrderId) ON DELETE CASCADE,
    FOREIGN KEY (FoodId) REFERENCES Food(FoodId),
    FOREIGN KEY (SizeId) REFERENCES Size(SizeID),
    FOREIGN KEY (ToppingId) REFERENCES Topping(ToppingID)
);
GO

-- 24. Bảng OrderDetails_Topping
CREATE TABLE OrderDetails_Topping (
    OrderDetailsToppingID INT IDENTITY(1,1) PRIMARY KEY,
    OrderDetailId INT NOT NULL,
    ToppingId INT NOT NULL,
    FOREIGN KEY (OrderDetailId) REFERENCES OrderDetails(OrderDetailId) ON DELETE CASCADE,
    FOREIGN KEY (ToppingId) REFERENCES Topping(ToppingID) ON DELETE CASCADE
);
GO

-- 25. Bảng ShippingOrders
CREATE TABLE ShippingOrders (
    ShippingOrderId INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL,
    ShopId NVARCHAR(50) NOT NULL,
    GHNOrderCode NVARCHAR(50) NULL,
    Status NVARCHAR(50) NULL,
    Fee DECIMAL(18,3) NULL,
    COD DECIMAL(18,3) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (OrderId) REFERENCES Orders(OrderId)
);
GO

-- 26. Bảng FoodDimensions
CREATE TABLE FoodDimensions (
    DimensionId INT IDENTITY(1,1) PRIMARY KEY,
    FoodId INT NOT NULL,
    Length INT NOT NULL DEFAULT 10,
    Width INT NOT NULL DEFAULT 10,
    Height INT NOT NULL DEFAULT 15,
    Weight INT NOT NULL DEFAULT 300,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (FoodId) REFERENCES Food(FoodId)
);
GO

-- 27. Bảng Invoice
CREATE TABLE Invoice (
    InvoiceId INT PRIMARY KEY IDENTITY,
    TableId INT,
    DateCheckIn DATE NOT NULL DEFAULT GETDATE(),
    DateCheckOut DATE,
    TrangThai INT,
    FOREIGN KEY (TableId) REFERENCES TableFood(TableId)
);
GO

-- 28. Bảng InvoiceDetail
CREATE TABLE InvoiceDetail (
    InvoiceDetailId INT PRIMARY KEY IDENTITY,
    InvoiceId INT,
    FoodId INT,
    SoLuong INT NOT NULL DEFAULT 0,
    Price DECIMAL(18, 3) NOT NULL,
    FOREIGN KEY (InvoiceId) REFERENCES Invoice(InvoiceId),
    FOREIGN KEY (FoodId) REFERENCES Food(FoodId)
);
GO

-- 29. Bảng GioHang_Topping
CREATE TABLE GioHang_Topping (
    GioHangToppingID INT PRIMARY KEY IDENTITY,
    GioHangID INT NOT NULL,
    ToppingID INT NOT NULL,
    FOREIGN KEY (GioHangID) REFERENCES GioHang(GioHangID) ON DELETE CASCADE,
    FOREIGN KEY (ToppingID) REFERENCES Topping(ToppingID) ON DELETE CASCADE
);
GO

-- Chèn dữ liệu mẫu
INSERT INTO Users (Username, Email, PasswordHash, FullName, Phone, Address, Province, District, Ward, Role, AvatarUrl)
VALUES
    ('admin', 'thuylien2k4@gmail.com', '1', N'Thùy Liên', '0366413924', N'72 Thành Thái', N'TP Hồ Chí Minh', N'Quận 10', N'Phường 14', 'admin', '/images/Avatar/a.png'),
    ('user1', 'lien@gmail.com', '1', N'Liên Nguyễn', '0987654321', N'39 Nguyễn Thị Minh Khai', N'TP Hồ Chí Minh', N'Quận 1', N'Phường Bến Nghé', 'User', '/images/Avatar/a.png'),
    ('tlienn', 'example2@gmail.com', 'Tlien2004@', N'Nguyễn Văn A', '0901122334', N'101 Nguyễn Văn Linh', N'Đà Nẵng', N'Thanh Khê', N'Phường Nam Dương', 'User', NULL),
    ('user3', 'example3@gmail.com', '1', N'Lê Thị B', '0905678999', N'54 Trần Hưng Đạo', N'Cần Thơ', N'Ninh Kiều', N'Phường An Cư', 'User', NULL);
GO

INSERT INTO AccRole (RoleName)
VALUES
    (N'Quản lý'),
    (N'Pha chế'),
    (N'Phục vụ');
GO

INSERT INTO Account (DisplayName, UserName, PassWord, RoleName)
VALUES
    ('Admin', 'admin', '1', 'Admin'),
    ('Nguyễn Văn Quản', 'manager1', '123456', N'Quản lý'),
    ('Trần Thị Pha', 'phache1', '123456', N'Pha chế'),
    ('Lê Văn Chế', 'phache2', '123456', N'Pha chế'),
    ('Phạm Thị Phục', 'phucvu1', '123456', N'Phục vụ'),
    ('Hoàng Văn Vụ', 'phucvu2', '123456', N'Phục vụ');
GO

INSERT INTO TableFood (TableName, TrangThai)
VALUES
    ('Table 1', N'Đã có khách'),
    ('Table 2', N'Đã có khách'),
    ('Table 3', N'Bàn Trống'),
    ('Table 4', N'Bàn Trống'),
    ('Table 5', N'Đã có khách'),
    ('Table 6', N'Bàn Trống'),
    ('Table 7', N'Bàn Trống'),
    ('Table 8', N'Đã có khách'),
    ('Table 9', N'Bàn Trống'),
    ('Table 10', N'Bàn Trống'),
    ('Table 11', N'Bàn Trống'),
    ('Table 12', N'Bàn Trống');
GO

INSERT INTO Category (CategoryName)
VALUES
    (N'Cà phê'),
    (N'Trà sữa'),
    (N'Thức uống đá xay'),
    (N'Bánh & Snack'),
    (N'Trà trái cây');
GO

INSERT INTO Ingredient (IngredientName, SoLuong, PhanLoai, ImageURL, LastUpdated)
VALUES
    (N'Coffee', 100, N'gói', '/images/nguyenlieu/coffee.png', '2024-08-05'),
    (N'Sữa', 500, N'chai', '/images/nguyenlieu/sua.png', '2024-08-05'),
    (N'Đường', 200, N'gói', '/images/nguyenlieu/duong.png', '2024-08-05'),
    (N'Trà', 75, N'gói', '/images/nguyenlieu/tra.png', '2024-08-05'),
    (N'Táo', 50, N'quả', '/images/nguyenlieu/tao.png', '2024-08-05'),
    (N'Trân châu', 100, N'túi', '/images/nguyenlieu/tranchau.png', '2024-08-05'),
    (N'Matcha', 120, N'gói', '/images/nguyenlieu/matcha.png', '2024-08-05'),
    (N'Yến mạch', 130, N'gói', '/images/nguyenlieu/yenmach.png', '2024-08-05'),
    (N'Caramel', 140, N'lọ', '/images/nguyenlieu/caramel.png', '2024-08-05'),
    (N'Muối', 125, N'gói', '/images/nguyenlieu/muoi.png', '2024-08-05'),
    (N'Hạnh nhân', 115, N'lọ', '/images/nguyenlieu/hanhnhan.png', '2024-08-05'),
    (N'Bơ', 120, N'quả', '/images/nguyenlieu/bo.png', '2024-08-05'),
    (N'Kem', 150, N'hộp', '/images/nguyenlieu/kem.png', '2024-08-05'),
    (N'Choco Chip', 130, N'gói', '/images/nguyenlieu/choco_chip.png', '2024-08-05'),
    (N'Mochi kem phúc bồn tử', 120, N'cái', '/images/nguyenlieu/mochi_kpbt.png', '2024-08-05'),
    (N'Mochi kem việt quất', 120, N'cái', '/images/nguyenlieu/mochi_kvq.png', '2024-08-05'),
    (N'Mochi kem chocolate', 120, N'cái', '/images/nguyenlieu/mochi_kemchoco.png', '2024-08-05'),
    (N'Mousse gấu chocolate', 110, N'cái', '/images/nguyenlieu/mousse_gau.png', '2024-08-05'),
    (N'Bánh mỳ', 150, N'ổ', '/images/nguyenlieu/banhmy.png', '2024-08-05'),
    (N'Sữa đặc', 160, N'hộp', '/images/nguyenlieu/suadac.png', '2024-08-05'),
    (N'Cam', 135, N'quả', '/images/nguyenlieu/cam.png', '2024-08-05'),
    (N'Sả', 125, N'cây', '/images/nguyenlieu/sa.png', '2024-08-05'),
    (N'Hạt sen', 115, N'túi', '/images/nguyenlieu/hatsen.png', '2024-08-05'),
    (N'Vải', 140, N'quả', '/images/nguyenlieu/vai.png', '2024-08-05'),
    (N'Mứt Yuzu', 120, N'lọ', '/images/nguyenlieu/yuzu.png', '2024-08-05'),
    (N'Đào', 120, N'hộp', '/images/nguyenlieu/dao.png', '2024-08-05'),
    (N'Bánh Gấu', 120, N'gói', '/images/nguyenlieu/banhgau.png', '2024-08-05'),
    (N'Sương Sáo', 120, N'cốc', '/images/nguyenlieu/suongsao.png', '2024-08-05'),
    (N'Dâu', 120, N'quả', '/images/nguyenlieu/dau.png', '2024-08-05'),
    (N'Bim Bim Ngô', 120, N'gói', '/images/nguyenlieu/bimbimngo.png', '2024-08-05'),
    (N'Bim Bim Sữa Dừa', 120, N'gói', '/images/nguyenlieu/bimbimsuadua.png', '2024-08-05');
GO

INSERT INTO Food (FoodName, CategoryId, IngredientId, Price, Discount, Stock, Description, ImageURL, CreatedDate, UpdatedDate, Status)
VALUES
    (N'Trà xanh espresso marble', 1, 1, 45000, 10, 50, N'Trà xanh kết hợp espresso thơm ngon', '/images/Cafe/traxanhespresso.png', GETDATE(), NULL, 1),
    (N'Bạc xỉu lắc sữa yến mạch', 1, 1, 50000, 5, 40, N'Cà phê sữa pha cùng sữa yến mạch', '/images/Cafe/bacxiulsyenmach.png', GETDATE(), NULL, 1),
    (N'Bạc xỉu lắc caramel muối', 1, 1, 55000, 7, 45, N'Cà phê sữa lắc cùng caramel muối', '/images/Cafe/bacxiulacmuoi.png', GETDATE(), NULL, 1),
    (N'Bạc xỉu lắc hạnh nhân nướng', 1, 1, 55000, 8, 35, N'Cà phê sữa kết hợp hạnh nhân nướng', '/images/Cafe/bacxiulachanhnhan.png', GETDATE(), NULL, 1),
    (N'Bơ arabica', 1, 1, 60000, 12, 25, N'Cà phê Arabica với vị béo của bơ', '/images/Cafe/bo_arabica.png', GETDATE(), NULL, 1),
    (N'Đường đen sữa đá', 1, 1, 30000, 0, 60, N'Cà phê sữa đá với đường đen', '/images/Cafe/duongdensuada.png', GETDATE(), NULL, 1),
    (N'Cà phê sữa đá', 1, 1, 25000, 0, 70, N'Cà phê pha sữa đặc', '/images/Cafe/cafesuada.png', GETDATE(), NULL, 1),
    (N'Cà phê sữa nóng', 1, 1, 25000, 0, 30, N'Cà phê sữa nóng thơm ngon', '/images/Cafe/cafesuanong.png', GETDATE(), NULL, 1),
    (N'Bạc xỉu', 1, 1, 30000, 5, 50, N'Bạc xỉu nguyên bản với nhiều sữa', '/images/Cafe/bacxiu.png', GETDATE(), NULL, 1),
    (N'Cà phê đen', 1, 1, 20000, 0, 80, N'Cà phê đen truyền thống', '/images/Cafe/cafeden.png', GETDATE(), NULL, 1),
    (N'Trà sữa trân châu đường đen', 2, 2, 35000, 10, 40, N'Trà sữa kết hợp trân châu đường đen', '/images/trasua/tstcduongden.png', GETDATE(), NULL, 1),
    (N'Trà sữa olong', 2, 2, 30000, 5, 50, N'Trà sữa vị Olong đặc biệt', '/images/trasua/ts_olong.png', GETDATE(), NULL, 1),
    (N'Trà sữa olong tứ quý bơ', 2, 2, 35000, 7, 30, N'Trà sữa Olong với bơ thơm béo', '/images/trasua/ts_olongtqbo.png', GETDATE(), NULL, 1),
    (N'Trà sữa olong nướng sương sáo', 2, 2, 35000, 5, 35, N'Trà sữa Olong kết hợp sương sáo', '/images/trasua/ts_olongss.png', GETDATE(), NULL, 1),
    (N'Trà đen macchiato', 2, 2, 30000, 5, 45, N'Trà đen phủ lớp macchiato béo mịn', '/images/trasua/tradenmacchiato.png', GETDATE(), NULL, 1),
    (N'Hồng trà sữa trân châu', 2, 2, 30000, 5, 50, N'Hồng trà sữa truyền thống với trân châu', '/images/trasua/hongtrasua.png', GETDATE(), NULL, 1),
    (N'Frosty phin-gato', 3, 3, 40000, 10, 30, N'Phin cà phê kết hợp bánh gato', '/images/tudx/frosty_phin.png', GETDATE(), NULL, 1),
    (N'Frosty cà phê đường đen', 3, 3, 40000, 10, 30, N'Cà phê đá xay với đường đen', '/images/tudx/frosty_cfduongden.png', GETDATE(), NULL, 1),
    (N'Frosty bánh kem dâu', 3, 3, 45000, 8, 25, N'Bánh kem dâu đá xay mát lạnh', '/images/tudx/frosty_banhkemdau.png', GETDATE(), NULL, 1),
    (N'Frosty choco chip', 3, 3, 45000, 8, 25, N'Socola chip kết hợp đá xay', '/images/tudx/frosty_choco.png', GETDATE(), NULL, 1),
    (N'Frosty caramel', 3, 3, 45000, 8, 25, N'Caramel thơm béo cùng đá xay', '/images/tudx/frosty_caramel.png', GETDATE(), NULL, 1),
    (N'Butter croissant', 4, 4, 25000, 5, 20, N'Bánh sừng bò bơ thơm ngon', '/images/banh/Butter_croissant.png', GETDATE(), NULL, 1),
    (N'Mochi kem phúc bồn tử', 4, 4, 30000, 5, 15, N'Mochi nhân kem vị phúc bồn tử', '/images/banh/mochi_phucbt.png', GETDATE(), NULL, 1),
    (N'Mochi kem việt quất', 4, 4, 30000, 5, 15, N'Mochi nhân kem vị việt quất', '/images/banh/mochi_vietquat.png', GETDATE(), NULL, 1),
    (N'Mochi kem chocolate', 4, 4, 30000, 5, 15, N'Mochi nhân kem vị chocolate', '/images/banh/mochi_kemchocolate.png', GETDATE(), NULL, 1),
    (N'Mousse gấu chocolate', 4, 4, 35000, 5, 15, N'Mousse socola hình gấu dễ thương', '/images/banh/mousse_gauchoco.png', GETDATE(), NULL, 1),
    (N'Bánh mì Việt Nam', 4, 4, 15000, 0, 50, N'Bánh mì truyền thống Việt Nam', '/images/banh/banhmyvn.png', GETDATE(), NULL, 1),
    (N'Bim bim ngô', 4, 4, 10000, 0, 100, N'Snack vị ngô giòn tan', '/images/banh/bimbimngo.png', GETDATE(), NULL, 1),
    (N'Bim bim sữa dừa', 4, 4, 10000, 0, 100, N'Snack sữa dừa thơm ngon', '/images/banh/bimbimsuadua.png', GETDATE(), NULL, 1),
    (N'Bánh gấu', 4, 4, 15000, 0, 50, N'Bánh gấu nhân kem', '/images/banh/banhgau.png', GETDATE(), NULL, 1),
    (N'Trà đào cam xả', 5, 5, 40000, 5, 30, N'Trà đào tươi kết hợp cam và xả', '/images/ttc/tradaocamsa.png', GETDATE(), NULL, 1),
    (N'Olong tứ quý sen', 5, 5, 35000, 5, 30, N'Trà Olong kết hợp hương sen', '/images/ttc/olongtuquysen.png', GETDATE(), NULL, 1),
    (N'Đào kombucha', 5, 5, 45000, 5, 25, N'Trà đào lên men Kombucha tốt cho sức khỏe', '/images/ttc/dao_kombucha.png', GETDATE(), NULL, 1),
    (N'Trà vải', 5, 5, 35000, 5, 30, N'Trà vải tươi mát', '/images/ttc/travai.png', GETDATE(), NULL, 1),
    (N'Trà yuzu kombucha', 5, 5, 50000, 5, 20, N'Trà Yuzu Nhật Bản kết hợp Kombucha', '/images/ttc/yuzu_kombucha.png', GETDATE(), NULL, 1);
GO

INSERT INTO Size (SizeName, ExtraPrice)
VALUES
    (N'Nhỏ', 0),
    (N'Vừa', 6000),
    (N'Lớn', 16000);
GO

INSERT INTO Topping (ToppingName, ToppingPrice)
VALUES
    (N'Thạch Sương Sáo', 10000),
    (N'Thạch Kim Quất', 10000),
    (N'Thạch Cà Phê', 10000),
    (N'Foam Phô Mai', 10000),
    (N'Shot Espresso', 10000),
    (N'Sốt Caramel', 10000),
    (N'Trân châu trắng', 10000),
    (N'Đá miếng', 5000),
    (N'Hạt sen', 10000),
    (N'Trái vải', 10000),
    (N'Kem phô mai Macchiato', 10000);
GO

INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
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
GO

INSERT INTO FoodDimensions (FoodId, Length, Width, Height, Weight)
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
GO

INSERT INTO Invoice (TableId, DateCheckIn, DateCheckOut, TrangThai)
VALUES
    (1, '2024-08-06', '2024-08-06', 0),
    (2, '2024-08-06', '2024-08-06', 0),
    (5, '2024-08-06', '2024-08-06', 0),
    (8, '2024-08-06', '2024-08-06', 0);
GO

INSERT INTO InvoiceDetail (InvoiceId, FoodId, SoLuong, Price)
VALUES
    (1, 1, 2, 45000), (1, 2, 1, 50000),
    (2, 3, 1, 55000), (2, 4, 2, 55000),
    (3, 29, 3, 10000), (3, 1, 2, 45000), (3, 19, 1, 45000),
    (4, 9, 2, 30000), (4, 12, 2, 30000);
GO

INSERT INTO Staff (FullName, Phone, DateOfBirth, Email, Gender, AccountId, RoleId)
VALUES
    (N'Nguyen Hai Duong', '0985082004', '2004-08-05', 'billduongg@gmail.com', 'Nam', 1, 1),
    (N'Nguyen Minh Hoang', '0985082005', '2004-08-06', 'staff2@gmail.com', 'Nam', NULL, 2),
    (N'Nguyen Bao Han', '0985082029', '2004-08-16', 'staff1@gmail.com', 'Nam', NULL, 2),
    (N'Nguyen Thi Hoai Suong', '0985082006', '2004-08-07', 'staff3@gmail.com', 'Nam', NULL, 3),
    (N'Dieu Thuy Lien', '0985082007', '2004-08-08', 'staff4@gmail.com', 'Nam', NULL, 3),
    (N'Vu Hoang Anh', '0985082008', '2004-08-09', 'staff5@gmail.com', 'Nam', NULL, 3),
    (N'Vu Hoang Em', '0985082009', '2004-08-10', 'staff6@gmail.com', N'Nữ', NULL, 3);
GO

UPDATE Staff
SET Gender = CASE
    WHEN Gender = 'True' THEN 'Nam'
    WHEN Gender = 'False' THEN 'Nữ'
END;
GO

INSERT INTO Warehouse (IngredientId, SoLuong, DateUpdate)
VALUES
    (1, 100, GETDATE()),
    (2, 50, GETDATE()),
    (3, 200, GETDATE()),
    (4, 75, GETDATE());
GO

INSERT INTO PhuongThucThanhToan (TenPhuongThuc)
VALUES
    (N'VN Pay'),
    (N'COD');
GO

select *from phuongthucthanhtoan
select *from PaymentStatus

INSERT INTO OrderStatus (StatusName)
VALUES
    (N'Đặt hàng thành công'),
    (N'Đang chuẩn bị đơn hàng'),
    (N'Đang giao hàng'),
    (N'Giao hàng thành công'),
    (N'Đã hủy');
GO

INSERT INTO PaymentStatus (PaymentStatusName)
VALUES
    (N'Chờ thanh toán'),
    (N'Đã thanh toán'),
    (N'Thanh toán thất bại'),
    (N'Đã hoàn tiền');
GO

INSERT INTO CuaHang (
    CuaHangName,
    Address,
    Ward,
    District,
    Province,
    Phone,
    ShopId,
    ProvinceId,
    DistrictId,
    WardCode,
    Latitude,
    Longitude,
    Opening_Hours,
    Image_URL
)
VALUES
-- HCM
(N'SuLi Coffee HCM Nguyễn Trãi', N'120 Nguyễn Trãi', N'Phường 5', N'Quận 5', N'TP Hồ Chí Minh', '0123456794', '2510549',
 202, 1445, '05008', 10.762622, 106.660172, '7:00-21:30', '/images/cuahang/a1.png'),
(N'SuLi Coffee HCM Phan Xích Long', N'34 Phan Xích Long', N'Phường 2', N'Quận Phú Nhuận', N'TP Hồ Chí Minh', '0123456795', '2510550',
 202, 1452, '02014', 10.799120, 106.677456, '7:00-21:30', '/images/cuahang/a2.png'),
(N'SuLi Coffee HCM Tô Hiến Thành', N'98 Tô Hiến Thành', N'Phường 15', N'Quận 10', N'TP Hồ Chí Minh', '0123456796', '2510551',
 202, 1449, '10153', 10.774000, 106.667000, '7:00-21:30', '/images/cuahang/a3.png'),
(N'SuLi Coffee HCM Nguyễn Đình Chiểu', N'210 Nguyễn Đình Chiểu', N'Phường 6', N'Quận 3', N'TP Hồ Chí Minh', '0123456797', '2510552',
 202, 1442, '03006', 10.779000, 106.692000, '7:00-21:30', '/images/cuahang/a4.png'),
(N'SuLi Coffee HCM Điện Biên Phủ', N'375 Điện Biên Phủ', N'Phường 15', N'Bình Thạnh', N'TP Hồ Chí Minh', '0123456798', '2510553',
 202, 1450, '15152', 10.800000, 106.700000, '7:00-21:30', '/images/cuahang/a5.png'),
(N'SuLi Coffee HCM Trường Sa', N'245 Trường Sa', N'Phường 14', N'Phú Nhuận', N'TP Hồ Chí Minh', '0123456799', '2510554',
 202, 1452, '0214', 10.799000, 106.684000, '7:00-21:30', '/images/cuahang/a6.png'),
(N'SuLi Coffee HCM Đinh Tiên Hoàng', N'142 Đinh Tiên Hoàng', N'Phường Đa Kao', N'Quận 1', N'TP Hồ Chí Minh', '0123456700', '2510555',
 202, 1441, '0103', 10.790000, 106.699000, '7:00-21:30', '/images/cuahang/a7.png'),
(N'SuLi Coffee HCM Lê Quang Định', N'400 Lê Quang Định', N'Phường 11', N'Bình Thạnh', N'TP Hồ Chí Minh', '0123456701', '2510556',
 202, 1450, '1511', 10.812000, 106.700000, '7:00-21:30', '/images/cuahang/a8.png'),
(N'SuLi Coffee HCM Cộng Hòa', N'198 Cộng Hòa', N'Phường 12', N'Tân Bình', N'TP Hồ Chí Minh', '0123456702', '2510557',
 202, 1454, '1212', 10.801941, 106.647484, '7:00-21:30', '/images/cuahang/a9.png'),
(N'SuLi Coffee HCM Quang Trung', N'99 Quang Trung', N'Phường 10', N'Gò Vấp', N'TP Hồ Chí Minh', '0123456703', '2510558',
 202, 1457, '1010', 10.823000, 106.687000, '7:00-21:30', '/images/cuahang/a10.png'),

-- HN (ShopId thống nhất 198043)
(N'SuLi Coffee HN Nguyễn Chí Thanh', N'45 Nguyễn Chí Thanh', N'Phường Láng Hạ', N'Đống Đa', N'Hà Nội', '0123456704', '198043',
 201, 113, '1102', 21.028000, 105.800000, '7:00-21:30', '/images/cuahang/a1.png'),
(N'SuLi Coffee HN Kim Mã', N'123 Kim Mã', N'Phường Giảng Võ', N'Ba Đình', N'Hà Nội', '0123456705', '198043',
 201, 111, '1002', 21.033000, 105.820000, '7:00-21:30', '/images/cuahang/a2.png'),
(N'SuLi Coffee HN Trần Duy Hưng', N'321 Trần Duy Hưng', N'Phường Trung Hòa', N'Cầu Giấy', N'Hà Nội', '0123456706', '198043',
 201, 112, '1207', 21.015000, 105.800000, '7:00-21:30', '/images/cuahang/a3.png'),
(N'SuLi Coffee HN Bạch Mai', N'75 Bạch Mai', N'Phường Thanh Nhàn', N'Hai Bà Trưng', N'Hà Nội', '0123456707', '198043',
 201, 114, '1403', 21.005000, 105.840000, '7:00-21:30', '/images/cuahang/a4.png'),
(N'SuLi Coffee HN Hồ Tùng Mậu', N'65 Hồ Tùng Mậu', N'Phường Mai Dịch', N'Cầu Giấy', N'Hà Nội', '0123456708', '198043',
 201, 112, '1203', 21.040000, 105.770000, '7:00-21:30', '/images/cuahang/a5.png'),
(N'SuLi Coffee HN Lê Văn Lương', N'120 Lê Văn Lương', N'Phường Nhân Chính', N'Thanh Xuân', N'Hà Nội', '0123456709', '198043',
 201, 116, '1604', 21.010000, 105.800000, '7:00-21:30', '/images/cuahang/a6.png'),
(N'SuLi Coffee HN Giải Phóng', N'201 Giải Phóng', N'Phường Phương Liệt', N'Hoàng Mai', N'Hà Nội', '0123456710', '198043',
 201, 115, '1507', 20.990000, 105.850000, '7:00-21:30', '/images/cuahang/a7.png'),
(N'SuLi Coffee HN Nguyễn Trãi', N'188 Nguyễn Trãi', N'Phường Thượng Đình', N'Thanh Xuân', N'Hà Nội', '0123456711', '198043',
 201, 116, '1607', 20.980000, 105.790000, '7:00-21:30', '/images/cuahang/a8.png'),
(N'SuLi Coffee HN Cầu Giấy', N'55 Cầu Giấy', N'Phường Quan Hoa', N'Cầu Giấy', N'Hà Nội', '0123456712', '198043',
 201, 112, '1206', 21.030000, 105.800000, '7:00-21:30', '/images/cuahang/a9.png'),
(N'SuLi Coffee HN Xuân Thủy', N'10 Xuân Thủy', N'Phường Dịch Vọng Hậu', N'Cầu Giấy', N'Hà Nội', '0123456713', '198043',
 201, 112, '1205', 21.040000, 105.780000, '7:00-21:30', '/images/cuahang/a10.png'),

-- Đà Nẵng
(N'SuLi Coffee Đà Nẵng Lê Duẩn', N'88 Lê Duẩn', N'Phường Hải Châu 1', N'Hải Châu', N'Đà Nẵng', '0123456714', '2510569',
 203, 505, '0501', 16.075000, 108.220000, '7:00-21:30', '/images/cuahang/a1.png'),
(N'SuLi Coffee Đà Nẵng Nguyễn Văn Linh', N'101 Nguyễn Văn Linh', N'Phường Nam Dương', N'Thanh Khê', N'Đà Nẵng', '0123456715', '2510570',
 203, 506, '0605', 16.060000, 108.210000, '7:00-21:30', '/images/cuahang/a2.png'),
(N'SuLi Coffee Đà Nẵng Trần Phú', N'55 Trần Phú', N'Phường Thạch Thang', N'Hải Châu', N'Đà Nẵng', '0123456716', '2510571',
 203, 505, '0503', 16.068000, 108.220000, '7:00-21:30', '/images/cuahang/a3.png'),

-- Cần Thơ
(N'SuLi Coffee Cần Thơ Trần Hưng Đạo', N'54 Trần Hưng Đạo', N'Phường An Cư', N'Ninh Kiều', N'Cần Thơ', '0123456720', '2510572',
 204, 609, '0901', 10.035000, 105.780000, '7:00-21:30', '/images/cuahang/a7.png'),
(N'SuLi Coffee Cần Thơ 30 Tháng 4', N'80 30 Tháng 4', N'Phường Xuân Khánh', N'Ninh Kiều', N'Cần Thơ', '0123456721', '2510573',
 204, 609, '0903', 10.030000, 105.770000, '7:00-21:30', '/images/cuahang/a8.png'),
(N'SuLi Coffee Cần Thơ Mậu Thân', N'15 Mậu Thân', N'Phường An Hòa', N'Ninh Kiều', N'Cần Thơ', '0123456722', '2510574',
 204, 609, '0902', 10.035000, 105.765000, '7:00-21:30', '/images/cuahang/a9.png'),
(N'SuLi Coffee Cần Thơ Nguyễn Văn Cừ', N'99 Nguyễn Văn Cừ', N'Phường Xuân Khánh', N'Ninh Kiều', N'Cần Thơ', '0123456723', '2510575',
 204, 609, '0903', 10.040000, 105.770000, '7:00-21:30', '/images/cuahang/a10.png');
GO


INSERT INTO Vouchers (Code, DiscountAmount, DiscountPercentage, MinOrderAmount, ExpiryDate, IsActive, MaxUsage, Description)
VALUES
    ('FREESHIP', 20000, NULL, 50000, '2025-04-30 23:59:59', 1, 100, N'Miễn phí vận chuyển cho đơn từ 50.000đ'),
    ('GIAM30K', 30000, NULL, 99000, '2025-04-30 23:59:59', 1, 100, N'Giảm ngay 30.000đ cho đơn từ 99.000đ'),
    ('GIAM20K', 20000, NULL, 60000, '2025-04-30 23:59:59', 1, 50, N'Giảm ngay 20.000đ cho đơn từ 60.000đ'),
    ('GIAM10KM', NULL, 10.00, 500000, '2025-04-30 23:59:59', 1, 200, N'Giảm 10% cho đơn từ 500.000đ'),
    ('GIAM30KM', NULL, 10.00, 250000, '2025-04-30 23:59:59', 1, 200, N'Giảm 10% cho đơn từ 250.000đ');
GO

INSERT INTO DeliveryAddresses (
    UserId,
    Address,
    Province,
    ProvinceId,
    District,
    DistrictId,
    Ward,
    WardCode,
    ReceiverName,
    Phone,
    IsDefault
)
VALUES
    (1, N'123 Đường Láng', N'Hà Nội', 201, N'Đống Đa', 1482, N'Láng Hạ', '1A0706', N'Thùy Liên', '0366413924', 1),
    (1, N'456 Nguyễn Trãi', N'Hà Nội', 201, N'Thanh Xuân', 1454, N'Thượng Đình', '1A1007', N'Thùy Liên', '0366413924', 0),
    (2, N'789 Lê Lợi', N'TP Hồ Chí Minh', 202, N'Quận 1', 1442, N'Bến Nghé', '21211', N'Liên Nguyễn', '0987654321', 1);
GO


-- Chuẩn hóa tỉnh
UPDATE Orders SET Province = N'TP Hồ Chí Minh' WHERE Province = N'Hồ Chí Minh';
UPDATE DeliveryAddresses SET Province = N'TP Hồ Chí Minh' WHERE Province = N'Hồ Chí Minh';
UPDATE Users SET Province = N'TP Hồ Chí Minh' WHERE Province = N'Hồ Chí Minh';
GO

ALTER TABLE DeliveryAddresses
ADD Latitude DECIMAL(10,8) NULL,
    Longitude DECIMAL(11,8) NULL;

	-- Kiểm tra stores có Latitude/Longitude không
SELECT 
  CuaHangId,
  CuaHangName,
  Address,
  Latitude,
  Longitude,
  CASE 
    WHEN Latitude IS NULL OR Longitude IS NULL THEN 'Missing'
    ELSE 'OK'
  END as CoordinatesStatus
FROM CuaHang
ORDER BY CuaHangId;

-- Kiểm tra addresses có Latitude/Longitude không
SELECT 
  AddressId,
  ReceiverName,
  CONCAT(Street, ', ', Ward, ', ', District, ', ', Province) as FullAddress,
  Latitude,
  Longitude,
  CASE 
    WHEN Latitude IS NULL OR Longitude IS NULL THEN 'Missing'
    ELSE 'OK'
  END as CoordinatesStatus
FROM DeliveryAddresses
ORDER BY AddressId DESC;



SELECT 
  DeliveryAddressId,
  ReceiverName,
  CONCAT(Address, ', ', Ward, ', ', District, ', ', Province) as FullAddress,
  Latitude,
  Longitude,
  CASE 
    WHEN Latitude IS NULL OR Longitude IS NULL THEN 'Missing'
    ELSE 'OK'
  END as CoordinatesStatus
FROM DeliveryAddresses
ORDER BY DeliveryAddressId DESC;
