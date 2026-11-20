import Navbar from "@/components/Navbar";
import { requireRole } from "@/lib/auth-utils";
import { getAdminBookingDetails } from "@/services/booking.service";
import { notFound } from "next/navigation";
import BookingDetailsClient, {
  BookingDetailsData,
  WaitlistItem,
} from "./BookingDetailsClient";

export const dynamic = "force-dynamic";

interface AdminBookingDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBookingDetailsPage({
  params,
}: AdminBookingDetailsPageProps) {
  await requireRole(["ADMIN"], "/admin/bookings");

  const { id } = await params;

  let details;
  try {
    details = await getAdminBookingDetails(id);
  } catch {
    notFound();
  }

  const initialBooking: BookingDetailsData = JSON.parse(
    JSON.stringify(details.booking)
  );
  const initialWaitlist: WaitlistItem[] = JSON.parse(
    JSON.stringify(details.waitlist)
  );

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookingDetailsClient
          initialBooking={initialBooking}
          initialWaitlist={initialWaitlist}
        />
      </main>
    </div>
  );
}

