// frontend/src/pages/user/profile/OrderDetail.js (file mới, cùng cấp với OrdersList)
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { buildApiUrl } from "../../../utils/apiConfig";
import Swal from "sweetalert2";
import "../../../styles/pages/orderdetail.css"; // Giả sử có CSS tương tự orderslist.css

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch chi tiết đơn hàng (giả sử API /api/profile/orders/:id tồn tại)
  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(buildApiUrl(`/api/profile/orders/${orderId}`), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setOrder(res.data.data);
        } else {
          setError(res.data.message || "Không tìm thấy đơn hàng");
        }
      } catch (err) {
        console.error("Fetch Order Detail Error:", err);
        setError("Lỗi khi tải chi tiết đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const handleBack = () => {
    navigate("/profile/orders");
  };

  if (loading) return <div className="text-center py-5">Đang tải chi tiết đơn hàng...</div>;
  if (error || !order) return (
    <div className="alert alert-danger text-center py-5">
      {error || "Không tìm thấy đơn hàng"}
      <button className="btn btn-primary mt-2" onClick={handleBack}>Quay lại</button>
    </div>
  );

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold">Chi tiết đơn hàng #{order.OrderId}</h4>
        <button className="btn btn-secondary" onClick={handleBack}>Quay lại danh sách</button>
      </div>

      {/* Thông tin cơ bản */}
      <div className="row mb-4">
        <div className="col-md-6">
          <strong>Ngày đặt hàng:</strong> {new Date(order.OrderDate).toLocaleString("vi-VN")}
        </div>
        <div className="col-md-6">
          <strong>Phương thức thanh toán:</strong> {order.PaymentMethod || "N/A"}
        </div>
        <div className="col-md-6">
          <strong>Trạng thái đơn hàng:</strong> <span className={`badge bg-${order.StatusId === 4 ? 'success' : order.StatusId === 5 ? 'danger' : 'warning'}`}>{order.Status}</span>
        </div>
        <div className="col-md-6">
          <strong>Trạng thái thanh toán:</strong> <span className={`badge bg-${order.PaymentStatusId === 1 ? 'success' : 'danger'}`}>{order.PaymentStatus}</span>
        </div>
        <div className="col-12">
          <strong>Tổng tiền:</strong> {order.TotalAmount.toLocaleString("vi-VN")} ₫
        </div>
      </div>

      {/* Địa chỉ giao hàng (giả sử order có field Address hoặc từ user) */}
      {order.Address && (
        <div className="mb-4 p-3 border rounded">
          <h6><strong>Địa chỉ giao hàng:</strong></h6>
          <p>{order.Address}, {order.Ward}, {order.District}, {order.Province}</p>
          <p><strong>Người nhận:</strong> {order.ReceiverName || "N/A"} | <strong>SĐT:</strong> {order.Phone || "N/A"}</p>
        </div>
      )}

      {/* Timeline trạng thái */}
      <div className="mb-4">
        <h6><strong>Tiến trình đơn hàng:</strong></h6>
        <div className="progress-timeline">
          {/* Giả sử timeline dựa trên StatusId, bạn có thể customize */}
          <div className="step completed">Đặt hàng thành công</div>
          {order.StatusId >= 2 && <div className="step completed">Chuẩn bị đơn</div>}
          {order.StatusId >= 3 && <div className="step completed">Đang giao</div>}
          {order.StatusId >= 4 && <div className="step completed">Giao thành công</div>}
          {order.StatusId === 5 && <div className="step failed">Đã hủy</div>}
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="mb-4">
        <h6><strong>Danh sách sản phẩm:</strong></h6>
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Chi tiết</th>
              <th>Số lượng</th>
              <th>Đơn giá</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.OrderDetails.map((detail, idx) => (
              <tr key={idx}>
                <td>{detail.FoodName}</td>
                <td>
                  {detail.SizeName && `Kích cỡ: ${detail.SizeName}`}<br />
                  {detail.Toppings && detail.Toppings.length > 0 && (
                    <small className="text-muted">Topping: {detail.Toppings.map(t => t.ToppingName).join(", ")}</small>
                  )}
                </td>
                <td>{detail.Quantity}</td>
                <td>{detail.Price.toLocaleString("vi-VN")} ₫</td>
                <td>{(detail.Price * detail.Quantity).toLocaleString("vi-VN")} ₫</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan="4" className="text-end">Tổng cộng:</th>
              <th>{order.TotalAmount.toLocaleString("vi-VN")} ₫</th>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Nút hành động nếu cần (e.g., hủy nếu có thể) */}
      {order.StatusId === 1 && (
        <div className="text-end">
          <button className="btn btn-warning" onClick={() => {/* Gọi cancelOrder như OrdersList */}}>
            Hủy đơn hàng
          </button>
        </div>
      )}
    </div>
  );
}