# 🔄 Real-time Integration Guide - User & Admin

Hướng dẫn tích hợp Socket.IO real-time cho toàn bộ ứng dụng (User + Admin)

## 📋 Tổng quan

Hệ thống real-time này cho phép:

- ✅ User nhận thông báo đơn hàng real-time
- ✅ Admin theo dõi đơn hàng mới real-time
- ✅ Cập nhật trạng thái đơn hàng real-time
- ✅ Thông báo voucher, sản phẩm real-time
- ✅ Dashboard admin real-time

## 🏗️ Kiến trúc

```
┌─────────────────┐         WebSocket        ┌─────────────────┐
│  Frontend       │◄──────────────────────────►│  Backend        │
│  (React)        │                            │  (Socket.IO)    │
│                 │                            │                 │
│  - useSocket    │                            │  - socketManager│
│  - Components   │                            │  - Controllers  │
└─────────────────┘                            └─────────────────┘
```

## 📁 Files đã tạo

### Backend (Node.js)

1. **`backend/socketManager.js`** ⭐

   - Central Socket.IO management
   - Client registration với role (admin/user)
   - Helper functions: `emitToAdmins`, `emitToUser`, `emitToAllUsers`
   - Connection tracking

2. **`backend/utils/realtimeHelper.js`** ⭐

   - Helper functions cho controllers
   - `emitOrderUpdate` - Emit order updates
   - `emitOrderStatusChange` - Emit status changes
   - `emitUserNotification` - Send notification to user
   - `emitAdminNotification` - Send notification to admin

3. **Updated: `backend/server.js`**

   - Initialize Socket.IO server
   - Setup socketManager
   - Export socketManager to app

4. **Updated: `backend/controllers/user/orders/placeOrder.js`**

   - Emit `order:update` khi đặt hàng
   - Emit `notification` cho user và admin

5. **Updated: `backend/controllers/admin/orderController.js`**
   - Emit `order:status` khi admin update status
   - Emit `notification` cho user

### Frontend (React)

1. **`frontend/src/hooks/useSocket.js`** ⭐⭐⭐

   - Custom React Hook cho Socket.IO
   - `useSocket()` - Base connection hook
   - `useOrderUpdates(userId)` - Hook cho user orders
   - `useAdminDashboard()` - Hook cho admin dashboard

2. **`frontend/src/components/RealTimeNotifications.js`** ⭐

   - Toast notifications component
   - Auto-dismiss sau 5 giây
   - Connection status indicator

3. **`frontend/src/components/UserOrdersRealtime.js`** ⭐

   - User orders list với real-time updates
   - Merge initial orders + real-time orders
   - Status badges với colors

4. **`frontend/src/components/AdminDashboardRealtime.js`** ⭐⭐
   - Admin dashboard với real-time stats
   - Orders table real-time
   - Notifications panel
   - Filters (all/pending/processing/completed)

## 🔧 Setup Instructions

### 1. Backend Setup

#### Install dependencies (nếu chưa có):

```bash
cd backend
npm install socket.io
```

#### Update `server.js` (đã làm xong):

```javascript
const { initializeSocketIO } = require("./socketManager");

// Initialize Socket.IO
const socketManager = initializeSocketIO(io);
app.set("socketManager", socketManager);
```

### 2. Frontend Setup

#### Install dependencies:

```bash
cd frontend
npm install socket.io-client
```

#### Update `App.js` - Add RealTimeNotifications:

```javascript
import RealTimeNotifications from './components/RealTimeNotifications';

function App() {
  const userId = // get from auth context

  return (
    <div>
      {/* Existing routes */}
      <RealTimeNotifications userId={userId} role="user" />
    </div>
  );
}
```

#### Update Profile/Orders page:

```javascript
import UserOrdersRealtime from './components/UserOrdersRealtime';

function ProfilePage() {
  const userId = // get from auth
  const [initialOrders, setInitialOrders] = useState([]);

  useEffect(() => {
    // Fetch initial orders from API
    fetch('/api/user/orders')
      .then(res => res.json())
      .then(data => setInitialOrders(data));
  }, []);

  return (
    <div>
      <UserOrdersRealtime
        userId={userId}
        initialOrders={initialOrders}
      />
    </div>
  );
}
```

#### Update Admin Dashboard:

```javascript
import AdminDashboardRealtime from "./components/AdminDashboardRealtime";

function AdminDashboard() {
  return <AdminDashboardRealtime />;
}
```

## 🎯 Socket.IO Events

### Client → Server

| Event      | Data               | Description              |
| ---------- | ------------------ | ------------------------ |
| `register` | `{ role, userId }` | Register client với role |

### Server → Client

#### For Users:

| Event            | Data                                            | Description         |
| ---------------- | ----------------------------------------------- | ------------------- |
| `order:update`   | `{ orderId, userId, totalAmount, status, ... }` | Đơn hàng mới/update |
| `order:status`   | `{ orderId, status, message }`                  | Status change       |
| `notification`   | `{ type, title, message, timestamp }`           | Thông báo chung     |
| `voucher:update` | `{ voucherId, ... }`                            | Voucher update      |
| `cart:update`    | `{ cartId, ... }`                               | Giỏ hàng update     |

#### For Admins:

| Event                 | Data                                    | Description        |
| --------------------- | --------------------------------------- | ------------------ |
| `order:new`           | `{ orderId, userId, totalAmount, ... }` | Đơn hàng mới       |
| `order:status-change` | `{ orderId, userId, status, ... }`      | User status change |
| `notification`        | `{ type, title, message, data }`        | Admin notification |

## 💡 Usage Examples

### Example 1: User receives order notification

**Backend (placeOrder.js):**

```javascript
const {
  emitOrderUpdate,
  emitUserNotification,
} = require("../utils/realtimeHelper");

// After creating order
emitOrderUpdate(req, userId, orderData);
emitUserNotification(req, userId, {
  type: "order",
  title: "Đặt hàng thành công",
  message: `Đơn hàng #${orderId} đã được tạo`,
});
```

**Frontend (Profile page):**

```javascript
import { useOrderUpdates } from "../hooks/useSocket";

function ProfileOrders() {
  const { orders, notifications } = useOrderUpdates(userId);

  // orders và notifications tự động update real-time!
  return (
    <div>
      {orders.map((order) => (
        <OrderCard key={order.orderId} order={order} />
      ))}
    </div>
  );
}
```

### Example 2: Admin updates order status

**Backend (orderController.js):**

```javascript
const { emitOrderStatusChange } = require("../utils/realtimeHelper");

// After updating status
emitOrderStatusChange(req, order.UserId, {
  orderId: order.OrderId,
  status: newStatus,
  message: "Đơn hàng đã được cập nhật",
});
```

**Frontend (User sees update immediately):**

```javascript
// Component tự động nhận event 'order:status'
// và update UI không cần reload!
```

### Example 3: Admin dashboard real-time

**Frontend (Admin page):**

```javascript
import { useAdminDashboard } from "../hooks/useSocket";

function AdminDashboard() {
  const { orders, notifications, stats, isConnected } = useAdminDashboard();

  // orders, stats tự động update khi có đơn mới!
  return (
    <div>
      <h1>
        Đơn hàng: {stats.pending} pending, {stats.completed} completed
      </h1>
      {orders.map((order) => (
        <OrderRow key={order.orderId} order={order} />
      ))}
    </div>
  );
}
```

## 🧪 Testing

### 1. Test User Order Real-time

```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend
cd frontend
npm start
```

**Steps:**

1. Login as user
2. Mở trang Profile/Orders
3. Đặt hàng mới
4. ✅ Xem đơn hàng xuất hiện real-time trong list!
5. ✅ Xem toast notification xuất hiện!

### 2. Test Admin Dashboard

**Steps:**

1. Login as admin
2. Mở Admin Dashboard
3. Có user đặt hàng
4. ✅ Xem đơn mới xuất hiện trong dashboard ngay lập tức!
5. ✅ Stats tự động tăng!
6. Update status đơn hàng
7. ✅ User nhận notification ngay!

### 3. Test with curl (manual)

```bash
# Get socket stats
curl http://localhost:5000/api/socket-stats

# Manually trigger notification (for testing)
curl -X POST http://localhost:5000/api/test-notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "type": "order",
    "title": "Test",
    "message": "This is a test notification"
  }'
```

## 🔐 Security Considerations

### Authentication

```javascript
// socketManager.js - Add JWT verification
socket.on("register", async (data) => {
  const { token, role } = data;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Verify role matches user's actual role in DB
    socket.userId = decoded.id;
    socket.role = role;
  } catch (err) {
    socket.disconnect();
  }
});
```

### Room-based Authorization

- Admins join `admin-room`
- Users join `user-{userId}` room
- Events chỉ gửi đến đúng rooms

## 📊 Performance Tips

1. **Limit event frequency**

   ```javascript
   // Debounce frequent events
   const debouncedEmit = debounce((event, data) => {
     io.emit(event, data);
   }, 1000);
   ```

2. **Cleanup old data**

   ```javascript
   // Keep only last 50 orders in memory
   if (orders.length > 50) {
     orders = orders.slice(0, 50);
   }
   ```

3. **Pagination for large datasets**
   ```javascript
   // Load more orders on scroll
   socket.on("loadMore", (page) => {
     const orders = getOrders(page);
     socket.emit("orders:page", orders);
   });
   ```

## 🐛 Troubleshooting

### Socket not connecting

```javascript
// Check browser console
console.log("Socket connected:", socket.connected);
console.log("Socket ID:", socket.id);

// Check backend logs
console.log("Total connections:", io.engine.clientsCount);
```

### Events not received

```javascript
// Frontend - Log all events
socket.onAny((event, data) => {
  console.log("📥 Received:", event, data);
});

// Backend - Log all emits
io.on("connection", (socket) => {
  socket.onAny((event, data) => {
    console.log("📤 Sent:", event, data);
  });
});
```

### Multiple connections

```javascript
// Frontend - Reuse socket instance
let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL);
  }
  return socketInstance;
};
```

## 📚 Next Steps

### Phase 1 (Current) ✅

- [x] Setup Socket.IO infrastructure
- [x] User order real-time updates
- [x] Admin dashboard real-time
- [x] Notifications component

### Phase 2 (Recommended)

- [ ] Add voucher real-time updates
- [ ] Add cart sync across devices
- [ ] Add typing indicators (chat)
- [ ] Add online users count

### Phase 3 (Advanced)

- [ ] Redis adapter for scaling
- [ ] Message queue (RabbitMQ)
- [ ] Real-time analytics charts
- [ ] WebRTC video calls

## 🎓 Learning Resources

- [Socket.IO Official Docs](https://socket.io/docs/v4/)
- [React + Socket.IO Tutorial](https://socket.io/how-to/use-with-react)
- [Real-time Best Practices](https://socket.io/docs/v4/performance-tuning/)

---

**Made with ❤️ for SuLi Coffee**  
Last Updated: November 13, 2025
