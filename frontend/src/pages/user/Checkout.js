import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Form,
  Row,
  Col,
  Alert,
  Spinner,
  InputGroup,
  Dropdown,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { FaTicketAlt } from "react-icons/fa";
//import "../../styles/pages/Checkout.css";
const API = "http://localhost:5000";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

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
  const [voucherCode, setVoucherCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [userVouchers, setUserVouchers] = useState([]);
  const shipping = 20000;

  const isFromCart = items.some((item) => item.GioHangID);

  // API helper
  const apiFetch = async (url, options = {}) => {
    const headers = { "Content-Type": "application/json", ...options.headers };
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
    if (!res.ok) throw new Error(data.message || `Lỗi ${res.status}`);
    return data;
  };

  // Lấy thông tin user
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
        if (data?.success && data.data) {
          setUser({
            id: data.data.Id,
            username: data.data.Username || "",
            fullName: data.data.FullName || "",
            email: data.data.Email || "",
            phone: data.data.Phone || "",
            address: data.data.Address || "",
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

  useEffect(() => {
    const fetchUserVouchers = async () => {
      try {
        const res = await apiFetch("/api/profile/vouchers/my");
        if (res.success) {
          // Chỉ lấy voucher chưa dùng
          const available = res.data.filter((v) => !v.IsUsed);
          setUserVouchers(available);
        }
      } catch (err) {
        console.error("Lỗi lấy voucher người dùng:", err);
      }
    };
    fetchUserVouchers();
  }, [apiFetch]);

  // Tính giá 1 sản phẩm
  const calculateItemPrice = (item) => {
    const base = item.DiscountPrice ?? item.Price ?? 0;
    const sizeExtra = item.Size?.ExtraPrice ?? 0;
    const toppingExtra = (item.Toppings || []).reduce(
      (s, t) => s + (t.ToppingPrice ?? 0),
      0
    );
    return base + sizeExtra + toppingExtra;
  };

  // Tổng tiền trước khi áp dụng voucher
  const subtotal = items.reduce((sum, it) => {
    const itemTotal = calculateItemPrice(it) * (it.SoLuong ?? 1);
    return sum + itemTotal;
  }, 0);

  const totalAfterDiscount = subtotal + shipping - discountAmount;

  // Áp dụng voucher
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setError("Vui lòng nhập mã khuyến mại.");
      return;
    }
    try {
      setIsProcessing(true);
      setError("");

      const res = await apiFetch("/api/profile/apply", {
        method: "POST",
        body: JSON.stringify({ voucherCode, subtotal }),
      });

      if (res.success) {
        setDiscountAmount(res.discountAmount || 0);
        alert(
          `Áp dụng voucher thành công! Giảm ${(
            res.discountAmount || 0
          ).toLocaleString("vi-VN")} ₫`
        );
      } else {
        setDiscountAmount(0);
        throw new Error(res.message || "Voucher không hợp lệ hoặc hết hạn.");
      }
    } catch (err) {
      console.error("VOUCHER ERR:", err);
      setError(err.message);
      setDiscountAmount(0);
    } finally {
      setIsProcessing(false);
    }
  };

  // Đặt hàng
  const handlePlaceOrder = async () => {
    if (isProcessing) return;

    if (!user.fullName || !user.phone || !user.address) {
      setError(
        "Vui lòng điền đầy đủ Họ và tên, Số điện thoại và Địa chỉ giao hàng."
      );
      return;
    }

    try {
      setIsProcessing(true);
      setError("");

      const paymentMethodId = payment === "VNPAY" ? 1 : 2;

      const payload = {
        newAddress: user.address,
        paymentMethodId,
        voucherCode: voucherCode.trim() || null,
      };

      if (isFromCart) {
        payload.selectedItems = items.map((item) => item.GioHangID);
      } else {
        payload.orderItems = items.map((item) => {
          const unitPrice = calculateItemPrice(item);
          return {
            FoodId: item.FoodId || item.foodId,
            SizeID: item.Size?.SizeID || null,
            Quantity: item.SoLuong ?? 1,
            TotalPrice: unitPrice * (item.SoLuong ?? 1),
            ToppingIDs: (item.Toppings || []).map((t) => t.ToppingID),
          };
        });
      }

      const data = await apiFetch("/api/orders/place-order", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (data.success && data.Code === 1 && data.Url) {
        window.location.href = data.Url;
        return;
      }

      if (data.success) {
        alert("Đặt hàng thành công! Mã đơn: " + data.orderId);
        navigate("/successful", {
          state: {
            order: data.order || {
              id: data.orderId,
              totalPrice: totalAfterDiscount,
              createdAt: new Date().toISOString(),
            },
          },
        });
      } else {
        throw new Error(data.message || "Đặt hàng thất bại.");
      }
    } catch (err) {
      console.error("ORDER ERR:", err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-5">
        <Spinner animation="border" /> Đang tải thông tin cá nhân...
      </div>
    );
  if (error && !token)
    return (
      <Alert variant="danger" className="text-center py-5 container mt-5">
        {error}
        <button
          className="btn btn-primary mt-2"
          onClick={() => navigate("/login")}
        >
          Đăng nhập lại
        </button>
      </Alert>
    );
  if (items.length === 0)
    return (
      <Alert variant="info" className="text-center py-5 container mt-5">
        Không có sản phẩm nào để thanh toán. Vui lòng quay lại giỏ hàng hoặc
        trang sản phẩm.
      </Alert>
    );

  return (
    <div className="checkout-container container py-5">
      <h2 className="checkout-title mb-4 text-center">Thanh toán</h2>

      <Row>
        {/* LEFT - User Info */}
        <Col md={5}>
          <div className="checkout-box p-3 shadow-sm mb-4">
            <h4 className="mb-3">Thông tin người dùng & Thanh toán</h4>

            {error && <Alert variant="danger">{error}</Alert>}

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
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Địa chỉ giao hàng</Form.Label>
              <Form.Control
                type="text"
                value={user.address}
                onChange={(e) => setUser({ ...user, address: e.target.value })}
              />
            </Form.Group>

            {/* Voucher với icon + dropdown */}
            <Form.Group
              className="mb-3"
              style={{ position: "relative", zIndex: 2000 }}
            >
              <Form.Label>Mã khuyến mại</Form.Label>
              <InputGroup>
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip>Nhập mã voucher hoặc chọn từ danh sách</Tooltip>
                  }
                >
                  <InputGroup.Text style={{ fontSize: "18px" }}>
                    <FaTicketAlt />
                  </InputGroup.Text>
                </OverlayTrigger>

                <Form.Control
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Nhập mã voucher"
                />

                <Dropdown>
                  <Dropdown.Toggle split variant="outline-primary" />
                  <Dropdown.Menu
                    style={{
                      maxHeight: "250px",
                      overflow: "hidden",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                    }}
                  >
                    {userVouchers.length > 0 ? (
                      userVouchers.map((v) => (
                        <Dropdown.Item
                          key={v.UserVoucherId}
                          onClick={() => setVoucherCode(v.Code)}
                          style={{ whiteSpace: "normal", padding: "10px 15px" }}
                        >
                          {v.Code}{" "}
                          {v.DiscountAmount
                            ? `- ${v.DiscountAmount.toLocaleString("vi-VN")}₫`
                            : ""}
                          {v.DiscountPercentage
                            ? `- ${v.DiscountPercentage}%`
                            : ""}
                        </Dropdown.Item>
                      ))
                    ) : (
                      <Dropdown.Item disabled style={{ padding: "10px 15px" }}>
                        Không có voucher khả dụng
                      </Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown>

                <Button
                  variant="success"
                  onClick={handleApplyVoucher}
                  disabled={isProcessing || !voucherCode.trim()}
                >
                  Áp dụng
                </Button>
              </InputGroup>
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
                disabled={
                  isProcessing || !user.address || !user.fullName || !user.phone
                }
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

        {/* RIGHT - Cart */}
        <Col md={7}>
          <div className="checkout-box p-3 shadow-sm">
            <h4 className="mb-3">Đơn hàng</h4>
            <Table
              bordered
              hover
              responsive
              className="align-middle text-center"
            >
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
                  const itemTotal =
                    calculateItemPrice(item) * (item.SoLuong ?? 1);
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
                                {t.ToppingName} (+
                                {t.ToppingPrice.toLocaleString("vi-VN")} ₫)
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
              {discountAmount > 0 && (
                <>
                  Giảm giá: -{discountAmount.toLocaleString("vi-VN")} ₫ <br />
                </>
              )}
              <strong className="text-danger">
                Tổng cộng: {totalAfterDiscount.toLocaleString("vi-VN")} ₫
              </strong>
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
