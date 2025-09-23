import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ListGroup, Image } from 'react-bootstrap';
import axios from 'axios';
import { FaUserCircle, FaEdit, FaLock, FaMapMarkerAlt, FaBox } from 'react-icons/fa';

function Profile() {
  // Lấy user từ Redux
  const { userId, username, email, avatar, token } = useSelector((state) => state.user);
  const [activeSection, setActiveSection] = useState('info'); // Quản lý phần đang xem
  const [profile, setProfile] = useState({ username, email, phone: '', avatar });
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Lấy thông tin user, đơn hàng, địa chỉ khi mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile({
          username: res.data.username,
          email: res.data.email,
          phone: res.data.phone || '',
          avatar: res.data.avatar || null,
        });
      } catch (err) {
        setErrors({ general: err.response?.data?.message || 'Lỗi khi tải thông tin' });
      }
    };

    const fetchOrders = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(res.data);
      } catch (err) {
        setErrors((prev) => ({ ...prev, orders: 'Lỗi khi tải đơn hàng' }));
      }
    };

    const fetchAddresses = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/addresses', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAddresses(res.data);
      } catch (err) {
        setErrors((prev) => ({ ...prev, addresses: 'Lỗi khi tải địa chỉ' }));
      }
    };

    if (token) {
      fetchProfile();
      fetchOrders();
      fetchAddresses();
    }
  }, [token]);

  // Xử lý upload avatar
  const handleAvatarChange = (e) => {
    setAvatarFile(e.target.files[0]);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      const res = await axios.put('http://localhost:5000/api/profile/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setProfile((prev) => ({ ...prev, avatar: res.data.avatar }));
      setSuccessMsg('Cập nhật avatar thành công!');
      setAvatarFile(null);
    } catch (err) {
      setErrors({ avatar: err.response?.data?.message || 'Lỗi khi upload avatar' });
    } finally {
      setLoading(false);
    }
  };

  // Xử lý đổi mật khẩu
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMsg('');
    setLoading(true);

    const { currentPassword, newPassword, confirmPassword } = passwordData;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrors({ password: 'Vui lòng điền đầy đủ các trường' });
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors({ password: 'Mật khẩu mới không khớp' });
      setLoading(false);
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(newPassword)) {
      setErrors({ password: 'Mật khẩu mới cần ≥8 ký tự, gồm chữ HOA, thường, số, ký tự đặc biệt' });
      setLoading(false);
      return;
    }

    try {
      await axios.put(
        'http://localhost:5000/api/password',
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMsg('Đổi mật khẩu thành công!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setErrors({ password: err.response?.data?.message || 'Lỗi khi đổi mật khẩu' });
    } finally {
      setLoading(false);
    }
  };

  // CSS
  const styles = `
    .profile-container { min-height: 100vh; background: #fce0ea; padding: 2rem 0; }
    .profile-card { border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .sidebar { background: #fff; border-right: 1px solid #eee; padding: 1.5rem; }
    .sidebar-item { cursor: pointer; padding: 0.75rem 1rem; margin-bottom: 0.5rem; border-radius: 8px; }
    .sidebar-item.active { background: #d81b60; color: #fff; }
    .sidebar-item:hover { background: #f1b4c9; color: #fff; }
    .content-card { background: #fff; padding: 2rem; border-radius: 12px; }
    .avatar-img { width: 120px; height: 120px; object-fit: cover; border-radius: 50%; }
    .order-item { border-bottom: 1px solid #eee; padding: 1rem 0; }
    .address-item { border-bottom: 1px solid #eee; padding: 1rem 0; }
    .btn-primary-auth { background: #d81b60; border-color: #d81b60; border-radius: 999px; }
    @media (max-width: 768px) { .sidebar { border-right: none; border-bottom: 1px solid #eee; } }
  `;

  return (
    <div className="profile-container">
      <style>{styles}</style>
      <Container>
        <Row>
          {/* Sidebar */}
          <Col md={3}>
            <Card className="sidebar">
              <ListGroup variant="flush">
                <ListGroup.Item
                  className={`sidebar-item ${activeSection === 'info' ? 'active' : ''}`}
                  onClick={() => setActiveSection('info')}
                >
                  <FaUserCircle className="me-2" /> Thông tin tài khoản
                </ListGroup.Item>
                <ListGroup.Item
                  className={`sidebar-item ${activeSection === 'orders' ? 'active' : ''}`}
                  onClick={() => setActiveSection('orders')}
                >
                  <FaBox className="me-2" /> Đơn hàng của bạn
                </ListGroup.Item>
                <ListGroup.Item
                  className={`sidebar-item ${activeSection === 'password' ? 'active' : ''}`}
                  onClick={() => setActiveSection('password')}
                >
                  <FaLock className="me-2" /> Đổi mật khẩu
                </ListGroup.Item>
                <ListGroup.Item
                  className={`sidebar-item ${activeSection === 'addresses' ? 'active' : ''}`}
                  onClick={() => setActiveSection('addresses')}
                >
                  <FaMapMarkerAlt className="me-2" /> Địa chỉ ({addresses.length})
                </ListGroup.Item>
              </ListGroup>
            </Card>
          </Col>

          {/* Content */}
          <Col md={9}>
            <Card className="content-card">
              {errors.general && <Alert variant="danger">{errors.general}</Alert>}
              {successMsg && <Alert variant="success">{successMsg}</Alert>}

              {activeSection === 'info' && (
                <>
                  <h4>Thông tin tài khoản</h4>
                  <div className="d-flex align-items-center mb-3">
                    {profile.avatar ? (
                      <Image src={profile.avatar} alt="Avatar" className="avatar-img me-3" />
                    ) : (
                      <FaUserCircle size={120} className="me-3 text-muted" />
                    )}
                    <div>
                      <Form.Group controlId="avatarUpload" className="mb-3">
                        <Form.Label>Thay đổi avatar</Form.Label>
                        <Form.Control type="file" accept="image/*" onChange={handleAvatarChange} />
                        {avatarFile && (
                          <Button
                            className="mt-2 btn-primary-auth"
                            onClick={handleAvatarUpload}
                            disabled={loading}
                          >
                            {loading ? <Spinner size="sm" /> : 'Tải lên'}
                          </Button>
                        )}
                        {errors.avatar && <Alert variant="danger" className="mt-2">{errors.avatar}</Alert>}
                      </Form.Group>
                    </div>
                  </div>
                  <Form.Group className="mb-3">
                    <Form.Label>Tên</Form.Label>
                    <Form.Control type="text" value={profile.username} readOnly />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" value={profile.email} readOnly />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Số điện thoại</Form.Label>
                    <Form.Control type="text" value={profile.phone} readOnly />
                  </Form.Group>
                </>
              )}

              {activeSection === 'orders' && (
                <>
                  <h4>Đơn hàng của bạn</h4>
                  {errors.orders && <Alert variant="danger">{errors.orders}</Alert>}
                  {orders.length === 0 ? (
                    <p>Chưa có đơn hàng nào.</p>
                  ) : (
                    <ListGroup variant="flush">
                      {orders.map((order) => (
                        <ListGroup.Item key={order.OrderID} className="order-item">
                          <div><strong>Mã đơn: </strong>{order.OrderID}</div>
                          <div><strong>Ngày đặt: </strong>{new Date(order.OrderDate).toLocaleDateString()}</div>
                          <div><strong>Tổng tiền: </strong>{order.TotalAmount?.toLocaleString()} VND</div>
                          <div><strong>Trạng thái: </strong>{order.Status}</div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </>
              )}

              {activeSection === 'password' && (
                <>
                  <h4>Đổi mật khẩu</h4>
                  <Form onSubmit={handlePasswordChange}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mật khẩu hiện tại</Form.Label>
                      <Form.Control
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Mật khẩu mới</Form.Label>
                      <Form.Control
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                      <Form.Control
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                        }
                      />
                    </Form.Group>
                    {errors.password && <Alert variant="danger">{errors.password}</Alert>}
                    <Button type="submit" className="btn-primary-auth" disabled={loading}>
                      {loading ? <Spinner size="sm" /> : 'Đổi mật khẩu'}
                    </Button>
                  </Form>
                </>
              )}

              {activeSection === 'addresses' && (
                <>
                  <h4>Địa chỉ ({addresses.length})</h4>
                  {errors.addresses && <Alert variant="danger">{errors.addresses}</Alert>}
                  {addresses.length === 0 ? (
                    <p>Chưa có địa chỉ nào.</p>
                  ) : (
                    <ListGroup variant="flush">
                      {addresses.map((address) => (
                        <ListGroup.Item key={address.AddressID} className="address-item">
                          <div><strong>Địa chỉ: </strong>{address.Address}</div>
                          <div><strong>Tên người nhận: </strong>{address.RecipientName}</div>
                          <div><strong>Số điện thoại: </strong>{address.Phone}</div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </>
              )}
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Profile;