# 🚀 Vercel Deployment Fix - WebSocket Connection Error

## ❌ Lỗi Hiện Tại

```
Refused to connect to 'ws://localhost:5000/socket.io/?EIO=4&transport=websocket' 
because it violates CSP directive: "connect-src 'self' ... wss://suli-coffee.onrender.com"
```

**Nguyên nhân:** Frontend đang kết nối `ws://localhost:5000` thay vì `wss://suli-coffee.onrender.com` trên production.

---

## ✅ Solution: Auto-Detect Production Environment

### 1️⃣ Fixed Files

**`frontend/src/utils/apiConfig.js`** - Auto-detect production:
```javascript
// Auto-detect production environment
const isProduction = window.location.hostname.includes('vercel.app') || 
                     process.env.NODE_ENV === 'production';

const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (isProduction ? "https://suli-coffee.onrender.com" : "http://localhost:5000");

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 
  (isProduction ? "https://suli-coffee.onrender.com" : API_BASE_URL);
```

**`frontend/src/components/CSP/CSPProvider.js`** - Auto-detect for CSP monitoring:
```javascript
const isProduction = window.location.hostname.includes('vercel.app') || 
                     process.env.NODE_ENV === 'production';
const backendUrl = process.env.REACT_APP_BACKEND_URL || 
  (isProduction ? "https://suli-coffee.onrender.com" : "http://localhost:5000");

const socketConnection = io(backendUrl, {
  transports: ["websocket", "polling"],
  withCredentials: true,
  forceNew: true,
});
```

**`frontend/.env.production`** - Production environment variables:
```env
REACT_APP_API_URL=https://suli-coffee.onrender.com
REACT_APP_SOCKET_URL=https://suli-coffee.onrender.com
REACT_APP_BACKEND_URL=https://suli-coffee.onrender.com
NODE_ENV=production
GENERATE_SOURCEMAP=false
```

---

## 📋 Deployment Steps

### **Step 1: Rebuild Frontend**

```bash
cd frontend
npm run build
```

### **Step 2: Deploy to Vercel**

**Option A: Via Vercel CLI**
```bash
vercel --prod
```

**Option B: Via Git Push**
```bash
git add .
git commit -m "Fix WebSocket URL: Auto-detect production environment"
git push origin main
```

Vercel sẽ tự động deploy khi detect git push.

### **Step 3: Set Environment Variables on Vercel**

1. Vào **Vercel Dashboard**: https://vercel.com/dashboard
2. Chọn project **suli-coffee-web**
3. Settings → Environment Variables
4. Thêm các variables sau:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `REACT_APP_API_URL` | `https://suli-coffee.onrender.com` | Production |
| `REACT_APP_SOCKET_URL` | `https://suli-coffee.onrender.com` | Production |
| `REACT_APP_BACKEND_URL` | `https://suli-coffee.onrender.com` | Production |
| `NODE_ENV` | `production` | Production |

5. Click **Save**
6. **Redeploy** project (Deployments → ... → Redeploy)

---

## 🧪 Testing

### **Production Console Test:**

Mở https://suli-coffee-web.vercel.app, nhấn `F12`, chạy:

```javascript
// 1. Check API URL
console.log('API URL:', window.location.hostname.includes('vercel.app') 
  ? 'https://suli-coffee.onrender.com' 
  : 'http://localhost:5000');

// 2. Test API connection
fetch('https://suli-coffee.onrender.com/api/home')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// 3. Check Socket.IO connection logs
// Should see: "✅ Socket connected: [socket_id]"
```

### **Expected Results:**

✅ **No more CSP errors:**
```
✅ Socket connected: xyz123
✅ API response: { ... }
```

❌ **Before fix:**
```
❌ Refused to connect to 'ws://localhost:5000...'
```

---

## 🔍 Troubleshooting

### **Vẫn thấy `localhost:5000`?**

**Cause:** Browser cache hoặc old build  
**Fix:**
1. Hard refresh: `Ctrl + Shift + R` (Chrome)
2. Clear cache: `F12` → Application → Clear storage
3. Redeploy Vercel với force rebuild

---

### **WebSocket không kết nối?**

**Check 1:** Render backend có running không?
```bash
curl https://suli-coffee.onrender.com/api/home
# Should return JSON
```

**Check 2:** CSP policy có `wss://` không?
```javascript
// Browser console
document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content
// Should include: wss://suli-coffee.onrender.com
```

**Check 3:** CORS settings backend
```javascript
// backend/server.js
app.use(cors({
  origin: ['https://suli-coffee-web.vercel.app'],
  credentials: true
}));
```

---

### **Environment variables không load?**

**Vercel requires prefix:** `REACT_APP_*`

❌ Wrong:
```env
API_URL=https://...
```

✅ Correct:
```env
REACT_APP_API_URL=https://...
```

**Rebuild after changing env vars:**
```bash
vercel --prod --force
```

---

## 📊 Verification Checklist

- [ ] `frontend/src/utils/apiConfig.js` có auto-detect production
- [ ] `frontend/src/components/CSP/CSPProvider.js` có auto-detect
- [ ] `frontend/.env.production` có đầy đủ env vars
- [ ] Vercel Dashboard có set 3 env vars: `REACT_APP_API_URL`, `REACT_APP_SOCKET_URL`, `REACT_APP_BACKEND_URL`
- [ ] Git push code mới lên GitHub
- [ ] Vercel redeploy thành công
- [ ] Production console không có CSP errors
- [ ] WebSocket connected: `✅ Socket connected`
- [ ] API calls working: `fetch('/api/home')` success

---

## 🎯 Final Check

**Production URL:** https://suli-coffee-web.vercel.app

**Expected behavior:**
1. ✅ Trang load bình thường
2. ✅ API calls đến Render: `https://suli-coffee.onrender.com/api/*`
3. ✅ WebSocket kết nối: `wss://suli-coffee.onrender.com`
4. ✅ Không có CSP violation errors
5. ✅ Dashboard `/csp-dashboard` hiển thị data

**Test command:**
```javascript
// Run in production console
console.log('Environment:', 
  window.location.hostname.includes('vercel.app') ? 'PRODUCTION ✅' : 'LOCAL 🏠'
);
```

---

## 🚀 Quick Deploy Command

```bash
# All in one
cd "d:/HK1_2025_2026/Ngôn ngữ kịch bản/SuLi/frontend" && \
npm run build && \
git add . && \
git commit -m "Fix WebSocket: Auto-detect production + env vars" && \
git push origin main && \
echo "✅ Pushed to GitHub. Vercel will auto-deploy."
```

---

**Status:** ✅ Fixed  
**Date:** 2025-11-17  
**Next Deploy:** Auto via Git push
