import { requireRole } from "@/lib/auth-utils";
import connectToDatabase from "@/lib/mongodb";
import Facility, { IFacility } from "@/models/Facility";
import Equipment, { IEquipment } from "@/models/Equipment";
import { DEMO_FACILITIES } from "@/lib/data/demo-facilities";
import TeacherDashboardClient from "./TeacherDashboardClient";

export default async function TeacherDashboardPage() {
  const user = await requireRole(["TEACHER", "ADMIN"]);

  await connectToDatabase();

  const [facilities, equipment] = await Promise.all([
    Facility.find({ status: "ACTIVE" })
      .select("_id name sportType location operatingHours slotDuration")
      .lean<IFacility[]>(),
    Equipment.find()
      .select("_id name category status")
      .lean<IEquipment[]>(),
  ]);
  const facilityOptions = facilities.length
    ? facilities
    : DEMO_FACILITIES.filter((facility) => facility.status === "ACTIVE").map((facility) => ({
        ...facility,
        _id: facility.id,
      }));

  return (
    <TeacherDashboardClient
      teacher={{
        id: user.id,
        name: user.name || "Faculty Member",
        email: user.email || "",
        role: user.role,
      }}
      initialFacilities={JSON.parse(JSON.stringify(facilityOptions))}
      initialEquipment={JSON.parse(JSON.stringify(equipment))}
    />
  );
}

