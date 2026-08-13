import React from "react";
import { AshokaChakraIcon } from "./AshokaChakraIcon";

interface IndependenceDayBadgeProps {
  variant?: "sale" | "hero" | "card" | "navbar";
  label?: string;
  className?: string;
}

export const IndependenceDayBadge: React.FC<IndependenceDayBadgeProps> = ({
  variant = "sale",
  label,
  className = ""
}) => {
  if (variant === "navbar") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/15 via-white/10 to-emerald-500/15 border border-amber-500/30 text-amber-300 shadow-sm ${className}`}>
        <span className="text-xs select-none">🇮🇳</span>
        <span>{label || "MAHA SALE"}</span>
      </span>
    );
  }

  if (variant === "card") {
    return (
      <div className={`inline-flex items-center gap-1.5 bg-black/85 text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-amber-500/40 text-amber-300 backdrop-blur-md shadow-md ${className}`}>
        <span className="text-xs">🇮🇳</span>
        <span>{label || "INDEPENDENCE DAY OFFER"}</span>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-widest bg-gradient-to-r from-[#FF9933]/20 via-white/10 to-[#138808]/20 border border-[#FF9933]/40 text-white backdrop-blur-md shadow-lg ${className}`}>
        <span className="text-sm">🇮🇳</span>
        <AshokaChakraIcon size={14} className="text-blue-400 animate-spin-slow" />
        <span className="bg-gradient-to-r from-[#FF9933] via-white to-[#138808] bg-clip-text text-transparent font-extrabold">
          {label || "80th Independence Day Maha Sale"}
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-[#FF9933]/15 border border-[#FF9933]/30 text-[#FF9933] ${className}`}>
      <span>🇮🇳</span>
      <span>{label || "80TH INDEPENDENCE DAY SPECIAL"}</span>
    </div>
  );
};
