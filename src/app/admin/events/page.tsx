import Navbar from "@/components/Navbar";
import { requireRole } from "@/lib/auth-utils";
import { getEvents } from "@/services/event.service";
import Facility, { IFacility } from "@/models/Facility";
import Event from "@/models/Event";
import connectToDatabase from "@/lib/mongodb";
import AdminEventsClient from "./AdminEventsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sports Events & Tournament Management | Admin Portal",
  description: "Monitor and manage campus sports tournaments, events, and brackets.",
};

export default async function AdminEventsPage() {
  await requireRole(["ADMIN"], "/admin/events");
  await connectToDatabase();

  const [eventsResult, rawFacilities, metricsAgg] = await Promise.all([
    getEvents({ page: 1, limit: 10, status: "ALL" }),
    Facility.find({})
      .select("_id name sportType")
      .sort({ name: 1 })
      .lean<IFacility[]>(),
    Event.aggregate([
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          publishedEvents: {
            $sum: {
              $cond: [
                { $in: ["$status", ["PUBLISHED", "REGISTRATION_OPEN"]] },
                1,
                0,
              ],
            },
          },
          totalRegistrations: { $sum: "$registrationCount" },
          tournaments: {
            $sum: { $cond: [{ $eq: ["$eventType", "TOURNAMENT"] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const metrics = metricsAgg[0] || {
    totalEvents: 0,
    publishedEvents: 0,
    totalRegistrations: 0,
    tournaments: 0,
  };

  const facilities = rawFacilities.map((f) => ({
    _id: f._id.toString(),
    name: f.name,
    sportType: f.sportType,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminEventsClient
          initialEvents={JSON.parse(JSON.stringify(eventsResult.events))}
          initialPagination={{
            page: eventsResult.pagination.page,
            limit: eventsResult.pagination.limit,
            totalCount: eventsResult.pagination.total,
            totalPages: eventsResult.pagination.totalPages,
          }}
          initialMetrics={metrics}
          facilities={facilities}
        />
      </main>
    </div>
  );
}
