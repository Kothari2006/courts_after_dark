import Navbar from "@/components/Navbar";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-utils";

export default async function HomePage() {
  const user = await getCurrentUser();

  const getDashboardHref = () => {
    if (!user) return "/login";
    if (user.role === "ADMIN") return "/admin/dashboard";
    if (user.role === "EQUIPMENT_MANAGER") return "/equipment-manager/dashboard";
    return "/dashboard";
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-black">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 text-center relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Night-time campus sports facility & equipment booking
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight sm:leading-none mb-6">
            Own the Night.{" "}
            <span className="bg-gradient-to-r from-lime-300 via-lime-400 to-emerald-500 bg-clip-text text-transparent">
              Play Any Hour.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 mb-10 max-w-2xl mx-auto">
            Discover badminton courts, basketball arenas, floodlit turf grounds, and reserve tournament-grade equipment with instantaneous campus authorization.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link
                href={getDashboardHref()}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                Go to Your Dashboard
                <span>→</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2"
                >
                  Create Account (Student & Faculty)
                  <span>→</span>
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-all"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features preview */}
        <div className="relative z-10 max-w-5xl mx-auto mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 backdrop-blur">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-bold text-white text-base">Real-time Slot Discovery</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Check live court occupancy, prime-time hours, and reserve slots with instantaneous confirmation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 backdrop-blur">
            <div className="text-2xl mb-2">🏸</div>
            <h3 className="font-bold text-white text-base">Equipment Desk</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Check out rackets, balls, and gear tied to your court booking, monitored by equipment managers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 backdrop-blur">
            <div className="text-2xl mb-2">🛡️</div>
            <h3 className="font-bold text-white text-base">Fair-Play Quotas</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Institutional policies limit hoarded bookings and ensure prime slots are equitably distributed.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
