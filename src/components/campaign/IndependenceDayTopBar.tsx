import React, { useState } from "react";
import { useIndependenceDayTheme } from "../../context/IndependenceDayThemeContext";
import { ArrowRight, Copy, Check, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const IndependenceDayTopBar: React.FC = () => {
  const { isCampaignActive, config, countdown, isPreviewMode } = useIndependenceDayTheme();
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (!isCampaignActive || dismissed) return null;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (config.couponCode) {
      navigator.clipboard.writeText(config.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative z-50 w-full bg-neutral-950 border-b border-amber-500/30 text-white overflow-hidden shadow-xl select-none">
      {/* Tricolor top border ribbon */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      <div className="max-w-7xl mx-auto px-4 py-2 sm:py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-sans">
        
        {/* Left: Campaign Tagline & Live Indicator */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
          <span className="inline-flex items-center gap-1 bg-[#FF9933]/20 text-[#FF9933] border border-[#FF9933]/40 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase animate-pulse">
            <span>🇮🇳</span>
            <span>{config.badgeText || "80th Independence Day"}</span>
          </span>

          {isPreviewMode && (
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
              Admin Preview
            </span>
          )}

          <p className="font-semibold text-white/95 text-xs tracking-tight text-center sm:text-left">
            {config.bannerMessage}
          </p>
        </div>

        {/* Right: Coupon Code & Countdown & Action */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Coupon Code Pill */}
          {config.couponCode && (
            <button
              onClick={handleCopyCode}
              title="Click to copy coupon code"
              className="inline-flex items-center gap-1.5 bg-black/60 hover:bg-black/90 border border-amber-500/40 hover:border-amber-400 px-2.5 py-1 rounded-md text-[11px] font-mono text-amber-300 transition-all cursor-pointer group"
            >
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>CODE: <strong className="text-white underline">{config.couponCode}</strong></span>
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />}
            </button>
          )}

          {/* Countdown Pill */}
          <div className="hidden md:inline-flex items-center gap-1 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-md text-[11px] font-mono text-neutral-300">
            <span className="text-neutral-500 text-[10px]">ENDS IN:</span>
            <span className="text-amber-400 font-bold">{countdown.formatted}</span>
          </div>

          {/* Action CTA */}
          <button
            onClick={() => navigate("/courses")}
            className="bg-gradient-to-r from-[#FF9933] to-amber-500 hover:from-amber-500 hover:to-[#FF9933] text-black font-mono font-black text-[11px] uppercase tracking-wider px-3 py-1 rounded-md transition-all shadow-md hover:shadow-amber-500/20 flex items-center gap-1 cursor-pointer"
          >
            <span>VIEW OFFERS</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          {/* Dismiss Button */}
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-neutral-500 hover:text-white transition-colors"
            title="Dismiss announcement bar"
          >
            <X className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>
    </div>
  );
};
