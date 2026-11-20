import ProductDetailClient from "./ProductDetailClient";
import { SNACKS_PRODUCTS } from "@/components/kanti-sweets/data/snacksData";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = SNACKS_PRODUCTS.find((p) => p.slug === slug);

  if (!product) {
    return {
      title: "Snack Item | Kanti Sweets",
    };
  }

  return {
    title: `${product.name} | Buy Online at Kanti Sweets`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}

