import { requireRole } from "@/lib/auth-utils";
import connectToDatabase from "@/lib/mongodb";
import Facility, { IFacility } from "@/models/Facility";
import TeacherEventsClient from "./TeacherEventsClient";

export const metadata = {
  title: "Sports Events & Tournament Management | Teacher Portal",
  description: "Organize tournaments, track attendance, and manage tournament brackets.",
};

export default async function TeacherEventsPage() {
  const user = await requireRole(["TEACHER", "ADMIN"]);

  await connectToDatabase();

  const facilities = await Facility.find({ status: "ACTIVE" })
    .select("_id name sportType location")
    .lean<IFacility[]>();

  return (
    <TeacherEventsClient
      teacher={{
        id: user.id,
        name: user.name || "Faculty Member",
        email: user.email || "",
        role: user.role,
      }}
      facilities={JSON.parse(JSON.stringify(facilities))}
    />
  );
}
