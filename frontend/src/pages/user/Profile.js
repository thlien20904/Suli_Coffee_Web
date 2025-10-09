// frontend/src/pages/user/Profile.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/pages/profile.css";

const API_BASE = "http://localhost:5000";

function Profile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token"); // Token từ login

  const [activeSection, setActiveSection] = useState("profile");
  const [userState, setUserState] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    email: "",
    phone: "",
    address: "",
  });
  const [avatar, setAvatar] = useState(`${API_BASE}/images/no-image.png`);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState("");

  // ✅ Helper fetch với Authorization
  const apiFetch = async (url, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });

    const contentType = res.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      throw new Error("Server trả về không phải JSON (kiểm tra backend).");
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      throw new Error(data.message || `Lỗi ${res.status}`);
    }

    return res.json();
  };

  // Fetch user
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchUser = async () => {
      try {
        setLoading(true);
        const data = await apiFetch("/api/profile");
        if (data.success && data.user) {
          setUserState(data.user);
          setFormData({
            username: data.user.Username || "",
            fullname: data.user.FullName || "",
            email: data.user.Email || "",
            phone: data.user.Phone || "",
            address: data.user.Address || "",
          });
          setAvatar(
            data.user.AvatarUrl
              ? `${API_BASE}${data.user.AvatarUrl}`
              : `${API_BASE}/images/no-image.png`
          );
          setError("");
        } else {
          throw new Error("Không tìm thấy user");
        }
      } catch (err) {
        console.error("FETCH USER ERROR:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, navigate]);

  const showSection = (section) => {
    setActiveSection(section);
    if (section === "orders") fetchOrders("cho-xac-nhan", 1);
  };

  const fetchOrders = async (tab, page) => {
    setLoadingOrders(true);
    try {
      const data = await apiFetch(`/api/profile/orders?page=${page}&pageSize=5&tab=${tab}`);
      if (data.success) {
        setOrders(data.orders);
        setPagination({ currentPage: data.currentPage, totalPages: data.totalPages });
      } else {
        setOrders([]);
      }
      setError("");
    } catch (err) {
      console.error("FETCH ORDERS ERROR:", err);
      setError(err.message);
    }
    setLoadingOrders(false);
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Hủy đơn hàng này?")) return;
    try {
      const data = await apiFetch("/api/profile/orders/cancel", {
        method: "POST",
        body: JSON.stringify({ orderId }),
      });
      if (data.success) {
        alert(data.message);
        fetchOrders("cho-xac-nhan", pagination.currentPage);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("CANCEL ERROR:", err);
      alert("Lỗi hủy đơn hàng!");
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
      setFormData({ ...formData, avatarFile: file });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!userState || !token) return;

    // Avatar
    if (formData.avatarFile) {
      const fd = new FormData();
      fd.append("id", userState.Id);
      fd.append("AvatarFile", formData.avatarFile);
      const avatarRes = await fetch(`${API_BASE}/api/profile/avatar`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: fd,
});
const avatarData = await avatarRes.json();
if (!avatarRes.ok || !avatarData.success) {
  alert("Lỗi upload avatar: " + avatarData.message);
  return;
}

// ✅ Lưu token mới để khi reload không mất avatar
if (avatarData.token) {
  localStorage.setItem("token", avatarData.token);
}

setAvatar(`${API_BASE}${avatarData.avatarUrl}`);

    }

    // Các field
    const updates = [
      { field: "Username", value: formData.username },
      { field: "FullName", value: formData.fullname },
      { field: "Email", value: formData.email },
      { field: "Phone", value: formData.phone },
      { field: "Address", value: formData.address },
    ];

    try {
      const results = await Promise.all(
        updates.map((u) =>
          apiFetch("/api/profile/update", {
            method: "POST",
            body: JSON.stringify({ id: userState.Id, field: u.field, value: u.value }),
          })
        )
      );
      const allSuccess = results.every((r) => r.success);
      if (allSuccess) {
        alert("Cập nhật thành công!");
        window.location.reload();
      } else {
        alert("Lỗi: " + results.filter((r) => !r.success).map((r) => r.message).join("\n"));
      }
    } catch (err) {
      console.error("UPDATE ERROR:", err);
      alert("Lỗi cập nhật!");
    }
  };

  if (loading) return <div className="text-center py-5">Đang tải...</div>;
  if (error)
    return (
      <div className="alert alert-danger text-center py-5">
        {error}
        <button className="btn btn-primary mt-2" onClick={() => window.location.reload()}>
          Thử lại
        </button>
      </div>
    );
  if (!userState) return <div className="text-center py-5">Không tìm thấy user</div>;

  return (
    <div className="profile-container">
      {/* Sidebar */}
      <div className="profile-sidebar">
        <div className="profile-header">
          <img src={avatar} alt="Avatar" className="rounded-circle" width="80" />
          <h5>{userState.Username}</h5>
          <p>
            {userState.CreatedDate
              ? new Date(userState.CreatedDate).toLocaleDateString()
              : "N/A"}
          </p>
        </div>
        <ul className="profile-menu">
          <li>
            <button onClick={() => showSection("orders")}>📦 Orders</button>
          </li>
          <li>
            <button onClick={() => showSection("profile")}>⚙ Profile</button>
          </li>
          <li>
            <button onClick={() => showSection("vouchers")}>🎁 Vouchers</button>
          </li>
          <li>
            <button onClick={() => showSection("notifications")}>🔔 Notifications</button>
          </li>
          <li>
            <button onClick={() => showSection("help")}>❓ Help</button>
          </li>
        </ul>
      </div>
      {/* Content */}
      <div className="profile-content">
        {activeSection === "profile" && (
          <form onSubmit={handleUpdate} className="p-4">
            <div className="mb-3">
              <label>Avatar</label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.gif,.webp"
                onChange={handleAvatarChange}
                className="form-control"
              />
              <img src={avatar} alt="Preview" width="150" className="mt-2" />
            </div>
            <div className="mb-3">
              <label>Username</label>
              <input
                type="text"
                className="form-control"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                autoComplete="username"
              />
            </div>
            <div className="mb-3">
              <label>Full Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.fullname}
                onChange={(e) =>
                  setFormData({ ...formData, fullname: e.target.value })
                }
                autoComplete="name"
              />
            </div>
            <div className="mb-3">
              <label>Email</label>
              <input
                type="email"
                className="form-control"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                autoComplete="email"
              />
            </div>
            <div className="mb-3">
              <label>Phone</label>
              <input
                type="tel"
                className="form-control"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                autoComplete="tel"
              />
            </div>
            <div className="mb-3">
              <label>Address</label>
              <textarea
                className="form-control"
                rows="3"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                autoComplete="street-address"
              ></textarea>
            </div>
            <button type="submit" className="btn btn-primary">
              Update Profile
            </button>
          </form>
        )}
        {activeSection === "orders" && (
          <div className="p-4">
            <h4>Orders List</h4>
            {loadingOrders ? (
              <p>Đang tải...</p>
            ) : (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? (
                    orders.map((o) => (
                      <tr key={o.OrderId}>
                        <td>{o.OrderId}</td>
                        <td>
                          {o.CreatedAt
                            ? new Date(o.CreatedAt).toLocaleString()
                            : "N/A"}
                        </td>
                        <td>
                          {o.Total
                            ? o.Total.toLocaleString("vi-VN") + " ₫"
                            : "N/A"}
                        </td>
                        <td>{o.TenPhuongThuc || o.PaymentMethod || "N/A"}</td>
                        <td>
                          <span className="badge bg-secondary">
                            {o.StatusName || "N/A"}
                          </span>
                        </td>
                        <td>
                          {(o.StatusId === 1 || o.StatusId === 2) && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => cancelOrder(o.OrderId)}
                            >
                              Hủy
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center">
                        Chưa có đơn hàng
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
            {pagination.totalPages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <button
                  className="btn btn-outline-secondary me-2"
                  disabled={pagination.currentPage === 1}
                  onClick={() =>
                    fetchOrders("cho-xac-nhan", pagination.currentPage - 1)
                  }
                >
                  Trước
                </button>
                <span className="align-self-center">
                  Trang {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  className="btn btn-outline-secondary ms-2"
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() =>
                    fetchOrders("cho-xac-nhan", pagination.currentPage + 1)
                  }
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )}
        {activeSection === "vouchers" && <p className="p-4">Chưa có voucher.</p>}
        {activeSection === "notifications" && (
          <p className="p-4">Chưa có thông báo.</p>
        )}
        {activeSection === "help" && <p className="p-4">Liên hệ: hi@sulicoffee.vn</p>}
      </div>
    </div>
  );
}

export default Profile;
