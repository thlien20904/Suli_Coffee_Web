# 🛡️ CSP (Content Security Policy) Demo Guide

## 📋 Tổng quan

Dự án này demo 3 kỹ thuật CSP để bảo vệ web khỏi XSS attacks:

| Route      | CSP Policy                       | Mục đích                            |
| ---------- | -------------------------------- | ----------------------------------- |
| `/blocked` | `script-src 'self'`              | ❌ Chặn TOÀN BỘ inline scripts      |
| `/hash`    | `script-src 'self' 'sha256-xxx'` | ✅ Chỉ cho phép script có hash đúng |
| `/nonce`   | `script-src 'self' 'nonce-xxx'`  | ✅ Cho phép script có nonce động    |

---

## 🚀 Hướng dẫn chạy

### 1. Start server

```bash
cd backend
npm start
```

Server chạy tại: `http://localhost:5000`

### 2. Test CSP Routes

#### A. CSP Home (`/csp`)

```
http://localhost:5000/csp
```

→ Trang chủ với links đến tất cả demos

#### B. Blocked Demo (`/blocked`)

```
http://localhost:5000/blocked
```

**Kết quả mong đợi:**

- ⏳ Text "Đang kiểm tra CSP..." vẫn hiển thị (màu đỏ)
- DevTools Console có lỗi: `Executing inline script violates...`
- **KHÔNG** thấy "❌ CSP KHÔNG hoạt động!"

**Nếu fail:** CSP chưa chặn inline script → Check CSP header

#### C. Hash Demo (`/hash`)

```
http://localhost:5000/hash
```

**QUAN TRỌNG:** Mỗi lần sửa script trong `hash.html`, phải rebuild hash:

```bash
node scripts/build-hash.js
```

**Kết quả mong đợi:**

- ✅ Text "Script được phép chạy (hash khớp)" màu xanh
- Console: "Inline script đang chạy (được phép)"
- Terminal backend: `✅ Script pass: /hash`

**Nếu fail:** Hash không khớp → Run build-hash.js lại

#### D. Nonce Demo (`/nonce`)

```
http://localhost:5000/nonce
```

**Kết quả mong đợi:**

- ✅ Text "Script được phép chạy (nonce khớp)" màu xanh
- Console: Script 1, Script 2 đều chạy
- Terminal backend: `✅ Script pass: /nonce`

---

## 📊 Monitoring & Analytics

### 1. Report Log (`/report-log`)

```
http://localhost:5000/report-log
```

→ Dashboard real-time hiển thị CSP violations qua Socket.IO

### 2. Analytics (`/analyze`)

```
http://localhost:5000/analyze
```

→ Biểu đồ pass/fail counts (Chart.js)

### 3. Violations JSON

```
backend/logs/violations.json
```

→ File JSON lưu tất cả violations

---

## 🔧 Troubleshooting

### Vấn đề 1: Không có violations trong log

**Nguyên nhân:** Browser không gửi CSP report (report-uri deprecated)

**Giải pháp:**

1. Mở DevTools → Console
2. Tìm lỗi CSP: `Executing inline script violates...`
3. Copy `violated-directive` từ error
4. Manual test: Gọi POST `/csp-report` với body:

```json
{
  "csp-report": {
    "document-uri": "http://localhost:5000/blocked",
    "violated-directive": "script-src 'self'",
    "blocked-uri": "inline",
    "status-code": 200
  }
}
```

### Vấn đề 2: Hash demo fail

**Nguyên nhân:** Hash trong .env không khớp với script content

**Giải pháp:**

```bash
node scripts/build-hash.js
# Restart server
npm start
# Test lại /hash
```

### Vấn đề 3: Inline styles bị chặn

**Nguyên nhân:** Thiếu `style-src 'unsafe-inline'`

**Giải pháp:** Đã fix trong CSP headers:

```javascript
"style-src 'self' 'unsafe-inline'";
```

### Vấn đề 4: Pass count = 12, Fail count = 0

**Nguyên nhân:**

- Scripts chạy thành công → gửi `/api/log-pass` ✅
- Browser không gửi CSP violation reports ❌

**Giải pháp:** Test manual bằng DevTools Console

---

## 🧪 Manual Testing

### Test CSP Violation

```bash
curl -X POST http://localhost:5000/csp-report \
  -H "Content-Type: application/csp-report" \
  -d '{
    "csp-report": {
      "document-uri": "http://localhost:5000/test",
      "violated-directive": "script-src",
      "blocked-uri": "inline",
      "status-code": 200
    }
  }'
```

Check log:

```bash
cat backend/logs/violations.json
```

### Test Pass Log

```bash
curl -X POST http://localhost:5000/api/log-pass \
  -H "Content-Type: application/json" \
  -d '{
    "page": "/test",
    "directive": "script-src",
    "timestamp": "2025-11-13 10:00:00"
  }'
```

---

## 📚 Tài liệu tham khảo

- [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Level 3](https://w3c.github.io/webappsec-csp/)
- [Google CSP Evaluator](https://csp-evaluator.withgoogle.com/)

---

## ✅ Checklist

- [ ] Server chạy tại http://localhost:5000
- [ ] `/csp` hiển thị home page
- [ ] `/blocked` chặn inline script (text màu đỏ)
- [ ] `/hash` cho phép script (text màu xanh)
- [ ] `/nonce` cho phép script (text màu xanh)
- [ ] `/report-log` hiển thị dashboard
- [ ] `/analyze` hiển thị charts
- [ ] Terminal log `✅ Script pass` khi test pass routes
- [ ] `backend/logs/violations.json` được tạo sau violations
