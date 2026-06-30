import React, { useState } from "react";
import { 
  CheckSquare, 
  Trash2, 
  Download, 
  FileText, 
  ExternalLink, 
  Eye, 
  Check, 
  CheckCircle, 
  Trash 
} from "lucide-react";
import { Order, Course } from "../../../types";

interface OrdersTabProps {
  orders: Order[];
  courses: Course[];
  handleAcceptAllPending: () => void;
  handleDeleteAllOrders: () => void;
  handleExportOrdersCSV: () => void;
  setViewScreenshotUrl: (url: string | null) => void;
  confirmAndUpdateStatus: (id: string, nextStatus: string, name: string) => void;
  handleDeleteOrder: (id: string) => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  courses,
  handleAcceptAllPending,
  handleDeleteAllOrders,
  handleExportOrdersCSV,
  setViewScreenshotUrl,
  confirmAndUpdateStatus,
  handleDeleteOrder
}) => {
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === "all") return true;
    if (orderStatusFilter === "approved") {
      return o.status?.toLowerCase() === "approved" || o.status?.toLowerCase() === "verified";
    }
    return o.status?.toLowerCase() === orderStatusFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="admin-orders-tab">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Customer Transaction Desk</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Match UPI screens with internal logs to verify licenses.</p>
        </div>
      </div>

      {/* Order Status Counter Metrics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
          <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 dark:text-neutral-400">Total Orders</span>
          <div className="text-2xl font-bold font-display mt-1 text-neutral-900 dark:text-white">{orders.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-yellow-500/15 bg-yellow-500/5">
          <span className="text-[10px] uppercase font-mono tracking-wider text-yellow-600 dark:text-yellow-500">Pending</span>
          <div className="text-2xl font-bold font-display mt-1 text-yellow-600 dark:text-yellow-400">
            {orders.filter(o => o.status?.toLowerCase() === "pending").length}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-blue-500/15 bg-blue-500/5">
          <span className="text-[10px] uppercase font-mono tracking-wider text-blue-600 dark:text-blue-500">Approved</span>
          <div className="text-2xl font-bold font-display mt-1 text-blue-600 dark:text-blue-400">
            {orders.filter(o => o.status?.toLowerCase() === "approved" || o.status?.toLowerCase() === "verified").length}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-green-500/15 bg-green-500/5">
          <span className="text-[10px] uppercase font-mono tracking-wider text-green-600 dark:text-green-500">Delivered</span>
          <div className="text-2xl font-bold font-display mt-1 text-green-600 dark:text-green-400">
            {orders.filter(o => o.status?.toLowerCase() === "delivered").length}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-red-500/15 bg-red-500/5 col-span-2 lg:col-span-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-red-600 dark:text-red-500">Other States</span>
          <div className="text-2xl font-bold font-display mt-1 text-red-600 dark:text-red-400">
            {orders.filter(o => {
              const st = o.status?.toLowerCase();
              return st === "refunded" || st === "cancelled";
            }).length}
          </div>
        </div>
      </div>

      {/* Order Controls Bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-neutral-50 dark:bg-neutral-900/10 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
        {/* Horizontal Status Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: "all", label: "All", count: orders.length },
            { value: "pending", label: "Pending", count: orders.filter(o => o.status?.toLowerCase() === "pending").length },
            { value: "approved", label: "Approved", count: orders.filter(o => o.status?.toLowerCase() === "approved" || o.status?.toLowerCase() === "verified").length },
            { value: "delivered", label: "Delivered", count: orders.filter(o => o.status?.toLowerCase() === "delivered").length },
            { value: "refunded", label: "Refunded", count: orders.filter(o => o.status?.toLowerCase() === "refunded").length },
            { value: "cancelled", label: "Cancelled", count: orders.filter(o => o.status?.toLowerCase() === "cancelled").length }
          ].map((filterOption) => (
            <button
              key={filterOption.value}
              onClick={() => setOrderStatusFilter(filterOption.value)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 border ${
                orderStatusFilter === filterOption.value
                  ? "bg-brand-gold text-black border-brand-gold font-semibold shadow-sm"
                  : "bg-white dark:bg-[#151515] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-850"
              }`}
            >
              <span>{filterOption.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                orderStatusFilter === filterOption.value 
                  ? "bg-black/10 text-black font-bold" 
                  : "bg-neutral-100 dark:bg-neutral-900 text-neutral-500"
              }`}>{filterOption.count}</span>
            </button>
          ))}
        </div>

        {/* Bulk Actions and Export Buttons Group */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAcceptAllPending}
            className="flex-1 sm:flex-initial text-xs px-3 py-2 rounded-lg font-medium border border-green-500/30 text-green-600 dark:text-green-500 bg-green-500/5 hover:bg-green-500/10 transition-all flex items-center justify-center space-x-1.5 active:scale-95"
            title="Approve and enroll all currently pending orders"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Accept All Pending</span>
          </button>

          <button
            onClick={handleDeleteAllOrders}
            className="flex-1 sm:flex-initial text-xs px-3 py-2 rounded-lg font-medium border border-red-500/30 text-red-600 dark:text-red-500 bg-red-500/5 hover:bg-red-500/10 transition-all flex items-center justify-center space-x-1.5 active:scale-95"
            title="Permanently wipe all orders from database"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete All</span>
          </button>

          <button
            onClick={handleExportOrdersCSV}
            className="flex-1 sm:flex-initial text-xs px-3 py-2 rounded-lg font-bold bg-brand-gold hover:bg-brand-gold/90 text-black shadow-md hover:shadow-brand-gold/10 transition-all flex items-center justify-center space-x-1.5 active:scale-95"
            title="Export complete orders history as Excel-compatible CSV file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export History</span>
          </button>
        </div>
      </div>

      {/* Orders table with filter applied */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-3 shadow-sm">
          <FileText className="w-10 h-10 text-neutral-500 mx-auto" />
          <h4 className="text-sm font-semibold text-neutral-400">No Orders Match Filter</h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">There are currently no orders under the status "{orderStatusFilter}".</p>
        </div>
      ) : (
        <div className="border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#1f1f1f]/50 dark:bg-[#191919]/60 border-b border-brand-border text-neutral-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="px-6 py-4">Transaction / Buyer</th>
                  <th className="px-6 py-4">Direct Contact</th>
                  <th className="px-6 py-4">Enrolled Course</th>
                  <th className="px-6 py-4">Image Check</th>
                  <th className="px-6 py-4">Approval State</th>
                  <th className="px-6 py-4">Deliverable Access</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                {filteredOrders.map((o) => {
                  const matchingCour = courses.find(c => c.id === o.courseId);
                  
                  return (
                    <tr key={o.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/45 transition-colors">
                      
                      {/* Buyer details */}
                      <td className="px-6 py-4 space-y-1">
                        <span className="font-semibold block text-neutral-900 dark:text-white text-sm">{o.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono block select-all">{o.email}</span>
                      </td>

                      {/* Telegram Handle */}
                      <td className="px-6 py-4 font-semibold font-mono">
                        <a 
                          href={`https://t.me/${o.telegram}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-gold hover:underline flex items-center space-x-1"
                        >
                          <span>@{o.telegram}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      </td>

                      {/* Associated Course */}
                      <td className="px-6 py-4 font-semibold">
                        {matchingCour ? (
                          <div className="space-y-0.5">
                            <span className="text-neutral-900 dark:text-white truncate max-w-44 block leading-snug">{matchingCour.title}</span>
                            <span className="text-[9.5px] font-mono text-brand-gold">₹{matchingCour.price.toLocaleString("en-IN")}</span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-neutral-900 dark:text-white truncate max-w-44 block leading-snug">{o.courseName || "Unknown Course"}</span>
                            <span className="text-[9.5px] font-mono text-brand-gold">₹{(o.price || 1499).toLocaleString("en-IN")}</span>
                          </div>
                        )}
                      </td>

                      {/* Transaction Screen Preview trigger */}
                      <td className="px-6 py-4">
                        {(o.screenshotUrl || o.proofImage) ? (
                          <button
                            onClick={() => setViewScreenshotUrl(o.screenshotUrl || o.proofImage || null)}
                            className="text-indigo-400 hover:text-indigo-300 font-mono text-xs flex items-center space-x-1.5 focus:outline-none bg-indigo-500/10 hover:bg-indigo-500/15 py-1 px-2.5 rounded-md"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Verify Proof</span>
                          </button>
                        ) : (
                          <span className="text-neutral-500 italic block">None Submitted</span>
                        )}
                      </td>

                      {/* Verification status pill */}
                      <td className="px-6 py-4">
                        <select
                          value={o.status}
                          onChange={(e) => {
                            const nextStatus = e.target.value;
                            confirmAndUpdateStatus(o.id || "", nextStatus, o.name);
                          }}
                          className={`font-mono text-xs font-bold px-3 py-1.5 rounded-xl border outline-none bg-white dark:bg-[#151515] hover:opacity-90 cursor-pointer transition-all ${
                            o.status?.toLowerCase() === "pending" ? "text-yellow-500 border-yellow-500/30 bg-yellow-500/5 dark:bg-yellow-500/15 focus:border-yellow-500" :
                            o.status?.toLowerCase() === "approved" || o.status?.toLowerCase() === "verified" ? "text-blue-500 border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/15 focus:border-blue-500" :
                            o.status?.toLowerCase() === "delivered" ? "text-green-500 border-green-500/30 bg-green-500/5 dark:bg-green-500/15 focus:border-green-500" :
                            o.status?.toLowerCase() === "refunded" ? "text-red-500 border-red-500/30 bg-red-500/5 dark:bg-red-500/15 focus:border-red-500" :
                            "text-neutral-500 border-neutral-500/30 bg-neutral-500/5 dark:bg-neutral-500/15 focus:border-neutral-500"
                          }`}
                        >
                          <option value="pending" className="text-yellow-500 bg-white dark:bg-[#151515]">Pending</option>
                          <option value="approved" className="text-blue-500 bg-white dark:bg-[#151515]">Approved</option>
                          <option value="delivered" className="text-green-500 bg-white dark:bg-[#151515]">Delivered</option>
                          <option value="refunded" className="text-red-500 bg-white dark:bg-[#151515]">Refunded</option>
                          <option value="cancelled" className="text-neutral-500 bg-white dark:bg-[#151515]">Cancelled</option>
                        </select>
                      </td>

                      {/* Deliverable Access Details */}
                      <td className="px-6 py-4 font-mono text-[10.5px] leading-relaxed select-none">
                        <div className="space-y-1.5 bg-neutral-100/50 dark:bg-neutral-900/50 border border-neutral-105 dark:border-neutral-900/80 p-3 rounded-xl max-w-xs">
                          <div>
                            <span className="text-neutral-400 block font-mono text-[9px] uppercase tracking-wider">Course Name</span>
                            <span className="text-neutral-900 dark:text-neutral-150 font-bold block truncate max-w-[155px]" title={matchingCour?.title || o.courseName}>
                              {matchingCour?.title || o.courseName}
                            </span>
                          </div>
                          <div>
                            <span className="text-neutral-400 block font-mono text-[9px] uppercase tracking-wider">Buyer Name</span>
                            <span className="text-neutral-900 dark:text-neutral-200 font-semibold block truncate max-w-[155px]" title={o.name}>
                              {o.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-neutral-400">Payment Status:</span>
                            <span className={`font-bold ${
                              o.status?.toLowerCase() === "pending" ? "text-red-500" :
                              o.status?.toLowerCase() === "approved" || o.status?.toLowerCase() === "verified" ? "text-blue-500" : "text-green-500"
                            }`}>{o.status}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-neutral-400">Delivery Status:</span>
                            <span className={`font-bold ${o.status?.toLowerCase() === "delivered" ? "text-green-500" : "text-amber-500"}`}>
                              {o.status?.toLowerCase() === "delivered" ? "Active/Delivered" : "Awaiting Audit"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-neutral-400">Link Available:</span>
                            <span className={`font-bold ${matchingCour?.deliverableLink ? "text-green-500" : "text-red-500"}`}>
                              {matchingCour?.deliverableLink ? "Yes" : "No"}
                            </span>
                          </div>
                          
                          {/* Metrics tracking telemetry */}
                          <div className="pt-2 mt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800 text-[9px] text-neutral-400 space-y-1">
                            <div className="flex items-center justify-between text-brand-gold font-bold">
                              <span>Clicks Tracker:</span>
                              <span>{o.accessCount || 0} times</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Last Clicked:</span>
                              <span className="font-semibold text-neutral-300">
                                {o.lastAccessTime ? (
                                  o.lastAccessTime.seconds 
                                    ? new Date(o.lastAccessTime.seconds * 1000).toLocaleString("en-GB") 
                                    : new Date(o.lastAccessTime).toLocaleString("en-GB")
                                ) : "Never"}
                              </span>
                            </div>
                            {o.purchasedAt && (
                              <div className="flex items-center justify-between">
                                <span>Verified At:</span>
                                <span className="text-neutral-350">
                                  {o.purchasedAt.seconds 
                                    ? new Date(o.purchasedAt.seconds * 1000).toLocaleDateString() 
                                    : new Date(o.purchasedAt).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            {o.deliveredAt && (
                              <div className="flex items-center justify-between">
                                <span>Delivered At:</span>
                                <span className="text-neutral-350">
                                  {o.deliveredAt.seconds 
                                    ? new Date(o.deliveredAt.seconds * 1000).toLocaleDateString() 
                                    : new Date(o.deliveredAt).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Approval trigger buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-mono text-[10.5px]">
                          
                          <button
                            onClick={() => confirmAndUpdateStatus(o.id || "", "approved", o.name)}
                            disabled={o.status?.toLowerCase() === "approved" || o.status?.toLowerCase() === "verified"}
                            className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1 transition-all ${
                              (o.status?.toLowerCase() === "approved" || o.status?.toLowerCase() === "verified")
                                ? "opacity-35 cursor-not-allowed border-neutral-200 dark:border-neutral-900 text-neutral-400"
                                : "border-blue-500/30 text-blue-500 bg-blue-500/5 dark:bg-blue-500/15 hover:bg-blue-500/25 active:scale-95"
                            }`}
                            title="Mark order as Approved"
                          >
                            <Check className="w-3 h-3 shrink-0" />
                            <span>Approve Order</span>
                          </button>

                          <button
                            onClick={() => confirmAndUpdateStatus(o.id || "", "delivered", o.name)}
                            disabled={o.status?.toLowerCase() === "delivered"}
                            className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1 transition-all ${
                              o.status?.toLowerCase() === "delivered"
                                ? "opacity-35 cursor-not-allowed border-neutral-200 dark:border-neutral-900 text-neutral-400"
                                : "border-green-500/30 text-green-500 bg-green-500/5 dark:bg-green-500/15 hover:bg-green-500/25 active:scale-95"
                            }`}
                            title="Mark order as Delivered"
                          >
                            <CheckCircle className="w-3 h-3 shrink-0" />
                            <span>Mark Delivered</span>
                          </button>

                          <button
                            onClick={() => handleDeleteOrder(o.id || "")}
                            className="p-2 border border-red-500/30 text-red-500 bg-red-500/5 dark:bg-red-500/15 hover:bg-red-500/25 rounded-xl transition-all active:scale-95"
                            title="Delete Order"
                          >
                            <Trash className="w-3.5 h-3.5 shrink-0" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
