import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { 
  Search, 
  Filter, 
  Send as TelegramIcon, 
  Upload, 
  CheckCircle, 
  X, 
  Copy,
  ChevronLeft, 
  ChevronRight, 
  CreditCard, 
  Volume2, 
  ArrowRight,
  Sparkles,
  Info,
  QrCode,
  FileText,
  ShoppingBag,
  Share2
} from "lucide-react";
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage, handleFirestoreError, OperationType } from "../firebase";
import { Course, Order } from "../types";
import { SEO } from "./SEO";

export const Courses: React.FC = () => {
  const navigate = useNavigate();
  const { 
    user, 
    loginWithGoogle, 
    loginAsDemoStudent,
    globalSettings, 
    logUserActivity, 
    addToCart, 
    isSetupComplete, 
    setAuthModalOpen, 
    setAuthModalMessage,
    setCurrentPage,
    hasPurchasedCourse,
    showToast,
    urlCourseSlug,
    setUrlCourseSlug,
    urlReferrerId,
    setUrlReferrerId
  } = useApp();
  
  // States for Courses list
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Pagination state
  const [currentPageNo, setCurrentPageNo] = useState(1);
  const coursesPerPage = 6;

  // Selected course for purchase
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  // Purchase modal form state
  const [submitting, setSubmitting] = useState(false);
  const [orderName, setOrderName] = useState("");
  const [orderEmail, setOrderEmail] = useState("");
  const [orderTelegram, setOrderTelegram] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [errorNotice, setErrorNotice] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Sharing System states
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [courseToShare, setCourseToShare] = useState<Course | null>(null);

  // Track referral CTR clicks on landing/load
  const trackReferralClick = async (courseId: string, courseName: string, referrerId: string | null) => {
    if (!referrerId) return;
    try {
      const sessionKey = `ref_click_${courseId}_${referrerId}`;
      if (sessionStorage.getItem(sessionKey)) return; // prevent duplicate clicks per session on reload
      sessionStorage.setItem(sessionKey, "true");

      await addDoc(collection(db, "courseReferrals"), {
        courseId,
        courseName,
        referrerId,
        clickedUserId: user?.uid || "anonymous",
        createdAt: serverTimestamp()
      });
      console.log(`Referral click tracked successfully for referrer "${referrerId}" on course "${courseName}"`);
    } catch (err) {
      console.error("Failed to track referral click in firestore:", err);
    }
  };

  // Log share events inside Firebase
  const logShareToFirestore = async (course: Course, platform: string, shareUrl: string) => {
    try {
      await addDoc(collection(db, "courseShares"), {
        courseId: course.id,
        courseName: course.title,
        userId: user?.uid || "anonymous",
        platform: platform,
        shareUrl: shareUrl,
        createdAt: serverTimestamp()
      });
      
      if (logUserActivity) {
        await logUserActivity("Course Shared" as any, `Shared course "${course.title}" on platform: ${platform}`);
      }
    } catch (err) {
      console.error("Failed to log sharing event to Firestore:", err);
    }
  };

  // Handle share button clicks with auto-detection of platform and fallback modal
  const handleShareClick = async (course: Course) => {
    const slug = course.slug || course.id;
    const referrerId = user?.uid || "";
    const refSuffix = referrerId ? `?ref=${referrerId}` : "";
    const shareUrl = `${window.location.origin}/course/${slug}${refSuffix}`;
    const shareText = `🚀 Check out this amazing course:

${course.title}

💰 Price: ₹${course.price.toLocaleString("en-IN") || course.price}
📚 Category: ${course.category}

🎯 Learn valuable skills and upgrade yourself!

🔗 Link: ${shareUrl}`;

    if (navigator.share && /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: course.title,
          text: shareText,
          url: shareUrl
        });
        await logShareToFirestore(course, "nativeshare", shareUrl);
        showToast("Course link shared successfully!", "success");
      } catch (err) {
        console.warn("Native share cancelled or failed: ", err);
        setCourseToShare(course);
        setShareModalOpen(true);
      }
    } else {
      setCourseToShare(course);
      setShareModalOpen(true);
    }
  };

  // Listen for deep-linked course URL on load and set up selectedCourse
  useEffect(() => {
    if (courses.length > 0 && urlCourseSlug) {
      const found = courses.find((c) => c.slug === urlCourseSlug || c.id === urlCourseSlug);
      if (found) {
        setSelectedCourse(found);
        
        // Navigate to the proper SEO-friendly URL via React Router (fixes refresh/direct-URL 404s)
        navigate(`/course/${found.slug || found.id}${urlReferrerId ? `?ref=${urlReferrerId}` : ""}`, { replace: true });

        // Track referral CTR clicks on landing/load
        if (urlReferrerId) {
          trackReferralClick(found.id, found.title, urlReferrerId);
        }
      }
      // Reset deep link state to prevent multiple prompts on navigate
      setUrlCourseSlug(null);
    }
  }, [courses, urlCourseSlug]);

  const handleOpenPurchase = (course: Course) => {
    setSelectedCourse(course);
    navigate(`/course/${course.slug || course.id}`);
    if (logUserActivity) {
      logUserActivity("Checkout Initiated", course.title);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError("");
    setLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Courses login error:", err);
      const msg = err?.message || "";
      if (err?.code === "auth/popup-blocked" || msg.includes("popup-blocked") || msg.includes("blocked")) {
        setLoginError("Pop-up Blocked: please allow pop-ups or open app in a new tab.");
      } else if (err?.code === "auth/cancelled-popup-request" || msg.includes("cancelled-popup-request") || msg.includes("cancelled")) {
        setLoginError("Sign-In Cancelled.");
      } else {
        setLoginError(`Sign-In failed: ${err?.message || String(err)}`);
      }
    } finally {
      setLoggingIn(false);
    }
  };

  // Promo & Coupon States
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

  // Prefill user details when they pick a course
  useEffect(() => {
    if (selectedCourse && user) {
      setOrderName(user.displayName || "");
      setOrderEmail(user.email || "");
    }
  }, [selectedCourse, user]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || !selectedCourse) return;
    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(false);

    const formattedCode = couponInput.trim().toUpperCase();

    try {
      const couponDocRef = doc(db, "coupons", formattedCode);
      const docSnap = await getDoc(couponDocRef);

      if (!docSnap.exists()) {
        setCouponError("Invalid promo code or expired coupon.");
        setAppliedCoupon(null);
        return;
      }

      const couponData = docSnap.data();

      if (!couponData.isActive) {
        setCouponError("This promo code is currently disabled.");
        setAppliedCoupon(null);
        return;
      }

      if (couponData.minOrderValue && selectedCourse) {
        if (selectedCourse.price < couponData.minOrderValue) {
          setCouponError(`Minimum course price of ₹${couponData.minOrderValue} is required to apply this coupon.`);
          setAppliedCoupon(null);
          return;
        }
      }

      if (couponData.expiresAt) {
        const expiryDate = new Date(couponData.expiresAt);
        if (expiryDate.getTime() < Date.now()) {
          setCouponError("This promo code has expired.");
          setAppliedCoupon(null);
          return;
        }
      }

      setAppliedCoupon({ id: docSnap.id, ...couponData });
      setCouponSuccess(true);
      setCouponError(null);
    } catch (err) {
      console.error("Lookup coupon failed:", err);
      setCouponError("Failed to apply promo code. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const getDiscountedPrice = () => {
    if (!selectedCourse) return 0;
    if (!appliedCoupon) return selectedCourse.price;

    if (appliedCoupon.type === "percentage") {
      const discount = (selectedCourse.price * appliedCoupon.value) / 100;
      return Math.max(0, Math.round(selectedCourse.price - discount));
    } else {
      return Math.max(0, selectedCourse.price - appliedCoupon.value);
    }
  };

  const getDiscountValue = () => {
    if (!selectedCourse || !appliedCoupon) return 0;
    if (appliedCoupon.type === "percentage") {
      return Math.round((selectedCourse.price * appliedCoupon.value) / 100);
    } else {
      return appliedCoupon.value;
    }
  };

  const upiId = globalSettings.upiId;

  // Fallback items to show if database is empty
  const defaultCourses: Course[] = [
    {
      id: "ai-gold",
      title: "Self-Operative AI Mastery Blueprint",
      category: "AI Tools",
      price: 1999,
      description: "Learn how to prompt, configure, and stack autonomous agents with LLMs to automate 80% of your business processes and freelance work. Contains modules on LangChain, AutoGPT, flow creators, custom GPT models, and voice agents.",
      thumbnail: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800",
      createdAt: new Date()
    },
    {
      id: "edit-cine",
      title: "Cinema-Grade Premiere Pro & After Effects Masterclass",
      category: "Video Editing",
      price: 2499,
      description: "A comprehensive deep-dive into digital storytelling, dynamic pacing, keyframing, motion typography, and commercial visual effects editing. Ideal for micro-content editors, YouTube creators, and advertising freelancers.",
      thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=800",
      createdAt: new Date()
    },
    {
      id: "tube-viral",
      title: "YouTube Automation & Retention Secrets",
      category: "YouTube Growth",
      price: 1499,
      description: "Step-by-step framework to discover highly profitable niches, generate viral scripts, double click-through rates, and engineer retention above 65%. Build cashcow assets that print passive income.",
      thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=800",
      createdAt: new Date()
    },
    {
      id: "marketing-scale",
      title: "High-ROI Digital Marketing & Funnels Blueprint",
      category: "Digital Marketing",
      price: 1899,
      description: "Stop throwing ad-spend away. Master paid advertising on Google & Meta, visual layout analytics, advanced landing page retargeting, and conversational WhatsApp sequences that convert leads into loyal VIP buyers.",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
      createdAt: new Date()
    },
    {
      id: "freelance-ticket",
      title: "High-Ticket Freelance Client Acquisition Engine",
      category: "Freelancing",
      price: 2199,
      description: "Convert basic active bids into retainer agreements. The exact cold outreach loops, Upwork optimization audits, pricing strategies, and portfolio visual assets to close $3,000/mo clients anywhere in the world.",
      thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800",
      createdAt: new Date()
    },
    {
      id: "start-saas",
      title: "Zero-Code SaaS & Digital Business Accelerator",
      category: "Business",
      price: 2999,
      description: "Launch, scale, and automate digital micro-SaaS subscriptions. Discover hot markets, build web apps using visual platforms, configure stripe payouts, and manage growth. No coding experience is required.",
      thumbnail: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800",
      createdAt: new Date()
    }
  ];

  const categories = ["All", "AI Tools", "Video Editing", "Digital Marketing", "YouTube Growth", "Freelancing", "Business", "Self Improvement"];

  // Fetch courses from Firestore on mount with real-time updates
  useEffect(() => {
    // ── FIXED: One-time getDocs with 15-min cache instead of persistent onSnapshot ──
    setLoading(true);
    let cancelled = false;
    const CACHE_KEY = "courses_list_cache";
    const CACHE_TTL = 15 * 60 * 1000;

    async function fetchCourses() {
      // Serve from cache first for instant render
      try {
        const stored = localStorage.getItem(CACHE_KEY);
        if (stored) {
          const { ts, data } = JSON.parse(stored);
          if (Date.now() - ts < CACHE_TTL) {
            if (!cancelled) {
              setCourses(data.length > 0 ? data : defaultCourses);
              setLoading(false);
            }
            return;
          }
          // Show stale cache while refreshing
          if (!cancelled && data.length > 0) setCourses(data);
        }
      } catch (_) {}

      try {
        const snapshot = await getDocs(query(collection(db, "courses"), orderBy("createdAt", "desc")));
        if (cancelled) return;
        const docsList: Course[] = [];
        snapshot.forEach((docSnap) => docsList.push({ id: docSnap.id, ...docSnap.data() } as Course));
        const result = docsList.length > 0 ? docsList : defaultCourses;
        setCourses(result);
        if (docsList.length > 0) {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: docsList }));
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("[Courses] Fetch failed, using default:", err);
          setCourses(defaultCourses);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCourses();
    return () => { cancelled = true; };
  }, []);

  // Prepopulate client order profile once logged in
  useEffect(() => {
    if (user) {
      setOrderName(user.displayName || "");
      setOrderEmail(user.email || "");
    }
  }, [user]);

  // Handle Search and Filter logic
  const filteredCourses = courses.filter((course) => {
    const cTitle = course.title || "";
    const cCategory = course.category || "";
    const cDescription = course.description || "";
    
    const sTerm = searchTerm.toLowerCase();

    const matchesSearch = 
      cTitle.toLowerCase().includes(sTerm) ||
      cCategory.toLowerCase().includes(sTerm) ||
      cDescription.toLowerCase().includes(sTerm);

    const matchesCategory = 
      selectedCategory === "All" || 
      cCategory.trim().toLowerCase() === selectedCategory.trim().toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Pagination logic boundaries
  const totalCourses = filteredCourses.length;
  const indexOfLastCourse = currentPageNo * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCoursesSlice = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil(totalCourses / coursesPerPage);

  const handlePageChange = (pageNo: number) => {
    if (pageNo >= 1 && pageNo <= totalPages) {
      setCurrentPageNo(pageNo);
      window.scrollTo({ top: 300, behavior: "smooth" });
    }
  };

  // UPI Copy helper
  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Helper to compress images on client side to prevent excessively large payload writes
  const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
    });
  };

  // Helper to convert base64 back to a Blob or File for Storage upload
  const base64ToBlob = (base64Str: string): Blob => {
    try {
      const parts = base64Str.split(";base64,");
      const contentType = parts[0].split(":")[1] || "image/jpeg";
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      return new Blob([uInt8Array], { type: contentType });
    } catch (e) {
      console.warn("base64ToBlob failure, returning small empty blob", e);
      return new Blob([], { type: "image/jpeg" });
    }
  };

  // Image Selection and convert to base64 preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Strict layout and type validation for file: jpg, jpeg, png
      const fileExt = file.name.split('.').pop()?.toLowerCase() || "";
      const allowedExtensions = ["jpg", "jpeg", "png"];
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];

      if (!allowedMimeTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
        setErrorNotice("Invalid file format. Only JPG, JPEG, and PNG images are allowed.");
        setScreenshotFile(null);
        setScreenshotPreview("");
        if (e.target) e.target.value = "";
        return;
      }

      // Check for size limit of 2MB max
      const maxBytes = 2 * 1024 * 1024; // 2MB
      if (file.size > maxBytes) {
        setErrorNotice(`The chosen image file is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum allowed size is 2MB.`);
        setScreenshotFile(null);
        setScreenshotPreview("");
        if (e.target) e.target.value = "";
        return;
      }

      setErrorNotice("");

      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        try {
          // Compress on-the-fly to max width 800px to ensure tiny sizes (< 100KB)
          const compressedBase64 = await compressImage(rawBase64, 800, 800, 0.75);
          setScreenshotPreview(compressedBase64);
          
          // Convert optimized base64 back to Blob for standard Firebase Storage upload
          const optimizedBlob = base64ToBlob(compressedBase64);
          setScreenshotFile(optimizedBlob as any);
        } catch (err) {
          console.error("Compression flow error, falling back to original file", err);
          setScreenshotFile(file);
          setScreenshotPreview(rawBase64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit checkout order
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorNotice("You must be logged in to compile the enrollment request.");
      return;
    }
    if (!orderName || !orderEmail || !orderTelegram) {
      setErrorNotice("Please fill in all the required identification fields.");
      return;
    }
    if (!screenshotPreview) {
      setErrorNotice("Please upload your UPI payment transaction proof screenshot.");
      return;
    }

    setSubmitting(true);
    setUploadProgress(10);
    setErrorNotice("");

    const pathString = "orders";
    try {
      let downloadURL = "";

      try {
        // 1. Upload screenshot to Firebase Storage using uploadBytesResumable
        if (screenshotFile && screenshotFile.size > 2 * 1024 * 1024) {
          throw new Error("File exceeds 2MB limit.");
        }
        
        const timestamp = Date.now();
        const extension = screenshotPreview.includes("image/png") ? "png" : "jpg";
        const storageRef = ref(storage, `orders/${user.uid}_${timestamp}_screenshot.${extension}`);
        
        setUploadProgress(0);
        
        const uploadTask = uploadBytesResumable(storageRef, screenshotFile as Blob);
        
        await Promise.race([
          new Promise<void>((resolvePromise, rejectPromise) => {
            uploadTask.on(
              "state_changed",
              (snapshot) => {
                const progress = Math.round(
                  (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                );
                setUploadProgress(progress);
              },
              (error) => {
                rejectPromise(error);
              },
              () => {
                resolvePromise();
              }
            );
          }),
          new Promise<void>((_, rejectPromise) => {
            setTimeout(() => {
              try {
                uploadTask.cancel();
              } catch (cancelErr) {
                console.warn("Could not cancel upload task after timeout:", cancelErr);
              }
              rejectPromise(new Error("Firebase Storage upload timed out. Bypassing upload and falling back to ultra-optimized inline image representation."));
            }, 3500);
          })
        ]);
        
        downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setUploadProgress(100);
      } catch (storageError: any) {
        console.warn("Storage upload failed. Falling back to inline base64:", storageError);
        // Ensure error triggers if it exceeded the physical limit
        if (storageError?.message?.includes("exceeds 1024") || storageError?.message?.includes("exceeds 2MB limit") || (screenshotFile && screenshotFile.size > 2 * 1024 * 1024)) {
          setErrorNotice("Upload failed: File exceeds 2MB limit.");
          setSubmitting(false);
          setUploadProgress(null);
          return;
        }
        // Fallback to inline preview if storage isn't accessible or configured
        downloadURL = screenshotPreview;
        setUploadProgress(100);
      }

      if (!downloadURL) {
        throw new Error("Could not retrieve a valid download URL or base64 data for your screenshot.");
      }

      // 2. Save order to Firestore
      const finalPrice = getDiscountedPrice();
      const originalPrice = Number(selectedCourse?.price || 0);
      const discountApplied = originalPrice - finalPrice;

      const orderPayload: any = {
        name: orderName,
        email: user.email || orderEmail,
        telegram: orderTelegram,
        courseId: selectedCourse?.id || "unknown",
        courseName: selectedCourse?.title || "unknown",
        price: finalPrice,
        originalPrice: originalPrice,
        discountApplied: discountApplied,
        couponCode: appliedCoupon ? appliedCoupon.code : "",
        screenshotUrl: downloadURL,
        proofImage: downloadURL,
        status: "Pending",
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, pathString), orderPayload);
      setOrderSuccess(true);
      if (logUserActivity) {
        logUserActivity("Purchase Completed", selectedCourse?.title || "unknown");
      }
      
      // Clear formulation state
      setOrderTelegram("");
      setScreenshotFile(null);
      setScreenshotPreview("");
      setUploadProgress(null);
    } catch (err: any) {
      console.error("Order enrollment failed:", err);
      let errorMsg = err?.message || String(err);
      if (errorMsg.includes("storage/")) {
        setErrorNotice(`Firebase Storage rejected the upload. Please verify files are under 2MB. Details: ${errorMsg}`);
      } else {
        setErrorNotice(`Database rejected enrollment: ${errorMsg}. Please contact digitalcoursesbay@gmail.com.`);
      }
      try {
        handleFirestoreError(err, OperationType.CREATE, pathString);
      } catch (_) {}
    } finally {
      setSubmitting(false);
    }
  };

  const closePurchaseModal = () => {
    setSelectedCourse(null);
    setOrderSuccess(false);
    setErrorNotice("");
    setCouponInput("");
    setAppliedCoupon(null);
    setCouponSuccess(false);
    setCouponError(null);
    navigate('/courses');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-in fade-in duration-300">
      <SEO 
        title={selectedCourse ? selectedCourse.title : "Elite Future Tech Courses Catalog"}
        description={selectedCourse ? selectedCourse.description : "Sign up for our high-impact training curriculum on AI Orchestration, Web3 Systems, and Autonomous Software Agents."}
        image={selectedCourse ? selectedCourse.thumbnail : undefined}
        url={selectedCourse ? `${window.location.origin}/course/${selectedCourse.slug || selectedCourse.id}` : `${window.location.origin}/courses`}
        canonicalUrl={selectedCourse ? `${window.location.origin}/course/${selectedCourse.slug || selectedCourse.id}` : `${window.location.origin}/courses`}
        type={selectedCourse ? "course" : "collection"}
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Courses", item: "/courses" }
        ]}
      />
      
      {/* Dynamic Intro Frame */}
      <div className="text-center space-y-3 relative py-4">
        <span className="text-xs font-mono font-bold tracking-widest text-brand-gold uppercase">
          E-Learning Portal
        </span>
        <h1 className="font-display text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Acquire Future-Ready Credentials
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto text-sm leading-relaxed">
          Search or filter our catalog to select your learning tracks and unlock continuous life-upgrades.
        </p>
      </div>

      {/* FILTER & SEARCH RAIL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center bg-white dark:bg-[#151515] p-4 rounded-2xl border border-neutral-200 dark:border-brand-border">
        
        {/* Search Input field */}
        <div className="relative lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search titles, categories, info..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPageNo(1);
            }}
            className="w-full bg-neutral-100 dark:bg-[#0b0b0b] border border-neutral-200 dark:border-brand-border rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold transition-colors text-neutral-900 dark:text-white"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setCurrentPageNo(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category List Tabs */}
        <div className="lg:col-span-2 overflow-x-auto flex items-center space-x-2 py-1 scrollbar-none">
          <Filter className="w-4 h-4 text-brand-gold shrink-0 hidden sm:block" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPageNo(1);
              }}
              className={`text-xs font-semibold px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-brand-gold text-black shadow-lg shadow-brand-gold/15"
                  : "bg-neutral-100 dark:bg-[#0c0c0c] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-250 dark:hover:bg-[#1f1f1f]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* COURSE DYNAMIC RESOLVING GRID */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : totalCourses === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-brand-border rounded-2xl bg-white dark:bg-[#151515] space-y-4">
          <Search className="w-12 h-12 text-neutral-400 mx-auto" />
          <h3 className="font-display text-lg font-bold text-neutral-600 dark:text-neutral-400">
            No matching courses found
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
            Try adjusting your search criteria or selecting a different category from the filter cluster above.
          </p>
        </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentCoursesSlice.map((course) => (
            <div 
              key={course.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] hover:shadow-2xl hover:border-brand-gold/40 dark:hover:border-brand-gold/30 transition-all transform duration-300 pointer-events-auto"
            >
              {/* Media Container with Link wrapper */}
              <Link to={`/course/${course.slug || course.id}`} className="aspect-video relative bg-neutral-900 overflow-hidden shrink-0 block">
                <img 
                  src={course.thumbnail || null} 
                  alt={`Course image for ${course.title} - ${course.category} educational training blueprint`}
                  width="640"
                  height="360"
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e)=>{
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800";
                  }}
                />
                <div className="absolute top-3 left-3 bg-black/75 text-[9px] font-mono font-bold uppercase tracking-widest text-[#F5B300] px-3 py-1 rounded-full border border-brand-gold/20">
                  {course.category}
                </div>

                {/* Relocated float share to Top Right Corner */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleShareClick(course);
                  }}
                  className="absolute top-3 right-3 p-2 bg-black/75 hover:bg-neutral-900 border border-neutral-850 text-white rounded-full transition-all duration-200 scale-100 hover:scale-110 active:scale-95 z-20"
                  title="Share Course"
                >
                  <Share2 className="w-3.5 h-3.5 text-brand-gold" />
                </button>
              </Link>

              {/* Course Detail Container */}
              <div className="p-6 flex flex-col flex-grow justify-between space-y-6">
                
                <div className="space-y-4">
                  <Link to={`/course/${course.slug || course.id}`} className="block">
                    <h3 className="font-display text-lg font-bold tracking-tight text-neutral-900 dark:text-white leading-snug group-hover:text-brand-gold transition-colors text-left">
                      {course.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans line-clamp-3 text-left">
                    {course.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-900/60 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[9px] text-neutral-400 block font-mono">TUITION PRICE</span>
                    <span className="font-display text-2xl font-bold text-brand-gold">
                      ₹{course.price.toLocaleString("en-IN") || course.price}
                    </span>
                  </div>

                  <div className="flex gap-2 min-w-0">
                    {user && hasPurchasedCourse(user.uid, course.id) ? (
                      <button
                        onClick={() => setCurrentPage("my-enrollments")}
                        className="w-full font-display font-medium text-xs bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-6 rounded-xl transition-all scale-100 active:scale-95 duration-200 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>Start Learning</span>
                      </button>
                    ) : (
                      <Link
                        to={`/course/${course.slug || course.id}`}
                        className="w-full text-center font-display font-bold text-xs bg-black text-white dark:bg-brand-gold dark:text-black hover:bg-[#F5B300]/95 dark:hover:bg-[#F5B300]/90 hover:text-black py-3 px-6 rounded-xl transition-all scale-100 active:scale-95 duration-200 flex items-center justify-center"
                      >
                        View Details
                      </Link>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* COMPREHENSIVE PAGINATION FLIGHT */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-6">
          <button
            onClick={() => handlePageChange(currentPageNo - 1)}
            disabled={currentPageNo === 1}
            className="p-2.5 rounded-lg border border-neutral-200 dark:border-brand-border text-neutral-500 hover:bg-neutral-150 dark:hover:bg-[#181818] disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              onClick={() => handlePageChange(index + 1)}
              className={`w-10 h-10 rounded-lg text-xs font-semibold ${
                currentPageNo === index + 1
                  ? "bg-brand-gold text-black shadow-lg"
                  : "border border-neutral-200 dark:border-brand-border text-neutral-550 dark:text-neutral-400 hover:bg-neutral-150 dark:hover:bg-[#1a1a1a]"
              }`}
            >
              {index + 1}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPageNo + 1)}
            disabled={currentPageNo === totalPages}
            className="p-2.5 rounded-lg border border-neutral-200 dark:border-brand-border text-neutral-500 hover:bg-neutral-150 dark:hover:bg-[#181818] disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dynamic UPI Checkout Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#121212] rounded-3xl border border-neutral-200 dark:border-brand-border p-5 sm:p-6 md:p-8 shadow-2xl animate-in scale-in duration-300 max-h-[90vh] overflow-y-auto">
            
            {/* Background Ornaments */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header section */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-205 dark:border-neutral-900 sticky top-0 z-10 bg-white dark:bg-[#121212]">
              <div>
                <span className="text-[10px] font-mono text-brand-gold font-bold uppercase tracking-wider block">
                  Secure Purchase Portal
                </span>
                <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-white">
                  {selectedCourse.title}
                </h2>
              </div>
              <button 
                onClick={closePurchaseModal}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderSuccess ? (
              // Success checkout module state
              <div className="py-10 text-center space-y-6">
                <div className="w-16 h-16 bg-green-500/15 text-green-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">
                    Order Registered Successfully!
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                    Excellent choice, your order is marked as <b className="text-brand-gold font-mono uppercase">PENDING VERIFICATION</b>. Our administrator team will inspect the UPI payment screenshot shortly.
                  </p>
                </div>
                
                {/* Visual Roadmap next steps */}
                <div className="p-4 rounded-2xl border bg-black/4 w-full max-w-md mx-auto text-left space-y-3 dark:bg-[#181818]/60 border-neutral-200 dark:border-brand-border/40">
                  <span className="text-[10.5px] uppercase tracking-wider text-brand-gold font-mono font-bold block mb-1">
                    What happens next?
                  </span>
                  <div className="flex items-start space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="w-5 h-5 bg-brand-gold/15 text-brand-gold rounded-full flex items-center justify-center font-mono font-bold shrink-0 text-[10px]">1</span>
                    <span>Admin compares name and payment reference logs internally</span>
                  </div>
                  <div className="flex items-start space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="w-5 h-5 bg-brand-gold/15 text-brand-gold rounded-full flex items-center justify-center font-mono font-bold shrink-0 text-[10px]">2</span>
                    <span>Verification email and private Telegram link dispatched within 2 hours</span>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={closePurchaseModal}
                    className="w-full sm:w-auto bg-brand-gold text-black font-display font-semibold hover:bg-[#F5B300]/90 px-6 py-3 rounded-xl transition-all"
                  >
                    Return to Catalog
                  </button>
                </div>
              </div>
            ) : (
              
              // Standard Step-By-Step purchase portal view
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-4">
                
                {/* Col 1: steps and upi detail instruction (md:span-3) */}
                <div className="md:col-span-3 space-y-4">
                  
                  {/* Step list block */}
                  <div className="space-y-3.5">
                    <h3 className="text-xs font-mono font-bold text-brand-gold uppercase tracking-wider">
                      UPI Enrollment Protocol
                    </h3>
                    
                    <div className="space-y-2 text-xs text-neutral-500 dark:text-neutral-300">
                      
                      {/* Step 1 */}
                      <div className="p-4 bg-neutral-50 dark:bg-brand-card/50 border rounded-xl border-neutral-200 dark:border-brand-border space-y-4">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center font-mono font-bold text-[10px]">1</span>
                          <span className="font-bold text-neutral-900 dark:text-white text-xs uppercase tracking-wide">Make UPI Payment</span>
                        </div>
                        
                        {/* QR CODE DISPLAY */}
                        <div className="flex flex-col items-center justify-center py-3 bg-white dark:bg-neutral-950/40 rounded-xl border border-neutral-200 dark:border-brand-border/60 shadow-sm">
                          {globalSettings.upiQrCode ? (
                            <img 
                              src={globalSettings.upiQrCode} 
                              alt="UPI QR Code" 
                              className="w-40 h-40 object-contain rounded-lg border border-neutral-100 dark:border-brand-border/80 mb-2 mt-1"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-40 h-40 flex flex-col items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-400 p-4 text-center mb-2 mt-1 bg-neutral-50/50 dark:bg-neutral-900/40">
                              <QrCode className="w-8 h-8 text-neutral-400 dark:text-neutral-600 mb-1.5" />
                              <span className="text-[9px] uppercase tracking-wider font-mono font-semibold">QR Code Not Set</span>
                            </div>
                          )}
                          <p className="text-[9px] font-mono text-neutral-400 font-semibold uppercase tracking-wider">Scan to Pay Instantly</p>
                        </div>

                        {/* Payment Details Grid */}
                        <div className="space-y-2 text-xs">
                          {/* UPI ID with copy */}
                          <div className="bg-neutral-100/60 dark:bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-200/50 dark:border-brand-border/50 flex items-center justify-between">
                            <div className="min-w-0">
                              <span className="block text-[9px] font-mono font-bold text-neutral-450 uppercase tracking-widest leading-none mb-1">UPI ID</span>
                              <span className="font-mono text-xs text-brand-gold font-bold break-all select-all">{globalSettings.upiId}</span>
                            </div>
                            <button
                              onClick={handleCopyUPI}
                              className="bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-850 dark:hover:bg-neutral-800 p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-all shadow-sm active:scale-95"
                              title="Copy UPI ID"
                            >
                              {copySuccess ? <span className="text-[10px] font-bold text-green-500">Copied!</span> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* Account Name */}
                          <div className="p-2.5 bg-neutral-100/30 dark:bg-neutral-900/20 rounded-lg border border-neutral-200/20 dark:border-brand-border/25 flex flex-col">
                            <span className="text-[9px] font-mono font-bold text-neutral-450 uppercase tracking-widest mb-1">Account Name</span>
                            <span className="font-semibold text-neutral-900 dark:text-white text-xs leading-none">{globalSettings.upiAccountName}</span>
                          </div>

                          {/* Amount */}
                          <div className="p-2.5 bg-neutral-100/30 dark:bg-neutral-900/20 rounded-lg border border-neutral-200/20 dark:border-brand-border/25 flex flex-col">
                            <span className="text-[9px] font-mono font-bold text-neutral-450 uppercase tracking-widest mb-1">Amount to Pay</span>
                            <div className="flex items-center gap-1.5 leading-none mt-0.5">
                              {appliedCoupon ? (
                                <>
                                  <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500 line-through">₹{selectedCourse.price}</span>
                                  <span className="font-mono text-sm text-brand-gold font-bold">₹{getDiscountedPrice()}</span>
                                </>
                              ) : (
                                <span className="font-mono text-sm text-brand-gold font-bold">₹{selectedCourse.price}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="p-3 bg-neutral-50 dark:bg-brand-card/50 border rounded-xl border-neutral-200 dark:border-brand-border flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center font-mono font-bold text-[10px]">2</span>
                          <span className="font-semibold text-neutral-900 dark:text-white">Join Telegram Channel</span>
                        </div>
                        <a
                          href={globalSettings.telegramChannelLink || "https://t.me/LearntoFuture"}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg px-2.5 py-1 flex items-center gap-1 text-[10px] transition-colors"
                        >
                          <TelegramIcon className="w-3 h-3" /> Connect
                        </a>
                      </div>

                      {/* Step 3, 4, 5 */}
                      <div className="p-3 bg-neutral-50 dark:bg-brand-card/50 border rounded-xl border-neutral-200 dark:border-brand-border space-y-1.5">
                        <div className="flex items-start space-x-2">
                          <span className="w-5 h-5 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center font-mono font-bold text-[10px] shrink-0">3</span>
                          <p className="text-neutral-900 dark:text-white font-semibold">Upload Payment Screenshot Proof</p>
                        </div>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 pl-7">
                          Capture your successful UPI payment screen containing transaction hash, amount ₹{getDiscountedPrice()}, and date. Fill checkout info on the right.
                        </p>
                      </div>

                      <div className="p-3 bg-neutral-50 dark:bg-brand-card/50 border rounded-xl border-neutral-200 dark:border-brand-border/40 flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 flex items-center justify-center font-mono text-[10px] shrink-0">4</span>
                        <p className="text-neutral-500 dark:text-neutral-400">Under Review (Instant verification by administration team)</p>
                      </div>

                      <div className="p-3 bg-neutral-50 dark:bg-brand-card/50 border rounded-xl border-neutral-200 dark:border-brand-border/40 flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 flex items-center justify-center font-mono text-[10px] shrink-0">5</span>
                        <p className="text-neutral-500 dark:text-neutral-400">Course dispatched directly to your Telegram & Email inbox</p>
                      </div>

                    </div>
                  </div>

                </div>

                {/* Col 2: check-out form details (md:span-2) */}
                <div className="md:col-span-2 space-y-4">
                  
                  {!user ? (
                    // Prompt Login before checking out
                    <div className="h-full border border-dashed border-neutral-200 dark:border-brand-border rounded-2xl p-6 flex flex-col justify-center items-center text-center space-y-4 bg-brand-card/20 py-12">
                      <CreditCard className="w-10 h-10 text-brand-gold" />
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Authentication Required</h4>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-normal">
                          Please log in with Google to tie current registration certificates to your account.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 w-full">
                        <button
                          onClick={handleGoogleLogin}
                          disabled={loggingIn}
                          className="bg-brand-gold text-black font-display font-semibold text-xs py-2.5 px-4 rounded-xl hover:bg-gold transition-colors w-full disabled:opacity-50"
                        >
                          {loggingIn ? "Connecting Google..." : "Sign In & Progress"}
                        </button>
                      </div>
                      {loginError && (
                        <p className="text-[10px] text-red-500 font-mono leading-normal self-start border border-red-500/10 bg-red-500/5 p-2 rounded-lg w-full text-left">
                          {loginError}
                        </p>
                      )}
                    </div>
                  ) : (
                    
                    // Purchase Form representation
                    <form onSubmit={handleCheckoutSubmit} className="space-y-3.5">
                      <h4 className="text-xs font-mono font-bold text-brand-gold uppercase tracking-wider">
                        Enrollment Details
                      </h4>

                      <div className="space-y-2.5">
                        
                        {/* Name Input */}
                        <div>
                          <label className="block text-[10px] text-neutral-400 uppercase tracking-widest font-mono mb-1">
                            Your Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={orderName}
                            onChange={(e) => setOrderName(e.target.value)}
                            className="w-full bg-neutral-100 dark:bg-[#0b0b0b] border border-neutral-200 dark:border-brand-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-gold text-neutral-900 dark:text-white"
                          />
                        </div>

                        {/* Email Input */}
                        <div>
                          <label className="block text-[10px] text-neutral-400 uppercase tracking-widest font-mono mb-1">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            value={orderEmail}
                            onChange={(e) => setOrderEmail(e.target.value)}
                            className="w-full bg-neutral-100 dark:bg-[#0b0b0b] border border-neutral-200 dark:border-brand-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-gold text-neutral-900 dark:text-white text-opacity-80"
                          />
                        </div>

                        {/* Telegram username */}
                        <div>
                          <label className="block text-[10px] text-neutral-400 uppercase tracking-widest font-mono mb-1">
                            Telegram Username *
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-xs">@</span>
                            <input
                              type="text"
                              required
                              placeholder="username"
                              value={orderTelegram}
                              onChange={(e) => setOrderTelegram(e.target.value)}
                              className="w-full bg-neutral-100 dark:bg-[#0b0b0b] border border-neutral-200 dark:border-brand-border rounded-lg pl-6 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-gold text-neutral-900 dark:text-white"
                            />
                          </div>
                        </div>

                        {/* Promo / Coupon Code Input */}
                        <div>
                          <label className="block text-[10px] text-neutral-450 dark:text-neutral-400 uppercase tracking-widest font-mono mb-1">
                            Discount Coupon Code
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="e.g. WELCOME50"
                              value={couponInput}
                              onChange={(e) => setCouponInput(e.target.value)}
                              disabled={couponSuccess}
                              className="flex-1 bg-neutral-100 dark:bg-[#0b0b0b] border border-neutral-200 dark:border-brand-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-gold text-neutral-900 dark:text-white uppercase font-mono disabled:opacity-75"
                            />
                            {couponSuccess ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setCouponSuccess(false);
                                  setAppliedCoupon(null);
                                  setCouponInput("");
                                }}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0"
                              >
                                Remove
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={handleApplyCoupon}
                                disabled={couponLoading || !couponInput.trim()}
                                className="bg-neutral-950 text-white dark:bg-white dark:text-black hover:bg-neutral-850 dark:hover:bg-neutral-100 disabled:opacity-45 text-[10px] font-display font-bold px-4 py-1.5 rounded-lg transition-all shrink-0 flex items-center justify-center"
                              >
                                {couponLoading ? (
                                  <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  "Apply"
                                )}
                              </button>
                            )}
                          </div>
                          {couponError && (
                            <p className="text-[10px] text-red-500 mt-1 pl-1">{couponError}</p>
                          )}
                          {couponSuccess && appliedCoupon && (
                            <p className="text-[10px] text-green-500 mt-1 pl-1 font-semibold flex items-center gap-1">
                              ✓ Coupon "{appliedCoupon.code}" Applied: 
                              {appliedCoupon.type === "percentage" ? (
                                <span>{appliedCoupon.value}% Instant Off</span>
                              ) : (
                                <span>Flat ₹{appliedCoupon.value} Reduction</span>
                              )}
                            </p>
                          )}
                        </div>

                        {/* Screenshot upload zone */}
                        <div>
                          <label className="block text-[10px] text-neutral-400 uppercase tracking-widest font-mono mb-1">
                            UPI Transaction Screenshot *
                          </label>
                          
                          {screenshotPreview ? (
                            <div className="relative border border-brand-border bg-neutral-900 rounded-xl max-h-32 overflow-hidden flex items-center justify-center p-1.5 group select-none">
                              <img 
                                src={screenshotPreview} 
                                alt="transaction-proof" 
                                className="max-h-28 max-w-full rounded object-contain"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setScreenshotFile(null);
                                  setScreenshotPreview("");
                                }}
                                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="border border-dashed border-neutral-250 dark:border-brand-border rounded-xl p-4 text-center cursor-pointer hover:border-brand-gold/60 transition-colors bg-neutral-50 dark:bg-brand-card/40 relative">
                              <input
                                type="file"
                                accept="image/*"
                                required
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <Upload className="w-6 h-6 text-neutral-500 dark:text-neutral-400 mx-auto mb-1.5" />
                              <p className="text-[10px] text-neutral-450 dark:text-neutral-400 font-semibold leading-normal">
                                Click or drag screen file here to upload
                              </p>
                              <p className="text-[8px] text-neutral-400 dark:text-neutral-500 mt-1 uppercase font-mono">
                                PNG or JPEG (Max 2MB)
                              </p>
                            </div>
                          )}
                        </div>

                        {uploadProgress !== null && uploadProgress > 0 && uploadProgress <= 100 && (
                          <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div 
                              className="bg-brand-gold h-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        )}

                        {/* Price Summary Receipt Breakdown */}
                        {appliedCoupon && selectedCourse && (
                          <div className="p-3 bg-neutral-50 dark:bg-[#070707] border border-neutral-200 dark:border-brand-border/60 rounded-xl space-y-1.5 text-[11px] font-sans">
                            <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                              <span>Standard Tuition Fee:</span>
                              <span className="font-mono">₹{selectedCourse.price}</span>
                            </div>
                            <div className="flex justify-between text-green-500 font-semibold">
                              <span>Promo "{appliedCoupon.code}" Discount:</span>
                              <span className="font-mono">-₹{getDiscountValue()}</span>
                            </div>
                            <div className="border-t border-neutral-200 dark:border-neutral-800 my-1 pt-1.5 flex justify-between font-bold text-neutral-900 dark:text-white">
                              <span>UPI Amount for Scan & Pay:</span>
                              <span className="font-mono text-brand-gold text-xs">₹{getDiscountedPrice()}</span>
                            </div>
                          </div>
                        )}

                        {errorNotice && (
                          <div className="p-2.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-sans">
                            {errorNotice}
                          </div>
                        )}

                        <div className="flex gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleShareClick(selectedCourse)}
                            className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-850 text-neutral-900 dark:text-white px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all flex items-center justify-center gap-1.5 font-display font-semibold transition-all scale-100 active:scale-95 duration-200 text-xs shrink-0"
                            title="Share Course"
                          >
                            <Share2 className="w-4 h-4 text-brand-gold shrink-0" />
                            <span>Share</span>
                          </button>

                          <button
                            type="submit"
                            disabled={submitting}
                            className="flex-grow bg-brand-gold text-black hover:bg-[#F5B300]/90 disabled:opacity-45 h-11 rounded-xl text-xs font-display font-bold transition-all shadow-xl shadow-brand-gold/10 flex items-center justify-center space-x-2"
                          >
                            {submitting ? (
                              <>
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                <span>
                                  {uploadProgress !== null && uploadProgress < 100
                                    ? `Uploading Proof: ${uploadProgress}%`
                                    : "Finalizing Enrollment..."}
                                </span>
                              </>
                            ) : (
                              <>
                                <span>Finish Enrollment Registration</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>

                      </div>
                    </form>
                  )}

                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* Modern Share Course Modal */}
      {shareModalOpen && courseToShare && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-[#121212] rounded-3xl border border-neutral-200 dark:border-brand-border p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Header section */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-900 mb-6">
              <div>
                <span className="text-[10px] font-mono text-brand-gold font-bold uppercase tracking-wider block">
                  Viral Referral Engine
                </span>
                <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">
                  Share Course
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShareModalOpen(false);
                  setCourseToShare(null);
                }}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Course mini info card */}
            <div className="flex gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-brand-border/40 mb-6">
              <img 
                src={courseToShare.thumbnail || null} 
                alt={`Mini thumbnail for sharing the course: ${courseToShare.title}`}
                width="64"
                height="48"
                loading="lazy"
                className="w-16 h-12 object-cover rounded-lg border border-neutral-200/30 dark:border-brand-border/20 shrink-0"
              />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                  {courseToShare.title}
                </h4>
                <p className="text-[10px] text-brand-gold font-mono font-bold mt-0.5">
                  ₹{courseToShare.price.toLocaleString("en-IN") || courseToShare.price}
                </p>
                <span className="inline-block text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-850 text-neutral-500 dark:text-neutral-400 mt-1">
                  {courseToShare.category}
                </span>
              </div>
            </div>

            {/* Auto Generated Share Message Preview */}
            <div className="mb-6 space-y-1.5">
              <span className="block text-[10px] text-neutral-400 uppercase tracking-widest font-mono">
                Generated Share Preview
              </span>
              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-950 font-mono text-[9.5px] leading-relaxed text-neutral-600 dark:text-neutral-400 border border-neutral-200/50 dark:border-white/5 max-h-24 overflow-y-auto whitespace-pre-wrap select-all">
                🚀 Check out this amazing course:&#10;&#10;{courseToShare.title}&#10;&#10;💰 Price: ₹{courseToShare.price.toLocaleString("en-IN") || courseToShare.price}&#10;📚 Category: {courseToShare.category}&#10;&#10;🎯 Learn valuable skills and upgrade yourself!&#10;&#10;🔗 Link: {`${window.location.origin}/course/${courseToShare.slug || courseToShare.id}${user?.uid ? `?ref=${user.uid}` : ""}`}
              </div>
            </div>

            {/* Multi-Channel Referral options */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              
              {/* WhatsApp */}
              <button
                onClick={() => {
                  const slug = courseToShare.slug || courseToShare.id;
                  const refSuffix = user?.uid ? `?ref=${user.uid}` : "";
                  const shareUrl = `${window.location.origin}/course/${slug}${refSuffix}`;
                  const text = `🚀 Check out this amazing course: ${courseToShare.title} - ${shareUrl}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
                  logShareToFirestore(courseToShare, "whatsapp", shareUrl);
                  showToast("WhatsApp opened successfully!", "success");
                }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-500 font-display font-semibold text-xs transition-all duration-200 text-left active:scale-95"
              >
                <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0">W</div>
                <span>WhatsApp</span>
              </button>

              {/* Telegram */}
              <button
                onClick={() => {
                  const slug = courseToShare.slug || courseToShare.id;
                  const refSuffix = user?.uid ? `?ref=${user.uid}` : "";
                  const shareUrl = `${window.location.origin}/course/${slug}${refSuffix}`;
                  const text = `🚀 Check out this amazing course: ${courseToShare.title}`;
                  window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, "_blank");
                  logShareToFirestore(courseToShare, "telegram", shareUrl);
                  showToast("Telegram opened successfully!", "success");
                }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/20 hover:border-sky-500/40 text-sky-500 font-display font-semibold text-xs transition-all duration-200 text-left active:scale-95"
              >
                <div className="w-6 h-6 bg-sky-500 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0">T</div>
                <span>Telegram</span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => {
                  const slug = courseToShare.slug || courseToShare.id;
                  const refSuffix = user?.uid ? `?ref=${user.uid}` : "";
                  const shareUrl = `${window.location.origin}/course/${slug}${refSuffix}`;
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
                  logShareToFirestore(courseToShare, "facebook", shareUrl);
                  showToast("Facebook opened successfully!", "success");
                }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-blue-600/10 hover:bg-blue-600/15 border border-blue-600/20 hover:border-blue-600/40 text-blue-600 dark:text-blue-450 font-display font-semibold text-xs transition-all duration-200 text-left active:scale-95"
              >
                <div className="w-6 h-6 bg-blue-650 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0">F</div>
                <span>Facebook</span>
              </button>

              {/* X / Twitter */}
              <button
                onClick={() => {
                  const slug = courseToShare.slug || courseToShare.id;
                  const refSuffix = user?.uid ? `?ref=${user.uid}` : "";
                  const shareUrl = `${window.location.origin}/course/${slug}${refSuffix}`;
                  const text = `🚀 Check out this amazing course: ${courseToShare.title} @LearnToFuture`;
                  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, "_blank");
                  logShareToFirestore(courseToShare, "twitter", shareUrl);
                  showToast("Twitter / X opened successfully!", "success");
                }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-neutral-950/10 hover:bg-neutral-950/15 border border-neutral-950/20 hover:border-neutral-950/40 text-neutral-800 dark:text-neutral-200 font-display font-semibold text-xs transition-all duration-200 text-left active:scale-95"
              >
                <div className="w-6 h-6 bg-neutral-950 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0">X</div>
                <span>Twitter</span>
              </button>

              {/* LinkedIn */}
              <button
                onClick={() => {
                  const slug = courseToShare.slug || courseToShare.id;
                  const refSuffix = user?.uid ? `?ref=${user.uid}` : "";
                  const shareUrl = `${window.location.origin}/course/${slug}${refSuffix}`;
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank");
                  logShareToFirestore(courseToShare, "linkedin", shareUrl);
                  showToast("LinkedIn opened successfully!", "success");
                }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-sky-700/10 hover:bg-sky-700/15 border border-sky-700/20 hover:border-sky-700/40 text-sky-700 font-display font-semibold text-xs transition-all duration-200 text-left active:scale-95 col-span-2 md:col-span-1"
              >
                <div className="w-6 h-6 bg-sky-700 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0">in</div>
                <span>LinkedIn</span>
              </button>

              {/* Copy Link */}
              <button
                onClick={() => {
                  const slug = courseToShare.slug || courseToShare.id;
                  const refSuffix = user?.uid ? `?ref=${user.uid}` : "";
                  const shareUrl = `${window.location.origin}/course/${slug}${refSuffix}`;
                  navigator.clipboard.writeText(shareUrl);
                  logShareToFirestore(courseToShare, "copy", shareUrl);
                  showToast("Course link copied successfully!", "success");
                }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-brand-gold/10 hover:bg-brand-gold/15 border border-brand-gold/20 hover:border-brand-gold/40 text-brand-gold font-display font-semibold text-xs transition-all duration-200 text-left active:scale-95 col-span-2 md:col-span-1"
              >
                <div className="w-6 h-6 bg-brand-gold text-black rounded-full flex items-center justify-center font-bold text-xs shrink-0">🔗</div>
                <span>Copy Link</span>
              </button>

            </div>

            {/* Referrer virality support alert */}
            <div className="p-3 rounded-xl bg-brand-gold/5 border border-brand-gold/10 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="block text-[10.5px] font-bold text-brand-gold font-display">Referral System Enabled</span>
                <p className="text-[9.5px] text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
                  Sharing this URL embeds your personal referral signature. Clicks, engagements, and acquisitions are auto-tracked so you earn visual credit on the leaderboard.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
