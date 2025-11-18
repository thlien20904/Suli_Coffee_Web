# 🛡️ Demo Content Security Policy (CSP) - SuLi Coffee

## 📋 Mục lục

1. [Tổng quan về CSP](#1-tổng-quan-về-csp)
2. [Cấu hình CSP trong SuLi Coffee](#2-cấu-hình-csp-trong-suli-coffee)
3. [Demo chặn Inline Scripts](#3-demo-chặn-inline-scripts)
4. [Demo chặn Clickjacking](#4-demo-chặn-clickjacking)
5. [Test Cases chi tiết](#5-test-cases-chi-tiết)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Tổng quan về CSP

### 🎯 CSP là gì?

**Content Security Policy (CSP)** là một tính năng bảo mật giúp phát hiện và ngăn chặn các loại tấn công như:

- **Cross-Site Scripting (XSS)**
- **Code Injection**
- **Clickjacking**
- **Data Injection**

### 🔧 Cách hoạt động

CSP hoạt động bằng cách thiết lập **whitelist** các nguồn tài nguyên được phép:

- Scripts
- Stylesheets
- Images
- Fonts
- Frames
- Connect sources (AJAX, WebSocket)

---

## 2. Cấu hình CSP trong SuLi Coffee

### 📁 File cấu hình chính

```javascript
// backend/cspMiddleware.js
const cspMiddleware = (req, res, next) => {
  // Generate unique nonce for each request
  const nonce = crypto.randomBytes(16).toString("base64");
  req.nonce = nonce;

  // Skip CSP for OAuth routes
  if (req.path.startsWith("/auth/")) {
    return next();
  }

  const csp = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'unsafe-eval'", // For development only
      "https://accounts.google.com",
      "https://apis.google.com",
    ],
    "style-src": [
      "'self'",
      "'unsafe-inline'", // For CSS-in-JS libraries
      "https://fonts.googleapis.com",
    ],
    "img-src": ["'self'", "data:", "https:"],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    "connect-src": [
      "'self'",
      "https://accounts.google.com",
      "https://www.googleapis.com",
    ],
    "form-action": ["'self'", "https://accounts.google.com"],
    "frame-ancestors": ["'none'"], // Chống Clickjacking
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
  };

  const cspString = Object.entries(csp)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");

  res.setHeader("Content-Security-Policy", cspString);
  next();
};
```

### 🔑 Các directive quan trọng

| Directive         | Mục đích                     | Giá trị trong SuLi                        |
| ----------------- | ---------------------------- | ----------------------------------------- |
| `default-src`     | Nguồn mặc định cho tất cả    | `'self'`                                  |
| `script-src`      | Nguồn JavaScript được phép   | `'self'`, `nonce`, Google APIs            |
| `style-src`       | Nguồn CSS được phép          | `'self'`, `'unsafe-inline'`, Google Fonts |
| `img-src`         | Nguồn hình ảnh được phép     | `'self'`, `data:`, `https:`               |
| `frame-ancestors` | Chống Clickjacking           | `'none'`                                  |
| `connect-src`     | Nguồn kết nối AJAX/WebSocket | `'self'`, Google APIs                     |

---

## 3. Demo chặn Inline Scripts

### 🚫 Test Case 1: Inline Script bị chặn

**Bước 1:** Mở Developer Tools (F12)

**Bước 2:** Truy cập trang có CSP: `http://localhost:3000`

**Bước 3:** Chạy script inline trong Console:

```javascript
// ❌ Script này sẽ BỊ CHẶN
const maliciousScript = document.createElement("script");
maliciousScript.textContent = `
  alert('🚨 XSS Attack!');
  console.log('❌ Malicious code executed');
  document.body.innerHTML = '<h1>HACKED!</h1>';
`;
document.head.appendChild(maliciousScript);
```

**Kết quả mong đợi:**

- ❌ Alert không hiển thị
- ❌ Console không in "Malicious code executed"
- ❌ Trang web không bị thay đổi
- ✅ Console báo lỗi CSP: `Refused to execute inline script because it violates the following Content Security Policy directive`

### ✅ Test Case 2: Script với Nonce được phép

**Bước 1:** Lấy nonce từ CSP header:

```javascript
// Lấy nonce từ response header hoặc meta tag
const cspHeader = document.querySelector(
  'meta[http-equiv="Content-Security-Policy"]'
)?.content;
const nonceMatch = cspHeader?.match(/'nonce-([^']+)'/);
const nonce = nonceMatch?.[1];
console.log("Current nonce:", nonce);
```

**Bước 2:** Chạy script với nonce đúng:

```javascript
// ✅ Script này sẽ ĐƯỢC PHÉP chạy
const legitimateScript = document.createElement("script");
legitimateScript.setAttribute("nonce", "");
legitimateScript.textContent = `
  console.log('✅ Legitimate script with valid nonce');
  alert('✅ This script is allowed!');
`;
document.head.appendChild(legitimateScript);
```

**Kết quả mong đợi:**

- ✅ Alert hiển thị: "This script is allowed!"
- ✅ Console in: "Legitimate script with valid nonce"
- ✅ Không có lỗi CSP

### 🔒 Test Case 3: Script với Hash được phép

**Bước 1:** Tính hash SHA256 cho script:

```javascript
// Script cần chạy
const scriptContent = "console.log('Script with hash'); alert('Hash works!');";

// Tính hash (cần thêm hash này vào CSP)
const encoder = new TextEncoder();
const data = encoder.encode(scriptContent);
const hashBuffer = await crypto.subtle.digest("SHA-256", data);
const hashArray = Array.from(new Uint8Array(hashBuffer));
const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
console.log("SHA256 Hash:", hashBase64);
```

**Bước 2:** Thêm hash vào CSP (trong cspMiddleware.js):

```javascript
'script-src': [
  "'self'",
  `'nonce-${nonce}'`,
  `'sha256-${hashBase64}'`, // Thêm hash này
  // ... other sources
]
```

---

## 4. Demo chặn Clickjacking

### 🎯 Clickjacking là gì?

Clickjacking là kỹ thuật tấn công bằng cách nhúng trang web vào iframe ẩn, đánh lừa người dùng click vào nút/link không mong muốn.

### 🛡️ Cách CSP chống Clickjacking

**CSP directive:** `frame-ancestors 'none'`

### 🧪 Test Clickjacking

**Bước 1:** Tạo file test `clickjacking_test.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Clickjacking Test</title>
    <style>
      .overlay {
        position: absolute;
        top: 100px;
        left: 100px;
        width: 500px;
        height: 400px;
        background: rgba(255, 0, 0, 0.3);
        z-index: 1000;
      }

      iframe {
        width: 800px;
        height: 600px;
        border: 2px solid red;
      }
    </style>
  </head>
  <body>
    <h1>🚨 Clickjacking Attack Test</h1>
    <p>
      Trang SuLi Coffee bên dưới sẽ <strong>KHÔNG HIỂN thị</strong> nếu CSP hoạt
      động đúng:
    </p>

    <!-- ❌ Iframe này sẽ bị chặn bởi CSP -->
    <iframe src="http://localhost:3000" title="SuLi Coffee - Should be blocked">
    </iframe>

    <div class="overlay">
      <h2>🎯 Fake Button</h2>
      <p>
        Nếu iframe hiển thị, người dùng có thể bị lừa click vào nút ẩn bên dưới!
      </p>
    </div>
  </body>
</html>
```

**Bước 2:** Mở file này trong browser

**Bước 3:** Kiểm tra iframe

**Kết quả mong đợi:**

- ❌ Iframe rỗng/không hiển thị nội dung SuLi Coffee
- ✅ Console báo lỗi: `Refused to display in a frame because it violates the following Content Security Policy directive: "frame-ancestors 'none'"`

### 🔧 Test với các giá trị khác nhau

```javascript
// Test 1: frame-ancestors 'none' (hiện tại)
// Kết quả: Chặn TẤT CẢ iframe

// Test 2: frame-ancestors 'self'
// Kết quả: Chỉ cho phép cùng origin

// Test 3: frame-ancestors 'self' https://trusted-site.com
// Kết quả: Cho phép cùng origin + trusted-site.com

// Test 4: Không có frame-ancestors
// Kết quả: Cho phép embedding từ mọi nguồn (NGUY HIỂM!)
```

---

## 5. Test Cases chi tiết

### 🧪 Bộ test tự động

**Tạo file:** `backend/public/csp_test.html`

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🧪 CSP Security Test - SuLi Coffee</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-case {
            border: 1px solid #ccc;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
        }
        .success { background-color: #d4edda; border-color: #c3e6cb; }
        .danger { background-color: #f8d7da; border-color: #f5c6cb; }
        .warning { background-color: #fff3cd; border-color: #ffeaa7; }
        .result { margin-top: 10px; font-weight: bold; }
        button { padding: 10px 15px; margin: 5px; cursor: pointer; }
        .btn-danger { background: #dc3545; color: white; border: none; }
        .btn-success { background: #28a745; color: white; border: none; }
    </style>
</head>
<body>
    <h1>🛡️ CSP Security Test Suite</h1>
    <p><strong>Hướng dẫn:</strong> Mở Developer Tools (F12) để xem kết quả chi tiết</p>

    <!-- Test Case 1: Inline Script Attack -->
    <div class="test-case danger">
        <h3>🚨 Test 1: Inline Script Attack (Phải bị chặn)</h3>
        <p>Thử chèn script độc hại vào trang:</p>
        <button class="btn-danger" onclick="testInlineAttack()">🚀 Chạy XSS Attack</button>
        <div class="result" id="test1-result">Chưa test</div>
    </div>

    <!-- Test Case 2: Nonce Script -->
    <div class="test-case success">
        <h3>✅ Test 2: Script với Nonce (Phải được phép)</h3>
        <p>Script với nonce hợp lệ:</p>
        <button class="btn-success" onclick="testNonceScript()">🔑 Chạy Nonce Script</button>
        <div class="result" id="test2-result">Chưa test</div>
    </div>

    <!-- Test Case 3: External Resource -->
    <div class="test-case warning">
        <h3>⚠️ Test 3: External Resource Loading</h3>
        <p>Thử tải tài nguyên từ nguồn không được phép:</p>
        <button class="btn-danger" onclick="testExternalResource()">🌐 Tải External Script</button>
        <div class="result" id="test3-result">Chưa test</div>
    </div>

    <!-- Test Case 4: Frame Embedding -->
    <div class="test-case danger">
        <h3>🖼️ Test 4: Clickjacking Protection</h3>
        <p>Thử nhúng trang này vào iframe:</p>
        <button class="btn-danger" onclick="testFrameEmbedding()">🎯 Test Clickjacking</button>
        <div class="result" id="test4-result">Chưa test</div>
    </div>

    <!-- Results Summary -->
    <div class="test-case" style="background: #f8f9fa; border: 2px solid #007bff;">
        <h3>📊 Kết quả tổng hợp</h3>
        <div id="summary">Chưa có test nào được chạy</div>
    </div>

    <script nonce="{{ nonce }}">
        let testResults = {};

        // Test 1: Inline Script Attack
        function testInlineAttack() {
            try {
                const script = document.createElement('script');
                script.textContent = `
                    alert('🚨 XSS ATTACK SUCCESS!');
                    console.log('❌ SECURITY BREACH: Inline script executed');
                    testResults.test1 = { passed: false, message: 'FAILED: XSS attack succeeded!' };
                `;
                document.head.appendChild(script);

                // Nếu đến đây mà không bị CSP chặn = thất bại
                setTimeout(() => {
                    if (!testResults.test1) {
                        testResults.test1 = { passed: false, message: 'FAILED: Script should be blocked by CSP!' };
                        updateTestResult('test1-result', testResults.test1);
                    }
                }, 100);

            } catch (error) {
                testResults.test1 = { passed: true, message: 'SUCCESS: CSP blocked the attack!' };
                console.log('✅ CSP Protection: ', error.message);
            }

            updateTestResult('test1-result', testResults.test1 || { passed: true, message: 'SUCCESS: CSP blocked inline script' });
        }

        // Test 2: Nonce Script
        function testNonceScript() {
            try {
                const nonce = getCurrentNonce();
                const script = document.createElement('script');
                script.setAttribute('nonce', nonce);
                script.textContent = `
                    console.log('✅ Nonce script executed successfully');
                    testResults.test2 = { passed: true, message: 'SUCCESS: Nonce script allowed' };
                    updateTestResult('test2-result', testResults.test2);
                `;
                document.head.appendChild(script);

                setTimeout(() => {
                    if (!testResults.test2) {
                        testResults.test2 = { passed: false, message: 'FAILED: Nonce script was blocked!' };
                        updateTestResult('test2-result', testResults.test2);
                    }
                }, 100);

            } catch (error) {
                testResults.test2 = { passed: false, message: 'FAILED: ' + error.message };
                updateTestResult('test2-result', testResults.test2);
            }
        }

        // Test 3: External Resource
        function testExternalResource() {
            const img = document.createElement('img');
            img.src = 'https://evil-site.com/malicious.js'; // Nguồn không được phép

            img.onload = () => {
                testResults.test3 = { passed: false, message: 'FAILED: External resource loaded!' };
                updateTestResult('test3-result', testResults.test3);
            };

            img.onerror = () => {
                testResults.test3 = { passed: true, message: 'SUCCESS: CSP blocked external resource' };
                updateTestResult('test3-result', testResults.test3);
            };

            document.body.appendChild(img);
        }

        // Test 4: Frame Embedding
        function testFrameEmbedding() {
            const newWindow = window.open('', '_blank', 'width=600,height=400');
            newWindow.document.write(`
                <h2>🎯 Clickjacking Test</h2>
                <iframe src="${window.location.href}" width="500" height="300"></iframe>
                <script>
                    setTimeout(() => {
                        const iframe = document.querySelector('iframe');
                        if (iframe.contentDocument || iframe.contentWindow.document) {
                            alert('❌ FAILED: Frame embedding allowed!');
                        } else {
                            alert('✅ SUCCESS: Frame embedding blocked by CSP!');
                        }
                        window.close();
                    }, 2000);
                </script>
            `);
        }

        // Helper functions
        function getCurrentNonce() {
            // Lấy nonce từ script tag hiện tại
            const scripts = document.querySelectorAll('script[nonce]');
            return scripts[scripts.length - 1]?.getAttribute('nonce') || '';
        }

        function updateTestResult(elementId, result) {
            const element = document.getElementById(elementId);
            element.innerHTML = `
                <span style="color: ${result.passed ? 'green' : 'red'}">
                    ${result.passed ? '✅' : '❌'} ${result.message}
                </span>
            `;
            updateSummary();
        }

        function updateSummary() {
            const totalTests = Object.keys(testResults).length;
            const passedTests = Object.values(testResults).filter(r => r.passed).length;

            document.getElementById('summary').innerHTML = `
                <strong>Tests completed: ${totalTests}/4</strong><br>
                <strong style="color: green">Passed: ${passedTests}</strong><br>
                <strong style="color: red">Failed: ${totalTests - passedTests}</strong>
            `;
        }

        // CSP Violation Event Listener
        document.addEventListener('securitypolicyviolation', (event) => {
            console.warn('🚨 CSP Violation:', {
                directive: event.violatedDirective,
                blockedURI: event.blockedURI,
                source: event.sourceFile,
                line: event.lineNumber
            });
        });
    </script>
</body>
</html>
```

---

## 6. Troubleshooting

### ❗ Lỗi thường gặp

#### 1. CSP chặn Google OAuth

**Triệu chứng:**

```
Refused to connect to 'https://accounts.google.com' because it violates CSP
```

**Giải pháp:**

```javascript
// Thêm vào cspMiddleware.js
'connect-src': [
  "'self'",
  "https://accounts.google.com",
  "https://www.googleapis.com"
],
'form-action': [
  "'self'",
  "https://accounts.google.com"
]
```

#### 2. CSS inline bị chặn

**Triệu chứng:**

```
Refused to apply inline style because it violates CSP
```

**Giải pháp:**

```javascript
'style-src': [
  "'self'",
  "'unsafe-inline'", // Cho phép CSS inline
  "https://fonts.googleapis.com"
]
```

#### 3. Images từ data URI bị chặn

**Triệu chứng:**

```
Refused to load image from 'data:image/png...' because it violates CSP
```

**Giải pháp:**

```javascript
'img-src': [
  "'self'",
  "data:", // Cho phép data URI
  "https:"
]
```

### 🔧 Debug CSP

#### 1. Kiểm tra CSP header

```javascript
// Trong browser console
console.log(
  document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content
);

// Hoặc kiểm tra response headers
fetch(window.location.href).then((response) => {
  console.log("CSP Header:", response.headers.get("Content-Security-Policy"));
});
```

#### 2. CSP Report Mode (không chặn, chỉ báo cáo)

```javascript
// Thay vì Content-Security-Policy, dùng Report-Only để test
res.setHeader("Content-Security-Policy-Report-Only", cspString);
```

#### 3. Monitoring CSP Violations

```javascript
// Lắng nghe vi phạm CSP
document.addEventListener("securitypolicyviolation", (event) => {
  console.error("CSP Violation:", {
    directive: event.violatedDirective,
    blockedURI: event.blockedURI,
    documentURI: event.documentURI,
    sourceFile: event.sourceFile,
    lineNumber: event.lineNumber,
  });

  // Gửi report về server
  fetch("/api/csp-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
});
```

---

## 📚 Tài liệu tham khảo

- [MDN CSP Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Quick Reference](https://content-security-policy.com/)
- [Google CSP Guide](https://developers.google.com/web/fundamentals/security/csp)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)

---

## ✅ Checklist bảo mật CSP

- [ ] `default-src 'self'` được thiết lập
- [ ] `script-src` không có `'unsafe-inline'` (trừ khi cần thiết)
- [ ] `object-src 'none'` để chặn plugins
- [ ] `frame-ancestors 'none'` để chống clickjacking
- [ ] Sử dụng nonce cho inline scripts cần thiết
- [ ] Test CSP trên môi trường development
- [ ] Monitor CSP violations trong production
- [ ] Whitelist chỉ những domains thực sự cần thiết

---

_Demo này được tạo cho môn Bảo mật Ứng dụng Web - Đại học Công Thương TP.HCM_

**Sinh viên thực hiện:** Điêu Thúy Liên - 22810310267
