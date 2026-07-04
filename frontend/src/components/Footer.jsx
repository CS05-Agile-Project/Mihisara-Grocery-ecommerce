import React from "react";
import { NavLink } from "react-router-dom";
import { FaFacebookF, FaTwitter, FaYoutube } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-800 mt-0 border-t border-gray-200 font-poppins">
      {/* Links */}
      <div className="container mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-3 gap-8">
        {/* Company Info */}
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

        {/* Quick Links */}
        <div>
          <h5 className="font-semibold mb-3 text-gray-900">Quick Links</h5>
          <ul className="space-y-2 text-sm">
            <li>
              <NavLink to="/" className="hover:text-emerald-600">Home</NavLink>
            </li>
            <li>
              <NavLink to="/category/All" className="hover:text-emerald-600">
                Shop
              </NavLink>
            </li>
            <li>
              <a href="/profile" className="hover:text-emerald-600">Profile</a>
            </li>
          </ul>
        </div>

        {/* Categories – link each category page */}
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

        {/* SPRINT 1 DEMO: FAQ, contact, about and policy links are temporarily hidden. */}
      </div>

      {/* Social + Payments */}
      <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between border-t border-gray-200">
        <div className="flex gap-4 mb-4 md:mb-0">
          {/* Facebook */}
          <a
            href="https://www.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-emerald-600"
          >
            <FaFacebookF />
          </a>

          {/* Twitter / X */}
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-emerald-600"
          >
            <FaTwitter />
          </a>

          {/* YouTube */}
          <a
            href="https://www.youtube.com"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-emerald-600"
          >
            <FaYoutube />
          </a>
        </div>

        <p className="text-xs text-gray-500">
          © 2025 Mihisara Grocery. All Rights Reserved
        </p>
        {/* SPRINT 1 DEMO: payment branding is temporarily hidden. */}
      </div>
    </footer>
  );
}
