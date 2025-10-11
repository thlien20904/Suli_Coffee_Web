import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../../../styles/components/admin/AssignVoucher.css";

const AssignVoucher = () => {
  const [users, setUsers] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState("");
  const [loading, setLoading] = useState(true);

  const API_USER = "http://localhost:5000/api/admin/users";
  const API_VOUCHER = "http://localhost:5000/api/admin/voucher";
  const API_ASSIGN = "http://localhost:5000/api/admin/voucher/assign";
  const API_ASSIGNED = "http://localhost:5000/api/admin/voucher/assigned";
  const API_ASSIGN_ALL = "http://localhost:5000/api/admin/voucher/assign/all"; // ✅ thêm

  // ================== FETCH DATA ==================
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [userRes, voucherRes, assignedRes] = await Promise.all([
          axios.get(API_USER),
          axios.get(API_VOUCHER),
          axios.get(API_ASSIGNED),
        ]);

        setUsers(userRes.data.data || []);
        setVouchers(voucherRes.data.data || []);
        setAssigned(assignedRes.data.data || []);
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
        Swal.fire("Lỗi", "Không thể tải dữ liệu từ server", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // ================== CẤP CHO 1 USER ==================
  const handleAssign = async () => {
    if (!selectedUser || !selectedVoucher) {
      Swal.fire("Thiếu thông tin", "Vui lòng chọn user và voucher!", "warning");
      return;
    }

    try {
      const res = await axios.post(API_ASSIGN, {
        UserId: parseInt(selectedUser),
        VoucherId: parseInt(selectedVoucher),
      });

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "🎉 Thành công!",
          text: res.data.message,
          showConfirmButton: false,
          timer: 1200,
        });
        setSelectedUser("");
        setSelectedVoucher("");

        const assignedRes = await axios.get(API_ASSIGNED);
        setAssigned(assignedRes.data.data || []);
      } else {
        Swal.fire(
          "Thông báo",
          res.data.message || "Không thể cấp voucher",
          "info"
        );
      }
    } catch (err) {
      console.error("❌ Lỗi khi cấp voucher:", err);
      Swal.fire("Lỗi", "Không thể kết nối đến server", "error");
    }
  };

  // ================== 🎯 CẤP CHO TẤT CẢ NGƯỜI DÙNG ==================
  const handleAssignAll = async () => {
    if (!selectedVoucher) {
      Swal.fire("Thiếu thông tin", "Vui lòng chọn voucher!", "warning");
      return;
    }

    Swal.fire({
      title: "Xác nhận?",
      text: "Bạn có chắc muốn cấp voucher này cho TẤT CẢ người dùng?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Có, cấp ngay!",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await axios.post(API_ASSIGN_ALL, {
            VoucherId: parseInt(selectedVoucher),
          });

          if (res.data.success) {
            Swal.fire({
              icon: "success",
              title: "🎁 Thành công!",
              text: res.data.message,
              showConfirmButton: false,
              timer: 1500,
            });

            const assignedRes = await axios.get(API_ASSIGNED);
            setAssigned(assignedRes.data.data || []);
          } else {
            Swal.fire("Thông báo", res.data.message || "Không thể cấp", "info");
          }
        } catch (err) {
          console.error("❌ Lỗi khi cấp tất cả:", err);
          Swal.fire("Lỗi", "Không thể kết nối đến server", "error");
        }
      }
    });
  };

  if (loading) return <p className="loading-text">⏳ Đang tải dữ liệu...</p>;

  // ================== UI ==================
  return (
    <div className="assign-container">
      <h3 className="assign-title">🎁 Cấp Voucher cho Người Dùng</h3>

      <div className="assign-card">
        <div className="form-group">
          <label>👤 Chọn User:</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">-- Chọn user --</option>
            {users.map((u) => (
              <option key={u.Id} value={u.Id}>
                {u.FullName} (ID: {u.Id})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>🎫 Chọn Voucher:</label>
          <select
            value={selectedVoucher}
            onChange={(e) => setSelectedVoucher(e.target.value)}
          >
            <option value="">-- Chọn voucher --</option>
            {vouchers.map((v) => (
              <option key={v.VoucherId} value={v.VoucherId}>
                {v.Code} - {v.Description}
              </option>
            ))}
          </select>
        </div>

        <div className="btn-group">
          <button className="btn-green" onClick={handleAssign}>
            <i className="fas fa-gift"></i> Cấp Voucher
          </button>

          <button className="btn-blue" onClick={handleAssignAll}>
            <i className="fas fa-users"></i> Cấp cho tất cả
          </button>
        </div>
      </div>

      {/* ================== BẢNG HIỂN THỊ VOUCHER ĐÃ CẤP ================== */}
      <h4 className="table-title">📋 Danh sách Voucher đã cấp</h4>

      {assigned.length === 0 ? (
        <p className="no-data">Chưa có voucher nào được cấp.</p>
      ) : (
        <div className="table-wrapper">
          <table className="assign-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Người Dùng</th>
                <th>Voucher</th>
                <th>Mô tả</th>
                <th>Ngày cấp</th>
                <th>Hết hạn</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {assigned.map((item) => (
                <tr key={item.AssignedId}>
                  <td>{item.AssignedId}</td>
                  <td>{item.FullName}</td>
                  <td>{item.VoucherCode}</td>
                  <td>{item.Description}</td>
                  <td>
                    {new Date(item.AssignedDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td>
                    {item.ExpiredDate
                      ? new Date(item.ExpiredDate).toLocaleDateString("vi-VN")
                      : "—"}
                  </td>
                  <td>
                    <span
                      className={
                        item.IsUsed
                          ? "status used"
                          : new Date(item.ExpiredDate) < new Date()
                          ? "status expired"
                          : "status active"
                      }
                    >
                      {item.IsUsed
                        ? "Đã dùng"
                        : new Date(item.ExpiredDate) < new Date()
                        ? "Hết hạn"
                        : "Còn hiệu lực"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssignVoucher;
