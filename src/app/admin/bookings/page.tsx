import Navbar from "@/components/Navbar";
import { requireRole } from "@/lib/auth-utils";
import { getAdminBookings } from "@/services/booking.service";
import Facility, { IFacility } from "@/models/Facility";
import connectToDatabase from "@/lib/mongodb";
import AdminBookingsClient, {
  AdminBookingItem,
} from "./AdminBookingsClient";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  await requireRole(["ADMIN"], "/admin/bookings");
  await connectToDatabase();

  const [initialData, rawFacilities] = await Promise.all([
    getAdminBookings({
      page: 1,
      limit: 10,
      status: "ALL",
      sort: "startAt:desc",
    }),
    Facility.find({})
      .select("_id name sportType location")
      .sort({ name: 1 })
      .lean<IFacility[]>(),
  ]);

  // Clean serialization for client component
  const initialBookings: AdminBookingItem[] = JSON.parse(
    JSON.stringify(initialData.bookings)
  );
  const facilities = rawFacilities.map((f) => ({
    _id: f._id.toString(),
    name: f.name,
    sportType: f.sportType,
    location: f.location,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminBookingsClient
          initialBookings={initialBookings}
          initialPagination={initialData.pagination}
          initialStats={initialData.stats}
          facilities={facilities}
        />
      </main>
    </div>
  );
}
