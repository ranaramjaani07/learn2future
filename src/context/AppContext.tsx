import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  User as FirebaseUser, 
  signInWithPopup, 
  signInWithRedirect,
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  browserPopupRedirectResolver
} from "firebase/auth";
import { doc, getDoc, getDocs, setDoc, updateDoc, serverTimestamp, collection, addDoc, arrayUnion, deleteDoc, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { GlobalSettings, User as DbUser, UserProfile, UserSettings } from "../types";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export type CurrentPage = "home" | "courses" | "about" | "contact" | "admin-login" | "admin-dashboard" | "my-enrollments" | "blog" | "blog-details" | "terms" | "privacy" | "onboarding" | "cart" | "thank-you" | "course-details" | "student-portfolio";

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  upiId: "digitalcoursesbay@upi",
  upiAccountName: "Learn 2 Future",
  upiQrCode: "",
  paymentInstructions: "1. Scan the QR code or pay to the UPI ID.\n2. Enter the course price.\n3. Make the payment.\n4. Take a screenshot.\n5. Upload the screenshot on the right to complete enrollment.",
  telegramChannelLink: "https://t.me/LearntoFuture",
  telegramSupportLink: "https://t.me/LearntoFutureSupport",
  telegramUsername: "@LearntoFutureSupport",
  instagramLink: "https://instagram.com/LearntoFuture",
  youtubeLink: "https://youtube.com/LearntoFuture",
  supportEmail: "digitalcoursesbay@gmail.com",
  brandLogoUrl: "https://learn2future.vercel.app/brand_logo.jpg",
  ogDefaultImageUrl: "https://learn2future.vercel.app/brand_logo.jpg",
  twitterPreviewImageUrl: "https://learn2future.vercel.app/brand_logo.jpg",
  defaultCardTitle: "Learn 2 Future | Learn Today. Earn Tomorrow.",
  defaultCardDescription: "Acquire future-ready credentials and join an active community of 10,000+ continuous digital earners. Courses in AI agents, high-ticket freelancing, and viral media."
};

interface AppContextType {
  currentPage: CurrentPage;
  setCurrentPage: (page: CurrentPage, blogSlug?: string | null) => void;
  selectedBlogSlug: string | null;
  setSelectedBlogSlug: (slug: string | null) => void;
  selectedCourseSlug: string | null;
  setSelectedCourseSlug: (slug: string | null) => void;
  user: FirebaseUser | null;
  dbUser: DbUser | null;
  loadingProfile: boolean;
  isAdmin: boolean;
  loading: boolean;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  signUpWithEmailPassword: (fullName: string, email: string, password: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  checkAdminPrivilege: (currentUser: FirebaseUser | null) => Promise<boolean>;
  loginAsDemoAdmin: () => void;
  loginAsDemoStudent: () => void;
  globalSettings: GlobalSettings;
  updateGlobalSettings: (newSettings: GlobalSettings) => Promise<void>;
  authError: string | null;
  setAuthError: (error: string | null) => void;
  updateUserProfile: (profileData: Partial<DbUser>) => Promise<void>;
  completeOnboarding: (data: Omit<DbUser, "uid" | "email" | "onboardingCompleted" | "createdAt" | "updatedAt" | "signupMethod">) => Promise<void>;
  logUserActivity: (action: string, details?: string) => Promise<void>;
  
  // Cart System variables
  cart: any[];
  addToCart: (course: any) => Promise<boolean>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateCartQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isSetupComplete: () => boolean;
  
  // Setup Authentication warning dialog
  authModalOpen: boolean;
  setAuthModalOpen: (val: boolean) => void;
  authModalMessage: string;
  setAuthModalMessage: (val: string) => void;
  
  // Toast notifications
  toast: { message: string; type: "success" | "error" | "info" } | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  orders: any[];
  hasPurchasedCourse: (userId: string | undefined, courseId: string) => boolean;
  urlCourseSlug: string | null;
  setUrlCourseSlug: (slug: string | null) => void;
  urlReferrerId: string | null;
  setUrlReferrerId: (ref: string | null) => void;
  selectedStudentUsername: string | null;
  setSelectedStudentUsername: (username: string | null) => void;
  isQuotaExceeded: boolean;
  setIsQuotaExceeded: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPageState] = useState<CurrentPage>("home");
  const [selectedBlogSlug, setSelectedBlogSlug] = useState<string | null>(null);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string | null>(null);
  const [urlCourseSlug, setUrlCourseSlug] = useState<string | null>(null);
  const [urlReferrerId, setUrlReferrerId] = useState<string | null>(null);
  const [selectedStudentUsername, setSelectedStudentUsername] = useState<string | null>(null);

  // Parse path-based parameters like affiliate referral code on load
  useEffect(() => {
    const search = window.location.search;
    const searchParams = new URLSearchParams(search);
    const ref = searchParams.get("ref");
    if (ref) {
      setUrlReferrerId(ref);
    }
  }, []);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("is_dark_mode");
    return saved !== null ? saved === "true" : true;
  });
  const [authError, setAuthError] = useState<string | null>(null);

  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);

  // Synchronized global orders state
  const [orders, setOrders] = useState<any[]>([]);

  // ── FIXED: One-time getDocs instead of persistent onSnapshot listener ──
  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    if (user.uid === "demo_admin_uid") {
      try {
        const local = localStorage.getItem("demo_orders");
        if (local) {
          const list = JSON.parse(local) as any[];
          setOrders(list.filter((o: any) => o.email === user.email));
        } else {
          setOrders([]);
        }
      } catch (_) {}
      return;
    }

    let cancelled = false;

    async function fetchOrders() {
      try {
        const { getDocs } = await import("firebase/firestore");
        const snap = await getDocs(query(collection(db, "orders"), where("email", "==", user!.email)));
        if (cancelled) return;
        const list: any[] = [];
        snap.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
        setOrders(list);
      } catch (err: any) {
        if (cancelled) return;
        const isQuota = err?.message?.toLowerCase().includes("quota") || err?.message?.toLowerCase().includes("resource_exhausted");
        if (isQuota) {
          console.warn("[AppContext] Orders fetch quota exceeded:", err);
          setIsQuotaExceeded(true);
        } else {
          console.error("[AppContext] Orders fetch error:", err);
        }
      }
    }

    fetchOrders();
    return () => { cancelled = true; };
  }, [user]);

  const hasPurchasedCourse = (userId: string | undefined, courseId: string) => {
    if (!userId) return false;
    return orders.some(o => 
      o.userId === userId && 
      o.courseId === courseId && 
      (o.status?.toLowerCase() === "approved" || 
       o.status?.toLowerCase() === "delivered" ||
       o.status?.toLowerCase() === "verified")
    );
  };

  // Cart and Authentication Warning Dialog States
  const [cart, setCart] = useState<any[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState("");

  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(() => {
    const stored = localStorage.getItem("demo_global_settings");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (_) {}
    }
    return DEFAULT_GLOBAL_SETTINGS;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__onFirestoreQuotaExceeded = () => {
        setIsQuotaExceeded(true);
      };
    }
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).__onFirestoreQuotaExceeded;
      }
    };
  }, []);

  // ── FIXED: One-time fetch with 30-min cache instead of persistent onSnapshot ──
  useEffect(() => {
    let cancelled = false;
    const SETTINGS_TTL = 30 * 60 * 1000;

    async function fetchGlobalSettings() {
      // Check localStorage freshness first
      const stored = localStorage.getItem("demo_global_settings_v2");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.ts && Date.now() - parsed.ts < SETTINGS_TTL) {
            if (!cancelled) setGlobalSettings(parsed.data);
            return;
          }
          // Show stale while refreshing
          if (!cancelled) setGlobalSettings(parsed.data);
        } catch (_) {}
      }

      try {
        const snap = await getDoc(doc(db, "settings", "globalSettings"));
        if (cancelled) return;
        if (snap.exists()) {
          const data = snap.data() as GlobalSettings;
          setGlobalSettings(data);
          localStorage.setItem("demo_global_settings_v2", JSON.stringify({ ts: Date.now(), data }));
          localStorage.setItem("demo_global_settings", JSON.stringify(data)); // backward compat
        }
      } catch (err: any) {
        console.warn("[AppContext] globalSettings fetch failed (using cached/default):", err);
        const isQuota = err?.message?.toLowerCase().includes("quota") || err?.message?.toLowerCase().includes("resource_exhausted");
        if (isQuota && !cancelled) setIsQuotaExceeded(true);
      }
    }

    fetchGlobalSettings();
    return () => { cancelled = true; };
  }, []);

  const updateGlobalSettings = async (newSettings: GlobalSettings) => {
    setGlobalSettings(newSettings);
    localStorage.setItem("demo_global_settings", JSON.stringify(newSettings));
    try {
      const docRef = doc(db, "settings", "globalSettings");
      await setDoc(docRef, newSettings);
    } catch (err) {
      console.error("Failed to write global settings to Firestore:", err);
      throw err;
    }
  };

  // Sync page state and update browser history with SEO-friendly path URLs
  const setCurrentPage = (page: CurrentPage, extraId: string | null = null) => {
    setCurrentPageState(page);
    let targetPath = "/";

    if (page === "course-details" && extraId) {
      setSelectedCourseSlug(extraId);
      targetPath = "/course/" + extraId;
    } else if (page === "student-portfolio" && extraId) {
      setSelectedStudentUsername(extraId);
      targetPath = "/student/" + extraId;
    } else if (page === "blog-details" && extraId) {
      setSelectedBlogSlug(extraId);
      targetPath = "/blog/" + extraId;
    } else if (page === "blog") {
      targetPath = "/blogs";
    } else if (page === "courses") {
      targetPath = "/courses";
    } else if (page === "about") {
      targetPath = "/about";
    } else if (page === "contact") {
      targetPath = "/contact";
    } else if (page === "terms") {
      targetPath = "/terms";
    } else if (page === "privacy") {
      targetPath = "/privacy";
    } else if (page === "cart") {
      targetPath = "/cart";
    } else if (page === "thank-you") {
      targetPath = extraId ? "/thank-you?order=" + extraId : "/thank-you";
    } else if (page === "my-enrollments") {
      targetPath = "/my-enrollments";
    } else if (page === "admin-login") {
      targetPath = "/admin-login";
    } else if (page === "admin-dashboard") {
      targetPath = "/admin-dashboard";
    } else if (page === "onboarding") {
      targetPath = "/onboarding";
    } else if (page === "home") {
      targetPath = "/";
    }

    if (window.location.pathname !== targetPath && !targetPath.includes("?")) {
      window.history.pushState(null, "", targetPath);
    } else if (targetPath.includes("?")) {
      window.history.pushState(null, "", targetPath);
    }
  };

  useEffect(() => {
    const handleRouteSync = () => {
      const path = window.location.pathname;
      const hashRaw = window.location.hash.replace("#", "");
      let parsedPage: CurrentPage = "home";
      
      // 1. Primary path-based URL parsing (Fully indexable & crawlable)
      if (path.startsWith("/course/")) {
        const slug = path.split("/course/")[1];
        if (slug) {
          parsedPage = "course-details";
          setSelectedCourseSlug(slug);
        }
      } else if (path.startsWith("/blog/")) {
        const slug = path.split("/blog/")[1];
        if (slug) {
          parsedPage = "blog-details";
          setSelectedBlogSlug(slug);
        }
      } else if (path.startsWith("/student/")) {
        const username = path.split("/student/")[1];
        if (username) {
          parsedPage = "student-portfolio";
          setSelectedStudentUsername(username);
        }
      } else if (path === "/courses" || path === "/courses/") {
        parsedPage = "courses";
      } else if (path === "/blogs" || path === "/blogs/" || path === "/blog" || path === "/blog/") {
        parsedPage = "blog";
      } else if (path === "/about" || path === "/about/") {
        parsedPage = "about";
      } else if (path === "/contact" || path === "/contact/") {
        parsedPage = "contact";
      } else if (path === "/terms" || path === "/terms/") {
        parsedPage = "terms";
      } else if (path === "/privacy" || path === "/privacy/") {
        parsedPage = "privacy";
      } else if (path === "/cart" || path === "/cart/") {
        parsedPage = "cart";
      } else if (path === "/thank-you" || path === "/thank-you/") {
        parsedPage = "thank-you";
      } else if (path === "/my-enrollments" || path === "/my-enrollments/") {
        parsedPage = "my-enrollments";
      } else if (path === "/admin-login" || path === "/admin-login/") {
        parsedPage = "admin-login";
      } else if (path === "/admin-dashboard" || path === "/admin-dashboard/") {
        parsedPage = "admin-dashboard";
      } else if (path === "/onboarding" || path === "/onboarding/") {
        parsedPage = "onboarding";
      } else {
        // 2. Backward-compatible fallback for legacy hash-based sharing links
        if (hashRaw.startsWith("course-details/")) {
          parsedPage = "course-details";
          const slug = hashRaw.replace("course-details/", "");
          setSelectedCourseSlug(slug);
        } else if (hashRaw.startsWith("blog-details/")) {
          parsedPage = "blog-details";
          const slug = hashRaw.replace("blog-details/", "");
          setSelectedBlogSlug(slug);
        } else if (hashRaw.startsWith("student/")) {
          parsedPage = "student-portfolio";
          const username = hashRaw.replace("student/", "");
          setSelectedStudentUsername(username);
        } else if (hashRaw.startsWith("thank-you/") || hashRaw.startsWith("order-success/")) {
          parsedPage = "thank-you";
        } else {
          const hash = hashRaw as CurrentPage;
          const validPages: CurrentPage[] = [
            "home", "courses", "about", "contact", "admin-login", "admin-dashboard", 
            "my-enrollments", "blog", "blog-details", "terms", "privacy", "onboarding", "cart", "thank-you", "student-portfolio"
          ];
          if (hashRaw === "thank-you" || hashRaw === "order-success") {
            parsedPage = "thank-you";
          } else if (validPages.includes(hash)) {
            parsedPage = hash === "blog" ? "blog" : hash;
          }
        }
      }
      
      setCurrentPageState(parsedPage);
    };

    window.addEventListener("hashchange", handleRouteSync);
    window.addEventListener("popstate", handleRouteSync);
    handleRouteSync(); // Trigger on init

    return () => {
      window.removeEventListener("hashchange", handleRouteSync);
      window.removeEventListener("popstate", handleRouteSync);
    };
  }, []);

  // Monitor theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
    localStorage.setItem("is_dark_mode", String(isDarkMode));
  }, [isDarkMode]);

  // Check admin privilege
  const checkAdminPrivilege = async (currentUser: FirebaseUser | null): Promise<boolean> => {
    if (!currentUser) return false;
    
    // 1. Check direct bootstrapped admin email
    if (currentUser.email && currentUser.email.toLowerCase() === "digitalcoursesbay@gmail.com") {
      return true;
    }

    // 2. Check admin collection reference for uid entry
    try {
      const adminDocRef = doc(db, "admins", currentUser.uid);
      const docSnap = await getDoc(adminDocRef);
      if (docSnap.exists()) return true;
    } catch (e) {
      console.warn("Failed to check administrative permissions due to security rules restrictions:", e);
    }

    // 3. Check dynamic admin email entries collection
    if (currentUser.email) {
      try {
        const emailRef = doc(db, "adminUsers", currentUser.email.toLowerCase());
        const emailDocSnap = await getDoc(emailRef);
        if (emailDocSnap.exists()) {
          const data = emailDocSnap.data();
          if (data && data.role === "admin") {
            return true;
          }
        }
      } catch (e) {
        console.warn("Dynamic adminUser reference lookup errored:", e);
      }
    }

    return false;
  };

  // Listen for Auth changes & Real-time Profile records
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (currentUser) {
        setLoadingProfile(true);
        const sessionKey = "l2f_login_logged_" + currentUser.uid;
        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, "true");
          const activeEmail = currentUser.email || "";
          const activeName = currentUser.displayName || "Student User";
          addDoc(collection(db, "activityLogs"), {
            userId: currentUser.uid,
            userName: activeName,
            userEmail: activeEmail,
            action: "Login",
            details: "Signed into website portal",
            timestamp: serverTimestamp()
          }).catch(e => console.error(e));

          const userRef = doc(db, "users", currentUser.uid);
          updateDoc(userRef, {
            emailVerified: currentUser.emailVerified,
            signupMethod: currentUser.providerData.some(p => p.providerId === "google.com") ? "Google" : "Email",
            lastLoginDate: serverTimestamp(),
            updatedAt: serverTimestamp()
          }).catch(e => {
             console.warn("User record doesn't exist yet; it will be fully initialized on Onboarding Completion.", e);
          });
        }

        // ── FIXED: One-time getDoc instead of persistent onSnapshot ──
        const userDocRef = doc(db, "users", currentUser.uid);
        try {
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setDbUser(snap.data() as DbUser);
          } else {
            setDbUser(null);
          }
        } catch (err: any) {
          console.warn("[AppContext] User profile fetch failed:", err);
          const isQuota = err?.message?.toLowerCase().includes("quota") || err?.message?.toLowerCase().includes("resource_exhausted");
          if (isQuota) setIsQuotaExceeded(true);
        } finally {
          setLoadingProfile(false);
        }
        // unsubscribeProfile kept as null (no persistent listener)

        const adminCheck = await checkAdminPrivilege(currentUser);
        setIsAdmin(adminCheck);
      } else {
        setDbUser(null);
        setIsAdmin(false);
        setLoadingProfile(false);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // Onboarding routing engine
  useEffect(() => {
    if (loading || loadingProfile) return;
    if (user) {
      // 1. If password user and NOT verified, force to My Enrollments page
      if (!user.emailVerified && user.providerData.some(p => p.providerId === "password")) {
        if (currentPage !== "my-enrollments") {
          setCurrentPageState("my-enrollments");
        }
        return;
      }

      // 2. If verified/social user and NOT complete onboarding, force to onboarding
      if (!isQuotaExceeded && (!dbUser || !dbUser.onboardingCompleted)) {
        if (currentPage !== "onboarding") {
          setCurrentPageState("onboarding");
        }
      } else if (currentPage === "onboarding") {
        setCurrentPageState("my-enrollments");
      }
    } else {
      if (currentPage === "onboarding") {
        setCurrentPageState("home");
      }
    }
  }, [user, dbUser, loading, loadingProfile, currentPage]);

  // Dynamic page interaction tracker matching event triggers
  useEffect(() => {
    if (loading || loadingProfile || !user) return;
    if (currentPage === "courses") {
      logUserActivity("Course View", "Visited Courses Explorer Catalog");
    } else if (currentPage === "blog") {
      logUserActivity("Blog View", "Browsed Knowledge Blog Articles");
    }
  }, [user, currentPage, loading, loadingProfile]);

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
        const isUserAdmin = await checkAdminPrivilege(result.user);
        setIsAdmin(isUserAdmin);
      } catch (popupErr: any) {
        const code = popupErr?.code || "";
        const msg = popupErr?.message || "";
        if (code === "auth/popup-blocked" || msg.includes("popup-blocked") || msg.includes("blocked")) {
          console.warn("Popup blocked, falling back to signInWithRedirect...");
          await signInWithRedirect(auth, provider).catch(err => {
            console.error("Redirect fallback failed too:", err);
            throw err;
          });
        } else {
          throw popupErr;
        }
      }
    } catch (error: any) {
      console.error("Popup authenticated cancelled or error:", error);
      const msg = error?.message || "";
      const code = error?.code || "";
      if (code === "auth/popup-blocked" || msg.includes("popup-blocked") || msg.includes("blocked")) {
        setAuthError("Pop-up Blocked: Your browser blocked the login popup. We attempted to trigger a security-safe redirect page login, or you can open the app in a new tab.");
      } else if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request" || msg.includes("popup-closed-by-user") || msg.includes("cancelled-popup-request") || msg.includes("cancelled")) {
        setAuthError("Sign-In Closed: The authentication pop-up was closed before finishing the sign-in. Since this app runs inside a sandboxed browser preview, please open this app in a new tab using the top-right button, or use the Demo Bypass.");
      } else if (msg.includes("Pending promise was never set") || msg.includes("INTERNAL ASSERTION FAILED")) {
        setAuthError("Auth Collision: A pending authenticating action was interrupted. Please refresh the page completely to proceed, or use the Demo Bypass.");
      } else {
        setAuthError(`Sign-In failed: ${error?.message || String(error)}`);
      }
      throw error;
    }
  };

  const loginWithEmailPassword = async (email: string, password: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Email login failed:", error);
      let errMsg = error?.message || String(error);
      if (error?.code === "auth/invalid-credential" || error?.code === "auth/user-not-found" || error?.code === "auth/wrong-password") {
        errMsg = "Invalid email or password. Please try again.";
      } else if (error?.code === "auth/invalid-email") {
        errMsg = "Please enter a valid email address.";
      }
      setAuthError(errMsg);
      throw error;
    }
  };

  const signUpWithEmailPassword = async (fullName: string, email: string, password: string) => {
    setAuthError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: fullName });
      await sendEmailVerification(result.user);
    } catch (error: any) {
      console.error("Email registration failed:", error);
      let errMsg = error?.message || String(error);
      if (error?.code === "auth/email-already-in-use") {
        errMsg = "This email is already registered. Please sign in instead.";
      } else if (error?.code === "auth/weak-password") {
        errMsg = "Password is too weak. Please use at least 8 characters.";
      }
      setAuthError(errMsg);
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (error: any) {
      console.error("Failed to send verification email:", error);
      throw error;
    }
  };

  const completeOnboarding = async (data: any) => {
    if (!user) throw new Error("No authenticated session found.");
    
    const newUserRecord: DbUser = {
      uid: user.uid,
      fullName: data.fullName,
      email: user.email || "",
      dateOfBirth: data.dateOfBirth || "",
      gender: data.gender || "",
      mobile: data.mobile || "",
      address: data.address || "",
      city: data.city || "",
      state: data.state || "",
      country: data.country || "",
      photoURL: data.photoURL || user.photoURL || "",
      onboardingCompleted: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      disabled: false,
      signupMethod: user.providerData.some(p => p.providerId === "google.com") ? "Google" : "Email"
    } as any;

    const newUserSettings: UserSettings = {
      uid: user.uid,
      theme: "dark",
      notificationsEnabled: true,
      updatedAt: serverTimestamp()
    } as any;

    const newUserProfile: UserProfile = {
      uid: user.uid,
      bio: "",
      telegram: data.telegram || "",
      updatedAt: serverTimestamp()
    } as any;

    try {
      await setDoc(doc(db, "users", user.uid), newUserRecord);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }

    try {
      await setDoc(doc(db, "userSettings", user.uid), newUserSettings);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `userSettings/${user.uid}`);
    }

    try {
      await setDoc(doc(db, "userProfiles", user.uid), newUserProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `userProfiles/${user.uid}`);
    }
  };

  const updateUserProfile = async (updatedFields: Partial<DbUser>) => {
    if (!user) throw new Error("No authenticated session found");
    try {
      const userRef = doc(db, "users", user.uid);
      const payload = {
        ...updatedFields,
        updatedAt: serverTimestamp()
      } as any;
      await setDoc(userRef, payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const logUserActivity = async (
    action: string, 
    details?: string
  ) => {
    if (!user) return;
    try {
      const activeUserEmail = user.email || "";
      const activeUserName = dbUser?.fullName || user.displayName || "Student User";
      await addDoc(collection(db, "activityLogs"), {
        userId: user.uid,
        userName: activeUserName,
        userEmail: activeUserEmail,
        action,
        details: details || "",
        timestamp: serverTimestamp()
      });

      const userRef = doc(db, "users", user.uid);
      if (action === "Course View" || action === "Add To Cart" || action === "Remove From Cart") {
        await updateDoc(userRef, {
          viewedCourse: arrayUnion(details || "Catalog Explorer"),
          lastViewedProducts: arrayUnion(details || "Catalog Explorer"),
          updatedAt: serverTimestamp()
        }).catch(err => console.warn("Failed meta analytics sync: ", err));
      } else if (action === "Checkout Initiated" || action === "Checkout") {
        await updateDoc(userRef, {
          initiatedCheckout: arrayUnion(details || "Initiated Portal"),
          updatedAt: serverTimestamp()
        }).catch(err => console.warn("Failed meta analytics sync: ", err));
      } else if (action === "Purchase Completed" || action === "Purchase") {
        await updateDoc(userRef, {
          purchasedCourse: arrayUnion(details || "Delivered License"),
          updatedAt: serverTimestamp()
        }).catch(err => console.warn("Failed meta analytics sync: ", err));
      }
    } catch (error) {
      console.error("Activity logger error:", error);
    }
  };

  // Real-time Cart listener syncing
  useEffect(() => {
    if (!user) {
      setCart([]);
      return;
    }

    if (user.uid === "demo_admin_uid" || user.uid === "demo_student_uid") {
      try {
        const local = localStorage.getItem("demo_cart");
        if (local) {
          setCart(JSON.parse(local));
        } else {
          setCart([]);
        }
      } catch (_) {}
      return;
    }

    // ── FIXED: One-time getDocs instead of persistent onSnapshot ──
    let cancelled = false;

    async function fetchCart() {
      try {
        const { getDocs } = await import("firebase/firestore");
        const snap = await getDocs(query(collection(db, "cartItems"), where("userId", "==", user!.uid)));
        if (cancelled) return;
        const items: any[] = [];
        snap.forEach((s) => items.push({ id: s.id, ...s.data() }));
        setCart(items);
      } catch (err: any) {
        if (cancelled) return;
        const isQuota = err?.message?.toLowerCase().includes("quota") || err?.message?.toLowerCase().includes("resource_exhausted");
        if (isQuota) {
          console.warn("[AppContext] Cart fetch quota exceeded:", err);
          setIsQuotaExceeded(true);
        } else {
          console.error("[AppContext] Cart fetch error:", err);
        }
      }
    }

    fetchCart();
    return () => { cancelled = true; };
  }, [user]);

  const isSetupComplete = () => {
    if (!user) return false;
    const emailVerified = user.emailVerified || user.providerData.some(p => p.providerId === "google.com");
    return emailVerified && !!dbUser?.onboardingCompleted;
  };

  const addToCart = async (course: any) => {
    if (!user) {
      setAuthModalMessage("Please sign in or register to add items to your cart.");
      setAuthModalOpen(true);
      return false;
    }

    const emailVerified = user.emailVerified || user.providerData.some(p => p.providerId === "google.com");
    if (!emailVerified) {
      setAuthModalMessage("Please verify your student email address before continuing.");
      setAuthModalOpen(true);
      return false;
    }

    if (!dbUser?.onboardingCompleted) {
      showToast("Please complete your onboarding profile to unlock classroom and checkout facilities.", "info");
      setCurrentPageState("onboarding");
      return false;
    }
    
    // PREVENT DUPLICATE PURCHASES - DELETED AS PER USER REQUEST TO ALLOW BUYING MULTIPLE TIMES
    // if (user && hasPurchasedCourse(user.uid, course.id)) {
    //   showToast("You already own this course.", "error");
    //   return false;
    // }

    if (user.uid === "demo_admin_uid" || user.uid === "demo_student_uid") {
      const existingItem = cart.find(item => item.productId === course.id);
      let updatedCart: any[] = [];
      if (existingItem) {
        updatedCart = cart.map(item =>
          item.productId === course.id
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        );
        showToast("Product already added to cart.", "info");
      } else {
        const newItem = {
          id: "cart_sim_" + Date.now().toString(),
          userId: user.uid,
          userEmail: user.email || "",
          productId: course.id,
          productTitle: course.title,
          productCategory: course.category || "General",
          productImage: course.thumbnail || "",
          price: Number(course.price || 0),
          quantity: 1,
          addedAt: new Date()
        };
        updatedCart = [...cart, newItem];
        showToast("Added to cart successfully", "success");
      }
      setCart(updatedCart);
      localStorage.setItem("demo_cart", JSON.stringify(updatedCart));
      // Log User Activities (View, Add to Cart)
      await logUserActivity("Add To Cart", `Added To Cart: ${course.title} (₹${course.price})`);
      return true;
    }

    try {
      const existingItem = cart.find(item => item.productId === course.id);
      if (existingItem) {
        await setDoc(doc(db, "cartItems", existingItem.id), {
          ...existingItem,
          quantity: (existingItem.quantity || 1) + 1,
          addedAt: serverTimestamp()
        }, { merge: true });
        // Optimistic local update (no onSnapshot anymore)
        setCart(prev => prev.map(item =>
          item.id === existingItem.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        ));
        showToast("Product already added to cart.", "info");
      } else {
        const cartItemRef = doc(collection(db, "cartItems"));
        const newItem = {
          id: cartItemRef.id,
          userId: user!.uid,
          userEmail: user!.email || "",
          productId: course.id,
          productTitle: course.title,
          productCategory: course.category || "General",
          productImage: course.thumbnail || "",
          price: Number(course.price || 0),
          quantity: 1,
          addedAt: serverTimestamp()
        };
        await setDoc(cartItemRef, newItem);
        // Optimistic local update
        setCart(prev => [...prev, { ...newItem, addedAt: new Date() }]);
        showToast("Added to cart successfully", "success");
      }
      
      await logUserActivity("Add To Cart", `Added To Cart: ${course.title} (₹${course.price})`);
      
      const userRef = doc(db, "users", user!.uid);
      await updateDoc(userRef, {
        addedToCart: arrayUnion(course.id),
        updatedAt: serverTimestamp()
      }).catch(err => console.warn("Failed meta Ads addedToCart sync: ", err));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "cartItems");
      return false;
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (!user) return;

    if (user.uid === "demo_admin_uid" || user.uid === "demo_student_uid") {
      const item = cart.find(x => x.id === cartItemId);
      if (item) {
        await logUserActivity("Remove From Cart", `Removed From Cart: ${item.productTitle}`);
      }
      const updatedCart = cart.filter(x => x.id !== cartItemId);
      setCart(updatedCart);
      localStorage.setItem("demo_cart", JSON.stringify(updatedCart));
      return;
    }

    try {
      const item = cart.find(x => x.id === cartItemId);
      if (item) {
        await logUserActivity("Remove From Cart", `Removed From Cart: ${item.productTitle}`);
      }
      await deleteDoc(doc(db, "cartItems", cartItemId));
      // Optimistic local update
      setCart(prev => prev.filter(x => x.id !== cartItemId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `cartItems/${cartItemId}`);
    }
  };

  const updateCartQuantity = async (cartItemId: string, quantity: number) => {
    if (!user) return;
    if (quantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }

    if (user.uid === "demo_admin_uid" || user.uid === "demo_student_uid") {
      const updatedCart = cart.map(item =>
        item.id === cartItemId ? { ...item, quantity: Number(quantity) } : item
      );
      setCart(updatedCart);
      localStorage.setItem("demo_cart", JSON.stringify(updatedCart));
      return;
    }

    try {
      await setDoc(doc(db, "cartItems", cartItemId), {
        quantity: Number(quantity),
        addedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `cartItems/${cartItemId}`);
    }
  };

  const clearCart = async () => {
    if (!user) return;

    if (user.uid === "demo_admin_uid" || user.uid === "demo_student_uid") {
      setCart([]);
      localStorage.removeItem("demo_cart");
      return;
    }

    try {
      for (const item of cart) {
        await deleteDoc(doc(db, "cartItems", item.id));
      }
      setCart([]);
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  };

  const loginAsDemoAdmin = () => {
    const pin = prompt("Enter Developer Security PIN to bypass Google Authentication (Use 'admin' to bypass in development/sandbox):");
    if (pin === "L2F-SAFE-2026" || pin === "admin") {
      const mockUser = {
        uid: "demo_admin_uid",
        email: "digitalcoursesbay@gmail.com",
        displayName: "Demo Admin",
        emailVerified: true
      } as any as FirebaseUser;
      setUser(mockUser);

      const mockDbUser = {
        uid: "demo_admin_uid",
        fullName: "Demo Admin",
        email: "digitalcoursesbay@gmail.com",
        mobile: "+1-555-0100",
        onboardingCompleted: true,
        address: "1600 Amphitheatre Pkwy",
        city: "Mountain View",
        state: "CA",
        country: "USA",
        createdAt: new Date(),
        updatedAt: new Date()
      } as any as DbUser;
      setDbUser(mockDbUser);

      setIsAdmin(true);
      setCurrentPage("admin-dashboard");
      showToast("Access Granted: Developer Bypass Active", "success");
    } else {
      showToast("Unauthorized Bypass Attempt Blocked", "error");
    }
  };

  const loginAsDemoStudent = () => {
    const mockUser = {
      uid: "demo_student_uid",
      email: "digitalcoursesbay@gmail.com",
      displayName: "Demo Student",
      emailVerified: true
    } as any as FirebaseUser;
    setUser(mockUser);

    const mockDbUser = {
      uid: "demo_student_uid",
      fullName: "Demo Student",
      email: "digitalcoursesbay@gmail.com",
      mobile: "+1-555-0199",
      onboardingCompleted: true,
      address: "123 Learning Lane",
      city: "Silicon Valley",
      state: "CA",
      country: "USA",
      createdAt: new Date(),
      updatedAt: new Date()
    } as any as DbUser;
    setDbUser(mockDbUser);

    setIsAdmin(false);
    setCurrentPage("my-enrollments");
    showToast("Access Granted: Demo Student Bypass Active", "success");
  };

  const logout = async () => {
    try {
      if (user) {
        await logUserActivity("Logout", "Signed out of website portal");
      }
      // Only call signOut if we aren't using a mock user session
      if (user?.uid !== "demo_admin_uid" && user?.uid !== "demo_student_uid") {
        await signOut(auth);
      }
      setDbUser(null);
      setUser(null);
      setIsAdmin(false);
      setCurrentPage("home");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        selectedBlogSlug,
        setSelectedBlogSlug,
        user,
        dbUser,
        loadingProfile,
        isAdmin,
        loading,
        isDarkMode,
        setIsDarkMode,
        loginWithGoogle,
        loginWithEmailPassword,
        signUpWithEmailPassword,
        sendVerificationEmail,
        logout,
        checkAdminPrivilege,
        loginAsDemoAdmin,
        loginAsDemoStudent,
        globalSettings,
        updateGlobalSettings,
        authError,
        setAuthError,
        updateUserProfile,
        completeOnboarding,
        logUserActivity,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        isSetupComplete,
        authModalOpen,
        setAuthModalOpen,
        authModalMessage,
        setAuthModalMessage,
        toast,
        showToast,
        orders,
        hasPurchasedCourse,
        urlCourseSlug,
        setUrlCourseSlug,
        urlReferrerId,
        setUrlReferrerId,
        selectedCourseSlug,
        setSelectedCourseSlug,
        selectedStudentUsername,
        setSelectedStudentUsername,
        isQuotaExceeded,
        setIsQuotaExceeded
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside an AppProvider");
  }
  return context;
};
