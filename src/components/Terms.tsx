import React from "react";
import { useApp } from "../context/AppContext";
import { SEO } from "./SEO";
import { FileText, ArrowLeft, ShieldAlert, Sparkles } from "lucide-react";

export const Terms: React.FC = () => {
  const { setCurrentPage } = useApp();

  return (
    <div className="py-12 md:py-20 bg-neutral-50 dark:bg-[#000000] transition-colors duration-300">
      <SEO 
        title="Terms of Service & Licensing" 
        description="Review our standard student license agreement, payment audit rules, and refund policy conditions before accessing our premium future-tech modules." 
        keywords="terms of service, learn2future terms, student license agreement, course usage guidelines"
        url="https://learn2future.vercel.app/terms"
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Terms", item: "/terms" }
        ]}
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
          <div className="inline-flex items-center space-x-2 bg-brand-gold/10 text-brand-gold px-3 py-1.5 rounded-full border border-brand-gold/15 text-[10px] font-mono font-bold uppercase tracking-widest">
            <FileText className="w-3.5 h-3.5" />
            <span>Legal Framework</span>
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Terms & <span className="text-brand-gold">Conditions</span>
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 pt-1">
            <span>EFFECTIVE DATE: JUNE 2026</span>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-800">|</span>
            <span>PUBLISHED BY LEARNING BOARD</span>
          </div>
        </div>

        {/* Important Warning Notice */}
        <div className="p-4 bg-brand-gold/5 dark:bg-brand-card/30 border border-brand-gold/10 dark:border-brand-border rounded-2xl mb-8 flex items-start gap-4">
          <div className="w-8 h-8 rounded-lg bg-brand-gold/15 text-brand-gold flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans mt-0.5">
            By accessing Learn 2 Future, you agree to the following terms and agree that you are fully responsible for complying with any applicable local laws.
          </p>
        </div>

        {/* Core Markdown-Alternative Blocks */}
        <div className="space-y-6">
          
          {/* Section 1 */}
          <div className="p-6 md:p-8 bg-white dark:bg-brand-card rounded-2xl border border-neutral-200 dark:border-brand-border space-y-3 shadow-sm hover:border-brand-gold/20 dark:hover:border-brand-border/80 transition-all">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-lg">1.0</span>
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Educational Purpose</h2>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans pl-0 sm:pl-10">
              This platform is intended for educational and informational purposes. All course assets, videos, private invite codes, codes, templates, or milestones remain the intellectual catalog of our administrative authors.
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-6 md:p-8 bg-white dark:bg-brand-card rounded-2xl border border-neutral-200 dark:border-brand-border space-y-3 shadow-sm hover:border-brand-gold/20 dark:hover:border-brand-border/80 transition-all">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-lg">2.0</span>
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">User Responsibility</h2>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans pl-0 sm:pl-10">
              Users are responsible for providing accurate information during registration, enrollment, and support requests. Providing manipulated screenshots or fraudulent transaction receipts will result in immediate service suspension.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-6 md:p-8 bg-white dark:bg-brand-card rounded-2xl border border-neutral-200 dark:border-brand-border space-y-3 shadow-sm hover:border-brand-gold/20 dark:hover:border-brand-border/80 transition-all">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-lg">3.0</span>
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Payments</h2>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans pl-0 sm:pl-10">
              All payments are processed according to the pricing displayed at the time of purchase. Manual course orders require verification by our financial audits team. Transactions are secure, final, non-refundable, and catalogued immediately inside your Student Vault.
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-6 md:p-8 bg-white dark:bg-brand-card rounded-2xl border border-neutral-200 dark:border-brand-border space-y-3 shadow-sm hover:border-brand-gold/20 dark:hover:border-brand-border/80 transition-all">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-lg">4.0</span>
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Intellectual Property</h2>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans pl-0 sm:pl-10">
              All trademarks, logos, brand names, and creator names belong to their respective owners. No reproduction of software code snippets, raw private Telegram materials, or structural study guides is permitted without official brand consent.
            </p>
          </div>

          {/* Section 5 */}
          <div className="p-6 md:p-8 bg-white dark:bg-brand-card rounded-2xl border border-neutral-200 dark:border-brand-border space-y-3 shadow-sm hover:border-brand-gold/20 dark:hover:border-brand-border/80 transition-all">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-lg">5.0</span>
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Limitation of Liability</h2>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans pl-0 sm:pl-10">
              Learn 2 Future shall not be liable for any direct or indirect damages arising from the use of this website, learning programs, code tools, or telegram channels.
            </p>
          </div>

          {/* Section 6 */}
          <div className="p-6 md:p-8 bg-white dark:bg-brand-card rounded-2xl border border-neutral-200 dark:border-brand-border space-y-3 shadow-sm hover:border-brand-gold/20 dark:hover:border-brand-border/80 transition-all">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-lg">6.0</span>
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Account Suspension</h2>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans pl-0 sm:pl-10">
              We reserve the right to suspend access in cases of abuse, fraud, spam, or misuse of the platform. Suspended visual profiles can request appeal files via the Direct channels.
            </p>
          </div>

          {/* Section 7 */}
          <div className="p-6 md:p-8 bg-white dark:bg-brand-card rounded-2xl border border-neutral-200 dark:border-brand-border space-y-3 shadow-sm hover:border-brand-gold/20 dark:hover:border-brand-border/80 transition-all">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-lg">7.0</span>
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Policy Updates</h2>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans pl-0 sm:pl-10">
              These terms may be updated at any time without prior notice. Continued use of the website indicates acceptance of the latest version of these terms.
            </p>
          </div>

          {/* Section 8: Affiliate / Influencer Program */}
          <div className="p-6 md:p-8 bg-white dark:bg-brand-card rounded-2xl border border-neutral-200 dark:border-brand-border space-y-4 shadow-sm hover:border-brand-gold/20 dark:hover:border-brand-border/80 transition-all">
            <div className="flex items-center space-x-3 pb-2 border-b border-neutral-100 dark:border-brand-border/50">
              <span className="font-mono text-xs font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-lg">8.0</span>
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Affiliate / Influencer Program</h2>
            </div>
            
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans pl-0 sm:pl-10 pb-2">
              Learn2Future operates an official creator synergy program subject to the following operating models:
            </p>

            <ol className="space-y-3 pl-0 sm:pl-10 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-sans list-decimal list-inside">
              <li>Learn2Future may provide creators, influencers, affiliates, and partners with unique coupon codes.</li>
              <li>Affiliates earn commission only when a customer successfully completes a purchase using their assigned coupon code.</li>
              <li>Standard commission rate is 15% per successful sale.</li>
              <li>Learn2Future may increase commission rates up to 20% or 25% for high-performing affiliates at its sole discretion.</li>
              <li>Commission is calculated only on completed and verified orders.</li>
              <li>Self-purchases using an affiliate's own coupon code are eligible for commission.</li>
              <li>Minimum payout threshold is ₹500.</li>
              <li>If the payout threshold is not reached, earnings will automatically carry forward to the next payout cycle and will never expire.</li>
              <li>Payouts are processed every 15 days.</li>
              <li>Payments may be sent through UPI, Bank Transfer, or any payment method approved by Learn2Future.</li>
              <li>If an order is refunded, cancelled, disputed, fraudulent, or reversed, the related commission may be cancelled.</li>
              <li>Learn2Future may temporarily hold payouts while investigating suspicious activity.</li>
              <li>
                Learn2Future reserves the right to suspend, deactivate, or permanently terminate any coupon code if:
                <ul className="list-disc list-inside pl-6 mt-1.5 space-y-1 text-neutral-500 dark:text-neutral-400">
                  <li>Spam is detected</li>
                  <li>Misleading claims are made</li>
                  <li>Fake promotions are used</li>
                  <li>Abuse of the system is detected</li>
                  <li>Any activity damages Learn2Future's reputation</li>
                </ul>
              </li>
              <li>In cases of suspension or cancellation, Learn2Future may provide proof or explanation where appropriate.</li>
              <li>
                Affiliates may promote using the following platforms:
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Instagram", "YouTube", "Telegram", "WhatsApp", "Websites", "Blogs", "Facebook", "Other approved platforms"].map(p => (
                    <span key={p} className="bg-neutral-100 dark:bg-neutral-950 px-2 py-1 rounded text-[10px] font-mono border border-neutral-200 dark:border-brand-border">{p}</span>
                  ))}
                </div>
              </li>
              <li>Affiliate dashboard statistics may not always be immediately available.</li>
              <li>
                During development periods, affiliates can request manual coupon reports by contacting Learn2Future support and providing:
                <div className="mt-1.5 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-brand-border space-y-1 text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
                  <div>• Coupon Code</div>
                  <div>• Name</div>
                  <div>• Email</div>
                  <div>• Instagram Username</div>
                </div>
              </li>
              <li>Learn2Future reserves the right to modify affiliate commissions, payout schedules, and program rules at any time.</li>
              <li>Continued participation in the affiliate program constitutes acceptance of these terms.</li>
            </ol>
          </div>

        </div>

        {/* Footer Accept Check */}
        <div className="mt-12 text-center p-6 bg-neutral-100/40 dark:bg-brand-card/10 border border-dashed border-neutral-200 dark:border-brand-border/60 rounded-2xl space-y-3">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans max-w-lg mx-auto">
            Continued use of the website and associated learning dashboards indicates active acceptance of the latest version of these terms.
          </p>
          <div className="flex items-center justify-center space-x-1.5 text-[10px] font-mono text-brand-gold tracking-wide uppercase font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Learn 2 Future Legal Desk</span>
          </div>
        </div>

      </div>
    </div>
  );
};
