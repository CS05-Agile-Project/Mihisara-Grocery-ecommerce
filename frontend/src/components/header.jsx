import { NavLink, useNavigate } from "react-router-dom";
import { FiLogIn, FiSearch, FiMenu, FiX } from "react-icons/fi";
import { BsCart3 } from "react-icons/bs";
import { RxAvatar } from "react-icons/rx";
import { useState, useEffect } from "react";
import GroceryMegaMenu from "./CategoryMenu.jsx";
import { jwtDecode } from "jwt-decode";

export default function Header() {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState("");
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [searchTerm, setSearchTerm] = useState("");
    const [menuOpen, setMenuOpen] = useState(false); // ✅ mobile nav toggle
    const [showSearch, setShowSearch] = useState(false); // ✅ mobile search toggle

    useEffect(() => {
        const tokenHandler = () => setToken(localStorage.getItem("token"));

        if (token && typeof token === "string" && token.trim() !== "") {
            try {
                const decoded = jwtDecode(token);
                setFirstName(decoded?.firstName || "");
            } catch (err) {
                console.error("Token decode failed:", err);
            }
        }
        window.addEventListener("storage", tokenHandler);
        return () => {
            window.removeEventListener("storage", tokenHandler);
        };
    }, [token]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/search?query=${encodeURIComponent(searchTerm)}`);
            setSearchTerm("");
            setShowSearch(false); // ✅ hide search after submit on mobile
        }
    };

    const navLinkClasses = ({ isActive }) =>
        `relative font-semibold transition-all duration-200 ${
            isActive
                ? "text-emerald-600 after:absolute after:bottom-[-6px] after:left-0 after:w-full after:h-[3px] after:bg-emerald-600 after:rounded-full"
                : "text-gray-700 hover:text-emerald-600 hover:after:absolute hover:after:bottom-[-6px] hover:after:left-0 hover:after:w-full hover:after:h-[3px] hover:after:bg-emerald-400 hover:after:rounded-full"
        }`;

    return (
        <header className="w-full border-b border-gray-200 text-gray-700 font-poppins">
            {/* 🔹 Main Header */}
            <div className="flex items-center justify-between py-4 px-4 sm:px-6 bg-white">
                {/* Logo */}
                <NavLink to="/" className="flex items-center">
                    <img src="/logo123.png" alt="Mihisara Grocery" className="h-12 sm:h-14 w-auto object-contain" />
                </NavLink>

                {/* Desktop Search */}
                <form
                    onSubmit={handleSearch}
                    className="hidden md:flex w-[50%] border border-accent rounded-lg overflow-hidden"
                >
                    <input
                        type="text"
                        placeholder="Search for products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow px-3 py-2 outline-none"
                    />
                    <button
                        type="submit"
                        className="bg-accent px-6 text-white hover:bg-green-600"
                    >
                        <FiSearch size={18} />
                    </button>
                </form>

                {/* Right Side */}
                <div className="flex items-center gap-4 sm:gap-6">
                    {/* Mobile Search Icon */}
                    <button
                        onClick={() => setShowSearch((p) => !p)}
                        className="md:hidden text-gray-700 hover:text-emerald-600"
                    >
                        <FiSearch size={20} />
                    </button>

                    <button type="button" className="relative flex items-center gap-1 hover:text-green-600">
                        <BsCart3 size={22} />
                        <span className="hidden sm:inline">Cart</span>
                    </button>

                    <NavLink
                        to={token ? "/profile" : "/login"}
                        className="flex items-center gap-1 sm:gap-2 hover:text-accent"
                    >
                        {token ? (
                            <>
                                <RxAvatar size={22} />
                                <span className="hidden sm:inline">
                  {firstName || "Profile"}
                </span>
                            </>
                        ) : (
                            <>
                                <FiLogIn size={22} /> <span className="hidden sm:inline">Sign in</span>
                            </>
                        )}
                    </NavLink>

                    {/* Hamburger */}
                    <button
                        onClick={() => setMenuOpen((p) => !p)}
                        className="md:hidden text-gray-700 hover:text-emerald-600"
                    >
                        {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Search Bar */}
            {showSearch && (
                <form
                    onSubmit={handleSearch}
                    className="flex md:hidden mx-4 my-2 border border-accent rounded-lg overflow-hidden"
                >
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow px-3 py-2 outline-none"
                    />
                    <button
                        type="submit"
                        className="bg-accent px-4 text-white hover:bg-green-600"
                    >
                        <FiSearch size={18} />
                    </button>
                </form>
            )}

            {/* 🔹 Bottom Nav (Desktop) */}
            <div className="hidden md:block w-full border-t border-gray-200 bg-white">
                <div className="flex items-center justify-between px-6 py-3 text-gray-800 text-[15px]">
                    {/* Left side */}
                    <div className="flex items-center gap-8">
                        <GroceryMegaMenu />
                        <button type="button" className="relative font-semibold text-gray-700 hover:text-emerald-600">
                            Hot Deals
                        </button>
                        <NavLink to="/" className={navLinkClasses}>
                            Home
                        </NavLink>
                        <NavLink to="/category/All" className={navLinkClasses}>
                            Shop
                        </NavLink>
                        <button type="button" className="relative font-semibold text-gray-700 hover:text-emerald-600">
                            About
                        </button>
                        <button type="button" className="relative font-semibold text-gray-700 hover:text-emerald-600">
                            Contact
                        </button>
                    </div>

                    {/* Right side */}
                </div>
            </div>

            {/* 🔹 Mobile Nav Drawer */}
            {menuOpen && (
                <div className="md:hidden bg-white border-t border-gray-200 shadow-inner">
                    <nav className="flex flex-col px-6 py-4 space-y-3 text-gray-800">
                        <GroceryMegaMenu />
                        <button type="button" className="text-left font-semibold hover:text-emerald-600">Hot Deals</button>
                        <NavLink to="/" className={navLinkClasses} onClick={() => setMenuOpen(false)}>
                            Home
                        </NavLink>
                        <NavLink to="/category/All" className={navLinkClasses} onClick={() => setMenuOpen(false)}>
                            Shop
                        </NavLink>
                        <button type="button" className="text-left font-semibold hover:text-emerald-600">About</button>
                        <button type="button" className="text-left font-semibold hover:text-emerald-600">Contact</button>
                    </nav>
                </div>
            )}
        </header>
    );
}
