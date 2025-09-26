// src/pages/admin/Invoice.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../../styles/components/admin/Invoice.css";

const Invoice = () => {
  const [invoices, setInvoices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [details, setDetails] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/invoice", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        params: { limit: 1000 },
      });
      setInvoices(res.data.data);
      setFiltered(res.data.data); // mặc định hiển thị hết
    } catch (err) {
      console.error("❌ Lỗi fetch invoices:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 👉 Hàm lọc thủ công khi bấm nút
  const applyFilter = () => {
    let result = [...invoices];

    // search
    result = result.filter(
      (item) =>
        item.UserName.toLowerCase().includes(search.toLowerCase()) ||
        String(item.OrderId).includes(search)
    );

    // date range
    result = result.filter((item) => {
      if (!startDate && !endDate) return true;
      const d = new Date(item.OrderDate);
      const from = startDate ? new Date(startDate) : null;
      const to = endDate ? new Date(endDate) : null;
      return (!from || d >= from) && (!to || d <= to);
    });

    // sort
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

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pageData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const changePage = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  const viewDetail = async (id) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/admin/invoice/${id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setDetails(res.data.details);
      setCurrentInvoice(res.data.invoice);
      setShowDetailModal(true);
    } catch (err) {
      Swal.fire("Lỗi", "Không thể lấy chi tiết hóa đơn", "error");
    }
  };

  const printInvoice = () => {
    if (!currentInvoice) return;
    // ... (giữ nguyên code in hoá đơn của bạn)
  };

  return (
    <div className="invoice-page">
      {/* Filter */}
      <div className="invoice-filter">
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
      <table className="invoice-table">
        <thead>
          <tr>
            <th>Mã HĐ</th>
            <th>Khách hàng</th>
            <th>Ngày</th>
            <th>Thanh toán</th>
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
              <td>{item.PaymentMethod}</td>
              <td>{item.Status}</td>
              <td>{item.TotalAmount.toLocaleString()} đ</td>
              <td>
                <button
                  className="btn-green"
                  onClick={() => viewDetail(item.OrderId)}
                >
                  <i className="fas fa-eye"></i> Xem chi tiết
                </button>
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

      {/* Modal giữ nguyên */}
      {showDetailModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDetailModal(false)}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            {/* ... giữ nguyên code modal chi tiết */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoice;
