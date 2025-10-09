// frontend/pages/successful.jsx
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";

const API = "http://localhost:5000";

export default function Successful() {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  const apiFetch = async (url, options = {}) => {
    const headers = { "Content-Type": "application/json", ...options.headers };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API}${url}`, { ...options, headers });

    if (!res.ok) throw new Error(`Lỗi ${res.status}`);
    const data = await res.json();
    return data;
  };

  useEffect(() => {
    if (location.state?.order) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        setLoading(true);
        const data = await apiFetch("/api/orders/successful");
        setOrder(data.order);
      } catch (err) {
        setError(err.message || "Không thể lấy dữ liệu đơn hàng.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [navigate, token, location.state]);

  if (loading) return <div className="text-center py-5">Đang tải...</div>;
  if (error) return <div className="alert alert-danger text-center py-5">{error}</div>;
  if (!order) return <div className="text-center py-5">Không tìm thấy đơn hàng</div>;

  return (
    <div className="checkout-success-wrapper">
      <div className="checkout-success-popup">
        <div className="success-icon">✔</div>
        <h2>Đặt hàng thành công!</h2>
        <p>
          Mã đơn hàng: <strong>{order.id}</strong>
        </p>
        <p>Ngày đặt: {new Date(order.createdAt).toLocaleString()}</p>
        <p>Tổng tiền: {Number(order.totalPrice).toLocaleString("vi-VN")} ₫</p>
        <p>Kiểm tra danh sách đơn hàng của bạn để biết chi tiết.</p>
        <div className="button-group">
          <Button className="btn-home" onClick={() => navigate("/")}>
            Quay lại Trang chủ
          </Button>
          <Button className="btn-continue" onClick={() => navigate("/products")}>
            Tiếp tục mua sắm
          </Button>
        </div>
      </div>

      {/* CSS nội tuyến để mô phỏng giao diện Razor */}
      <style>{`
        body {
          background-image: url('${API}/images/nen4.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          font-family: 'Segoe UI', sans-serif;
        }
        .checkout-success-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          backdrop-filter: blur(4px);
        }
        .checkout-success-popup {
          background: rgba(255, 255, 255, 0.85);
          padding: 40px;
          border-radius: 15px;
          text-align: center;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          max-width: 500px;
          width: 90%;
        }
        .success-icon {
          font-size: 60px;
          color: #28a745;
          margin-bottom: 20px;
          animation: bounce 0.6s;
          transform: scale(1);
          transition: transform 0.3s ease-in-out;
        }
        h2 {
          color: #28a745;
          font-size: 28px;
          margin-bottom: 15px;
        }
        p {
          color: #333;
          font-size: 16px;
          margin-bottom: 10px;
        }
        .button-group {
          display: flex;
          justify-content: center;
          gap: 15px;
          flex-wrap: wrap;
        }
        .btn-home, .btn-continue {
          padding: 12px 20px;
          border: none;
          border-radius: 5px;
          font-size: 15px;
          cursor: pointer;
          color: #fff;
          transition: background-color 0.3s ease;
        }
        .btn-home { background-color: #6c757d; }
        .btn-home:hover { background-color: #5a6268; }
        .btn-continue { background-color: #28a745; }
        .btn-continue:hover { background-color: #218838; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
