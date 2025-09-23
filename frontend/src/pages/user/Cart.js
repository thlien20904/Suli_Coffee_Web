import { useState, useEffect } from 'react'; // Thêm useState
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, Table, Button, Form, Alert } from 'react-bootstrap';
import { removeFromCart, updateQuantity } from '../../redux/cartSlice'; // Sửa tên import

function Cart() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.user);
  const cartItems = useSelector((state) => state.cart.items);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!token) {
      setError('Vui lòng đăng nhập để xem giỏ hàng.');
      navigate('/login');
      return;
    }
    // Tính tổng tiền
    const newTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotal(newTotal);
  }, [cartItems, token, navigate]);

  const handleUpdateQuantity = async (variantId, newQuantity) => {
    if (newQuantity <= 0) {
      setError('Số lượng phải lớn hơn 0.');
      return;
    }
    try {
      const response = await axios.put(
        'http://localhost:5000/api/cart/update',
        { variantId, quantity: newQuantity }, // Gửi variantId và quantity
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        dispatch(updateQuantity({ cartItemId: variantId, quantity: newQuantity })); // Sử dụng cartItemId
        setError('');
      }
    } catch (err) {
      setError('Cập nhật số lượng thất bại. Vui lòng thử lại.');
    }
  };

  const handleRemoveItem = async (variantId) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/cart/remove/${variantId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        dispatch(removeFromCart(variantId)); // Sử dụng variantId
        setError('');
      }
    } catch (err) {
      setError('Xóa sản phẩm thất bại. Vui lòng thử lại.');
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      setError('Giỏ hàng trống. Vui lòng thêm sản phẩm.');
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="container mt-4">
      {error && <Alert variant="danger">{error}</Alert>}
      <h2>Giỏ hàng</h2>
      {cartItems.length === 0 ? (
        <p>Giỏ hàng của bạn trống. <a href="/products">Mua sắm ngay</a></p>
      ) : (
        <>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Giá</th>
                <th>Số lượng</th>
                <th>Tổng</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => (
                <tr key={item.variantId}>
                  <td>
                    <img
                      src={item.image || 'https://via.placeholder.com/50'}
                      alt={item.name}
                      style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                    />
                    {item.name}
                  </td>
                  <td>${item.price}</td>
                  <td>
                    <Form.Control
                      type="number"
                      min="1"
                      max={item.stock}
                      value={item.quantity}
                      onChange={(e) => handleUpdateQuantity(item.variantId, parseInt(e.target.value) || 1)}
                    />
                  </td>
                  <td>${(item.price * item.quantity).toFixed(2)}</td>
                  <td>
                    <Button variant="danger" onClick={() => handleRemoveItem(item.variantId)}>
                      Xóa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="text-end mt-3">
            <h4>Tổng cộng: ${total.toFixed(2)}</h4>
            <Button variant="success" onClick={handleCheckout}>
              Thanh toán
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;