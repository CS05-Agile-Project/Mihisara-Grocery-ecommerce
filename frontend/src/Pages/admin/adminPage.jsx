import { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import { FiMenu, FiX, FiUsers, FiBox, FiPlusCircle, FiLogOut } from "react-icons/fi";

import UserPage from "./userPage.jsx";
import ProductPage from "./productPage.jsx";
import AddProductPage from "./productAdd.jsx";
import EditProductPage from "./productsEdit.jsx";
import AddUserPage from "./userAdd.jsx";
import EditUserPage from "./usersEdit.jsx";
import toast from "react-hot-toast";
import axios from "axios";

import {BsShopWindow} from "react-icons/bs";


export default function AdminPage() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const decoded = jwtDecode(token);
      setMe({ name: decoded.name, email: decoded.email, role: decoded.role });
    } catch (err) {
      console.error("Token decode failed:", err);
      setMe(null);
    }
  }, []);

  const [, setStatus] = useState("loading");
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setStatus("unauthenticated");
      window.location.href = "/login";
    } else {
      axios
        .get(import.meta.env.VITE_BACKEND_URL+"/api/users/req", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          if (response.data.role !== "admin") {
            setStatus("unauthorized");
            toast.error("You are not authorized to access this page");
            setTimeout(() => navigate("/"), 300);
          } else {
            setStatus("authenticated");
          }
        })
        .catch((error) => {
          console.error(error);
          setStatus("unauthenticated");
          toast.error("You are not authenticated, please login");
          setTimeout(() => navigate("/login"), 300);
        });
    }
  }, [navigate]);

  const linkBase = "group flex items-center gap-3 px-4 py-2 my-2 rounded-lg transition-colors";
  const linkIdle = "text-slate-300 hover:bg-white hover:text-accent";
  const linkActive = "bg-white text-accent";

  const SectionTitle = ({ children }) => (
    <div className="mt-6 mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
      {children}
    </div>
  );

  const Item = ({ to, icon, label, end = false }) => (
    <NavLink
      to={to}
      className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
      end={end}
      onClick={() => setOpen(false)}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm">{label}</span>
    </NavLink>
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50 font-poppins">
      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-2 md:hidden">
        <button
          aria-label="Open menu"
          className="rounded-lg border border-slate-200 p-2 active:scale-95"
          onClick={() => setOpen(true)}
        >
          <FiMenu className="h-5 w-5" />
        </button>
        <div className="text-sm font-semibold text-slate-700">Admin Dashboard</div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col fixed inset-y-0 left-0 z-40 w-[280px] bg-green-900/85 text-slate-200 border-r">
        <SidebarContent me={me} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-[320px] bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col">
            <HeaderProfile me={me} onClose={() => setOpen(false)} />
            <nav className="py-4 overflow-y-auto h-[calc(100vh-56px-68px)] scrollbar-dark">
              <NavSections />
            </nav>
            <FooterLogout handleLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="min-w-0 md:ml-[280px] p-3 md:p-6">
        <div className="min-h-[calc(100vh-24px)] rounded-xl border border-slate-200 bg-white p-3 md:p-5">
          <Routes>
            {/* NOTE: these are RELATIVE to /admin/* */}
            <Route path="/" element={<Navigate to="products" replace />} />

            <Route path="users" element={<UserPage />} />

            <Route path="products" element={<ProductPage />} />
            <Route path="add-product" element={<AddProductPage />} />
            <Route path="edit-product" element={<EditProductPage />} />


            <Route path="add-users" element={<AddUserPage />} />
            <Route path="edit-users" element={<EditUserPage />} />

            {/* SPRINT 1 DEMO: orders, reviews, suppliers, riders, delivery, FAQ, reports and dashboards are temporarily disabled. */}

            {/* Optional 404 inside admin */}
            <Route path="*" element={<Navigate to="/admin/products" replace />} />
          </Routes>

        </div>
      </main>

      <style>{`
        .sidebar-scroll { height: calc(100vh - 56px - 68px); }
        .scrollbar-dark { scrollbar-width: thin; scrollbar-color: #10b981 #064e3b; }
      `}</style>
    </div>
  );

  // === Small helper subcomponents ===
  function Avatar({ name = "", src }) {
    const initials =
      name?.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") ||
      "AD";
    if (src) {
      return <img src={src} alt={name} className="h-10 w-10 rounded-full object-cover" />;
    }
    return (
      <div className="h-10 w-10 rounded-full bg-white text-slate-800 grid place-items-center text-sm font-semibold">
        {initials}
      </div>
    );
  }

  function HeaderProfile({ me, onClose }) {
    return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 font-poppins">
        <div className="flex items-center gap-3">
          <Avatar name={me?.name} />
          <div>
            <div className="text-sm font-semibold">{me?.name || "Admin"}</div>
            <div className="text-[11px] text-slate-400">{me?.email || ""}</div>
          </div>
        </div>
        <button
          aria-label="Close menu"
          className="rounded-lg border border-slate-700 p-2 active:scale-95"
          onClick={onClose}
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>
    );
  }

  function SidebarContent({ me }) {
    return (
      <>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800 font-poppins">
          <Avatar name={me?.name} />
          <div>
            <div className="text-sm font-semibold">{me?.name || "Admin"}</div>
            <div className="text-[11px] text-slate-400">{me?.email || ""}</div>
          </div>
        </div>
        <nav className="py-4 overflow-y-auto sidebar-scroll scrollbar-dark">
          <NavSections />
        </nav>
        <FooterLogout handleLogout={handleLogout} />
      </>
    );
  }

  function NavSections() {
    return (
      <>
        <SectionTitle>Sprint 1</SectionTitle>
        <Item to="/" icon={<BsShopWindow />} label="Site Home" end />
        <Item to="/admin/users" icon={<FiUsers />} label="Manage Users" />
        <Item to="/admin/products" icon={<FiBox />} label="Products" />

        <SectionTitle>Quick Actions</SectionTitle>
        <Item to="/admin/add-product" icon={<FiPlusCircle />} label="Add Product" />
        <Item to="/admin/add-users" icon={<FiPlusCircle />} label="Add Users" />
      </>
    );
  }

  function FooterLogout({ handleLogout }) {
    return (
      <div className="mt-auto px-4 py-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg bg-white text-slate-800 hover:bg-slate-100 active:scale-[.99]"
        >
          <FiLogOut className="text-lg" />
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>
    );
  }
}
