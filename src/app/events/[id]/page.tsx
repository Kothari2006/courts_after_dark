import EventDetailClient from "./EventDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Event Details | Courts After Dark",
  description: "View tournament bracket, event rules, and registration details.",
};

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <EventDetailClient eventId={id} />;
}
