import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../../../styles/components/Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleLogout = () => {
    localStorage.removeItem("user"); // hoặc dispatch logout Redux
    navigate("/login");
  };

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="logo">
        <NavLink
          to="/admin/dashboard"
          className="text-decoration-none text-dark d-block"
        >
          SuLi Coffee
        </NavLink>
      </div>

      <ul>
        {/* Sản phẩm */}
        <li
          onClick={() => toggleMenu("product")}
          className={`toggleMenu ${openMenu === "product" ? "active" : ""}`}
        >
          <span>Sản phẩm</span>
          <i
            className={`fas fa-chevron-${
              openMenu === "product" ? "down" : "right"
            }`}
          ></i>
        </li>
        {openMenu === "product" && (
          <div className="submenu show">
            <p>
              <NavLink to="/admin/categories">Danh mục sản phẩm</NavLink>
            </p>
            <p>
              <NavLink to="/admin/products">Sản phẩm</NavLink>
            </p>
          </div>
        )}

        {/* Kho nguyên liệu */}
        <li
          onClick={() => toggleMenu("kho")}
          className={`toggleMenu ${openMenu === "kho" ? "active" : ""}`}
        >
          <span>Kho nguyên liệu</span>
          <i
            className={`fas fa-chevron-${
              openMenu === "kho" ? "down" : "right"
            }`}
          ></i>
        </li>
        {openMenu === "kho" && (
          <div className="submenu show">
            <p>
              <NavLink to="/admin/ingredients">Nguyên liệu</NavLink>
            </p>
            <p>
              <NavLink to="/admin/export">Xuất file</NavLink>
            </p>
          </div>
        )}

        {/* Báo cáo */}
        <li
          onClick={() => toggleMenu("baocao")}
          className={`toggleMenu ${openMenu === "baocao" ? "active" : ""}`}
        >
          <span>Báo cáo</span>
          <i
            className={`fas fa-chevron-${
              openMenu === "baocao" ? "down" : "right"
            }`}
          ></i>
        </li>
        {openMenu === "baocao" && (
          <div className="submenu show">
            <p>
              <NavLink to="/admin/revenue">Doanh thu theo thời gian</NavLink>
            </p>
            <p>
              <NavLink to="/admin/bestseller">Sản phẩm bán chạy</NavLink>
            </p>
          </div>
        )}

        {/* Manage Shop */}
        <li
          onClick={() => toggleMenu("shop")}
          className={`toggleMenu ${openMenu === "shop" ? "active" : ""}`}
        >
          <span>Manage Shop</span>
          <i
            className={`fas fa-chevron-${
              openMenu === "shop" ? "down" : "right"
            }`}
          ></i>
        </li>
        {openMenu === "shop" && (
          <div className="submenu show">
            <p>
              <NavLink to="/admin/users">Người dùng</NavLink>
            </p>
            <p>
              <NavLink to="/admin/staff">Nhân viên</NavLink>
            </p>
          </div>
        )}

        {/* Đơn hàng */}
        <li
          onClick={() => toggleMenu("donhang")}
          className={`toggleMenu ${openMenu === "donhang" ? "active" : ""}`}
        >
          <span>Đơn hàng</span>
          <i
            className={`fas fa-chevron-${
              openMenu === "donhang" ? "down" : "right"
            }`}
          ></i>
        </li>
        {openMenu === "donhang" && (
          <div className="submenu show">
            <p>
              <NavLink to="/admin/orders/online">Đơn hàng Online</NavLink>
            </p>
            <p>
              <NavLink to="/admin/orders/offline">Đơn hàng Offline</NavLink>
            </p>
          </div>
        )}

        {/* Thanh toán */}
        <li
          onClick={() => toggleMenu("thanhtoan")}
          className={`toggleMenu ${openMenu === "thanhtoan" ? "active" : ""}`}
        >
          <span>Thanh toán</span>
          <i
            className={`fas fa-chevron-${
              openMenu === "thanhtoan" ? "down" : "right"
            }`}
          ></i>
        </li>
        {openMenu === "thanhtoan" && (
          <div className="submenu show">
            {/* Có thể thêm submenu nếu cần */}
          </div>
        )}

        {/* Hóa đơn */}
        <li
          onClick={() => toggleMenu("hoadon")}
          className={`toggleMenu ${openMenu === "hoadon" ? "active" : ""}`}
        >
          <span>Hóa đơn</span>
          <i
            className={`fas fa-chevron-${
              openMenu === "hoadon" ? "down" : "right"
            }`}
          ></i>
        </li>
        {openMenu === "hoadon" && (
          <div className="submenu show">
            {/* Có thể thêm submenu nếu cần */}
          </div>
        )}
      </ul>
    </div>
  );
};

export default Sidebar;
