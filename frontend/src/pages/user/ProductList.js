import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Row, Col, Card, Form, Button, Breadcrumb, InputGroup, Spinner, FloatingLabel
} from 'react-bootstrap';
import ReactPaginate from 'react-paginate';
import { FaSearch, FaTimesCircle, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const API = 'http://localhost:5000';
const LIMIT = 6; // 6 sản phẩm/trang
const PLACEHOLDER = '/placeholder.jpg';

const CATEGORIES = [
  { key: 'sport', label: 'Giày thể thao' },
  { key: 'office', label: 'Giày công sở' },
  { key: 'sandal', label: 'Sandal' },
  { key: 'sneaker', label: 'Sneaker' },
];

const GROUPS = [
  { key: 'Men', label: 'Nam' },
  { key: 'Women', label: 'Nữ' },
  { key: 'Unisex', label: 'Unisex' },
];

const SORTS = [
  { key: '', label: 'Mặc định' },
  { key: 'name_asc', label: 'Tên A → Z' },
  { key: 'name_desc', label: 'Tên Z → A' },
  { key: 'price_asc', label: 'Giá tăng dần' },
  { key: 'price_desc', label: 'Giá giảm dần' },
];

const fmtVND = (n) =>
  typeof n === 'number'
    ? n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
    : '';

/** Lấy ảnh theo (color, size) với cơ chế fallback */
const getVariantImage = (p, color, size) => {
  // 1) Tìm đúng biến thể (size + color)
  if (Array.isArray(p.Variants)) {
    const exact = p.Variants.find(v =>
      v &&
      (v.color?.toLowerCase() === color?.toLowerCase()) &&
      (String(v.size) === String(size))
    );
    if (exact?.imageUrl) return `${API}${exact.imageUrl}`;

    // 2) Chỉ theo màu
    const byColor = p.Variants.find(v => v?.color?.toLowerCase() === color?.toLowerCase() && v.imageUrl);
    if (byColor?.imageUrl) return `${API}${byColor.imageUrl}`;
  }

  // 3) Thuộc tính đơn: ImageBlack / ImageWhite
  if (color?.toLowerCase() === 'black' && p.ImageBlack) return `${API}${p.ImageBlack}`;
  if (color?.toLowerCase() === 'white' && p.ImageWhite) return `${API}${p.ImageWhite}`;

  // 4) Fallback: DefaultImage / HoverImage
  const def = p.DefaultImage ? `${API}${p.DefaultImage}` : PLACEHOLDER;
  return def || PLACEHOLDER;
};

/** Thẻ sản phẩm có chọn màu (đen/trắng) & size, ảnh đổi theo lựa chọn */
function ProductCardItem({ p }) {
  const navigate = useNavigate();

  // Lấy danh sách size từ Variants hoặc p.Sizes
  const sizes = useMemo(() => {
    if (Array.isArray(p?.Variants)) {
      return [...new Set(p.Variants.map(v => String(v.size)).filter(Boolean))].sort((a, b) => +a - +b);
    }
    if (Array.isArray(p?.Sizes)) return p.Sizes.map(String);
    return [];
  }, [p]);

  // Kiểm tra có ảnh theo màu không
  const hasBlack = Boolean(p?.ImageBlack) || (p?.Variants || []).some(v => v?.color?.toLowerCase() === 'black');
  const hasWhite = Boolean(p?.ImageWhite) || (p?.Variants || []).some(v => v?.color?.toLowerCase() === 'white');

  const defaultColor = hasBlack ? 'Black' : (hasWhite ? 'White' : 'Black');
  const [color, setColor] = useState(defaultColor);
  const [size, setSize] = useState(sizes[0] || '');

  useEffect(() => { // nếu dữ liệu đổi
    if (!sizes.includes(size) && sizes.length) setSize(sizes[0]);
  }, [sizes]); // eslint-disable-line

  const currentImg = getVariantImage(p, color, size);
  const hoverImg = p.HoverImage ? `${API}${p.HoverImage}` : currentImg;
  const hasDiscount = p.DiscountedPrice && p.DiscountedPrice < p.Price;

  return (
    <Card className="product-card">
      {hasDiscount && (
        <div className="ribbon">
          -{p.DiscountPercent || Math.round(100 - (p.DiscountedPrice / p.Price) * 100)}%
        </div>
      )}

      {/* Ảnh chính – đổi theo màu/size */}
      <div
        className="product-img-wrapper"
        onClick={() => navigate(`/product/${p.ProductID}`)}
        role="button"
        aria-label={`Xem chi tiết ${p.Name}`}
      >
        <Card.Img
          variant="top"
          src={currentImg}
          onMouseEnter={e => e.currentTarget.src = hoverImg}
          onMouseLeave={e => e.currentTarget.src = getVariantImage(p, color, size)}
          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
          alt={p.Name}
        />
      </div>

      <Card.Body>
        <Card.Title title={p.Name}>{p.Name}</Card.Title>
        <div className="product-meta">{p.CategoryName} • {p.TargetGroup}</div>

        {/* Khung dưới: thumbnail 2 màu Đen & Trắng */}
        <div className="d-flex align-items-center gap-2 mb-2">
          {/* Nút tròn chọn màu */}
          <button
            type="button"
            className="border-0"
            aria-label="Màu đen"
            onClick={() => setColor('Black')}
            style={{
              width: 26, height: 26, borderRadius: '50%',
              background: '#000',
              outline: color === 'Black' ? '2px solid #000' : '1px solid #adb5bd',
              cursor: 'pointer'
            }}
            title="Đen"
          />
          <button
            type="button"
            className="border-0"
            aria-label="Màu trắng"
            onClick={() => setColor('White')}
            style={{
              width: 26, height: 26, borderRadius: '50%',
              background: '#fff',
              outline: color === 'White' ? '2px solid #000' : '1px solid #adb5bd',
              cursor: 'pointer'
            }}
            title="Trắng"
          />

          {/* Thumbnail màu (nằm ở khung dưới) */}
          <div className="d-flex ms-2 gap-2">
            <img
              src={getVariantImage(p, 'Black', size)}
              alt="Đen"
              style={{
                width: 42, height: 42, objectFit: 'cover', borderRadius: 8,
                border: color === 'Black' ? '2px solid #000' : '1px solid #e9ecef',
                cursor: 'pointer'
              }}
              onClick={() => setColor('Black')}
              onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
            />
            <img
              src={getVariantImage(p, 'White', size)}
              alt="Trắng"
              style={{
                width: 42, height: 42, objectFit: 'cover', borderRadius: 8,
                border: color === 'White' ? '2px solid #000' : '1px solid #e9ecef',
                cursor: 'pointer'
              }}
              onClick={() => setColor('White')}
              onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
            />
          </div>
        </div>

        {/* Size – đổi ảnh nếu biến thể có ảnh riêng */}
        {sizes.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mb-3">
            {sizes.map(s => (
              <Button
                key={s}
                size="sm"
                variant={String(size) === String(s) ? 'dark' : 'outline-dark'}
                onClick={() => setSize(s)}
                style={{ borderRadius: 10, minWidth: 44 }}
              >
                {s}
              </Button>
            ))}
          </div>
        )}

        <div className="price-section">
          <span className="price">{fmtVND(p.DiscountedPrice || p.Price)}</span>
          {hasDiscount && <span className="price-old">{fmtVND(p.Price)}</span>}
        </div>

        <Button as={Link} to={`/product/${p.ProductID}`} variant="dark" className="mt-auto">
          Xem chi tiết
        </Button>
      </Card.Body>
    </Card>
  );
}

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const targetGroup = searchParams.get('targetGroup') || '';
  const sort = searchParams.get('sort') || '';

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentKeyword, setCurrentKeyword] = useState(keyword);

  useEffect(() => { setCurrentKeyword(keyword); }, [keyword]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(LIMIT));
        if (keyword) params.set('keyword', keyword);
        if (category) params.set('category', category);
        if (targetGroup) params.set('targetGroup', targetGroup);
        if (sort) params.set('sort', sort);

        const { data } = await axios.get(`${API}/api/products?${params.toString()}`);
        setProducts(data.products || []);
        setTotal(data.total || 0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, keyword, category, targetGroup, sort]);

  const setQS = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) next.delete(k);
      else next.set(k, String(v));
    });
    if (!('page' in patch)) next.set('page', '1');
    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setQS({ keyword: currentKeyword.trim(), page: 1 });
  };

  const handleClearKeyword = () => {
    setCurrentKeyword('');
    setQS({ keyword: '', page: 1 });
  };

  const handleCategoryChange = (key) => setQS({ category: category === key ? '' : key, page: 1 });
  const handleGroupChange = (key) => setQS({ targetGroup: targetGroup === key ? '' : key, page: 1 });
  const handleSort = (e) => setQS({ sort: e.target.value, page: 1 });
  const clearAll = () => setSearchParams({ page: '1' });

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / LIMIT)), [total]);

  return (
    <div className="container py-4">
      <style>{`
        :root {
          --ink: #111;
          --ink-2: #495057;
          --muted: #6c757d;
          --line: #e9ecef;
          --card: #ffffff;
          --shadow: 0 6px 24px rgba(0,0,0,.08);
          --danger: #e53935;
        }
        body { background: #f6f7f9; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif; }
        .container { max-width: 1200px; }
        a { text-decoration: none; }

        .custom-breadcrumb .breadcrumb-item a { color: var(--muted); }
        .custom-breadcrumb .breadcrumb-item.active { color: var(--ink); font-weight: 600; }

        .search-sort-area {
          background: var(--card);
          padding: 1.25rem;
          border-radius: 14px;
          box-shadow: var(--shadow);
          margin-bottom: 1.5rem;
          border: 1px solid var(--line);
        }
        .search-sort-area .form-control,
        .search-sort-area .form-select {
          border-radius: 10px;
          border-color: var(--line);
          transition: box-shadow .2s ease, border-color .2s ease;
        }
        .search-sort-area .form-control:focus,
        .search-sort-area .form-select:focus {
          border-color: var(--ink);
          box-shadow: 0 0 0 .25rem rgba(0,0,0,.08);
        }
        .search-sort-area .input-group-text {
          border-radius: 10px 0 0 10px;
          background: #f1f3f5;
          border-color: var(--line);
        }
        .btn-dark { border-radius: 10px; background:#000; border-color:#000; font-weight:700; }
        .btn-dark:hover { background:#1b1b1b; border-color:#1b1b1b; }

        .filter-sidebar {
          position: sticky; top: 16px;
          background: var(--card);
          padding: 1.25rem;
          border-radius: 14px;
          box-shadow: var(--shadow);
          border: 1px solid var(--line);
        }
        .filter-sidebar .card-title { font-weight: 700; color: var(--ink); margin-bottom: .75rem; }
        .filter-sidebar .form-check { margin-bottom: .6rem; }
        .filter-sidebar .form-check-input { width: 1.1rem; height: 1.1rem; border-color: #ced4da; }
        .filter-sidebar .form-check-input:checked { background-color: var(--ink); border-color: var(--ink); }
        .filter-sidebar .form-check-label { color: var(--ink-2); }

        .product-card {
          border: 1px solid var(--line);
          border-radius: 14px;
          overflow: hidden;
          background: var(--card);
          height: 100%;
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
        }
        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 32px rgba(0,0,0,.12);
          border-color: #dfe3e6;
        }
        .product-img-wrapper {
          position: relative; width: 100%; padding-bottom: 75%;
          overflow: hidden; cursor: pointer; background:#fafafa;
        }
        .product-img-wrapper img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; transition: opacity .25s ease, transform .25s ease;
        }
        .product-img-wrapper:hover img { transform: scale(1.02); }

        .card-body { padding: .9rem .95rem 1rem; display:flex; flex-direction:column; }
        .product-card .card-title {
          font-size: 1rem; font-weight: 700; color: var(--ink); margin-bottom: .35rem;
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height: 42px;
        }
        .product-card .product-meta { font-size: .85rem; color: var(--muted); margin-bottom: .6rem; }

        .price-section { display:flex; align-items:baseline; gap:.5rem; margin-bottom: .8rem; }
        .price { font-size: 1.15rem; font-weight: 800; color: var(--ink); }
        .price-old { font-size: .9rem; text-decoration: line-through; color: #9aa0a6; }

        .ribbon {
          position: absolute; top: 10px; right: 10px;
          background: var(--danger); color: #fff; padding: 4px 10px;
          font-size: .75rem; font-weight: 700; border-radius: 999px; z-index: 10;
          box-shadow: 0 2px 10px rgba(229,57,53,.25);
        }
        .ribbon::before {
          content: "";
          position: absolute;
          top: 0;
          right: -6px;
          border-top: 14px solid transparent;
          border-bottom: 14px solid transparent;
          border-left: 6px solid var(--danger);
        }

        .pagination-container { padding: 1rem 0; border-top: 1px solid var(--line); margin-top: 1.25rem; }
        .pagination { gap: .5rem; justify-content: center; }
        .pagination .page-item .page-link {
          border-radius: 10px; min-width: 40px; text-align:center; color: var(--ink);
          border: 1px solid var(--line); background:#fff;
        }
        .pagination .page-item .page-link:hover { background:#f1f3f5; }
        .pagination .page-item.active .page-link { background:#000; border-color:#000; color:#fff; }
        .pagination .page-item.disabled .page-link { color:#adb5bd; background:#fff; border-color:var(--line); }
      `}</style>

      {/* Breadcrumb + Navigation */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <Breadcrumb className="mb-0 custom-breadcrumb">
          <Breadcrumb.Item as={Link} to="/">Trang chủ</Breadcrumb.Item>
          <Breadcrumb.Item active>Sản phẩm</Breadcrumb.Item>
        </Breadcrumb>
        <div className="d-flex gap-2">
          <Button variant="outline-dark" size="sm" onClick={() => navigate(-1)}>
            <FaChevronLeft className="me-1" /> Quay lại
          </Button>
          <Button as={Link} to="/" variant="dark" size="sm">🏠 Home</Button>
        </div>
      </div>

      {/* Search + Sort + Clear All */}
      <div className="search-sort-area">
        <Row className="g-3 align-items-center">
          <Col md={7} lg={6}>
            <Form onSubmit={(e) => { e.preventDefault(); setQS({ keyword: currentKeyword.trim(), page: 1 }); }}>
              <InputGroup>
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control
                  placeholder="Tìm theo tên sản phẩm…"
                  value={currentKeyword}
                  onChange={(e) => setCurrentKeyword(e.target.value)}
                />
                {currentKeyword && (
                  <Button variant="light" onClick={() => { setCurrentKeyword(''); setQS({ keyword: '', page: 1 }); }} aria-label="Xóa từ khóa">
                    <FaTimesCircle className="text-muted" />
                  </Button>
                )}
                <Button type="submit" variant="dark">Tìm kiếm</Button>
              </InputGroup>
            </Form>
          </Col>
          <Col md={5} lg={3}>
            <FloatingLabel controlId="sortSelect" label="Sắp xếp theo">
              <Form.Select value={sort} onChange={(e) => setQS({ sort: e.target.value, page: 1 })}>
                {SORTS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </Form.Select>
            </FloatingLabel>
          </Col>
          <Col lg={3} className="text-lg-end">
            {(keyword || category || targetGroup || sort) && (
              <Button variant="outline-dark" onClick={() => setSearchParams({ page: '1' })}>
                <FaTimesCircle className="me-1" /> Bỏ tất cả lọc
              </Button>
            )}
          </Col>
        </Row>
      </div>

      <Row className="g-4">
        {/* Filter Sidebar */}
        <Col lg={3}>
          <div className="filter-sidebar">
            <Card.Title className="mb-3">Bộ lọc</Card.Title>

            <div className="mb-4">
              <h6 className="mb-2 text-muted">Danh mục</h6>
              {CATEGORIES.map(c => (
                <Form.Check
                  key={c.key}
                  type="checkbox"
                  id={`category-${c.key}`}
                  label={c.label}
                  checked={category === c.key}
                  onChange={() => setQS({ category: category === c.key ? '' : c.key, page: 1 })}
                />
              ))}
            </div>

            <div className="mb-2">
              <h6 className="mb-2 text-muted">Giới tính</h6>
              {GROUPS.map(g => (
                <Form.Check
                  key={g.key}
                  type="radio"
                  id={`group-${g.key}`}
                  label={g.label}
                  name="targetGroupFilter"
                  checked={targetGroup === g.key}
                  onChange={() => setQS({ targetGroup: targetGroup === g.key ? '' : g.key, page: 1 })}
                />
              ))}
            </div>
          </div>
        </Col>

        {/* Product List */}
        <Col lg={9}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              {loading ? (
                <span className="text-muted">Đang tải sản phẩm…</span>
              ) : (
                <span className="fw-semibold">Tìm thấy {total} sản phẩm</span>
              )}
            </div>
            {(keyword || category || targetGroup || sort) && (
              <span className="text-muted small">(đang áp dụng lọc/tìm kiếm)</span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </Spinner>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center text-muted py-5">
              <p className="fs-5">Không có sản phẩm phù hợp.</p>
              <p>Hãy thử bỏ bớt điều kiện lọc hoặc tìm kiếm khác.</p>
              {(keyword || category || targetGroup || sort) && (
                <Button variant="link" onClick={() => setSearchParams({ page: '1' })}>Bỏ tất cả lọc</Button>
              )}
            </div>
          ) : (
            <Row xs={1} sm={2} md={3} lg={3} className="g-4">
              {products.map(p => (
                <Col key={p.ProductID}>
                  <ProductCardItem p={p} />
                </Col>
              ))}
            </Row>
          )}

          {/* Pagination */}
          {products.length > 0 && (
            <div className="d-flex justify-content-center pagination-container">
              <ReactPaginate
                previousLabel={<FaChevronLeft />}
                nextLabel={<FaChevronRight />}
                breakLabel="..."
                forcePage={Math.min(page, pageCount) - 1}
                pageCount={pageCount}
                marginPagesDisplayed={2}
                pageRangeDisplayed={3}
                onPageChange={(ev) => setQS({ page: ev.selected + 1 })}
                containerClassName="pagination"
                pageClassName="page-item"
                pageLinkClassName="page-link"
                previousClassName="page-item"
                previousLinkClassName="page-link"
                nextClassName="page-item"
                nextLinkClassName="page-link"
                breakClassName="page-item"
                breakLinkClassName="page-link"
                activeClassName="active"
              />
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
}
