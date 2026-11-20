import Navbar from "@/components/Navbar";
import { requireRole } from "@/lib/auth-utils";
import { getBookingsReport } from "@/services/report.service";
import Facility, { IFacility } from "@/models/Facility";
import connectToDatabase from "@/lib/mongodb";
import AdminReportsClient from "./AdminReportsClient";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requireRole(["ADMIN"], "/admin/reports");
  await connectToDatabase();

  const [initialBookingsReport, rawFacilities] = await Promise.all([
    getBookingsReport({
      period: "30d",
      format: "preview",
      page: 1,
      limit: 15,
    }),
    Facility.find({})
      .select("_id name sportType")
      .sort({ name: 1 })
      .lean<IFacility[]>(),
  ]);

  const facilities = rawFacilities.map((f) => ({
    _id: f._id.toString(),
    name: f.name,
    sportType: f.sportType,
  }));

  // Clean serialization for client component
  const initialBookingsData = JSON.parse(
    JSON.stringify(initialBookingsReport)
  );

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminReportsClient
          initialBookingsData={initialBookingsData}
          facilities={facilities}
        />
      </main>
    </div>
  );
}

