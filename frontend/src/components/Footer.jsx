import React from "react";
import { NavLink } from "react-router-dom";
import { FaFacebookF, FaTwitter, FaYoutube } from "react-icons/fa";

export default function Footer() {
  const openFaq = () => {
    window.dispatchEvent(new Event("open-faq"));
  };

  return (
    <footer className="bg-gray-100 text-gray-800 mt-0 border-t border-gray-200 font-poppins">
      <div className="container mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2 md:col-span-1">
          <NavLink to="/">
            <img src="/logo123.png" alt="Mihisara Grocery" className="h-14 w-auto object-contain mb-4" />
          </NavLink>
          <p className="text-sm">
            Mihisara Grocery.<br />
            A2, Hikkaduwa, Sri Lanka.
          </p>
          <p className="mt-3 text-emerald-600 font-semibold">+94 717557972</p>
          <p className="text-xs text-gray-500">(8.00 a.m to 8.00 p.m daily)</p>
        </div>

        <div>
          <h5 className="font-semibold mb-3 text-gray-900">Useful Links</h5>
          <ul className="space-y-2 text-sm">
            <li>
              <NavLink to="/" className="hover:text-emerald-600">Home</NavLink>
            </li>
            <li>
              <NavLink to="/category/All" className="hover:text-emerald-600">Shop</NavLink>
            </li>
            <li>
              <NavLink to="/hot-deals" className="hover:text-emerald-600">Hot Deals</NavLink>
            </li>
            <li>
              <NavLink to="/profile" className="hover:text-emerald-600">Profile</NavLink>
            </li>
            <li>
              <NavLink to="/cart" className="hover:text-emerald-600">Cart</NavLink>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="font-semibold mb-3 text-gray-900">Categories</h5>
          <ul className="space-y-2 text-sm">
            <li><NavLink to="/category/Snacks" className="hover:text-emerald-600">Snacks</NavLink></li>
            <li><NavLink to="/category/Beverages" className="hover:text-emerald-600">Beverages</NavLink></li>
            <li><NavLink to="/category/Household-Needs" className="hover:text-emerald-600">Household</NavLink></li>
            <li><NavLink to="/category/Fresh-Vegetables" className="hover:text-emerald-600">Fresh Vegetables</NavLink></li>
            <li><NavLink to="/category/Fresh-Fruits" className="hover:text-emerald-600">Fresh Fruits</NavLink></li>
            <li><NavLink to="/category/Cooking-Essentials" className="hover:text-emerald-600">Cooking Essentials</NavLink></li>
            <li><NavLink to="/category/Bakery-&-Biscuits" className="hover:text-emerald-600">Bakery & Biscuits</NavLink></li>
          </ul>
        </div>

        <div>
          <h5 className="font-semibold mb-3 text-gray-900">Support</h5>
          <ul className="space-y-2 text-sm">
            <li>
              <NavLink to="/about" className="hover:text-emerald-600">About Us</NavLink>
            </li>
            <li>
              <NavLink to="/contact" className="hover:text-emerald-600">Contact Us</NavLink>
            </li>
            <li>
              <button type="button" onClick={openFaq} className="hover:text-emerald-600">
                FAQs
              </button>
            </li>
            <li>
              <NavLink to="/delivery-info" className="hover:text-emerald-600">Delivery Info</NavLink>
            </li>
            <li>
              <NavLink to="/returns" className="hover:text-emerald-600">Returns</NavLink>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="font-semibold mb-3 text-gray-900">Policies</h5>
          <ul className="space-y-2 text-sm">
            <li>
              <NavLink to="/terms" className="hover:text-emerald-600">Terms & Conditions</NavLink>
            </li>
            <li>
              <NavLink to="/privacy" className="hover:text-emerald-600">Privacy Policy</NavLink>
            </li>
          </ul>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between border-t border-gray-200">
        <div className="flex gap-4 mb-4 md:mb-0">
          <a
            href="https://www.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-emerald-600"
          >
            <FaFacebookF />
          </a>

          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-emerald-600"
          >
            <FaTwitter />
          </a>

          <a
            href="https://www.youtube.com"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-emerald-600"
          >
            <FaYoutube />
          </a>
        </div>

        <p className="text-xs text-gray-500">
          (c) 2025 Mihisara Grocery. All Rights Reserved
        </p>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <img src="/visa.png" alt="Visa" className="h-7 w-auto object-contain" />
          <img src="/master.png" alt="Mastercard" className="h-7 w-auto object-contain" />
        </div>
      </div>
    </footer>
  );
}
