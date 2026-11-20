"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="max-w-md w-full text-center bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-4xl mb-3">⚠️</div>
        <h1 className="text-xl font-black text-white mb-2">Something went wrong</h1>
        <p className="text-sm text-zinc-400 mb-6">
          {error.message || "An unexpected error occurred."} Please try again.
        </p>
        <button
          onClick={reset}
          className="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
