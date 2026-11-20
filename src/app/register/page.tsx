"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT" as "STUDENT" | "TEACHER",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    // Clear specific field error on change
    if (errors[e.target.name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[e.target.name];
        return next;
      });
    }
  };

  const validateClient = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = "Full name must be at least 2 characters";
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password requires at least one uppercase letter, one lowercase letter, and one number";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setServerSuccess(null);

    if (!validateClient()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const fieldErrors: Record<string, string> = {};
          data.errors.forEach((err: { path?: string[]; message?: string }) => {
            const field = err.path?.[0];
            if (field && err.message) fieldErrors[field] = err.message;
          });
          setErrors(fieldErrors);
        }
        setServerError(data.message || "Registration failed. Please check your inputs.");
        return;
      }

      setServerSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 1500);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3 text-2xl">
                🏸
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Create {formData.role === "TEACHER" ? "Teacher / Faculty" : "Student"} Account
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Access night-time courts, turf grounds, and equipment rentals
              </p>
            </div>

            {/* Notification Banners */}
            {serverError && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-2.5">
                <span className="font-bold">✕</span>
                <span>{serverError}</span>
              </div>
            )}

            {serverSuccess && (
              <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-start gap-2.5">
                <span className="font-bold">✓</span>
                <span>{serverSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: "STUDENT" }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      formData.role === "STUDENT"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    <span>🎓</span>
                    <span>Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: "TEACHER" }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      formData.role === "TEACHER"
                        ? "bg-purple-500/10 border-purple-500 text-purple-400 shadow-md shadow-purple-500/10"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    <span>👨‍🏫</span>
                    <span>Teacher / Faculty</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Jordan Smith"
                  required
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border ${
                    errors.name ? "border-rose-500/70" : "border-zinc-800 focus:border-emerald-500"
                  } text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none transition-colors`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-rose-400 font-medium">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  {formData.role === "TEACHER" ? "Faculty / Institutional Email" : "University Email"}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={
                    formData.role === "TEACHER"
                      ? "professor@university.edu"
                      : "student@university.edu"
                  }
                  required
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border ${
                    errors.email ? "border-rose-500/70" : "border-zinc-800 focus:border-emerald-500"
                  } text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none transition-colors`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-400 font-medium">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 8 chars, 1 uppercase & 1 number"
                    required
                    className={`w-full px-3.5 py-2.5 pr-10 rounded-xl bg-zinc-950 border ${
                      errors.password ? "border-rose-500/70" : "border-zinc-800 focus:border-emerald-500"
                    } text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 hover:text-zinc-200"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-400 font-medium">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat your password"
                    required
                    className={`w-full px-3.5 py-2.5 pr-10 rounded-xl bg-zinc-950 border ${
                      errors.confirmPassword
                        ? "border-rose-500/70"
                        : "border-zinc-800 focus:border-emerald-500"
                    } text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 hover:text-zinc-200"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-400 font-medium">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  formData.role === "TEACHER"
                    ? "bg-purple-500 hover:bg-purple-400 text-white shadow-lg shadow-purple-500/20"
                    : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    Creating Account...
                  </>
                ) : formData.role === "TEACHER" ? (
                  "Create Teacher / Faculty Account"
                ) : (
                  "Create Student Account"
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-zinc-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

