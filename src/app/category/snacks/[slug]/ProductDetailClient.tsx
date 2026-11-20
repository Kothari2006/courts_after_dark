"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  KantiCartProvider,
  useKantiCart,
} from "@/components/kanti-sweets/context/KantiCartContext";
import KantiHeader from "@/components/kanti-sweets/KantiHeader";
import KantiNavbar from "@/components/kanti-sweets/KantiNavbar";
import KantiFooter from "@/components/kanti-sweets/KantiFooter";
import KantiCartDrawer from "@/components/kanti-sweets/KantiCartDrawer";
import KantiLocationModal from "@/components/kanti-sweets/KantiLocationModal";
import KantiProductDetail from "@/components/kanti-sweets/KantiProductDetail";
import { SNACKS_PRODUCTS, KantiProduct } from "@/components/kanti-sweets/data/snacksData";
import { ArrowLeft, ShieldAlert } from "lucide-react";

interface ProductDetailClientProps {
  slug: string;
}

function DetailContent({ slug }: ProductDetailClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const product = SNACKS_PRODUCTS.find((p) => p.slug === slug) || SNACKS_PRODUCTS[0];

  if (!product) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex flex-col">
        <KantiHeader />
        <KantiNavbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-bold">Product Not Found</h2>
          <p className="text-sm text-gray-500">
            The requested snack item is currently unavailable or has moved.
          </p>
          <Link
            href="/category/snacks"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8400b8] text-white font-bold text-xs uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Snacks
          </Link>
        </main>
        <KantiFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-purple-100 selection:text-purple-900">
      <KantiHeader onSearch={setSearchQuery} searchQuery={searchQuery} />
      <KantiNavbar activeCategory="snacks" />

      <main className="flex-1">
        <KantiProductDetail product={product} />
      </main>

      <KantiFooter />
      <KantiCartDrawer />
      <KantiLocationModal />
    </div>
  );
}

export default function ProductDetailClient({ slug }: ProductDetailClientProps) {
  return (
    <KantiCartProvider>
      <DetailContent slug={slug} />
    </KantiCartProvider>
  );
}

