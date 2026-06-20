import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Home } from "./components/Home";
import { Courses } from "./components/Courses";
import { About } from "./components/About";
import { Contact } from "./components/Contact";
import { AdminLogin } from "./components/AdminLogin";
import { AdminDashboard } from "./components/AdminDashboard";
import { MyEnrollments } from "./components/MyEnrollments";
import { Blog } from "./components/Blog";
import { BlogDetails } from "./components/BlogDetails";
import { Terms } from "./components/Terms";
import { Privacy } from "./components/Privacy";
import { Onboarding } from "./components/Onboarding";
import { CartPage } from "./components/CartPage";
import { ThankYou } from "./components/ThankYou";
import { CourseLandingPage } from "./components/CourseLandingPage";
import { StudentPortfolio } from "./components/StudentPortfolio";
import { SEOHead } from "./components/SEOHead";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, ArrowUpRight } from "lucide-react";

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

  const renderActivePage = () => {
    switch (currentPage) {
      case "home":
        return <Home />;
      case "courses":
        return <Courses />;
      case "about":
        return <About />;
      case "contact":
        return <Contact />;
      case "admin-login":
        return <AdminLogin />;
      case "admin-dashboard":
        return isAdmin ? <AdminDashboard /> : <AdminLogin />;
      case "my-enrollments":
        return <MyEnrollments />;
      case "blog":
        return <Blog />;
      case "blog-details":
        return <BlogDetails />;
      case "terms":
        return <Terms />;
      case "privacy":
        return <Privacy />;
      case "onboarding":
        return <Onboarding />;
      case "cart":
        return <CartPage />;
      case "thank-you":
        return <ThankYou />;
      case "course-details":
        return <CourseLandingPage />;
      case "student-portfolio":
        return <StudentPortfolio />;
      default:
        return <Home />;
    }
  };

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
    <div className="min-h-screen flex flex-col justify-between bg-neutral-50 dark:bg-[#000000] text-neutral-900 dark:text-white transition-colors duration-300">
      {seoData && <SEOHead {...seoData} />}
      {/* Universal header navigation */}
      <Navbar />

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
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="w-full"
          >
            {renderActivePage()}
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
                  <button 
                    onClick={() => {
                      loginAsDemoStudent();
                      setAuthModalOpen(false);
                    }}
                    className="w-full bg-brand-gold hover:bg-[#ffd34d] text-black py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors"
                  >
                    Demo Student Bypass (Iframe Safe)
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
