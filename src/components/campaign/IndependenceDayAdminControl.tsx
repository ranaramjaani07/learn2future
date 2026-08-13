import React, { useState } from "react";
import { useIndependenceDayTheme, IndependenceDayConfig } from "../../context/IndependenceDayThemeContext";
import { AshokaChakraIcon } from "./AshokaChakraIcon";
import { Sparkles, Save, ShieldAlert, Eye, Power, Check, AlertCircle } from "lucide-react";

export const IndependenceDayAdminControl: React.FC<{ adminEmail?: string }> = ({ adminEmail = "admin@learn2future.com" }) => {
  const { config, isCampaignActive, isPreviewMode, updateConfig, setManualOverride } = useIndependenceDayTheme();

  const [formData, setFormData] = useState<IndependenceDayConfig>({ ...config });
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateConfig(formData, adminEmail);
      showStatus("Campaign theme settings updated & synced to Firestore!");
    } catch (err) {
      console.error(err);
      showStatus("Failed to save campaign settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleOverrideChange = async (override: "AUTO" | "ON" | "OFF" | "PREVIEW") => {
    setSaving(true);
    try {
      await setManualOverride(override, adminEmail);
      setFormData(prev => ({ ...prev, manualOverride: override }));
      showStatus(`Campaign mode changed to: ${override}`);
    } catch (err) {
      console.error(err);
      showStatus("Failed to update campaign state.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#0f0f0f] border border-amber-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden text-white select-none">
      
      {/* Background Subtle Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FF9933]/10 via-white/5 to-[#138808]/10 blur-3xl rounded-full pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF9933]/20 via-white/10 to-[#138808]/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <AshokaChakraIcon size={28} className="text-amber-400" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span>🇮🇳 80th Independence Day Campaign Theme</span>
            </h3>
            <p className="text-xs text-neutral-400 font-sans">
              Manage temporary Independence Day visual branding, countdown ticker, and coupon displays across the entire site.
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
            isCampaignActive 
              ? isPreviewMode 
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse" 
                : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse" 
              : "bg-neutral-800 text-neutral-400 border-neutral-700"
          }`}>
            {isCampaignActive 
              ? isPreviewMode ? "👁️ PREVIEW MODE ACTIVE" : "🟢 CAMPAIGN THEME LIVE" 
              : "🔴 THEME INACTIVE (NORMAL SITE)"}
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-2.5 rounded-xl text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Quick Mode Switchers & Emergency Kill Switch */}
      <div className="space-y-2">
        <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider block">
          Campaign Activation Mode:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          
          <button
            type="button"
            onClick={() => handleOverrideChange("AUTO")}
            disabled={saving}
            className={`px-4 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer flex flex-col items-center gap-1 ${
              formData.manualOverride === "AUTO"
                ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800"
            }`}
          >
            <span>⏰ AUTO SCHEDULER</span>
            <span className="text-[9px] text-neutral-500 font-normal">Active within dates</span>
          </button>

          <button
            type="button"
            onClick={() => handleOverrideChange("ON")}
            disabled={saving}
            className={`px-4 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer flex flex-col items-center gap-1 ${
              formData.manualOverride === "ON"
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800"
            }`}
          >
            <span className="flex items-center gap-1"><Power className="w-3.5 h-3.5" /> FORCE ON</span>
            <span className="text-[9px] text-neutral-500 font-normal">Publicly Live</span>
          </button>

          <button
            type="button"
            onClick={() => handleOverrideChange("PREVIEW")}
            disabled={saving}
            className={`px-4 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer flex flex-col items-center gap-1 ${
              formData.manualOverride === "PREVIEW"
                ? "bg-purple-500/20 border-purple-500 text-purple-300 shadow-md"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800"
            }`}
          >
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> ADMIN PREVIEW</span>
            <span className="text-[9px] text-neutral-500 font-normal">Admin eyes only</span>
          </button>

          <button
            type="button"
            onClick={() => handleOverrideChange("OFF")}
            disabled={saving}
            className={`px-4 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer flex flex-col items-center gap-1 ${
              formData.manualOverride === "OFF"
                ? "bg-red-500/20 border-red-500 text-red-300 shadow-md"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800"
            }`}
          >
            <span className="flex items-center gap-1 text-red-400"><ShieldAlert className="w-3.5 h-3.5" /> FORCE OFF</span>
            <span className="text-[9px] text-neutral-500 font-normal">Emergency Off</span>
          </button>

        </div>
      </div>

      {/* Form Details */}
      <form onSubmit={handleSave} className="space-y-4 pt-2">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-mono text-neutral-400 uppercase">Campaign Title / Name</label>
            <input
              type="text"
              value={formData.campaignName}
              onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
              placeholder="80th Independence Day Maha Sale"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-neutral-400 uppercase">Badge Label</label>
            <input
              type="text"
              value={formData.badgeText}
              onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
              placeholder="🇮🇳 80th Independence Day"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-mono text-neutral-400 uppercase">Start Timestamp (ISO / IST)</label>
            <input
              type="text"
              value={formData.startAt}
              onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:border-amber-500 outline-none"
              placeholder="2026-08-14T00:00:00+05:30"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-neutral-400 uppercase">End Timestamp (ISO / IST)</label>
            <input
              type="text"
              value={formData.endAt}
              onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:border-amber-500 outline-none"
              placeholder="2026-08-15T23:59:59+05:30"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-mono text-neutral-400 uppercase">Campaign Coupon Code</label>
            <input
              type="text"
              value={formData.couponCode}
              onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-amber-300 focus:border-amber-500 outline-none"
              placeholder="INDIA20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-neutral-400 uppercase">Announcement Banner Message</label>
            <input
              type="text"
              value={formData.bannerMessage}
              onChange={(e) => setFormData({ ...formData, bannerMessage: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
              placeholder="🇮🇳 80th Independence Day Maha Sale • Special Offers Live Now"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-mono text-neutral-400 uppercase">Background Video URL (Optional)</label>
            <input
              type="text"
              value={formData.videoUrl || ""}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:border-amber-500 outline-none"
              placeholder="https://assets.example.com/flag.mp4 (leave empty for mesh glow)"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-neutral-400 uppercase">Fallback Poster Image URL (Optional)</label>
            <input
              type="text"
              value={formData.posterUrl || ""}
              onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:border-amber-500 outline-none"
              placeholder="https://images.unsplash.com/photo-..."
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800">
          <div className="text-[11px] font-mono text-neutral-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Changes persist to Firestore instantly & restore automatically when disabled.</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "SAVING..." : "SAVE CAMPAIGN CONFIG"}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
