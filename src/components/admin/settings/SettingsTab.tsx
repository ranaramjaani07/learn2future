import React from "react";
import { ShieldCheck, Check, Upload, X } from "lucide-react";
import { User } from "firebase/auth";
import {
  extractMetaPixelId,
  extractGtmId,
  extractGa4Id,
  extractSearchConsoleVerification,
  extractFacebookDomainVerification,
} from "../../../lib/trackingParser";

interface SettingsTabProps {
  // Tracking
  metaPixelId: string;
  setMetaPixelId: (val: string) => void;
  gtmId: string;
  setGtmId: (val: string) => void;
  ga4Id: string;
  setGa4Id: (val: string) => void;
  searchConsoleVerification: string;
  setSearchConsoleVerification: (val: string) => void;
  facebookDomainVerification: string;
  setFacebookDomainVerification: (val: string) => void;
  savingSettings: boolean;
  handleSaveTrackingSettings: (e: React.FormEvent) => void;
  handleResetTrackingSettings: () => void;

  // Razorpay
  razorpayKeyId: string;
  setRazorpayKeyId: (val: string) => void;
  razorpayKeySecret: string;
  setRazorpayKeySecret: (val: string) => void;
  razorpayWebhookSecret: string;
  setRazorpayWebhookSecret: (val: string) => void;
  isTestMode: boolean;
  setIsTestMode: (val: boolean) => void;
  isLiveMode: boolean;
  setIsLiveMode: (val: boolean) => void;
  enablePaymentSandbox: boolean;
  setEnablePaymentSandbox: (val: boolean) => void;
  savingPaymentSettings: boolean;
  handleSavePaymentSettings: (e: React.FormEvent) => void;

  // Business / Brand
  upiId: string;
  setUpiId: (val: string) => void;
  upiAccountName: string;
  setUpiAccountName: (val: string) => void;
  upiQrCode: string;
  setUpiQrCode: (val: string) => void;
  handleQrCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingQrCode: boolean;
  qrCodeProgress: number | null;
  paymentInstructions: string;
  setPaymentInstructions: (val: string) => void;
  telegramChannelLink: string;
  setTelegramChannelLink: (val: string) => void;
  telegramSupportLink: string;
  setTelegramSupportLink: (val: string) => void;
  telegramUsername: string;
  setTelegramUsername: (val: string) => void;
  instagramLink: string;
  setInstagramLink: (val: string) => void;
  youtubeLink: string;
  setYoutubeLink: (val: string) => void;
  supportEmail: string;
  setSupportEmail: (val: string) => void;
  brandLogoUrl: string;
  setBrandLogoUrl: (val: string) => void;
  handleBrandLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingBrandLogo: boolean;
  brandLogoProgress: number | null;
  ogDefaultImageUrl: string;
  setOgDefaultImageUrl: (val: string) => void;
  handleOgDefaultImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingOgImage: boolean;
  ogImageProgress: number | null;
  twitterPreviewImageUrl: string;
  setTwitterPreviewImageUrl: (val: string) => void;
  handleTwitterPreviewImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingTwitterImage: boolean;
  twitterImageProgress: number | null;
  defaultCardTitle: string;
  setDefaultCardTitle: (val: string) => void;
  defaultCardDescription: string;
  setDefaultCardDescription: (val: string) => void;
  savingBusinessSettings: boolean;
  handleSaveBusinessSettings: (e: React.FormEvent) => void;

  // Core Auth & UI
  user: User | null;
  showToast: (msg: string) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  metaPixelId,
  setMetaPixelId,
  gtmId,
  setGtmId,
  ga4Id,
  setGa4Id,
  searchConsoleVerification,
  setSearchConsoleVerification,
  facebookDomainVerification,
  setFacebookDomainVerification,
  savingSettings,
  handleSaveTrackingSettings,
  handleResetTrackingSettings,

  razorpayKeyId,
  setRazorpayKeyId,
  razorpayKeySecret,
  setRazorpayKeySecret,
  razorpayWebhookSecret,
  setRazorpayWebhookSecret,
  isTestMode,
  setIsTestMode,
  isLiveMode,
  setIsLiveMode,
  enablePaymentSandbox,
  setEnablePaymentSandbox,
  savingPaymentSettings,
  handleSavePaymentSettings,

  upiId,
  setUpiId,
  upiAccountName,
  setUpiAccountName,
  upiQrCode,
  setUpiQrCode,
  handleQrCodeChange,
  uploadingQrCode,
  qrCodeProgress,
  paymentInstructions,
  setPaymentInstructions,
  telegramChannelLink,
  setTelegramChannelLink,
  telegramSupportLink,
  setTelegramSupportLink,
  telegramUsername,
  setTelegramUsername,
  instagramLink,
  setInstagramLink,
  youtubeLink,
  setYoutubeLink,
  supportEmail,
  setSupportEmail,
  brandLogoUrl,
  setBrandLogoUrl,
  handleBrandLogoChange,
  uploadingBrandLogo,
  brandLogoProgress,
  ogDefaultImageUrl,
  setOgDefaultImageUrl,
  handleOgDefaultImageChange,
  uploadingOgImage,
  ogImageProgress,
  twitterPreviewImageUrl,
  setTwitterPreviewImageUrl,
  handleTwitterPreviewImageChange,
  uploadingTwitterImage,
  twitterImageProgress,
  defaultCardTitle,
  setDefaultCardTitle,
  defaultCardDescription,
  setDefaultCardDescription,
  savingBusinessSettings,
  handleSaveBusinessSettings,

  user,
  showToast
}) => {
  const validateTelegramUrl = (url: string) => {
    return url.startsWith("https://t.me/");
  };

  const validateUpiId = (upi: string) => {
    return upi.includes("@");
  };

  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200" id="admin-settings-tab">
      <div>
        <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Tracking & Analytics Settings</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Configure global marketing pixels, Google Tag Manager scripts, GA4 tracking codes, and Search Console verification. Only admins can access this section.</p>
      </div>

      <form onSubmit={handleSaveTrackingSettings} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Meta Pixel Card */}
          <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Meta Pixel ID</h4>
                <span className="text-[10px] text-neutral-500 block">Injects Meta (Facebook) Pixel tracking code in the head.</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="metaPixelId">Pixel ID</label>
              <input
                id="metaPixelId"
                type="text"
                placeholder="e.g. 123456789012345"
                value={metaPixelId}
                onChange={(e) => setMetaPixelId(extractMetaPixelId(e.target.value))}
                className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                💡 paste either 15-digit ID or the complete pixel script. It auto-extracts.
              </span>
            </div>
          </div>

          {/* Google Tag Manager Card */}
          <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-teal-500/10 text-teal-500 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Google Tag Manager (GTM)</h4>
                <span className="text-[10px] text-neutral-500 block">Injects GTM script in the head and the iframe noscript tag in the body.</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="gtmId">GTM Container ID</label>
              <input
                id="gtmId"
                type="text"
                placeholder="e.g. GTM-XXXXXXX"
                value={gtmId}
                onChange={(e) => setGtmId(extractGtmId(e.target.value))}
                className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                💡 paste Container ID (e.g., GTM-K2S9Z) or the whole GTM code snippet.
              </span>
            </div>
          </div>

          {/* Google Analytics GA4 Card */}
          <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/10 text-green-500 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Google Analytics GA4</h4>
                <span className="text-[10px] text-neutral-500 block">Dynamically loads gtag.js library and registers PageView configurations.</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="ga4Id">GA4 Measurement ID</label>
              <input
                id="ga4Id"
                type="text"
                placeholder="e.g. G-XXXXXXXXXX"
                value={ga4Id}
                onChange={(e) => setGa4Id(extractGa4Id(e.target.value))}
                className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                💡 paste G-XXXXXX Measurement ID or copy-paste the whole dynamic gtag block.
              </span>
            </div>
          </div>

          {/* Google Search Console Card */}
          <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 8h16" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Google Search Console</h4>
                <span className="text-[10px] text-neutral-500 block">Injects site ownership verification meta-tag inside the HTML head.</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="searchVerification">Verification Content Code</label>
              <input
                id="searchVerification"
                type="text"
                placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j"
                value={searchConsoleVerification}
                onChange={(e) => setSearchConsoleVerification(extractSearchConsoleVerification(e.target.value))}
                className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                💡 paste either verification content string or full site-verification meta HTML tag.
              </span>
            </div>
          </div>

          {/* Facebook Domain Verification Card */}
          <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Facebook Domain Verification</h4>
                <span className="text-[10px] text-neutral-500 block">Used for Facebook Business Manager domain ownership verification.</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="facebookDomainVerification">Domain Verification Code</label>
              <input
                id="facebookDomainVerification"
                type="text"
                placeholder="e.g. facebook-domain-verification=xxxxxxxxxxxxxxxxxxxxxxxx"
                value={facebookDomainVerification}
                onChange={(e) => setFacebookDomainVerification(extractFacebookDomainVerification(e.target.value))}
                className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                💡 Paste the Facebook domain verification meta tag content value or the complete meta tag.
              </span>
            </div>
          </div>

        </div>

        {/* Form Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-200 dark:border-brand-border select-none">
          <div className="flex items-center space-x-2 text-[11px] text-neutral-500">
            <ShieldCheck className="w-4 h-4 text-brand-gold" />
            <span>Configuration actions write directly to isolated settings collections in Firestore.</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto font-display">
            <button
              type="button"
              onClick={handleResetTrackingSettings}
              disabled={savingSettings}
              className="w-full sm:w-auto text-center border border-red-500/30 text-red-500 hover:bg-red-500/10 font-semibold text-xs py-3 px-6 rounded-xl transition-all"
            >
              Reset Settings
            </button>
            <button
              type="submit"
              disabled={savingSettings}
              className="w-full sm:w-auto text-center bg-brand-gold hover:bg-brand-gold-hover text-black font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-brand-gold/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {savingSettings ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>

      {/* SECTION SPLITTER */}
      <div className="pt-8 border-t border-neutral-200 dark:border-brand-border/60"></div>

      {/* AUTOMATED PAYMENT GATEWAY SETTINGS */}
      <div>
        <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Payment Gateway Settings (Automated Razorpay API)</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Configure central credentials for automated course unlocking, real-time checkout popups, and secure signature validations. Only admins can view or update this section.</p>
      </div>

      <form onSubmit={handleSavePaymentSettings} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Razorpay Key ID Card */}
          <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#F5B300]/10 text-brand-gold rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white font-display">Razorpay Key ID</h4>
                <span className="text-[10px] text-neutral-500 block">The API Key ID generated on your Merchant dashboard (used for frontend checkout dialog).</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="rzpKeyId">Key ID</label>
              <input
                id="rzpKeyId"
                type="text"
                placeholder="rzp_test_xxxxxxxxxxxx or rzp_live_xxxxxxxxxxxx"
                value={razorpayKeyId}
                onChange={(e) => setRazorpayKeyId(e.target.value.trim())}
                className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
              />
            </div>
          </div>

          {/* Razorpay Key Secret Card */}
          <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white font-display">Razorpay Key Secret</h4>
                <span className="text-[10px] text-neutral-500 block">Secure merchant key secret (kept strictly protected and validated on the backend environment).</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="rzpKeySecret">Key Secret</label>
              <input
                id="rzpKeySecret"
                type="password"
                placeholder="••••••••••••••••••••••••"
                value={razorpayKeySecret}
                onChange={(e) => setRazorpayKeySecret(e.target.value.trim())}
                className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
              />
            </div>
          </div>

          {/* Razorpay Webhook Secret Card */}
          <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-teal-500/10 text-teal-500 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white font-display">Razorpay Webhook Secret (Optional)</h4>
                <span className="text-[10px] text-neutral-500 block">Verifies background webhook payloads for supplementary payment sync safety.</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="rzpWebhook">Webhook Secret Token</label>
              <input
                id="rzpWebhook"
                type="text"
                placeholder="e.g. your_webhook_payment_secret"
                value={razorpayWebhookSecret}
                onChange={(e) => setRazorpayWebhookSecret(e.target.value.trim())}
                className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
              />
            </div>
            
            {/* Interactive Callback URL helper */}
            <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-[#222] rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Your webhook callback url</span>
                <button
                  type="button"
                  onClick={() => {
                    const dynamicUrl = window.location.origin + "/api/pay/webhook";
                    navigator.clipboard.writeText(dynamicUrl).then(() => {
                      showToast("Webhook callback URL successfully copied to clipboard!");
                    }).catch(() => {
                      showToast("Could not copy automatically. Please select it manually.");
                    });
                  }}
                  className="text-[10px] text-brand-gold hover:opacity-80 font-medium cursor-pointer transition-opacity"
                >
                  Copy Callback URL
                </button>
              </div>
              <p className="text-xs font-mono text-neutral-700 dark:text-neutral-400 break-all bg-white dark:bg-[#0B0B0B] p-2 rounded-lg border border-neutral-200/40 dark:border-brand-border/40 select-all">
                {window.location.origin + "/api/pay/webhook"}
              </p>
              <p className="text-[9px] text-neutral-400 leading-relaxed">
                Copy this URL and add it under <strong>Webhooks</strong> in your Razorpay Dashboard. Set active events to <code>order.paid</code>, and create a secret that you paste above.
              </p>
            </div>
          </div>

          {/* Mode Toggles Card */}
          <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#F5B300]/10 text-brand-gold rounded-xl bg-purple-500/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white font-display">Gateway Mode Environment</h4>
                <span className="text-[10px] text-neutral-500 block">Select active state to isolate sandbox testing from primary customer transactions.</span>
              </div>
            </div>
            <div className="flex items-center gap-6 justify-start py-2 select-none">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTestMode}
                  onChange={(e) => {
                    setIsTestMode(e.target.checked);
                    if (e.target.checked) setIsLiveMode(false);
                  }}
                  className="w-4 h-4 accent-brand-gold rounded cursor-pointer"
                />
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Sandbox Test Mode</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLiveMode}
                  onChange={(e) => {
                    setIsLiveMode(e.target.checked);
                    if (e.target.checked) setIsTestMode(false);
                  }}
                  className="w-4 h-4 accent-brand-gold rounded cursor-pointer"
                />
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Live Production Mode</span>
              </label>
            </div>
            <span className="text-[10px] text-neutral-400 block pt-1 leading-relaxed">
              💡 Ensure Key Secret corresponds to the exact environment toggled above (Test vs Live).
            </span>

            {user?.email?.toLowerCase() === "digitalcoursesbay@gmail.com" && (
              <div className="pt-3 border-t border-neutral-100 dark:border-[#222] space-y-1">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePaymentSandbox}
                    onChange={(e) => setEnablePaymentSandbox(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block font-display">Enable Payment Sandbox (Super Admin Override)</span>
                    <span className="text-[10px] text-neutral-500 block">Allow checkout simulations for quick sandbox debugging. Stripped automatically in PRODUCTION.</span>
                  </div>
                </label>
              </div>
            )}
          </div>

        </div>

        {/* Form Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-200 dark:border-brand-border select-none animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 text-[11px] text-neutral-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Dynamic parameters are parsed and cached onto server instances immediately on save.</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto font-display">
            <button
              type="submit"
              disabled={savingPaymentSettings}
              className="w-full sm:w-auto text-center bg-brand-gold hover:bg-brand-gold-hover text-black font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-brand-gold/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {savingPaymentSettings ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Parameters...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Gateway Settings</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>

      {/* SECTION SPLITTER */}
      <div className="pt-8 border-t border-neutral-200 dark:border-brand-border/60"></div>

      {/* NEW SECTION: GLOBAL BUSINESS SETTINGS */}
      <div>
        <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Global Business Settings</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Configure global payment details, copy buttons, direct support channels, and social media handles. Every page dynamically updates instantly.</p>
      </div>

      <form onSubmit={handleSaveBusinessSettings} className="space-y-6 pb-12">
        
        {/* 1. Payment Settings Subgroup */}
        <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-6">
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <div className="w-1.5 h-3 bg-brand-gold rounded"></div>
              Payment & UPI Settings
            </h4>
            <p className="text-[10px] text-neutral-500 mt-0.5">Control the details shown on step 1 of the enrollment page.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* UPI ID */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider" htmlFor="upiIdInput">
                UPI ID <span className="text-red-500">*</span>
              </label>
              <input
                id="upiIdInput"
                type="text"
                placeholder="e.g. digitalcoursesbay@upi"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className={`w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border ${upiId && !validateUpiId(upiId) ? "border-red-500" : "border-neutral-200 dark:border-brand-border"} text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono`}
              />
              {upiId && !validateUpiId(upiId) && (
                <p className="text-[10px] text-red-500 font-mono">Invalid Format: Must contain '@'.</p>
              )}
            </div>

            {/* UPI Account Name */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider" htmlFor="upiAccountNameInput">
                Account Holder Name <span className="text-red-500">*</span>
              </label>
              <input
                id="upiAccountNameInput"
                type="text"
                placeholder="e.g. Learn 2 Future"
                required
                value={upiAccountName}
                onChange={(e) => setUpiAccountName(e.target.value)}
                className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
          </div>

          {/* QR Code Upload / Replace / Preview and Clear block */}
          <div className="p-4 bg-neutral-50 dark:bg-[#0E0E0E] rounded-xl border border-neutral-200 dark:border-[#1d1d1d]/85 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* QR Code Preview */}
            <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-black/35 rounded-xl border border-neutral-200 dark:border-brand-border max-w-[170px] mx-auto w-full">
              <span className="text-[9px] font-mono text-neutral-400 uppercase font-bold mb-2">QR Code Preview</span>
              {upiQrCode ? (
                <div className="relative group">
                  <img
                    src={upiQrCode}
                    alt="Merchant UPI QR Preview"
                    className="w-28 h-28 object-contain rounded-lg border border-neutral-150 dark:border-neutral-900 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Are you sure you want to remove the current QR code visual?")) {
                        setUpiQrCode("");
                      }
                    }}
                    className="absolute -top-1.5 -right-1.5 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow active:scale-90"
                    title="Remove QR code"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-28 h-28 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 bg-neutral-50/50 dark:bg-neutral-950/20">
                  <ShieldCheck className="w-6 h-6 stroke-[1.5] mb-1" />
                  <span className="text-[8px] font-mono uppercase font-bold">No Image</span>
                </div>
              )}
            </div>

            {/* QR Code Controllers */}
            <div className="md:col-span-2 space-y-3">
              <div>
                <span className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 p-0">UPI Merchant QR Code</span>
                <p className="text-[10px] text-neutral-500 font-light mt-0.5">Upload a square PNG or JPG invoice QR code to let clients scan and pay instantly via Paytm, PhonePe, GPay, etc.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <label className="flex items-center gap-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-850 dark:text-white font-semibold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95">
                  <Upload className="w-3.5 h-3.5" />
                  {upiQrCode ? "Replace QR Code Image" : "Upload QR Code Image"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrCodeChange}
                    className="hidden"
                  />
                </label>

                {upiQrCode && (
                  <button
                    type="button"
                    onClick={() => setUpiQrCode("")}
                    className="border border-red-500/25 hover:bg-red-500/10 text-red-500 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all"
                  >
                    Remove QR Code
                  </button>
                )}
              </div>

              {uploadingQrCode && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span>Uploading QR Code image to Storage...</span>
                    <span>{qrCodeProgress !== null ? `${qrCodeProgress}%` : "Creating task..."}</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-brand-gold h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${qrCodeProgress || 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Payment Instructions block */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider" htmlFor="paymentInstructionsInput">
              Payment / Step Instructions
            </label>
            <textarea
              id="paymentInstructionsInput"
              rows={3}
              placeholder="Enter steps or guidelines for your customers (e.g. 1. Scan QR..."
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-sans resize-y"
            />
          </div>

        </div>

        {/* 2. Telegram Settings subgroup */}
        <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-6">
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <div className="w-1.5 h-3 bg-brand-gold rounded"></div>
              Telegram Integration Settings
            </h4>
            <p className="text-[10px] text-neutral-500 mt-0.5">Control Telegram buttons, support linkages, and channels across the brand platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Channel Link */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider" htmlFor="telegramChannelLinkInput">
                Telegram Channel Link <span className="text-red-500">*</span>
              </label>
              <input
                id="telegramChannelLinkInput"
                type="text"
                placeholder="e.g. https://t.me/LearntoFuture"
                required
                value={telegramChannelLink}
                onChange={(e) => setTelegramChannelLink(e.target.value)}
                className={`w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border ${telegramChannelLink && !validateTelegramUrl(telegramChannelLink) ? "border-red-500" : "border-neutral-200 dark:border-brand-border"} text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono`}
              />
              {telegramChannelLink && !validateTelegramUrl(telegramChannelLink) && (
                <p className="text-[10px] text-red-500 font-mono">Invalid Format: Must start with "https://t.me/".</p>
              )}
            </div>

            {/* Support Link */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider" htmlFor="telegramSupportLinkInput">
                Telegram Support Help Desk Link
              </label>
              <input
                id="telegramSupportLinkInput"
                type="text"
                placeholder="e.g. https://t.me/LearntoFutureSupport"
                value={telegramSupportLink}
                onChange={(e) => setTelegramSupportLink(e.target.value)}
                className={`w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border ${telegramSupportLink && !validateTelegramUrl(telegramSupportLink) ? "border-red-500" : "border-neutral-200 dark:border-brand-border"} text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono`}
              />
              {telegramSupportLink && !validateTelegramUrl(telegramSupportLink) && (
                <p className="text-[10px] text-red-500 font-mono">Invalid Format: Must start with "https://t.me/".</p>
              )}
            </div>

            {/* Username or handle */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider" htmlFor="telegramUsernameInput">
                Display Group Handle / Username
              </label>
              <input
                id="telegramUsernameInput"
                type="text"
                placeholder="e.g. @LearntoFuture"
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
                className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
              />
            </div>
          </div>
        </div>

        {/* 3. Social Media & Support Channels subgroup */}
        <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-6">
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <div className="w-1.5 h-3 bg-brand-gold rounded"></div>
              Socials & Direct Contacts
            </h4>
            <p className="text-[10px] text-neutral-500 mt-0.5">Control Instagram profiles, YouTube channels, and direct inquiry inbox addresses.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Instagram Link */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider" htmlFor="instagramLinkInput">
                Instagram Link
              </label>
              <input
                id="instagramLinkInput"
                type="text"
                placeholder="e.g. https://instagram.com/..."
                value={instagramLink}
                onChange={(e) => setInstagramLink(e.target.value)}
                className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
              />
            </div>

            {/* YouTube Link */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider" htmlFor="youtubeLinkInput">
                YouTube Channel Link
              </label>
              <input
                id="youtubeLinkInput"
                type="text"
                placeholder="https://youtube.com/..."
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
                className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
              />
            </div>

            {/* Support Email */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider" htmlFor="supportEmailInput">
                Official Support Email <span className="text-red-500">*</span>
              </label>
              <input
                id="supportEmailInput"
                type="text"
                placeholder="e.g. help@learn2future.com"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className={`w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border ${supportEmail && !validateEmail(supportEmail) ? "border-red-500" : "border-neutral-200 dark:border-brand-border"} text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono`}
              />
              {supportEmail && !validateEmail(supportEmail) && (
                <p className="text-[10px] text-red-500 font-mono">Invalid Format: Must be valid email address.</p>
              )}
            </div>
          </div>
        </div>

        {/* 3. Branding & Fallback Open Graph Settings Group */}
        <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-6">
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <div className="w-1.5 h-3 bg-brand-gold rounded"></div>
              Global Branding & Fallback OG Metadata Settings
            </h4>
            <p className="text-[10px] text-neutral-500 mt-0.5 font-light">Customise the brand asset files and global fallback metadata used when courses, blogs, or site pages are shared on social platforms.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left & Middle columns: Branding Inputs */}
            <div className="lg:col-span-2 space-y-5">
              
              {/* Brand Logo Row */}
              <div className="p-4 bg-neutral-50 dark:bg-[#0E0E0E] rounded-xl border border-neutral-200 dark:border-[#1d1d1d]/85 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center Text-left">
                <div className="sm:col-span-1 flex flex-col items-center justify-center bg-white dark:bg-black/35 p-2 rounded-lg border border-neutral-200 dark:border-brand-border max-w-[100px] w-full mx-auto aspect-square">
                  {brandLogoUrl ? (
                    <img src={brandLogoUrl} alt="Logo" className="w-12 h-12 object-contain rounded-lg border border-neutral-100 dark:border-neutral-800" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-[8px] font-mono uppercase text-neutral-400">No Logo</div>
                  )}
                </div>
                <div className="sm:col-span-3 space-y-2 text-left">
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider text-left">Brand Logo Url / File</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={brandLogoUrl}
                    onChange={(e) => setBrandLogoUrl(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-850 dark:text-white font-semibold text-[10px] py-1.5 px-3 rounded-lg cursor-pointer transition-all active:scale-95">
                      <Upload className="w-3 h-3" />
                      <span>Upload Image File</span>
                      <input type="file" accept="image/*" onChange={handleBrandLogoChange} className="hidden" />
                    </label>
                    {uploadingBrandLogo && (
                      <span className="text-[9px] font-mono text-neutral-400">Uploading {brandLogoProgress !== null ? `${brandLogoProgress}%` : "..."}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* OG Default Fallback Image Row */}
              <div className="p-4 bg-neutral-50 dark:bg-[#0E0E0E] rounded-xl border border-neutral-200 dark:border-[#1d1d1d]/85 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center border-t border-neutral-200 dark:border-[#1d1d1d]/85 text-left">
                <div className="sm:col-span-1 flex flex-col items-center justify-center bg-white dark:bg-black/35 p-2 rounded-lg border border-neutral-200 dark:border-brand-border max-w-[100px] w-full mx-auto aspect-square">
                  {ogDefaultImageUrl ? (
                    <img src={ogDefaultImageUrl} alt="OG Fallback" className="w-16 h-10 object-cover rounded-lg border border-neutral-150 dark:border-neutral-850" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-[8px] font-mono uppercase text-neutral-400">No Image</div>
                  )}
                </div>
                <div className="sm:col-span-3 space-y-2 text-left">
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider text-left">OG Default (Social fallback) Image Url / File</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={ogDefaultImageUrl}
                    onChange={(e) => setOgDefaultImageUrl(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-850 dark:text-white font-semibold text-[10px] py-1.5 px-3 rounded-lg cursor-pointer transition-all active:scale-95">
                      <Upload className="w-3 h-3" />
                      <span>Upload Image File</span>
                      <input type="file" accept="image/*" onChange={handleOgDefaultImageChange} className="hidden" />
                    </label>
                    {uploadingOgImage && (
                      <span className="text-[9px] font-mono text-neutral-400">Uploading {ogImageProgress !== null ? `${ogImageProgress}%` : "..."}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Twitter Card Layout Row */}
              <div className="p-4 bg-neutral-50 dark:bg-[#0E0E0E] rounded-xl border border-neutral-200 dark:border-[#1d1d1d]/85 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center text-left">
                <div className="sm:col-span-1 flex flex-col items-center justify-center bg-white dark:bg-black/35 p-2 rounded-lg border border-neutral-200 dark:border-brand-border max-w-[100px] w-full mx-auto aspect-square">
                  {twitterPreviewImageUrl ? (
                    <img src={twitterPreviewImageUrl} alt="Twitter Card" className="w-16 h-10 object-cover rounded-lg border border-neutral-150 dark:border-neutral-850" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-[8px] font-mono uppercase text-neutral-400">No Image</div>
                  )}
                </div>
                <div className="sm:col-span-3 space-y-2 text-left">
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider text-left">Twitter Large Preview Image Url / File</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={twitterPreviewImageUrl}
                    onChange={(e) => setTwitterPreviewImageUrl(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                  />
                  <div className="flex items-center gap-2 text-left">
                    <label className="flex items-center gap-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-850 dark:text-white font-semibold text-[10px] py-1.5 px-3 rounded-lg cursor-pointer transition-all active:scale-95">
                      <Upload className="w-3 h-3" />
                      <span>Upload Image File</span>
                      <input type="file" accept="image/*" onChange={handleTwitterPreviewImageChange} className="hidden" />
                    </label>
                    {uploadingTwitterImage && (
                      <span className="text-[9px] font-mono text-neutral-400">Uploading {twitterImageProgress !== null ? `${twitterImageProgress}%` : "..."}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Metadata Fields */}
              <div className="grid grid-cols-1 gap-4 text-left">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider text-left" htmlFor="defaultCardTitle">Default Fallback Preview Title</label>
                  <input
                    id="defaultCardTitle"
                    type="text"
                    placeholder="e.g. Learn 2 Future | Learn Today. Earn Tomorrow."
                    value={defaultCardTitle}
                    onChange={(e) => setDefaultCardTitle(e.target.value)}
                    className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold text-left"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider text-left" htmlFor="defaultCardDescription">Default Fallback Preview Description</label>
                  <textarea
                    id="defaultCardDescription"
                    rows={3}
                    placeholder="e.g. Acquire future-ready credentials in AI Tools, Freelance & Coding..."
                    value={defaultCardDescription}
                    onChange={(e) => setDefaultCardDescription(e.target.value)}
                    className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold resize-none text-left"
                  />
                </div>
              </div>

            </div>

            {/* Right column: Social Card Simulator */}
            <div className="space-y-4">
              <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider select-none text-left">Live Social Preview Simulator</span>
              
              {/* Simulator Slate Box */}
              <div className="border border-neutral-200 dark:border-[#222] bg-[#f9f9f9] dark:bg-[#0c0c0c] rounded-2xl p-4 space-y-4">
                
                {/* 1. Messenger / WhatsApp Style */}
                <div className="space-y-1.5 text-left">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase block text-left">WhatsApp / Chat Preview</span>
                  <div className="bg-white dark:bg-[#151515] rounded-xl border border-neutral-200 dark:border-brand-border overflow-hidden text-left max-w-xs transition-all shadow-sm">
                    <div className="aspect-[1.91/1] w-full bg-neutral-900 overflow-hidden relative">
                      <img 
                        src={ogDefaultImageUrl || "/brand_logo.jpg"} 
                        alt="WhatsApp Card Social Preview" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-3 bg-neutral-50 dark:bg-[#111] border-t border-neutral-100 dark:border-[#1e1e1e] space-y-1 select-none text-left">
                      <p className="font-sans font-bold text-xs text-neutral-850 dark:text-neutral-100 truncate text-left">
                        {defaultCardTitle || "Learn 2 Future - Build Skills"}
                      </p>
                      <p className="font-sans text-[10px] text-neutral-500 leading-snug line-clamp-2 text-left">
                        {defaultCardDescription || "Acquire future-ready credentials and join the revolution..."}
                      </p>
                      <span className="text-[8px] font-mono text-neutral-400 uppercase block tracking-wider pt-0.5 text-left">learn2future.vercel.app</span>
                    </div>
                  </div>
                </div>

                {/* 2. Google / Search Console Google Snippet Style */}
                <div className="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-brand-border/40 text-left">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase block text-left">Google Search Result Preview</span>
                  <div className="space-y-0.5 font-sans select-none text-left">
                    <span className="text-[10px] text-neutral-400 block truncate text-left">https://learn2future.vercel.app</span>
                    <span className="text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer font-medium text-xs block truncate leading-tight text-left">
                      {defaultCardTitle || "Learn 2 Future | Learn Today. Earn Tomorrow."}
                    </span>
                    <p className="text-[10px] text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-snug text-left">
                      {defaultCardDescription || "Empowering students, developers and makers with tomorrow's premier e-learning suites..."}
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* FORM CONTROLS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-200 dark:border-brand-border select-none">
          <div className="flex items-center space-x-2 text-[11px] text-neutral-500">
            <ShieldCheck className="w-4 h-4 text-brand-gold" />
            <span>Persisting business configuration to globalSettings document in real-time.</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto font-display">
            <button
              type="submit"
              disabled={savingBusinessSettings}
              className="w-full sm:w-auto text-center bg-brand-gold hover:bg-brand-gold-hover text-black font-bold text-xs py-3.5 px-8 rounded-xl transition-all shadow-md hover:shadow-brand-gold/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {savingBusinessSettings ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Settings...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};
