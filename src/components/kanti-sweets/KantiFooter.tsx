"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin,
  Mail,
  Phone,
  Clock,
  Heart,
} from "lucide-react";

export default function KantiFooter() {
  return (
    <footer className="bg-white border-t border-gray-100 text-gray-800">
      {/* Decorative Sweets Banner Strip (Screenshot 4) */}
      <div className="w-full bg-gradient-to-r from-purple-900 via-[#8400b8] to-pink-900 h-28 sm:h-36 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="text-center z-10 px-4">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-purple-200">
            Handcrafted with Pure Ghee & Heritage Recipes
          </span>
          <h2 className="text-xl sm:text-3xl font-serif font-black text-white tracking-tight mt-1">
            Spreading Sweetness Across Generations Since 1957
          </h2>
        </div>
      </div>

      {/* "We Are Also Available On" Section (Screenshot 4) */}
      <div className="py-8 border-b border-gray-100 text-center space-y-4 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
          We Are Also Available On
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
          {/* Swiggy Logo */}
          <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-[#fc8019] flex items-center justify-center text-white font-bold text-xs">
              S
            </div>
            <span className="font-extrabold text-sm sm:text-base tracking-wider text-[#fc8019]">
              SWIGGY
            </span>
          </div>

          {/* Zomato Logo */}
          <div className="flex items-center gap-1.5 grayscale hover:grayscale-0 transition-all cursor-pointer">
            <span className="font-black italic text-lg sm:text-2xl text-[#cb202d] tracking-tighter">
              zomato
            </span>
          </div>

          {/* Ownly Logo */}
          <div className="flex items-center gap-1.5 grayscale hover:grayscale-0 transition-all cursor-pointer">
            <div className="w-6 h-6 rounded-md bg-[#e91e63] flex items-center justify-center text-white font-bold text-xs">
              ♡
            </div>
            <span className="font-bold text-sm sm:text-base text-[#e91e63] tracking-tight">
              ownly
            </span>
          </div>
        </div>
      </div>

      {/* 4-Column Navigation Links (Screenshot 4) */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Shop Now */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-900">
              Shop Now
            </h4>
            <ul className="space-y-2 text-xs text-gray-600 font-medium">
              {[
                "Sweets",
                "Namkeens",
                "Snacks",
                "Bakery & Boulangerie",
                "Chocolates",
                "Gifting",
                "Candles",
                "Fragrances",
                "Ice creams",
                "Tea",
                "Ganesha Festival",
              ].map((item) => (
                <li key={item}>
                  <Link
                    href="/category/snacks"
                    className="hover:text-[#8400b8] transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-900">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-gray-600 font-medium">
              {[
                "Stores",
                "FAQs",
                "Blogs",
                "Contact",
                "Statutory Compliance",
                "CSR Activities",
                "Feedback",
              ].map((item) => (
                <li key={item}>
                  <Link
                    href="/category/snacks"
                    className="hover:text-[#8400b8] transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-900">
              Legal
            </h4>
            <ul className="space-y-2 text-xs text-gray-600 font-medium">
              {[
                "Terms & Conditions",
                "Returns & Exchange",
                "Privacy Policy",
              ].map((item) => (
                <li key={item}>
                  <Link
                    href="/category/snacks"
                    className="hover:text-[#8400b8] transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Customer Care (Screenshot 4) */}
          <div className="space-y-4">
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-900">
              Customer Care
            </h4>
            <div className="space-y-2 text-xs text-gray-600">
              <p className="flex items-center gap-2 hover:text-[#8400b8] cursor-pointer">
                <Mail className="w-3.5 h-3.5 text-[#8400b8]" />
                <span>contact@kantisweets.com</span>
              </p>
              <p className="flex items-center gap-2 hover:text-[#8400b8] cursor-pointer">
                <Phone className="w-3.5 h-3.5 text-[#8400b8]" />
                <span>080 22960638 / 639</span>
              </p>
              <p className="flex items-center gap-2 text-gray-500">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>(Timings: 09:30 AM - 06:30 PM)</span>
              </p>
            </div>

            <div className="pt-2">
              <span className="text-xs font-bold text-gray-900 block mb-2">
                Follow Us On:
              </span>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.instagram.com/kantisweet/"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center hover:bg-pink-100 transition-colors"
                  title="Instagram"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/kantisweets"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                  title="Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.667 5H18V0h-3.808C10.596 0 9 1.583 9 4.615V8z"/>
                  </svg>
                </a>
                <a
                  href="https://www.youtube.com/channel/UCwdK2eF--2GpK18ImTpcOIw"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors"
                  title="YouTube"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* "We Serve In" Cities Strip (Screenshot 4) */}
      <div className="border-t border-gray-100 bg-[#fafafa] py-6 text-xs text-gray-500">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="font-bold text-gray-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#8400b8]" />
              We Serve In:
            </span>
            {[
              "Bengaluru",
              "Mysuru",
              "Hubballi",
              "Belagavi",
              "Mangaluru",
              "Chennai",
              "Hyderabad",
              "Mumbai",
              "Delhi NCR",
              "Pune",
              "Kolkata",
            ].map((city) => (
              <span
                key={city}
                className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600 text-[11px]"
              >
                {city}
              </span>
            ))}
          </div>

          <div className="text-[11px] text-gray-400">
            © 2026 Kanti Sweets Pvt Ltd. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
