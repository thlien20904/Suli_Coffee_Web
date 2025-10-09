// frontend/src/pages/Cart.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Table, Button, Spinner, Alert, Form } from "react-bootstrap";

const API = "http://localhost:5000";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchCart = async () => {
    setLoading(true);
    setError("");
    try {
      if (!token) {
        setError("Bạn chưa đăng nhập");
        setLoading(false);
        return;
      }
      const { data } = await axios.get(`${API}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data || !data.cart) {
        setCart([]);
        setSelected([]);
      } else {
        setCart(data.cart);
        setSelected(data.cart.map((it) => it.GioHangID));
      }
    } catch (err) {
      console.error("FETCH CART ERROR:", err);
      setError("Không tải được giỏ hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line
  }, []);

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelected(cart.map((c) => c.GioHangID));
    else setSelected([]);
  };

  const handleSelectItem = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const calcItemTotal = (item) => {
    const base = item.DiscountPrice ?? item.Price ?? 0;
    const sizeExtra = item.Size?.ExtraPrice ?? 0;
    const toppingExtra = (item.Toppings || []).reduce(
      (s, t) => s + (t.ToppingPrice ?? 0),
      0
    );
    return (base + sizeExtra + toppingExtra) * (item.SoLuong ?? 1);
  };

  const calcSelectedTotal = () => {
    return cart
      .filter((it) => selected.includes(it.GioHangID))
      .reduce((s, it) => s + calcItemTotal(it), 0);
  };

  const handleDelete = async (gioHangId) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
      await axios.post(
        `${API}/api/cart/delete`,
        { gioHangId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart((prev) => prev.filter((it) => it.GioHangID !== gioHangId));
      setSelected((prev) => prev.filter((x) => x !== gioHangId));
    } catch (err) {
      console.error("DELETE ERROR:", err);
      alert("Xóa thất bại");
    }
  };

  const handleUpdateQty = async (gioHangId, newQty) => {
    if (newQty < 1) {
      alert("Số lượng phải lớn hơn 0");
      return;
    }
    try {
      const res = await axios.post(
        `${API}/api/cart/update`,
        { gioHangId, quantity: newQty },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data && res.data.success) {
        setCart((prev) =>
          prev.map((it) =>
            it.GioHangID === gioHangId
              ? {
                  ...it,
                  SoLuong: newQty,
                  TotalPrice: res.data.newItemTotal,
                }
              : it
          )
        );
      } else {
        alert("Cập nhật thất bại");
      }
    } catch (err) {
      console.error("UPDATE ERROR:", err);
      alert("Cập nhật thất bại");
    }
  };

  const handleCheckout = () => {
    if (!token) {
      alert("Vui lòng đăng nhập");
      return;
    }
    if (selected.length === 0) {
      alert("Vui lòng chọn sản phẩm để thanh toán");
      return;
    }

    // 👉 Chuyển sang trang Checkout, không reload
    navigate("/checkout", {
      state: { items: cart.filter((it) => selected.includes(it.GioHangID)) },
    });
  };

  if (loading)
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );
  if (error)
    return (
      <div className="container py-5">
        <Alert variant="danger">{error}</Alert>
      </div>
    );

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">Giỏ hàng của bạn</h2>
      {cart.length === 0 ? (
        <p className="text-center">Giỏ hàng của bạn đang trống.</p>
      ) : (
        <>
          <Table bordered hover responsive className="align-middle text-center">
            <thead className="table-dark">
              <tr>
                <th>
                  <Form.Check
                    type="checkbox"
                    checked={selected.length === cart.length}
                    onChange={handleSelectAll}
                  />{" "}
                  Chọn
                </th>
                <th>Hình ảnh</th>
                <th>Tên sản phẩm</th>
                <th>Size</th>
                <th>Topping</th>
                <th>Đơn giá</th>
                <th>Số lượng</th>
                <th>Thành tiền</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.GioHangID}>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={selected.includes(item.GioHangID)}
                      onChange={() => handleSelectItem(item.GioHangID)}
                    />
                  </td>
                  <td>
                    <img
                      src={
                        item.ImageURL ? `${API}${item.ImageURL}` : "/placeholder.jpg"
                      }
                      alt={item.FoodName}
                      style={{ width: 90, height: 90 }}
                      className="img-thumbnail"
                    />
                  </td>
                  <td style={{ minWidth: 200 }}>{item.FoodName}</td>
                  <td>
                    {item.Size
                      ? `${item.Size.SizeName} (+${item.Size.ExtraPrice?.toLocaleString(
                          "vi-VN"
                        )} ₫)`
                      : "Không có"}
                  </td>
                  <td>
                    {item.Toppings && item.Toppings.length > 0
                      ? item.Toppings.map((t) => (
                          <div key={t.ToppingID}>
                            {t.ToppingName} (+{(t.ToppingPrice ?? 0).toLocaleString(
                              "vi-VN"
                            )} ₫)
                          </div>
                        ))
                      : "Không có"}
                  </td>
                  <td>
                    {((item.DiscountPrice ?? item.Price) || 0).toLocaleString(
                      "vi-VN"
                    )}{" "}
                    ₫
                  </td>
                  <td style={{ width: 120 }}>
                    <Form.Control
                      type="number"
                      min={1}
                      value={item.SoLuong}
                      onChange={(e) =>
                        handleUpdateQty(
                          item.GioHangID,
                          parseInt(e.target.value || "1", 10)
                        )
                      }
                    />
                  </td>
                  <td>{calcItemTotal(item).toLocaleString("vi-VN")} ₫</td>
                  <td>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(item.GioHangID)}
                    >
                      Xóa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <h4 className="text-end">
            Tổng tiền:{" "}
            <strong>{calcSelectedTotal().toLocaleString("vi-VN")} ₫</strong>
          </h4>
          <div className="text-end mt-3">
            <Button variant="success" onClick={handleCheckout}>
              Thanh toán
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
