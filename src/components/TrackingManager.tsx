import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { TrackingSettings } from "../types";
import {
  extractMetaPixelId,
  extractGtmId,
  extractGa4Id,
  extractSearchConsoleVerification,
  extractFacebookDomainVerification,
} from "../lib/trackingParser";

// Module-level cache: fetch tracking settings at most once every 30 minutes
let _cachedSettings: TrackingSettings | null = null;
let _lastFetchTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export const TrackingManager: React.FC = () => {
  const [settings, setSettings] = useState<TrackingSettings | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      // 1. Serve from module-level cache first (avoids Firestore reads on hot navigations)
      const now = Date.now();
      if (_cachedSettings && now - _lastFetchTime < CACHE_TTL) {
        if (!cancelled) setSettings(_cachedSettings);
        return;
      }

      // 2. Serve from localStorage while we fetch
      const stored = localStorage.getItem("tracking_settings_cache");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.ts && now - parsed.ts < CACHE_TTL) {
            if (!cancelled) setSettings(parsed.data);
            return; // Cache is fresh, skip Firestore read entirely
          }
          // Stale cache: show it while we refresh in background
          if (!cancelled) setSettings(parsed.data);
        } catch (_) {}
      }

      // 3. Single getDoc fetch (NOT onSnapshot — avoids persistent WebSocket)
      try {
        const snap = await getDoc(doc(db, "settings", "tracking"));
        if (cancelled) return;
        if (snap.exists()) {
          const data = snap.data() as TrackingSettings;
          _cachedSettings = data;
          _lastFetchTime = now;
          localStorage.setItem("tracking_settings_cache", JSON.stringify({ ts: now, data }));
          setSettings(data);
        }
      } catch (err) {
        console.warn("[TrackingManager] Firestore fetch failed (using cached/default):", err);
      }
    }

    loadSettings();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!settings) return;

    // Remove previously injected tags before re-injecting
    document.querySelectorAll("[data-tracking]").forEach((tag) => tag.remove());

    const head = document.head;
    const body = document.body;

    const cleanSearchConsole = extractSearchConsoleVerification(settings.searchConsoleVerification || "");
    const cleanGa4Id = extractGa4Id(settings.ga4Id || "");
    const cleanGtmId = extractGtmId(settings.gtmId || "");
    const cleanMetaPixelId = extractMetaPixelId(settings.metaPixelId || "");
    const cleanFbDomain = extractFacebookDomainVerification(settings.facebookDomainVerification || "");

    if (cleanSearchConsole) {
      const meta = document.createElement("meta");
      meta.name = "google-site-verification";
      meta.content = cleanSearchConsole;
      meta.setAttribute("data-tracking", "gsc");
      head.appendChild(meta);
    }

    if (cleanGa4Id) {
      const gaScript = document.createElement("script");
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${cleanGa4Id}`;
      gaScript.setAttribute("data-tracking", "ga4-lib");
      head.appendChild(gaScript);

      const gaInline = document.createElement("script");
      gaInline.setAttribute("data-tracking", "ga4-inline");
      gaInline.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${cleanGa4Id}');`;
      head.appendChild(gaInline);
    }

    if (cleanGtmId) {
      const gtmScript = document.createElement("script");
      gtmScript.setAttribute("data-tracking", "gtm-head");
      gtmScript.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${cleanGtmId}');`;
      head.prepend(gtmScript);

      const gtmNoscript = document.createElement("noscript");
      gtmNoscript.setAttribute("data-tracking", "gtm-body");
      gtmNoscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${cleanGtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
      body.prepend(gtmNoscript);
    }

    if (cleanMetaPixelId) {
      const pixelScript = document.createElement("script");
      pixelScript.setAttribute("data-tracking", "pixel-head");
      pixelScript.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${cleanMetaPixelId}');fbq('track','PageView');`;
      head.appendChild(pixelScript);
    }

    if (cleanFbDomain) {
      const meta = document.createElement("meta");
      meta.name = "facebook-domain-verification";
      meta.content = cleanFbDomain;
      meta.setAttribute("data-tracking", "facebook-verification");
      head.appendChild(meta);
    }
  }, [settings]);

  return null;
};
