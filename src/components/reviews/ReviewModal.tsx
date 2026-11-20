"use client";

import { useState } from "react";
import { Star, X, Loader2, CheckCircle2 } from "lucide-react";

interface ReviewModalProps {
  bookingId: string;
  facilityName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReviewModal({
  bookingId,
  facilityName,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (comment.trim().length < 5) {
      setError("Please provide feedback of at least 5 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to submit review");
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[var(--surface)] p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close review modal"
        >
          <X className="h-5 w-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400 mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-white">Review Submitted!</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Thank you for your feedback! Your review will be published once reviewed by administrators.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-lime-400">
                Facility Experience
              </span>
              <h3 className="text-xl font-black text-white mt-0.5">
                Review {facilityName}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Share your court experience to help campus athletes and administrators.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Star Rating Picker */}
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-2">
                  Rating:
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star;
                    return (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-slate-600 transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            isFilled
                              ? "fill-lime-400 text-lime-400 drop-shadow-[0_0_8px_var(--color-lime-400)]"
                              : "text-slate-700"
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-2 text-sm font-bold text-white">
                    {rating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">
                  Headline (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Great turf quality and night lighting"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 transition-colors"
                />
              </div>

              {/* Comment Input */}
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">
                  Written Feedback:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="How was the court surface, lighting, cleanliness, and overall experience?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 transition-colors"
                />
                <span className="text-[10px] text-slate-500 float-right mt-1">
                  {comment.length} / 1000 chars
                </span>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black flex items-center gap-2 shadow-lg shadow-lime-400/20 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

