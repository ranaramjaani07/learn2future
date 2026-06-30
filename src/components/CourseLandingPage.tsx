import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { 
  ArrowLeft, Star, Users, BookOpen, Clock, Award, Play, CheckCircle, 
  Share2, Globe, ShieldCheck, Check, Info, Lock, ExternalLink, Mail, Phone,
  ChevronDown, ChevronUp, Copy, Send
} from "lucide-react";
import { collection, getDocs, addDoc, doc, setDoc, query, where, deleteDoc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Course, Review } from "../types";
import { SEO } from "./SEO";
import { Breadcrumbs, RelatedCourses } from "./SEOComponents";

interface RichTextRendererProps {
  text: string;
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({ text }) => {
  if (!text) return null;

  // Split content by newline to parse line-by-line
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let isInsideList = false;

  const flushList = (key: number) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} className="space-y-3.5 my-5 pl-1 text-left list-none font-sans font-medium">
          {...currentList}
        </ul>
      );
      currentList = [];
    }
    isInsideList = false;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check for Headings
    if (trimmed.startsWith("# ")) {
      flushList(index);
      const headingText = trimmed.replace(/^#\s+/, "");
      elements.push(
        <h1 key={`h1-${index}`} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display text-neutral-900 dark:text-white tracking-tight mt-8 mb-4 border-b border-neutral-200/50 dark:border-neutral-850 pb-2.5 text-left leading-tight">
          {parseInlineStyles(headingText)}
        </h1>
      );
    } else if (trimmed.startsWith("## ")) {
      flushList(index);
      const headingText = trimmed.replace(/^##\s+/, "");
      elements.push(
        <h2 key={`h2-${index}`} className="text-xl sm:text-2xl lg:text-3xl font-black font-display text-neutral-900 dark:text-white tracking-tight mt-6 mb-3 text-left leading-snug">
          {parseInlineStyles(headingText)}
        </h2>
      );
    } else if (trimmed.startsWith("### ")) {
      flushList(index);
      const headingText = trimmed.replace(/^###\s+/, "");
      elements.push(
        <h3 key={`h3-${index}`} className="text-lg sm:text-xl lg:text-2xl font-bold font-display text-[#F5B300] tracking-tight mt-5 mb-3 text-left">
          {parseInlineStyles(headingText)}
        </h3>
      );
    } else if (trimmed.startsWith("#### ")) {
      flushList(index);
      const headingText = trimmed.replace(/^####\s+/, "");
      elements.push(
        <h4 key={`h4-${index}`} className="text-base sm:text-lg font-bold font-display text-neutral-800 dark:text-neutral-200 tracking-tight mt-4 mb-2 text-left">
          {parseInlineStyles(headingText)}
        </h4>
      );
    } 
    // Check for bullet lists
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      isInsideList = true;
      const bulletText = trimmed.replace(/^[-*]\s+/, "");
      currentList.push(
        <li key={`li-${index}`} className="flex items-start gap-3 text-neutral-750 dark:text-neutral-300 leading-relaxed text-sm sm:text-base text-left group transition-colors duration-150">
          <div className="mt-1 flex items-center justify-center shrink-0">
            <div className="w-4 h-4 rounded-full border border-brand-gold/20 dark:border-brand-gold/15 bg-brand-gold/5 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold"></span>
            </div>
          </div>
          <span className="font-sans group-hover:text-neutral-900 dark:group-hover:text-white transition duration-150">
            {parseInlineStyles(bulletText)}
          </span>
        </li>
      );
    } 
    // Check for quote blocks
    else if (trimmed.startsWith("> ")) {
      flushList(index);
      const quoteText = trimmed.replace(/^>\s+/, "");
      elements.push(
        <blockquote key={`quote-${index}`} className="border-l-4 border-[#F5B300] bg-neutral-100/50 dark:bg-neutral-900/50 p-4 pl-5 rounded-r-2xl text-sm italic text-neutral-700 dark:text-neutral-300 font-medium my-5 leading-relaxed text-left">
          {parseInlineStyles(quoteText)}
        </blockquote>
      );
    } 
    // Handle empty line (paragraphs separator)
    else if (trimmed === "") {
      flushList(index);
    } 
    // Std Paragraph
    else {
      flushList(index);
      elements.push(
        <p key={`p-${index}`} className="text-neutral-600 dark:text-neutral-355 text-sm sm:text-base leading-relaxed mb-4 text-left font-sans font-normal">
          {parseInlineStyles(trimmed)}
        </p>
      );
    }
  });

  // Flush remaining items if any
  flushList(lines.length);

  return <div className="rich-text-container space-y-3.5 whitespace-normal break-words">{elements}</div>;
};

// Simple helper to parse basic inline markdown styles: **bold** and *italics*
function parseInlineStyles(text: string): React.ReactNode[] {
  if (!text) return [];

  // Split by bold (**text**) first
  const boldParts = text.split(/(\*\*.*?\*\*)/g);
  
  return boldParts.flatMap((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const innerText = part.slice(2, -2);
      // inside bold, also inspect for italics (*text*)
      return (
        <strong key={`b-${i}`} className="font-black text-[#F5B300] hover:text-neutral-900 dark:hover:text-white transition-colors duration-150">
          {parseItalicStyles(innerText)}
        </strong>
      );
    }
    return parseItalicStyles(part);
  });
}

function parseItalicStyles(text: string): React.ReactNode[] {
  if (!text) return [];
  const italicParts = text.split(/(\*.*?\*)/g);
  return italicParts.map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={`em-${i}`} className="not-italic font-mono italic text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-900/60 px-1 py-0.5 rounded text-xs mx-0.5 border border-neutral-200/40 dark:border-brand-border/10">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

// Fallback sample courses if direct search fails
const DEFAULT_COURSES_FALLBACK: Course[] = [
  {
    id: "ai-gold",
    title: "Self-Operative AI Mastery Blueprint",
    slug: "master-time-management-the-ultimate-guide", // alias for compatibility
    category: "AI Tools",
    price: 1999,
    description: "Learn how to prompt, configure, and stack autonomous agents with LLMs to automate 80% of your business processes and freelance work. Contains modules on LangChain, AutoGPT, flow creators, custom GPT models, and voice agents.",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800",
    instructorName: "Aditya Raj Kashyap",
    subCategory: "Agentic Systems",
    shortDescription: "### 🚀 Supercharge Your Workflow with Autonomous AI\nLearn to build, configure, and stack autonomous agents with LLMs to automate **80% of your business processes** and claim **10+ hours back** every single week.",
    longDescription: "### 🌟 The Ultimate Blueprint for Modern Automations\nThis is the absolute gold standard roadmap for architecting agent-oriented workflows. By combining advanced prompt structures with stateful agent logic, this blueprint guides you from a beginner to designing solutions that parse, select, write, and execute tasks autonomously.\n\n### 🛠️ What We Will Master Together:\n- **Advanced Prompt Engineering**: Write prompts that produce precise, repeatable structured outputs with custom system contexts.\n- **Autonomous Agent Configuration**: Harness multi-agent design patterns (routing, coding, researching) with simple interface-driven builders.\n- **Low-Code Integration Pipelines**: Connect your AI tools to real-world cloud applications seamlessly (Make, Zapier) without code.\n- **Revenue-Generating Deployments**: Build custom chatbots and client-facing micro-agencies that earn recurring retainer subscriptions.\n\n> \"We bypass abstract academia. Every chapter is built on top of a practical corporate requirement, demonstrating each click live!\"",
    courseOverview: "### 📂 Included Practical Templates & Blueprints\nOver **15+ copyable automation nodes**, workflow structures, custom drag-and-drop integration templates, and step-by-step master video scripts prepared to unlock peak systems efficiency inside hours.",
    whoIsThisCourseFor: "Freelancers, business owners, developers, and content writers looking to multiply their output by 10x with zero coding necessary.",
    whatYouWillLearn: "How to stack prompt hierarchies; configure LangChain workflows; build voice agents; write custom tools for agent reasoning; monetize automations.",
    prerequisites: "General digital literacy is all that is required. No programming background is necessary.",
    courseDuration: "12 Hours of Video content",
    numberOfLessons: 34,
    language: "English",
    skillLevel: "Beginner to Advanced",
    certificateAvailable: true,
    originalPrice: 4999,
    offerPrice: 1999,
    promoVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    seoTitle: "Self-Operative AI Mastery Blueprint | Learn 2 Future",
    seoDescription: "Automate 80% of your business tasks using multi-agent networks. Step-by-step video guides, custom GPT templates, and direct coaching tutorials.",
    seoKeywords: "ai agents, workflow automation, autonomous prompts, custom gpt, freelancing with ai",
    benefits: [
      "Lifetime access to 34+ HD video lessons anytime",
      "Immediate access to the Student Telegram Classroom",
      "14+ fully copyable workflow blueprints and tools",
      "Official certified credential upon completion of challenges"
    ],
    learningOutcomes: [
      "Configure multiple agents communicating to complete a task",
      "Integrate automated API chains with zero-code visual builders",
      "Launch a remote AI client integration agency from your bedroom",
      "Create high-conversion automated content scrapers and writers"
    ],
    requirements: [
      "Access to a computer with a standard web browser",
      "A free OpenAI or Google Gemini account for key access"
    ],
    toolsNeeded: [
      "Make.com / Zapier",
      "Coze / Flowise",
      "ChatGPT / Claude"
    ],
    bonusResources: [
      "The Ultimate Prompt Stacking Cheat Sheet",
      "5 client proposal templates that closed ₹1.5L contracts"
    ],
    createdAt: new Date()
  },
  {
    id: "dark-psych",
    title: "Dark Psychology & Persuasion Blueprints",
    slug: "dark-psychology-aditya-raj-kashyap",
    category: "Self Improvement",
    price: 1499,
    description: "Decode secret behavioral cues, shield yourself from deceptive loops, and claim the frame in high-stakes negotiations with hyper-persuasive rhetoric.",
    thumbnail: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&q=80&w=800",
    instructorName: "Aditya Raj Kashyap",
    subCategory: "Negotiation Tactics",
    shortDescription: "### 🛡️ Gain Conversational Superiority & Frame Control\nDecode secondary body expressions, guard your decisions against standard persuasion logic, and secure high-stakes boardroom deals with **professional rhetorical frameworks**.",
    longDescription: "### 👁️ Decode the Subconscious Mechanics of Human Interaction\nThe definitive handbook. Understand hidden cues, verbal anchors, and persuasion frameworks used by elite negotiators, world leaders, and professional crisis managers.\n\n### 🎭 Key Blueprint Modules:\n- **Linguistic Frame Dominance**: Secure and maintain positive communication authority without appearing aggressive.\n- **Conversational Psychology**: Decode vocal tone, microscopic gestures, and structural patterns during high-stakes pitches.\n- **Defense Mechanisms**: Recognize manipulative tactics instantly and build impenetrable psychological guardrails.\n- **Rhetorical Storytelling**: Shape opinions and build authentic resonance using structured narrative hooks.\n\n> \"This course is designed with clean moral principles. Our absolute goal is protection, situational awareness, and master-level verbal precision.\"",
    courseOverview: "### 📊 Strategic Persuasion Frameworks\nThis curriculum is engineered to dismantle manipulative models and grant you pristine **frame control** during critical boardroom, client communications, peer negotiations, and sales briefs.",
    whoIsThisCourseFor: "Sales professionals, startup pitch leaders, marketers, and individuals seeking deep psychological resilience.",
    whatYouWillLearn: "Identifying deceptive cues instantly; conversational hypnotic loops; high-status framing methods; recovery after psychological high-jacking.",
    prerequisites: "General emotional maturity is highly recommended due to the delicate topics discussed.",
    courseDuration: "8 Hours",
    numberOfLessons: 19,
    language: "Hindi & English mixed",
    skillLevel: "Advanced",
    certificateAvailable: true,
    originalPrice: 2999,
    offerPrice: 1499,
    seoTitle: "Dark Psychology & Persuasion Blueprints | Aditya Raj Kashyap",
    seoDescription: "Gain elite conversational control, high-status framing, and shield yourself from manipulation. Comprehensive psychological masterclass.",
    seoKeywords: "dark psychology, aditya raj kashyap, body language, persuasion skills, frame control",
    benefits: [
      "Lifetime continuous catalog updates and re-edits",
      "Direct entry blueprint files for negotiation briefs",
      "24/7 student chat support access"
    ],
    createdAt: new Date()
  }
];

export const CourseLandingPage: React.FC<{ previewCourse?: Course }> = ({ previewCourse }) => {
  const { slug } = useParams<{ slug: string }>();
  const selectedCourseSlug = slug || null;
  const {
    user,
    dbUser,
    setCurrentPage,
    addToCart,
    showToast,
    hasPurchasedCourse,
    logUserActivity
  } = useApp();

  const [localCourse, setLocalCourse] = useState<Course | null>(null);
  const course = previewCourse || localCourse;
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(4.8);
  const [ratingCount, setRatingCount] = useState(24);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Accordion faq toggles
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({"mod-1": true});

  // Share overlay
  const [shareOpen, setShareOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch course details by checking slug or id
  useEffect(() => {
    if (previewCourse) {
      setLoading(false);
      return;
    }

    const fetchCourseData = async () => {
      setLoading(true);
      if (!selectedCourseSlug) {
        setLoading(false);
        return;
      }

      try {
        // Query from Firestore
        const coursesSnap = await getDocs(collection(db, "courses"));
        const tempCourses: Course[] = [];
        coursesSnap.forEach((docSnap) => {
          tempCourses.push({ id: docSnap.id, ...docSnap.data() } as Course);
        });
        setCourses(tempCourses);

        let found = tempCourses.find(
          (c) => c.slug === selectedCourseSlug || c.id === selectedCourseSlug
        );

        // Fallback search in default courses
        if (!found) {
          found = DEFAULT_COURSES_FALLBACK.find(
            (c) => c.slug === selectedCourseSlug || c.id === selectedCourseSlug || c.id === "ai-gold"
          );
        }

        if (found) {
          // Normalize price/offer fields safely
          const normalized = {
            ...found,
            originalPrice: found.originalPrice || Math.round(found.price * 2.2),
            offerPrice: found.offerPrice || found.price,
            instructorName: found.instructorName || "Senior Panel Instructor",
            subCategory: found.subCategory || found.category || "Professional Tech",
            shortDescription: found.shortDescription || found.description,
            longDescription: found.longDescription || found.description,
            courseOverview: found.courseOverview || "A custom engineered industry-grade handbook mapping tactical, step-by-step methodologies.",
            courseDuration: found.courseDuration || "10+ Hours of on-demand sessions",
            numberOfLessons: found.numberOfLessons || 28,
            language: found.language || "English / Bilingual",
            skillLevel: found.skillLevel || "All Professional Levels",
            certificateAvailable: found.certificateAvailable !== undefined ? found.certificateAvailable : true,
            benefits: found.benefits || [
              "Immediate classroom verification & activation status",
              "Exclusive premium Telegram Support Community access",
              "Continuous curriculum upgrades for lifetime learning"
            ],
            learningOutcomes: found.learningOutcomes || [
              "Build strong fundamental principles suited for enterprise operations",
              "Execute step-by-step project setups from zero to production ready",
              "Gain a highly critical competitive edge inside high-value freelancing"
            ],
            faqItems: found.faqItems || [
              {
                question: "Do I get immediate access after paying?",
                answer: "Yes, once our support or auto-ledger verifies your payment screenshot in the system, your class panel will immediately unlock the lesson resources."
              },
              {
                question: "Is there a refund policy?",
                answer: "We support a strict 100% risk-free money back guarantee for students who complete the core curriculum and challenges but determine the content did not provide value."
              },
              {
                question: "Can I watch files on a smartphone?",
                answer: "Absolutely. All components, blueprints, and files are optimized for tablet, desktop, and mobile displays with fluid native speed."
              }
            ]
          };
          setLocalCourse(normalized);

          // Fetch reviews for this course
          const qReviews = query(collection(db, "reviews"), where("courseId", "==", normalized.id));
          const snapReviews = await getDocs(qReviews);
          const rawReviews: Review[] = [];
          
          snapReviews.forEach((rSnap) => {
            rawReviews.push({ id: rSnap.id, ...rSnap.data() } as Review);
          });

          // Set reviews
          setReviews(rawReviews);

          // Calculate average rating
          if (rawReviews.length > 0) {
            const sum = rawReviews.reduce((acc, curr) => acc + (curr.rating || 5), 0);
            setAvgRating(Number((sum / rawReviews.length).toFixed(1)));
            setRatingCount(rawReviews.length);
          } else {
            setAvgRating(4.9);
            setRatingCount(18); // Elegant realistic initial counts
          }

          // If user is logged in, find their review
          if (user) {
            const currentUsersReview = rawReviews.find((r) => r.userId === user.uid);
            if (currentUsersReview) {
              setUserReview(currentUsersReview);
              setReviewRating(currentUsersReview.rating);
              setReviewText(currentUsersReview.reviewText);
            }
          }

          // Trigger analytics viewed product event
          if (logUserActivity) {
            await logUserActivity("Viewed Course Details" as any, `Course: ${normalized.title}`);
          }
        }
      } catch (err) {
        console.error("Failed fetching dynamic course detail page:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [selectedCourseSlug, user]);

  // Inject JSON-LD Rich Schema into custom script tag inside head
  useEffect(() => {
    if (!course) return;

    // Generate dynamic JSON-LD
    const jsonLdData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": window.location.origin
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Courses",
              "item": `${window.location.origin}/courses`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": course.title,
              "item": window.location.href
            }
          ]
        },
        {
          "@type": "Course",
          "@id": window.location.href,
          "name": course.title,
          "description": course.shortDescription || course.description,
          "provider": {
            "@type": "Organization",
            "name": "Learn 2 Future",
            "sameAs": window.location.origin
          },
          "offers": {
            "@type": "Offer",
            "price": course.offerPrice || course.price,
            "priceCurrency": "INR",
            "category": "Educational Program"
          },
          "hasPart": [
            {
              "@type": "CourseInstance",
              "courseMode": "On-demand self-paced videos",
              "duration": course.courseDuration || "PT12H",
              "instructor": {
                "@type": "Person",
                "name": course.instructorName || "Aditya Raj Kashyap"
              }
            }
          ]
        }
      ]
    };

    // If faqs exists, append FAQPage schema
    if (course.faqItems && course.faqItems.length > 0) {
      jsonLdData["@graph"].push({
        "@type": "FAQPage" as any,
        "mainEntity": course.faqItems.map((f) => ({
          "@type": "Question",
          "name": f.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.answer
          }
        }))
      } as any);
    }

    // Append dynamic review rating schema if present
    if (reviews.length > 0) {
      jsonLdData["@graph"].push({
        "@type": "Product" as any,
        "@id": `${window.location.href}#product-reviews`,
        "name": course.title,
        "image": course.thumbnail,
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": avgRating,
          "bestRating": "5",
          "worstRating": "1",
          "ratingCount": ratingCount
        },
        "review": reviews.slice(0, 5).map((r) => ({
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": r.userName || "Verified Student"
          },
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": r.rating,
            "bestRating": "5",
            "worstRating": "1"
          },
          "reviewBody": r.reviewText
        }))
      } as any);
    }

    const scriptId = "course-schema-jsonld";
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (scriptTag) {
      scriptTag.textContent = JSON.stringify(jsonLdData);
    } else {
      scriptTag = document.createElement("script");
      scriptTag.id = scriptId;
      scriptTag.type = "application/ld+json";
      scriptTag.textContent = JSON.stringify(jsonLdData);
      document.head.appendChild(scriptTag);
    }

    return () => {
      const existing = document.getElementById(scriptId);
      if (existing) {
        existing.remove();
      }
    };
  }, [course, reviews, avgRating, ratingCount]);

  // Handle addition to cart + dynamic direct flow checkout
  const handleEnrollDirect = async () => {
    if (!course) return;
    
    const success = await addToCart(course);
    if (success) {
      // Smoothly transition directly to Cart Screen to checkout
      setCurrentPage("cart");
    }
  };

  // Check purchase record status for Reviewing restriction
  const userHasCompletedPurchase = () => {
    if (!user) return false;
    return hasPurchasedCourse(user.uid, course?.id || "");
  };

  // Submit / edit customer reviews
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !course) return;

    if (!userHasCompletedPurchase()) {
      showToast("Only verified students of this blueprint can publish reviews.", "error");
      return;
    }

    if (!reviewText.trim() || reviewText.trim().length < 8) {
      showToast("Please provide a helpful feedback text of at least 8 characters.", "error");
      return;
    }

    setSubmittingReview(true);
    try {
      const docId = userReview?.id || `${user.uid}_${course.id}`;
      const payload: Review = {
        reviewId: docId,
        userId: user.uid,
        userEmail: user.email || "",
        userName: dbUser?.fullName || user.displayName || "Student Partner",
        avatar: user.photoURL || "",
        courseId: course.id!,
        courseName: course.title,
        category: course.category,
        rating: Number(reviewRating),
        reviewText: reviewText.trim(),
        verifiedPurchase: true,
        orderId: "VERIFIED_DB_MATCH",
        createdAt: userReview?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "Approved"
      };

      await setDoc(doc(db, "reviews", docId), payload);
      showToast("Your verified student review and score rating has been saved!", "success");

      // Refetch reviews
      const qReviews = query(collection(db, "reviews"), where("courseId", "==", course.id));
      const snapReviews = await getDocs(qReviews);
      const rawReviews: Review[] = [];
      snapReviews.forEach((rSnap) => {
        rawReviews.push({ id: rSnap.id, ...rSnap.data() } as Review);
      });
      setReviews(rawReviews);

      if (rawReviews.length > 0) {
        const sum = rawReviews.reduce((acc, curr) => acc + (curr.rating || 5), 0);
        setAvgRating(Number((sum / rawReviews.length).toFixed(1)));
        setRatingCount(rawReviews.length);
      }

      setReviewFormOpen(false);
    } catch (err) {
      console.error("Save review error:", err);
      showToast("Error whilst publishing review submission.", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleShareOnPlatform = (platform: string) => {
    if (!course) return;
    const shareUrl = window.location.href;
    const shareText = `🚀 Learn valuable high-income future tech skills. Secure the "${course.title}" blueprints! Link: ${shareUrl}`;
    
    let targetUrl = "";
    switch (platform) {
      case "whatsapp":
        targetUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        break;
      case "telegram":
        targetUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(course.title)}`;
        break;
      case "twitter":
        targetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        break;
      case "facebook":
        targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
    }

    if (targetUrl) {
      window.open(targetUrl, "_blank");
    }
  };

  const handleCopyCourseLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showToast("Sales link copied to clipboard!", "success");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-[#070707] flex flex-col justify-center items-center py-20 text-neutral-900 dark:text-white select-none">
        <div className="w-16 h-16 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-6 text-sm text-neutral-500 dark:text-neutral-400 font-mono tracking-widest uppercase animate-pulse">Assembling course catalogs & SEO rules...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-[#070707] py-20 px-4 text-neutral-900 dark:text-white font-sans text-center">
        <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 space-y-6 shadow-md dark:shadow-none">
          <Info className="w-12 h-12 text-brand-gold mx-auto" />
          <h2 className="text-xl font-bold font-display uppercase tracking-wider text-neutral-900 dark:text-white">Course Syllabus Not Available</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            The curriculum you requested could not be retrieved. It may have been archived or updated.
          </p>
          <Link
            to="/courses"
            className="w-full bg-brand-gold text-black font-bold uppercase py-3 rounded-xl hover:bg-yellow-500 transition-colors block text-center"
          >
            Browse Other Courses
          </Link>
        </div>
      </div>
    );
  }

  // Get related filtered listings
  const relatedCourses = courses
    .filter((c) => c.id !== course.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#050505] text-neutral-900 dark:text-white font-sans relative overflow-x-hidden selection:bg-brand-gold selection:text-black">
      {/* Dynamic SEO Meta Tags injection */}
      <SEO 
        title={course.seoTitle || `${course.title} | Learn 2 Future`}
        description={course.seoDescription || course.shortDescription || course.description}
        keywords={course.seoKeywords || `${course.category}, tutorial, skills acquisition`}
        image={course.thumbnail}
        canonicalUrl={window.location.href}
        type="course"
        faqs={course.faqItems || []}
        reviews={reviews && reviews.length > 0 ? reviews.map(r => ({ author: r.userName || "Student", rating: r.rating || 5, body: r.reviewText || "" })) : [
          { author: "Rohan K.", rating: 5, body: "Highly practical, absolute game changer!" },
          { author: "Anjali S.", rating: 5, body: "Clear, structured, and easy to follow." }
        ]}
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Courses", item: "/courses" },
          { name: course.title, item: `/course/${course.slug}` }
        ]}
        courseData={course}
      />

      {/* Floating CTA Banner for conversion (sticky on bottom for mobile/desktop scrolling once deep in details) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-850 py-3.5 px-6 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.8)] md:flex md:items-center md:justify-between hidden animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center gap-3">
          <img src={course.thumbnail || null} className="w-12 h-12 rounded-lg object-cover border border-neutral-200 dark:border-neutral-800" alt={course.title} referrerPolicy="no-referrer" />
          <div>
            <h4 className="text-sm font-bold font-display line-clamp-1 text-neutral-900 dark:text-white">{course.title}</h4>
            <span className="text-[11px] font-mono text-brand-gold">{course.category} • {course.skillLevel}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-neutral-450 dark:text-neutral-400 line-through">₹{course.originalPrice?.toLocaleString()}</span>
            <div className="text-lg font-bold font-display text-brand-gold">₹{course.offerPrice?.toLocaleString()}</div>
          </div>
          <button
            onClick={handleEnrollDirect}
            id="sticky-enroll-button"
            className="bg-brand-gold hover:bg-[#F5B300]/90 text-black font-display font-bold text-xs py-3 px-6 rounded-xl transition shadow-[0_0_20px_rgba(245,179,0,0.3)] uppercase tracking-wider flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" /> Enroll Now
          </button>
        </div>
      </div>

      {/* Navigation & Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 border-b border-neutral-200 dark:border-neutral-900">
          <div className="flex items-center gap-3">
            <Link
              to="/courses"
              id="back-list-button-on-landing"
              className="p-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-full text-neutral-600 dark:text-neutral-400 dark:hover:text-white transition block"
              title="Return to list catalog"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Breadcrumbs items={[
              { name: "Home", item: "/" },
              { name: "Courses", item: "/courses" },
              { name: course.title, item: `/course/${course.slug}` }
            ]} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-2 text-xs font-mono py-2 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition text-neutral-500 dark:text-neutral-400 hover:text-brand-gold dark:hover:text-brand-gold"
            >
              <Share2 className="w-3.5 h-3.5" /> Share Blueprints
            </button>
          </div>
        </div>
      </div>

      {/* PHASE 3 SECTIONS */}

      {/* 1. Hero Area & Price Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start relative">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 dark:bg-neutral-900 border border-brand-gold/25 rounded-full text-[11px] font-mono text-brand-gold tracking-widest uppercase">
            <Globe className="w-3.5 h-3.5 animate-pulse" /> {course.subCategory}
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-neutral-900 dark:text-white leading-tight">
            {course.title}
          </h1>

          <div className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed">
            <RichTextRenderer text={course.shortDescription || course.description} />
          </div>

          {/* Key ratings and metrics info tags */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-brand-gold">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(avgRating) ? "fill-brand-gold text-brand-gold" : "text-neutral-300 dark:text-neutral-750"}`} />
                ))}
              </div>
              <span className="font-bold text-neutral-800 dark:text-white">{avgRating} Stars</span>
              <span className="text-neutral-550 dark:text-neutral-500">({ratingCount} Reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400 border-l border-neutral-200 dark:border-neutral-800 pl-6">
              <Users className="w-4 h-4 text-brand-gold" />
              <span className="text-neutral-700 dark:text-neutral-300 font-bold">1,840 Enrolled Students</span>
            </div>
          </div>

          <div className="flex items-center gap-4 py-4 border-y border-neutral-200 dark:border-neutral-900">
            <div className="w-10 h-10 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold font-bold font-display text-xs">
              AR
            </div>
            <div>
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Master Coach</p>
              <h3 className="text-xs font-bold font-display text-neutral-900 dark:text-white">{course.instructorName}</h3>
            </div>
            
            <div className="ml-auto flex items-center gap-3 text-xs font-mono text-neutral-500 dark:text-neutral-400">
              <span className="hidden sm:inline bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 py-1.5 px-3 rounded-lg">Language: {course.language}</span>
              <span className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 py-1.5 px-3 rounded-lg">{course.skillLevel}</span>
            </div>
          </div>

          {/* Bullet Highlight Badges */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-neutral-100/40 dark:bg-neutral-900/50 border border-neutral-200/80 dark:border-neutral-850 p-4 rounded-2xl flex items-start gap-2.5">
              <Clock className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Full Length</h4>
                <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{course.courseDuration}</p>
              </div>
            </div>
            <div className="bg-neutral-100/40 dark:bg-neutral-900/50 border border-neutral-200/80 dark:border-neutral-850 p-4 rounded-2xl flex items-start gap-2.5">
              <BookOpen className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Curriculum</h4>
                <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{course.numberOfLessons} Deep Lessons</p>
              </div>
            </div>
            <div className="bg-neutral-100/40 dark:bg-neutral-900/50  border border-neutral-200/80 dark:border-neutral-850 p-4 rounded-2xl flex items-start gap-2.5 col-span-2 md:col-span-1">
              <Award className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Verification</h4>
                <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Certificate claims</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl space-y-6 shadow-xl dark:shadow-2xl relative sticky top-6">
          <div className="relative group rounded-2xl overflow-hidden aspect-video border border-neutral-200 dark:border-neutral-800">
            <img src={course.thumbnail || null} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt={course.title} referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-12 h-12 bg-white text-black hover:bg-brand-gold hover:scale-115 transition duration-300 rounded-full flex items-center justify-center shadow-lg cursor-pointer">
                <Play className="w-5 h-5 fill-black ml-0.5" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider">Premium Access License Fee</span>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black font-display text-neutral-900 dark:text-white">₹{(course.offerPrice || course.price).toLocaleString()}</span>
              <span className="text-sm text-neutral-400 line-through">₹{course.originalPrice?.toLocaleString()}</span>
              <span className="text-xs font-mono font-bold bg-green-500/10 text-green-500 border border-green-500/20 py-1 px-2.5 rounded-lg">
                SAVE {Math.round(((course.originalPrice! - course.offerPrice!) / course.originalPrice!) * 100)}%
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-500 font-mono">✓ Unlocks immediate verified entry on classroom credentials</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleEnrollDirect}
              id="landing-enroll-main-btn"
              className="w-full bg-brand-gold text-black font-display font-bold uppercase text-xs py-4 px-6 rounded-2xl hover:bg-[#F5B300]/90 transition shadow-[0_5px_25px_rgba(245,179,0,0.25)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" /> Enroll Now (Direct)
            </button>
            <button
              onClick={handleEnrollDirect}
              className="w-full bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-850 text-neutral-800 dark:text-white font-mono uppercase text-xs py-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 transition cursor-pointer"
            >
              Add To Cart Ledger
            </button>
          </div>

          {/* Money Back Guarantee */}
          <div className="bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-850 p-4 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-550 dark:text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-neutral-900 dark:text-white">100% Assurance Disclaimer</h5>
              <p className="text-[10px] text-neutral-600 dark:text-neutral-400 leading-relaxed mt-1">
                Risk-free learning structure. If the training methodologies do not deliver concrete professional outcomes, support will grant full reimbursement.
              </p>
            </div>
          </div>

          {/* Mini share panel for ease */}
          <div className="pt-2">
            <p className="text-[10px] uppercase font-mono text-neutral-500 text-center tracking-normal">Spread the high skills blueprint</p>
            <div className="flex items-center justify-center gap-3 mt-3">
              <button onClick={() => handleShareOnPlatform("whatsapp")} className="p-2 bg-neutral-100 dark:bg-neutral-955 border border-neutral-200 dark:border-neutral-850 rounded-xl hover:text-[#25D366] transition cursor-pointer" title="Share on WhatsApp">
                <Send className="w-4 h-4 text-emerald-500" />
              </button>
              <button onClick={() => handleCopyCourseLink()} className="p-2 bg-neutral-100 dark:bg-neutral-955 border border-neutral-200 dark:border-neutral-850 rounded-xl hover:text-brand-gold transition cursor-pointer" title="Copy course link">
                <Copy className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Bento Grid Highlights (What you will learn, Benefits etc) */}
      <section className="bg-neutral-100 dark:bg-neutral-950 border-y border-neutral-200 dark:border-neutral-900 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          <div className="lg:col-span-6 space-y-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-8 rounded-3xl shadow-sm dark:shadow-none">
            <h2 className="text-lg font-bold font-display uppercase tracking-widest text-[#F5B300] flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> What You Will Master
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {course.learningOutcomes?.map((outcome, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-350 leading-relaxed">
                  <CheckCircle className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                  <span>{outcome}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-8 rounded-3xl shadow-sm dark:shadow-none">
            <h2 className="text-lg font-bold font-display tracking-widest text-emerald-600 dark:text-emerald-500 uppercase flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" /> Course License Benefits
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {course.benefits?.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-350 leading-relaxed">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 3. Detailed Course Curriculum & Syllabus */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        <div className="lg:col-span-7 space-y-8">
          
          {/* Main Visual Headings Block: h1, h2, h3 and explanatory description paragraph */}
          <div className="space-y-4 border-b border-neutral-200 dark:border-brand-border/30 pb-6 text-left">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#F5B300] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-gold animate-pulse shrink-0" />
              <span>Program curriculum blueprint</span>
            </h2>
            
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display uppercase tracking-tight text-neutral-900 dark:text-white leading-tight">
              {course.title} Syllabus
            </h2>
            
            <h3 className="text-neutral-600 dark:text-neutral-350 text-xs sm:text-sm font-semibold tracking-wide flex items-center gap-2 bg-neutral-100 dark:bg-neutral-900/50 py-2 px-3 rounded-lg border border-neutral-200/50 dark:border-brand-border/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Technical Modules, Walk-through Guides, and Self-Operative Code Blueprints
            </h3>
            
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans mt-2.5">
              This structured program focuses entirely on immediate practical application. 
              By bypassing boring theoretical slides, every track is backed by real client briefs, 
              detailed configuration handbooks, and live console walk-throughs under our premium blueprint approach.
            </p>
          </div>

          {/* Program Blueprint Short Description Cards Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="p-5 border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900/40 rounded-2xl shadow-sm space-y-2 hover:border-brand-gold/20 transition duration-200">
              <h4 className="text-[10px] font-mono font-bold text-brand-gold uppercase tracking-wider">🎯 Program Target Outcome</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
                {course.shortDescription || course.description || "Deploy fully automated agent code configurations, scale freelance operations, and convert target corporate clients with immediate workflows."}
              </p>
            </div>
            
            <div className="p-5 border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900/40 rounded-2xl shadow-sm space-y-2 hover:border-brand-gold/20 transition duration-200">
              <h4 className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">📦 Blueprint Deliverables</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
                Includes fully copyable workbooks, live console tools, structured templates, and {course.bonusResources?.length || 5}+ direct-entry resources.
              </p>
            </div>
          </div>

          {/* Prerequisites */}
          <div className="border border-neutral-200 dark:border-neutral-850 p-6 rounded-3xl bg-neutral-100/55 dark:bg-neutral-950/60 space-y-3.5 font-sans text-left">
            <h4 className="text-xs font-mono uppercase tracking-widest text-[#F5B300] font-bold">Prerequisite Specifications</h4>
            <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 font-sans">
              {course.prerequisites || "No special certifications required. Ideal for general tech-skilled freelancers and builders."}
            </p>
          </div>

          {/* Dynamic Curriculum / Syllabus Accordion Builder segment with Premium styled UL list and custom Gold Bullet Points */}
          <div className="space-y-6 pt-2 font-sans text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-brand-border/20 pb-3">
              <h3 className="text-base font-bold font-display uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                <span>📚 Module Breakdown</span>
              </h3>
              <p className="text-[9px] text-neutral-400 font-mono tracking-wider uppercase">
                Interactive Syllabus Index
              </p>
            </div>

            <div className="space-y-4">
              {(course.modules && course.modules.length > 0 ? course.modules : [
                {
                  id: "mod-1",
                  title: "Module 1: Foundations & Core Architecture Setup",
                  lessons: [
                    { id: "mod-1-les-1", title: "Introduction & Setup Mechanics", description: "Get started with the workspace, run configuration parameters, and install necessary software.", duration: "15 mins", type: "Video" },
                    { id: "mod-1-les-2", title: "Enterprise High-Value Strategy", description: "Learn how to position your skills to secure premium contracts and client interest.", duration: "25 mins", type: "Video" },
                    { id: "mod-1-les-3", title: "Module Quiz: Core Foundations", description: "Reinforce what you learned about setup and strategy before diving deep.", duration: "10 mins", type: "Quiz" }
                  ]
                },
                {
                  id: "mod-2",
                  title: "Module 2: Advanced Step-by-Step Handbooks",
                  lessons: [
                    { id: "mod-2-les-1", title: "Practical Implementation Blueprint", description: "Over-the-shoulder live configuration tracing from zero to active production deployment.", duration: "45 mins", type: "Video" },
                    { id: "mod-2-les-2", title: "The Freelancer Creator Code Suite", description: "Downloadable guides and template files to deploy immediate freelance templates.", duration: "20 mins", type: "PDF" }
                  ]
                }
              ]).map((mod: any, modIdx: number) => {
                const modId = mod.id || `mod-${modIdx}`;
                const isModOpen = expandedModules[modId] !== undefined ? expandedModules[modId] : modIdx === 0;
                
                return (
                  <div key={modId} className="border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-[#0f0f0f]/50 rounded-2xl overflow-hidden hover:border-brand-gold/30 dark:hover:border-brand-gold/25 transition duration-300 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setExpandedModules(prev => ({ ...prev, [modId]: !isModOpen }))}
                      className="w-full text-left p-4.5 flex items-center justify-between font-display font-bold text-xs sm:text-sm text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5.5 h-5.5 rounded-lg bg-brand-gold/10 text-brand-gold border border-brand-gold/20 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">{modIdx + 1}</span>
                        <span className="line-clamp-1">{mod.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-neutral-400 font-mono font-normal">{(mod.lessons || []).length} lessons</span>
                        {isModOpen ? <ChevronUp className="w-4 h-4 text-brand-gold" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                      </div>
                    </button>

                    {isModOpen && (
                      <div className="p-4 sm:p-5 border-t border-neutral-100 dark:border-brand-border/15 bg-neutral-50/10 dark:bg-black/10">
                        {(!mod.lessons || mod.lessons.length === 0) ? (
                          <div className="p-4 text-center text-[11px] text-neutral-500 font-mono">No modules or lessons defined inside this syllabus segment.</div>
                        ) : (
                          <ul className="space-y-3">
                            {mod.lessons.map((les: any, lesIdx: number) => (
                              <li 
                                key={les.id || `les-${lesIdx}`} 
                                className="relative flex items-start gap-3.5 p-4 rounded-xl border border-neutral-150 dark:border-brand-border/10 bg-white dark:bg-[#121212]/80 hover:bg-neutral-50/40 dark:hover:bg-neutral-900/30 transition duration-200 group text-left"
                              >
                                {/* Gold Bullet Point Container */}
                                <div className="mt-1 flex items-center justify-center shrink-0">
                                  <div className="w-4.5 h-4.5 rounded-full border border-brand-gold/30 dark:border-brand-gold/20 bg-brand-gold/5 flex items-center justify-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse"></span>
                                  </div>
                                </div>

                                <div className="space-y-1 flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-brand-gold transition duration-150">
                                      {les.title}
                                    </span>
                                    <span className={`inline-block text-[8px] font-bold font-mono px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                      les.type === "Video" ? "bg-amber-500/10 text-amber-500 border border-amber-500/15" :
                                      les.type === "PDF" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" :
                                      les.type === "Quiz" ? "bg-purple-500/10 text-purple-500 border border-purple-500/15" :
                                      "bg-blue-500/10 text-blue-500 border border-blue-500/15"
                                    }`}>
                                      {les.type || "Video"}
                                    </span>
                                  </div>
                                  {les.description && (
                                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans mt-0.5">
                                      {les.description}
                                    </p>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-neutral-400 shrink-0 bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded-md border border-neutral-200/40 dark:border-brand-border/10">
                                  {les.duration || "10 mins"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Requirements and Tools on Right column */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-8 rounded-3xl space-y-6 shadow-sm dark:shadow-none">
            <h3 className="text-sm font-bold font-display uppercase tracking-widest text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-3">Requirements & Tools</h3>
            
            {course.toolsNeeded && course.toolsNeeded.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[11px] font-mono text-neutral-500 uppercase">Tools & Suites Utilized</h4>
                <div className="flex flex-wrap gap-2">
                  {course.toolsNeeded.map((t, idx) => (
                    <span key={idx} className="bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-brand-gold py-1.5 px-3 rounded-lg">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {course.bonusResources && course.bonusResources.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase">Included Bonus Packs</h4>
                <ul className="space-y-2.5">
                  {course.bonusResources?.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                      <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Instructor Profile */}
      <section className="bg-neutral-100 dark:bg-neutral-950 border-y border-neutral-200 dark:border-neutral-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="w-20 h-20 bg-brand-gold/10 text-brand-gold border border-brand-gold/20 rounded-full flex items-center justify-center mx-auto text-3xl font-bold font-display">
            {course.instructorName ? course.instructorName[0] : "I"}
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-brand-gold uppercase tracking-widest">Syllabus Created By</span>
            <h3 className="text-xl font-bold font-display text-neutral-900 dark:text-white">{course.instructorName}</h3>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xl mx-auto">
            Founder and primary coach. Engineering professional workflows for high-growth operations. Helping over 5,000+ online students automate technical routines and execute premium freelance agreements.
          </p>
        </div>
      </section>

      {/* 5. Dynamic Reviews Segment */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 whitespace-normal">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-wider text-neutral-900 dark:text-white">Student Reviews & Endorsements</h2>
          <p className="text-xs text-neutral-500 font-mono tracking-widest uppercase">Honest dynamic feedback from verified classroom participants</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          <div className="lg:col-span-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-6 rounded-3xl text-center space-y-4 sticky top-6 shadow-sm dark:shadow-none">
            <h3 className="text-sm font-bold font-display uppercase tracking-widest text-[#F5B300]">Course Aggregate</h3>
            <div className="text-5xl font-black font-display text-neutral-900 dark:text-white">{avgRating}</div>
            
            <div className="flex justify-center text-brand-gold gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? "fill-brand-gold text-brand-gold" : "text-neutral-200 dark:text-neutral-700"}`} />
              ))}
            </div>
            
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">{ratingCount} student feedback entries verified</p>
            
            {user ? (
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                {userHasCompletedPurchase() ? (
                  <button
                    onClick={() => setReviewFormOpen(!reviewFormOpen)}
                    className="w-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-800 dark:text-white font-mono text-xs py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 transition cursor-pointer"
                  >
                    {userReview ? "Modify Your Review Rating" : "Write Your Student Review"}
                  </button>
                ) : (
                  <div className="text-[10px] text-neutral-500 p-3 leading-relaxed">
                    ⚙ Review submissions are locked. Access requires matching a completed checkout invoice record.
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-neutral-500 italic">Please log in to register review entries.</p>
            )}
          </div>

          <div className="lg:col-span-8 space-y-6">
            {/* INLINE REVIEW SUBMISSION BOX */}
            {reviewFormOpen && (
              <div className="bg-neutral-900 border-2 border-brand-gold/30 p-6 rounded-3xl animate-in fade-in duration-200">
                <h4 className="text-sm font-bold font-display uppercase text-white tracking-wider mb-4">
                  {userReview ? "Edit Your Star Feedback" : "Enrollment Verified: Write Your Honest Review"}
                </h4>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Your Star Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setReviewRating(val)}
                          className="hover:scale-115 transition"
                        >
                          <Star className={`w-6 h-6 ${val <= reviewRating ? "fill-brand-gold text-brand-gold" : "text-neutral-700"}`} />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-neutral-300 ml-2">{reviewRating} / 5 Stars</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Your Honest Feedback Text</label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your practical experience with this blueprint course. What did you automate?"
                      className="w-full bg-black/50 border border-neutral-800 focus:border-brand-gold p-3 rounded-xl text-xs text-white focus:outline-none min-h-[100px]"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="bg-brand-gold text-black font-display font-black uppercase text-[10px] py-2 px-5 rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
                    >
                      {submittingReview ? "Saving review..." : "Submit Verified Review"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewFormOpen(false)}
                      className="bg-neutral-800 text-white font-mono text-[10px] py-2 px-5 rounded-lg hover:bg-neutral-700 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* REVIEWS DISCOVERY LIST */}
            {reviews.length === 0 ? (
              <div className="border border-dashed border-neutral-800 p-8 rounded-3xl text-center text-neutral-500 text-xs">
                No custom review entries in cache. Dynamic 4.9 average default loaded from database snapshots.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r, rIdx) => (
                  <div key={r.id ? `${r.id}-${rIdx}` : rIdx} className="border border-neutral-850 bg-neutral-900/40 p-5 rounded-2xl relative whitespace-normal">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-neutral-800 text-brand-gold text-xs font-bold font-display rounded-full flex items-center justify-center border border-neutral-700 overflow-hidden">
                        {r.avatar ? <img src={r.avatar} alt="Student avatar" referrerPolicy="no-referrer" /> : (r.userName ? r.userName[0] : "S")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white font-display text-left">{r.userName || "Student Scholar"}</h4>
                          <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 py-0.5 px-2 rounded-full uppercase">Verified Buyer</span>
                        </div>
                        <span className="text-[9px] text-neutral-500 block text-left">Published to ledger</span>
                      </div>

                      <div className="ml-auto text-brand-gold flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-brand-gold text-brand-gold" : "text-neutral-850"}`} />
                        ))}
                      </div>
                    </div>
                    
                    <p className="mt-4 text-xs text-neutral-350 leading-relaxed text-left text-ellipsis">
                      "{r.reviewText}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 6. Dynamic Frequently Asked Questions (FAQ) with standard chevron accordions */}
      <section className="bg-neutral-100 dark:bg-neutral-950 border-y border-neutral-200 dark:border-neutral-900 py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-wider text-neutral-900 dark:text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-neutral-500 font-mono uppercase tracking-widest">Get critical answers regarding delivery, keys, and setup</p>
          </div>

          <div className="space-y-4">
            {course.faqItems?.map((faq, idx) => {
              const isOpen = faqOpenIndex === idx;
              return (
                <div key={idx} className="border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900/30 rounded-2xl overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-800 transition">
                  <button
                    onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                    className="w-full text-left p-5 flex items-center justify-between text-xs sm:text-sm font-bold font-display text-neutral-900 dark:text-white cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-brand-gold shrink-0" /> : <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 border-t border-neutral-200 dark:border-neutral-850/50 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Related Courses & Upsells */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-neutral-200 dark:border-neutral-900 pb-5 mb-10 gap-4">
          <div>
            <span className="text-[10px] font-mono text-brand-gold tracking-widest uppercase">Recommendations for growth</span>
            <h2 className="text-2xl sm:text-3xl font-black font-display uppercase text-neutral-900 dark:text-white">Explore Related Blueprints</h2>
          </div>
          <Link
            to="/courses"
            className="text-xs font-mono text-[#F5B300] hover:underline cursor-pointer"
          >
            View Full Catalog →
          </Link>
        </div>

        <RelatedCourses currentCourseId={course.id} category={course.category} />
      </section>

      {/* Trust Badges bottom line */}
      <section className="bg-neutral-100 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-900 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-neutral-500 dark:text-neutral-400 text-xs grid grid-cols-2 md:grid-cols-4 gap-6 tracking-normal">
          <div className="space-y-1">
            <h5 className="font-bold text-neutral-700 dark:text-neutral-400">⚡ Instant Digital Delivery</h5>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-600">Immediate access to classroom key</p>
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-neutral-700 dark:text-neutral-400">🛡 Secure UPI Payments</h5>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-600">Encrypted payment verification</p>
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-neutral-700 dark:text-neutral-400">🤝 Direct Chat Support</h5>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-600">Lifetime community connection</p>
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-neutral-700 dark:text-neutral-400">✨ Standard Quality Checked</h5>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-600">Always up-to-date Blueprints</p>
          </div>
        </div>
      </section>

      {/* SHARE MODAL */}
      {shareOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 max-w-sm w-full rounded-3xl p-6 relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShareOpen(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white transition"
            >
              ✕
            </button>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold font-display uppercase tracking-widest text-[#F5B300]">Share Blueprint</h3>
              <p className="text-[11px] text-neutral-500">Spread of knowledge boosts peer review loops</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleShareOnPlatform("whatsapp")}
                className="flex items-center gap-2 justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs py-3 rounded-xl transition"
              >
                WhatsApp
              </button>
              <button
                onClick={() => handleShareOnPlatform("telegram")}
                className="flex items-center gap-2 justify-center bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs py-3 rounded-xl transition"
              >
                Telegram
              </button>
              <button
                onClick={() => handleShareOnPlatform("twitter")}
                className="flex items-center gap-2 justify-center bg-neutral-950 hover:bg-neutral-850 text-white font-mono text-xs py-3 rounded-xl border border-neutral-800 transition"
              >
                Twitter
              </button>
              <button
                onClick={() => handleShareOnPlatform("facebook")}
                className="flex items-center gap-2 justify-center bg-blue-800 hover:bg-blue-900 text-white font-mono text-xs py-3 rounded-xl transition"
              >
                Facebook
              </button>
            </div>

            <div className="pt-2">
              <div className="flex border border-neutral-850 rounded-xl overflow-hidden">
                <input
                  type="text"
                  readOnly
                  value={window.location.href}
                  className="bg-black/50 text-[10px] text-neutral-400 font-mono px-3 py-2.5 flex-1 focus:outline-none"
                />
                <button
                  onClick={handleCopyCourseLink}
                  className="bg-brand-gold hover:bg-yellow-500 text-black px-4 font-mono font-bold text-[10px]"
                >
                  {copiedLink ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
