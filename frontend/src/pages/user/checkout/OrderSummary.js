import { Table, Form, Button, Spinner } from "react-bootstrap";

export default function OrderSummary({
  itemsState,
  setItemsState,
  calculateItemPrice,
  subtotal,
  shipping,
  discountAmount,
  totalAfterDiscount,
  apiFetch,
}) {
  return (
    <div className="checkout-box p-3 shadow-sm">
      <h4 className="mb-3">Đơn hàng</h4>
      <Table bordered hover responsive className="align-middle text-center">
        <thead className="table-dark">
          <tr>
            <th>Hình ảnh</th>
            <th>Sản phẩm</th>
            <th>Size</th>
            <th>Topping</th>
            <th>Số lượng</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {itemsState.map((item, index) => {
            const itemTotal = calculateItemPrice(item) * (item.SoLuong ?? 1);
            const key = item.GioHangID || index;
            return (
              <tr key={key}>
                <td>
                  <img
                    src={
                      item.ImageURL
                        ? `http://localhost:5000${item.ImageURL}`
                        : `http://localhost:5000/images/no-image.png`
                    }
                    alt={item.FoodName}
                    className="checkout-img"
                  />
                </td>
                <td className="text-start">{item.FoodName}</td>
                <td>{item.Size?.SizeName || "Không có"}</td>

                <td>
                  {item.Toppings && item.Toppings.length > 0
                    ? item.Toppings.map((t) => (
                        <div key={t.ToppingID}>
                          {t.ToppingName} (+
                          {t.ToppingPrice.toLocaleString("vi-VN")} ₫)
                        </div>
                      ))
                    : "Không có"}

                  {item.Size !== null && (
                    <div className="mt-2">
                      {!item.editing ? (
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={async () => {
                            try {
                              const res = await apiFetch(
                                `/api/products/${item.FoodId}`
                              );
                              if (res.success && res.data) {
                                setItemsState((prev) =>
                                  prev.map((it, i) =>
                                    i === index
                                      ? {
                                          ...it,
                                          AvailableSizes: res.data.sizes || [],
                                          AvailableToppings:
                                            res.data.toppings || [],
                                          editing: true,
                                        }
                                      : it
                                  )
                                );
                              }
                            } catch (err) {
                              alert("Không thể tải tuỳ chọn sản phẩm");
                            }
                          }}
                        >
                          Chỉnh sửa tuỳ chọn
                        </Button>
                      ) : (
                        <div>
                          <Form.Select
                            size="sm"
                            className="mb-1"
                            value={item.Size?.SizeID || ""}
                            onChange={(e) => {
                              const sid = e.target.value
                                ? Number(e.target.value)
                                : null;
                              setItemsState((prev) =>
                                prev.map((it, ii) =>
                                  ii === index
                                    ? {
                                        ...it,
                                        Size:
                                          it.AvailableSizes.find(
                                            (s) => s.SizeID === sid
                                          ) || null,
                                      }
                                    : it
                                )
                              );
                            }}
                          >
                            <option value="">Không thay đổi</option>
                            {(item.AvailableSizes || []).map((s) => (
                              <option key={s.SizeID} value={s.SizeID}>
                                {`${s.SizeName} (+${Number(
                                  s.ExtraPrice || 0
                                ).toLocaleString("vi-VN")} ₫)`}
                              </option>
                            ))}
                          </Form.Select>

                          <div className="d-flex flex-wrap mb-1">
                            {(item.AvailableToppings || []).map((t) => (
                              <Form.Check
                                key={t.ToppingID}
                                type="checkbox"
                                label={`${t.ToppingName} (+${Number(
                                  t.ToppingPrice || 0
                                ).toLocaleString("vi-VN")} ₫)`}
                                checked={(item.Toppings || []).some(
                                  (tt) => tt.ToppingID === t.ToppingID
                                )}
                                onChange={() => {
                                  setItemsState((prev) =>
                                    prev.map((it, ii) => {
                                      if (ii !== index) return it;
                                      const exists = (it.Toppings || []).some(
                                        (tt) => tt.ToppingID === t.ToppingID
                                      );
                                      const fullTopping =
                                        (it.AvailableToppings || []).find(
                                          (at) => at.ToppingID === t.ToppingID
                                        ) || t;
                                      return {
                                        ...it,
                                        Toppings: exists
                                          ? (it.Toppings || []).filter(
                                              (tt) =>
                                                tt.ToppingID !== t.ToppingID
                                            )
                                          : [
                                              ...(it.Toppings || []),
                                              fullTopping,
                                            ],
                                      };
                                    })
                                  );
                                }}
                              />
                            ))}
                          </div>

                          <div>
                            <Button
                              size="sm"
                              variant="success"
                              className="me-2"
                              onClick={async () => {
                                try {
                                  if (item.GioHangID) {
                                    const body = {
                                      gioHangId: item.GioHangID,
                                      sizeId: item.Size?.SizeID || null,
                                      toppingIds: (item.Toppings || []).map(
                                        (tt) => tt.ToppingID
                                      ),
                                    };
                                    const res = await apiFetch(
                                      "/api/cart/update-options",
                                      {
                                        method: "POST",
                                        body: JSON.stringify(body),
                                      }
                                    );
                                    if (res && res.success) {
                                      const updated =
                                        res.item || res.data || {};
                                      const normalized = {
                                        ...updated,
                                        Size:
                                          updated.Size ||
                                          (updated.SizeID
                                            ? {
                                                SizeID: updated.SizeID,
                                                SizeName: updated.SizeName,
                                                ExtraPrice: updated.ExtraPrice,
                                              }
                                            : null),
                                        Toppings:
                                          updated.Toppings ||
                                          updated.ToppingList ||
                                          [],
                                      };
                                      setItemsState((prev) =>
                                        prev.map((it, ii) =>
                                          ii === index
                                            ? {
                                                ...it,
                                                ...normalized,
                                                editing: false,
                                              }
                                            : it
                                        )
                                      );
                                    } else {
                                      throw new Error(
                                        (res && res.message) ||
                                          "Cập nhật thất bại"
                                      );
                                    }
                                  } else {
                                    setItemsState((prev) =>
                                      prev.map((it, ii) =>
                                        ii === index
                                          ? { ...it, editing: false }
                                          : it
                                      )
                                    );
                                  }
                                } catch (err) {
                                  alert(
                                    "Lưu tuỳ chọn thất bại: " + err.message
                                  );
                                }
                              }}
                            >
                              Lưu
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setItemsState((prev) =>
                                  prev.map((it, ii) =>
                                    ii === index
                                      ? { ...it, editing: false }
                                      : it
                                  )
                                )
                              }
                            >
                              Huỷ
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </td>

                <td style={{ width: 120 }}>
                  <Form.Control
                    type="number"
                    min={1}
                    value={item.SoLuong}
                    onChange={async (e) => {
                      const newQty = parseInt(e.target.value || "1", 10);
                      if (item.GioHangID) {
                        try {
                          await apiFetch("/api/cart/update", {
                            method: "POST",
                            body: JSON.stringify({
                              gioHangId: item.GioHangID,
                              quantity: newQty,
                            }),
                          });
                          const updated = itemsState.map((it) =>
                            it.GioHangID === item.GioHangID
                              ? { ...it, SoLuong: newQty }
                              : it
                          );
                          setItemsState(updated);
                        } catch (err) {
                          console.error("UPDATE QTY ERR:", err);
                          alert("Cập nhật số lượng thất bại");
                        }
                      } else {
                        setItemsState((prev) =>
                          prev.map((it, i) =>
                            i === index ? { ...it, SoLuong: newQty } : it
                          )
                        );
                      }
                    }}
                  />
                </td>
                <td>{itemTotal.toLocaleString("vi-VN")} ₫</td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <h5 className="text-end">
        Tạm tính: {subtotal.toLocaleString("vi-VN")} ₫ <br />
        Phí ship: {shipping.toLocaleString("vi-VN")} ₫ <br />
        {discountAmount > 0 && (
          <>
            Giảm giá: -{discountAmount.toLocaleString("vi-VN")} ₫ <br />
          </>
        )}
        <strong className="text-danger">
          Tổng cộng: {totalAfterDiscount.toLocaleString("vi-VN")} ₫
        </strong>
      </h5>
    </div>
  );
}
