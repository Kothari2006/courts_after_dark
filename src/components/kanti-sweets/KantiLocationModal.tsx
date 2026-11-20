"use client";

import React, { useState } from "react";
import { X, MapPin, Truck, Store, Check } from "lucide-react";
import { useKantiCart } from "./context/KantiCartContext";

const CITIES = [
  "Bengaluru",
  "Mysuru",
  "Hubballi",
  "Mangaluru",
  "Chennai",
  "Hyderabad",
  "Mumbai",
  "Delhi NCR",
];

export default function KantiLocationModal() {
  const {
    isLocationModalOpen,
    setIsLocationModalOpen,
    deliveryType,
    deliveryCity,
    setDeliveryLocation,
  } = useKantiCart();

  const [mode, setMode] = useState(deliveryType);
  const [city, setCity] = useState(deliveryCity);
  const [pincode, setPincode] = useState("");

  if (!isLocationModalOpen) return null;

  const handleSave = () => {
    setDeliveryLocation(mode, city);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs"
        onClick={() => setIsLocationModalOpen(false)}
      />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 z-10 text-gray-900 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-[#8400b8] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
              Choose Delivery Preference
            </h3>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 py-4">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setMode("Courier")}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                mode === "Courier"
                  ? "bg-white text-[#8400b8] shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Courier Delivery</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("Store Pickup")}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                mode === "Store Pickup"
                  ? "bg-white text-[#8400b8] shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Store Pickup</span>
            </button>
          </div>

          {/* Select City */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Select City
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCity(c)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors ${
                    city === c
                      ? "border-[#8400b8] bg-[#faf5ff] text-[#8400b8]"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span>{c}</span>
                  {city === c && <Check className="w-3.5 h-3.5 text-[#8400b8]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Enter Pincode */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Enter Delivery Pincode
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 560001"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#8400b8]"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#8400b8] hover:bg-[#72009e] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-purple-500/20"
          >
            Apply Location
          </button>
        </div>
      </div>
    </div>
  );
}

