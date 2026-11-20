"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  ShoppingCart,
  Zap,
  ChevronDown,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";
import { KantiProduct, SNACKS_PRODUCTS } from "./data/snacksData";
import { useKantiCart } from "./context/KantiCartContext";
import KantiProductCard from "./KantiProductCard";

interface KantiProductDetailProps {
  product: KantiProduct;
}

export default function KantiProductDetail({ product }: KantiProductDetailProps) {
  const { addToCart, setIsCartOpen } = useKantiCart();

  const [selectedWeight, setSelectedWeight] = useState(product.weight);
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);

  // Accordion open states
  const [openAccordion, setOpenAccordion] = useState<string | null>("ingredients");

  const toggleAccordion = (name: string) => {
    setOpenAccordion(openAccordion === name ? null : name);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedWeight, 1);
    setIsCartOpen(true);
  };

  const relatedProducts = SNACKS_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 5);

  const images = product.galleryImages.length > 0 ? product.galleryImages : [product.image];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12 bg-white text-gray-900">
      {/* Breadcrumb (Screenshot 3) */}
      <nav className="text-xs text-gray-500 flex items-center gap-2">
        <Link href="/category/snacks" className="hover:text-[#8400b8] transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/category/snacks" className="hover:text-[#8400b8] transition-colors">
          {product.category}
        </Link>
        <span>/</span>
        <span className="font-semibold text-gray-800">{product.name}</span>
      </nav>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image Gallery (Screenshot 3) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square w-full rounded-3xl bg-[#f8f9fa] border border-gray-100 p-6 flex items-center justify-center overflow-hidden shadow-xs">
            <img
              src={images[selectedImgIdx] || product.image}
              alt={product.name}
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>

          {/* Carousel Dots / Thumbnails */}
          <div className="flex items-center justify-center gap-3">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedImgIdx(i)}
                className={`w-3.5 h-3.5 rounded-full transition-all ${
                  selectedImgIdx === i
                    ? "bg-[#8400b8] scale-125"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`View image ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Product Information (Screenshot 3) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Title and Subtitle */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 uppercase tracking-tight">
              {product.name}
            </h1>
            <p className="text-xs font-bold text-[#8400b8] uppercase tracking-wider mt-1">
              {product.name}
            </p>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-[#8400b8]">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.originalPrice && (
              <span className="text-base text-gray-400 line-through">
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          {/* Shelf Life Badge (Screenshot 3) */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{product.shelfLife}</span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed">
            {product.description}
          </p>

          {/* Weight Selection (Screenshot 3) */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Weight:
            </label>
            <div className="flex flex-wrap gap-2.5">
              {product.availableWeights.map((w) => {
                const isSelected = selectedWeight === w;
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setSelectedWeight(w)}
                    className={`px-4 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      isSelected
                        ? "border-[#8400b8] bg-[#faf5ff] text-[#8400b8] ring-1 ring-[#8400b8]"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? "bg-[#8400b8]" : "bg-gray-300"
                      }`}
                    />
                    <span>{w}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons (Screenshot 3) */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              disabled={!product.inStock}
              onClick={() => addToCart(product, selectedWeight, 1)}
              className="flex-1 py-3 px-6 rounded-2xl bg-[#f3e8ff] hover:bg-[#ebd5ff] text-[#8400b8] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{product.inStock ? "Add to Cart" : "Out of Stock"}</span>
            </button>

            <button
              type="button"
              disabled={!product.inStock}
              onClick={handleBuyNow}
              className="flex-1 py-3 px-6 rounded-2xl bg-[#8400b8] hover:bg-[#72009e] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-500/20 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4" />
              <span>Buy Now</span>
            </button>
          </div>

          {/* Accordions (Screenshot 3) */}
          <div className="border-t border-gray-100 pt-6 space-y-2">
            {/* Ingredients */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion("ingredients")}
                className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                <span>Ingredients</span>
                <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-[#8400b8]">
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      openAccordion === "ingredients" ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
              {openAccordion === "ingredients" && (
                <div className="p-4 pt-0 text-xs text-gray-600 leading-relaxed border-t border-gray-50">
                  {product.ingredients}
                </div>
              )}
            </div>

            {/* Allergen Information */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion("allergen")}
                className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                <span>Allergen Information</span>
                <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-[#8400b8]">
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      openAccordion === "allergen" ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
              {openAccordion === "allergen" && (
                <div className="p-4 pt-0 text-xs text-gray-600 leading-relaxed border-t border-gray-50">
                  {product.allergenInfo}
                </div>
              )}
            </div>

            {/* Dietary Information */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion("dietary")}
                className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                <span>Dietary Information</span>
                <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-[#8400b8]">
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      openAccordion === "dietary" ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
              {openAccordion === "dietary" && (
                <div className="p-4 pt-0 text-xs text-gray-600 leading-relaxed border-t border-gray-50">
                  {product.dietaryInfo}
                </div>
              )}
            </div>

            {/* Shipping & Delivery */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion("shipping")}
                className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                <span>Shipping & Delivery</span>
                <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-[#8400b8]">
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      openAccordion === "shipping" ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
              {openAccordion === "shipping" && (
                <div className="p-4 pt-0 text-xs text-gray-600 leading-relaxed border-t border-gray-50">
                  {product.shippingInfo}
                </div>
              )}
            </div>

            {/* Return & Refund */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion("returns")}
                className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                <span>Return & Refund</span>
                <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-[#8400b8]">
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      openAccordion === "returns" ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
              {openAccordion === "returns" && (
                <div className="p-4 pt-0 text-xs text-gray-600 leading-relaxed border-t border-gray-50">
                  {product.returnPolicy}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* "You might also like these" Section (Screenshot 3) */}
      <div className="pt-8 border-t border-gray-100 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            You might also like these
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-8 h-8 rounded-full border border-purple-200 text-[#8400b8] hover:bg-purple-50 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-[#8400b8] text-white hover:bg-[#72009e] flex items-center justify-center transition-colors shadow-xs"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {relatedProducts.map((rel) => (
            <KantiProductCard key={rel.id} product={rel} />
          ))}
        </div>
      </div>
    </div>
  );
}

