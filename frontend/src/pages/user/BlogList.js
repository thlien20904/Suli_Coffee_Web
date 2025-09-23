import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Row, Col, Card, Form, Button, Breadcrumb, InputGroup, Spinner, Badge, FloatingLabel,
} from 'react-bootstrap';
import ReactPaginate from 'react-paginate';
import {
  FaSearch, FaTimesCircle, FaChevronLeft, FaChevronRight, FaClock, FaTag, FaFolderOpen,
} from 'react-icons/fa';

const API = 'http://localhost:5000';
const LIMIT = 9; // 9 bài/trang
const PLACEHOLDER = '/blog-placeholder.jpg'; // ảnh dự phòng tuỳ bạn

// ƯỚC TÍNH đọc (phút) nếu API chưa trả sẵn ReadMinutes
const estimateReadMin = (txt = '') =>
  Math.max(1, Math.round((txt.replace(/<[^>]+>/g, '').split(/\s+/).length || 200) / 200));

export default function BlogList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Query state
  const page     = parseInt(searchParams.get('page') || '1', 10);
  const keyword  = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || ''; // slug
  const tag      = searchParams.get('tag') || '';      // slug
  const sort     = searchParams.get('sort') || '';     // newest, popular, oldest

  // Local state
  const [loading, setLoading] = useState(true);
  const [posts, setPosts]     = useState([]);
  const [total, setTotal]     = useState(0);

  const [categories, setCategories] = useState([]);
  const [tags, setTags]             = useState([]);
  const [kwInput, setKwInput]       = useState(keyword);

  // Fetch danh mục + tag 1 lần
  useEffect(() => {
    (async () => {
      try {
        const [cRs, tRs] = await Promise.allSettled([
          axios.get(`${API}/api/blogs/categories`),
          axios.get(`${API}/api/blogs/tags`),
        ]);
        if (cRs.status === 'fulfilled') setCategories(cRs.value.data || []);
        if (tRs.status === 'fulfilled') setTags(tRs.value.data || []);
      } catch {}
    })();
  }, []);

  // Đồng bộ input tìm kiếm khi user đổi query qua URL
  useEffect(() => setKwInput(keyword), [keyword]);

  // Fetch danh sách bài theo query
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(LIMIT));
        if (keyword)  params.set('keyword', keyword);
        if (category) params.set('category', category);
        if (tag)      params.set('tag', tag);
        if (sort)     params.set('sort', sort);

        const { data } = await axios.get(`${API}/api/blogs?${params.toString()}`);
        setPosts(data?.posts || []);
        setTotal(data?.total || 0);
      } catch (err) {
        setPosts([]);
        setTotal(0);
        // console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [page, keyword, category, tag, sort]);

  // Helpers cập nhật query string
  const setQS = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) next.delete(k);
      else next.set(k, String(v));
    });
    if (!('page' in patch)) next.set('page', '1');
    setSearchParams(next);
  };

  const onSubmitSearch = (e) => {
    e.preventDefault();
    setQS({ keyword: kwInput.trim(), page: 1 });
  };
  const clearAll = () => setSearchParams({ page: '1' });

  const handlePickCategory = (slug) => setQS({ category: category === slug ? '' : slug, page: 1 });
  const handlePickTag      = (slug) => setQS({ tag: tag === slug ? '' : slug, page: 1 });
  const handleSort         = (e)   => setQS({ sort: e.target.value, page: 1 });

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / LIMIT)), [total]);

  // Featured post = bài đầu
  const [featured, others] = posts.length ? [posts[0], posts.slice(1)] : [null, []];

  return (
    <div className="container py-4">
      <style>{`
        :root {
          --ink: #111;
          --ink-2: #495057;
          --muted: #6c757d;
          --line: #e9ecef;
          --card: #ffffff;
          --shadow: 0 8px 30px rgba(0,0,0,.08);
          --primary: #000;
          --chip: #f1f3f5;
        }
        body { background:#f6f7f9; }

        .hero {
          background: radial-gradient(1200px 200px at 10% -20%, rgba(0,0,0,.08), transparent),
                      radial-gradient(800px 160px at 90% -10%, rgba(0,0,0,.06), transparent),
                      #fff;
          border: 1px solid var(--line);
          box-shadow: var(--shadow);
          border-radius: 18px;
          padding: 28px 28px;
          margin-bottom: 18px;
        }
        .hero h1 { font-weight: 800; letter-spacing:-.3px; }
        .hero p  { color: var(--ink-2); margin: 0; }

        .sidebar {
          position: sticky; top: 16px;
          background: var(--card); border:1px solid var(--line); border-radius:14px; box-shadow: var(--shadow);
          padding: 1.1rem 1.1rem;
        }
        .chip {
          display:inline-flex; align-items:center; gap:.4rem;
          background: var(--chip); border:1px solid #e7eaee; border-radius:999px;
          padding:.35rem .7rem; font-size:.85rem; color:#222; cursor:pointer; margin:0 .45rem .45rem 0;
          transition: transform .15s ease, background .15s ease;
        }
        .chip:hover { transform: translateY(-1px); background:#e9ecef; }
        .chip.active { background:#111; color:#fff; border-color:#111; }

        .post-card { border:1px solid var(--line); border-radius:14px; overflow:hidden; background:#fff; height:100%;
          transition: transform .2s ease, box-shadow .2s ease; }
        .post-card:hover { transform: translateY(-3px); box-shadow: 0 14px 38px rgba(0,0,0,.10); }
        .cover-wrap { position:relative; padding-bottom:56.5%; background:#fafafa; }
        .cover-wrap img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }

        .meta { color: var(--muted); font-size:.9rem; display:flex; gap:.75rem; align-items:center; flex-wrap:wrap; }
        .meta svg { opacity:.8; }

        .featured { border-radius:16px; overflow:hidden; border:1px solid var(--line); background:#fff; box-shadow: var(--shadow); }
        .featured .cover-wrap { padding-bottom: 45%; }
        .featured .content { padding: 1rem 1.1rem 1.25rem; }
        .badge-cat { background:#000; }

        .paginate { gap:.5rem; justify-content:center; }
        .paginate .page-item .page-link { border-radius:10px; min-width:42px; text-align:center; color:#000; border:1px solid var(--line); }
        .paginate .page-item.active .page-link { background:#000; border-color:#000; color:#fff; }
      `}</style>

      {/* Breadcrumb + Hero */}
      <div className="mb-3 d-flex align-items-center justify-content-between">
        <Breadcrumb className="mb-0">
          <Breadcrumb.Item as={Link} to="/">Trang chủ</Breadcrumb.Item>
          <Breadcrumb.Item active>Blog</Breadcrumb.Item>
        </Breadcrumb>
        <div className="d-flex gap-2">
          <Button variant="outline-dark" size="sm" onClick={() => navigate(-1)}>
            <FaChevronLeft className="me-1" /> Quay lại
          </Button>
          <Button as={Link} to="/" variant="dark" size="sm">🏠 Home</Button>
        </div>
      </div>

      <div className="hero">
        <h1 className="h3 mb-2">Blog &amp; Cảm hứng</h1>
        <p>Xu hướng, mẹo phối đồ, review giày mới… cập nhật mỗi tuần cho bạn yêu giày.</p>
      </div>

      <Row className="g-4">
        {/* Sidebar */}
        <Col lg={3}>
          <div className="sidebar">
            <Form onSubmit={onSubmitSearch} className="mb-3">
              <InputGroup>
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control
                  placeholder="Tìm bài viết…"
                  value={kwInput}
                  onChange={(e) => setKwInput(e.target.value)}
                />
                {kwInput && (
                  <Button variant="light" onClick={() => { setKwInput(''); setQS({ keyword: '', page: 1 }); }}>
                    <FaTimesCircle className="text-muted" />
                  </Button>
                )}
                <Button type="submit" variant="dark">Tìm</Button>
              </InputGroup>
            </Form>

            <div className="mb-3">
              <div className="d-flex align-items-center mb-2">
                <FaFolderOpen className="me-2 text-muted" />
                <strong>Danh mục</strong>
              </div>
              <div>
                {categories.length === 0 ? (
                  <div className="text-muted small">Chưa có danh mục</div>
                ) : (
                  categories.map(c => (
                    <button
                      key={c.slug || c.id}
                      className={`chip ${category === (c.slug || '') ? 'active' : ''}`}
                      onClick={() => handlePickCategory(c.slug)}
                      type="button"
                      title={c.name}
                    >
                      {c.name}
                      {typeof c.count === 'number' ? <Badge bg={category === c.slug ? 'light' : 'secondary'}>{c.count}</Badge> : null}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="mb-2">
              <div className="d-flex align-items-center mb-2">
                <FaTag className="me-2 text-muted" />
                <strong>Tags</strong>
              </div>
              <div>
                {tags.length === 0 ? (
                  <div className="text-muted small">Chưa có tag</div>
                ) : (
                  tags.map(t => (
                    <button
                      key={t.slug || t.id}
                      className={`chip ${tag === (t.slug || '') ? 'active' : ''}`}
                      onClick={() => handlePickTag(t.slug)}
                      type="button"
                      title={t.name}
                    >
                      #{t.name}
                      {typeof t.count === 'number' ? <Badge bg={tag === t.slug ? 'light' : 'secondary'}>{t.count}</Badge> : null}
                    </button>
                  ))
                )}
              </div>
            </div>

            {(keyword || category || tag || sort) && (
              <div className="mt-3">
                <Button variant="outline-dark" size="sm" onClick={clearAll}>
                  <FaTimesCircle className="me-1" /> Bỏ tất cả lọc
                </Button>
              </div>
            )}
          </div>
        </Col>

        {/* Main content */}
        <Col lg={9}>
          {/* Sort + Head count */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              {loading ? (
                <span className="text-muted">Đang tải bài viết…</span>
              ) : (
                <span className="fw-semibold">Tìm thấy {total} bài viết</span>
              )}
              {(keyword || category || tag || sort) && (
                <span className="text-muted small ms-2">(đang áp dụng lọc/tìm kiếm)</span>
              )}
            </div>
            <div style={{ minWidth: 220 }}>
              <FloatingLabel label="Sắp xếp">
                <Form.Select value={sort} onChange={handleSort}>
                  <option value="">Mặc định (mới nhất)</option>
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="popular">Phổ biến</option>
                </Form.Select>
              </FloatingLabel>
            </div>
          </div>

          {/* Featured + Grid */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status"><span className="visually-hidden">Loading…</span></Spinner>
            </div>
          ) : total === 0 ? (
            <div className="text-center text-muted py-5">
              <p className="fs-5">Chưa có bài phù hợp.</p>
              <Button variant="link" onClick={clearAll}>Bỏ tất cả lọc</Button>
            </div>
          ) : (
            <>
              {featured && (
                <Card className="featured mb-4">
                  <div className="cover-wrap">
                    <img
                      src={featured.CoverUrl || PLACEHOLDER}
                      alt={featured.Title}
                      onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                    />
                  </div>
                  <div className="content">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      {featured.CategoryName && <Badge className="badge-cat">{featured.CategoryName}</Badge>}
                      <div className="meta">
                        <span><FaClock className="me-1" />{featured.ReadMinutes || estimateReadMin(featured.Summary)} phút đọc</span>
                        <span>• {featured.PublishedAt ? new Date(featured.PublishedAt).toLocaleDateString('vi-VN') : ''}</span>
                      </div>
                    </div>
                    <h2 className="h5 mb-2">
                      <Link to={`/blog/${featured.Slug || featured.BlogID}`}>{featured.Title}</Link>
                    </h2>
                    <p className="mb-3 text-muted">
                      {featured.Summary || featured.Excerpt || ''}
                    </p>
                    <Button as={Link} to={`/blog/${featured.Slug || featured.BlogID}`} variant="dark">
                      Đọc tiếp
                    </Button>
                  </div>
                </Card>
              )}

              <Row xs={1} sm={2} md={3} className="g-4">
                {others.map((p) => (
                  <Col key={p.BlogID || p.Slug}>
                    <Card className="post-card">
                      <div className="cover-wrap">
                        <img
                          src={p.CoverUrl || PLACEHOLDER}
                          alt={p.Title}
                          onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                        />
                      </div>
                      <Card.Body>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          {p.CategoryName && <Badge bg="dark">{p.CategoryName}</Badge>}
                          <div className="meta">
                            <span><FaClock className="me-1" />{p.ReadMinutes || estimateReadMin(p.Summary)}’</span>
                            <span>• {p.PublishedAt ? new Date(p.PublishedAt).toLocaleDateString('vi-VN') : ''}</span>
                          </div>
                        </div>
                        <Card.Title className="fs-6" style={{ minHeight: 48 }}>
                          <Link to={`/blog/${p.Slug || p.BlogID}`}>{p.Title}</Link>
                        </Card.Title>
                        <Card.Text className="text-muted" style={{ minHeight: 60 }}>
                          {p.Excerpt || p.Summary || ''}
                        </Card.Text>
                        <Button as={Link} to={`/blog/${p.Slug || p.BlogID}`} variant="dark">Đọc tiếp</Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Pagination */}
              <div className="d-flex justify-content-center mt-4 pt-3 border-top">
                <ReactPaginate
                  previousLabel={<FaChevronLeft />}
                  nextLabel={<FaChevronRight />}
                  breakLabel="…"
                  forcePage={Math.min(page, pageCount) - 1}
                  pageCount={pageCount}
                  marginPagesDisplayed={2}
                  pageRangeDisplayed={3}
                  onPageChange={(ev) => setQS({ page: ev.selected + 1 })}
                  containerClassName="pagination paginate"
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
            </>
          )}
        </Col>
      </Row>
    </div>
  );
}
