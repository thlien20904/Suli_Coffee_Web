-- Sử dụng database WebAppDB
USE WebAppDB;
GO


-- 1. Tạo bảng Users
	CREATE TABLE Users (
		Id INT IDENTITY(1,1) PRIMARY KEY,
		Username NVARCHAR(50) UNIQUE NOT NULL,
		Email NVARCHAR(50) UNIQUE NOT NULL,
		PasswordHash NVARCHAR(255) NOT NULL,
		FullName NVARCHAR(100) NULL,
		Phone NVARCHAR(15) NULL,
		Address NVARCHAR(255) NULL,
		Role NVARCHAR(20) NOT NULL DEFAULT 'User',
		OTPCode NVARCHAR(10) NULL,
		OTPExpiry DATETIME NULL,
		ResetToken NVARCHAR(100) NULL,
		ResetTokenExpiry DATETIME NULL,
		AvatarUrl NVARCHAR(255) NULL, 
		CreatedDate DATETIME DEFAULT GETDATE()
	);
	GO

	select *from Users
-- Table: AccRole
CREATE TABLE AccRole(
    RoleId INT IDENTITY PRIMARY KEY,
    RoleName NVARCHAR(100) NOT NULL
);
GO


-- Table: Account
CREATE TABLE Account (
    AccountId INT IDENTITY PRIMARY KEY,
    DisplayName NVARCHAR(100) NOT NULL,
    UserName NVARCHAR(50) NOT NULL,
    PassWord NVARCHAR(50) NOT NULL,
    RoleName NVARCHAR(50) not null
);
GO

-- Table: TableFood
CREATE TABLE TableFood(
    TableId INT IDENTITY PRIMARY KEY,
    TableName NVARCHAR(100),
    TrangThai NVARCHAR(100) -- Trống, có khách, đã được đặt
);
GO

-- Table: Category
CREATE TABLE Category (
    CategoryId INT PRIMARY KEY IDENTITY,
    CategoryName NVARCHAR(100) NOT NULL
);
GO


-- Table: Ingredient
CREATE TABLE Ingredient (
    IngredientId INT PRIMARY KEY IDENTITY,
    IngredientName NVARCHAR(100) NOT NULL,
    SoLuong INT NOT NULL DEFAULT 0,
	PhanLoai Nvarchar(50) not null,
	ImageURL VARCHAR(255) NOT NULL,
    LastUpdated DATE NOT NULL DEFAULT GETDATE()
);
GO

-- Table: Food.........................................................................................................................
CREATE TABLE Food ( 
    FoodId INT PRIMARY KEY IDENTITY,
    FoodName NVARCHAR(100) NOT NULL,
    CategoryId INT,
    IngredientId INT,
    Price DECIMAL(18, 3) NOT NULL DEFAULT 0, -- Giá gốc
    Discount DECIMAL(5, 2) DEFAULT 0, -- Phần trăm giảm giá (0-100)
    DiscountPrice AS (Price - (Price * Discount / 100)), -- Giá sau khi giảm
    Stock INT NOT NULL DEFAULT 0, -- Số lượng tồn kho
    Description NVARCHAR(500) NULL, -- Mô tả món ăn
    ImageURL NVARCHAR(255) NULL, -- Đường dẫn hình ảnh
    CreatedDate DATETIME DEFAULT GETDATE(), -- Ngày thêm món ăn
    UpdatedDate DATETIME NULL, -- Ngày cập nhật gần nhất
    Status BIT DEFAULT 1, -- 1: Còn bán, 0: Ngừng bán
    FOREIGN KEY (CategoryId) REFERENCES Category(CategoryId),
    FOREIGN KEY (IngredientId) REFERENCES Ingredient(IngredientId)
);

-- Bảng Size (Giữ nguyên)
CREATE TABLE Size (
    SizeID INT IDENTITY(1,1) PRIMARY KEY,
    SizeName NVARCHAR(50) NOT NULL,
    ExtraPrice INT NOT NULL
);
GO

-- Bảng Topping (Giữ nguyên)
CREATE TABLE Topping (
    ToppingID INT IDENTITY(1,1) PRIMARY KEY,
    ToppingName NVARCHAR(100) NOT NULL,
    ToppingPrice INT NOT NULL
);
GO

-- Bảng GioHang (Cập nhật)
CREATE TABLE GioHang (
    GioHangID INT PRIMARY KEY IDENTITY, 
    Id INT NOT NULL, -- ID của User
    FoodId INT NOT NULL, -- ID của món ăn
    SoLuong INT NOT NULL DEFAULT 1 CHECK (SoLuong > 0), -- Số lượng sản phẩm
    SizeID INT NULL, -- Kích thước (Size)
    TotalPrice DECIMAL(18,3) NOT NULL, -- Tổng giá tiền
    
    FOREIGN KEY (Id) REFERENCES Users(Id),
    FOREIGN KEY (FoodId) REFERENCES Food(FoodId),
    FOREIGN KEY (SizeID) REFERENCES Size(SizeID),

);
GO


-- Bảng trung gian GioHang_Topping để lưu nhiều topping cho 1 sản phẩm trong giỏ hàng
CREATE TABLE GioHang_Topping (
    GioHangToppingID INT PRIMARY KEY IDENTITY,
    GioHangID INT NOT NULL, -- ID giỏ hàng
    ToppingID INT NOT NULL, -- ID topping

    FOREIGN KEY (GioHangID) REFERENCES GioHang(GioHangID) ON DELETE CASCADE,
    FOREIGN KEY (ToppingID) REFERENCES Topping(ToppingID) ON DELETE CASCADE
);
GO

CREATE TABLE PhuongThucThanhToan (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TenPhuongThuc NVARCHAR(255) NOT NULL
);

CREATE TABLE OrderStatus (
    StatusId INT PRIMARY KEY IDENTITY(1,1),
    StatusName NVARCHAR(50) NOT NULL UNIQUE
);
CREATE TABLE Vouchers (
    VoucherId INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(50) UNIQUE NOT NULL,
    DiscountAmount DECIMAL(18,3) NULL,
    DiscountPercentage DECIMAL(5,2) NULL,
    MinOrderAmount DECIMAL(18,3) NULL,
    ExpiryDate DATETIME NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    MaxUsage INT NULL, 
    UsedCount INT DEFAULT 0,
    Description NVARCHAR(255) NULL -- mô tả ngắn để hiển thị trên app
);
CREATE TABLE UserVouchers (
    UserVoucherId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    VoucherId INT NOT NULL,
    IsUsed BIT DEFAULT 0,
    ReceivedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (VoucherId) REFERENCES Vouchers(VoucherId),
    UNIQUE(UserId, VoucherId) -- tránh nhận trùng
);
CREATE TABLE Notifications (
    NotificationId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Title NVARCHAR(100),
    Message NVARCHAR(255),
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
select *from Notifications ;

CREATE TABLE DeliveryAddresses (
    AddressId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Address NVARCHAR(255) NOT NULL,
    IsDefault BIT NOT NULL DEFAULT 0, -- Địa chỉ mặc định
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO-- Bảng Orders
CREATE TABLE Orders (
    OrderId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    OrderDate DATETIME NOT NULL DEFAULT GETDATE(),
    TotalAmount DECIMAL(18, 3) NOT NULL,
    PaymentMethodId INT NOT NULL,
    StatusId INT NOT NULL,
    DeliveryAddress NVARCHAR(255) NULL,
    VoucherId INT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (PaymentMethodId) REFERENCES PhuongThucThanhToan(Id),
    FOREIGN KEY (StatusId) REFERENCES OrderStatus(StatusId),
    FOREIGN KEY (VoucherId) REFERENCES Vouchers(VoucherId)
);
-- Bảng OrderDetails
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
CREATE TABLE OrderDetails_Topping (
    OrderDetailsToppingID INT IDENTITY(1,1) PRIMARY KEY,
    OrderDetailId INT NOT NULL,     -- Món trong chi tiết đơn hàng
    ToppingId INT NOT NULL,         -- Topping đi kèm

    FOREIGN KEY (OrderDetailId) REFERENCES OrderDetails(OrderDetailId) ON DELETE CASCADE,
    FOREIGN KEY (ToppingId) REFERENCES Topping(ToppingID) ON DELETE CASCADE
);
GO

SELECT * FROM OrderStatus;


-- Table: Invoice
CREATE TABLE Invoice (
    InvoiceId INT PRIMARY KEY IDENTITY,
    TableId INT,
    DateCheckIn DATE NOT NULL DEFAULT GETDATE(),
    DateCheckOut DATE,
    TrangThai INT, -- 1 là thanh toán, 0 là chưa thanh toán
    FOREIGN KEY (TableId) REFERENCES TableFood(TableId)
);
GO


-- Table: InvoiceDetail
CREATE TABLE InvoiceDetail(
    InvoiceDetailId INT PRIMARY KEY IDENTITY,
    InvoiceId INT,
    FoodId INT,
    SoLuong INT NOT NULL DEFAULT 0,
    Price DECIMAL(18, 3) NOT NULL,
    FOREIGN KEY (InvoiceId) REFERENCES Invoice(InvoiceId),
    FOREIGN KEY (FoodId) REFERENCES Food(FoodId)
);
GO


-- Table: Staff
CREATE TABLE Staff (
    StaffId INT PRIMARY KEY IDENTITY,
    FullName NVARCHAR(100) NOT NULL,
    Phone NVARCHAR(15),
    DateOfBirth DATE NULL,
    Email NVARCHAR(50) NULL,
    Gender NVARCHAR(50) null,
    AccountId INT,
    RoleId INT,
    FOREIGN KEY (AccountId) REFERENCES Account(AccountId),
    FOREIGN KEY (RoleId) REFERENCES AccRole(RoleId)
);
GO
UPDATE Staff
SET Gender = CASE 
    WHEN Gender = 'True' THEN 'Nam'
    WHEN Gender = 'False' THEN 'Nữ'
END




-- Table: Warehouse
CREATE TABLE Warehouse (
    WarehouseId INT PRIMARY KEY IDENTITY,
    IngredientId INT,
    SoLuong INT NOT NULL DEFAULT 0,
    DateUpdate DATE NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (IngredientId) REFERENCES Ingredient(IngredientId)
);
GO

-- nhieu nguyen lieu
CREATE TABLE FoodIngredient (
    FoodIngredientId INT PRIMARY KEY IDENTITY,
    FoodId INT,
    IngredientId INT,
    Quantity INT NOT NULL, -- Số lượng nguyên liệu cho món ăn này
    FOREIGN KEY (FoodId) REFERENCES Food(FoodId),
    FOREIGN KEY (IngredientId) REFERENCES Ingredient(IngredientId)
);
GO
CREATE TABLE CuaHang (
    CuaHangId INT IDENTITY(1,1) PRIMARY KEY, 
    CuaHangName NVARCHAR(255) NOT NULL,
    address NVARCHAR(500) NOT NULL,
    opening_hours VARCHAR(50),
    image_url VARCHAR(255),
    phone VARCHAR(20),
    created_at DATETIME2 DEFAULT GETDATE(),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
);

-- Cập nhật tọa độ
UPDATE CuaHang
SET latitude = 21.0165, longitude = 105.8163
WHERE CuaHangId = 1;

UPDATE CuaHang
SET latitude = 10.7769, longitude = 106.7009
WHERE CuaHangId = 2;

INSERT INTO Users (Username, Email, PasswordHash, FullName, Phone, Address, Role, AvatarUrl)
VALUES 
('admin', 'thuylien2k4@gmail.com', '1', N'Thùy Liên', '0366413924', N'Hà Nội', 'admin','/images/Avatar/a.png'),
('user1', 'lien@gmail.com', '1', N'Liên Nguyễn', '0987654321', N'Hồ Chí Minh', 'User','/images/Avatar/a.png'),
('user2', 'example2@gmail.com', '1', N'Nguyễn Văn A', '0901122334', N'Đà Nẵng', 'User', NULL),
('user3', 'example3@gmail.com', '1', N'Lê Thị B', '0905678999', N'Cần Thơ', 'User', NULL);
GO
 select *from users;


INSERT INTO AccRole (RoleName)
VALUES
(N'Quản lý'),
(N'Pha chế'),
(N'Phục vụ');

INSERT INTO Account (DisplayName, UserName, PassWord, RoleName)
VALUES
('Admin ', 'admin', '1', 'Admin');
-- Tài khoản quản lý
INSERT INTO Account (DisplayName, UserName, PassWord, RoleName)
VALUES 
('Nguyễn Văn Quản', 'manager1', '123456', N'Quản lý'),

-- Tài khoản pha chế
('Trần Thị Pha', 'phache1', '123456', N'Pha chế'),
('Lê Văn Chế', 'phache2', '123456', N'Pha chế'),

-- Tài khoản phục vụ
('Phạm Thị Phục', 'phucvu1', '123456', N'Phục vụ'),
('Hoàng Văn Vụ', 'phucvu2', '123456', N'Phục vụ');

INSERT INTO TableFood (TableName, TrangThai)
VALUES
('Table 1', N'Đã có khách'),
('Table 2', N'Đã có khách'),
('Table 3', N'Bàn Trống'),
('Table 4', N'Bàn Trống')
,('Table 5', N'Đã có khách'),
('Table 6', N'Bàn Trống'),
('Table 7', N'Bàn Trống'),
('Table 8', N'Đã có khách'),
('Table 9', N'Bàn Trống'),
('Table 10', N'Bàn Trống'),
('Table 11', N'Bàn Trống'),
('Table 12', N'Bàn Trống');

INSERT INTO Category (CategoryName)
VALUES
(N'Cà phê'),
(N'Trà sữa'),
(N'Thức uống đá xay'),
(N'Bánh & Snack'),
(N'Trà trái cây');

select *from Ingredient
INSERT INTO Ingredient (IngredientName,SoLuong,PhanLoai, ImageURl, LastUpdated)
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

-- Bánh ngọt & đồ ăn nhẹ
(N'Butter croissant', 4, 4, 25000, 5, 20, N'Bánh sừng bò bơ thơm ngon', '/images/banh/Butter_croissant.png', GETDATE(), NULL, 1),
(N'Mochi kem phúc bồn tử', 4, 4, 30000, 5, 15, N'Mochi nhân kem vị phúc bồn tử', '/images/banh/mochi_phucbt.png', GETDATE(), NULL, 1),
(N'Mochi kem việt quất', 4, 4, 30000, 5, 15, N'Mochi nhân kem vị việt quất', '/images/banh/mochi_vietquat.png', GETDATE(), NULL, 1),
(N'Mochi kem chocolate', 4, 4, 30000, 5, 15, N'Mochi nhân kem vị chocolate', '/images/banh/mochi_kemchocolate.png', GETDATE(), NULL, 1),
(N'Mousse gấu chocolate', 4, 4, 35000, 5, 15, N'Mousse socola hình gấu dễ thương', '/images/banh/mousse_gauchoco.png', GETDATE(), NULL, 1),
(N'Bánh mì Việt Nam', 4, 4, 15000, 0, 50, N'Bánh mì truyền thống Việt Nam', '/images/banh/banhmyvn.png', GETDATE(), NULL, 1),
(N'Bim bim ngô', 4, 4, 10000, 0, 100, N'Snack vị ngô giòn tan', '/images/banh/bimbimngo.png', GETDATE(), NULL, 1),
(N'Bim bim sữa dừa', 4, 4, 10000, 0, 100, N'Snack sữa dừa thơm ngon', '/images/banh/bimbimsuadua.png', GETDATE(), NULL, 1),
(N'Bánh gấu', 4, 4, 15000, 0, 50, N'Bánh gấu nhân kem', '/images/banh/banhgau.png', GETDATE(), NULL, 1),

-- Trà trái cây
(N'Trà đào cam xả', 5, 5, 40000, 5, 30, N'Trà đào tươi kết hợp cam và xả', '/images/ttc/tradaocamsa.png', GETDATE(), NULL, 1),
(N'Olong tứ quý sen', 5, 5, 35000, 5, 30, N'Trà Olong kết hợp hương sen', '/images/ttc/olongtuquysen.png', GETDATE(), NULL, 1),
(N'Đào kombucha', 5, 5, 45000, 5, 25, N'Trà đào lên men Kombucha tốt cho sức khỏe', '/images/ttc/dao_kombucha.png', GETDATE(), NULL, 1),
(N'Trà vải', 5, 5, 35000, 5, 30, N'Trà vải tươi mát', '/images/ttc/travai.png', GETDATE(), NULL, 1),
(N'Trà yuzu kombucha', 5, 5, 50000, 5, 20, N'Trà Yuzu Nhật Bản kết hợp Kombucha', '/images/ttc/yuzu_kombucha.png', GETDATE(), NULL, 1);


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
-- Ingredients for Trà xanh espresso marble
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(1, 1, 1), -- Coffee
(1, 2, 1), -- Milk
(1, 7, 1); -- Matcha

-- Ingredients for Bạc xỉu lắc sữa yến mạch
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(2, 1, 1), -- Coffee
(2, 2, 1), -- Milk
(2, 8, 1); -- Yến mạch

-- Ingredients for Bạc xỉu lắc caramel muối
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(3, 1, 1), -- Coffee
(3, 2, 1), -- Milk
(3, 9, 1), -- Caramel
(3, 10, 1); -- Salt

-- Ingredients for Bạc xỉu lắc hạnh nhân nướng
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(4, 1, 1), -- Coffee
(4, 2, 1), -- Milk
(4, 11, 1); -- Almond

-- Ingredients for Bơ arabica
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(5, 1, 1), -- Coffee
(5, 2, 1), -- Milk
(5, 12, 1); -- Butter

-- Ingredients for Đường đen sữa đá
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(6, 1, 1), -- Coffee
(6, 3, 1), -- Sugar
(6, 2, 1); -- Milk

-- Ingredients for Cà phê sữa đá
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(7, 1, 1), -- Coffee
(7, 2, 1); -- Milk

-- Ingredients for Cà phê sữa nóng
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(8, 1, 1), -- Coffee
(8, 2, 1); -- Milk

-- Ingredients for Bạc xỉu
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(9, 1, 1), -- Coffee
(9, 2, 1); -- Milk

-- Ingredients for Cà phê đen
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(10, 1, 1), -- Coffee
(10, 3, 1); -- Sugar

-- Ingredients for Trà sữa trân châu đường đen
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(11, 4, 1), -- Tea
(11, 2, 1), -- Milk
(11, 6, 1), -- Tapioca pearls
(11, 3, 1); -- Sugar

-- Ingredients for Trà sữa olong
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(12, 4, 1), -- Tea
(12, 2, 1); -- Milk

-- Ingredients for Trà sữa olong tứ quý bơ
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(13, 4, 1), -- Tea
(13, 2, 1), -- Milk
(13, 12, 1); -- Butter

-- Ingredients for Trà sữa olong nướng sương sáo
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(14, 4, 1), -- Tea
(14, 2, 1), -- Milk
(14, 28, 1); -- sương sáo

-- Ingredients for Trà đen macchito
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(15, 4, 1), -- Tea
(15, 2, 1); -- Milk

-- Ingredients for Hồng trà sữa trân châu
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(16, 4, 1), -- Tea
(16, 2, 1), -- Milk
(16, 6, 1); -- Tapioca pearls

-- Continue similarly for other food items in each category.

-- Ingredients for Frosty phin-gato
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(17, 4, 1), -- Tea
(17, 2, 1), -- Milk
(17, 13, 1), -- Cream
(17, 6, 1); -- Tapioca pearls

-- Ingredients for Frosty cà phê đường đen
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(18, 4, 1), -- Tea
(18, 2, 1), -- Milk
(18, 13, 1), -- Cream
(18, 3, 1); -- Sugar

-- Ingredients for Frosty bánh kem dâu
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(19, 4, 1), -- Tea
(19, 2, 1), -- Milk
(19, 13, 1), -- Cream
(19, 29, 1); -- Strawberry

-- Ingredients for Frosty choco chip
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(20, 4, 1), -- Tea
(20, 2, 1), -- Milk
(20, 13, 1), -- Cream
(20, 14, 1); -- Chocolate chip

-- Ingredients for Frosty caramel
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(21, 4, 1), -- Tea
(21, 2, 1), -- Milk
(21, 13, 1), -- Cream
(21, 9, 1); -- Caramel

-- Bánh & Snack (Pastry & Snack)

-- Ingredients for Butter croissant
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(22, 19, 1), -- Bread
(22, 20, 1); -- Condensed milk

-- Ingredients for Mochi kem phúc bồn tử
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(23, 15, 1); -- Mochi raspberry ice cream

-- Ingredients for Mochi kem việt quất
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(24, 16, 1); -- Mochi blueberry ice cream

-- Ingredients for Mochi kem chocolate
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(25, 17, 1); -- Mochi chocolate ice cream

-- Ingredients for Mousse gấu chocolate
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(26, 18, 1); -- Chocolate mousse bear

-- Ingredients for Bánh mì Việt Nam
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(27, 19, 1); -- Bread

-- Ingredients for Bim bim ngô
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(28, 30, 1); -- Corn snack

-- Ingredients for Bim bim sữa dừa
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(29, 31, 1); -- Coconut milk snack                                            

-- Ingredients for Bánh gấu
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(30, 27, 1); -- Bear biscuit

-- Trà trái cây (Fruit tea)

-- Ingredients for Trà đào cam xả
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(31, 4, 1), -- Tea
(31, 26, 1), -- đào
(31, 22, 1), -- Sả
(31, 21, 1); -- cam

-- Ingredients for Olong tứ quý sen
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(32, 4, 1), -- Tea
(32, 23, 1); -- Lotus seed

-- Ingredients for Đào kombucha
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(33, 4, 1), -- Tea
(33, 26, 1); -- Peach

-- Ingredients for Trà vải
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(34, 4, 1), -- Tea
(34, 24, 1); -- Lychee

-- Ingredients for Trà yuzu kombucha
INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
VALUES 
(35, 4, 1), -- Tea
(35, 25, 1); -- Orange (Yuzu)


-- Insert vào Invoice
INSERT INTO Invoice (TableId, DateCheckIn, DateCheckOut, TrangThai)
VALUES
(1, '2024-08-06', '2024-08-06', 0),
(2, '2024-08-06', '2024-08-06', 0),
(5, '2024-08-06', '2024-08-06', 0),
(8, '2024-08-06', '2024-08-06', 0);

-- Insert vào InvoiceDetail
INSERT INTO InvoiceDetail (InvoiceId, FoodId, SoLuong, Price)
VALUES

    (1, 1, 2, 45000),
    (1, 2, 1, 50000),
    (2, 3, 1, 55000),
    (2, 4, 2, 55000),
    (3, 29, 3, 10000),
    (3, 1, 2, 45000),
    (3, 19, 1, 45000),
    (4, 9, 2, 30000),
    (4, 12, 2,30000);
	

-- Bảng Staff
INSERT INTO Staff (FullName, Phone, DateOfBirth, Email, Gender, AccountId, RoleId) 
VALUES
(N'Nguyen Hai Duong', '0985082004', '2004-08-05', 'billduongg@gmail.com', 'Nam', 1, 1),
(N'Nguyen Minh Hoang', '0985082005', '2004-08-06', 'staff2@gmail.com', 'Nam', null, 2),
(N'Nguyen Bao Han', '0985082029', '2004-08-16', 'staff1@gmail.com', 'Nam', null, 2),
(N'Nguyen Thi Hoai Suong', '0985082006', '2004-08-07', 'staff3@gmail.com', 'Nam', null, 3),
(N'Dieu Thuy Lien', '0985082007', '2004-08-08', 'staff4@gmail.com', 'Nam', null, 3),
(N'Vu Hoang Anh', '0985082008', '2004-08-09', 'staff5@gmail.com', 'Nam', null, 3),
(N'Vu Hoang Em', '0985082009', '2004-08-10', 'staff6@gmail.com', N'Nữ', null, 3);


-- Bảng Warehouse
INSERT INTO Warehouse (IngredientId, SoLuong, DateUpdate)
VALUES
(1, 100, GETDATE()),
(2, 50, GETDATE()),
(3, 200, GETDATE()),
(4, 75, GETDATE());

INSERT INTO PhuongThucThanhToan (TenPhuongThuc)
VALUES 
(N'VN Pay'),
(N'COD');
INSERT INTO OrderStatus (StatusName)
VALUES 
    (N'Đặt hàng thành công'),
    (N'Đang chuẩn bị đơn hàng'),
    (N'Đang giao hàng'),
    (N'Giao hàng thành công');
	INSERT INTO OrderStatus (StatusName)
VALUES 

    (N'Đã hủy');                   -- StatusId = 5


INSERT INTO CuaHang (CuaHangName, address, opening_hours, image_url, phone, latitude, longitude)
VALUES
(N'SuLi Coffee HCM Nguyễn Trãi', N'120 Nguyễn Trãi, Quận 5, Hồ Chí Minh', '7:00 - 21:30', '/images/cuahang/a1.png', '0123456794', 10.762622, 106.660172),
(N'SuLi Coffee HCM Phan Xích Long', N'34 Phan Xích Long, Phú Nhuận, Hồ Chí Minh', '7:00 - 21:30', '/images/cuahang/a2.png', '0123456795', 10.799120, 106.677456),
(N'SuLi Coffee HCM Tô Hiến Thành', N'98 Tô Hiến Thành, Quận 10, Hồ Chí Minh', '7:00 - 21:30', '/images/cuahang/a3.png', '0123456796', 10.774000, 106.667000),
(N'SuLi Coffee HCM Nguyễn Đình Chiểu', N'210 Nguyễn Đình Chiểu, Quận 3, Hồ Chí Minh', '7:00 - 21:30', '/images/cuahang/a4.png', '0123456797', 10.779000, 106.692000),
(N'SuLi Coffee HCM Điện Biên Phủ', N'375 Điện Biên Phủ, Bình Thạnh, Hồ Chí Minh', '7:00 - 21:30', '/images/cuahang/a5.png', '0123456798', 10.800000, 106.700000),
(N'SuLi Coffee HCM Trường Sa', N'245 Trường Sa, Phú Nhuận, Hồ Chí Minh', '7:00 - 21:30', '/images/cuahang/a6.png', '0123456799', 10.799000, 106.684000),
(N'SuLi Coffee HCM Đinh Tiên Hoàng', N'142 Đinh Tiên Hoàng, Quận 1, Hồ Chí Minh', '7:00 - 21:30', '/images/cuahang/a7.png', '0123456700', 10.790000, 106.699000),
(N'SuLi Coffee HCM Lê Quang Định', N'400 Lê Quang Định, Bình Thạnh, Hồ Chí Minh', '7:00 - 21:30', '/images/cuahang/a8.png', '0123456701', 10.812000, 106.700000),
(N'SuLi Coffee HCM Cộng Hòa', N'198 Cộng Hòa, Tân Bình, Hồ Chí Minh', '7:00 - 21:30', '/images/cuahang/a9.png', '0123456702', 10.801941, 106.647484),
(N'SuLi Coffee HCM Quang Trung', N'99 Quang Trung, Gò Vấp, Hồ Chí Minh', '7:00 - 21:30', '/images/cuahang/a10.png', '0123456703', 10.823000, 106.687000),
(N'SuLi Coffee HN Nguyễn Chí Thanh', N'45 Nguyễn Chí Thanh, Đống Đa, Hà Nội', '7:00 - 21:30', '/images/cuahang/a1.png', '0123456704', 21.028000, 105.800000),
(N'SuLi Coffee HN Kim Mã', N'123 Kim Mã, Ba Đình, Hà Nội', '7:00 - 21:30', '/images/cuahang/a2.png', '0123456705', 21.033000, 105.820000),
(N'SuLi Coffee HN Trần Duy Hưng', N'321 Trần Duy Hưng, Cầu Giấy, Hà Nội', '7:00 - 21:30', '/images/cuahang/a3.png', '0123456706', 21.015000, 105.800000),
(N'SuLi Coffee HN Bạch Mai', N'75 Bạch Mai, Hai Bà Trưng, Hà Nội', '7:00 - 21:30', '/images/cuahang/a4.png', '0123456707', 21.005000, 105.840000),
(N'SuLi Coffee HN Hồ Tùng Mậu', N'65 Hồ Tùng Mậu, Nam Từ Liêm, Hà Nội', '7:00 - 21:30', '/images/cuahang/a5.png', '0123456708', 21.040000, 105.770000),
(N'SuLi Coffee HN Lê Văn Lương', N'120 Lê Văn Lương, Thanh Xuân, Hà Nội', '7:00 - 21:30', '/images/cuahang/a6.png', '0123456709', 21.010000, 105.800000),
(N'SuLi Coffee HN Giải Phóng', N'201 Giải Phóng, Hoàng Mai, Hà Nội', '7:00 - 21:30', '/images/cuahang/a7.png', '0123456710', 20.990000, 105.850000),
(N'SuLi Coffee HN Nguyễn Trãi', N'188 Nguyễn Trãi, Hà Đông, Hà Nội', '7:00 - 21:30', '/images/cuahang/a8.png', '0123456711', 20.980000, 105.790000),
(N'SuLi Coffee HN Cầu Giấy', N'55 Cầu Giấy, Cầu Giấy, Hà Nội', '7:00 - 21:30', '/images/cuahang/a9.png', '0123456712', 21.030000, 105.800000),
(N'SuLi Coffee HN Xuân Thủy', N'10 Xuân Thủy, Cầu Giấy, Hà Nội', '7:00 - 21:30', '/images/cuahang/a10.png', '0123456713', 21.040000, 105.780000),
(N'SuLi Coffee Đà Nẵng Lê Duẩn', N'88 Lê Duẩn, Hải Châu, Đà Nẵng', '7:00 - 21:30', '/images/cuahang/a1.png', '0123456714', 16.075000, 108.220000),
(N'SuLi Coffee Đà Nẵng Nguyễn Văn Linh', N'101 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng', '7:00 - 21:30', '/images/cuahang/a2.png', '0123456715', 16.060000, 108.210000),
(N'SuLi Coffee Đà Nẵng Trần Phú', N'55 Trần Phú, Hải Châu, Đà Nẵng', '7:00 - 21:30', '/images/cuahang/a3.png', '0123456716', 16.068000, 108.220000),
(N'SuLi Coffee Đà Nẵng Phan Châu Trinh', N'73 Phan Châu Trinh, Hải Châu, Đà Nẵng', '7:00 - 21:30', '/images/cuahang/a4.png', '0123456717', 16.065000, 108.220000),
(N'SuLi Coffee Đà Nẵng Hoàng Diệu', N'102 Hoàng Diệu, Hải Châu, Đà Nẵng', '7:00 - 21:30', '/images/cuahang/a5.png', '0123456718', 16.060000, 108.210000),
(N'SuLi Coffee Đà Nẵng Nguyễn Tất Thành', N'99 Nguyễn Tất Thành, Thanh Khê, Đà Nẵng', '7:00 - 21:30', '/images/cuahang/a6.png', '0123456719', 16.070000, 108.190000),
(N'SuLi Coffee Cần Thơ Trần Hưng Đạo', N'54 Trần Hưng Đạo, Ninh Kiều, Cần Thơ', '7:00 - 21:30', '/images/cuahang/a7.png', '0123456720', 10.035000, 105.780000),
(N'SuLi Coffee Cần Thơ 30 Tháng 4', N'80 30 Tháng 4, Ninh Kiều, Cần Thơ', '7:00 - 21:30', '/images/cuahang/a8.png', '0123456721', 10.030000, 105.770000),
(N'SuLi Coffee Cần Thơ Mậu Thân', N'15 Mậu Thân, Ninh Kiều, Cần Thơ', '7:00 - 21:30', '/images/cuahang/a9.png', '0123456722', 10.035000, 105.765000),
(N'SuLi Coffee Cần Thơ Nguyễn Văn Cừ', N'99 Nguyễn Văn Cừ, Ninh Kiều, Cần Thơ', '7:00 - 21:30', '/images/cuahang/a10.png', '0123456723', 10.040000, 105.770000);



INSERT INTO Vouchers 
    (Code, DiscountAmount, DiscountPercentage, MinOrderAmount, ExpiryDate, IsActive, MaxUsage, Description)
VALUES 
    ('FREESHIP', 20000, NULL, 50000, '2025-04-30 23:59:59', 1, 100, N'Miễn phí vận chuyển cho đơn từ 50.000đ'),
    ('GIAM30K', 30000, NULL, 99000, '2025-04-30 23:59:59', 1, 100, N'Giảm ngay 30.000đ cho đơn từ 99.000đ'),
    ('GIAM20K', 20000, NULL, 60000, '2025-04-30 23:59:59', 1, 50, N'Giảm ngay 20.000đ cho đơn từ 60.000đ'),
    ('GIAM10KM', NULL, 10.00, 500000, '2025-04-30 23:59:59', 1, 200, N'Giảm 10% cho đơn từ 500.000đ'),
    ('GIAM30KM', NULL, 10.00, 250000, '2025-04-30 23:59:59', 1, 200, N'Giảm 10% cho đơn từ 250.000đ');


-- Thêm dữ liệu mẫu
INSERT INTO DeliveryAddresses (UserId, Address, IsDefault)
VALUES 
    (1, N'123 Đường Láng, Đống Đa, Hà Nội', 1),
    (1, N'456 Nguyễn Trãi, Thanh Xuân, Hà Nội', 0),
    (1, N'789 Lê Lợi, Quận 1, TP.HCM', 1);
GO



-- Bảng GioHang (Thêm dữ liệu mẫu cho giỏ hàng của người dùng)
INSERT INTO GioHang (Id, FoodId, SoLuong, SizeID, TotalPrice)
VALUES 
(1, 1, 2, 1, 90000),  -- User 1, Food 1 (Trà xanh espresso marble), Số lượng 2, Size Nhỏ, Tổng giá 90000
(1, 2, 1, 2, 56000),  -- User 1, Food 2 (Bạc xỉu lắc sữa yến mạch), Số lượng 1, Size Vừa, Tổng giá 56000 (50000 + 6000)
(2, 11, 3, 3, 144000), -- User 2, Food 11 (Trà sữa trân châu đường đen), Số lượng 3, Size Lớn, Tổng giá 144000 ( (35000 + 16000) * 3 với discount tính toán nếu cần)
(3, 7, 1, 1, 25000);   -- User 3, Food 7 (Cà phê sữa đá), Số lượng 1, Size Nhỏ, Tổng giá 25000
GO

-- Bảng GioHang_Topping (Thêm dữ liệu mẫu cho topping trong giỏ hàng)
INSERT INTO GioHang_Topping (GioHangID, ToppingID)
VALUES 
(1, 1),  -- GioHang 1, Topping 1 (Thạch Sương Sáo)
(1, 2),  -- GioHang 1, Topping 2 (Thạch Kim Quất)
(2, 3),  -- GioHang 2, Topping 3 (Thạch Cà Phê)
(3, 4);  -- GioHang 3, Topping 4 (Foam Phô Mai)
GO

-- Bảng Orders (Thêm dữ liệu mẫu cho đơn hàng)
INSERT INTO Orders (UserId, OrderDate, TotalAmount, PaymentMethodId, StatusId)
VALUES 
(1, GETDATE(), 146000, 1, 1),  -- User 1, Tổng tiền 146000 (từ GioHang ví dụ), Phương thức VN Pay, Trạng thái Đặt hàng thành công
(2, GETDATE(), 144000, 2, 2),  -- User 2, Tổng tiền 144000, Phương thức COD, Trạng thái Đang chuẩn bị đơn hàng
(3, GETDATE(), 25000, 1, 3),   -- User 3, Tổng tiền 25000, Phương thức VN Pay, Trạng thái Đang giao hàng
(4, GETDATE(), 50000, 2, 4);   -- User 4 (giả sử), Tổng tiền 50000, Phương thức COD, Trạng thái Giao hàng thành công
GO

-- Bảng OrderDetails (Thêm dữ liệu mẫu cho chi tiết đơn hàng)
INSERT INTO OrderDetails (OrderId, FoodId, SizeId, ToppingId, Quantity, Price)
VALUES 
(1, 1, 1, 1, 2, 45000),  -- Order 1, Food 1, Size Nhỏ, Topping 1, Số lượng 2, Giá 45000 mỗi cái
(1, 2, 2, NULL, 1, 50000), -- Order 1, Food 2, Size Vừa, Không topping, Số lượng 1, Giá 50000
(2, 11, 3, 3, 3, 35000),   -- Order 2, Food 11, Size Lớn, Topping 3, Số lượng 3, Giá 35000 mỗi cái
(3, 7, 1, NULL, 1, 25000); -- Order 3, Food 7, Size Nhỏ, Không topping, Số lượng 1, Giá 25000
GO

-- Kiểm tra dữ liệu bảng PhuongThucThanhToan
SELECT * FROM PhuongThucThanhToan;

-- Kiểm tra dữ liệu bảng Orders
SELECT * FROM Orders;

-- Kiểm tra dữ liệu bảng OrderDetails
SELECT * FROM OrderDetails;

-- Kiểm tra dữ liệu bảng Food
SELECT * FROM Food;

-- Kiểm tra dữ liệu bảng Size
SELECT * FROM Size;

-- Kiểm tra dữ liệu bảng Topping (lưu ý tên bảng là Topping, không phải Toppings)
SELECT * FROM Topping;

SELECT 
  o.OrderId,
  o.OrderDate,
  o.TotalAmount,
  u.FullName AS UserName,
  s.StatusName AS Status
FROM Orders o
INNER JOIN Users u ON o.UserId = u.Id
INNER JOIN OrderStatus s ON o.StatusId = s.StatusId
ORDER BY o.OrderDate DESC;

SELECT * FROM OrderStatus;


DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql += 'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.' +
               QUOTENAME(OBJECT_NAME(parent_object_id)) + 
               ' DROP CONSTRAINT ' + QUOTENAME(name) + ';' + CHAR(13)
FROM sys.foreign_keys;
EXEC sp_executesql @sql;

DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql += 'DROP TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(object_id)) + '.' + 
               QUOTENAME(name) + ';' + CHAR(13)
FROM sys.tables;
EXEC sp_executesql @sql;