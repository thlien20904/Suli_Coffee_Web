import React from "react";
import { Outlet } from "react-router-dom";
import UserNavbar from "./Navbar"; // 👈 đổi tên import
import Footer from "./Footer";

const UserLayout = () => {
  return (
    <div className="user-layout">
      <UserNavbar />
      <main className="content">
        <Outlet /> {/* ✅ render các route con như Home, Products,... */}
      </main>
      <Footer />
    </div>
  );
};

export default UserLayout;
