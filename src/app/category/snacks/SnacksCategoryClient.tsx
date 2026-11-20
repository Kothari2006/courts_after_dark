"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  KantiCartProvider,
  useKantiCart,
} from "@/components/kanti-sweets/context/KantiCartContext";
import KantiHeader from "@/components/kanti-sweets/KantiHeader";
import KantiNavbar from "@/components/kanti-sweets/KantiNavbar";
import KantiSidebar from "@/components/kanti-sweets/KantiSidebar";
import KantiProductCard from "@/components/kanti-sweets/KantiProductCard";
import KantiFooter from "@/components/kanti-sweets/KantiFooter";
import KantiCartDrawer from "@/components/kanti-sweets/KantiCartDrawer";
import KantiLocationModal from "@/components/kanti-sweets/KantiLocationModal";
import KantiQuickViewModal from "@/components/kanti-sweets/KantiQuickViewModal";
import { SNACKS_PRODUCTS } from "@/components/kanti-sweets/data/snacksData";
import { Sparkles, UtensilsCrossed } from "lucide-react";

function SnacksContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("snacks");
  const [selectedSubCategory, setSelectedSubCategory] = useState("ALL");
  const [inStockOnly, setInStockOnly] = useState(false);

  const subCategoryOptions = useMemo(() => {
    return Array.from(new Set(SNACKS_PRODUCTS.map((p) => p.subCategory)));
  }, []);

  const filteredProducts = useMemo(() => {
    return SNACKS_PRODUCTS.filter((prod) => {
      // Sub category filter
      if (selectedSubCategory !== "ALL" && prod.subCategory !== selectedSubCategory) {
        return false;
      }
      // In stock filter
      if (inStockOnly && !prod.inStock) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = prod.name.toLowerCase().includes(q);
        const matchesDesc = prod.description.toLowerCase().includes(q);
        const matchesSub = prod.subCategory.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesSub) return false;
      }
      return true;
    });
  }, [searchQuery, selectedSubCategory, inStockOnly]);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-purple-100 selection:text-purple-900">
      {/* Top Brand Header */}
      <KantiHeader onSearch={setSearchQuery} searchQuery={searchQuery} />

      {/* Main Purple Category Navigation */}
      <KantiNavbar
        activeCategory={selectedCategory}
        onSelectCategory={(slug, sub) => {
          setSelectedCategory(slug);
          if (sub) {
            setSelectedSubCategory(sub);
          } else {
            setSelectedSubCategory("ALL");
          }
        }}
      />

      {/* Main Page Body */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Breadcrumb (Screenshot 1) */}
        <nav className="text-xs text-gray-500 flex items-center gap-2">
          <Link href="/category/snacks" className="hover:text-[#8400b8] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-800 capitalize">
            {selectedCategory}
          </span>
          {selectedSubCategory !== "ALL" && (
            <>
              <span>/</span>
              <span className="text-[#8400b8] font-bold">
                {selectedSubCategory}
              </span>
            </>
          )}
        </nav>

        {/* Page Title: "Snacks" (Screenshot 1) */}
        <div className="text-center py-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
            {selectedSubCategory !== "ALL" ? selectedSubCategory : "Snacks"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-lg mx-auto">
            Crisp, buttery, and full of flavor. Enjoy freshly made Benne specials, authentic savories, and wholesome roasted bites.
          </p>
        </div>

        {/* Layout: Sidebar + Product Grid */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start pt-2">
          {/* Left Sidebar Filter (Screenshots 1 & 2) */}
          <KantiSidebar
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setSelectedSubCategory("ALL");
            }}
            selectedSubCategory={selectedSubCategory}
            onSelectSubCategory={setSelectedSubCategory}
            inStockOnly={inStockOnly}
            onToggleInStock={setInStockOnly}
            subCategoryOptions={subCategoryOptions}
          />

          {/* Right Product Grid Area */}
          <div className="flex-1 w-full space-y-4">
            {/* Top Toolbar / Counts */}
            <div className="flex items-center justify-between text-xs text-gray-500 pb-2 border-b border-gray-100">
              <span className="font-medium">
                Showing <strong className="text-gray-900">{filteredProducts.length}</strong> items
              </span>
              {selectedSubCategory !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedSubCategory("ALL")}
                  className="text-xs font-bold text-[#8400b8] hover:underline"
                >
                  Clear filter ({selectedSubCategory})
                </button>
              )}
            </div>

            {/* Product Grid (Screenshots 1 & 2) */}
            {filteredProducts.length === 0 ? (
              <div className="p-16 rounded-3xl bg-gray-50 border border-gray-100 text-center space-y-3">
                <UtensilsCrossed className="w-12 h-12 text-gray-400 mx-auto" />
                <h3 className="text-base font-bold text-gray-800">
                  No snacks found
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  We couldn't find any snacks matching your filter. Try clearing filters or searching for something else.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubCategory("ALL");
                    setInStockOnly(false);
                    setSearchQuery("");
                  }}
                  className="px-4 py-2 rounded-xl bg-[#8400b8] text-white text-xs font-bold uppercase tracking-wider"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map((prod) => (
                  <KantiProductCard key={prod.id} product={prod} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <KantiFooter />

      {/* Global Modals & Drawers */}
      <KantiCartDrawer />
      <KantiLocationModal />
      <KantiQuickViewModal />
    </div>
  );
}

export default function SnacksCategoryClient() {
  return (
    <KantiCartProvider>
      <SnacksContent />
    </KantiCartProvider>
  );
}

