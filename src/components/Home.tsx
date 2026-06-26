import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { 
  ArrowRight, 
  Send as TelegramIcon, 
  Cpu, 
  Video, 
  TrendingUp, 
  Youtube, 
  Briefcase, 
  LineChart, 
  Sparkles, 
  BookOpen, 
  DollarSign, 
  ShieldCheck, 
  Headphones, 
  CheckCircle,
  ExternalLink,
  Star,
  Plus,
  X,
  ShieldAlert
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { collection, getDocs, getDoc, limit, query, orderBy, addDoc, serverTimestamp, where, doc, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Course, Review } from "../types";

export const Home: React.FC = () => {
  const { 
    setCurrentPage, 
    user, 
    globalSettings, 
    dbUser, 
    isAdmin,
    isSetupComplete,
    setAuthModalOpen,
    setAuthModalMessage,
    hasPurchasedCourse
  } = useApp();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Home Orbit CMS States
  const [hpSettings, setHpSettings] = useState<any>(null);
  const [orbitItems, setOrbitItems] = useState<any[]>([]);
  const [hoveredOrbitItem, setHoveredOrbitItem] = useState<any>(null);

  // Web V3: Magnetic cursor tracker
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);

  // ── FIXED: One-time getDocs with cache instead of persistent onSnapshot listeners ──
  useEffect(() => {
    let cancelled = false;
    const HP_CACHE_KEY = "hp_settings_cache";
    const ORBIT_CACHE_KEY = "orbit_items_cache";
    const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

    async function fetchHomeData() {
      const now = Date.now();

      // Load from cache first for instant render
      try {
        const hpStored = localStorage.getItem(HP_CACHE_KEY);
        if (hpStored) {
          const { ts, data } = JSON.parse(hpStored);
          if (now - ts < CACHE_TTL && !cancelled) setHpSettings(data);
        }
        const orbitStored = localStorage.getItem(ORBIT_CACHE_KEY);
        if (orbitStored) {
          const { ts, data } = JSON.parse(orbitStored);
          if (now - ts < CACHE_TTL && !cancelled) setOrbitItems(data);
          if (now - ts < CACHE_TTL) return; // Cache fresh, skip Firestore
        }
      } catch (_) {}

      // Fetch from Firestore
      try {
        const [hpSnap, orbitSnap] = await Promise.all([
          getDoc(doc(db, "settings", "homepageSettings")),
          getDocs(collection(db, "heroOrbitItems")),
        ]);

        if (cancelled) return;

        if (hpSnap.exists()) {
          const data = hpSnap.data();
          setHpSettings(data);
          localStorage.setItem(HP_CACHE_KEY, JSON.stringify({ ts: now, data }));
        } else {
          setHpSettings(null);
        }

        const items: any[] = [];
        orbitSnap.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.enabled !== false) items.push({ id: docSnap.id, ...d });
        });
        items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setOrbitItems(items);
        localStorage.setItem(ORBIT_CACHE_KEY, JSON.stringify({ ts: now, data: items }));
      } catch (err) {
        console.warn("[Home] Failed to fetch homepage data:", err);
      }
    }

    fetchHomeData();
    return () => { cancelled = true; };
  }, []);

  // Sync cursor followers dynamically
  useEffect(() => {
    if (hpSettings?.customCursorEnabled) {
      const handleMouseMove = (e: MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
        setCursorVisible(true);
      };
      const handleMouseLeave = () => {
        setCursorVisible(false);
      };
      window.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseleave", handleMouseLeave);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, [hpSettings?.customCursorEnabled]);

  // Orbit rotation duration resolver
  const getOrbitSpeed = (ringIndex: number) => {
    const speedPreset = hpSettings?.orbitSpeed || "Normal";
    let baseSpeed = 40;
    if (speedPreset === "Slow") baseSpeed = 60;
    else if (speedPreset === "Fast") baseSpeed = 20;
    else if (speedPreset === "Custom") baseSpeed = hpSettings?.customOrbitSpeed || 30;

    // Outer ring spins slower, inner spins faster
    if (ringIndex === 1) return baseSpeed * 0.8;
    if (ringIndex === 2) return baseSpeed;
    return baseSpeed * 1.3;
  };

  // Image source path resolver
  const resolveOrbitItemImage = (item: any) => {
    if (item.imageSourceType === "course" && item.courseId) {
      const matched = courses.find((c) => c.id === item.courseId);
      if (matched?.thumbnail) return matched.thumbnail;
    }
    if (item.imageSourceType === "external" && item.externalImageUrl) {
      return item.externalImageUrl;
    }
    if (item.imageSourceType === "upload" && item.uploadedImageUrl) {
      return item.uploadedImageUrl;
    }
    if (item.image) return item.image;
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150";
  };

  // Click handler 
  const handleOrbitItemClick = (item: any) => {
    const actionType = item.clickActionType || "course";
    const targetSlug = item.targetSlug;

    if (!targetSlug || actionType === "none") {
      return;
    }

    if (actionType === "external") {
      if (targetSlug.startsWith("http://") || targetSlug.startsWith("https://")) {
        window.open(targetSlug, "_blank");
      } else {
        window.open("https://" + targetSlug, "_blank");
      }
    } else if (actionType === "course") {
      setCurrentPage("course-details", targetSlug);
    } else if (actionType === "blog") {
      setCurrentPage("blog-details", targetSlug);
    } else {
      setCurrentPage("courses");
    }
  };

  // Companion Renderer for Orbit Rings
  const renderOrbitRing = (items: any[], ringNo: number, isClockwise: boolean) => {
    const radiusClass = ringNo === 1 
      ? "[--ring-radius:58px] sm:[--ring-radius:66px] md:[--ring-radius:90px]" 
      : ringNo === 2 
        ? "[--ring-radius:100px] sm:[--ring-radius:115px] md:[--ring-radius:160px]" 
        : "[--ring-radius:144px] sm:[--ring-radius:164px] md:[--ring-radius:230px]";

    const speed = getOrbitSpeed(ringNo);
    const playState = (hpSettings?.enableAutoRotation !== false && hpSettings?.enableOrbitAnimation !== false) 
      ? "running" 
      : "paused";

    return (
      <div 
        className={`absolute inset-0 rounded-full border border-dashed border-neutral-200/50 dark:border-brand-border/15 flex items-center justify-center pointer-events-none ${radiusClass}`}
      >
        <div 
          className="absolute inset-0 select-none pointer-events-none"
          style={{
            animation: isClockwise 
              ? `orbit-spin-clk ${speed}s linear infinite` 
              : `orbit-spin-cclk ${speed}s linear infinite`,
            animationPlayState: playState
          }}
        >
          {items.map((item, i) => {
            const angle = (360 / items.length) * i;
            const imgUrl = resolveOrbitItemImage(item);
            
            return (
              <div 
                key={item.id ? `${item.id}-${i}` : i}
                onClick={() => handleOrbitItemClick(item)}
                onMouseEnter={() => {
                  if (hpSettings?.enableHoverEffects !== false) {
                    setHoveredOrbitItem(item);
                  }
                }}
                onMouseLeave={() => setHoveredOrbitItem(null)}
                className="absolute w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-full cursor-pointer pointer-events-auto bg-white dark:bg-[#121212] border border-neutral-250 dark:border-brand-border/60 p-0.5 flex items-center justify-center transition-all duration-300 hover:scale-125 hover:border-brand-gold select-none overflow-hidden shadow-md"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translate(var(--ring-radius)) rotate(-${angle}deg)`
                }}
              >
                <div 
                  className="w-full h-full rounded-full overflow-hidden"
                  style={{
                    animation: isClockwise 
                      ? `orbit-spin-cclk ${speed}s linear infinite` 
                      : `orbit-spin-clk ${speed}s linear infinite`,
                    animationPlayState: playState
                  }}
                >
                  <img src={imgUrl} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover select-none pointer-events-none" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Disclaimer Modal state & background scroll handling
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean>(() => {
    try {
      return localStorage.getItem("learn2future_disclaimer_accepted") === "true";
    } catch (_) {
      return false;
    }
  });

  const handleAcceptDisclaimer = () => {
    try {
      localStorage.setItem("learn2future_disclaimer_accepted", "true");
    } catch (_) {}
    setDisclaimerAccepted(true);
  };

  useEffect(() => {
    if (!disclaimerAccepted) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [disclaimerAccepted]);

  // Reviews and Submissions State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [fetchingReviews, setFetchingReviews] = useState(true);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewCourse, setReviewCourse] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [localToast, setLocalToast] = useState<string | null>(null);
  const [latestBlogs, setLatestBlogs] = useState<any[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  // Verification & Eligibility Check Parameters
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  const showLocalToast = (msg: string) => {
    setLocalToast(msg);
    setTimeout(() => setLocalToast(null), 4000);
  };

  useEffect(() => {
    if (user && !reviewName) {
      setReviewName(user.displayName || "");
    }
  }, [user]);

  // Fallback items to show if database is empty on initial boot
  const defaultFeatured: Course[] = [
    {
      id: "demo1",
      title: "Self-Operative AI Mastery Blueprint",
      category: "AI Tools",
      price: 1999,
      description: "Learn how to prompt, configure, and stack autonomous agents with LLMs to automate 80% of your business processes and freelance workflow.",
      thumbnail: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800",
      createdAt: new Date()
    },
    {
      id: "demo2",
      title: "Cinema-Grade Premiere Pro & After Effects Suite",
      category: "Video Editing",
      price: 2499,
      description: "A comprehensive deep-dive into digital storytelling, dynamic pacing, keyframing, motion typography, and commercial visual effects editing.",
      thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=800",
      createdAt: new Date()
    },
    {
      id: "demo3",
      title: "YouTube Automation & Retention Masterclass",
      category: "YouTube Growth",
      price: 1499,
      description: "Step-by-step framework to discover highly profitable niches, generate viral scripts, double click-through rates, and engineer retention above 65%.",
      thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=800",
      createdAt: new Date()
    }
  ];

  // Default fallback reviews matching Review schema
  const defaultReviews: Review[] = [
    {
      id: "review_1",
      reviewId: "fallback_1",
      userId: "demo_user_1",
      userEmail: "student1@gmail.com",
      userName: "Arjun Sharma",
      userPhoto: "https://api.dicebear.com/7.x/initials/svg?seed=Arjun",
      courseId: "demo1",
      courseName: "Self-Operative AI Mastery Blueprint",
      category: "AI Tools",
      rating: 5,
      reviewText: "The autonomous agent syllabus is pure gold. I set up three multi-agent chains that now handle 80% of our daily content discovery and drafting. The payback period was literally hours.",
      verifiedPurchase: true,
      orderId: "order_1",
      createdAt: new Date("2026-05-15"),
      updatedAt: new Date("2026-05-15"),
      status: "Approved"
    },
    {
      id: "review_2",
      reviewId: "fallback_2",
      userId: "demo_user_2",
      userEmail: "student2@gmail.com",
      userName: "Elena Rostova",
      userPhoto: "https://api.dicebear.com/7.x/initials/svg?seed=Elena",
      courseId: "demo2",
      courseName: "Cinema-Grade Premiere Pro & After Effects Suite",
      category: "Video Editing",
      rating: 5,
      reviewText: "I've been editing for 5 years, but the After Effects sound pacing and color keys here gave me a massive edge. My standard retention numbers on client reels shot up immediately.",
      verifiedPurchase: true,
      orderId: "order_2",
      createdAt: new Date("2026-05-20"),
      updatedAt: new Date("2026-05-20"),
      status: "Approved"
    },
    {
      id: "review_3",
      reviewId: "fallback_3",
      userId: "demo_user_3",
      userEmail: "student3@gmail.com",
      userName: "Siddharth Verma",
      userPhoto: "https://api.dicebear.com/7.x/initials/svg?seed=Siddharth",
      courseId: "demo3",
      courseName: "YouTube Automation & Retention Masterclass",
      category: "YouTube Growth",
      rating: 5,
      reviewText: "Excellent blueprint on high-retention scripting. Bypasses the usual filler and gives direct, tactical templates on hooking attention within the first 3 seconds. Highly recommended!",
      verifiedPurchase: true,
      orderId: "order_3",
      createdAt: new Date("2026-05-28"),
      updatedAt: new Date("2026-05-28"),
      status: "Approved"
    }
  ];

  // Fetch Featured Courses
  useEffect(() => {
    const fetchFeaturedCourses = async () => {
      setLoading(true);
      const collectionName = "courses";
      try {
        const q = query(collection(db, collectionName), orderBy("createdAt", "desc"), limit(3));
        const querySnapshot = await getDocs(q);
        const docsList: Course[] = [];
        querySnapshot.forEach((docSnap) => {
          docsList.push({ id: docSnap.id, ...docSnap.data() } as Course);
        });
        
        if (docsList.length > 0) {
          setCourses(docsList);
        } else {
          setCourses(defaultFeatured); // Use high-fidelity default mockups to prevent empty states
        }
      } catch (error) {
        console.warn("Could not query live courses (safe fallback loaded):", error);
        setCourses(defaultFeatured);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCourses();
  }, []);

  // ── FIXED: One-time getDocs with 15-min cache instead of persistent onSnapshot ──
  useEffect(() => {
    let cancelled = false;
    const REVIEWS_CACHE_KEY = "approved_reviews_cache";
    const CACHE_TTL = 15 * 60 * 1000;

    async function fetchReviews() {
      setFetchingReviews(true);

      // Serve from localStorage cache first
      try {
        const stored = localStorage.getItem(REVIEWS_CACHE_KEY);
        if (stored) {
          const { ts, data } = JSON.parse(stored);
          if (Date.now() - ts < CACHE_TTL) {
            if (!cancelled) {
              setReviews(data.length > 0 ? data : defaultReviews);
              setFetchingReviews(false);
            }
            return;
          }
        }
      } catch (_) {}

      try {
        const q = query(collection(db, "reviews"), where("status", "==", "Approved"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        if (cancelled) return;
        const docsList: Review[] = [];
        snapshot.forEach((docSnap) => docsList.push({ id: docSnap.id, ...docSnap.data() } as Review));
        const result = docsList.length > 0 ? docsList : defaultReviews;
        setReviews(result);
        localStorage.setItem(REVIEWS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: docsList }));
      } catch (error) {
        if (!cancelled) {
          console.warn("[Home] Reviews fetch failed (safe fallback loaded):", error);
          setReviews(defaultReviews);
        }
      } finally {
        if (!cancelled) setFetchingReviews(false);
      }
    }

    fetchReviews();
    return () => { cancelled = true; };
  }, []);

  // Fetch logged-in user's eligibility criteria (their orders and written reviews)
  useEffect(() => {
    if (!user) {
      setUserOrders([]);
      setUserReviews([]);
      return;
    }

    const fetchEligibility = async () => {
      setCheckingEligibility(true);
      try {
        // Fetch current user's orders
        const ordersQ = query(collection(db, "orders"), where("email", "==", user.email));
        const ordersSnap = await getDocs(ordersQ);
        const oList: any[] = [];
        ordersSnap.forEach((docSnap) => {
          oList.push({ id: docSnap.id, ...docSnap.data() });
        });
        setUserOrders(oList);

        // Fetch current user's written reviews
        const reviewsQ = query(collection(db, "reviews"), where("userId", "==", user.uid));
        const reviewsSnap = await getDocs(reviewsQ);
        const rList: Review[] = [];
        reviewsSnap.forEach((docSnap) => {
          rList.push({ id: docSnap.id, ...docSnap.data() } as Review);
        });
        setUserReviews(rList);
      } catch (err) {
        console.warn("Eligibility details fetch failure:", err);
      } finally {
        setCheckingEligibility(false);
      }
    };

    fetchEligibility();
  }, [user]);

  // Derive verified purchased categories list
  const verifiedPurchasedCategories = React.useMemo(() => {
    if (!user) return [];
    
    // Admin or specific owner user email should see ALL system categories
    if (isAdmin || (user.email && user.email.toLowerCase() === "digitalcoursesbay@gmail.com")) {
      const allCourseCats = Array.from(new Set([
        ...courses.map(c => c.category).filter(Boolean),
        "AI Tools", "Video Editing", "YouTube Growth", "Web Development", "Design"
      ]));
      return allCourseCats;
    }

    // An order is delivered/completed if status matches "delivered" or "completed" case-insensitively
    const validOrders = userOrders.filter(o => {
      const statusStr = (o.status || "").toLowerCase();
      const emailMatch = (o.email || "").toLowerCase() === (user.email || "").toLowerCase() || o.userId === user.uid;
      return emailMatch && (statusStr === "delivered" || statusStr === "completed" || statusStr === "verified");
    });

    const cats = validOrders.map(order => {
      // Find course in courses state to retrieve category
      const courseMatch = courses.find(c => c.id === order.courseId || c.title === order.courseName);
      if (courseMatch) return courseMatch.category;
      
      // Fallback
      if (order.courseId === "demo1" || order.courseName?.includes("AI Mastery")) return "AI Tools";
      if (order.courseId === "demo2" || order.courseName?.includes("Cinema-Grade")) return "Video Editing";
      if (order.courseId === "demo3" || order.courseName?.includes("YouTube Automation")) return "YouTube Growth";
      return null;
    }).filter((c): c is string => !!c);

    return Array.from(new Set(cats));
  }, [user, userOrders, courses, isAdmin]);

  // Synchronize category selection when opening the modal
  useEffect(() => {
    if (reviewFormOpen) {
      if (verifiedPurchasedCategories.length > 0) {
        setSelectedCategory(verifiedPurchasedCategories[0]);
      } else {
        setSelectedCategory("");
      }
    }
  }, [reviewFormOpen, verifiedPurchasedCategories]);

  // Find if current user has already reviewed the selected category
  const existingReviewForCategory = React.useMemo(() => {
    if (!selectedCategory) return null;
    return userReviews.find(r => r.category === selectedCategory) || null;
  }, [selectedCategory, userReviews]);

  // Pre-populate when existingReviewForCategory changes
  useEffect(() => {
    if (existingReviewForCategory) {
      setReviewRating(existingReviewForCategory.rating);
      setReviewComment(existingReviewForCategory.reviewText);
    } else {
      setReviewRating(5);
      setReviewComment("");
    }
  }, [existingReviewForCategory]);

  // Fetch Latest Blog Posts for Homepage Carousel / list
  useEffect(() => {
    const fetchLatestBlogs = async () => {
      setLoadingBlogs(true);
      const fallbackList = [
        {
          id: "bootstrap-5",
          title: "Why Learn2Future Exists: The Mission Behind Affordable Skill Education",
          slug: "why-learn2future-exists-affordable-skill-education",
          category: "About Us",
          featuredImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600&auto=format&fit=crop",
          metaDescription: "Understand why Learn2Future exists. Discover how we're breaking the high cost barrier of digital upskilling and empowering Indian students & freelancers.",
          author: "Learn2Future Team",
          publishDate: "2026-06-25"
        },
        {
          id: "bootstrap-4",
          title: "What Is Learn2Future? The Mission Behind Affordable Skill Education in India",
          slug: "what-is-learn2future-affordable-skill-education-india",
          category: "Career Skills",
          featuredImage: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600&auto=format&fit=crop",
          metaDescription: "Learn2Future is India's affordable skill education platform. Discover its mission, courses, and why it's helping students and freelancers grow their careers.",
          author: "Learn2Future Team",
          publishDate: "2026-06-25"
        },
        {
          id: "bootstrap-1",
          title: "The Agentic Era: How Autonomous AI Co-Pilots Are Redefining Engineering",
          slug: "agentic-era-ai-copilots",
          category: "AI & Future Tech",
          featuredImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600&auto=format&fit=crop",
          metaDescription: "Dive into how autonomous agent workflows and co-pilots are changing software design and engineering methodologies.",
          author: "Dr. Elena Rostova",
          publishDate: "2026-06-10"
        },
        {
          id: "bootstrap-2",
          title: "TypeScript 5.8 and Beyond: Mastering Type Stripping and Native ESM Execution",
          slug: "typescript-native-esm-type-stripping",
          category: "Career Skills",
          featuredImage: "https://images.unsplash.com/photo-1516116211223-5c359a36298a?q=80&w=600&auto=format&fit=crop",
          metaDescription: "Learn how the latest TS updates enable compilation-free Node runtime execution and perfect native ES Modules structure.",
          author: "Siddharth Mehta",
          publishDate: "2026-06-08"
        },
        {
          id: "bootstrap-3",
          title: "Quantum Computing Algorithms Explained: Grover’s and Shor’s Algorithms Simply",
          slug: "quantum-computing-algorithms-grover-shor",
          category: "AI & Future Tech",
          featuredImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop",
          metaDescription: "A plain-English deep dive into quantum algorithms, state superposition, entanglement, and real-world cryptanalysis risks.",
          author: "Prof. Arthur Pendelton",
          publishDate: "2026-06-04"
        }
      ];

      try {
        const blogsCol = collection(db, "blogs");
        const q = query(blogsCol, orderBy("publishDate", "desc"), limit(3));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const list: any[] = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              title: data.title || "",
              slug: data.slug || "",
              category: data.category || "",
              featuredImage: data.featuredImage || "",
              metaDescription: data.metaDescription || "",
              author: data.author || "",
              publishDate: data.publishDate || ""
            };
          });
          
          const firestoreSlugs = new Set(list.map(b => b.slug));
          const uniqueFallback = fallbackList.filter(b => !firestoreSlugs.has(b.slug));
          const merged = [...list, ...uniqueFallback].sort((a, b) => {
            return (b.publishDate || "").localeCompare(a.publishDate || "");
          });
          
          setLatestBlogs(merged.slice(0, 3));
        } else {
          setLatestBlogs(fallbackList.slice(0, 3));
        }
      } catch (err: any) {
        console.warn("Could not load database blog posts inside homepage:", err);
        setLatestBlogs(fallbackList);
        handleFirestoreError(err, OperationType.GET, "blogs");
      } finally {
        setLoadingBlogs(false);
      }
    };

    fetchLatestBlogs();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showLocalToast("Please login to submit a review.");
      return;
    }
    if (verifiedPurchasedCategories.length === 0) {
      showLocalToast("Only verified students can submit reviews.");
      return;
    }
    if (!selectedCategory) {
      showLocalToast("Please select a course category.");
      return;
    }
    if (!reviewComment.trim()) {
      showLocalToast("Please fill in your feedback comment.");
      return;
    }
    if (reviewComment.trim().length < 10) {
      showLocalToast("Review comments must be at least 10 characters long.");
      return;
    }

    setSubmittingReview(true);
    try {
      // Find matching order
      const matchingOrder = userOrders.find(o => {
        const orderStatus = (o.status || "").toLowerCase();
        const validStatus = (orderStatus === "delivered" || orderStatus === "completed" || orderStatus === "verified");
        
        // Find course under order to match category
        const courseMatch = courses.find(c => c.id === o.courseId || c.title === o.courseName);
        const catMatch = courseMatch?.category === selectedCategory || 
          (selectedCategory === "AI Tools" && (o.courseId === "demo1" || o.courseName?.includes("AI Mastery"))) ||
          (selectedCategory === "Video Editing" && (o.courseId === "demo2" || o.courseName?.includes("Cinema-Grade"))) ||
          (selectedCategory === "YouTube Growth" && (o.courseId === "demo3" || o.courseName?.includes("YouTube Automation")));
        
        return validStatus && catMatch;
      });

      const docId = `${user.uid}_${selectedCategory.replace(/\s+/g, '_')}`;
      const reviewRef = doc(db, "reviews", docId);

      const payload: any = {
        reviewId: docId,
        userId: user.uid,
        userEmail: user.email || "",
        userName: user.displayName || dbUser?.fullName || "Verified Student",
        userPhoto: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || "Student")}`,
        courseId: matchingOrder?.courseId || "unknown_course_id",
        courseName: matchingOrder?.courseName || `${selectedCategory} Mastertrack`,
        category: selectedCategory,
        rating: Number(reviewRating),
        reviewText: reviewComment.trim(),
        verifiedPurchase: true,
        orderId: matchingOrder?.id || "unknown_order_id",
        createdAt: existingReviewForCategory ? existingReviewForCategory.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "Approved" // Default new reviews to approved
      };

      await setDoc(reviewRef, payload, { merge: true });
      showLocalToast(existingReviewForCategory ? "Review updated successfully!" : "Review posted successfully! Thank you for your feedback.");

      // Fetch updated reviews
      const reviewsQ = query(collection(db, "reviews"), where("userId", "==", user.uid));
      const reviewsSnap = await getDocs(reviewsQ);
      const rList: Review[] = [];
      reviewsSnap.forEach((docSnap) => {
        rList.push({ id: docSnap.id, ...docSnap.data() } as Review);
      });
      setUserReviews(rList);

      setReviewComment("");
      setReviewFormOpen(false);
    } catch (err: any) {
      console.error("Review creation error:", err);
      showLocalToast("Review action failed. Please verify database rules.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!user || !existingReviewForCategory) return;
    if (!window.confirm("Are you sure you want to delete your review for this category?")) return;

    setSubmittingReview(true);
    try {
      const docId = existingReviewForCategory.id || `${user.uid}_${selectedCategory.replace(/\s+/g, '_')}`;
      await deleteDoc(doc(db, "reviews", docId));
      showLocalToast("Review deleted successfully.");

      // Refresh eligibility state
      const reviewsQ = query(collection(db, "reviews"), where("userId", "==", user.uid));
      const reviewsSnap = await getDocs(reviewsQ);
      const rList: Review[] = [];
      reviewsSnap.forEach((docSnap) => {
        rList.push({ id: docSnap.id, ...docSnap.data() } as Review);
      });
      setUserReviews(rList);

      setReviewComment("");
      setReviewFormOpen(false);
    } catch (err) {
      console.error("Failed to delete review:", err);
      showLocalToast("Delete action failed.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handlePublicDeleteReview = async (reviewToDel: Review) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const docId = reviewToDel.id || `${reviewToDel.userId}_${reviewToDel.category.replace(/\s+/g, '_')}`;
      await deleteDoc(doc(db, "reviews", docId));
      showLocalToast("Review deleted successfully.");
    } catch (err) {
      console.error("Could not delete review:", err);
      showLocalToast("Delete operation failed.");
    }
  };

  // Category listing with styles
  const categories = [
    { name: "AI Tools", icon: Cpu, desc: "Leverage agents & automation", color: "from-purple-500/10 to-indigo-500/10 text-indigo-400" },
    { name: "Video Editing", icon: Video, desc: "Edit movie-grade reels", color: "from-pink-500/10 to-rose-500/10 text-pink-400" },
    { name: "Digital Marketing", icon: TrendingUp, desc: "Scale targeted traffic", color: "from-teal-500/10 to-emerald-500/10 text-emerald-400" },
    { name: "YouTube Growth", icon: Youtube, desc: "Secrets to going viral", color: "from-red-500/10 to-orange-500/10 text-red-400" },
    { name: "Freelancing", icon: Briefcase, desc: "Land high-ticket global clients", color: "from-amber-500/10 to-yellow-500/10 text-amber-400" },
    { name: "Business", icon: LineChart, desc: "Launch and scale startups", color: "from-blue-500/10 to-sky-500/10 text-sky-400" },
    { name: "Self Improvement", icon: Sparkles, desc: "Optimize personal routines", color: "from-violet-500/10 to-fuchsia-500/10 text-fuchsia-400" }
  ];

  // Reasons to Choose Us
  const whyChooseUs = [
    {
      title: "Future-Ready Skills",
      desc: "Courses continuously updated for tomorrow's technology, AI disruptions, and shifts in digital markets.",
      icon: Cpu,
    },
    {
      title: "Affordable Learning",
      desc: "Premium content split-funded down to accessible price points, ensuring quality education for everyone.",
      icon: DollarSign,
    },
    {
      title: "Curated Resources",
      desc: "Save hundreds of hours. Get exact templates, cheatsheets, plug-and-play presets, and code snippets.",
      icon: BookOpen,
    },
    {
      title: "Fast VIP Support",
      desc: "Dedicated support team on standby via email and Telegram to resolve setup, tutorial, or payment queries.",
      icon: Headphones,
    },
  ];

  return (
    <div className="space-y-24 pb-20 animate-in fade-in duration-500">
      
      {/* Embedded Keyframes for Elite center-relative Orbit Rotations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ring-pulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.025); }
        }
        @keyframes logo-pulse {
          0%, 100% { box-shadow: 0 0 0 6px rgba(245,179,0,0.06), 0 0 35px rgba(245,179,0,0.15), inset 0 0 15px rgba(245,179,0,0.08); }
          50% { box-shadow: 0 0 0 12px rgba(245,179,0,0.1), 0 0 50px rgba(245,179,0,0.25), inset 0 0 25px rgba(245,179,0,0.12); }
        }
        @keyframes orbit-spin-clk-raw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbit-spin-cclk-raw {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .orbit-radial-track {
          position: absolute;
          border-radius: 50%;
          border: 1px dashed rgba(245,179,0,0.22);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: calc(var(--radius) * 2);
          height: calc(var(--radius) * 2);
        }
        .orbit-wrap-container {
          --radius: 125px;
          --card-size: 60px;
        }
        @media (min-width: 640px) {
          .orbit-wrap-container {
            --radius: 155px;
            --card-size: 68px;
          }
        }
        @media (min-width: 768px) {
          .orbit-wrap-container {
            --radius: var(--custom-radius, 175px);
            --card-size: var(--custom-card-size, 76px);
          }
        }
        .orbit-floating-item {
          position: absolute;
          width: var(--card-size);
          height: var(--card-size);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%)
                     rotate(calc(var(--item-index) * 90deg))
                     translateY(calc(-1 * var(--radius)))
                     rotate(calc(var(--item-index) * -90deg));
        }
        .orbit-premium-card {
          width: 100%;
          height: 100%;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
        }
        .orbit-premium-card:hover {
          border-color: #F5B300 !important;
          transform: scale(1.08) !important;
        }
        @keyframes marquee-horizontal-left {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-horizontal-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        .marquee-inner-left {
          display: flex;
          width: max-content;
          animation: marquee-horizontal-left 45s linear infinite;
        }
        .marquee-inner-right {
          display: flex;
          width: max-content;
          animation: marquee-horizontal-right 45s linear infinite;
        }
        .marquee-inner-left:hover, .marquee-inner-right:hover {
          animation-play-state: paused;
        }
      `}} />

      {/* SECTION 1: DYNAMIC CMS LUXURY HERO + ORBIT SYSTEM */}
      <section className="relative overflow-hidden pt-12 md:pt-20 select-none">
        
        {/* Dynamic Starfield Particle Backdrop */}
        {hpSettings?.enableParticleBackground !== false && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
            {Array.from({ length: 24 }).map((_, i) => {
              const randomX = (i * 7.3) % 100;
              const randomY = (i * 11.7) % 100;
              const randomSize = ((i * 3) % 4) + 1.5;
              const randomDuration = ((i * 2.5) % 8) + 4;
              return (
                <div
                  key={i}
                  className="absolute rounded-full bg-brand-gold/15 dark:bg-brand-gold/10 animate-pulse"
                  style={{
                    left: `${randomX}%`,
                    top: `${randomY}%`,
                    width: `${randomSize}px`,
                    height: `${randomSize}px`,
                    animationDuration: `${randomDuration}s`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Abstract Background Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[10%] w-[350px] h-[350px] rounded-full bg-brand-gold/10 blur-[80px]"></div>
          <div className="absolute top-[20%] right-[5%] w-[450px] h-[450px] rounded-full bg-indigo-500/5 blur-[120px]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* LEFT COLUMN: headlines, tagline and buttons */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6 md:space-y-8">
              
              {/* Tagline Badge */}
              <div className="inline-flex items-center space-x-2 bg-brand-gold/10 dark:bg-brand-gold/10 border border-brand-gold/30 px-4 py-1.5 rounded-full backdrop-blur-sm animate-in fade-in slide-in-from-top-1 duration-300">
                <Sparkles className="w-4 h-4 text-brand-gold animate-pulse" />
                <span className="text-[10px] font-mono font-medium tracking-wider text-neutral-900 dark:text-brand-gold uppercase">
                  {hpSettings?.announcementBadge || "Exclusive Curated E-Learning Library"}
                </span>
              </div>

              {/* Headlines */}
              <div className="space-y-4">
                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-neutral-900 dark:text-white leading-[1.1]">
                  {hpSettings?.mainHeading || "Build Skills For"} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold via-yellow-400 to-amber-500 glow-gold">
                    {hpSettings?.mainHeadingHighlight || "Tomorrow's Economy"}
                  </span>
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed max-w-xl mx-auto lg:mx-0">
                  {hpSettings?.taglineSubtext || "Discover premium learning resources in AI, Video Editing, Freelancing, YouTube Audience Building, and modern Digital Businesses."}
                </p>
              </div>

              {/* Call-to-actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/courses"
                  className="w-full sm:w-auto font-display font-semibold text-black bg-brand-gold hover:bg-[#F5B300]/90 px-8 py-4 rounded-xl flex items-center justify-center space-x-2 shadow-xl hover:shadow-brand-gold/20 transition-all group scale-100 hover:scale-[1.02] duration-300 transform"
                >
                  <span>{hpSettings?.ctaButtonText || "Explore Premium Courses"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                {globalSettings.telegramChannelLink && (
                  <a
                    href={globalSettings.telegramChannelLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto font-display font-medium text-neutral-700 dark:text-white bg-slate-100 dark:bg-brand-card hover:bg-slate-200 dark:hover:bg-brand-border border border-neutral-300 dark:border-brand-border px-8 py-4 rounded-xl flex items-center justify-center space-x-2 transition-all"
                  >
                    <TelegramIcon className="w-4 h-4 text-sky-400" />
                    <span>{hpSettings?.secondCtaButtonText || "Join Telegram Community"}</span>
                  </a>
                )}
              </div>

              {/* Trust stats indicator */}
              <div className="pt-6 grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0 font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                <div className="p-3.5 border border-neutral-200/60 dark:border-brand-border/30 rounded-2xl bg-white dark:bg-[#0b0b0b] shadow-sm hover:border-brand-gold/30 hover:shadow-md transition-all text-left">
                  <span className="block font-display text-xl font-bold text-brand-gold leading-none mb-1">10k+</span>
                  <span className="text-neutral-600 dark:text-neutral-400">Active Learners</span>
                </div>
                <div className="p-3.5 border border-neutral-200/60 dark:border-brand-border/30 rounded-2xl bg-white dark:bg-[#0b0b0b] shadow-sm hover:border-brand-gold/30 hover:shadow-md transition-all text-left">
                  <span className="block font-display text-xl font-bold text-brand-gold leading-none mb-1">99.4%</span>
                  <span className="text-neutral-600 dark:text-neutral-400">Success Rating</span>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: CIRCULAR NESTED ORBITS AND DETAILED PANEL */}
            <div className="lg:col-span-5 flex justify-center items-center h-[340px] sm:h-[480px] md:h-[520px] w-full relative">
              
              {/* TharOil-Style Professional Gold Pulsing Rings */}
              {hpSettings?.enableOrbitGlow !== false && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
                  <div className="absolute rounded-full border border-[#F5B300]/15 bg-[#F5B300]/[0.015]" style={{ width: 'calc(var(--radius) * 2.5)', height: 'calc(var(--radius) * 2.5)', animation: 'ring-pulse 4s ease-in-out infinite' }} />
                  <div className="absolute rounded-full border border-[#F5B300]/10 bg-[#F5B300]/[0.008]" style={{ width: 'calc(var(--radius) * 2.0)', height: 'calc(var(--radius) * 2.0)', animation: 'ring-pulse 4.5s ease-in-out infinite', animationDelay: '0.6s' }} />
                  <div className="absolute rounded-full border border-[#F5B300]/5" style={{ width: 'calc(var(--radius) * 1.5)', height: 'calc(var(--radius) * 1.5)', animation: 'ring-pulse 5s ease-in-out infinite', animationDelay: '1.2s' }} />
                </div>
              )}

              {/* Static Dashed Outer Track Ring */}
              <div className="orbit-radial-track" />

              {/* ROTATING ORBIT CONTAINER TRACK */}
              {(() => {
                const isClockwise = hpSettings?.orbitDirection !== "Counter-Clockwise";
                const speedPreset = hpSettings?.orbitSpeed || "Normal";
                let speed = 14;
                if (speedPreset === "Slow") speed = 25;
                else if (speedPreset === "Fast") speed = 8;
                else if (speedPreset === "Custom") speed = hpSettings?.customOrbitSpeed || 14;

                const playState = (hpSettings?.enableAutoRotation !== false && hpSettings?.enableOrbitAnimation !== false)
                  ? "running"
                  : "paused";

                const customRadius = hpSettings?.orbitRadius || 175;
                const customCardSize = hpSettings?.orbitCardSize || 76;
                const glowIntensity = hpSettings?.orbitGlowIntensity || "medium";

                // Resolve Cards Setup
                const orbitCard1 = {
                  id: "oc1",
                  title: hpSettings?.orbitLabel1 || "YouTube Audience Growth",
                  description: "Optimize script production and audience metrics",
                  image: hpSettings?.orbitImage1 || "/heroanimation1.png",
                  label: hpSettings?.orbitLabel1 || "YouTube Mastery",
                  link: hpSettings?.orbitLink1 || "youtube-automation"
                };
                const orbitCard2 = {
                  id: "oc2",
                  title: hpSettings?.orbitLabel2 || "Artificial Intelligence",
                  description: "Command automated agents to self-execute complex loops",
                  image: hpSettings?.orbitImage2 || "/heroanimation2.png",
                  label: hpSettings?.orbitLabel2 || "Autonomous AI",
                  link: hpSettings?.orbitLink2 || "self-operative-ai-mastery"
                };
                const orbitCard3 = {
                  id: "oc3",
                  title: hpSettings?.orbitLabel3 || "Cinema Video Production",
                  description: "Edit cinema-grade visual styles inside Premiere",
                  image: hpSettings?.orbitImage3 || "/heroanimation3.png",
                  label: hpSettings?.orbitLabel3 || "Video Cine",
                  link: hpSettings?.orbitLink3 || "cinema-grade-premiere-pro"
                };
                const orbitCard4 = {
                  id: "oc4",
                  title: hpSettings?.orbitLabel4 || "Global Freelance Pipelines",
                  description: "Scale high-ticket deal structure and pricing templates",
                  image: hpSettings?.orbitImage4 || "/heroanimation4.png",
                  label: hpSettings?.orbitLabel4 || "Freelancing",
                  link: hpSettings?.orbitLink4 || "modern-freelancing"
                };

                const orbitCards = [orbitCard1, orbitCard2, orbitCard3, orbitCard4];

                const getOrbitFallbackSvg = (index: number) => {
                  if (index === 0) {
                    return (
                      <svg className="w-8 h-8 text-brand-gold" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.163a3 3 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.516 0-9.387.507A3.003 3.003 0 0 0 .502 6.164C0 8.035 0 12 0 12s0 3.965.502 5.837a3 3 0 0 0 2.11 2.11c1.871.507 9.388.507 9.388.507s7.517 0 9.389-.507a3.002 3.002 0 0 0 2.11-2.11C24 15.965 24 12 24 12s0-3.965-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    );
                  }
                  if (index === 1) {
                    return (
                      <svg className="w-8 h-8 text-brand-gold animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M9 9h6v6H9z" fill="currentColor" fillOpacity="0.25" />
                        <path d="M9 1h1m4 0h1M9 23h1m4 0h1M1 9h1m0 4h1M22 9h1m-1 4h1" />
                      </svg>
                    );
                  }
                  if (index === 2) {
                    return (
                      <svg className="w-8 h-8 text-brand-gold" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    );
                  }
                  return (
                    <svg className="w-8 h-8 text-brand-gold" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="2" y="7" width="20" height="14" rx="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  );
                };

                return (
                  <div 
                    className="absolute inset-0 flex items-center justify-center pointer-events-none w-full h-full orbit-wrap-container"
                    style={{
                      '--custom-radius': `${customRadius}px`,
                      '--custom-card-size': `${customCardSize}px`
                    } as React.CSSProperties}
                  >
                    
                    {/* Rotating Subtrack */}
                    <div
                      className="absolute w-full h-full flex items-center justify-center"
                      style={{
                        animation: isClockwise ? `orbit-spin-clk-raw ${speed}s linear infinite` : `orbit-spin-cclk-raw ${speed}s linear infinite`,
                        animationPlayState: playState
                      }}
                    >
                      {orbitCards.map((item, idx) => {
                        return (
                          <div
                            key={item.id}
                            style={{
                              '--item-index': idx
                            } as React.CSSProperties}
                            className="orbit-floating-item pointer-events-auto"
                            onMouseEnter={() => setHoveredOrbitItem(item)}
                            onMouseLeave={() => setHoveredOrbitItem(null)}
                            onClick={() => {
                              if (item.link) {
                                if (item.link.startsWith("http")) {
                                  window.open(item.link, "_blank");
                                } else {
                                  setCurrentPage("course-details", item.link);
                                }
                              } else {
                                setCurrentPage("courses");
                              }
                            }}
                          >
                            {/* Counter-Rotating Card for elegant face-up alignment */}
                            <div
                              className="orbit-premium-card bg-[#090704]/90 dark:bg-[#090704]/95 border border-[#F5B300]/30 hover:border-[#F5B300]/80 p-1 shadow-2xl flex flex-col items-center justify-center select-none"
                              style={{
                                animation: isClockwise ? `orbit-spin-cclk-raw ${speed}s linear infinite` : `orbit-spin-clk-raw ${speed}s linear infinite`,
                                animationPlayState: playState,
                                boxShadow: glowIntensity === 'high' 
                                  ? '0 0 25px rgba(245,179,0,0.22)' 
                                  : glowIntensity === 'low' 
                                    ? '0 0 6px rgba(245,179,0,0.06)' 
                                    : '0 0 14px rgba(245,179,0,0.12)'
                              }}
                            >
                              {/* Icon container */}
                              <div className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center mt-1 scale-95 hover:scale-105 transition-transform duration-300">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    referrerPolicy="no-referrer"
                                    alt={item.title}
                                    className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(245,179,0,0.35)]"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      if (e.currentTarget.nextElementSibling) {
                                        (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                      }
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className="w-full h-full items-center justify-center"
                                  style={{ display: item.image ? 'none' : 'flex' }}
                                >
                                  {getOrbitFallbackSvg(idx)}
                                </div>
                              </div>
                              {/* Heading Label */}
                              <span className="text-[7.5px] sm:text-[8px] md:text-[9.2px] font-mono font-bold tracking-wider text-[#F5B300] uppercase text-center truncate w-full px-1.5 mt-0.5">
                                {item.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })()}

              {/* CENTER HUB CONTAINER: BRAND BADGE LOGO */}
              <div 
                className="absolute w-14 h-14 md:w-20 md:h-20 rounded-full border-2 border-brand-gold bg-white dark:bg-black flex items-center justify-center p-0.5 shadow-2xl z-25 overflow-hidden"
                style={{
                  animation: 'logo-pulse 4.5s ease-in-out infinite'
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-black/5 dark:bg-white/5">
                  {(() => {
                    const centerLogoMode = hpSettings?.centerLogoSourceType || "text";
                    if (centerLogoMode === "course" && hpSettings?.centerLogoCourseId) {
                      const c = courses.find((x) => x.id === hpSettings.centerLogoCourseId);
                      if (c?.thumbnail) return <img src={c.thumbnail} alt="" className="w-full h-full object-cover" />;
                    } else if (centerLogoMode === "upload" && hpSettings?.centerLogoUploadedUrl) {
                      return <img src={hpSettings.centerLogoUploadedUrl} alt="" className="w-full h-full object-cover animate-in fade-in" />;
                    } else if (centerLogoMode === "external" && hpSettings?.centerLogoExternalUrl) {
                      return <img src={hpSettings.centerLogoExternalUrl} alt="" className="w-full h-full object-cover" />;
                    }
                    return (
                      <span className="text-xs md:text-sm font-display font-black text-brand-gold tracking-widest uppercase">
                        {hpSettings?.centerLogoText || "L2F"}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* FLOATING HOVER CARD HEADS-UP DETAILS HUD */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-56 sm:w-72 md:w-80 h-14 flex items-center justify-center text-center">
                {hoveredOrbitItem ? (
                  <div className="bg-black/90 dark:bg-[#121212]/95 border border-[#F5B300]/30 rounded-2xl py-2 px-4 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                    <h4 className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#F5B300] truncate max-w-[240px]">
                      {hoveredOrbitItem.title}
                    </h4>
                    {hoveredOrbitItem.description && (
                      <p className="text-[9px] text-neutral-400 mt-0.5 max-w-[240px] truncate leading-snug">
                        {hoveredOrbitItem.description}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest bg-neutral-100/50 dark:bg-[#121212]/30 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm select-none">
                    Hover item to explore trajectory
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* SECTION 2: CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-bold tracking-widest text-brand-gold uppercase">
            Syllabus Tracks
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
            Curated Knowledge Verticals
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto text-sm">
            Access masterclass programs crafted to bring you practical skills that command top dollar in the digital economy.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => {
            const IconComp = cat.icon;
            return (
              <Link 
                key={idx}
                to="/courses"
                className="group border border-neutral-200 dark:border-neutral-900 rounded-2xl p-6 bg-white dark:bg-[#151515] hover:border-brand-gold/60 dark:hover:border-brand-gold/30 hover:shadow-lg transition-all dark:hover:shadow-brand-gold/5 cursor-pointer flex flex-col space-y-4 text-left"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shrink-0`}>
                  <IconComp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-neutral-900 dark:text-white group-hover:text-brand-gold transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-normal">
                    {cat.desc}
                  </p>
                </div>
                <div className="pt-2 flex items-center text-xs font-semibold text-brand-gold opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                  <span>Browse modules</span>
                  <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: FEATURED COURSES */}
      <section className="bg-neutral-100 dark:bg-[#111111]/40 border-y border-neutral-200 dark:border-neutral-950 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left space-y-2">
              <span className="text-xs font-mono font-bold tracking-widest text-brand-gold uppercase">
                Trending Right Now
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold string text-neutral-900 dark:text-white">
                Featured Programs
              </h2>
            </div>
            <Link
              to="/courses"
              className="text-sm font-semibold text-brand-gold hover:text-[#F5B300]/80 flex items-center gap-1.5"
            >
              <span>View full catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {courses.map((course, idx) => (
                <div 
                  key={course.id ? `${course.id}-${idx}` : idx}
                  className="flex flex-col border border-neutral-200 dark:border-brand-border rounded-2xl bg-white dark:bg-[#151515] overflow-hidden hover:shadow-xl dark:hover:shadow-brand-gold/5 transition-all group lg:scale-100"
                >
                  {/* Thumbnail area with Link wrapper */}
                  <Link to={`/course/${course.slug || course.id}`} className="aspect-video w-full overflow-hidden relative bg-neutral-900 shrink-0 block">
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e)=>{
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800";
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-brand-gold text-[10px] font-mono font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border border-brand-gold/20">
                      {course.category}
                    </div>
                  </Link>

                  {/* Core Description content */}
                  <div className="p-6 flex flex-col flex-grow justify-between space-y-4">
                    <div className="space-y-2">
                      <Link to={`/course/${course.slug || course.id}`} className="block">
                        <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white group-hover:text-brand-gold transition-colors line-clamp-1 text-left">
                          {course.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed text-left">
                        {course.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-900/40 flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-[10px] text-neutral-400 block font-mono">TUITION COST</span>
                        <span className="font-display text-xl font-bold text-brand-gold">
                          ₹{course.price.toLocaleString("en-IN") || course.price}
                        </span>
                      </div>
                      {user && hasPurchasedCourse(user.uid, course.id) ? (
                        <button
                          onClick={() => setCurrentPage("my-enrollments")}
                          className="bg-emerald-600 text-white font-display font-bold text-xs py-2.5 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                        >
                          Start Learning
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <Link
                          to={`/course/${course.slug || course.id}`}
                          className="bg-neutral-900 dark:bg-brand-gold text-white dark:text-black font-display font-bold text-xs py-2.5 px-4 rounded-lg hover:bg-brand-gold dark:hover:bg-[#F5B300]/80 hover:text-black transition-colors flex items-center gap-1.5"
                        >
                          Enroll Now
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* SECTION 3.5: STUDENT REVIEWS (PURCHASE-VERIFIED SOCIAL PROOF) */}
      <section className="bg-neutral-50 dark:bg-[#0c0c0c]/80 py-24 border-y border-neutral-200/60 dark:border-brand-border/40 relative">
        <div className="absolute top-0 right-10 w-[300px] h-[300px] bg-brand-gold/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-[300px] h-[300px] bg-indigo-50/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10 font-sans">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 text-center md:text-left">
              <span className="text-xs font-mono font-bold tracking-widest text-brand-gold uppercase px-2.5 py-1 rounded bg-brand-gold/10">
                ⭐ Student Endorsements
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white leading-tight">
                Verified Student Reviews
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-xl text-sm leading-relaxed font-sans">
                Real feedback from real students. See how our curated micro-syllabus tracks are empowering automated and digital careers.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 shrink-0">
              <div className="text-center md:text-right font-mono text-xs text-neutral-550 dark:text-neutral-400">
                <span className="text-brand-gold font-bold">4.9 / 5.0 Global Rating</span> from our verified learners
              </div>
              <button
                onClick={() => {
                  if (!isSetupComplete()) {
                    setAuthModalMessage("Please complete account setup before continuing.");
                    setAuthModalOpen(true);
                  } else {
                    setReviewFormOpen(true);
                  }
                }}
                className="w-full sm:w-auto font-display font-semibold transition-all duration-300 py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-xs text-black bg-brand-gold hover:bg-[#F5B300]/90 shadow-xl hover:shadow-brand-gold/15 group animate-in zoom-in-95"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                <span>Submit a Review</span>
              </button>
            </div>
          </div>

          {fetchingReviews ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-3 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-8 overflow-hidden py-4 select-none">
              
              {/* Row 1: Sliding Left */}
              <div className="relative w-full overflow-hidden flex">
                <div className="marquee-inner-left py-2 gap-6 select-none flex">
                  {/* Triple the items to ensure infinite loop coverage across any screen resolution */}
                  {[...reviews, ...reviews, ...reviews].map((item, index) => {
                    const uniqueKey = `row1-${item.id || item.reviewId}-${index}`;
                    const formatDate = (ts: any) => {
                      if (!ts) return "";
                      try {
                        if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                        if (ts instanceof Date) return ts.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                        return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                      } catch (err) {
                        return "";
                      }
                    };

                    return (
                      <div 
                        key={uniqueKey}
                        className="w-[340px] shrink-0 flex flex-col justify-between border border-neutral-200 dark:border-brand-border/60 rounded-2xl bg-white dark:bg-[#121212] p-6 hover:border-brand-gold/50 hover:shadow-2xl dark:hover:shadow-[#F5B300]/5 transition-all duration-300 relative group"
                      >
                        <div className="space-y-4">
                          {/* Stars & Category or Delete */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${
                                    i < item.rating 
                                      ? "fill-brand-gold text-brand-gold" 
                                      : "text-neutral-300 dark:text-neutral-700"
                                  }`}
                                />
                              ))}
                            </div>
                            
                            {((user && user.uid === item.userId) || isAdmin) && (
                              <button
                                onClick={() => handlePublicDeleteReview(item)}
                                className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-955/30 transition-all focus:outline-none"
                                title="Delete review"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-355 leading-relaxed font-sans italic">
                            "{item.reviewText}"
                          </p>
                        </div>

                        {/* Reviewer Meta info */}
                        <div className="pt-6 mt-6 border-t border-neutral-105 dark:border-brand-border/40 space-y-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={item.userPhoto || item.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.userName || "Student")}`} 
                              alt={item.userName}
                              className="w-10 h-10 rounded-full object-cover border border-brand-gold/20 shrink-0"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.userName || "Student")}`;
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1 max-w-full">
                                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                                  {item.userName}
                                </h4>
                                {item.verifiedPurchase && (
                                  <span 
                                    className="text-[8px] bg-green-500/10 text-green-500 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0"
                                    title="Verified Course Purchaser"
                                  >
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    <span className="hidden sm:inline">Verified</span>
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[9px] text-neutral-400 dark:text-neutral-500 font-mono">
                                <span className="bg-neutral-100 dark:bg-brand-card px-1.5 py-0.5 rounded leading-none">
                                  {item.category}
                                </span>
                                <span>
                                  {formatDate(item.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-neutral-50 dark:bg-brand-card border border-neutral-200/50 dark:border-brand-border/30 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2">
                            <span className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500 uppercase shrink-0">
                              Syllabus Track
                            </span>
                            <span className="text-[10px] font-semibold text-brand-gold truncate max-w-[155px] leading-none">
                              {item.courseName}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Sliding Right */}
              <div className="relative w-full overflow-hidden flex">
                <div className="marquee-inner-right py-2 gap-6 select-none flex">
                  {/* Reverse elements block and triple */}
                  {[...reviews, ...reviews, ...reviews].reverse().map((item, index) => {
                    const uniqueKey = `row2-${item.id || item.reviewId}-${index}`;
                    const formatDate = (ts: any) => {
                      if (!ts) return "";
                      try {
                        if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                        if (ts instanceof Date) return ts.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                        return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                      } catch (err) {
                        return "";
                      }
                    };

                    return (
                      <div 
                        key={uniqueKey}
                        className="w-[340px] shrink-0 flex flex-col justify-between border border-neutral-200 dark:border-brand-border/60 rounded-2xl bg-white dark:bg-[#121212] p-6 hover:border-brand-gold/50 hover:shadow-2xl dark:hover:shadow-[#F5B300]/5 transition-all duration-300 relative group"
                      >
                        <div className="space-y-4">
                          {/* Stars & Category or Delete */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${
                                    i < item.rating 
                                      ? "fill-brand-gold text-brand-gold" 
                                      : "text-neutral-300 dark:text-neutral-700"
                                  }`}
                                />
                              ))}
                            </div>
                            
                            {((user && user.uid === item.userId) || isAdmin) && (
                              <button
                                onClick={() => handlePublicDeleteReview(item)}
                                className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-955/30 transition-all focus:outline-none"
                                title="Delete review"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-355 leading-relaxed font-sans italic">
                            "{item.reviewText}"
                          </p>
                        </div>

                        {/* Reviewer Meta info */}
                        <div className="pt-6 mt-6 border-t border-neutral-105 dark:border-brand-border/40 space-y-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={item.userPhoto || item.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.userName || "Student")}`} 
                              alt={item.userName}
                              className="w-10 h-10 rounded-full object-cover border border-brand-gold/20 shrink-0"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.userName || "Student")}`;
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1 max-w-full">
                                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                                  {item.userName}
                                </h4>
                                {item.verifiedPurchase && (
                                  <span 
                                    className="text-[8px] bg-green-500/10 text-green-500 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0"
                                    title="Verified Course Purchaser"
                                  >
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    <span className="hidden sm:inline">Verified</span>
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[9px] text-neutral-400 dark:text-neutral-500 font-mono">
                                <span className="bg-neutral-100 dark:bg-brand-card px-1.5 py-0.5 rounded leading-none">
                                  {item.category}
                                </span>
                                <span>
                                  {formatDate(item.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-neutral-50 dark:bg-brand-card border border-neutral-200/50 dark:border-brand-border/30 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2">
                            <span className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500 uppercase shrink-0">
                              Syllabus Track
                            </span>
                            <span className="text-[10px] font-semibold text-brand-gold truncate max-w-[155px] leading-none">
                              {item.courseName}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>
      </section>

      {/* VERIFIED STUDENT REVIEW FORM MODAL */}
      {reviewFormOpen && (
        <div id="review-modal" className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#151515] border border-neutral-200 dark:border-brand-border rounded-2xl w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200 font-sans max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-neutral-200 dark:border-brand-border/60 flex items-center justify-between shrink-0 bg-white dark:bg-[#151515] sticky top-0 z-10 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-brand-gold fill-brand-gold" />
                <h3 className="font-display font-bold text-lg text-neutral-900 dark:text-white">
                  Write a Student Review
                </h3>
              </div>
              <button 
                onClick={() => setReviewFormOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors p-1"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {!user ? (
              <div className="p-8 text-center space-y-4">
                <ShieldAlert className="w-12 h-12 text-brand-gold mx-auto" />
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  Please login to submit a review.
                </p>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Only logged-in students with completed course transactions can leave category-specific ratings.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setReviewFormOpen(false);
                    showLocalToast("Please use the Login button in the top-right header menu.");
                  }}
                  className="px-5 py-2.5 bg-brand-gold hover:bg-[#F5B300]/90 text-black text-xs font-bold rounded-xl transition-all"
                >
                  Close & Click Login
                </button>
              </div>
            ) : verifiedPurchasedCategories.length === 0 ? (
              <div className="p-8 text-center space-y-4">
                <ShieldAlert className="w-12 h-12 text-neutral-400 mx-auto" />
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-300">
                  Only verified students can submit reviews.
                </p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                  To publish a review, you must have a delivered or completed course purchase matching your registration account email <strong className="text-brand-gold">{user.email}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setReviewFormOpen(false)}
                  className="px-5 py-2 bg-neutral-100 dark:bg-brand-card text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-xl transition-all"
                >
                  Dismiss
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="p-6 space-y-5">
                
                {/* Authorization Stamp */}
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-green-500 uppercase tracking-wider font-mono">
                      Verified Student Access
                    </p>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                      You are authorized to review categories you have purchased.
                    </p>
                  </div>
                </div>

                {/* Dropdown Category Selector */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono font-bold text-neutral-550 dark:text-neutral-400 uppercase">
                    Select Purchased Category *
                  </label>
                  <select
                    required
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-neutral-55 dark:bg-[#0b0b0b] border border-neutral-200 dark:border-brand-border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-gold text-neutral-900 dark:text-white"
                  >
                    {verifiedPurchasedCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Warning message if they are editing a previous category review */}
                {existingReviewForCategory && (
                  <div className="bg-brand-gold/10 border border-brand-gold/20 rounded-xl p-3 flex gap-2.5">
                    <Sparkles className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-brand-gold uppercase tracking-wider font-mono">
                        Previous Review Found
                      </p>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                        You already submitted a review for <strong className="text-neutral-900 dark:text-white">{selectedCategory}</strong>. Modifying these fields will update your existing rating.
                      </p>
                    </div>
                  </div>
                )}

                {/* Rating Stars Selection */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono font-bold text-neutral-550 dark:text-neutral-400 uppercase">
                    Your Rating *
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const ratingValue = i + 1;
                      return (
                        <button
                          type="button"
                          key={i}
                          onClick={() => setReviewRating(ratingValue)}
                          className="transition-transform hover:scale-110 p-0.5"
                          title={`${ratingValue} Stars`}
                        >
                          <Star 
                            className={`w-6 h-6 ${
                              ratingValue <= reviewRating 
                                ? "fill-brand-gold text-brand-gold" 
                                : "text-neutral-300 dark:text-neutral-700 hover:text-brand-gold"
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="text-xs font-bold text-neutral-550 dark:text-neutral-400 ml-2 font-mono">
                      {reviewRating} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* Comments box */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-mono font-bold text-neutral-550 dark:text-neutral-400 uppercase">
                    <span>Your Review Message *</span>
                    <span className={reviewComment.trim().length >= 10 ? "text-green-500 font-mono" : "text-brand-gold font-mono"}>
                      {reviewComment.trim().length} / 1000 chars
                    </span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    maxLength={1000}
                    placeholder="Provide details about the learning experience, homework scripts, or projects completed..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-neutral-55 dark:bg-[#0b0b0b] border border-neutral-200 dark:border-brand-border rounded-xl p-4 text-xs focus:outline-none focus:ring-1 focus:ring-brand-gold text-neutral-900 dark:text-white resize-none"
                  />
                </div>

                {/* Button actions bar with Delete button */}
                <div className="pt-4 flex items-center justify-between border-t border-neutral-200 dark:border-brand-border/60">
                  {existingReviewForCategory ? (
                    <button
                      type="button"
                      disabled={submittingReview}
                      onClick={handleDeleteReview}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-semibold transition-all focus:outline-none flex items-center gap-1.5"
                    >
                      Delete Review
                    </button>
                  ) : (
                    <div></div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewFormOpen(false)}
                      className="px-4 py-2 bg-neutral-100 dark:bg-brand-card text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-semibold hover:bg-neutral-200 dark:hover:bg-brand-border transition-colors focus:outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-5 py-2 bg-brand-gold hover:bg-[#F5B300]/90 text-black rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 focus:outline-none"
                    >
                      {submittingReview ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{existingReviewForCategory ? "Update Review" : "Submit Review"}</span>
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

      {/* Floating Success Indicator / Toast Notification */}
      {localToast && (
        <div className="fixed bottom-6 right-6 bg-neutral-950 dark:bg-neutral-900 border border-brand-gold/40 text-white rounded-xl py-3 px-5 shadow-2xl z-50 flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
          <div className="w-2 h-2 rounded-full bg-brand-gold animate-ping"></div>
          <p className="text-xs font-medium">{localToast}</p>
        </div>
      )}

      {/* NEW SECTION: LATEST INSIGHTS BLOGS */}
      <section className="bg-neutral-100 dark:bg-[#111111]/40 border-y border-neutral-200 dark:border-neutral-950 py-24 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left space-y-2">
              <span className="text-xs font-mono font-bold tracking-widest text-brand-gold uppercase">
                Articles &amp; Guides
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
                Latest Tech Insights
              </h2>
            </div>
            <Link
              to="/blog"
              className="text-sm font-semibold text-brand-gold hover:text-[#F5B300]/80 flex items-center gap-1.5 focus:outline-none"
            >
              <span>View all guides</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingBlogs ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestBlogs.map((post, postIdx) => (
                <Link 
                  key={post.id ? `${post.id}-${postIdx}` : (post.slug ? `${post.slug}-${postIdx}` : postIdx)}
                  to={`/blog/${post.slug}`}
                  className="flex flex-col border border-neutral-200 dark:border-brand-border rounded-2xl bg-white dark:bg-[#151515] overflow-hidden hover:shadow-xl dark:hover:shadow-brand-gold/5 transition-all group cursor-pointer text-left"
                >
                  <div className="aspect-video w-full overflow-hidden relative bg-neutral-900 shrink-0">
                    <img 
                      src={post.featuredImage || "https://images.unsplash.com/photo-1516116211223-5c359a36298a?auto=format&fit=crop&q=80&w=800"} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-brand-gold text-[10px] font-mono font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border border-brand-gold/20">
                      {post.category}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-neutral-450 block">{post.publishDate} • By {post.author}</span>
                      <h3 className="font-display text-sm sm:text-base font-bold text-neutral-900 dark:text-white group-hover:text-brand-gold transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-3 leading-relaxed font-light">
                        {post.metaDescription}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-900 flex items-center justify-between text-xs font-bold text-brand-gold group-hover:underline mt-auto">
                      <span>Read Full Article</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* SECTION 4: WHY CHOOSE US */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-bold tracking-widest text-brand-gold uppercase">
            Value Blueprint
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
            Why Learn with Learn 2 Future?
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto text-sm">
            We bypass theoretical busywork, loading our curriculum with immediate high-yield frameworks tested in real-world fields.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {whyChooseUs.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="p-8 border border-neutral-200 dark:border-neutral-900 rounded-2xl bg-white dark:bg-[#151515] space-y-4 hover:border-brand-gold/30 dark:hover:border-brand-gold/20 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="pt-2 flex items-center space-x-1.5 text-xs text-brand-gold font-semibold font-mono">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>Verified Standard</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 5: FINAL CTA TELEGRAM BLOCK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl p-10 md:p-16 bg-[#000000] border border-brand-gold/20">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-brand-gold/10 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center relative z-10">
            <div className="lg:col-span-2 space-y-4 text-center lg:text-left">
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Join our Telegram community of <br />
                <span className="text-brand-gold glow-gold">continuously updating learners</span>
              </h2>
              <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 max-w-xl">
                Get free daily tools, skill-upgrade templates, job leads, collaboration opportunities, and real-time support from the community. Let's grow together.
              </p>
            </div>
            
            <div className="flex justify-center lg:justify-end">
              {globalSettings.telegramChannelLink && (
                <a
                  href={globalSettings.telegramChannelLink}
                  target="_blank"
                  rel="noreferrer"
                  className="font-display w-full sm:w-auto font-bold text-black bg-brand-gold hover:bg-[#F5B300]/95 px-8 py-4 rounded-xl flex items-center justify-center space-x-2.5 shadow-xl hover:shadow-brand-gold/20 transition-all scale-100 hover:scale-[1.03]"
                >
                  <TelegramIcon className="w-5 h-5" />
                  <span>Join Telegram Channel</span>
                  <ExternalLink className="w-4 h-4 ml-1 opacity-60" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* RENDER PREMIUM DISCLAIMER MODAL */}
      <AnimatePresence>
        {!disclaimerAccepted && (
          <div className="fixed inset-0 z-[100] overflow-y-auto px-4 py-6 sm:py-12 flex items-start sm:items-center justify-center bg-black/85 backdrop-blur-md">
            {/* Premium Dark Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: "spring", damping: 26, stiffness: 350 }}
              className="relative w-full max-w-xl bg-neutral-950 border-2 border-brand-gold rounded-3xl p-5 sm:p-7 md:p-8 text-white shadow-2xl shadow-brand-gold/15 flex flex-col space-y-4 sm:space-y-6 my-auto"
              role="dialog"
              aria-modal="true"
              id="disclaimer-modal-container"
            >
              {/* Decorative Corner Glows */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-brand-gold/15 rounded-full blur-[60px] pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-brand-gold/15 rounded-full blur-[60px] pointer-events-none"></div>

              {/* Header section with Icon */}
              <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3 relative z-10 shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold">
                  <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                </div>
                <h2 className="font-display text-xs sm:text-sm md:text-base font-bold tracking-widest text-brand-gold uppercase">
                  IMPORTANT DISCLAIMER
                </h2>
                <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-brand-gold to-transparent"></div>
              </div>

              {/* Scrollable Content Body */}
              <div className="space-y-3.5 sm:space-y-5 text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans overflow-y-auto max-h-[30vh] sm:max-h-[38vh] md:max-h-[42vh] pr-2 custom-scrollbar relative z-10 select-text">
                <p className="font-display font-semibold text-white text-sm sm:text-base md:text-lg text-center">
                  Welcome to Learn 2 Future.
                </p>
                <p className="text-center font-light text-neutral-200">
                  Our mission is to make learning and skill development more accessible for students and learners.
                </p>
                <p className="text-center font-light text-neutral-200">
                  We respect all educators, creators, trainers, authors, and developers. We do not claim ownership of third-party brands, trademarks, or creator identities.
                </p>
                <p className="text-center font-light text-neutral-200">
                  If you have any feedback or concerns, please write to us at <strong className="text-brand-gold font-mono break-all">{globalSettings?.supportEmail || "digitalcoursesbay@gmail.com"}</strong>. We are happy to resolve them.
                </p>
                <p className="text-[10px] sm:text-[11px] font-mono text-neutral-400 mt-2 sm:mt-4 p-2.5 sm:p-3.5 bg-neutral-900/85 rounded-2xl border border-neutral-800/60 text-center">
                  By continuing, you agree to our{" "}
                  <button 
                    onClick={() => {
                      handleAcceptDisclaimer();
                      setCurrentPage("terms");
                    }} 
                    className="text-brand-gold hover:underline hover:text-brand-gold-hover transition-colors font-bold inline"
                  >
                    Terms & Conditions
                  </button>{" "}
                  and{" "}
                  <button 
                    onClick={() => {
                      handleAcceptDisclaimer();
                      setCurrentPage("privacy");
                    }} 
                    className="text-brand-gold hover:underline hover:text-brand-gold-hover transition-colors font-bold inline"
                  >
                    Privacy Policy
                  </button>.
                </p>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-1.5 sm:pt-2 relative z-10 font-display shrink-0 w-full animate-in fade-in duration-300">
                <button
                  type="button"
                  id="view-terms-button"
                  onClick={() => {
                    handleAcceptDisclaimer();
                    setCurrentPage("terms");
                  }}
                  className="w-full text-center border border-neutral-800 hover:border-brand-gold/40 text-neutral-300 hover:text-white transition-all duration-200 text-xs py-3.5 px-2 rounded-xl font-mono font-bold uppercase tracking-wider"
                >
                  View Terms
                </button>
                <button
                  type="button"
                  id="view-privacy-button"
                  onClick={() => {
                    handleAcceptDisclaimer();
                    setCurrentPage("privacy");
                  }}
                  className="w-full text-center border border-neutral-800 hover:border-brand-gold/40 text-neutral-300 hover:text-white transition-all duration-200 text-xs py-3.5 px-2 rounded-xl font-mono font-bold uppercase tracking-wider"
                >
                  View Privacy
                </button>
                <button
                  type="button"
                  id="accept-disclaimer-button"
                  onClick={handleAcceptDisclaimer}
                  className="w-full text-center bg-brand-gold hover:bg-brand-gold-hover text-black font-extrabold text-[11px] sm:text-[12px] uppercase py-3.5 px-2 rounded-xl shadow-lg shadow-brand-gold/15 transition-all duration-200 active:scale-95 border-2 border-transparent hover:border-black"
                >
                  I Understand & Proceed
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MAGNETIC CUSTOM CURSOR TRAILING FOLLOWER */}
      {hpSettings?.customCursorEnabled && cursorVisible && (
        <div
          className="hidden md:block fixed pointer-events-none w-7 h-7 rounded-full border border-brand-gold/45 -translate-x-1/2 -translate-y-1/2 z-[9999] transition-all duration-75 mix-blend-difference bg-brand-gold/10"
          style={{ left: mousePos.x, top: mousePos.y }}
        />
      )}

    </div>
  );
};
