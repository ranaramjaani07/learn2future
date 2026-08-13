import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export interface IndependenceDayConfig {
  campaignId: string;
  enabled: boolean;
  manualOverride: "AUTO" | "ON" | "OFF" | "PREVIEW";
  campaignName: string;
  badgeText: string;
  startAt: string; // ISO string with offset e.g. "2026-08-14T00:00:00+05:30"
  endAt: string;   // ISO string e.g. "2026-08-15T23:59:59+05:30"
  couponCode: string; // e.g. "INDIA20"
  bannerMessage: string;
  discountText: string;
  videoUrl?: string;
  posterUrl?: string;
  updatedAt?: any;
}

export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isStarted: boolean;
  isEnded: boolean;
  formatted: string;
}

interface IndependenceDayThemeContextType {
  config: IndependenceDayConfig;
  isCampaignActive: boolean;
  isPreviewMode: boolean;
  countdown: CountdownState;
  updateConfig: (newConfig: Partial<IndependenceDayConfig>, adminEmail?: string) => Promise<void>;
  setManualOverride: (override: "AUTO" | "ON" | "OFF" | "PREVIEW", adminEmail?: string) => Promise<void>;
}

const DEFAULT_CONFIG: IndependenceDayConfig = {
  campaignId: "independence-day-2026",
  enabled: true,
  manualOverride: "AUTO",
  campaignName: "80th Independence Day Maha Sale",
  badgeText: "🇮🇳 80th Independence Day",
  startAt: "2026-08-14T00:00:00+05:30",
  endAt: "2026-08-15T23:59:59+05:30",
  couponCode: "INDIA20",
  bannerMessage: "🇮🇳 80th Independence Day Maha Sale • Special Offers Live Now",
  discountText: "Extra 20% OFF • Use Code: INDIA20",
  videoUrl: "",
  posterUrl: ""
};

const IndependenceDayThemeContext = createContext<IndependenceDayThemeContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "l2f_independence_day_config";

export const IndependenceDayThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<IndependenceDayConfig>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (_) {}
    return DEFAULT_CONFIG;
  });

  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Realtime clock ticker every second for accurate countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch campaign configuration from Firestore once on mount
  useEffect(() => {
    let isCancelled = false;
    async function loadRemoteConfig() {
      try {
        const docRef = doc(db, "settings", "independenceDayTheme");
        const snap = await getDoc(docRef);
        if (snap.exists() && !isCancelled) {
          const remoteData = snap.data() as Partial<IndependenceDayConfig>;
          const merged = { ...DEFAULT_CONFIG, ...remoteData };
          setConfig(merged);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        }
      } catch (err) {
        console.warn("[IndependenceDayTheme] Remote config load fallback to defaults:", err);
      }
    }
    loadRemoteConfig();
    return () => { isCancelled = true; };
  }, []);

  // Compute Active status and Countdown
  const { isCampaignActive, isPreviewMode, countdown } = useMemo(() => {
    const startTime = new Date(config.startAt).getTime();
    const endTime = new Date(config.endAt).getTime();

    const isStarted = nowTime >= startTime;
    const isEnded = nowTime > endTime;

    let active = false;
    let preview = false;

    if (config.manualOverride === "OFF") {
      active = false;
    } else if (config.manualOverride === "ON") {
      active = true;
    } else if (config.manualOverride === "PREVIEW") {
      active = true;
      preview = true;
    } else {
      // AUTO mode: active if enabled and current time is within range
      active = config.enabled && isStarted && !isEnded;
    }

    // Countdown target: if campaign hasn't started, count down to start; if active, count down to end.
    const targetTime = !isStarted ? startTime : endTime;
    const diff = Math.max(0, targetTime - nowTime);

    const secondsTotal = Math.floor(diff / 1000);
    const days = Math.floor(secondsTotal / (3600 * 24));
    const hours = Math.floor((secondsTotal % (3600 * 24)) / 3600);
    const minutes = Math.floor((secondsTotal % 3600) / 60);
    const seconds = secondsTotal % 60;

    const pad = (n: number) => String(n).padStart(2, "0");
    const formatted = days > 0 
      ? `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
      : `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;

    return {
      isCampaignActive: active,
      isPreviewMode: preview,
      countdown: {
        days,
        hours,
        minutes,
        seconds,
        isStarted,
        isEnded,
        formatted
      }
    };
  }, [config, nowTime]);

  const updateConfig = async (newConfigPartial: Partial<IndependenceDayConfig>) => {
    const updated = { ...config, ...newConfigPartial };
    setConfig(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      const docRef = doc(db, "settings", "independenceDayTheme");
      await setDoc(docRef, { ...updated, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error("[IndependenceDayTheme] Failed to persist config updates:", err);
    }
  };

  const setManualOverride = async (override: "AUTO" | "ON" | "OFF" | "PREVIEW") => {
    await updateConfig({ manualOverride: override });
  };

  return (
    <IndependenceDayThemeContext.Provider
      value={{
        config,
        isCampaignActive,
        isPreviewMode,
        countdown,
        updateConfig,
        setManualOverride
      }}
    >
      {children}
    </IndependenceDayThemeContext.Provider>
  );
};

export const useIndependenceDayTheme = (): IndependenceDayThemeContextType => {
  const context = useContext(IndependenceDayThemeContext);
  if (!context) {
    // Graceful fallback if component is used outside provider
    return {
      config: DEFAULT_CONFIG,
      isCampaignActive: false,
      isPreviewMode: false,
      countdown: {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isStarted: false,
        isEnded: false,
        formatted: "00h 00m 00s"
      },
      updateConfig: async () => {},
      setManualOverride: async () => {}
    };
  }
  return context;
};
