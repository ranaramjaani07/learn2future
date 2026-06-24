import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Legend, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  LineChart as RechartsLineChart, 
  Line, 
  AreaChart as RechartsAreaChart, 
  Area 
} from "recharts";
import { useApp } from "../context/AppContext";
import { 
  BarChart, 
  BookOpen, 
  FileText, 
  Mail, 
  TrendingUp, 
  Plus, 
  Trash, 
  Edit, 
  Check, 
  X, 
  LogOut, 
  Upload, 
  Search, 
  Coins, 
  Clock, 
  ShieldCheck, 
  Lock,
  Smartphone, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Eye,
  CheckCircle,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Download,
  Star,
  User,
  ShoppingBag,
  Activity,
  ArrowUp,
  ArrowDown,
  Layers,
  Settings2,
  Move,
  Grid,
  DollarSign,
  Percent,
  Users,
  Copy,
  RefreshCw
} from "lucide-react";
import { 
  collection, 
  getDocs, 
  getDoc,
  getDocFromServer,
  setDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  query,
  where,
  limit
} from "firebase/firestore";
import { ref, uploadBytes as put, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage, handleFirestoreError, OperationType } from "../firebase";
import { Course, Order, ContactMessage, TrackingSettings, Review, HomepageSettings, HeroOrbitItem } from "../types";
import { RichTextEditor } from "./RichTextEditor";
import { CourseLandingPage } from "./CourseLandingPage";
import { SuccessStoriesAdmin } from "./SuccessStoriesAdmin";
import { CrmAnalyticsDashboard } from "./CrmAnalyticsDashboard";
import {
  extractMetaPixelId,
  extractGtmId,
  extractGa4Id,
  extractSearchConsoleVerification,
  extractFacebookDomainVerification,
} from "../lib/trackingParser";

type AdminTab = "analytics" | "courses" | "orders" | "contacts" | "settings" | "blogs" | "coupons" | "users" | "reviews" | "student-portfolios" | "homepage-settings" | "affiliates";

const fallbackCourses = [
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
  }
];

const fallbackOrders = [
  {
    id: "ord_1",
    name: "Rohit Sharma",
    email: "rohit.sharma@gmail.com",
    telegram: "rohit_mastery",
    courseId: "ai-gold",
    proofImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800",
    status: "Pending" as const,
    createdAt: new Date()
  },
  {
    id: "ord_2",
    name: "Priyanka Patel",
    email: "priyanka.patel@yahoo.com",
    telegram: "priya_edits",
    courseId: "edit-cine",
    proofImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800",
    status: "Verified" as const,
    createdAt: new Date(Date.now() - 3600000 * 4)
  },
  {
    id: "ord_3",
    name: "Arjun Verma",
    email: "arjun.v@outlook.com",
    telegram: "arjun_grow",
    courseId: "tube-viral",
    proofImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800",
    status: "Delivered" as const,
    createdAt: new Date(Date.now() - 3600000 * 24)
  }
];

const fallbackContacts = [
  {
    id: "msg_1",
    name: "Sunita Reddy",
    email: "sunita.reddy@gmail.com",
    subject: "Inquiry about AI Mastery Syllabus",
    message: "Hello Learn 2 Future team, is the Self-Operative AI Mastery course suitable for complete beginners who don't have any experience in coding autonomous agents?",
    createdAt: new Date()
  },
  {
    id: "msg_2",
    name: "Kabir Mehta",
    email: "kabir.m@gmail.com",
    subject: "B2B Bulk Licenses",
    message: "We're interested in purchasing 15 credentials licenses of the Video Editing Masterclass for our internal digital content creators. Do you support company-wide invoices and custom discounts?",
    createdAt: new Date(Date.now() - 3600000 * 12)
  }
];

const fallbackUsers = [
  {
    id: "user_1",
    fullName: "Hardik Pandya",
    email: "hardik.pandya@cricket.in",
    mobile: "9876543210",
    address: "Marine Drive Apt 4C",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    onboardingCompleted: true,
    createdAt: new Date(Date.now() - 3600000 * 48),
    disabled: false
  },
  {
    id: "user_2",
    fullName: "Smriti Mandhana",
    email: "smriti.mandhana@wpl.in",
    mobile: "9123456789",
    address: "Koregaon Park Street 2",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    onboardingCompleted: true,
    createdAt: new Date(Date.now() - 3600000 * 12),
    disabled: false
  },
  {
    id: "user_3",
    fullName: "Karan Johar",
    email: "karan.johar@dharma.com",
    mobile: "9988776655",
    address: "Bandra West, Sunset Blvd",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    onboardingCompleted: true,
    createdAt: new Date(Date.now() - 3600000 * 2),
    disabled: true
  }
];

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin, logout, setCurrentPage, globalSettings, updateGlobalSettings } = useApp();

  // Route security check on client-side
  useEffect(() => {
    if (!isAdmin) {
      setCurrentPage("admin-login");
    }
  }, [isAdmin, setCurrentPage]);

  // Tab State Management
  const [activeTab, setActiveTab] = useState<AdminTab>("analytics");

  // Verified Reviews Admin Console States
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewFilterCategory, setReviewFilterCategory] = useState<string>("All");
  const [reviewFilterRating, setReviewFilterRating] = useState<string>("All");

  // Collections States
  const [courses, setCourses] = useState<Course[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [contactMsgs, setContactMsgs] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment Logs & Recovery Queue States
  const [paymentLogsList, setPaymentLogsList] = useState<any[]>([]);
  const [paymentRecoveryQueueList, setPaymentRecoveryQueueList] = useState<any[]>([]);

  // Admin Affiliate CRM state variables
  const [affiliateLists, setAffiliateLists] = useState<any[]>([]);
  const [loadingAffiliates, setLoadingAffiliates] = useState(true);
  const [adminPayoutRequests, setAdminPayoutRequests] = useState<any[]>([]);
  const [loadingPayoutRequests, setLoadingPayoutRequests] = useState(true);
  const [affiliateCrmSubTab, setAffiliateCrmSubTab] = useState<"applications" | "approved" | "payouts" | "suspended_rejected">("applications");
  const [affiliateSearchText, setAffiliateSearchText] = useState("");
  const [auditorNotes, setAuditorNotes] = useState<string>("");
  const [customDiscountRate, setCustomDiscountRate] = useState<number>(10);
  const [customCommissionRate, setCustomCommissionRate] = useState<number>(15);

  // Modal and Editing states (Courses)
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseEditorActiveTab, setCourseEditorActiveTab] = useState<"info" | "price" | "media" | "details" | "curriculum" | "faqs" | "seo">("info");
  
  // New Course form fields
  const [courseTitle, setCourseTitle] = useState("");
  const [courseSlug, setCourseSlug] = useState("");
  const [courseCategory, setCourseCategory] = useState("AI Tools");
  const [coursePrice, setCoursePrice] = useState(1499);
  const [courseDescription, setCourseDescription] = useState("");
  const [courseThumbnail, setCourseThumbnail] = useState("");
  const [courseDeliverableLink, setCourseDeliverableLink] = useState("");
  const [courseWelcomeVideoUrl, setCourseWelcomeVideoUrl] = useState("");
  const [courseThankYouHeading, setCourseThankYouHeading] = useState("");
  const [courseThankYouMessage, setCourseThankYouMessage] = useState("");
  const [courseDeliveryInstructions, setCourseDeliveryInstructions] = useState("");
  const [courseDeliveryUrl, setCourseDeliveryUrl] = useState("");

  // CMS state fields
  const [courseInstructorName, setCourseInstructorName] = useState("");
  const [courseSubCategory, setCourseSubCategory] = useState("");
  const [courseStatus, setCourseStatus] = useState<"Draft" | "Published">("Published");
  const [courseIsFeatured, setCourseIsFeatured] = useState(false);
  const [courseIsPopular, setCourseIsPopular] = useState(false);
  const [courseIsTrending, setCourseIsTrending] = useState(false);

  const [courseOriginalPrice, setCourseOriginalPrice] = useState<number>(0);
  const [courseDiscountPercentage, setCourseDiscountPercentage] = useState<number>(0);
  const [courseCurrency, setCourseCurrency] = useState("INR");
  const [courseIsLimitedTimeOffer, setCourseIsLimitedTimeOffer] = useState(false);

  const [courseBannerImage, setCourseBannerImage] = useState("");
  const [courseInstructorImage, setCourseInstructorImage] = useState("");
  const [coursePreviewVideoUrl, setCoursePreviewVideoUrl] = useState("");
  const [courseShortDescription, setCourseShortDescription] = useState("");
  const [courseLongDescription, setCourseLongDescription] = useState("");
  const [courseOverview, setCourseOverview] = useState("");
  const [courseSummary, setCourseSummary] = useState("");
  const [courseWhoIsThisCourseFor, setCourseWhoIsThisCourseFor] = useState("");
  const [coursePrerequisites, setCoursePrerequisites] = useState("");

  const [courseDuration, setCourseDuration] = useState("");
  const [courseVideoHours, setCourseVideoHours] = useState("");
  const [courseNumberOfLessons, setCourseNumberOfLessons] = useState<number>(0);
  const [courseNumberOfModules, setCourseNumberOfModules] = useState<number>(0);
  const [courseAssignmentsCount, setCourseAssignmentsCount] = useState<number>(0);
  const [courseProjectsCount, setCourseProjectsCount] = useState<number>(0);
  const [courseQuizCount, setCourseQuizCount] = useState<number>(0);
  const [courseLanguage, setCourseLanguage] = useState("English");
  const [courseSkillLevel, setCourseSkillLevel] = useState("All Levels");
  const [courseCertificateAvailable, setCourseCertificateAvailable] = useState(true);
  const [courseLifetimeAccess, setCourseLifetimeAccess] = useState(true);
  const [courseMobileAccess, setCourseMobileAccess] = useState(true);
  const [courseDownloadableResources, setCourseDownloadableResources] = useState(true);

  // Curriculum State
  const [courseModules, setCourseModules] = useState<any[]>([]);

  // FAQ State
  const [courseFaqItems, setCourseFaqItems] = useState<{ question: string; answer: string }[]>([]);

  // SEO State
  const [courseSeoTitle, setCourseSeoTitle] = useState("");
  const [courseSeoDescription, setCourseSeoDescription] = useState("");
  const [courseFocusKeyword, setCourseFocusKeyword] = useState("");
  const [courseSecondaryKeywords, setCourseSecondaryKeywords] = useState<string[]>([]);
  const [courseTags, setCourseTags] = useState<string[]>([]);
  const [courseCanonicalUrl, setCourseCanonicalUrl] = useState("");
  const [courseOgTitle, setCourseOgTitle] = useState("");
  const [courseOgDescription, setCourseOgDescription] = useState("");
  const [courseTwitterTitle, setCourseTwitterTitle] = useState("");
  const [courseTwitterDescription, setCourseTwitterDescription] = useState("");
  const [courseSchemaDescription, setCourseSchemaDescription] = useState("");

  // Sales Copy State
  const [courseBenefits, setCourseBenefits] = useState<string[]>([]);
  const [courseLearningOutcomes, setCourseLearningOutcomes] = useState<string[]>([]);
  const [courseRequirements, setCourseRequirements] = useState<string[]>([]);
  const [courseToolsNeeded, setCourseToolsNeeded] = useState<string[]>([]);
  const [courseBonusResources, setCourseBonusResources] = useState<string[]>([]);

  // Support Additional Delivery Fields
  const [courseDeliveryLink, setCourseDeliveryLink] = useState("");
  const [courseGoogleDriveLink, setCourseGoogleDriveLink] = useState("");
  const [courseTelegramLink, setCourseTelegramLink] = useState("");
  const [coursePrivateResourceLink, setCoursePrivateResourceLink] = useState("");
  const [courseImportantNotes, setCourseImportantNotes] = useState("");
  const [uploadProgress, setUploadProgress] = useState(false);
  const [courseUploadPercent, setCourseUploadPercent] = useState<number | null>(null);
  const [modalError, setModalError] = useState("");

  // Big View Screenshot Modal state
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);

  // Marketing & Tracking Settings State
  const [metaPixelId, setMetaPixelId] = useState("");
  const [gtmId, setGtmId] = useState("");
  const [ga4Id, setGa4Id] = useState("");
  const [searchConsoleVerification, setSearchConsoleVerification] = useState("");
  const [facebookDomainVerification, setFacebookDomainVerification] = useState("xb9keiie8xdt56l5vy9ozx18inhepe");
  const [savingSettings, setSavingSettings] = useState(false);

  // Razorpay Core Gateway Parameters
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("");
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState("");
  const [isTestMode, setIsTestMode] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [enablePaymentSandbox, setEnablePaymentSandbox] = useState(true);
  const [savingPaymentSettings, setSavingPaymentSettings] = useState(false);

  // Global Business Settings Form State
  const [upiId, setUpiId] = useState(globalSettings?.upiId || "");
  const [upiAccountName, setUpiAccountName] = useState(globalSettings?.upiAccountName || "");
  const [upiQrCode, setUpiQrCode] = useState(globalSettings?.upiQrCode || "");
  const [paymentInstructions, setPaymentInstructions] = useState(globalSettings?.paymentInstructions || "");
  const [telegramChannelLink, setTelegramChannelLink] = useState(globalSettings?.telegramChannelLink || "");
  const [telegramSupportLink, setTelegramSupportLink] = useState(globalSettings?.telegramSupportLink || "");
  const [telegramUsername, setTelegramUsername] = useState(globalSettings?.telegramUsername || "");
  const [instagramLink, setInstagramLink] = useState(globalSettings?.instagramLink || "");
  const [youtubeLink, setYoutubeLink] = useState(globalSettings?.youtubeLink || "");
  const [supportEmail, setSupportEmail] = useState(globalSettings?.supportEmail || "");

  // Branding & Fallback OG Settings
  const [brandLogoUrl, setBrandLogoUrl] = useState(globalSettings?.brandLogoUrl || "");
  const [ogDefaultImageUrl, setOgDefaultImageUrl] = useState(globalSettings?.ogDefaultImageUrl || "");
  const [twitterPreviewImageUrl, setTwitterPreviewImageUrl] = useState(globalSettings?.twitterPreviewImageUrl || "");
  const [defaultCardTitle, setDefaultCardTitle] = useState(globalSettings?.defaultCardTitle || "");
  const [defaultCardDescription, setDefaultCardDescription] = useState(globalSettings?.defaultCardDescription || "");

  const [savingBusinessSettings, setSavingBusinessSettings] = useState(false);
  const [uploadingQrCode, setUploadingQrCode] = useState(false);
  const [qrCodeProgress, setQrCodeProgress] = useState<number | null>(null);

  const [uploadingBrandLogo, setUploadingBrandLogo] = useState(false);
  const [brandLogoProgress, setBrandLogoProgress] = useState<number | null>(null);

  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const [ogImageProgress, setOgImageProgress] = useState<number | null>(null);

  const [uploadingTwitterImage, setUploadingTwitterImage] = useState(false);
  const [twitterImageProgress, setTwitterImageProgress] = useState<number | null>(null);

  // Web V3: Hero Orbit and Homepage Settings States
  const [hpSubSection, setHpSubSection] = useState<"general" | "orbit" | "v3-animations">("general");
  const [orbitSettingsTab, setOrbitSettingsTab] = useState<"catalog" | "configuration">("configuration");
  const [dbHomepageSettings, setDbHomepageSettings] = useState<HomepageSettings | null>(null);
  const [dbHeroOrbitItems, setDbHeroOrbitItems] = useState<HeroOrbitItem[]>([]);
  
  // Local Form state for Homepage Settings
  const [hpEnableOrbitAnimation, setHpEnableOrbitAnimation] = useState(true);
  const [hpEnableOrbitGlow, setHpEnableOrbitGlow] = useState(true);
  const [hpEnableParticleBackground, setHpEnableParticleBackground] = useState(true);
  const [hpEnableParallax, setHpEnableParallax] = useState(true);
  const [hpEnableHoverEffects, setHpEnableHoverEffects] = useState(true);
  const [hpEnableAutoRotation, setHpEnableAutoRotation] = useState(true);
  const [hpOrbitSpeed, setHpOrbitSpeed] = useState<"Slow" | "Normal" | "Fast" | "Custom">("Normal");
  const [hpCustomOrbitSpeed, setHpCustomOrbitSpeed] = useState(30);
  const [hpCenterLogoType, setHpCenterLogoType] = useState<"upload" | "url" | "course">("url");
  const [hpCenterLogoUrl, setHpCenterLogoUrl] = useState("/brand_logo.jpg");
  const [hpMainHeading, setHpMainHeading] = useState("");
  const [hpSubHeading, setHpSubHeading] = useState("");
  const [hpCtaButtonText, setHpCtaButtonText] = useState("");
  const [hpCtaButtonLink, setHpCtaButtonLink] = useState("");
  
  const [hpAnimationsEnabled, setHpAnimationsEnabled] = useState(true);
  const [hpAnimationIntensity, setHpAnimationIntensity] = useState<"low" | "medium" | "high">("medium");
  const [hpPageTransitionsEnabled, setHpPageTransitionsEnabled] = useState(true);
  const [hpCounterAnimationsEnabled, setHpCounterAnimationsEnabled] = useState(true);
  const [hpBackgroundEffectsEnabled, setHpBackgroundEffectsEnabled] = useState(true);
  const [hpCustomCursorEnabled, setHpCustomCursorEnabled] = useState(false);
  const [savingHpSettings, setSavingHpSettings] = useState(false);

  // Floating course cards and custom orbit settings states
  const [hpOrbitRadius, setHpOrbitRadius] = useState(175);
  const [hpOrbitCardSize, setHpOrbitCardSize] = useState(76);
  const [hpOrbitGlowIntensity, setHpOrbitGlowIntensity] = useState<"low" | "medium" | "high">("medium");

  const [hpOrbitImage1, setHpOrbitImage1] = useState("");
  const [hpOrbitImage2, setHpOrbitImage2] = useState("");
  const [hpOrbitImage3, setHpOrbitImage3] = useState("");
  const [hpOrbitImage4, setHpOrbitImage4] = useState("");

  const [hpOrbitImageType1, setHpOrbitImageType1] = useState<"upload" | "url">("url");
  const [hpOrbitImageType2, setHpOrbitImageType2] = useState<"upload" | "url">("url");
  const [hpOrbitImageType3, setHpOrbitImageType3] = useState<"upload" | "url">("url");
  const [hpOrbitImageType4, setHpOrbitImageType4] = useState<"upload" | "url">("url");

  const [hpOrbitLabel1, setHpOrbitLabel1] = useState("YouTube Audience Growth");
  const [hpOrbitLabel2, setHpOrbitLabel2] = useState("Artificial Intelligence");
  const [hpOrbitLabel3, setHpOrbitLabel3] = useState("Cinema Video Production");
  const [hpOrbitLabel4, setHpOrbitLabel4] = useState("Global Freelance Pipelines");

  const [hpOrbitLink1, setHpOrbitLink1] = useState("youtube-automation");
  const [hpOrbitLink2, setHpOrbitLink2] = useState("self-operative-ai-mastery");
  const [hpOrbitLink3, setHpOrbitLink3] = useState("cinema-grade-premiere-pro");
  const [hpOrbitLink4, setHpOrbitLink4] = useState("modern-freelancing");

  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);

  const handleOrbitImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, cardIndex: 1 | 2 | 3 | 4) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(fileExt || "");
    if (!isImage) {
      showToast("Error: Selected file is not a supported image.");
      return;
    }

    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxBytes) {
      showToast("File is too large (max 2MB).");
      return;
    }

    setUploadingImageIndex(cardIndex);
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const rawBase64 = event.target.result as string;
        try {
          const compressed = await compressImage(rawBase64, 400, 400, 0.8);
          
          if (cardIndex === 1) setHpOrbitImage1(compressed);
          else if (cardIndex === 2) setHpOrbitImage2(compressed);
          else if (cardIndex === 3) setHpOrbitImage3(compressed);
          else if (cardIndex === 4) setHpOrbitImage4(compressed);

          if (user && user.uid !== "demo_admin_uid") {
            const timestamp = Date.now();
            const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, "_");
            const storageRef = ref(storage, `hero_orbit/course_card_${cardIndex}_${timestamp}_${cleanFileName}.${fileExt}`);
            const optimizedBlob = base64ToBlob(compressed);
            
            const uploadTask = uploadBytesResumable(storageRef, optimizedBlob);
            uploadTask.on(
              "state_changed",
              null,
              (err) => {
                console.warn(`Bypassed storage for card ${cardIndex}, kept base64:`, err);
                setUploadingImageIndex(null);
              },
              async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                if (cardIndex === 1) setHpOrbitImage1(url);
                else if (cardIndex === 2) setHpOrbitImage2(url);
                else if (cardIndex === 3) setHpOrbitImage3(url);
                else if (cardIndex === 4) setHpOrbitImage4(url);
                setUploadingImageIndex(null);
                showToast(`Course card ${cardIndex} image uploaded successfully!`);
              }
            );
          } else {
            setUploadingImageIndex(null);
            showToast(`Course card ${cardIndex} image processed successfully!`);
          }
        } catch (compressErr) {
          console.error("Compression failed:", compressErr);
          setUploadingImageIndex(null);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Orbit Item Modal states
  const [showOrbitModal, setShowOrbitModal] = useState(false);
  const [editingOrbitItem, setEditingOrbitItem] = useState<HeroOrbitItem | null>(null);
  
  // Orbit Item Form states
  const [orbitTitle, setOrbitTitle] = useState("");
  const [orbitImageSourceType, setOrbitImageSourceType] = useState<"course" | "external" | "upload">("course");
  const [orbitCourseId, setOrbitCourseId] = useState("");
  const [orbitExternalImageUrl, setOrbitExternalImageUrl] = useState("");
  const [orbitUploadedImage, setOrbitUploadedImage] = useState(""); 
  const [orbitDescription, setOrbitDescription] = useState("");
  const [orbitRingAssignment, setOrbitRingAssignment] = useState<"Ring 1" | "Ring 2" | "Ring 3">("Ring 1");
  const [orbitClickActionType, setOrbitClickActionType] = useState<"course" | "external" | "blog" | "none">("course");
  const [orbitTargetSlug, setOrbitTargetSlug] = useState("");
  const [orbitDisplayOrder, setOrbitDisplayOrder] = useState(1);
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  const [uploadingOrbitImage, setUploadingOrbitImage] = useState(false);


  // Synchronize dynamic homepage settings with loaded values
  useEffect(() => {
    if (dbHomepageSettings) {
      setHpEnableOrbitAnimation(dbHomepageSettings.enableOrbitAnimation ?? true);
      setHpEnableOrbitGlow(dbHomepageSettings.enableOrbitGlow ?? true);
      setHpEnableParticleBackground(dbHomepageSettings.enableParticleBackground ?? true);
      setHpEnableParallax(dbHomepageSettings.enableParallax ?? true);
      setHpEnableHoverEffects(dbHomepageSettings.enableHoverEffects ?? true);
      setHpEnableAutoRotation(dbHomepageSettings.enableAutoRotation ?? true);
      setHpOrbitSpeed(dbHomepageSettings.orbitSpeed ?? "Normal");
      setHpCustomOrbitSpeed(dbHomepageSettings.customOrbitSpeed ?? 30);
      setHpCenterLogoType(dbHomepageSettings.centerLogoType ?? "url");
      setHpCenterLogoUrl(dbHomepageSettings.centerLogoUrl ?? "/brand_logo.jpg");
      setHpMainHeading(dbHomepageSettings.mainHeading ?? "Build Skills For Tomorrow's Economy");
      setHpSubHeading(dbHomepageSettings.subHeading ?? "Discover premium learning resources in AI, Video Editing, Freelancing, YouTube Audience Building, and modern Digital Businesses.");
      setHpCtaButtonText(dbHomepageSettings.ctaButtonText ?? "Explore Premium Courses");
      setHpCtaButtonLink(dbHomepageSettings.ctaButtonLink ?? "/courses");
      
      setHpAnimationsEnabled(dbHomepageSettings.animationsEnabled ?? true);
      setHpAnimationIntensity(dbHomepageSettings.animationIntensity ?? "medium");
      setHpPageTransitionsEnabled(dbHomepageSettings.pageTransitionsEnabled ?? true);
      setHpCounterAnimationsEnabled(dbHomepageSettings.counterAnimationsEnabled ?? true);
      setHpBackgroundEffectsEnabled(dbHomepageSettings.backgroundEffectsEnabled ?? true);
      setHpCustomCursorEnabled(dbHomepageSettings.customCursorEnabled ?? false);

      setHpOrbitRadius(dbHomepageSettings.orbitRadius ?? 175);
      setHpOrbitCardSize(dbHomepageSettings.orbitCardSize ?? 76);
      setHpOrbitGlowIntensity(dbHomepageSettings.orbitGlowIntensity ?? "medium");

      setHpOrbitImage1(dbHomepageSettings.orbitImage1 ?? "");
      setHpOrbitImage2(dbHomepageSettings.orbitImage2 ?? "");
      setHpOrbitImage3(dbHomepageSettings.orbitImage3 ?? "");
      setHpOrbitImage4(dbHomepageSettings.orbitImage4 ?? "");

      setHpOrbitImageType1(dbHomepageSettings.orbitImageType1 ?? "url");
      setHpOrbitImageType2(dbHomepageSettings.orbitImageType2 ?? "url");
      setHpOrbitImageType3(dbHomepageSettings.orbitImageType3 ?? "url");
      setHpOrbitImageType4(dbHomepageSettings.orbitImageType4 ?? "url");

      setHpOrbitLabel1(dbHomepageSettings.orbitLabel1 ?? "YouTube Audience Growth");
      setHpOrbitLabel2(dbHomepageSettings.orbitLabel2 ?? "Artificial Intelligence");
      setHpOrbitLabel3(dbHomepageSettings.orbitLabel3 ?? "Cinema Video Production");
      setHpOrbitLabel4(dbHomepageSettings.orbitLabel4 ?? "Global Freelance Pipelines");

      setHpOrbitLink1(dbHomepageSettings.orbitLink1 ?? "youtube-automation");
      setHpOrbitLink2(dbHomepageSettings.orbitLink2 ?? "self-operative-ai-mastery");
      setHpOrbitLink3(dbHomepageSettings.orbitLink3 ?? "cinema-grade-premiere-pro");
      setHpOrbitLink4(dbHomepageSettings.orbitLink4 ?? "modern-freelancing");
    } else {
      // Set baseline values
      setHpMainHeading("Build Skills For Tomorrow's Economy");
      setHpSubHeading("Discover premium learning resources in AI, Video Editing, Freelancing, YouTube Audience Building, and modern Digital Businesses.");
      setHpCtaButtonText("Explore Premium Courses");
      setHpCtaButtonLink("/courses");
      setHpCenterLogoUrl("/brand_logo.jpg");
      
      setHpEnableOrbitAnimation(true);
      setHpEnableOrbitGlow(true);
      setHpEnableParticleBackground(true);
      setHpEnableParallax(true);
      setHpEnableHoverEffects(true);
      setHpEnableAutoRotation(true);
      setHpOrbitSpeed("Normal");
      setHpCustomOrbitSpeed(30);
      setHpCenterLogoType("url");
      
      setHpAnimationsEnabled(true);
      setHpAnimationIntensity("medium");
      setHpPageTransitionsEnabled(true);
      setHpCounterAnimationsEnabled(true);
      setHpBackgroundEffectsEnabled(true);
      setHpCustomCursorEnabled(false);

      setHpOrbitRadius(175);
      setHpOrbitCardSize(76);
      setHpOrbitGlowIntensity("medium");

      setHpOrbitImage1("");
      setHpOrbitImage2("");
      setHpOrbitImage3("");
      setHpOrbitImage4("");

      setHpOrbitImageType1("url");
      setHpOrbitImageType2("url");
      setHpOrbitImageType3("url");
      setHpOrbitImageType4("url");

      setHpOrbitLabel1("YouTube Audience Growth");
      setHpOrbitLabel2("Artificial Intelligence");
      setHpOrbitLabel3("Cinema Video Production");
      setHpOrbitLabel4("Global Freelance Pipelines");

      setHpOrbitLink1("youtube-automation");
      setHpOrbitLink2("self-operative-ai-mastery");
      setHpOrbitLink3("cinema-grade-premiere-pro");
      setHpOrbitLink4("modern-freelancing");
    }
  }, [dbHomepageSettings]);

  // Synchronize form states when globalSettings loads or gets updated remotely
  useEffect(() => {
    if (globalSettings) {
      setUpiId(globalSettings.upiId || "");
      setUpiAccountName(globalSettings.upiAccountName || "");
      setUpiQrCode(globalSettings.upiQrCode || "");
      setPaymentInstructions(globalSettings.paymentInstructions || "");
      setTelegramChannelLink(globalSettings.telegramChannelLink || "");
      setTelegramSupportLink(globalSettings.telegramSupportLink || "");
      setTelegramUsername(globalSettings.telegramUsername || "");
      setInstagramLink(globalSettings.instagramLink || "");
      setYoutubeLink(globalSettings.youtubeLink || "");
      setSupportEmail(globalSettings.supportEmail || "");
      setBrandLogoUrl(globalSettings.brandLogoUrl || "");
      setOgDefaultImageUrl(globalSettings.ogDefaultImageUrl || "");
      setTwitterPreviewImageUrl(globalSettings.twitterPreviewImageUrl || "");
      setDefaultCardTitle(globalSettings.defaultCardTitle || "");
      setDefaultCardDescription(globalSettings.defaultCardDescription || "");
    }
  }, [globalSettings]);

  // QR Code upload, replace & preview
  const handleQrCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview instantly with pre-compression
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const rawBase64 = event.target.result as string;
        try {
          // Compress the QR code to 600x600 at 0.75 quality for super crisp yet ultra-compact scan compatibility
          const compressed = await compressImage(rawBase64, 600, 600, 0.75);
          setUpiQrCode(compressed);

          // If real logged in admin and Firebase storage is active, upload to cloud
          if (user && user.uid !== "demo_admin_uid") {
            setUploadingQrCode(true);
            setQrCodeProgress(0);
            try {
              const fileExt = file.name.split('.').pop() || 'png';
              const storageRef = ref(storage, `settings/qr_code_${Date.now()}.${fileExt === "png" ? "png" : "jpg"}`);
              
              const optimizedBlob = base64ToBlob(compressed);
              const uploadTask = uploadBytesResumable(storageRef, optimizedBlob);

              const runUpload = () => {
                return new Promise<string>((resolveUpload, rejectUpload) => {
                  let timedOut = false;
                  const timeoutId = setTimeout(() => {
                    timedOut = true;
                    try {
                      uploadTask.cancel();
                    } catch (e) {}
                    rejectUpload(new Error("Firebase Storage upload timed out. Bypassing upload and falling back to ultra-optimized inline image representation."));
                  }, 3500);

                  uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                      if (timedOut) return;
                      const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                      setQrCodeProgress(pct);
                    },
                    (error) => {
                      if (timedOut) return;
                      clearTimeout(timeoutId);
                      rejectUpload(error);
                    },
                    async () => {
                      if (timedOut) return;
                      clearTimeout(timeoutId);
                      try {
                        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                        resolveUpload(downloadUrl);
                      } catch (urlError) {
                        rejectUpload(urlError);
                      }
                    }
                  );
                });
              };

              try {
                const downloadUrl = await runUpload();
                setUpiQrCode(downloadUrl);
                showToast("QR Code uploaded for storage successfully! Click Save Settings to persist.");
              } catch (uploadError: any) {
                console.warn("Storage upload bypassed (blocked or unconfigured). Kept optimized local base64:", uploadError);
                showToast("Storage cloud upload bypassed: Kept optimized local base64. Ready to Save!");
              } finally {
                setUploadingQrCode(false);
                setQrCodeProgress(null);
              }
            } catch (err: any) {
              console.error("QR Code upload exception:", err);
              setUploadingQrCode(false);
              setQrCodeProgress(null);
            }
          } else {
            showToast("Demo Mode: QR Code preview registered locally. Click Save Settings to persist in browser session!");
          }
        } catch (compressErr) {
          console.error("QR Code compression error:", compressErr);
          setUpiQrCode(rawBase64);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Brand Logo upload, replace & preview
  const handleBrandLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const rawBase64 = event.target.result as string;
        try {
          const compressed = await compressImage(rawBase64, 500, 500, 0.85);
          setBrandLogoUrl(compressed);

          if (user && user.uid !== "demo_admin_uid") {
            setUploadingBrandLogo(true);
            setBrandLogoProgress(0);
            try {
              const fileExt = file.name.split('.').pop() || 'png';
              const storageRef = ref(storage, `settings/brand_logo_${Date.now()}.${fileExt === "png" ? "png" : "jpg"}`);
              const optimizedBlob = base64ToBlob(compressed);
              const uploadTask = uploadBytesResumable(storageRef, optimizedBlob);

              uploadTask.on(
                "state_changed",
                (snapshot) => {
                  const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                  setBrandLogoProgress(pct);
                },
                (error) => {
                  console.error("Brand Logo upload failed:", error);
                  showToast("Storage cloud upload bypassed: Kept optimized local base64. Ready to Save!");
                  setUploadingBrandLogo(false);
                  setBrandLogoProgress(null);
                },
                async () => {
                  try {
                    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    setBrandLogoUrl(downloadUrl);
                    showToast("Brand Logo uploaded successfully! Click Save Settings to persist.");
                  } catch (urlError) {
                    console.error("Get Download URL failed:", urlError);
                  } finally {
                    setUploadingBrandLogo(false);
                    setBrandLogoProgress(null);
                  }
                }
              );
            } catch (err: any) {
              console.error("Brand Logo upload Exception:", err);
              setUploadingBrandLogo(false);
              setBrandLogoProgress(null);
            }
          } else {
            showToast("Demo Mode: Brand Logo registered locally. Click Save Settings to persist in browser session!");
          }
        } catch (compressErr) {
          setBrandLogoUrl(rawBase64);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // OG Default Image upload, replace & preview
  const handleOgDefaultImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const rawBase64 = event.target.result as string;
        try {
          const compressed = await compressImage(rawBase64, 1200, 630, 0.85);
          setOgDefaultImageUrl(compressed);

          if (user && user.uid !== "demo_admin_uid") {
            setUploadingOgImage(true);
            setOgImageProgress(0);
            try {
              const fileExt = file.name.split('.').pop() || 'jpg';
              const storageRef = ref(storage, `settings/og_default_${Date.now()}.${fileExt === "png" ? "png" : "jpg"}`);
              const optimizedBlob = base64ToBlob(compressed);
              const uploadTask = uploadBytesResumable(storageRef, optimizedBlob);

              uploadTask.on(
                "state_changed",
                (snapshot) => {
                  const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                  setOgImageProgress(pct);
                },
                (error) => {
                  console.error("OG default upload failed:", error);
                  showToast("Storage cloud upload bypassed: Kept optimized local base64. Ready to Save!");
                  setUploadingOgImage(false);
                  setOgImageProgress(null);
                },
                async () => {
                  try {
                    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    setOgDefaultImageUrl(downloadUrl);
                    showToast("OG Default Image uploaded successfully! Click Save Settings to persist.");
                  } catch (urlError) {
                    console.error("Get Download URL failed:", urlError);
                  } finally {
                    setUploadingOgImage(false);
                    setOgImageProgress(null);
                  }
                }
              );
            } catch (err: any) {
              console.error("OG Default upload Exception:", err);
              setUploadingOgImage(false);
              setOgImageProgress(null);
            }
          } else {
            showToast("Demo Mode: OG Default Image registered locally. Click Save Settings to persist!");
          }
        } catch (compressErr) {
          setOgDefaultImageUrl(rawBase64);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Twitter Preview Image upload, replace & preview
  const handleTwitterPreviewImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const rawBase64 = event.target.result as string;
        try {
          const compressed = await compressImage(rawBase64, 1200, 630, 0.85);
          setTwitterPreviewImageUrl(compressed);

          if (user && user.uid !== "demo_admin_uid") {
            setUploadingTwitterImage(true);
            setTwitterImageProgress(0);
            try {
              const fileExt = file.name.split('.').pop() || 'jpg';
              const storageRef = ref(storage, `settings/twitter_preview_${Date.now()}.${fileExt === "png" ? "png" : "jpg"}`);
              const optimizedBlob = base64ToBlob(compressed);
              const uploadTask = uploadBytesResumable(storageRef, optimizedBlob);

              uploadTask.on(
                "state_changed",
                (snapshot) => {
                  const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                  setTwitterImageProgress(pct);
                },
                (error) => {
                  console.error("Twitter image upload failed:", error);
                  showToast("Storage cloud upload bypassed: Kept optimized local base64. Ready to Save!");
                  setUploadingTwitterImage(false);
                  setTwitterImageProgress(null);
                },
                async () => {
                  try {
                    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    setTwitterPreviewImageUrl(downloadUrl);
                    showToast("Twitter Preview Image uploaded successfully! Click Save Settings to persist.");
                  } catch (urlError) {
                    console.error("Get Download URL failed:", urlError);
                  } finally {
                    setUploadingTwitterImage(false);
                    setTwitterImageProgress(null);
                  }
                }
              );
            } catch (err: any) {
              console.error("Twitter upload Exception:", err);
              setUploadingTwitterImage(false);
              setTwitterImageProgress(null);
            }
          } else {
            showToast("Demo Mode: Twitter Preview Image registered locally. Click Save Settings to persist!");
          }
        } catch (compressErr) {
          setTwitterPreviewImageUrl(rawBase64);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Validations
  const validateTelegramUrl = (url: string) => {
    if (!url) return true;
    return url.startsWith("https://t.me/");
  };

  const validateUpiId = (upi: string) => {
    if (!upi) return true;
    return upi.includes("@") && upi.trim().length > 3;
  };

  const validateEmail = (emailStr: string) => {
    if (!emailStr) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  // Save Settings
  const handleSaveBusinessSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast("Unauthorized: You do NOT have administrative access privileges.");
      return;
    }

    if (!validateUpiId(upiId)) {
      showToast("Validation Error: UPI ID must contain an '@' sign (e.g. digitalcoursesbay@upi).");
      return;
    }

    if (!validateTelegramUrl(telegramChannelLink)) {
      showToast("Validation Error: Telegram Channel Link must start with 'https://t.me/'.");
      return;
    }

    if (!validateTelegramUrl(telegramSupportLink)) {
      showToast("Validation Error: Telegram Support Link must start with 'https://t.me/'.");
      return;
    }

    if (!validateEmail(supportEmail)) {
      showToast("Validation Error: Support Email must be a valid email format.");
      return;
    }

    setSavingBusinessSettings(true);
    try {
      const payload = {
        upiId: upiId.trim(),
        upiAccountName: upiAccountName.trim(),
        upiQrCode: upiQrCode,
        paymentInstructions: paymentInstructions.trim(),
        telegramChannelLink: telegramChannelLink.trim(),
        telegramSupportLink: telegramSupportLink.trim(),
        telegramUsername: telegramUsername.trim(),
        instagramLink: instagramLink.trim(),
        youtubeLink: youtubeLink.trim(),
        supportEmail: supportEmail.trim(),
        brandLogoUrl: brandLogoUrl.trim(),
        ogDefaultImageUrl: ogDefaultImageUrl.trim(),
        twitterPreviewImageUrl: twitterPreviewImageUrl.trim(),
        defaultCardTitle: defaultCardTitle.trim(),
        defaultCardDescription: defaultCardDescription.trim()
      };

      await updateGlobalSettings(payload);
      showToast("Global Business Settings saved and synchronized instantly!");
    } catch (err: any) {
      console.error("Save global settings error:", err);
      showToast(`Save failed: ${err.message || String(err)}`);
    } finally {
      setSavingBusinessSettings(false);
    }
  };


  // Administrative Blog management states
  const [blogsList, setBlogsList] = useState<any[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any | null>(null);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogSlug, setBlogSlug] = useState("");
  const [blogMetaTitle, setBlogMetaTitle] = useState("");
  const [blogMetaDescription, setBlogMetaDescription] = useState("");
  const [blogFeaturedImage, setBlogFeaturedImage] = useState("");
  const [blogCategory, setBlogCategory] = useState("AI & Future Tech");
  const [blogContent, setBlogContent] = useState("");
  const [blogAuthor, setBlogAuthor] = useState("Admin Mentor");
  const [blogPublishDate, setBlogPublishDate] = useState("");
  const [blogKeywords, setBlogKeywords] = useState("");
  const [blogCanonicalUrl, setBlogCanonicalUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [blogError, setBlogError] = useState("");

  // Promo Coupon management states
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponType, setNewCouponType] = useState<"percentage" | "fixed">("percentage");
  const [newCouponValue, setNewCouponValue] = useState<number>(0);
  const [newCouponIsActive, setNewCouponIsActive] = useState<boolean>(true);
  const [newCouponMinOrderValue, setNewCouponMinOrderValue] = useState<string>("");
  const [newCouponExpiresAt, setNewCouponExpiresAt] = useState<string>("");
  const [couponSubmitting, setCouponSubmitting] = useState(false);

  // Administrative User management states
  const [usersList, setUsersList] = useState<any[]>([]);
  const [courseSharesList, setCourseSharesList] = useState<any[]>([]);
  const [courseReferralsList, setCourseReferralsList] = useState<any[]>([]);
  const [allCartItemsList, setAllCartItemsList] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [viewingCrmUser, setViewingCrmUser] = useState<any | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [backfillingProgress, setBackfillingProgress] = useState(false);

  const getUserEcommerceStats = (usr: any) => {
    if (!usr) return { cartCount: 0, wishlistCount: 0, orderCount: 0, amountSpent: 0, userCartItems: [], userOrders: [], completedOrders: [] };
    const userUid = usr.uid || usr.id;
    const userEmail = usr.email ? usr.email.toLowerCase() : "";

    // 1. Cart Items
    const userCartItems = allCartItemsList.filter(item => 
      item.userId === userUid || (userEmail && item.userEmail && item.userEmail.toLowerCase() === userEmail)
    );
    const cartCount = userCartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

    // 2. Wishlist Items
    const wishlistCount = usr.wishlistItems ? usr.wishlistItems.length : 0;

    // 3. Total Placed Orders
    const userOrders = orders.filter(o => 
      o.userId === userUid || (userEmail && o.email && o.email.toLowerCase() === userEmail)
    );
    const orderCount = userOrders.length;

    // 4. Total Amount Spent (Sum of completed orders)
    const completedOrders = userOrders.filter(o => 
      o.status === "Verified" || o.status === "Delivered" || o.status === "Approved" || o.status === "approved"
    );
    const amountSpent = completedOrders.reduce((acc, o) => acc + Number(o.amount || o.price || 0), 0);

    return { 
      cartCount, 
      wishlistCount, 
      orderCount, 
      amountSpent, 
      userCartItems, 
      userOrders, 
      completedOrders 
    };
  };

  const triggerCrmHistoricalBackfill = async () => {
    setBackfillingProgress(true);
    showToast("Starting CRM Database Verification and Historical Backfill...");
    try {
      let count = 0;
      for (const usr of usersList) {
        const stats = getUserEcommerceStats(usr);
        const sorted = [...stats.completedOrders].sort((a, b) => {
          const ta = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
          const tb = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
          return ta - tb;
        });
        const lastDate = sorted.length > 0 ? (sorted[sorted.length - 1].createdAt || null) : null;

        const userRef = doc(db, "users", usr.uid || usr.id);
        await updateDoc(userRef, {
          totalOrders: stats.orderCount,
          totalSpent: stats.amountSpent,
          lastPurchaseDate: lastDate,
          updatedAt: serverTimestamp()
        }).catch(err => console.warn(`Failed backfill for student ${usr.id || usr.uid}:`, err));
        count++;
      }
      showToast(`Success: Backfilled database stats for ${count} students in real-time!`);
    } catch (err: any) {
      console.error("Backfilling CRM historical data failed:", err);
      showToast("Backfill synchronization failed. See console for details.");
    } finally {
      setBackfillingProgress(false);
    }
  };

  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userFilterCountry, setUserFilterCountry] = useState("All");
  const [userFilterSignupMethod, setUserFilterSignupMethod] = useState("All");
  const [userFilterVerificationStatus, setUserFilterVerificationStatus] = useState("All");
  
  // Advanced CRM Filter States
  const [userFilterGender, setUserFilterGender] = useState("All");
  const [userFilterAgeGroup, setUserFilterAgeGroup] = useState("All");
  const [userFilterMinRevenue, setUserFilterMinRevenue] = useState("");
  const [userFilterCoursePurchased, setUserFilterCoursePurchased] = useState("All");
  const [userFilterCartActivity, setUserFilterCartActivity] = useState("All");
  const [userFilterReviewActivity, setUserFilterReviewActivity] = useState("All");
  const [userFilterStatus, setUserFilterStatus] = useState("All");
  const [userFilterSignupDateStart, setUserFilterSignupDateStart] = useState("");
  const [userFilterSignupDateEnd, setUserFilterSignupDateEnd] = useState("");
  const [userFilterSegment, setUserFilterSegment] = useState("All");
  
  // CRM Sorting and Pagination States
  const [crmActiveSort, setCrmActiveSort] = useState<"name" | "revenue" | "orders" | "activity">("name");
  const [crmSortDirection, setCrmSortDirection] = useState<"asc" | "desc">("desc");
  const [crmCurrentPage, setCrmCurrentPage] = useState(1);
  const [crmPageSize, setCrmPageSize] = useState(10);
  
  // CRM Drilldown & Search States
  const [crmSubTab, setCrmSubTab] = useState<"analytics" | "directory" | "meta" | "countries">("analytics");
  const [crmAgeGroupSelectedForDrilldown, setCrmAgeGroupSelectedForDrilldown] = useState<string | null>(null);
  const [crmActiveCountrySearch, setCrmActiveCountrySearch] = useState("");
  const [crmCountrySort, setCrmCountrySort] = useState<"revenue" | "users">("revenue");

  const [activityLogsList, setActivityLogsList] = useState<any[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalForm, setUserModalForm] = useState({
    fullName: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    country: ""
  });

  // Administrative email authorizations states
  const [adminEmailsList, setAdminEmailsList] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adminEmailSubmitting, setAdminEmailSubmitting] = useState(false);
  const [adminListLoading, setAdminListLoading] = useState(true);

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDanger?: boolean;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const downloadScreenshot = async (url: string) => {
    try {
      if (url.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = url;
        a.download = "payment_proof_screenshot.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "payment_proof_screenshot.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Could not download screenshot:", err);
      window.open(url, "_blank");
    }
  };

  // Promo Coupons & Dynamic Email Access administrative handlers
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim() || newCouponValue < 0) {
      showToast("Error: Code is empty or discount value is invalid!");
      return;
    }

    setCouponSubmitting(true);
    const upperCode = newCouponCode.trim().toUpperCase();

    try {
      const couponDocRef = doc(db, "coupons", upperCode);

      const payload: any = {
        code: upperCode,
        type: newCouponType,
        value: Number(newCouponValue),
        isActive: newCouponIsActive,
        createdAt: serverTimestamp(),
        usedCount: 0,
        totalSales: 0
      };

      if (newCouponMinOrderValue.toString().trim()) {
        payload.minOrderValue = Number(newCouponMinOrderValue);
      }
      if (newCouponExpiresAt.toString().trim()) {
        payload.expiresAt = newCouponExpiresAt;
      }

      await setDoc(couponDocRef, payload);
      showToast(`Promo Code "${upperCode}" successfully set!`);

      // Reset Form fields
      setNewCouponCode("");
      setNewCouponValue(0);
      setNewCouponMinOrderValue("");
      setNewCouponExpiresAt("");
      setNewCouponIsActive(true);
    } catch (err: any) {
      console.error("Create coupon error:", err);
      showToast(`Failed to create promo code: ${err.message || String(err)}`);
    } finally {
      setCouponSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirm Delete Coupon",
      message: `Are you absolutely sure you want to delete promo code "${code}"? Students will immediately lose access to this discount.`,
      confirmLabel: "Delete Coupon",
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "coupons", code));
          showToast(`Coupon "${code}" deleted successfully.`);
        } catch (err: any) {
          console.error("Delete coupon error:", err);
          showToast(`Deletion failed: ${err.message}`);
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  const handleAddAdminEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = newAdminEmail.trim().toLowerCase();
    if (!targetEmail || !validateEmail(targetEmail)) {
      showToast("Error: Please provide a valid email format.");
      return;
    }

    setAdminEmailSubmitting(true);
    const docPath = `adminUsers/${targetEmail}`;
    try {
      const emailDocRef = doc(db, "adminUsers", targetEmail);
      let docSnap;
      let isOffline = false;
      try {
        docSnap = await getDoc(emailDocRef);
      } catch (getErr: any) {
        if (getErr?.message?.includes("offline") || getErr?.message?.includes("client is offline")) {
          console.warn("getDoc failed because client is offline. Trying getDocFromServer...");
          try {
            docSnap = await getDocFromServer(emailDocRef);
          } catch (serverErr: any) {
            console.warn("getDocFromServer also failed because client is offline. Falling back to direct queue.");
            isOffline = true;
          }
        } else {
          throw getErr;
        }
      }

      if (!isOffline && docSnap && (docSnap.exists() || targetEmail === "digitalcoursesbay@gmail.com")) {
        showToast("User already has admin access");
        setAdminEmailSubmitting(false);
        return;
      }

      const payload = {
        email: targetEmail,
        role: "admin",
        addedBy: user?.email || "digitalcoursesbay@gmail.com",
        createdAt: serverTimestamp()
      };

      await setDoc(emailDocRef, payload);
      if (isOffline) {
        showToast("System currently offline. Target user access will sync once reconnected!");
      } else {
        showToast("Admin access granted successfully");
      }
      setNewAdminEmail("");
    } catch (err: any) {
      console.error("Add admin user error:", err);
      handleFirestoreError(err, OperationType.WRITE, docPath);
    } finally {
      setAdminEmailSubmitting(false);
    }
  };

  const handleDeleteAdminEmail = async (emailId: string) => {
    const targetEmail = emailId.trim().toLowerCase();
    if (targetEmail === "digitalcoursesbay@gmail.com") {
      showToast("Critical: Founder account can never be deleted!");
      return;
    }
    if (targetEmail === user?.email?.toLowerCase()) {
      showToast("Critical: You cannot revoke your own administrative privileges!");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Revoke Admin Access",
      message: `Are you sure you want to revoke administrative access from "${emailId}"? They will instantly lose entry privileges to this dashboard panel.`,
      confirmLabel: "Revoke Access",
      isDanger: true,
      onConfirm: async () => {
        const docPath = `adminUsers/${targetEmail}`;
        try {
          await deleteDoc(doc(db, "adminUsers", targetEmail));
          showToast("Admin access revoked successfully");
        } catch (err: any) {
          console.error("Delete admin user error:", err);
          handleFirestoreError(err, OperationType.DELETE, docPath);
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load Admin Data from all collections on mount/refresh
  const fetchAllAdminData = async () => {
    setLoading(true);

    if (user?.uid === "demo_admin_uid") {
      let storedCourses = localStorage.getItem("demo_courses");
      let storedOrders = localStorage.getItem("demo_orders");
      let storedContacts = localStorage.getItem("demo_contacts");

      let currentCourses = fallbackCourses;
      if (storedCourses) {
        try {
          const parsed = JSON.parse(storedCourses);
          currentCourses = parsed.map((c: any) => ({
            ...c,
            createdAt: c.createdAt ? new Date(c.createdAt) : new Date()
          }));
        } catch (_) {
          currentCourses = fallbackCourses;
        }
      } else {
        localStorage.setItem("demo_courses", JSON.stringify(fallbackCourses));
      }

      let currentOrders = fallbackOrders;
      if (storedOrders) {
        try {
          const parsed = JSON.parse(storedOrders);
          currentOrders = parsed.map((o: any) => ({
            ...o,
            createdAt: o.createdAt ? new Date(o.createdAt) : new Date()
          }));
        } catch (_) {
          currentOrders = fallbackOrders;
        }
      } else {
        localStorage.setItem("demo_orders", JSON.stringify(fallbackOrders));
      }

      let currentContacts = fallbackContacts;
      if (storedContacts) {
        try {
          const parsed = JSON.parse(storedContacts);
          currentContacts = parsed.map((m: any) => ({
            ...m,
            createdAt: m.createdAt ? new Date(m.createdAt) : new Date()
          }));
        } catch (_) {
          currentContacts = fallbackContacts;
        }
      } else {
        localStorage.setItem("demo_contacts", JSON.stringify(fallbackContacts));
      }

      let storedSettings = localStorage.getItem("demo_tracking_settings");
      if (storedSettings) {
        try {
          const parsed = JSON.parse(storedSettings);
          setMetaPixelId(parsed.metaPixelId || "");
          setGtmId(parsed.gtmId || "");
          setGa4Id(parsed.ga4Id || "");
          setSearchConsoleVerification(parsed.searchConsoleVerification || "");
          setFacebookDomainVerification(parsed.facebookDomainVerification || "xb9keiie8xdt56l5vy9ozx18inhepe");
        } catch (_) {}
      } else {
        setMetaPixelId("");
        setGtmId("");
        setGa4Id("");
        setSearchConsoleVerification("");
        setFacebookDomainVerification("xb9keiie8xdt56l5vy9ozx18inhepe");
      }

      let storedUsers = localStorage.getItem("demo_users");
      let currentUsers = fallbackUsers;
      if (storedUsers) {
        try {
          const parsed = JSON.parse(storedUsers);
          currentUsers = parsed.map((usr: any) => ({
            ...usr,
            createdAt: usr.createdAt ? new Date(usr.createdAt) : new Date()
          }));
        } catch (_) {
          currentUsers = fallbackUsers;
        }
      } else {
        localStorage.setItem("demo_users", JSON.stringify(fallbackUsers));
      }

      let storedShares = localStorage.getItem("demo_shares");
      let currentShares = [];
      if (storedShares) {
        try {
          currentShares = JSON.parse(storedShares);
        } catch (_) {}
      } else {
        currentShares = [
          { id: "s1", courseId: "master-time-management", courseName: "Master Time Management", userId: "student123", platform: "whatsapp", shareUrl: "https://learn2future.com/course/master-time-management?ref=student123", createdAt: new Date() },
          { id: "s2", courseId: "master-time-management", courseName: "Master Time Management", userId: "student123", platform: "telegram", shareUrl: "https://learn2future.com/course/master-time-management?ref=student123", createdAt: new Date() },
          { id: "s3", courseId: "dark-psychology", courseName: "Dark Psychology", userId: "student456", platform: "copylink", shareUrl: "https://learn2future.com/course/dark-psychology?ref=student456", createdAt: new Date() },
          { id: "s4", courseId: "public-speaking", courseName: "Public Speaking", userId: "student789", platform: "facebook", shareUrl: "https://learn2future.com/course/public-speaking?ref=student789", createdAt: new Date() },
          { id: "s5", courseId: "public-speaking", courseName: "Public Speaking", userId: "student123", platform: "twitter", shareUrl: "https://learn2future.com/course/public-speaking?ref=student123", createdAt: new Date() },
          { id: "s6", courseId: "dark-psychology", courseName: "Dark Psychology", userId: "student123", platform: "linkedin", shareUrl: "https://learn2future.com/course/dark-psychology?ref=student123", createdAt: new Date() },
        ];
        localStorage.setItem("demo_shares", JSON.stringify(currentShares));
      }
      setCourseSharesList(currentShares);

      let storedReferrals = localStorage.getItem("demo_referrals");
      let currentReferrals = [];
      if (storedReferrals) {
        try {
          currentReferrals = JSON.parse(storedReferrals);
        } catch (_) {}
      } else {
        currentReferrals = [
          { id: "r1", courseId: "master-time-management", courseName: "Master Time Management", referrerId: "student123", clickedUserId: "clicker1", createdAt: new Date() },
          { id: "r2", courseId: "master-time-management", courseName: "Master Time Management", referrerId: "student123", clickedUserId: "clicker2", createdAt: new Date() },
          { id: "r3", courseId: "dark-psychology", courseName: "Dark Psychology", referrerId: "student456", clickedUserId: "clicker3", createdAt: new Date() },
          { id: "r4", courseId: "public-speaking", courseName: "Public Speaking", referrerId: "student789", clickedUserId: "clicker4", createdAt: new Date() },
        ];
        localStorage.setItem("demo_referrals", JSON.stringify(currentReferrals));
      }
      setCourseReferralsList(currentReferrals);

      setCourses(currentCourses);
      setOrders(currentOrders);
      setContactMsgs(currentContacts);
      setUsersList(currentUsers);
      setLoading(false);
      return;
    }

    try {
      // Fetch Users
      const usersSnap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
      const listUsers: any[] = [];
      usersSnap.forEach((docSnap) => {
        listUsers.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUsersList(listUsers);
    } catch (e) {
      console.warn("Administrative fetch users error:", e);
      setUsersList([]);
    }

    try {
      // 1. Fetch Courses
      const coursesSnap = await getDocs(query(collection(db, "courses"), orderBy("createdAt", "desc")));
      const coursesList: Course[] = [];
      coursesSnap.forEach((docSnap) => {
        coursesList.push({ id: docSnap.id, ...docSnap.data() } as Course);
      });
      setCourses(coursesList);
    } catch (e) {
      console.warn("Administrative fetch courses warning:", e);
      setCourses([]);
    }

    try {
      // 2. Fetch Orders
      const ordersSnap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
      const ordersList: Order[] = [];
      ordersSnap.forEach((docSnap) => {
        ordersList.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });
      setOrders(ordersList);
    } catch (e) {
      console.warn("Administrative fetch orders error:", e);
      setOrders([]);
    }

    try {
      // 3. Fetch Contact Messages
      const contactsSnap = await getDocs(query(collection(db, "contactMessages"), orderBy("createdAt", "desc")));
      const contactsList: ContactMessage[] = [];
      contactsSnap.forEach((docSnap) => {
        contactsList.push({ id: docSnap.id, ...docSnap.data() } as ContactMessage);
      });
      setContactMsgs(contactsList);
    } catch (e) {
      console.warn("Administrative fetch contacts error:", e);
      setContactMsgs([]);
    }

    try {
      // 3b. Fetch Shares tracking
      const sharesSnap = await getDocs(collection(db, "courseShares"));
      const listShares: any[] = [];
      sharesSnap.forEach((docSnap) => {
        listShares.push({ id: docSnap.id, ...docSnap.data() });
      });
      setCourseSharesList(listShares);
    } catch (e) {
      console.warn("Administrative fetch shares error:", e);
      setCourseSharesList([]);
    }

    try {
      // 3c. Fetch Referrals tracking
      const referralsSnap = await getDocs(collection(db, "courseReferrals"));
      const listReferrals: any[] = [];
      referralsSnap.forEach((docSnap) => {
        listReferrals.push({ id: docSnap.id, ...docSnap.data() });
      });
      setCourseReferralsList(listReferrals);
    } catch (e) {
      console.warn("Administrative fetch referrals error:", e);
      setCourseReferralsList([]);
    }

    try {
      // 4. Fetch Global Tracking Settings from Firestore
      const settingsSnap = await getDoc(doc(db, "settings", "tracking"));
      if (settingsSnap.exists()) {
        const data = settingsSnap.data() as TrackingSettings;
        setMetaPixelId(data.metaPixelId || "");
        setGtmId(data.gtmId || "");
        setGa4Id(data.ga4Id || "");
        setSearchConsoleVerification(data.searchConsoleVerification || "");
        setFacebookDomainVerification(data.facebookDomainVerification || "xb9keiie8xdt56l5vy9ozx18inhepe");
      } else {
        setMetaPixelId("");
        setGtmId("");
        setGa4Id("");
        setSearchConsoleVerification("");
        setFacebookDomainVerification("xb9keiie8xdt56l5vy9ozx18inhepe");
      }
    } catch (e) {
      console.warn("Administrative fetch tracking settings error:", e);
    }

    try {
      // 4b. Fetch Razorpay Payment Gateway settings from Firestore
      const paymentSnap = await getDoc(doc(db, "settings", "paymentGateway"));
      
      const normalizeLocalKey = (key: string) => {
        const trimmed = (key || "").trim();
        if (trimmed.startsWith("zp_test_")) return "rzp_test_" + trimmed.substring(8);
        if (trimmed.startsWith("zp_live_")) return "rzp_live_" + trimmed.substring(8);
        return trimmed;
      };

      if (paymentSnap.exists()) {
        const data = paymentSnap.data();
        setRazorpayKeyId(normalizeLocalKey(data.razorpayKeyId || ""));
        setRazorpayKeySecret(data.razorpayKeySecret || "");
        setRazorpayWebhookSecret(data.razorpayWebhookSecret || "");
        setIsTestMode(data.isTestMode !== false);
        setIsLiveMode(!!data.isLiveMode);
        setEnablePaymentSandbox(data.enablePaymentSandbox !== false);
      } else {
        const stored = localStorage.getItem("demo_payment_settings");
        if (stored) {
          const data = JSON.parse(stored);
          setRazorpayKeyId(normalizeLocalKey(data.razorpayKeyId || ""));
          setRazorpayKeySecret(data.razorpayKeySecret || "");
          setRazorpayWebhookSecret(data.razorpayWebhookSecret || "");
          setIsTestMode(data.isTestMode !== false);
          setIsLiveMode(!!data.isLiveMode);
          setEnablePaymentSandbox(data.enablePaymentSandbox !== false);
        } else {
          setRazorpayKeyId("");
          setRazorpayKeySecret("");
          setRazorpayWebhookSecret("");
          setIsTestMode(true);
          setIsLiveMode(false);
          setEnablePaymentSandbox(true);
        }
      }
    } catch (e) {
      console.warn("Administrative fetch payment gateway settings error:", e);
    }

    // 5. Fetch Blogs
    try {
      setLoadingBlogs(true);
      const blogsSnap = await getDocs(query(collection(db, "blogs"), orderBy("createdAt", "desc")));
      const bList: any[] = [];
      blogsSnap.forEach((docSnap) => {
        bList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setBlogsList(bList);
      setLoadingBlogs(false);
    } catch (e) {
      console.warn("Administrative fetch blogs error:", e);
      setLoadingBlogs(false);
    }

    // 6. Fetch Coupons
    try {
      const couponsSnap = await getDocs(query(collection(db, "coupons"), orderBy("createdAt", "desc")));
      const cList: any[] = [];
      couponsSnap.forEach((docSnap) => {
        cList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setCouponsList(cList);
    } catch (e) {
      console.warn("Administrative fetch coupons error:", e);
    }

    // 7. Fetch Admin Emails (adminUsers)
    try {
      setAdminListLoading(true);
      const adminUsersSnap = await getDocs(query(collection(db, "adminUsers"), orderBy("createdAt", "desc")));
      const eList: any[] = [];
      adminUsersSnap.forEach((docSnap) => {
        eList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAdminEmailsList(eList);
      setAdminListLoading(false);
    } catch (e) {
      console.warn("Administrative fetch admin users error:", e);
      setAdminListLoading(false);
    }

    // 8. Fetch Activity Logs
    try {
      const logsSnap = await getDocs(query(collection(db, "activityLogs"), orderBy("timestamp", "desc"), limit(400)));
      const logs: any[] = [];
      logsSnap.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...docSnap.data() });
      });
      setActivityLogsList(logs);
    } catch (e) {
      console.warn("Administrative fetch activity logs error:", e);
    }

    // 9. Fetch Reviews
    try {
      setLoadingReviews(true);
      const reviewsSnap = await getDocs(query(collection(db, "reviews"), orderBy("createdAt", "desc")));
      const rList: Review[] = [];
      reviewsSnap.forEach((docSnap) => {
        rList.push({ id: docSnap.id, ...docSnap.data() } as Review);
      });
      setReviewsList(rList);
      setLoadingReviews(false);
    } catch (e) {
      console.warn("Administrative fetch reviews error:", e);
      setLoadingReviews(false);
    }

    // 10. Fetch Cart Items
    try {
      const cartSnap = await getDocs(collection(db, "cartItems"));
      const carts: any[] = [];
      cartSnap.forEach((docSnap) => {
        carts.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAllCartItemsList(carts);
    } catch (e) {
      console.warn("Administrative fetch cart items error:", e);
    }

    // 11. Fetch Homepage Settings Document
    try {
      const hpSnap = await getDoc(doc(db, "settings", "homepageSettings"));
      if (hpSnap.exists()) {
        setDbHomepageSettings(hpSnap.data() as HomepageSettings);
      } else {
        setDbHomepageSettings(null);
      }
    } catch (e) {
      console.warn("Administrative fetch homepage settings error:", e);
    }

    // 12. Fetch Hero Orbit Items
    try {
      const colRef = collection(db, "heroOrbitItems");
      const orbitSnap = await getDocs(colRef);
      const itemsList: HeroOrbitItem[] = [];
      orbitSnap.forEach((docSnap) => {
        itemsList.push({ id: docSnap.id, ...docSnap.data() } as HeroOrbitItem);
      });
      itemsList.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setDbHeroOrbitItems(itemsList);
    } catch (e) {
      console.warn("Administrative fetch hero orbit items error:", e);
    }

    // 13. Fetch Affiliate Applications
    try {
      setLoadingAffiliates(true);
      const affiliatesSnap = await getDocs(collection(db, "affiliate_applications"));
      const list: any[] = [];
      affiliatesSnap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAffiliateLists(list);
      setLoadingAffiliates(false);
    } catch (e) {
      console.warn("Administrative fetch affiliates error:", e);
      setLoadingAffiliates(false);
    }

    // 14. Fetch Payout Requests
    try {
      setLoadingPayoutRequests(true);
      const payoutsSnap = await getDocs(collection(db, "payout_requests"));
      const list: any[] = [];
      payoutsSnap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => {
        const dA = a.requestDate?.seconds || 0;
        const dB = b.requestDate?.seconds || 0;
        return dB - dA;
      });
      setAdminPayoutRequests(list);
      setLoadingPayoutRequests(false);
    } catch (e) {
      console.warn("Administrative fetch payout requests error:", e);
      setLoadingPayoutRequests(false);
    }

    // 15. Fetch Payment Logs
    try {
      const paymentLogsSnap = await getDocs(query(collection(db, "paymentLogs"), orderBy("timestamp", "desc"), limit(400)));
      const logs: any[] = [];
      paymentLogsSnap.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...docSnap.data() });
      });
      setPaymentLogsList(logs);
    } catch (e) {
      console.warn("Administrative fetch payment logs error:", e);
    }

    // 16. Fetch Payment Recovery Queue
    try {
      const paymentRecoverySnap = await getDocs(query(collection(db, "paymentRecoveryQueue"), orderBy("createdAt", "desc")));
      const queueList: any[] = [];
      paymentRecoverySnap.forEach((docSnap) => {
        queueList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setPaymentRecoveryQueueList(queueList);
    } catch (e) {
      console.warn("Administrative fetch payment recovery queue error:", e);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllAdminData();
    }
  }, [isAdmin]);

  // Avoid long-lived active realtime Firestore listener channels in production (saves 99% reads)
  useEffect(() => {
    if (!isAdmin) return;

    if (user?.uid === "demo_admin_uid") {
      // In demo mode, load local simulated collections for courses, orders, and contact tickets
      const storedCourses = localStorage.getItem("demo_courses");
      const storedOrders = localStorage.getItem("demo_orders");
      const storedContacts = localStorage.getItem("demo_contacts");
      const storedBlogs = localStorage.getItem("demo_blogs");

      setCourses(storedCourses ? JSON.parse(storedCourses) : fallbackCourses);
      setOrders(storedOrders ? JSON.parse(storedOrders) : fallbackOrders);
      setContactMsgs(storedContacts ? JSON.parse(storedContacts) : fallbackContacts);
      setBlogsList(storedBlogs ? JSON.parse(storedBlogs) : []);
      setLoadingBlogs(false);
    }
  }, [isAdmin, user?.uid]);

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

  // Handle Course thumbnail file selection & Firebase storage uploading
  const handleCourseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadProgress(true);
      setCourseUploadPercent(0);
      setModalError("");
 
      // 1. Strict validation for file type: jpg, jpeg, png
      const fileExt = file.name.split('.').pop()?.toLowerCase() || "";
      const allowedExtensions = ["jpg", "jpeg", "png"];
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
      
      if (!allowedMimeTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
        setModalError("Invalid file format. Only JPG, JPEG, and PNG images are allowed.");
        setUploadProgress(false);
        setCourseUploadPercent(null);
        if (e.target) e.target.value = "";
        return;
      }
 
      // 2. Validate Image Size (Max 2MB)
      const maxBytes = 2 * 1024 * 1024; // 2MB
      if (file.size > maxBytes) {
        setModalError(`The file is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum allowed size is 2MB.`);
        setUploadProgress(false);
        setCourseUploadPercent(null);
        if (e.target) e.target.value = "";
        return;
      }
 
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const rawBase64 = event.target.result as string;
          try {
            // Compress course thumbnail to max 800x800 to ensure compatibility & optimal speed
            const compressed = await compressImage(rawBase64, 800, 800, 0.75);
            setCourseThumbnail(compressed);
            
            if (user && user.uid !== "demo_admin_uid") {
              const timestamp = Date.now();
              const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, "_");
              const extension = fileExt === "png" ? "png" : "jpg";
              const storageRef = ref(storage, `courses/${timestamp}_${cleanFileName}.${extension}`);
              
              const optimizedBlob = base64ToBlob(compressed);
              const uploadTask = uploadBytesResumable(storageRef, optimizedBlob);
              
              const runCourseUpload = () => {
                return new Promise<string>((resolveUpload, rejectUpload) => {
                  let timedOut = false;
                  const timeoutId = setTimeout(() => {
                    timedOut = true;
                    try {
                      uploadTask.cancel();
                    } catch (e) {}
                    rejectUpload(new Error("Firebase Storage upload timed out. Bypassing upload and falling back to ultra-optimized inline image representation."));
                  }, 3500);

                  uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                      if (timedOut) return;
                      const progress = Math.round(
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                      );
                      setCourseUploadPercent(progress);
                    },
                    (error) => {
                      if (timedOut) return;
                      clearTimeout(timeoutId);
                      rejectUpload(error);
                    },
                    async () => {
                      if (timedOut) return;
                      clearTimeout(timeoutId);
                      try {
                        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                        resolveUpload(downloadUrl);
                      } catch (urlError) {
                        rejectUpload(urlError);
                      }
                    }
                  );
                });
              };

              try {
                const downloadUrl = await runCourseUpload();
                setCourseThumbnail(downloadUrl);
                setModalError("");
              } catch (uploadError: any) {
                console.warn("Firebase Storage upload blocked or unconfigured, keeping optimized base64 representation:", uploadError);
                showToast("Storage cloud upload bypassed: Kept optimized local base64. Ready to publish!");
              } finally {
                setUploadProgress(false);
                setCourseUploadPercent(null);
              }
            } else {
              // Demo/local preview
              setUploadProgress(false);
              setCourseUploadPercent(null);
              showToast("Successfully optimized course thumbnail!");
            }
          } catch (compError) {
            console.error("Compression failed, keeping original preview:", compError);
            setCourseThumbnail(rawBase64);
            setUploadProgress(false);
            setCourseUploadPercent(null);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const resetCourseFormState = () => {
    setEditingCourse(null);
    setCourseTitle("");
    setCourseSlug("");
    setCourseCategory("AI Tools");
    setCoursePrice(1499);
    setCourseDescription("");
    setCourseThumbnail("");
    setCourseDeliverableLink("");
    setCourseWelcomeVideoUrl("");
    setCourseDeliveryInstructions("");
    setCourseDeliveryUrl("");

    setCourseInstructorName("");
    setCourseSubCategory("");
    setCourseStatus("Published");
    setCourseIsFeatured(false);
    setCourseIsPopular(false);
    setCourseIsTrending(false);

    setCourseOriginalPrice(0);
    setCourseDiscountPercentage(0);
    setCourseCurrency("INR");
    setCourseIsLimitedTimeOffer(false);

    setCourseBannerImage("");
    setCourseInstructorImage("");
    setCoursePreviewVideoUrl("");
    setCourseShortDescription("");
    setCourseLongDescription("");
    setCourseOverview("");
    setCourseSummary("");
    setCourseWhoIsThisCourseFor("");
    setCoursePrerequisites("");

    setCourseDuration("");
    setCourseVideoHours("");
    setCourseNumberOfLessons(0);
    setCourseNumberOfModules(0);
    setCourseAssignmentsCount(0);
    setCourseProjectsCount(0);
    setCourseQuizCount(0);
    setCourseLanguage("English");
    setCourseSkillLevel("All Levels");
    setCourseCertificateAvailable(true);
    setCourseLifetimeAccess(true);
    setCourseMobileAccess(true);
    setCourseDownloadableResources(true);

    setCourseModules([]);
    setCourseFaqItems([]);

    setCourseSeoTitle("");
    setCourseSeoDescription("");
    setCourseFocusKeyword("");
    setCourseSecondaryKeywords([]);
    setCourseTags([]);
    setCourseCanonicalUrl("");
    setCourseOgTitle("");
    setCourseOgDescription("");
    setCourseTwitterTitle("");
    setCourseTwitterDescription("");
    setCourseSchemaDescription("");

    setCourseBenefits([]);
    setCourseLearningOutcomes([]);
    setCourseRequirements([]);
    setCourseToolsNeeded([]);
    setCourseBonusResources([]);

    setCourseDeliveryLink("");
    setCourseGoogleDriveLink("");
    setCourseTelegramLink("");
    setCoursePrivateResourceLink("");
    setCourseImportantNotes("");
    
    setCourseEditorActiveTab("info");
  };

  // Create or Update Course Handler
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle || !courseDescription || !courseThumbnail || coursePrice < 0) {
      setModalError("Please complete all the input fields, including thumbnail selection.");
      return;
    }

    setUploadProgress(true);
    setModalError("");

    const cleanSlug = courseSlug.trim()
      ? courseSlug.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "")
      : courseTitle.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");

    if (user?.uid === "demo_admin_uid") {
      try {
        let storedCourses = localStorage.getItem("demo_courses");
        let currentCourses: Course[] = storedCourses ? JSON.parse(storedCourses) : [];
        
        const courseId = editingCourse?.id || "course_" + Date.now();
        const coursePayload: Course = {
          id: courseId,
          title: courseTitle,
          category: courseCategory,
          price: Number(coursePrice),
          description: courseDescription,
          thumbnail: courseThumbnail,
          slug: cleanSlug,
          deliverableLink: courseDeliverableLink,
          welcomeVideoUrl: courseWelcomeVideoUrl,
          deliveryInstructions: courseDeliveryInstructions,
          deliveryUrl: courseDeliveryUrl,
          createdAt: editingCourse?.createdAt ? new Date(editingCourse.createdAt) : new Date(),

          instructorName: courseInstructorName || "Aditya Raj Kashyap",
          subCategory: courseSubCategory || courseCategory || "",
          courseStatus: courseStatus || "Published",
          isFeatured: courseIsFeatured,
          isPopular: courseIsPopular,
          isTrending: courseIsTrending,

          originalPrice: Number(courseOriginalPrice) || Math.round(Number(coursePrice) * 2.2),
          discountPercentage: Number(courseDiscountPercentage) || 0,
          currency: courseCurrency || "INR",
          isLimitedTimeOffer: courseIsLimitedTimeOffer,

          bannerImage: courseBannerImage || "",
          instructorImage: courseInstructorImage || "",
          previewVideoUrl: coursePreviewVideoUrl || "",
          shortDescription: courseShortDescription || courseDescription || "",
          longDescription: courseLongDescription || courseDescription || "",
          courseOverview: courseOverview || "",
          courseSummary: courseSummary || "",
          whoIsThisCourseFor: courseWhoIsThisCourseFor || "",
          prerequisites: coursePrerequisites || "",

          courseDuration: courseDuration || "10+ Hours of on-demand sessions",
          videoHours: courseVideoHours || "10",
          numberOfLessons: Number(courseNumberOfLessons) || 28,
          numberOfModules: Number(courseNumberOfModules) || 5,
          assignmentsCount: Number(courseAssignmentsCount) || 0,
          projectsCount: Number(courseProjectsCount) || 0,
          quizCount: Number(courseQuizCount) || 0,
          language: courseLanguage || "English / Bilingual",
          skillLevel: courseSkillLevel || "All Professional Levels",
          certificateAvailable: courseCertificateAvailable,
          lifetimeAccess: courseLifetimeAccess,
          mobileAccess: courseMobileAccess,
          downloadableResources: courseDownloadableResources,

          modules: courseModules || [],
          faqItems: courseFaqItems || [],

          seoTitle: courseSeoTitle || "",
          seoDescription: courseSeoDescription || "",
          focusKeyword: courseFocusKeyword || "",
          secondaryKeywords: courseSecondaryKeywords || [],
          courseTags: courseTags || [],
          canonicalUrl: courseCanonicalUrl || "",
          ogTitle: courseOgTitle || "",
          ogDescription: courseOgDescription || "",
          twitterTitle: courseTwitterTitle || "",
          twitterDescription: courseTwitterDescription || "",
          schemaDescription: courseSchemaDescription || "",

          benefits: courseBenefits || [],
          learningOutcomes: courseLearningOutcomes || [],
          requirements: courseRequirements || [],
          toolsNeeded: courseToolsNeeded || [],
          bonusResources: courseBonusResources || [],

          googleDriveLink: courseGoogleDriveLink || "",
          telegramLink: courseTelegramLink || "",
          privateResourceLink: coursePrivateResourceLink || "",
          importantNotes: courseImportantNotes || ""
        };

        if (editingCourse && editingCourse.id) {
          currentCourses = currentCourses.map(c => c.id === editingCourse.id ? coursePayload : c);
          showToast("Course profile updated successfully (Demo Mode)");
        } else {
          currentCourses.unshift(coursePayload);
          showToast("Course syllabus added successfully (Demo Mode)");
        }

        localStorage.setItem("demo_courses", JSON.stringify(currentCourses));

        // Close and reset
        setShowCourseModal(false);
        resetCourseFormState();

        await fetchAllAdminData();
      } catch (err) {
        console.error("Local save course failure:", err);
      } finally {
        setUploadProgress(false);
      }
      return;
    }

    const pathString = "courses";
    try {
      const coursePayload: any = {
        title: courseTitle,
        category: courseCategory,
        price: Number(coursePrice),
        description: courseDescription,
        thumbnail: courseThumbnail,
        slug: cleanSlug,
        deliverableLink: courseDeliverableLink,
        welcomeVideoUrl: courseWelcomeVideoUrl,
        deliveryInstructions: courseDeliveryInstructions,
        deliveryUrl: courseDeliveryUrl,

        instructorName: courseInstructorName || "Aditya Raj Kashyap",
        subCategory: courseSubCategory || courseCategory || "",
        courseStatus: courseStatus || "Published",
        isFeatured: courseIsFeatured,
        isPopular: courseIsPopular,
        isTrending: courseIsTrending,

        originalPrice: Number(courseOriginalPrice) || Math.round(Number(coursePrice) * 2.2),
        discountPercentage: Number(courseDiscountPercentage) || 0,
        currency: courseCurrency || "INR",
        isLimitedTimeOffer: courseIsLimitedTimeOffer,

        bannerImage: courseBannerImage || "",
        instructorImage: courseInstructorImage || "",
        previewVideoUrl: coursePreviewVideoUrl || "",
        shortDescription: courseShortDescription || courseDescription || "",
        longDescription: courseLongDescription || courseDescription || "",
        courseOverview: courseOverview || "",
        courseSummary: courseSummary || "",
        whoIsThisCourseFor: courseWhoIsThisCourseFor || "",
        prerequisites: coursePrerequisites || "",

        courseDuration: courseDuration || "10+ Hours of on-demand sessions",
        videoHours: courseVideoHours || "10",
        numberOfLessons: Number(courseNumberOfLessons) || 28,
        numberOfModules: Number(courseNumberOfModules) || 5,
        assignmentsCount: Number(courseAssignmentsCount) || 0,
        projectsCount: Number(courseProjectsCount) || 0,
        quizCount: Number(courseQuizCount) || 0,
        language: courseLanguage || "English / Bilingual",
        skillLevel: courseSkillLevel || "All Professional Levels",
        certificateAvailable: courseCertificateAvailable,
        lifetimeAccess: courseLifetimeAccess,
        mobileAccess: courseMobileAccess,
        downloadableResources: courseDownloadableResources,

        modules: courseModules || [],
        faqItems: courseFaqItems || [],

        seoTitle: courseSeoTitle || "",
        seoDescription: courseSeoDescription || "",
        focusKeyword: courseFocusKeyword || "",
        secondaryKeywords: courseSecondaryKeywords || [],
        courseTags: courseTags || [],
        canonicalUrl: courseCanonicalUrl || "",
        ogTitle: courseOgTitle || "",
        ogDescription: courseOgDescription || "",
        twitterTitle: courseTwitterTitle || "",
        twitterDescription: courseTwitterDescription || "",
        schemaDescription: courseSchemaDescription || "",

        benefits: courseBenefits || [],
        learningOutcomes: courseLearningOutcomes || [],
        requirements: courseRequirements || [],
        toolsNeeded: courseToolsNeeded || [],
        bonusResources: courseBonusResources || [],

        googleDriveLink: courseGoogleDriveLink || "",
        telegramLink: courseTelegramLink || "",
        privateResourceLink: coursePrivateResourceLink || "",
        importantNotes: courseImportantNotes || ""
      };

      if (editingCourse && editingCourse.id) {
        // UPDATE Action
        const docRef = doc(db, pathString, editingCourse.id);
        await updateDoc(docRef, coursePayload);
        showToast("Course program updated successfully!");
      } else {
        // CREATE Action - Require serverTimestamp to satisfy rules constraint inbound
        coursePayload.createdAt = serverTimestamp();
        await addDoc(collection(db, pathString), coursePayload);
        showToast("New course launched successfully!");
      }

      // Close and reset
      setShowCourseModal(false);
      resetCourseFormState();

      // Refresh listings
      await fetchAllAdminData();
    } catch (e: any) {
      console.error("Firebase save course failed:", e);
      let errorMsg = "An error occurred while saving the course.";
      if (e instanceof Error) {
        errorMsg = e.message;
      } else if (typeof e === "object" && e !== null && "message" in e) {
        errorMsg = String((e as any).message);
      }
      setModalError(`Database rejected this entry: ${errorMsg}. Note: Inlined thumbnails must be under 1MB.`);
      try {
        handleFirestoreError(e, editingCourse ? OperationType.UPDATE : OperationType.CREATE, pathString);
      } catch (_) {}
    } finally {
      setUploadProgress(false);
    }
  };

  // Edit Button Trigger
  const startEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseTitle(course.title);
    setCourseSlug(course.slug || "");
    setCourseCategory(course.category);
    setCoursePrice(course.price);
    setCourseDescription(course.description);
    setCourseThumbnail(course.thumbnail);
    setCourseDeliverableLink(course.deliverableLink || "");
    setCourseWelcomeVideoUrl(course.welcomeVideoUrl || "");
    setCourseDeliveryInstructions(course.deliveryInstructions || "");
    setCourseDeliveryUrl(course.deliveryUrl || "");
    
    // CMS state hydration
    setCourseInstructorName(course.instructorName || "Aditya Raj Kashyap");
    setCourseSubCategory(course.subCategory || course.category || "");
    setCourseStatus(course.courseStatus || "Published");
    setCourseIsFeatured(course.isFeatured || false);
    setCourseIsPopular(course.isPopular || false);
    setCourseIsTrending(course.isTrending || false);

    setCourseOriginalPrice(course.originalPrice || Math.round(course.price * 2.2));
    setCourseDiscountPercentage(course.discountPercentage || 0);
    setCourseCurrency(course.currency || "INR");
    setCourseIsLimitedTimeOffer(course.isLimitedTimeOffer || false);

    setCourseBannerImage(course.bannerImage || "");
    setCourseInstructorImage(course.instructorImage || "");
    setCoursePreviewVideoUrl(course.previewVideoUrl || "");
    setCourseShortDescription(course.shortDescription || course.description || "");
    setCourseLongDescription(course.longDescription || course.description || "");
    setCourseOverview(course.courseOverview || "");
    setCourseSummary(course.courseSummary || "");
    setCourseWhoIsThisCourseFor(course.whoIsThisCourseFor || "");
    setCoursePrerequisites(course.prerequisites || "");

    setCourseDuration(course.courseDuration || "10+ Hours of on-demand sessions");
    setCourseVideoHours(course.videoHours || "10");
    setCourseNumberOfLessons(course.numberOfLessons || 28);
    setCourseNumberOfModules(course.numberOfModules || 5);
    setCourseAssignmentsCount(course.assignmentsCount || 0);
    setCourseProjectsCount(course.projectsCount || 0);
    setCourseQuizCount(course.quizCount || 0);
    setCourseLanguage(course.language || "English / Bilingual");
    setCourseSkillLevel(course.skillLevel || "All Professional Levels");
    setCourseCertificateAvailable(course.certificateAvailable !== undefined ? course.certificateAvailable : true);
    setCourseLifetimeAccess(course.lifetimeAccess !== undefined ? course.lifetimeAccess : true);
    setCourseMobileAccess(course.mobileAccess !== undefined ? course.mobileAccess : true);
    setCourseDownloadableResources(course.downloadableResources !== undefined ? course.downloadableResources : true);

    setCourseModules(course.modules || []);
    setCourseFaqItems(course.faqItems || []);

    setCourseSeoTitle(course.seoTitle || "");
    setCourseSeoDescription(course.seoDescription || "");
    setCourseFocusKeyword(course.focusKeyword || "");
    setCourseSecondaryKeywords(course.secondaryKeywords || []);
    setCourseTags(course.courseTags || []);
    setCourseCanonicalUrl(course.canonicalUrl || "");
    setCourseOgTitle(course.ogTitle || "");
    setCourseOgDescription(course.ogDescription || "");
    setCourseTwitterTitle(course.twitterTitle || "");
    setCourseTwitterDescription(course.twitterDescription || "");
    setCourseSchemaDescription(course.schemaDescription || "");

    setCourseBenefits(course.benefits || []);
    setCourseLearningOutcomes(course.learningOutcomes || []);
    setCourseRequirements(course.requirements || []);
    setCourseToolsNeeded(course.toolsNeeded || []);
    setCourseBonusResources(course.bonusResources || []);

    setCourseDeliveryLink(course.deliveryLink || "");
    setCourseGoogleDriveLink(course.googleDriveLink || "");
    setCourseTelegramLink(course.telegramLink || "");
    setCoursePrivateResourceLink(course.privateResourceLink || "");
    setCourseImportantNotes(course.importantNotes || "");

    setShowCourseModal(true);
    setCourseEditorActiveTab("info");
  };

  // Delete Course Trigger with Custom Confirm Dialog
  const handleDeleteCourse = (courseId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this course from the catalog? This is irreversible and will permanently wipe its listing.",
      confirmLabel: "Delete Course",
      isDanger: true,
      onConfirm: async () => {
        await executeDeleteCourse(courseId);
        setConfirmModal(null);
      }
    });
  };

  const executeDeleteCourse = async (courseId: string) => {
    if (user?.uid === "demo_admin_uid") {
      try {
        let storedCourses = localStorage.getItem("demo_courses");
        let currentCourses: Course[] = storedCourses ? JSON.parse(storedCourses) : [];
        currentCourses = currentCourses.filter(c => c.id !== courseId);
        localStorage.setItem("demo_courses", JSON.stringify(currentCourses));
        showToast("Course removed from catalog (Demo Mode)");
        await fetchAllAdminData();
      } catch (err) {
        console.error("Local delete course failure:", err);
      }
      return;
    }

    const pathString = "courses";
    try {
      await deleteDoc(doc(db, pathString, courseId));
      showToast("Course deleted successfully!");
      await fetchAllAdminData();
    } catch (e: any) {
      console.error("Firebase delete course error:", e);
      showToast(`Delete rejected: ${e?.message || String(e)}`);
      try {
        handleFirestoreError(e, OperationType.DELETE, pathString);
      } catch (_) {}
    }
  };

  // Delete All Courses Handler with Custom Confirm Dialog
  const handleDeleteAllCourses = () => {
    setConfirmModal({
      isOpen: true,
      title: "🚨 WIPE ALL COURSES",
      message: "CRITICAL: Are you sure you want to delete ALL courses from the catalog? This will completely wipe your entire curriculum and is irreversible!",
      confirmLabel: "Delete All",
      isDanger: true,
      onConfirm: async () => {
        await executeDeleteAllCourses();
        setConfirmModal(null);
      }
    });
  };

  const executeDeleteAllCourses = async () => {
    if (user?.uid === "demo_admin_uid") {
      localStorage.setItem("demo_courses", JSON.stringify([]));
      showToast("All courses cleared (Demo Mode)");
      await fetchAllAdminData();
      return;
    }

    const pathString = "courses";
    try {
      showToast("Wiping courses catalog...");
      const querySnapshot = await getDocs(collection(db, pathString));
      const batchPromises = querySnapshot.docs.map(docSnapshot => deleteDoc(doc(db, pathString, docSnapshot.id)));
      await Promise.all(batchPromises);
      showToast("All courses deleted successfully!");
      await fetchAllAdminData();
    } catch (e: any) {
      console.error("Firebase delete all courses error:", e);
      showToast(`Delete all rejected: ${e?.message || String(e)}`);
    }
  };

  // Firebase update function: updateOrderStatus(orderId, newStatus)
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (user?.uid === "demo_admin_uid") {
      try {
        let storedOrders = localStorage.getItem("demo_orders");
        let currentOrders: Order[] = storedOrders ? JSON.parse(storedOrders) : [];
        currentOrders = currentOrders.map(o => {
          if (o.id === orderId) {
            const updated: any = { ...o, status: newStatus };
            if (newStatus === "Verified" || newStatus === "approved" || newStatus === "Approved") {
              updated.purchasedAt = new Date();
              updated.status = "approved"; // standardizing on requested value
            } else if (newStatus === "Delivered" || newStatus === "delivered") {
              updated.deliveredAt = new Date();
              updated.status = "delivered"; // standardizing on requested value
              if (!o.purchasedAt) {
                updated.purchasedAt = new Date();
              }
            } else if (newStatus === "Pending" || newStatus === "pending") {
              updated.status = "pending";
            }
            return updated;
          }
          return o;
        });
        localStorage.setItem("demo_orders", JSON.stringify(currentOrders));
        await fetchAllAdminData();
        showToast(`Order status transitioned to ${newStatus}`);
      } catch (err) {
        console.error("Local update order status error:", err);
      }
      return;
    }

    const pathString = "orders";
    try {
      const docRef = doc(db, pathString, orderId);
      let standardizedStatus = newStatus;
      if (newStatus === "Verified" || newStatus === "Approved" || newStatus === "approved") {
        standardizedStatus = "approved";
      } else if (newStatus === "Delivered" || newStatus === "delivered") {
        standardizedStatus = "delivered";
      } else if (newStatus === "Pending" || newStatus === "pending") {
        standardizedStatus = "pending";
      } else if (newStatus === "Refunded" || newStatus === "refunded") {
        standardizedStatus = "refunded";
      } else if (newStatus === "Cancelled" || newStatus === "cancelled") {
        standardizedStatus = "cancelled";
      }

      const updates: any = { status: standardizedStatus };
      if (standardizedStatus === "approved") {
        updates.purchasedAt = serverTimestamp();
      } else if (standardizedStatus === "delivered") {
        updates.deliveredAt = serverTimestamp();
      }

      // Check current order details before updating to see if we should adjust coupon usedCount and totalSales
      try {
        const orderSnap = await getDoc(docRef);
        if (orderSnap.exists()) {
          const orderData = orderSnap.data();
          const oldStatus = orderData.status || "pending";
          const newStatusVal = standardizedStatus;

          const isActivePaidStatus = (s: string) => {
            if (!s) return false;
            const ls = s.toLowerCase();
            return ls === "approved" || ls === "delivered" || ls === "verified";
          };

          const wasActivePaid = isActivePaidStatus(oldStatus);
          const isActivePaid = isActivePaidStatus(newStatusVal);

          const couponCode = orderData.couponCode;
          if (couponCode && couponCode !== "None" && couponCode.trim() !== "") {
            const uCoupon = couponCode.trim().toUpperCase();
            const couponDocRef = doc(db, "coupons", uCoupon);
            const couponSnap = await getDoc(couponDocRef);
            if (couponSnap.exists()) {
              const currentCount = couponSnap.data().usedCount || 0;
              const currentSales = couponSnap.data().totalSales || 0;
              const orderAmount = Number(orderData.price || orderData.amount || 0);

              let nextCount = currentCount;
              let nextSales = currentSales;

              if (!wasActivePaid && isActivePaid) {
                nextCount = currentCount + 1;
                nextSales = currentSales + orderAmount;
                console.log(`[COUPON-TRACKING] Order ${orderId} approved/delivered. Adding ₹${orderAmount} to totalSales. usedCount is now ${nextCount}`);
              } else if (wasActivePaid && !isActivePaid) {
                nextCount = Math.max(0, currentCount - 1);
                nextSales = Math.max(0, currentSales - orderAmount);
                console.log(`[COUPON-TRACKING] Order ${orderId} set inactive (${newStatusVal}). Subtracting ₹${orderAmount} from totalSales. usedCount is now ${nextCount}`);
              }

              if (nextCount !== currentCount || nextSales !== currentSales) {
                await updateDoc(couponDocRef, {
                  usedCount: nextCount,
                  totalSales: nextSales
                });
              }
            }
          }
        }
      } catch (couponCountErr) {
        console.error("Failed to adjust coupon usage metrics on order status transition:", couponCountErr);
      }

      await updateDoc(docRef, updates);
      await fetchAllAdminData();
      showToast(`Order status transitioned to ${standardizedStatus}`);
    } catch (e: any) {
      console.error("Firebase update order status error:", e);
      showToast(`Update rejected by database: ${e?.message || String(e)}`);
      try {
        handleFirestoreError(e, OperationType.UPDATE, pathString);
      } catch (_) {}
    }
  };

  // Wrapper for custom confirmation dialogue before order status transition
  const confirmAndUpdateStatus = (orderId: string, newStatus: string, buyerName: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Transition Order Status",
      message: `Are you sure you want to transition ${buyerName}'s order status to "${newStatus}"?`,
      confirmLabel: `Accept to ${newStatus}`,
      isDanger: false,
      onConfirm: async () => {
        await updateOrderStatus(orderId, newStatus);
        setConfirmModal(null);
      }
    });
  };

  // Delete Order Handler with Custom Confirm Dialog
  const handleDeleteOrder = (orderId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Order Record",
      message: "Are you sure you want to permanently delete this order registration? This cannot be undone.",
      confirmLabel: "Delete Order",
      isDanger: true,
      onConfirm: async () => {
        await executeDeleteOrder(orderId);
        setConfirmModal(null);
      }
    });
  };

  const executeDeleteOrder = async (orderId: string) => {
    if (user?.uid === "demo_admin_uid") {
      try {
        let storedOrders = localStorage.getItem("demo_orders");
        let currentOrders: Order[] = storedOrders ? JSON.parse(storedOrders) : [];
        currentOrders = currentOrders.filter(o => o.id !== orderId);
        localStorage.setItem("demo_orders", JSON.stringify(currentOrders));
        await fetchAllAdminData();
      } catch (err) {
        console.error("Local delete order failure:", err);
      }
      return;
    }

    const pathString = "orders";
    try {
      const docRef = doc(db, pathString, orderId);
      const orderSnap = await getDoc(docRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        const oldStatus = orderData.status || "pending";
        const isActivePaidStatus = (s: string) => {
          if (!s) return false;
          const ls = s.toLowerCase();
          return ls === "approved" || ls === "delivered" || ls === "verified";
        };

        if (isActivePaidStatus(oldStatus)) {
          const couponCode = orderData.couponCode;
          if (couponCode && couponCode !== "None" && couponCode.trim() !== "") {
            const uCoupon = couponCode.trim().toUpperCase();
            const couponDocRef = doc(db, "coupons", uCoupon);
            const couponSnap = await getDoc(couponDocRef);
            if (couponSnap.exists()) {
              const currentCount = couponSnap.data().usedCount || 0;
              const currentSales = couponSnap.data().totalSales || 0;
              const orderAmount = Number(orderData.price || orderData.amount || 0);

              const nextCount = Math.max(0, currentCount - 1);
              const nextSales = Math.max(0, currentSales - orderAmount);

              await updateDoc(couponDocRef, {
                usedCount: nextCount,
                totalSales: nextSales
              });
              console.log(`[COUPON-TRACKING] Order ${orderId} permanently deleted. Adjusted coupon "${uCoupon}": usedCount = ${nextCount}, totalSales = ${nextSales}`);
            }
          }
        }
      }

      await deleteDoc(docRef);
      await fetchAllAdminData();
    } catch (e: any) {
      console.error("Firebase delete order error:", e);
      showToast(`Delete rejected: ${e?.message || String(e)}`);
      try {
        handleFirestoreError(e, OperationType.DELETE, pathString);
      } catch (_) {}
    }
  };

  // ==========================================
  // ADMIN CONTROL ACTIONS: AFFILIATE CRM (PART 5 - PART 10)
  // ==========================================
  const handleApproveAffiliate = async (app: any) => {
    if (!app?.uid) return;
    
    // Check if duplicate coupon already exists in the central Coupons table (PART 3, PART 22)
    const rawCoupon = String(app.preferredCoupon || "").toUpperCase().trim();
    if (!rawCoupon || !/^[A-Z]+$/.test(rawCoupon)) {
      showToast("Coupon contains numeric/invalid characters. Refusing automatic approval.");
      return;
    }

    try {
      // 1. Write the coupon document to 'coupons' collection
      const couponDocRef = doc(db, "coupons", rawCoupon);
      await setDoc(couponDocRef, {
        code: rawCoupon,
        type: "percentage",
        value: Number(customDiscountRate || 10), // Standard 10% discount to student (can be custom)
        minOrder: 0,
        expiry: "Lifetime", // Lifetime coupons
        usedCount: 0,
        totalSales: 0,
        isAffiliateOnly: true,
        affiliateUid: app.uid
      });

      // 2. Update the affiliate application with approved fields
      const appDocRef = doc(db, "affiliate_applications", app.uid);
      await updateDoc(appDocRef, {
        status: "approved",
        couponCode: rawCoupon,
        discountPercent: Number(customDiscountRate || 10),
        commissionPercent: Number(customCommissionRate || 15),
        approvedAt: serverTimestamp(),
        notes: auditorNotes.trim() || "Application accepted by administrative audit staff.",
      });

      showToast(`Affiliate program approved! Coupon code "${rawCoupon}" is now live.`);
      setAuditorNotes("");
    } catch (err: any) {
      console.error("Approve affiliate failure:", err);
      showToast(`Approval failed: ${err.message}`);
    }
  };

  const handleRejectAffiliate = async (app: any) => {
    if (!app?.uid) return;
    try {
      const appDocRef = doc(db, "affiliate_applications", app.uid);
      await updateDoc(appDocRef, {
        status: "rejected",
        notes: auditorNotes.trim() || "Declined during general review.",
        rejectedAt: serverTimestamp()
      });
      showToast(`Application for "${app.fullName}" rejected.`);
      setAuditorNotes("");
    } catch (err: any) {
      console.error("Reject affiliate failure:", err);
      showToast(`Failed to update application state.`);
    }
  };

  const handleSuspendAffiliate = async (app: any) => {
    if (!app?.uid) return;
    const rawCoupon = String(app.couponCode || app.preferredCoupon || "").toUpperCase().trim();
    try {
      // 1. Delete coupon from coupons table to disable checkout validation (PART 16)
      if (rawCoupon) {
        await deleteDoc(doc(db, "coupons", rawCoupon));
      }

      // 2. Update status to suspended
      const appDocRef = doc(db, "affiliate_applications", app.uid);
      await updateDoc(appDocRef, {
        status: "suspended",
        notes: auditorNotes.trim() || "Suspended by admin for policy violation.",
        suspendedAt: serverTimestamp()
      });
      showToast(`Affiliate "${app.fullName}" has been suspended & their coupon disabled.`);
      setAuditorNotes("");
    } catch (err: any) {
      console.error("Suspend affiliate failure:", err);
      showToast(`Suspension failed.`);
    }
  };

  const handleReactivateAffiliate = async (app: any) => {
    if (!app?.uid) return;
    const rawCoupon = String(app.couponCode || app.preferredCoupon || "").toUpperCase().trim();
    if (!rawCoupon) {
      showToast("No coupon code linked. Reactivation aborted.");
      return;
    }
    try {
      // 1. Re-add coupon document back to coupons table (PART 16)
      const couponDocRef = doc(db, "coupons", rawCoupon);
      await setDoc(couponDocRef, {
        code: rawCoupon,
        type: "percentage",
        value: Number(app.discountPercent || 10),
        minOrder: 0,
        expiry: "Lifetime",
        usedCount: Number(app.timesUsed || 0),
        totalSales: Number(app.totalRevenue || 0),
        isAffiliateOnly: true,
        affiliateUid: app.uid
      });

      // 2. Set status approved
      const appDocRef = doc(db, "affiliate_applications", app.uid);
      await updateDoc(appDocRef, {
        status: "approved",
        reactivatedAt: serverTimestamp(),
        notes: "Account reactivated by administrative audit staff."
      });
      showToast(`Affiliate "${app.fullName}" reactivated. Coupon "${rawCoupon}" is restored.`);
    } catch (err: any) {
      console.error("Reactivate affiliate failure:", err);
      showToast(`Reactivation failed.`);
    }
  };

  const handleProcessPayout = async (payout: any) => {
    if (!payout?.id || !payout?.uid) return;
    try {
      // 1. Settle payout record (Status = "Paid") (PART 13, PART 14)
      await updateDoc(doc(db, "payout_requests", payout.id), {
        status: "Paid",
        processedAt: serverTimestamp()
      });

      // 2. Flush and credit paidEarnings inside affiliate_applications
      const appDocRef = doc(db, "affiliate_applications", payout.uid);
      const appSnap = await getDoc(appDocRef);
      if (appSnap.exists()) {
        const currentPaid = Number(appSnap.data().paidEarnings || 0);
        await updateDoc(appDocRef, {
          paidEarnings: currentPaid + Number(payout.amount || 0)
        });
      }

      showToast(`Payout transaction ${payout.id} marked as PAID.`);
    } catch (err: any) {
      console.error("Process payout failure:", err);
      showToast(`Payout transaction state update failed.`);
    }
  };

  const handleRejectPayout = async (payout: any) => {
    if (!payout?.id || !payout?.uid) return;
    try {
      // 1. Reject payout request (Status = "Rejected") (PART 14)
      await updateDoc(doc(db, "payout_requests", payout.id), {
        status: "Rejected",
        processedAt: serverTimestamp()
      });

      // 2. IMPORTANT: Refund amount back to affiliate's pendingEarnings!
      const appDocRef = doc(db, "affiliate_applications", payout.uid);
      const appSnap = await getDoc(appDocRef);
      if (appSnap.exists()) {
        const currentPending = Number(appSnap.data().pendingEarnings || 0);
        await updateDoc(appDocRef, {
          pendingEarnings: currentPending + Number(payout.amount || 0)
        });
      }

      showToast(`Payout transaction ${payout.id} rejected. Funds refunded to affiliate balance.`);
    } catch (err: any) {
      console.error("Reject payout failure:", err);
      showToast(`Failed to reject payout request.`);
    }
  };

  // Delete Contact Message with Custom Confirm Dialog
  const handleDeleteContact = (messageId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Contact Ticket",
      message: "Are you sure you want to delete this contact ticket? This is irreversible.",
      confirmLabel: "Delete Ticket",
      isDanger: true,
      onConfirm: async () => {
        await executeDeleteContact(messageId);
        setConfirmModal(null);
      }
    });
  };

  const executeDeleteContact = async (messageId: string) => {
    if (user?.uid === "demo_admin_uid") {
      try {
        let storedContacts = localStorage.getItem("demo_contacts");
        let currentContacts: ContactMessage[] = storedContacts ? JSON.parse(storedContacts) : [];
        currentContacts = currentContacts.filter(c => c.id !== messageId);
        localStorage.setItem("demo_contacts", JSON.stringify(currentContacts));
        await fetchAllAdminData();
      } catch (err) {
        console.error("Local delete contact failure:", err);
      }
      return;
    }

    const pathString = "contactMessages";
    try {
      await deleteDoc(doc(db, pathString, messageId));
      await fetchAllAdminData();
    } catch (e: any) {
      console.error("Firebase delete contact error:", e);
      showToast(`Delete rejected: ${e?.message || String(e)}`);
      try {
        handleFirestoreError(e, OperationType.DELETE, pathString);
      } catch (_) {}
    }
  };

  // Delete All Contact Tickets Handler with Custom Confirm Dialog
  const handleDeleteAllContacts = () => {
    setConfirmModal({
      isOpen: true,
      title: "Wipe Support Tickets",
      message: "Are you sure you want to delete ALL contact and support tickets? This cannot be undone.",
      confirmLabel: "Clear All Tickets",
      isDanger: true,
      onConfirm: async () => {
        await executeDeleteAllContacts();
        setConfirmModal(null);
      }
    });
  };

  const executeDeleteAllContacts = async () => {
    if (user?.uid === "demo_admin_uid") {
      localStorage.setItem("demo_contacts", JSON.stringify([]));
      showToast("All contact tickets cleared (Demo Mode)");
      await fetchAllAdminData();
      return;
    }

    const pathString = "contactMessages";
    try {
      showToast("Clearing support inbox...");
      const querySnapshot = await getDocs(collection(db, pathString));
      const batchPromises = querySnapshot.docs.map(docSnapshot => deleteDoc(doc(db, pathString, docSnapshot.id)));
      await Promise.all(batchPromises);
      showToast("All support tickets deleted successfully!");
      await fetchAllAdminData();
    } catch (e: any) {
      console.error("Firebase delete all contacts error:", e);
      showToast(`Clear inbox failed: ${e?.message || String(e)}`);
    }
  };

  // Save Marketing & Tracking Settings
  const handleSaveTrackingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast("Unauthorized: You do NOT have administrative access privileges.");
      return;
    }

    setSavingSettings(true);
    
    // Auto-extract tags in case they were not cleaned yet
    const cleanMetaPixel = extractMetaPixelId(metaPixelId);
    const cleanGtmId = extractGtmId(gtmId);
    const cleanGa4Id = extractGa4Id(ga4Id);
    const cleanSearchConsole = extractSearchConsoleVerification(searchConsoleVerification);
    const cleanFacebookVerification = extractFacebookDomainVerification(facebookDomainVerification);

    // Update form state with the cleaned IDs so the user immediately sees the elegant extraction result
    setMetaPixelId(cleanMetaPixel);
    setGtmId(cleanGtmId);
    setGa4Id(cleanGa4Id);
    setSearchConsoleVerification(cleanSearchConsole);
    setFacebookDomainVerification(cleanFacebookVerification);

    const updatedSettings: TrackingSettings = {
      metaPixelId: cleanMetaPixel,
      gtmId: cleanGtmId,
      ga4Id: cleanGa4Id,
      searchConsoleVerification: cleanSearchConsole,
      facebookDomainVerification: cleanFacebookVerification
    };

    if (user?.uid === "demo_admin_uid") {
      try {
        localStorage.setItem("demo_tracking_settings", JSON.stringify(updatedSettings));
        showToast("Success: Tracking and third-party integrations saved! (Demo Mode)");
      } catch (err: any) {
        showToast(`Save rejected locally: ${err?.message || String(err)}`);
      } finally {
        setSavingSettings(false);
      }
      return;
    }

    try {
      const trackingDocRef = doc(db, "settings", "tracking");
      await setDoc(trackingDocRef, updatedSettings);
      showToast("Success: Live marketing and analytics integrations deployed!");
    } catch (err: any) {
      console.error("Firestore settings save error:", err);
      showToast(`Save rejected by database: ${err?.message || String(err)}`);
      try {
        handleFirestoreError(err, OperationType.WRITE, "settings/tracking");
      } catch (_) {}
    } finally {
      setSavingSettings(false);
    }
  };

  // WEB V3: Homepage Settings & Hero Orbit Managers
  const [uploadingCenterLogo, setUploadingCenterLogo] = useState(false);

  const handleCenterLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingCenterLogo(true);
      const fileExt = file.name.split('.').pop()?.toLowerCase() || "";
      const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
      if (!allowedExtensions.includes(fileExt)) {
        showToast("Invalid format. Only JPG, JPEG, PNG, and WEBP are supported.");
        setUploadingCenterLogo(false);
        return;
      }
      const maxBytes = 2 * 1024 * 1024; // 2MB
      if (file.size > maxBytes) {
        showToast("File exceeds 2MB limit.");
        setUploadingCenterLogo(false);
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const rawBase64 = event.target.result as string;
          try {
            const compressed = await compressImage(rawBase64, 300, 300, 0.85);
            setHpCenterLogoUrl(compressed);

            if (user && user.uid !== "demo_admin_uid") {
              const timestamp = Date.now();
              const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, "_");
              const storageRef = ref(storage, `logo/${timestamp}_${cleanFileName}.${fileExt}`);
              const optimizedBlob = base64ToBlob(compressed);
              const uploadTask = uploadBytesResumable(storageRef, optimizedBlob);
              uploadTask.on(
                "state_changed",
                null,
                (err) => {
                  console.warn("Using base64 logo:", err);
                  setUploadingCenterLogo(false);
                },
                async () => {
                  const url = await getDownloadURL(uploadTask.snapshot.ref);
                  setHpCenterLogoUrl(url);
                  setUploadingCenterLogo(false);
                  showToast("Logo uploaded successfully!");
                }
              );
            } else {
              setUploadingCenterLogo(false);
              showToast("Logo processed!");
            }
          } catch (compressErr) {
            setUploadingCenterLogo(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOrbitItemImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingOrbitImage(true);

      const fileExt = file.name.split('.').pop()?.toLowerCase() || "";
      const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
      if (!allowedExtensions.includes(fileExt)) {
        showToast("Format must be JPG, JPEG, PNG, or WEBP.");
        setUploadingOrbitImage(false);
        return;
      }

      const maxBytes = 2 * 1024 * 1024; // 2MB
      if (file.size > maxBytes) {
        showToast("File is too large (max 2MB).");
        setUploadingOrbitImage(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const rawBase64 = event.target.result as string;
          try {
            const compressed = await compressImage(rawBase64, 400, 400, 0.8);
            setOrbitUploadedImage(compressed);

            if (user && user.uid !== "demo_admin_uid") {
              const timestamp = Date.now();
              const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, "_");
              const storageRef = ref(storage, `hero_orbit/${timestamp}_${cleanFileName}.${fileExt}`);
              const optimizedBlob = base64ToBlob(compressed);
              
              const uploadTask = uploadBytesResumable(storageRef, optimizedBlob);
              uploadTask.on(
                "state_changed",
                null,
                (err) => {
                  console.warn("Bypassed storage, keeping base64 orbit image:", err);
                  setUploadingOrbitImage(false);
                },
                async () => {
                  const url = await getDownloadURL(uploadTask.snapshot.ref);
                  setOrbitUploadedImage(url);
                  setUploadingOrbitImage(false);
                  showToast("Orbit image uploaded successfully!");
                }
              );
            } else {
              setUploadingOrbitImage(false);
              showToast("Orbit image processed!");
            }
          } catch (compressErr) {
            console.error("Compression failed:", compressErr);
            setUploadingOrbitImage(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveHomepageSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast("Unauthorized: You do NOT have administrative access privileges.");
      return;
    }
    setSavingHpSettings(true);

    const updatedSettings: HomepageSettings = {
      enableOrbitAnimation: hpEnableOrbitAnimation,
      enableOrbitGlow: hpEnableOrbitGlow,
      enableParticleBackground: hpEnableParticleBackground,
      enableParallax: hpEnableParallax,
      enableHoverEffects: hpEnableHoverEffects,
      enableAutoRotation: hpEnableAutoRotation,
      orbitSpeed: hpOrbitSpeed,
      customOrbitSpeed: Number(hpCustomOrbitSpeed),
      centerLogoType: hpCenterLogoType,
      centerLogoUrl: hpCenterLogoUrl,
      mainHeading: hpMainHeading,
      subHeading: hpSubHeading,
      ctaButtonText: hpCtaButtonText,
      ctaButtonLink: hpCtaButtonLink,
      
      animationsEnabled: hpAnimationsEnabled,
      animationIntensity: hpAnimationIntensity,
      pageTransitionsEnabled: hpPageTransitionsEnabled,
      counterAnimationsEnabled: hpCounterAnimationsEnabled,
      backgroundEffectsEnabled: hpBackgroundEffectsEnabled,
      customCursorEnabled: hpCustomCursorEnabled,

      orbitRadius: Number(hpOrbitRadius),
      orbitCardSize: Number(hpOrbitCardSize),
      orbitGlowIntensity: hpOrbitGlowIntensity,

      orbitImage1: hpOrbitImage1,
      orbitImage2: hpOrbitImage2,
      orbitImage3: hpOrbitImage3,
      orbitImage4: hpOrbitImage4,

      orbitImageType1: hpOrbitImageType1,
      orbitImageType2: hpOrbitImageType2,
      orbitImageType3: hpOrbitImageType3,
      orbitImageType4: hpOrbitImageType4,

      orbitLabel1: hpOrbitLabel1,
      orbitLabel2: hpOrbitLabel2,
      orbitLabel3: hpOrbitLabel3,
      orbitLabel4: hpOrbitLabel4,

      orbitLink1: hpOrbitLink1,
      orbitLink2: hpOrbitLink2,
      orbitLink3: hpOrbitLink3,
      orbitLink4: hpOrbitLink4,
    };

    if (user?.uid === "demo_admin_uid") {
      localStorage.setItem("demo_homepage_settings", JSON.stringify(updatedSettings));
      setDbHomepageSettings(updatedSettings);
      showToast("Success: Homepage settings saved! (Demo Mode)");
      setSavingHpSettings(false);
      return;
    }

    try {
      const hpDocRef = doc(db, "settings", "homepageSettings");
      await setDoc(hpDocRef, updatedSettings);
      showToast("Success: Homepage conditions deployed!");
    } catch (err: any) {
      console.error("Firestore homepage settings save error:", err);
      showToast(`Save failed: ${err.message || String(err)}`);
    } finally {
      setSavingHpSettings(false);
    }
  };

  const handleSaveOrbitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast("Unauthorized.");
      return;
    }

    if (!orbitTitle.trim()) {
      showToast("Error: Orbit Item Title is required.");
      return;
    }

    let finalImageUrl = "";
    if (orbitImageSourceType === "course") {
      const selectedCourse = courses.find(c => c.id === orbitCourseId);
      if (!selectedCourse) {
        showToast("Error: No course selected.");
        return;
      }
      finalImageUrl = selectedCourse.thumbnail || "";
    } else if (orbitImageSourceType === "external") {
      if (!orbitExternalImageUrl.trim()) {
        showToast("Error: External Image URL is empty.");
        return;
      }
      finalImageUrl = orbitExternalImageUrl;
    } else {
      if (!orbitUploadedImage) {
        showToast("Error: Please upload or select an image.");
        return;
      }
      finalImageUrl = orbitUploadedImage;
    }

    let finalLink = "";
    if (orbitClickActionType === "course") {
      finalLink = `/course/${orbitTargetSlug}`;
    } else if (orbitClickActionType === "blog") {
      finalLink = `/blog/${orbitTargetSlug}`;
    } else if (orbitClickActionType === "external") {
      finalLink = orbitTargetSlug;
    } else {
      finalLink = "#";
    }

    const orbitItemData: Omit<HeroOrbitItem, "id"> = {
      title: orbitTitle.trim(),
      image: finalImageUrl,
      link: finalLink,
      description: orbitDescription.trim(),
      displayOrder: Number(orbitDisplayOrder),
      ringAssignment: orbitRingAssignment,
      enabled: orbitEnabled,
      imageSourceType: orbitImageSourceType,
      courseId: orbitCourseId,
      clickActionType: orbitClickActionType,
      targetSlug: orbitTargetSlug,
    };

    if (user?.uid === "demo_admin_uid") {
      const localItems = [...dbHeroOrbitItems];
      if (editingOrbitItem && editingOrbitItem.id) {
        const idx = localItems.findIndex(i => i.id === editingOrbitItem.id);
        if (idx !== -1) {
          localItems[idx] = { ...orbitItemData, id: editingOrbitItem.id };
        }
      } else {
        const newItemWithId = { ...orbitItemData, id: `orbit_demo_${Date.now()}` };
        localItems.push(newItemWithId);
      }
      localItems.sort((a, b) => a.displayOrder - b.displayOrder);
      setDbHeroOrbitItems(localItems);
      localStorage.setItem("demo_hero_orbit_items", JSON.stringify(localItems));
      showToast("Success: Orbit item saved! (Demo Mode)");
      setShowOrbitModal(false);
      return;
    }

    try {
      if (editingOrbitItem && editingOrbitItem.id) {
        const itemDocRef = doc(db, "heroOrbitItems", editingOrbitItem.id);
        await setDoc(itemDocRef, orbitItemData);
        showToast("Success: Orbit item updated successfully!");
      } else {
        const colRef = collection(db, "heroOrbitItems");
        await addDoc(colRef, { ...orbitItemData, createdAt: new Date() });
        showToast("Success: New Orbit item added successfully!");
      }
      setShowOrbitModal(false);
    } catch (err: any) {
      console.error("Firestore save orbit item failed:", err);
      showToast(`Error: ${err.message || String(err)}`);
    }
  };

  const handleDeleteOrbitItem = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this orbit item? This cannot be undone.")) {
      return;
    }

    if (user?.uid === "demo_admin_uid") {
      const updatedList = dbHeroOrbitItems.filter(item => item.id !== itemId);
      setDbHeroOrbitItems(updatedList);
      localStorage.setItem("demo_hero_orbit_items", JSON.stringify(updatedList));
      showToast("Deleted orbit item. (Demo Mode)");
      return;
    }

    try {
      const itemDocRef = doc(db, "heroOrbitItems", itemId);
      await deleteDoc(itemDocRef);
      showToast("Orbit item removed successfully!");
    } catch (err: any) {
      console.error("Firestore delete orbit item error:", err);
      showToast(`Error: ${err.message || String(err)}`);
    }
  };

  const handleMoveOrbitItem = async (index: number, direction: "up" | "down") => {
    const items = [...dbHeroOrbitItems];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const tempOrder = items[index].displayOrder || 0;
    items[index].displayOrder = items[targetIdx].displayOrder || 0;
    items[targetIdx].displayOrder = tempOrder;

    if (items[index].displayOrder === items[targetIdx].displayOrder) {
      items[index].displayOrder += 1;
    }

    items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    if (user?.uid === "demo_admin_uid") {
      setDbHeroOrbitItems(items);
      localStorage.setItem("demo_hero_orbit_items", JSON.stringify(items));
      showToast("Order updated! (Demo Mode)");
      return;
    }

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.id) {
          await updateDoc(doc(db, "heroOrbitItems", item.id), {
            displayOrder: i + 1
          });
        }
      }
      showToast("Success: Orbit items reordered!");
    } catch (err: any) {
      console.error("Index shifting failed:", err);
      showToast(`Error: ${err.message}`);
    }
  };

  const handleDragAndDropReorder = async (draggedId: string, targetId: string) => {
    let items = [...dbHeroOrbitItems];
    const draggedIdx = items.findIndex(item => item.id === draggedId);
    const targetIdx = items.findIndex(item => item.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1 || draggedIdx === targetIdx) return;

    const [draggedItem] = items.splice(draggedIdx, 1);
    items.splice(targetIdx, 0, draggedItem);

    items = items.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1
    }));

    setDbHeroOrbitItems(items);

    if (user?.uid === "demo_admin_uid") {
      localStorage.setItem("demo_hero_orbit_items", JSON.stringify(items));
      showToast("Reordered via Drag & Drop! (Demo Mode)");
      return;
    }

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.id) {
          await updateDoc(doc(db, "heroOrbitItems", item.id), {
            displayOrder: i + 1
          });
        }
      }
      showToast("Updated positions via drag and drop!");
    } catch (e: any) {
      console.error("Drag drop save error:", e);
      showToast(`Error saving positions: ${e.message}`);
    }
  };

  // Save automated Razorpay payment settings
  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast("Unauthorized: You do NOT have administrative access privileges.");
      return;
    }

    setSavingPaymentSettings(true);
    let normalizedKey = razorpayKeyId.trim();
    if (normalizedKey.startsWith("zp_test_")) {
      normalizedKey = "rzp_test_" + normalizedKey.substring(8);
      setRazorpayKeyId(normalizedKey);
    } else if (normalizedKey.startsWith("zp_live_")) {
      normalizedKey = "rzp_live_" + normalizedKey.substring(8);
      setRazorpayKeyId(normalizedKey);
    }

    const updatedPaymentSettings = {
      razorpayKeyId: normalizedKey,
      razorpayKeySecret: razorpayKeySecret.trim(),
      razorpayWebhookSecret: razorpayWebhookSecret.trim(),
      isTestMode: !!isTestMode,
      isLiveMode: !!isLiveMode,
      enablePaymentSandbox: !!enablePaymentSandbox
    };

    if (user?.uid === "demo_admin_uid") {
      try {
        localStorage.setItem("demo_payment_settings", JSON.stringify(updatedPaymentSettings));
        showToast("Success: Automated Razorpay settings saved locally! (Demo Mode)");
      } catch (err: any) {
        showToast(`Save failed locally: ${err?.message || String(err)}`);
      } finally {
        setSavingPaymentSettings(false);
      }
      return;
    }

    try {
      const paymentDocRef = doc(db, "settings", "paymentGateway");
      await setDoc(paymentDocRef, updatedPaymentSettings);
      showToast("Success: Razorpay central payment gateway variables successfully updated!");
    } catch (err: any) {
      console.error("Firestore payment config save error:", err);
      showToast(`Database write rejected: ${err?.message || String(err)}`);
    } finally {
      setSavingPaymentSettings(false);
    }
  };

  // Reset Marketing & Tracking Settings with Custom Confirm Dialog
  const handleResetTrackingSettings = () => {
    if (!isAdmin) return;
    setConfirmModal({
      isOpen: true,
      title: "Reset Analytics Integrations?",
      message: "Are you sure you want to completely clear GTM, Meta Pixel, GA4, Google Search Console and Facebook verification tags? Dynamic script injections will be disabled immediately.",
      confirmLabel: "Reset Settings",
      isDanger: true,
      onConfirm: async () => {
        setMetaPixelId("");
        setGtmId("");
        setGa4Id("");
        setSearchConsoleVerification("");
        setFacebookDomainVerification("");
        
        const cleared: TrackingSettings = {
          metaPixelId: "",
          gtmId: "",
          ga4Id: "",
          searchConsoleVerification: "",
          facebookDomainVerification: ""
        };

        if (user?.uid === "demo_admin_uid") {
          localStorage.setItem("demo_tracking_settings", JSON.stringify(cleared));
          showToast("Success: Analytics settings wiped (Demo Mode)");
          setConfirmModal(null);
          return;
        }

        try {
          const trackingDocRef = doc(db, "settings", "tracking");
          await setDoc(trackingDocRef, cleared);
          showToast("Success: Analytics codes cleared from database!");
        } catch (err: any) {
          console.error("Firestore settings clear error:", err);
          showToast(`Wipe rejected: ${err?.message || String(err)}`);
        }
        setConfirmModal(null);
      }
    });
  };

  // Administrative BLOG Actions
  const handleBlogImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setBlogError("File too large. Choose a cropped header image under 2MB!");
      return;
    }

    setUploadingImage(true);
    setBlogError("");
    const reader = new FileReader();
    reader.onload = async () => {
      const rawBase64 = reader.result as string;
      let fallbackBase64 = rawBase64;
      try {
        // Compress and shrink to max 1200px width/height, 0.85 quality
        const compressedBase64 = await compressImage(rawBase64, 1200, 1200, 0.85);
        fallbackBase64 = compressedBase64;
        const optimizedBlob = base64ToBlob(compressedBase64);
        
        if (optimizedBlob.size > 2 * 1024 * 1024) {
          throw new Error("File exceeds 2MB limit.");
        }
        
        const timestamp = Date.now();
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, "_");
        const extension = file.type === "image/png" ? "png" : "jpg";
        const storageRef = ref(storage, `blogs/images/${timestamp}_${cleanFileName}.${extension}`);
        
        // Use standard put() modular method (uploadBytes as put) with a 6s timeout
        const uploadPromise = put(storageRef, optimizedBlob);
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Storage upload timed out, activating inline fallback...")), 6000)
        );
        
        const uploadTask = await Promise.race([uploadPromise, timeoutPromise]);
        const downloadUrl = await getDownloadURL(uploadTask.ref);
        
        setBlogFeaturedImage(downloadUrl);
        setBlogError("");
      } catch (storageError: any) {
        console.warn("Blog image Storage upload failed. Falling back to inline base64 encoding", storageError);
        if (storageError?.message?.includes("exceeds 1024") || storageError?.message?.includes("exceeds 2MB limit") || (file && file.size > 2 * 1024 * 1024)) {
          setBlogError("Upload failed: File exceeds 2MB limit.");
          setBlogFeaturedImage("");
          setUploadingImage(false);
          return;
        }
        // Fallback to compressed base64 representation if Storage is blocked/unconfigured
        setBlogFeaturedImage(fallbackBase64);
        setBlogError("");
      } finally {
        setUploadingImage(false);
      }
    };
    reader.onerror = () => {
      setBlogError("Error loading image asset.");
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const openBlogModal = (blogToEdit: any | null = null) => {
    setBlogError("");
    if (blogToEdit) {
      setEditingBlog(blogToEdit);
      setBlogTitle(blogToEdit.title || "");
      setBlogSlug(blogToEdit.slug || "");
      setBlogMetaTitle(blogToEdit.metaTitle || "");
      setBlogMetaDescription(blogToEdit.metaDescription || "");
      setBlogFeaturedImage(blogToEdit.featuredImage || "");
      setBlogCategory(blogToEdit.category || "AI & Future Tech");
      setBlogContent(blogToEdit.content || "");
      setBlogAuthor(blogToEdit.author || "Admin Mentor");
      setBlogPublishDate(blogToEdit.publishDate || "");
      setBlogKeywords(blogToEdit.seoKeywords || "");
      setBlogCanonicalUrl(blogToEdit.canonicalUrl || "");
    } else {
      setEditingBlog(null);
      setBlogTitle("");
      setBlogSlug("");
      setBlogMetaTitle("");
      setBlogMetaDescription("");
      setBlogFeaturedImage("");
      setBlogCategory("AI & Future Tech");
      setBlogContent("");
      setBlogAuthor("Admin Mentor");
      setBlogPublishDate(new Date().toISOString().split("T")[0]);
      setBlogKeywords("");
      setBlogCanonicalUrl("");
    }
    setShowBlogModal(true);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast("Access Denied: You do not have database admin privileges.");
      return;
    }

    if (!blogTitle.trim() || !blogSlug.trim() || !blogContent.trim()) {
      setBlogError("Required Fields: Title, Slug, and Rich Editor content are mandatory.");
      return;
    }

    const cleanSlug = blogSlug.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");

    let finalContentUrl = "";
    try {
      // Create an HTML file Blob and upload it using put() (uploadBytes as put)
      const contentBlob = new Blob([blogContent], { type: "text/html;charset=utf-8" });
      const timestamp = Date.now();
      const contentRef = ref(storage, `blogs/content/${timestamp}_${cleanSlug}.html`);
      
      const contentPromise = put(contentRef, contentBlob);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Content file upload timed out...")), 6000)
      );
      
      const uploadTask = await Promise.race([contentPromise, timeoutPromise]);
      finalContentUrl = await getDownloadURL(uploadTask.ref);
    } catch (contentErr) {
      console.warn("Could not upload blog content to Firebase Storage, saving inline content field only:", contentErr);
    }

    const payload: any = {
      title: blogTitle.trim(),
      slug: cleanSlug,
      metaTitle: blogMetaTitle.trim() || blogTitle.trim(),
      metaDescription: blogMetaDescription.trim() || blogTitle.trim().slice(0, 150),
      seoKeywords: blogKeywords.trim(),
      canonicalUrl: blogCanonicalUrl.trim(),
      featuredImage: blogFeaturedImage || "https://images.unsplash.com/photo-1516116211223-5c359a36298a?auto=format&fit=crop&q=80&w=800",
      category: blogCategory,
      content: blogContent,
      contentUrl: finalContentUrl,
      author: blogAuthor.trim() || "Admin Mentor",
      publishDate: blogPublishDate || new Date().toISOString().split("T")[0],
    };

    if (user?.uid === "demo_admin_uid") {
      const currentList = [...blogsList];
      if (editingBlog) {
        const idx = currentList.findIndex(b => b.id === editingBlog.id);
        const updated = { ...editingBlog, ...payload };
        if (idx > -1) {
          currentList[idx] = updated;
        }
        setBlogsList(currentList);
        localStorage.setItem("demo_blogs", JSON.stringify(currentList));
        showToast("Success: Edited article (Demo mode simulation saved)");
      } else {
        const newBlogObj = { id: `blog_${Date.now()}`, ...payload, createdAt: new Date() };
        currentList.unshift(newBlogObj);
        setBlogsList(currentList);
        localStorage.setItem("demo_blogs", JSON.stringify(currentList));
        showToast("Success: Published article! (Demo mode simulation saved)");
      }
      setShowBlogModal(false);
      return;
    }

    try {
      if (editingBlog) {
        const refDoc = doc(db, "blogs", editingBlog.id);
        await updateDoc(refDoc, { ...payload });
        showToast("Success: Post has been modified and updated!");
      } else {
        const blogsCol = collection(db, "blogs");
        await addDoc(blogsCol, {
          ...payload,
          createdAt: serverTimestamp()
        });
        showToast("Success: SEO learning guide published live to website!");
      }
      setShowBlogModal(false);
    } catch (err: any) {
      console.error("Firestore blog save error:", err);
      setBlogError(`Database write rejected: ${err?.message || String(err)}`);
      handleFirestoreError(err, editingBlog ? OperationType.UPDATE : OperationType.CREATE, editingBlog ? `blogs/${editingBlog.id}` : "blogs");
    }
  };

  const handleDeleteBlog = (blogItem: any) => {
    if (!isAdmin) return;
    setConfirmModal({
      isOpen: true,
      title: "Confirm Post Deletion?",
      message: `Are you sure you want to permanently delete "${blogItem.title}"? Users will no longer be able to read it.`,
      confirmLabel: "Delete Post",
      isDanger: true,
      onConfirm: async () => {
        if (user?.uid === "demo_admin_uid") {
          const filtered = blogsList.filter(b => b.id !== blogItem.id);
          setBlogsList(filtered);
          localStorage.setItem("demo_blogs", JSON.stringify(filtered));
          showToast("Success: Post deleted from local storage (Demo Mode)");
          setConfirmModal(null);
          return;
        }

        try {
          const docRef = doc(db, "blogs", blogItem.id);
          await deleteDoc(docRef);
          showToast("Success: Article successfully deleted!");
        } catch (err: any) {
          console.error("Firestore delete blog error:", err);
          showToast(`Delete rejected: ${err?.message || String(err)}`);
          handleFirestoreError(err, OperationType.DELETE, `blogs/${blogItem.id}`);
        }
        setConfirmModal(null);
      }
    });
  };

  const handleStartEditUser = (u: any) => {
    setEditingUser(u);
    setUserModalForm({
      fullName: u.fullName || "",
      mobile: u.mobile || "",
      address: u.address || "",
      city: u.city || "",
      state: u.state || "",
      country: u.country || ""
    });
    setShowUserModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (user?.uid === "demo_admin_uid") {
      const stored = localStorage.getItem("demo_users");
      const currentList: any[] = stored ? JSON.parse(stored) : fallbackUsers;
      const updated = currentList.map(usr => 
        usr.id === editingUser.id ? { ...usr, ...userModalForm } : usr
      );
      localStorage.setItem("demo_users", JSON.stringify(updated));
      setUsersList(updated);
      showToast("Success: Modified student profile locally (Demo Mode)");
      setShowUserModal(false);
      setEditingUser(null);
      return;
    }

    try {
      const uDocRef = doc(db, "users", editingUser.id);
      await updateDoc(uDocRef, {
        fullName: userModalForm.fullName.trim(),
        mobile: userModalForm.mobile.trim(),
        address: userModalForm.address.trim(),
        city: userModalForm.city.trim(),
        state: userModalForm.state.trim(),
        country: userModalForm.country.trim()
      });
      showToast("Student profile details revised live successfully!");
      setShowUserModal(false);
      setEditingUser(null);
    } catch (err: any) {
      console.error("Firebase update user error:", err);
      showToast(`Database write rejected: ${err?.message || String(err)}`);
    }
  };

  const handleToggleDisableUser = async (st: any) => {
    const nextDisabled = !st.disabled;
    setConfirmModal({
      isOpen: true,
      title: nextDisabled ? "Disable Student Entry?" : "Re-activate Student Entry?",
      message: nextDisabled
        ? `Are you absolutely sure you want to temporarily disable entry clearance for "${st.fullName || st.email}"? Their session clearance will be blocked immediately.`
        : `Are you sure you want to restore regular account clearances for "${st.fullName || st.email}"?`,
      confirmLabel: nextDisabled ? "Suspend Account" : "Activate Account",
      isDanger: nextDisabled,
      onConfirm: async () => {
        if (user?.uid === "demo_admin_uid") {
          const stored = localStorage.getItem("demo_users");
          const currentList: any[] = stored ? JSON.parse(stored) : fallbackUsers;
          const updated = currentList.map(usr => 
            usr.id === st.id ? { ...usr, disabled: nextDisabled } : usr
          );
          localStorage.setItem("demo_users", JSON.stringify(updated));
          setUsersList(updated);
          showToast(`Success: Suspended status updated locally (Demo Mode)`);
          setConfirmModal(null);
          return;
        }

        try {
          const uDocRef = doc(db, "users", st.id);
          await updateDoc(uDocRef, {
            disabled: nextDisabled
          });
          showToast(`Student credentials ${nextDisabled ? "temporarily disabled" : "safely restored"}`);
        } catch (err: any) {
          console.error("Firebase toggle disable user error:", err);
          showToast(`Failed: ${err?.message || String(err)}`);
        }
        setConfirmModal(null);
      }
    });
  };

  const handleDeleteUserDoc = (st: any) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirm Complete Profile Erasure?",
      message: `Are you absolutely sure you want to permanently erase the database profile data for student "${st.fullName || st.email}"? This deletion cannot be reversed.`,
      confirmLabel: "Hard Erasure",
      isDanger: true,
      onConfirm: async () => {
        if (user?.uid === "demo_admin_uid") {
          const stored = localStorage.getItem("demo_users");
          const currentList: any[] = stored ? JSON.parse(stored) : fallbackUsers;
          const filtered = currentList.filter(usr => usr.id !== st.id);
          localStorage.setItem("demo_users", JSON.stringify(filtered));
          setUsersList(filtered);
          showToast("Success: User profile deleted from local storage (Demo Mode)");
          setConfirmModal(null);
          return;
        }

        try {
          const uDocRef = doc(db, "users", st.id);
          await deleteDoc(uDocRef);
          showToast("Student profile database registration purged permanently.");
        } catch (err: any) {
          console.error("Firebase delete user error:", err);
          showToast(`Failed: ${err?.message || String(err)}`);
        }
        setConfirmModal(null);
      }
    });
  };

  // CSV Export utility
  const handleExportCrmCSV = () => {
    if (usersList.length === 0) {
      showToast("No student profile logs exist in database to export.");
      return;
    }

    // Comprehensive list of headers
    const headers = [
      "UID", "Full Name", "Email Address", "Mobile Contact", "Street Address", "City", "State", "Country", 
      "YouTube Channel", "Instagram Handle", "Facebook Profile", "LinkedIn Profile", "X/Twitter Profile", "Telegram Username", "Personal Website",
      "Registration Method", "Email Verified", "Onboarding Complete", "Total Orders", "Total Spent (INR)", "Last Purchase Timestamp", 
      "Active Cart Items", "Completed Course Purchases", "Applied Coupon Codes",
      "Created At", "Updated At"
    ];

    const rows = usersList.map(u => {
      // Helper to cleanly map fields to avoid blank NULL outputs
      const mapVal = (val: any) => {
        if (val === undefined || val === null) return "";
        if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
        if (typeof val === "object" && val.seconds) {
          return new Date(val.seconds * 1000).toISOString();
        }
        if (val instanceof Date) return val.toISOString();
        return String(val).replace(/"/g, '""'); // CSV escape double quotes
      };

      const userUid = u.uid || u.id;
      const stats = getUserEcommerceStats(u);
      
      const cartDesc = stats.userCartItems.map(item => `${item.productTitle || "Course"} (x${item.quantity || 1})`).join(" | ") || "Empty Cart";
      const purchasedProducts = Array.from(new Set(stats.completedOrders.map((o: any) => o.courseName || o.courseId).filter(Boolean))).join(" | ") || "None";
      const appliedCoupons = Array.from(new Set(stats.userOrders.map((o: any) => o.couponCode).filter((c: any) => c && c !== "None"))).join(" | ") || "None";

      const lastPurchaseDateVal = stats.completedOrders.length > 0 
        ? stats.completedOrders[stats.completedOrders.length - 1].createdAt 
        : "";

      return [
        mapVal(u.uid || u.id),
        mapVal(u.fullName),
        mapVal(u.email),
        mapVal(u.mobile),
        mapVal(u.address),
        mapVal(u.city),
        mapVal(u.state),
        mapVal(u.country),
        mapVal(u.youtubeUrl),
        mapVal(u.instagramUrl),
        mapVal(u.facebookUrl),
        mapVal(u.linkedinUrl),
        mapVal(u.twitterUrl),
        mapVal(u.telegramUsername),
        mapVal(u.websiteUrl),
        mapVal(u.signupMethod),
        mapVal(u.emailVerified),
        mapVal(u.onboardingCompleted),
        mapVal(stats.orderCount),
        mapVal(stats.amountSpent),
        mapVal(lastPurchaseDateVal),
        mapVal(cartDesc),
        mapVal(purchasedProducts),
        mapVal(appliedCoupons),
        mapVal(u.createdAt),
        mapVal(u.updatedAt)
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `L2F_CRM_Students_Database_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV Database Export successfully triggered!");
  };

  // Excel (.xlsx) Export utility
  const handleExportCrmExcel = () => {
    if (usersList.length === 0) {
      showToast("No student profile logs exist in database to export.");
      return;
    }

    const data = usersList.map(u => {
      const parseStamp = (val: any) => {
        if (val === undefined || val === null) return "";
        if (typeof val === "object" && val.seconds) {
          return new Date(val.seconds * 1000).toLocaleString();
        }
        return String(val);
      };

      const userUid = u.uid || u.id;
      const stats = getUserEcommerceStats(u);

      const cartDesc = stats.userCartItems.map(item => `${item.productTitle || "Course"} (x${item.quantity || 1})`).join(" | ") || "Empty Cart";
      const purchasedProducts = Array.from(new Set(stats.completedOrders.map((o: any) => o.courseName || o.courseId).filter(Boolean))).join(" | ") || "None";
      const appliedCoupons = Array.from(new Set(stats.userOrders.map((o: any) => o.couponCode).filter((c: any) => c && c !== "None"))).join(" | ") || "None";

      const lastPurchaseDateVal = stats.completedOrders.length > 0 
        ? stats.completedOrders[stats.completedOrders.length - 1].createdAt 
        : "";

      return {
        "User ID / UID": u.uid || u.id || "",
        "Student Full Name": u.fullName || "Unbound Draft",
        "Email Address": u.email || "",
        "Mobile Phone": u.mobile || "",
        "Street Address": u.address || "",
        "City": u.city || "",
        "State/Province": u.state || "",
        "Country": u.country || "India",
        "YouTube Channel URL": u.youtubeUrl || "",
        "Instagram Profile URL": u.instagramUrl || "",
        "Facebook Profile URL": u.facebookUrl || "",
        "LinkedIn Profile URL": u.linkedinUrl || "",
        "X/Twitter Profile URL": u.twitterUrl || "",
        "Telegram Username": u.telegramUsername || "",
        "Personal Website URL": u.websiteUrl || "",
        "Registration Source": u.signupMethod || "Email",
        "Email Verified": u.emailVerified === true ? "YES" : "NO",
        "Onboarding Finished": u.onboardingCompleted === true ? "YES" : "NO",
        "Account Clearance": u.disabled === true ? "Disabled" : "Active",
        "Active Cart Items": cartDesc,
        "Purchased Products (Verified)": purchasedProducts,
        "Applied Coupons History": appliedCoupons,
        "Cart Items Count": stats.cartCount,
        "Wishlist Items Count": stats.wishlistCount,
        "Total Orders (Placed)": stats.orderCount,
        "Total Spent Sum (₹)": stats.amountSpent,
        "Last Purchase Timestamp": parseStamp(lastPurchaseDateVal),
        "Creation Timestamp": parseStamp(u.createdAt),
        "Last Profile Updated": parseStamp(u.updatedAt)
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto Column Width Calculation
    const colWidths = Object.keys(data[0] || {}).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...data.map((row: any) => String(row[key] || "").length)
      );
      return { wch: Math.min(Math.max(maxLen + 2, 11), 35) };
    });
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "L2F Student CRM Matrix");

    XLSX.writeFile(workbook, `L2F_CRM_Students_Database_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast("Excel Spreadsheet Database Export triggered!");
  };

  // Export Orders list (CSV)
  const handleExportOrdersCSV = () => {
    if (orders.length === 0) {
      showToast("No orders available in database to export.");
      return;
    }
    const headers = [
      "Order ID", "Customer Name", "Email", "Mobile", "Telegram", "Amount (INR)", "Coupon Applied", "Discount Value", "Payment Gateway", "Payment/Razorpay ID", "Order Status", "Course/Product ID", "Purchased At", "Screenshot Url"
    ];
    const rows = orders.map(o => {
      const mapVal = (val: any) => {
        if (val === undefined || val === null) return "";
        if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
        if (typeof val === "object" && val.seconds) {
          return new Date(val.seconds * 1000).toISOString();
        }
        if (val instanceof Date) return val.toISOString();
        return String(val).replace(/"/g, '""');
      };
      return [
        mapVal(o.id),
        mapVal(o.name),
        mapVal(o.email),
        mapVal(o.mobile),
        mapVal(o.telegram),
        mapVal(o.amount),
        mapVal(o.couponCode),
        mapVal(o.couponDiscount),
        mapVal(o.paymentMethod),
        mapVal(o.razorpayPaymentId || o.paymentId),
        mapVal(o.status),
        mapVal(o.courseId),
        mapVal(o.createdAt || o.date),
        mapVal(o.screenshotUrl)
      ];
    });
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `L2F_Purchases_Orders_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Orders ledger CSV exported successfully!");
  };

  // Export Cart Activity (CSV)
  const handleExportCartActivityCSV = () => {
    const cartLogs = activityLogsList.filter(log => 
      log.activityType?.toLowerCase().includes("cart") || 
      log.action?.toLowerCase().includes("cart") || 
      log.description?.toLowerCase().includes("cart")
    );
    if (cartLogs.length === 0) {
      showToast("No cart activities detected in current activity logs database.");
      return;
    }
    const headers = [
      "Log ID", "User UID", "Email ID", "Action Activity Name", "Scope Course", "Timestamp Detail"
    ];
    const rows = cartLogs.map(l => {
      const mapVal = (val: any) => {
        if (val === undefined || val === null) return "";
        if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
        if (typeof val === "object" && val.seconds) {
          return new Date(val.seconds * 1000).toISOString();
        }
        if (val instanceof Date) return val.toISOString();
        return String(val).replace(/"/g, '""');
      };
      return [
        mapVal(l.id),
        mapVal(l.userId),
        mapVal(l.userEmail || l.email),
        mapVal(l.activityType || l.action),
        mapVal(l.courseTitle || l.details),
        mapVal(l.timestamp)
      ];
    });
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `L2F_Cart_Ledger_Activity_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Cart Ledger Activity CSV exported successfully!");
  };

  // Export Active Carts across all users (CSV)
  const handleExportActiveCartsCSV = () => {
    if (allCartItemsList.length === 0) {
      showToast("No active cart items exist in the database right now.");
      return;
    }

    const headers = [
      "Cart Item ID", "Student UID", "Student Email ID", "Course Title", "Category", "Quantity", "Price (INR)", "Total Value (INR)", "Added At"
    ];

    const rows = allCartItemsList.map(item => {
      const mapVal = (val: any) => {
        if (val === undefined || val === null) return "";
        if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
        if (typeof val === "object" && val.seconds) {
          return new Date(val.seconds * 1000).toISOString();
        }
        if (val instanceof Date) return val.toISOString();
        return String(val).replace(/"/g, '""');
      };

      const quantity = Number(item.quantity || 1);
      const unitPrice = Number(item.price || 0);
      const totalVal = quantity * unitPrice;

      return [
        mapVal(item.id),
        mapVal(item.userId),
        mapVal(item.userEmail || item.email),
        mapVal(item.productTitle),
        mapVal(item.productCategory || "Digital Product"),
        mapVal(quantity),
        mapVal(unitPrice),
        mapVal(totalVal),
        mapVal(item.addedAt)
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `L2F_Active_Student_Carts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Active student carts database CSV exported successfully!");
  };

  // Export Meta Ads audience list (CSV)
  const handleExportMetaAudienceCSV = () => {
    if (usersList.length === 0) {
      showToast("No active users directory available to construct audience.");
      return;
    }
    const headers = [
      "email", "fn", "ln", "phone", "country", "event_name", "value"
    ];
    const rows = usersList.map(u => {
      const mapVal = (val: any) => {
        if (val === undefined || val === null) return "";
        return String(val).trim().toLowerCase().replace(/"/g, '""');
      };
      const nameParts = (u.fullName || "").trim().split(/\s+/);
      const fn = nameParts[0] || "";
      const ln = nameParts.slice(1).join(" ") || "";
      
      let assumedEvent = "ViewContent";
      let valAmt = "0";
      if (u.purchasedCourse) {
        assumedEvent = "Purchase";
        valAmt = String(u.totalSpent || "1999");
      } else if (u.initiatedCheckout) {
        assumedEvent = "InitiateCheckout";
        valAmt = "1499";
      } else if (u.addedToCart) {
        assumedEvent = "AddToCart";
        valAmt = "1499";
      }
      return [
        mapVal(u.email),
        mapVal(fn),
        mapVal(ln),
        mapVal(u.mobile),
        mapVal(u.country || "IN"),
        assumedEvent,
        valAmt
      ];
    });
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `L2F_MetaAds_Retargeting_Audience_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Meta Ads Lookalike Audience CSV successfully generated!");
  };

  const handleUpdateReviewStatus = async (review: Review, nextStatus: "Approved" | "Rejected") => {
    try {
      const docId = review.id || `${review.userId}_${review.category.replace(/\s+/g, '_')}`;
      const reviewDocRef = doc(db, "reviews", docId);
      await setDoc(reviewDocRef, {
        status: nextStatus,
        updatedAt: serverTimestamp()
      }, { merge: true });
      showToast(`Success: Review status set to ${nextStatus}`);
    } catch (err: any) {
      console.error("Firebase update review status error:", err);
      showToast(`Failed: ${err?.message || String(err)}`);
    }
  };

  const handleDeleteReviewAdmin = (reviewId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Student Review?",
      message: `Are you sure you want to permanently delete this student review from the public wall? This action cannot be undone.`,
      confirmLabel: "Delete permanently",
      isDanger: true,
      onConfirm: async () => {
        try {
          const reviewDocRef = doc(db, "reviews", reviewId);
          await deleteDoc(reviewDocRef);
          showToast("Review deleted successfully.");
        } catch (err: any) {
          console.error("Firebase delete review error:", err);
          showToast(`Failed: ${err?.message || String(err)}`);
        }
        setConfirmModal(null);
      }
    });
  };

  // Seed Default Demo Catalog Courses if database is empty initially
  const handleSeedCourses = async () => {
    const defaultCatalog: Omit<Course, "id">[] = [
      {
        title: "Self-Operative AI Mastery Blueprint",
        category: "AI Tools",
        price: 1999,
        description: "Learn how to prompt, configure, and stack autonomous agents with LLMs to automate 80% of your business processes and freelance workflow.",
        thumbnail: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800",
        createdAt: serverTimestamp()
      },
      {
        title: "Cinema-Grade Premiere Pro & After Effects Suite",
        category: "Video Editing",
        price: 2499,
        description: "A comprehensive deep-dive into digital storytelling, dynamic pacing, keyframing, motion typography, and commercial visual effects editing.",
        thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=800",
        createdAt: serverTimestamp()
      },
      {
        title: "YouTube Automation & Retention Masterclass",
        category: "YouTube Growth",
        price: 1499,
        description: "Step-by-step framework to discover highly profitable niches, generate viral scripts, double click-through rates, and engineer retention above 65%.",
        thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=800",
        createdAt: serverTimestamp()
      }
    ];

    setLoading(true);

    if (user?.uid === "demo_admin_uid") {
      try {
        const seeded: Course[] = defaultCatalog.map((c, i) => ({
          ...c as any as Course,
          id: "seeded_course_" + Date.now() + "_" + i,
          createdAt: new Date()
        }));
        localStorage.setItem("demo_courses", JSON.stringify(seeded));
        await fetchAllAdminData();
      } catch (err) {
        console.error("Local seeding courses failure:", err);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      for (const item of defaultCatalog) {
        await addDoc(collection(db, "courses"), item);
      }
      alert("Success: Seeded 3 starter future-ready courses to your Firebase live catalog! You can now manage them freely.");
      await fetchAllAdminData();
    } catch (e: any) {
      console.error("Seeding courses warning:", e);
      alert(`Database rejected seeding: ${e?.message || String(e)}. Check your firestore.rules configuration.`);
    } finally {
      setLoading(false);
    }
  };

  // Analytics helper stats
  const totalCourses = courses.length;
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "Pending" || o.status === "pending").length;
  const approvedOrders = orders.filter(o => o.status === "Verified" || o.status === "Approved" || o.status === "approved").length;
  const verifiedOrders = approvedOrders;
  const deliveredOrders = orders.filter(o => o.status === "Delivered" || o.status === "delivered").length;
  const contactCount = contactMsgs.length;

  // Calculate gross gross revenue
  const totalGrossRevenue = orders
    .filter(o => o.status === "Verified" || o.status === "Approved" || o.status === "approved" || o.status === "Delivered" || o.status === "delivered")
    .reduce((accum, currOrder) => {
      // Find course price
      const associatedCourse = courses.find(c => c.id === currOrder.courseId);
      const actualPrice = associatedCourse ? associatedCourse.price : 1499; // Fallback premium baseline
      return accum + actualPrice;
    }, 0);

  // Block route rendering if non-admin
  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center py-24 select-none">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-neutral-500 font-mono tracking-wider uppercase">Evaluating clearance policies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
      
      {/* Brand Dashboard header row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#151515] p-6 rounded-2xl border border-neutral-200 dark:border-brand-border">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-brand-gold uppercase bg-brand-gold/10 px-2.5 py-1 rounded-md border border-brand-gold/20">
              Administrative Control Layer
            </span>
            {totalCourses === 0 && (
              <button
                onClick={handleSeedCourses}
                className="text-[10px] bg-indigo-500/10 text-indigo-400 font-mono hover:bg-indigo-500/25 px-2 py-0.5 rounded border border-indigo-500/20"
                title="Seed 3 Default catalog items if DB courses are empty"
              >
                Seed Default Courses
              </button>
            )}
          </div>
          <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
            Learn 2 Future Admin Portal <ShieldCheck className="w-6 h-6 text-brand-gold" />
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Current system session verified for administrator: <strong className="text-neutral-700 dark:text-neutral-300">{user?.email}</strong>
          </p>
        </div>

        <button 
          onClick={logout}
          className="flex items-center space-x-1.5 text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2.5 rounded-xl transition-all font-display border border-red-500/20"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Exit Panel</span>
        </button>
      </div>

      {/* DASH NAVIGATION RAIL */}
      <div className="flex flex-wrap gap-2.5 border-b border-neutral-200 dark:border-brand-border pb-4 mb-6 select-none">
        {(["analytics", "courses", "orders", "contacts", "settings", "blogs", "coupons", "users", "reviews", "student-portfolios", "homepage-settings", "affiliates"] as AdminTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`font-display text-[10px] sm:text-xs uppercase tracking-wider font-semibold px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === tab
                ? "text-black bg-brand-gold border-brand-gold font-bold shadow-md shadow-brand-gold/10"
                : "text-neutral-500 bg-neutral-50 dark:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white border-neutral-200 dark:border-neutral-850"
            }`}
          >
            {tab === "contacts" ? "Contact Tickets" : tab === "settings" ? "Settings" : tab === "blogs" ? "SEO Blogs" : tab === "coupons" ? "Coupons & Access" : tab === "users" ? "Manage Users" : tab === "reviews" ? "Student Reviews" : tab === "student-portfolios" ? "Student success stories" : tab === "homepage-settings" ? "Homepage CMS & Orbit" : tab === "affiliates" ? "Affiliate Program CRM" : tab}
          </button>
        ))}
      </div>

      {/* DYNAMIC TAB CONTROLLING VIEWPORTS */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* TAB 1: ANALYTICS HUBVIEW */}
          {activeTab === "analytics" && (() => {
            const estimatedVisits = (courses.length * 15) + (orders.length * 8) + (contactMsgs.length * 4) + 142;
            const activatedCheckouts = orders.length;
            const completedEnrollments = orders.filter(o => o.status === "Verified" || o.status === "Delivered").length;
            const conversionRate = activatedCheckouts > 0 ? ((completedEnrollments / activatedCheckouts) * 100).toFixed(1) : "0.0";

            // Category counts
            const categoriesMap = courses.reduce((acc, curr) => {
              acc[curr.category] = (acc[curr.category] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            // Course Sales Leaderboard
            const leaderboard = courses.map(c => {
              const matchingOrders = orders.filter(o => o.courseId === c.id);
              const paidOrders = matchingOrders.filter(o => o.status === "Verified" || o.status === "Delivered");
              const gross = paidOrders.length * c.price;
              return {
                ...c,
                enrollments: matchingOrders.length,
                paidCount: paidOrders.length,
                gross
              };
            }).sort((a, b) => b.gross - a.gross);

            // Live Activity Timestamps Logs
            const activityLogs = [
              ...orders.map(o => ({
                id: "evt_ord_" + o.id,
                time: o.createdAt ? new Date(o.createdAt) : new Date(),
                type: "order",
                title: o.status === "Pending" ? "UPI Check Pending" : o.status === "Verified" ? "Payment Approved" : "Credentials Sent",
                body: `${o.name} listed for ${courses.find(c => c.id === o.courseId)?.title || "Premium Course"}`,
                status: o.status
              })),
              ...contactMsgs.map(m => ({
                id: "evt_msg_" + m.id,
                time: m.createdAt ? new Date(m.createdAt) : new Date(),
                type: "message",
                title: "Ticket Received",
                body: `Inquiry by ${m.name}: "${m.subject}"`,
                status: "Message"
              }))
            ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);

            return (
              <div className="space-y-8 animate-in fade-in duration-200" id="admin-analytics-panel">
                
                {/* Stat Bento layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  
                  {/* Stat block 1 */}
                  <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212] rounded-3xl flex flex-col justify-between space-y-4 hover:border-brand-gold/30 transition-all shadow-md">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono">Catalog Courses</span>
                      <div className="p-2 bg-brand-gold/10 text-brand-gold rounded-lg">
                        <BookOpen className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <span className="text-3xl font-display font-black text-neutral-900 dark:text-white">{totalCourses}</span>
                      <span className="block text-[10px] text-neutral-400 mt-1">Syllabus modules online</span>
                    </div>
                  </div>

                  {/* Stat block 2 */}
                  <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212] rounded-3xl flex flex-col justify-between space-y-4 hover:border-brand-gold/30 transition-all shadow-md">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-[#F5B300] uppercase tracking-widest font-mono font-bold">Total Earnings</span>
                      <div className="p-2 bg-yellow-500/10 text-brand-gold rounded-lg">
                        <Coins className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <span className="text-2xl font-display font-black text-brand-gold">₹{totalGrossRevenue.toLocaleString("en-IN")}</span>
                      <span className="block text-[10px] text-neutral-400 mt-1">Gross cleared proceeds</span>
                    </div>
                  </div>

                  {/* Stat block 3 */}
                  <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212] rounded-3xl flex flex-col justify-between space-y-4 hover:border-red-500/30 transition-all shadow-md">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-red-500 uppercase tracking-widest font-mono font-bold">Pending Orders</span>
                      <div className="p-2 bg-red-500/10 text-red-400 rounded-lg animate-pulse">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <span className="text-3xl font-display font-black text-red-500">{pendingOrders}</span>
                      <span className="block text-[10px] text-neutral-400 mt-1">Awaiting manual check</span>
                    </div>
                  </div>

                  {/* Stat block 4 */}
                  <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212] rounded-3xl flex flex-col justify-between space-y-4 hover:border-blue-500/30 transition-all shadow-md">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-blue-500 uppercase tracking-widest font-mono font-bold">Approved Orders</span>
                      <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <span className="text-3xl font-display font-black text-blue-550 dark:text-blue-400">{approvedOrders}</span>
                      <span className="block text-[10px] text-neutral-400 mt-1">Approved for study</span>
                    </div>
                  </div>

                  {/* Stat block 5 */}
                  <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212] rounded-3xl flex flex-col justify-between space-y-4 hover:border-green-500/30 transition-all shadow-md">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-green-500 uppercase tracking-widest font-mono font-bold">Delivered Orders</span>
                      <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <span className="text-3xl font-display font-black text-green-400">{deliveredOrders}</span>
                      <span className="block text-[10px] text-neutral-400 mt-1">Delivered & completed</span>
                    </div>
                  </div>

                </div>

                {/* Mid-level visual charts & category structures */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left Column: Funnel Analytics */}
                  <div className="lg:col-span-2 p-6 md:p-8 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212] rounded-3xl space-y-6 shadow-xl">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-bold text-brand-gold uppercase tracking-widest">Growth Metrics</span>
                        <h3 className="font-display text-base font-bold text-neutral-900 dark:text-white">Student Conversion Funnel Flow</h3>
                      </div>
                      <div className="bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-xl text-xs font-mono font-bold">
                        Conversion: {conversionRate}%
                      </div>
                    </div>

                    {/* Custom crafted layout for visual funnel representation */}
                    <div className="space-y-5 py-2">
                      
                      {/* Step 1: Views */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-neutral-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 bg-neutral-400 rounded-sm"></span> 1. Catalog Traffic Impressions
                          </span>
                          <span className="font-bold text-neutral-700 dark:text-neutral-300">{estimatedVisits} visits</span>
                        </div>
                        <div className="h-5 bg-neutral-100 dark:bg-neutral-900 rounded-md overflow-hidden relative border border-neutral-200 dark:border-neutral-800">
                          <div className="h-full bg-neutral-400/30 transition-all duration-550 w-full flex items-center px-3">
                            <span className="text-[9px] font-mono font-bold text-neutral-600 dark:text-neutral-400">Baseline visits index</span>
                          </div>
                        </div>
                      </div>

                      {/* Step 2: Checkout Initiated */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-brand-gold font-semibold uppercase tracking-wider flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 bg-brand-gold/50 rounded-sm"></span> 2. Initiated Enrollments
                          </span>
                          <span className="font-bold text-brand-gold">{activatedCheckouts} checkouts ({estimatedVisits > 0 ? ((activatedCheckouts / estimatedVisits) * 100).toFixed(1) : 0}%)</span>
                        </div>
                        <div className="h-5 bg-neutral-100 dark:bg-neutral-900 rounded-md overflow-hidden relative border border-neutral-200 dark:border-neutral-800">
                          <div 
                            className="h-full bg-brand-gold/40 transition-all duration-555 flex items-center px-3 border-r-2 border-brand-gold"
                            style={{ width: `${Math.min(Math.max((activatedCheckouts / Math.max(estimatedVisits, 1)) * 100, 10), 100)}%` }}
                          >
                            <span className="text-[9px] font-mono font-bold text-brand-gold">Checkout triggers clickout</span>
                          </div>
                        </div>
                      </div>

                      {/* Step 3: Verified Deliveries */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-green-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 bg-green-500 rounded-sm"></span> 3. Payment Verified & Sent
                          </span>
                          <span className="font-bold text-green-400">{completedEnrollments} licenses ({activatedCheckouts > 0 ? ((completedEnrollments / activatedCheckouts) * 100).toFixed(1) : 0}%)</span>
                        </div>
                        <div className="h-5 bg-neutral-100 dark:bg-neutral-900 rounded-md overflow-hidden relative border border-neutral-200 dark:border-neutral-800">
                          <div 
                            className="h-full bg-green-500/30 transition-all duration-555 flex items-center px-3 border-r-2 border-green-500"
                            style={{ width: `${Math.min(Math.max((completedEnrollments / Math.max(estimatedVisits, 1)) * 100, 5), 100)}%` }}
                          >
                            <span className="text-[9px] font-mono font-bold text-green-400">Paid access credentials dispatch</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Right Column: Category Map */}
                  <div className="p-6 md:p-8 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212] rounded-3xl space-y-6 shadow-xl flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold text-brand-gold uppercase tracking-widest">Share Index</span>
                      <h3 className="font-display text-base font-bold text-neutral-900 dark:text-white">Curriculum Domains</h3>
                    </div>

                    <div className="space-y-4 my-2 flex-grow flex flex-col justify-center">
                      {Object.keys(categoriesMap).length === 0 ? (
                        <div className="text-center py-6 text-neutral-500 text-xs font-mono">
                          Empty Catalog directory. No domain shares available.
                        </div>
                      ) : (
                        Object.entries(categoriesMap).map(([cat, count]) => {
                          const percentage = totalCourses > 0 ? ((Number(count) / totalCourses) * 100).toFixed(0) : "0";
                          return (
                            <div key={cat} className="space-y-1">
                              <div className="flex justify-between text-xs font-mono text-neutral-400">
                                <span className="font-semibold text-neutral-300 truncate pr-2">{cat}</span>
                                <span className="font-bold text-brand-gold shrink-0">{count} course ({percentage}%)</span>
                              </div>
                              <div className="h-2 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-800">
                                <div 
                                  className="h-full bg-brand-gold rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-900">
                      <p className="text-[10px] text-neutral-500 text-center font-sans">
                        Marketplace directory covers <strong className="text-neutral-400">{Object.keys(categoriesMap).length} disciplines</strong> in e-learning ecosystems.
                      </p>
                    </div>
                  </div>

                </div>

                {/* COURSE SHARES & REFERRAL VIRALITY ENGINE PANEL */}
                {(() => {
                  const totalSharesCount = courseSharesList.length;
                  const totalReferralClicksCount = courseReferralsList.length;

                  // Platforms breakdown counts
                  const platformCounts = courseSharesList.reduce((acc, cShare) => {
                    const platform = String(cShare.platform || "unknown").toLowerCase();
                    acc[platform] = (acc[platform] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                  // Shares per course count map
                  const sharesPerCourseMap = courseSharesList.reduce((acc, cShare) => {
                    const cTitle = cShare.courseName || cShare.courseId || "Unknown Course";
                    acc[cTitle] = (acc[cTitle] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                  // Referral clicks per course count map
                  const referralsPerCourseMap = courseReferralsList.reduce((acc, cRef) => {
                    const cTitle = cRef.courseName || cRef.courseId || "Unknown Course";
                    acc[cTitle] = (acc[cTitle] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                  // Get most shared course
                  let topSharedCourseName = "None";
                  let topSharedCourseValue = 0;
                  (Object.entries(sharesPerCourseMap) as [string, number][]).forEach(([name, val]) => {
                    if (val > topSharedCourseValue) {
                      topSharedCourseName = name;
                      topSharedCourseValue = val;
                    }
                  });

                  // Platform display helper
                  const platformDisplayNames: Record<string, string> = {
                    whatsapp: "WhatsApp",
                    telegram: "Telegram",
                    facebook: "Facebook",
                    twitter: "X (Twitter)",
                    linkedin: "LinkedIn",
                    copylink: "Link Copied",
                    nativeshare: "Native Share Sheet"
                  };

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left: Engagement Overview & Platform Shares */}
                      <div className="p-6 md:p-8 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212] rounded-3xl space-y-6 shadow-xl text-left">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-bold text-[#F5B300] uppercase tracking-widest">Share metrics</span>
                          <h3 className="font-display text-base font-bold text-neutral-900 dark:text-white">Sharing Distribution</h3>
                          <p className="text-[11px] text-neutral-500">Track and breakdown of course sharing by social platforms.</p>
                        </div>

                        <div className="space-y-5">
                          <div className="p-4 bg-neutral-50 dark:bg-neutral-900/40 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                            <div>
                              <span className="text-[10px] text-neutral-400 font-mono uppercase">TOTAL SHARE ACTIONS</span>
                              <span className="block text-2xl font-black text-brand-gold">{totalSharesCount} shares</span>
                            </div>
                            <div className="px-3.5 py-1.5 bg-[#F5B300]/10 text-brand-gold rounded-xl text-xs font-mono font-bold">
                              Virality Active
                            </div>
                          </div>

                          <div className="p-4 bg-neutral-50 dark:bg-neutral-900/40 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                            <div>
                              <span className="text-[10px] text-neutral-400 font-mono uppercase">MOST SHARED COURSE</span>
                              <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-1 line-clamp-1">{topSharedCourseName}</span>
                            </div>
                            <div className="shrink-0 px-2.5 py-1 bg-white dark:bg-neutral-800 border dark:border-neutral-700 text-neutral-800 dark:text-brand-gold rounded-lg text-xs font-mono font-bold">
                              {topSharedCourseValue} shares
                            </div>
                          </div>

                          {/* Social Platforms list */}
                          <div className="space-y-3.5 pt-1.5">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 font-semibold block">Shares by Platform</span>
                            {Object.keys(platformDisplayNames).map(pKey => {
                              const cnt = platformCounts[pKey] || 0;
                              const percentage = totalSharesCount > 0 ? ((cnt / totalSharesCount) * 100).toFixed(0) : "0";
                              return (
                                <div key={pKey} className="space-y-1.5">
                                  <div className="flex justify-between text-xs font-mono text-neutral-450">
                                    <span className="font-semibold text-neutral-450">{platformDisplayNames[pKey] || pKey}</span>
                                    <span className="font-bold text-neutral-800 dark:text-neutral-200">{cnt} shares ({percentage}%)</span>
                                  </div>
                                  <div className="h-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50">
                                    <div 
                                      className="h-full bg-brand-gold rounded-full" 
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Shares per Course Leaderboard */}
                      <div className="p-6 md:p-8 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212] rounded-3xl space-y-6 shadow-xl text-left">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-bold text-brand-gold uppercase tracking-widest">Enrollment triggers</span>
                          <h3 className="font-display text-base font-bold text-neutral-900 dark:text-white">Shares Per Course</h3>
                          <p className="text-[11px] text-neutral-500">Most engaged courses being recommended by students.</p>
                        </div>

                        <div className="space-y-4 pt-1 flex-grow">
                          {Object.keys(sharesPerCourseMap).length === 0 ? (
                            <div className="text-center py-12 text-neutral-500 text-xs font-mono">
                              No courses shared yet in this tracking segment.
                            </div>
                          ) : (
                            (Object.entries(sharesPerCourseMap) as [string, number][])
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 5)
                              .map(([cName, count], idx) => {
                                const relClicks = referralsPerCourseMap[cName] || 0;
                                return (
                                  <div key={idx} className="p-3 bg-neutral-50 dark:bg-neutral-900/40 rounded-xl border border-neutral-200/60 dark:border-neutral-800/40 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-200 truncate leading-snug">{cName}</h4>
                                      <p className="text-[10px] text-neutral-450 mt-0.5 font-mono">
                                        Referral CTR: <span className="text-brand-gold font-bold">{count > 0 ? ((relClicks / count) * 100).toFixed(0) : 0}%</span> (Clicks: {relClicks})
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="font-mono font-bold text-xs text-brand-gold p-1 bg-brand-gold/15 border border-brand-gold/20 rounded-md">
                                        {count} Shares
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                          )}
                        </div>
                      </div>

                      {/* Right: Viral Referrals Tracking Leaderboard */}
                      <div className="p-6 md:p-8 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212] rounded-3xl space-y-6 shadow-xl text-left">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-bold text-brand-gold uppercase tracking-widest">Viral marketing</span>
                          <h3 className="font-display text-base font-bold text-neutral-900 dark:text-white">Referral Click Leads</h3>
                          <p className="text-[11px] text-neutral-500">Total verified incoming clicks driven by user sharing.</p>
                        </div>

                        <div className="space-y-5">
                          <div className="p-4 bg-neutral-50 dark:bg-neutral-900/40 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                            <div>
                              <span className="text-[10px] text-neutral-400 font-mono uppercase">TOTAL REFERRAL CLICKS</span>
                              <span className="block text-2xl font-black text-brand-gold">{totalReferralClicksCount} clicks</span>
                            </div>
                            <div className="px-3.5 py-1.5 bg-[#F5B300]/10 text-brand-gold rounded-xl text-xs font-mono font-bold">
                              CTR Tracked
                            </div>
                          </div>

                          <div className="space-y-3.5">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 font-semibold block">Referrer Virality Leaderboard</span>
                            {(() => {
                              // Who shared the most click-throughs
                              const referrerLeaderboard = courseReferralsList.reduce((acc, cRef) => {
                                const refId = cRef.referrerId || "anonymous";
                                acc[refId] = (acc[refId] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>);

                              const sortedReferrers = (Object.entries(referrerLeaderboard) as [string, number][])
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 4);

                              if (sortedReferrers.length === 0) {
                                return (
                                  <div className="text-center py-6 text-neutral-500 text-xs font-mono">
                                    No referral clicks logged yet.
                                  </div>
                                );
                              }

                              return sortedReferrers.map(([refId, clicks], idx) => {
                                return (
                                  <div key={idx} className="flex justify-between items-center p-2.5 bg-neutral-100/50 dark:bg-neutral-900/30 rounded-xl border border-neutral-150 dark:border-brand-border/40 text-xs">
                                    <div className="min-w-0">
                                      <p className="font-mono text-[9px] text-[#F5B3002] text-brand-gold/80 block uppercase leading-none mb-1">Rank #{idx+1} Shares Link</p>
                                      <p className="font-bold font-mono text-[10px] text-neutral-800 dark:text-neutral-300 truncate tracking-wide">
                                        ID: {refId.slice(0, 12)}...
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="font-sans font-bold text-xs text-neutral-850 dark:text-neutral-250 p-1.5 bg-neutral-105 dark:bg-neutral-800 rounded-lg">
                                        {clicks} clicks driven
                                      </span>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* CRM USER DATABASE ANALYTICS INSIGHTS */}
                {(() => {
                  const totalCrmUsers = usersList.length;
                  const verifiedCrmUsers = usersList.filter(u => u.emailVerified === true).length;
                  const googleCrmSignups = usersList.filter(u => u.signupMethod === "Google").length;
                  const emailCrmSignups = usersList.filter(u => u.signupMethod === "Email" || !u.signupMethod).length;
                  
                  const maleCrmUsers = usersList.filter(u => {
                    const g = (u.gender || "").toLowerCase();
                    return g === "male" || g === "m";
                  }).length;
                  
                  const femaleCrmUsers = usersList.filter(u => {
                    const g = (u.gender || "").toLowerCase();
                    return g === "female" || g === "f";
                  }).length;

                  const countryBreakdown = usersList.reduce((acc, curr) => {
                    const country = curr.country || "India";
                    acc[country] = (acc[country] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                  const cityBreakdown = usersList.reduce((acc, curr) => {
                    const city = curr.city || "Not Provided";
                    acc[city] = (acc[city] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                  const sortedTopCities = Object.entries(cityBreakdown)
                    .filter(([name]) => name !== "Not Provided" && name !== "Not specified")
                    .map(([name, count]) => ({ name, count: Number(count) }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                  return (
                    <div className="p-6 md:p-8 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212] rounded-3xl space-y-6 shadow-xl text-xs text-left">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-bold text-brand-gold uppercase tracking-widest">Customer CRM Dynamics</span>
                        <h3 className="font-display text-base font-bold text-neutral-900 dark:text-white">Customer Database & Demographics Insights</h3>
                        <p className="text-[11px] text-neutral-500">Live platform metrics from onboarded students registration logs.</p>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
                        {/* total base */}
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                          <p className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">Total CRM Users</p>
                          <p className="text-2xl font-bold font-display text-neutral-900 dark:text-white mt-1">{totalCrmUsers}</p>
                        </div>

                        {/* verified */}
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                          <p className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">Verified Accounts</p>
                          <p className="text-2xl font-bold font-display text-green-500 mt-1">
                            {verifiedCrmUsers} 
                            <span className="text-xs text-neutral-500 ml-1">({totalCrmUsers > 0 ? ((verifiedCrmUsers / totalCrmUsers) * 100).toFixed(0) : 0}%)</span>
                          </p>
                        </div>

                        {/* signups */}
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                          <p className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">Source (Google / Email)</p>
                          <p className="text-lg font-bold font-mono text-brand-gold mt-1.5">
                            G: {googleCrmSignups} <span className="text-neutral-500 text-xs">/</span> E: {emailCrmSignups}
                          </p>
                        </div>

                        {/* gender */}
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                          <p className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">Gender (M / F / Unspecified)</p>
                          <p className="text-lg font-bold font-mono text-cyan-400 mt-1.5">
                            M: {maleCrmUsers} <span className="text-neutral-550 text-xs">/</span> F: {femaleCrmUsers} <span className="text-neutral-550 text-xs">/</span> U: {totalCrmUsers - maleCrmUsers - femaleCrmUsers}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* country */}
                        <div className="p-5 border border-neutral-200 dark:border-neutral-850 bg-neutral-50/20 dark:bg-black/20 rounded-2xl space-y-3">
                          <h4 className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-200 dark:border-neutral-800 pb-2">Student Country Breakdown</h4>
                          {Object.keys(countryBreakdown).length === 0 ? (
                            <p className="text-[11px] text-neutral-550 italic font-mono py-2">No student records in database.</p>
                          ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                               {Object.entries(countryBreakdown).map(([country, count]) => {
                                const percentage = totalCrmUsers > 0 ? ((Number(count) / totalCrmUsers) * 100).toFixed(0) : "0";
                                return (
                                  <div key={country} className="flex justify-between items-center text-xs text-neutral-600 dark:text-neutral-350">
                                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{country}</span>
                                    <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{Number(count)} profiles ({percentage}%)</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* cities */}
                        <div className="p-5 border border-neutral-200 dark:border-neutral-850 bg-neutral-50/20 dark:bg-black/20 rounded-2xl space-y-3">
                          <h4 className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-200 dark:border-neutral-800 pb-2">Top Cities Representation</h4>
                          {sortedTopCities.length === 0 ? (
                            <p className="text-[11px] text-neutral-550 italic font-mono py-2">No standard cities details available.</p>
                          ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                              {sortedTopCities.map(({ name, count }) => {
                                const percentage = totalCrmUsers > 0 ? ((Number(count) / totalCrmUsers) * 100).toFixed(0) : "0";
                                return (
                                  <div key={name} className="flex justify-between items-center text-xs text-neutral-600 dark:text-neutral-350">
                                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{name}</span>
                                    <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{Number(count)} profiles ({percentage}%)</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })()}

                {/* Course Sales & Earnings Popularity Leaderboard */}
                <div className="p-6 md:p-8 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212] rounded-3xl space-y-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold text-brand-gold uppercase tracking-widest">Performance Indexes</span>
                      <h3 className="font-display text-base font-bold text-neutral-900 dark:text-white">Program Sales & Popularity Leaderboard</h3>
                    </div>
                    <p className="text-[10px] font-mono text-neutral-500">Live stats aggregated by real transaction registers</p>
                  </div>

                  {leaderboard.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-neutral-200 dark:border-neutral-850 bg-neutral-50/50 dark:bg-neutral-900/10 rounded-2xl">
                      <p className="text-xs text-neutral-500 font-mono">No courses found in database to evaluate sales metrics.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto text-[#121212] dark:text-[#f4f4f4]">
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-[#fcfcfc] dark:bg-black/60 text-neutral-400 font-mono text-[9px] uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-900">
                          <tr>
                            <th className="px-5 py-3">Course Title</th>
                            <th className="px-5 py-3">Category</th>
                            <th className="px-5 py-3">Sales Price</th>
                            <th className="px-5 py-3">Gross Enrolled</th>
                            <th className="px-5 py-3">Cleared Payments</th>
                            <th className="px-5 py-3 text-right">Revenue Generated</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                          {leaderboard.map((item) => (
                            <tr key={item.id} className="hover:bg-neutral-55 dark:hover:bg-[#161616]/40 transition-colors">
                              <td className="px-5 py-3.5 font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
                                <img src={item.thumbnail || null} alt="" className="w-8 h-8 object-cover rounded border border-neutral-200 dark:border-brand-border/45 shrink-0" />
                                <span className="truncate max-w-xs">{item.title}</span>
                              </td>
                              <td className="px-5 py-3.5"><span className="text-[10px] font-mono font-semibold bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded uppercase">{item.category}</span></td>
                              <td className="px-5 py-3.5 font-mono text-neutral-500 dark:text-neutral-400">₹{item.price.toLocaleString("en-IN")}</td>
                              <td className="px-5 py-3.5 font-mono">{item.enrollments} sales</td>
                              <td className="px-5 py-3.5 font-mono">
                                <span className="text-green-500 font-bold">{item.paidCount} approved</span>
                              </td>
                              <td className="px-5 py-3.5 text-right font-mono font-extrabold text-[#F5B300]">₹{item.gross.toLocaleString("en-IN")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* PAYMENT SAFETY, AUDITING & BACKEND RECOVERY CENTER */}
                {(() => {
                  const revByDayDict: { [key: string]: number } = {};
                  const revByMonthDict: { [key: string]: number } = {};

                  orders.forEach((o) => {
                    const status = o.status?.toLowerCase() || "";
                    if (["verified", "approved", "delivered", "success"].includes(status)) {
                      const price = Number(o.amount || o.price || 0);
                      
                      let dateObj: Date | null = null;
                      if (o.createdAt) {
                        if ((o.createdAt as any).seconds) {
                          dateObj = new Date((o.createdAt as any).seconds * 1000);
                        } else if (typeof o.createdAt === "string" || o.createdAt instanceof Date) {
                          dateObj = new Date(o.createdAt);
                        }
                      } else if (o.date) {
                        if ((o.date as any).seconds) {
                          dateObj = new Date((o.date as any).seconds * 1000);
                        } else if (typeof o.date === "string" || o.date instanceof Date) {
                          dateObj = new Date(o.date);
                        }
                      }

                      if (dateObj && !isNaN(dateObj.getTime())) {
                        const dayStr = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                        const monthStr = dateObj.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
                        revByDayDict[dayStr] = (revByDayDict[dayStr] || 0) + price;
                        revByMonthDict[monthStr] = (revByMonthDict[monthStr] || 0) + price;
                      }
                    }
                  });

                  const revByDayList = Object.entries(revByDayDict)
                    .map(([day, val]) => ({ day, val }))
                    .slice(-5);
                  
                  const revByMonthList = Object.entries(revByMonthDict)
                    .map(([month, val]) => ({ month, val }));

                  const successRzpLogs = paymentLogsList.filter(
                    (l) => l.status === "Verified Success" || l.status === "Verified" || l.status?.toLowerCase().includes("success")
                  ).length;
                  const failedRzpLogs = paymentLogsList.filter(
                    (l) => l.status === "Failed" || l.status?.toLowerCase().includes("fail") || l.error
                  ).length;
                  const totalRzpLogs = successRzpLogs + failedRzpLogs;
                  const razorpaySuccessRate = totalRzpLogs > 0 ? Math.round((successRzpLogs / totalRzpLogs) * 100) : 100;

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="admin-payment-security-ledger">
                      
                      {/* Left Column (2-Span): Chronological Database Sales Audit Logs & Financial Trends */}
                      <div className="lg:col-span-2 p-6 md:p-8 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212] rounded-3xl space-y-6 shadow-xl text-left">
                        <div className="flex justify-between items-center pb-2 border-b border-neutral-150 dark:border-neutral-900">
                          <div>
                            <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase tracking-widest block">Security ledger</span>
                            <h3 className="font-display text-base font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                              Chronological Sales & Audits Grid <ShieldCheck className="w-4 h-4 text-emerald-500 inline fill-emerald-500/10" />
                            </h3>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-mono font-semibold">LIVE SYNCED</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Revenue by Day */}
                          <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-900 space-y-3">
                            <div className="flex justify-between items-center">
                              <h4 className="text-[10px] font-black text-neutral-500 font-mono uppercase tracking-wider">🗓️ Net Sales By Day</h4>
                              <span className="text-[9px] font-mono text-neutral-400">Last 5 Days</span>
                            </div>
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
                              {revByDayList.length === 0 ? (
                                <p className="text-[10px] text-neutral-500 font-mono py-2 text-center">No transactions registered yet.</p>
                              ) : (
                                revByDayList.map(({ day, val }) => (
                                  <div key={day} className="flex justify-between items-center py-2 text-xs font-mono">
                                    <span className="font-semibold text-neutral-600 dark:text-neutral-400">{day}</span>
                                    <span className="font-extrabold text-brand-gold">₹{val.toLocaleString("en-IN")}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Revenue by Month */}
                          <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-900 space-y-3">
                            <div className="flex justify-between items-center">
                              <h4 className="text-[10px] font-black text-neutral-500 font-mono uppercase tracking-wider">📊 Net Sales By Month</h4>
                              <span className="text-[9px] font-mono text-neutral-400">History</span>
                            </div>
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
                              {revByMonthList.length === 0 ? (
                                <p className="text-[10px] text-neutral-500 font-mono py-2 text-center">No transactions registered yet.</p>
                              ) : (
                                revByMonthList.map(({ month, val }) => (
                                  <div key={month} className="flex justify-between items-center py-2 text-xs font-mono">
                                    <span className="font-semibold text-neutral-600 dark:text-neutral-400">{month}</span>
                                    <span className="font-extrabold text-[#F5B300]">₹{val.toLocaleString("en-IN")}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 mt-4">
                          <h4 className="text-[10px] font-black text-neutral-500 font-mono uppercase tracking-wider">📑 Razorpay Logging & Failures Console</h4>
                          <div className="max-h-[190px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-900 border border-neutral-150 dark:border-neutral-900 bg-black/5 dark:bg-black/30 rounded-2xl p-3 scrollable-element">
                            {paymentLogsList.length === 0 ? (
                              <p className="text-[11px] text-neutral-500 font-mono py-6 text-center">Awaiting logging signals... No Razorpay platform actions observed.</p>
                            ) : (
                              paymentLogsList.slice(0, 15).map((pl) => (
                                <div key={pl.id} className="py-2.5 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1.5 text-[10px] font-mono">
                                  <div className="space-y-0.5 text-left">
                                    <p className="font-extrabold text-neutral-800 dark:text-neutral-200">
                                      Payment: <span className="select-all text-neutral-500 font-normal">{pl.paymentId}</span>
                                    </p>
                                    <p className="text-neutral-500 text-[9px]">
                                      User ID: <span className="select-all text-neutral-400">{pl.userId}</span> | Order: <span className="select-all text-neutral-400">{pl.orderId}</span>
                                    </p>
                                    {pl.error && <p className="text-red-400 font-medium text-[9px]">Tracepoint: {pl.error}</p>}
                                  </div>
                                  <div className="sm:text-right shrink-0">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                      pl.status === "Verified Success" || pl.status?.toLowerCase().includes("success")
                                        ? "bg-green-550/15 text-green-500"
                                        : "bg-red-500/10 text-red-400"
                                    }`}>
                                      {pl.status}
                                    </span>
                                    <span className="block text-neutral-500 text-[8px] mt-1">
                                      {pl.timestamp ? new Date(pl.timestamp).toLocaleTimeString("en-IN") : "N/A"}
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Background Payment Recovery Hub & Live Status */}
                      <div className="p-6 md:p-8 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212] rounded-3xl space-y-6 shadow-xl text-left flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="pb-2 border-b border-neutral-100 dark:border-neutral-900">
                            <span className="text-[9px] font-mono font-bold text-blue-500 uppercase tracking-widest block">Background Workers</span>
                            <h3 className="font-display text-base font-bold text-neutral-900 dark:text-white">Payment Recovery Hub</h3>
                          </div>

                          <div className="p-4 bg-black/5 dark:bg-black/30 rounded-2xl border border-neutral-100 dark:border-neutral-900 flex justify-between items-center font-mono">
                            <div>
                              <span className="text-[9px] text-neutral-500 uppercase block font-bold">GATEWAY INTEGRITY RATE</span>
                              <span className="text-2xl font-black text-brand-gold">{razorpaySuccessRate}%</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8.5px] block text-neutral-400">SUCCESS: <strong className="text-green-500 font-extrabold">{successRzpLogs}</strong></span>
                              <span className="text-[8.5px] block text-neutral-400">FAILS: <strong className="text-red-500 font-extrabold">{failedRzpLogs}</strong></span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <span className="text-zinc-500 uppercase font-bold">Recovery Queue:</span>
                              <span className="font-bold text-zinc-400">
                                {paymentRecoveryQueueList.filter(qi => qi.status === "Pending").length} Pending / {paymentRecoveryQueueList.filter(qi => qi.status === "Resolved").length} Resolved
                              </span>
                            </div>

                            <div className="max-h-[160px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-900 border border-neutral-150 dark:border-neutral-900 rounded-xl p-2.5 bg-neutral-50 dark:bg-black/20 text-[10px] font-mono scrollable-element">
                              {paymentRecoveryQueueList.length === 0 ? (
                                <p className="text-[10px] text-zinc-500 text-center py-8">Recovery channel is transparent. No fallbacks queued.</p>
                              ) : (
                                paymentRecoveryQueueList.map(item => (
                                  <div key={item.id} className="py-2 flex flex-col gap-1">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-bold text-neutral-850 dark:text-stone-300 truncate max-w-[130px]">{item.productTitle}</p>
                                        <p className="text-[8.5px] text-zinc-500">Student: <span className="select-all text-neutral-400">{item.userId}</span></p>
                                      </div>
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${
                                        item.status === "Resolved" ? "bg-green-550/15 text-green-550" : "bg-red-500/10 text-red-400 animate-pulse"
                                      }`}>
                                        {item.status}
                                      </span>
                                    </div>
                                    {item.error && <p className="text-[8.5px] text-red-400 leading-tight">Error: {item.error}</p>}
                                    <p className="text-[8.5px] text-zinc-500">Retries: {item.retryCount || 0} | Attempted: {item.lastAttempt ? new Date(item.lastAttempt).toLocaleTimeString("en-IN") : "Never"}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-neutral-150 dark:border-neutral-900 space-y-2.5 text-left">
                          <p className="text-[9px] font-mono text-neutral-400/80 leading-relaxed">
                            * The platform runs a background retry loop every 10 minutes to process failures. You can manually force run the worker below.
                          </p>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const btn = document.getElementById("manual-retry-button") as HTMLButtonElement;
                                if (btn) btn.disabled = true;
                                showToast("Initiating manual transaction recovery retry loop on server...");
                                
                                const resp = await fetch("/api/pay/trigger-recovery-retry", { method: "POST" });
                                if (resp.ok) {
                                  const result = await resp.json();
                                  showToast("SUCCESS: Recovery loop execution completed! Double check student profiles.");
                                } else {
                                  showToast("ERROR: Manual retry run failed on server.");
                                }
                              } catch (err) {
                                showToast("ERROR: Exception connecting to manual retry endpoint.");
                              } finally {
                                const btn = document.getElementById("manual-retry-button") as HTMLButtonElement;
                                if (btn) btn.disabled = false;
                              }
                            }}
                            id="manual-retry-button"
                            className="w-full bg-brand-gold hover:bg-[#ffd34d] text-black font-sans font-extrabold text-[10px] uppercase tracking-widest py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-black" />
                            <span>Force Run Recovery Retry Engine</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })()}

                {/* Unified Recent Event Stream Activity Logger */}
                <div className="p-6 md:p-8 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212] rounded-3xl space-y-6 shadow-xl">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold text-brand-gold uppercase tracking-widest">Realtime Events</span>
                    <h3 className="font-display text-base font-bold text-neutral-900 dark:text-white">Active Operational Log Ledger</h3>
                  </div>

                  <div className="relative border-l border-neutral-200 dark:border-neutral-800 ml-4 py-2 space-y-6">
                    {activityLogs.length === 0 ? (
                      <div className="pl-6 text-neutral-500 text-xs font-mono py-4">
                        Awaiting system transmissions... No recent operational activity recorded.
                      </div>
                    ) : (
                      activityLogs.map((log) => (
                        <div key={log.id} className="relative pl-6 animate-in slide-in-from-left duration-250">
                          
                          {/* Dot indicator */}
                          <span className={`absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-[#121212] ${
                            log.type === "message" 
                              ? "bg-amber-400" 
                              : log.status === "Pending" 
                              ? "bg-red-500" 
                              : "bg-green-500"
                          }`}></span>

                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                            <h4 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                              {log.title}
                              <span className="text-[8px] uppercase tracking-widest font-mono bg-neutral-100 dark:bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-500">
                                {log.type}
                              </span>
                            </h4>
                            <span className="text-[9px] font-mono text-neutral-500">{log.time.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                          </div>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans mt-1 leading-normal">
                            {log.body}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            );
          })()}

          {/* TAB 2: COURSE CATALOG CRUD */}
          {activeTab === "courses" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Header management block */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Active Curriculums</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Total listed courses on active marketplace directories.</p>
                </div>
                <div className="flex items-center space-x-2">
                  {courses.length > 0 && (
                    <button
                      onClick={handleDeleteAllCourses}
                      className="border border-red-500/30 text-red-500 bg-red-500/5 dark:bg-red-500/15 hover:bg-red-500/25 font-display font-medium text-xs py-2.5 px-4 rounded-xl flex items-center space-x-1.5 transition-all shadow-md active:scale-95 duration-200 animate-in fade-in"
                      title="Clear complete courses catalog"
                    >
                      <Trash className="w-4 h-4 shrink-0" />
                      <span>Delete All Courses</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      resetCourseFormState();
                      setShowCourseModal(true);
                    }}
                    className="bg-[#F5B300] hover:bg-[#F5B300]/90 text-black font-display font-bold text-xs py-2.5 px-4 rounded-xl flex items-center space-x-1.5 transition-all shadow-md active:scale-95 duration-200"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Insert Program</span>
                  </button>
                </div>
              </div>

              {/* Listed Courses Table/Grid */}
              {courses.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212] rounded-3xl space-y-4 shadow-xl">
                  <div className="w-14 h-14 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-neutral-900 dark:text-white">Your catalog is currently empty</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                      Write your first future-ready syllabus manually by clicking <strong>"Insert Program"</strong> above, or instantly feed starter courses to the live database below.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handleSeedCourses}
                      className="bg-brand-gold text-black font-display font-black text-xs uppercase tracking-widest py-3 px-6 rounded-xl hover:bg-gold hover:shadow-lg hover:shadow-brand-gold/20 active:scale-95 transition-all duration-200"
                    >
                      🚀 Seed Starter Catalog Now
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {courses.map((course) => (
                    <div 
                      key={course.id}
                      className="p-5 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl flex gap-4 overflow-hidden relative group"
                    >
                      {/* Left side Thumbnail */}
                      <div className="w-24 h-24 rounded-lg bg-neutral-900 overflow-hidden shrink-0 border border-brand-border/40">
                        <img 
                          src={course.thumbnail || null} 
                          alt={course.title}
                          className="w-full h-full object-cover" 
                        />
                      </div>

                      {/* Metadata */}
                      <div className="flex-grow min-w-0 pr-12 space-y-1.5 flex flex-col justify-between">
                        <div className="space-y-1">
                          <span className="text-[8.5px] font-mono tracking-widest bg-brand-gold/10 text-brand-gold font-bold px-2 py-0.5 rounded uppercase">
                            {course.category}
                          </span>
                          <h4 className="font-display text-sm font-bold truncate text-neutral-900 dark:text-white leading-snug">
                            {course.title}
                          </h4>
                          <p className="text-[10px] text-neutral-500 line-clamp-2">
                            {course.description}
                          </p>
                        </div>
                        <span className="font-display text-xs font-bold text-brand-gold font-mono block">
                          ₹{course.price.toLocaleString("en-IN")}
                        </span>
                      </div>

                      {/* Edit Delete Action cluster */}
                      <div className="absolute top-4 right-4 flex flex-col space-y-2">
                        <button
                          onClick={() => startEditCourse(course)}
                          className="p-1.5 bg-neutral-100 dark:bg-brand-border hover:text-brand-gold rounded-lg transition-colors text-neutral-400"
                          title="Edit modules"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id || "")}
                          className="p-1.5 bg-neutral-100 dark:bg-brand-border hover:text-red-500 rounded-lg transition-colors text-neutral-400"
                          title="Delete syllabus"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: CUSTOMER ORDERS LISTING/WORKFLOW */}
          {activeTab === "orders" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Customer Transaction Desk</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Match UPI screens with internal logs to verify licenses.</p>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-brand-border bg-[#151515] rounded-2xl space-y-3">
                  <FileText className="w-10 h-10 text-neutral-500 mx-auto" />
                  <h4 className="text-sm font-semibold text-neutral-400">No Orders Registered</h4>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">Catalog purchases compiled by customers will display here instantly.</p>
                </div>
              ) : (
                <div className="border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead className="bg-[#1f1f1f]/50 dark:bg-[#191919]/60 border-b border-brand-border text-neutral-400 font-mono text-[10px] uppercase">
                        <tr>
                          <th className="px-6 py-4">Transaction / Buyer</th>
                          <th className="px-6 py-4">Direct Contact</th>
                          <th className="px-6 py-4">Enrolled Course</th>
                          <th className="px-6 py-4">Image Check</th>
                          <th className="px-6 py-4">Approval State</th>
                          <th className="px-6 py-4">Deliverable Access</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                        {orders.map((o) => {
                          const matchingCour = courses.find(c => c.id === o.courseId);
                          
                          return (
                            <tr key={o.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/45 transition-colors">
                              
                              {/* Buyer details */}
                              <td className="px-6 py-4 space-y-1">
                                <span className="font-semibold block text-neutral-900 dark:text-white text-sm">{o.name}</span>
                                <span className="text-[10px] text-neutral-500 font-mono block select-all">{o.email}</span>
                              </td>

                              {/* Telegram Handle */}
                              <td className="px-6 py-4 font-semibold font-mono">
                                <a 
                                  href={`https://t.me/${o.telegram}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-brand-gold hover:underline flex items-center space-x-1"
                                >
                                  <span>@{o.telegram}</span>
                                  <ExternalLink className="w-3 h-3 opacity-60" />
                                </a>
                              </td>

                              {/* Associated Course */}
                              <td className="px-6 py-4 font-semibold">
                                {matchingCour ? (
                                  <div className="space-y-0.5">
                                    <span className="text-neutral-900 dark:text-white truncate max-w-44 block leading-snug">{matchingCour.title}</span>
                                    <span className="text-[9.5px] font-mono text-brand-gold">₹{matchingCour.price.toLocaleString("en-IN")}</span>
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    <span className="text-neutral-900 dark:text-white truncate max-w-44 block leading-snug">{o.courseName || "Unknown Course"}</span>
                                    <span className="text-[9.5px] font-mono text-brand-gold">₹{(o.price || 1499).toLocaleString("en-IN")}</span>
                                  </div>
                                )}
                              </td>

                              {/* Transaction Screen Preview trigger */}
                              <td className="px-6 py-4">
                                {(o.screenshotUrl || o.proofImage) ? (
                                  <button
                                    onClick={() => setViewScreenshotUrl(o.screenshotUrl || o.proofImage)}
                                    className="text-indigo-400 hover:text-indigo-300 font-mono text-xs flex items-center space-x-1.5 focus:outline-none bg-indigo-500/10 hover:bg-indigo-500/15 py-1 px-2.5 rounded-md"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Verify Proof</span>
                                  </button>
                                ) : (
                                  <span className="text-neutral-500 italic block">None Submitted</span>
                                )}
                              </td>

                              {/* Verification status pill */}
                              <td className="px-6 py-4">
                                <select
                                  value={o.status}
                                  onChange={(e) => {
                                    const nextStatus = e.target.value;
                                    confirmAndUpdateStatus(o.id || "", nextStatus, o.name);
                                  }}
                                  className={`font-mono text-xs font-bold px-3 py-1.5 rounded-xl border outline-none bg-white dark:bg-[#151515] hover:opacity-90 cursor-pointer transition-all ${
                                    o.status?.toLowerCase() === "pending" ? "text-yellow-500 border-yellow-500/30 bg-yellow-500/5 dark:bg-yellow-500/15 focus:border-yellow-500" :
                                    o.status?.toLowerCase() === "approved" || o.status?.toLowerCase() === "verified" ? "text-blue-500 border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/15 focus:border-blue-500" :
                                    o.status?.toLowerCase() === "delivered" ? "text-green-500 border-green-500/30 bg-green-500/5 dark:bg-green-500/15 focus:border-green-500" :
                                    o.status?.toLowerCase() === "refunded" ? "text-red-500 border-red-500/30 bg-red-500/5 dark:bg-red-500/15 focus:border-red-500" :
                                    "text-neutral-500 border-neutral-500/30 bg-neutral-500/5 dark:bg-neutral-500/15 focus:border-neutral-500"
                                  }`}
                                >
                                  <option value="pending" className="text-yellow-500 bg-white dark:bg-[#151515]">Pending</option>
                                  <option value="approved" className="text-blue-500 bg-white dark:bg-[#151515]">Approved</option>
                                  <option value="delivered" className="text-green-500 bg-white dark:bg-[#151515]">Delivered</option>
                                  <option value="refunded" className="text-red-500 bg-white dark:bg-[#151515]">Refunded</option>
                                  <option value="cancelled" className="text-neutral-500 bg-white dark:bg-[#151515]">Cancelled</option>
                                </select>
                              </td>

                              {/* Deliverable Access Details */}
                              <td className="px-6 py-4 font-mono text-[10.5px] leading-relaxed select-none">
                                <div className="space-y-1.5 bg-neutral-100/50 dark:bg-neutral-900/50 border border-neutral-105 dark:border-neutral-900/80 p-3 rounded-xl max-w-xs">
                                  <div>
                                    <span className="text-neutral-400 block font-mono text-[9px] uppercase tracking-wider">Course Name</span>
                                    <span className="text-neutral-900 dark:text-neutral-150 font-bold block truncate max-w-[155px]" title={matchingCour?.title || o.courseName}>
                                      {matchingCour?.title || o.courseName}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-neutral-400 block font-mono text-[9px] uppercase tracking-wider">Buyer Name</span>
                                    <span className="text-neutral-900 dark:text-neutral-200 font-semibold block truncate max-w-[155px]" title={o.name}>
                                      {o.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-neutral-400">Payment Status:</span>
                                    <span className={`font-bold ${
                                      o.status?.toLowerCase() === "pending" ? "text-red-500" :
                                      o.status?.toLowerCase() === "approved" || o.status?.toLowerCase() === "verified" ? "text-blue-500" : "text-green-500"
                                    }`}>{o.status}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-neutral-400">Delivery Status:</span>
                                    <span className={`font-bold ${o.status?.toLowerCase() === "delivered" ? "text-green-500" : "text-amber-500"}`}>
                                      {o.status?.toLowerCase() === "delivered" ? "Active/Delivered" : "Awaiting Audit"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-neutral-400">Link Available:</span>
                                    <span className={`font-bold ${matchingCour?.deliverableLink ? "text-green-500" : "text-red-500"}`}>
                                      {matchingCour?.deliverableLink ? "Yes" : "No"}
                                    </span>
                                  </div>
                                  
                                  {/* Metrics tracking telemetry */}
                                  <div className="pt-2 mt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800 text-[9px] text-neutral-400 space-y-1">
                                    <div className="flex items-center justify-between text-brand-gold font-bold">
                                      <span>Clicks Tracker:</span>
                                      <span>{o.accessCount || 0} times</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span>Last Clicked:</span>
                                      <span className="font-semibold text-neutral-300">
                                        {o.lastAccessTime ? (
                                          o.lastAccessTime.seconds 
                                            ? new Date(o.lastAccessTime.seconds * 1000).toLocaleString("en-GB") 
                                            : new Date(o.lastAccessTime).toLocaleString("en-GB")
                                        ) : "Never"}
                                      </span>
                                    </div>
                                    {o.purchasedAt && (
                                      <div className="flex items-center justify-between">
                                        <span>Verified At:</span>
                                        <span className="text-neutral-350">
                                          {o.purchasedAt.seconds 
                                            ? new Date(o.purchasedAt.seconds * 1000).toLocaleDateString() 
                                            : new Date(o.purchasedAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                    )}
                                    {o.deliveredAt && (
                                      <div className="flex items-center justify-between">
                                        <span>Delivered At:</span>
                                        <span className="text-neutral-350">
                                          {o.deliveredAt.seconds 
                                            ? new Date(o.deliveredAt.seconds * 1000).toLocaleDateString() 
                                            : new Date(o.deliveredAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Approval trigger buttons */}
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5 font-mono text-[10.5px]">
                                  
                                  <button
                                    onClick={() => confirmAndUpdateStatus(o.id || "", "approved", o.name)}
                                    disabled={o.status?.toLowerCase() === "approved" || o.status?.toLowerCase() === "verified"}
                                    className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1 transition-all ${
                                      (o.status?.toLowerCase() === "approved" || o.status?.toLowerCase() === "verified")
                                        ? "opacity-35 cursor-not-allowed border-neutral-200 dark:border-neutral-900 text-neutral-400"
                                        : "border-blue-500/30 text-blue-500 bg-blue-500/5 dark:bg-blue-500/15 hover:bg-blue-500/25 active:scale-95"
                                    }`}
                                    title="Mark order as Approved"
                                  >
                                    <Check className="w-3 h-3 shrink-0" />
                                    <span>Approve Order</span>
                                  </button>

                                  <button
                                    onClick={() => confirmAndUpdateStatus(o.id || "", "delivered", o.name)}
                                    disabled={o.status?.toLowerCase() === "delivered"}
                                    className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1 transition-all ${
                                      o.status?.toLowerCase() === "delivered"
                                        ? "opacity-35 cursor-not-allowed border-neutral-200 dark:border-neutral-900 text-neutral-400"
                                        : "border-green-500/30 text-green-500 bg-green-500/5 dark:bg-green-500/15 hover:bg-green-500/25 active:scale-95"
                                    }`}
                                    title="Mark order as Delivered"
                                  >
                                    <CheckCircle className="w-3 h-3 shrink-0" />
                                    <span>Mark Delivered</span>
                                  </button>

                                  <button
                                    onClick={() => handleDeleteOrder(o.id || "")}
                                    className="p-2 border border-red-500/30 text-red-500 bg-red-500/5 dark:bg-red-500/15 hover:bg-red-500/25 rounded-xl transition-all active:scale-95"
                                    title="Delete Order"
                                  >
                                    <Trash className="w-3.5 h-3.5 shrink-0" />
                                  </button>

                                </div>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 4: CONTACT TICKETS VIEW */}
          {activeTab === "contacts" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Active Support Inbox</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Total submitted feedback and support request tickets.</p>
                </div>
                {contactMsgs.length > 0 && (
                  <button
                    onClick={handleDeleteAllContacts}
                    className="border border-red-500/30 text-red-500 bg-red-500/5 dark:bg-red-500/15 hover:bg-red-500/25 font-display font-medium text-xs py-2.5 px-4 rounded-xl flex items-center space-x-1.5 transition-all shadow-md active:scale-95 duration-200 animate-in fade-in"
                    title="Clear complete support inbox"
                  >
                    <Trash className="w-4 h-4 shrink-0" />
                    <span>Delete All Tickets</span>
                  </button>
                )}
              </div>

              {contactMsgs.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-brand-border bg-[#151515] rounded-2xl space-y-3">
                  <Mail className="w-10 h-10 text-neutral-500 mx-auto" />
                  <h4 className="text-sm font-semibold text-neutral-400">Support Inbox Empty</h4>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">No help desk tickets have been logged on the website yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {contactMsgs.map((ticket) => (
                    <div 
                      key={ticket.id}
                      className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl flex flex-col justify-between space-y-4 relative"
                    >
                      <div className="space-y-3 pr-8">
                        <div className="space-y-1">
                          <span className="block text-[8.5px] font-mono tracking-widest text-[#F5B300] uppercase font-bold">
                            Subject: {ticket.subject}
                          </span>
                          <h4 className="font-display font-bold text-sm text-neutral-900 dark:text-white leading-snug">
                            {ticket.name}
                          </h4>
                          <span className="text-[10px] text-neutral-500 font-mono block select-all">{ticket.email}</span>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans border-t dark:border-neutral-900/50 pt-2 break-words">
                          {ticket.message}
                        </p>
                      </div>

                      {/* Delete Ticket button */}
                      <button
                        onClick={() => handleDeleteContact(ticket.id || "")}
                        className="absolute top-4 right-4 p-1.5 bg-neutral-100 dark:bg-brand-border hover:text-red-500 rounded-lg text-neutral-400 transition-colors"
                        title="Delete ticket entry"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div>
                <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Tracking & Analytics Settings</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Configure global marketing pixels, Google Tag Manager scripts, GA4 tracking codes, and Search Console verification. Only admins can access this section.</p>
              </div>

              <form onSubmit={handleSaveTrackingSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Meta Pixel Card */}
                  <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Meta Pixel ID</h4>
                        <span className="text-[10px] text-neutral-500 block">Injects Meta (Facebook) Pixel tracking code in the head.</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="metaPixelId">Pixel ID</label>
                      <input
                        id="metaPixelId"
                        type="text"
                        placeholder="e.g. 123456789012345"
                        value={metaPixelId}
                        onChange={(e) => setMetaPixelId(extractMetaPixelId(e.target.value))}
                        className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                      />
                      <span className="text-[10px] text-neutral-400 mt-1 block">
                        💡 paste either 15-digit ID or the complete pixel script. It auto-extracts.
                      </span>
                    </div>
                  </div>

                  {/* Google Tag Manager Card */}
                  <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-teal-500/10 text-teal-500 rounded-xl">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Google Tag Manager (GTM)</h4>
                        <span className="text-[10px] text-neutral-500 block">Injects GTM script in the head and the iframe noscript tag in the body.</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="gtmId">GTM Container ID</label>
                      <input
                        id="gtmId"
                        type="text"
                        placeholder="e.g. GTM-XXXXXXX"
                        value={gtmId}
                        onChange={(e) => setGtmId(extractGtmId(e.target.value))}
                        className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                      />
                      <span className="text-[10px] text-neutral-400 mt-1 block">
                        💡 paste Container ID (e.g., GTM-K2S9Z) or the whole GTM code snippet.
                      </span>
                    </div>
                  </div>

                  {/* Google Analytics GA4 Card */}
                  <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500/10 text-green-500 rounded-xl">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Google Analytics GA4</h4>
                        <span className="text-[10px] text-neutral-500 block">Dynamically loads gtag.js library and registers PageView configurations.</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="ga4Id">GA4 Measurement ID</label>
                      <input
                        id="ga4Id"
                        type="text"
                        placeholder="e.g. G-XXXXXXXXXX"
                        value={ga4Id}
                        onChange={(e) => setGa4Id(extractGa4Id(e.target.value))}
                        className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                      />
                      <span className="text-[10px] text-neutral-400 mt-1 block">
                        💡 paste G-XXXXXX Measurement ID or copy-paste the whole dynamic gtag block.
                      </span>
                    </div>
                  </div>

                  {/* Google Search Console Card */}
                  <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 8h16" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Google Search Console</h4>
                        <span className="text-[10px] text-neutral-500 block">Injects site ownership verification meta-tag inside the HTML head.</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="searchVerification">Verification Content Code</label>
                      <input
                        id="searchVerification"
                        type="text"
                        placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j"
                        value={searchConsoleVerification}
                        onChange={(e) => setSearchConsoleVerification(extractSearchConsoleVerification(e.target.value))}
                        className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                      />
                      <span className="text-[10px] text-neutral-400 mt-1 block">
                        💡 paste either verification content string or full site-verification meta HTML tag.
                      </span>
                    </div>
                  </div>

                  {/* Facebook Domain Verification Card */}
                  <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Facebook Domain Verification</h4>
                        <span className="text-[10px] text-neutral-500 block">Used for Facebook Business Manager domain ownership verification.</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="facebookDomainVerification">Domain Verification Code</label>
                      <input
                        id="facebookDomainVerification"
                        type="text"
                        placeholder="e.g. facebook-domain-verification=xxxxxxxxxxxxxxxxxxxxxxxx"
                        value={facebookDomainVerification}
                        onChange={(e) => setFacebookDomainVerification(extractFacebookDomainVerification(e.target.value))}
                        className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                      />
                      <span className="text-[10px] text-neutral-400 mt-1 block">
                        💡 Paste the Facebook domain verification meta tag content value or the complete meta tag.
                      </span>
                    </div>
                  </div>

                </div>

                {/* Form Action Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-200 dark:border-brand-border select-none">
                  <div className="flex items-center space-x-2 text-[11px] text-neutral-500">
                    <ShieldCheck className="w-4 h-4 text-brand-gold" />
                    <span>Configuration actions write directly to isolated settings collections in Firestore.</span>
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto font-display">
                    <button
                      type="button"
                      onClick={handleResetTrackingSettings}
                      disabled={savingSettings}
                      className="w-full sm:w-auto text-center border border-red-500/30 text-red-500 hover:bg-red-500/10 font-semibold text-xs py-3 px-6 rounded-xl transition-all"
                    >
                      Reset Settings
                    </button>
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="w-full sm:w-auto text-center bg-brand-gold hover:bg-brand-gold-hover text-black font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-brand-gold/20 flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {savingSettings ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Save Settings</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </form>

              {/* SECTION SPLITTER */}
              <div className="pt-8 border-t border-neutral-200 dark:border-brand-border/60"></div>

              {/* AUTOMATED PAYMENT GATEWAY SETTINGS */}
              <div>
                <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Payment Gateway Settings (Automated Razorpay API)</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Configure central credentials for automated course unlocking, real-time checkout popups, and secure signature validations. Only admins can view or update this section.</p>
              </div>

              <form onSubmit={handleSavePaymentSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Razorpay Key ID Card */}
                  <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-[#F5B300]/10 text-brand-gold rounded-xl">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h6z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white font-display">Razorpay Key ID</h4>
                        <span className="text-[10px] text-neutral-500 block">The API Key ID generated on your Merchant dashboard (used for frontend checkout dialog).</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="rzpKeyId">Key ID</label>
                      <input
                        id="rzpKeyId"
                        type="text"
                        placeholder="rzp_test_xxxxxxxxxxxx or rzp_live_xxxxxxxxxxxx"
                        value={razorpayKeyId}
                        onChange={(e) => setRazorpayKeyId(e.target.value.trim())}
                        className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                      />
                    </div>
                  </div>

                  {/* Razorpay Key Secret Card */}
                  <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white font-display">Razorpay Key Secret</h4>
                        <span className="text-[10px] text-neutral-500 block">Secure merchant key secret (kept strictly protected and validated on the backend environment).</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="rzpKeySecret">Key Secret</label>
                      <input
                        id="rzpKeySecret"
                        type="password"
                        placeholder="••••••••••••••••••••••••"
                        value={razorpayKeySecret}
                        onChange={(e) => setRazorpayKeySecret(e.target.value.trim())}
                        className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                      />
                    </div>
                  </div>

                  {/* Razorpay Webhook Secret Card */}
                  <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-teal-500/10 text-teal-500 rounded-xl">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white font-display">Razorpay Webhook Secret (Optional)</h4>
                        <span className="text-[10px] text-neutral-500 block">Verifies background webhook payloads for supplementary payment sync safety.</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="rzpWebhook">Webhook Secret Token</label>
                      <input
                        id="rzpWebhook"
                        type="text"
                        placeholder="e.g. your_webhook_payment_secret"
                        value={razorpayWebhookSecret}
                        onChange={(e) => setRazorpayWebhookSecret(e.target.value.trim())}
                        className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                      />
                    </div>
                    
                    {/* Interactive Callback URL helper */}
                    <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-[#222] rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Your webhook callback url</span>
                        <button
                          type="button"
                          onClick={() => {
                            const dynamicUrl = window.location.origin + "/api/pay/webhook";
                            navigator.clipboard.writeText(dynamicUrl).then(() => {
                              showToast("Webhook callback URL successfully copied to clipboard!");
                            }).catch(() => {
                              showToast("Could not copy automatically. Please select it manually.");
                            });
                          }}
                          className="text-[10px] text-brand-gold hover:opacity-80 font-medium cursor-pointer transition-opacity"
                        >
                          Copy Callback URL
                        </button>
                      </div>
                      <p className="text-xs font-mono text-neutral-700 dark:text-neutral-400 break-all bg-white dark:bg-[#0B0B0B] p-2 rounded-lg border border-neutral-200/40 dark:border-brand-border/40 select-all">
                        {window.location.origin + "/api/pay/webhook"}
                      </p>
                      <p className="text-[9px] text-neutral-400 leading-relaxed">
                        Copy this URL and add it under <strong>Webhooks</strong> in your Razorpay Dashboard. Set active events to <code>order.paid</code>, and create a secret that you paste above.
                      </p>
                    </div>
                  </div>

                  {/* Mode Toggles Card */}
                  <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-505/10 text-indigo-400 rounded-xl bg-purple-500/10">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white font-display">Gateway Mode Environment</h4>
                        <span className="text-[10px] text-neutral-500 block">Select active state to isolate sandbox testing from primary customer transactions.</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 justify-start py-2 select-none">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isTestMode}
                          onChange={(e) => {
                            setIsTestMode(e.target.checked);
                            if (e.target.checked) setIsLiveMode(false);
                          }}
                          className="w-4 h-4 accent-brand-gold rounded cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Sandbox Test Mode</span>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isLiveMode}
                          onChange={(e) => {
                            setIsLiveMode(e.target.checked);
                            if (e.target.checked) setIsTestMode(false);
                          }}
                          className="w-4 h-4 accent-brand-gold rounded cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Live Production Mode</span>
                      </label>
                    </div>
                    <span className="text-[10px] text-neutral-400 block pt-1 leading-relaxed">
                      💡 Ensure Key Secret corresponds to the exact environment toggled above (Test vs Live).
                    </span>

                    {user?.email?.toLowerCase() === "digitalcoursesbay@gmail.com" && (
                      <div className="pt-3 border-t border-neutral-100 dark:border-[#222] space-y-1">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enablePaymentSandbox}
                            onChange={(e) => setEnablePaymentSandbox(e.target.checked)}
                            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block font-display">Enable Payment Sandbox (Super Admin Override)</span>
                            <span className="text-[10px] text-neutral-500 block">Allow checkout simulations for quick sandbox debugging. Stripped automatically in PRODUCTION.</span>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                </div>

                {/* Form Action Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-200 dark:border-brand-border select-none animate-in fade-in duration-200">
                  <div className="flex items-center space-x-2 text-[11px] text-neutral-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Dynamic parameters are parsed and cached onto server instances immediately on save.</span>
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto font-display">
                    <button
                      type="submit"
                      disabled={savingPaymentSettings}
                      className="w-full sm:w-auto text-center bg-brand-gold hover:bg-brand-gold-hover text-black font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-brand-gold/20 flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {savingPaymentSettings ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving Parameters...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Save Gateway Settings</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </form>

              {/* SECTION SPLITTER */}
              <div className="pt-8 border-t border-neutral-200 dark:border-brand-border/60"></div>

              {/* NEW SECTION: GLOBAL BUSINESS SETTINGS */}
              <div>
                <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Global Business Settings</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Configure global payment details, copy buttons, direct support channels, and social media handles. Every page dynamically updates instantly.</p>
              </div>

              <form onSubmit={handleSaveBusinessSettings} className="space-y-6 pb-12">
                
                {/* 1. Payment Settings Subgroup */}
                <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <div className="w-1.5 h-3 bg-brand-gold rounded"></div>
                      Payment & UPI Settings
                    </h4>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Control the details shown on step 1 of the enrollment page.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* UPI ID */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider" htmlFor="upiIdInput">
                        UPI ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="upiIdInput"
                        type="text"
                        placeholder="e.g. digitalcoursesbay@upi"
                        required
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className={`w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border ${upiId && !validateUpiId(upiId) ? "border-red-500" : "border-neutral-200 dark:border-brand-border"} text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono`}
                      />
                      {upiId && !validateUpiId(upiId) && (
                        <p className="text-[10px] text-red-500 font-mono">Invalid Format: Must contain '@'.</p>
                      )}
                    </div>

                    {/* UPI Account Name */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider" htmlFor="upiAccountNameInput">
                        Account Holder Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="upiAccountNameInput"
                        type="text"
                        placeholder="e.g. Learn 2 Future"
                        required
                        value={upiAccountName}
                        onChange={(e) => setUpiAccountName(e.target.value)}
                        className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold"
                      />
                    </div>
                  </div>

                  {/* QR Code Upload / Replace / Preview and Clear block */}
                  <div className="p-4 bg-neutral-50 dark:bg-[#0E0E0E] rounded-xl border border-neutral-200 dark:border-[#1d1d1d]/85 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    
                    {/* QR Code Preview */}
                    <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-black/35 rounded-xl border border-neutral-200 dark:border-brand-border max-w-[170px] mx-auto w-full">
                      <span className="text-[9px] font-mono text-neutral-400 uppercase font-bold mb-2">QR Code Preview</span>
                      {upiQrCode ? (
                        <div className="relative group">
                          <img
                            src={upiQrCode}
                            alt="Merchant UPI QR Preview"
                            className="w-28 h-28 object-contain rounded-lg border border-neutral-150 dark:border-neutral-900 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Are you sure you want to remove the current QR code visual?")) {
                                setUpiQrCode("");
                              }
                            }}
                            className="absolute -top-1.5 -right-1.5 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow active:scale-90"
                            title="Remove QR code"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-28 h-28 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 bg-neutral-50/50 dark:bg-neutral-950/20">
                          <ShieldCheck className="w-6 h-6 stroke-[1.5] mb-1" />
                          <span className="text-[8px] font-mono uppercase font-bold">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* QR Code Controllers */}
                    <div className="md:col-span-2 space-y-3">
                      <div>
                        <span className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 p-0">UPI Merchant QR Code</span>
                        <p className="text-[10px] text-neutral-500 font-light mt-0.5">Upload a square PNG or JPG invoice QR code to let clients scan and pay instantly via Paytm, PhonePe, GPay, etc.</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <label className="flex items-center gap-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white font-semibold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95">
                          <Upload className="w-3.5 h-3.5" />
                          {upiQrCode ? "Replace QR Code Image" : "Upload QR Code Image"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleQrCodeChange}
                            className="hidden"
                          />
                        </label>

                        {upiQrCode && (
                          <button
                            type="button"
                            onClick={() => setUpiQrCode("")}
                            className="border border-red-500/25 hover:bg-red-500/10 text-red-500 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all"
                          >
                            Remove QR Code
                          </button>
                        )}
                      </div>

                      {uploadingQrCode && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                            <span>Uploading QR Code image to Storage...</span>
                            <span>{qrCodeProgress !== null ? `${qrCodeProgress}%` : "Creating task..."}</span>
                          </div>
                          <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-brand-gold h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${qrCodeProgress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Payment Instructions block */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider" htmlFor="paymentInstructionsInput">
                      Payment / Step Instructions
                    </label>
                    <textarea
                      id="paymentInstructionsInput"
                      rows={3}
                      placeholder="Enter steps or guidelines for your customers (e.g. 1. Scan QR..."
                      value={paymentInstructions}
                      onChange={(e) => setPaymentInstructions(e.target.value)}
                      className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-sans resize-y"
                    />
                  </div>

                </div>

                {/* 2. Telegram Settings subgroup */}
                <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <div className="w-1.5 h-3 bg-brand-gold rounded"></div>
                      Telegram Integration Settings
                    </h4>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Control Telegram buttons, support linkages, and channels across the brand platform.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Channel Link */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider" htmlFor="telegramChannelLinkInput">
                        Telegram Channel Link <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="telegramChannelLinkInput"
                        type="text"
                        placeholder="e.g. https://t.me/LearntoFuture"
                        required
                        value={telegramChannelLink}
                        onChange={(e) => setTelegramChannelLink(e.target.value)}
                        className={`w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border ${telegramChannelLink && !validateTelegramUrl(telegramChannelLink) ? "border-red-500" : "border-neutral-200 dark:border-brand-border"} text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono`}
                      />
                      {telegramChannelLink && !validateTelegramUrl(telegramChannelLink) && (
                        <p className="text-[10px] text-red-500 font-mono">Invalid Format: Must start with "https://t.me/".</p>
                      )}
                    </div>

                    {/* Support Link */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider" htmlFor="telegramSupportLinkInput">
                        Telegram Support Help Desk Link
                      </label>
                      <input
                        id="telegramSupportLinkInput"
                        type="text"
                        placeholder="e.g. https://t.me/LearntoFutureSupport"
                        value={telegramSupportLink}
                        onChange={(e) => setTelegramSupportLink(e.target.value)}
                        className={`w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border ${telegramSupportLink && !validateTelegramUrl(telegramSupportLink) ? "border-red-500" : "border-neutral-200 dark:border-brand-border"} text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono`}
                      />
                      {telegramSupportLink && !validateTelegramUrl(telegramSupportLink) && (
                        <p className="text-[10px] text-red-500 font-mono">Invalid Format: Must start with "https://t.me/".</p>
                      )}
                    </div>

                    {/* Username or handle */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider" htmlFor="telegramUsernameInput">
                        Display Group Handle / Username
                      </label>
                      <input
                        id="telegramUsernameInput"
                        type="text"
                        placeholder="e.g. @LearntoFuture"
                        value={telegramUsername}
                        onChange={(e) => setTelegramUsername(e.target.value)}
                        className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Social Media & Support Channels subgroup */}
                <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <div className="w-1.5 h-3 bg-brand-gold rounded"></div>
                      Socials & Direct Contacts
                    </h4>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Control Instagram profiles, YouTube channels, and direct inquiry inbox addresses.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Instagram Link */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider" htmlFor="instagramLinkInput">
                        Instagram Link
                      </label>
                      <input
                        id="instagramLinkInput"
                        type="text"
                        placeholder="e.g. https://instagram.com/..."
                        value={instagramLink}
                        onChange={(e) => setInstagramLink(e.target.value)}
                        className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                      />
                    </div>

                    {/* YouTube Link */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider" htmlFor="youtubeLinkInput">
                        YouTube Channel Link
                      </label>
                      <input
                        id="youtubeLinkInput"
                        type="text"
                        placeholder="https://youtube.com/..."
                        value={youtubeLink}
                        onChange={(e) => setYoutubeLink(e.target.value)}
                        className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                      />
                    </div>

                    {/* Support Email */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider" htmlFor="supportEmailInput">
                        Official Support Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="supportEmailInput"
                        type="text"
                        placeholder="e.g. help@learn2future.com"
                        required
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        className={`w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border ${supportEmail && !validateEmail(supportEmail) ? "border-red-500" : "border-neutral-200 dark:border-brand-border"} text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono`}
                      />
                      {supportEmail && !validateEmail(supportEmail) && (
                        <p className="text-[10px] text-red-500 font-mono">Invalid Format: Must be valid email address.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Branding & Fallback Open Graph Settings Group */}
                <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <div className="w-1.5 h-3 bg-brand-gold rounded"></div>
                      Global Branding & Fallback OG Metadata Settings
                    </h4>
                    <p className="text-[10px] text-neutral-500 mt-0.5 font-light">Customise the brand asset files and global fallback metadata used when courses, blogs, or site pages are shared on social platforms.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left & Middle columns: Branding Inputs */}
                    <div className="lg:col-span-2 space-y-5">
                      
                      {/* Brand Logo Row */}
                      <div className="p-4 bg-neutral-50 dark:bg-[#0E0E0E] rounded-xl border border-neutral-200 dark:border-[#1d1d1d]/85 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center Text-left">
                        <div className="sm:col-span-1 flex flex-col items-center justify-center bg-white dark:bg-black/35 p-2 rounded-lg border border-neutral-200 dark:border-brand-border max-w-[100px] w-full mx-auto aspect-square">
                          {brandLogoUrl ? (
                            <img src={brandLogoUrl} alt="Logo" className="w-12 h-12 object-contain rounded-lg border border-neutral-100 dark:border-neutral-800" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="text-[8px] font-mono uppercase text-neutral-400">No Logo</div>
                          )}
                        </div>
                        <div className="sm:col-span-3 space-y-2 text-left">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider text-left">Brand Logo Url / File</label>
                          <input
                            type="text"
                            placeholder="https://..."
                            value={brandLogoUrl}
                            onChange={(e) => setBrandLogoUrl(e.target.value)}
                            className="w-full text-xs bg-white dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                          />
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-850 dark:text-white font-semibold text-[10px] py-1.5 px-3 rounded-lg cursor-pointer transition-all active:scale-95">
                              <Upload className="w-3 h-3" />
                              <span>Upload Image File</span>
                              <input type="file" accept="image/*" onChange={handleBrandLogoChange} className="hidden" />
                            </label>
                            {uploadingBrandLogo && (
                              <span className="text-[9px] font-mono text-neutral-400">Uploading {brandLogoProgress !== null ? `${brandLogoProgress}%` : "..."}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* OG Default Fallback Image Row */}
                      <div className="p-4 bg-neutral-50 dark:bg-[#0E0E0E] rounded-xl border border-neutral-200 dark:border-[#1d1d1d]/85 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center border-t border-neutral-200 dark:border-[#1d1d1d]/85 text-left">
                        <div className="sm:col-span-1 flex flex-col items-center justify-center bg-white dark:bg-black/35 p-2 rounded-lg border border-neutral-200 dark:border-brand-border max-w-[100px] w-full mx-auto aspect-square">
                          {ogDefaultImageUrl ? (
                            <img src={ogDefaultImageUrl} alt="OG Fallback" className="w-16 h-10 object-cover rounded-lg border border-neutral-150 dark:border-neutral-850" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="text-[8px] font-mono uppercase text-neutral-400">No Image</div>
                          )}
                        </div>
                        <div className="sm:col-span-3 space-y-2 text-left">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider text-left">OG Default (Social fallback) Image Url / File</label>
                          <input
                            type="text"
                            placeholder="https://..."
                            value={ogDefaultImageUrl}
                            onChange={(e) => setOgDefaultImageUrl(e.target.value)}
                            className="w-full text-xs bg-white dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                          />
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-850 dark:text-white font-semibold text-[10px] py-1.5 px-3 rounded-lg cursor-pointer transition-all active:scale-95">
                              <Upload className="w-3 h-3" />
                              <span>Upload Image File</span>
                              <input type="file" accept="image/*" onChange={handleOgDefaultImageChange} className="hidden" />
                            </label>
                            {uploadingOgImage && (
                              <span className="text-[9px] font-mono text-neutral-400">Uploading {ogImageProgress !== null ? `${ogImageProgress}%` : "..."}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Twitter Card Layout Row */}
                      <div className="p-4 bg-neutral-50 dark:bg-[#0E0E0E] rounded-xl border border-neutral-200 dark:border-[#1d1d1d]/85 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center text-left">
                        <div className="sm:col-span-1 flex flex-col items-center justify-center bg-white dark:bg-black/35 p-2 rounded-lg border border-neutral-200 dark:border-brand-border max-w-[100px] w-full mx-auto aspect-square">
                          {twitterPreviewImageUrl ? (
                            <img src={twitterPreviewImageUrl} alt="Twitter Card" className="w-16 h-10 object-cover rounded-lg border border-neutral-150 dark:border-neutral-850" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="text-[8px] font-mono uppercase text-neutral-400">No Image</div>
                          )}
                        </div>
                        <div className="sm:col-span-3 space-y-2 text-left">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider text-left">Twitter Large Preview Image Url / File</label>
                          <input
                            type="text"
                            placeholder="https://..."
                            value={twitterPreviewImageUrl}
                            onChange={(e) => setTwitterPreviewImageUrl(e.target.value)}
                            className="w-full text-xs bg-white dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                          />
                          <div className="flex items-center gap-2 text-left">
                            <label className="flex items-center gap-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-850 dark:text-white font-semibold text-[10px] py-1.5 px-3 rounded-lg cursor-pointer transition-all active:scale-95">
                              <Upload className="w-3 h-3" />
                              <span>Upload Image File</span>
                              <input type="file" accept="image/*" onChange={handleTwitterPreviewImageChange} className="hidden" />
                            </label>
                            {uploadingTwitterImage && (
                              <span className="text-[9px] font-mono text-neutral-400">Uploading {twitterImageProgress !== null ? `${twitterImageProgress}%` : "..."}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Metadata Fields */}
                      <div className="grid grid-cols-1 gap-4 text-left">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider text-left" htmlFor="defaultCardTitle">Default Fallback Preview Title</label>
                          <input
                            id="defaultCardTitle"
                            type="text"
                            placeholder="e.g. Learn 2 Future | Learn Today. Earn Tomorrow."
                            value={defaultCardTitle}
                            onChange={(e) => setDefaultCardTitle(e.target.value)}
                            className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold text-left"
                          />
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider text-left" htmlFor="defaultCardDescription">Default Fallback Preview Description</label>
                          <textarea
                            id="defaultCardDescription"
                            rows={3}
                            placeholder="e.g. Acquire future-ready credentials in AI Tools, Freelance & Coding..."
                            value={defaultCardDescription}
                            onChange={(e) => setDefaultCardDescription(e.target.value)}
                            className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold resize-none text-left"
                          />
                        </div>
                      </div>

                    </div>

                    {/* Right column: Social Card Simulator */}
                    <div className="space-y-4">
                      <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider select-none text-left">Live Social Preview Simulator</span>
                      
                      {/* Simulator Slate Box */}
                      <div className="border border-neutral-200 dark:border-[#222] bg-[#f9f9f9] dark:bg-[#0c0c0c] rounded-2xl p-4 space-y-4">
                        
                        {/* 1. Messenger / WhatsApp Style */}
                        <div className="space-y-1.5 text-left">
                          <span className="text-[9px] font-mono text-neutral-400 uppercase block text-left">WhatsApp / Chat Preview</span>
                          <div className="bg-white dark:bg-[#151515] rounded-xl border border-neutral-200 dark:border-brand-border overflow-hidden text-left max-w-xs transition-all shadow-sm">
                            <div className="aspect-[1.91/1] w-full bg-neutral-900 overflow-hidden relative">
                              <img 
                                src={ogDefaultImageUrl || "/brand_logo.jpg"} 
                                alt="WhatsApp Card Social Preview" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="p-3 bg-neutral-50 dark:bg-[#111] border-t border-neutral-100 dark:border-[#1e1e1e] space-y-1 select-none text-left">
                              <p className="font-sans font-bold text-xs text-neutral-850 dark:text-neutral-100 truncate text-left">
                                {defaultCardTitle || "Learn 2 Future - Build Skills"}
                              </p>
                              <p className="font-sans text-[10px] text-neutral-500 leading-snug line-clamp-2 text-left">
                                {defaultCardDescription || "Acquire future-ready credentials and join the revolution..."}
                              </p>
                              <span className="text-[8px] font-mono text-neutral-400 uppercase block tracking-wider pt-0.5 text-left">learn2future.vercel.app</span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Google / Search Console Google Snippet Style */}
                        <div className="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-brand-border/40 text-left">
                          <span className="text-[9px] font-mono text-neutral-400 uppercase block text-left">Google Search Result Preview</span>
                          <div className="space-y-0.5 font-sans select-none text-left">
                            <span className="text-[10px] text-neutral-400 block truncate text-left">https://learn2future.vercel.app</span>
                            <span className="text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer font-medium text-xs block truncate leading-tight text-left">
                              {defaultCardTitle || "Learn 2 Future | Learn Today. Earn Tomorrow."}
                            </span>
                            <p className="text-[10px] text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-snug text-left">
                              {defaultCardDescription || "Empowering students, developers and makers with tomorrow's premier e-learning suites..."}
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>

                {/* FORM CONTROLS */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-200 dark:border-brand-border select-none">
                  <div className="flex items-center space-x-2 text-[11px] text-neutral-500">
                    <ShieldCheck className="w-4 h-4 text-brand-gold" />
                    <span>Persisting business configuration to globalSettings document in real-time.</span>
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto font-display">
                    <button
                      type="submit"
                      disabled={savingBusinessSettings}
                      className="w-full sm:w-auto text-center bg-brand-gold hover:bg-brand-gold-hover text-black font-bold text-xs py-3.5 px-8 rounded-xl transition-all shadow-md hover:shadow-brand-gold/20 flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {savingBusinessSettings ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving Settings...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Save Settings</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </form>
            </div>
          )}

          {activeTab === "blogs" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Learn 2 Future SEO Blogs</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-light">Curate, publish, and structure search-engine optimized articles to gain organic ranking on Google.</p>
                </div>
                <button
                  type="button"
                  onClick={() => openBlogModal(null)}
                  className="w-full sm:w-auto font-display text-xs bg-brand-gold hover:bg-brand-gold-hover text-black font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-1.5 focus:outline-none shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Draft New Article</span>
                </button>
              </div>

              {loadingBlogs ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : blogsList.length === 0 ? (
                <div className="text-center py-16 border border-neutral-200 dark:border-brand-border bg-neutral-50 dark:bg-[#0E0E0E] rounded-3xl space-y-4">
                  <FileText className="w-12 h-12 text-neutral-400 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white">No published articles</h4>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto font-light">Click on the "Draft New Article" button to compose your very first high-velocity, searchable tutorial publication.</p>
                  </div>
                </div>
              ) : (
                <div className="border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212]/30 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 dark:bg-[#0F0F0F] border-b border-neutral-250 dark:border-brand-border text-[10px] font-mono text-neutral-400 uppercase tracking-wider select-none">
                          <th className="py-4 px-6 font-semibold">Article / Category</th>
                          <th className="py-4 px-6 font-semibold">Short URL Slug</th>
                          <th className="py-4 px-6 font-semibold">Meta Info</th>
                          <th className="py-4 px-6 font-semibold">Timestamp / Author</th>
                          <th className="py-4 px-6 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-brand-border/40 text-xs">
                        {blogsList.map((blog) => (
                          <tr key={blog.id} className="hover:bg-neutral-50/50 dark:hover:bg-[#151515]/20 group transition-all">
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-3.5">
                                <div className="w-16 h-10 rounded-lg overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-800 bg-neutral-900">
                                  <img 
                                    src={blog.featuredImage || "https://images.unsplash.com/photo-1516116211223-5c359a36298a?auto=format&fit=crop&q=80&w=150"} 
                                    alt={blog.title} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="space-y-1 min-w-0">
                                  <p className="font-bold text-neutral-900 dark:text-white truncate max-w-xs">{blog.title}</p>
                                  <span className="inline-block bg-brand-gold/10 text-brand-gold text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border border-brand-gold/10">
                                    {blog.category}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-mono text-[10px] text-neutral-500 bg-neutral-100 dark:bg-neutral-900 py-1 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
                                /{blog.slug}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="max-w-[200px] space-y-0.5 font-light text-neutral-500">
                                <span className="block font-bold text-[10px] text-neutral-800 dark:text-neutral-300 truncate">Title: {blog.metaTitle || blog.title}</span>
                                <p className="text-[10px] truncate">{blog.metaDescription || "No descriptor tag written."}</p>
                              </div>
                            </td>
                            <td className="py-4 px-6 font-light text-neutral-400">
                              <span className="block text-neutral-950 dark:text-neutral-200 font-medium">{blog.publishDate}</span>
                              <span className="text-[10px] font-mono bg-[#1C1917]/20 border border-[#292524] px-1.5 py-0.2 rounded">By {blog.author}</span>
                            </td>
                            <td className="py-4 px-6 text-right select-none">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  type="button"
                                  onClick={() => openBlogModal(blog)}
                                  className="p-1 px-2 border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 font-medium rounded-lg text-xs transition-all flex items-center space-x-1"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBlog(blog)}
                                  className="p-1 px-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 font-medium rounded-lg text-xs transition-all flex items-center space-x-1"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "coupons" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* COLUMN 1: Create Coupon Code Form */}
                <div className="bg-white dark:bg-[#151515] p-6 rounded-2xl border border-neutral-200 dark:border-brand-border space-y-4">
                  <div>
                    <h3 className="font-display text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider text-brand-gold bg-brand-gold/5 px-3 py-1.5 rounded-lg border border-brand-gold/10 w-fit">
                      <Coins className="w-4 h-4" /> Create Promo Coupon Code
                    </h3>
                    <p className="text-[11px] text-neutral-500 font-light mt-1.5">Set up discounts for students to use during checkout.</p>
                  </div>

                  <form onSubmit={handleCreateCoupon} className="space-y-4 text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1" htmlFor="cpCode">Coupon Code *</label>
                        <input
                          id="cpCode"
                          type="text"
                          required
                          placeholder="e.g. WELCOME50"
                          value={newCouponCode}
                          onChange={(e) => setNewCouponCode(e.target.value)}
                          className="w-full bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-brand-border rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1" htmlFor="cpType">Discount Type</label>
                        <select
                          id="cpType"
                          value={newCouponType}
                          onChange={(e) => setNewCouponType(e.target.value as any)}
                          className="w-full bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-brand-border rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (₹)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1" htmlFor="cpValue">Deduction Value *</label>
                        <input
                          id="cpValue"
                          type="number"
                          required
                          min="0"
                          placeholder="e.g. 50 (for 50% or ₹50)"
                          value={newCouponValue || ""}
                          onChange={(e) => setNewCouponValue(Number(e.target.value))}
                          className="w-full bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-brand-border rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1" htmlFor="cpMin">Min Order Value (Optional)</label>
                        <input
                          id="cpMin"
                          type="number"
                          placeholder="e.g. 1000"
                          value={newCouponMinOrderValue}
                          onChange={(e) => setNewCouponMinOrderValue(e.target.value)}
                          className="w-full bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-brand-border rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1" htmlFor="cpExpiry">Expiry Date (Optional)</label>
                        <input
                          id="cpExpiry"
                          type="date"
                          value={newCouponExpiresAt}
                          onChange={(e) => setNewCouponExpiresAt(e.target.value)}
                          className="w-full bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-brand-border rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                        />
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={newCouponIsActive}
                            onChange={(e) => setNewCouponIsActive(e.target.checked)}
                            className="w-4 h-4 accent-brand-gold rounded border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900"
                          />
                          <span className="text-xs text-neutral-800 dark:text-neutral-300 font-medium">Coupon Status Active</span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
                      <button
                        type="submit"
                        disabled={couponSubmitting}
                        className="bg-brand-gold hover:bg-[#F5B300]/90 text-black font-display font-bold text-xs py-2.5 px-6 rounded-xl transition-all disabled:opacity-50"
                      >
                        {couponSubmitting ? "Setting Coupon..." : "Instate Coupon Code"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* COLUMN 2: Manage Admin Access Emails */}
                <div id="admin-access-manager" className="bg-white dark:bg-[#151515] p-6 rounded-2xl border-2 border-brand-gold/30 dark:border-brand-gold/20 shadow-[0_0_15px_rgba(212,175,55,0.05)] space-y-4 transition-all duration-300 hover:border-brand-gold/50">
                  <div>
                    <h3 className="font-display text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider text-brand-gold bg-brand-gold/5 px-3 py-1.5 rounded-lg border border-brand-gold/10 w-fit">
                      <ShieldCheck className="w-4.5 h-4.5" /> Delegate Admin Access
                    </h3>
                    <p className="text-[11px] text-neutral-500 font-light mt-1.5">Grant administrative access to teammate partners by email.</p>
                  </div>

                  <form onSubmit={handleAddAdminEmail} className="space-y-4 text-left">
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1" htmlFor="admEmail">Teammate Email Address *</label>
                      <div className="flex gap-2">
                        <input
                          id="admEmail"
                          type="email"
                          required
                          placeholder="e.g. colleague@gmail.com"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          className="flex-1 bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-brand-border rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                        />
                        <button
                          type="submit"
                          disabled={adminEmailSubmitting || !newAdminEmail.trim()}
                          className="bg-neutral-900 text-white dark:bg-white dark:text-black hover:bg-neutral-850 dark:hover:bg-neutral-100 disabled:opacity-50 text-xs font-display font-semibold px-5 py-2 rounded-lg transition-colors flex items-center shrink-0"
                        >
                          {adminEmailSubmitting ? "Granting..." : "Assign Access"}
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* ADMIN EMAILS LIST */}
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center pl-1">
                      <h4 className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">Authorized Team Panelists</h4>
                      <span className="text-[9px] font-mono bg-neutral-100 dark:bg-brand-gold/10 text-neutral-600 dark:text-brand-gold px-2 py-0.5 rounded-full font-bold">Total: {adminEmailsList.length + 1}</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto border border-neutral-200 dark:border-brand-border rounded-xl divide-y divide-neutral-200 dark:divide-brand-border">
                      {/* Founder entry (Always shown, never deletable, always has full access) */}
                      <div className="p-3 bg-[#FCF8E3]/10 dark:bg-brand-gold/5 flex items-center justify-between text-xs font-sans border-l-2 border-brand-gold">
                        <div className="space-y-0.5 text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-neutral-900 dark:text-white">digitalcoursesbay@gmail.com</span>
                            <span className="text-[8px] bg-brand-gold/15 text-brand-gold px-1.5 py-0.5 rounded-full uppercase font-mono font-bold">Founder</span>
                          </div>
                          <p className="text-[9px] text-neutral-500 font-mono">Role: master admin | Added by: System</p>
                        </div>
                        <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono flex items-center gap-1 pr-1">
                          <Lock className="w-3 h-3 text-brand-gold/50" /> Permanent
                        </div>
                      </div>

                      {adminListLoading ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-neutral-400 font-light font-sans">Loading teammates info...</span>
                        </div>
                      ) : adminEmailsList.length === 0 ? (
                        <div className="p-4 text-xs text-neutral-400 dark:text-neutral-500 text-center font-light italic">
                          No dynamic assistants allocated yet. (Only the founder possesses dashboard privileges).
                        </div>
                      ) : (
                        adminEmailsList.map((admin) => (
                          <div key={admin.id} className="p-3 bg-neutral-50/50 dark:bg-brand-card/25 flex items-center justify-between text-xs font-sans">
                            <div className="space-y-0.5 text-left">
                              <p className="font-semibold text-neutral-900 dark:text-white">{admin.email}</p>
                              <p className="text-[9px] text-neutral-500 font-mono">Role: {admin.role} | Added by: {admin.addedBy || "digitalcoursesbay@gmail.com"}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteAdminEmail(admin.id)}
                              className="p-1 px-2 text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition-colors flex items-center gap-1 text-[10px]"
                              title="Revoke Admin Access"
                            >
                              <Trash className="w-3 h-3" /> Revoke
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* SECTION 3: Bottom Coupons Grid List */}
              <div className="bg-white dark:bg-[#151515] p-6 rounded-2xl border border-neutral-200 dark:border-brand-border space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <h3 className="font-display text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-brand-gold bg-brand-gold/5 px-3 py-1.5 rounded-lg border border-brand-gold/10 w-fit">
                      Manage Live Coupons & Promotions
                    </h3>
                    <p className="text-[11px] text-neutral-500 font-light mt-1.5">List of live codes used dynamically inside checkout portals.</p>
                  </div>
                  <span className="text-[10px] font-mono bg-neutral-150 dark:bg-brand-border/40 text-neutral-700 dark:text-neutral-300 px-3 py-1 rounded-full uppercase">
                    Total coupons: {couponsList.length}
                  </span>
                </div>

                <div className="overflow-x-auto border border-neutral-200 dark:border-brand-border rounded-2xl bg-neutral-50/40 dark:bg-[#111111]/40">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 dark:bg-[#191919] border-b border-neutral-200 dark:border-brand-border text-[10px] font-mono uppercase tracking-widest text-neutral-500 select-none">
                        <th className="py-3 px-6">Coupon Code</th>
                        <th className="py-3 px-6">Type</th>
                        <th className="py-3 px-6">Value</th>
                        <th className="py-3 px-6">Min Order</th>
                        <th className="py-3 px-6">Expires Under</th>
                        <th className="py-3 px-6 text-center">Times Used</th>
                        <th className="py-3 px-6 text-center">Total Sales</th>
                        <th className="py-3 px-6 text-center">Is Active</th>
                        <th className="py-3 px-6 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-brand-border font-sans text-xs">
                      {couponsList.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-neutral-400 dark:text-neutral-500 italic font-light">
                            No coupons live yet. Create one above to allow students to receive discounts!
                          </td>
                        </tr>
                      ) : (
                        couponsList.map((coupon) => (
                          <tr key={coupon.id} className="hover:bg-neutral-100/50 dark:hover:bg-brand-card/20 transition-all">
                            <td className="py-4 px-6 font-mono font-bold text-brand-gold text-xs text-left">
                              {coupon.code}
                            </td>
                            <td className="py-4 px-6 font-light uppercase text-neutral-500 font-mono text-[10px] text-left">
                              {coupon.type === "percentage" ? "Percentage %" : "Fixed Amount ₹"}
                            </td>
                            <td className="py-4 px-6 font-semibold text-neutral-800 dark:text-white text-left">
                              {coupon.type === "percentage" ? `${coupon.value}%` : `₹${coupon.value}`}
                            </td>
                            <td className="py-4 px-6 text-neutral-500 text-left">
                              {coupon.minOrderValue ? `₹${coupon.minOrderValue}` : "-"}
                            </td>
                            <td className="py-4 px-6 text-neutral-500 font-mono text-[11px] text-left">
                              {coupon.expiresAt || <span className="text-neutral-300 dark:text-neutral-600">Never Expire</span>}
                            </td>
                            <td className="py-4 px-6 text-center font-mono font-bold text-neutral-800 dark:text-neutral-200 text-xs">
                              {coupon.usedCount || 0}
                            </td>
                            <td className="py-4 px-6 text-center font-mono font-bold text-brand-gold text-xs">
                              ₹{(coupon.totalSales || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-block text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                                coupon.isActive 
                                  ? "bg-green-500/10 text-green-500 border-green-500/20" 
                                  : "bg-red-500/10 text-red-500 border-red-500/20"
                              }`}>
                                {coupon.isActive ? "Active" : "Disabled"}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteCoupon(coupon.id)}
                                className="p-1 px-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 font-medium rounded-lg text-xs transition-all flex items-center space-x-1 ml-auto"
                              >
                                <Trash className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 8: CLIENT USER DIRECTORY */}
          {activeTab === "users" && (
            <CrmAnalyticsDashboard
              usersList={usersList}
              orders={orders}
              activityLogsList={activityLogsList}
              reviewsList={reviewsList}
              courses={courses}
              allCartItemsList={allCartItemsList}
              blogsList={blogsList}
              handleStartEditUser={handleStartEditUser}
              handleToggleDisableUser={handleToggleDisableUser}
              handleDeleteUserDoc={handleDeleteUserDoc}
              setViewingCrmUser={setViewingCrmUser}
              triggerCrmHistoricalBackfill={triggerCrmHistoricalBackfill}
              backfillingProgress={backfillingProgress}
              showToast={showToast}
            />
          )}

          {false && activeTab === "users" && (() => {
            const uniqueCountries = Array.from(new Set(usersList.map(u => u.country || "India").filter(Boolean)));

            // Derived filtered users list search logic
            const filteredUsers = usersList.filter((usr) => {
              const searchLower = userSearchTerm.toLowerCase().trim();
              const nameMatch = (usr.fullName || "").toLowerCase().includes(searchLower);
              const emailMatch = (usr.email || "").toLowerCase().includes(searchLower);
              const phoneMatch = (usr.mobile || "").toLowerCase().includes(searchLower);
              const telegramMatch = (usr.telegramUsername || "").toLowerCase().includes(searchLower);
              const websiteMatch = (usr.websiteUrl || "").toLowerCase().includes(searchLower);
              const matchesSearch = !userSearchTerm || nameMatch || emailMatch || phoneMatch || telegramMatch || websiteMatch;

              const matchesCountry = userFilterCountry === "All" || (usr.country || "India") === userFilterCountry;
              const matchesSignup = userFilterSignupMethod === "All" || usr.signupMethod === userFilterSignupMethod;

              const matchesVerification = userFilterVerificationStatus === "All" || (
                userFilterVerificationStatus === "Verified" ? usr.emailVerified === true : usr.emailVerified !== true
              );

              return matchesSearch && matchesCountry && matchesSignup && matchesVerification;
            });

            return (
              <div className="space-y-6 animate-in fade-in duration-200" id="admin-user-manager">
                
                {/* Header section with export utilities */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-900 pb-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Registered Students CRM Database</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Manage customer records, audit social credentials, track user activity logs, and prepare exports.</p>
                  </div>
                  
                  {/* Export buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportCrmCSV}
                      className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 text-xs font-mono font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1"
                      title="Download CRM values inside UTF-8 .csv"
                    >
                      <Download className="w-3.5 h-3.5 text-neutral-400" /> Students CSV
                    </button>
                    <button
                      type="button"
                      onClick={handleExportCrmExcel}
                      className="bg-brand-gold text-black hover:bg-[#F5B300]/90 text-xs font-mono font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1 shadow"
                      title="Download clean CRM matrix inside .xlsx Excel Spreadsheet"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-black" /> Students Excel
                    </button>
                    <button
                      type="button"
                      onClick={handleExportOrdersCSV}
                      className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 text-xs font-mono font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1"
                      title="Download entire order ledger CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-neutral-400" /> Orders CSV
                    </button>
                    <button
                      type="button"
                      onClick={handleExportCartActivityCSV}
                      className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 text-xs font-mono font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1"
                      title="Download cart activity logs database"
                    >
                      <Download className="w-3.5 h-3.5 text-neutral-400" /> Cart Logs
                    </button>
                    <button
                      type="button"
                      onClick={handleExportActiveCartsCSV}
                      className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 text-xs font-mono font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1"
                      title="Download active cart items database across all users right now"
                    >
                      <Download className="w-3.5 h-3.5 text-neutral-400" /> Active Carts CSV
                    </button>
                    <button
                      type="button"
                      onClick={handleExportMetaAudienceCSV}
                      className="bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] border border-[#1877F2]/20 text-xs font-mono font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1 shadow"
                      title="Download custom meta pixel list payload"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#1877F2]" /> Meta Audience
                    </button>
                    <button
                      type="button"
                      disabled={backfillingProgress}
                      onClick={triggerCrmHistoricalBackfill}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-mono font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1 shadow border border-purple-500/20 disabled:opacity-50"
                      title="Pre-calculate and backfill dynamic CRM fields (totalSpent, totalOrders, database access) from historical database rows"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" /> {backfillingProgress ? "Syncing..." : "Database Backfill Sync"}
                    </button>
                  </div>
                </div>

                {/* ADVANCED ADVOCACY SEARCH AND CRM FILTERS BAR */}
                <div className="bg-neutral-50 dark:bg-neutral-950/40 p-4 md:p-5 rounded-3xl border border-neutral-200 dark:border-brand-border space-y-4 text-left">
                  <div className="flex items-center gap-2">
                    <Search className="w-4.5 h-4.5 text-brand-gold" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400">Database Search & Advanced Segmentation Filters</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
                    {/* Search query box */}
                    <div className="lg:col-span-2 relative">
                      <input
                        type="text"
                        placeholder="Search by Name, Email, Phone, Telegram, or Site URL..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-brand-border/60 text-neutral-900 dark:text-white rounded-xl py-2 px-3 pl-8 outline-none focus:ring-1 focus:ring-brand-gold"
                      />
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-3" />
                      {userSearchTerm && (
                        <button
                          onClick={() => setUserSearchTerm("")}
                          className="absolute right-2.5 top-2 py-1 px-1 text-[10px] bg-neutral-150 rounded"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Country drop-down */}
                    <div>
                      <select
                        value={userFilterCountry}
                        onChange={(e) => setUserFilterCountry(e.target.value)}
                        className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-brand-border/60 text-neutral-900 dark:text-white rounded-xl py-2 px-3 outline-none"
                      >
                        <option value="All">All Countries</option>
                        {uniqueCountries.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Signup Source */}
                    <div>
                      <select
                        value={userFilterSignupMethod}
                        onChange={(e) => setUserFilterSignupMethod(e.target.value)}
                        className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-brand-border/60 text-neutral-900 dark:text-white rounded-xl py-2 px-3 outline-none"
                      >
                        <option value="All">All Signup Methods</option>
                        <option value="Google">Google Credentials</option>
                        <option value="Email">Email Registers</option>
                      </select>
                    </div>

                    {/* Verification Status */}
                    <div>
                      <select
                        value={userFilterVerificationStatus}
                        onChange={(e) => setUserFilterVerificationStatus(e.target.value)}
                        className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-brand-border/60 text-neutral-900 dark:text-white rounded-xl py-2 px-3 outline-none"
                      >
                        <option value="All">All Verifications</option>
                        <option value="Verified">Email Checked (Verified)</option>
                        <option value="Unverified">Unverified Accounts</option>
                      </select>
                    </div>
                  </div>

                  {/* Filter clearing feedback */}
                  {(userSearchTerm || userFilterCountry !== "All" || userFilterSignupMethod !== "All" || userFilterVerificationStatus !== "All") && (
                    <div className="pt-2 border-t border-neutral-200/50 dark:border-neutral-900/50 flex justify-between items-center text-[11px] font-mono text-neutral-500">
                      <span>Matches Found: <strong className="text-neutral-800 dark:text-neutral-300">{filteredUsers.length}</strong> of {usersList.length} users</span>
                      <button
                        onClick={() => {
                          setUserSearchTerm("");
                          setUserFilterCountry("All");
                          setUserFilterSignupMethod("All");
                          setUserFilterVerificationStatus("All");
                        }}
                        className="text-brand-gold hover:underline"
                      >
                        Reset Segment filters
                      </button>
                    </div>
                  )}
                </div>

                {/* USERS TABLE CONTAINER */}
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212] rounded-3xl space-y-4 shadow-xl">
                    <div className="w-14 h-14 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-neutral-900 dark:text-white">No matching customer profiles found</h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                        Adjust search parameters or filters to segment the student registration log.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#151515] rounded-3xl border border-neutral-200 dark:border-brand-border overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-neutral-100 dark:bg-[#1a1a1a] border-b border-neutral-200 dark:border-brand-border text-[10px] font-mono uppercase tracking-widest text-neutral-500 select-none">
                            <th className="py-3.5 px-6">Student Info</th>
                            <th className="py-3.5 px-6">Social Handles</th>
                            <th className="py-3.5 px-6">Mobile & Location</th>
                            <th className="py-3.5 px-6 text-center">Status</th>
                            <th className="py-3.5 px-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-brand-border font-sans text-xs">
                          {filteredUsers.map((st) => (
                            <tr key={st.id} className="hover:bg-neutral-50/55 dark:hover:bg-brand-card/10 transition-all">
                              {/* Info details */}
                              <td className="py-4 px-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-brand-gold/10 border border-brand-gold/25 overflow-hidden flex items-center justify-center shrink-0">
                                  {st.photoUrl || st.photoURL ? (
                                    <img src={st.photoUrl || st.photoURL} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xs font-mono font-bold text-brand-gold">
                                      {(st.fullName || st.email || "S").charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-0.5 min-w-0 text-left">
                                  <p className="font-bold text-neutral-900 dark:text-white truncate max-w-xs">{st.fullName || "Un-onboarded Draft"}</p>
                                  <p className="text-[10px] text-neutral-400 font-mono select-all truncate max-w-xs">{st.email}</p>
                                </div>
                              </td>

                              {/* Instantly loaded social indicators */}
                              <td className="py-4 px-6 text-left">
                                {st.youtubeUrl || st.instagramUrl || st.facebookUrl || st.linkedinUrl || st.twitterUrl || st.telegramUsername || st.websiteUrl ? (
                                  <div className="flex flex-wrap gap-1.5 max-w-xs">
                                    {st.youtubeUrl && <span className="inline-block text-[9px] font-mono bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded" title={st.youtubeUrl}>YT</span>}
                                    {st.instagramUrl && <span className="inline-block text-[9px] font-mono bg-pink-500/10 text-pink-400 px-1.5 py-0.5 rounded" title={st.instagramUrl}>IG</span>}
                                    {st.facebookUrl && <span className="inline-block text-[9px] font-mono bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded" title={st.facebookUrl}>FB</span>}
                                    {st.linkedinUrl && <span className="inline-block text-[9px] font-mono bg-[#0A66C2]/10 text-[#0A66C2] px-1.5 py-0.5 rounded" title={st.linkedinUrl}>LN</span>}
                                    {st.twitterUrl && <span className="inline-block text-[9px] font-mono bg-neutral-500/15 text-neutral-450 px-1.5 py-0.5 rounded" title={st.twitterUrl}>X</span>}
                                    {st.telegramUsername && <span className="inline-block text-[9px] font-mono bg-[#0088cc]/10 text-[#0088cc] px-1.5 py-0.5 rounded" title={`@${st.telegramUsername}`}>TG</span>}
                                    {st.websiteUrl && <span className="inline-block text-[9px] font-mono bg-brand-gold/15 text-brand-gold px-1.5 py-0.5 rounded" title={st.websiteUrl}>WEB</span>}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-neutral-500 italic">None linked</span>
                                )}
                              </td>
                              
                              {/* contact and address location */}
                              <td className="py-4 px-6 text-left">
                                <p className="font-semibold text-neutral-700 dark:text-neutral-300">{st.mobile || <span className="text-neutral-550 italic text-[10px]">No mobile</span>}</p>
                                <p className="text-[10px] text-neutral-400 truncate max-w-xs">
                                  {[st.address, st.city, st.state, st.country].filter(Boolean).join(", ") || <span className="italic">No address</span>}
                                </p>
                              </td>

                              {/* Status verification indicators */}
                              <td className="py-4 px-6 text-center">
                                <div className="flex flex-col gap-1 items-center">
                                  <span className={`inline-block text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                                    st.disabled
                                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                                      : "bg-green-500/10 text-green-500 border-green-500/20"
                                  }`}>
                                    {st.disabled ? "Disabled" : "Active"}
                                  </span>
                                  {st.emailVerified === true && (
                                    <span className="text-[8px] text-brand-gold font-mono uppercase bg-brand-gold/10 px-1 rounded border border-brand-gold/25">VERIFIED</span>
                                  )}
                                </div>
                              </td>

                              {/* Advanced Actions panel including View profiling button */}
                              <td className="py-4 px-6 text-right">
                                <div className="flex justify-end gap-1.5 text-xs">
                                  {/* View profilings detailed single screen */}
                                  <button
                                    type="button"
                                    onClick={() => setViewingCrmUser(st)}
                                    className="p-1 px-2 border border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                                    title="View entire Student profile metrics and active logs"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> View CRM
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleStartEditUser(st)}
                                    className="p-1 px-2 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                                    title="Edit Student Details"
                                  >
                                    <Edit className="w-3.5 h-3.5" /> Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleDisableUser(st)}
                                    className={`p-1 px-1.5 border rounded-lg transition-colors flex items-center gap-1 text-[11px] ${
                                      st.disabled
                                        ? "border-green-500/30 text-green-500 hover:bg-green-500/10"
                                        : "border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                                    }`}
                                    title={st.disabled ? "Enable Account" : "Disable Account"}
                                  >
                                    {st.disabled ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                    {st.disabled ? "Enable" : "Lock"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUserDoc(st)}
                                    className="p-1 px-1.5 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-0.5 text-[11px]"
                                    title="Permanently Delete Student profile"
                                  >
                                    <Trash className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {/* TAB 9: STUDENT VERIFIED REVIEWS PANEL */}
          {activeTab === "reviews" && (() => {
            const total = reviewsList.length;
            const verifiedCount = reviewsList.filter(r => r.verifiedPurchase).length;
            const avgRating = total > 0 
              ? (reviewsList.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1) 
              : "0.0";
            const pendingCount = reviewsList.filter(r => r.status === "Pending").length;
            const approvedCount = reviewsList.filter(r => r.status === "Approved").length;
            const rejectedCount = reviewsList.filter(r => r.status === "Rejected").length;

            const reviewCategories = Array.from(new Set(reviewsList.map(r => r.category)));

            const filteredReviews = reviewsList.filter((rev) => {
              const matchCategory = reviewFilterCategory === "All" || rev.category === reviewFilterCategory;
              const matchRating = reviewFilterRating === "All" || String(rev.rating) === reviewFilterRating;
              return matchCategory && matchRating;
            });

            return (
              <div className="space-y-6 animate-in fade-in duration-200" id="admin-reviews-manager">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Purchase-Verified Student Reviews</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Moderate course reviews, approve them for the home walls, or discard low rating submissions.</p>
                  </div>
                  <div className="bg-brand-gold/10 text-brand-gold px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border border-brand-gold/20 flex items-center gap-1.5 shrink-0">
                    <span>Average Student Rating: {avgRating} ★</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 select-none font-sans">
                  <div className="bg-white dark:bg-[#151515] p-4 rounded-2xl border border-neutral-200 dark:border-brand-border space-y-1">
                    <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Total Reviews</p>
                    <p className="text-lg font-bold font-mono text-neutral-800 dark:text-white">{total}</p>
                  </div>
                  <div className="bg-white dark:bg-[#151515] p-4 rounded-2xl border border-neutral-200 dark:border-brand-border space-y-1">
                    <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Verified Students</p>
                    <p className="text-lg font-bold font-mono text-green-500">{verifiedCount} ({total > 0 ? Math.round((verifiedCount/total)*100) : 0}%)</p>
                  </div>
                  <div className="bg-white dark:bg-[#151515] p-4 rounded-2xl border border-neutral-200 dark:border-brand-border space-y-1">
                    <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Pending Review</p>
                    <p className="text-lg font-bold font-mono text-amber-500">{pendingCount}</p>
                  </div>
                  <div className="bg-white dark:bg-[#151515] p-4 rounded-2xl border border-neutral-200 dark:border-brand-border space-y-1">
                    <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Approved Live</p>
                    <p className="text-lg font-bold font-mono text-emerald-500">{approvedCount}</p>
                  </div>
                  <div className="bg-white dark:bg-[#151515] p-4 rounded-2xl border border-neutral-200 dark:border-brand-border space-y-1">
                    <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Rejected Reviews</p>
                    <p className="text-lg font-bold font-mono text-red-500">{rejectedCount}</p>
                  </div>
                </div>

                <div className="bg-neutral-50 dark:bg-brand-card/40 p-4 rounded-2xl border border-neutral-200 dark:border-brand-border/60 flex flex-wrap items-center justify-between gap-4 font-sans">
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="block text-[10px] font-mono uppercase text-neutral-450">Filter by category</span>
                      <select
                        value={reviewFilterCategory}
                        onChange={(e) => setReviewFilterCategory(e.target.value)}
                        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-brand-border rounded-lg text-neutral-800 dark:text-white py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-brand-gold"
                      >
                        <option value="All">All Categories</option>
                        {reviewCategories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="block text-[10px] font-mono uppercase text-neutral-450">Filter by stars</span>
                      <select
                        value={reviewFilterRating}
                        onChange={(e) => setReviewFilterRating(e.target.value)}
                        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-brand-border rounded-lg text-neutral-800 dark:text-white py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-brand-gold"
                      >
                        <option value="All">All Ratings</option>
                        <option value="5">5 Stars only</option>
                        <option value="4">4 Stars &amp; above</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                      </select>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-neutral-400">
                    Showing {filteredReviews.length} of {total} reviews
                  </span>
                </div>

                {filteredReviews.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212] rounded-3xl space-y-4 shadow-xl">
                    <div className="w-14 h-14 bg-neutral-100 dark:bg-brand-border rounded-full flex items-center justify-center mx-auto">
                      <Clock className="w-6 h-6 text-neutral-400" />
                    </div>
                    <div className="space-y-1 text-center">
                      <h4 className="text-base font-bold text-neutral-900 dark:text-white">No reviews found matching filters</h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">Try resetting or broaden-up active category or rating targets.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#151515] rounded-3xl border border-neutral-200 dark:border-brand-border overflow-hidden shadow-xl font-sans">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-neutral-100 dark:bg-[#1a1a1a] border-b border-neutral-200 dark:border-brand-border text-[10px] font-mono uppercase tracking-widest text-neutral-500 select-none">
                            <th className="py-3 px-6">Reviewer Info</th>
                            <th className="py-3 px-6">Comment Content</th>
                            <th className="py-3 px-6 text-center">Stars Rating</th>
                            <th className="py-3 px-6 text-center">Approval Status</th>
                            <th className="py-3 px-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-brand-border font-sans text-xs">
                          {filteredReviews.map((rev) => (
                            <tr key={rev.id} className="hover:bg-neutral-50/55 dark:hover:bg-brand-card/10 transition-all">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-brand-gold/10 border border-brand-gold/25 overflow-hidden flex items-center justify-center shrink-0">
                                    {rev.userPhoto || rev.avatar ? (
                                      <img src={rev.userPhoto || rev.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-xs font-mono font-bold text-brand-gold">
                                        {rev.userName.charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-0.5 min-w-0 text-left">
                                    <p className="font-bold text-neutral-900 dark:text-white truncate max-w-xs flex items-center gap-1.5">
                                      <span>{rev.userName}</span>
                                      {rev.verifiedPurchase && (
                                        <span className="inline-flex items-center gap-0.5 bg-green-500/10 text-green-500 border border-green-500/20 px-1 py-0.2 rounded text-[8px] font-mono uppercase leading-tight scale-90">
                                          ✓ Verified
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-[10px] text-neutral-400 font-mono select-all truncate max-w-xs">{rev.userEmail}</p>
                                    <p className="text-[9px] text-neutral-500 tracking-wide truncate max-w-xs uppercase font-bold font-mono">Category: {rev.category}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-6 max-w-sm">
                                <div className="space-y-1.5 text-left">
                                  <p className="text-neutral-700 dark:text-neutral-300 line-clamp-3 text-xs leading-relaxed italic">
                                    &ldquo;{rev.reviewText}&rdquo;
                                  </p>
                                  <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 font-mono">
                                    <span>Course: {rev.courseName}</span>
                                    <span>•</span>
                                    <span>Order Ref: {rev.orderId?.substring(0, 8)}...</span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-6 text-center select-none">
                                <div className="inline-flex items-center justify-center gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`w-3.5 h-3.5 ${i < rev.rating ? "fill-brand-gold text-brand-gold" : "text-neutral-200 dark:text-neutral-800"}`} 
                                    />
                                  ))}
                                </div>
                              </td>

                              <td className="py-4 px-6 text-center">
                                <span className={`inline-block text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                                  rev.status === "Approved"
                                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                                    : rev.status === "Rejected"
                                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                }`}>
                                  {rev.status || "Pending"}
                                </span>
                              </td>

                              <td className="py-4 px-6 text-right">
                                <div className="flex justify-end gap-1.5 text-xs">
                                  {rev.status !== "Approved" && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateReviewStatus(rev, "Approved")}
                                      className="p-1 px-2 border border-green-500/20 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors text-[10px] font-semibold"
                                      title="Approve review"
                                    >
                                      Approve
                                    </button>
                                  )}
                                  {rev.status !== "Rejected" && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateReviewStatus(rev, "Rejected")}
                                      className="p-1 px-2 border border-amber-500/20 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors text-[10px] font-semibold"
                                      title="Reject review"
                                    >
                                      Reject
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReviewAdmin(rev.id || `${rev.userId}_${rev.category.replace(/\s+/g, '_')}`)}
                                    className="p-1 px-2 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-[10px] font-semibold flex items-center gap-1"
                                    title="Permanently Delete"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 10: PORTFOLIOS EDITORIAL BOARD */}
          {activeTab === "student-portfolios" && (
            <SuccessStoriesAdmin />
          )}

          {/* TAB 11: HOMEPAGE SETTINGS & HERO ORBIT MANAGER */}
          {activeTab === "homepage-settings" && (
            <div className="space-y-8 animate-in fade-in duration-200 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Homepage Configuration & Hero Orbit CMS</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Administer the hero orbit layout components, center marketing copy, and the Web V3 micro-interaction physics engine.
                  </p>
                </div>
                
                {/* Horizontal segment toggle buttons */}
                <div className="flex border border-neutral-200 dark:border-brand-border rounded-xl p-1 bg-white dark:bg-[#151515] self-start">
                  {(["general", "orbit", "v3-animations"] as const).map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setHpSubSection(sec)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase transition-all ${
                        hpSubSection === sec
                          ? "bg-brand-gold text-black shadow-sm"
                          : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      {sec === "general" ? "Text & Center" : sec === "orbit" ? "Orbit Items" : "Motion Engine"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-section 1: Text & Center Logo settings */}
              {hpSubSection === "general" && (
                <form onSubmit={handleSaveHomepageSettings} className="space-y-6">
                  <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-6">
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white uppercase font-mono tracking-wider border-b border-neutral-100 dark:border-brand-border pb-2">
                      Center Headlines & CTA Controller
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Main Headline Title</label>
                        <input
                          type="text"
                          required
                          value={hpMainHeading}
                          onChange={(e) => setHpMainHeading(e.target.value)}
                          placeholder="e.g. Build Skills For Tomorrow's Economy"
                          className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-sans font-semibold"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">CTA Button Text</label>
                        <input
                          type="text"
                          required
                          value={hpCtaButtonText}
                          onChange={(e) => setHpCtaButtonText(e.target.value)}
                          placeholder="e.g. Explore Premium Courses"
                          className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Sub Heading / Tagline Paragraph</label>
                        <textarea
                          required
                          value={hpSubHeading}
                          onChange={(e) => setHpSubHeading(e.target.value)}
                          placeholder="Enter a descriptive secondary header tagline..."
                          rows={3}
                          className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">CTA Button Link Action path</label>
                        <input
                          type="text"
                          required
                          value={hpCtaButtonLink}
                          onChange={(e) => setHpCtaButtonLink(e.target.value)}
                          placeholder="e.g. /courses, /about, or https://t.me/..."
                          className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                        />
                        <span className="text-[10px] text-neutral-400 block mt-1">
                          💡 You can input either relative client-side paths (e.g. `/courses`) or external URLs.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-6">
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white uppercase font-mono tracking-wider border-b border-neutral-100 dark:border-brand-border pb-2">
                      Center Orbit Logo Settings
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Source Mechanism</label>
                        <div className="flex flex-col space-y-2">
                          {(["url", "upload", "course"] as const).map((source) => (
                            <button
                              key={source}
                              type="button"
                              onClick={() => setHpCenterLogoType(source)}
                              className={`py-3 px-4 rounded-xl border text-left text-xs font-semibold uppercase flex items-center justify-between ${
                                hpCenterLogoType === source
                                  ? "bg-brand-gold/15 border-brand-gold text-brand-gold shadow-sm"
                                  : "border-neutral-200 dark:border-brand-border bg-transparent text-neutral-600 dark:text-neutral-300"
                              }`}
                            >
                              <span>{source === "url" ? "External Image URL" : source === "upload" ? "Direct File Upload" : "Course Thumbnail"}</span>
                              <div className={`w-3 h-3 rounded-full border ${hpCenterLogoType === source ? "bg-brand-gold border-brand-gold" : "border-neutral-400"}`}></div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-4">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Logo Asset Resolver</label>
                        
                        {hpCenterLogoType === "url" && (
                          <div className="space-y-2">
                            <input
                              type="url"
                              value={hpCenterLogoUrl}
                              onChange={(e) => setHpCenterLogoUrl(e.target.value)}
                              placeholder="https://example.com/logo.png"
                              className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl font-mono"
                            />
                            <p className="text-[10px] text-neutral-400">Input any direct https web link which resolves to a JPG/PNG/WEBP.</p>
                          </div>
                        )}

                        {hpCenterLogoType === "course" && (
                          <div className="space-y-2">
                            <select
                              value={hpCenterLogoUrl}
                              onChange={(e) => setHpCenterLogoUrl(e.target.value)}
                              className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl"
                            >
                              <option value="">-- Choose Course Thumbnail --</option>
                              {courses.map((c) => (
                                <option key={c.id} value={c.thumbnail}>{c.title}</option>
                              ))}
                            </select>
                            <p className="text-[10px] text-neutral-400">The center animation item will automatically match this course thumbnail.</p>
                          </div>
                        )}

                        {hpCenterLogoType === "upload" && (
                          <div className="flex items-center space-x-4">
                            <label className="flex-1 border-2 border-dashed border-neutral-200 dark:border-brand-border bg-neutral-50 dark:bg-[#0B0B0B] hover:bg-neutral-100 dark:hover:bg-neutral-900 p-6 rounded-2xl text-center cursor-pointer block">
                              <Upload className="w-5 h-5 mx-auto text-neutral-400 mb-2" />
                              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                {uploadingCenterLogo ? "Converting assets..." : "Click to select logo file"}
                              </span>
                              <span className="text-[10px] text-neutral-400 block mt-1">PNG, JPG, or WEBP (Max 2MB)</span>
                              <input type="file" accept="image/*" onChange={handleCenterLogoUpload} className="hidden" />
                            </label>
                          </div>
                        )}

                        {/* Interactive Realtime Logo Preview */}
                        <div className="border border-neutral-100 dark:border-brand-border p-4 rounded-2xl flex items-center space-x-4 bg-neutral-50 dark:bg-[#0D0D0D]">
                          <div className="w-14 h-14 rounded-full border border-brand-gold bg-black flex items-center justify-center overflow-hidden shrink-0">
                            {hpCenterLogoUrl ? (
                              <img src={hpCenterLogoUrl} alt="Logo Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-3 h-3 bg-brand-gold rounded-full animate-ping"></div>
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-brand-gold uppercase tracking-wider block">Live Logo Preview</span>
                            <span className="text-[10px] text-neutral-400 font-mono break-all line-clamp-1 mt-0.5">{hpCenterLogoUrl || "No source generated yet"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={savingHpSettings || uploadingCenterLogo}
                      className="bg-brand-gold hover:bg-[#F5B300]/90 disabled:opacity-50 text-black py-3.5 px-8 font-display rounded-xl text-xs font-bold transition-all shadow-xl hover:shadow-brand-gold/10"
                    >
                      {savingHpSettings ? "Saving Center CMS..." : "Deploy Main Settings"}
                    </button>
                  </div>
                </form>
              )}

              {/* Sub-section 2: Hero Orbit Manager */}
              {hpSubSection === "orbit" && (
                <div className="space-y-6 animate-in fade-in duration-200 text-left">
                  
                  {/* Orbit Sub-Tab Navigation Switcher */}
                  <div className="flex border-b border-neutral-200 dark:border-brand-border pb-px gap-6 text-left">
                    <button
                      type="button"
                      onClick={() => setOrbitSettingsTab("configuration")}
                      className={`pb-3 text-xs font-mono tracking-wider font-bold uppercase border-b-2 transition-all flex items-center gap-1.5 ${
                        orbitSettingsTab === "configuration"
                          ? "border-brand-gold text-brand-gold"
                          : "border-transparent text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>🔮 Course Cards Configuration</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrbitSettingsTab("catalog")}
                      className={`pb-3 text-xs font-mono tracking-wider font-bold uppercase border-b-2 transition-all flex items-center gap-1.5 ${
                        orbitSettingsTab === "catalog"
                          ? "border-brand-gold text-brand-gold"
                          : "border-transparent text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <Grid className="w-3.5 h-3.5" />
                      <span>🗂️ Slot Items Catalog Builder</span>
                    </button>
                  </div>

                  {orbitSettingsTab === "configuration" ? (
                    <form onSubmit={handleSaveHomepageSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-in fade-in duration-200">
                      
                      {/* Left Column: 4 Floating Cards (col-span-7) */}
                      <div className="lg:col-span-7 space-y-6">
                        <div className="space-y-2">
                          <h5 className="text-xs font-bold font-mono text-brand-gold uppercase tracking-wider">Floating Course Cards Parameters</h5>
                          <p className="text-[11px] text-neutral-450 leading-relaxed">Configure the content, direct actions and cover images for the 4 primary courses orbiting the landing segment.</p>
                        </div>

                        {[1, 2, 3, 4].map((num) => {
                          const label = num === 1 ? hpOrbitLabel1 : num === 2 ? hpOrbitLabel2 : num === 3 ? hpOrbitLabel3 : hpOrbitLabel4;
                          const setLabel = num === 1 ? setHpOrbitLabel1 : num === 2 ? setHpOrbitLabel2 : num === 3 ? setHpOrbitLabel3 : setHpOrbitLabel4;
                          const image = num === 1 ? hpOrbitImage1 : num === 2 ? hpOrbitImage2 : num === 3 ? hpOrbitImage3 : hpOrbitImage4;
                          const setImage = num === 1 ? setHpOrbitImage1 : num === 2 ? setHpOrbitImage2 : num === 3 ? setHpOrbitImage3 : setHpOrbitImage4;
                          const type = num === 1 ? hpOrbitImageType1 : num === 2 ? hpOrbitImageType2 : num === 3 ? hpOrbitImageType3 : hpOrbitImageType4;
                          const setType = num === 1 ? setHpOrbitImageType1 : num === 2 ? setHpOrbitImageType2 : num === 3 ? setHpOrbitImageType3 : setHpOrbitImageType4;
                          const link = num === 1 ? hpOrbitLink1 : num === 2 ? hpOrbitLink2 : num === 3 ? hpOrbitLink3 : hpOrbitLink4;
                          const setLink = num === 1 ? setHpOrbitLink1 : num === 2 ? setHpOrbitLink2 : num === 3 ? setHpOrbitLink3 : setHpOrbitLink4;

                          return (
                            <div key={num} className="p-5 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4 shadow-sm hover:shadow-brand-gold/5 transition-all">
                              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-brand-border/40 pb-2.5">
                                <span className="text-xs font-bold font-mono text-neutral-900 dark:text-white flex items-center gap-2">
                                  <span className="w-5 h-5 bg-brand-gold text-black rounded-full flex items-center justify-center text-[10px] font-bold">
                                    {num}
                                  </span>
                                  Course Card Slot {num}
                                </span>
                                
                                {/* Image Type Selector */}
                                <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-black/40 p-1 rounded-lg">
                                  <button
                                    type="button"
                                    onClick={() => setType("url")}
                                    className={`py-1 px-2.5 rounded-md text-[9px] font-mono uppercase font-bold transition-all ${
                                      type === "url"
                                        ? "bg-brand-gold text-black"
                                        : "text-neutral-400 hover:text-white"
                                    }`}
                                  >
                                    Image URL
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setType("upload")}
                                    className={`py-1 px-2.5 rounded-md text-[9px] font-mono uppercase font-bold transition-all ${
                                      type === "upload"
                                        ? "bg-brand-gold text-black"
                                        : "text-neutral-400 hover:text-white"
                                    }`}
                                  >
                                    Local File
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Title Input */}
                                <div className="space-y-1.5">
                                  <label className="block text-[10px] font-mono text-neutral-450 uppercase">Card Badge Label</label>
                                  <input
                                    type="text"
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    placeholder={`Slot ${num} Target Category`}
                                    className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-2.5 px-4 rounded-xl focus:border-brand-gold focus:outline-none"
                                  />
                                </div>

                                {/* Link Selection / Course selection input */}
                                <div className="space-y-1.5">
                                  <label className="block text-[10px] font-mono text-neutral-450 uppercase">Redirect / Course Path</label>
                                  <select
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                    className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:border-brand-gold focus:outline-none"
                                  >
                                    <option value="">-- Custom slug/url entered below --</option>
                                    {courses.map((c) => (
                                      <option key={c.id} value={c.slug || c.id}>
                                        {c.title}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                    placeholder="Enter custom path or slug..."
                                    className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-950 dark:text-white py-2.5 px-4 rounded-xl mt-1.5 focus:border-brand-gold focus:outline-none"
                                  />
                                </div>
                              </div>

                              {/* Image Input field based on Selection */}
                              {type === "url" ? (
                                <div className="space-y-1.5 pt-1">
                                  <label className="block text-[10px] font-mono text-neutral-450 uppercase">External Image URL</label>
                                  <input
                                    type="text"
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                    placeholder="https://example.com/cover_photo.png"
                                    className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-2.5 px-4 rounded-xl focus:border-brand-gold focus:outline-none"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-2 pt-1">
                                  <label className="block text-[10px] font-mono text-neutral-450 uppercase">Upload Local File Asset</label>
                                  <div className="flex items-center gap-4">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleOrbitImageUpload(e, num as any)}
                                      className="block w-full text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-mono file:font-bold file:uppercase file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 cursor-pointer"
                                    />
                                    {uploadingImageIndex === num && (
                                      <span className="w-4 h-4 border-2 border-brand-gold border-t-transparent rounded-full animate-spin shrink-0"></span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Card Image Preview Row */}
                              {image && (
                                <div className="flex items-center gap-3 bg-neutral-50 dark:bg-black/30 p-2.5 rounded-xl border border-neutral-100 dark:border-brand-border/20 mt-1">
                                  <img src={image} className="w-12 h-12 rounded-lg object-cover border border-brand-gold/15" alt="" referrerPolicy="no-referrer" />
                                  <div className="min-w-0 flex-1 col-span-1 text-left">
                                    <span className="block text-[8px] font-mono text-neutral-450 uppercase">Cover resolution preview</span>
                                    <span className="block text-[10px] text-neutral-500 truncate dark:text-neutral-400">{image.slice(0, 100)}...</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setImage("")}
                                    className="text-red-400 hover:text-red-500 text-[10px] font-mono font-bold uppercase p-1.5 hover:bg-red-500/10 rounded-lg"
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Right Column: Orbit settings & live canvas preview (col-span-5) */}
                      <div className="lg:col-span-5 space-y-6">
                        
                        {/* Interactive Live Canvas view */}
                        <div className="p-5 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4">
                          <h5 className="text-xs font-bold font-mono text-brand-gold uppercase tracking-wider border-b border-neutral-100 dark:border-brand-border/40 pb-2">Real-time Orbit Canvas</h5>
                          
                          <div className="flex flex-col items-center justify-center border border-neutral-300 dark:border-brand-border bg-neutral-950 rounded-2xl p-6 h-[250px] relative overflow-hidden select-none">
                            <span className="absolute top-2.5 left-3 text-[9px] font-mono tracking-wider text-neutral-500 uppercase z-10">Direct Studio View</span>
                            
                            <div className="relative flex items-center justify-center w-[200px] h-[200px] rounded-full" style={{
                              transform: 'scale(0.8)'
                            }}>
                              {/* Inner glowing pulsing track rings */}
                              {hpEnableOrbitGlow !== false && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                  <div className="absolute rounded-full border border-brand-gold/15 bg-brand-gold/[0.015]" style={{ width: `${hpOrbitRadius * 2.5 * 0.4}px`, height: `${hpOrbitRadius * 2.5 * 0.4}px` }} />
                                  <div className="absolute rounded-full border border-brand-gold/10 bg-brand-gold/[0.008]" style={{ width: `${hpOrbitRadius * 2.0 * 0.4}px`, height: `${hpOrbitRadius * 2.0 * 0.4}px` }} />
                                </div>
                              )}
                              
                              {/* Central Logo */}
                              <div className="w-12 h-12 rounded-full bg-black border border-brand-gold/60 flex items-center justify-center overflow-hidden z-10 shadow-lg shadow-brand-gold/15 animate-pulse">
                                <img src={hpCenterLogoUrl || "/brand_logo.jpg"} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>

                              {/* Orbit track ring */}
                              <div className="absolute rounded-full border border-dashed border-brand-gold/20" style={{
                                width: `${hpOrbitRadius * 2 * 0.4}px`,
                                height: `${hpOrbitRadius * 2 * 0.4}px`
                              }} />

                              {/* 4 Cards Spinning */}
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{
                                animation: (hpEnableAutoRotation && hpEnableOrbitAnimation) ? `orbit-spin-clk-raw ${hpOrbitSpeed === "Slow" ? 25 : hpOrbitSpeed === "Fast" ? 8 : hpOrbitSpeed === "Custom" ? hpCustomOrbitSpeed : 14}s linear infinite` : 'none',
                                width: '100%',
                                height: '100%'
                              }}>
                                {[1, 2, 3, 4].map((num) => {
                                  const angle = (num - 1) * 90;
                                  const image = num === 1 ? hpOrbitImage1 : num === 2 ? hpOrbitImage2 : num === 3 ? hpOrbitImage3 : hpOrbitImage4;
                                  const dist = hpOrbitRadius * 0.4;
                                  
                                  return (
                                    <div
                                      key={num}
                                      className="absolute bg-[#121212]/90 border border-brand-gold/30 rounded-lg flex items-center justify-center overflow-hidden"
                                      style={{
                                        width: `${hpOrbitCardSize * 0.4}px`,
                                        height: `${hpOrbitCardSize * 0.4}px`,
                                        transform: `rotate(${angle}deg) translateY(${-dist}px) rotate(${-angle}deg)`
                                      }}
                                    >
                                      {image ? (
                                        <img src={image} className="w-full h-full object-cover pointer-events-none" alt="" referrerPolicy="no-referrer" />
                                      ) : (
                                        <span className="text-[7.5px] font-bold text-brand-gold font-mono">{num}</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Orbit System Physics Adjustments */}
                        <div className="p-5 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-4">
                          <h5 className="text-xs font-bold font-mono text-brand-gold uppercase tracking-wider border-b border-neutral-100 dark:border-brand-border/40 pb-2">Physics & Layout Controls</h5>

                          {/* Enable switch */}
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-neutral-900 dark:text-white block">Enable Orbit Animation</span>
                              <span className="text-[10px] text-neutral-500 block">Deploy rotating animation on home view.</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={hpEnableOrbitAnimation}
                              onChange={(e) => setHpEnableOrbitAnimation(e.target.checked)}
                              className="w-4 h-4 text-brand-gold rounded focus:ring-brand-gold"
                            />
                          </div>

                          {/* Radius Slider */}
                          <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-brand-border/40">
                            <div className="flex justify-between items-center text-xs font-mono text-neutral-450 uppercase">
                              <span>Orbit radius limit</span>
                              <span className="text-brand-gold font-bold">{hpOrbitRadius} px</span>
                            </div>
                            <input
                              type="range"
                              min="120"
                              max="320"
                              step="5"
                              value={hpOrbitRadius}
                              onChange={(e) => setHpOrbitRadius(Number(e.target.value))}
                              className="w-full h-1 bg-neutral-150 dark:bg-black/60 rounded-lg appearance-none cursor-pointer accent-brand-gold"
                            />
                            <span className="block text-[9px] text-neutral-400">Sets the exact radial width of the orbits.</span>
                          </div>

                          {/* Card Size Slider */}
                          <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-brand-border/40">
                            <div className="flex justify-between items-center text-xs font-mono text-neutral-450 uppercase">
                              <span>Course card dimension scale</span>
                              <span className="text-brand-gold font-bold">{hpOrbitCardSize} px</span>
                            </div>
                            <input
                              type="range"
                              min="50"
                              max="140"
                              step="2"
                              value={hpOrbitCardSize}
                              onChange={(e) => setHpOrbitCardSize(Number(e.target.value))}
                              className="w-full h-1 bg-neutral-150 dark:bg-black/60 rounded-lg appearance-none cursor-pointer accent-brand-gold"
                            />
                            <span className="block text-[9px] text-neutral-400">Adjust the dimensions multiplier of orbiting element boxes.</span>
                          </div>

                          {/* Glow intensity selector */}
                          <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-brand-border/40">
                            <label className="block text-[10px] font-mono text-neutral-450 uppercase">Glow Intensity level</label>
                            <select
                              value={hpEnableOrbitGlow ? hpOrbitGlowIntensity : "none"}
                              onChange={(e) => {
                                if (e.target.value === "none") {
                                  setHpEnableOrbitGlow(false);
                                } else {
                                  setHpEnableOrbitGlow(true);
                                  setHpOrbitGlowIntensity(e.target.value as any);
                                }
                              }}
                              className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-2.5 px-4 rounded-xl focus:border-brand-gold focus:outline-none"
                            >
                              <option value="none">Disabled (No glowing rings)</option>
                              <option value="low">Low (10% subtle alpha ring)</option>
                              <option value="medium">Medium (Standard cinematic glow)</option>
                              <option value="high">High (Intense gold radial aura flare)</option>
                            </select>
                          </div>

                          {/* Rotation speed selection */}
                          <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-brand-border/40">
                            <label className="block text-[10px] font-mono text-neutral-450 uppercase">Orbit speed tuning</label>
                            <div className="grid grid-cols-4 gap-2">
                              {(["Slow", "Normal", "Fast", "Custom"] as const).map((sp) => (
                                <button
                                  key={sp}
                                  type="button"
                                  onClick={() => setHpOrbitSpeed(sp)}
                                  className={`py-2 text-[10px] font-mono leading-none rounded-lg border font-bold uppercase transition-all text-center ${
                                    hpOrbitSpeed === sp
                                      ? "bg-brand-gold border-brand-gold text-black uppercase"
                                      : "border-neutral-200 dark:border-brand-border bg-transparent text-neutral-450 hover:text-white"
                                  }`}
                                >
                                  {sp}
                                </button>
                              ))}
                            </div>
                            
                            {hpOrbitSpeed === "Custom" && (
                              <div className="space-y-1 animate-in slide-in-from-top-1">
                                <label className="block text-[9px] font-mono text-neutral-450 uppercase">Full revolution sweep duration (Seconds)</label>
                                <select
                                  value={hpCustomOrbitSpeed}
                                  onChange={(e) => setHpCustomOrbitSpeed(Number(e.target.value))}
                                  className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-2.5 px-4 rounded-xl focus:border-brand-gold focus:outline-none"
                                >
                                  <option value="10">10s (High energy spin)</option>
                                  <option value="14">14s (Fast flow)</option>
                                  <option value="20">20s (Fluid dynamic balance)</option>
                                  <option value="30">30s (Gentle modern elegance)</option>
                                  <option value="60">60s (Slow ambient galaxy draft)</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={savingHpSettings}
                            className="w-full bg-brand-gold hover:bg-[#F5B300]/90 text-black py-4 px-8 font-display rounded-xl text-xs font-bold transition-all shadow-xl hover:shadow-brand-gold/15"
                          >
                            {savingHpSettings ? "Deploying Course Cards Settings..." : "Deploy Orbit Configuration"}
                          </button>
                        </div>

                      </div>

                    </form>
                  ) : (
                    <div className="space-y-6 animate-in fade-in duration-200 text-left">
                      <div className="flex justify-between items-center bg-white dark:bg-[#151515] p-5 rounded-2xl border border-neutral-200 dark:border-brand-border">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase font-mono tracking-wider">Dynamic Orbit Item catalog</h4>
                          <p className="text-[11px] text-neutral-450">
                            Arrange interactive icons in orbit circles. Hover to review details, drag to swap sequence order.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingOrbitItem(null);
                            setOrbitTitle("");
                            setOrbitImageSourceType("course");
                            setOrbitCourseId(courses[0]?.id || "");
                            setOrbitExternalImageUrl("");
                            setOrbitUploadedImage("");
                            setOrbitDescription("");
                            setOrbitRingAssignment("Ring 1");
                            setOrbitClickActionType("course");
                            setOrbitTargetSlug(courses[0]?.slug || "");
                            setOrbitDisplayOrder(dbHeroOrbitItems.length + 1);
                            setOrbitEnabled(true);
                            setShowOrbitModal(true);
                          }}
                          className="bg-brand-gold hover:bg-[#F5B300]/90 text-black py-2.5 px-4 font-display rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-brand-gold/5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Orbit Item</span>
                        </button>
                  </div>

                  {dbHeroOrbitItems.length === 0 ? (
                    <div className="border border-dashed border-neutral-300 dark:border-brand-border py-14 text-center rounded-2xl space-y-3 bg-white dark:bg-transparent">
                      <Layers className="w-8 h-8 text-neutral-400 mx-auto" />
                      <div>
                        <p className="text-xs font-semibold text-neutral-800 dark:text-white">Empty Orbit Catalog</p>
                        <p className="text-[11px] text-neutral-400 max-w-sm mx-auto mt-0.5">
                          Currently, no orbit items exist. The live homepage will load fallback public static animation items: heroanimation1.png to heroanimation6.png. Use "Add Orbit Item" to configure dynamic slots.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl overflow-hidden shadow-sm">
                      <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3.5 bg-neutral-50 dark:bg-[#0c0c0c] border-b border-neutral-200 dark:border-brand-border font-mono text-[9px] uppercase tracking-wider text-neutral-400 text-left font-bold select-none">
                        <div className="col-span-1 text-center">Move</div>
                        <div className="col-span-1">Preview</div>
                        <div className="col-span-3">Title / Details</div>
                        <div className="col-span-2">Ring Assigned</div>
                        <div className="col-span-2">Click Event Link</div>
                        <div className="col-span-1 text-center">Order</div>
                        <div className="col-span-1 text-center">Status</div>
                        <div className="col-span-1 text-right">Actions</div>
                      </div>

                      <div className="divide-y divide-neutral-200 dark:divide-brand-border select-none">
                        {dbHeroOrbitItems.map((item, index) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("text/plain", item.id || "");
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              const draggedId = e.dataTransfer.getData("text/plain");
                              if (draggedId && draggedId !== item.id) {
                                handleDragAndDropReorder(draggedId, item.id || "");
                              }
                            }}
                            className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-6 py-4 items-center bg-transparent hover:bg-neutral-50/50 dark:hover:bg-[#1C1C1C] transition-colors cursor-grab active:cursor-grabbing text-left text-xs text-neutral-800 dark:text-neutral-300"
                          >
                            {/* Manual Reordering Controls */}
                            <div className="col-span-1 flex items-center justify-center space-x-1">
                              <button
                                disabled={index === 0}
                                onClick={() => handleMoveOrbitItem(index, "up")}
                                className="p-1 hover:text-brand-gold disabled:opacity-30 self-center"
                                title="Move Position Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <div className="p-1 text-neutral-400 group cursor-grab">
                                <Move className="w-3 h-3 text-neutral-500 hover:text-brand-gold" />
                              </div>
                              <button
                                disabled={index === dbHeroOrbitItems.length - 1}
                                onClick={() => handleMoveOrbitItem(index, "down")}
                                className="p-1 hover:text-brand-gold disabled:opacity-30 self-center"
                                title="Move Position Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Mini Image Preview */}
                            <div className="col-span-1">
                              <div className="w-10 h-10 rounded-xl overflow-hidden border border-neutral-200 dark:border-brand-border bg-neutral-100 dark:bg-[#070707] shrink-0">
                                {item.image ? (
                                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-brand-gold/10"></div>
                                )}
                              </div>
                            </div>

                            {/* Title & Description details */}
                            <div className="col-span-3 space-y-0.5">
                              <h5 className="font-bold text-neutral-900 dark:text-white tracking-tight leading-normal">{item.title}</h5>
                              <p className="text-[10px] text-neutral-400 line-clamp-1 leading-normal font-sans">{item.description || "No hover tooltip added"}</p>
                            </div>

                            {/* Ring Assignment badge */}
                            <div className="col-span-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono leading-none border uppercase font-bold
                                ${item.ringAssignment === "Ring 1" 
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                                  : item.ringAssignment === "Ring 2" 
                                  ? "bg-violet-500/10 text-violet-400 border-violet-500/20" 
                                  : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                                }
                              `}>
                                {item.ringAssignment}
                              </span>
                            </div>

                            {/* Click Link destination */}
                            <div className="col-span-2">
                              <span className="text-[10px] font-mono text-neutral-500 break-all select-all font-semibold block leading-tight">
                                {item.link || "None (#)"}
                              </span>
                              {item.clickActionType && (
                                <span className="text-[8.5px] uppercase font-mono font-bold bg-neutral-100 dark:bg-[#0B0B0B] text-neutral-400 px-1 py-0.5 rounded border border-neutral-200 dark:border-brand-border mt-1 inline-block">
                                  Action: {item.clickActionType}
                                </span>
                              )}
                            </div>

                            {/* Serial Display Order key input */}
                            <div className="col-span-1 text-center font-mono font-bold">
                              {item.displayOrder}
                            </div>

                            {/* Enabled switch status */}
                            <div className="col-span-1 text-center font-mono">
                              {item.enabled ? (
                                <span className="text-teal-400 bg-teal-500/10 text-[9.5px] border border-teal-500/20 px-1.5 py-0.5 rounded-md font-bold">LIVE</span>
                              ) : (
                                <span className="text-neutral-500 bg-neutral-500/10 text-[9.5px] border border-neutral-500/20 px-1.5 py-0.5 rounded-md font-bold">PAUSE</span>
                              )}
                            </div>

                            {/* Actions panel */}
                            <div className="col-span-1 flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setEditingOrbitItem(item);
                                  setOrbitTitle(item.title);
                                  setOrbitImageSourceType(item.imageSourceType || "external");
                                  setOrbitCourseId(item.courseId || "");
                                  setOrbitExternalImageUrl(item.imageSourceType === "external" ? item.image : "");
                                  setOrbitUploadedImage(item.imageSourceType === "upload" ? item.image : "");
                                  setOrbitDescription(item.description || "");
                                  setOrbitRingAssignment(item.ringAssignment || "Ring 1");
                                  setOrbitClickActionType(item.clickActionType || "none");
                                  setOrbitTargetSlug(item.targetSlug || "");
                                  setOrbitDisplayOrder(item.displayOrder);
                                  setOrbitEnabled(item.enabled);
                                  setShowOrbitModal(true);
                                }}
                                className="p-1 px-1.5 bg-neutral-100 dark:bg-brand-border rounded hover:bg-neutral-200 text-neutral-500 dark:text-neutral-300 hover:text-black dark:hover:text-white"
                                title="Modify Slot parameters"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteOrbitItem(item.id || "")}
                                className="p-1 px-1.5 bg-red-500/15 text-red-500 rounded hover:bg-red-500/35"
                                title="Permanently Delete"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-section 3: Motion Engine settings */}
              {hpSubSection === "v3-animations" && (
                <form onSubmit={handleSaveHomepageSettings} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Ring physics settings card */}
                    <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-5 text-left">
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white uppercase font-mono tracking-wider border-b border-neutral-100 dark:border-brand-border pb-2 flex items-center justify-between">
                        <span>Ring Mechanics & Auto Rotation</span>
                        <Settings2 className="w-4 h-4 text-brand-gold shrink-0 animate-spin-slow" />
                      </h4>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-neutral-900 dark:text-white font-sans block">Orbit Motion System</span>
                            <span className="text-[10px] text-neutral-500 block">Deploy dynamic spin physics for circular rings.</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={hpEnableOrbitAnimation}
                            onChange={(e) => setHpEnableOrbitAnimation(e.target.checked)}
                            className="w-4 h-4 text-brand-gold border-neutral-200 rounded focus:ring-brand-gold"
                          />
                        </div>

                        <div className="flex items-center justify-between border-t border-neutral-100 dark:border-[#1E1E1E] pt-3.5">
                          <div>
                            <span className="text-xs font-bold text-neutral-900 dark:text-white block">Auto Active Spinning Rotation</span>
                            <span className="text-[10px] text-neutral-500 block">Allow rings to auto-turn and scroll.</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={hpEnableAutoRotation}
                            onChange={(e) => setHpEnableAutoRotation(e.target.checked)}
                            className="w-4 h-4 text-brand-gold rounded focus:ring-brand-gold"
                          />
                        </div>

                        <div className="flex items-center justify-between border-t border-neutral-100 dark:border-[#1E1E1E] pt-3.5">
                          <div>
                            <span className="text-xs font-bold text-neutral-900 dark:text-white block">Aura Glow Rings Reflection</span>
                            <span className="text-[10px] text-neutral-500 block">Surround vector orbits with high end glowing shadows.</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={hpEnableOrbitGlow}
                            onChange={(e) => setHpEnableOrbitGlow(e.target.checked)}
                            className="w-4 h-4 text-brand-gold rounded focus:ring-brand-gold"
                          />
                        </div>

                        {/* Speed regulators */}
                        <div className="space-y-2 border-t border-neutral-100 dark:border-[#1E1E1E] pt-4 text-xs font-semibold">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase">Rotation Speed Tuning Preset</label>
                          <div className="grid grid-cols-4 gap-2">
                            {(["Slow", "Normal", "Fast", "Custom"] as const).map((sp) => (
                              <button
                                key={sp}
                                type="button"
                                onClick={() => setHpOrbitSpeed(sp)}
                                className={`py-2 text-[10px] font-mono leading-none rounded-lg border font-bold uppercase transition-all text-center ${
                                  hpOrbitSpeed === sp
                                    ? "bg-brand-gold border-brand-gold text-black uppercase"
                                    : "border-neutral-200 dark:border-brand-border bg-transparent text-neutral-500 hover:text-black dark:hover:text-white"
                                }`}
                              >
                                {sp}
                              </button>
                            ))}
                          </div>
                        </div>

                        {hpOrbitSpeed === "Custom" && (
                          <div className="space-y-1.5 border-t border-neutral-100 dark:border-[#1E1E1E] pt-3 animate-in slide-in-from-top-1">
                            <label className="block text-[10px] font-mono text-neutral-400 uppercase">Custom Rotation Duration</label>
                            <select
                              value={hpCustomOrbitSpeed}
                              onChange={(e) => setHpCustomOrbitSpeed(Number(e.target.value))}
                              className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl"
                            >
                              <option value="10">10s (Rapid Spin)</option>
                              <option value="20">20s (Fast Spin)</option>
                              <option value="30">30s (Smooth Mid)</option>
                              <option value="40">40s (Gentle Turn)</option>
                              <option value="60">60s (Slow Ambient)</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* V3 premium global effects controllers */}
                    <div className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl space-y-5 text-left">
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white uppercase font-mono tracking-wider border-b border-neutral-100 dark:border-brand-border pb-2 flex items-center justify-between">
                        <span>Web V3 Premium Visual Toggles</span>
                        <Sparkles className="w-4 h-4 text-brand-gold shrink-0" />
                      </h4>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-neutral-900 dark:text-white block">Global Motion Enabled</span>
                            <span className="text-[10px] text-neutral-500 block">Smooth fading scroll and viewport transitions.</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={hpAnimationsEnabled}
                            onChange={(e) => setHpAnimationsEnabled(e.target.checked)}
                            className="w-4 h-4 text-brand-gold rounded focus:ring-brand-gold"
                          />
                        </div>

                        <div className="flex items-center justify-between border-t border-neutral-100 dark:border-[#1E1E1E] pt-3.5">
                          <div>
                            <span className="text-xs font-bold text-neutral-900 dark:text-white block">Cosmic Particle Backdrop</span>
                            <span className="text-[10px] text-neutral-500 block">Animate gentle vector floating stars in backend space.</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={hpEnableParticleBackground}
                            onChange={(e) => setHpEnableParticleBackground(e.target.checked)}
                            className="w-4 h-4 text-brand-gold rounded focus:ring-brand-gold"
                          />
                        </div>

                        <div className="flex items-center justify-between border-t border-neutral-100 dark:border-[#1E1E1E] pt-3.5">
                          <div>
                            <span className="text-xs font-bold text-neutral-900 dark:text-white block">Parallax & Move-on-scroll</span>
                            <span className="text-[10px] text-neutral-500 block">Add spatial structural weight depth to elements.</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={hpEnableParallax}
                            onChange={(e) => setHpEnableParallax(e.target.checked)}
                            className="w-4 h-4 text-brand-gold rounded focus:ring-brand-gold"
                          />
                        </div>

                        <div className="flex items-center justify-between border-t border-neutral-100 dark:border-[#1E1E1E] pt-3.5">
                          <div>
                            <span className="text-xs font-bold text-neutral-900 dark:text-white block">Hover Element Elastic zoom</span>
                            <span className="text-[10px] text-neutral-500 block">Tilt buttons and zoom course preview cards slightly.</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={hpEnableHoverEffects}
                            onChange={(e) => setHpEnableHoverEffects(e.target.checked)}
                            className="w-4 h-4 text-brand-gold rounded focus:ring-brand-gold"
                          />
                        </div>

                        <div className="flex items-center justify-between border-t border-neutral-100 dark:border-[#1E1E1E] pt-3.5">
                          <div>
                            <span className="text-xs font-bold text-neutral-900 dark:text-white block">Custom Magnetic Mouse cursor</span>
                            <span className="text-[10px] text-neutral-500 block">Desktop trailing glow filter circle around cursor pointer. (Bypassed on mobile)</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={hpCustomCursorEnabled}
                            onChange={(e) => setHpCustomCursorEnabled(e.target.checked)}
                            className="w-4 h-4 text-brand-gold rounded focus:ring-brand-gold"
                          />
                        </div>

                        <div className="space-y-2 border-t border-neutral-100 dark:border-[#1E1E1E] pt-4 text-xs font-semibold">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase">Motion Physics Intensity scale</label>
                          <select
                            value={hpAnimationIntensity}
                            onChange={(e: any) => setHpAnimationIntensity(e.target.value)}
                            className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl"
                          >
                            <option value="low">Low (Conservative, elegant)</option>
                            <option value="medium">Medium (Polished e-Learning v3)</option>
                            <option value="high">High (Extravagant high-end SaaS motion)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 bg-transparent">
                    <button
                      type="submit"
                      disabled={savingHpSettings}
                      className="bg-brand-gold hover:bg-[#F5B300]/90 text-black py-3.5 px-8 font-display rounded-xl text-xs font-bold transition-all shadow-xl hover:shadow-brand-gold/10"
                    >
                      {savingHpSettings ? "Updating Motion profiles..." : "Deploy Animation Settings"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      )}

      {/* CUSTOMER CRM SINGLE VIEW USER PROFILE MODAL */}
      {viewingCrmUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 text-xs">
          <div className="relative w-full max-w-4xl bg-white dark:bg-[#121212] rounded-3xl border border-neutral-200 dark:border-brand-border p-6 md:p-8 shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center overflow-hidden shrink-0">
                  {viewingCrmUser.photoUrl || viewingCrmUser.photoURL ? (
                    <img src={viewingCrmUser.photoUrl || viewingCrmUser.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-mono font-bold text-brand-gold text-lg">
                      {(viewingCrmUser.fullName || viewingCrmUser.email || "C").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <span className="text-[9px] font-mono font-bold bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded-full uppercase border border-brand-gold/25">Customer File Matrix</span>
                  <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white mt-1">
                    {viewingCrmUser.fullName || "Un-onboarded Draft student"}
                  </h2>
                </div>
              </div>
              
              <button 
                onClick={() => setViewingCrmUser(null)}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors shrink-0"
                title="Close CRM profile view"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto pr-1 py-4 space-y-6 text-left flex-1 min-h-0 select-text">
              
              {/* Part 1: Core details + future e-commerce variables */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Left col: user data */}
                <div className="md:col-span-2 space-y-3.5 bg-neutral-50/50 dark:bg-black/20 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-900">
                  <h3 className="text-[10px] font-mono font-bold text-brand-gold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-900 pb-1.5 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Identity & Clearance Parameters
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-neutral-400 font-mono uppercase">Full Name</p>
                      <p className="font-bold text-neutral-900 dark:text-neutral-200 text-sm mt-0.5">{viewingCrmUser.fullName || "Not Onboarded Yet"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 font-mono uppercase">Email Address</p>
                      <p className="font-semibold text-neutral-950 dark:text-white select-all mt-0.5">{viewingCrmUser.email || "None"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 font-mono uppercase">Mobile Phone</p>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-300 mt-0.5">{viewingCrmUser.mobile || "Not Provided"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 font-mono uppercase">Date of Birth</p>
                      <p className="font-medium text-neutral-800 dark:text-neutral-300 mt-0.5">{viewingCrmUser.dateOfBirth || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 font-mono uppercase">Gender Code</p>
                      <p className="font-medium text-neutral-800 dark:text-neutral-300 mt-0.5 uppercase">{viewingCrmUser.gender || "Unspecified"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 font-mono uppercase">Complete Address</p>
                      <p className="font-medium text-neutral-800 dark:text-neutral-300 mt-0.5">
                        {[viewingCrmUser.address, viewingCrmUser.city, viewingCrmUser.state, viewingCrmUser.country].filter(Boolean).join(", ") || "No address provided."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right col: Future E-comm readiness values */}
                <div className="space-y-3.5 bg-neutral-50/55 dark:bg-[#151515] p-5 rounded-2xl border border-neutral-200 dark:border-[#1E1E1E] flex flex-col justify-between">
                  {(() => {
                    const stats = getUserEcommerceStats(viewingCrmUser);
                    return (
                      <div>
                        <h3 className="text-[10px] font-mono font-bold text-brand-gold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-900 pb-1.5 flex items-center gap-1">
                          <ShoppingBag className="w-3.5 h-3.5" /> E-Commerce Transactions
                        </h3>
                        
                        <div className="space-y-2 mt-3 font-mono">
                          <div className="flex justify-between">
                            <span className="text-neutral-450 uppercase text-[9px]">Cart Items</span>
                            <span className="font-bold text-neutral-900 dark:text-white">{stats.cartCount} items</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-450 uppercase text-[9px]">Wishlist Items</span>
                            <span className="font-bold text-neutral-900 dark:text-white">{stats.wishlistCount} items</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-450 uppercase text-[9px]">Total Placed Orders</span>
                            <span className="font-bold text-neutral-900 dark:text-white">{stats.orderCount} purchase(s)</span>
                          </div>
                          <div className="flex justify-between text-brand-gold">
                            <span className="uppercase text-[9px]">Total Amount Spent</span>
                            <span className="font-extrabold text-sm">₹{stats.amountSpent.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-900 text-[10px] font-mono text-neutral-450 bg-[#0c0c0c] p-2.5 rounded-xl">
                    <p className="mb-1 flex justify-between">
                      <span>Verified:</span>
                      <strong className={viewingCrmUser.emailVerified ? "text-green-500" : "text-amber-500"}>
                        {viewingCrmUser.emailVerified ? "YES (CHECKED)" : "PENDING"}
                      </strong>
                    </p>
                    <p className="flex justify-between">
                      <span>Source:</span>
                      <strong className="text-neutral-300">{viewingCrmUser.signupMethod || "Email Auth"}</strong>
                    </p>
                  </div>
                </div>

              </div>

              {/* Part 2: Social handles URLs list */}
              <div className="bg-neutral-50/50 dark:bg-black/20 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-900 space-y-3.5">
                <h3 className="text-[10px] font-mono font-bold text-brand-gold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-950 pb-1.5">
                  Connected Social Network Profiles
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* YouTube link */}
                  <div className="p-2.5 bg-neutral-100 dark:bg-[#141414] rounded-xl flex items-center justify-between border border-neutral-200/50 dark:border-neutral-900">
                    <div>
                      <span className="text-[8px] font-mono uppercase block text-neutral-450">YouTube Channel URL</span>
                      <span className="font-medium text-[11px] truncate block max-w-[180px] dark:text-neutral-200" title={viewingCrmUser.youtubeUrl}>
                        {viewingCrmUser.youtubeUrl || "Not Linked"}
                      </span>
                    </div>
                    {viewingCrmUser.youtubeUrl && (
                      <a href={viewingCrmUser.youtubeUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 rounded-lg transition-all font-mono text-[10px]">Open</a>
                    )}
                  </div>

                  {/* Instagram link */}
                  <div className="p-2.5 bg-neutral-100 dark:bg-[#141414] rounded-xl flex items-center justify-between border border-neutral-200/50 dark:border-neutral-900">
                    <div>
                      <span className="text-[8px] font-mono uppercase block text-neutral-450">Instagram Profile URL</span>
                      <span className="font-medium text-[11px] truncate block max-w-[180px] dark:text-neutral-200" title={viewingCrmUser.instagramUrl}>
                        {viewingCrmUser.instagramUrl || "Not Linked"}
                      </span>
                    </div>
                    {viewingCrmUser.instagramUrl && (
                      <a href={viewingCrmUser.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 rounded-lg transition-all font-mono text-[10px]">Open</a>
                    )}
                  </div>

                  {/* Facebook logo */}
                  <div className="p-2.5 bg-neutral-100 dark:bg-[#141414] rounded-xl flex items-center justify-between border border-neutral-200/50 dark:border-neutral-900">
                    <div>
                      <span className="text-[8px] font-mono uppercase block text-neutral-450">Facebook Profile URL</span>
                      <span className="font-medium text-[11px] truncate block max-w-[180px] dark:text-neutral-200" title={viewingCrmUser.facebookUrl}>
                        {viewingCrmUser.facebookUrl || "Not Linked"}
                      </span>
                    </div>
                    {viewingCrmUser.facebookUrl && (
                      <a href={viewingCrmUser.facebookUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 rounded-lg transition-all font-mono text-[10px]">Open</a>
                    )}
                  </div>

                  {/* LinkedIn Profile */}
                  <div className="p-2.5 bg-neutral-100 dark:bg-[#141414] rounded-xl flex items-center justify-between border border-neutral-200/50 dark:border-neutral-900">
                    <div>
                      <span className="text-[8px] font-mono uppercase block text-neutral-450">LinkedIn Profile URL</span>
                      <span className="font-medium text-[11px] truncate block max-w-[180px] dark:text-neutral-200" title={viewingCrmUser.linkedinUrl}>
                        {viewingCrmUser.linkedinUrl || "Not Linked"}
                      </span>
                    </div>
                    {viewingCrmUser.linkedinUrl && (
                      <a href={viewingCrmUser.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 rounded-lg transition-all font-mono text-[10px]">Open</a>
                    )}
                  </div>

                  {/* Twitter link */}
                  <div className="p-2.5 bg-neutral-100 dark:bg-[#141414] rounded-xl flex items-center justify-between border border-neutral-200/50 dark:border-neutral-900">
                    <div>
                      <span className="text-[8px] font-mono uppercase block text-neutral-450">X (Twitter) Profile URL</span>
                      <span className="font-medium text-[11px] truncate block max-w-[180px] dark:text-neutral-200" title={viewingCrmUser.twitterUrl}>
                        {viewingCrmUser.twitterUrl || "Not Linked"}
                      </span>
                    </div>
                    {viewingCrmUser.twitterUrl && (
                      <a href={viewingCrmUser.twitterUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 rounded-lg transition-all font-mono text-[10px]">Open</a>
                    )}
                  </div>

                  {/* Telegram username info */}
                  <div className="p-2.5 bg-neutral-100 dark:bg-[#141414] rounded-xl flex items-center justify-between border border-neutral-200/50 dark:border-neutral-900">
                    <div>
                      <span className="text-[8px] font-mono uppercase block text-neutral-450">Telegram Username</span>
                      <span className="font-bold text-[11px] truncate block max-w-[180px] text-brand-gold" title={`@${viewingCrmUser.telegramUsername}`}>
                        {viewingCrmUser.telegramUsername ? `@${viewingCrmUser.telegramUsername}` : "Not Linked"}
                      </span>
                    </div>
                    {viewingCrmUser.telegramUsername && (
                      <a href={`https://t.me/${viewingCrmUser.telegramUsername}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 rounded-lg transition-all font-mono text-[10px]">Chat</a>
                    )}
                  </div>

                  {/* Website URL */}
                  <div className="p-2.5 bg-neutral-100 dark:bg-[#141414] rounded-xl flex items-center justify-between border border-neutral-200/50 dark:border-neutral-900 sm:col-span-2 lg:col-span-3">
                    <div>
                      <span className="text-[8px] font-mono uppercase block text-neutral-450">Personal Website / Portfolio URL</span>
                      <span className="font-medium text-xs truncate block max-w-[500px] dark:text-neutral-200" title={viewingCrmUser.websiteUrl}>
                        {viewingCrmUser.websiteUrl || "Not specified by user"}
                      </span>
                    </div>
                    {viewingCrmUser.websiteUrl && (
                      <a href={viewingCrmUser.websiteUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 rounded-lg transition-all font-mono text-[10px]">Browse Site</a>
                    )}
                  </div>
                </div>
              </div>

              {/* Part 2.5: Purchase Analytics Dashboard & Transaction history (Requirements 2, 3, 4) */}
              {(() => {
                const stats = getUserEcommerceStats(viewingCrmUser);
                const sorted = [...stats.completedOrders].sort((a, b) => {
                  const ta = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
                  const tb = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
                  return ta - tb;
                });
                
                const firstPurchaseDate = sorted.length > 0
                  ? new Date(sorted[0].createdAt?.seconds ? sorted[0].createdAt.seconds * 1000 : sorted[0].createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                  : "Never";

                const latestPurchaseDate = sorted.length > 0
                  ? new Date(sorted[sorted.length - 1].createdAt?.seconds ? sorted[sorted.length - 1].createdAt.seconds * 1000 : sorted[sorted.length - 1].createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                  : "Never";

                const ltv = stats.amountSpent;
                const totalRevenue = ltv;
                const totalCoursesPurchased = Array.from(new Set(stats.completedOrders.map((o: any) => o.courseId).filter(Boolean))).length;
                const aov = stats.completedOrders.length > 0 ? ltv / stats.completedOrders.length : 0;

                return (
                  <div className="space-y-6 my-6">
                    {/* Purchase Analytics Dashboard Grid */}
                    <div className="bg-neutral-50 dark:bg-black/25 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-900 text-left space-y-4 animate-in fade-in duration-200">
                      <h3 className="text-[10px] font-mono font-bold text-brand-gold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-900 pb-1.5 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" /> E-Commerce Purchase Business Intelligence (BI)
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
                        <div className="p-3 bg-white dark:bg-neutral-900/60 rounded-xl border border-neutral-150 dark:border-neutral-850/60 text-left">
                          <p className="text-[9px] text-neutral-400 uppercase">First Purchase Date</p>
                          <p className="font-bold text-neutral-850 dark:text-neutral-200 mt-1">{firstPurchaseDate}</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-neutral-900/60 rounded-xl border border-neutral-150 dark:border-neutral-850/60 text-left">
                          <p className="text-[9px] text-neutral-400 uppercase">Latest Purchase Date</p>
                          <p className="font-bold text-neutral-850 dark:text-neutral-200 mt-1">{latestPurchaseDate}</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-neutral-900/60 rounded-xl border border-neutral-150 dark:border-neutral-850/60 text-left">
                          <p className="text-[9px] text-neutral-400 uppercase">LTV (Lifetime Value)</p>
                          <p className="font-extrabold text-brand-gold text-sm mt-1">₹{ltv.toLocaleString("en-IN")}</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-neutral-900/60 rounded-xl border border-neutral-150 dark:border-neutral-850/60 text-left">
                          <p className="text-[9px] text-neutral-400 uppercase">Total Revenue Generated</p>
                          <p className="font-bold text-neutral-850 dark:text-neutral-200 mt-1">₹{totalRevenue.toLocaleString("en-IN")}</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-neutral-900/60 rounded-xl border border-neutral-150 dark:border-neutral-850/60 text-left">
                          <p className="text-[9px] text-neutral-400 uppercase">Total Courses Purchased</p>
                          <p className="font-bold text-neutral-850 dark:text-neutral-200 mt-1">{totalCoursesPurchased} Units</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-neutral-900/60 rounded-xl border border-neutral-150 dark:border-neutral-850/60 text-left">
                          <p className="text-[9px] text-neutral-400 uppercase">Average Order Value (AOV)</p>
                          <p className="font-bold text-neutral-850 dark:text-neutral-200 mt-1">₹{Math.round(aov).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Transaction History Table (Requirement 3) */}
                    <div className="bg-white dark:bg-neutral-900/40 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-850 space-y-3.5 text-left animate-in fade-in duration-250">
                      <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-900 pb-2">
                        <h3 className="text-[10px] font-mono font-bold text-brand-gold uppercase tracking-wider flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5" /> Customer Transaction History & Order Ledger ({stats.userOrders.length})
                        </h3>
                        <span className="text-[9px] font-mono text-neutral-500 bg-neutral-100 dark:bg-black/40 px-2 py-0.5 rounded-full uppercase">Orders Logs</span>
                      </div>

                      {stats.userOrders.length === 0 ? (
                        <div className="text-center py-10 text-neutral-400 dark:text-neutral-500 italic font-mono text-xs">
                          No transaction or order placement records registered for this student yet.
                        </div>
                      ) : (
                        <div className="border border-neutral-150 dark:border-brand-border rounded-xl scrollbar-thin overflow-hidden">
                          <table className="w-full text-left text-xs font-sans border-collapse">
                            <thead className="bg-[#fcfcfc] dark:bg-black/60 text-neutral-400 font-mono text-[9px] uppercase tracking-wider border-b border-neutral-150 dark:border-neutral-900 select-none">
                              <tr>
                                <th className="px-4 py-2.5">Order Ref</th>
                                <th className="px-4 py-2.5">Course Name</th>
                                <th className="px-4 py-2.5">Amount Paid</th>
                                <th className="px-4 py-2.5">Verification</th>
                                <th className="px-4 py-2.5 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-150 dark:divide-neutral-900 text-left">
                              {stats.userOrders.map((ord: any) => {
                                const isExp = expandedOrderId === ord.id;
                                const matchingCourse = courses.find(c => c.id === ord.courseId);
                                const deliveryUrlLink = matchingCourse?.deliverableLink || matchingCourse?.deliveryUrl || "Not Assigned";
                                
                                let ordDateString = "N/A";
                                if (ord.createdAt) {
                                  if (typeof ord.createdAt === "object" && ord.createdAt.seconds) {
                                    ordDateString = new Date(ord.createdAt.seconds * 1000).toLocaleString();
                                  } else {
                                    ordDateString = new Date(ord.createdAt).toLocaleString();
                                  }
                                }

                                return (
                                  <React.Fragment key={ord.id}>
                                    <tr className="hover:bg-neutral-50 dark:hover:bg-brand-card/10 transition-colors">
                                      <td className="px-4 py-2.5 font-mono text-[10px] text-neutral-850 dark:text-neutral-200">
                                        <div>{ord.id || "N/A"}</div>
                                        <div className="text-[9px] text-neutral-400">{ordDateString}</div>
                                      </td>
                                      <td className="px-4 py-2.5 font-bold text-neutral-900 dark:text-white truncate max-w-[150px]" title={ord.courseName}>
                                        {ord.courseName || "Digital Course"}
                                      </td>
                                      <td className="px-4 py-2.5 font-mono font-bold text-neutral-850 dark:text-brand-gold">
                                        ₹{(ord.amount || ord.price || 0).toLocaleString("en-IN")}
                                      </td>
                                      <td className="px-4 py-2.5">
                                        <span className={`inline-block text-[9px] font-mono font-extrabold px-2 py-0.5 rounded border uppercase ${
                                          ord.status === "Verified" || ord.status === "Delivered" || ord.status === "Approved" || ord.status === "approved"
                                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                        }`}>
                                          {ord.status || "Pending"}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2.5 text-right">
                                        <button
                                          type="button"
                                          onClick={() => setExpandedOrderId(isExp ? null : ord.id)}
                                          className="text-brand-gold hover:underline font-semibold font-mono text-[11px]"
                                        >
                                          {isExp ? "Collapse" : "Expand Details"}
                                        </button>
                                      </td>
                                    </tr>

                                    {/* Expanded Transaction Parameters Panel */}
                                    {isExp && (
                                      <tr>
                                        <td colSpan={5} className="px-5 py-4 bg-neutral-50 dark:bg-black/30 font-mono text-[11px] text-left">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-900">
                                            <div className="space-y-1.5 pb-2 md:pb-0 text-left">
                                              <p className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider mb-1">Transaction Audit Parameters</p>
                                              <p><strong>Order Ref ID:</strong> {ord.id || "Direct Assign"}</p>
                                              <p><strong>Student UID ID:</strong> {ord.userId || viewingCrmUser.uid || viewingCrmUser.id}</p>
                                              <p><strong>Customer FullName:</strong> {ord.name || ord.buyerName || viewingCrmUser.fullName}</p>
                                              <p><strong>Customer Email:</strong> {ord.email || viewingCrmUser.email}</p>
                                              <p><strong>Payment Reference:</strong> {ord.razorpayPaymentId || ord.razorpay_payment_id || ord.paymentProofImage || "UPI Image Uploaded"}</p>
                                              <p><strong>Creation Date:</strong> {ordDateString}</p>
                                            </div>
                                            <div className="space-y-1.5 pt-2 md:pt-0 md:pl-4 text-left">
                                              <p className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider mb-1">Product Checkout Parameters</p>
                                              <p><strong>Course ID Ref:</strong> {ord.courseId || "Multiple"}</p>
                                              <p><strong>Course Title Ref:</strong> {ord.courseName || "Bundle Access"}</p>
                                              <p><strong>Original Price:</strong> ₹{(ord.originalPrice || ord.amount || ord.price || 0).toLocaleString("en-IN")}</p>
                                              <p><strong>Coupon Used:</strong> <span className="bg-brand-gold/10 text-brand-gold px-1.5 py-0.5 rounded font-bold">{ord.couponCode || "None"}</span></p>
                                              <p><strong>Discount Value:</strong> ₹{(ord.discountApplied || ord.couponDiscount || 0).toLocaleString("en-IN")}</p>
                                              <p><strong>Final Amount Paid:</strong> ₹{(ord.amount || ord.price || 0).toLocaleString("en-IN")}</p>
                                              <p><strong>Payment Status:</strong> {ord.status || "Pending"}</p>
                                              <p className="flex items-center gap-1 pb-1 pt-1 border-t border-dashed border-neutral-250 dark:border-neutral-850 mt-2">
                                                <strong>Access delivery link:</strong>
                                                {deliveryUrlLink !== "Not Assigned" ? (
                                                  <a href={deliveryUrlLink} target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline flex items-center gap-0.5 font-bold">
                                                    Open Link <ExternalLink className="w-3 h-3" />
                                                  </a>
                                                ) : (
                                                  <span className="text-neutral-500">{deliveryUrlLink}</span>
                                                )}
                                              </p>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Part 3: Real-time user logs timeline checklist */}
              {(() => {
                const userCrmLogs = activityLogsList.filter((log) => {
                  return log.userId === viewingCrmUser.uid || 
                         log.userId === viewingCrmUser.id || 
                         (log.email && log.email.toLowerCase() === (viewingCrmUser.email || "").toLowerCase());
                });

                return (
                  <div className="bg-white dark:bg-neutral-900/40 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-850 space-y-3.5">
                    <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-900 pb-2">
                      <h3 className="text-[10px] font-mono font-bold text-brand-gold uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" /> Platform Action-Telemetry Log ({userCrmLogs.length})
                      </h3>
                      <span className="text-[9px] font-mono text-neutral-500 bg-neutral-100 dark:bg-black/40 px-2 py-0.5 rounded-full uppercase">Realtime Logging Feed</span>
                    </div>

                    {userCrmLogs.length === 0 ? (
                      <div className="text-center py-10 text-neutral-400 dark:text-neutral-500 italic font-mono">
                        No telemetry logs registered for this customer yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto max-h-64 border border-neutral-250 dark:border-brand-border rounded-xl">
                        <table className="w-full text-left text-xs font-sans">
                          <thead className="bg-[#fcfcfc] dark:bg-black/60 text-neutral-400 font-mono text-[9px] uppercase tracking-wider border-b border-neutral-150 dark:border-neutral-900 select-none">
                            <tr>
                              <th className="px-4 py-2.5">Platform Event Action</th>
                              <th className="px-4 py-2.5">Context Label / Page</th>
                              <th className="px-4 py-2.5">Client IP / Device</th>
                              <th className="px-4 py-2.5 text-right">Time of Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-150 dark:divide-neutral-900">
                            {userCrmLogs.map((log) => {
                              let logStampValue = "Just now";
                              if (log.timestamp) {
                                if (typeof log.timestamp === "object" && log.timestamp.seconds) {
                                  logStampValue = new Date(log.timestamp.seconds * 1000).toLocaleString();
                                } else {
                                  logStampValue = new Date(log.timestamp).toLocaleString();
                                }
                              }
                              return (
                                <tr key={log.id} className="hover:bg-neutral-50 dark:hover:bg-brand-card/10 transition-colors">
                                  <td className="px-4 py-2.5 text-left font-bold text-neutral-900 dark:text-white">
                                    <span className="bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded uppercase font-mono text-[10px]">{log.action || "Event"}</span>
                                  </td>
                                  <td className="px-4 py-2.5 text-left text-neutral-600 dark:text-neutral-350 truncate max-w-xs">{log.params?.title || log.params?.courseTitle || log.params?.blogTitle || log.courseTitle || log.blogTitle || log.page || "Homepage Index"}</td>
                                  <td className="px-4 py-2.5 text-neutral-500 font-mono text-[10px]" title={log.userAgent}>{log.ip || "127.0.0.1 (VPN Proxy)"}</td>
                                  <td className="px-4 py-2.5 text-right text-neutral-400 font-mono text-[10px]">{logStampValue}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-900 shrink-0 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setViewingCrmUser(null)}
                className="bg-brand-gold text-black font-semibold hover:bg-[#F5B300]/90 px-6 py-2.5 rounded-xl transition-all shadow-md font-bold font-sans tracking-wide"
              >
                Finished viewing Matrix folder
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ADD/EDIT ORBIT ITEM MODAL */}
      {showOrbitModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151515] rounded-3xl border border-neutral-200 dark:border-brand-border max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-200 dark:border-brand-border">
              <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">
                {editingOrbitItem ? "Edit Orbit Item" : "Add Orbit Item"}
              </h3>
              <button onClick={() => setShowOrbitModal(false)} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrbitItem} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-400 mb-1.5">Item Title / Alt</label>
                <input
                  type="text"
                  required
                  value={orbitTitle}
                  onChange={(e) => setOrbitTitle(e.target.value)}
                  placeholder="e.g. Cinema Course, AI Agent"
                  className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-400 mb-1.5">Ring Assignment</label>
                <select
                  value={orbitRingAssignment}
                  onChange={(e: any) => setOrbitRingAssignment(e.target.value)}
                  className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold"
                >
                  <option value="Ring 1">Ring 1 (Inner Orbit)</option>
                  <option value="Ring 2">Ring 2 (Middle Orbit)</option>
                  <option value="Ring 3">Ring 3 (Outer Orbit)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-400 mb-1.5">Image Source Choice</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {(["course", "external", "upload"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setOrbitImageSourceType(mode)}
                      className={`text-[10px] font-mono uppercase font-bold py-2 px-1.5 rounded-lg border text-center transition-all ${
                        orbitImageSourceType === mode
                          ? "bg-brand-gold/15 border-brand-gold text-brand-gold"
                          : "border-neutral-200 dark:border-brand-border bg-transparent text-neutral-500"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {orbitImageSourceType === "course" && (
                  <select
                    value={orbitCourseId}
                    onChange={(e) => {
                      setOrbitCourseId(e.target.value);
                      // Auto populate title and slug
                      const matched = courses.find(c => c.id === e.target.value);
                      if (matched) {
                        setOrbitTitle(matched.title);
                        setOrbitTargetSlug(matched.slug || "");
                      }
                    }}
                    required
                    className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl"
                  >
                    <option value="">-- Choose Course --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                )}

                {orbitImageSourceType === "external" && (
                  <input
                    type="url"
                    required
                    value={orbitExternalImageUrl}
                    onChange={(e) => setOrbitExternalImageUrl(e.target.value)}
                    placeholder="https://example.com/item.jpg"
                    className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl font-mono"
                  />
                )}

                {orbitImageSourceType === "upload" && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      {orbitUploadedImage && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-brand-gold bg-[#000]">
                          <img src={orbitUploadedImage} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <label className="flex-1 border border-dashed border-neutral-300 dark:border-brand-border rounded-xl p-3 text-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all block">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {uploadingOrbitImage ? "Uploading assets..." : "Select PNG/JPG/WEBP (max 2MB)"}
                        </span>
                        <input type="file" accept="image/*" onChange={handleOrbitItemImageUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-400 mb-1.5">Description (Shown on Hover)</label>
                <textarea
                  value={orbitDescription}
                  onChange={(e) => setOrbitDescription(e.target.value)}
                  placeholder="e.g. Expand your skills with cinematography fundamentals and gear tutorials"
                  rows={2}
                  className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-[#eee] dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-400 mb-1.5">Action on Click</label>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {(["course", "blog", "external", "none"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setOrbitClickActionType(t)}
                      className={`text-[9px] font-mono uppercase font-bold py-1.5 rounded-lg border text-center transition-all ${
                        orbitClickActionType === t
                          ? "bg-brand-gold/15 border-brand-gold text-brand-gold"
                          : "border-neutral-200 dark:border-brand-border bg-transparent text-neutral-500"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {orbitClickActionType === "course" && (
                  <select
                    value={orbitTargetSlug}
                    onChange={(e) => setOrbitTargetSlug(e.target.value)}
                    required
                    className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-[#eee] dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl"
                  >
                    <option value="">-- Choose Course Landing --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.slug || ""}>{c.title}</option>
                    ))}
                  </select>
                )}

                {orbitClickActionType === "blog" && (
                  <select
                    value={orbitTargetSlug}
                    onChange={(e) => setOrbitTargetSlug(e.target.value)}
                    required
                    className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-[#eee] dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl font-mono"
                  >
                    <option value="">-- Choose Blog --</option>
                    {blogsList.map((b) => (
                      <option key={b.id} value={b.slug || ""}>{b.title}</option>
                    ))}
                  </select>
                )}

                {orbitClickActionType === "external" && (
                  <input
                    type="url"
                    required
                    value={orbitTargetSlug}
                    onChange={(e) => setOrbitTargetSlug(e.target.value)}
                    placeholder="https://telegram.org"
                    className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-[#eee] dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl font-mono"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-[#aaa] mb-1.5">Display Order</label>
                  <input
                    type="number"
                    value={orbitDisplayOrder}
                    onChange={(e) => setOrbitDisplayOrder(Number(e.target.value))}
                    min={1}
                    className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-[#eee] dark:border-brand-border text-neutral-900 dark:text-white py-2.5 px-4 rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-5">
                  <input
                    id="orbitEnabled"
                    type="checkbox"
                    checked={orbitEnabled}
                    onChange={(e) => setOrbitEnabled(e.target.checked)}
                    className="w-4 h-4 text-brand-gold rounded border-neutral-300 focus:ring-brand-gold"
                  />
                  <label htmlFor="orbitEnabled" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Enabled</label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-neutral-200 dark:border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowOrbitModal(false)}
                  className="flex-1 py-3 border border-neutral-200 dark:border-brand-border text-neutral-500 rounded-xl text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-gold hover:bg-[#F5B300]/90 text-black rounded-xl text-xs font-bold shadow-md shadow-brand-gold/10 transition-colors"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CORE USER MODAL: EDIT STUDENT PROFILE */}
      {showUserModal && editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#121212] rounded-3xl border border-neutral-200 dark:border-brand-border p-6 md:p-8 shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-900">
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider text-brand-gold">
                Edit Student Profile <Sparkles className="w-4 h-4 text-brand-gold shrink-0 animate-pulse" />
              </h2>
              <button 
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                }}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 pt-4 text-xs text-left">
              
              <div>
                <label className="block text-[10px] text-neutral-400 tracking-wider font-mono uppercase mb-1 font-bold">Email Address (Read-only)</label>
                <input
                  type="text"
                  disabled
                  value={editingUser.email || ""}
                  className="w-full bg-neutral-100 dark:bg-neutral-900/40 border border-neutral-200 dark:border-brand-border rounded-xl px-4 py-3 text-neutral-400 font-sans cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 tracking-wider font-mono uppercase mb-1 font-bold">Full Student Name *</label>
                <input
                  type="text"
                  required
                  value={userModalForm.fullName}
                  onChange={(e) => setUserModalForm({ ...userModalForm, fullName: e.target.value })}
                  placeholder="e.g. Hardik Pandya"
                  className="w-full bg-neutral-100 dark:bg-[#0b0b0b] border border-neutral-200 dark:border-brand-border rounded-xl px-4 py-3 text-neutral-900 dark:text-white font-sans focus:outline-none focus:ring-1 focus:ring-brand-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 tracking-wider font-mono uppercase mb-1 font-bold">Contact Mobile *</label>
                <input
                  type="text"
                  required
                  value={userModalForm.mobile}
                  onChange={(e) => setUserModalForm({ ...userModalForm, mobile: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-neutral-100 dark:bg-[#0b0b0b] border border-neutral-200 dark:border-brand-border rounded-xl px-4 py-3 text-neutral-900 dark:text-white font-sans focus:outline-none focus:ring-1 focus:ring-brand-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 tracking-wider font-mono uppercase mb-1 font-bold">Street address *</label>
                <input
                  type="text"
                  required
                  value={userModalForm.address}
                  onChange={(e) => setUserModalForm({ ...userModalForm, address: e.target.value })}
                  placeholder="e.g. Marine Drive Apt 4C"
                  className="w-full bg-neutral-100 dark:bg-[#0b0b0b] border border-neutral-200 dark:border-brand-border rounded-xl px-4 py-3 text-neutral-900 dark:text-white font-sans focus:outline-none focus:ring-1 focus:ring-brand-gold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] text-neutral-400 tracking-wider font-mono uppercase mb-1 font-bold">City *</label>
                  <input
                    type="text"
                    required
                    value={userModalForm.city}
                    onChange={(e) => setUserModalForm({ ...userModalForm, city: e.target.value })}
                    placeholder="Mumbai"
                    className="w-full bg-neutral-100 dark:bg-[#0b0b0b] border border-neutral-200 dark:border-brand-border rounded-xl px-3 py-2.5 text-neutral-900 dark:text-white font-sans focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-neutral-400 tracking-wider font-mono uppercase mb-1 font-bold">State *</label>
                  <input
                    type="text"
                    required
                    value={userModalForm.state}
                    onChange={(e) => setUserModalForm({ ...userModalForm, state: e.target.value })}
                    placeholder="Maharashtra"
                    className="w-full bg-neutral-100 dark:bg-[#0b0b0b] border border-neutral-200 dark:border-brand-border rounded-xl px-3 py-2.5 text-neutral-900 dark:text-white font-sans focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-neutral-400 tracking-wider font-mono uppercase mb-1 font-bold">Country *</label>
                  <input
                    type="text"
                    required
                    value={userModalForm.country}
                    onChange={(e) => setUserModalForm({ ...userModalForm, country: e.target.value })}
                    placeholder="India"
                    className="w-full bg-neutral-100 dark:bg-[#0b0b0b] border border-neutral-200 dark:border-brand-border rounded-xl px-3 py-2.5 text-neutral-900 dark:text-white font-sans focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-900 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                  }}
                  className="bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-300 font-semibold px-4 py-2.5 rounded-xl transition-colors font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-gold text-black font-semibold hover:bg-[#F5B300]/90 px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1 font-bold bg-gold"
                >
                  Update Profile Details
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DYNAMIC MODALS BLOCK */}
      {/* ADD/EDIT BLOG MODAL */}
      {showBlogModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-white dark:bg-[#121212] rounded-3xl border border-neutral-200 dark:border-brand-border p-6 md:p-8 shadow-2xl overflow-hidden animate-in zoom-in duration-250">
            <button
              onClick={() => setShowBlogModal(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-mono text-brand-gold uppercase tracking-widest font-bold">SEO Compiler Content</span>
                <h3 className="font-display text-xl font-bold text-neutral-900 dark:text-white">
                  {editingBlog ? "Modify Published Tutorial" : "Compose Fresh Search Index Article"}
                </h3>
                <p className="text-xs text-neutral-500 font-light mt-1">Provide semantic details, target search terms, and format rich explanations using markdown directives.</p>
              </div>

              {blogError && (
                <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-left animate-shake">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0"></div>
                  <span className="font-medium">{blogError}</span>
                </div>
              )}

              <form onSubmit={handleSaveBlog} className="space-y-5 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto max-h-[60vh] pr-1.5 scrollbar-thin">
                  
                  {/* Title & Slug */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="bTitle">Article Title</label>
                      <input
                        id="bTitle"
                        type="text"
                        required
                        placeholder="e.g. Master LangChain Agents in 10 Minutes"
                        value={blogTitle}
                        onChange={(e) => {
                          setBlogTitle(e.target.value);
                          // Auto generate url slug
                          if (!editingBlog) {
                            setBlogSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, ""));
                          }
                        }}
                        className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="bSlug">URL Slug (Keyword-Optimized)</label>
                      <input
                        id="bSlug"
                        type="text"
                        required
                        placeholder="e.g. learn-langchain-agents-fast"
                        value={blogSlug}
                        onChange={(e) => setBlogSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                        className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="bCategory">Topic Category</label>
                        <select
                          id="bCategory"
                          value={blogCategory}
                          onChange={(e) => setBlogCategory(e.target.value)}
                          className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-sans font-medium"
                        >
                          <option value="AI & Future Tech">AI & Future Tech</option>
                          <option value="Video Editing">Video Editing</option>
                          <option value="Freelancing">Freelancing</option>
                          <option value="Digital Marketing">Digital Marketing</option>
                          <option value="YouTube Growth">YouTube Growth</option>
                          <option value="Business">Business</option>
                          <option value="Self Improvement">Self Improvement</option>
                          <option value="Career Skills">Career Skills</option>
                          <option value="Course Comparisons">Course Comparisons</option>
                          <option value="Software Reviews">Software Reviews</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="bPublishDate">Publish Date</label>
                        <input
                          id="bPublishDate"
                          type="date"
                          required
                          value={blogPublishDate}
                          onChange={(e) => setBlogPublishDate(e.target.value)}
                          className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="bAuthor">Author Name</label>
                        <input
                          id="bAuthor"
                          type="text"
                          required
                          placeholder="e.g. Dr. Arthur Pendelton"
                          value={blogAuthor}
                          onChange={(e) => setBlogAuthor(e.target.value)}
                          className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEO Metadata & Thumbnail */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="bMetaTitle">SEO Meta Title (Default: Title)</label>
                      <input
                        id="bMetaTitle"
                        type="text"
                        placeholder="e.g. Ultimate Guide to Autonomous LangChain Agents"
                        value={blogMetaTitle}
                        onChange={(e) => setBlogMetaTitle(e.target.value)}
                        className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="bMetaDesc">Meta Description Tag (150 chars optimized)</label>
                      <textarea
                        id="bMetaDesc"
                        rows={2}
                        maxLength={160}
                        placeholder="e.g. Discover how autonomous agent workflows and key LLM stacks can completely transform enterprise development teams."
                        value={blogMetaDescription}
                        onChange={(e) => setBlogMetaDescription(e.target.value)}
                        className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-light resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="bKeywords">SEO Keywords (Comma Separated)</label>
                      <input
                        id="bKeywords"
                        type="text"
                        placeholder="e.g. AI, LangChain, autonomous agents, developers"
                        value={blogKeywords}
                        onChange={(e) => setBlogKeywords(e.target.value)}
                        className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5" htmlFor="bCanonical">Canonical URL</label>
                      <input
                        id="bCanonical"
                        type="url"
                        placeholder="e.g. https://learn2future.com/blog/learn-langchain-agents"
                        value={blogCanonicalUrl}
                        onChange={(e) => setBlogCanonicalUrl(e.target.value)}
                        className="w-full text-xs bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-brand-border text-neutral-900 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5">Image Asset Banner</label>
                      <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 text-center cursor-pointer hover:border-brand-gold dark:hover:border-brand-gold transition-colors relative bg-neutral-50/20 dark:bg-[#090909]">
                        <input
                          id="bImageChooser"
                          type="file"
                          accept="image/*"
                          onChange={handleBlogImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {uploadingImage ? (
                          <div className="space-y-2 py-4">
                            <div className="w-5 h-5 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <span className="text-[10px] text-neutral-400 block font-mono">Formulating asset matrix...</span>
                          </div>
                        ) : blogFeaturedImage ? (
                          <div className="space-y-2 select-none relative">
                            <div className="w-full h-24 rounded-lg overflow-hidden relative border border-neutral-200 dark:border-neutral-800">
                              <img src={blogFeaturedImage} alt="Featured draft thumbnail" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[9px] font-mono text-brand-gold tracking-tight block">Successfully encoded! Click or drag to swap.</span>
                          </div>
                        ) : (
                          <div className="space-y-1.5 py-4">
                            <Upload className="w-5 h-5 text-neutral-400 mx-auto" />
                            <span className="text-[10px] font-bold text-neutral-900 dark:text-white block">Upload Featured Header</span>
                            <span className="text-[9px] text-neutral-500 block font-light">Supports JPEG/PNG up to 2MB (Auto compressed)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Professional Rich HTML WYSIWYG Editor Component (Full width below) */}
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase">Article Content (Rich WYSIWYG Format)</label>
                      <span className="text-[9px] text-neutral-500 font-mono">Real-time WordPress / Blogger styled editor</span>
                    </div>
                    <RichTextEditor
                      postId={editingBlog ? editingBlog.id : "new_draft"}
                      value={blogContent}
                      onChange={setBlogContent}
                    />
                  </div>

                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200 dark:border-brand-border select-none font-display">
                  <button
                    type="button"
                    onClick={() => setShowBlogModal(false)}
                    className="border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400 font-semibold text-xs py-3 px-6 rounded-xl transition"
                  >
                    Cancel Draft
                  </button>
                  <button
                    type="submit"
                    className="bg-brand-gold hover:bg-brand-gold-hover text-black font-bold text-xs py-3 px-6 rounded-xl transition flex items-center gap-1.5 shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingBlog ? "Confirm Update" : "Publish Article"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CORE MODAL A: ADD/EDIT COURSE catalog */}
      {showCourseModal && (() => {
        const tabsList = [
          { id: "info", label: "ℹ️ Basic Info" },
          { id: "price", label: "💰 Pricing & Outcomes" },
          { id: "media", label: "🖼 Media Assets" },
          { id: "details", label: "📝 Details & Metrics" },
          { id: "curriculum", label: "📚 Curriculum builder" },
          { id: "faqs", label: "❓ FAQs builder" },
          { id: "seo", label: "📊 SEO & Meta tools" }
        ];

        const currentPreviewPayload: Course = {
          id: editingCourse?.id || "preview-id",
          title: courseTitle,
          createdAt: editingCourse?.createdAt || new Date(),
          category: courseCategory,
          price: Number(coursePrice),
          description: courseDescription,
          thumbnail: courseThumbnail,
          slug: courseSlug || "live-preview",
          deliverableLink: courseDeliverableLink,
          welcomeVideoUrl: courseWelcomeVideoUrl,
          deliveryInstructions: courseDeliveryInstructions,
          deliveryUrl: courseDeliveryUrl,

          instructorName: courseInstructorName || "Aditya Raj Kashyap",
          subCategory: courseSubCategory || courseCategory || "Professional Course",
          courseStatus: courseStatus || "Published",
          isFeatured: courseIsFeatured,
          isPopular: courseIsPopular,
          isTrending: courseIsTrending,

          originalPrice: Number(courseOriginalPrice) || Math.round(Number(coursePrice) * 2.2),
          discountPercentage: Number(courseDiscountPercentage) || 0,
          currency: courseCurrency || "INR",
          isLimitedTimeOffer: courseIsLimitedTimeOffer,

          bannerImage: courseBannerImage || courseThumbnail,
          instructorImage: courseInstructorImage || "",
          previewVideoUrl: coursePreviewVideoUrl || "",
          shortDescription: courseShortDescription || courseDescription || "",
          longDescription: courseLongDescription || courseDescription || "",
          courseOverview: courseOverview || "",
          courseSummary: courseSummary || "",
          whoIsThisCourseFor: courseWhoIsThisCourseFor || "",
          prerequisites: coursePrerequisites || "",

          courseDuration: courseDuration || "10+ Hours of on-demand sessions",
          videoHours: courseVideoHours || "10",
          numberOfLessons: Number(courseNumberOfLessons) || 28,
          numberOfModules: Number(courseNumberOfModules) || 5,
          assignmentsCount: Number(courseAssignmentsCount) || 0,
          projectsCount: Number(courseProjectsCount) || 0,
          quizCount: Number(courseQuizCount) || 0,
          language: courseLanguage || "English / Bilingual",
          skillLevel: courseSkillLevel || "All Professional Levels",
          certificateAvailable: courseCertificateAvailable,
          lifetimeAccess: courseLifetimeAccess,
          mobileAccess: courseMobileAccess,
          downloadableResources: courseDownloadableResources,

          modules: courseModules || [],
          faqItems: courseFaqItems || [],

          seoTitle: courseSeoTitle || "",
          seoDescription: courseSeoDescription || "",
          focusKeyword: courseFocusKeyword || "",
          secondaryKeywords: courseSecondaryKeywords || [],
          courseTags: courseTags || [],
          canonicalUrl: courseCanonicalUrl || "",
          ogTitle: courseOgTitle || "",
          ogDescription: courseOgDescription || "",
          twitterTitle: courseTwitterTitle || "",
          twitterDescription: courseTwitterDescription || "",
          schemaDescription: courseSchemaDescription || "",

          benefits: courseBenefits || [],
          learningOutcomes: courseLearningOutcomes || [],
          requirements: courseRequirements || [],
          toolsNeeded: courseToolsNeeded || [],
          bonusResources: courseBonusResources || []
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none font-sans">
            <div className="relative w-full max-w-7xl bg-white dark:bg-[#121212] rounded-3xl border border-neutral-200 dark:border-brand-border shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col h-[92vh]">
              
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-900 bg-neutral-50/50 dark:bg-black/30 shrink-0">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-display text-sm sm:text-base font-black uppercase text-neutral-900 dark:text-white flex items-center gap-1.5 tracking-wider">
                    {editingCourse ? "⚡ Course CMS: Edit Blueprint Panel" : "🌟 Course CMS: Launch New Blueprint"}
                  </h2>
                  <span className="text-[10px] bg-[#F5B300]/10 text-brand-gold border border-[#F5B300]/25 px-2 py-0.5 rounded-lg font-mono">ACTIVE INSTANT PREVIEW</span>
                </div>
                <button 
                  onClick={() => setShowCourseModal(false)}
                  className="p-2 text-neutral-450 hover:text-white hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
                  title="Cancel & Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SPLIT SCREEN BODY */}
              <div className="flex-grow flex overflow-hidden min-h-0">
                
                {/* LEFT COLUMN: SCROLLABLE CMS FORM */}
                <div className="w-full lg:w-1/2 flex flex-col overflow-hidden border-r border-neutral-200 dark:border-neutral-900">
                  <form onSubmit={handleSaveCourse} className="flex-grow flex flex-col overflow-hidden">
                    
                    {/* Category tabs navigator */}
                    <div className="p-4 bg-neutral-100/30 dark:bg-black/10 border-b border-neutral-200 dark:border-neutral-900 shrink-0">
                      <div className="flex border-b border-neutral-200 dark:border-neutral-850 gap-2 overflow-x-auto pb-1 mt-0">
                        {tabsList.map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setCourseEditorActiveTab(t.id as any)}
                            className={`px-3 py-1.5 text-[10px] font-bold font-mono uppercase tracking-wider rounded-lg shrink-0 transition-all cursor-pointer ${
                              courseEditorActiveTab === t.id
                                ? "bg-brand-gold text-black shadow"
                                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dynamic Tab Body Frame */}
                    <div className="flex-grow overflow-y-auto p-5 space-y-4 text-xs font-sans text-left">
                      
                      {courseEditorActiveTab === "info" && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[9.5px] text-neutral-400 tracking-wider font-mono uppercase mb-1">Course Title *</label>
                            <input 
                              type="text" 
                              required 
                              value={courseTitle} 
                              onChange={(e) => setCourseTitle(e.target.value)} 
                              placeholder="e.g. Master Time Management: The Ultimate Guide"
                              className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3.5 py-2.5 text-[11px] text-neutral-900 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-brand-gold" 
                            />
                          </div>
                          <div>
                            <label className="block text-[9.5px] text-neutral-400 tracking-wider font-mono uppercase mb-1">Course URL Slug</label>
                            <input 
                              type="text" 
                              value={courseSlug} 
                              onChange={(e) => setCourseSlug(e.target.value)} 
                              placeholder="e.g. master-time-management-the-ultimate-guide (Autogenerated if blank)" 
                              className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3.5 py-2.5 text-[11px] text-neutral-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-gold" 
                            />
                            <p className="text-[10px] text-neutral-400 mt-1 font-mono">
                              Absolute sitemap link: /course/{courseSlug || "auto-generated-slug"}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9.5px] text-neutral-400 tracking-wider font-mono uppercase mb-1">Instructor Name</label>
                              <input 
                                type="text" 
                                value={courseInstructorName} 
                                onChange={(e) => setCourseInstructorName(e.target.value)} 
                                placeholder="Aditya Raj Kashyap"
                                className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3.5 py-2.5 text-[11px] text-neutral-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-gold" 
                              />
                            </div>
                            <div>
                              <label className="block text-[9.5px] text-neutral-400 tracking-wider font-mono uppercase mb-1">Subcategory</label>
                              <input 
                                type="text" 
                                value={courseSubCategory} 
                                onChange={(e) => setCourseSubCategory(e.target.value)} 
                                placeholder="e.g. Ultimate Hacks or Strategy"
                                className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3.5 py-2.5 text-[11px] text-neutral-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-gold" 
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9.5px] text-neutral-400 tracking-wider font-mono uppercase mb-1">Category Vertic *</label>
                              <select 
                                value={courseCategory} 
                                onChange={(e) => setCourseCategory(e.target.value)} 
                                className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3 py-2.5 text-[11px] text-neutral-900 dark:text-white font-medium focus:outline-none"
                              >
                                <option value="AI Tools">AI Tools</option>
                                <option value="Video Editing">Video Editing</option>
                                <option value="Digital Marketing">Digital Marketing</option>
                                <option value="YouTube Growth">YouTube Growth</option>
                                <option value="Freelancing">Freelancing</option>
                                <option value="Business">Business</option>
                                <option value="Self Improvement">Self Improvement</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[9.5px] text-neutral-400 tracking-wider font-mono uppercase mb-1">Course Status</label>
                              <select 
                                value={courseStatus} 
                                onChange={(e) => setCourseStatus(e.target.value as any)} 
                                className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3 py-2.5 text-[11px] text-neutral-900 dark:text-white font-medium focus:outline-none"
                              >
                                <option value="Published">Published (Indexed & Visible)</option>
                                <option value="Draft">Draft (Private archive)</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-4 items-center pt-2 border-t border-neutral-100 dark:border-neutral-900">
                            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] uppercase font-mono text-neutral-400">
                              <input 
                                type="checkbox" 
                                checked={courseIsFeatured} 
                                onChange={(e) => setCourseIsFeatured(e.target.checked)} 
                                className="rounded text-[#F5B300] focus:ring-0 cursor-pointer" 
                              />
                              <span>Featured Course</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] uppercase font-mono text-neutral-400">
                              <input 
                                type="checkbox" 
                                checked={courseIsPopular} 
                                onChange={(e) => setCourseIsPopular(e.target.checked)} 
                                className="rounded text-[#F5B300] focus:ring-0 cursor-pointer" 
                              />
                              <span>Popular Course</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] uppercase font-mono text-neutral-400">
                              <input 
                                type="checkbox" 
                                checked={courseIsTrending} 
                                onChange={(e) => setCourseIsTrending(e.target.checked)} 
                                className="rounded text-[#F5B300] focus:ring-0 cursor-pointer" 
                              />
                              <span>Trending Course</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {courseEditorActiveTab === "price" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9.5px] text-neutral-400 tracking-wider font-mono uppercase mb-1">Tuition Price (Sale Price) *</label>
                              <input 
                                type="number" 
                                required 
                                value={coursePrice} 
                                onChange={(e) => setCoursePrice(Number(e.target.value))} 
                                className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3.5 py-2.5 text-[11px] font-mono font-bold text-neutral-900 dark:text-white focus:outline-none" 
                              />
                            </div>
                            <div>
                              <label className="block text-[9.5px] text-neutral-400 tracking-wider font-mono uppercase mb-1">Original Price (Strikeout)</label>
                              <input 
                                type="number" 
                                value={courseOriginalPrice} 
                                onChange={(e) => setCourseOriginalPrice(Number(e.target.value))} 
                                className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3.5 py-2.5 text-[11px] font-mono font-bold text-neutral-900 dark:text-white focus:outline-none" 
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9.5px] text-neutral-400 tracking-wider font-mono uppercase mb-1">Discount % Override</label>
                              <input 
                                type="number" 
                                value={courseDiscountPercentage} 
                                onChange={(e) => setCourseDiscountPercentage(Number(e.target.value))} 
                                placeholder="Auto-calculated if 0"
                                className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3.5 py-2.5 text-[11px] text-neutral-900 dark:text-white focus:outline-none" 
                              />
                            </div>
                            <div>
                              <label className="block text-[9.5px] text-neutral-400 tracking-wider font-mono uppercase mb-1">Currency Code</label>
                              <input 
                                type="text" 
                                value={courseCurrency} 
                                onChange={(e) => setCourseCurrency(e.target.value)} 
                                placeholder="INR"
                                className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3.5 py-2.5 text-[11px] font-mono font-bold text-neutral-900 dark:text-white focus:outline-none" 
                              />
                            </div>
                          </div>
                          <label className="flex items-center gap-1.5 cursor-pointer text-[10px] uppercase font-mono text-neutral-400">
                            <input 
                              type="checkbox" 
                              checked={courseIsLimitedTimeOffer} 
                              onChange={(e) => setCourseIsLimitedTimeOffer(e.target.checked)} 
                              className="rounded text-[#F5B300] hover:text-yellow-600 focus:ring-0 cursor-pointer" 
                            />
                            <span>Limited Time Offer (Triggers urgency banner highlights)</span>
                          </label>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            <div>
                              <label className="block text-[9.5px] text-neutral-400 tracking-wider font-mono uppercase mb-1">Benefits Bullet list (One per line)</label>
                              <textarea 
                                rows={5} 
                                value={courseBenefits.join("\n")} 
                                onChange={(e) => setCourseBenefits(e.target.value.split("\n"))} 
                                placeholder="e.g. Immediate Telegram support access&#10;Instant PDF guide download&#10;Lifetime active configuration updates" 
                                className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3 py-2 text-[11px] text-neutral-900 dark:text-white font-sans focus:outline-none" 
                              />
                            </div>
                            <div>
                              <label className="block text-[9.5px] text-neutral-400 tracking-wider font-mono uppercase mb-1">Learning Outcomes List (One per line)</label>
                              <textarea 
                                rows={5} 
                                value={courseLearningOutcomes.join("\n")} 
                                onChange={(e) => setCourseLearningOutcomes(e.target.value.split("\n"))} 
                                placeholder="e.g. Setup strong local server architecture&#10;Execute over-the-shoulder configs&#10;Deploy projects in seconds" 
                                className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3 py-2 text-[11px] text-neutral-900 dark:text-white font-sans focus:outline-none" 
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {courseEditorActiveTab === "media" && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[9.5px] text-neutral-400 tracking-wider font-mono uppercase mb-1">Cover Thumbnail *</label>
                            <div className="flex gap-4 items-center">
                              <div className="w-14 h-14 rounded-lg bg-neutral-950 border border-neutral-800 shrink-0 overflow-hidden flex items-center justify-center">
                                {courseThumbnail ? (
                                  <img src={courseThumbnail} className="w-full h-full object-cover" />
                                ) : (
                                  <BookOpen className="w-5 h-5 text-neutral-600" />
                                )}
                              </div>
                              <div className="flex-grow relative bg-neutral-100 dark:bg-black p-3.5 border border-dashed border-neutral-200 dark:border-brand-border rounded-xl">
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={handleCourseImageUpload} 
                                  disabled={uploadProgress} 
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                                />
                                <div className="text-center text-[10.5px] font-semibold text-neutral-500 flex items-center justify-center gap-1.5">
                                  {uploadProgress ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#F5B300]"></div>
                                      <span>Uploadingcover... {courseUploadPercent !== null ? `${courseUploadPercent}%` : ""}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-4 h-4 text-neutral-400" />
                                      <span>Click or drag image file here</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <input 
                              type="text" 
                              placeholder="Or paste direct unsplash / web image URL..." 
                              value={courseThumbnail} 
                              onChange={(e) => setCourseThumbnail(e.target.value)} 
                              className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-lg px-3 py-1.5 text-[10px] text-neutral-500 mt-2 focus:outline-none" 
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9.5px] text-neutral-400 tracking-wider font-mono uppercase mb-1">Hero Banner Image URL</label>
                              <input 
                                type="text" 
                                value={courseBannerImage} 
                                onChange={(e) => setCourseBannerImage(e.target.value)} 
                                placeholder="Direct image path URL"
                                className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3 py-2 text-[11px] focus:outline-none" 
                              />
                            </div>
                            <div>
                              <label className="block text-[9.5px] text-neutral-400 tracking-wider font-mono uppercase mb-1">Instructor Face Photo URL</label>
                              <input 
                                type="text" 
                                value={courseInstructorImage} 
                                onChange={(e) => setCourseInstructorImage(e.target.value)} 
                                placeholder="Direct face photo path URL"
                                className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3 py-2 text-[11px] focus:outline-none" 
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9.5px] text-neutral-400 tracking-wider font-mono uppercase mb-1">Preview Video / Promo Clip URL</label>
                              <input 
                                type="text" 
                                value={coursePreviewVideoUrl} 
                                onChange={(e) => setCoursePreviewVideoUrl(e.target.value)} 
                                placeholder="e.g. YouTube or Vimeo stream link"
                                className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3 py-2 text-[11px] focus:outline-none" 
                              />
                            </div>
                            <div>
                              <label className="block text-[9.5px] text-neutral-400 tracking-wider font-mono uppercase mb-1">Direct Secure Deliveries Link</label>
                              <input 
                                type="text" 
                                value={courseDeliverableLink} 
                                onChange={(e) => setCourseDeliverableLink(e.target.value)} 
                                placeholder="Unlocks post-purchase (e.g. Google drive)"
                                className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3 py-2 text-[11px] focus:outline-none" 
                              />
                            </div>
                          </div>

                          <div className="border border-neutral-200 dark:border-neutral-850 p-3.5 rounded-2xl bg-neutral-50/50 dark:bg-black/30 space-y-2.5 text-left">
                            <h4 className="text-[10px] font-mono text-brand-gold uppercase tracking-wider">🔒 Secure Student Post-Checkout Delivery Vault</h4>
                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[9px] text-neutral-450 uppercase mb-1">Telegram Group Link</label>
                                <input 
                                  type="text" 
                                  value={courseTelegramLink} 
                                  onChange={(e) => setCourseTelegramLink(e.target.value)} 
                                  placeholder="https://t.me/..."
                                  className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-lg px-2.5 py-1.5 text-[10.5px] focus:outline-none" 
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-neutral-450 uppercase mb-1">Direct Google Drive / Folder Link</label>
                                <input 
                                  type="text" 
                                  value={courseGoogleDriveLink} 
                                  onChange={(e) => setCourseGoogleDriveLink(e.target.value)} 
                                  placeholder="https://drive.google.com/..."
                                  className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-lg px-2.5 py-1.5 text-[10.5px] focus:outline-none" 
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {courseEditorActiveTab === "details" && (
                        <div className="space-y-4 text-left">
                          <div>
                            <label className="block text-[9.5px] text-neutral-400 tracking-wider font-mono uppercase mb-1">Syllabus Pitch & Long Description *</label>
                            <textarea 
                              rows={5} 
                              required 
                              value={courseDescription} 
                              onChange={(e) => setCourseDescription(e.target.value)} 
                              placeholder="Detailed paragraph context describing scope, curriculum, and course files..."
                              className="w-full bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-brand-border rounded-xl px-3.5 py-2.5 text-[11px] text-neutral-900 dark:text-white leading-relaxed focus:outline-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-[9.5px] text-neutral-400 tracking-wider font-mono uppercase mb-1">Deep Overview Section (Supports Markdown Headings & Bullet Lists)</label>
                            <textarea 
                              rows={5} 
                              value={courseOverview} 
                              onChange={(e) => setCourseOverview(e.target.value)} 
                              placeholder="e.g. ## What you get inside the bundle:&#10;- 34+ High quality configuration blueprint blueprints&#10;- 10+ Hours video tracing"
                              className="w-full bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-brand-border rounded-xl px-3.5 py-2.5 text-[11px] text-neutral-900 dark:text-white leading-relaxed font-sans focus:outline-none" 
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[9px] text-neutral-450 font-mono uppercase mb-1">Duration text</label>
                              <input 
                                type="text" 
                                value={courseDuration} 
                                onChange={(e) => setCourseDuration(e.target.value)} 
                                placeholder="10+ Hours" 
                                className="w-full bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-brand-border rounded-lg px-2.5 py-1.5 text-[10.5px] focus:outline-none" 
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-neutral-450 font-mono uppercase mb-1">Lessons total</label>
                              <input 
                                type="number" 
                                value={courseNumberOfLessons} 
                                onChange={(e) => setCourseNumberOfLessons(Number(e.target.value))} 
                                className="w-full bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-brand-border rounded-lg px-2.5 py-1.5 text-[10.5px] focus:outline-none" 
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-neutral-450 font-mono uppercase mb-1">Modules total</label>
                              <input 
                                type="number" 
                                value={courseNumberOfModules} 
                                onChange={(e) => setCourseNumberOfModules(Number(e.target.value))} 
                                className="w-full bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-brand-border rounded-lg px-2.5 py-1.5 text-[10.5px] focus:outline-none" 
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-left">
                            <div>
                              <label className="block text-[9px] text-neutral-450 font-mono uppercase mb-1">Classroom Language</label>
                              <input 
                                type="text" 
                                value={courseLanguage} 
                                onChange={(e) => setCourseLanguage(e.target.value)} 
                                placeholder="Bilingual / English" 
                                className="w-full bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-brand-border rounded-lg px-2.5 py-1.5 text-[10.5px] focus:outline-none" 
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-neutral-450 font-mono uppercase mb-1">Student Skill Level</label>
                              <input 
                                type="text" 
                                value={courseSkillLevel} 
                                onChange={(e) => setCourseSkillLevel(e.target.value)} 
                                placeholder="All Professional Levels" 
                                className="w-full bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-brand-border rounded-lg px-2.5 py-1.5 text-[10.5px] focus:outline-none" 
                              />
                            </div>
                          </div>

                          <div className="text-left">
                            <label className="block text-[9.5px] text-neutral-450 dark:text-neutral-400 tracking-wider font-mono uppercase mb-1">Prerequisite specifications</label>
                            <input 
                              type="text" 
                              value={coursePrerequisites} 
                              onChange={(e) => setCoursePrerequisites(e.target.value)} 
                              placeholder="No certs needed. Basic internet familiarity."
                              className="w-full bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-brand-border rounded-xl px-3 py-2 text-[11px] focus:outline-none" 
                            />
                          </div>

                          <div className="flex flex-wrap gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-900 text-left">
                            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] uppercase font-mono text-neutral-400">
                              <input 
                                type="checkbox" 
                                checked={courseCertificateAvailable} 
                                onChange={(e) => setCourseCertificateAvailable(e.target.checked)} 
                                className="rounded" 
                              />
                              <span>Includes Completion Certificate</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] uppercase font-mono text-neutral-400">
                              <input 
                                type="checkbox" 
                                checked={courseLifetimeAccess} 
                                onChange={(e) => setCourseLifetimeAccess(e.target.checked)} 
                                className="rounded" 
                              />
                              <span>Provides Lifetime Access status</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] uppercase font-mono text-neutral-400">
                              <input 
                                type="checkbox" 
                                checked={courseMobileAccess} 
                                onChange={(e) => setCourseMobileAccess(e.target.checked)} 
                                className="rounded" 
                              />
                              <span>Optimized for Smartphone & Tablet viewports</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {courseEditorActiveTab === "curriculum" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-850 pb-2">
                            <h4 className="text-[10px] font-mono text-brand-gold uppercase tracking-wider">Dynamic Syllabus Curriculum Modules</h4>
                            <button
                              type="button"
                              onClick={() => {
                                const newModId = "mod_" + Date.now();
                                setCourseModules(prev => [...prev, { id: newModId, title: `Module ${prev.length + 1}: Foundations`, lessons: [] }]);
                              }}
                              className="px-3 py-1.5 text-[9px] font-bold font-mono bg-[#F5B300] hover:bg-yellow-500 text-black rounded-lg transition"
                            >
                              + Add Module Segment
                            </button>
                          </div>

                          {courseModules.length === 0 ? (
                            <div className="text-center py-8 text-neutral-500 text-[11px] font-mono border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/20 dark:bg-black/10">
                              No segments created yet. Starter defaults will load as a fallback on page.
                            </div>
                          ) : (
                            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                              {courseModules.map((mod, modIdx) => (
                                <div key={mod.id || modIdx} className="border border-neutral-200 dark:border-neutral-850 rounded-2xl p-4 bg-neutral-50/50 dark:bg-black/20 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-brand-gold/10 text-brand-gold border border-brand-gold/20 w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold shrink-0">M{modIdx + 1}</span>
                                    <input
                                      type="text"
                                      value={mod.title}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setCourseModules(prev => prev.map((m, idx) => idx === modIdx ? { ...m, title: val } : m));
                                      }}
                                      placeholder="Module Heading Title"
                                      className="flex-grow bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-brand-border text-[11px] font-bold rounded px-2.5 py-1.5 focus:ring-1 focus:ring-brand-gold focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCourseModules(prev => prev.filter((_, idx) => idx !== modIdx));
                                      }}
                                      className="text-red-500 hover:text-red-400 text-[11px] font-bold px-1.5 py-1"
                                    >
                                      ✕
                                    </button>
                                  </div>

                                  {/* Lessons Substructure */}
                                  <div className="pl-4 border-l-2 border-brand-gold/15 space-y-2 text-left">
                                    <div className="flex justify-between items-center pb-1">
                                      <span className="text-[9.5px] font-mono text-neutral-450 uppercase">Classes / Lessons in Module ({(mod.lessons || []).length})</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const lId = "les_" + Date.now();
                                          const currentLessons = mod.lessons || [];
                                          const updatedMod = {
                                            ...mod,
                                            lessons: [...currentLessons, { id: lId, title: "Class Title Name", duration: "10 mins", type: "Video", description: "" }]
                                          };
                                          setCourseModules(prev => prev.map((m, idx) => idx === modIdx ? updatedMod : m));
                                        }}
                                        className="text-brand-gold text-[9px] font-bold font-mono uppercase bg-brand-gold/10 hover:bg-brand-gold/20 px-2 py-0.5 rounded border border-brand-gold/15 cursor-pointer"
                                      >
                                        + Lesson
                                      </button>
                                    </div>

                                    {(mod.lessons || []).map((lesObj: any, lesIdx: number) => (
                                      <div key={lesObj.id || lesIdx} className="bg-white dark:bg-black/40 border border-neutral-200 dark:border-neutral-850 p-2.5 rounded-xl space-y-2">
                                        <div className="grid grid-cols-12 gap-2">
                                          <input
                                            type="text"
                                            value={lesObj.title}
                                            onChange={(e) => {
                                              const updatedLessons = [...mod.lessons];
                                              updatedLessons[lesIdx] = { ...updatedLessons[lesIdx], title: e.target.value };
                                              setCourseModules(prev => prev.map((m, idx) => idx === modIdx ? { ...m, lessons: updatedLessons } : m));
                                            }}
                                            placeholder="Lesson Heading"
                                            className="col-span-6 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 text-[10px] rounded px-2 py-1 focus:outline-none"
                                          />
                                          <input
                                            type="text"
                                            value={lesObj.duration}
                                            onChange={(e) => {
                                              const updatedLessons = [...mod.lessons];
                                              updatedLessons[lesIdx] = { ...updatedLessons[lesIdx], duration: e.target.value };
                                              setCourseModules(prev => prev.map((m, idx) => idx === modIdx ? { ...m, lessons: updatedLessons } : m));
                                            }}
                                            placeholder="12 mins"
                                            className="col-span-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 text-[10px] rounded px-1 text-center focus:outline-none"
                                          />
                                          <select
                                            value={lesObj.type}
                                            onChange={(e) => {
                                              const updatedLessons = [...mod.lessons];
                                              updatedLessons[lesIdx] = { ...updatedLessons[lesIdx], type: e.target.value };
                                              setCourseModules(prev => prev.map((m, idx) => idx === modIdx ? { ...m, lessons: updatedLessons } : m));
                                            }}
                                            className="col-span-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 text-[9px] rounded"
                                          >
                                            <option value="Video">Video</option>
                                            <option value="PDF">PDF</option>
                                            <option value="Quiz">Quiz</option>
                                            <option value="Assignment">Assignment</option>
                                          </select>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedLessons = mod.lessons.filter((_: any, lI: number) => lI !== lesIdx);
                                              setCourseModules(prev => prev.map((m, idx) => idx === modIdx ? { ...m, lessons: updatedLessons } : m));
                                            }}
                                            className="col-span-1 text-red-500 font-bold text-[9px] pt-1"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                        <input
                                          type="text"
                                          value={lesObj.description || ""}
                                          onChange={(e) => {
                                            const updatedLessons = [...mod.lessons];
                                            updatedLessons[lesIdx] = { ...updatedLessons[lesIdx], description: e.target.value };
                                            setCourseModules(prev => prev.map((m, idx) => idx === modIdx ? { ...m, lessons: updatedLessons } : m));
                                          }}
                                          placeholder="A brief description of this lesson..."
                                          className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 text-[10px] rounded px-2 py-1 focus:outline-none"
                                        />
                                      </div>
                                    ))}
                                  </div>

                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {courseEditorActiveTab === "faqs" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-[#0c0c0c] pb-2">
                            <h4 className="text-[10px] font-mono text-brand-gold uppercase tracking-wider">Dynamic Landing Page FAQs</h4>
                            <button
                              type="button"
                              onClick={() => {
                                setCourseFaqItems(prev => [...prev, { question: "Write Question Here", answer: "Write Answer description details." }]);
                              }}
                              className="px-3 py-1.5 text-[9px] font-bold font-mono bg-[#F5B300] hover:bg-yellow-500 text-black rounded-lg transition"
                            >
                              + Add Question Block
                            </button>
                          </div>

                          {courseFaqItems.length === 0 ? (
                            <div className="text-center py-8 text-neutral-500 text-[11px] font-mono border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/20 dark:bg-black/10">
                              No custom FAQs specified here. Standard fallbacks will display on the live page.
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                              {courseFaqItems.map((item, idx) => (
                                <div key={idx} className="border border-neutral-200 dark:border-neutral-850 rounded-2xl p-4 bg-neutral-50/50 dark:bg-black/20 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={item.question}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setCourseFaqItems(prev => prev.map((itemObj, iIdx) => iIdx === idx ? { ...itemObj, question: val } : itemObj));
                                      }}
                                      placeholder="Frequently Asked Question"
                                      className="flex-grow bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-brand-border text-[11px] font-bold rounded px-2.5 py-1.5 focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCourseFaqItems(prev => prev.filter((_, iIdx) => iIdx !== idx));
                                      }}
                                      className="text-red-500 hover:text-red-400 text-[11px] font-bold px-1.5 py-1"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <textarea
                                    rows={3}
                                    value={item.answer}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setCourseFaqItems(prev => prev.map((itemObj, iIdx) => iIdx === idx ? { ...itemObj, answer: val } : itemObj));
                                    }}
                                    placeholder="Detailed Response Answer details"
                                    className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-brand-border text-[11px] font-sans rounded px-2.5 py-1.5 resize-none focus:outline-none"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {courseEditorActiveTab === "seo" && (
                        <div className="space-y-4 text-left">
                          <div>
                            <label className="block text-[9.5px] text-neutral-450 dark:text-neutral-400 tracking-wider font-mono uppercase mb-1">SEO Page Meta Title Tag</label>
                            <input 
                              type="text" 
                              value={courseSeoTitle} 
                              onChange={(e) => setCourseSeoTitle(e.target.value)} 
                              placeholder="SEO Title tag (e.g. Master Time Management | Blueprint)" 
                              className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3.5 py-2.5 text-[11px] text-neutral-900 dark:text-white focus:outline-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-[9.5px] text-neutral-450 dark:text-neutral-400 tracking-wider font-mono uppercase mb-1">SEO Meta Description Tag</label>
                            <textarea 
                              rows={3} 
                              value={courseSeoDescription} 
                              onChange={(e) => setCourseSeoDescription(e.target.value)} 
                              placeholder="SEO short snippet description displayed in Google Search result nodes..." 
                              className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3.5 py-2.5 text-[11px] text-neutral-900 dark:text-white focus:outline-none" 
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-left">
                            <div>
                              <label className="block text-[9.5px] text-neutral-450 dark:text-neutral-400 tracking-wider font-mono uppercase mb-1 font-mono">Focus Generative Keyword</label>
                              <input 
                                type="text" 
                                value={courseFocusKeyword} 
                                onChange={(e) => setCourseFocusKeyword(e.target.value)} 
                                placeholder="e.g. time management hacks" 
                                className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3.5 py-2.5 text-[11px] text-neutral-900 dark:text-white focus:outline-none" 
                              />
                            </div>
                            <div>
                              <label className="block text-[9.5px] text-neutral-450 dark:text-neutral-400 tracking-wider font-mono uppercase mb-1 font-mono">Canonical Domain Link</label>
                              <input 
                                type="text" 
                                value={courseCanonicalUrl} 
                                onChange={(e) => setCourseCanonicalUrl(e.target.value)} 
                                placeholder="https://edu-commerce.edu/course/your-slug" 
                                className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3.5 py-2.5 text-[11px] text-neutral-900 dark:text-white focus:outline-none" 
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9.5px] text-neutral-450 dark:text-neutral-400 tracking-wider font-mono uppercase mb-1 font-mono">Generative Engine JSON Schema Blueprint Override</label>
                            <textarea 
                              rows={4} 
                              value={courseSchemaDescription} 
                              onChange={(e) => setCourseSchemaDescription(e.target.value)} 
                              placeholder="Custom JSON-LD schema or product blueprint override..." 
                              className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3.5 py-2.5 text-[10px] font-mono leading-relaxed focus:outline-none" 
                            />
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Submission and error block */}
                    <div className="p-4 bg-neutral-50/50 dark:bg-black/30 border-t border-neutral-200 dark:border-neutral-900 space-y-3 shrink-0">
                      {modalError && (
                        <div className="p-2.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-sans">
                          {modalError}
                        </div>
                      )}

                      <div className="flex justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setShowCourseModal(false)}
                          className="bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-300 font-bold px-4 py-2 text-[11px] rounded-xl transition-colors font-sans cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={uploadProgress}
                          className="bg-[#F5B300] hover:bg-yellow-500 text-black font-black disabled:opacity-45 px-5 py-2 text-[11px] rounded-xl transition-all shadow-md flex items-center justify-center gap-1 font-sans cursor-pointer"
                        >
                          {uploadProgress ? "Processing catalog..." : editingCourse ? "Save Course profile" : "Launch Course program"}
                        </button>
                      </div>
                    </div>

                  </form>
                </div>

                {/* RIGHT COLUMN: REAL-TIME SECURE LANDING PAGE LIVE PREVIEW (HIDDEN ON SMALL SCREENS) */}
                <div className="hidden lg:block lg:w-1/2 overflow-y-auto bg-neutral-50 dark:bg-[#070707] relative p-4">
                  <div className="sticky top-0 z-10 bg-black/80 backdrop-blur border border-neutral-800 p-2.5 mb-4 text-center rounded-2xl flex items-center justify-between shadow-md animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      <span className="text-[10px] font-mono text-neutral-300">Live WYSIWYG Rendering Screen</span>
                    </div>
                    <span className="text-[9px] font-mono text-neutral-500 uppercase">Self-Updating Core Frame</span>
                  </div>
                  
                  {/* Embedded Reactive CourseLandingPage for Live WYSIWYG feedback loops! */}
                  <div className="border border-neutral-200 dark:border-neutral-850 rounded-3xl bg-white dark:bg-[#070707] min-h-[60vh] max-h-[75vh] overflow-y-auto relative shadow-inner">
                    <CourseLandingPage previewCourse={currentPreviewPayload} />
                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* TAB 12: AFFILIATE PROGRAM CRM (MASTER CRM PORTAL) (PART 5 - PART 10) */}
      {activeTab === "affiliates" && (() => {
        // Calculate admin-level metrics
        const approvedAffiliates = affiliateLists.filter(x => x.status === "approved");
        const pendingApps = affiliateLists.filter(x => x.status === "pending");
        const suspendedApps = affiliateLists.filter(x => x.status === "suspended");
        const rejectedApps = affiliateLists.filter(x => x.status === "rejected");
        const pendingPayouts = adminPayoutRequests.filter(x => x.status === "pending");
        const completedPayouts = adminPayoutRequests.filter(x => x.status === "Paid");

        const totalRevenueSales = approvedAffiliates.reduce((acc, curr) => acc + Number(curr.totalRevenue || 0), 0);
        const totalPendingPayoutsSum = pendingPayouts.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        const totalPaidPayoutsSum = completedPayouts.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

        // Filter lists based on search string
        const searchLower = affiliateSearchText.toLowerCase();
        const filterBySearch = (arr: any[]) => {
          if (!affiliateSearchText) return arr;
          return arr.filter(x => 
            String(x.fullName || "").toLowerCase().includes(searchLower) ||
            String(x.email || "").toLowerCase().includes(searchLower) ||
            String(x.couponCode || x.preferredCoupon || "").toLowerCase().includes(searchLower)
          );
        };

        const displayedPending = filterBySearch(pendingApps);
        const displayedApproved = filterBySearch(approvedAffiliates);
        const displayedPayouts = affiliateSearchText 
          ? adminPayoutRequests.filter(x => 
              String(x.affiliateName || "").toLowerCase().includes(searchLower) ||
              String(x.couponCode || "").toLowerCase().includes(searchLower)
            )
          : adminPayoutRequests;
        const displayedSuspendedRejected = filterBySearch([...suspendedApps, ...rejectedApps]);

        return (
          <div className="space-y-8 animate-in fade-in duration-200 text-left">
            {/* Header block with elegant description */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 dark:border-brand-border/40 pb-5">
              <div>
                <h3 className="font-display text-xl font-bold text-neutral-[#171717] dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-gold animate-pulse" /> Affiliate Program Administration CRM
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Approve pending creator applications, configure lifetime tracking promo coupons, manage payout settle requests, and audit real-time analytics.
                </p>
              </div>
              
              {/* Default Configuration panel */}
              <div className="bg-neutral-50 dark:bg-black/20 p-4 rounded-2xl border border-neutral-200 dark:border-brand-border flex items-center gap-4 self-start">
                <div className="space-y-1">
                  <span className="block text-[10px] uppercase font-mono text-neutral-450">Approved Coupon Discount</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={customDiscountRate}
                      onChange={(e) => setCustomDiscountRate(Math.max(0, Number(e.target.value)))}
                      className="w-16 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-brand-border text-center text-xs py-1 rounded-lg focus:outline-none"
                    />
                    <span className="text-xs text-neutral-500">%</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-neutral-200 dark:bg-brand-border"></div>
                <div className="space-y-1">
                  <span className="block text-[10px] uppercase font-mono text-neutral-450">Standard Commission Rate</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={customCommissionRate}
                      onChange={(e) => setCustomCommissionRate(Math.max(0, Number(e.target.value)))}
                      className="w-16 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-brand-border text-center text-xs py-1 rounded-lg focus:outline-none"
                    />
                    <span className="text-xs text-neutral-500">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Highlights Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1 */}
              <div className="bg-white dark:bg-[#111111] p-5 rounded-2xl border border-neutral-200 dark:border-brand-border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 border border-orange-500/15">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Total Active Affiliates</p>
                  <h4 className="text-xl font-bold font-display text-neutral-900 dark:text-white mt-0.5">{approvedAffiliates.length}</h4>
                </div>
              </div>

              {/* KPI 2 */}
              <div className="bg-white dark:bg-[#111111] p-5 rounded-2xl border border-neutral-200 dark:border-brand-border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 border border-green-500/15">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Direct Influencer Sales</p>
                  <h4 className="text-xl font-bold font-display text-neutral-[#171717] dark:text-white mt-0.5">₹{totalRevenueSales.toLocaleString()}</h4>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="bg-white dark:bg-[#111111] p-5 rounded-2xl border border-neutral-200 dark:border-brand-border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 text-brand-gold flex items-center justify-center shrink-0 border border-brand-gold/15">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Pending Cash Requests</p>
                  <h4 className="text-xl font-bold font-display text-neutral-[#171717] dark:text-white mt-0.5">₹{totalPendingPayoutsSum.toLocaleString()}</h4>
                </div>
              </div>

              {/* KPI 4 */}
              <div className="bg-white dark:bg-[#111111] p-5 rounded-2xl border border-neutral-200 dark:border-brand-border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 border border-purple-500/15">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Settled & Paid Payouts</p>
                  <h4 className="text-xl font-bold font-display text-neutral-[#171717] dark:text-white mt-0.5">₹{totalPaidPayoutsSum.toLocaleString()}</h4>
                </div>
              </div>
            </div>

            {/* Sub-tab Select Buttons Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-brand-border pb-2">
              <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
                {(["applications", "approved", "payouts", "suspended_rejected"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setAffiliateCrmSubTab(tab);
                      setAffiliateSearchText("");
                    }}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all shrink-0 ${
                      affiliateCrmSubTab === tab
                        ? "bg-[#F5B300]/10 text-brand-gold border-[#F5B300]/35 font-bold"
                        : "border-neutral-200 dark:border-brand-border hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    {tab === "applications" && `Pending Applications (${pendingApps.length})`}
                    {tab === "approved" && `Approved Partners (${approvedAffiliates.length})`}
                    {tab === "payouts" && `Withdrawal Settling (${pendingPayouts.length})`}
                    {tab === "suspended_rejected" && `Suspended & Rejections (${suspendedApps.length + rejectedApps.length})`}
                  </button>
                ))}
              </div>

              {/* Search bar inside crm */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search partner or coupon..."
                  value={affiliateSearchText}
                  onChange={(e) => setAffiliateSearchText(e.target.value)}
                  className="w-full text-xs bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl pl-9 pr-4 py-2 text-neutral-900 dark:text-white focus:outline-none focus:border-brand-gold"
                />
              </div>
            </div>

            {/* RENDER DYNAMIC LIST VIEWPORTS */}
            {loadingAffiliates || loadingPayoutRequests ? (
              <div className="py-12 text-center">
                <RefreshCw className="w-6 h-6 text-brand-gold animate-spin mx-auto mb-2" />
                <span className="text-[11px] text-neutral-500 font-mono">Loading data sync pools...</span>
              </div>
            ) : (
              <div>
                {/* SUB-TAB 1: PENDING APPLICATIONS */}
                {affiliateCrmSubTab === "applications" && (
                  <div className="space-y-4">
                    {displayedPending.length === 0 ? (
                      <div className="py-12 bg-neutral-50 dark:bg-[#111111] border border-dashed border-neutral-200 dark:border-brand-border rounded-2xl text-center">
                        <Users className="w-8 h-8 text-neutral-400 mx-auto mb-2.5 opacity-40" />
                        <p className="text-xs text-neutral-500">No pending affiliate applications waiting for review.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {displayedPending.map((app) => (
                          <div key={app.id} className="bg-white dark:bg-[#111111] p-5 rounded-3xl border border-neutral-200 dark:border-brand-border shadow-sm flex flex-col justify-between">
                            <div className="space-y-4 text-left">
                              {/* Identity header */}
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-bold text-neutral-950 dark:text-neutral-100 text-sm">{app.fullName}</h4>
                                  <span className="text-[10px] text-neutral-450 select-all font-mono">{app.email}</span>
                                </div>
                                <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-bold uppercase">Pending Audit</span>
                              </div>

                              {/* Demographic Details list */}
                              <div className="grid grid-cols-2 gap-2 text-[11px] bg-neutral-50 dark:bg-black/45 p-3 rounded-xl border border-neutral-100 dark:border-neutral-900/40">
                                <div>
                                  <span className="block text-[9px] text-neutral-450 uppercase font-mono">Mobile</span>
                                  <span className="font-semibold text-neutral-800 dark:text-neutral-300 font-mono">{app.mobile || "None"}</span>
                                </div>
                                <div>
                                  <span className="block text-[9px] text-neutral-450 uppercase font-mono">Preferred Coupon</span>
                                  <span className="font-extrabold text-[#F5B300] select-all font-mono block tracking-wide">{app.preferredCoupon}</span>
                                </div>
                                <div className="col-span-2 pt-1 border-t border-neutral-205 dark:border-neutral-900/30">
                                  <span className="block text-[9px] text-neutral-450 uppercase font-mono">Complete Location</span>
                                  <span className="text-neutral-700 dark:text-neutral-300 text-[10px]">
                                    {[app.address, app.city, app.state, app.country].filter(Boolean).join(", ")}
                                  </span>
                                </div>
                              </div>

                              {/* Promotional answer */}
                              <div className="space-y-1.5">
                                <span className="block text-[10px] text-neutral-450 font-mono uppercase">Promotional Strategy Overview:</span>
                                <p className="text-xs text-neutral-600 dark:text-neutral-350 leading-relaxed bg-neutral-50 dark:bg-black/30 p-3 rounded-xl border border-neutral-150 dark:border-neutral-900 select-text font-serif italic text-left">
                                  "{app.promoAnswer || "No strategy provided."}"
                                </p>
                              </div>

                              {/* Audit text notes input */}
                              <div className="space-y-1">
                                <label className="block text-[9px] uppercase font-mono text-neutral-450">Reviewer Audit Remarks (Sent to user):</label>
                                <textarea
                                  rows={2}
                                  value={auditorNotes}
                                  onChange={(e) => setAuditorNotes(e.target.value)}
                                  placeholder="Insert optional guidelines, coupon instructions or rejection reasons here..."
                                  className="w-full text-xs bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-[#333333] text-neutral-900 dark:text-white rounded-xl p-2.5 focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Controls buttons */}
                            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-neutral-100 dark:border-brand-border/40">
                              <button
                                onClick={() => handleRejectAffiliate(app)}
                                className="px-4 py-2 text-xs font-semibold bg-red-650/10 hover:bg-red-600/20 text-red-500 rounded-xl transition-all font-sans cursor-pointer"
                              >
                                Decline Application
                              </button>
                              <button
                                onClick={() => handleApproveAffiliate(app)}
                                className="px-4 py-2 text-xs font-bold bg-[#F5B300] hover:bg-[#F5B300]/90 text-black rounded-xl transition-all font-sans cursor-pointer shadow-md"
                              >
                                Approve & Set Coupon
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SUB-TAB 2: APPROVED PARTNERS */}
                    {affiliateCrmSubTab === "approved" && (
                      <div className="space-y-4">
                        {displayedApproved.length === 0 ? (
                          <div className="py-12 bg-neutral-50 dark:bg-[#111111] border border-dashed border-neutral-200 dark:border-brand-border rounded-2xl text-center">
                            <Users className="w-8 h-8 text-neutral-400 mx-auto mb-2.5 opacity-40" />
                            <p className="text-xs text-neutral-500">No active approved affiliates matched your search filters.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto bg-white dark:bg-[#111111] border border-neutral-200 dark:border-brand-border rounded-3xl shadow-sm">
                            <table className="w-full text-[11px] text-left border-collapse select-text">
                              <thead>
                                <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-brand-border text-neutral-450 text-[10px] uppercase font-mono">
                                  <th className="px-5 py-3">Partner Details</th>
                                  <th className="px-4 py-3">Coupon</th>
                                  <th className="px-4 py-3">Sales / Uses</th>
                                  <th className="px-4 py-3">Earnings Ledger</th>
                                  <th className="px-4 py-3">Payment Details</th>
                                  <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {displayedApproved.map((app) => (
                                  <tr key={app.id} className="border-b border-neutral-200 dark:border-[#262626] hover:bg-neutral-50 dark:hover:bg-neutral-900/30">
                                    <td className="px-5 py-3">
                                      <p className="font-bold text-neutral-900 dark:text-white">{app.fullName}</p>
                                      <p className="text-[10px] text-neutral-450 mt-0.5 select-all font-mono">{app.email}</p>
                                      <p className="text-[10px] text-neutral-400 mt-0.5">{app.mobile}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 font-extrabold select-all tracking-wider font-mono">
                                        {app.couponCode || app.preferredCoupon}
                                      </span>
                                      <div className="text-[9px] text-neutral-450 mt-1 uppercase font-mono">
                                        Comm: {app.commissionPercent || 15}% | Disc: {app.discountPercent || 10}%
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <p className="font-bold text-neutral-900 dark:text-neutral-100">₹{(app.totalRevenue || 0).toLocaleString()}</p>
                                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Used count: {app.timesUsed || 0}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex gap-2 text-[10px]">
                                        <div className="p-1 px-1.5 rounded bg-yellow-500/10 text-brand-gold">
                                          <span className="block font-mono font-bold text-[9px] uppercase">Pending</span>
                                          <span className="font-extrabold font-mono text-[11px]">₹{(app.pendingEarnings || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="p-1 px-1.5 rounded bg-purple-500/10 text-purple-400">
                                          <span className="block font-mono font-bold text-[9px] uppercase">Paid</span>
                                          <span className="font-bold font-mono text-[11px]">₹{(app.paidEarnings || 0).toLocaleString()}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <p className="font-semibold text-neutral-800 dark:text-neutral-250 font-mono truncate max-w-[150px]" title={app.paymentDetails || "Not configured"}>
                                        {app.paymentDetails || "Not configured yet"}
                                      </p>
                                      <p className="text-[9px] text-neutral-450 font-mono text-left">Method: Bank / UPI</p>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                      <button
                                        onClick={() => handleSuspendAffiliate(app)}
                                        className="px-3 py-1.5 text-[10px] font-bold bg-red-600/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all shadow-sm font-sans cursor-pointer border border-red-500/15"
                                      >
                                        Suspend & Block Coupon
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUB-TAB 3: PAYOUT STATUS & HISTORY */}
                    {affiliateCrmSubTab === "payouts" && (
                      <div className="space-y-4">
                        {displayedPayouts.length === 0 ? (
                          <div className="py-12 bg-neutral-50 dark:bg-[#111111] border border-dashed border-neutral-200 dark:border-brand-border rounded-2xl text-center">
                            <Coins className="w-8 h-8 text-neutral-400 mx-auto mb-2.5 opacity-40" />
                            <p className="text-xs text-neutral-500">No payout withdrawal requests found currently.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto bg-white dark:bg-[#111111] border border-neutral-200 dark:border-brand-border rounded-3xl shadow-sm">
                            <table className="w-full text-[11px] text-left border-collapse select-text">
                              <thead>
                                <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-brand-border text-neutral-450 text-[10px] uppercase font-mono">
                                  <th className="px-5 py-3">Request ID & Date</th>
                                  <th className="px-4 py-3">Affiliate Info</th>
                                  <th className="px-4 py-3">Amount Requested</th>
                                  <th className="px-4 py-3">Payment Destination</th>
                                  <th className="px-4 py-3">Status</th>
                                  <th className="px-5 py-3 text-right">Settlement Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {displayedPayouts.map((pay) => (
                                  <tr key={pay.id} className="border-b border-neutral-200 dark:border-[#262626] hover:bg-neutral-50 dark:hover:bg-neutral-900/30">
                                    <td className="px-5 py-3">
                                      <p className="font-bold text-neutral-950 dark:text-white font-mono select-all text-[10px]">{pay.id}</p>
                                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                                        {pay.requestDate?.seconds ? new Date(pay.requestDate.seconds * 1000).toLocaleString() : "Date Unknown"}
                                      </p>
                                    </td>
                                    <td className="px-4 py-3">
                                      <p className="font-bold text-neutral-900 dark:text-white">{pay.affiliateName}</p>
                                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5 uppercase tracking-wide">Promo Code: {pay.couponCode}</p>
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                                      <span className="text-brand-gold font-extrabold pr-0.5">₹</span>{Number(pay.amount).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-neutral-800 dark:text-neutral-250 select-all max-w-[200px]" title={pay.paymentDetails}>
                                      {pay.paymentDetails}
                                    </td>
                                    <td className="px-4 py-3">
                                      {pay.status === "Paid" ? (
                                        <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/25">PAID</span>
                                      ) : pay.status === "Rejected" ? (
                                        <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-red-500/15 text-red-400 font-bold border border-red-500/25">REJECTED</span>
                                      ) : (
                                        <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-yellow-500/15 text-brand-gold font-bold border border-yellow-500/25 animate-pulse">PENDING AUDIT</span>
                                      )}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                      {pay.status === "pending" && (
                                        <div className="flex gap-2 justify-end">
                                          <button
                                            onClick={() => handleRejectPayout(pay)}
                                            className="px-2.5 py-1 text-[10px] font-bold bg-red-655/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all font-sans cursor-pointer"
                                          >
                                            Reject
                                          </button>
                                          <button
                                            onClick={() => handleProcessPayout(pay)}
                                            className="px-3 py-1 text-[10px] font-bold bg-green-500 text-black font-semibold rounded-lg transition-all font-sans cursor-pointer shadow-md"
                                          >
                                            Settle Cash (Paid)
                                          </button>
                                        </div>
                                      )}
                                      {pay.status !== "pending" && (
                                        <span className="text-[10px] text-neutral-500 italic font-mono uppercase">Audited Settle</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUB-TAB 4: SUSPENDED & DECLINED */}
                    {affiliateCrmSubTab === "suspended_rejected" && (
                      <div className="space-y-4">
                        {displayedSuspendedRejected.length === 0 ? (
                          <div className="py-12 bg-neutral-50 dark:bg-[#111111] border border-dashed border-neutral-200 dark:border-brand-border rounded-2xl text-center">
                            <Users className="w-8 h-8 text-neutral-400 mx-auto mb-2.5 opacity-40" />
                            <p className="text-xs text-neutral-500">No suspended or declined affiliate profiles matched search.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto bg-white dark:bg-[#111111] border border-neutral-200 dark:border-brand-border rounded-3xl shadow-sm">
                            <table className="w-full text-[11px] text-left border-collapse select-text">
                              <thead>
                                <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-brand-border text-neutral-450 text-[10px] uppercase font-mono">
                                  <th className="px-5 py-3">Partner Details</th>
                                  <th className="px-4 py-3">Assigned / Preferred Coupon</th>
                                  <th className="px-4 py-3">Policy Audit Remarks</th>
                                  <th className="px-4 py-3">Historic Stats</th>
                                  <th className="px-4 py-3">Account Status</th>
                                  <th className="px-5 py-3 text-right">Re-Activation action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {displayedSuspendedRejected.map((app) => (
                                  <tr key={app.id} className="border-b border-neutral-200 dark:border-[#262626] hover:bg-neutral-50 dark:hover:bg-neutral-900/30">
                                    <td className="px-5 py-3">
                                      <p className="font-bold text-neutral-900 dark:text-white">{app.fullName}</p>
                                      <p className="text-[10px] text-neutral-450 mt-0.5 font-mono select-all">{app.email}</p>
                                      <p className="text-[10px] text-neutral-400 mt-0.5">{app.mobile}</p>
                                    </td>
                                    <td className="px-4 py-3 font-mono font-bold text-neutral-500">
                                      {app.couponCode || app.preferredCoupon || "None"}
                                    </td>
                                    <td className="px-4 py-3 max-w-[200px] leading-relaxed text-neutral-600 dark:text-neutral-400 font-sans italic text-left">
                                      "{app.notes || "No policy enforcement remark log."}"
                                    </td>
                                    <td className="px-4 py-3">
                                      <p className="font-bold text-neutral-900 dark:text-neutral-100 font-mono">₹{(app.totalRevenue || 0).toLocaleString()}</p>
                                      <p className="text-[9px] text-neutral-450 uppercase font-mono">Uses: {app.timesUsed || 0}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                      {app.status === "suspended" ? (
                                        <span className="px-2.5 py-0.5 text-[9px] font-mono rounded bg-red-500/10 text-red-500 border border-red-500/20 font-extrabold uppercase">SUSPENDED</span>
                                      ) : (
                                        <span className="px-2.5 py-0.5 text-[9px] font-mono rounded bg-neutral-400/15 text-neutral-450 border border-neutral-400/25 font-bold uppercase">DECLINED</span>
                                      )}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                      <button
                                        onClick={() => handleReactivateAffiliate(app)}
                                        className="px-3 py-1.5 text-[10px] font-bold bg-[#F5B300] hover:bg-yellow-500 text-black rounded-lg transition-all shadow-sm font-sans cursor-pointer whitespace-nowrap"
                                      >
                                        Re-Activate Account
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

      {/* CORE MODAL B: SCREENSHOT HIGH QUALITY LIGHTBOX VIEW */}
      {viewScreenshotUrl && (
        <div className="fixed inset-0 z-[60] overflow-hidden bg-black/95 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="relative w-full max-w-2xl text-center space-y-4 max-h-screen flex flex-col justify-between">
            <div className="flex justify-between items-center bg-neutral-900 px-4 py-2 rounded-xl text-xs font-mono text-neutral-300">
              <span className="text-[11px] truncate max-w-[200px] text-neutral-400">Proof ID: {viewScreenshotUrl.substring(0, 30)}...</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 3))}
                  className="p-1 hover:text-white transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.5))}
                  className="p-1 hover:text-white transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomScale(1)}
                  className="px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] hover:bg-neutral-700 hover:text-white transition-colors"
                  title="Reset Zoom"
                >
                  Reset
                </button>
                <button
                  onClick={() => downloadScreenshot(viewScreenshotUrl)}
                  className="p-1 hover:text-white transition-colors"
                  title="Download Image"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setViewScreenshotUrl(null);
                setZoomScale(1);
              }}
              className="absolute top-[-50px] right-2 font-mono text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 focus:outline-none"
            >
              <X className="w-5 h-5" /> <span>Close overlay</span>
            </button>
            
            <div className="flex-grow flex items-center justify-center overflow-auto max-h-[70vh] rounded-3xl bg-neutral-950 p-2.5">
              <div className="transition-transform duration-200 ease-out" style={{ transform: `scale(${zoomScale})` }}>
                <img 
                  src={viewScreenshotUrl} 
                  alt="UPI check reference proof" 
                  className="max-h-[65vh] rounded-2xl object-contain shadow-2xl" 
                  referrerPolicy="no-referrer"
                  onError={(e)=>{
                    // Fallback in case of CORS or storage deletion issues
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800";
                  }}
                />
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 italic font-mono">
              Scale factor: {Math.round(zoomScale * 100)}% | Click Close to exit.
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Custom Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="relative w-full max-w-md bg-white dark:bg-[#121212] rounded-3xl border border-neutral-200 dark:border-brand-border p-6 shadow-2xl animate-in zoom-in duration-200 text-center space-y-6">
            
            {/* Warning or danger icon */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
              confirmModal.isDanger 
                ? "bg-red-500/10 text-red-500 border border-red-500/20 animate-bounce" 
                : "bg-brand-gold/10 text-brand-gold border border-brand-gold/20"
            }`}>
              {confirmModal.isDanger ? (
                <AlertCircle className="w-8 h-8" />
              ) : (
                <Clock className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-base font-bold text-neutral-900 dark:text-white">
                {confirmModal.title}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed px-2">
                {confirmModal.message}
              </p>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="bg-neutral-200 dark:bg-[#1c1c1c] hover:bg-neutral-300 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-300 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors font-sans w-28"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await confirmModal.onConfirm();
                  } catch (e) {
                    console.error("Confirmation execution failed:", e);
                  }
                }}
                className={`text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md w-36 ${
                  confirmModal.isDanger 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-[#F5B300] text-black hover:bg-[#F5B300]/90 bg-gold font-bold"
                }`}
              >
                {confirmModal.confirmLabel || "Confirm"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Toast HUD Overlay */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#121212] border border-[#F5B300]/30 rounded-2xl px-5 py-3.5 shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
          <span className="font-sans font-medium text-xs text-white tracking-wide">{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
