import {
  Form,
  Button,
  Alert,
  InputGroup,
  Dropdown,
  OverlayTrigger,
  Tooltip,
  Spinner,
} from "react-bootstrap";
import { FaTicketAlt } from "react-icons/fa";

export default function CheckoutForm({
  user,
  setUser,
  baseStreet,
  setBaseStreet,
  displayedStreet,
  selectedProvince,
  setSelectedProvince,
  selectedDistrict,
  setSelectedDistrict,
  selectedWard,
  setSelectedWard,
  addressData,
  voucherCode,
  setVoucherCode,
  userVouchers,
  payment,
  setPayment,
  error,
  isProcessing,
  handleApplyVoucher,
  handlePlaceOrder,
}) {
  return (
    <div className="checkout-box p-3 shadow-sm mb-4">
      <h4 className="mb-3">Thông tin người dùng & Thanh toán</h4>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form.Group className="mb-3">
        <Form.Label>Username</Form.Label>
        <Form.Control type="text" value={user.username} disabled />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Họ và tên</Form.Label>
        <Form.Control
          type="text"
          value={user.fullName}
          onChange={(e) => setUser({ ...user, fullName: e.target.value })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Email</Form.Label>
        <Form.Control type="email" value={user.email} disabled />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Số điện thoại</Form.Label>
        <Form.Control
          type="text"
          value={user.phone}
          onChange={(e) => setUser({ ...user, phone: e.target.value })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Địa chỉ giao hàng</Form.Label>
        <Form.Control
          type="text"
          value={displayedStreet}
          onChange={(e) => {
            const val = e.target.value;
            setBaseStreet(val);
            setDisplayedStreet(
              `${val}${selectedWard ? ", " + selectedWard : ""}${
                selectedDistrict ? ", " + selectedDistrict : ""
              }${selectedProvince ? ", " + selectedProvince : ""}`
            );
          }}
          placeholder="Số nhà, tên đường..."
        />

        <div className="d-flex gap-2 mt-2">
          <Form.Select
            value={selectedProvince}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedProvince(val);
              setSelectedDistrict("");
              setSelectedWard("");
              setDisplayedStreet(
                `${baseStreet}${val ? (baseStreet ? ", " : "") + val : ""}`
              );
            }}
          >
            <option value="">Chọn tỉnh/thành</option>
            {addressData.map((p) => (
              <option key={p.province} value={p.province}>
                {p.province}
              </option>
            ))}
          </Form.Select>

          <Form.Select
            value={selectedDistrict}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedDistrict(val);
              setSelectedWard("");
              setDisplayedStreet(
                `${baseStreet}${val ? (baseStreet ? ", " : "") + val : ""}${
                  selectedProvince ? ", " + selectedProvince : ""
                }`
              );
            }}
          >
            <option value="">Chọn quận/huyện</option>
            {(
              addressData.find((a) => a.province === selectedProvince)
                ?.districts || []
            ).map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </Form.Select>

          <Form.Select
            value={selectedWard}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedWard(val);
              setDisplayedStreet(
                `${baseStreet}${val ? (baseStreet ? ", " : "") + val : ""}${
                  selectedDistrict ? ", " + selectedDistrict : ""
                }${selectedProvince ? ", " + selectedProvince : ""}`
              );
            }}
          >
            <option value="">Chọn phường/xã</option>
            {(
              (
                addressData.find((a) => a.province === selectedProvince)
                  ?.districts || []
              ).find((d) => d.name === selectedDistrict)?.wards || []
            ).map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </Form.Select>
        </div>
      </Form.Group>

      <Form.Group
        className="mb-3"
        style={{ position: "relative", zIndex: 2000 }}
      >
        <Form.Label>Mã khuyến mại</Form.Label>
        <InputGroup>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Nhập mã voucher hoặc chọn từ danh sách</Tooltip>}
          >
            <InputGroup.Text style={{ fontSize: "18px" }}>
              <FaTicketAlt />
            </InputGroup.Text>
          </OverlayTrigger>

          <Form.Control
            type="text"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value)}
            placeholder="Nhập mã voucher"
          />

          <Dropdown>
            <Dropdown.Toggle split variant="outline-primary" />
            <Dropdown.Menu
              style={{
                maxHeight: "250px",
                overflow: "hidden",
                whiteSpace: "normal",
                wordBreak: "break-word",
              }}
            >
              {userVouchers.length > 0 ? (
                userVouchers.map((v) => (
                  <Dropdown.Item
                    key={v.UserVoucherId}
                    onClick={() => setVoucherCode(v.Code)}
                    style={{ whiteSpace: "normal", padding: "10px 15px" }}
                  >
                    {v.Code}{" "}
                    {v.DiscountAmount
                      ? `- ${v.DiscountAmount.toLocaleString("vi-VN")}₫`
                      : ""}
                    {v.DiscountPercentage ? `- ${v.DiscountPercentage}%` : ""}
                  </Dropdown.Item>
                ))
              ) : (
                <Dropdown.Item disabled style={{ padding: "10px 15px" }}>
                  Không có voucher khả dụng
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown>

          <Button
            variant="success"
            onClick={handleApplyVoucher}
            disabled={isProcessing || !voucherCode.trim()}
          >
            Áp dụng
          </Button>
        </InputGroup>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Phương thức thanh toán</Form.Label>
        <Form.Select
          value={payment}
          onChange={(e) => setPayment(e.target.value)}
        >
          <option value="COD">Thanh toán khi nhận hàng (COD)</option>
          <option value="VNPAY">VNPAY</option>
        </Form.Select>
      </Form.Group>

      <div className="mt-4 text-end">
        <Button
          variant="success"
          className="place-order-btn"
          onClick={handlePlaceOrder}
          disabled={
            isProcessing || !baseStreet || !user.fullName || !user.phone
          }
        >
          {isProcessing ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />{" "}
              Đang xử lý...
            </>
          ) : (
            "Xác nhận đặt hàng"
          )}
        </Button>
      </div>
    </div>
  );
}
