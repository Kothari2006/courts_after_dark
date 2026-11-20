"use client";

import React, { useState } from "react";
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Tag } from "lucide-react";
import { useKantiCart } from "./context/KantiCartContext";

export default function KantiCartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    cartCount,
    clearCart,
  } = useKantiCart();

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");

  if (!isCartOpen) return null;

  const freeDeliveryThreshold = 500;
  const deliveryFee = cartSubtotal >= freeDeliveryThreshold || cartSubtotal === 0 ? 0 : 49;
  const finalTotal = Math.max(0, cartSubtotal - discount + deliveryFee);
  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - cartSubtotal);

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === "SWEETS10" || couponCode.toUpperCase() === "KANTI10") {
      setDiscount(Math.round(cartSubtotal * 0.1));
      setCouponMsg("10% Kanti Sweets discount applied!");
    } else {
      setCouponMsg("Invalid coupon code. Try 'KANTI10'.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col text-gray-900 animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#8400b8]" />
              <h2 className="text-base font-extrabold text-gray-900 tracking-tight">
                My Cart ({cartCount})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-[#faf5ff] p-3.5 border-b border-purple-100 text-xs">
            {remainingForFreeDelivery > 0 ? (
              <div>
                <p className="text-gray-700">
                  Add <span className="font-bold text-[#8400b8]">₹{remainingForFreeDelivery}</span> more for <span className="font-bold text-emerald-700">Free Courier Delivery</span>!
                </p>
                <div className="w-full h-1.5 bg-purple-200 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-[#8400b8] transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (cartSubtotal / freeDeliveryThreshold) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="font-bold text-emerald-700 flex items-center gap-1.5">
                <span>🎉</span> You have unlocked FREE Express Delivery!
              </p>
            )}
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 divide-y divide-gray-100">
            {cart.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-purple-50 text-[#8400b8] flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">Your cart is empty</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    Explore delicious Benne Bakewadi, Methi Khari, and artisanal snacks fresh from Bengaluru!
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-[#8400b8] hover:bg-[#72009e] text-white text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Shop Snacks
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={`${item.product.id}-${item.weight}`} className="pt-4 first:pt-0 flex gap-3.5 items-start">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-xl border border-gray-100 shrink-0 bg-gray-50"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 truncate uppercase">
                      {item.product.name}
                    </h4>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Pack: <span className="font-semibold text-purple-700">{item.weight}</span>
                    </div>
                    <div className="text-xs font-extrabold text-[#8400b8] mt-1">
                      ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                    </div>
                  </div>

                  {/* Quantity Actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => removeFromCart(item.product.id, item.weight)}
                      className="text-gray-400 hover:text-rose-500 p-1"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center border border-gray-200 rounded-lg text-xs bg-gray-50">
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.weight, item.quantity - 1)
                        }
                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-l-md font-bold"
                      >
                        -
                      </button>
                      <span className="w-7 text-center font-bold text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.weight, item.quantity + 1)
                        }
                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-r-md font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-[#fafafa] space-y-4">
              {/* Coupon Row */}
              <div className="space-y-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Coupon (e.g. KANTI10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#8400b8] uppercase font-semibold"
                    />
                  </div>
                  <button
                    onClick={applyCoupon}
                    className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {couponMsg && (
                  <p className={`text-[10px] ${discount > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                    {couponMsg}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="text-xs space-y-1.5 text-gray-600 border-t border-gray-200/60 pt-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{cartSubtotal.toLocaleString("en-IN")}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount (10%)</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Courier Delivery</span>
                  <span className={deliveryFee === 0 ? "text-emerald-600 font-bold" : "font-semibold text-gray-900"}>
                    {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-gray-950 pt-2 border-t border-gray-200">
                  <span>Total Payable</span>
                  <span className="text-[#8400b8] text-base">₹{finalTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  alert(`Thank you for placing order of ₹${finalTotal}! Your Kanti Sweets treats are on their way.`);
                  clearCart();
                  setIsCartOpen(false);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#8400b8] hover:bg-[#72009e] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition-all active:scale-98"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Authentic Kanti Sweets · Freshness Guaranteed</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

