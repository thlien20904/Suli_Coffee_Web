import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";

// Định nghĩa API base URL từ biến môi trường hoặc mặc định
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

export default function VnpayReturn() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null); // Lưu trữ response từ backend
  const [error, setError] = useState(null); // Lưu trữ thông báo lỗi
  const location = useLocation(); // Lấy query params từ URL
  const navigate = useNavigate();

  useEffect(() => {
    // Lấy toàn bộ query string từ URL (vnp_...)
    const queryParams = location.search;

    if (!queryParams) {
      setError("Không tìm thấy dữ liệu phản hồi từ VNPay.");
      setLoading(false);
      return;
    }

    const fetchVnpayResult = async () => {
      try {
        // Gọi API backend để xử lý và xác thực phản hồi từ VNPay
        const response = await axios.get(
          `${API_BASE_URL}/api/orders/vnpay-return${queryParams}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Gửi token JWT nếu cần
            },
          }
        );

        // Kiểm tra phản hồi từ backend
        if (response.data.success) {
          setResult(response.data); // Lưu kết quả thành công
        } else {
          // Lỗi từ backend (ví dụ: chữ ký không hợp lệ, mã lỗi VNPay)
          setError(
            response.data.message ||
              "Thanh toán thất bại, vui lòng kiểm tra lại thông tin giao dịch."
          );
        }
      } catch (err) {
        console.error("Lỗi khi gọi API VNPay:", err.response?.data || err);
        // Xử lý lỗi kết nối hoặc lỗi server
        setError(
          err.response?.data?.message ||
            "Lỗi kết nối đến máy chủ. Không thể xác nhận kết quả thanh toán."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVnpayResult();
  }, [location.search]);

  // Hiển thị giao diện loading khi đang gọi API
  if (loading) {
    return (
      <Container
        className="py-5 text-center"
        style={{ marginTop: "70px", minHeight: "50vh" }}
      >
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang xử lý kết quả thanh toán từ VNPay...</p>
      </Container>
    );
  }

  // Xác định trạng thái giao dịch
  const isSuccess = result?.success === true;
  const displayText = isSuccess ? result.message : error;
  const displayAmount = result?.ThanhToanThanhCong; // Số tiền thanh toán từ backend
  const orderId = result?.orderId; // Mã đơn hàng từ backend

  return (
    <Container
      className="product_section_container"
      style={{ marginTop: "80px", marginBottom: "50px", minHeight: "60vh" }}
    >
      <Row className="justify-content-center">
        <Col md={8} className="text-center">
          <Card className="shadow-sm p-4" style={{ borderRadius: "15px" }}>
            {/* Icon minh họa */}
            <div className="mb-4">
              <FontAwesomeIcon
                icon={isSuccess ? faCheckCircle : faExclamationCircle}
                style={{
                  fontSize: "60px",
                  color: isSuccess ? "#28a745" : "#dc3545",
                }}
              />
            </div>

            {/* Tiêu đề */}
            <h2
              className={isSuccess ? "text-success mb-3" : "text-danger mb-3"}
            >
              {isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại!"}
            </h2>

            {/* Thông tin số tiền thanh toán */}
            {displayAmount && <p className="lead">{displayAmount}</p>}

            {/* Mã đơn hàng */}
            {orderId && (
              <p className="text-muted">
                Mã đơn hàng của bạn: <strong>#{orderId}</strong>
              </p>
            )}

            {/* Nội dung kết quả hoặc lỗi */}
            {displayText && (
              <p className={isSuccess ? "text-dark" : "text-danger"}>
                {displayText}
              </p>
            )}

            {/* Nút hành động */}
            <div className="mt-4 d-flex justify-content-center gap-2">
              <Button variant="primary" onClick={() => navigate("/")}>
                Quay lại trang chủ
              </Button>
              {orderId && (
                <Button
                  className="btn-continue"
                  onClick={() => navigate("/products")}
                >
                  Tiếp tục mua sắm
                </Button>
              )}
              {!isSuccess && (
                <Button
                  variant="warning"
                  onClick={() => navigate("/checkout")} // Quay lại trang checkout để thử lại
                >
                  Thử lại thanh toán
                </Button>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
