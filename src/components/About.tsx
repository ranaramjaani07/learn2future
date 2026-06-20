import React, { useState } from "react";
import { 
  Compass, 
  Eye, 
  ShieldAlert, 
  Award, 
  Cpu, 
  Zap, 
  Sparkles, 
  Target, 
  CheckCircle,
  TrendingUp,
  Brain,
  ChevronDown,
  HelpCircle
} from "lucide-react";

export const About: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "How and when do I get access to my purchased courses?",
      answer: "Once your course registration is submitted, we provide direct links or private channels (such as our premium Telegram broadcast) to access standard video files, project materials, presets, and community assets instantly upon manual payment confirmation.",
      category: "Course Access"
    },
    {
      question: "How does the manual screenshot payment verification work?",
      answer: "To ensure democratized, credit-card-free access, we support instant localized QR payments, manual transfers, or custom digital gateway audits. Simply make the transaction, upload a clear visual proof or transaction receipt screenshot during order checkout, and submit. Our audit team screens submissions manually.",
      category: "Payment Verification"
    },
    {
      question: "How long does the payment audit process take?",
      answer: "Most payment checks and credentials dispatch happens within 1 to 4 hours during active hours. Once verified by our administrative desks, your Enrollment Vault will list the course as 'Access Active', and we'll instantly release your study credentials, Telegram invite codes, and milestone badges.",
      category: "Payment Verification"
    },
    {
      question: "Do I need prior experience or technical setup to begin?",
      answer: "None! Every syllabus program starts with foundational theory, setup instructions, and key configuration guides. Whether you are launching a SaaS without code, configuring multi-agent systems, or colorist profiles, we walk through each workflow click-by-click.",
      category: "Learning Process"
    },
    {
      question: "Can I track my learning progression status?",
      answer: "Yes! If you open your personal Student Enrollment Vault, you'll find a progressive lecture checklist to check off modules as you complete them. Your completion percentages, credential keys, and VIP access codes are stored securely in your dashboard profile.",
      category: "Learning Process"
    }
  ];
  
  const values = [
    {
      title: "Real-World Practicality",
      description: "We hate abstract noise. Every course, asset, and framework we dispatch is built to cut out fluff and deliver immediate market utility.",
      icon: Target,
      color: "text-amber-400 bg-amber-500/10"
    },
    {
      title: "Community Synergy",
      description: "Learning shouldn't occur in silos. We support peer-to-peer review, mutual feedback, and active continuous growth inside Telegram.",
      icon: Sparkles,
      color: "text-purple-400 bg-purple-500/10"
    },
    {
      title: "Zero-Barrier Access",
      description: "Quality digital credentials shouldn't require life-crippling student debt. We split high-grade content down to democratic prices.",
      icon: Zap,
      color: "text-emerald-400 bg-emerald-500/10"
    },
    {
      title: "Integrity Checks",
      description: "No multi-level marketing tricks or artificial hype schemas. Just transparent, high-end, structured modules built to solve real-world tasks.",
      icon: ShieldAlert,
      color: "text-rose-400 bg-rose-500/10"
    }
  ];

  const benefits = [
    {
      title: "Future-Proof Career Security",
      desc: "By upgrading in AI tool stacks and modern channels, you become completely irreplaceable, thriving in any macroeconomic consolidation."
    },
    {
      title: "Higher Earning Potential",
      desc: "Digital assets, high-ticket freelancing blueprints, and audience-retention knowledge commands immediate global dollar-denominated valuations."
    },
    {
      title: "Cognitive Flex & Neuroplasticity",
      desc: "Engaging with rapid AI prompt engineering, design systems, and start-up mechanics improves quick-thinking and spatial intelligence."
    },
    {
      title: "Ultimate Location Autonomy",
      desc: "Work from any beach, coffee shop, or coworking space. Master digital skills that allow full freelancing and autonomous digital income streams."
    }
  ];

  return (
    <div className="space-y-24 pb-20 animate-in fade-in duration-300">
      
      {/* HEADER HERO segment */}
      <section className="relative text-center max-w-4xl mx-auto px-4 pt-12 md:pt-16 space-y-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-brand-gold/10 rounded-full blur-[90px] -z-10"></div>
        
        <span className="text-xs font-mono font-bold tracking-widest text-brand-gold uppercase">
          Brand Philosophy
        </span>
        <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Continuously Upgrading <br />
          For What Lies Ahead
        </h1>
        <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed font-sans">
          Learn 2 Future is a dedicated e-learning collective. We build luxury-grade digital training suites that empower digital creators, students, and freelancers to thrive in an era of rapid AI transformations.
        </p>
      </section>

      {/* MISSION & VISION BENTO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Mission panel */}
          <div className="p-8 md:p-12 border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-[#151515] rounded-3xl space-y-6 relative overflow-hidden group">
            <div className="absolute top-[-2%] right-[-2%] w-24 h-24 bg-brand-gold/5 rounded-full blur-2xl group-hover:bg-brand-gold/10 transition-colors"></div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
              <Compass className="w-6 h-6" />
            </div>
            <div className="space-y-3">
              <h2 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">
                Our Mission
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Empowering people with future-ready skills through highly accessible, premium learning resources and structured digital workflows. We bypass academic noise to teach the actual, operational strategies that build digital income pipelines.
              </p>
            </div>
            <ul className="text-xs text-neutral-550 dark:text-neutral-355 space-y-2.5 font-sans font-medium">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Actionable, zero-fluff screen recordings</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Plug-and-play presets and asset downloads</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Empowering freelancers to target global valuations</span>
              </li>
            </ul>
          </div>

          {/* Vision panel */}
          <div className="p-8 md:p-12 border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-[#151515] rounded-3xl space-y-6 relative overflow-hidden group">
            <div className="absolute top-[-2%] right-[-2%] w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-505/10 transition-colors"></div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Eye className="w-6 h-6" />
            </div>
            <div className="space-y-3">
              <h2 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">
                Our Vision
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                To build a learning-first community where individuals continuously upgrade their skills and prepare for tomorrow's opportunities. We aim to be the premier global school for digital-first career acceleration, unlocking true economic mobility for users.
              </p>
            </div>
            <ul className="text-xs text-neutral-550 dark:text-neutral-355 space-y-2.5 font-sans font-medium">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>A supportive, interactive peer community of 100k+ learners</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Decentralized e-learning with seamless mobile delivery</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Fostering continuous educational pivots as technology shifts</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* VALUES SEGMENT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-brand-gold uppercase">
            Operational Values
          </span>
          <h2 className="font-display text-3xl font-bold text-neutral-900 dark:text-white">
            Our Code Of Ethics
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => {
            const ValIcon = v.icon;
            return (
              <div 
                key={i} 
                className="p-6 border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-[#151515] rounded-2xl flex flex-col space-y-4 hover:border-brand-gold/20 transition-all"
              >
                <div className={`w-10 h-10 rounded-lg ${v.color} flex items-center justify-center shrink-0`}>
                  <ValIcon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-base text-neutral-900 dark:text-white">
                    {v.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {v.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CONTINUOUS LEARNING BENEFITS */}
      <section className="bg-neutral-100 dark:bg-[#111111]/40 border-y border-neutral-200 dark:border-neutral-950 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            
            {/* Visual CTA text */}
            <div className="space-y-5 lg:col-span-1">
              <span className="text-xs font-mono font-bold tracking-widest text-brand-gold uppercase block">
                The Compounding Effect
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white leading-tight">
                Why Continuous Learning is Non-Negotiable
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
                Curating skills is no longer a luxury. The rapid ascension of automated tools means those who rest on yesterday's operational habits face rapid displacement. Continuous upskilling multiplies your adaptability and freedom.
              </p>
              
              <div className="p-4 bg-yellow-500/5 border border-brand-gold/15 rounded-xl flex items-start space-x-3 text-xs text-brand-gold/90">
                <Brain className="w-5 h-5 shrink-0 mt-0.5" />
                <span>Continuous learner outcomes display up to 4x relative conversion speed during job market transformations.</span>
              </div>
            </div>

            {/* Grid display */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {benefits.map((b, idx) => (
                <div 
                  key={idx}
                  className="p-6 rounded-2xl border border-neutral-250 dark:border-brand-border bg-white dark:bg-[#151515] space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4.5 h-4.5 text-brand-gold shrink-0" />
                    <h3 className="font-display text-base font-bold text-neutral-900 dark:text-white">
                      {b.title}
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
                    {b.desc}
                  </p>
                </div>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* FAQ ACCORDION SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-12 space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-brand-gold uppercase">
            Syllabus Assistant
          </span>
          <h2 className="font-display text-3xl font-bold text-neutral-900 dark:text-white">
            Frequently Answered Questions
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto leading-relaxed">
            Quick responses to credentials onboarding, payment verification cycles, and tutorial workflows.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div 
                key={index}
                className="bg-white dark:bg-[#121212] rounded-2xl border border-neutral-200 dark:border-brand-border overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left font-display font-semibold text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-[#161616] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                    <span className="text-sm md:text-base leading-tight">{faq.question}</span>
                  </div>
                  <ChevronDown 
                    className={`w-4 h-4 text-neutral-450 dark:text-neutral-500 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`} 
                  />
                </button>

                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-56 border-t border-neutral-105 dark:border-brand-border/40" : "max-h-0"
                  }`}
                >
                  <div className="p-6 text-xs md:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans bg-neutral-50/50 dark:bg-[#0b0b0b]/60 space-y-3">
                    <p>{faq.answer}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-brand-gold/10 text-brand-gold">
                        {faq.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};
