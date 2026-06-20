import React from "react";
import { useApp } from "../context/AppContext";
import { SEO } from "./SEO";
import { ShieldCheck, ArrowLeft, Mail, Info, Star, ShieldAlert } from "lucide-react";

export const Privacy: React.FC = () => {
  const { setCurrentPage, globalSettings } = useApp();

  return (
    <div className="py-12 md:py-20 bg-neutral-50 dark:bg-[#000000] transition-colors duration-300">
      <SEO 
        title="Privacy Policy - Learn 2 Future" 
        description="Learn 2 Future Privacy Policy, data collection standards, security protocols, and third-party details." 
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link Button */}
        <button
          onClick={() => setCurrentPage("home")}
          className="group inline-flex items-center space-x-2 text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400 hover:text-brand-gold transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>RETURN TO HOME PORTAL</span>
        </button>

        {/* Page Header */}
        <div className="text-left space-y-4 mb-12">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-full border border-emerald-500/15 text-[10px] font-mono font-bold uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted Data Zone</span>
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Privacy <span className="text-brand-gold">Policy</span>
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 pt-1">
            <span>UPDATED DATE: JUNE 2026</span>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-800">|</span>
            <span>SECURE USER SAFEGUARD</span>
          </div>
        </div>

        {/* Short Statement Card */}
        <div className="p-6 bg-white dark:bg-brand-card rounded-2xl border border-neutral-200 dark:border-brand-border space-y-2.5 mb-8">
          <h2 className="font-display text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-brand-gold" />
            Our Core Statement
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
            Learn 2 Future values your privacy. We are fully committed to protecting your personal information and ensuring all support requests are secured with SSL encrypted pipelines.
          </p>
        </div>

        {/* Core Markdown-Alternative Blocks */}
        <div className="space-y-6">
          
          {/* Section 1: Information We Collect */}
          <div className="p-6 md:p-8 bg-white dark:bg-brand-card rounded-2xl border border-neutral-200 dark:border-brand-border space-y-4 shadow-sm hover:border-brand-gold/20 dark:hover:border-brand-border/80 transition-all">
            <div className="flex items-center space-x-3 pb-2 border-b border-neutral-100 dark:border-brand-border/50">
              <span className="font-mono text-xs font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-lg">1.0</span>
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Information We Collect</h2>
            </div>
            
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium pl-0 sm:pl-10">
              We may collect the following data parameters during interaction checkpoints:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-0 sm:pl-10 text-xs text-neutral-500 dark:text-neutral-400 font-mono pt-1">
              <li className="flex items-center space-x-2 bg-neutral-50 dark:bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-250/25 dark:border-brand-border/40">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0"></span>
                <span>Full Name</span>
              </li>
              <li className="flex items-center space-x-2 bg-neutral-50 dark:bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-250/25 dark:border-brand-border/40">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0"></span>
                <span>Email Address</span>
              </li>
              <li className="flex items-center space-x-2 bg-neutral-50 dark:bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-250/25 dark:border-brand-border/40">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0"></span>
                <span>Telegram Username</span>
              </li>
              <li className="flex items-center space-x-2 bg-neutral-50 dark:bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-250/25 dark:border-brand-border/40">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0"></span>
                <span>Support Messages Text</span>
              </li>
              <li className="flex items-center space-x-2 bg-neutral-50 dark:bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-250/25 dark:border-brand-border/40">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0"></span>
                <span>Payment Verification Info</span>
              </li>
              <li className="flex items-center space-x-2 bg-neutral-50 dark:bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-250/25 dark:border-brand-border/40">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0"></span>
                <span>Transaction Receipts</span>
              </li>
            </ul>
          </div>

          {/* Section 2: How We Use Information */}
          <div className="p-6 md:p-8 bg-white dark:bg-brand-card rounded-2xl border border-neutral-200 dark:border-brand-border space-y-4 shadow-sm hover:border-brand-gold/20 dark:hover:border-brand-border/80 transition-all">
            <div className="flex items-center space-x-3 pb-2 border-b border-neutral-100 dark:border-brand-border/50">
              <span className="font-mono text-xs font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-lg">2.0</span>
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">How We Use Information</h2>
            </div>
            
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium pl-0 sm:pl-10">
              We process data elements strictly to fulfill authorized objectives:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-0 sm:pl-10 text-xs text-neutral-500 dark:text-neutral-400 font-mono pt-1">
              <li className="flex items-center space-x-2 bg-neutral-50 dark:bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-250/25 dark:border-brand-border/40">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0"></span>
                <span>Process student enrollments</span>
              </li>
              <li className="flex items-center space-x-2 bg-neutral-50 dark:bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-250/25 dark:border-brand-border/40">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0"></span>
                <span>Provide localized support</span>
              </li>
              <li className="flex items-center space-x-2 bg-neutral-50 dark:bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-250/25 dark:border-brand-border/40">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0"></span>
                <span>Improve dashboard UX</span>
              </li>
              <li className="flex items-center space-x-2 bg-neutral-50 dark:bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-250/25 dark:border-brand-border/40">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0"></span>
                <span>Prevent fraud and abuse</span>
              </li>
            </ul>
          </div>

          {/* Section 3: Data Security */}
          <div className="p-6 md:p-8 bg-white dark:bg-brand-card rounded-2xl border border-neutral-200 dark:border-brand-border space-y-3 shadow-sm hover:border-brand-gold/20 dark:hover:border-brand-border/80 transition-all">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-lg">3.0</span>
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Data Security</h2>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans pl-0 sm:pl-10">
              We implement reasonable security measures, firewall tables, and SSL transport encryption standards to protect user information from unintended access.
            </p>
          </div>

          {/* Section 4: Third-Party Services */}
          <div className="p-6 md:p-8 bg-white dark:bg-brand-card rounded-2xl border border-neutral-200 dark:border-brand-border space-y-4 shadow-sm hover:border-brand-gold/20 dark:hover:border-brand-border/80 transition-all">
            <div className="flex items-center space-x-3 pb-2 border-b border-neutral-100 dark:border-brand-border/50">
              <span className="font-mono text-xs font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-lg">4.0</span>
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Third-Party Services</h2>
            </div>
            
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans pl-0 sm:pl-10">
              Our website links with standardized cloud infrastructure and search tracking providers:
            </p>
            <ul className="space-y-2 pl-0 sm:pl-10 text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0 mt-1.5"></span>
                <span><strong>Google Analytics 4 & Tag Manager</strong>: Used to index usage patterns and optimize our learning path cataloging without profiling sensitive attributes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0 mt-1.5"></span>
                <span><strong>Firebase DB & Storage</strong>: Used for persistent storage, student session authentication keys, and transaction receipt assets.</span>
              </li>
            </ul>
            <p className="text-xs text-neutral-500 pl-0 sm:pl-10 italic">
              These services may collect limited technical parameters (IP address, client agent type) according to their own privacy policies.
            </p>
          </div>

          {/* Section 5: Cookies */}
          <div className="p-6 md:p-8 bg-white dark:bg-brand-card rounded-2xl border border-neutral-200 dark:border-brand-border space-y-3 shadow-sm hover:border-brand-gold/20 dark:hover:border-brand-border/80 transition-all">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-lg">5.0</span>
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Cookies</h2>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans pl-0 sm:pl-10">
              We use lightweight localized cookies or web storage parameters (`localStorage`) to remember your session token, preference theme mode (Dark/Light), and client-side settings.
            </p>
          </div>

          {/* Section 6: Coupon Tracking Disclosure */}
          <div className="p-6 md:p-8 bg-white dark:bg-brand-card rounded-2xl border border-neutral-200 dark:border-brand-border space-y-3 shadow-sm hover:border-brand-gold/20 dark:hover:border-brand-border/80 transition-all">
            <div className="flex items-center space-x-3 pb-2 border-b border-neutral-100 dark:border-brand-border/50">
              <span className="font-mono text-xs font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-lg">6.0</span>
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Coupon Tracking Disclosure</h2>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans pl-0 sm:pl-10">
              Learn2Future tracks coupon code usage, purchase amounts, order counts, and affiliate performance performance metrics for affiliate program commission calculations, fraud prevention, detailed metrics audits, and payout processing cycles.
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans pl-0 sm:pl-10 italic">
              This compiled operational parameter history may be stored securely and utilized solely for operating and auditing the affiliate program network.
            </p>
          </div>

          {/* Section 7: Contact */}
          <div className="p-6 md:p-8 bg-white dark:bg-brand-card rounded-2xl border border-neutral-200 dark:border-brand-gold/30 space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-brand-gold/5 rounded-full -mr-10 -mt-10"></div>
            <div className="flex items-center space-x-3 pb-2 border-b border-neutral-100 dark:border-brand-border/50">
              <span className="font-mono text-xs font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-lg">7.0</span>
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Contact</h2>
            </div>
            
            <p className="text-sm text-neutral-600 dark:text-neutral-300 pl-0 sm:pl-10 leading-relaxed font-sans">
              For any privacy-related queries, direct data deletion requests or support inquiries, reach out to our official desk directly:
            </p>
            <div className="pl-0 sm:pl-10">
              <a
                href={`mailto:${globalSettings.supportEmail || "digitalcoursesbay@gmail.com"}`}
                className="inline-flex items-center space-x-3 bg-neutral-100 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-brand-border text-xs hover:border-brand-gold/40 transition-colors font-mono tracking-wide"
              >
                <Mail className="w-4 h-4 text-brand-gold shrink-0" />
                <span className="font-bold text-neutral-800 dark:text-white break-all">{globalSettings.supportEmail || "digitalcoursesbay@gmail.com"}</span>
              </a>
            </div>
          </div>

        </div>

        {/* Footer Accent Block */}
        <div className="mt-12 text-center p-6 bg-neutral-100/40 dark:bg-brand-card/10 border border-dashed border-neutral-200 dark:border-brand-border/60 rounded-2xl space-y-3">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans max-w-lg mx-auto">
            By using Learn 2 Future, you agree to this Privacy Policy.
          </p>
          <div className="flex items-center justify-center space-x-1.5 text-[10px] font-mono text-emerald-500 tracking-wide uppercase font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>GDPR/User Secured System</span>
          </div>
        </div>

      </div>
    </div>
  );
};
