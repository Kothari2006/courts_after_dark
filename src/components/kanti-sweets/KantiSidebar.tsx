"use client";

import React, { useState } from "react";
import { SlidersHorizontal, ChevronDown, Check } from "lucide-react";
import { KANTI_CATEGORIES } from "./data/snacksData";

interface KantiSidebarProps {
  selectedCategory: string;
  onSelectCategory: (catSlug: string) => void;
  selectedSubCategory: string;
  onSelectSubCategory: (subCat: string) => void;
  inStockOnly: boolean;
  onToggleInStock: (val: boolean) => void;
  subCategoryOptions: string[];
}

export default function KantiSidebar({
  selectedCategory,
  onSelectCategory,
  selectedSubCategory,
  onSelectSubCategory,
  inStockOnly,
  onToggleInStock,
  subCategoryOptions,
}: KantiSidebarProps) {
  const [subCategoryOpen, setSubCategoryOpen] = useState(true);

  return (
    <aside className="w-full lg:w-60 shrink-0 space-y-6">
      {/* Filter Header Box */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
            Filter By:
          </span>
          <SlidersHorizontal className="w-4 h-4 text-gray-500" />
        </div>

        {/* Sub Category Accordion Header */}
        <button
          type="button"
          onClick={() => setSubCategoryOpen(!subCategoryOpen)}
          className="w-full pt-3 flex items-center justify-between text-xs font-bold text-gray-700 hover:text-[#8400b8] transition-colors"
        >
          <span>Sub Category</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              subCategoryOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Main Categories Vertical Pills (from Screenshot 1 & 2) */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-1">
          Explore Categories
        </div>
        {KANTI_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.slug;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.slug)}
              className={`w-full text-left px-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center justify-between shadow-xs ${
                isActive
                  ? "border-[#8400b8] bg-[#faf5ff] text-[#8400b8] ring-1 ring-[#8400b8]/20 font-bold"
                  : "border-gray-100 bg-white text-gray-700 hover:border-purple-200 hover:bg-purple-50/40"
              }`}
            >
              <span>{cat.name}</span>
              {isActive && (
                <span className="w-2 h-2 rounded-full bg-[#8400b8] shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-category Pills (when snacks is active) */}
      {subCategoryOpen && subCategoryOptions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-2.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8400b8]">
            Snack Types
          </div>
          <button
            type="button"
            onClick={() => onSelectSubCategory("ALL")}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
              selectedSubCategory === "ALL"
                ? "bg-[#8400b8] text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>All Snacks</span>
            {selectedSubCategory === "ALL" && <Check className="w-3.5 h-3.5" />}
          </button>
          {subCategoryOptions.map((sub) => {
            const isSubActive = selectedSubCategory === sub;
            return (
              <button
                key={sub}
                type="button"
                onClick={() => onSelectSubCategory(sub)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                  isSubActive
                    ? "bg-[#8400b8] text-white font-bold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>{sub}</span>
                {isSubActive && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      )}

      {/* In-Stock Filter Toggle */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex items-center justify-between">
        <label htmlFor="instock-filter" className="text-xs font-semibold text-gray-700 cursor-pointer">
          In Stock Only
        </label>
        <input
          id="instock-filter"
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => onToggleInStock(e.target.checked)}
          className="w-4 h-4 text-[#8400b8] rounded-md border-gray-300 focus:ring-[#8400b8] accent-[#8400b8] cursor-pointer"
        />
      </div>
    </aside>
  );
}

