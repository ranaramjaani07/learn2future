import React, { useState } from "react";
import { useIndependenceDayTheme } from "../../context/IndependenceDayThemeContext";
import { IndependenceDayBackgroundVideo } from "./IndependenceDayBackgroundVideo";
import { IndependenceDayBadge } from "./IndependenceDayBadge";
import { AshokaChakraIcon } from "./AshokaChakraIcon";
import { ArrowRight, Sparkles, Copy, Check, ShieldCheck, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const IndependenceDayHeroBanner: React.FC = () => {
  const { config, countdown } = useIndependenceDayTheme();
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCopyCode = () => {
    if (config.couponCode) {
      navigator.clipboard.writeText(config.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#FF9933]/30 bg-[#0a0a0a] text-white my-6 shadow-[0_0_50px_rgba(255,153,51,0.12)] select-none">
      
      {/* Background Video & Tricolor Mesh */}
      <IndependenceDayBackgroundVideo overlayOpacity={0.80} />

      {/* Tricolor top and bottom border accents */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-16 lg:py-20 flex flex-col items-center text-center space-y-8">
        
        {/* Top Badge */}
        <IndependenceDayBadge variant="hero" label={config.badgeText || "80th Independence Day Maha Sale"} />

        {/* Main Headline & Ashoka Motif */}
        <div className="space-y-4 max-w-4xl mx-auto relative">
          
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-15 pointer-events-none">
            <AshokaChakraIcon size={180} className="text-amber-400 animate-spin-slow" />
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08]">
            <span className="block text-white drop-shadow-md">CELEBRATE FREEDOM.</span>
            <span className="bg-gradient-to-r from-[#FF9933] via-yellow-200 to-[#10B981] bg-clip-text text-transparent drop-shadow-lg">
              LEARN THE FUTURE.
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-neutral-300 max-w-2xl mx-auto font-sans leading-relaxed">
            {config.bannerMessage || "Up to 80% OFF on all AI, Video Editing & Digital Skill Mastertracks. Special Independence Day pricing active for a limited time."}
          </p>
        </div>

        {/* Live Countdown Timer Grid */}
        <div className="w-full max-w-xl bg-black/70 border border-amber-500/30 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-2xl space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400 border-b border-neutral-800 pb-2">
            <span className="flex items-center gap-1.5 font-bold text-amber-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>SPECIAL MAHA SALE ENDS IN:</span>
            </span>
            <span className="text-[11px] text-neutral-500 hidden sm:inline">OFFER EXPIRATION TICKER</span>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2 sm:p-3">
              <span className="block font-mono text-2xl sm:text-3xl font-black text-amber-400">{String(countdown.days).padStart(2, "0")}</span>
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Days</span>
            </div>
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2 sm:p-3">
              <span className="block font-mono text-2xl sm:text-3xl font-black text-amber-400">{String(countdown.hours).padStart(2, "0")}</span>
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Hours</span>
            </div>
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2 sm:p-3">
              <span className="block font-mono text-2xl sm:text-3xl font-black text-amber-400">{String(countdown.minutes).padStart(2, "0")}</span>
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Mins</span>
            </div>
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2 sm:p-3">
              <span className="block font-mono text-2xl sm:text-3xl font-black text-amber-400">{String(countdown.seconds).padStart(2, "0")}</span>
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Secs</span>
            </div>
          </div>
        </div>

        {/* Coupon Card & Actions Stack */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-lg">
          
          {/* Primary CTA */}
          <button
            onClick={() => navigate("/courses")}
            className="w-full sm:w-auto font-display font-black text-black bg-gradient-to-r from-[#FF9933] via-amber-400 to-[#10B981] hover:brightness-110 px-8 py-4 rounded-xl flex items-center justify-center gap-2 shadow-xl hover:shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer uppercase tracking-wider text-sm"
          >
            <span>EXPLORE THE SALE</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Copy Coupon Box */}
          {config.couponCode && (
            <button
              onClick={handleCopyCode}
              className="w-full sm:w-auto font-mono text-xs font-bold text-amber-300 bg-black/80 hover:bg-black/95 border border-amber-500/40 hover:border-amber-400 px-6 py-4 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-md group cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>USE CODE: <strong className="text-white text-sm font-black underline">{config.couponCode}</strong></span>
              {copied ? (
                <span className="text-emerald-400 flex items-center gap-1"><Check className="w-4 h-4" /> COPIED!</span>
              ) : (
                <Copy className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          )}

        </div>

        {/* Key Features / Guarantees Strip */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-neutral-400 border-t border-neutral-800/80 w-full max-w-2xl">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Verified Content</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Lifetime Access Passes</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Instant Digital Delivery</span>
          </div>
        </div>

      </div>

      {/* Tricolor bottom border accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />
    </div>
  );
};
