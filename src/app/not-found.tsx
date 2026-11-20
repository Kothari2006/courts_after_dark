import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-5xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            404
          </div>
          <h1 className="text-xl font-black text-white tracking-tight mb-2">
            Out of bounds
          </h1>
          <p className="text-sm text-zinc-400 mb-6">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link
            href="/"
            className="inline-flex w-full justify-center items-center py-2.5 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors shadow-lg shadow-emerald-500/20"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
