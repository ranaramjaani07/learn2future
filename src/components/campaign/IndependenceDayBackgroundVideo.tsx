import React, { useState, useEffect } from "react";
import { useIndependenceDayTheme } from "../../context/IndependenceDayThemeContext";

interface BackgroundVideoProps {
  videoUrl?: string;
  posterUrl?: string;
  overlayOpacity?: number; // 0 to 1, default 0.8
}

export const IndependenceDayBackgroundVideo: React.FC<BackgroundVideoProps> = ({
  videoUrl,
  posterUrl,
  overlayOpacity = 0.82
}) => {
  const { config } = useIndependenceDayTheme();
  const [videoFailed, setVideoFailed] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const activeVideoUrl = videoUrl || config.videoUrl;
  const activePosterUrl = posterUrl || config.posterUrl || "https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&q=80&w=1920";

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener?.("change", handleChange);
    return () => {
      mediaQuery.removeEventListener?.("change", handleChange);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 select-none">
      
      {/* Fallback & Poster Canvas */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
        style={{ backgroundImage: `url(${activePosterUrl})` }}
      />

      {/* Video Layer */}
      {activeVideoUrl && !videoFailed && !prefersReducedMotion && (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={activePosterUrl}
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity duration-1000"
        >
          <source src={activeVideoUrl} type="video/mp4" />
        </video>
      )}

      {/* Tricolor Ambient Mesh Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-[#FF9933]/25 blur-[140px] animate-pulse duration-1000" />
        <div className="absolute top-[30%] right-[10%] w-[600px] h-[600px] rounded-full bg-[#138808]/20 blur-[160px] animate-pulse duration-1000" />
        <div className="absolute bottom-[10%] left-[30%] w-[400px] h-[400px] rounded-full bg-white/10 blur-[120px]" />
      </div>

      {/* Dark Overlay Layer for Text Readability */}
      <div 
        className="absolute inset-0 bg-[#070707] backdrop-blur-[2px]"
        style={{ opacity: overlayOpacity }}
      />

      {/* Subtle Ashoka Chakra Radial Grid Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-60" />
    </div>
  );
};
