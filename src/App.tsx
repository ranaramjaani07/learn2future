import React, { Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { SEOHead } from "./components/SEOHead";
import { AnimatedBackground } from "./components/AnimatedBackground";
// All route components lazy loaded for optimal code splitting
const Home = React.lazy(() => import("./components/Home").then(m => ({ default: m.Home })));
const Courses = React.lazy(() => import("./components/Courses").then(m => ({ default: m.Courses })));

// Additional lazy loaded components
const About = React.lazy(() => import("./components/About").then(m => ({ default: m.About })));
const Contact = React.lazy(() => import("./components/Contact").then(m => ({ default: m.Contact })));
const AdminLogin = React.lazy(() => import("./components/AdminLogin").then(m => ({ default: m.AdminLogin })));
const AdminDashboard = React.lazy(() => import("./components/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const MyEnrollments = React.lazy(() => import("./components/MyEnrollments").then(m => ({ default: m.MyEnrollments })));
const Blog = React.lazy(() => import("./components/Blog").then(m => ({ default: m.Blog })));
const BlogDetails = React.lazy(() => import("./components/BlogDetails").then(m => ({ default: m.BlogDetails })));
const Terms = React.lazy(() => import("./components/Terms").then(m => ({ default: m.Terms })));
const Privacy = React.lazy(() => import("./components/Privacy").then(m => ({ default: m.Privacy })));
const RefundPolicy = React.lazy(() => import("./components/RefundPolicy").then(m => ({ default: m.RefundPolicy })));
const AffiliateInfo = React.lazy(() => import("./components/AffiliateInfo").then(m => ({ default: m.AffiliateInfo })));
const Onboarding = React.lazy(() => import("./components/Onboarding").then(m => ({ default: m.Onboarding })));
const CartPage = React.lazy(() => import("./components/CartPage").then(m => ({ default: m.CartPage })));
const ThankYou = React.lazy(() => import("./components/ThankYou").then(m => ({ default: m.ThankYou })));
const CourseLandingPage = React.lazy(() => import("./components/CourseLandingPage").then(m => ({ default: m.CourseLandingPage })));
const StudentPortfolio = React.lazy(() => import("./components/StudentPortfolio").then(m => ({ default: m.StudentPortfolio })));

const RouteLoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#070707] text-white space-y-4">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 border-2 border-neutral-900 rounded-full"></div>
      <div className="absolute inset-0 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
    <p className="text-[10px] text-neutral-500 font-mono tracking-widest animate-pulse uppercase">Syncing ledger...</p>
  </div>
);

const MainLayout: React.FC = () => {
  const { 
    currentPage, 
    authError, 
    setAuthError, 
    dbUser, 
    logout, 
    authModalOpen, 
    setAuthModalOpen, 
    authModalMessage, 
    loginWithGoogle, 
    loginAsDemoStudent,
    loginAsDemoAdmin,
    isQuotaExceeded,
    user, 
    setCurrentPage,
    isAdmin,
    toast,
    globalSettings
  } = useApp();

  if (dbUser && dbUser.disabled) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#070707] text-white p-6 select-none font-sans animate-in fade-in duration-300">
        <div className="max-w-md w-full bg-[#121212] border border-red-500/20 p-8 rounded-3xl text-center space-y-6 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-lg font-bold tracking-widest text-white uppercase">Clearance Suspended</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Your student entry credentials have been temporarily disabled by a system administrator. If you believe this is an error, please reach out to support.
            </p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl text-left space-y-1">
            <span className="text-[10px] uppercase font-mono text-neutral-500 tracking-wider">Registered Profile</span>
            <p className="text-sm font-mono text-brand-gold font-bold truncate">{dbUser.email}</p>
          </div>
          <button
            onClick={() => logout()}
            className="w-full bg-red-650 hover:bg-red-700 text-white font-mono uppercase tracking-widest text-xs font-bold py-3.5 px-6 rounded-xl transition"
          >
            Exit Session
          </button>
        </div>
      </div>
    );
  }

  const routerLocation = useLocation();

  const getPageSeo = () => {
    // If it's a detail page, we return null so the detail component itself handles it
    if (["course-details", "student-portfolio", "blog-details"].includes(currentPage)) {
      return null;
    }

    const defaultTitle = globalSettings?.defaultCardTitle || "Learn 2 Future | Learn Today. Earn Tomorrow.";
    const defaultDesc = globalSettings?.defaultCardDescription || "Acquire future-ready credentials and join an active community of 10,000+ continuous digital earners. Courses in AI agents, high-ticket freelancing, and viral media.";
    const defaultImg = globalSettings?.ogDefaultImageUrl || "/brand_logo.jpg";

    switch (currentPage) {
      case "home":
        return { title: defaultTitle, description: defaultDesc, image: defaultImg };
      case "courses":
        return { title: "All Courses | Learn 2 Future", description: "Explore state-of-the-art modular programs designed to qualify you for global digital freelancing. Secure your seat today.", image: defaultImg };
      case "about":
        return { title: "About Us | Learn 2 Future", description: "Our mandate: bridge the divide between theoretical understanding and hyper-active digital cash flow. Meet the continuous earner network.", image: defaultImg };
      case "contact":
        return { title: "Contact Support | Learn 2 Future", description: "Need coordination or billing assistance? Direct message our elite learning guides online.", image: defaultImg };
      case "blog":
        return { title: "Expert Hub Insights | Learn 2 Future", description: "Daily research briefings detailing emerging AI agents, viral media execution guides, and client acquisition tactics.", image: defaultImg };
      case "cart":
        return { title: "Shopping Cart | Learn 2 Future", description: "Your pending educational investments. Upgrade your future in a single click.", image: defaultImg };
      case "thank-you":
        return { title: "Order Confirmed! | Learn 2 Future", description: "Success! Your enrollment passes are active. Welcome to the learning network.", image: defaultImg };
      default:
        return { title: defaultTitle, description: defaultDesc, image: defaultImg };
    }
  };

  const seoData = getPageSeo();

  return (
    <div className="min-h-screen flex flex-col justify-between text-neutral-900 dark:text-white transition-colors duration-300">
      <AnimatedBackground />
      {seoData && <SEOHead {...seoData} />}
      {/* Universal header navigation */}
      <Navbar />

      {isQuotaExceeded && (
        <div className="bg-gradient-to-r from-amber-600 to-red-600 text-white py-4 px-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs sm:text-sm font-sans z-50 animate-in slide-in-from-top duration-300 border-b border-amber-500/20">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 max-w-7xl mx-auto w-full">
            <div className="font-bold uppercase tracking-wider bg-black/35 text-amber-300 px-2.5 py-1 rounded text-[10px] whitespace-nowrap border border-amber-500/20 animate-pulse">
              ⚠️ DB Offline (Quota Exceeded)
            </div>
            <div className="flex-grow space-y-0.5">
              <p className="font-bold text-sm text-amber-50">Database Limit reached for today (Spark Plan 50,000 daily read limits exhausted).</p>
              <p className="text-neutral-200 text-[11px] leading-normal font-sans">
                Google Cloud has temporarily frozen database access on this project. You can still bypass and test every feature live using our local developer sandbox.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0 pt-1 lg:pt-0">
              <a
                href="https://console.firebase.google.com/project/gen-lang-client-0184060575/firestore/databases/ai-studio-2980de92-2452-4a19-90f8-80bf9307d675/data?openUpgradeDialog=true"
                target="_blank"
                referrerPolicy="no-referrer"
                className="bg-black/40 hover:bg-black/60 border border-amber-305/30 hover:border-amber-305/50 text-amber-200 font-mono text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all flex items-center gap-1 uppercase tracking-wider"
              >
                Open Google Console <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => {
                  loginAsDemoStudent();
                }}
                className="bg-white hover:bg-neutral-100 text-neutral-900 font-sans text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all shadow-sm uppercase tracking-wider"
              >
                Bypass as Student
              </button>
              <button
                onClick={() => {
                  loginAsDemoAdmin();
                }}
                className="bg-amber-400 hover:bg-amber-500 text-black font-sans text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all shadow-sm uppercase tracking-wider"
              >
                Bypass as Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {authError && (
        <div className="bg-red-600 text-white py-3 px-4 shadow-md flex items-center justify-between text-xs sm:text-sm font-sans z-50 animate-in slide-in-from-top duration-300">
          <div className="flex items-center space-x-2 max-w-7xl mx-auto w-full">
            <span className="font-bold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded text-[10px]">Alert</span>
            <p className="flex-grow">{authError}</p>
            <button
              onClick={() => setAuthError(null)}
              className="text-white hover:text-neutral-200 font-extrabold px-2.5 py-1 rounded hover:bg-white/10 transition-all font-mono ml-4"
              aria-label="Dismiss alert"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main rendering viewport with smooth animations */}
      <main id="main-content" className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={routerLocation.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="w-full"
          >
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes location={routerLocation}>
                <Route path="/" element={<Home />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/course/:slug" element={<CourseLandingPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blogs" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogDetails />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/refund" element={<Navigate to="/refund-policy" replace />} />
                <Route path="/affiliate" element={<AffiliateInfo />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/thank-you" element={<ThankYou />} />
                <Route path="/student-portfolio" element={<StudentPortfolio />} />
                <Route path="/student/:username" element={<StudentPortfolio />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/my-enrollments" element={<MyEnrollments />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin-dashboard" element={isAdmin ? <AdminDashboard /> : <Navigate to="/admin-login" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Universal footer bar */}
      <Footer />

      {/* Account Setup Status / Sign-In Dialog */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-350">
          <div className="bg-[#0b0b0b] border border-neutral-900 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative text-center">
            
            <button 
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
              aria-label="Close setup modal"
            >
              ✕
            </button>

            <div className="w-14 h-14 bg-amber-500/10 border border-amber-550/25 rounded-full flex items-center justify-center mx-auto text-amber-500 animate-pulse">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6V7m0 10a5 5 0 110-10 5 5 0 010 10z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-display font-medium tracking-tight text-white">Setup Authentication Required</h3>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                {authModalMessage || "Please complete account setup before continuing."}
              </p>
            </div>

            {/* Step checklist details */}
            <div className="bg-black/40 border border-neutral-900 rounded-2xl p-4.5 space-y-3.5 text-left text-xs">
              <div className="flex items-start gap-2.5">
                <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ${user ? "bg-green-500/15 text-green-500 border border-green-500/20" : "bg-neutral-900 text-neutral-500 border border-neutral-850"}`}>
                  {user ? "✓" : "1"}
                </span>
                <div className="space-y-0.5">
                  <p className="font-bold text-neutral-200">Registered Student Login</p>
                  <p className="text-[10px] text-neutral-500">{user ? `Signed in as ${user.email}` : "An active user session is required."}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 border-t border-neutral-950 pt-2.5">
                <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ${(user && (user.emailVerified || user.providerData.some(p => p.providerId === "google.com"))) ? "bg-green-500/15 text-green-500 border border-green-500/20" : "bg-neutral-900 text-neutral-500 border border-neutral-850"}`}>
                  {(user && (user.emailVerified || user.providerData.some(p => p.providerId === "google.com"))) ? "✓" : "2"}
                </span>
                <div className="space-y-0.5">
                  <p className="font-bold text-neutral-200">Email Address Verification</p>
                  <p className="text-[10px] text-neutral-500">Allows login retrievals and license claims.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 border-t border-neutral-950 pt-2.5">
                <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ${dbUser?.onboardingCompleted ? "bg-green-500/15 text-green-500 border border-green-500/20" : "bg-neutral-900 text-neutral-500 border border-neutral-850"}`}>
                  {dbUser?.onboardingCompleted ? "✓" : "3"}
                </span>
                <div className="space-y-0.5">
                  <p className="font-bold text-neutral-200">Complete Executive Onboarding</p>
                  <p className="text-[10px] text-neutral-500">Configure profile dispatch coordinates.</p>
                </div>
              </div>
            </div>

            {/* Quick response actions */}
            <div className="space-y-2.5 pt-1.5 pt-1">
              {!user && (
                <div className="space-y-2">
                  <button 
                    onClick={async () => {
                      try {
                        await loginWithGoogle();
                        setAuthModalOpen(false);
                        // Go to onboarding next
                        setTimeout(() => {
                          setCurrentPage("onboarding");
                        }, 500);
                      } catch (_) {}
                    }}
                    className="w-full bg-[#1A6EF2] hover:bg-[#1A6EF2]/95 text-white/95 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors"
                  >
                    Quick Google Sign-In
                  </button>
                </div>
              )}

              {user && !(user.emailVerified || user.providerData.some(p => p.providerId === "google.com")) && (
                <button 
                  onClick={() => {
                    setAuthModalOpen(false);
                    setCurrentPage("my-enrollments");
                  }}
                  className="w-full bg-[#1A6EF2] hover:bg-[#1A6EF2]/95 text-white py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors"
                >
                  Go to Verification Panel
                </button>
              )}

              {user && (user.emailVerified || user.providerData.some(p => p.providerId === "google.com")) && !dbUser?.onboardingCompleted && (
                <button 
                  onClick={() => {
                    setAuthModalOpen(false);
                    setCurrentPage("onboarding");
                  }}
                  className="w-full bg-brand-gold hover:bg-[#ffd34d] text-black py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors"
                >
                  Fill Onboarding Profile
                </button>
              )}

              <button 
                onClick={() => setAuthModalOpen(false)}
                className="w-full bg-neutral-900 border border-neutral-805 hover:bg-neutral-850 text-neutral-400 py-2.5 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-colors"
              >
                Dismiss Prompt
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-300">
          <div className={`px-5 py-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] border ${
            toast.type === "success" 
              ? "bg-[#0b0c0a] border-emerald-500/30 text-emerald-400" 
              : toast.type === "error" 
              ? "bg-[#0c0a0a] border-red-500/30 text-red-400" 
              : "bg-[#0a0c0c] border-brand-gold/30 text-brand-gold"
          } flex items-center gap-3 font-sans`}>
            {toast.type === "success" ? (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-xs font-mono font-bold tracking-wide uppercase">
              <span className="text-[10px] text-neutral-400 mr-1.5 font-sans">STATUS:</span>
              {toast.message}
            </span>
          </div>
        </div>
      )}
      
    </div>
  );
};

import { TrackingManager } from "./components/TrackingManager";

export default function App() {
  return (
    <AppProvider>
      <TrackingManager />
      <MainLayout />
    </AppProvider>
  );
}
