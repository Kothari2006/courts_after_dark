"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Store,
  PhoneCall,
  BookOpen,
  User,
  ShoppingBag,
  ChevronDown,
} from "lucide-react";
import { useKantiCart } from "./context/KantiCartContext";

interface KantiHeaderProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export default function KantiHeader({ onSearch, searchQuery = "" }: KantiHeaderProps) {
  const {
    cartCount,
    setIsCartOpen,
    deliveryType,
    deliveryCity,
    setIsLocationModalOpen,
  } = useKantiCart();

  const [inputVal, setInputVal] = useState(searchQuery);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40 transition-shadow">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Delivery Pill */}
        <div className="flex items-center gap-4 lg:gap-6 shrink-0">
          <Link href="/category/snacks" className="flex items-center gap-2 group">
            {/* Logo Emblem */}
            <div className="w-11 h-11 rounded-full bg-purple-100/80 border border-purple-200 flex items-center justify-center text-purple-700 shadow-sm shrink-0">
              <span className="font-serif font-black text-2xl tracking-tighter text-[#8400b8]">
                K
              </span>
            </div>
            {/* Typography */}
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-black text-[#8400b8] tracking-tight leading-none group-hover:opacity-90 transition-opacity">
                Kanti Sweets
              </span>
              <span className="text-[10px] text-gray-500 font-sans tracking-tight mt-0.5 whitespace-nowrap">
                Spreading sweetness among people... Since 1957
              </span>
            </div>
          </Link>

          {/* Delivery Mode Pill */}
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#faf5ff] border border-purple-200/80 text-left hover:bg-purple-50 transition-colors shadow-xs"
          >
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-[#8400b8] shrink-0">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="text-left leading-tight">
              <div className="text-[10px] text-gray-500 font-medium">Delivering through</div>
              <div className="text-xs font-bold text-[#8400b8] flex items-center gap-1">
                <span>{deliveryType} ({deliveryCity})</span>
                <ChevronDown className="w-3 h-3 text-[#8400b8]" />
              </div>
            </div>
          </button>
        </div>

        {/* Center: Search Box */}
        <div className="flex-1 max-w-lg mx-2 lg:mx-4">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search for a products..."
              value={inputVal}
              onChange={handleInputChange}
              className="w-full pl-11 pr-10 py-2.5 rounded-full border border-gray-200 bg-white text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#8400b8] focus:ring-1 focus:ring-[#8400b8]/30 shadow-xs transition-all"
            />
            <button
              type="button"
              className="absolute right-3.5 text-gray-400 hover:text-gray-600"
              title="Filter by category"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Utility Links */}
        <div className="flex items-center gap-3 sm:gap-5 lg:gap-6 shrink-0">
          <Link
            href="/category/snacks"
            className="hidden md:flex flex-col items-center gap-1 text-gray-600 hover:text-[#8400b8] transition-colors group"
          >
            <Store className="w-4 h-4 text-gray-600 group-hover:text-[#8400b8]" />
            <span className="text-[10px] font-medium tracking-tight">Stores</span>
          </Link>

          <Link
            href="/category/snacks"
            className="hidden md:flex flex-col items-center gap-1 text-gray-600 hover:text-[#8400b8] transition-colors group"
          >
            <PhoneCall className="w-4 h-4 text-gray-600 group-hover:text-[#8400b8]" />
            <span className="text-[10px] font-medium tracking-tight">Contact</span>
          </Link>

          <Link
            href="/category/snacks"
            className="hidden lg:flex flex-col items-center gap-1 text-gray-600 hover:text-[#8400b8] transition-colors group"
          >
            <BookOpen className="w-4 h-4 text-gray-600 group-hover:text-[#8400b8]" />
            <span className="text-[10px] font-medium tracking-tight">Catalog</span>
          </Link>

          <Link
            href="/category/snacks"
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-[#8400b8] transition-colors group"
          >
            <User className="w-4 h-4 text-gray-600 group-hover:text-[#8400b8]" />
            <span className="text-[10px] font-medium tracking-tight">Profile</span>
          </Link>

          {/* Cart Icon & Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-[#8400b8] transition-colors relative group pl-1"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-gray-700 group-hover:text-[#8400b8]" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-[#8400b8] text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium tracking-tight">Cart</span>
          </button>
        </div>
      </div>
    </header>
  );
}

