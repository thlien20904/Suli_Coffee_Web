// src/pages/ProductDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Row, Col, Card, Button, Form, Badge, ListGroup,
  InputGroup, Tabs, Tab, Ratio
} from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';
import {
  FiTruck, FiShield, FiCheckCircle, FiGift, FiMinus, FiPlus,
} from 'react-icons/fi';

const API_BASE = 'http://localhost:5000';

function formatVND(n) {
  if (n == null) return '';
  return n.toLocaleString('vi-VN') + '₫';
}

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [currentImage, setCurrentImage] = useState('');
  const [qty, setQty] = useState(1);
  const [related, setRelated] = useState([]);

  // ====== Fetch product + variants
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await axios.get(`${API_BASE}/api/products/${id}`);
      if (!mounted) return;
      const p = data.product || {};
      const vs = data.variants || [];
      setProduct(p);
      setVariants(vs);

      const first = vs[0];
      setSelectedColor(first?.Color || '');
      setSelectedSize(first?.Size || '');
      setCurrentImage(
        first?.ImageURL ? `${API_BASE}${first.ImageURL}` : `${API_BASE}/placeholder.jpg`
      );

      // gợi ý sản phẩm tương tự theo category hoặc brand
      try {
        if (p?.Category) {
          const rel = await axios.get(
            `${API_BASE}/api/products?category=${encodeURIComponent(p.Category)}&limit=8`
          );
          if (rel?.data?.products) setRelated(rel.data.products.filter(x => String(x.ID) !== String(id)));
        } else if (p?.Brand) {
          const rel = await axios.get(
            `${API_BASE}/api/products?brand=${encodeURIComponent(p.Brand)}&limit=8`
          );
          if (rel?.data?.products) setRelated(rel.data.products.filter(x => String(x.ID) !== String(id)));
        }
      } catch { /* bỏ qua nếu API không có */ }
    })();
    return () => { mounted = false; };
  }, [id]);

  // ====== Helpers
  const uniqueColors = useMemo(() => [...new Set(variants.map(v => v.Color))], [variants]);
  const uniqueSizes = useMemo(() => [...new Set(variants.map(v => v.Size))], [variants]);

  const sizesByColor = useMemo(() => {
    const map = {};
    variants.forEach(v => {
      map[v.Color] = map[v.Color] || new Set();
      map[v.Color].add(v.Size);
    });
    return map;
  }, [variants]);

  const selectedVariant = useMemo(
    () => variants.find(v => v.Color === selectedColor && v.Size === selectedSize),
    [variants, selectedColor, selectedSize]
  );

  const thumbnails = useMemo(() => {
    const imgs = variants
      .filter(v => !selectedColor || v.Color === selectedColor)
      .map(v => v.ImageURL ? `${API_BASE}${v.ImageURL}` : `${API_BASE}/placeholder.jpg`);
    return [...new Set(imgs)];
  }, [variants, selectedColor]);

  const inStock = (selectedVariant?.StockQuantity || 0) > 0;

  const oldPrice = product?.OldPrice || product?.OriginalPrice || null;
  const price = product?.Price ?? 0;
  const discountPct =
    oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;

  // ====== Events
  const handleColorChange = (color) => {
    setSelectedColor(color);
    // nếu size hiện chưa available cho màu mới -> chọn size đầu tiên của màu
    const available = Array.from(sizesByColor[color] || []);
    const newSize = available.includes(selectedSize) ? selectedSize : available[0] || '';
    setSelectedSize(newSize);
    const v = variants.find(x => x.Color === color && x.Size === newSize);
    setCurrentImage(v?.ImageURL ? `${API_BASE}${v.ImageURL}` : `${API_BASE}/placeholder.jpg`);
  };

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    const v = variants.find(x => x.Color === selectedColor && x.Size === size);
    setCurrentImage(v?.ImageURL ? `${API_BASE}${v.ImageURL}` : `${API_BASE}/placeholder.jpg`);
  };

  const decQty = () => setQty(q => Math.max(1, q - 1));
  const incQty = () => setQty(q => Math.min(99, q + 1));

  const addToCart = () => {
    // TODO: tích hợp giỏ hàng thực tế
    alert(`Đã thêm ${qty} x ${product?.Name} (${selectedColor}/${selectedSize}) vào giỏ.`);
  };

  const buyNow = () => {
    addToCart();
    // TODO: điều hướng checkout
  };

  if (!product) return <div className="container py-5">Đang tải...</div>;

  return (
    <div className="container py-4">
      <Row className="g-4">
        {/* LEFT: IMAGE + THUMBNAILS */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm">
            <div className="position-relative">
              {discountPct ? (
                <Badge bg="danger" className="position-absolute top-0 end-0 m-2 rounded-pill px-3 py-2">
                  -{discountPct}%
                </Badge>
              ) : null}
              <Ratio aspectRatio="4x3">
                <img
                  src={currentImage}
                  alt={product.Name}
                    style={{ objectFit: 'contain', width: '100%', height: '100%', background: '#fff' }}
                />
              </Ratio>
            </div>
          </Card>

          {thumbnails.length > 1 && (
            <Row className="g-2 mt-2">
              {thumbnails.map((src, i) => (
                <Col xs={3} sm={2} md={3} key={i}>
                  <Card
                    className={`border-0 ${src === currentImage ? 'shadow' : 'shadow-sm'}`}
                    onClick={() => setCurrentImage(src)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Ratio aspectRatio="1x1">
                      <img src={src} alt={`thumb-${i}`} style={{ objectFit: 'cover' }} />
                    </Ratio>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>

        {/* RIGHT: INFO */}
        <Col lg={6}>
          <div className="d-flex align-items-center mb-2">
            <div className="me-2 text-warning" aria-label="Đánh giá 5 sao">
              {[...Array(5)].map((_, i) => <FaStar key={i} size={16} color="#FFD700" />)}
            </div>
            <small className="text-muted">1 đánh giá</small>
          </div>

          <h2 className="fw-bold">{product.Name}</h2>

          <div className="d-flex align-items-end gap-2 my-2">
            <span className="fs-3 fw-bold text-danger">{formatVND(price)}</span>
            {oldPrice && (
              <>
                <del className="text-muted">{formatVND(oldPrice)}</del>
                {discountPct ? <Badge bg="danger">-{discountPct}%</Badge> : null}
              </>
            )}
          </div>

          <ListGroup className="mb-3" variant="flush">
            <ListGroup.Item className="px-0 border-0">
              {inStock ? (
                <span className="text-success">✔ Kho hàng: <strong>CÒN HÀNG</strong></span>
              ) : (
                <span className="text-danger">Hết hàng</span>
              )}
              {product?.SKU && <span className="ms-3 text-muted">• Mã SP: {product.SKU}</span>}
            </ListGroup.Item>
          </ListGroup>

          {/* Color */}
          <div className="mb-3">
            <div className="fw-semibold mb-1">Chọn màu:</div>
            {uniqueColors.map(color => (
              <Button
                key={color}
                size="sm"
                variant={selectedColor === color ? 'dark' : 'outline-dark'}
                className="me-2 mb-2 rounded-pill"
                onClick={() => handleColorChange(color)}
              >
                {color}
              </Button>
            ))}
          </div>

          {/* Size */}
          <div className="mb-3">
            <div className="fw-semibold mb-1">Chọn size:</div>
            {uniqueSizes.map(size => {
              const available = sizesByColor[selectedColor]?.has(size);
              return (
                <Button
                  key={size}
                  size="sm"
                  variant={selectedSize === size ? 'primary' : 'outline-primary'}
                  className="me-2 mb-2 rounded-pill"
                  onClick={() => available && handleSizeChange(size)}
                  disabled={!available}
                >
                  {size}
                </Button>
              );
            })}
            <div className="mt-2 small text-muted">Tồn kho: {selectedVariant?.StockQuantity || 0}</div>
          </div>

          {/* Quantity */}
          <div className="d-flex align-items-center mb-3">
            <div className="fw-semibold me-3">Số lượng:</div>
            <InputGroup style={{ width: 140 }}>
              <Button variant="outline-secondary" onClick={decQty}><FiMinus /></Button>
              <Form.Control value={qty} readOnly className="text-center" />
              <Button variant="outline-secondary" onClick={incQty}><FiPlus /></Button>
            </InputGroup>
          </div>

          {/* Actions */}
          <Row className="g-2 my-3">
            <Col sm={6}>
              <Button
                variant="primary"
                className="w-100 py-2"
                onClick={addToCart}
                disabled={!inStock}
              >
                Thêm vào giỏ
              </Button>
            </Col>
            <Col sm={6}>
              <Button
                variant="danger"
                className="w-100 py-2"
                onClick={buyNow}
                disabled={!inStock}
              >
                Mua hàng ngay
              </Button>
            </Col>
          </Row>

          {/* Promo box */}
          <Card className="mb-3 border-0" style={{ background: '#fffdf6' }}>
            <Card.Body className="py-3">
              <div className="d-flex">
                <div className="me-3 text-warning"><FiGift size={24} /></div>
                <div>
                  <div className="fw-semibold">MUA GIÀY TẶNG TẤT CAO CẤP LILY</div>
                  <div className="text-muted small">Tặng tất kháng khuẩn khử mùi cho mỗi đơn hàng.</div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Why choose */}
          <Card className="border-0">
            <Card.Header className="bg-white fw-bold">TẠI SAO CHỌN LILY SHOES?</Card.Header>
            <ListGroup variant="flush">
              {[
                '100% hàng chính hãng/giấy tờ đầy đủ',
                'Đổi hàng trong 30 ngày, bảo hành 6–12 tháng',
                'Uy tín 100.000+ khách hàng tin chọn',
                'Nhân viên tư vấn tận tâm',
                'Miễn phí vận chuyển đơn từ 500.000đ',
              ].map((t, i) => (
                <ListGroup.Item key={i} className="d-flex align-items-start">
                  <FiCheckCircle className="me-2 text-success mt-1" />
                  <span>{t}</span>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      {/* DESCRIPTION & POLICY */}
      <Row className="mt-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Tabs defaultActiveKey="desc" className="mb-3">
                <Tab eventKey="desc" title="Mô tả">
                  <div className="text-secondary" dangerouslySetInnerHTML={{ __html: product.Description || '' }} />
                </Tab>
                <Tab eventKey="spec" title="Thông số">
                  <ListGroup>
                    {product?.SKU && <ListGroup.Item>Mã sản phẩm: {product.SKU}</ListGroup.Item>}
                    {product?.Brand && <ListGroup.Item>Thương hiệu: {product.Brand}</ListGroup.Item>}
                    {product?.Material && <ListGroup.Item>Chất liệu: {product.Material}</ListGroup.Item>}
                    {product?.Category && <ListGroup.Item>Danh mục: {product.Category}</ListGroup.Item>}
                  </ListGroup>
                </Tab>
                <Tab eventKey="policy" title="Chính sách">
                  <ul className="text-secondary mb-0">
                    <li>Đổi size trong 7 ngày, sản phẩm còn tem mác, chưa qua sử dụng.</li>
                    <li>Bảo hành keo/chỉ 6 tháng. Hỗ trợ sửa chữa trọn đời.</li>
                    <li>Giao nhanh toàn quốc, cho xem hàng trước khi thanh toán (COD).</li>
                  </ul>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* RELATED PRODUCTS */}
      {related?.length > 0 && (
        <>
          <h4 className="fw-bold mt-5 mb-3">Sản phẩm tương tự</h4>
          <Row className="g-4">
            {related.map((p) => {
              const img = p?.ThumbnailURL || p?.ImageURL || null;
              const src = img ? `${API_BASE}${img}` : `${API_BASE}/placeholder.jpg`;
              const relPrice = p?.Price ?? 0;
              const relOld = p?.OldPrice || null;
              return (
                <Col key={p.ID} xs={6} md={4} lg={3}>
                  <Card as={Link} to={`/products/${p.ID}`} className="h-100 text-decoration-none border-0 shadow-sm">
                    <Ratio aspectRatio="4x3">
                      <img src={src} alt={p.Name} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                    </Ratio>
                    <Card.Body>
                      <div className="small text-muted mb-1">{p.Brand || 'Lily'}</div>
                      <div className="fw-semibold text-dark mb-1" style={{ minHeight: 44 }}>{p.Name}</div>
                      <div className="d-flex align-items-end gap-2">
                        <span className="text-danger fw-bold">{formatVND(relPrice)}</span>
                        {relOld && <del className="text-muted small">{formatVND(relOld)}</del>}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </>
      )}
    </div>
  );
}
