import type { Metadata } from "next";
import SessionProvider from "@/components/providers/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Courts After Dark | Sports Facility & Booking Platform",
  description:
    "Discover sports facilities, check available time slots, book courts and request sports equipment.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="theme-student h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before first paint so there is no light flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("cad-theme")==="dark")document.documentElement.classList.add("dark-mode")}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-black">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
