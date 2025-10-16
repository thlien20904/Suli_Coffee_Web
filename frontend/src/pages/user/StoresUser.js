import { useEffect, useState } from "react";
import axios from "axios";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
} from "@react-google-maps/api";
import "../../styles/pages/StoresUser.css";

const API_URL = "http://localhost:5000/api/Stores";
const GOOGLE_MAPS_API_KEY = "AIzaSyD2UoDgrfBrN2jdwe89N7jABt16h4selZo";

export default function StoresUser() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState(null);

  // Tải Google Maps
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  // Gọi API lấy danh sách cửa hàng
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await axios.get(API_URL);
        setStores(res.data);
      } catch (err) {
        console.error("Error fetching stores:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  if (loading)
    return (
      <div className="text-center py-5">Đang tải danh sách cửa hàng...</div>
    );
  if (!isLoaded)
    return <div className="text-center py-5">Đang tải bản đồ...</div>;

  // 🗺️ Thiết lập vị trí trung tâm (VD: trung tâm TP.HCM)
  const center = { lat: 10.762622, lng: 106.660172 };

  return (
    <div
      className="stores-container container py-4"
      style={{ marginTop: "80px" }}
    >
      <h2 className="text-center mb-4">Hệ thống cửa hàng</h2>

      <div className="row">
        <div className="col-md-6">
          {/* DANH SÁCH CỬA HÀNG */}
          <div className="store-list">
            {stores.map((store) => (
              <div
                key={store.CuaHangId}
                className="card shadow-sm mb-3"
                style={{ cursor: "pointer" }}
                onClick={() =>
                  setSelectedStore({
                    lat: store.latitude,
                    lng: store.longitude,
                    name: store.CuaHangName,
                    address: store.address,
                    phone: store.phone,
                  })
                }
              >
                <img
                  src={
                    store.image_url
                      ? store.image_url.startsWith("http")
                        ? store.image_url
                        : `http://localhost:5000${store.image_url}`
                      : "/placeholder.jpg"
                  }
                  alt={store.CuaHangName}
                  className="card-img-top"
                  style={{ height: "180px", objectFit: "cover" }}
                />
                <div className="card-body">
                  <h5 className="card-title">{store.CuaHangName}</h5>
                  <p className="card-text mb-1">
                    <strong>Địa chỉ:</strong> {store.address}
                  </p>
                  <p className="card-text mb-1">
                    <strong>Giờ mở cửa:</strong> {store.opening_hours}
                  </p>
                  <p className="card-text">
                    <strong>SĐT:</strong> {store.phone}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-md-6">
          {/* GOOGLE MAPS */}
          <div style={{ height: "600px", width: "100%" }}>
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={
                selectedStore
                  ? { lat: selectedStore.lat, lng: selectedStore.lng }
                  : center
              }
              zoom={selectedStore ? 15 : 11}
            >
              {stores.map(
                (store) =>
                  store.latitude &&
                  store.longitude && (
                    <Marker
                      key={store.CuaHangId}
                      position={{ lat: store.latitude, lng: store.longitude }}
                      onClick={() =>
                        setSelectedStore({
                          lat: store.latitude,
                          lng: store.longitude,
                          name: store.CuaHangName,
                          address: store.address,
                          phone: store.phone,
                        })
                      }
                    />
                  )
              )}

              {selectedStore && (
                <InfoWindow
                  position={{ lat: selectedStore.lat, lng: selectedStore.lng }}
                  onCloseClick={() => setSelectedStore(null)}
                >
                  <div>
                    <h6>{selectedStore.name}</h6>
                    <p style={{ marginBottom: "5px" }}>
                      {selectedStore.address}
                    </p>
                    <p style={{ margin: 0 }}>📞 {selectedStore.phone}</p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </div>
        </div>
      </div>
    </div>
  );
}
