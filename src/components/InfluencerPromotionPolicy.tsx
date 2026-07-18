import React, { useState } from "react";
import { SEO } from "./SEO";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { 
  ArrowLeft, 
  Sparkles, 
  TrendingUp, 
  XCircle, 
  AlertTriangle, 
  Percent, 
  DollarSign, 
  Award, 
  BookOpen, 
  HeartHandshake, 
  Mail, 
  Send as TelegramIcon, 
  Clock, 
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  Coins,
  RefreshCw
} from "lucide-react";

export const InfluencerPromotionPolicy: React.FC = () => {
  const { globalSettings } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="py-12 md:py-20 bg-neutral-50 dark:bg-[#000000] transition-colors duration-300">
      <SEO 
        title="Influencer Promotion Policy | Learn 2 Future" 
        description="Review our Affiliate & Influencer Program Policy. Earn up to 30% commission promoting premium future-tech learning materials. Check out our commission structure, discount details, and payment terms." 
        keywords="influencer policy, affiliate policy, learn2future affiliate, commission tier, promotional rules, influencer program"
        url="https://learn2future.vercel.app/influencer-promotion-policy"
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Influencer Promotion Policy", item: "/influencer-promotion-policy" }
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation & Share */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 hover:text-brand-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home Portal
          </Link>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-brand-gold/40 text-neutral-700 dark:text-neutral-300 hover:text-brand-gold font-mono text-xs uppercase tracking-wider py-1.5 px-3 rounded-lg transition-all"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" /> Link Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Share Policy URL
              </>
            )}
          </button>
        </div>

        {/* Heading Header */}
        <div className="text-center space-y-4 mb-16">
          <span className="inline-flex items-center gap-1.5 bg-brand-gold/10 border border-brand-gold/20 text-brand-gold font-mono uppercase tracking-widest text-[10px] py-1.5 px-3.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-brand-gold animate-pulse" /> Affiliate & Influencer Program
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display uppercase tracking-tight text-neutral-900 dark:text-white leading-tight">
            Influencer Promotion Policy
          </h1>
          <p className="text-xs sm:text-sm font-mono text-neutral-500 uppercase">
            Effective Date: July 2, 2026 | Document Registry Version 1.0.0
          </p>
          <div className="w-16 h-1 bg-brand-gold mx-auto rounded-full mt-4"></div>
        </div>

        {/* Policy Content Blocks */}
        <div className="space-y-12 text-left">
          
          {/* Overview */}
          <section className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-900 rounded-3xl p-6 sm:p-10 space-y-4 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-800 transition duration-200">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center font-mono text-sm font-bold border border-brand-gold/25">1</span>
              Program Overview
            </h2>
            <div className="text-neutral-600 dark:text-neutral-350 text-sm sm:text-base leading-relaxed space-y-3.5">
              <p>
                Welcome to our Affiliate & Influencer Program. This program allows content creators, industry professionals, and continuous learning advocates to earn premium commissions by promoting our high-impact digital products.
              </p>
              <p>
                Our goal is to create a <strong>fair, transparent, and rewarding ecosystem</strong> for all affiliates. By utilizing your personal platform to direct motivated students toward career-defining technical blueprints, you unlock recurring, structured revenue streams.
              </p>
            </div>
          </section>

          {/* Product Details Block */}
          <section className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-900 rounded-3xl p-6 sm:p-10 space-y-4 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-800 transition duration-200">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center font-mono text-sm font-bold border border-brand-gold/25">2</span>
              Product & Pricing Details
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm">
              Our standardized core pricing configuration for digital product licensing guarantees maximum value for customers and transparent commissions for partners.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-neutral-50 dark:bg-neutral-950 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-900 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block mb-1">Average Price</span>
                <span className="text-2xl font-display font-black text-neutral-900 dark:text-white">₹299</span>
                <span className="text-[10px] text-neutral-400 mt-1">Standard list price</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-950 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-900 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block mb-1">Affiliate Discount</span>
                <span className="text-2xl font-display font-black text-brand-gold">10% OFF</span>
                <span className="text-[10px] text-neutral-400 mt-1">Applied via your code</span>
              </div>
              <div className="bg-brand-gold/5 dark:bg-brand-gold/5 p-5 rounded-2xl border border-brand-gold/20 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block mb-1">Final Selling Price</span>
                <span className="text-2xl font-display font-black text-neutral-900 dark:text-white">₹269</span>
                <span className="text-[10px] text-neutral-400 mt-1">Post-discount price paid by user</span>
              </div>
            </div>
          </section>

          {/* Commission Structure & Table */}
          <section className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-900 rounded-3xl p-6 sm:p-10 space-y-6 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-800 transition duration-200">
            <div className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center font-mono text-sm font-bold border border-brand-gold/25">3</span>
                Commission Structure
              </h2>
              <p className="text-neutral-600 dark:text-neutral-450 text-sm leading-relaxed">
                Affiliates earn commission based directly on the final, **discounted selling price (₹269)**. We reward high-volume partners with progressively higher payout tiers.
              </p>
            </div>

            {/* Custom Responsive Table */}
            <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-900">
              <table className="w-full text-left border-collapse font-sans text-xs sm:text-sm">
                <thead>
                  <tr className="bg-neutral-100 dark:bg-neutral-950 text-neutral-700 dark:text-neutral-400 font-mono text-[10px] sm:text-xs uppercase border-b border-neutral-200 dark:border-neutral-900">
                    <th className="py-4 px-4 sm:px-6 font-bold">Tier</th>
                    <th className="py-4 px-4 sm:px-6 font-bold">Monthly Orders</th>
                    <th className="py-4 px-4 sm:px-6 font-bold">Commission %</th>
                    <th className="py-4 px-4 sm:px-6 font-bold text-right">Earnings per Sale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-900">
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-semibold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-neutral-400"></span> Starter
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-neutral-500 dark:text-neutral-400">1 – 99</td>
                    <td className="py-4 px-4 sm:px-6 font-semibold">10%</td>
                    <td className="py-4 px-4 sm:px-6 text-right font-mono font-bold text-neutral-900 dark:text-white">₹27</td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-semibold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Growth
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-neutral-500 dark:text-neutral-400">100+</td>
                    <td className="py-4 px-4 sm:px-6 font-semibold">15%</td>
                    <td className="py-4 px-4 sm:px-6 text-right font-mono font-bold text-neutral-900 dark:text-white">₹40</td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-semibold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-gold"></span> Advanced
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-neutral-500 dark:text-neutral-400">200+</td>
                    <td className="py-4 px-4 sm:px-6 font-semibold">20%</td>
                    <td className="py-4 px-4 sm:px-6 text-right font-mono font-bold text-brand-gold">₹54</td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-semibold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pro
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-neutral-500 dark:text-neutral-400">300+</td>
                    <td className="py-4 px-4 sm:px-6 font-semibold">25%</td>
                    <td className="py-4 px-4 sm:px-6 text-right font-mono font-bold text-brand-gold">₹67</td>
                  </tr>
                  <tr className="bg-brand-gold/5 hover:bg-brand-gold/10 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-black flex items-center gap-2 text-brand-gold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span> Elite
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-semibold text-neutral-900 dark:text-white">500+</td>
                    <td className="py-4 px-4 sm:px-6 font-semibold text-neutral-900 dark:text-white">30%</td>
                    <td className="py-4 px-4 sm:px-6 text-right font-mono font-black text-emerald-500">₹80</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
              <p className="text-xs text-neutral-550 dark:text-neutral-400 leading-relaxed font-sans">
                <strong>Calculation Note:</strong> Commission is calculated on the discounted final transaction price of <strong>₹269</strong>, not the base list price of ₹299. High-volume performance upgrade tiers are assessed at the beginning of each calendar month based on completed orders.
              </p>
            </div>
          </section>

          {/* Policies & Payment Terms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Discount Policy */}
            <section className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-900 rounded-3xl p-6 sm:p-8 space-y-3.5 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-800 transition duration-200 flex flex-col justify-between">
              <div className="space-y-3.5">
                <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Percent className="w-5 h-5 text-brand-gold" /> Discount Policy
                </h3>
                <p className="text-xs sm:text-sm text-neutral-550 dark:text-neutral-450 leading-relaxed">
                  Each affiliate is provisioned with a <strong>unique coupon code</strong>. This code delivers a mandatory <strong>10% discount</strong> to incoming customers, incentivizing conversions while anchoring tracking metrics directly to your profile.
                </p>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest mt-2 block">10% Off Mandatory</span>
            </section>

            {/* Payment Terms */}
            <section className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-900 rounded-3xl p-6 sm:p-8 space-y-3.5 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-800 transition duration-200 flex flex-col justify-between">
              <div className="space-y-3.5">
                <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" /> Payment Terms
                </h3>
                <p className="text-xs sm:text-sm text-neutral-550 dark:text-neutral-450 leading-relaxed">
                  The minimum payout threshold is <strong>₹200</strong>. Commission balances are reconciled and paid out **weekly (every Sunday)**. Outstanding sums below the ₹200 threshold are safely carried forward into the subsequent weekly settlement cycle.
                </p>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest mt-2 block">Weekly Sunday Payouts</span>
            </section>

            {/* Tracking & Attribution */}
            <section className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-900 rounded-3xl p-6 sm:p-8 space-y-3.5 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-800 transition duration-200 flex flex-col justify-between">
              <div className="space-y-3.5">
                <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-brand-gold" /> Tracking & Attribution
                </h3>
                <p className="text-xs sm:text-sm text-neutral-550 dark:text-neutral-450 leading-relaxed">
                  System attribution is automated. Credits are cataloged only when your custom coupon is applied or the unique tracking link is resolved. **No manual retro-attribution claims** can be certified by help desks.
                </p>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest mt-2 block">Secure Automations</span>
            </section>

            {/* Performance Upgrade */}
            <section className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-900 rounded-3xl p-6 sm:p-8 space-y-3.5 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-800 transition duration-200 flex flex-col justify-between">
              <div className="space-y-3.5">
                <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-brand-gold" /> Performance Upgrade
                </h3>
                <p className="text-xs sm:text-sm text-neutral-550 dark:text-neutral-450 leading-relaxed">
                  Affiliate levels are updated based on completed orders processed within a given month. Accelerating your sales volume instantly locks in higher tier percentages, rewarding persistent promotional activity.
                </p>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest mt-2 block">Volume Scaling Tiers</span>
            </section>

          </div>

          {/* Important Rules (Highlighted Warning Section) */}
          <section className="bg-red-50/30 dark:bg-red-950/10 border border-red-200 dark:border-red-900/50 rounded-3xl p-6 sm:p-10 space-y-6">
            <div className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-red-600 dark:text-red-500 flex items-center gap-2.5">
                <ShieldAlert className="w-6 h-6 shrink-0" /> Important Compliance Rules
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                To protect the integrity of the Learn 2 Future brand, all affiliates must comply with our professional promotional standards. Non-compliance results in immediate commission voiding.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex gap-3 p-4 bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-900 shadow-sm">
                <XCircle className="w-5 h-5 text-red-505 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">No Self-Purchases</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-450">You are strictly forbidden from placing orders using your own unique discount coupon to extract cash back.</p>
                </div>
              </div>

              <div className="flex gap-3 p-4 bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-900 shadow-sm">
                <XCircle className="w-5 h-5 text-red-505 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">No Misleading Claims</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-450">Do not advertise false student numbers, mock certifications, or guarantee overnight income metrics to drive traffic.</p>
                </div>
              </div>

              <div className="flex gap-3 p-4 bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-900 shadow-sm">
                <XCircle className="w-5 h-5 text-red-505 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">No Unsolicited Spam</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-450">Do not scrape student groups or mass-mail unsolicited link requests. Maintain clean marketing communication paths.</p>
                </div>
              </div>

              <div className="flex gap-3 p-4 bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-900 shadow-sm">
                <XCircle className="w-5 h-5 text-red-505 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">No PPC Brand Bidding</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-450">Running search engine pay-per-click ads utilizing trademarked brand keywords without explicit permission is forbidden.</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-red-100/20 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 rounded-xl text-xs text-neutral-700 dark:text-neutral-300 leading-normal flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>
                <strong>Violation Enforcement:</strong> Breach of any compliance conditions leads to permanent affiliate profile suspension, exclusion from current networks, and immediate cancellation of all accumulated, pending, and unreleased commissions.
              </span>
            </div>
          </section>

          {/* Refund Policy & Support Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Refund Policy Impact */}
            <section className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-900 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-800 transition duration-200 flex flex-col justify-between">
              <div className="space-y-3.5">
                <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-brand-gold animate-spin-slow" /> Refund Policy Impact
                </h3>
                <div className="text-xs sm:text-sm text-neutral-550 dark:text-neutral-450 leading-relaxed space-y-2">
                  <p>
                    If a customer successfully receives a digital swap or is refunded due to audited billing duplications, any commission attributed to that original transaction will be deducted from your pending dashboard balances.
                  </p>
                  <p>
                    Only completed, verified, and active student enrollment transactions are recorded as valid commission triggers.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest mt-2 block">Active Sales Counting Only</span>
            </section>

            {/* Support for Affiliates */}
            <section className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-900 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-800 transition duration-200 flex flex-col justify-between">
              <div className="space-y-3.5">
                <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-brand-gold" /> Dedicated Partner Support
                </h3>
                <div className="text-xs sm:text-sm text-neutral-550 dark:text-neutral-450 leading-relaxed space-y-2">
                  <p>
                    We want you to succeed. To help you scale your operations, we provide ready-to-use content ideas, conversion-focused marketing scripts, custom banners, and expert advice for continuous audience growth.
                  </p>
                  <p>
                    Reach out to our content desk for ready-to-post material assets tailored to your unique traffic sources.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest mt-2 block">Ready-to-use Ad Creatives</span>
            </section>

          </div>

          {/* Program Updates */}
          <section className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-900 rounded-3xl p-6 sm:p-10 space-y-4 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-800 transition duration-200">
            <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-brand-gold" /> Program Updates & Modifications
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-350 leading-relaxed">
              We reserve the right to modify commission ratios, update discount settings, or adjust program policies at our absolute discretion. In the event of a significant structural commission update, all verified, active influencers will be notified in writing via email or our exclusive Telegram notification broadcast channel at least **7 business days** in advance.
            </p>
          </section>

          {/* Contact Details Card (📬 Contact Section) */}
          <section className="bg-neutral-950 border border-neutral-900 rounded-3xl p-8 sm:p-10 relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 blur-3xl rounded-full" />
            
            <div className="space-y-2">
              <h3 className="text-xl font-display font-semibold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand-gold" /> Program Support & Registration
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-xl">
                Ready to submit your application or have questions about tracking integrations? Contact our affiliate partnership desk directly using our verified communication channels:
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              {globalSettings.supportEmail && (
                <a
                  href={`mailto:${globalSettings.supportEmail}`}
                  className="inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-850 text-white hover:text-brand-gold border border-neutral-800 px-5 py-3 rounded-xl transition text-xs font-mono font-bold uppercase tracking-wider"
                >
                  <Mail className="w-4 h-4 text-brand-gold" /> {globalSettings.supportEmail}
                </a>
              )}
              {globalSettings.telegramChannelLink && (
                <a
                  href={globalSettings.telegramChannelLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-brand-gold hover:bg-[#ffd34d] text-black px-5 py-3 rounded-xl transition text-xs font-mono font-bold uppercase tracking-wider"
                >
                  <TelegramIcon className="w-4 h-4" /> Telegram Desk
                </a>
              )}
            </div>

            <p className="text-[10px] text-neutral-550 italic">
              Please include details about your primary distribution channels, active social handles, and monthly audience reach statistics in your registration request for accelerated approvals.
            </p>
          </section>

          {/* Final Note (💰 The more you sell, the more you earn) */}
          <div className="text-center pt-8 border-t border-neutral-200 dark:border-neutral-900">
            <h4 className="font-display text-lg font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              The more you sell, the more you earn. 💰
            </h4>
            <p className="text-xs text-neutral-550 dark:text-neutral-450 mt-1">
              Thank you for partnering with Learn 2 Future. Let's grow together.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
