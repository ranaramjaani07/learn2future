import React, { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { TrackingSettings } from "../types";
import {
  extractMetaPixelId,
  extractGtmId,
  extractGa4Id,
  extractSearchConsoleVerification,
  extractFacebookDomainVerification,
} from "../lib/trackingParser";

export const TrackingManager: React.FC = () => {
  const [settings, setSettings] = useState<TrackingSettings | null>(null);

  useEffect(() => {
    // 1. Load from demo LocalStorage as a fallback (for offline or immediate testing)
    const demoLocal = localStorage.getItem("demo_tracking_settings");
    if (demoLocal) {
      try {
        setSettings(JSON.parse(demoLocal));
      } catch (e) {
        console.error("Error parsing demo tracking settings:", e);
      }
    }

    // 2. Real-time Firestore sync with live catalog settings
    const settingsDocRef = doc(db, "settings", "tracking");
    const unsubscribe = onSnapshot(
      settingsDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as TrackingSettings;
          setSettings(data);
        } else {
          // If Firestore is empty / not seeded yet, default to local if exists
          if (!demoLocal) {
            setSettings({
              metaPixelId: "",
              gtmId: "",
              ga4Id: "",
              searchConsoleVerification: "",
              facebookDomainVerification: "",
            });
          }
        }
      },
      (error) => {
        console.warn("Firestore tracking settings read blocked by permission, normal for unauthenticated guests:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!settings) return;

    // --- PREVENT DUPLICATION / DYNAMIC HOT RE-INJECTION ---
    const existingTags = document.querySelectorAll("[data-tracking]");
    existingTags.forEach((tag) => tag.remove());

    const head = document.head;
    const body = document.body;

    // Extract exact IDs using robust tracking parser
    const cleanSearchConsole = extractSearchConsoleVerification(settings.searchConsoleVerification || "");
    const cleanGa4Id = extractGa4Id(settings.ga4Id || "");
    const cleanGtmId = extractGtmId(settings.gtmId || "");
    const cleanMetaPixelId = extractMetaPixelId(settings.metaPixelId || "");

    // 1. Google Search Console Verification Meta Tag
    if (cleanSearchConsole) {
      const meta = document.createElement("meta");
      meta.name = "google-site-verification";
      meta.content = cleanSearchConsole;
      meta.setAttribute("data-tracking", "gsc");
      head.appendChild(meta);
    }

    // 2. Google Analytics GA4 (gtag.js)
    if (cleanGa4Id) {
      // GA4 Library Loading tag
      const gaScript = document.createElement("script");
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${cleanGa4Id}`;
      gaScript.setAttribute("data-tracking", "ga4-lib");
      head.appendChild(gaScript);

      // GA4 Configuration inline code tag
      const gaInline = document.createElement("script");
      gaInline.setAttribute("data-tracking", "ga4-inline");
      gaInline.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){window.dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${cleanGa4Id}');
      `;
      head.appendChild(gaInline);
    }

    // 3. Google Tag Manager ID (GTM)
    if (cleanGtmId) {
      // GTM Head Script element
      const gtmScript = document.createElement("script");
      gtmScript.setAttribute("data-tracking", "gtm-head");
      gtmScript.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${cleanGtmId}');
      `;
      head.prepend(gtmScript);

      // GTM Body Noscript iframe element
      const gtmNoscript = document.createElement("noscript");
      gtmNoscript.setAttribute("data-tracking", "gtm-body");
      gtmNoscript.innerHTML = `
        <iframe src="https://www.googletagmanager.com/ns.html?id=${cleanGtmId}"
        height="0" width="0" style="display:none;visibility:hidden"></iframe>
      `;
      body.prepend(gtmNoscript);
    }

    // 4. Meta Pixel (Facebook Pixel ID)
    if (cleanMetaPixelId) {
      // Meta Pixel head script element
      const pixelScript = document.createElement("script");
      pixelScript.setAttribute("data-tracking", "pixel-head");
      pixelScript.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${cleanMetaPixelId}');
        fbq('track', 'PageView');
      `;
      head.appendChild(pixelScript);

      // Meta Pixel body noscript image element
      const pixelNoscript = document.createElement("noscript");
      pixelNoscript.setAttribute("data-tracking", "pixel-body");
      pixelNoscript.innerHTML = `
        <img height="1" width="1" style="display:none" 
        src="https://www.facebook.com/tr?id=${cleanMetaPixelId}&ev=PageView&noscript=1" />
      `;
      body.appendChild(pixelNoscript);
    }

    // 5. Facebook Domain Verification Meta Tag
    const cleanFacebookDomainVerification = extractFacebookDomainVerification(settings.facebookDomainVerification || "");
    if (cleanFacebookDomainVerification) {
      const meta = document.createElement("meta");
      meta.name = "facebook-domain-verification";
      meta.content = cleanFacebookDomainVerification;
      meta.setAttribute("data-tracking", "facebook-verification");
      head.appendChild(meta);
    }
  }, [settings]);

  return null;
};
