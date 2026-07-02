import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { 
  Send as TelegramIcon, 
  Instagram, 
  Mail, 
  ShieldCheck, 
  Sparkles, 
  BookOpen 
} from "lucide-react";

export const Footer: React.FC = () => {
  const { globalSettings } = useApp();

  return (
    <footer className="border-t transition-colors duration-300 bg-neutral-50 dark:bg-[#080808] border-neutral-200 dark:border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded bg-brand-gold flex items-center justify-center font-display font-bold text-black text-xs">
                L2F
              </div>
              <span className="font-display text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-1">
                Learn 2 Future <Sparkles className="w-4 h-4 text-brand-gold" />
              </span>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm">
              Empowering people with future-ready skills through premium curated e-learning resources, digital tools, and a peer-led Telegram community.
            </p>
            <div className="flex space-x-4">
              {globalSettings.telegramChannelLink && (
                <a
                  href={globalSettings.telegramChannelLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 transition-colors"
                  title="Join our Telegram community"
                >
                  <TelegramIcon className="w-5 h-5" />
                </a>
              )}
              {globalSettings.instagramLink && (
                <a
                  href={globalSettings.instagramLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 transition-colors"
                  title="Follow us on Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {globalSettings.supportEmail && (
                <a
                  href={`mailto:${globalSettings.supportEmail}`}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold transition-colors"
                  title="Mail support"
                >
                  <Mail className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Pages Navigation */}
          <div>
            <h3 className="font-display text-sm font-semibold tracking-wider text-neutral-900 dark:text-white uppercase mb-4">
              Explore Catalog
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/"
                  className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-brand-gold transition-colors"
                >
                  Home Portal
                </Link>
              </li>
              <li>
                <Link
                  to="/courses"
                  className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-brand-gold transition-colors"
                >
                  Course Catalog
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-brand-gold transition-colors"
                >
                  Our Philosophy & FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/affiliate"
                  className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-brand-gold transition-colors"
                >
                  Affiliate Program
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-brand-gold transition-colors"
                >
                  Contact & Help Desk
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details Column */}
          <div>
            <h3 className="font-display text-sm font-semibold tracking-wider text-neutral-900 dark:text-white uppercase mb-4">
              Direct Channels
            </h3>
            <ul className="space-y-3">
              {globalSettings.supportEmail && (
                <li className="flex items-start space-x-2 text-sm text-neutral-500 dark:text-neutral-400">
                  <Mail className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                  <span className="break-all">{globalSettings.supportEmail}</span>
                </li>
              )}
              {globalSettings.telegramUsername && (
                <li className="flex items-start space-x-2 text-sm text-neutral-500 dark:text-neutral-400">
                  <TelegramIcon className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                  <span>{globalSettings.telegramUsername} Channel/Support</span>
                </li>
              )}
              <li className="flex items-center space-x-2 text-xs font-mono text-neutral-400 dark:text-neutral-500 mt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                <span>SSL Encrypted Transactions</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Lower Border Area */}
        <div className="border-t border-neutral-200 dark:border-neutral-950 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center sm:text-left">
            &copy; {new Date().getFullYear()} Learn 2 Future. All rights reserved. Registered Educational Brand.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-4 sm:mt-0">
            <Link 
              to="/terms"
              className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-brand-gold transition-colors font-mono uppercase"
            >
              Terms & Conditions
            </Link>
            <Link 
              to="/privacy"
              className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-brand-gold transition-colors font-mono uppercase"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/refund-policy"
              className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-brand-gold transition-colors font-mono uppercase"
            >
              Refund Policy
            </Link>
            <Link 
              to="/influencer-promotion-policy"
              className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-brand-gold transition-colors font-mono uppercase"
            >
              Influencer Promotion Policy
            </Link>
            <Link 
              to="/admin-login"
              className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-brand-gold transition-colors font-mono uppercase tracking-widest flex items-center gap-1"
            >
              <ShieldCheck className="w-3 h-3" /> Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
