import { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Carousel,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import "../../styles/pages/Home.css";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const banners = [
    {
      src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1600&q=80",
      title: "New Season Arrivals",
      subtitle: "Discover latest sneaker trends",
    },
    {
      src: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
      title: "Comfort & Style",
      subtitle: "Engineered for all-day comfort",
    },
    {
      src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1600&q=80",
      title: "Limited Edition",
      subtitle: "Grab yours before sold out",
    },
  ];

  useEffect(() => {
    const fetchHome = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:5000/api/home");
        setProducts(res.data.products || []);
        setBlogs(res.data.blogs || []);
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu trang chủ:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHome();
  }, []);

  return (
    <div className="home-root">
      {/* Banner carousel */}
      <Carousel fade className="home-carousel">
        {banners.map((b, idx) => (
          <Carousel.Item key={idx}>
            <img
              className="d-block w-100 banner-img"
              src={b.src}
              alt={`banner-${idx}`}
            />
            <Carousel.Caption className="banner-caption">
              <h1>{b.title}</h1>
              <p>{b.subtitle}</p>
              <Button
                as={Link}
                to="/products"
                variant="light"
                className="mt-2"
              >
                Khám phá ngay
              </Button>
            </Carousel.Caption>
          </Carousel.Item>
        ))}
      </Carousel>

      <Container className="mt-5">
        {/* Featured products */}
        <section className="section">
          <div className="section-header d-flex justify-content-between align-items-end">
            <div>
              <h2>Sản phẩm mới</h2>
              <p className="text-muted">
                Bộ sưu tập được cập nhật thường xuyên
              </p>
            </div>
            <Button as={Link} to="/products" variant="outline-primary">
              Xem tất cả
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-5">Đang tải sản phẩm...</div>
          ) : (
            <Row className="g-4">
              {products.map((prod) => (
                <Col key={prod.ProductID} xs={12} sm={6} md={4} lg={3}>
                  <Card className="product-card h-100">
                    <div className="thumb-wrap">
                      <Card.Img
                        variant="top"
                        src={
                          prod.DefaultImage.startsWith("/")
                            ? `http://localhost:5000${prod.DefaultImage}`
                            : prod.DefaultImage
                        }
                        onError={(e) => {
                          e.target.src = "/placeholder.jpg";
                        }}
                        className="product-img"
                      />
                      {prod.DiscountPercent > 0 && (
                        <Badge bg="danger" className="discount-badge">
                          -{prod.DiscountPercent}%
                        </Badge>
                      )}
                    </div>
                    <Card.Body className="d-flex flex-column">
                      <Card.Title className="product-name">
                        {prod.Name}
                      </Card.Title>
                      <Card.Text className="product-cat">
                        {prod.CategoryName}
                      </Card.Text>
                      <div className="mt-auto d-flex justify-content-between align-items-center">
                        <div>
                          <div className="price">
                            {Number(
                              prod.DiscountedPrice || prod.Price
                            ).toLocaleString()}{" "}
                            <small>VNĐ</small>
                          </div>
                        </div>
                        <Button
                          as={Link}
                          to={`/product/${prod.ProductID}`}
                          variant="primary"
                          size="sm"
                        >
                          Xem
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </section>

        {/* Latest blogs */}
        <section className="section mt-5">
          <div className="section-header d-flex justify-content-between align-items-end">
            <div>
              <h2>Tin tức & Xu hướng</h2>
              <p className="text-muted">Bài viết mới nhất từ Shoe Store</p>
            </div>
            <Button as={Link} to="/blogs" variant="outline-primary">
              Xem blog
            </Button>
          </div>

          <Row className="g-4 mt-2">
            {blogs.map((blog) => (
              <Col key={blog.BlogID} md={4}>
                <Card className="blog-card h-100">
                  <Card.Img
                    variant="top"
                    src={
                      blog.ImageURL.startsWith("/")
                        ? `http://localhost:5000${blog.ImageURL}`
                        : blog.ImageURL
                    }
                    onError={(e) => {
                      e.target.src = "/placeholder-blog.jpg";
                    }}
                    style={{ height: 180, objectFit: "cover" }}
                  />
                  <Card.Body className="d-flex flex-column">
                    <Card.Title className="mb-2">{blog.Title}</Card.Title>
                    <Card.Text className="text-muted small">
                      {new Date(blog.CreatedAt).toLocaleDateString()}
                    </Card.Text>
                    <Card.Text className="truncate">
                      {blog.Excerpt}...
                    </Card.Text>
                    <div className="mt-auto">
                      <Button
                        as={Link}
                        to={`/blog/${blog.BlogID}`}
                        variant="outline-secondary"
                        size="sm"
                      >
                        Đọc tiếp
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </section>
      </Container>
    </div>
  );
}
