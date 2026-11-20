"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, Clock, ShoppingCart, Zap, ExternalLink } from "lucide-react";
import { useKantiCart } from "./context/KantiCartContext";

export default function KantiQuickViewModal() {
  const { activeQuickViewProduct, setActiveQuickViewProduct, addToCart, setIsCartOpen } =
    useKantiCart();

  const [selectedWeight, setSelectedWeight] = useState(
    activeQuickViewProduct?.weight || "1Pc"
  );

  if (!activeQuickViewProduct) return null;

  const product = activeQuickViewProduct;

  const handleAddToCart = () => {
    addToCart(product, selectedWeight, 1);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedWeight, 1);
    setActiveQuickViewProduct(null);
    setIsCartOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs"
        onClick={() => setActiveQuickViewProduct(null)}
      />

      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10 text-gray-900 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => setActiveQuickViewProduct(null)}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-900 shadow-xs transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
          {/* Product Image */}
          <div className="aspect-square w-full rounded-2xl bg-[#f8f9fa] border border-gray-100 p-4 flex items-center justify-center overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <div className="inline-block px-2 py-0.5 rounded-md bg-purple-100 text-[#8400b8] text-[10px] font-bold uppercase tracking-wider mb-2">
                {product.subCategory}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-950 uppercase tracking-tight">
                {product.name}
              </h3>
            </div>

            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-black text-[#8400b8]">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-gray-400 line-through">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{product.shelfLife}</span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
              {product.description}
            </p>

            {/* Weight Options */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Pack Size:
              </label>
              <div className="flex flex-wrap gap-2">
                {product.availableWeights.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setSelectedWeight(w)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      selectedWeight === w
                        ? "border-[#8400b8] bg-[#faf5ff] text-[#8400b8] ring-1 ring-[#8400b8]"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-3">
              <button
                type="button"
                disabled={!product.inStock}
                onClick={handleAddToCart}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#f3e8ff] hover:bg-[#ebd5ff] text-[#8400b8] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{product.inStock ? "Add to Cart" : "Out of Stock"}</span>
              </button>
              <button
                type="button"
                disabled={!product.inStock}
                onClick={handleBuyNow}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#8400b8] hover:bg-[#72009e] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-500/20 disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Buy Now</span>
              </button>
            </div>

            <div className="pt-2 text-center">
              <Link
                href={`/category/snacks/${product.slug}`}
                onClick={() => setActiveQuickViewProduct(null)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#8400b8] hover:underline"
              >
                <span>View Full Product Details & Ingredients</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

