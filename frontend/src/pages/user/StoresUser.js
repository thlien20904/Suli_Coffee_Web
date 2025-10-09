import { useEffect, useState } from "react";
import axios from "axios";
import {
  Row,
  Col,
  Card,
  Spinner,
  Form,
  Button,
  ListGroup,
} from "react-bootstrap";
import {
  FaMapMarkerAlt,
  FaClock,
  FaCar,
  FaUserFriends,
  FaShoppingBag,
} from "react-icons/fa";
import "../../styles/pages/StoresUser.css";

const API = "http://localhost:5000";
const PLACEHOLDER = "/placeholder-store.jpg";

export default function StoresUser() {
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("Tp Hồ Chí Minh");
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");

  useEffect(() => {
    fetchStores();
  }, [selectedCity, selectedDistrict]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCity) params.set("city", selectedCity);
      if (selectedDistrict) params.set("district", selectedDistrict);

      const { data } = await axios.get(`${API}/api/stores?${params.toString()}`);
      setStores(data.stores || []);
      setCities(data.cities || []);
      setDistricts(data.districts || []);
    } catch (err) {
      console.error("FETCH STORES ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="store-page container py-4">
      {/* --- Header --- */}
      <div className="store-header text-center mb-4">
        <h2 className="fw-bold">Hệ thống cửa hàng The Coffee House toàn quốc</h2>
        <p className="text-muted">
          Khám phá các cửa hàng của chúng tôi tại {selectedCity}
        </p>
      </div>

      <Row>
        {/* --- Sidebar Khu vực --- */}
        <Col lg={3} md={4} sm={12}>
          <aside className="area-sidebar mb-4">
            <h5 className="fw-bold mb-3">Theo khu vực</h5>
            <ListGroup variant="flush">
              {cities.map((city) => (
                <ListGroup.Item
                  key={city.CityName}
                  action
                  active={selectedCity === city.CityName}
                  onClick={() => {
                    setSelectedCity(city.CityName);
                    setSelectedDistrict("");
                  }}
                  className="d-flex justify-content-between align-items-center"
                >
                  <span>{city.CityName}</span>
                  <span className="text-muted small">({city.StoreCount})</span>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </aside>
        </Col>

        {/* --- Nội dung chính: danh sách cửa hàng --- */}
        <Col lg={9} md={8} sm={12}>
          {/* Bộ lọc quận/huyện */}
          <Form className="district-filter mb-4">
            <Form.Group as={Row} className="align-items-center">
              <Form.Label column sm="3" className="fw-bold">
                Chọn Quận/Huyện:
              </Form.Label>
              <Col sm="9">
                <Form.Select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Form.Group>
          </Form>

          {/* Danh sách cửa hàng */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="warning" />
              <p className="text-muted mt-3">Đang tải danh sách cửa hàng...</p>
            </div>
          ) : (
            <Row xs={1} sm={2} lg={2} className="g-4">
              {stores.length === 0 ? (
                <p className="text-center text-muted py-5">
                  Không có cửa hàng nào trong khu vực này.
                </p>
              ) : (
                stores.map((store) => (
                  <Col key={store.StoreId}>
                    <Card className="store-card shadow-sm border-0">
                      <div className="store-img-wrapper">
                        <Card.Img
                          variant="top"
                          src={
                            store.ImageURL
                              ? `${API}${store.ImageURL}`
                              : PLACEHOLDER
                          }
                          onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                        />
                      </div>

                      <Card.Body>
                        <Card.Title className="store-title fw-bold mb-2">
                          {store.StoreName}
                        </Card.Title>

                        <Button
                          variant="outline-warning"
                          size="sm"
                          className="mb-3"
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                store.Address
                              )}`,
                              "_blank"
                            )
                          }
                        >
                          Xem bản đồ
                        </Button>

                        <div className="store-info">
                          <p className="store-address mb-1">
                            <FaMapMarkerAlt className="me-2 text-warning" />
                            {store.Address}
                          </p>
                          <p className="store-time mb-2">
                            <FaClock className="me-2 text-warning" />
                            {store.OpenTime} - {store.CloseTime}
                          </p>

                          <div className="store-services text-muted small">
                            {store.Parking && (
                              <span className="me-3">
                                <FaCar /> Có chỗ đỗ xe hơi
                              </span>
                            )}
                            {store.FamilyFriendly && (
                              <span className="me-3">
                                <FaUserFriends /> Thân thiện gia đình
                              </span>
                            )}
                            {store.TakeAway && (
                              <span>
                                <FaShoppingBag /> Mua mang đi
                              </span>
                            )}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              )}
            </Row>
          )}

          {/* Nút xem thêm */}
          {!loading && stores.length > 6 && (
            <div className="text-center mt-4">
              <Button variant="outline-dark">Xem thêm</Button>
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
}
