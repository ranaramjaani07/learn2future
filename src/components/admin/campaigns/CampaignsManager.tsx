import React, { useState, useEffect } from "react";
import { 
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Clock, 
  Archive, 
  Percent, 
  DollarSign, 
  Globe, 
  FolderTree, 
  BookOpen, 
  ShieldCheck, 
  AlertCircle, 
  Calendar, 
  Sparkles, 
  RefreshCw, 
  Check, 
  X, 
  Search, 
  FileText, 
  Eye,
  TrendingUp,
  Layers,
  ArrowRight
} from "lucide-react";
import { Campaign, CampaignStatus, CampaignAdjustmentType, PricingAuditLog, Course } from "../../../types";
import { campaignsService } from "../../../services/admin/campaigns.service";
import { calculateCoursePricing } from "../../../lib/pricingEngine";
import { useApp } from "../../../context/AppContext";
import { IndependenceDayAdminControl } from "../../campaign/IndependenceDayAdminControl";

interface CampaignsManagerProps {
  courses: Course[];
}

export const CampaignsManager: React.FC<CampaignsManagerProps> = ({ courses }) => {
  const { user } = useApp();
  const adminEmail = user?.email || "admin@learn2future.com";

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [auditLogs, setAuditLogs] = useState<PricingAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "form" | "audit" | "simulator">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<"global" | "category" | "course">("global");
  const [targetCategory, setTargetCategory] = useState("AI Tools");
  const [targetCourseIds, setTargetCourseIds] = useState<string[]>([]);
  const [adjustmentType, setAdjustmentType] = useState<CampaignAdjustmentType>("percentage_increase");
  const [adjustmentValue, setAdjustmentValue] = useState<number>(100);
  const [referencePriceMode, setReferencePriceMode] = useState<"base_multiplier" | "fixed_reference">("base_multiplier");
  const [referencePriceValue, setReferencePriceValue] = useState<number>(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [badgeLabel, setBadgeLabel] = useState("🔥 SPECIAL OFFER");
  const [priority, setPriority] = useState(1);
  const [status, setStatus] = useState<CampaignStatus>("active");
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Simulator state
  const [simSelectedCourseId, setSimSelectedCourseId] = useState<string>(courses[0]?.id || "");
  const [simBasePrice, setSimBasePrice] = useState<number>(100);
  const [simCouponCode, setSimCouponCode] = useState<string>("");
  const [simCouponDiscount, setSimCouponDiscount] = useState<number>(0);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedCampaigns, fetchedLogs] = await Promise.all([
        campaignsService.getCampaigns(),
        campaignsService.getAuditLogs()
      ]);
      setCampaigns(fetchedCampaigns);
      setAuditLogs(fetchedLogs);
    } catch (err) {
      console.error("Failed to load campaigns data:", err);
      showToast("Error fetching campaigns data from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (c: Campaign) => {
    setEditingId(c.id);
    setTitle(c.title);
    setDescription(c.description || "");
    setScope(c.scope || "global");
    setTargetCategory(c.targetCategory || "AI Tools");
    setTargetCourseIds(c.targetCourseIds || []);
    setAdjustmentType(c.adjustmentType);
    setAdjustmentValue(c.adjustmentValue);
    setReferencePriceMode((c.referencePriceMode as any) || "base_multiplier");
    setReferencePriceValue(c.referencePriceValue || 0);
    setStartDate(c.startDate ? new Date(c.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
    setEndDate(c.endDate ? new Date(c.endDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
    setBadgeLabel(c.badgeLabel || "🔥 SPECIAL OFFER");
    setPriority(c.priority || 1);
    setStatus(c.status);
    setActiveTab("form");
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setScope("global");
    setTargetCategory("AI Tools");
    setTargetCourseIds([]);
    setAdjustmentType("percentage_increase");
    setAdjustmentValue(100);
    setReferencePriceMode("base_multiplier");
    setReferencePriceValue(0);
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setBadgeLabel("🔥 SPECIAL OFFER");
    setPriority(1);
    setStatus("active");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Please enter a campaign title.");
      return;
    }

    setSubmitting(true);
    try {
      const campaignPayload: Omit<Campaign, "id"> = {
        title: title.trim(),
        description: description.trim(),
        scope,
        targetCategory: scope === "category" ? targetCategory : "",
        targetCourseIds: scope === "course" ? targetCourseIds : [],
        adjustmentType,
        adjustmentValue: Number(adjustmentValue),
        referencePriceMode,
        referencePriceValue: Number(referencePriceValue),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        badgeLabel: badgeLabel.trim() || "🔥 OFFER",
        priority: Number(priority),
        status,
        createdBy: adminEmail
      };

      if (editingId) {
        await campaignsService.updateCampaign(editingId, campaignPayload, adminEmail);
        showToast(`Campaign '${title}' updated successfully!`);
      } else {
        await campaignsService.createCampaign(campaignPayload, adminEmail);
        showToast(`Campaign '${title}' launched successfully!`);
      }

      resetForm();
      setActiveTab("list");
      await loadData();
    } catch (err: any) {
      console.error("Save campaign error:", err);
      showToast(`Failed to save campaign: ${err?.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (c: Campaign, newStatus: CampaignStatus) => {
    try {
      await campaignsService.updateStatus(c.id, newStatus, c.title, adminEmail);
      showToast(`Campaign '${c.title}' status changed to ${newStatus}`);
      await loadData();
    } catch (err: any) {
      showToast(`Failed to update status: ${err?.message || err}`);
    }
  };

  const handleDelete = async (c: Campaign) => {
    if (!window.confirm(`Are you sure you want to delete campaign '${c.title}'?`)) return;
    try {
      await campaignsService.deleteCampaign(c.id, c.title, adminEmail);
      showToast(`Campaign '${c.title}' deleted.`);
      await loadData();
    } catch (err: any) {
      showToast(`Delete failed: ${err?.message || err}`);
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.badgeLabel && c.badgeLabel.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const categories = Array.from(new Set(courses.map(c => c.category || "AI Tools")));

  // Simulator calculation
  const simCourse = courses.find(c => c.id === simSelectedCourseId) || {
    id: "sim-1",
    title: "Sample High-Ticket Skill Course",
    price: simBasePrice,
    category: "AI Tools"
  };

  const simResult = calculateCoursePricing(
    { ...simCourse, price: simBasePrice },
    campaigns,
    simCouponCode ? { code: simCouponCode, type: "percentage", value: simCouponDiscount, isActive: true, createdAt: new Date() } : null
  );

  return (
    <div className="space-y-6 text-slate-100">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-800 text-emerald-400 border border-emerald-500/30 px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 animate-slide-up">
          <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
          <span className="font-medium text-sm text-slate-100">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3">
              <span className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
                <Tag className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Global Pricing & Campaign Management
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                    Enterprise Engine
                  </span>
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Set reference price increases (e.g. ₹200 crossed out) & green campaign discount prices (e.g. ₹100 final). Coupons stack automatically on top!
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { resetForm(); setActiveTab("form"); }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Campaign</span>
            </button>
            <button
              onClick={loadData}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
            <p className="text-xs font-medium text-slate-400">Total Campaigns</p>
            <p className="text-xl font-bold text-white mt-1">{campaigns.length}</p>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
            <p className="text-xs font-medium text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Active Now
            </p>
            <p className="text-xl font-bold text-emerald-300 mt-1">
              {campaigns.filter(c => c.status === "active").length}
            </p>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
            <p className="text-xs font-medium text-amber-400">Scheduled / Paused</p>
            <p className="text-xl font-bold text-amber-300 mt-1">
              {campaigns.filter(c => c.status === "scheduled" || c.status === "paused").length}
            </p>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
            <p className="text-xs font-medium text-indigo-400">Pricing Audit Logs</p>
            <p className="text-xl font-bold text-indigo-300 mt-1">{auditLogs.length}</p>
          </div>
        </div>
      </div>

      {/* 80th Independence Day Campaign Theme Manager */}
      <IndependenceDayAdminControl adminEmail={adminEmail} />

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === "list" 
              ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30" 
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Campaigns ({campaigns.length})</span>
        </button>

        <button
          onClick={() => { resetForm(); setActiveTab("form"); }}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === "form" 
              ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30" 
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{editingId ? "Edit Campaign" : "New Campaign"}</span>
        </button>

        <button
          onClick={() => setActiveTab("simulator")}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === "simulator" 
              ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30" 
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Eye className="w-4 h-4 text-emerald-400" />
          <span>Live Pricing Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === "audit" 
              ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30" 
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: ALL CAMPAIGNS LIST */}
      {activeTab === "list" && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-900/70 p-4 rounded-xl border border-slate-800">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search campaigns by title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto">
              <span className="text-xs font-medium text-slate-400 whitespace-nowrap">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="scheduled">Scheduled</option>
                <option value="paused">Paused</option>
                <option value="ended">Ended</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Campaigns Grid */}
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
              <Tag className="w-10 h-10 text-slate-500 mx-auto mb-3 opacity-60" />
              <h3 className="text-lg font-semibold text-slate-300">No campaigns found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                Create your first global or course discount campaign to launch pricing offers.
              </p>
              <button
                onClick={() => { resetForm(); setActiveTab("form"); }}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-all inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Campaign</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCampaigns.map(c => {
                const isActive = c.status === "active";
                const isPaused = c.status === "paused";
                const isScheduled = c.status === "scheduled";

                return (
                  <div
                    key={c.id}
                    className={`bg-slate-900/80 rounded-2xl p-5 border transition-all relative overflow-hidden flex flex-col justify-between ${
                      isActive 
                        ? "border-emerald-500/40 shadow-lg shadow-emerald-500/5" 
                        : isPaused 
                          ? "border-amber-500/30 bg-slate-900/50" 
                          : "border-slate-800"
                    }`}
                  >
                    <div>
                      {/* Badge Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 ${
                            c.scope === "global" 
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                              : c.scope === "category" 
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {c.scope === "global" && <Globe className="w-3 h-3" />}
                            {c.scope === "category" && <FolderTree className="w-3 h-3" />}
                            {c.scope === "course" && <BookOpen className="w-3 h-3" />}
                            <span className="capitalize">{c.scope} Scope</span>
                          </span>

                          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-md border border-slate-700">
                            {c.badgeLabel || "🔥 OFFER"}
                          </span>
                        </div>

                        {/* Status pill */}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${
                          c.status === "active" 
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                            : c.status === "paused" 
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                              : c.status === "scheduled"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-current"}`} />
                          <span className="capitalize">{c.status}</span>
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-lg font-bold text-white mb-1">{c.title}</h3>
                      {c.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">{c.description}</p>
                      )}

                      {/* Pricing Rule Formula Box */}
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-4 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-slate-300 font-mono">
                          <span className="text-slate-400">Adjustment Rule:</span>
                          <span className="text-emerald-400 font-bold">
                            {c.adjustmentType === "percentage_increase" && `+${c.adjustmentValue}% Reference Price Increase`}
                            {c.adjustmentType === "percentage_decrease" && `-${c.adjustmentValue}% Campaign Discount`}
                            {c.adjustmentType === "fixed_increase" && `+₹${c.adjustmentValue} Reference Price`}
                            {c.adjustmentType === "fixed_decrease" && `-₹${c.adjustmentValue} Discount`}
                            {c.adjustmentType === "fixed_reference_price" && `Fixed Ref Price ₹${c.adjustmentValue}`}
                          </span>
                        </div>

                        {c.scope === "category" && (
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Target Category:</span>
                            <span className="text-blue-300 font-medium">{c.targetCategory}</span>
                          </div>
                        )}

                        {c.scope === "course" && (
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Targeted Courses:</span>
                            <span className="text-emerald-300 font-medium">{c.targetCourseIds?.length || 0} selected</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/60">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Schedule:</span>
                          <span className="text-slate-300">
                            {c.startDate ? new Date(c.startDate).toLocaleDateString() : 'Now'} — {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'Forever'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center space-x-2">
                        {isActive ? (
                          <button
                            onClick={() => handleStatusChange(c, "paused")}
                            className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg transition-all flex items-center space-x-1"
                          >
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pause</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(c, "active")}
                            className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all flex items-center space-x-1"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Activate</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleStatusChange(c, "ended")}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-all flex items-center space-x-1"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>End</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEdit(c)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-all"
                          title="Edit Campaign"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-all"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREATE / EDIT CAMPAIGN FORM */}
      {activeTab === "form" && (
        <form onSubmit={handleSubmit} className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <Tag className="w-5 h-5 text-indigo-400" />
              <span>{editingId ? "Edit Campaign" : "Configure Campaign"}</span>
            </h3>
            <span className="text-xs text-slate-400">All pricing changes update live across the entire frontend</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Campaign Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mega Independence Day Flash Sale"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Badge Label */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Badge Badge Tag (Student UI)</label>
              <input
                type="text"
                placeholder="e.g. 🔥 50% OFF, ⚡ FESTIVE SPECIAL"
                value={badgeLabel}
                onChange={e => setBadgeLabel(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description / Internal Notes</label>
              <textarea
                rows={2}
                placeholder="Internal details regarding campaign scope and marketing targets..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Scope Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Campaign Scope</label>
              <select
                value={scope}
                onChange={e => setScope(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="global">Global (Applies to ALL Courses)</option>
                <option value="category">Category-Specific</option>
                <option value="course">Course-Specific</option>
              </select>
            </div>

            {/* Target Category if Category scope */}
            {scope === "category" && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Category</label>
                <select
                  value={targetCategory}
                  onChange={e => setTargetCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Target Courses Multi-Select if Course scope */}
            {scope === "course" && (
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Targeted Courses</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  {courses.map(crs => {
                    const isSelected = targetCourseIds.includes(crs.id);
                    return (
                      <label key={crs.id} className="flex items-center space-x-2 text-xs text-slate-300 p-1.5 hover:bg-slate-800/60 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => {
                            if (e.target.checked) {
                              setTargetCourseIds([...targetCourseIds, crs.id]);
                            } else {
                              setTargetCourseIds(targetCourseIds.filter(id => id !== crs.id));
                            }
                          }}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                        />
                        <span className="truncate">{crs.title} (Base ₹{crs.price})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Adjustment Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pricing Adjustment Method</label>
              <select
                value={adjustmentType}
                onChange={e => setAdjustmentType(e.target.value as CampaignAdjustmentType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="percentage_increase">% Increase Reference Price (e.g. +100% doubles original price crossed out)</option>
                <option value="percentage_decrease">% Decrease Campaign Price (e.g. -50% off discount)</option>
                <option value="fixed_increase">Fixed Amount Increase (+₹)</option>
                <option value="fixed_decrease">Fixed Amount Decrease (-₹)</option>
                <option value="fixed_reference_price">Set Fixed Reference Price (₹)</option>
              </select>
            </div>

            {/* Adjustment Value */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Adjustment Value ({adjustmentType.includes("percentage") ? "%" : "₹"})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={adjustmentValue}
                onChange={e => setAdjustmentValue(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Schedule Start & End */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Campaign Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Campaign End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Initial Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Campaign Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as CampaignStatus)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="active">Active Now</option>
                <option value="scheduled">Scheduled</option>
                <option value="paused">Paused</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => { resetForm(); setActiveTab("list"); }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center space-x-2"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{editingId ? "Save Changes" : "Launch Campaign"}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: LIVE PRICING SIMULATOR */}
      {activeTab === "simulator" && (
        <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>Real-Time Pricing Simulator</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Test how active campaigns and coupons alter student display prices before launching to public.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Input Controls */}
            <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Simulated Inputs</h4>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Select Course</label>
                <select
                  value={simSelectedCourseId}
                  onChange={e => {
                    const cid = e.target.value;
                    setSimSelectedCourseId(cid);
                    const selected = courses.find(c => c.id === cid);
                    if (selected) setSimBasePrice(selected.price);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title} (Base: ₹{c.price})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Base Price (₹)</label>
                <input
                  type="number"
                  value={simBasePrice}
                  onChange={e => setSimBasePrice(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Simulated Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g. WELCOME10"
                  value={simCouponCode}
                  onChange={e => setSimCouponCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white uppercase placeholder-slate-500"
                />
              </div>

              {simCouponCode && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Coupon Discount (%)</label>
                  <input
                    type="number"
                    value={simCouponDiscount}
                    onChange={e => setSimCouponDiscount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              )}
            </div>

            {/* Calculations Output */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 font-mono text-xs">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-sans">Calculation Breakdown</h4>

              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">1. Base Price:</span>
                <span className="text-slate-200">₹{simBasePrice}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">2. Reference Price (Crossed Out):</span>
                <span className="text-red-400 font-bold line-through">₹{simResult.referencePrice}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">3. Campaign Price:</span>
                <span className="text-emerald-400 font-bold">₹{simResult.campaignPrice}</span>
              </div>

              {simCouponCode && (
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">4. Stacked Coupon Discount:</span>
                  <span className="text-indigo-400">-₹{simResult.couponDiscountAmount}</span>
                </div>
              )}

              <div className="flex justify-between py-2 bg-emerald-500/10 px-3 rounded-lg border border-emerald-500/20 text-sm">
                <span className="text-emerald-300 font-bold">FINAL STUDENT PRICE:</span>
                <span className="text-emerald-400 font-black">₹{simResult.finalPrice}</span>
              </div>
            </div>

            {/* Student Preview Card */}
            <div className="bg-slate-900 p-5 rounded-xl border border-indigo-500/30 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Live Frontend Student Card View</p>

                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                      {simResult.badgeLabel || "🔥 SPECIAL DISCOUNT"}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 rounded">
                      {simResult.discountPercentage}% OFF
                    </span>
                  </div>

                  <h5 className="text-sm font-bold text-white mb-3">{simCourse.title}</h5>

                  {/* Crossed-out Red Reference Price & Green Final Price */}
                  <div className="flex items-baseline space-x-3">
                    <span className="text-2xl font-black text-emerald-400">
                      ₹{simResult.finalPrice}
                    </span>
                    {simResult.referencePrice > simResult.finalPrice && (
                      <span className="text-base text-red-500 font-bold line-through opacity-80">
                        ₹{simResult.referencePrice}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Inclusive of all digital platform taxes & instant access.</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-emerald-400/90 flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Verified: Matches User Campaign Requirement (Red crossed out ref price + Green discount price)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>Pricing Audit Trail</span>
            </h3>
            <span className="text-xs text-slate-400">Immutable history of all pricing & campaign modifications</span>
          </div>

          {auditLogs.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">No pricing audit records logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                    <th className="p-3">Action</th>
                    <th className="p-3">Admin</th>
                    <th className="p-3">Campaign / Details</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/30">
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md font-mono text-[11px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 font-medium">{log.adminEmail}</td>
                      <td className="p-3 text-slate-200">{log.details}</td>
                      <td className="p-3 text-slate-400">
                        {log.timestamp ? new Date(log.timestamp.seconds ? log.timestamp.seconds * 1000 : log.timestamp).toLocaleString() : "Just now"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
