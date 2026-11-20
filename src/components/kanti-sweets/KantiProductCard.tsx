"use client";

import React from "react";
import Link from "next/link";
import { ShoppingCart, Ban, Eye } from "lucide-react";
import { KantiProduct } from "./data/snacksData";
import { useKantiCart } from "./context/KantiCartContext";

interface KantiProductCardProps {
  product: KantiProduct;
}

export default function KantiProductCard({ product }: KantiProductCardProps) {
  const { addToCart, setActiveQuickViewProduct, cart, updateQuantity } = useKantiCart();

  const cartItem = cart.find(
    (item) => item.product.id === product.id && item.weight === product.weight
  );

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 hover:border-purple-200 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden relative">
      {/* Product Image Box */}
      <div className="relative w-full aspect-square bg-[#f8f9fa] overflow-hidden flex items-center justify-center p-3">
        {/* Quick View Button on Hover */}
        <button
          type="button"
          onClick={() => setActiveQuickViewProduct(product)}
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 text-gray-700 hover:text-[#8400b8] hover:bg-white shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Quick View"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Best seller ribbon if applicable */}
        {product.isBestSeller && (
          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
            Bestseller
          </span>
        )}

        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Product Details */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Title */}
          <button
            type="button"
            onClick={() => setActiveQuickViewProduct(product)}
            className="text-left w-full block"
          >
            <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 uppercase tracking-tight line-clamp-1 group-hover:text-[#8400b8] transition-colors">
              {product.name}
            </h3>
          </button>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-extrabold text-[#8400b8]">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          {/* Weight Pill (Solid Purple Pill from Screenshot 1 & 2) */}
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#8400b8] text-white text-[11px] font-bold shadow-xs">
              {product.weight}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          {product.inStock ? (
            cartItem ? (
              <div className="flex items-center justify-between bg-[#f3e8ff] border border-purple-200 rounded-xl px-2 py-1.5 text-xs font-bold text-[#8400b8]">
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(product.id, product.weight, cartItem.quantity - 1)
                  }
                  className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[#8400b8] hover:bg-purple-50 shadow-xs"
                >
                  -
                </button>
                <span className="px-2">{cartItem.quantity} in Cart</span>
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(product.id, product.weight, cartItem.quantity + 1)
                  }
                  className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[#8400b8] hover:bg-purple-50 shadow-xs"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => addToCart(product)}
                className="w-full py-2 px-3 rounded-xl bg-[#f3e8ff] hover:bg-[#ebd5ff] text-[#8400b8] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </button>
            )
          ) : (
            <button
              type="button"
              disabled
              className="w-full py-2 px-3 rounded-xl bg-gray-100 text-gray-400 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
            >
              <Ban className="w-3.5 h-3.5 text-gray-400" />
              <span>Out of Stock</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

