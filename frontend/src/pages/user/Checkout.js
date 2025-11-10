import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { Row, Col, Alert, Spinner } from "react-bootstrap";
import addresses from "../../data/addresses.json";
import CheckoutForm from "./checkout/CheckoutForm";
import OrderSummary from "./checkout/OrderSummary";

const API = "http://localhost:5000";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const initialItems = location.state?.items || [];
  const resumeOrderId = location.state?.orderId || null;
  const [itemsState, setItemsState] = useState(initialItems);

  const [user, setUser] = useState({
    id: null,
    username: "",
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [baseStreet, setBaseStreet] = useState("");
  const [displayedStreet, setDisplayedStreet] = useState("");
  const addressData = addresses || [];
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const composedAddress = `${baseStreet}${
    selectedWard ? ", " + selectedWard : ""
  }${selectedDistrict ? ", " + selectedDistrict : ""}${
    selectedProvince ? ", " + selectedProvince : ""
  }`;
  const [payment, setPayment] = useState("COD");
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [userVouchers, setUserVouchers] = useState([]);
  const shipping = 20000;

  const isFromCart = itemsState.some((item) => item.GioHangID);
  const isSubmitted = useRef(false);
  const saveableStateRef = useRef();
  const initialSnapshotRef = useRef(null);
  const isDirtyRef = useRef(false);

  // --- Thêm state cho thông báo thành công ---
  const [successMessage, setSuccessMessage] = useState("");
  const [progress, setProgress] = useState(100);

  const apiFetch = useCallback(
    async (url, options = {}) => {
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
      if (!res.ok) throw new Error(data.message || `Lỗi ${res.status}`);
      return data;
    },
    [token, navigate]
  );

  // === useEffect load order, profile, vouchers ===
  useEffect(() => {
    if (!resumeOrderId || !token) return;
    const loadOrder = async () => {
      try {
        const res = await apiFetch(`/api/orders/${resumeOrderId}`);
        if (res.success && res.data) {
          setItemsState(res.data.items || []);
        }
      } catch (err) {
        console.error("LOAD ORDER ERROR:", err);
      }
    };
    loadOrder();
  }, [resumeOrderId, apiFetch]);

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
          setBaseStreet(data.data.Address || "");
          setDisplayedStreet(data.data.Address || "");
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
  }, [token, navigate, apiFetch]);

  useEffect(() => {
    const fetchUserVouchers = async () => {
      try {
        const res = await apiFetch("/api/profile/vouchers/my");
        if (res.success) {
          const available = res.data.filter((v) => !v.IsUsed);
          setUserVouchers(available);
        }
      } catch (err) {
        console.error("Lỗi lấy voucher người dùng:", err);
      }
    };
    fetchUserVouchers();
  }, [apiFetch]);

  const calculateItemPrice = useCallback((item) => {
    const base = item.DiscountPrice ?? item.Price ?? 0;
    const sizeExtra = item.Size?.ExtraPrice ?? 0;
    const toppingExtra = (item.Toppings || []).reduce(
      (s, t) => s + (t.ToppingPrice ?? 0),
      0
    );
    return base + sizeExtra + toppingExtra;
  }, []);

  const subtotal = itemsState.reduce((sum, it) => {
    const itemTotal = calculateItemPrice(it) * (it.SoLuong ?? 1);
    return sum + itemTotal;
  }, 0);

  const totalAfterDiscount = subtotal + shipping - discountAmount;

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

  const handlePlaceOrder = async () => {
    if (isProcessing) return;

    if (!user.fullName || !user.phone || !baseStreet) {
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
        newAddress: composedAddress,
        paymentMethodId,
        voucherCode: voucherCode.trim() || null,
      };

      if (isFromCart) {
        payload.selectedItems = itemsState.map((item) => item.GioHangID);
      } else {
        payload.orderItems = itemsState.map((item) => {
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
  // Thanh toán VNPAY: chuyển hướng sang trang VNPAY
  isSubmitted.current = true;
  window.location.href = data.Url;
  return;
}

if (data.success) {
  // COD hoặc VNPAY đã thanh toán xong (redirect về thành công)
  isSubmitted.current = true;
  localStorage.removeItem("pendingAttempt");

  setSuccessMessage(`Đặt hàng thành công! Mã đơn: ${data.orderId}`);
  setProgress(100);

  // Thanh tiến trình chạy 2s
  const interval = 20;
  const totalSteps = 1000 / interval;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    setProgress(100 - (step / totalSteps) * 100);
    if (step >= totalSteps) clearInterval(timer);
  }, interval);

  // Ẩn thông báo sau 2s và điều hướng
  setTimeout(() => {
    setSuccessMessage("");
    navigate("/successful", {
      state: {
        order: data.order || {
          id: data.orderId,
          totalPrice: totalAfterDiscount,
          createdAt: new Date().toISOString(),
        },
      },
    });
  }, 2000);
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

  useEffect(() => {
    saveableStateRef.current = {
      items: itemsState,
      address: composedAddress,
      paymentMethod: payment,
      token: token,
    };
  }, [itemsState, composedAddress, payment, token]);

  // --- Các useEffect khác vẫn giữ nguyên như bạn đã viết ---
  // handleBeforeUnload, saveToDb, v.v.

  // === RENDER ===
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
  if (itemsState.length === 0)
    return (
      <Alert variant="info" className="text-center py-5 container mt-5">
        Không có sản phẩm nào để thanh toán. Vui lòng quay lại giỏ hàng hoặc
        trang sản phẩm.
      </Alert>
    );

  return (
    <div
      className="checkout-container container py-5"
      style={{ paddingTop: 100 }}
    >
      {/* --- Thông báo thành công --- */}
      {successMessage && (
        <div className="success-banner">
          <span>{successMessage}</span>
          <div
            className="success-progress"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      <h2 className="checkout-title mb-4 text-center">Thanh toán</h2>

      <Row>
        <Col md={5}>
          <CheckoutForm
            user={user}
            setUser={setUser}
            baseStreet={baseStreet}
            setBaseStreet={setBaseStreet}
            displayedStreet={displayedStreet}
            selectedProvince={selectedProvince}
            setSelectedProvince={setSelectedProvince}
            selectedDistrict={selectedDistrict}
            setSelectedDistrict={setSelectedDistrict}
            selectedWard={selectedWard}
            setSelectedWard={setSelectedWard}
            addressData={addressData}
            voucherCode={voucherCode}
            setVoucherCode={setVoucherCode}
            userVouchers={userVouchers}
            payment={payment}
            setPayment={setPayment}
            error={error}
            isProcessing={isProcessing}
            handleApplyVoucher={handleApplyVoucher}
            handlePlaceOrder={handlePlaceOrder}
            isFromCart={isFromCart}
            itemsState={itemsState}
            setItemsState={setItemsState}
            apiFetch={apiFetch}
            calculateItemPrice={calculateItemPrice}
          />
        </Col>

        <Col md={7}>
          <OrderSummary
            itemsState={itemsState}
            setItemsState={setItemsState}
            calculateItemPrice={calculateItemPrice}
            subtotal={subtotal}
            shipping={shipping}
            discountAmount={discountAmount}
            totalAfterDiscount={totalAfterDiscount}
            apiFetch={apiFetch}
          />
        </Col>
      </Row>

      {/* CSS */}
      <style>{`
  /* --- Thông báo thành công --- */
.success-banner {
  position: fixed;
  top: 60px; /* không đè header */
  left: 0;
  width: 100%;
  background: linear-gradient(90deg, #dae4daff, #81c784); /* gradient nhẹ đẹp mắt */
  color: #fff;
  text-align: center;
  padding: 10px 0;
  font-weight: 600;
  font-size: 15px;
  z-index: 9999;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  border-radius: 0 0 8px 8px; /* bo góc dưới */
}

/* Thanh tiến trình tinh tế */
.success-progress {
  height: 4px;
  background: linear-gradient(90deg, #ebf3ebff, #c8e6c9);
  width: 100%;
  transition: width 2s linear;
  border-radius: 0 0 8px 8px;
}

`}</style>
    </div>
  );
}
