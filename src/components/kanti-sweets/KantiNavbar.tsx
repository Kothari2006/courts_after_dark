"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { KANTI_CATEGORIES, KantiCategory } from "./data/snacksData";

interface KantiNavbarProps {
  activeCategory?: string;
  onSelectCategory?: (categorySlug: string, subCategory?: string) => void;
}

export default function KantiNavbar({
  activeCategory = "snacks",
  onSelectCategory,
}: KantiNavbarProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const handleCategoryClick = (cat: KantiCategory, sub?: string) => {
    if (onSelectCategory) {
      onSelectCategory(cat.slug, sub);
    }
  };

  return (
    <nav className="bg-[#8400b8] text-white select-none relative z-30 shadow-md">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar py-0.5">
          {KANTI_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.slug;
            const isHovered = hoveredCategory === cat.id;

            return (
              <div
                key={cat.id}
                className="relative py-2.5 px-2.5 sm:px-3 whitespace-nowrap shrink-0"
                onMouseEnter={() => setHoveredCategory(cat.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <button
                  type="button"
                  onClick={() => handleCategoryClick(cat)}
                  className={`flex items-center gap-1 text-[13px] font-bold tracking-tight transition-all duration-150 relative ${
                    isActive
                      ? "text-white drop-shadow-xs"
                      : "text-purple-100 hover:text-white"
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat.hasDropdown && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isHovered ? "rotate-180" : ""
                      }`}
                    />
                  )}
                  {isActive && (
                    <span className="absolute -bottom-2.5 left-0 right-0 h-[3px] bg-white rounded-t-full shadow-xs" />
                  )}
                </button>

                {/* Subcategory Dropdown Menu */}
                {cat.subCategories && cat.subCategories.length > 0 && isHovered && (
                  <div className="absolute top-full left-0 min-w-[220px] bg-white text-gray-800 rounded-b-xl rounded-tr-xl shadow-xl border border-gray-100 py-2.5 z-50 animate-in fade-in-80 slide-in-from-top-1 duration-150">
                    <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#8400b8] border-b border-gray-100 mb-1">
                      {cat.name} Varieties
                    </div>
                    {cat.subCategories.map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => handleCategoryClick(cat, sub)}
                        className="w-full text-left px-3.5 py-1.5 text-xs text-gray-700 hover:bg-purple-50 hover:text-[#8400b8] font-medium transition-colors flex items-center justify-between group"
                      >
                        <span>{sub}</span>
                        <span className="text-[10px] text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          →
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

