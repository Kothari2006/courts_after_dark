import EventDetailClient from "./EventDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}

export const metadata = {
  title: "Event Details | Courts After Dark",
  description: "View tournament bracket, event rules, and registration details.",
};

export default async function EventDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const backHref = query.from === "teacher" ? "/teacher/events" : "/events";
  return <EventDetailClient eventId={id} backHref={backHref} />;
}
