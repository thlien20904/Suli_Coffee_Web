import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import UserNavbar from "./Navbar"; // 👈 đổi tên import
import Footer from "./Footer";

const UserLayout = () => {
  useEffect(() => {
    // compute header height and set CSS variable and content padding accordingly
    const applyHeaderHeight = () => {
      const header = document.querySelector(".header");
      const main = document.querySelector(".user-layout .content");
      if (header) {
        const h = header.offsetHeight;
        // set CSS variable for other styles if needed
        document.documentElement.style.setProperty("--header-height", `${h}px`);
        if (main) {
          main.style.paddingTop = `${h}px`;
        } else {
          // fallback: set body padding if main not found
          document.body.style.paddingTop = `${h}px`;
        }
      }
    };

    applyHeaderHeight();
    window.addEventListener("resize", applyHeaderHeight);
    // in case fonts/images change size after load
    window.addEventListener("load", applyHeaderHeight);
    return () => {
      window.removeEventListener("resize", applyHeaderHeight);
      window.removeEventListener("load", applyHeaderHeight);
    };
  }, []);

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
