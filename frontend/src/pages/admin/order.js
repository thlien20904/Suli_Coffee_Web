// src/pages/admin/Order.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../../styles/components/admin/order.css";

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/orders", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setOrders(res.data.data);
      setFiltered(res.data.data);
    } catch (err) {
      console.error("❌ Lỗi fetch orders:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // apply filter when click "Lọc"
  const applyFilter = () => {
    let result = [...orders];

    result = result.filter(
      (item) =>
        item.UserName.toLowerCase().includes(search.toLowerCase()) ||
        String(item.OrderId).includes(search)
    );

    result = result.filter((item) => {
      if (!startDate && !endDate) return true;
      const d = new Date(item.OrderDate);
      const from = startDate ? new Date(startDate) : null;
      const to = endDate ? new Date(endDate) : null;
      return (!from || d >= from) && (!to || d <= to);
    });

    result = result.sort((a, b) => {
      switch (sort) {
        case "newest":
          return new Date(b.OrderDate) - new Date(a.OrderDate);
        case "oldest":
          return new Date(a.OrderDate) - new Date(b.OrderDate);
        case "high":
          return b.TotalAmount - a.TotalAmount;
        case "low":
          return a.TotalAmount - b.TotalAmount;
        default:
          return 0;
      }
    });

    setFiltered(result);
    setCurrentPage(1);
  };

  // update status
  // update status
  const updateStatus = async (id, statusId) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/admin/orders/${id}/status`,
        { statusId }, // gửi id trạng thái
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: res.data.message || "Cập nhật trạng thái thành công!",
          showConfirmButton: true, // 👉 Luôn hiện nút OK
          timer: 1000,

          timerProgressBar: true,
        }).then(() => {
          fetchData(); // refresh danh sách
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: res.data.message || "Không thể cập nhật trạng thái",
          showConfirmButton: true,
          timer: 1000,

          timerProgressBar: true,
        });
      }
    } catch (err) {
      Swal.fire("Lỗi", "Không thể kết nối server", "error");
    }
  };

  // pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pageData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const changePage = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  return (
    <div className="order-page">
      {/* Filter */}
      <div className="order-filter">
        <input
          className="search-box"
          type="text"
          placeholder="Tìm mã đơn / khách hàng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="date-group">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="high">Giá cao nhất</option>
          <option value="low">Giá thấp nhất</option>
        </select>
        <button className="btn-green" onClick={applyFilter}>
          <i className="fas fa-filter"></i> Lọc
        </button>
      </div>

      {/* Table */}
      <table className="order-table">
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Khách hàng</th>
            <th>Ngày đặt</th>
            <th>Trạng thái</th>
            <th>Tổng tiền</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {pageData.map((item) => (
            <tr key={item.OrderId}>
              <td>{item.OrderId}</td>
              <td>{item.UserName}</td>
              <td>{new Date(item.OrderDate).toLocaleString()}</td>
              <td>{item.Status}</td>
              <td>{item.TotalAmount.toLocaleString()} đ</td>
              <td>
                <select
                  value={item.StatusId} // dùng StatusId
                  onChange={(e) =>
                    updateStatus(item.OrderId, parseInt(e.target.value))
                  }
                >
                  <option value={1}>Đặt hàng thành công</option>
                  <option value={2}>Đang chuẩn bị đơn hàng</option>
                  <option value={3}>Đang giao hàng</option>
                  <option value={4}>Giao hàng thành công</option>
                  <option value={5}>Đã hủy</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        <button
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          &lt; Trước
        </button>
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            className={currentPage === i + 1 ? "active" : ""}
            onClick={() => changePage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Sau &gt;
        </button>
      </div>
    </div>
  );
};

export default Order;
