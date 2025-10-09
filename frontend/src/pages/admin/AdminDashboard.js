import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useNavigate } from "react-router-dom";
import "../../styles/pages/AdminDashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/home");
        setData(res.data);
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <p className="text-center mt-5">Đang tải...</p>;
  if (!data) return <p className="text-center mt-5">Không có dữ liệu</p>;

  const {
    totalProducts,
    totalIngredients,
    totalOrders,
    totalSales,
    statusCount,
    monthlySales,
    bestSellers,
    lowStockIngredients,
    topCountries,
    recentOrders,
  } = data;

  const monthlyLabels = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`);
  const chartData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: "Doanh thu",
        data: monthlySales.map((m) => m.TotalRevenue),
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: true,
      },
    ],
  };

  return (
    <div className="container mt-4">
      {/* Thống kê */}
      <div className="row">
        <div className="col-md-3">
          <div
            className="card text-center p-3 bg-light clickable-card"
            onClick={() => navigate("/admin/food")}
            style={{ cursor: "pointer" }}
          >
            <h5>📦 Sản phẩm</h5>
            <p className="display-6">{totalProducts}</p>
          </div>
        </div>
        <div className="col-md-3">
          <div
            className="card text-center p-3 bg-light clickable-card"
            onClick={() => navigate("/admin/ingredient")}
            style={{ cursor: "pointer" }}
          >
            <h5>🏭 Nguyên liệu</h5>
            <p className="display-6">{totalIngredients}</p>
          </div>
        </div>
        <div className="col-md-3">
          <div
            className="card text-center p-3 bg-light clickable-card"
            onClick={() => navigate("/admin/order")}
            style={{ cursor: "pointer" }}
          >
            <h5>🛒 Đơn hàng</h5>
            <p className="display-6">{totalOrders}</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center p-3 bg-light">
            <h5>💰 Tổng doanh thu</h5>
            <p className="display-6">{totalSales.toLocaleString()} VND</p>
          </div>
        </div>
      </div>

      {/* Trạng thái đơn hàng */}
      <div className="row mt-4">
        {Object.entries(statusCount).map(([status, count], i) => (
          <div className="col-md-3" key={i}>
            <div className="card text-center p-3 bg-light">
              <h5>{status}</h5>
              <p className="display-6">{count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Biểu đồ */}
      <section className="mt-5">
        <h3 className="text-center">📊 Doanh thu theo tháng</h3>
        <Line data={chartData} />
      </section>

      {/* Top sản phẩm + quốc gia */}
      <div className="row mt-5">
        <div className="col-md-6">
          <h3 className="text-center">🔥 Sản phẩm bán chạy 🔥</h3>
          <div className="row">
            {bestSellers.length > 0 ? (
              bestSellers.map((item, i) => (
                <div className="col-md-4 mb-3" key={i}>
                  <div className="card text-center p-3 bg-light">
                    <img
                      src={item.ImageURL || "/images/no-image.png"}
                      alt={item.FoodName}
                      style={{
                        maxWidth: "100%",
                        height: "150px",
                        objectFit: "cover",
                      }}
                    />
                    <h5>{item.FoodName}</h5>
                    <p style={{ color: "#C19A6B", fontWeight: "bold" }}>
                      {item.Price.toLocaleString()}đ
                    </p>
                    <p>Đã bán: {item.TotalSold}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-danger">Không có dữ liệu</p>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <h3 className="text-center">🌍 Top quốc gia</h3>
          <ul className="list-group">
            {topCountries.length > 0 ? (
              topCountries.map((c, i) => (
                <li
                  key={i}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  {c.Country}
                  <span className="badge bg-primary rounded-pill">
                    {c.OrderCount}
                  </span>
                </li>
              ))
            ) : (
              <li className="list-group-item text-center">Không có dữ liệu</li>
            )}
          </ul>
        </div>
      </div>

      {/* Đơn hàng gần đây */}
      <section className="mt-5">
        <h3 className="text-center">📝 Đơn hàng gần đây</h3>
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>ID</th>
              <th>Người dùng</th>
              <th>Trạng thái</th>
              <th>Ngày đặt</th>
              <th>Tổng tiền</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.length > 0 ? (
              recentOrders.map((o, i) => (
                <tr key={i}>
                  <td>{o.OrderId}</td>
                  <td>{o.FullName}</td>
                  <td>{o.StatusName}</td>
                  <td>{new Date(o.OrderDate).toLocaleString()}</td>
                  <td>{o.TotalAmount.toLocaleString()}đ</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Nguyên liệu sắp hết */}
      <section className="mt-5">
        <h3 className="text-center">⚠️ Nguyên liệu sắp hết ⚠️</h3>
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Hình ảnh</th>
              <th>Tên</th>
              <th>Số lượng</th>
            </tr>
          </thead>
          <tbody>
            {lowStockIngredients.length > 0 ? (
              lowStockIngredients.map((item, i) => (
                <tr key={i}>
                  <td>
                    <img
                      src={item.ImageURL || "/images/no-image.png"}
                      alt={item.IngredientName}
                      className="ingredient-img"
                    />
                  </td>
                  <td>{item.IngredientName}</td>
                  <td>{item.SoLuong}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center">
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminDashboard;
