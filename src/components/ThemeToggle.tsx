"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "cad-theme";
const EVENT = "cad-theme-change";

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}
const getSnapshot = () => document.documentElement.classList.contains("dark-mode");
const getServerSnapshot = () => false;

/**
 * Light / black theme switch. The preference lives in localStorage and is
 * applied before first paint by the inline script in the root layout, so there
 * is no light flash on reload.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark-mode", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // storage unavailable (private mode): the theme still applies for this session
    }
    window.dispatchEvent(new Event(EVENT));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to black theme"}
      title={dark ? "Light theme" : "Black theme"}
      className={`relative rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 hover:text-white hover:border-slate-700 transition-colors ${className}`}
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
