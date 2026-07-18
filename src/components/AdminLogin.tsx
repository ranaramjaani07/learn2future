import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { ShieldAlert, LogIn, LogOut, ArrowRight, ShieldCheck, Sparkles, Mail, Key } from "lucide-react";

export const AdminLogin: React.FC = () => {
  const { user, isAdmin, loginWithGoogle, loginWithEmailPassword, logout, setCurrentPage, loginAsDemoAdmin } = useApp();
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [authMode, setAuthMode] = useState<"google" | "email">("email"); // Default to email for 100% reliable login inside iframes
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  // Redirect if logged in and confirmed as Admin
  useEffect(() => {
    if (user && isAdmin) {
      setCurrentPage("admin-dashboard");
    }
  }, [user, isAdmin, setCurrentPage]);

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setErrorText("");
    try {
      await loginWithGoogle();
    } catch (e: any) {
      console.error("Login component caught error:", e);
      const msg = e?.message || "";
      const code = e?.code || "";
      if (code === "auth/popup-blocked" || msg.includes("popup-blocked") || msg.includes("blocked")) {
        setErrorText("Pop-up Blocked: Your browser blocked the Google Sign-In popup. Please allow pop-ups or use the Email & Password login below.");
      } else if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request" || msg.includes("popup-closed-by-user") || msg.includes("cancelled-popup-request") || msg.includes("cancelled")) {
        setErrorText("Sign-In Closed: The Google Auth popup was closed or cancelled. Please use the Email & Password login below.");
      } else if (msg.includes("Pending promise was never set") || msg.includes("INTERNAL ASSERTION FAILED")) {
        setErrorText("Firebase Auth Collision: A pending authenticating action was interrupted. Please refresh the page completely, or use the Email & Password login.");
      } else {
        setErrorText(`Auth Exception: ${e?.message || String(e)}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput) {
      setErrorText("Please enter both authorized email and password.");
      return;
    }
    setSubmitting(true);
    setErrorText("");
    try {
      await loginWithEmailPassword(emailInput.trim(), passwordInput);
    } catch (e: any) {
      console.error("Email login caught error:", e);
      setErrorText(e?.message || "Invalid credentials. Please verify your admin password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 px-4 animate-in fade-in zoom-in duration-300">
      <div className="border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] p-8 rounded-3xl space-y-6 relative overflow-hidden shadow-2xl flex flex-col items-center">
        
        {/* Aesthetic background accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full blur-2xl"></div>

        {/* Shield icon */}
        <div className="w-16 h-16 bg-brand-gold/15 text-brand-gold rounded-full flex items-center justify-center animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center justify-center gap-2">
            Admin Auth Hub <Sparkles className="w-4.5 h-4.5 text-brand-gold shrink-0" />
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Please authenticate using your authorized Google Admin Account or Email Credentials to access management settings.
          </p>
        </div>

        {user ? (
          // Logged in but reached here (Meaning they logged in but are NOT admin)
          <div className="space-y-4 w-full">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left space-y-2">
              <span className="text-[10px] uppercase font-mono font-bold text-red-500 block">Access Revoked</span>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 font-sans leading-normal">
                Logged in successfully as <b className="text-neutral-900 dark:text-white break-all">{user.email}</b>, but you do not hold administrative clearances on Learn 2 Future.
              </p>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                Contact: <span className="font-mono text-brand-gold">digitalcoursesbay@gmail.com</span> to bootstrap your UID role.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={logout}
                className="w-full sm:w-auto flex-grow bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold font-display text-xs py-3 px-4 rounded-xl transition-colors shrink-0"
              >
                Sign Out
              </button>
              <button
                onClick={() => setCurrentPage("home")}
                className="w-full sm:w-auto flex-grow bg-brand-gold text-black font-semibold font-display text-xs py-3 px-4 rounded-xl hover:bg-gold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Return Home</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          // Standard state, prompts Login Options
          <div className="space-y-4 w-full text-left">
            {errorText && (
              <div className="p-3 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-sans text-left">
                <strong>Auth Issue Detected:</strong> {errorText}
              </div>
            )}

            {/* Premium segmented control for Auth Mode */}
            <div className="grid grid-cols-2 p-1 bg-neutral-100 dark:bg-[#0c0c0c] rounded-xl border border-neutral-200 dark:border-brand-border text-center select-none">
              <button
                type="button"
                onClick={() => setAuthMode("email")}
                className={`py-2 px-3 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  authMode === "email"
                    ? "bg-brand-gold text-black font-bold shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                Email credentials
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("google")}
                className={`py-2 px-3 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  authMode === "google"
                    ? "bg-brand-gold text-black font-bold shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                Google Google Auth
              </button>
            </div>

            {authMode === "email" ? (
              /* EMAIL & PASSWORD LOGIN FORM */
              <form onSubmit={handleEmailLogin} className="space-y-3.5 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase">Admin Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-neutral-500" />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="digitalcoursesbay@gmail.com"
                      className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3.5 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase">Secure Password</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-neutral-500" />
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3.5 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-neutral-950 dark:bg-black border border-neutral-800 text-white hover:bg-neutral-900 dark:hover:bg-neutral-950 h-11 rounded-xl text-xs font-display font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer mt-1"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying Authority...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 text-brand-gold" />
                      <span>Authenticate Secure Session</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* GOOGLE POPUP LOGIN */
              <div className="space-y-4 pt-1">
                {/* Sandbox iframe context helper details */}
                <div className="p-3.5 bg-neutral-50 dark:bg-[#1c1c1c] rounded-xl border border-neutral-200 dark:border-neutral-800 text-left space-y-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  <span className="font-bold text-brand-gold font-mono block">🖥️ PREVIEW RUNTIME ADVISORY:</span>
                  <p>
                    Google popup auth is heavily restricted by browser sandboxes in some iframe views. If you see popup blocks, <strong>open this app in a new tab</strong> via the top-right button, or use the <strong>Email Credentials</strong> tab above.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={submitting}
                  className="w-full bg-neutral-900 border border-neutral-750 hover:bg-neutral-800 dark:bg-black dark:hover:bg-neutral-900 text-white dark:border-brand-border h-12 rounded-xl text-xs font-display font-medium transition-all flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Authenticating Google...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 shrink-0 text-brand-gold" />
                      <span>Google Admin Account Log In</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setCurrentPage("home")}
              className="text-xs font-sans text-neutral-400 hover:text-[#F5B300] transition-colors block mx-auto pt-2"
            >
              Cancel and Return to Home Portal
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
