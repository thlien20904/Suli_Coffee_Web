import { Routes, Route } from "react-router-dom";

// user pages
import Home from "./pages/user/Home";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";
import ForgotPassword from "./pages/user/ForgotPassword";
import ResetPassword from "./pages/user/ResetPassword";
import ProductList from "./pages/user/ProductList";
import ProductDetail from "./pages/user/ProductDetail";
import Cart from "./pages/user/Cart";
import Checkout from "./pages/user/Checkout";
import Profile from "./pages/user/Profile";
import BlogList from "./pages/user/BlogList";
import BlogDetail from "./pages/user/BlogDetail";
import About from "./pages/user/About";
import Contact from "./pages/user/Contact";

// admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import Food from "./pages/admin/Food/Food";
import AddFood from "./pages/admin/Food/Add";
import EditFood from "./pages/admin/Food/Edit";
import Category from "./pages/admin/category/category";
import CategoryAdd from "./pages/admin/category/add";
import CategoryEdit from "./pages/admin/category/edit";
import Ingredient from "./pages/admin/ingredient/ingredient";
import AddIngredient from "./pages/admin/ingredient/add";
import EditIngredient from "./pages/admin/ingredient/edit";
import ExportIngredient from "./pages/admin/ingredient/export";
import Payment from "./pages/admin/payment/payment";
import AddPayment from "./pages/admin/payment/add";
import EditPayment from "./pages/admin/payment/edit";
import UserList from "./pages/admin/users";
import Staff from "./pages/admin/staff/staff";
import AddStaff from "./pages/admin/staff/add";
import EditStaff from "./pages/admin/staff/edit";
import Invoice from "./pages/admin/invoice";
import Order from "./pages/admin/order";
import RevenueReport from "./pages/admin/report/revenue";
import BestsellerReport from "./pages/admin/report/bestseller";

// layout
import UserLayout from "./components/layout/user/UserLayout";
import AdminLayout from "./components/layout/admin/AdminLayout";

function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* User routes */}
      <Route path="/" element={<UserLayout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<ProductList />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="profile" element={<Profile />} />
        <Route path="blogs" element={<BlogList />} />
        <Route path="blog/:id" element={<BlogDetail />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
      </Route>
      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        {/* Food CRUD */}
        <Route path="food" element={<Food />} />
        <Route path="food/add" element={<AddFood />} />
        <Route path="food/edit/:id" element={<EditFood />} />
        {/* Category CRUD */}
        <Route path="category" element={<Category />} /> {/* ✅ danh sách */}
        <Route path="category/add" element={<CategoryAdd />} />
        <Route path="category/edit/:id" element={<CategoryEdit />} />
        {/* Ingredient CRUD */}
        <Route path="ingredient" element={<Ingredient />} />{" "}
        {/* ✅ danh sách */}
        <Route path="ingredient/add" element={<AddIngredient />} />
        <Route path="ingredient/edit/:id" element={<EditIngredient />} />
        <Route path="export" element={<ExportIngredient />} />
        {/* Payment Method */}
        <Route path="payment" element={<Payment />} />
        <Route path="payment/add" element={<AddPayment />} />
        <Route path="payment/edit/:id" element={<EditPayment />} />
        {/* Users */}
        <Route path="users" element={<UserList />} />
        {/* Staff */}
        <Route path="staff" element={<Staff />} />
        <Route path="staff/add" element={<AddStaff />} /> {/* Thêm */}
        <Route path="staff/edit/:id" element={<EditStaff />} /> {/* Sửa */}
        {/* Invoice */}
        <Route path="invoice" element={<Invoice />} />
        {/* Order */}
        <Route path="order" element={<Order />} />
        {/* Report */}
        <Route path="revenue" element={<RevenueReport />} />
        <Route path="bestseller" element={<BestsellerReport />} />
      </Route>{" "}
    </Routes>
  );
}

export default App;
