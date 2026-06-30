import React from "react";
import { Clock, Trash, Star } from "lucide-react";
import { Review } from "../../../types";

interface ReviewsTabProps {
  reviewsList: Review[];
  reviewFilterCategory: string;
  setReviewFilterCategory: (category: string) => void;
  reviewFilterRating: string;
  setReviewFilterRating: (rating: string) => void;
  handleUpdateReviewStatus: (rev: Review, status: "Approved" | "Rejected") => void;
  handleDeleteReviewAdmin: (id: string) => void;
}

export const ReviewsTab: React.FC<ReviewsTabProps> = ({
  reviewsList,
  reviewFilterCategory,
  setReviewFilterCategory,
  reviewFilterRating,
  setReviewFilterRating,
  handleUpdateReviewStatus,
  handleDeleteReviewAdmin,
}) => {
  const total = reviewsList.length;
  const verifiedCount = reviewsList.filter(r => r.verifiedPurchase).length;
  const avgRating = total > 0 
    ? (reviewsList.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1) 
    : "0.0";
  const pendingCount = reviewsList.filter(r => r.status === "Pending").length;
  const approvedCount = reviewsList.filter(r => r.status === "Approved").length;
  const rejectedCount = reviewsList.filter(r => r.status === "Rejected").length;

  const reviewCategories = Array.from(new Set(reviewsList.map(r => r.category)));

  const filteredReviews = reviewsList.filter((rev) => {
    const matchCategory = reviewFilterCategory === "All" || rev.category === reviewFilterCategory;
    const matchRating = reviewFilterRating === "All" || String(rev.rating) === reviewFilterRating;
    return matchCategory && matchRating;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="admin-reviews-manager">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Purchase-Verified Student Reviews</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Moderate course reviews, approve them for the home walls, or discard low rating submissions.</p>
        </div>
        <div className="bg-brand-gold/10 text-brand-gold px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border border-brand-gold/20 flex items-center gap-1.5 shrink-0">
          <span>Average Student Rating: {avgRating} ★</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 select-none font-sans">
        <div className="bg-white dark:bg-[#151515] p-4 rounded-2xl border border-neutral-200 dark:border-brand-border space-y-1">
          <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Total Reviews</p>
          <p className="text-lg font-bold font-mono text-neutral-800 dark:text-white">{total}</p>
        </div>
        <div className="bg-white dark:bg-[#151515] p-4 rounded-2xl border border-neutral-200 dark:border-brand-border space-y-1">
          <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Verified Students</p>
          <p className="text-lg font-bold font-mono text-green-500">{verifiedCount} ({total > 0 ? Math.round((verifiedCount/total)*100) : 0}%)</p>
        </div>
        <div className="bg-white dark:bg-[#151515] p-4 rounded-2xl border border-neutral-200 dark:border-brand-border space-y-1">
          <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Pending Review</p>
          <p className="text-lg font-bold font-mono text-amber-500">{pendingCount}</p>
        </div>
        <div className="bg-white dark:bg-[#151515] p-4 rounded-2xl border border-neutral-200 dark:border-brand-border space-y-1">
          <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Approved Live</p>
          <p className="text-lg font-bold font-mono text-emerald-500">{approvedCount}</p>
        </div>
        <div className="bg-white dark:bg-[#151515] p-4 rounded-2xl border border-neutral-200 dark:border-brand-border space-y-1">
          <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Rejected Reviews</p>
          <p className="text-lg font-bold font-mono text-red-500">{rejectedCount}</p>
        </div>
      </div>

      <div className="bg-neutral-50 dark:bg-brand-card/40 p-4 rounded-2xl border border-neutral-200 dark:border-brand-border/60 flex flex-wrap items-center justify-between gap-4 font-sans">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="space-y-1">
            <span className="block text-[10px] font-mono uppercase text-neutral-450">Filter by category</span>
            <select
              value={reviewFilterCategory}
              onChange={(e) => setReviewFilterCategory(e.target.value)}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-brand-border rounded-lg text-neutral-800 dark:text-white py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-brand-gold"
            >
              <option value="All">All Categories</option>
              {reviewCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <span className="block text-[10px] font-mono uppercase text-neutral-450">Filter by stars</span>
            <select
              value={reviewFilterRating}
              onChange={(e) => setReviewFilterRating(e.target.value)}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-brand-border rounded-lg text-neutral-800 dark:text-white py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-brand-gold"
            >
              <option value="All">All Ratings</option>
              <option value="5">5 Stars only</option>
              <option value="4">4 Stars &amp; above</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        <span className="text-[11px] font-mono text-neutral-400">
          Showing {filteredReviews.length} of {total} reviews
        </span>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212] rounded-3xl space-y-4 shadow-xl">
          <div className="w-14 h-14 bg-neutral-100 dark:bg-brand-border rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6 text-neutral-400" />
          </div>
          <div className="space-y-1 text-center">
            <h4 className="text-base font-bold text-neutral-900 dark:text-white">No reviews found matching filters</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">Try resetting or broaden-up active category or rating targets.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#151515] rounded-3xl border border-neutral-200 dark:border-brand-border overflow-hidden shadow-xl font-sans">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-100 dark:bg-[#1a1a1a] border-b border-neutral-200 dark:border-brand-border text-[10px] font-mono uppercase tracking-widest text-neutral-500 select-none">
                  <th className="py-3 px-6">Reviewer Info</th>
                  <th className="py-3 px-6">Comment Content</th>
                  <th className="py-3 px-6 text-center">Stars Rating</th>
                  <th className="py-3 px-6 text-center">Approval Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-brand-border font-sans text-xs">
                {filteredReviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-neutral-50/55 dark:hover:bg-brand-card/10 transition-all">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-gold/10 border border-brand-gold/25 overflow-hidden flex items-center justify-center shrink-0">
                          {rev.userPhoto || rev.avatar ? (
                            <img src={rev.userPhoto || rev.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-mono font-bold text-brand-gold">
                              {rev.userName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="space-y-0.5 min-w-0 text-left">
                          <p className="font-bold text-neutral-900 dark:text-white truncate max-w-xs flex items-center gap-1.5">
                            <span>{rev.userName}</span>
                            {rev.verifiedPurchase && (
                              <span className="inline-flex items-center gap-0.5 bg-green-500/10 text-green-500 border border-green-500/20 px-1 py-0.2 rounded text-[8px] font-mono uppercase leading-tight scale-90">
                                ✓ Verified
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-neutral-400 font-mono select-all truncate max-w-xs">{rev.userEmail}</p>
                          <p className="text-[9px] text-neutral-500 tracking-wide truncate max-w-xs uppercase font-bold font-mono">Category: {rev.category}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 max-w-sm">
                      <div className="space-y-1.5 text-left">
                        <p className="text-neutral-700 dark:text-neutral-300 line-clamp-3 text-xs leading-relaxed italic">
                          &ldquo;{rev.reviewText}&rdquo;
                        </p>
                        <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 font-mono">
                          <span>Course: {rev.courseName}</span>
                          <span>•</span>
                          <span>Order Ref: {rev.orderId?.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center select-none">
                      <div className="inline-flex items-center justify-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${i < rev.rating ? "fill-brand-gold text-brand-gold" : "text-neutral-200 dark:text-neutral-800"}`} 
                          />
                        ))}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span className={`inline-block text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                        rev.status === "Approved"
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : rev.status === "Rejected"
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      }`}>
                        {rev.status || "Pending"}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-1.5 text-xs">
                        {rev.status !== "Approved" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateReviewStatus(rev, "Approved")}
                            className="p-1 px-2 border border-green-500/20 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors text-[10px] font-semibold"
                            title="Approve review"
                          >
                            Approve
                          </button>
                        )}
                        {rev.status !== "Rejected" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateReviewStatus(rev, "Rejected")}
                            className="p-1 px-2 border border-amber-500/20 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors text-[10px] font-semibold"
                            title="Reject review"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteReviewAdmin(rev.id || `${rev.userId}_${rev.category.replace(/\s+/g, '_')}`)}
                          className="p-1 px-2 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-[10px] font-semibold flex items-center gap-1"
                          title="Permanently Delete"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
