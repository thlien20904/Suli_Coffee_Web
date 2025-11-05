import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "../../../styles/pages/orderslist.css";

export default function OrdersList() {
  const tabs = [
    { id: "cho-xac-nhan", name: "Chờ xác nhận", statusId: 1 },
    { id: "dang-chuan-bi", name: "Đang chuẩn bị", statusId: 2 },
    { id: "dang-giao-hang", name: "Đang giao hàng", statusId: 3 },
    { id: "da-giao", name: "Đã giao", statusId: 4 },
    { id: "da-huy", name: "Đã hủy", statusId: 5 },
  ];

  const [activeTab, setActiveTab] = useState("cho-xac-nhan");
  const [ordersData, setOrdersData] = useState({});
  const [loadingTabs, setLoadingTabs] = useState({});

  // -------------------- LẤY ĐƠN HÀNG --------------------
  const fetchOrders = async (tab, page = 1) => {
    setLoadingTabs((prev) => ({ ...prev, [tab]: true }));
    console.log("Gọi API với tab:", tab, "và page:", page);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/profile/orders", {
        headers: { Authorization: `Bearer ${token}` },
        params: { tab, page, pageSize: 5 },
      });

      if (res.data.success) {
        console.log("Dữ liệu từ API cho tab", tab, ":", res.data.data);
        const d = res.data.data;
        setOrdersData((prev) => ({
          ...prev,
          [tab]: {
            orders: d.orders,
            currentPage: d.currentPage,
            totalPages: d.totalPages,
          },
        }));
      } else {
        setOrdersData((prev) => ({
          ...prev,
          [tab]: { orders: [], currentPage: 1, totalPages: 1 },
        }));
      }
    } catch (err) {
      console.error("Fetch Orders Error:", err);
      setOrdersData((prev) => ({
        ...prev,
        [tab]: { orders: [], currentPage: 1, totalPages: 1 },
      }));
    } finally {
      setLoadingTabs((prev) => ({ ...prev, [tab]: false }));
    }
  };

  // -------------------- HỦY ĐƠN --------------------
  const cancelOrder = async (orderId) => {
    Swal.fire({
      title: "Xác nhận hủy đơn hàng?",
      text: "Bạn có chắc chắn muốn hủy đơn hàng này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Có, hủy ngay!",
      cancelButtonText: "Không",
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        const token = localStorage.getItem("token");
        const res = await axios.post(
          "http://localhost:5000/api/profile/orders/cancel",
          { orderId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          Swal.fire({
            icon: "success",
            title: "Thành công!",
            text: "Đơn hàng đã được hủy.",
            showConfirmButton: true,
            timer: 1000,
          }).then(() => {
            fetchOrders(activeTab, ordersData[activeTab]?.currentPage || 1);
            fetchOrders("da-huy", ordersData["da-huy"]?.currentPage || 1);
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Lỗi!",
            text: res.data.message || "Hủy thất bại",
            showConfirmButton: true,
          });
        }
      } catch (err) {
        console.error("CANCEL ORDER ERROR:", err);
        Swal.fire({
          icon: "error",
          title: "Lỗi!",
          text: "Không thể kết nối server!",
          showConfirmButton: true,
        });
      }
    });
  };

  // -------------------- XỬ LÝ CHUYỂN TAB --------------------
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Luôn gọi lại API để lấy dữ liệu mới, tránh phụ thuộc vào state cũ
    fetchOrders(tabId, 1);
  };

  // -------------------- EFFECT --------------------
  useEffect(() => {
    fetchOrders(activeTab, 1);
  }, []);

  // -------------------- RENDER BẢNG --------------------
  const renderTable = (tab) => {
    const data = ordersData[tab];
    const isLoading = loadingTabs[tab];

    if (isLoading) return <p className="text-center">Đang tải đơn hàng...</p>;
    if (!data || !data.orders || data.orders.length === 0)
      return (
        <p className="text-center">Bạn chưa có đơn hàng ở trạng thái này.</p>
      );

    return (
      <>
        <table className="orders-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Ngày đặt</th>
              <th>Tổng tiền</th>
              <th>Thanh toán</th>
              <th>Trạng thái</th>
              <th>Chi tiết</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.orders.map((o) => (
              <tr key={o.OrderId}>
                <td>#{o.OrderId}</td>
                <td>
                  {new Date(o.OrderDate).toLocaleString("vi-VN", {
                    hour12: true,
                  })}
                </td>
                <td>{o.TotalAmount.toLocaleString("vi-VN")} ₫</td>
                <td>{o.PaymentMethod || "N/A"}</td>
                <td>{o.Status}</td>
                <td>
                  {o.OrderDetails.map((d, idx) => (
                    <div key={idx} className="order-detail-line">
                      <span className="fw-bold">{d.FoodName}</span>
                      {d.SizeName && ` (${d.SizeName})`}
                      {d.ToppingName && ` - ${d.ToppingName}`}
                      <span>
                        {" | "}SL: {d.Quantity} -{" "}
                        {d.Price.toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                  ))}
                </td>
                <td>
                  {(o.StatusId === 1 || o.StatusId === 2) && (
                    <button
                      className="btn btn-warning btn-sm text-white"
                      onClick={() => cancelOrder(o.OrderId)}
                    >
                      Hủy
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <nav className="pagination justify-content-center">
            <button
              className="page-link"
              disabled={data.currentPage === 1}
              onClick={() => fetchOrders(tab, data.currentPage - 1)}
            >
              &laquo;
            </button>

            {[...Array(data.totalPages)].map((_, i) => (
              <button
                key={i}
                className={`page-link ${
                  data.currentPage === i + 1 ? "active" : ""
                }`}
                onClick={() => fetchOrders(tab, i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button
              className="page-link"
              disabled={data.currentPage === data.totalPages}
              onClick={() => fetchOrders(tab, data.currentPage + 1)}
            >
              &raquo;
            </button>
          </nav>
        )}
      </>
    );
  };

  return (
    <div className="p-4">
      <h4 className="mb-3 fw-bold">Đơn hàng của bạn</h4>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        {tabs.map((t) => (
          <li className="nav-item" key={t.id}>
            <button
              className={`nav-link ${activeTab === t.id ? "active" : ""}`}
              onClick={() => handleTabChange(t.id)}
            >
              {t.name}
            </button>
          </li>
        ))}
      </ul>

      {/* Table */}
      <div>{renderTable(activeTab)}</div>
    </div>
  );
}
