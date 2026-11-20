import Navbar from "@/components/Navbar";
import { requireRole } from "@/lib/auth-utils";
import connectToDatabase from "@/lib/mongodb";
import { getAdminReviews } from "@/services/review.service";
import AdminReviewsClient from "./AdminReviewsClient";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  await requireRole(["ADMIN"], "/admin/reviews");
  await connectToDatabase();

  const initialData = await getAdminReviews({
    page: 1,
    limit: 15,
    status: "ALL",
  });

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminReviewsClient initialData={JSON.parse(JSON.stringify(initialData))} />
      </main>
    </div>
  );
}

