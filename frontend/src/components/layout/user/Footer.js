import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-dark text-light mt-5 py-4">
      <Container>
        <Row>
          <Col md={4}>
            <h5>ShoeStore</h5>
            <p>Khám phá thế giới giày thời trang và tiện lợi.</p>
          </Col>
          <Col md={4}>
            <h5>Liên kết</h5>
            <ul className="list-unstyled">
              <li><Link to="/" className="text-light text-decoration-none">Trang chủ</Link></li>
              <li><Link to="/products" className="text-light text-decoration-none">Sản phẩm</Link></li>
              <li><Link to="/blogs" className="text-light text-decoration-none">Blog</Link></li>
              <li><Link to="/contact" className="text-light text-decoration-none">Liên hệ</Link></li>
            </ul>
          </Col>
          <Col md={4}>
            <h5>Liên hệ</h5>
            <p>Email: support@shoestore.com</p>
            <p>Điện thoại: 0123 456 789</p>
          </Col>
        </Row>
        <hr className="border-secondary" />
        <div className="text-center">
          <small>© {new Date().getFullYear()} ShoeStore. All rights reserved.</small>
        </div>
      </Container>
    </footer>
  );
}
