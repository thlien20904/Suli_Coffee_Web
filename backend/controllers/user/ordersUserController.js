const {
  authenticateToken,
  getStores,
  getUserAddresses,
  getGHNLocations,
  calculateShippingFee,
  saveUserAddress,
  geocodeAddress, // ✅ Thêm hàm mới
} = require("./orders/orderUtils");
const { formatItem, prepareOrder } = require("./orders/prepareOrder");
const { placeOrder } = require("./orders/placeOrder");
const { vnpayReturn, reOrder } = require("./orders/vnpayReturn");
const {
  savePending,
  getPendingOrders,
  getOrderById,
  autoCancelPendingOrders,
} = require("./orders/pending");

module.exports = {
  authenticateToken,
  formatItem,
  prepareOrder,
  placeOrder,
  vnpayReturn,
  reOrder,
  savePending,
  getPendingOrders,
  getOrderById,
  autoCancelPendingOrders,
  getStores,
  getUserAddresses,
  getGHNLocations,
  calculateShippingFee,
  saveUserAddress,
  geocodeAddress, // ✅ Export hàm mới
};
