# 📊 CSP Demo - Real-time Monitoring

Demo hệ thống Content Security Policy với giám sát real-time qua Socket.IO.

## 🚀 Khởi động

```bash
cd backend
npm install
npm start
```

Server chạy tại: http://localhost:5000

## 📁 Các trang demo

### 1. **Home Page** - `/csp`

- Trang chủ với real-time connection status
- Hiển thị số liệu tổng hợp: Pass/Fail/Total
- Cập nhật tự động không cần reload trang

### 2. **Blocked Demo** - `/blocked`

- CSP chặn tất cả inline scripts
- Kiểm tra CSP có hoạt động không
- Xem console để thấy CSP violations

### 3. **Hash Demo** - `/hash`

- Cho phép inline script bằng SHA-256 hash
- Hash được tạo tự động từ `scripts/build-hash.js`
- Lưu vào `.env` file

### 4. **Nonce Demo** - `/nonce`

- Cho phép inline script bằng nonce động
- Mỗi request có nonce khác nhau
- Nonce được inject vào `__NONCE__` placeholder

### 5. **Real-time Dashboard** - `/report-log-realtime` ⭐

- Dashboard hiển thị violations và passes
- 3 tabs: All / Violations / Passed
- Real-time updates qua Socket.IO
- Stats cards với animations
- Connection status indicator

### 6. **Real-time Analytics** - `/analyze-realtime` ⭐

- 4 biểu đồ real-time:
  - **Pie Chart**: Pass vs Fail
  - **Line Chart**: Timeline (20 events gần nhất)
  - **Bar Chart**: Violations by Directive
  - **Doughnut Chart**: Pages Tested
- Tự động cập nhật khi có violation/pass mới
- Không cần reload trang

## 🎯 Tính năng Real-time

### Socket.IO Events

**Client nhận từ Server:**

- `connect` - Kết nối thành công
- `disconnect` - Mất kết nối
- `initLogs` - Load dữ liệu ban đầu
- `newViolation` - Violation mới
- `scriptPass` - Script pass mới

**Ví dụ:**

```javascript
const socket = io();

socket.on("connect", () => {
  console.log("✅ Connected");
});

socket.on("newViolation", (violation) => {
  console.log("⚠️ New violation:", violation);
  // Update UI without reload
});

socket.on("scriptPass", (passLog) => {
  console.log("✅ Script passed:", passLog);
  // Update UI without reload
});
```

## 🔧 Cấu hình

### `.env` file

```
HASH_CSP=sha256-xxx...
```

### Tạo hash mới

```bash
cd backend
node scripts/build-hash.js
```

## 📊 Cấu trúc dữ liệu

### Violation Object

```javascript
{
  "timestamp": "2025-01-23 10:30:15",
  "document-uri": "http://localhost:5000/blocked",
  "violated-directive": "script-src-elem",
  "blocked-uri": "inline",
  "status": "fail"
}
```

### Pass Log Object

```javascript
{
  "timestamp": "2025-01-23 10:30:15",
  "page": "/nonce",
  "nonce": "abc123...",
  "status": "pass"
}
```

## 🧪 Testing CSP

### 1. Test Blocked

```bash
curl http://localhost:5000/blocked
# Mở DevTools Console → Thấy CSP error
```

### 2. Test Hash

```bash
# Regenerate hash
node scripts/build-hash.js

# Restart server
npm start

# Visit
curl http://localhost:5000/hash
```

### 3. Test Nonce

```bash
curl http://localhost:5000/nonce
# Xem source code → nonce khác nhau mỗi lần
```

### 4. Test Violation Reporting

```bash
curl -X POST http://localhost:5000/csp-report \
  -H "Content-Type: application/csp-report" \
  -d '{
    "csp-report": {
      "document-uri": "http://localhost:5000/test",
      "violated-directive": "script-src-elem",
      "blocked-uri": "inline"
    }
  }'

# Check real-time dashboard → Violation mới xuất hiện ngay
```

## 🎨 UI/UX Features

### Real-time Dashboard

- ✅ Connection status với animated dot
- ✅ Stats cards với gradient backgrounds
- ✅ Responsive mobile layout
- ✅ Tab navigation (All/Violations/Passed)
- ✅ Timestamp formatting
- ✅ Clear logs button

### Real-time Analytics

- ✅ Chart.js integration
- ✅ 4 chart types (Pie, Line, Bar, Doughnut)
- ✅ Auto-refresh on new data
- ✅ Success rate calculation
- ✅ Color-coded statistics

## 📝 Troubleshooting

### Socket.IO không kết nối

1. Check server logs: `npm start`
2. Check browser console: F12 → Console
3. Verify Socket.IO script loaded: `<script src="/socket.io/socket.io.js"></script>`

### Violations không hiển thị

1. Browser `report-uri` API bị deprecated
2. Dùng manual POST để test: `curl -X POST /csp-report ...`
3. Check `backend/logs/violations.json`

### Hash không khớp

1. Regenerate: `node scripts/build-hash.js`
2. Restart server: `npm start`
3. Clear browser cache

## 🔐 Security Notes

- CSP demo này chỉ dùng cho **development**
- Production cần config CSP chặt chẽ hơn
- `style-src 'unsafe-inline'` chỉ dùng cho demo
- Real-time reporting tốt hơn browser's deprecated `report-uri`

## 📚 Resources

- [CSP Guide](./CSP_GUIDE.md) - Chi tiết về CSP implementation
- [MDN CSP Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Chart.js Documentation](https://www.chartjs.org/)

## 🎓 Learning Path

1. **Basics**: Hiểu CSP là gì → Test `/blocked`
2. **Hash**: Học cách dùng hash → Test `/hash`
3. **Nonce**: Học nonce động → Test `/nonce`
4. **Monitoring**: Giám sát violations → `/report-log-realtime`
5. **Analytics**: Phân tích dữ liệu → `/analyze-realtime`

---

**Made with ❤️ for learning CSP**
