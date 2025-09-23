// src/pages/admin/AdminDashboard.js
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "../../styles/pages/AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  useEffect(() => {
    if (!user?.token || user.role !== "admin") {
      // Nếu không có token hoặc không phải admin thì quay về login
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-dark text-white">
        <Spinner animation="border" variant="light" />
        <span className="ms-2">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="admin-dashboard text-white d-flex justify-content-center align-items-center vh-100">
      <h1>🎉 Chào mừng đến với trang Admin 🎉</h1>
    </div>
  );
}

export default AdminDashboard;
