import React, { useState } from "react";
import { SEO } from "./SEO";
import { 
  Send as TelegramIcon, 
  Instagram, 
  Mail, 
  CheckCircle, 
  Info,
  Calendar,
  Layers,
  MapPin,
  Clock
} from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { ContactMessage } from "../types";
import { useApp } from "../context/AppContext";

export const Contact: React.FC = () => {
  const { globalSettings } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorNotice, setErrorNotice] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      setErrorNotice("Please fill in all the required contact fields.");
      return;
    }

    setSubmitting(true);
    setErrorNotice("");

    const pathString = "contactMessages";
    try {
      const messagePayload: Omit<ContactMessage, "id"> = {
        name,
        email,
        subject,
        message,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, pathString), messagePayload);
      setSuccess(true);
      
      // Clear contact form states
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, pathString);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 animate-in fade-in duration-305">
      <SEO 
        title="Contact Technical Support & Learning Guides"
        description="Have questions about our course licenses, payment audits, or Telegram community invites? Send a message to our support desk or reach us directly on Telegram."
        keywords="contact learn2future, support learn2future, digital courses support, upi payment help"
        url="https://learn2future.vercel.app/contact"
        type="contact"
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Contact", item: "/contact" }
        ]}
      />
      
      {/* Intro Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-mono font-bold tracking-widest text-brand-gold uppercase">
          Support Center
        </span>
        <h1 className="font-display text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
          We Are Here To Assist You
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto text-sm leading-relaxed">
          Reach our dedicated technical desks for payment queries, catalog licensing, or corporate program inquiries.
        </p>
      </div>

      {/* CORE DISPLAY: FORM vs DIRECT INFO BRICKS */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        
        {/* Left Col: Channel info panel (lg:span-2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 border border-neutral-200 dark:border-neutral-900 rounded-3xl bg-white dark:bg-[#151515] space-y-6 relative overflow-hidden">
            <div className="absolute top-[-2%] right-[-2%] w-20 h-20 bg-brand-gold/5 rounded-full blur-2xl"></div>
            
            <div className="space-y-2">
              <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">
                Direct Channels
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Skip the ticket queue by sending direct messages to our media desks on Telegram and Instagram.
              </p>
            </div>

            <div className="space-y-4">
              
              {/* Email channel card */}
              {globalSettings.supportEmail && (
                <a 
                  href={`mailto:${globalSettings.supportEmail}`}
                  className="flex items-center space-x-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-900 bg-neutral-50 dark:bg-[#0b0b0b] hover:border-brand-gold/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[9px] text-neutral-400 uppercase tracking-wider font-mono font-bold">Email Desk</span>
                    <span className="text-xs text-neutral-900 dark:text-white font-semibold truncate block break-all">{globalSettings.supportEmail}</span>
                  </div>
                </a>
              )}

              {/* Telegram channel card */}
              {globalSettings.telegramChannelLink && (
                <a 
                  href={globalSettings.telegramChannelLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-900 bg-neutral-50 dark:bg-[#0b0b0b] hover:border-brand-gold/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                    <TelegramIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[9px] text-neutral-400 uppercase tracking-wider font-mono font-bold">Telegram Communique</span>
                    <span className="text-xs text-[#F5B300] hover:underline font-semibold truncate block">
                      {globalSettings.telegramUsername || "Telegram Support"}
                    </span>
                  </div>
                </a>
              )}

              {/* Instagram channel card */}
              {globalSettings.instagramLink && (
                <a 
                  href={globalSettings.instagramLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-900 bg-neutral-50 dark:bg-[#0b0b0b] hover:border-brand-gold/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[9px] text-neutral-400 uppercase tracking-wider font-mono font-bold">Instagram Handle</span>
                    <span className="text-xs text-neutral-900 dark:text-white font-semibold truncate block">
                      {globalSettings.instagramLink.split("instagram.com/")[1]?.replace("/", "") || "Instagram Profile"}
                    </span>
                  </div>
                </a>
              )}

            </div>

            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-900/50 space-y-2 text-xs text-neutral-550 dark:text-neutral-400">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-brand-gold" />
                <span>Operating Hours: 09:00 AM - 09:00 PM IST</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-brand-gold" />
                <span>Response Time window: Typically &lt; 2 Hours</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Col: interactive validated contact form (lg:span-3) */}
        <div className="lg:col-span-3">
          <div className="p-8 md:p-10 border border-neutral-200 dark:border-neutral-900 rounded-3xl bg-white dark:bg-[#151515] relative">
            
            {success ? (
              // Success feedback module
              <div className="py-12 text-center space-y-4 animate-in fade-in duration-200">
                <div className="w-12 h-12 bg-green-500/15 text-green-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-xl font-bold text-neutral-900 dark:text-white">
                    Feedback Message Logged!
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                    Your transmission has been saved inside our systems successfully. Our student helpline desks will contact you shortly.
                  </p>
                </div>
                <button
                  onClick={() => setSuccess(false)}
                  className="bg-brand-gold text-black font-display text-xs font-semibold px-5 py-2.5 rounded-lg hover:bg-gold transition-colors mt-2"
                >
                  Send another message
                </button>
              </div>
            ) : (
              
              // Standard feedback submit form
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                  <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">
                    Drop a Message
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-normal">
                    Fill this direct catalog form. All submissions are stored globally and evaluated inside 24 hours.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div>
                    <label className="block text-[10px] text-neutral-400 uppercase tracking-widest font-mono font-semibold mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-neutral-100 dark:bg-[#0b0b0b] border border-neutral-200 dark:border-brand-border rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-gold text-neutral-900 dark:text-white"
                    />
                  </div>

                  {/* Email field */}
                  <div>
                    <label className="block text-[10px] text-neutral-400 uppercase tracking-widest font-mono font-semibold mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rahul@gmail.com"
                      className="w-full bg-neutral-100 dark:bg-[#0b0b0b] border border-neutral-200 dark:border-brand-border rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-gold text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Subject field */}
                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase tracking-widest font-mono font-semibold mb-1">
                    Subject / Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. UPI Checkout status help request"
                    className="w-full bg-neutral-100 dark:bg-[#0b0b0b] border border-neutral-200 dark:border-brand-border rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-gold text-neutral-900 dark:text-white"
                  />
                </div>

                {/* Message field */}
                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase tracking-widest font-mono font-semibold mb-1">
                    Message Body *
                  </label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder="Provide exact payment reference hash, course title or inquiry details..."
                    className="w-full bg-neutral-100 dark:bg-[#0b0b0b] border border-neutral-200 dark:border-brand-border rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-gold text-neutral-900 dark:text-white font-sans resize-none"
                  ></textarea>
                </div>

                {errorNotice && (
                  <div className="p-3 bg-red-500/10 text-red-500 text-xs rounded-xl border border-red-500/20">
                    {errorNotice}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-brand-gold text-black hover:bg-[#F5B300]/90 disabled:opacity-45 h-12 rounded-xl text-xs font-display font-bold transition-all shadow-xl shadow-brand-gold/15 flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4.5 h-4.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting Ticket...</span>
                    </>
                  ) : (
                    <span>Submit Request Ticket</span>
                  )}
                </button>

              </form>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
