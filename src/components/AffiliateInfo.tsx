import React from "react";
import { SEO } from "./SEO";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Award, Percent, DollarSign, Sparkles } from "lucide-react";

export const AffiliateInfo: React.FC = () => {

  return (
    <div className="py-12 md:py-20 bg-neutral-50 dark:bg-[#000000] transition-colors duration-300">
      <SEO 
        title="Student Affiliate Program" 
        description="Earn today and tomorrow. Learn how you can get up to 15% commissions promoting Learn2Future courses inside our professional student affiliate network." 
        keywords="affiliate program, learn2future affiliate, earn digital commissions, course affiliate india"
        url="https://learn2future.vercel.app/affiliate"
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Affiliate Info", item: "/affiliate" }
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation back */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 hover:text-brand-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home Portal
          </Link>
        </div>

        {/* Header content block */}
        <div className="text-center space-y-4 mb-16">
          <span className="inline-flex items-center gap-1.5 bg-brand-gold/10 border border-brand-gold/20 text-brand-gold font-mono uppercase tracking-widest text-[10px] py-1 px-3.5 rounded-full animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-brand-gold" /> Earn Tomorrow
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display uppercase tracking-tight text-neutral-900 dark:text-white leading-tight">
            Learn2Future Affiliate Program
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Promote future-tech credentials, empower your audience with deep-discount coupon codes, and build a recurring income stream with <strong>up to 15% manual direct payout commissions</strong> on verified sales.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          <div className="bg-white dark:bg-[#090909] border border-neutral-200 dark:border-neutral-900 rounded-2xl p-6 text-center space-y-3 hover:border-neutral-850 transition duration-200">
            <div className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/25 flex items-center justify-center mx-auto text-sm font-bold">
              <Percent className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-neutral-900 dark:text-white text-sm uppercase">10% Student Discount</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Your customized coupon code gives referees an instant 10% discount on any blueprint in our library.
            </p>
          </div>

          <div className="bg-white dark:bg-[#090909] border border-neutral-200 dark:border-neutral-900 rounded-2xl p-6 text-center space-y-3 hover:border-neutral-850 transition duration-200">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 flex items-center justify-center mx-auto text-sm font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-neutral-900 dark:text-white text-sm uppercase">15% Commissions</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Earn a 15% direct payout commission whenever a student enrolls using your customized profile coupon.
            </p>
          </div>

          <div className="bg-white dark:bg-[#090909] border border-neutral-200 dark:border-neutral-900 rounded-2xl p-6 text-center space-y-3 hover:border-neutral-850 transition duration-200">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/25 flex items-center justify-center mx-auto text-sm font-bold">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-neutral-900 dark:text-white text-sm uppercase">Manual Desk Payouts</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              We process payouts directly via UPI or Bank transfer. Secure manual audits ensure payouts within 24 hours.
            </p>
          </div>
        </div>

        {/* How to join instructions */}
        <div className="space-y-12 text-left">
          
          <section className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-900 rounded-3xl p-6 sm:p-10 space-y-4 shadow-sm">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
              How the Program Works
            </h2>
            <div className="text-neutral-600 dark:text-neutral-350 text-sm sm:text-base leading-relaxed space-y-4">
              <p>
                The Learn2Future affiliate network is structured to be hyper-transparent, accessible, and high-converting. Here is how you get started as an active promoter:
              </p>
              <ol className="list-decimal pl-5 space-y-3 text-xs sm:text-sm text-neutral-500">
                <li>
                  <strong className="text-neutral-900 dark:text-white">Register & Complete Profile:</strong> Log in to your Student Vault using Google or Email, and verify your account. Ensure your onboarding profile is fully complete.
                </li>
                <li>
                  <strong className="text-neutral-900 dark:text-white">Request Affiliate Coupon:</strong> Access the "Affiliate" tab inside your student panel. Input your preferred promo code and submit. Our support guides will manually approve and registry your code in 1-2 hours.
                </li>
                <li>
                  <strong className="text-neutral-900 dark:text-white">Promote and Track Sales:</strong> Share your coupon code with your audience, friends, or social media followers. Whenever someone enters it during course checkout, our systems link the purchase to your profile.
                </li>
                <li>
                  <strong className="text-neutral-900 dark:text-white">Instant Payout Request:</strong> Once your pending balance reaches ₹500, request a payout. Input your UPI ID or Bank coordinates, and our audit team will clear it manually with extreme speed.
                </li>
              </ol>
            </div>
          </section>

          {/* Guidelines Box */}
          <section className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-900 rounded-3xl p-6 sm:p-10 space-y-4 shadow-sm">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
              Affiliate Code of Conduct & Policies
            </h2>
            <div className="text-neutral-600 dark:text-neutral-350 text-sm sm:text-base leading-relaxed space-y-3.5">
              <p>
                To maintain standard quality, we enforce strict compliance guidelines:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-neutral-500">
                <li>We do not permit the placement of promo codes on spam, coupon aggregator, or voucher scrapers. Codes found on public voucher sites will be deactivated.</li>
                <li>Purchasing courses for yourself using your own affiliate coupon is prohibited and will result in manual cancelation of commissions.</li>
                <li>If an order is refunded, cancelled, disputed, or found to be based on fraudulent payment screenshots, the corresponding commission will be automatically voided.</li>
              </ul>
            </div>
          </section>

          {/* Call to action card */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-8 relative overflow-hidden text-center space-y-6">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand-gold/5 blur-3xl rounded-full" />
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-display font-bold text-white uppercase">Ready to launch your affiliate channel?</h3>
              <p className="text-xs text-neutral-400 max-w-lg mx-auto leading-relaxed">
                Log in to your student dashboard, access the affiliate hub tab, configure your transfer credentials, and claim your custom promotion coupon code in a single click.
              </p>
            </div>
            <div>
              <Link
                to="/my-enrollments"
                className="bg-brand-gold hover:bg-[#ffd34d] text-black text-xs font-mono font-bold uppercase tracking-widest py-3 px-8 rounded-xl transition inline-block shadow-lg"
              >
                Enter Student Vault & Apply
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
