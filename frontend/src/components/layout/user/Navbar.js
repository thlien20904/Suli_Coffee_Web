// src/components/layout/user/Navbar.js
import React, { useEffect, useState } from "react";
import {
  Navbar,
  Nav,
  Container,
  NavDropdown,
  Form,
  FormControl,
  Button,
} from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaSearch, FaBell, FaShoppingCart, FaUserCircle } from "react-icons/fa";
import axios from "axios";
import { logout as logoutAction } from "../../../redux/userSlice";

export default function UserNavbar({
  brandText = "LilyShoe",
  notifCount = 0,
  cartCount = 0,
}) {
  const [activeCat, setActiveCat] = useState("");
  const [activeGroup, setActiveGroup] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // SỬA: Destructure từ state.user (các trường riêng lẻ)
  const token = useSelector((state) => state.user.token);
  const username = useSelector((state) => state.user.username);
  const avatar = useSelector((state) => state.user.avatar);
  const role = useSelector((state) => state.user.role);

  const isAuthenticated = !!token;
  console.log("Navbar state:", { token, username, isAuthenticated }); // Debug

  useEffect(() => {
    if (location.pathname.startsWith("/products")) {
      const sp = new URLSearchParams(location.search);
      setActiveCat(sp.get("category") || "");
      setActiveGroup(sp.get("targetGroup") || "");
    } else {
      setActiveCat("");
      setActiveGroup("");
    }
  }, [location.pathname, location.search]);

  const handleLogout = async () => {
    try {
      console.log("Logging out, removing token...");
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      delete axios.defaults.headers?.common?.Authorization;
      dispatch(logoutAction());
    } finally {
      navigate("/login", { replace: true });
      console.log("Navigated to /login");
    }
  };

  const renderUserAvatar = () => {
    if (avatar) {
      return (
        <img
          src={avatar}
          alt="User avatar"
          className="rounded-circle"
          style={{ width: 30, height: 30, objectFit: "cover" }}
        />
      );
    } else if (username) {
      return (
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            backgroundColor: "#666",
            color: "#fff",
            fontSize: 14,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {username[0].toUpperCase()}
        </div>
      );
    } else {
      return <FaUserCircle size={24} className="text-light" />;
    }
  };

  const styles = `
    .custom-navbar{background:#111!important;border-bottom:1px solid rgba(255,255,255,.08)}
    .brand-text{color:#fff!important;letter-spacing:.5px;font-weight:700}
    .custom-nav-link{color:#e9ecef!important;font-weight:500}
    .custom-nav-link:hover{color:#fff!important}
    .custom-nav-dropdown .dropdown-menu{
      background:#1a1a1a;border:1px solid rgba(255,255,255,.08);
      box-shadow:0 10px 30px rgba(0,0,0,.35);min-width:520px;display:flex!important;gap:2rem;
      padding:1rem 1.25rem;left:50%;transform:translateX(-50%);
    }
    .dropdown-group{display:flex;flex-direction:column;min-width:180px}
    .dropdown-item.header-link{color:#e9ecef;font-weight:700;text-transform:uppercase;opacity:.9;padding:.25rem 0}
    .dropdown-item.header-link:hover{color:#fff}
    .dropdown-item-custom{color:#f1f3f5;padding:.25rem 0}
    .dropdown-item-custom:hover{color:#fff;transform:translateX(2px)}
    @media (max-width:991.98px){.custom-nav-dropdown .dropdown-menu{min-width:auto;flex-direction:column;gap:.5rem;left:auto;transform:none;padding:.5rem .75rem}}
    .custom-badge{position:absolute;top:0;right:0;transform:translate(45%,-45%);font-size:.72em;padding:.28em .52em;border-radius:999px;background:#dc3545;color:#fff;line-height:1;min-width:1.3rem;text-align:center}
    .custom-search-input{background:#1f1f1f;border:1px solid rgba(255,255,255,.14);color:#fff;height:40px;border-radius:.5rem 0 0 .5rem}
    .custom-search-button{background:#fff;border-color:#fff;color:#000;height:40px;border-radius:0 .5rem .5rem 0}
  `;

  return (
    <>
      <style>{styles}</style>
      <Navbar
        expand="lg"
        className="shadow-sm py-3 custom-navbar"
        data-bs-theme="dark"
      >
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <svg
              xmlns="http://www.w3.org/1000/svg"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="me-2 text-white"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="14.31" y1="8" x2="20.05" y2="17.94" />
              <line x1="9.69" y1="8" x2="21.17" y2="8" />
              <line x1="7.38" y1="12" x2="13.12" y2="2.06" />
              <line x1="9.69" y1="16" x2="3.95" y2="6.06" />
              <line x1="14.31" y1="16" x2="2.83" y2="16" />
              <line x1="16.62" y1="12" x2="10.88" y2="21.94" />
            </svg>
            <span className="brand-text fs-5">{brandText}</span>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="main-navbar" />
          <Navbar.Collapse id="main-navbar">
            <Nav className="ms-auto me-auto d-flex align-items-center">
              <Nav.Link as={Link} to="/" className="mx-2 custom-nav-link">
                Trang chủ
              </Nav.Link>
              <Nav.Link as={Link} to="/blogs" className="mx-2 custom-nav-link">
                Blog
              </Nav.Link>
              <Nav.Link as={Link} to="/about" className="mx-2 custom-nav-link">
                Giới thiệu
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/contact"
                className="mx-2 custom-nav-link"
              >
                Liên hệ
              </Nav.Link>
            </Nav>

            <Nav className="d-flex align-items-center">
              <Form
                className="d-flex me-2"
                role="search"
                aria-label="Tìm kiếm sản phẩm"
              >
                <FormControl
                  type="search"
                  placeholder="Tìm kiếm…"
                  className="custom-search-input"
                />
                <Button
                  className="custom-search-button"
                  aria-label="Thực hiện tìm kiếm"
                >
                  <FaSearch />
                </Button>
              </Form>

              <Nav.Link
                as={Link}
                to="/notifications"
                className="position-relative"
                aria-label="Thông báo"
              >
                <FaBell size={20} />
                {!!notifCount && (
                  <span className="custom-badge">{notifCount}</span>
                )}
              </Nav.Link>

              <Nav.Link
                as={Link}
                to="/cart"
                className="position-relative ms-3"
                aria-label="Giỏ hàng"
              >
                <FaShoppingCart size={20} />
                {!!cartCount && (
                  <span className="custom-badge">{cartCount}</span>
                )}
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
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
}
