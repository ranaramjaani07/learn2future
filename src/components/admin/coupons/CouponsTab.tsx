import React from "react";
import { Coins, Lock, ShieldCheck, Trash } from "lucide-react";

interface AdminEmail {
  id: string;
  email: string;
  role: string;
  addedBy?: string;
}

interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderValue?: number;
  expiresAt?: string;
  usedCount?: number;
  totalSales?: number;
  isActive: boolean;
}

interface CouponsTabProps {
  handleCreateCoupon: (e: React.FormEvent) => void;
  newCouponCode: string;
  setNewCouponCode: (val: string) => void;
  newCouponType: "percentage" | "fixed";
  setNewCouponType: (val: "percentage" | "fixed") => void;
  newCouponValue: number;
  setNewCouponValue: (val: number) => void;
  newCouponMinOrderValue: string;
  setNewCouponMinOrderValue: (val: string) => void;
  newCouponExpiresAt: string;
  setNewCouponExpiresAt: (val: string) => void;
  newCouponIsActive: boolean;
  setNewCouponIsActive: (val: boolean) => void;
  couponSubmitting: boolean;

  handleAddAdminEmail: (e: React.FormEvent) => void;
  newAdminEmail: string;
  setNewAdminEmail: (val: string) => void;
  adminEmailSubmitting: boolean;
  adminEmailsList: AdminEmail[];
  adminListLoading: boolean;
  handleDeleteAdminEmail: (id: string) => void;

  couponsList: Coupon[];
  handleDeleteCoupon: (id: string) => void;
}

export const CouponsTab: React.FC<CouponsTabProps> = ({
  handleCreateCoupon,
  newCouponCode,
  setNewCouponCode,
  newCouponType,
  setNewCouponType,
  newCouponValue,
  setNewCouponValue,
  newCouponMinOrderValue,
  setNewCouponMinOrderValue,
  newCouponExpiresAt,
  setNewCouponExpiresAt,
  newCouponIsActive,
  setNewCouponIsActive,
  couponSubmitting,

  handleAddAdminEmail,
  newAdminEmail,
  setNewAdminEmail,
  adminEmailSubmitting,
  adminEmailsList,
  adminListLoading,
  handleDeleteAdminEmail,

  couponsList,
  handleDeleteCoupon,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-200" id="admin-coupons-tab">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMN 1: Create Coupon Code Form */}
        <div className="bg-white dark:bg-[#151515] p-6 rounded-2xl border border-neutral-200 dark:border-brand-border space-y-4">
          <div>
            <h3 className="font-display text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider text-brand-gold bg-brand-gold/5 px-3 py-1.5 rounded-lg border border-brand-gold/10 w-fit">
              <Coins className="w-4 h-4" /> Create Promo Coupon Code
            </h3>
            <p className="text-[11px] text-neutral-500 font-light mt-1.5">Set up discounts for students to use during checkout.</p>
          </div>

          <form onSubmit={handleCreateCoupon} className="space-y-4 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1" htmlFor="cpCode">Coupon Code *</label>
                <input
                  id="cpCode"
                  type="text"
                  required
                  placeholder="e.g. WELCOME50"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-brand-border rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1" htmlFor="cpType">Discount Type</label>
                <select
                  id="cpType"
                  value={newCouponType}
                  onChange={(e) => setNewCouponType(e.target.value as any)}
                  className="w-full bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-brand-border rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1" htmlFor="cpValue">Deduction Value *</label>
                <input
                  id="cpValue"
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 50 (for 50% or ₹50)"
                  value={newCouponValue || ""}
                  onChange={(e) => setNewCouponValue(Number(e.target.value))}
                  className="w-full bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-brand-border rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1" htmlFor="cpMin">Min Order Value (Optional)</label>
                <input
                  id="cpMin"
                  type="number"
                  placeholder="e.g. 1000"
                  value={newCouponMinOrderValue}
                  onChange={(e) => setNewCouponMinOrderValue(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-brand-border rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1" htmlFor="cpExpiry">Expiry Date (Optional)</label>
                <input
                  id="cpExpiry"
                  type="date"
                  value={newCouponExpiresAt}
                  onChange={(e) => setNewCouponExpiresAt(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-brand-border rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newCouponIsActive}
                    onChange={(e) => setNewCouponIsActive(e.target.checked)}
                    className="w-4 h-4 accent-brand-gold rounded border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900"
                  />
                  <span className="text-xs text-neutral-800 dark:text-neutral-300 font-medium">Coupon Status Active</span>
                </label>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
              <button
                type="submit"
                disabled={couponSubmitting}
                className="bg-brand-gold hover:bg-[#F5B300]/90 text-black font-display font-bold text-xs py-2.5 px-6 rounded-xl transition-all disabled:opacity-50"
              >
                {couponSubmitting ? "Setting Coupon..." : "Instate Coupon Code"}
              </button>
            </div>
          </form>
        </div>

        {/* COLUMN 2: Manage Admin Access Emails */}
        <div id="admin-access-manager" className="bg-white dark:bg-[#151515] p-6 rounded-2xl border-2 border-brand-gold/30 dark:border-brand-gold/20 shadow-[0_0_15px_rgba(212,175,55,0.05)] space-y-4 transition-all duration-300 hover:border-brand-gold/50">
          <div>
            <h3 className="font-display text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider text-brand-gold bg-brand-gold/5 px-3 py-1.5 rounded-lg border border-brand-gold/10 w-fit">
              <ShieldCheck className="w-4.5 h-4.5" /> Delegate Admin Access
            </h3>
            <p className="text-[11px] text-neutral-500 font-light mt-1.5">Grant administrative access to teammate partners by email.</p>
          </div>

          <form onSubmit={handleAddAdminEmail} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1" htmlFor="admEmail">Teammate Email Address *</label>
              <div className="flex gap-2">
                <input
                  id="admEmail"
                  type="email"
                  required
                  placeholder="e.g. colleague@gmail.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="flex-1 bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-brand-border rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                />
                <button
                  type="submit"
                  disabled={adminEmailSubmitting || !newAdminEmail.trim()}
                  className="bg-neutral-900 text-white dark:bg-white dark:text-black hover:bg-neutral-850 dark:hover:bg-neutral-100 disabled:opacity-50 text-xs font-display font-semibold px-5 py-2 rounded-lg transition-colors flex items-center shrink-0"
                >
                  {adminEmailSubmitting ? "Granting..." : "Assign Access"}
                </button>
              </div>
            </div>
          </form>

          {/* ADMIN EMAILS LIST */}
          <div className="space-y-2 mt-4">
            <div className="flex justify-between items-center pl-1">
              <h4 className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">Authorized Team Panelists</h4>
              <span className="text-[9px] font-mono bg-neutral-100 dark:bg-brand-gold/10 text-neutral-600 dark:text-brand-gold px-2 py-0.5 rounded-full font-bold">Total: {adminEmailsList.length + 1}</span>
            </div>
            <div className="max-h-64 overflow-y-auto border border-neutral-200 dark:border-brand-border rounded-xl divide-y divide-neutral-200 dark:divide-brand-border">
              {/* Founder entry (Always shown, never deletable, always has full access) */}
              <div className="p-3 bg-[#FCF8E3]/10 dark:bg-brand-gold/5 flex items-center justify-between text-xs font-sans border-l-2 border-brand-gold">
                <div className="space-y-0.5 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-neutral-900 dark:text-white">digitalcoursesbay@gmail.com</span>
                    <span className="text-[8px] bg-brand-gold/15 text-brand-gold px-1.5 py-0.5 rounded-full uppercase font-mono font-bold">Founder</span>
                  </div>
                  <p className="text-[9px] text-neutral-500 font-mono">Role: master admin | Added by: System</p>
                </div>
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono flex items-center gap-1 pr-1">
                  <Lock className="w-3 h-3 text-brand-gold/50" /> Permanent
                </div>
              </div>

              {adminListLoading ? (
                <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-neutral-400 font-light font-sans">Loading teammates info...</span>
                </div>
              ) : adminEmailsList.length === 0 ? (
                <div className="p-4 text-xs text-neutral-400 dark:text-neutral-500 text-center font-light italic">
                  No dynamic assistants allocated yet. (Only the founder possesses dashboard privileges).
                </div>
              ) : (
                adminEmailsList.map((admin) => (
                  <div key={admin.id} className="p-3 bg-neutral-50/50 dark:bg-brand-card/25 flex items-center justify-between text-xs font-sans">
                    <div className="space-y-0.5 text-left">
                      <p className="font-semibold text-neutral-900 dark:text-white">{admin.email}</p>
                      <p className="text-[9px] text-neutral-500 font-mono">Role: {admin.role} | Added by: {admin.addedBy || "digitalcoursesbay@gmail.com"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAdminEmail(admin.id)}
                      className="p-1 px-2 text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition-colors flex items-center gap-1 text-[10px]"
                      title="Revoke Admin Access"
                    >
                      <Trash className="w-3 h-3" /> Revoke
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 3: Bottom Coupons Grid List */}
      <div className="bg-white dark:bg-[#151515] p-6 rounded-2xl border border-neutral-200 dark:border-brand-border space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h3 className="font-display text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-brand-gold bg-brand-gold/5 px-3 py-1.5 rounded-lg border border-brand-gold/10 w-fit">
              Manage Live Coupons & Promotions
            </h3>
            <p className="text-[11px] text-neutral-500 font-light mt-1.5">List of live codes used dynamically inside checkout portals.</p>
          </div>
          <span className="text-[10px] font-mono bg-neutral-150 dark:bg-brand-border/40 text-neutral-700 dark:text-neutral-300 px-3 py-1 rounded-full uppercase">
            Total coupons: {couponsList.length}
          </span>
        </div>

        <div className="overflow-x-auto border border-neutral-200 dark:border-brand-border rounded-2xl bg-neutral-50/40 dark:bg-[#111111]/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-100 dark:bg-[#191919] border-b border-neutral-200 dark:border-brand-border text-[10px] font-mono uppercase tracking-widest text-neutral-500 select-none">
                <th className="py-3 px-6">Coupon Code</th>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6">Value</th>
                <th className="py-3 px-6">Min Order</th>
                <th className="py-3 px-6">Expires Under</th>
                <th className="py-3 px-6 text-center">Times Used</th>
                <th className="py-3 px-6 text-center">Total Sales</th>
                <th className="py-3 px-6 text-center">Is Active</th>
                <th className="py-3 px-6 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-brand-border font-sans text-xs">
              {couponsList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-neutral-400 dark:text-neutral-500 italic font-light">
                    No coupons live yet. Create one above to allow students to receive discounts!
                  </td>
                </tr>
              ) : (
                couponsList.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-neutral-100/50 dark:hover:bg-brand-card/20 transition-all">
                    <td className="py-4 px-6 font-mono font-bold text-brand-gold text-xs text-left">
                      {coupon.code}
                    </td>
                    <td className="py-4 px-6 font-light uppercase text-neutral-500 font-mono text-[10px] text-left">
                      {coupon.type === "percentage" ? "Percentage %" : "Fixed Amount ₹"}
                    </td>
                    <td className="py-4 px-6 font-semibold text-neutral-800 dark:text-white text-left">
                      {coupon.type === "percentage" ? `${coupon.value}%` : `₹${coupon.value}`}
                    </td>
                    <td className="py-4 px-6 text-neutral-500 text-left">
                      {coupon.minOrderValue ? `₹${coupon.minOrderValue}` : "-"}
                    </td>
                    <td className="py-4 px-6 text-neutral-500 font-mono text-[11px] text-left">
                      {coupon.expiresAt || <span className="text-neutral-300 dark:text-neutral-600">Never Expire</span>}
                    </td>
                    <td className="py-4 px-6 text-center font-mono font-bold text-neutral-800 dark:text-neutral-200 text-xs">
                      {coupon.usedCount || 0}
                    </td>
                    <td className="py-4 px-6 text-center font-mono font-bold text-brand-gold text-xs">
                      ₹{(coupon.totalSales || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-block text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                        coupon.isActive 
                          ? "bg-green-500/10 text-green-500 border-green-500/20" 
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}>
                        {coupon.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="p-1 px-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 font-medium rounded-lg text-xs transition-all flex items-center space-x-1 ml-auto"
                      >
                        <Trash className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
