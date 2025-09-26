// frontend/src/config/api.js
// Dùng biến môi trường nếu có (khi deploy), nếu không sẽ mặc định localhost
export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
