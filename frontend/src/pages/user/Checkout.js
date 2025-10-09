import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";

const API = "http://localhost:5000";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Lấy dữ liệu từ state. Nếu là "Mua ngay", items sẽ chứa 1 sản phẩm với chi tiết đầy đủ.
  // Nếu là "Giỏ hàng", items sẽ chứa nhiều sản phẩm có GioHangID.
  const items = location.state?.items || [];

  const [user, setUser] = useState({
    id: null,
    username: "",
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [payment, setPayment] = useState("COD");
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  // Phí ship cứng 20k
  const shipping = 20000;

  // Kiểm tra xem luồng thanh toán có phải từ Giỏ hàng không
  // Nếu bất kỳ item nào có GioHangID, ta xem đây là luồng Giỏ hàng.
  const isFromCart = items.some(item => item.GioHangID);

  // Helper fetch với Authorization
  const apiFetch = async (url, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API}${url}`, { ...options, headers });

    if (res.status === 401) {
      localStorage.removeItem("token");
      navigate("/login");
      throw new Error("Token hết hạn hoặc không hợp lệ!");
    }
    
    const contentType = res.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
        if (res.status === 200) return {}; 
        throw new Error("Server trả về không phải JSON.");
    }

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || `Lỗi ${res.status}`);
    }

    return data;
  };

  useEffect(() => {
    if (!token) {
      setError("Vui lòng đăng nhập để tiếp tục!");
      navigate("/login");
      return;
    }
    
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await apiFetch("/api/profile");
        if (data?.success && data.user) {
          setUser({
            id: data.user.Id,
            username: data.user.Username || "",
            fullName: data.user.FullName || "",
            email: data.user.Email || "",
            phone: data.user.Phone || "",
            address: data.user.Address || "",
          });
          setError("");
        } else {
          throw new Error("Không tìm thấy thông tin người dùng.");
        }
      } catch (err) {
        console.error("FETCH PROFILE ERR:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  /**
   * Tính đơn giá của 1 item (chưa nhân số lượng)
   * Đơn giá = Giá cơ bản (có chiết khấu) + Giá phụ thêm size + Tổng giá topping
   */
  const calculateItemPrice = (item) => {
    // Giá cơ bản (DiscountPrice ưu tiên, nếu không có thì dùng Price)
    const base = item.DiscountPrice ?? item.Price ?? 0;
    // Giá phụ thêm của Size (nếu có)
    const sizeExtra = item.Size?.ExtraPrice ?? 0;
    // Tổng giá Topping (nếu có)
    const toppingExtra = (item.Toppings || []).reduce(
      (s, t) => s + (t.ToppingPrice ?? 0),
      0
    );
    return (base + sizeExtra + toppingExtra);
  }

  // Tổng tiền sản phẩm (chưa bao gồm phí ship)
  const subtotal = items.reduce((sum, it) => {
    // Nếu là luồng Giỏ hàng, dùng TotalPrice có sẵn trong item (đã được tính từ backend)
    // Nếu là luồng Mua ngay, phải tự tính lại đơn giá * số lượng
    const itemTotal = it.TotalPrice ?? (calculateItemPrice(it) * (it.SoLuong ?? 1));
    return sum + itemTotal;
  }, 0);

  const total = subtotal + shipping;


  // ------------------------------------------------------------------
  // ✅ HÀM XỬ LÝ ĐẶT HÀNG ĐÃ SỬA ĐỔI LỖI TotalPrice
  // ------------------------------------------------------------------
  const handlePlaceOrder = async () => {
    if (isProcessing) return;

    // VALIDATE CƠ BẢN
    if (!user.fullName || !user.phone || !user.address) {
        setError("Vui lòng điền đầy đủ Họ và tên, Số điện thoại và Địa chỉ giao hàng.");
        return;
    }

    try {
      setIsProcessing(true);
      setError("");

      const paymentMethodId = payment === "VNPAY" ? 1 : 2; // 1: VNPAY, 2: COD

      // 1. TẠO PAYLOAD CHUNG cho backend
      const payload = {
        newAddress: user.address, 
        paymentMethodId,
      };

      if (isFromCart) {
        // Luồng Giỏ hàng: Chỉ truyền mảng GioHangID
        payload.selectedItems = items.map(item => item.GioHangID);
      } else {
        // Luồng Mua ngay: Truyền chi tiết sản phẩm để backend tạo OrderItem
        payload.orderItems = items.map(item => {
          const unitPrice = calculateItemPrice(item); // Đơn giá (base + size + topping)
          const totalItemPrice = unitPrice * (item.SoLuong ?? 1); // Tổng tiền của item

          return {
            FoodId: item.FoodId || item.foodId,
            SizeID: item.Size?.SizeID || null,
            Quantity: item.SoLuong ?? 1,
            // ✅ SỬA LỖI: Truyền TotalPrice = Đơn giá x Số lượng
            TotalPrice: totalItemPrice, 
            // Nếu có topping, cần thêm mảng ToppingID:
            ToppingIDs: (item.Toppings || []).map(t => t.ToppingID) 
          }
        });
      }

      // 2. GỌI API
      const data = await apiFetch("/api/orders/place-order", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // === LOGIC XỬ LÝ ĐIỀU HƯỚNG VNPay ===
      if (data.success && data.Code === 1 && data.Url) {
        // Nếu là VNPAY, chuyển hướng ngay lập tức
        window.location.href = data.Url;
        return; 
      }
      // ======================================
        
      // Xử lý cho các trường hợp COD (Code=2) hoặc VNPAY thành công sau callback
      if (data.success) {
        alert("Đặt hàng thành công! Mã đơn: " + data.orderId);
        navigate("/successful", { 
          state: { 
            order: data.order || { 
              id: data.orderId, 
              totalPrice: total, 
              createdAt: new Date().toISOString() 
            } 
          } 
        });
      } else {
          throw new Error(data.message || "Đặt hàng thất bại: Lỗi không xác định.");
      }

    } catch (err) {
      console.error("ORDER ERR:", err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };


  // ------------------------------------------------------------------
  // ✅ RENDER
  // ------------------------------------------------------------------

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /> Đang tải thông tin cá nhân...</div>;
  if (error && !token) 
    return (
      <Alert variant="danger" className="text-center py-5 container mt-5">
        {error}
        <button className="btn btn-primary mt-2" onClick={() => navigate("/login")}>
          Đăng nhập lại
        </button>
      </Alert>
    );
  if (items.length === 0) {
    return (
      <Alert variant="info" className="text-center py-5 container mt-5">
        Không có sản phẩm nào để thanh toán. Vui lòng quay lại giỏ hàng hoặc trang sản phẩm.
      </Alert>
    );
  }


  return (
    <div className="checkout-container container py-5">
      <h2 className="checkout-title mb-4 text-center">Thanh toán</h2>

      <Row>
        {/* LEFT - User Info */}
        <Col md={5}>
          <div className="checkout-box p-3 shadow-sm mb-4">
            <h4 className="mb-3">Thông tin người dùng & Thanh toán</h4>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* Giữ nguyên Form Inputs */}
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control type="text" value={user.username} disabled />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Họ và tên</Form.Label>
              <Form.Control
                type="text"
                value={user.fullName}
                onChange={(e) => setUser({ ...user, fullName: e.target.value })}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={user.email} disabled />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Số điện thoại</Form.Label>
              <Form.Control
                type="text"
                value={user.phone}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Địa chỉ giao hàng</Form.Label>
              <Form.Control
                type="text"
                value={user.address}
                onChange={(e) => setUser({ ...user, address: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phương thức thanh toán</Form.Label>
              <Form.Select
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
              >
                <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                <option value="VNPAY">VNPAY</option>
              </Form.Select>
            </Form.Group>

            <div className="mt-4 text-end">
              <Button
                variant="success"
                className="place-order-btn"
                onClick={handlePlaceOrder}
                disabled={isProcessing || !user.address || !user.fullName || !user.phone}
              >
                {isProcessing ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />{" "}
                    Đang xử lý...
                  </>
                ) : (
                  "Xác nhận đặt hàng"
                )}
              </Button>
            </div>
          </div>
        </Col>

        {/* RIGHT - Cart Info */}
        <Col md={7}>
          <div className="checkout-box p-3 shadow-sm">
            <h4 className="mb-3">Đơn hàng</h4>
            <Table bordered hover responsive className="align-middle text-center">
              <thead className="table-dark">
                <tr>
                  <th>Hình ảnh</th>
                  <th>Sản phẩm</th>
                  <th>Size</th>
                  <th>Topping</th>
                  <th>Số lượng</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  // Sử dụng TotalPrice nếu có (luồng Giỏ hàng), nếu không thì tính lại (luồng Mua ngay)
                  const itemTotal = item.TotalPrice ?? (calculateItemPrice(item) * (item.SoLuong ?? 1));
                  
                  // Key sử dụng GioHangID nếu có, nếu không thì dùng index
                  const key = item.GioHangID || index; 

                  return (
                    <tr key={key}>
                      <td>
                        <img
                          src={
                            item.ImageURL
                              ? `${API}${item.ImageURL}`
                              : `${API}/images/no-image.png`
                          }
                          alt={item.FoodName}
                          className="checkout-img"
                        />
                      </td>
                      <td className="text-start">{item.FoodName}</td>
                      <td>{item.Size?.SizeName || "Không có"}</td>
                      <td>
                        {item.Toppings && item.Toppings.length > 0
                          ? item.Toppings.map((t) => (
                              <div key={t.ToppingID}>
                                {t.ToppingName} (+{t.ToppingPrice.toLocaleString("vi-VN")} ₫)
                              </div>
                            ))
                          : "Không có"}
                      </td>
                      <td>{item.SoLuong}</td>
                      <td>{itemTotal.toLocaleString("vi-VN")} ₫</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>

            <h5 className="text-end">
              Tạm tính: {subtotal.toLocaleString("vi-VN")} ₫ <br />
              Phí ship: {shipping.toLocaleString("vi-VN")} ₫ <br />
              <strong className="text-danger">Tổng cộng: {total.toLocaleString("vi-VN")} ₫</strong>
            </h5>
          </div>
        </Col>
      </Row>

      <style>{`
        .checkout-container { background-color: #fff; }
        .checkout-title { color: #e91e63; font-weight: 700; letter-spacing: 1px; }
        .checkout-box { background: #fafafa; border-radius: 12px; }
        .checkout-img { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; }
        .place-order-btn { background-color: #e91e63; border: none; font-weight: 600; transition: all 0.2s ease-in-out; }
        .place-order-btn:hover { background-color: #d81b60; transform: scale(1.03); }
      `}</style>
    </div>
  );
}