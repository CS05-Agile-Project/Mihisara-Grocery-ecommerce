import { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import {
  FiMenu,
  FiX,
  FiUsers,
  FiBox,
  FiPlusCircle,
  FiLogOut,
  FiShoppingBag,
  FiTruck,
  FiHelpCircle,
  FiStar,
  FiBarChart2,
  FiCalendar,
  FiPieChart,
  FiActivity,
} from "react-icons/fi";

import UserPage from "./userPage.jsx";
import ProductPage from "./productPage.jsx";
import AddProductPage from "./productAdd.jsx";
import EditProductPage from "./productsEdit.jsx";
import AddUserPage from "./userAdd.jsx";
import EditUserPage from "./usersEdit.jsx";
import Dashboard from "./Dashboard.jsx";
import AdminOrdersPage from "./ordersPage.jsx";
import AdminReviewPage from "./reviewPage.jsx";
import AdminSupplierPage from "./supplierPage.jsx";
import AddSupplierPage from "./supplierAdd.jsx";
import EditSupplierPage from "./supplierEdit.jsx";
import AdminRiderPage from "./ridersPage.jsx";
import AddRiderPage from "./riderAdd.jsx";
import EditRiderPage from "./riderEdit.jsx";
import AdminDeliveryPage from "./deliveryPage.jsx";
import AdminFaqPage from "./faqsPage.jsx";
import AddFaqPage from "./faqAdd.jsx";
import EditFaqPage from "./faqEdit.jsx";
import OrderReport from "./orderReports.jsx";
import UserReportsPage from "./userReport.jsx";
import ProductAnalysis from "./ProductAnalysis.jsx";
import CalendarPage from "./CalendarPage.jsx";
import TopProductsPage from "./charts/TopProductsPage.jsx";
import PieChartPage from "./charts/PieChartPage.jsx";
import LineChartPage from "./charts/LineChartPage.jsx";
import BarChartPage from "./charts/BarChartPage.jsx";
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
            <Route path="/" element={<Navigate to="dashboard" replace />} />

            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<UserPage />} />

            <Route path="products" element={<ProductPage />} />
            <Route path="add-product" element={<AddProductPage />} />
            <Route path="edit-product" element={<EditProductPage />} />


            <Route path="add-users" element={<AddUserPage />} />
            <Route path="edit-users" element={<EditUserPage />} />

            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="reviews" element={<AdminReviewPage />} />
            <Route path="suppliers" element={<AdminSupplierPage />} />
            <Route path="add-suppliers" element={<AddSupplierPage />} />
            <Route path="edit-suppliers" element={<EditSupplierPage />} />
            <Route path="riders" element={<AdminRiderPage />} />
            <Route path="add-riders" element={<AddRiderPage />} />
            <Route path="edit-riders" element={<EditRiderPage />} />
            <Route path="delivery" element={<AdminDeliveryPage />} />
            <Route path="faqs" element={<AdminFaqPage />} />
            <Route path="add-faqs" element={<AddFaqPage />} />
            <Route path="edit-faqs" element={<EditFaqPage />} />
            <Route path="odrp" element={<OrderReport />} />
            <Route path="user-report" element={<UserReportsPage />} />
            <Route path="product-analysis" element={<ProductAnalysis />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="top-products" element={<TopProductsPage />} />
            <Route path="pie-chart" element={<PieChartPage />} />
            <Route path="line-chart" element={<LineChartPage />} />
            <Route path="bar-chart" element={<BarChartPage />} />

            {/* Optional 404 inside admin */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
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
        <SectionTitle>Main</SectionTitle>
        <Item to="/" icon={<BsShopWindow />} label="Site Home" end />
        <Item to="/admin/dashboard" icon={<FiActivity />} label="Dashboard" />
        <Item to="/admin/users" icon={<FiUsers />} label="Manage Users" />
        <Item to="/admin/products" icon={<FiBox />} label="Products" />
        <Item to="/admin/orders" icon={<FiShoppingBag />} label="Orders" />
        <Item to="/admin/delivery" icon={<FiTruck />} label="Delivery" />
        <Item to="/admin/suppliers" icon={<BsShopWindow />} label="Suppliers" />
        <Item to="/admin/riders" icon={<FiTruck />} label="Riders" />
        <Item to="/admin/reviews" icon={<FiStar />} label="Reviews" />
        <Item to="/admin/faqs" icon={<FiHelpCircle />} label="FAQs" />
        <Item to="/admin/calendar" icon={<FiCalendar />} label="Calendar" />

        <SectionTitle>Quick Actions</SectionTitle>
        <Item to="/admin/add-product" icon={<FiPlusCircle />} label="Add Product" />
        <Item to="/admin/add-users" icon={<FiPlusCircle />} label="Add Users" />
        <Item to="/admin/add-suppliers" icon={<FiPlusCircle />} label="Add Supplier" />
        <Item to="/admin/add-riders" icon={<FiPlusCircle />} label="Add Rider" />
        <Item to="/admin/add-faqs" icon={<FiPlusCircle />} label="Add FAQ" />

        <SectionTitle>Reports</SectionTitle>
        <Item to="/admin/odrp" icon={<FiBarChart2 />} label="Order Reports" />
        <Item to="/admin/user-report" icon={<FiUsers />} label="User Reports" />
        <Item to="/admin/product-analysis" icon={<FiPieChart />} label="Product Analysis" />
        <Item to="/admin/top-products" icon={<FiBarChart2 />} label="Top Products" />
        <Item to="/admin/pie-chart" icon={<FiPieChart />} label="Category Chart" />
        <Item to="/admin/line-chart" icon={<FiActivity />} label="Sales Trend" />
        <Item to="/admin/bar-chart" icon={<FiBarChart2 />} label="Sales Chart" />
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
