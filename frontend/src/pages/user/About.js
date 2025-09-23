// src/pages/About.jsx
import React from 'react';
import {
  Container, Row, Col, Card, Badge, Image, Button,
  Carousel, Accordion
} from 'react-bootstrap';
import {
  FiAward, FiTruck, FiCheckCircle, FiShield,
  FiRotateCcw, FiPhoneCall, FiThumbsUp, FiStar
} from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';

/* ================== LOGO ĐỐI TÁC (SVG nội bộ – không phụ thuộc mạng) ================== */
const LogoA = ({ h = 32 }) => (
  <svg height={h} viewBox="0 0 160 40" role="img" aria-label="Đối tác 1">
    <defs>
      <linearGradient id="g1" x1="0" x2="1">
        <stop offset="0" stopColor="#b08a38" /><stop offset="1" stopColor="#d4af37" />
      </linearGradient>
    </defs>
    <rect rx="6" width="60" height="36" y="2" fill="url(#g1)" />
    <text x="32" y="26" textAnchor="middle" fontSize="16" fill="#fff" fontWeight="700">LS</text>
    <text x="70" y="26" fontSize="16" fill="#444" fontWeight="600">Logistics</text>
  </svg>
);
const LogoB = ({ h = 32 }) => (
  <svg height={h} viewBox="0 0 160 40" role="img" aria-label="Đối tác 2">
    <circle cx="20" cy="20" r="16" fill="#444" />
    <circle cx="20" cy="20" r="12" fill="#f0e6cc" />
    <circle cx="20" cy="20" r="8" fill="#444" />
    <text x="44" y="26" fontSize="16" fill="#444" fontWeight="600">Retail Group</text>
  </svg>
);
const LogoC = ({ h = 32 }) => (
  <svg height={h} viewBox="0 0 160 40" role="img" aria-label="Đối tác 3">
    <rect x="4" y="8" width="52" height="24" rx="12" fill="#444" />
    <rect x="10" y="12" width="40" height="16" rx="8" fill="#f0e6cc" />
    <text x="76" y="26" fontSize="16" fill="#444" fontWeight="600">Fashion Co</text>
  </svg>
);
const LogoD = ({ h = 32 }) => (
  <svg height={h} viewBox="0 0 160 40" role="img" aria-label="Đối tác 4">
    <polygon points="8,32 24,8 40,32" fill="#444" />
    <rect x="46" y="10" width="4" height="20" fill="#444" />
    <text x="56" y="26" fontSize="16" fill="#444" fontWeight="600">Supply Hub</text>
  </svg>
);

/* ================== ẢNH CỤC BỘ (đặt trong /public/images) ================== */
const HERO_IMG = '/images/lily-shop-hero.jpg';       // Ảnh shop ngang – sang trọng
const GALLERY_IMG = '/images/lily-shop-gallery.jpg'; // Ảnh kệ giày & ghế vàng

/* Fallback nhúng – bảo đảm luôn render nếu thiếu file cục bộ */
const FALLBACK_DATA_URI =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">
      <defs><linearGradient id="bg" x1="0" x2="1">
        <stop offset="0" stop-color="#f3f4f6"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <text x="50%" y="48%" font-family="Georgia,serif" font-size="28" text-anchor="middle" fill="#C9A646">LILY SHOES</text>
      <text x="50%" y="56%" font-family="Arial" font-size="16" text-anchor="middle" fill="#9aa3af">Hình ảnh đang tải…</text>
    </svg>`
  );

/* ================== TIỆN ÍCH ================== */
const Stars = () => (
  <div className="mb-2">
    {[...Array(5)].map((_, i) => (
      <FaStar key={i} color="#FFD700" size={18} style={{ marginRight: 3 }} />
    ))}
  </div>
);

export default function About() {
  const onImgError = (e) => { e.currentTarget.src = FALLBACK_DATA_URI; };
  const navBtnStyle = {
    display: 'grid',
    placeItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 999,
    background: '#111',
    color: '#fff',
    fontSize: 24,
    boxShadow: '0 10px 20px rgba(0,0,0,.25)',
    opacity: 0.92
  };

  return (
    <>
      {/* ====== HERO SANG TRỌNG – SHOP LILY ====== */}
      <section
        className="py-5 position-relative"
        style={{
          background: 'linear-gradient(135deg, #f0e6cc 0%, #ffffff 100%)',
          borderBottom: '1px solid #e0d8c8', overflow: 'hidden'
        }}
        aria-label="Shop giày Lily"
      >
        {/* Accent gold */}
        <div aria-hidden="true" style={{
          position: 'absolute', right: -140, top: -140, width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #ffd700, #f0e6cc 60%)', filter: 'blur(8px)', opacity: .5
        }}/>
        <Container>
          <Row className="align-items-center g-4">
            <Col lg={6}>
              {/* Brand pill ĐEN chữ trắng (như ảnh bạn gửi) */}
              <Button
                className="mb-3 px-4 py-2 fw-semibold"
                style={{
                  background:'#000', color:'#fff', border:'none',
                  borderRadius:999, letterSpacing:'1px'
                }}
              >
                LILY SHOES
              </Button>

              <h1 className="fw-bold mb-3" style={{letterSpacing:'0.5px', color:'#333', fontSize:'3rem'}}>
                Nâng tầm phong cách <br/>với giày da cao cấp
              </h1>
              <p className="text-secondary fs-5 mb-4" style={{color:'#555'}}>
                Tinh gọn – êm ái – bền bỉ. Nghệ thuật thủ công gặp gỡ thiết kế hiện đại, mang đến vẻ đẹp tinh tế cho mỗi bước chân.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Button as="a" href="/collections" style={{backgroundColor:'#d4af37', borderColor:'#d4af37', color:'#111'}} className="px-4 py-2 fw-bold shadow-sm">
                  Khám phá bộ sưu tập
                </Button>
                <Button as="a" href="/stores" variant="outline" className="px-4 py-2 fw-bold" style={{borderColor:'#d4af37', color:'#d4af37'}}>
                  Về cửa hàng
                </Button>
              </div>
            </Col>
            <Col lg={6}>
              <Card className="border-0 shadow-lg overflow-hidden" style={{borderTop:'5px solid #d4af37', borderRadius:10}}>
                <Image
                  src={HERO_IMG}
                  alt="Không gian Shop Lily – kệ trưng bày giày cao cấp"
                  fluid loading="lazy" decoding="async" onError={onImgError}
                  style={{objectFit:'cover', height: 420, width:'100%'}}
                />
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ====== VỀ CHÚNG TÔI ====== */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="mb-4 justify-content-between align-items-center">
            <Col lg={7}>
              <h2 className="fw-bold mb-2" style={{color: '#333'}}>Về Lily Shoes</h2>
              <p className="text-muted mb-0 fs-5">Tôn vinh vẻ đẹp Việt qua từng thiết kế tinh xảo.</p>
            </Col>
            <Col lg="auto" className="d-none d-lg-block">
              <Badge bg="warning" text="dark" className="border-0 px-3 py-2 fw-normal">
                Thành lập 2018 · 150.000+ khách hàng
              </Badge>
            </Col>
          </Row>

          <Row className="g-4">
            <Col md={4}>
              <Card className="h-100 shadow-sm border-0" style={{borderRadius:10}}>
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <FiCheckCircle className="me-3" size={28} color="#d4af37" aria-hidden="true" />
                    <h5 className="fw-bold mb-0" style={{color:'#333'}}>Sứ mệnh</h5>
                  </div>
                  <p className="mb-0 text-secondary">
                    Kiến tạo những đôi giày cao cấp, mang lại sự tự tin và thoải mái tối đa cho khách hàng Việt.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 shadow-sm border-0" style={{borderRadius:10}}>
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <FiAward className="me-3" size={28} color="#d4af37" aria-hidden="true" />
                    <h5 className="fw-bold mb-0" style={{color:'#333'}}>Tầm nhìn</h5>
                  </div>
                  <p className="mb-0 text-secondary">
                    Trở thành thương hiệu giày da được yêu thích hàng đầu tại Việt Nam về thiết kế & dịch vụ.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 shadow-sm border-0" style={{borderRadius:10}}>
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <FiShield className="me-3" size={28} color="#d4af37" aria-hidden="true" />
                    <h5 className="fw-bold mb-0" style={{color:'#333'}}>Giá trị cốt lõi</h5>
                  </div>
                  <ul className="mb-0 text-secondary ps-3">
                    <li>Chất liệu cao cấp, hoàn thiện tinh xảo</li>
                    <li>Thiết kế tối giản nhưng khác biệt</li>
                    <li>Lấy khách hàng làm trung tâm</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ====== LỢI ÍCH CHÍNH ====== */}
      <section className="py-5">
        <Container>
          <Row className="mb-4">
            <Col>
              <h2 className="fw-bold" style={{color:'#333'}}>Điểm khác biệt của Lily</h2>
              <p className="text-muted mb-0 fs-5">Nơi chất lượng và sự tận tâm hòa quyện.</p>
            </Col>
          </Row>
          <Row className="g-4">
            <Col md={4}>
              <Card className="border-0 h-100 shadow-sm" style={{borderTop:'4px solid #d4af37', borderRadius:10}}>
                <Card.Body className="d-flex">
                  <FiTruck size={32} className="me-3 mt-1" color="#d4af37" aria-hidden="true" />
                  <div>
                    <h6 className="fw-bold mb-1" style={{color:'#333'}}>Vận chuyển nhanh & đổi trả dễ</h6>
                    <p className="mb-0 text-secondary">Miễn phí đổi size 7 ngày. Giao hàng toàn quốc, đóng gói cẩn thận.</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 h-100 shadow-sm" style={{borderTop:'4px solid #d4af37', borderRadius:10}}>
                <Card.Body className="d-flex">
                  <FiRotateCcw size={32} className="me-3 mt-1" color="#d4af37" aria-hidden="true" />
                  <div>
                    <h6 className="fw-bold mb-1" style={{color:'#333'}}>Bảo hành vượt trội</h6>
                    <p className="mb-0 text-secondary">Bảo hành keo/chỉ 6 tháng. Hỗ trợ sửa chữa trọn đời sản phẩm.</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 h-100 shadow-sm" style={{borderTop:'4px solid #d4af37', borderRadius:10}}>
                <Card.Body className="d-flex">
                  <FiStar size={32} className="me-3 mt-1" color="#d4af37" aria-hidden="true" />
                  <div>
                    <h6 className="fw-bold mb-1" style={{color:'#333'}}>Chất liệu & hoàn thiện đỉnh cao</h6>
                    <p className="mb-0 text-secondary">Da bò chọn lọc, đế cao su thiên nhiên. Êm ái – bền bỉ.</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ====== SỐ LIỆU + TRUST BAR ====== */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="text-center g-4">
            <Col md={3} xs={6}><h3 className="fw-bold mb-0" style={{color:'#d4af37'}}>150k+</h3><small className="text-muted fs-6">Khách hàng tin yêu</small></Col>
            <Col md={3} xs={6}><h3 className="fw-bold mb-0" style={{color:'#d4af37'}}>10+</h3><small className="text-muted fs-6">Cửa hàng toàn quốc</small></Col>
            <Col md={3} xs={6}><h3 className="fw-bold mb-0" style={{color:'#d4af37'}}>4.9/5</h3><small className="text-muted fs-6">Đánh giá hài lòng</small></Col>
            <Col md={3} xs={6}><h3 className="fw-bold mb-0" style={{color:'#d4af37'}}>24h</h3><small className="text-muted fs-6">Hỗ trợ khách hàng</small></Col>
          </Row>
          <Row className="mt-5 g-3 justify-content-center align-items-center text-center">
            <Col xs="auto"><LogoA h={32} /></Col>
            <Col xs="auto"><LogoB h={32} /></Col>
            <Col xs="auto"><LogoC h={32} /></Col>
            <Col xs="auto"><LogoD h={32} /></Col>
          </Row>
        </Container>
      </section>

      {/* ====== KHÔNG GIAN SHOP / GALLERY ====== */}
      <section className="py-5">
        <Container>
          <Row className="align-items-center g-4">
            <Col lg={6}>
              <Image
                src={GALLERY_IMG}
                alt="Khu trưng bày giày – Shop Lily"
                rounded fluid loading="lazy" decoding="async" onError={onImgError}
                className="shadow-lg"
                style={{objectFit:'cover', width:'100%', height:400, border:'2px solid #f0e6cc', borderRadius:10}}
              />
            </Col>
            <Col lg={6}>
              <h3 className="fw-bold mb-3" style={{color:'#333'}}>Trải nghiệm không gian mua sắm tinh tế</h3>
              <p className="text-secondary fs-5">
                Ánh sáng ấm, nội thất tối giản viền gold và kệ trưng bày cân đối tạo nên bầu không khí boutique sang trọng.
              </p>
              <ul className="text-secondary ps-3 mb-0 fs-6">
                <li>Thiết kế độc quyền, phom dáng chuẩn người Việt</li>
                <li>Quy trình kiểm định 7 bước nghiêm ngặt</li>
                <li>Stylist tư vấn phong cách theo dịp & phom chân</li>
              </ul>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ====== TESTIMONIALS (5 sao + nút Prev/Next) ====== */}
      <section className="py-5" style={{background:'linear-gradient(180deg,#f8f6ef 0%, #ffffff 60%)'}}>
        <Container>
          <Row className="mb-4 align-items-end">
            <Col>
              <h2 className="fw-bold" style={{color:'#333', letterSpacing:'0.3px'}}>Khách hàng nói về Lily</h2>
              <p className="text-muted mb-0">Trải nghiệm thực – cảm nhận thật.</p>
            </Col>
            <Col xs="auto" className="d-none d-md-block">
              <div className="small text-muted">4.9/5 từ 10.000+ đánh giá</div>
            </Col>
          </Row>

          <Carousel
            indicators={false}
            interval={null}
            nextIcon={<span style={navBtnStyle}>›</span>}
            prevIcon={<span style={navBtnStyle}>‹</span>}
            className="rounded-4"
          >
            {[
              { name:'Minh Trang, Hà Nội', quote:'Showroom sang trọng, giày đi êm và bền. Đổi size nhanh – dịch vụ quá ổn.' },
              { name:'Quốc Huy, TP.HCM', quote:'Thiết kế tối giản nhưng tinh tế, lên chân đẹp. Da mềm, hoàn thiện rất kỹ.' },
              { name:'Thu Phương, Đà Nẵng', quote:'Mua 3 đôi rồi vẫn hài lòng. Phối đồ đi làm hay đi chơi đều rất ổn.' },
            ].map((t, idx) => (
              <Carousel.Item key={idx}>
                <Row className="g-4 p-4 p-md-5 align-items-center" style={{
                  background:'linear-gradient(135deg, rgba(255,255,255,.95), rgba(240,230,204,.55))',
                  borderRadius:16, boxShadow:'0 12px 30px rgba(0,0,0,.08)'
                }}>
                  <Col md={1} className="d-none d-md-flex justify-content-center">
                    <div aria-hidden="true" style={{
                      width:56,height:56,borderRadius:14, background:'#d4af37',
                      boxShadow:'0 8px 24px rgba(212,175,55,.35)', display:'grid', placeItems:'center'
                    }}>
                      <span style={{fontSize:28, color:'#fff', lineHeight:1}}>“</span>
                    </div>
                  </Col>
                  <Col md={11}>
                    <Card className="border-0 rounded-4"
                      style={{background:'#fff', boxShadow:'0 10px 30px rgba(17,17,17,.06)'}}>
                      <Card.Body className="p-4 p-md-5">
                        <div className="d-flex align-items-center mb-2">
                          <div aria-hidden="true" style={{
                            width:44,height:44,borderRadius:'50%', background:'#111', color:'#fff',
                            fontWeight:700, display:'grid', placeItems:'center', marginRight:12
                          }}>
                            {t.name.split(' ').slice(-1)[0][0]}
                          </div>
                          <div>
                            <strong style={{color:'#333'}}>{t.name}</strong>
                            <Stars />
                          </div>
                        </div>
                        <p className="mb-0 fs-5 text-secondary">{t.quote}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Carousel.Item>
            ))}
          </Carousel>
        </Container>
      </section>

      {/* ====== FAQ ====== */}
      <section className="py-5" style={{background:'#fff'}}>
        <Container>
          <Row className="mb-4">
            <Col>
              <h2 className="fw-bold" style={{color:'#333'}}>Câu hỏi thường gặp</h2>
              <p className="text-muted mb-0">Một vài thắc mắc phổ biến và cách Lily hỗ trợ bạn.</p>
            </Col>
          </Row>

          <Accordion alwaysOpen className="border-0">
            {[
              {
                k:'0',
                q:'Chính sách đổi trả sản phẩm như thế nào?',
                a:'Bạn có thể đổi size hoặc đổi mẫu trong 7 ngày kể từ ngày nhận hàng, sản phẩm còn tem mác & chưa qua sử dụng. CSKH hướng dẫn nhanh chóng.'
              },
              {
                k:'1',
                q:'Sản phẩm của Lily có được bảo hành không?',
                a:'Bảo hành keo & chỉ 6 tháng cho toàn bộ sản phẩm. Hỗ trợ sửa chữa trọn đời với mức phí ưu đãi.'
              },
              {
                k:'2',
                q:'Làm sao để chọn đúng size giày Lily?',
                a:'Tham khảo bảng size theo chiều dài bàn chân (cm). Tư vấn viên sẵn sàng hỗ trợ qua hotline hoặc tại cửa hàng.'
              },
            ].map((i) => (
              <Accordion.Item eventKey={i.k} key={i.k}
                className="mb-3 rounded-4 border-0"
                style={{
                  boxShadow:'0 8px 20px rgba(17,17,17,.06)',
                  background:'linear-gradient(180deg,#ffffff,#faf9f6)'
                }}
              >
                <Accordion.Header>
                  <div className="d-flex align-items-center">
                    <span style={{
                      width:28,height:28,borderRadius:8,background:'#d4af37',
                      display:'inline-grid',placeItems:'center',color:'#fff',
                      marginRight:12,fontSize:14,fontWeight:700
                    }}>?</span>
                    <strong style={{color:'#333'}}>{i.q}</strong>
                  </div>
                </Accordion.Header>
                <Accordion.Body className="text-secondary fs-6">
                  {i.a}
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Container>
      </section>

      {/* ====== CTA CUỐI TRANG ====== */}
      <section className="py-5" style={{background:'linear-gradient(180deg,#ffffff,#f8f6ef)'}}>
        <Container>
          <Card className="border-0 rounded-4 overflow-hidden shadow-xl"
            style={{
              background:
                'radial-gradient(1200px 600px at 85% 40%, rgba(255,215,0,.25) 0%, rgba(212,175,55,.18) 30%, rgba(255,255,255,.75) 60%), linear-gradient(120deg,#111 0%, #1b1b1b 100%)'
            }}
          >
            <Row className="g-0 align-items-center">
              <Col lg={8} className="p-4 p-md-5">
                <div style={{
                  display:'inline-block', padding:'6px 12px', borderRadius:999,
                  border:'1px solid rgba(212,175,55,.5)', color:'#f7e7a5', fontSize:12,
                  marginBottom:10, letterSpacing:'.08em'
                }}>
                  LILY STYLIST DESK
                </div>
                <h3 className="fw-bold mb-2" style={{color:'#fff', letterSpacing:'.3px'}}>
                  Cần tư vấn phối đồ hoặc chọn size phù hợp?
                </h3>
                <p className="mb-0" style={{color:'rgba(255,255,255,.78)'}}>
                  Stylist của Lily hỗ trợ 9:00–21:00 mỗi ngày · Gợi ý outfit theo dịp, chất liệu & phom chân của bạn.
                </p>
              </Col>

              <Col lg={4} className="p-4 p-md-5 text-lg-end">
                <Button as="a" href="tel:18000000"
                  className="px-4 py-3 fw-bold rounded-3"
                  style={{
                    background:'#d4af37', borderColor:'#d4af37', color:'#111',
                    boxShadow:'0 10px 24px rgba(212,175,55,.35)'
                  }}>
                  <FiPhoneCall className="me-2" /> Gọi 1800 0000
                </Button>
                <div className="small mt-2" style={{color:'rgba(255,255,255,.65)'}}>
                  hoặc email: support@lily.vn
                </div>
              </Col>
            </Row>
          </Card>
        </Container>
      </section>
    </>
  );
}
