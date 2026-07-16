import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { 
  BookOpen, 
  Sparkles, 
  Clock, 
  Video, 
  CheckCircle, 
  ArrowRight, 
  Lock, 
  Compass, 
  FileCheck, 
  AlertCircle, 
  CheckSquare, 
  Square,
  QrCode,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Tv,
  Mail,
  ShieldCheck,
  User as UserIcon,
  MapPin,
  Phone,
  Calendar,
  Key,
  Settings,
  Award,
  RefreshCw,
  Send,
  Camera,
  CheckCircle2,
  Copy,
  DollarSign,
  AlertTriangle,
  HelpCircle
} from "lucide-react";
import { collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { Course, Order } from "../types";

export const MyEnrollments: React.FC = () => {
  const { 
    user, 
    dbUser,
    loginWithGoogle, 
    loginWithEmailPassword,
    signUpWithEmailPassword,
    sendVerificationEmail,
    logout,
    setCurrentPage, 
    globalSettings,
    authError,
    setAuthError,
    updateUserProfile,
    loginAsDemoStudent
  } = useApp();

  // Tab layout state
  const [activeTab, setActiveTab] = useState<"enrollments" | "profile" | "settings" | "affiliate">("enrollments");

  // Affiliate program state variables
  const [affiliateApp, setAffiliateApp] = useState<any | null>(null);
  const [loadingAffiliateApp, setLoadingAffiliateApp] = useState(true);
  const [prefCoupon, setPrefCoupon] = useState("");
  const [promoAnswer, setPromoAnswer] = useState("");
  const [affiliateSales, setAffiliateSales] = useState<any[]>([]);
  const [payoutsList, setPayoutsList] = useState<any[]>([]);
  const [submittingApp, setSubmittingApp] = useState(false);
  const [appError, setAppError] = useState("");
  const [appSuccess, setAppSuccess] = useState("");
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState("");
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // Settlement and Profile fallbacks
  const [appMobile, setAppMobile] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<"UPI" | "Bank">("UPI");
  const [settlementUpi, setSettlementUpi] = useState("");
  const [settlementBankAccount, setSettlementBankAccount] = useState("");
  const [settlementIfsc, setSettlementIfsc] = useState("");
  const [settlementBeneficiaryName, setSettlementBeneficiaryName] = useState("");
  const [settlementSuccess, setSettlementSuccess] = useState("");
  const [settlementLoading, setSettlementLoading] = useState(false);

  // Orders and Courses state
  const [orders, setOrders] = useState<Order[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  // Authentication mode toggles for Email/Password
  const [isSignUp, setIsSignUp] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [operationLoading, setOperationLoading] = useState(false);
  const [localAuthError, setLocalAuthError] = useState("");

  // Verification resend status
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationMsg, setVerificationMsg] = useState("");
  const [verificationError, setVerificationError] = useState("");

  // Receipt details / Order Details Modal state
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<any | null>(null);

  // Profile picture base64 state inside settings
  const [settingsPic, setSettingsPic] = useState<string | null>(null);

  // Settings modification fields state
  const [settingsForm, setSettingsForm] = useState({
    fullName: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    country: "",
    youtubeUrl: "",
    instagramUrl: "",
    facebookUrl: "",
    linkedinUrl: "",
    twitterUrl: "",
    telegramUsername: "",
    websiteUrl: ""
  });
  const [settingsCurrentPassword, setSettingsCurrentPassword] = useState("");
  const [settingsNewPassword, setSettingsNewPassword] = useState("");
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState("");
  const [settingsErrorMsg, setSettingsErrorMsg] = useState("");

  // Syllabus configuration
  const courseSyllabus: { [key: string]: string[] } = {
    "ai-gold": [
      "Model Stacking: Linking GPT-4o with Google Gemini Flash",
      "Autonomous Agents: Configuring CrewAI & AutoGPT Engines",
      "Zero-Shot & Few-Shot Prompt Engineering Blueprints",
      "Building Custom Conversational WhatsApp AI bots",
      "Leveraging AI for Elite Content Production & Copywriting"
    ],
    "edit-cine": [
      "Primate Cuts: Advanced Pacing & Multi-cam Editing Flow",
      "Colorist Blueprint: Creative Lumetri Luminescence Styles",
      "Dynamic Keyframing & High-Impact Typography in AE",
      "Sound Design Mastery: EQ sweeps & Ambient Noise Isolation",
      "Visual Effects Integration & Custom Matte Channels"
    ],
    "tube-viral": [
      "Algorithmic Audits: Mining Profitable YouTube Automations",
      "Viral Copy: Crafting high-retention scripts in Minutes",
      "High-CTR Visual Assets: Thumbnail design rules",
      "Retention Mechanics: Pacing techniques that lock audience attention",
      "Passive Monetization: Sponsorship hooks & affiliate sequencing"
    ],
    "marketing-scale": [
      "Meta Ads Core: Scaling Lookalikes & Dynamic Creative Labs",
      "Google Search Ads Strategy & Landing Page Architecture",
      "Conversational Funnels: WhatsApp automation blueprints",
      "Tracking Loops: UTM telemetry & Hotjar visitor session audit",
      "LTV Optimization: Automated email reactivation engines"
    ],
    "freelance-ticket": [
      "Closing Elite Tickets: Bidding strategies for Upwork & Fiverr",
      "Bespoke Cold Email Templates that bypass gatekeepers",
      "Closing on Zoom: Negotiation strategies for high retainers",
      "Value Stacking: From single service to $3,000/mo partner",
      "Contracting & Global Payment Escrow setups"
    ],
    "start-saas": [
      "Niche Identification: Finding gaps in high-val premium markets",
      "Building functional MVPs using Glide, Bubble, or Webflow",
      "Setting up Stripe Accounts & Auto Subscription workflows",
      "Growth Loops: Product Hunt launch strategies & early users",
      "Scaling Operations: Cloud deployment and platform automation"
    ]
  };

  const genericSyllabus = [
    "Core Introduction & Curriculum Blueprint Overview",
    "Conceptual Principles & Core Technology Installation",
    "Hands-on Laboratory Assignments & Interactive Exercises",
    "Milestone Capstone Projects & Peer Assessment Guidelines",
    "Post-Grad Career Navigation & VIP Alumni Group Networking"
  ];

  const defaultCourses: Course[] = [
    {
      id: "ai-gold",
      title: "Self-Operative AI Mastery Blueprint",
      category: "AI Tools",
      price: 1999,
      description: "Learn how to prompt, configure, and stack autonomous agents with LLMs to automate 80% of your business processes and freelance work.",
      thumbnail: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800",
      createdAt: new Date()
    },
    {
      id: "edit-cine",
      title: "Cinema-Grade Premiere Pro & After Effects Masterclass",
      category: "Video Editing",
      price: 2499,
      description: "A comprehensive deep-dive into digital storytelling, dynamic pacing, keyframing, motion typography, and commercial visual effects editing.",
      thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=800",
      createdAt: new Date()
    },
    {
      id: "tube-viral",
      title: "YouTube Automation & Retention Secrets",
      category: "YouTube Growth",
      price: 1499,
      description: "Step-by-step framework to discover highly profitable niches, generate viral scripts, double click-through rates, and engineer retention above 65%.",
      thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=800",
      createdAt: new Date()
    },
    {
      id: "marketing-scale",
      title: "High-ROI Digital Marketing & Funnels Blueprint",
      category: "Digital Marketing",
      price: 1899,
      description: "Stop throwing ad-spend away. Master paid advertising on Google & Meta, visual layout analytics, advanced landing page retargeting, and conversational WhatsApp sequences.",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
      createdAt: new Date()
    },
    {
      id: "freelance-ticket",
      title: "High-Ticket Freelance Client Acquisition Engine",
      category: "Freelancing",
      price: 2199,
      description: "Convert basic active bids into retainer agreements. The exact cold outreach loops, Upwork optimization audits, pricing strategies, and portfolio visual assets to close clients.",
      thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800",
      createdAt: new Date()
    },
    {
      id: "start-saas",
      title: "Zero-Code SaaS & Digital Business Accelerator",
      category: "Business",
      price: 2999,
      description: "Launch, scale, and automate digital micro-SaaS subscriptions. Discover hot markets, build web apps using visual platforms, and configure payouts.",
      thumbnail: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800",
      createdAt: new Date()
    }
  ];

  // Syllabus progress check
  const [completedLectures, setCompletedLectures] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const saved = localStorage.getItem("l2f_completed_lectures");
    if (saved) {
      try {
        setCompletedLectures(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved lecture progression:", e);
      }
    }
  }, []);

  const toggleLectureCompletion = (orderId: string, lectureIndex: number) => {
    const key = `${orderId}_${lectureIndex}`;
    const nextState = { ...completedLectures, [key]: !completedLectures[key] };
    setCompletedLectures(nextState);
    localStorage.setItem("l2f_completed_lectures", JSON.stringify(nextState));
  };

  // Populate data when dbUser is loaded
  useEffect(() => {
    if (dbUser) {
      setSettingsForm({
        fullName: dbUser.fullName || "",
        mobile: dbUser.mobile || "",
        address: dbUser.address || "",
        city: dbUser.city || "",
        state: dbUser.state || "",
        country: dbUser.country || "India",
        youtubeUrl: dbUser.youtubeUrl || "",
        instagramUrl: dbUser.instagramUrl || "",
        facebookUrl: dbUser.facebookUrl || "",
        linkedinUrl: dbUser.linkedinUrl || "",
        twitterUrl: dbUser.twitterUrl || "",
        telegramUsername: dbUser.telegramUsername || "",
        websiteUrl: dbUser.websiteUrl || ""
      });
      setSettingsPic(dbUser.photoURL || null);
    }
  }, [dbUser]);

  // Fetch courses list
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, "courses")));
        const list: Course[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Course);
        });
        if (list.length > 0) {
          setCourses(list);
        } else {
          setCourses(defaultCourses);
        }
      } catch (err) {
        console.warn("Using fallbacks for courses:", err);
        setCourses(defaultCourses);
      }
    };
    loadCourses();
  }, []);

  // Real-time Orders snapshot
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    setLoadingOrders(true);

    if (user.uid === "demo_admin_uid" || user.uid === "demo_student_uid") {
      try {
        const local = localStorage.getItem("demo_orders");
        if (local) {
          const list = JSON.parse(local) as Order[];
          setOrders(list.filter(o => o.email === user.email));
        } else {
          setOrders([]);
        }
      } catch (_) {}
      setLoadingOrders(false);
      return;
    }

    // ── FIXED: One-time getDocs instead of persistent onSnapshot ──
    let cancelled = false;

    async function fetchOrders() {
      try {
        const snap = await getDocs(query(collection(db, "orders"), where("email", "==", user.email)));
        if (cancelled) return;
        const list: Order[] = [];
        snap.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() } as Order));
        setOrders(list);
      } catch (err) {
        if (!cancelled) console.error("[MyEnrollments] Orders fetch error:", err);
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }
    }

    fetchOrders();
    return () => { cancelled = true; };
  }, [user]);

  // Affiliate program database listeners
  useEffect(() => {
    if (!user?.uid) {
      setLoadingAffiliateApp(false);
      return;
    }

    if (user.uid === "demo_admin_uid" || user.uid === "demo_student_uid") {
      setLoadingAffiliateApp(true);
      try {
        const storedApp = localStorage.getItem("demo_affiliate_app");
        if (storedApp) {
          setAffiliateApp(JSON.parse(storedApp));
        } else {
          // Default mock affiliate application
          const defaultDemoApp = {
            id: user.uid,
            uid: user.uid,
            fullName: dbUser?.fullName || user.displayName || "Demo Student",
            email: user.email,
            mobile: dbUser?.mobile || "+1-555-0199",
            preferredCoupon: "DEMO15",
            status: "approved", // Approved in demo mode so user gets to test payout requests!
            timesUsed: 2,
            totalOrders: 2,
            totalRevenue: 3000,
            estimatedEarnings: 450,
            pendingEarnings: 600, // Meets the ₹500 threshold so they can test requesting a payout!
            paidEarnings: 0,
            upiId: "",
            bankAccount: "",
            ifsc: "",
            beneficiaryName: ""
          };
          setAffiliateApp(defaultDemoApp);
        }

        const storedSales = localStorage.getItem("demo_affiliate_sales");
        if (storedSales) {
          setAffiliateSales(JSON.parse(storedSales));
        } else {
          const defaultSales = [
            {
              id: "sale_sim_1",
              affiliateUid: user.uid,
              buyerEmail: "buyer_one@gmail.com",
              buyerName: "Rahul Sharma",
              courseTitle: "Fullstack Web Engineering",
              coursePrice: 1999,
              commissionPercent: 15,
              allocatedCommission: 300,
              purchaseDate: { seconds: Math.floor(Date.now() / 1000) - 86400 }
            },
            {
              id: "sale_sim_2",
              affiliateUid: user.uid,
              buyerEmail: "buyer_two@gmail.com",
              buyerName: "Sneha Patel",
              courseTitle: "Advanced JavaScript Masters",
              coursePrice: 999,
              commissionPercent: 15,
              allocatedCommission: 150,
              purchaseDate: { seconds: Math.floor(Date.now() / 1000) - 172800 }
            }
          ];
          setAffiliateSales(defaultSales);
        }

        const storedPayouts = localStorage.getItem("demo_payout_requests");
        if (storedPayouts) {
          setPayoutsList(JSON.parse(storedPayouts));
        } else {
          setPayoutsList([]);
        }
      } catch (err) {
        console.error("Error loading demo affiliate state:", err);
      }
      setLoadingAffiliateApp(false);
      return;
    }

    // ── FIXED: One-time getDocs instead of 3 persistent onSnapshot listeners ──
    setLoadingAffiliateApp(true);
    let cancelled = false;

    async function fetchAffiliateData() {
      try {
        const [appSnap, salesSnap, payoutsSnap] = await Promise.all([
          getDoc(doc(db, "affiliate_applications", user.uid)),
          getDocs(query(collection(db, "affiliate_sales"), where("affiliateUid", "==", user.uid))),
          getDocs(query(collection(db, "payout_requests"), where("uid", "==", user.uid))),
        ]);
        if (cancelled) return;

        // App doc
        if (appSnap.exists()) {
          setAffiliateApp({ id: appSnap.id, ...appSnap.data() });
        } else {
          setAffiliateApp(null);
        }

        // Sales
        const salesList: any[] = [];
        salesSnap.forEach((d) => salesList.push({ id: d.id, ...d.data() }));
        salesList.sort((a, b) => (b.purchaseDate?.seconds || 0) - (a.purchaseDate?.seconds || 0));
        setAffiliateSales(salesList);

        // Payouts
        const payoutsList: any[] = [];
        payoutsSnap.forEach((d) => payoutsList.push({ id: d.id, ...d.data() }));
        payoutsList.sort((a, b) => (b.requestDate?.seconds || 0) - (a.requestDate?.seconds || 0));
        setPayoutsList(payoutsList);
      } catch (err) {
        if (!cancelled) console.error("[MyEnrollments] Affiliate data fetch error:", err);
      } finally {
        if (!cancelled) setLoadingAffiliateApp(false);
      }
    }

    fetchAffiliateData();
    return () => { cancelled = true; };
  }, [user]);

  // Sync settlement details from affiliateApp when loaded
  useEffect(() => {
    if (affiliateApp) {
      setSettlementUpi(affiliateApp.upiId || "");
      setSettlementBankAccount(affiliateApp.bankAccount || "");
      setSettlementIfsc(affiliateApp.ifsc || "");
      setSettlementBeneficiaryName(affiliateApp.beneficiaryName || "");
      if (affiliateApp.bankAccount) {
        setPayoutMethod("Bank");
      } else {
        setPayoutMethod("UPI");
      }
    }
  }, [affiliateApp]);

  useEffect(() => {
    if (dbUser?.mobile) {
      setAppMobile(dbUser.mobile);
    }
  }, [dbUser]);

  const handleSaveSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettlementSuccess("");
    setSettlementLoading(true);
    try {
      const upDoc: any = {};
      if (payoutMethod === "UPI") {
        if (!settlementUpi.trim()) {
          throw new Error("Please specify your UPI ID for settlement.");
        }
        upDoc.upiId = settlementUpi.trim();
        upDoc.bankAccount = "";
        upDoc.ifsc = "";
        upDoc.beneficiaryName = "";
      } else {
        if (!settlementBankAccount.trim()) throw new Error("Bank Account number is required.");
        if (!settlementIfsc.trim()) throw new Error("Bank IFSC Code is required.");
        if (!settlementBeneficiaryName.trim()) throw new Error("Beneficiary Name is required.");
        upDoc.upiId = "";
        upDoc.bankAccount = settlementBankAccount.trim();
        upDoc.ifsc = settlementIfsc.trim().toUpperCase();
        upDoc.beneficiaryName = settlementBeneficiaryName.trim();
      }

      if (user?.uid === "demo_admin_uid" || user?.uid === "demo_student_uid") {
        const updatedApp = { ...affiliateApp, ...upDoc };
        setAffiliateApp(updatedApp);
        localStorage.setItem("demo_affiliate_app", JSON.stringify(updatedApp));
        setSettlementSuccess("Settlement details saved & synchronized successfully (Demo Mode)!");
        return;
      }

      await updateDoc(doc(db, "affiliate_applications", user.uid), upDoc);
      setSettlementSuccess("Settlement details saved & synchronized successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to save settlement credentials.");
    } finally {
      setSettlementLoading(false);
    }
  };

  // Expand course classroom handler
  const handleToggleCourse = (courseId: string) => {
    setExpandedCourseId(expandedCourseId === courseId ? null : courseId);
  };

  const getCourseDetails = (courseId: string): Course => {
    const matched = courses.find(c => c.id === courseId);
    if (matched) return matched;
    const defaultMatched = defaultCourses.find(c => c.id === courseId);
    if (defaultMatched) return defaultMatched;
    return {
      title: "Premium Education Track",
      category: "Specialized",
      price: 0,
      description: "Custom curriculum program tailored by Learn2Future administration.",
      thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800",
      createdAt: new Date()
    };
  };

  const getDeliverableLink = (courseId: string): string => {
    const matched = courses.find(c => c.id === courseId);
    return matched?.deliverableLink || "";
  };

  const handleAccessCourse = async (order: Order, deliverableLink: string) => {
    if (!deliverableLink) {
      alert("No deliverable link currently configured for this course.");
      return;
    }

    // Open in a new window/tab safely
    window.open(deliverableLink, "_blank", "noopener,noreferrer");

    // Track access metrics
    if (user?.uid === "demo_admin_uid" || user?.uid === "demo_student_uid") {
      try {
        const local = localStorage.getItem("demo_orders");
        if (local) {
          let currentOrders = JSON.parse(local) as Order[];
          currentOrders = currentOrders.map(o => {
            if (o.id === order.id) {
              return {
                ...o,
                accessCount: (o.accessCount || 0) + 1,
                lastAccessTime: new Date()
              };
            }
            return o;
          });
          localStorage.setItem("demo_orders", JSON.stringify(currentOrders));
          setOrders(currentOrders.filter(o => o.email === user.email));
        }
      } catch (err) {
        console.error("Local stats update failure:", err);
      }
      return;
    }

    try {
      const orderRef = doc(db, "orders", order.id || "");
      const newCount = (order.accessCount || 0) + 1;
      await updateDoc(orderRef, {
        accessCount: newCount,
        lastAccessTime: new Date()
      });
    } catch (e: any) {
      console.error("Failed to update access metrics in DB:", e);
      try {
        handleFirestoreError(e, OperationType.UPDATE, `orders/${order.id}`);
      } catch (_) {}
    }
  };

  const isProfileComplete = !!(
    (dbUser?.fullName || user?.displayName || "").trim() &&
    user?.email?.trim() &&
    (dbUser?.mobile || appMobile || "").trim()
  );

  const handleApplyAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppError("");
    setAppSuccess("");

    if (!isProfileComplete) {
      setAppError("Please complete your profile in Settings first.");
      return;
    }

    const cleanedCoupon = prefCoupon.trim().toUpperCase();
    if (!cleanedCoupon) {
      setAppError("Please specify a preferred coupon name.");
      return;
    }

    // Letters only check
    if (!/^[A-Z]+$/.test(cleanedCoupon)) {
      setAppError("Preferred Coupon Name can only contain letters (A-Z). Numbers (0-9) and special characters are not allowed.");
      return;
    }

    if (!promoAnswer.trim()) {
      setAppError("Please complete the rationale question.");
      return;
    }

    setSubmittingApp(true);
    try {
      if (user?.uid === "demo_admin_uid" || user?.uid === "demo_student_uid") {
        const payload = {
          uid: user.uid,
          fullName: dbUser?.fullName || user.displayName || "Demo Student",
          email: user.email,
          mobile: dbUser?.mobile || appMobile.trim() || "+1-555-0199",
          preferredCoupon: cleanedCoupon,
          question: promoAnswer.trim(),
          status: "pending",
          createdAt: new Date(),
          address: dbUser?.address || "",
          city: dbUser?.city || "",
          state: dbUser?.state || "",
          country: dbUser?.country || "",
          instagramUrl: dbUser?.instagramUrl || "",
          youtubeUrl: dbUser?.youtubeUrl || "",
          facebookUrl: dbUser?.facebookUrl || "",
          linkedinUrl: dbUser?.linkedinUrl || "",
          twitterUrl: dbUser?.twitterUrl || "",
          telegramUsername: dbUser?.telegramUsername || "",
          websiteUrl: dbUser?.websiteUrl || "",
          timesUsed: 0,
          totalOrders: 0,
          totalRevenue: 0,
          estimatedEarnings: 0,
          pendingEarnings: 0,
          paidEarnings: 0,
          upiId: "",
          bankAccount: "",
          ifsc: "",
          beneficiaryName: ""
        };
        setAffiliateApp(payload);
        localStorage.setItem("demo_affiliate_app", JSON.stringify(payload));
        setAppSuccess("Your Affiliate Application was submitted successfully for team review (Demo Mode)!");
        setPrefCoupon("");
        setPromoAnswer("");
        setSubmittingApp(false);
        return;
      }

      // Check for duplicates
      const couponSnap = await getDoc(doc(db, "coupons", cleanedCoupon));
      if (couponSnap.exists()) {
        setAppError("This coupon code is already active in our database. Choose or customize another name.");
        setSubmittingApp(false);
        return;
      }

      try {
        const appsSnap = await getDocs(query(collection(db, "affiliate_applications"), where("preferredCoupon", "==", cleanedCoupon)));
        if (!appsSnap.empty) {
          setAppError("This coupon code is already requested by another affiliate. Choose another name.");
          setSubmittingApp(false);
          return;
        }
      } catch (err) {
        console.warn("Could not check duplicate pending applications (this is normal for non-admins due to PII isolation rules):", err);
      }

      // Auto-save mobile to user's profile if missing
      if (user && !dbUser?.mobile && appMobile.trim()) {
        try {
          await setDoc(doc(db, "users", user.uid), {
            mobile: appMobile.trim(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (e) {
          console.warn("Could not auto-save mobile to main user record:", e);
        }
      }

      const payload = {
        uid: user.uid,
        fullName: dbUser?.fullName || user.displayName || "Affiliate Partner",
        email: user.email,
        mobile: dbUser?.mobile || appMobile.trim() || "",
        preferredCoupon: cleanedCoupon,
        question: promoAnswer.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
        address: dbUser?.address || "",
        city: dbUser?.city || "",
        state: dbUser?.state || "",
        country: dbUser?.country || "",
        instagramUrl: dbUser?.instagramUrl || "",
        youtubeUrl: dbUser?.youtubeUrl || "",
        facebookUrl: dbUser?.facebookUrl || "",
        linkedinUrl: dbUser?.linkedinUrl || "",
        twitterUrl: dbUser?.twitterUrl || "",
        telegramUsername: dbUser?.telegramUsername || "",
        websiteUrl: dbUser?.websiteUrl || "",
        timesUsed: 0,
        totalOrders: 0,
        totalRevenue: 0,
        estimatedEarnings: 0,
        pendingEarnings: 0,
        paidEarnings: 0,
        upiId: "",
        bankAccount: "",
        ifsc: "",
        beneficiaryName: ""
      };

      await setDoc(doc(db, "affiliate_applications", user.uid), payload);
      setAppSuccess("Your Affiliate Application was submitted successfully for team review!");
      setPrefCoupon("");
      setPromoAnswer("");
    } catch (err: any) {
      console.error("Error creating affiliate application:", err);
      setAppError(err?.message || "Failed to submit affiliate application.");
      handleFirestoreError(err, OperationType.WRITE, `affiliate_applications/${user.uid}`);
    } finally {
      setSubmittingApp(false);
    }
  };

  const handleRequestPayout = async () => {
    setPayoutError("");
    setPayoutSuccess("");

    if (!affiliateApp || affiliateApp.status !== "approved") {
      setPayoutError("Only active approved affiliate partners can request payouts.");
      return;
    }

    const currentPending = Number(affiliateApp.pendingEarnings || 0);
    if (currentPending < 500) {
      setPayoutError("Your Pending Earnings must be at least ₹500 to request payout.");
      return;
    }

    const hasUpi = !!(affiliateApp.upiId && affiliateApp.upiId.trim());
    const hasBank = !!(affiliateApp.bankAccount && affiliateApp.bankAccount.trim());
    if (!hasUpi && !hasBank) {
      setPayoutError("Please configure your Payment Settlement Settings below first so we know where to send your funds.");
      return;
    }

    setSubmittingPayout(true);
    const payoutId = "pay_req_" + Date.now().toString();
    try {
      
      const upiStr = affiliateApp.upiId ? `UPI ID: ${affiliateApp.upiId}` : "";
      const bankStr = affiliateApp.bankAccount ? `Bank Account: ${affiliateApp.bankAccount} (IFSC: ${affiliateApp.ifsc}, Beneficiary: ${affiliateApp.beneficiaryName})` : "";
      const pDetails = upiStr || bankStr || "Not configured yet. Set UPI or Bank info under Settlement Settings.";

      const payoutPayload = {
        id: payoutId,
        uid: user.uid,
        name: dbUser?.fullName || affiliateApp.fullName || "Partner",
        email: user.email,
        phone: dbUser?.mobile || affiliateApp.mobile || "",
        couponCode: affiliateApp.couponCode || affiliateApp.preferredCoupon || "",
        commissionPercent: Number(affiliateApp.commissionPercent || 15),
        amount: currentPending,
        requestDate: serverTimestamp(),
        status: "Pending",
        paymentDetails: pDetails
      };

      if (user?.uid === "demo_admin_uid" || user?.uid === "demo_student_uid") {
        const payoutPayload = {
          id: payoutId,
          uid: user.uid,
          name: dbUser?.fullName || affiliateApp.fullName || "Partner",
          email: user.email,
          phone: dbUser?.mobile || affiliateApp.mobile || "",
          couponCode: affiliateApp.couponCode || affiliateApp.preferredCoupon || "",
          commissionPercent: Number(affiliateApp.commissionPercent || 15),
          amount: currentPending,
          requestDate: new Date(),
          status: "Pending",
          paymentDetails: pDetails
        };
        const newList = [payoutPayload, ...payoutsList];
        setPayoutsList(newList);
        localStorage.setItem("demo_payout_requests", JSON.stringify(newList));

        // Deduct from pending and lock
        const updatedApp = { ...affiliateApp, pendingEarnings: 0 };
        setAffiliateApp(updatedApp);
        localStorage.setItem("demo_affiliate_app", JSON.stringify(updatedApp));

        setPayoutSuccess(`Payout request for ₹${currentPending.toFixed(2)} submitted successfully (Demo Mode)!`);
        setSubmittingPayout(false);
        return;
      }

      await setDoc(doc(db, "payout_requests", payoutId), payoutPayload);

      // Deduct from pending and lock
      await updateDoc(doc(db, "affiliate_applications", user.uid), {
        pendingEarnings: 0
      });

      setPayoutSuccess(`Payout request for ₹${currentPending.toFixed(2)} submitted successfully!`);
    } catch (err: any) {
      console.error("Payout creation failed:", err);
      setPayoutError(err?.message || "Failed to submit payout request.");
      handleFirestoreError(err, OperationType.WRITE, `payout_requests/${payoutId}`);
    } finally {
      setSubmittingPayout(false);
    }
  };

  const handleResetApplication = async () => {
    if (window.confirm("Are you sure you want to withdraw this application to submit a new one?")) {
      if (user?.uid === "demo_admin_uid" || user?.uid === "demo_student_uid") {
        setAffiliateApp(null);
        localStorage.removeItem("demo_affiliate_app");
        localStorage.removeItem("demo_payout_requests");
        localStorage.removeItem("demo_affiliate_sales");
        setAppError("");
        setAppSuccess("");
        return;
      }
      try {
        await deleteDoc(doc(db, "affiliate_applications", user.uid));
        setAppError("");
        setAppSuccess("");
      } catch (err: any) {
        alert("Failed to reset application document: " + err?.message);
      }
    }
  };

  // Auth form submissions
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalAuthError("");
    setOperationLoading(true);

    try {
      if (isSignUp) {
        // Sign Up validation
        if (!authFullName.trim()) {
          setLocalAuthError("FullName is required.");
          setOperationLoading(false);
          return;
        }
        if (authPassword.length < 8) {
          setLocalAuthError("Password must be at least 8 characters.");
          setOperationLoading(false);
          return;
        }
        if (authPassword !== authConfirmPassword) {
          setLocalAuthError("Passwords do not match.");
          setOperationLoading(false);
          return;
        }
        await signUpWithEmailPassword(authFullName, authEmail, authPassword);
      } else {
        // Sign In
        await loginWithEmailPassword(authEmail, authPassword);
      }
    } catch (err: any) {
      setLocalAuthError(err?.message || "Operation failed.");
    } finally {
      setOperationLoading(false);
    }
  };

  // Photo uploads change
  const handleSettingsPicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setSettingsErrorMsg("Image exceeds maximum 2MB size limit.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettingsPic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Settings Changes
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsErrorMsg("");
    setSettingsSuccessMsg("");

    if (!settingsForm.fullName.trim()) {
      setSettingsErrorMsg("FullName cannot be empty.");
      return;
    }

    setSettingsLoading(true);
    try {
      // 1. Update Firestore Profile Doc
      await updateUserProfile({
        fullName: settingsForm.fullName,
        mobile: settingsForm.mobile,
        address: settingsForm.address,
        city: settingsForm.city,
        state: settingsForm.state,
        country: settingsForm.country,
        photoURL: settingsPic || "",
        youtubeUrl: settingsForm.youtubeUrl,
        instagramUrl: settingsForm.instagramUrl,
        facebookUrl: settingsForm.facebookUrl,
        linkedinUrl: settingsForm.linkedinUrl,
        twitterUrl: settingsForm.twitterUrl,
        telegramUsername: settingsForm.telegramUsername,
        websiteUrl: settingsForm.websiteUrl
      });

      // 2. Handle Password Change (if requested)
      if (settingsNewPassword) {
        if (!settingsCurrentPassword) {
          setSettingsErrorMsg("Current password is required to change to a new password.");
          setSettingsLoading(false);
          return;
        }
        if (settingsNewPassword.length < 8) {
          setSettingsErrorMsg("New password must be at least 8 characters long.");
          setSettingsLoading(false);
          return;
        }
        if (settingsNewPassword !== settingsConfirmPassword) {
          setSettingsErrorMsg("Passwords do not match.");
          setSettingsLoading(false);
          return;
        }

        const authUser = auth.currentUser;
        if (authUser && authUser.email) {
          const cred = EmailAuthProvider.credential(authUser.email, settingsCurrentPassword);
          await reauthenticateWithCredential(authUser, cred);
          await updatePassword(authUser, settingsNewPassword);
          setSettingsCurrentPassword("");
          setSettingsNewPassword("");
          setSettingsConfirmPassword("");
        }
      }

      setSettingsSuccessMsg("Account updated successfully.");
    } catch (err: any) {
      setSettingsErrorMsg(err?.message || "Failed to update settings parameters.");
    } finally {
      setSettingsLoading(false);
    }
  };

  // Deduplicate orders by courseId so a user strictly gets 1 card per course ("1 user 1 course 1 time purchase") in their classroom view.
  const deduplicatedOrders = React.useMemo(() => {
    const map = new Map<string, any>();
    for (const order of orders) {
      const cid = order.courseId;
      if (!cid) continue;
      const existing = map.get(cid);
      if (!existing) {
        map.set(cid, order);
      } else {
        const oStatus = order.status?.toLowerCase() || "";
        const eStatus = existing.status?.toLowerCase() || "";
        const isActiveStatus = (s: string) => ["approved", "verified", "delivered"].includes(s);
        const isPendingStatus = (s: string) => ["pending"].includes(s);

        if (isActiveStatus(oStatus) && !isActiveStatus(eStatus)) {
          map.set(cid, order);
        } else if (isPendingStatus(oStatus) && !isActiveStatus(eStatus) && !isPendingStatus(eStatus)) {
          map.set(cid, order);
        }
      }
    }
    return Array.from(map.values());
  }, [orders]);

  // Filter lists for statistics
  const activeOrders = deduplicatedOrders.filter(o => o.status?.toLowerCase() === "approved" || o.status?.toLowerCase() === "delivered" || o.status === "Verified" || o.status === "Delivered");
  const pendingOrders = deduplicatedOrders.filter(o => o.status?.toLowerCase() === "pending" || o.status === "Pending");
  const rejectedOrders = deduplicatedOrders.filter(o => o.status?.toLowerCase() === "rejected" || o.status === "Rejected" || o.status?.toLowerCase() === "blocked" || o.status === "Blocked");

  // A) EMAIL VERIFICATION GUARD VIEW
  if (user && !user.emailVerified && user.providerData.some(p => p.providerId === "password")) {
    return (
      <div className="max-w-xl mx-auto text-center border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#0c0c0c] rounded-3xl p-8 sm:p-12 space-y-8 shadow-2xl relative my-16 animate-in fade-in zoom-in duration-350">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand-gold/5 blur-3xl rounded-full" />
        <div className="w-16 h-16 bg-brand-gold/15 text-brand-gold rounded-full flex items-center justify-center mx-auto border border-brand-gold/25 animate-pulse relative z-10">
          <Mail className="w-8 h-8" />
        </div>
        <div className="space-y-3 relative z-10">
          <span className="text-xs font-mono tracking-widest text-[#F5B300] uppercase font-bold bg-brand-gold/10 px-3 py-1 rounded-full border border-brand-gold/15">Verification Pending</span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
            Verify Your Student Email
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto">
            We have dispatched an activation link to <strong className="text-neutral-800 dark:text-white select-all">{user.email}</strong>. Please investigate your inbox and spam folder.
          </p>
        </div>

        <div className="space-y-4 relative z-10 pt-4 max-w-sm mx-auto">
          <button
            onClick={async () => {
              setVerificationSent(true);
              setVerificationError("");
              try {
                await sendVerificationEmail();
                setVerificationMsg("Verification email resent successfully!");
              } catch (e: any) {
                setVerificationError(e?.message || "Failed to dispatch. Please try again later.");
                setVerificationSent(false);
              }
            }}
            disabled={verificationSent}
            className="w-full bg-brand-gold text-black font-display font-semibold hover:bg-[#F5B300]/90 px-6 py-3.5 rounded-xl transition-all shadow-md active:scale-95 duration-200 disabled:opacity-50"
          >
            {verificationSent ? "Email Dispatched" : "Resend Verification Email"}
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white hover:text-brand-gold hover:border-brand-gold/50 font-display font-semibold px-6 py-3.5 rounded-xl transition-all active:scale-95 duration-200"
          >
            I have verified my email (Refresh)
          </button>

          <button
            onClick={logout}
            className="text-neutral-500 hover:text-neutral-400 text-xs font-mono font-bold tracking-tight uppercase block mx-auto pt-3"
          >
            Sign Out Session
          </button>
        </div>

        {(verificationMsg || authError) && (
          <div className="p-3 bg-green-500/10 text-green-500 border border-green-500/20 text-xs rounded-xl flex items-center justify-center gap-1.5 font-mono max-w-sm mx-auto">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{verificationMsg || authError}</span>
          </div>
        )}

        {verificationError && (
          <div className="p-3 bg-red-500/15 text-red-500 border border-red-500/20 text-xs rounded-xl flex items-center justify-center gap-1.5 font-mono max-w-sm mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{verificationError}</span>
          </div>
        )}
      </div>
    );
  }

  // B) UNAUTHENTICATED SIGN-IN & REGISTER PORTAL
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in duration-300">
        <div className="max-w-md mx-auto bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-neutral-900 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 blur-2xl rounded-full" />
          
          <div className="text-center space-y-2.5">
            <div className="w-12 h-12 bg-brand-gold/15 text-brand-gold rounded-full flex items-center justify-center mx-auto border border-brand-gold/25">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="font-display text-2xl font-extrabold text-neutral-900 dark:text-white">
              {isSignUp ? "Create Student Account" : "Access Student Portal"}
            </h3>
            <p className="text-xs text-neutral-400">
              {isSignUp ? "Register to claim courses and track academic credits" : "Login to launch classrooms and audit credentials"}
            </p>
          </div>

          {/* Social login buttons */}
          <div className="space-y-2">
            <button
              onClick={loginWithGoogle}
              className="w-full relative bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 font-semibold border border-neutral-200 dark:border-neutral-800 px-6 py-3 rounded-xl transition-all shadow-sm active:scale-95 duration-200 flex items-center justify-center gap-2 text-sm hover:border-brand-gold/50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              onClick={loginAsDemoStudent}
              className="w-full relative bg-brand-gold text-black font-bold px-6 py-3 rounded-xl transition-all shadow-sm active:scale-95 duration-200 flex items-center justify-center gap-2 text-sm hover:bg-[#F5B300]"
            >
              <span>Demo Student Bypass (Iframe Safe)</span>
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-900"></div>
            <span className="flex-shrink mx-4 text-neutral-500 font-mono text-[10px] uppercase font-bold tracking-widest">Or credentials</span>
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-900"></div>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            
            {/* Full Name input (sign up only) */}
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-400 uppercase">Authorized Name</label>
                <input
                  id="auth-fullname"
                  type="text"
                  required
                  value={authFullName}
                  onChange={(e) => setAuthFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 placeholder-neutral-600 outline-none text-sm text-neutral-900 dark:text-white focus:border-brand-gold/60 transition-colors"
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase">Email Address</label>
              <input
                id="auth-email"
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="student@learn2future.com"
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 placeholder-neutral-600 outline-none text-sm text-neutral-900 dark:text-white focus:border-brand-gold/60 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase">Secret Password</label>
              <input
                id="auth-password"
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 placeholder-neutral-600 outline-none text-sm text-neutral-900 dark:text-white focus:border-brand-gold/60 transition-colors"
              />
            </div>

            {/* Confirm Password (sign up only) */}
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-400 uppercase">Confirm Password</label>
                <input
                  id="auth-confirmpassword"
                  type="password"
                  required
                  value={authConfirmPassword}
                  onChange={(e) => setAuthConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 placeholder-neutral-600 outline-none text-sm text-neutral-900 dark:text-white focus:border-brand-gold/60 transition-colors"
                />
              </div>
            )}

            {/* Local auth validations or context errors */}
            {(localAuthError || authError) && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl font-sans leading-relaxed text-left">
                <strong>Attempt Failed:</strong> {localAuthError || authError}
              </div>
            )}

            <button
              type="submit"
              disabled={operationLoading}
              className="w-full bg-brand-gold text-black font-display font-semibold hover:bg-[#F5B300]/90 px-6 py-3.5 rounded-xl transition-all shadow-md active:scale-95 duration-200 disabled:opacity-50 flex items-center justify-center"
            >
              {operationLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <span>{isSignUp ? "Create Student Session" : "Authorize Portal Session"}</span>
              )}
            </button>

          </form>

          {/* Toggle register vs login */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setLocalAuthError("");
                setAuthError(null);
              }}
              className="text-xs font-mono text-neutral-400 hover:text-brand-gold transition-colors underline"
            >
              {isSignUp ? "Already registered? Sign In Instead" : "Need account credentials? Sign Up"}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // C) AUTHENTICATED & VERIFIED STUDENT TERMINAL CORE
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-in fade-in duration-300">
      
      {/* Intro Header */}
      <div className="text-center space-y-3 relative py-4">
        <span className="text-xs font-mono font-bold tracking-widest text-[#F5B300] bg-brand-gold/10 border border-brand-gold/20 px-3 py-1 rounded-full uppercase">
          Student Terminal
        </span>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          My Academic Hub
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto text-sm leading-relaxed">
          Verify screenshot upload audit logs, dispatch training syllabuses, and manage executive student profiles.
        </p>

        {/* Tab Selection Row */}
        <div className="pt-6 max-w-xl mx-auto flex items-center justify-center p-1.5 bg-neutral-100 dark:bg-[#111] rounded-2xl border border-neutral-200 dark:border-neutral-900 gap-1.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setActiveTab("enrollments")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
              activeTab === "enrollments" 
                ? "bg-brand-gold text-black shadow-md font-bold" 
                : "text-neutral-500 dark:text-neutral-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Vault</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
              activeTab === "profile" 
                ? "bg-brand-gold text-black shadow-md font-bold" 
                : "text-neutral-500 dark:text-neutral-400 hover:text-white"
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
              activeTab === "settings" 
                ? "bg-brand-gold text-black shadow-md font-bold" 
                : "text-neutral-500 dark:text-neutral-400 hover:text-white"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => setActiveTab("affiliate")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
              activeTab === "affiliate" 
                ? "bg-brand-gold text-black shadow-md font-bold" 
                : "text-neutral-500 dark:text-neutral-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-current" />
            <span>Affiliate</span>
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}

      {/* TAB 1: MY ENROLLMENTS VAULT */}
      {activeTab === "enrollments" && (
        <div className="space-y-10">
          
          {/* Quick Statistics Cluster */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#121212] p-6 rounded-2xl border border-neutral-200 dark:border-brand-border flex items-center space-x-4">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-full border border-brand-gold object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-brand-gold text-black font-bold flex items-center justify-center font-mono text-lg uppercase">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-xs font-mono font-bold text-brand-gold leading-none pb-1">STUDENT ID</p>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">{dbUser?.fullName || user.displayName || "Online Member"}</h4>
                <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#121212] p-6 rounded-2xl border border-neutral-200 dark:border-brand-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-neutral-400 block font-bold uppercase tracking-wider">ACTIVE COURSES</span>
                <span className="text-3xl font-display font-bold text-neutral-900 dark:text-white">{activeOrders.length}</span>
              </div>
              <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#121212] p-6 rounded-2xl border border-neutral-200 dark:border-brand-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-neutral-400 block font-bold uppercase tracking-wider">UNDER PAYMENT AUDIT</span>
                <span className="text-3xl font-display font-bold text-neutral-900 dark:text-white">{pendingOrders.length}</span>
              </div>
              <div className="w-10 h-10 bg-yellow-500/10 text-[#F5B300] rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Enrollments representation section */}
          {loadingOrders ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-3 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : deduplicatedOrders.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-brand-border rounded-3xl bg-white dark:bg-[#121212] max-w-2xl mx-auto space-y-6">
              <Compass className="w-12 h-12 text-neutral-400 mx-auto animate-pulse" />
              <div className="space-y-1">
                <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">
                  No Active Enrollments
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                  You haven't initiated any study course payments yet. Browse our professional syllabus directory to level up your future credentials.
                </p>
              </div>
              <button
                onClick={() => setCurrentPage("courses")}
                className="inline-flex items-center space-x-2 bg-brand-gold text-black font-display font-semibold text-xs py-2.5 px-5 rounded-xl hover:bg-gold transition-colors shadow-lg active:scale-95"
              >
                <span>Browse Syllabus Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-10">
              {/* SECTION A: ACTIVE COURSES */}
              {activeOrders.length > 0 && (
                <div className="space-y-6">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-neutral-450 dark:text-neutral-300 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                    <span>Active Courses ({activeOrders.length})</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-8">
                    {activeOrders.map((order) => {
                      const isDelivered = order.status?.toLowerCase() === "delivered" || order.status === "Delivered";
                      const meta = getCourseDetails(order.courseId);
                      const isExpanded = expandedCourseId === order.id;
                      const syllabusList = courseSyllabus[order.courseId] || genericSyllabus;

                      let checkedCount = 0;
                      syllabusList.forEach((_, index) => {
                        if (completedLectures[`${order.id}_${index}`]) {
                          checkedCount++;
                        }
                      });
                      const progressPercentage = syllabusList.length > 0 
                        ? Math.round((checkedCount / syllabusList.length) * 100) 
                        : 0;

                      return (
                        <div 
                          key={order.id}
                          className={`bg-white dark:bg-[#121212] rounded-3xl border transition-all overflow-hidden relative shadow-md ${
                            isDelivered 
                              ? "border-green-500/25 bg-green-500/[0.005] hover:shadow-lg hover:border-green-500/35" 
                              : "border-blue-500/25 bg-blue-500/[0.005] hover:border-blue-500/35"
                          }`}
                        >
                          {/* Upper Detail Strip */}
                          <div className="p-4 md:p-6 lg:p-8 flex flex-col md:flex-row items-center md:justify-between gap-5 border-b border-neutral-100/10 dark:border-neutral-900/40">
                            
                            <div className="flex items-center space-x-3 md:space-x-4 min-w-0 w-full md:w-auto">
                              <img 
                                src={meta.thumbnail || null} 
                                alt={meta.title} 
                                className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl object-cover shrink-0 border border-neutral-100 dark:border-neutral-800"
                              />
                              <div className="space-y-1 min-w-0 grow">
                                <span className="inline-block text-[9px] font-mono font-bold tracking-widest text-[#F5B300] bg-brand-gold/10 px-2 py-0.5 rounded-full uppercase">
                                  {meta.category}
                                </span>
                                <h3 className="font-display text-sm md:text-base lg:text-lg font-bold text-neutral-900 dark:text-white leading-tight truncate max-w-[170px] xs:max-w-[220px] sm:max-w-[340px] md:max-w-[180px] lg:max-w-[260px] xl:max-w-[380px]" title={meta.title}>
                                  {meta.title}
                                </h3>
                              </div>
                            </div>

                            <div className="flex md:flex-col items-center md:items-start gap-2.5 sm:gap-3 md:gap-1.5 shrink-0 w-full md:w-auto justify-center md:justify-start">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] sm:text-[11px] font-bold font-mono tracking-wide uppercase px-2.5 py-0.5 rounded-full border ${
                                  isDelivered 
                                    ? "bg-green-500/10 text-green-500 border-green-500/20" 
                                    : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                }`}>
                                  {isDelivered ? "Delivered" : "Active"}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 pt-0.5">
                                <div className="w-3 h-3 rounded-full flex items-center justify-center text-[7px] text-white font-bold leading-none bg-green-500">✓</div>
                                <div className="h-0.5 w-4 bg-green-500"></div>
                                
                                <div className="w-3 h-3 rounded-full flex items-center justify-center text-[7px] text-white font-bold leading-none bg-green-500">✓</div>
                                <div className="h-0.5 w-4 bg-green-500"></div>

                                <div className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold leading-none ${
                                  isDelivered ? "bg-green-500 text-white" : "bg-neutral-250 dark:bg-neutral-800 text-neutral-500"
                                }`}>{isDelivered ? "✓" : "🔓"}</div>
                              </div>
                            </div>

                            <div className="w-full md:w-auto flex justify-center md:justify-end shrink-0 overflow-x-auto scrollbar-none">
                              <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2">
                                {/* [ Access Course ] Button */}
                                <button
                                  id={`btn-access-${order.id}`}
                                  onClick={() => {
                                    const dl = getDeliverableLink(order.courseId) || meta.deliveryUrl || "https://t.me/LearntoFuture";
                                    handleAccessCourse(order, dl);
                                  }}
                                  className="px-2.5 py-2 sm:px-4 sm:py-2.5 bg-green-600 hover:bg-green-750 text-white font-display font-bold text-[10px] sm:text-xs uppercase flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl transition-all shadow-md active:scale-95 shrink-0"
                                >
                                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                                  <span className="whitespace-nowrap">Access<span className="hidden xs:inline text-white/95"> Course</span></span>
                                </button>

                                <button
                                  onClick={() => {
                                    setReceiptOrder(order);
                                    setReceiptModalOpen(true);
                                  }}
                                  className="px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10 text-[10px] sm:text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 transition-all shrink-0"
                                >
                                  <FileCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                                  <span className="whitespace-nowrap"><span className="hidden xs:inline">View </span>Receipt</span>
                                </button>
                                <button
                                  onClick={() => handleToggleCourse(order.id || "")}
                                  className={`font-display font-bold text-[10px] sm:text-xs py-2 px-2.5 sm:py-2.5 sm:px-4 rounded-xl border flex items-center justify-center gap-1 sm:gap-1.5 transition-all active:scale-95 duration-200 shrink-0 ${
                                    isExpanded 
                                      ? "bg-black dark:bg-[#1a1a1a] text-white border-neutral-850" 
                                      : "bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20"
                                  }`}
                                >
                                  <span className="whitespace-nowrap">
                                    {isExpanded ? (
                                      <>Close<span className="hidden xs:inline"> Classroom</span></>
                                    ) : (
                                      <>Start<span className="hidden xs:inline"> Study</span></>
                                    )}
                                  </span>
                                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                                </button>
                              </div>
                            </div>

                          </div>

                          {isExpanded && (
                            <div className="border-t border-neutral-100 dark:border-neutral-950 p-6 md:p-8 bg-neutral-50/50 dark:bg-[#0c0c0c]/80 space-y-8 animate-in slide-in-from-top-4 duration-300">
                              
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                
                                <div className="lg:col-span-5 space-y-5">
                                  <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-brand-border rounded-2xl p-5 space-y-4">
                                    <h4 className="text-xs font-mono font-bold text-brand-gold uppercase tracking-wider flex items-center gap-1.5">
                                      <Sparkles className="w-4 h-4" /> Credentials & Portal Access
                                    </h4>

                                    <div className="space-y-4 text-xs font-mono">
                                      <div className="p-3 bg-neutral-50 dark:bg-[#0b0b0b] rounded-xl border border-neutral-105 dark:border-neutral-900 flex items-center justify-between">
                                        <div>
                                          <span className="text-[10px] text-neutral-500 block font-bold">VIP ACCESS TOKEN</span>
                                          <span className="text-white font-bold block select-all">L2F-MEMBER-{order.id?.slice(0, 8).toUpperCase() || "UID-ERR"}</span>
                                        </div>
                                        <QrCode className="w-8 h-8 text-neutral-500" />
                                      </div>

                                      <div className="p-3 bg-neutral-50 dark:bg-[#0b0b0b] rounded-xl border border-neutral-105 dark:border-neutral-900 flex items-center justify-between">
                                        <div>
                                          <span className="text-[10px] text-neutral-500 block font-bold">STUDENT ID</span>
                                          <span className="text-neutral-300 block font-bold select-all">L2F_{order.email.split("@")[0].toUpperCase()}</span>
                                        </div>
                                      </div>

                                      <div className="space-y-2 pt-2">
                                        <span className="text-[10px] block font-sans text-neutral-400">Your materials are pushed instantly in the private Telegram broadcast. Ensure you join using the button below:</span>
                                        <a
                                          href={globalSettings.telegramChannelLink || "https://t.me/LearntoFuture"}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-sans font-semibold rounded-xl py-3 px-4 flex items-center justify-center gap-1.5 text-xs transition-all active:scale-95"
                                        >
                                          <ExternalLink className="w-4 h-4" /> Open Private Broadcast Channel
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="lg:col-span-7 space-y-5">
                                  <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-brand-border rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-mono font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                          <Tv className="w-4.5 h-4.5 text-brand-gold" /> Lecture Syllabus & Progress Tracker
                                        </h4>
                                        <span className="text-xs font-mono font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-0.5 rounded-full">
                                          {progressPercentage}% Completed
                                        </span>
                                      </div>

                                      <div className="relative w-full h-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-brand-gold transition-all duration-500 ease-out"
                                          style={{ width: `${progressPercentage}%` }}
                                        ></div>
                                      </div>

                                      <div className="space-y-2.5 pt-2">
                                        {syllabusList.map((syllabusText, idx) => {
                                          const key = `${order.id}_${idx}`;
                                          const isCompleted = completedLectures[key] || false;
                                          return (
                                            <button
                                              key={idx}
                                              onClick={() => toggleLectureCompletion(order.id || "", idx)}
                                              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                                                isCompleted 
                                                  ? "border-green-500/20 bg-green-500/[0.02] text-neutral-450 dark:text-neutral-400 line-through" 
                                                  : "border-neutral-100 dark:border-neutral-900 bg-neutral-50 dark:bg-[#0c0c0c] text-neutral-800 dark:text-white hover:border-brand-gold/25"
                                              }`}
                                            >
                                              <span className="pt-0.5 shrink-0 text-brand-gold">
                                                {isCompleted ? (
                                                  <CheckSquare className="w-4 h-4" />
                                                ) : (
                                                  <Square className="w-4 h-4" />
                                                )}
                                              </span>
                                              <div className="space-y-0.5">
                                                <span className="text-xs font-medium font-sans leading-normal block">
                                                  {syllabusText}
                                                </span>
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-900 flex justify-between items-center text-[11px] text-neutral-400">
                                      <span>Check off lessons as you complete them to track credentials.</span>
                                      <span>{checkedCount} / {syllabusList.length}</span>
                                    </div>
                                  </div>
                                </div>

                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION B: UNDER PAYMENT AUDIT */}
              {pendingOrders.length > 0 && (
                <div className="space-y-6 text-left">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-neutral-450 dark:text-neutral-300 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
                    <span>Payment Audit Queue ({pendingOrders.length})</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-8 text-left">
                    {pendingOrders.map((order) => {
                      const meta = getCourseDetails(order.courseId);

                      return (
                        <div 
                          key={order.id}
                          className="bg-white dark:bg-[#121212] rounded-3xl border border-neutral-200 dark:border-brand-border/60 shadow-md p-6 md:p-8"
                        >
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            
                            <div className="flex items-center space-x-4">
                              <img 
                                src={meta.thumbnail || null} 
                                alt={meta.title} 
                                className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-neutral-100 dark:border-neutral-850 opacity-60"
                              />
                              <div className="space-y-1.5 overflow-hidden">
                                <span className="text-[9px] font-mono font-bold tracking-widest text-[#F5B300] bg-brand-gold/5 px-2.5 py-1 rounded-full uppercase">
                                  {meta.category}
                                </span>
                                <h3 className="font-display text-lg font-bold text-neutral-500 dark:text-neutral-400 leading-tight truncate">
                                  {meta.title}
                                </h3>
                              </div>
                            </div>

                            <div className="w-full md:w-auto flex flex-col space-y-1.5 shrink-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold font-mono tracking-wide uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full">
                                  Under Verification
                                </span>
                              </div>

                              <div className="flex items-center gap-2 pt-1.5">
                                <div className="w-3 h-3 rounded-full flex items-center justify-center text-[7px] text-white font-bold leading-none bg-green-500">✓</div>
                                <div className="h-0.5 w-6 bg-neutral-250 dark:bg-neutral-800"></div>
                                
                                <div className="w-3 h-3 rounded-full flex items-center justify-center text-[7px] text-white font-bold leading-none bg-amber-500 animate-pulse">!</div>
                                <div className="h-0.5 w-6 bg-neutral-250 dark:bg-neutral-800"></div>

                                <div className="w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold leading-none bg-neutral-250 dark:bg-neutral-800 text-neutral-500">🔓</div>
                              </div>
                            </div>

                            <div className="w-full md:w-auto text-right shrink-0">
                              <div className="flex flex-col sm:flex-row gap-2 items-center justify-end">
                                <div className="text-[11px] font-mono font-bold text-amber-500 uppercase flex items-center gap-1.5 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20 md:mr-2 shrink-0">
                                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                                  <span>Verification Pending</span>
                                </div>
                                
                                <button
                                  disabled
                                  className="px-5 py-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-450 dark:text-neutral-650 font-display font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-not-allowed shrink-0"
                                  title="Enrollment is currently under verification audit"
                                >
                                  <BookOpen className="w-4 h-4" />
                                  <span>Access Course</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setReceiptOrder(order);
                                    setReceiptModalOpen(true);
                                  }}
                                  className="px-4 py-2.5 rounded-xl border border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shrink-0"
                                >
                                  <FileCheck className="w-4 h-4" />
                                  <span>View Receipt</span>
                                </button>
                              </div>
                            </div>

                          </div>

                          <div className="mt-6 pt-5 border-t border-dotted border-neutral-200 dark:border-neutral-900 text-xs text-neutral-400 leading-relaxed text-left space-y-2">
                            <p className="font-semibold text-neutral-700 dark:text-neutral-300 font-mono text-[10px] uppercase tracking-wider">Payment Verification Pending</p>
                            <p>
                              Your transaction proof has been submitted for screenshot validation. Delivery links, course syllabus, and access buttons remain frozen until verified by our enrollment desks. Audits are usually processed within 1-2 hours.
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION C: ACCESS BLOCKED / REJECTED */}
              {rejectedOrders.length > 0 && (
                <div className="space-y-6 pt-6 text-left">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-red-500 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]" />
                    <span>Access Blocked ({rejectedOrders.length})</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-8 text-left">
                    {rejectedOrders.map((order) => {
                      const meta = getCourseDetails(order.courseId);

                      return (
                        <div 
                          key={order.id}
                          className="bg-white dark:bg-[#121212] rounded-3xl border border-red-500/30 dark:border-red-950/65 shadow-md p-6 md:p-8"
                        >
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            
                            <div className="flex items-center space-x-4">
                              <img 
                                src={meta.thumbnail || null} 
                                alt={meta.title} 
                                className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-neutral-100 dark:border-neutral-850 opacity-40"
                              />
                              <div className="space-y-1.5 overflow-hidden">
                                <span className="text-[9px] font-mono font-bold tracking-widest text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full uppercase">
                                  {meta.category}
                                </span>
                                <h3 className="font-display text-lg font-bold text-neutral-400 dark:text-neutral-500 leading-tight truncate">
                                  {meta.title}
                                </h3>
                              </div>
                            </div>

                            <div className="w-full md:w-auto flex flex-col space-y-1.5 shrink-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold font-mono tracking-wide uppercase bg-red-500/10 text-red-500 border border-red-500/25 px-3 py-1 rounded-full">
                                  Access Blocked
                                </span>
                              </div>
                            </div>

                            <div className="w-full md:w-auto text-right shrink-0">
                              <span className="text-[11px] font-mono font-bold text-red-500 uppercase flex items-center gap-1.5 bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20 md:mr-2 shrink-0">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Verification Rejected</span>
                              </span>
                            </div>

                          </div>

                          <div className="mt-6 pt-5 border-t border-dotted border-red-200 dark:border-red-950 text-xs text-neutral-400 leading-relaxed text-left space-y-2">
                            <p className="font-semibold text-red-500 dark:text-red-400 font-mono text-[10px] uppercase tracking-wider">Payment Disapproved</p>
                            <p>
                              Your transaction proof screenshot has been rejected as invalid or duplicate. Please contact LearntoFuture Support Desk or upload a valid screenshot receipt on a new checkout order.
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY MEMBER PROFILE */}
      {activeTab === "profile" && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
          
          {/* Main Badge Card */}
          <div className="bg-white dark:bg-[#111111] border border-neutral-200 dark:border-brand-border rounded-3xl p-8 relative overflow-hidden shadow-xl flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-gold/5 blur-3xl rounded-full" />
            
            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 text-center md:text-left">
              {dbUser?.photoURL ? (
                <img 
                  src={dbUser.photoURL} 
                  alt="Alumni photo" 
                  className="w-24 h-24 rounded-full border-2 border-brand-gold object-cover shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-brand-gold text-black font-extrabold flex items-center justify-center font-display text-3xl shadow-md uppercase">
                  {dbUser?.fullName?.charAt(0) || user.email?.charAt(0) || "U"}
                </div>
              )}

              <div className="space-y-2">
                <span className="text-[10px] font-mono tracking-widest text-[#F5B300] bg-brand-gold/10 px-2.5 py-0.5 rounded-full uppercase font-bold">Verified Scholar</span>
                <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">{dbUser?.fullName || "Online Scholar"}</h2>
                
                <div className="text-xs text-neutral-500 space-y-1">
                  <p className="flex items-center justify-center md:justify-start gap-1">
                    <Mail className="w-3.5 h-3.5 text-brand-gold" />
                    <span>{dbUser?.email || user.email}</span>
                  </p>
                  {dbUser?.mobile && (
                    <p className="flex items-center justify-center md:justify-start gap-1">
                      <Phone className="w-3.5 h-3.5 text-brand-gold" />
                      <span>{dbUser.mobile}</span>
                    </p>
                  )}
                  {dbUser?.city && (
                    <p className="flex items-center justify-center md:justify-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                      <span>{dbUser.city}, {dbUser.state}, {dbUser.country}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Meta Metadata block */}
            <div className="bg-neutral-50 dark:bg-neutral-900/40 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-900/60 font-mono text-[11px] space-y-2 shrink-0 w-full md:w-64 relative z-10">
              <p className="font-bold text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 pb-1.5 uppercase">Academic Registry</p>
              <p className="flex items-center justify-between"><span className="text-neutral-500">Method:</span> <span className="text-white font-bold">{dbUser?.signupMethod || "Social Google"}</span></p>
              {dbUser?.dateOfBirth && <p className="flex items-center justify-between"><span className="text-neutral-500">DOB:</span> <span className="text-white font-semibold">{dbUser.dateOfBirth}</span></p>}
              {dbUser?.gender && <p className="flex items-center justify-between"><span className="text-neutral-500">Gender:</span> <span className="text-white font-semibold">{dbUser.gender}</span></p>}
              <p className="flex items-center justify-between"><span className="text-neutral-500">Tier:</span> <span className="text-brand-gold font-bold">Premium Student</span></p>
            </div>
          </div>

          {/* Academic Progression and Achievements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Active Classrooms Directory */}
            <div className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-neutral-200 dark:border-brand-border space-y-4">
              <h3 className="font-display font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-1.5"><BookOpen className="w-5 h-5 text-brand-gold" /> Enrolled Classrooms</h3>
              {activeOrders.length === 0 ? (
                <p className="text-xs text-neutral-500">No active premium courses in your library.</p>
              ) : (
                <div className="space-y-3 pt-2">
                  {activeOrders.map((order) => {
                    const meta = getCourseDetails(order.courseId);
                    return (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-900/50 rounded-xl font-sans">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <img src={meta.thumbnail || null} alt={meta.title} className="w-10 h-10 rounded-lg object-cover" />
                          <span className="text-xs text-neutral-800 dark:text-white font-medium truncate">{meta.title}</span>
                        </div>
                        <span className="text-[10px] font-bold font-mono tracking-wide uppercase bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full shrink-0">ACTIVE</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Purchase History & Receipts Directory */}
            <div className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-neutral-200 dark:border-brand-border space-y-4">
              <h3 className="font-display font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-1.5">
                <FileCheck className="w-5 h-5 text-brand-gold" /> Purchase Receipts
              </h3>
              
              <div className="space-y-3 pt-2">
                {orders.length === 0 ? (
                  <p className="text-xs text-neutral-500 font-sans">No transactions recorded for this account.</p>
                ) : (
                  orders.map((order) => {
                    const meta = getCourseDetails(order.courseId);
                    const status = order.status?.toLowerCase() || "";
                    const isDelivered = status === "delivered";
                    const isPending = status === "pending";
                    
                    return (
                      <div key={order.id} className="p-4 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-900/60 rounded-xl flex items-center justify-between font-sans">
                        <div className="space-y-1 overflow-hidden min-w-0 pr-3">
                          <h4 className="text-xs font-bold text-neutral-800 dark:text-white truncate">{meta.title}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-neutral-500 font-bold">
                              {order.createdAt ? (order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : new Date(order.createdAt as any).toLocaleDateString()) : "N/A"}
                            </span>
                            <span className={`text-[9px] font-semibold font-mono uppercase px-1.5 py-0.5 rounded ${
                              isDelivered 
                                ? "bg-green-500/10 text-green-500" 
                                : isPending 
                                ? "bg-yellow-500/10 text-yellow-500 animate-pulse" 
                                : "bg-blue-500/10 text-blue-500"
                            }`}>
                              {order.status || "Pending"}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptOrder(order);
                            setReceiptModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-brand-gold/15 text-brand-gold hover:bg-brand-gold/25 rounded-lg text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer font-sans"
                        >
                          View Receipt
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: ACCOUNT & SETTINGS EDIT */}
      {activeTab === "settings" && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-[#111111] border border-neutral-200 dark:border-brand-border rounded-3xl p-6 sm:p-10 shadow-lg animate-in fade-in duration-200">
          <h3 className="font-display font-extrabold text-xl text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-brand-border pb-4 mb-6">Modify Account Preferences</h3>
          
          {settingsSuccessMsg && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-500 text-sm rounded-xl flex items-center gap-2">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{settingsSuccessMsg}</span>
            </div>
          )}

          {settingsErrorMsg && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{settingsErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6 text-sm">
            
            {/* Avatar Selector in Settings */}
            <div className="flex flex-col items-center space-y-2 mb-6">
              <div className="relative group cursor-pointer border border-neutral-200 dark:border-neutral-850 p-1.5 rounded-full">
                {settingsPic ? (
                  <img src={settingsPic} alt="Settings photo" className="w-20 h-20 rounded-full object-cover shadow-sm border border-brand-gold/50" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-500">
                    <Camera className="w-6 h-6" />
                  </div>
                )}
                <label 
                  htmlFor="settings-pic-upload" 
                  className="absolute bottom-1 right-1 w-7 h-7 bg-brand-gold text-black rounded-full flex items-center justify-center cursor-pointer shadow hover:scale-105 transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                </label>
                <input 
                  id="settings-pic-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleSettingsPicUpload}
                />
              </div>
              <span className="text-[10px] font-mono text-neutral-500">CHANGE PROFILE PIC (MAX 2MB)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-neutral-500 font-bold text-xs uppercase font-mono">Full Name</label>
                <input
                  id="settings-fullname"
                  type="text"
                  required
                  value={settingsForm.fullName}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 placeholder-neutral-600 outline-none text-neutral-900 dark:text-white"
                />
              </div>

              {/* Mobile */}
              <div className="space-y-1">
                <label className="text-neutral-500 font-bold text-xs uppercase font-mono">Mobile Contact</label>
                <input
                  id="settings-mobile"
                  type="tel"
                  required
                  value={settingsForm.mobile}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, mobile: e.target.value }))}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 placeholder-neutral-600 outline-none text-neutral-900 dark:text-white"
                />
              </div>

            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-neutral-500 font-bold text-xs uppercase font-mono">Street Address</label>
              <input
                id="settings-address"
                type="text"
                value={settingsForm.address}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, address: e.target.value }))}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 placeholder-neutral-600 outline-none text-neutral-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* City */}
              <div className="space-y-1">
                <label className="text-neutral-500 font-bold text-xs uppercase font-mono">City</label>
                <input
                  id="settings-city"
                  type="text"
                  value={settingsForm.city}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 outline-none text-neutral-900 dark:text-white"
                />
              </div>

              {/* State */}
              <div className="space-y-1">
                <label className="text-neutral-500 font-bold text-xs uppercase font-mono">State</label>
                <input
                  id="settings-state"
                  type="text"
                  value={settingsForm.state}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 outline-none text-neutral-900 dark:text-white"
                />
              </div>

              {/* Country */}
              <div className="space-y-1">
                <label className="text-neutral-500 font-bold text-xs uppercase font-mono">Country</label>
                <input
                  id="settings-country"
                  type="text"
                  value={settingsForm.country}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 outline-none text-neutral-900 dark:text-white"
                />
              </div>

            </div>

            {/* SOCIAL PROFILES SETTINGS PANEL */}
            <div className="pt-6 border-t border-neutral-100 dark:border-neutral-900 space-y-4">
              <h4 className="text-sm font-bold text-neutral-800 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-gold" /> Social Profiles
              </h4>
              <p className="text-xs text-neutral-500 font-light -mt-2">Provide links to your social network handles or websites (all fields are optional).</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* YouTube */}
                <div className="space-y-1">
                  <label className="text-neutral-500 font-bold text-xs uppercase font-mono">YouTube Channel URL</label>
                  <input
                    id="settings-youtubeUrl"
                    type="url"
                    placeholder="https://youtube.com/@yourchannel"
                    value={settingsForm.youtubeUrl || ""}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 placeholder-neutral-700 outline-none text-neutral-900 dark:text-white"
                  />
                </div>

                {/* Instagram */}
                <div className="space-y-1">
                  <label className="text-neutral-500 font-bold text-xs uppercase font-mono">Instagram Profile URL</label>
                  <input
                    id="settings-instagramUrl"
                    type="url"
                    placeholder="https://instagram.com/username"
                    value={settingsForm.instagramUrl || ""}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, instagramUrl: e.target.value }))}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 placeholder-neutral-700 outline-none text-neutral-900 dark:text-white"
                  />
                </div>

                {/* Facebook */}
                <div className="space-y-1">
                  <label className="text-neutral-500 font-bold text-xs uppercase font-mono">Facebook Profile URL</label>
                  <input
                    id="settings-facebookUrl"
                    type="url"
                    placeholder="https://facebook.com/username"
                    value={settingsForm.facebookUrl || ""}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, facebookUrl: e.target.value }))}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 placeholder-neutral-700 outline-none text-neutral-900 dark:text-white"
                  />
                </div>

                {/* LinkedIn */}
                <div className="space-y-1">
                  <label className="text-neutral-500 font-bold text-xs uppercase font-mono">LinkedIn Profile URL</label>
                  <input
                    id="settings-linkedinUrl"
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={settingsForm.linkedinUrl || ""}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 placeholder-neutral-700 outline-none text-neutral-900 dark:text-white"
                  />
                </div>

                {/* Twitter (X) */}
                <div className="space-y-1">
                  <label className="text-neutral-500 font-bold text-xs uppercase font-mono">X (Twitter) Profile URL</label>
                  <input
                    id="settings-twitterUrl"
                    type="url"
                    placeholder="https://x.com/username"
                    value={settingsForm.twitterUrl || ""}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, twitterUrl: e.target.value }))}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 placeholder-neutral-700 outline-none text-neutral-900 dark:text-white"
                  />
                </div>

                {/* Telegram Username */}
                <div className="space-y-1">
                  <label className="text-neutral-500 font-bold text-xs uppercase font-mono">Telegram Username</label>
                  <input
                    id="settings-telegramUsername"
                    type="text"
                    placeholder="e.g. username"
                    value={settingsForm.telegramUsername || ""}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, telegramUsername: e.target.value }))}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 placeholder-neutral-700 outline-none text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Personal Website */}
              <div className="space-y-1">
                <label className="text-neutral-500 font-bold text-xs uppercase font-mono">Personal Website URL</label>
                <input
                  id="settings-websiteUrl"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={settingsForm.websiteUrl || ""}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, websiteUrl: e.target.value }))}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 placeholder-neutral-700 outline-none text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            {/* PASSWORD REAUTHENTICATE BLOCK FOR EMAIL SIGNUPS ONLY */}
            {user.providerData.some(p => p.providerId === "password") && (
              <div className="pt-6 border-t border-neutral-100 dark:border-neutral-900 space-y-4">
                <h4 className="text-sm font-bold text-neutral-800 dark:text-white flex items-center gap-1.5"><Key className="w-4 h-4 text-brand-gold" /> Update Secret Password</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-500">Current Password</label>
                    <input
                      id="settings-currentpass"
                      type="password"
                      value={settingsCurrentPassword}
                      onChange={(e) => setSettingsCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 placeholder-neutral-700 outline-none text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-500">New Password (8+ Chars)</label>
                    <input
                      id="settings-newpass"
                      type="password"
                      value={settingsNewPassword}
                      onChange={(e) => setSettingsNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 placeholder-neutral-700 outline-none text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-500">Confirm New Password</label>
                    <input
                      id="settings-confirmpass"
                      type="password"
                      value={settingsConfirmPassword}
                      onChange={(e) => setSettingsConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 placeholder-neutral-700 outline-none text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-neutral-100 dark:border-neutral-900 flex justify-end">
              <button
                type="submit"
                disabled={settingsLoading}
                className="bg-brand-gold text-black font-display font-semibold hover:bg-[#F5B300]/90 px-8 py-3.5 rounded-xl transition-all shadow-md hover:shadow-brand-gold/10 active:scale-95 disabled:opacity-50"
              >
                {settingsLoading ? "Saving Changes..." : "Save Settings"}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* TAB 4: AFFILIATE PROGRAM AND CRM INTEGRATION */}
      {activeTab === "affiliate" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Main header block */}
          <div className="bg-gradient-to-r from-neutral-900 to-[#121212] border border-brand-gold/25 p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-brand-gold/5 rounded-full blur-3xl"></div>
            <div className="absolute left-0 bottom-0 -translate-x-12 translate-y-12 w-48 h-48 bg-[#F5B300]/5 rounded-full blur-3xl"></div>
            
            <div className="relative space-y-3 max-w-2xl">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#F5B300] border border-[#F5B300]/25 bg-[#F5B300]/5 px-3 py-1 rounded-full uppercase">
                Creator Monetization Program
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                Learn2Future Affiliate Hub
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Refer students to Learn2Future, provide custom-crafted discount coupons, and collect a premium <strong className="text-brand-gold font-bold">15% base commission</strong> on every verified curriculum enrollment.
              </p>
            </div>
          </div>

          {/* LOADING STATE */}
          {loadingAffiliateApp ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <RefreshCw className="w-8 h-8 text-brand-gold animate-spin" />
              <p className="text-xs font-mono text-neutral-500 uppercase">Verifying Affiliate Registry Status...</p>
            </div>
          ) : !isProfileComplete ? (
            
            /* PROFILE INCOMPLETE SCREEN (PART 2) */
            <div className="max-w-2xl mx-auto bg-[#111] border border-yellow-500/20 rounded-3xl p-6 sm:p-10 space-y-6 text-center animate-in scale-in duration-200">
              <div className="w-16 h-16 bg-yellow-500/10 text-[#F5B300] rounded-full flex items-center justify-center mx-auto border border-yellow-500/20">
                <AlertTriangle className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-display font-extrabold text-xl text-white">Profile Setup Required</h3>
                <p className="text-sm text-zinc-400 max-w-md mx-auto">
                  Before applying as a Learn2Future affiliate tutor or promoter, you must fully complete your student registry profile settings.
                </p>
              </div>

              {/* List required missing fields */}
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-900 text-left max-w-md mx-auto space-y-2.5">
                <p className="text-[10px] font-mono text-neutral-500 font-bold uppercase tracking-wider">Required Settings Fields Checklist:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${(dbUser?.fullName || user?.displayName)?.trim() ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>✓</div>
                    <span className="text-zinc-400">Full Name</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${(dbUser?.mobile || appMobile)?.trim() ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>✓</div>
                    <span className="text-zinc-400">Mobile Number</span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${user?.email?.trim() ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>✓</div>
                    <span className="text-zinc-400">Email Address</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-500/5 rounded-2xl border border-yellow-500/20 text-[#F5B300] text-xs font-mono select-none">
                "Please complete your profile before applying for the Affiliate Program."
              </div>

              <button
                onClick={() => setActiveTab("settings")}
                className="bg-brand-gold text-black font-semibold font-display hover:opacity-90 px-8 py-3.5 rounded-xl transition-all shadow-md"
              >
                Go to Settings & Profile Setup
              </button>
            </div>
          ) : !affiliateApp ? (
            
            /* REGISTRATION FORM VIEW (PART 2, PART 3, PART 22) */
            <div className="max-w-2xl mx-auto bg-white dark:bg-[#111111] border border-neutral-200 dark:border-brand-border rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
              <div className="border-b border-neutral-100 dark:border-brand-border pb-4">
                <h3 className="font-display font-extrabold text-xl text-neutral-900 dark:text-white">Apply for the Affiliate Program</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Submit your customized coupon preferences & promotional strategies portfolio.</p>
              </div>

              {appError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{appError}</span>
                </div>
              )}

              {appSuccess && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 text-sm rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>{appSuccess}</span>
                </div>
              )}

              <form onSubmit={handleApplyAffiliate} className="space-y-6 text-sm">
                
                {/* Profile Readonly Context fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-900">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-500 font-bold uppercase block">Full Name</label>
                    <span className="text-xs font-bold text-neutral-900 dark:text-zinc-300 block truncate">{dbUser?.fullName || user.displayName}</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-500 font-bold uppercase block">Email Registry</label>
                    <span className="text-xs font-mono text-[#F5B300] block truncate">{user.email}</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-500 font-bold uppercase block">Mobile Contact</label>
                    {dbUser?.mobile ? (
                      <span className="text-xs text-neutral-900 dark:text-zinc-300 block truncate">{dbUser.mobile}</span>
                    ) : (
                      <input
                        type="text"
                        required
                        placeholder="Type mobile number..."
                        value={appMobile}
                        onChange={(e) => setAppMobile(e.target.value)}
                        className="w-full bg-transparent outline-none text-xs text-neutral-900 dark:text-white border-b border-neutral-300 dark:border-neutral-800 focus:border-brand-gold py-0.5"
                      />
                    )}
                  </div>
                </div>

                {/* Preferred coupon name input (PART 3) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-neutral-500 dark:text-zinc-400 font-bold text-xs uppercase font-mono block">Preferred Coupon Code</label>
                    <span className="text-[10px] font-mono text-brand-gold font-bold">LETTERS ONLY (A-Z)</span>
                  </div>
                  <input
                    id="aff-pref-coupon"
                    type="text"
                    required
                    maxLength={16}
                    placeholder="e.g. AYAN or RAHUL"
                    value={prefCoupon}
                    onChange={(e) => setPrefCoupon(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 placeholder-neutral-600 outline-none uppercase font-mono text-neutral-900 dark:text-white focus:border-brand-gold transition-colors"
                  />
                  <p className="text-[11px] text-neutral-500 leading-relaxed font-sans">
                    Numbers (0-9) are <strong className="text-red-500 font-bold">stricly invalid</strong>. Valid Examples: <span className="font-mono text-green-500 font-semibold bg-green-500/5 px-1 py-0.5 rounded border border-green-500/10">AYAN</span>, <span className="font-mono text-green-500 font-semibold bg-green-500/5 px-1 py-0.5 rounded border border-green-500/10">TECHGURU</span>.
                  </p>
                </div>

                {/* Answer rationale (PART 3) */}
                <div className="space-y-2">
                  <label className="text-neutral-500 dark:text-zinc-400 font-bold text-xs uppercase font-mono block">
                    Product Promotion Rationale Question
                  </label>
                  <span className="text-[11px] text-neutral-400 leading-relaxed block pb-1">
                    "Why do you want this affiliate coupon and where will you promote it?" <span className="text-red-500 font-bold">*</span>
                  </span>
                  <textarea
                    required
                    rows={4}
                    value={promoAnswer}
                    onChange={(e) => setPromoAnswer(e.target.value)}
                    placeholder="Explain detail channel list (Instagram handles, YouTube channel links, Telegram communities, Facebook groups or custom blog posts) where you plan to pitch the coupon..."
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl px-4 py-3 placeholder-neutral-600 outline-none text-neutral-900 dark:text-white focus:border-brand-gold transition-colors text-xs leading-relaxed"
                  />
                </div>

                {/* Future-Ready hidden inputs block (PART 21) */}
                <div className="hidden">
                  <input type="text" readOnly placeholder="upi-id-future" />
                  <input type="text" readOnly placeholder="bank-account-num" />
                  <input type="text" readOnly placeholder="bank-ifsc-code" />
                  <input type="text" readOnly placeholder="beneficiary-name" />
                </div>

                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-900">
                  <button
                    type="submit"
                    disabled={submittingApp}
                    className="w-full bg-brand-gold text-black font-display font-bold hover:bg-[#F5B300]/90 py-3.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {submittingApp ? "Submitting Application Details..." : "Apply For Affiliate Program"}
                  </button>
                </div>

              </form>
            </div>
          ) : (
            
            /* APPLICATION HAS RECORD IN DATABASE */
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* STATUS BANNER CARDS (PART 4) */}
              {affiliateApp.status === "pending" && (
                <div className="p-6 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex gap-3 items-start">
                    <Clock className="w-6 h-6 shrink-0 mt-0.5 text-amber-400" />
                    <div className="space-y-1">
                      <h4 className="font-display font-bold text-sm text-white">Affiliate Registration Audit Queue</h4>
                      <p className="text-xs text-neutral-400">
                        Your custom coupon application <strong className="text-amber-400 font-mono">"{affiliateApp.preferredCoupon}"</strong> has been logged and is under secure desk team audit. Applications are verified within 1-2 hours.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-500/10 border border-amber-500/25 text-amber-400 px-3 py-1 rounded-full font-bold uppercase tracking-widest animate-pulse select-none">
                    STATUS: PENDING
                  </span>
                </div>
              )}

              {affiliateApp.status === "rejected" && (
                <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-3xl flex flex-col items-start gap-4 space-y-1">
                  <div className="flex gap-3 items-start w-full justify-between">
                    <div className="flex gap-3 items-start">
                      <AlertTriangle className="w-6 h-6 shrink-0 text-red-400" />
                      <div className="space-y-1">
                        <h4 className="font-display font-bold text-sm text-white">Application Request Declined</h4>
                        <p className="text-xs text-neutral-300">
                          Your request was audited and declined at this time.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono bg-red-500/10 border border-red-500/25 text-red-500 px-3 py-1 rounded-full font-bold uppercase tracking-widest select-none">
                      REJECTED
                    </span>
                  </div>
                  {affiliateApp.notes && (
                    <div className="bg-neutral-950 p-4 border border-red-500/10 rounded-2xl w-full text-xs text-zinc-400 leading-relaxed font-mono">
                      <strong className="text-zinc-300 block mb-1">AUDITOR PRIVATE NOTES:</strong>
                      {affiliateApp.notes}
                    </div>
                  )}
                  <div className="pt-3 w-full border-t border-red-500/15 flex justify-end">
                    <button
                      onClick={handleResetApplication}
                      className="bg-neutral-900 border border-red-500/30 text-red-400 hover:bg-neutral-800 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    >
                      Reset & Submit New Application
                    </button>
                  </div>
                </div>
              )}

              {affiliateApp.status === "suspended" && (
                <div className="p-6 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-3xl flex flex-col gap-4">
                  <div className="flex gap-3 items-start justify-between w-full">
                    <div className="flex gap-3 items-start">
                      <AlertTriangle className="w-6 h-6 shrink-0 text-amber-500 animate-pulse" />
                      <div className="space-y-1">
                        <h4 className="font-display font-bold text-sm text-white">Affiliate Account Suspended</h4>
                        <p className="text-xs text-neutral-400">
                          Your affiliate registry has been frozen. Your promotional coupon is currently <strong className="text-red-500">disabled/inactive</strong> and commission accumulation is temporarily paused.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono bg-amber-500/10 border border-amber-500/25 text-amber-500 px-3 py-1 rounded-full font-bold uppercase tracking-widest select-none">
                      SUSPENDED
                    </span>
                  </div>
                  {affiliateApp.notes && (
                    <div className="bg-[#0b0b0b] p-4 border border-zinc-800 rounded-2xl text-xs leading-relaxed font-mono text-zinc-500">
                      <strong className="text-zinc-400 block mb-1">SUSPENSION REASON:</strong>
                      {affiliateApp.notes}
                    </div>
                  )}
                  <div className="p-4 bg-yellow-500/5 text-[#F5B300] border border-yellow-500/15 rounded-xl text-xs leading-relaxed font-sans mt-2">
                    <strong className="font-bold">Notice to Partner:</strong> Payout manual requests are temporarily held until compliance re-evaluation completes. Please mail support channels.
                  </div>
                </div>
              )}

              {/* APPROVED DASHBOARD CODES & KPIS (PART 12) */}
              {affiliateApp.status === "approved" && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  
                  {/* TOP COUPON CONTROLLER & COPY BLOCK */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Primary Coupon Holder */}
                    <div className="md:col-span-2 bg-[#121212] p-6 rounded-2xl border border-brand-gold/30 flex flex-col justify-between space-y-4">
                      <div>
                        <span className="text-[9px] font-mono text-brand-gold font-bold tracking-widest uppercase block mb-1">
                          YOUR LIVE REFERRAL COUPON
                        </span>
                        <h4 className="text-sm text-zinc-400">
                          Refer customers with your code or copy the discount checkout link.
                        </h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-neutral-950 px-5 py-4 rounded-xl border border-neutral-900 border-dashed font-mono font-bold text-2xl text-white tracking-widest uppercase select-all select-none">
                          {affiliateApp.couponCode || affiliateApp.preferredCoupon}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(affiliateApp.couponCode || affiliateApp.preferredCoupon);
                            setCopiedCoupon(true);
                            setTimeout(() => setCopiedCoupon(false), 2000);
                          }}
                          className="bg-brand-gold hover:opacity-90 active:scale-95 text-black font-semibold px-5 py-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          <span>{copiedCoupon ? "Copied!" : "Copy Code"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Referral Link */}
                    {(affiliateApp.referralLink || affiliateApp.couponCode) && (
                      <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-zinc-500 font-bold tracking-widest uppercase">Your Referral Link</span>
                          <span className="text-[9px] font-mono text-brand-gold/70">Share this link on social media</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-neutral-950 px-3 py-2.5 rounded-xl border border-neutral-800 text-[10px] font-mono text-neutral-400 truncate select-all">
                            {affiliateApp.referralLink || `https://learn2future.vercel.app/courses?ref=${affiliateApp.couponCode}`}
                          </div>
                          <button
                            onClick={() => {
                              const link = affiliateApp.referralLink || `https://learn2future.vercel.app/courses?ref=${affiliateApp.couponCode}`;
                              navigator.clipboard.writeText(link);
                              showToast("Referral link copied!");
                            }}
                            className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-2.5 rounded-xl text-[10px] font-mono transition-all flex items-center gap-1.5"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy Link
                          </button>
                        </div>
                        <p className="text-[9px] text-neutral-600 font-mono">
                          When someone clicks your link and purchases a course, you earn commission automatically.
                        </p>
                      </div>
                    )}

                    {/* Affiliate Terms Box */}
                    <div className="bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[9px] font-mono text-zinc-500 font-bold tracking-widest uppercase block">
                          CAMPAIGN CONFIGURATION
                        </span>
                        <div className="flex justify-between border-b border-neutral-800 pb-1.5 pt-0.5 text-xs">
                          <span className="text-zinc-500">Student Discount:</span>
                          <span className="text-green-500 font-mono font-bold">{affiliateApp.discountPercent || 10}% Discount</span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-800 pb-1.5 text-xs">
                          <span className="text-zinc-500">Your Payout Rate:</span>
                          <span className="text-brand-gold font-mono font-bold">{affiliateApp.commissionPercent || 15}% Commission</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">Cookie / Coupon Duration:</span>
                          <span className="text-[#F5B300] font-bold font-mono">Lifetime</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider block text-center pt-2 select-none border-t border-neutral-900">
                        LIFETIME VALUE SYNCED
                      </span>
                    </div>

                  </div>

                  {/* SUB-DASHBOARD METRICS (PART 12 & PART 13) */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    
                    {/* Metric 1: Times Used */}
                    <div className="bg-neutral-950 p-4 border border-neutral-900 rounded-xl">
                      <span className="text-[9px] text-zinc-500 font-mono block font-bold uppercase tracking-wider">COUPON USAGE</span>
                      <span className="text-xl font-display font-bold text-white block mt-1">{affiliateApp.timesUsed || 0}</span>
                      <span className="text-[9px] font-mono text-zinc-600 block mt-0.5">Times Traced</span>
                    </div>

                    {/* Metric 2: Total Orders */}
                    <div className="bg-neutral-950 p-4 border border-neutral-900 rounded-xl">
                      <span className="text-[9px] text-zinc-500 font-mono block font-bold uppercase tracking-wider">TOTAL ORDERS</span>
                      <span className="text-xl font-display font-bold text-white block mt-1">{affiliateApp.totalOrders || 0}</span>
                      <span className="text-[9px] font-mono text-zinc-600 block mt-0.5">Approved Enrollments</span>
                    </div>

                    {/* Metric 3: Total Revenue */}
                    <div className="bg-neutral-950 p-4 border border-neutral-900 rounded-xl">
                      <span className="text-[9px] text-zinc-500 font-mono block font-bold uppercase tracking-wider">TOTAL SALES REVENUE</span>
                      <span className="text-xl font-display font-bold text-green-500 block mt-1">₹{(affiliateApp.totalRevenue || 0).toLocaleString()}</span>
                      <span className="text-[9px] font-mono text-zinc-600 block mt-0.5">Final Paid Cost (INR)</span>
                    </div>

                    {/* Metric 4: Estimated Course Earnings */}
                    <div className="bg-neutral-950 p-4 border border-neutral-900 rounded-xl">
                      <span className="text-[9px] text-zinc-500 font-mono block font-bold uppercase tracking-wider">ESTIMATED EARNINGS</span>
                      <span className="text-xl font-display font-bold text-brand-gold block mt-1">₹{Number(affiliateApp.estimatedEarnings || 0).toFixed(2)}</span>
                      <span className="text-[9px] font-mono text-zinc-600 block mt-0.5">Cumulative Commission</span>
                    </div>

                    {/* Metric 5: Paid Out */}
                    <div className="bg-neutral-950 p-4 border border-neutral-900 rounded-xl col-span-2 md:col-span-1">
                      <span className="text-[9px] text-zinc-500 font-mono block font-bold uppercase tracking-wider">PAID EARNINGS</span>
                      <span className="text-xl font-display font-bold text-zinc-300 block mt-1">₹{Number(affiliateApp.paidEarnings || 0).toFixed(2)}</span>
                      <span className="text-[9px] font-mono text-zinc-600 block mt-0.5">Transferred & Settled</span>
                    </div>

                  </div>

                  {/* PAYMENT SETTLEMENT DETAILS (UPI / BANK WIRE) */}
                  <div className="bg-[#111111] p-6 rounded-2xl border border-neutral-900/60 space-y-4 text-left">
                    <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                      <div>
                        <span className="text-[9px] font-mono text-brand-gold font-bold tracking-widest uppercase block mb-0.5">
                          PAYMENT SETTLEMENT CONFIGURATION
                        </span>
                        <h4 className="text-sm font-bold text-white">Configure your UPI Address or Bank Account</h4>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 bg-neutral-950 px-2 py-1 rounded border border-neutral-900">
                        AUTOMATED WEB-SYNC
                      </span>
                    </div>

                    <form onSubmit={handleSaveSettlement} className="space-y-4">
                      {/* Payout Method Toggle */}
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setPayoutMethod("UPI")}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                            payoutMethod === "UPI"
                              ? "bg-brand-gold text-black border-brand-gold font-bold"
                              : "bg-transparent text-zinc-400 border-neutral-800 hover:text-white"
                          }`}
                        >
                          UPI Transfer
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayoutMethod("Bank")}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                            payoutMethod === "Bank"
                              ? "bg-brand-gold text-black border-brand-gold font-bold"
                              : "bg-transparent text-zinc-400 border-neutral-800 hover:text-white"
                          }`}
                        >
                          Direct Bank Wire
                        </button>
                      </div>

                      {payoutMethod === "UPI" ? (
                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">UPI ID (e.g. name@upi) *</label>
                          <input
                            type="text"
                            placeholder="e.g. user@okhdfcbank"
                            value={settlementUpi}
                            onChange={(e) => setSettlementUpi(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-900 rounded-xl px-4 py-3 outline-none text-xs text-white focus:border-brand-gold transition-colors"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                          <div className="space-y-1.5 col-span-1">
                            <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Account Number *</label>
                            <input
                              type="text"
                              placeholder="Account number"
                              value={settlementBankAccount}
                              onChange={(e) => setSettlementBankAccount(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-900 rounded-xl px-4 py-3 outline-none text-xs text-white focus:border-brand-gold transition-colors"
                            />
                          </div>
                          <div className="space-y-1.5 col-span-1">
                            <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Bank IFSC Code *</label>
                            <input
                              type="text"
                              placeholder="e.g. HDFC0000123"
                              value={settlementIfsc}
                              onChange={(e) => setSettlementIfsc(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-900 rounded-xl px-4 py-3 outline-none text-xs text-white focus:border-brand-gold transition-colors uppercase"
                            />
                          </div>
                          <div className="space-y-1.5 col-span-1">
                            <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Beneficiary Full Name *</label>
                            <input
                              type="text"
                              placeholder="As per bank passbook"
                              value={settlementBeneficiaryName}
                              onChange={(e) => setSettlementBeneficiaryName(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-900 rounded-xl px-4 py-3 outline-none text-xs text-white focus:border-brand-gold transition-colors"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="submit"
                          disabled={settlementLoading}
                          className="bg-neutral-950 hover:bg-neutral-900 text-brand-gold font-bold text-xs px-6 py-3 rounded-xl border border-neutral-800 hover:border-brand-gold/30 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {settlementLoading ? "Syncing Credentials..." : "Save Settlement Details"}
                        </button>
                        {settlementSuccess && (
                          <span className="text-xs text-green-500 font-mono flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {settlementSuccess}
                          </span>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* PAYOUT REQUEST HUB CARD (PART 13, PART 15) */}
                  <div className="bg-[#111111] p-6 rounded-2xl border border-neutral-900/60 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-left flex-1">
                      <span className="text-[9px] font-mono text-brand-gold font-bold tracking-widest uppercase block">
                        WITHDRAWAL LEDGER CONSOLE
                      </span>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <span>Withdraw Pending Earnings:</span> 
                        <span className="text-brand-gold font-mono font-extrabold text-lg">₹{Number(affiliateApp.pendingEarnings || 0).toFixed(2)}</span>
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Payout threshold: <strong className="text-brand-gold">₹500</strong>. Requests are securely verified and settled manually by our central desks.
                      </p>
                      
                      {/* Notice (PART 15) */}
                      <p className="text-[10px] font-mono text-zinc-500 border-l border-zinc-700 pl-2 pt-0.5 mt-1.5 select-none">
                        "Payout requests are usually processed within 1–3 working days."
                      </p>
                    </div>

                    <div className="w-full md:w-auto space-y-2">
                      <button
                        onClick={handleRequestPayout}
                        disabled={submittingPayout || Number(affiliateApp.pendingEarnings || 0) < 500}
                        className="w-full md:w-auto bg-brand-gold text-black hover:opacity-90 active:scale-95 px-8 py-3.5 rounded-xl text-xs font-bold font-display transition-all disabled:opacity-30 disabled:pointer-events-none"
                      >
                        {submittingPayout ? "Registering Payout Request..." : "Request Payout"}
                      </button>

                      {payoutError && <p className="text-xs text-red-500 text-center font-semibold">{payoutError}</p>}
                      {payoutSuccess && <p className="text-xs text-green-500 text-center font-semibold">{payoutSuccess}</p>}
                    </div>
                  </div>

                  {/* SALES LOG HISTORY (PART 11) */}
                  <div className="space-y-4">
                    <div className="border-b border-neutral-900 pb-2">
                      <h4 className="font-display font-bold text-sm text-zinc-300">Curriculum Referrals & Earnings History</h4>
                      <p className="text-[11px] text-zinc-500">Individual tracking logs of students buying using code.</p>
                    </div>

                    {affiliateSales.length === 0 ? (
                      <div className="text-center py-12 bg-neutral-950 rounded-xl border border-neutral-900">
                        <p className="text-xs font-mono text-zinc-500">No student coupon referal sales logged yet. Share your code to get commissions.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-neutral-900 rounded-xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-neutral-950 text-neutral-500 font-mono text-[10px] tracking-wider uppercase border-b border-neutral-900">
                              <th className="p-3">Order ID</th>
                              <th className="p-3">Alumni Course</th>
                              <th className="p-3">Final Cost</th>
                              <th className="p-3">Discount</th>
                              <th className="p-3 text-brand-gold">Your Commission</th>
                              <th className="p-3">Purchase Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-900 font-mono text-zinc-300">
                            {affiliateSales.map((sale: any) => (
                              <tr key={sale.id} className="hover:bg-neutral-950/40">
                                <td className="p-3 text-neutral-500 text-[11px] font-mono font-bold select-all">{sale.orderId || sale.id}</td>
                                <td className="p-3 font-sans font-semibold text-white">{sale.productName || "Curriculum Track"}</td>
                                <td className="p-3 font-semibold text-green-500">₹{(sale.finalPaidAmount || 0).toFixed(2)}</td>
                                <td className="p-3 text-zinc-500">₹{(sale.discountGiven || 0).toFixed(2)}</td>
                                <td className="p-3 text-brand-gold font-bold">₹{Number(sale.commissionEarned || 0).toFixed(2)}</td>
                                <td className="p-3 text-zinc-500 text-[11px]">
                                  {sale.purchaseDate?.seconds ? new Date(sale.purchaseDate.seconds * 1000).toLocaleDateString() : String(sale.purchaseDate || "Just now")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* ACTIVE PAYOUT REQUESTS LIST */}
                  <div className="space-y-4 pt-4">
                    <div className="border-b border-neutral-900 pb-2">
                      <h4 className="font-display font-bold text-sm text-zinc-300">Withdrawal Transaction Ledger</h4>
                      <p className="text-[11px] text-zinc-500">Realtime tracking statuses of manual payout requests.</p>
                    </div>

                    {payoutsList.length === 0 ? (
                      <div className="text-center py-8 bg-neutral-950 rounded-xl border border-neutral-900">
                        <p className="text-xs font-mono text-zinc-500">No withdraw or payout transactions logged yet.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-neutral-900 rounded-xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-neutral-950 text-neutral-500 font-mono text-[10px] tracking-wider uppercase border-b border-neutral-900">
                              <th className="p-3">Transaction ID</th>
                              <th className="p-3">Amount Requested</th>
                              <th className="p-3">Date Submitted</th>
                              <th className="p-3">Verification Stage</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-900 font-mono text-zinc-300">
                            {payoutsList.map((payout: any) => (
                              <tr key={payout.id} className="hover:bg-neutral-950/40">
                                <td className="p-3 text-neutral-500 font-mono select-all text-[11px]">{payout.id}</td>
                                <td className="p-3 text-white font-bold">₹{Number(payout.amount || 0).toFixed(2)}</td>
                                <td className="p-3 text-zinc-500">
                                  {payout.requestDate?.seconds ? new Date(payout.requestDate.seconds * 1000).toLocaleDateString() : "Just now"}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-1.5 rounded-md font-bold text-[9px] tracking-wider uppercase border ${
                                    payout.status?.toLowerCase() === "pending" ? "text-amber-500 border-amber-500/20 bg-amber-500/5" :
                                    payout.status?.toLowerCase() === "processing" ? "text-blue-500 border-blue-500/20 bg-blue-500/5" :
                                    payout.status?.toLowerCase() === "paid" ? "text-green-500 border-green-500/20 bg-green-500/5" :
                                    "text-red-500 border-red-500/20 bg-red-500/5"
                                  }`}>
                                    {payout.status || "Pending"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* SERVICE HELP NOTICE (PART 23) */}
                  <div className="bg-[#111] p-5 rounded-2xl border border-neutral-900 flex gap-3.5 items-start">
                    <HelpCircle className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
                    <div className="space-y-1.5 text-xs text-zinc-400 font-sans leading-relaxed text-left">
                      <strong className="text-white block font-display">Affiliate Help notice:</strong>
                      "If your statistics are not visible yet, contact Learn2Future support with:
                      <ul className="list-disc pl-5 py-1 text-zinc-500 space-y-0.5 font-mono text-[10px] uppercase">
                        <li>Name</li>
                        <li>Coupon Code</li>
                        <li>Email</li>
                        <li>Instagram Username</li>
                      </ul>
                      Our team will manually verify your affiliate data."
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* PROFESSIONAL RECEIPT / ORDER DETAILS MODAL */}
      {receiptModalOpen && receiptOrder && (
        (() => {
          const meta = getCourseDetails(receiptOrder.courseId);
          const orderState = receiptOrder.status?.toLowerCase() || "pending";
          const isDelivered = orderState === "delivered";
          const isApproved = orderState === "approved" || isDelivered;
          
          const formatD = (timestamp: any) => {
            if (!timestamp) return "Pending Verification";
            if (timestamp.toDate && typeof timestamp.toDate === "function") {
              return timestamp.toDate().toLocaleString();
            }
            if (timestamp.seconds) {
              return new Date(timestamp.seconds * 1000).toLocaleString();
            }
            return new Date(timestamp).toLocaleString();
          };

          const handleDownloadPDF = async () => {
            const { jsPDF } = await import("jspdf");
            const makePDF = (imgElement?: HTMLImageElement) => {
              try {
                const doc = new jsPDF();
                
                // Top Dark Header banner
                doc.setFillColor(15, 15, 15);
                doc.rect(0, 0, 210, 48, "F");
                
                if (imgElement) {
                  // Draw Brand Logo Image on top left banner space
                  doc.addImage(imgElement, "JPEG", 15, 10, 28, 28);
                  
                  // L2F Typographic Title shifted right
                  doc.setTextColor(245, 179, 0); // brand-gold
                  doc.setFont("helvetica", "bold");
                  doc.setFontSize(22);
                  doc.text("LEARN 2 FUTURE", 48, 24);
                  
                  doc.setFontSize(9);
                  doc.setTextColor(180, 180, 180);
                  doc.text("ELITE MASTERCLASS BLUEPRINTS & LEDGER", 48, 31);
                } else {
                  // L2F Typographic Title original fallback
                  doc.setTextColor(245, 179, 0); // brand-gold
                  doc.setFont("helvetica", "bold");
                  doc.setFontSize(22);
                  doc.text("LEARN 2 FUTURE", 15, 23);
                  
                  doc.setFontSize(9);
                  doc.setTextColor(180, 180, 180);
                  doc.text("ELITE MASTERCLASS BLUEPRINTS & LEDGER", 15, 30);
                }
                
                // Invoice description (Right side of banner)
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(16);
                doc.text("OFFICIAL RECEIPT", 140, 23);
                
                doc.setFontSize(9);
                doc.setTextColor(180, 180, 180);
                doc.text(`Receipt Ref: L2F-${(receiptOrder.id || "").toUpperCase().slice(0, 8)}`, 140, 30);
                doc.text(`Issued Date: ${new Date().toLocaleDateString()}`, 140, 35);
                
                // Accent horizontal bar
                doc.setFillColor(245, 179, 0);
                doc.rect(0, 48, 210, 2, "F");
                
                // Customer Details Block
                doc.setTextColor(50, 50, 50);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10.5);
                doc.text("CUSTOMER REGISTER", 15, 62);
                doc.setDrawColor(220, 220, 220);
                doc.setLineWidth(0.5);
                doc.line(15, 65, 95, 65);
                
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.setTextColor(80, 80, 80);
                doc.text([
                  `Name: ${receiptOrder.name || "Elite Alumni Student"}`,
                  `Email: ${receiptOrder.email || "N/A"}`,
                  `Telegram: @${(receiptOrder.telegram || "N/A").replace("@", "")}`
                ], 15, 71);

                // Order Details Block
                doc.setTextColor(50, 50, 50);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10.5);
                doc.text("TRANSACTION METADATA", 115, 62);
                doc.line(115, 65, 195, 65);
                
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.setTextColor(80, 80, 80);
                
                const createdDateStr = receiptOrder.createdAt ? (receiptOrder.createdAt.toDate ? receiptOrder.createdAt.toDate().toLocaleDateString() : new Date(receiptOrder.createdAt).toLocaleDateString()) : "N/A";
                doc.text([
                  `Order ID: ${receiptOrder.id || "N/A"}`,
                  `Payment Gateway: ${receiptOrder.paymentMethod || "Telegram Manual Proof"}`,
                  `Transaction Ref: ${receiptOrder.razorpayPaymentId || receiptOrder.paymentId || "Verifying..."}`,
                  `Submitted Date: ${createdDateStr}`
                ], 115, 71);

                // Itemized details header
                doc.setFillColor(245, 245, 245);
                doc.rect(15, 95, 180, 8, "F");
                
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.setTextColor(60, 60, 60);
                doc.text("CURRICULUM MODULE / BLUEPRINT", 20, 101);
                doc.text("CATEGORY", 110, 101);
                doc.text("UNIT PRICE", 160, 101);

                // Row item
                doc.setFont("helvetica", "normal");
                doc.setTextColor(80, 80, 80);
                doc.text(`${meta.title}`, 20, 111);
                doc.text(`${meta.category}`, 110, 111);
                
                const rawPrice = receiptOrder.originalPrice || receiptOrder.price || receiptOrder.amount || 0;
                doc.text(`INR ${rawPrice}`, 160, 111);
                
                doc.setDrawColor(235, 235, 235);
                doc.line(15, 117, 195, 117);

                // Billing block calculations
                let currY = 125;
                doc.setFontSize(9);
                doc.text("Subtotal:", 130, currY);
                doc.text(`INR ${rawPrice}`, 165, currY);

                if (receiptOrder.couponCode) {
                  currY += 5;
                  doc.text(`Coupon (${receiptOrder.couponCode}):`, 115, currY);
                  const discountVal = receiptOrder.discountApplied || receiptOrder.couponDiscount || 0;
                  doc.text(`- INR ${discountVal}`, 165, currY);
                }

                currY += 6;
                doc.setDrawColor(245, 179, 0);
                doc.line(130, currY - 3, 195, currY - 3);
                
                doc.setFont("helvetica", "bold");
                doc.setTextColor(20, 20, 20);
                doc.text("Total Paid Amount:", 120, currY);
                doc.text(`INR ${receiptOrder.amount || receiptOrder.price || 0}`, 165, currY);

                // Verification stamps
                doc.setFillColor(245, 179, 0);
                doc.rect(15, 122, 65, 16, "F");
                doc.setTextColor(255, 255, 255);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(7.5);
                doc.text("MANUAL VERIFICATION AUDIT", 19, 127);
                doc.setFontSize(10.5);
                doc.text(orderState.toUpperCase(), 19, 133);

                // Timeline milestones
                doc.setTextColor(60, 60, 60);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.text("ENROLLMENT LIFE-CYCLE TIMELINE", 15, 150);
                doc.setDrawColor(220, 220, 220);
                doc.line(15, 153, 195, 153);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(8.5);
                doc.setTextColor(110, 110, 110);
                
                const lineY = 160;
                doc.text([
                  `1. ORDER OPENED`,
                  `${createdDateStr}`
                ], 15, lineY);

                const verifyDateStr = receiptOrder.purchasedAt ? formatD(receiptOrder.purchasedAt) : "Pending Review";
                doc.text([
                  `2. PAYMENT VERIFIED`,
                  `${verifyDateStr}`
                ], 80, lineY);

                const deliverDateStr = receiptOrder.deliveredAt ? formatD(receiptOrder.deliveredAt) : (isApproved ? "Auto-Assigned" : "Awaiting Verification");
                doc.text([
                  `3. COURSE DELIVERED`,
                  `${deliverDateStr}`
                ], 145, lineY);

                // Footer lines
                doc.setFontSize(8);
                doc.setTextColor(140, 140, 140);
                doc.line(15, 180, 195, 180);
                doc.text("For enrollment verification assist protocols, please join the dedicated channel: https://t.me/LearntoFuture", 15, 186);
                doc.text("This receipt documents private digital blueprint library subscriptions. All payments are verified dynamically.", 15, 191);

                // Save triggers
                doc.save(`L2F_Official_Receipt_Order_${receiptOrder.id?.slice(0, 8)}.pdf`);
              } catch (err: any) {
                alert(`Receipt engine failure: ${err?.message || String(err)}`);
              }
            };

            // Pre-load the local logo to prevent race condition before jsPDF renders
            try {
              const img = new Image();
              img.src = "/brand_logo.jpg";
              img.onload = () => makePDF(img);
              img.onerror = () => makePDF(); // Safe fallback without image block
            } catch (err) {
              makePDF(); // Safe fallback on error
            }
          };

          return (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-[#0c0c0c] max-w-2xl w-full border border-brand-gold/40 rounded-3xl p-6 sm:p-8 relative text-white animate-in zoom-in-95 duration-200 shadow-2xl shadow-brand-gold/15">
                
                {/* Close Button top corner */}
                <button 
                  onClick={() => setReceiptModalOpen(false)}
                  className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors active:scale-90"
                >
                  ✕
                </button>

                {/* Receipts Title */}
                <div className="text-center space-y-1 mb-6 border-b border-dashed border-neutral-900 pb-5">
                  <div className="text-brand-gold font-mono text-[10px] tracking-[0.3em] uppercase font-extrabold flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-gold animate-pulse" />
                    <span>Learn 2 Future Official Ledger</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-wide uppercase">
                    Order Details & Receipt
                  </h2>
                </div>

                <div className="space-y-5 text-xs max-h-[60vh] overflow-y-auto pr-1">
                  
                  {/* Row 1: Course Info */}
                  <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-900/60 space-y-3">
                    <h3 className="font-mono font-bold text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-brand-gold" />
                      <span>Curriculum Course</span>
                    </h3>
                    <div className="flex items-center gap-4">
                      <img src={meta.thumbnail || null} alt={meta.title} className="w-14 h-14 rounded-xl object-cover border border-neutral-800 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-white truncate">{meta.title}</p>
                        <p className="text-brand-gold font-mono text-[10px] font-bold uppercase mt-0.5">{meta.category}</p>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Customer Registry & Timeline side by side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Customer */}
                    <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-900/60 space-y-2">
                      <h3 className="font-mono font-bold text-[10px] text-zinc-500 uppercase tracking-widest">Customer Registry</h3>
                      <div className="space-y-1.5 pt-1">
                        <p className="flex justify-between"><span className="text-neutral-500 font-medium">Alumni:</span> <span className="font-semibold text-white">{receiptOrder.name}</span></p>
                        <p className="flex justify-between items-center"><span className="text-neutral-500 font-medium">Email:</span> <span className="font-normal text-white truncate max-w-[130px]" title={receiptOrder.email}>{receiptOrder.email}</span></p>
                        <p className="flex justify-between"><span className="text-neutral-500 font-medium">Telegram Username:</span> <span className="font-mono text-brand-gold">@{receiptOrder.telegram}</span></p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-900/60 space-y-2">
                      <h3 className="font-mono font-bold text-[10px] text-zinc-500 uppercase tracking-widest">Lifecycle Milestones</h3>
                      <div className="space-y-1.5 pt-1 font-sans">
                        <p className="flex justify-between"><span className="text-neutral-500">Created At:</span> <span className="text-neutral-300 text-[11px] font-mono">{formatD(receiptOrder.createdAt)}</span></p>
                        <p className="flex justify-between"><span className="text-neutral-500">Payment Submitted:</span> <span className="text-neutral-300 text-[11px] font-mono">{formatD(receiptOrder.createdAt)}</span></p>
                        <p className="flex justify-between"><span className="text-neutral-500">Verified On:</span> <span className="text-neutral-300 text-[11px] font-mono">{receiptOrder.purchasedAt ? formatD(receiptOrder.purchasedAt) : "Pending Review"}</span></p>
                        <p className="flex justify-between"><span className="text-neutral-500">Delivery On:</span> <span className="text-neutral-300 text-[11px] font-mono">{receiptOrder.deliveredAt ? formatD(receiptOrder.deliveredAt) : (isApproved ? "Auto-Assigned" : "Pending Verification")}</span></p>
                      </div>
                    </div>

                  </div>

                  {/* Row 3: Transaction Info ledger */}
                  <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-900/60 space-y-2">
                    <h3 className="font-mono font-bold text-[10px] text-zinc-500 uppercase tracking-widest">Financial Invoice Ledger</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-6 pt-1 font-mono text-[11px]">
                      <p className="flex justify-between"><span className="text-neutral-500">Order ID:</span> <span className="text-white select-all">{receiptOrder.id || "N/A"}</span></p>
                      <p className="flex justify-between"><span className="text-neutral-500">Transaction Ref:</span> <span className="text-white select-all">{receiptOrder.razorpayPaymentId || receiptOrder.paymentId || "Verifying Transaction..."}</span></p>
                      <p className="flex justify-between"><span className="text-neutral-500">Payment Channel:</span> <span className="text-brand-gold uppercase">{receiptOrder.paymentMethod || "Manual Proof upload"}</span></p>
                      <p className="flex justify-between"><span className="text-neutral-500">Status Indicator:</span> <span className={`uppercase font-bold ${isDelivered ? 'text-green-400' : isApproved ? 'text-blue-400' : 'text-amber-400 animate-pulse'}`}>{orderState}</span></p>
                    </div>

                    <div className="border-t border-neutral-900/80 my-2 pt-2 text-[11px] space-y-1">
                      <p className="flex justify-between"><span className="text-neutral-500 font-medium">Standard Retail Price:</span> <span className="text-zinc-400 font-mono">INR {receiptOrder.originalPrice || receiptOrder.price || receiptOrder.amount || 0}</span></p>
                      {receiptOrder.couponCode && (
                        <p className="flex justify-between"><span className="text-neutral-500 font-medium">Coupon Discount ({receiptOrder.couponCode}):</span> <span className="text-red-400 font-mono">- INR {receiptOrder.discountApplied || receiptOrder.couponDiscount || 0}</span></p>
                      )}
                      <p className="flex justify-between border-t border-dotted border-neutral-900/85 pt-1.5 text-xs"><span className="text-zinc-300 font-bold">Final Amount Paid:</span> <span className="text-brand-gold font-mono font-bold">INR {receiptOrder.amount || receiptOrder.price || 0}</span></p>
                    </div>
                  </div>

                </div>

                {/* Footer Buttons */}
                <div className="pt-6 border-t border-neutral-900/50 flex flex-col sm:flex-row gap-3 justify-end">
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full sm:w-auto px-5 py-3 bg-[#111111] hover:bg-neutral-900 border border-neutral-800 text-white hover:text-brand-gold rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    Download Receipt PDF
                  </button>
                  <button
                    onClick={() => setReceiptModalOpen(false)}
                    className="w-full sm:w-auto px-5 py-3 bg-brand-gold text-black hover:bg-gold rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                  >
                    Dismiss Receipt
                  </button>
                </div>

              </div>
            </div>
          );
        })()
      )}
    </div>
  );
};
