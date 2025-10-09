import React, { useEffect } from "react";
import {
  Navbar as BSNavbar, // 👈 đổi tên react-bootstrap Navbar để tránh trùng
  Nav,
  Container,
  NavDropdown,
  Form,
  FormControl,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaSearch, FaBell, FaShoppingCart, FaUser } from "react-icons/fa";
import axios from "axios";
import { logout as logoutAction, setCartCount } from "../../../redux/userSlice";
import "../../../styles/components/Navbar.css";

export default function UserNavbar({ brandText = "SuLi Coffee", notifCount = 0 }) {
  const token = useSelector((state) => state.user.token);
  const username = useSelector((state) => state.user.username);
  const avatar = useSelector((state) => state.user.avatar);
  const cartCount = useSelector((state) => state.user.cartCount);

  const isAuthenticated = !!token;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 🛒 Fetch số lượng giỏ hàng khi login/logout
  useEffect(() => {
    const fetchCart = async () => {
      try {
        if (!isAuthenticated) {
          dispatch(setCartCount(0));
          return;
        }
        const res = await axios.get("http://localhost:5000/api/cart", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data && res.data.cart) {
          const total = res.data.cart.reduce(
            (sum, item) => sum + (item.SoLuong ?? 0),
            0
          );
          dispatch(setCartCount(total));
        }
      } catch (err) {
        console.error("FETCH CART ERROR:", err);
      }
    };
    fetchCart();
  }, [isAuthenticated, token, dispatch]);

  const handleLogout = async () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    delete axios.defaults.headers?.common?.Authorization;
    dispatch(logoutAction());
    navigate("/login", { replace: true });
  };

  const renderUserAvatar = () => {
    if (avatar) {
      return (
        <img
          src={avatar}
          alt="User avatar"
          className="rounded-circle avatar-img"
        />
      );
    } else if (username) {
      return <div className="avatar-initial">{username[0].toUpperCase()}</div>;
    } else {
      return <FaUser size={24} className="icon-white" />;
    }
  };

  return (
    <BSNavbar
      expand="lg"
      className="header"
      data-bs-theme="dark"
      style={{ position: "fixed", top: 0, width: "100%", zIndex: 1000 }}
    >
      <Container className="d-flex align-items-center justify-content-between flex-grow-1">
        {/* Logo */}
        <div className="logo" style={{ paddingLeft: "20px" }}>
          <Link to="/" className="logo-link text-decoration-none d-block">
            <span className="logo-middle">{brandText}</span>
          </Link>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="search-bar mx-4">
          <Form className="d-flex" role="search">
            <FormControl
              type="search"
              placeholder="Tìm kiếm sản phẩm..."
              className="custom-search-input"
            />
            <button type="submit" className="btn btn-dark ms-2">
              <FaSearch />
            </button>
          </Form>
        </div>

        {/* Menu */}
        <nav className="nav">
          <ul className="d-flex list-unstyled mb-0">
            <li>
              <Nav.Link as={Link} to="/" className="nav-link">
                Trang chủ
              </Nav.Link>
            </li>
            <li className="menu-item">
              <Nav.Link as={Link} to="/products" className="nav-link">
                Sản phẩm
              </Nav.Link>
              <div className="submenu">
                <ul>
                  <li>
                    <Nav.Link as={Link} to="/products?category=all">
                      Tất cả
                    </Nav.Link>
                  </li>
                  <li>
                    <Nav.Link as={Link} to="/products?category=coffee">
                      Cà phê
                    </Nav.Link>
                  </li>
                  <li>
                    <Nav.Link as={Link} to="/products?category=milktea">
                      Trà sữa
                    </Nav.Link>
                  </li>
                  <li>
                    <Nav.Link as={Link} to="/products?category=frappe">
                      Thức uống đá xay
                    </Nav.Link>
                  </li>
                  <li>
                    <Nav.Link as={Link} to="/products?category=snack">
                      Bánh & Snack
                    </Nav.Link>
                  </li>
                  <li>
                    <Nav.Link as={Link} to="/products?category=fruittea">
                      Trà trái cây
                    </Nav.Link>
                  </li>
                </ul>
              </div>
            </li>
            <li>
              <Nav.Link as={Link} to="/about" className="nav-link">
                Giới thiệu
              </Nav.Link>
            </li>
            <li>
              <Nav.Link as={Link} to="/stores" className="nav-link">
                Cửa hàng
              </Nav.Link>
            </li>
          </ul>
        </nav>

        {/* Bên phải */}
        <Nav className="navbar-right ms-auto">
          <Nav.Link
            as={Link}
            to="/notifications"
            className="position-relative"
            aria-label="Thông báo"
          >
            <FaBell size={20} />
            {!!notifCount && <span className="custom-badge">{notifCount}</span>}
          </Nav.Link>
          <Nav.Link
            as={Link}
            to="/cart"
            className="position-relative ms-3"
            aria-label="Giỏ hàng"
          >
            <FaShoppingCart size={20} />
            {!!cartCount && <span className="custom-badge">{cartCount}</span>}
          </Nav.Link>
          <NavDropdown
            title={
              <span className="d-flex align-items-center gap-2">
                {renderUserAvatar()}
                {isAuthenticated && <span>{username}</span>}
              </span>
            }
            id="user-dropdown"
            align="end"
            className="ms-3"
          >
            {isAuthenticated ? (
              <>
                <NavDropdown.Item as={Link} to="/profile">
                  Hồ sơ
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/settings">
                  Cài đặt
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  Đăng xuất
                </NavDropdown.Item>
              </>
            ) : (
              <>
                <NavDropdown.Item as={Link} to="/login">
                  Đăng nhập
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/register">
                  Đăng ký
                </NavDropdown.Item>
              </>
            )}
          </NavDropdown>
        </Nav>
      </Container>
    </BSNavbar>
  );
}
