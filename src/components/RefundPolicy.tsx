import React, { useEffect } from "react";
import { SEO } from "./SEO";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { ShieldCheck, HelpCircle, ArrowLeft, RefreshCw, Scale } from "lucide-react";

export const RefundPolicy: React.FC = () => {
  const { setCurrentPage } = useApp();

  useEffect(() => {
    setCurrentPage("refund-policy");
  }, [setCurrentPage]);

  return (
    <div className="py-12 md:py-20 bg-neutral-50 dark:bg-[#000000] transition-colors duration-300">
      <SEO 
        title="Refund & Cancellation Policy" 
        description="Review our transparent, standard digital license delivery policies, transaction audit protocols, and refund eligibility standards." 
        keywords="refund policy, learn2future refund, digital delivery refund, cancel enrollment learn2future"
        url="https://learn2future.vercel.app/refund-policy"
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Refund Policy", item: "/refund-policy" }
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation back helper */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 hover:text-brand-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home Portal
          </Link>
        </div>

        {/* Heading Header */}
        <div className="text-center space-y-4 mb-16">
          <span className="inline-flex items-center gap-1 bg-brand-gold/10 border border-brand-gold/20 text-brand-gold font-mono uppercase tracking-widest text-[10px] py-1 px-3.5 rounded-full">
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow text-brand-gold" /> System Dispatch Audits
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display uppercase tracking-tight text-neutral-900 dark:text-white leading-tight">
            Refund & Cancellation Policy
          </h1>
          <p className="text-xs sm:text-sm font-mono text-neutral-500 uppercase">
            Effective Date: June 26, 2026 | Document Registry Version 2.4.1
          </p>
        </div>

        {/* Policy Content cards */}
        <div className="space-y-12 text-left">
          
          {/* Section 1 */}
          <section className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-900 rounded-3xl p-6 sm:p-10 space-y-4 shadow-sm hover:border-neutral-800 transition duration-200">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center font-mono text-sm font-bold border border-brand-gold/25">1</span>
              Digital Delivery Terms
            </h2>
            <div className="text-neutral-600 dark:text-neutral-350 text-sm sm:text-base leading-relaxed space-y-3.5">
              <p>
                Learn2Future delivers premium educational materials, including digital video licenses, interactive templates, downloadable code assets, and lifetime community access links. Because these resources are instantly dispatched into your Student Vault and community channels upon manual UPI / payment proof verification, our products are categorized as <strong>Digital Intangible Downloads</strong>.
              </p>
              <p>
                Unlike physical items, digital products can be instantly consumed, copied, or saved. Therefore, once digital licenses have been assigned to your profile, the delivery is considered complete and active.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-900 rounded-3xl p-6 sm:p-10 space-y-4 shadow-sm hover:border-neutral-800 transition duration-200">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center font-mono text-sm font-bold border border-brand-gold/25">2</span>
              Standard Return Eligibility
            </h2>
            <div className="text-neutral-600 dark:text-neutral-350 text-sm sm:text-base leading-relaxed space-y-3.5">
              <p>
                As a standard operational policy across our entire catalog, all digital licensing transactions are <strong>final, non-refundable, and non-returnable</strong>. By placing an order, uploading payment proof, and submitting your checkout request, you acknowledge and agree that:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-neutral-500">
                <li>You are purchasing legal access to proprietary learning materials.</li>
                <li>Refunds will not be authorized for reasons including a change of mind, lack of immediate time to study, or accidental duplicate orders (which can instead be swapped for alternate courses of equal value).</li>
                <li>Your subscription is strictly tied to the email address used during checkout.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-900 rounded-3xl p-6 sm:p-10 space-y-4 shadow-sm hover:border-neutral-800 transition duration-200">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center font-mono text-sm font-bold border border-brand-gold/25">3</span>
              Special Desk Cases & Swap Policy
            </h2>
            <div className="text-neutral-600 dark:text-neutral-350 text-sm sm:text-base leading-relaxed space-y-3.5">
              <p>
                We value our students and strive to maintain an empathetic, supportive learning ecosystem. If you encounter technical issues (e.g. unable to stream a video, missing materials, or duplicate checkout due to network error), please contact our Help Desk team within <strong>24 hours</strong> of purchase.
              </p>
              <p>
                In verified technical distress cases where our guides cannot resolve the issue, we will happily offer a <strong>Course Swap</strong>. We will transition your active license over to any other premium blueprint of your choice of equal value.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-900 rounded-3xl p-6 sm:p-10 space-y-4 shadow-sm hover:border-neutral-800 transition duration-200">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center font-mono text-sm font-bold border border-brand-gold/25">4</span>
              Fraudulent Submissions & Disputes
            </h2>
            <div className="text-neutral-600 dark:text-neutral-350 text-sm sm:text-base leading-relaxed space-y-3.5">
              <p>
                To maintain database integrity, all uploaded payment receipts and screenshots are audited manually. If a user uploads a fabricated, reused, or fake transaction screenshot, their student enrollment is instantly blocked, and their account is suspended from the portal. Commission credits generated on fraudulent transactions will be permanently cancelled.
              </p>
            </div>
          </section>

          {/* Quick FAQ summary box */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-8 relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 blur-3xl rounded-full" />
            <h3 className="text-base font-display font-semibold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-brand-gold" /> Need immediate assistance?
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-xl">
              Have questions about your order auditing status or credential delivery queue? Reach out directly to our live help desk at our email or chat with our guides on Telegram for rapid resolutions.
            </p>
            <div className="flex gap-4 pt-2">
              <Link
                to="/contact"
                className="bg-brand-gold hover:bg-[#ffd34d] text-black text-xs font-mono font-bold uppercase tracking-wider py-2.5 px-5 rounded-xl transition"
              >
                Contact Help Desk
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
