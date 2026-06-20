import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Course, Order } from "../types";
import { motion } from "motion/react";
import { 
  CheckCircle, 
  ExternalLink, 
  Send, 
  Mail, 
  Video, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  BookOpen, 
  FileText, 
  User, 
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

export const ThankYou: React.FC = () => {
  const { globalSettings, setCurrentPage, user } = useApp();
  const [order, setOrder] = useState<Order | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper: Try to extract Order ID from URL Hash e.g. #thank-you/ORDER_ID
  const getOrderIdFromHash = () => {
    const hash = window.location.hash.replace("#", "");
    if (hash.startsWith("thank-you/")) {
      return hash.replace("thank-you/", "");
    }
    if (hash.startsWith("order-success/")) {
      return hash.replace("order-success/", "");
    }
    return "";
  };

  const orderId = getOrderIdFromHash();

  useEffect(() => {
    const fetchOrderAndCourse = async () => {
      if (!orderId) {
        setError("Missing order context reference. Please verify your transaction session parameters.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // 1. Fetch Order Document from Firestore
        const orderDocRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderDocRef);

        if (!orderSnap.exists()) {
          // Fallback check: try fetching from demo orders in local storage
          const storedOrdersRaw = localStorage.getItem("demo_orders");
          let demoOrder: Order | null = null;
          if (storedOrdersRaw) {
            try {
              const demoOrders: Order[] = JSON.parse(storedOrdersRaw);
              demoOrder = demoOrders.find(o => o.id === orderId) || null;
            } catch (_) {}
          }

          if (demoOrder) {
            setOrder(demoOrder);
            await fetchCourseDetails(demoOrder.courseId);
          } else {
            setError(`Could not locate order #${orderId} in centralized ledger. If this was a manual payment, your dashboard will update as soon as the administrator registers your receipt.`);
          }
        } else {
          const orderData = orderSnap.data() as Order;
          setOrder(orderData);
          await fetchCourseDetails(orderData.courseId);
        }
      } catch (err: any) {
        console.error("Error fetching order context in Thank You:", err);
        setError("Failed to fetch order document matching session parameters.");
      } finally {
        setLoading(false);
      }
    };

    const fetchCourseDetails = async (courseId: string) => {
      try {
        // Search in Firestore
        const courseDocRef = doc(db, "courses", courseId);
        const courseSnap = await getDoc(courseDocRef);

        if (courseSnap.exists()) {
          setCourse({ id: courseSnap.id, ...courseSnap.data() } as Course);
        } else {
          // Fallback to local storage courses
          const storedCoursesRaw = localStorage.getItem("demo_courses");
          if (storedCoursesRaw) {
            try {
              const demoCourses: Course[] = JSON.parse(storedCoursesRaw);
              const found = demoCourses.find(c => c.id === courseId || c.slug === courseId) || null;
              if (found) {
                setCourse(found);
                return;
              }
            } catch (_) {}
          }
          console.warn("Course reference document not found for ID:", courseId);
        }
      } catch (err) {
        console.error("Error loading course context:", err);
      }
    };

    fetchOrderAndCourse();
  }, [orderId]);

  // Dynamic Video URL Parsing utility helper
  const getEmbedUrl = (url: string | undefined | null) => {
    if (!url) return null;

    try {
      // YouTube Embed URL Parser
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let videoId = "";
        if (url.includes("youtube.com/watch")) {
          const urlParams = new URL(url).searchParams;
          videoId = urlParams.get("v") || "";
        } else if (url.includes("youtu.be/")) {
          videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
        } else if (url.includes("youtube.com/embed/")) {
          return url;
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : null;
      }

      // Vimeo Embed URL Parser
      if (url.includes("vimeo.com")) {
        const reg = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/;
        const match = url.match(reg);
        if (match && match[3]) {
          return `https://player.vimeo.com/video/${match[3]}?h=0&badge=0&autopause=0&player_id=0&app_id=58479`;
        }
        if (url.includes("player.vimeo.com/video/")) {
          return url;
        }
      }

      // Loom Embed URL Parser
      if (url.includes("loom.com/share")) {
        const videoId = url.split("loom.com/share/")[1]?.split("?")[0] || "";
        return videoId ? `https://www.loom.com/embed/${videoId}?autoplay=0` : null;
      }

      // Google Drive Embed URL Parser
      if (url.includes("drive.google.com")) {
        if (url.includes("/view")) {
          return url.replace("/view", "/preview");
        }
        return url;
      }
    } catch (_) {}

    return null;
  };

  const videoEmbedUrl = course ? getEmbedUrl(course.welcomeVideoUrl) : null;
  const deliveryStatus = order?.status || "Pending";

  // Verification Roadmap stages calculation
  const isVerifiedOrDelivered = deliveryStatus === "Verified" || deliveryStatus === "Delivered";
  const isDelivered = deliveryStatus === "Delivered";

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center p-6 text-white font-sans animate-in fade-in duration-300">
        <div className="space-y-4 text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-t-2 border-[#F5B300] border-r-2 border-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full border-b-2 border-neutral-850 border-l-2 border-transparent" />
          </div>
          <p className="text-xs uppercase tracking-widest text-[#F5B300] font-mono font-medium animate-pulse">Syncing transaction ledger...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center p-6 text-white font-sans animate-in fade-in duration-300">
        <div className="max-w-md w-full bg-[#0d0d0d] border border-neutral-900 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#F5B300]/5 blur-3xl rounded-full" />
          
          <div className="w-14 h-14 bg-red-500/10 text-red-500 border border-red-500/15 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-xl font-extrabold tracking-tight">Access Verification Pending</h2>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans">
              {error || "We could not fetch the details for this order reference."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => setCurrentPage("courses")}
              className="flex-1 bg-[#F5B300] hover:bg-[#F5B300]/95 text-black font-display font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition duration-200"
            >
              Browse Products
            </button>
            <button
              onClick={() => setCurrentPage("my-enrollments")}
              className="flex-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white font-display font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition duration-200"
            >
              My Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="thank-you-view" className="min-h-screen bg-[#050505] text-white py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased relative selection:bg-[#F5B300]/20 select-none overflow-x-hidden">
      
      {/* Background Ambience Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(#F5B300_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="max-w-5xl mx-auto space-y-10 relative">
        
        {/* Section 1: Dynamic Hero Header (Minimalist & Polished) */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
            className="w-16 h-16 bg-[#F5B300]/10 border border-[#F5B300]/25 text-[#F5B300] rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,179,0,0.15)]"
          >
            <CheckCircle className="w-8 h-8" />
          </motion.div>

          <div className="space-y-2">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#F5B300] font-mono font-bold font-display animate-pulse">
              Automated Checkbox Verified
            </p>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {course?.thankYouHeading ? (
                <span>{course.thankYouHeading}</span>
              ) : (
                <>Welcome to <span className="text-[#F5B300]">{order.courseName || "Your Course"}</span></>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-450 font-sans max-w-xl mx-auto leading-relaxed">
              {course?.thankYouMessage ? (
                <span>{course.thankYouMessage}</span>
              ) : (
                "Your enrollment has been verified and processed successfully. Your curriculum content, downloads, and workspace keys are immediately unlocked below."
              )}
            </p>
          </div>
        </div>

        {/* Section 5: Real-time Next Steps Verification Timeline (Visual Checklists) */}
        <div className="bg-[#0b0b0b] border border-neutral-900 rounded-3xl p-6 sm:p-8 space-y-6">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#F5B300]" />
            <span>Enrollment Fullfillment Timeline</span>
          </h3>

          {/* Interactive Responsive Timeline Line */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
            
            {/* Horizontal connection line for desktop */}
            <div className="hidden md:block absolute top-[18px] left-[5%] right-[5%] h-0.5 bg-neutral-850 z-0">
              <div 
                className="h-full bg-gradient-to-r from-[#F5B300] to-emerald-500 transition-all duration-500"
                style={{ 
                  width: isDelivered ? "100%" : isVerifiedOrDelivered ? "75%" : "35%" 
                }}
              />
            </div>

            {/* Step 1: Payment Submitted */}
            <div className="relative flex md:flex-col items-start md:items-center text-left md:text-center space-x-4 md:space-x-0 md:space-y-3 z-10">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F5B300]/20 border border-[#F5B300] text-[#F5B300] font-mono text-xs font-bold shrink-0">
                ✓
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Payment Submitted</h4>
                <p className="text-[10px] text-neutral-400 leading-relaxed max-w-[150px] mx-auto">Gateway validation successfully completed.</p>
              </div>
            </div>

            {/* Step 2: Order Recorded */}
            <div className="relative flex md:flex-col items-start md:items-center text-left md:text-center space-x-4 md:space-x-0 md:space-y-3 z-10">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F5B300]/20 border border-[#F5B300] text-[#F5B300] font-mono text-xs font-bold shrink-0">
                ✓
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Order Recorded</h4>
                <p className="text-[10px] text-neutral-400 leading-relaxed max-w-[150px] mx-auto">Secure transaction logged inside CRM ledger.</p>
              </div>
            </div>

            {/* Step 3: Verification In Progress */}
            <div className="relative flex md:flex-col items-start md:items-center text-left md:text-center space-x-4 md:space-x-0 md:space-y-3 z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colours ${
                isVerifiedOrDelivered 
                  ? "bg-emerald-500/20 border border-emerald-500 text-emerald-500" 
                  : "bg-amber-500/10 border border-amber-500/30 text-amber-500 animate-pulse"
              }`}>
                {isVerifiedOrDelivered ? "✓" : "⏳"}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Verification</h4>
                <p className="text-[10px] text-neutral-400 leading-relaxed max-w-[150px] mx-auto">
                  {isVerifiedOrDelivered ? "Payment successfully verified." : "Auditing screenshot upload details."}
                </p>
              </div>
            </div>

            {/* Step 4: Access Delivery */}
            <div className="relative flex md:flex-col items-start md:items-center text-left md:text-center space-x-4 md:space-x-0 md:space-y-3 z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colours ${
                isDelivered 
                  ? "bg-emerald-500/20 border border-emerald-500 text-emerald-500" 
                  : isVerifiedOrDelivered 
                    ? "bg-amber-500/10 border border-amber-500/30 text-amber-500 animate-pulse"
                    : "bg-neutral-900 border border-neutral-800 text-neutral-550"
              }`}>
                {isDelivered ? "✓" : "⏳"}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Access Delivery</h4>
                <p className="text-[10px] text-neutral-400 leading-relaxed max-w-[150px] mx-auto">
                  {isDelivered ? "Course access provisioned." : "Provisioning course entries."}
                </p>
              </div>
            </div>

            {/* Step 5: Course Available */}
            <div className="relative flex md:flex-col items-start md:items-center text-left md:text-center space-x-4 md:space-x-0 md:space-y-3 z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colours ${
                isVerifiedOrDelivered 
                  ? "bg-emerald-500/20 border border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]" 
                  : "bg-neutral-900 border border-neutral-800 text-neutral-550"
              }`}>
                {isVerifiedOrDelivered ? "✓" : "⏳"}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">Course Available</h4>
                <p className="text-[10px] text-neutral-400 leading-relaxed max-w-[150px] mx-auto">Unveiled fully under enrollment tab.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Bento Grid: Welcome Video (Left) + Delivery/Direct Access (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Welcome Video Section (6 columns on desktop) */}
          <div className="lg:col-span-7 bg-[#0b0b0b] border border-neutral-900 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between hover:border-neutral-800 transition duration-300">
            <div className="space-y-2">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <Video className="w-4 h-4 text-[#F5B300]" />
                <span>Student Orientation Brief</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Please stream the exclusive welcome and orientation video below to get immediate insights guidelines.
              </p>
            </div>

            {videoEmbedUrl ? (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-neutral-850 shadow-2xl bg-black">
                <iframe
                  title="Course Welcome orientation Video"
                  src={videoEmbedUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex-grow flex flex-col justify-center items-center py-10 px-4 bg-neutral-950 border border-neutral-900/60 rounded-2xl space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#F5B300]/5 flex items-center justify-center border border-[#F5B300]/10">
                  <Sparkles className="w-5 h-5 text-[#F5B300]/60" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-widest font-mono">No Video Required</h4>
                  <p className="text-[11px] text-neutral-400 max-w-sm leading-relaxed">
                    This selection is high-touch manual checklist-verified. Welcome instructions are delivered purely via live guidelines below.
                  </p>
                </div>
              </div>
            )}
            
            {course?.title && (
              <div className="bg-neutral-950 border border-neutral-900/60 p-4 rounded-xl flex items-center gap-3">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt="" className="w-12 h-12 object-cover rounded-lg border border-neutral-800/80" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 bg-neutral-900 rounded-lg flex items-center justify-center border border-neutral-800">
                    <BookOpen className="w-5 h-5 text-neutral-500" />
                  </div>
                )}
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-mono text-neutral-500 font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-850">{course.category || "AI Course"}</span>
                  <p className="text-xs font-semibold text-white mt-1 truncate max-w-[200px] sm:max-w-xs">{course.title}</p>
                </div>
              </div>
            )}
          </div>

          {/* Delivery Instructions & Future-Proof Delivery Link (5 columns on desktop) */}
          <div className="lg:col-span-5 bg-[#0b0b0b] border border-[#F5B300]/10 hover:border-[#F5B300]/25 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between transition-all duration-300">
            
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Access & Delivery Instructions</span>
                </h3>
                <p className="text-xs text-neutral-400 font-sans">
                  Read and execute the delivery instruction set as specified for this program to complete onboarding:
                </p>
              </div>

              {/* Dynamic Delivery Instructions */}
              <div className="bg-neutral-950/80 border border-neutral-900/80 p-5 rounded-2xl text-xs text-neutral-300 space-y-3 leading-relaxed">
                {course?.deliveryInstructions ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-[#F5B300] font-mono text-[10px] uppercase tracking-wider">Dynamic Guidelines:</p>
                    <p className="font-sans text-neutral-300 leading-relaxed whitespace-pre-wrap">{course.deliveryInstructions}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 animate-pulse" />
                      <p>Your payment has been <strong>instantly verified</strong> in real-time via Razorpay.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <p>Full course access and deliverables are now unlocked. Browse your content inside the <strong>My Enrollments</strong> workspace tab.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <p>Credential keys and exclusive community access room links has been dispatched to <strong>{order.email}</strong>.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Future-Proof Delivery Button support deliveryUrl or deliverableLink */}
            <div className="space-y-3 pt-4 border-t border-neutral-900">
              
              {isVerifiedOrDelivered ? (
                <>
                  {(course?.deliveryUrl || course?.deliverableLink) ? (
                    <a
                      href={course?.deliveryUrl || course?.deliverableLink || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-500 hover:bg-emerald-500/90 text-white font-display font-bold py-3.5 px-4 rounded-xl text-xs sm:text-sm text-center flex items-center justify-center gap-2 transition duration-200 shadow-[0_4px_20px_rgba(16,185,129,0.2)]"
                    >
                      <span>Access Your Product</span>
                      <ExternalLink className="w-4 h-4 shrink-0" />
                    </a>
                  ) : (
                    <button
                      onClick={() => setCurrentPage("my-enrollments")}
                      className="w-full bg-[#F5B300] hover:bg-[#F5B300]/95 text-black font-display font-bold py-3.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition duration-200"
                    >
                      <span>Enter Curriculum Vault</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <div className="w-full bg-neutral-900 border border-neutral-850 text-neutral-400 py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 text-center">
                    <Clock className="w-4 h-4 shrink-0 text-amber-500 animate-spin" />
                    <span>Waiting for verification...</span>
                  </div>
                  <p className="text-[10px] text-neutral-500 text-center font-mono">
                    Direct delivery triggers immediately after administrator confirms UPI transaction credits.
                  </p>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Section 4: Digital Receipt / Invoice Details block */}
        <div className="bg-[#0b0b0b] border border-neutral-900 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-850 pb-4 gap-3">
            <div className="space-y-1">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#F5B300]" />
                <span>Digital Transaction Invoice</span>
              </h3>
              <p className="text-xs text-neutral-400">Order ID: #{orderId}</p>
            </div>
            <div className="bg-neutral-950 border border-neutral-900 px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] tracking-wider font-mono uppercase text-neutral-400">
              <Clock className="w-3.5 h-3.5 text-brand-gold animate-pulse" />
              <span>Status: <strong className={deliveryStatus === "Verified" || deliveryStatus === "Delivered" ? "text-emerald-500" : "text-amber-500"}>{deliveryStatus.toUpperCase()}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed font-sans mt-4">
            
            {/* Left Hand: Customer Details */}
            <div className="space-y-3 bg-neutral-950/40 p-5 rounded-2xl border border-neutral-900/60">
              <h4 className="font-display text-[10px] uppercase tracking-wider font-bold text-neutral-400 font-mono mb-2">Customer Profile</h4>
              
              <div className="flex justify-between items-center py-2 border-b border-neutral-900/40">
                <span className="text-neutral-500">Name:</span>
                <span className="font-semibold text-white">{order.name || "Student Profile"}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-neutral-900/40">
                <span className="text-neutral-500">Registered Email:</span>
                <span className="font-semibold text-white truncate max-w-[180px]">{order.email}</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-neutral-500">Telegram Namespace:</span>
                <span className="font-semibold text-[#F5B300]">{order.telegram || "Not Provided"}</span>
              </div>
            </div>

            {/* Right Hand: Pricing Summary Details */}
            <div className="space-y-3 bg-neutral-950/40 p-5 rounded-2xl border border-neutral-900/60 flex flex-col justify-between">
              <div>
                <h4 className="font-display text-[10px] uppercase tracking-wider font-bold text-neutral-400 font-mono mb-2">Financial Breakdown</h4>
                
                <div className="flex justify-between items-center py-2 border-b border-neutral-900/40">
                  <span className="text-neutral-500">Course Base Price:</span>
                  <span className="font-mono text-neutral-300 font-semibold">₹{(order.originalPrice || order.price || 0).toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-neutral-900/40">
                  <span className="text-neutral-500">Platform Discounts:</span>
                  <span className="font-mono text-emerald-500 font-semibold">- ₹{(order.discountApplied || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="flex justify-between items-center bg-[#F5B300]/5 border border-[#F5B300]/10 p-4 rounded-xl mt-4">
                <span className="text-[#F5B300] font-bold uppercase tracking-wider font-mono text-[10px]">Net Amount Paid</span>
                <span className="font-mono text-base font-extrabold text-neutral-100">₹{(order.price || order.amount || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Section 6: Centralized Support Buttons collection (Dynamic Links) */}
        <div className="bg-[#0b0b0b] border border-neutral-900 rounded-3xl p-6 sm:p-8 space-y-6 text-center">
          <div className="space-y-1.5">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-neutral-300">
              Need Verification Support?
            </h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
              If your payment verification takes longer than expected, message our live billing desks using these quick options.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            {/* Telegram Support Button */}
            <a
              href={globalSettings?.telegramSupportLink || "https://t.me/LearntoFutureSupport"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#1F93E4] hover:bg-[#1F93E4]/90 text-white font-display font-medium text-xs py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 transitionAll duration-200"
            >
              <Send className="w-4 h-4" />
              <span>Contact Telegram Support</span>
            </a>

            {/* Email Support Button */}
            <a
              href={`mailto:${globalSettings?.supportEmail || "digitalcoursesbay@gmail.com"}?subject=Order%20Verification%20Ref:%20${orderId}`}
              className="flex-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white font-display font-medium text-xs py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 transitionAll duration-200"
            >
              <Mail className="w-4 h-4 text-[#F5B300]" />
              <span>Contact Billing Email</span>
            </a>
          </div>
        </div>

        {/* Back To Home Button Trigger */}
        <div className="text-center">
          <button
            onClick={() => setCurrentPage("home")}
            className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-white text-xs tracking-wider uppercase font-mono font-bold transition duration-200"
          >
            <span>← Return to Education Catalog</span>
          </button>
        </div>

      </div>
    </div>
  );
};
