import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { SEO } from "./SEO";
import { 
  Sparkles, 
  MapPin, 
  Briefcase, 
  Globe, 
  Youtube, 
  Instagram, 
  Facebook, 
  Linkedin, 
  Send, 
  Award, 
  BookOpen, 
  CheckCircle, 
  ArrowRight, 
  Edit3, 
  X, 
  Loader2, 
  Heart, 
  Star, 
  MessageSquare,
  GraduationCap,
  Calendar,
  Share2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Flame,
  CheckCircle2,
  ShieldAlert
} from "lucide-react";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  addDoc,
  limit,
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface Cheer {
  id: string;
  name: string;
  rating: number;
  message: string;
  createdAt: any;
}

export const StudentPortfolio: React.FC = () => {
  const { 
    selectedStudentUsername, 
    setCurrentPage, 
    user,
    showToast 
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [otherStudents, setOtherStudents] = useState<any[]>([]);
  const [cheers, setCheers] = useState<Cheer[]>([]);
  const [cheerName, setCheerName] = useState("");
  const [cheerRating, setCheerRating] = useState(5);
  const [cheerMsg, setCheerMsg] = useState("");
  const [submittingCheer, setSubmittingCheer] = useState(false);

  // Edit fields State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>({
    fullName: "",
    username: "",
    bio: "",
    location: "India",
    occupation: "",
    skills: "",
    learningGoals: "",
    currentProfession: "",
    websiteUrl: "",
    youtubeUrl: "",
    instagramUrl: "",
    facebookUrl: "",
    linkedinUrl: "",
    telegramUsername: "",
    coursesPurchased: "",
    coursesCompleted: "",
    achievements: "",
    userSuccessStory: "",
    futureGoals: "",
    favoriteLearningTopics: "",
    profilePhoto: ""
  });

  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // 1. Fetch Student Portfolio data on Mount/Username shift
  useEffect(() => {
    if (!selectedStudentUsername) return;
    fetchStudentData(selectedStudentUsername);
    fetchStaticAssets();
  }, [selectedStudentUsername]);

  const fetchStudentData = async (username: string) => {
    setLoading(true);
    try {
      const q = query(collection(db, "student_portfolios"), where("username", "==", username));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data();
        data.id = docSnap.id;
        
        // Handle timestamps
        if (data.updatedAt && typeof data.updatedAt.toDate === "function") {
          data.updatedAt = data.updatedAt.toDate().toISOString();
        }

        setStudent(data);
        
        // Populate edit defaults
        setEditingData({
          fullName: data.fullName || "",
          username: data.username || "",
          bio: data.bio || "",
          location: data.location || "India",
          occupation: data.occupation || "",
          skills: Array.isArray(data.skills) ? data.skills.join(", ") : data.skills || "",
          learningGoals: data.learningGoals || "",
          currentProfession: data.currentProfession || "",
          websiteUrl: data.websiteUrl || "",
          youtubeUrl: data.youtubeUrl || "",
          instagramUrl: data.instagramUrl || "",
          facebookUrl: data.facebookUrl || "",
          linkedinUrl: data.linkedinUrl || "",
          telegramUsername: data.telegramUsername || "",
          coursesPurchased: Array.isArray(data.coursesPurchased) ? data.coursesPurchased.join(", ") : data.coursesPurchased || "",
          coursesCompleted: Array.isArray(data.coursesCompleted) ? data.coursesCompleted.join(", ") : data.coursesCompleted || "",
          achievements: data.achievements || "",
          userSuccessStory: data.userSuccessStory || data.successStory || "",
          futureGoals: data.futureGoals || "",
          favoriteLearningTopics: Array.isArray(data.favoriteLearningTopics) ? data.favoriteLearningTopics.join(", ") : data.favoriteLearningTopics || "",
          profilePhoto: data.profilePhoto || data.photoURL || ""
        });

        // Evaluate ownership
        if (user && user.uid === data.id) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
        }

        // Fetch cheer messages
        fetchCheers(docSnap.id);
      } else {
        // Not found, check if current user is logged in and doesn't have a portfolio yet!
        // We can let them initiate a new portfolio with their logged-in uid!
        if (user && username === user.displayName?.toLowerCase().replace(/\s+/g, "-")) {
          initiateNewPortfolioForUser();
        } else {
          setStudent(null);
        }
      }
    } catch (err) {
      console.error("Error retrieving student profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const initiateNewPortfolioForUser = async () => {
    if (!user) return;
    const defaultData = {
      fullName: user.displayName || "New Student",
      username: user.displayName?.toLowerCase().replace(/\s+/g, "-") || "student-" + user.uid.substring(0, 5),
      bio: "Learning high-income digital tech skills to accelerate career trajectory.",
      location: "India",
      occupation: "Aspiring Tech Creator",
      skills: ["AI-Tools", "Video Editing"],
      learningGoals: "Complete all marketing and production classes.",
      currentProfession: "Student",
      blogStatus: "Draft",
      updatedAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, "student_portfolios", user.uid), defaultData);
      setStudent({ id: user.uid, ...defaultData });
      setIsOwner(true);
      showToast("Initialized your public portfolio!", "success");
    } catch (err) {
      console.error("Failed to bootstrap portfolio:", err);
    }
  };

  const fetchCheers = async (studentId: string) => {
    const path = `student_portfolios/${studentId}/cheers`;
    try {
      const collRef = collection(db, "student_portfolios", studentId, "cheers");
      const snap = await getDocs(query(collRef, limit(20)));
      const cheersList: Cheer[] = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Cheer[];
      setCheers(cheersList);
    } catch (err) {
      console.error("Failed to load cheerleader feedback:", err);
      handleFirestoreError(err, OperationType.LIST, path);
    }
  };

  const fetchStaticAssets = async () => {
    try {
      // 1. Fetch courses
      const courseSnap = await getDocs(collection(db, "courses"));
      setCourses(courseSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // 2. Fetch other published student stories to make internal cross-linking seamless
      const studentsSnap = await getDocs(query(collection(db, "student_portfolios"), limit(6)));
      setOtherStudents(studentsSnap.docs.map(d => d.data()).filter(s => s.username !== selectedStudentUsername));
    } catch (err) {
      console.error("Error loading supplementary courses catalog:", err);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditingData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        showToast("Image size exceeds 1.5MB threshold. Please upload a compressed avatar.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingData(prev => ({ ...prev, profilePhoto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const submitCheerBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cheerName.trim() || !cheerMsg.trim()) return;

    setSubmittingCheer(true);
    const path = `student_portfolios/${student.id}/cheers`;
    try {
      const payload = {
        name: cheerName.trim(),
        rating: cheerRating,
        message: cheerMsg.trim(),
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "student_portfolios", student.id, "cheers"), payload);
      setCheers(prev => [payload as any, ...prev]);
      setCheerName("");
      setCheerMsg("");
      showToast("Thank you for your warm endorsement!", "success");
    } catch (err) {
      showToast("Cheer failed to post. Try again in a bit.", "error");
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setSubmittingCheer(false);
    }
  };

  // 2. Generate Professional long-form Success Story using Server-Side Gemini Route
  const generateSuccessStory = async () => {
    setGenerating(true);
    try {
      const payload = {
        fullName: editingData.fullName,
        username: editingData.username,
        bio: editingData.bio,
        location: editingData.location,
        occupation: editingData.occupation,
        skills: editingData.skills.split(",").map((s: string) => s.trim()).filter(Boolean),
        learningGoals: editingData.learningGoals,
        currentProfession: editingData.currentProfession,
        websiteUrl: editingData.websiteUrl,
        youtubeUrl: editingData.youtubeUrl,
        instagramUrl: editingData.instagramUrl,
        facebookUrl: editingData.facebookUrl,
        linkedinUrl: editingData.linkedinUrl,
        telegramUsername: editingData.telegramUsername,
        coursesPurchased: editingData.coursesPurchased.split(",").map((s: string) => s.trim()).filter(Boolean),
        coursesCompleted: editingData.coursesCompleted.split(",").map((s: string) => s.trim()).filter(Boolean),
        achievements: editingData.achievements,
        userSuccessStory: editingData.userSuccessStory,
        futureGoals: editingData.futureGoals,
        favoriteLearningTopics: editingData.favoriteLearningTopics.split(",").map((s: string) => s.trim()).filter(Boolean)
      };

      const res = await fetch("/api/generate-success-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to contact generator backend.");
      }

      const generatedArticle = await res.json();

      setEditingData(prev => ({
        ...prev,
        aiBlogTitle: generatedArticle.title,
        aiBlogContent: generatedArticle.content,
        metaDescription: generatedArticle.metaDescription,
        seoKeywords: generatedArticle.seoKeywords,
        aiBlogFeaturedImage: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200"
      }));

      // Set state preview right inside the form
      showToast("Success story drafted cleanly! Retouch or click 'Save Portfolio'.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to generate story draft. Please verify Gemini API setup.", "error");
    } finally {
      setGenerating(false);
    }
  };

  // 3. Save to Firestore
  const savePortfolio = async () => {
    setSaving(true);
    try {
      const usernameClean = editingData.username.toLowerCase().replace(/[^a-z0-9_-]/g, "");
      
      // Check username conflicts (excluding their own doc)
      const conflictSnap = await getDocs(
        query(collection(db, "student_portfolios"), where("username", "==", usernameClean))
      );
      
      const isTaken = conflictSnap.docs.some(doc => doc.id !== student.id);
      if (isTaken) {
        showToast("Error: Username is already claimed by another student.", "error");
        setSaving(false);
        return;
      }

      const updatedPayload = {
        fullName: editingData.fullName.trim(),
        username: usernameClean,
        bio: editingData.bio.trim(),
        location: editingData.location.trim(),
        occupation: editingData.occupation.trim(),
        skills: editingData.skills.split(",").map((s: string) => s.trim()).filter(Boolean),
        learningGoals: editingData.learningGoals.trim(),
        currentProfession: editingData.currentProfession.trim(),
        websiteUrl: editingData.websiteUrl.trim(),
        youtubeUrl: editingData.youtubeUrl.trim(),
        instagramUrl: editingData.instagramUrl.trim(),
        facebookUrl: editingData.facebookUrl.trim(),
        linkedinUrl: editingData.linkedinUrl.trim(),
        telegramUsername: editingData.telegramUsername.trim(),
        coursesPurchased: editingData.coursesPurchased.split(",").map((s: string) => s.trim()).filter(Boolean),
        coursesCompleted: editingData.coursesCompleted.split(",").map((s: string) => s.trim()).filter(Boolean),
        achievements: editingData.achievements.trim(),
        userSuccessStory: editingData.userSuccessStory.trim(),
        futureGoals: editingData.futureGoals.trim(),
        favoriteLearningTopics: editingData.favoriteLearningTopics.split(",").map((s: string) => s.trim()).filter(Boolean),
        profilePhoto: editingData.profilePhoto,
        
        // Success story fields
        aiBlogTitle: editingData.aiBlogTitle || student.aiBlogTitle || "",
        aiBlogContent: editingData.aiBlogContent || student.aiBlogContent || "",
        metaDescription: editingData.metaDescription || student.metaDescription || "",
        seoKeywords: editingData.seoKeywords || student.seoKeywords || "",
        aiBlogFeaturedImage: editingData.aiBlogFeaturedImage || student.aiBlogFeaturedImage || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200",
        
        // Preserve or trigger blog review
        blogStatus: student.blogStatus || "Draft",
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, "student_portfolios", student.id), updatedPayload, { merge: true });
      setIsEditOpen(false);
      showToast("Portfolio successfully updated!", "success");
      
      // Hot reload student state
      fetchStudentData(usernameClean);
    } catch (err: any) {
      showToast("Firestore write failed. Please check rules.", "error");
    } finally {
      setSaving(false);
    }
  };

  const submitForReview = async () => {
    if (!student.aiBlogContent) {
      showToast("Cannot submit: Please generate the success story block first.", "error");
      return;
    }
    try {
      await setDoc(doc(db, "student_portfolios", student.id), { blogStatus: "Pending Review" }, { merge: true });
      setStudent(prev => ({ ...prev, blogStatus: "Pending Review" }));
      showToast("Success story submitted to administrators for review!", "success");
    } catch (e) {
      showToast("Submission write error.", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070707] text-white flex flex-col justify-center items-center py-24 px-6 font-sans">
        <Loader2 className="w-12 h-12 text-brand-gold animate-spin mb-4" />
        <p className="text-sm font-mono text-neutral-400">LOADING STUDENT PLATFORM PORTFOLIO...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-[#070707] text-white flex flex-col justify-center items-center py-24 px-6 text-center font-sans">
        <div className="max-w-md bg-[#0f0f0f] border border-neutral-800 p-8 rounded-3xl space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center mx-auto text-neutral-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white font-display">Portfolio Not Found</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              The portfolio user handle "{selectedStudentUsername}" has not yet been registered or set up in the Learn 2 Future database registry.
            </p>
          </div>
          <button
            onClick={() => setCurrentPage("home")}
            className="w-full bg-brand-gold hover:bg-[#F5B300]/90 text-black font-semibold uppercase tracking-wider text-xs py-3.5 px-6 rounded-xl transition"
          >
            Back to Home Base
          </button>
        </div>
      </div>
    );
  }

  // Generate SEO tags for live page
  const pageTitle = student.aiBlogTitle 
    ? `${student.aiBlogTitle} | ${student.fullName}'s Success Story`
    : `${student.fullName} - ${student.occupation || "Alumni"} Portfolio | Learn 2 Future`;
  const pageDesc = student.metaDescription || `Read the official Learn 2 Future portfolio and AI transformation journal of ${student.fullName}.`;
  const pageImg = student.aiBlogFeaturedImage || student.profilePhoto || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200";

  return (
    <div className="min-h-screen bg-[#070707] text-white pb-24 relative overflow-hidden font-sans">
      
      {/* Client-Side React SPA SEO Synchronizer */}
      <SEO 
        title={pageTitle}
        description={pageDesc}
        image={pageImg}
        url={`https://learn2future.vercel.app/student/${student.username}`}
        keywords={student.seoKeywords || "student, alumni, digital skills, portfolio"}
        canonicalUrl={`https://learn2future.vercel.app/student/${student.username}`}
        type="article"
      />

      {/* Decorative Blur Spheres */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-gold/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full filter blur-[100px] pointer-events-none" />

      {/* 1. ADMIN / OWNER NOTIFICATION RIBBON */}
      {isOwner && (
        <div className="bg-brand-gold/10 border-b border-brand-gold/30 text-brand-gold py-3.5 px-4 sticky top-0 z-40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-sm">
              <Sparkles className="w-5 h-5 animate-pulse shrink-0" />
              <p className="font-medium text-xs md:text-sm">
                You are viewing your <strong>Official Public Portfolio Portal</strong>.
                <span className="hidden md:inline ml-2 text-neutral-400">
                  Reflect edits in real-time or request reviews below.
                </span>
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 w-full md:w-auto">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase ${
                student.blogStatus === "Published" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                student.blogStatus === "Approved" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                student.blogStatus === "Pending Review" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse" :
                student.blogStatus === "Rejected" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                "bg-neutral-800 text-neutral-400 border border-neutral-700"
              }`}>
                Story: {student.blogStatus || "Draft"}
              </span>

              <button
                onClick={() => setIsEditOpen(true)}
                className="inline-flex items-center space-x-1.5 bg-brand-gold hover:bg-[#F5B300] text-black font-semibold text-xs py-2 px-4 rounded-lg transition active:scale-95 shadow-md shadow-brand-gold/10"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Customize Portfolio</span>
              </button>

              {student.blogStatus === "Draft" && (
                <button
                  onClick={submitForReview}
                  className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 hover:border-brand-gold/40 text-white font-mono text-[10px] uppercase font-bold tracking-wider py-2 px-3.5 rounded-lg transition"
                >
                  Request Story Publish
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. STUDENT MAIN HEADER HEADER */}
      <div className="max-w-7xl mx-auto px-4 mt-12 md:mt-16">
        <div className="bg-[#0f0f0f] border border-neutral-900 rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 grow">
              {/* Photo */}
              <div className="shrink-0 relative">
                {student.profilePhoto || student.photoURL ? (
                  <img 
                    src={student.profilePhoto || student.photoURL} 
                    alt={student.fullName} 
                    className="w-28 h-28 md:w-36 md:h-36 rounded-2xl object-cover border-2 border-brand-gold/40 shadow-xl shadow-black/80"
                  />
                ) : (
                  <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-brand-gold font-bold text-4xl shadow-xl">
                    {student.fullName?.charAt(0) || "S"}
                  </div>
                )}
                
                <div className="absolute -bottom-2 -right-2 bg-brand-gold text-black px-2 py-0.5 rounded-md font-mono text-[9px] uppercase font-bold shadow-lg tracking-wide">
                  Verified Alumni
                </div>
              </div>

              {/* Identity details */}
              <div className="text-center md:text-left space-y-3.5 grow">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                    <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white font-display">
                      {student.fullName}
                    </h1>
                  </div>
                  <p className="text-brand-gold font-mono text-sm tracking-wider flex items-center justify-center md:justify-start gap-1.5 uppercase">
                    <Briefcase className="w-4 h-4 shrink-0" />
                    <span>{student.occupation || "Certified Professional"}</span>
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
                  {student.bio || "No biography details specified yet by the portfolio owner."}
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-mono text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                    <span>{student.location || "India"}</span>
                  </div>
                  <div className="hidden sm:inline-block">|</div>
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                    <span>Current Profession: {student.currentProfession || "Student"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Connection badging */}
            <div className="shrink-0 max-w-xs w-full lg:w-auto bg-neutral-950/80 border border-neutral-900 p-5 rounded-2xl text-center lg:text-left space-y-4">
              <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">Secure Alumni Link Board</span>
              <div className="flex flex-wrap lg:grid lg:grid-cols-2 gap-2.5">
                {student.websiteUrl && (
                  <a href={student.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center lg:justify-start gap-2 py-2 px-3 bg-neutral-900 hover:bg-neutral-850 hover:border-brand-gold border border-neutral-800 rounded-xl text-neutral-300 hover:text-white transition-colors text-xs font-mono">
                    <Globe className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                    <span>Website</span>
                  </a>
                )}
                {student.youtubeUrl && (
                  <a href={student.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center lg:justify-start gap-2 py-2 px-3 bg-neutral-900 hover:bg-neutral-850 hover:border-brand-gold border border-neutral-800 rounded-xl text-neutral-300 hover:text-white transition-colors text-xs font-mono">
                    <Youtube className="w-3.5 h-3.5 text-red-550 shrink-0" />
                    <span>YouTube</span>
                  </a>
                )}
                {student.instagramUrl && (
                  <a href={student.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center lg:justify-start gap-2 py-2 px-3 bg-neutral-900 hover:bg-neutral-850 hover:border-brand-gold border border-neutral-800 rounded-xl text-neutral-300 hover:text-white transition-colors text-xs font-mono">
                    <Instagram className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Instagram</span>
                  </a>
                )}
                {student.facebookUrl && (
                  <a href={student.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center lg:justify-start gap-2 py-2 px-3 bg-neutral-900 hover:bg-neutral-850 hover:border-brand-gold border border-neutral-800 rounded-xl text-neutral-300 hover:text-white transition-colors text-xs font-mono">
                    <Facebook className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Facebook</span>
                  </a>
                )}
                {student.linkedinUrl && (
                  <a href={student.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center lg:justify-start gap-2 py-2 px-3 bg-neutral-900 hover:bg-neutral-850 hover:border-brand-gold border border-neutral-800 rounded-xl text-neutral-300 hover:text-white transition-colors text-xs font-mono">
                    <Linkedin className="w-3.5 h-3.5 text-blue-450 shrink-0" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {student.telegramUsername && (
                  <a href={`https://t.me/${student.telegramUsername.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center lg:justify-start gap-2 py-2 px-3 bg-neutral-900 hover:bg-neutral-850 hover:border-brand-gold border border-neutral-800 rounded-xl text-neutral-300 hover:text-white transition-colors text-xs font-mono">
                    <Send className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                    <span>Telegram</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CORE COOPERATIVE GRID */}
      <div className="max-w-7xl mx-auto px-4 mt-8 md:mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SIDEBAR BLOCK (1 COLUMN) */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* SKILLS BOX */}
          <div className="bg-[#0f0f0f] border border-neutral-900 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 font-display">
              <TrendingUp className="w-4.5 h-4.5 text-brand-gold" />
              <span>Verified Specialties</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(student.skills) && student.skills.length > 0 ? (
                student.skills.map((skill: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-neutral-900/80 hover:bg-brand-gold/10 border border-neutral-800 text-[11px] font-mono hover:text-brand-gold text-neutral-300 rounded-lg transition-colors cursor-default">
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-xs text-neutral-500 font-mono">No skills specified.</p>
              )}
            </div>
          </div>

          {/* ACHIEVEMENTS BOX */}
          <div className="bg-[#0f0f0f] border border-neutral-900 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 font-display">
              <Award className="w-4.5 h-4.5 text-brand-gold" />
              <span>Milestones & Wins</span>
            </h3>
            <div className="space-y-3.5 text-xs text-neutral-400">
              {student.achievements ? (
                <p className="bg-neutral-950/80 p-4 border border-neutral-900 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {student.achievements}
                </p>
              ) : (
                <p className="text-xs text-neutral-500 font-mono">No milestones set up yet.</p>
              )}
            </div>
          </div>

          {/* COURSES LINK BOARD (Internal Tracking Conversion Grid) */}
          <div className="bg-[#0f0f0f] border border-neutral-900 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 font-display">
              <BookOpen className="w-4.5 h-4.5 text-brand-gold" />
              <span>Learn 2 Future Curriculums</span>
            </h3>
            
            <div className="space-y-4">
              {/* Enrolled */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-neutral-550 uppercase font-bold tracking-widest">Enrolled Courses</span>
                <div className="space-y-2">
                  {Array.isArray(student.coursesPurchased) && student.coursesPurchased.length > 0 ? (
                    student.coursesPurchased.map((c: string, idx: number) => (
                      <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-neutral-950/80 border border-neutral-900/60 rounded-xl">
                        <div className="flex items-center gap-2 grow min-w-0">
                          <div className="w-1.5 h-1.5 bg-brand-gold rounded-full shrink-0 animate-pulse" />
                          <span className="text-xs font-medium text-neutral-300 truncate">{c}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-neutral-600 font-mono pl-1">None declared.</p>
                  )}
                </div>
              </div>

              {/* Completed */}
              <div className="space-y-2 pt-2 border-t border-neutral-900/60">
                <span className="text-[10px] font-mono text-neutral-550 uppercase font-bold tracking-widest">Completed & Certified</span>
                <div className="space-y-2">
                  {Array.isArray(student.coursesCompleted) && student.coursesCompleted.length > 0 ? (
                    student.coursesCompleted.map((c: string, idx: number) => (
                      <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-green-500/5 border border-green-500/10 rounded-xl">
                        <div className="flex items-center gap-2 grow min-w-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          <span className="text-xs font-semibold text-green-300 truncate">{c}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-neutral-600 font-mono pl-1">No completions declared yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ROADMAP TARGETS */}
          <div className="bg-[#0f0f0f] border border-neutral-900 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 font-display">
              <Flame className="w-4.5 h-4.5 text-brand-gold" />
              <span>Future Roadmaps</span>
            </h3>
            <p className="text-xs leading-relaxed text-neutral-400 whitespace-pre-wrap">
              {student.futureGoals || "Preparing core future digital horizons..."}
            </p>
          </div>

        </div>

        {/* MAIN PROFILE STORY & ADVERTS (2 COLUMNS) */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* WORKFLOW BLOCKED BLOCK (IF THE STORY IS IN REVIEW) */}
          {student.blogStatus !== "Published" && !isOwner && (
            <div className="p-6 bg-[#0f0f0f] border border-neutral-900 rounded-2xl text-center space-y-3">
              <Sparkles className="w-8 h-8 text-neutral-600 mx-auto animate-pulse" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Alumni Story Pending</h4>
                <p className="text-xs text-neutral-450 max-w-md mx-auto leading-relaxed">
                  The long-form AI Success Story biography is currently in Draft or Pending Review status and will appear once approved by editors.
                </p>
              </div>
            </div>
          )}

          {/* SHOW AI SUCCESS STORY BIOGRAPHY (If Published or viewed by owner) */}
          {(student.blogStatus === "Published" || isOwner) && student.aiBlogContent ? (
            <div className="bg-[#0f0f0f] border border-neutral-900 rounded-3xl p-6 sm:p-10 space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-5">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-brand-gold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    <span>AI SUCCESS STORY BIOGRAPHY (Phase 3)</span>
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
                    {student.aiBlogTitle || `${student.fullName}'s Success Blueprint`}
                  </h2>
                </div>
              </div>

              {/* Verified Author tag */}
              <div className="flex items-center gap-3 bg-neutral-950 p-4 border border-neutral-900 rounded-2xl">
                <div className="w-2.5 h-2.5 bg-green-550 rounded-full animate-ping" />
                <p className="text-xs text-neutral-405 leading-relaxed">
                  Draft generated via verified Learn 2 Future telemetry variables. Reviewed and authorized for dynamic search indexing.
                </p>
              </div>

              {/* MARKDOWN RENDERER */}
              <div className="prose prose-invert prose-brand text-xs sm:text-sm text-neutral-300 leading-relaxed tracking-normal max-w-none">
                <MarkdownRenderer content={student.aiBlogContent} />
              </div>

              {/* DYNAMIC PROMOTION BLOCK (Controlled from Settings, satisfying Phase 4 / Phase 8 metrics) */}
              <div className="border-t border-neutral-900 pt-8 mt-10">
                <div className="bg-gradient-to-br from-neutral-950 to-[#0f0f0f] border-2 border-brand-gold/30 rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full blur-2xl" />
                  
                  <div className="space-y-1.5 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1 text-[9px] font-mono tracking-widest text-brand-gold uppercase bg-brand-gold/10 px-2.5 py-1 border border-brand-gold/20 rounded-md">
                      <span>SPECIAL INVITATION</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white font-display">Want to duplicate {student.fullName}'s success?</h3>
                    <p className="text-xs text-neutral-400 max-w-lg">
                      Join Learn 2 Future today. Grab lifetime access to the exact industry-tier digital bootcamps {student.fullName} mastered.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-neutral-900 border border-neutral-850 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wide">Featured Catalyst Course</span>
                      <p className="font-bold text-xs text-brand-gold truncate">AI Tools Blueprint Masterclass</p>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-850 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wide">Alumni Referral Bonus Code</span>
                      <p className="font-mono font-bold text-xs text-white">L2F-SUCCESS-30</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>Verified Alumni Referral Link active</span>
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage("courses")}
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-brand-gold hover:bg-[#F5B300] text-black font-bold uppercase tracking-wider text-[11px] py-3.5 px-6 rounded-xl transition shadow-lg shadow-brand-gold/15 active:scale-95"
                    >
                      <span>Claim 30% Off Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            student.aiBlogContent && (
              <div className="bg-[#0f0f0f] border border-neutral-900 rounded-3xl p-8 text-center space-y-3">
                <Sparkles className="w-10 h-10 text-neutral-700 mx-auto animate-pulse" />
                <h4 className="font-bold text-white">AI success biography is being generated...</h4>
              </div>
            )
          )}

          {/* 4. OTHER STORIES LINKING PANEL (Satisfies Phase 8 Internal Linking Grid) */}
          <div className="bg-[#0f0f0f] border border-neutral-900 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 font-display uppercase">
              <Share2 className="w-4 h-4 text-brand-gold" />
              <span>Related Student Transformations</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {otherStudents.length > 0 ? (
                otherStudents.map((st: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage("student-portfolio", st.username)}
                    className="flex items-center gap-3 text-left p-3.5 bg-neutral-950 hover:bg-neutral-900/60 border border-neutral-900 hover:border-brand-gold/30 rounded-xl transition group"
                  >
                    {st.profilePhoto || st.photoURL ? (
                      <img 
                        src={st.profilePhoto || st.photoURL} 
                        alt={st.fullName} 
                        className="w-10 h-10 rounded-lg object-cover border border-neutral-800 shrink-0" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-brand-gold text-xs font-bold shrink-0">
                        {st.fullName?.charAt(0) || "S"}
                      </div>
                    )}
                    <div className="grow min-w-0">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-brand-gold transition-colors">{st.fullName}</h4>
                      <p className="text-[10px] text-neutral-500 font-mono truncate">{st.occupation || "Certified Student"}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-brand-gold transition-transform group-hover:translate-x-1 shrink-0" />
                  </button>
                ))
              ) : (
                <p className="text-xs text-neutral-600 font-mono">No other students registered yet.</p>
              )}
            </div>
          </div>

          {/* 5. VISITOR CHEER BOARD / TESTIMONIAL GRID */}
          <div className="bg-[#0f0f0f] border border-neutral-900 rounded-2xl p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 font-display uppercase">
                <MessageSquare className="w-4 h-4 text-brand-gold" />
                <span>Alumni Cheer & Endorsement Board</span>
              </h3>
              <p className="text-xs text-neutral-500">Leave an encouraging rating or professional endorsement for {student.fullName}!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Submission Form */}
              <form onSubmit={submitCheerBoard} className="space-y-3.5 bg-neutral-950 p-4 border border-neutral-900 rounded-xl text-xs">
                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium font-mono text-[10px] uppercase">Your Name</label>
                  <input 
                    type="text" 
                    required
                    value={cheerName}
                    onChange={e => setCheerName(e.target.value)}
                    placeholder="E.g., Coach Priya"
                    className="w-full bg-neutral-900 border border-neutral-850 px-3.5 py-2.5 rounded-lg outline-none focus:border-brand-gold text-white" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium font-mono text-[10px] uppercase">Rating / Score</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button 
                        type="button" 
                        key={s}
                        onClick={() => setCheerRating(s)}
                        className="p-1 focus:outline-none"
                      >
                        <Star className={`w-5 h-5 ${s <= cheerRating ? "fill-brand-gold text-brand-gold" : "text-neutral-700"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium font-mono text-[10px] uppercase">Words of Support</label>
                  <textarea 
                    required
                    rows={2}
                    value={cheerMsg}
                    onChange={e => setCheerMsg(e.target.value)}
                    placeholder="Inspirational words or endorsement notes..."
                    className="w-full bg-neutral-900 border border-neutral-850 px-3.5 py-2.5 rounded-lg outline-none focus:border-brand-gold text-white"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submittingCheer}
                  className="w-full bg-neutral-900 hover:bg-neutral-850 hover:border-brand-gold/65 border border-neutral-800 text-[10px] uppercase tracking-wider text-white font-bold py-2.5 px-4 rounded-lg transition"
                >
                  {submittingCheer ? "Submitting..." : "Post support"}
                </button>
              </form>

              {/* Endorsements List */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {cheers.length > 0 ? (
                  cheers.map((ch, idx) => (
                    <div key={idx} className="bg-neutral-950 p-4 border border-neutral-900 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{ch.name}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: ch.rating || 5 }).map((_, sIdx) => (
                            <Star key={sIdx} className="w-3 h-3 fill-brand-gold text-brand-gold" />
                          ))}
                        </div>
                      </div>
                      <p className="text-neutral-400 leading-relaxed text-[11px] italic">"{ch.message}"</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-neutral-600 font-mono text-xs">
                    Be the first to leave an encouraging support cheer!
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* 6. DYNAMIC EDIT PORTFOLIO REGISTRATION MODAL (Only Owner) */}
      {isOwner && isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#0f0f0f] border border-neutral-800 max-w-3xl w-full rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6 text-sm">
            
            <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-brand-gold uppercase tracking-wider">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Interactive Alumni Portfolio Manager</span>
                </span>
                <h3 className="text-lg md:text-xl font-bold font-display text-white">Customize Public Identity variables</h3>
              </div>
              <button 
                onClick={() => setIsEditOpen(false)}
                className="text-neutral-550 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Photo Upload */}
              <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-neutral-950 p-4 rounded-xl border border-neutral-900/80">
                {editingData.profilePhoto ? (
                  <img 
                    src={editingData.profilePhoto} 
                    alt="Preview" 
                    className="w-16 h-16 rounded-lg object-cover border border-brand-gold/40 shrink-0" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 font-bold shrink-0">
                    Pic
                  </div>
                )}
                <div className="space-y-1 grow w-full">
                  <label className="block text-neutral-400 font-medium font-mono text-[10px] uppercase">Profile Avatar Pic</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="text-xs text-neutral-450 block w-full file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-mono file:font-semibold file:bg-neutral-850 file:text-white hover:file:bg-brand-gold hover:file:text-black cursor-pointer file:cursor-pointer" 
                  />
                </div>
              </div>

              {/* Full name */}
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium font-mono text-[10px] uppercase">Authorized Full Name</label>
                <input 
                  type="text" 
                  name="fullName"
                  required
                  value={editingData.fullName}
                  onChange={handleEditChange}
                  className="w-full bg-neutral-905 border border-neutral-850 px-3.5 py-2.5 rounded-lg outline-none focus:border-brand-gold text-white" 
                />
              </div>

              {/* Username SEO */}
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium font-mono text-[10px] uppercase">SEO SEO-Friendly Username (e.g., lakash-jaani)</label>
                <input 
                  type="text" 
                  name="username"
                  required
                  value={editingData.username}
                  onChange={handleEditChange}
                  placeholder="name-surname"
                  className="w-full bg-neutral-905 border border-neutral-850 px-3.5 py-2.5 rounded-lg outline-none focus:border-brand-gold text-white font-mono text-xs" 
                />
              </div>

              {/* Bio */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-neutral-400 font-medium font-mono text-[10px] uppercase">Professional Short Bio</label>
                <textarea 
                  name="bio"
                  rows={2}
                  value={editingData.bio}
                  onChange={handleEditChange}
                  className="w-full bg-neutral-905 border border-neutral-850 px-3.5 py-2.5 rounded-lg outline-none focus:border-brand-gold text-white" 
                />
              </div>

              {/* Occupation */}
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium font-mono text-[10px] uppercase">Occupation / Specialization</label>
                <input 
                  type="text" 
                  name="occupation"
                  value={editingData.occupation}
                  onChange={handleEditChange}
                  placeholder="Digital Marketer / Creator"
                  className="w-full bg-neutral-905 border border-neutral-850 px-3.5 py-2.5 rounded-lg outline-none focus:border-brand-gold text-white" 
                />
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium font-mono text-[10px] uppercase">Location</label>
                <input 
                  type="text" 
                  name="location"
                  value={editingData.location}
                  onChange={handleEditChange}
                  className="w-full bg-neutral-905 border border-neutral-850 px-3.5 py-2.5 rounded-lg outline-none focus:border-brand-gold text-white" 
                />
              </div>

              {/* Skills */}
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium font-mono text-[10px] uppercase">Skills (Comma-separated)</label>
                <input 
                  type="text" 
                  name="skills"
                  value={editingData.skills}
                  onChange={handleEditChange}
                  placeholder="AI Tools, Prompt Engineering, YouTube Growth"
                  className="w-full bg-neutral-905 border border-neutral-850 px-3.5 py-2.5 rounded-lg outline-none focus:border-brand-gold text-white" 
                />
              </div>

              {/* Current Profession */}
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium font-mono text-[10px] uppercase">Current Profession</label>
                <input 
                  type="text" 
                  name="currentProfession"
                  value={editingData.currentProfession}
                  onChange={handleEditChange}
                  placeholder="Freelancer, Entrepreneur, etc."
                  className="w-full bg-neutral-905 border border-neutral-850 px-3.5 py-2.5 rounded-lg outline-none focus:border-brand-gold text-white" 
                />
              </div>

              {/* Achievements */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-neutral-400 font-medium font-mono text-[10px] uppercase">Achievements / Industry Milestones</label>
                <textarea 
                  name="achievements"
                  rows={2}
                  value={editingData.achievements}
                  onChange={handleEditChange}
                  placeholder="E.g., Closed 3 freelance clients using high-speed prompt models."
                  className="w-full bg-neutral-905 border border-neutral-850 px-3.5 py-2.5 rounded-lg outline-none focus:border-brand-gold text-white" 
                />
              </div>

              {/* Future Goals */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-neutral-400 font-medium font-mono text-[10px] uppercase">Future Horizon & Roadmap Goals</label>
                <textarea 
                  name="futureGoals"
                  rows={2}
                  value={editingData.futureGoals}
                  onChange={handleEditChange}
                  placeholder="E.g., Scaled my creator business to 10k subscribers with automated editing lines."
                  className="w-full bg-neutral-905 border border-neutral-850 px-3.5 py-2.5 rounded-lg outline-none focus:border-brand-gold text-white" 
                />
              </div>

              {/* Social URLs */}
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium font-mono text-[10px] uppercase">Website Block URL</label>
                <input 
                  type="url" 
                  name="websiteUrl"
                  value={editingData.websiteUrl}
                  onChange={handleEditChange}
                  placeholder="https://myblogsite.com"
                  className="w-full bg-neutral-905 border border-neutral-850 px-3.5 py-2.5 rounded-lg outline-none focus:border-brand-gold text-white text-xs font-mono" 
                />
              </div>

              {/* Youtube URL */}
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium font-mono text-[10px] uppercase">YouTube Channel URL</label>
                <input 
                  type="url" 
                  name="youtubeUrl"
                  value={editingData.youtubeUrl}
                  onChange={handleEditChange}
                  placeholder="https://youtube.com/@channel"
                  className="w-full bg-neutral-905 border border-neutral-850 px-3.5 py-2.5 rounded-lg outline-none focus:border-brand-gold text-white text-xs font-mono" 
                />
              </div>

              {/* Instagram URL */}
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium font-mono text-[10px] uppercase">Instagram Profile URL</label>
                <input 
                  type="url" 
                  name="instagramUrl"
                  value={editingData.instagramUrl}
                  onChange={handleEditChange}
                  className="w-full bg-neutral-905 border border-neutral-850 px-3.5 py-2.5 rounded-lg outline-none focus:border-brand-gold text-white text-xs font-mono" 
                />
              </div>

              {/* LinkedIn URL */}
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium font-mono text-[10px] uppercase">LinkedIn Handle URL</label>
                <input 
                  type="url" 
                  name="linkedinUrl"
                  value={editingData.linkedinUrl}
                  onChange={handleEditChange}
                  className="w-full bg-neutral-905 border border-neutral-850 px-3.5 py-2.5 rounded-lg outline-none focus:border-brand-gold text-white text-xs font-mono" 
                />
              </div>

              {/* Telegram Handle */}
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium font-mono text-[10px] uppercase">Telegram Handle username</label>
                <input 
                  type="text" 
                  name="telegramUsername"
                  value={editingData.telegramUsername}
                  onChange={handleEditChange}
                  placeholder="@username"
                  className="w-full bg-neutral-905 border border-neutral-850 px-3.5 py-2.5 rounded-lg outline-none focus:border-brand-gold text-white text-xs font-mono" 
                />
              </div>

              {/* Favorite Learning Topics */}
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium font-mono text-[10px] uppercase">Favorite Topics (Comma-separated)</label>
                <input 
                  type="text" 
                  name="favoriteLearningTopics"
                  value={editingData.favoriteLearningTopics}
                  onChange={handleEditChange}
                  placeholder="Prompting, Video Editing, AI Automations"
                  className="w-full bg-neutral-905 border border-neutral-850 px-3.5 py-2.5 rounded-lg outline-none focus:border-brand-gold text-white" 
                />
              </div>

              {/* ENROLLED / COMPLETED COURSES */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-neutral-900 pt-4">
                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium font-mono text-[10px] uppercase">Courses Enrolled (Comma-separated name list)</label>
                  <input 
                    type="text" 
                    name="coursesPurchased"
                    value={editingData.coursesPurchased}
                    onChange={handleEditChange}
                    placeholder="AI Tools Blueprint Masterclass, YouTube Growth Secrets"
                    className="w-full bg-neutral-905 border border-neutral-850 px-3.5 py-2.5 rounded-lg outline-none focus:border-brand-gold text-white text-xs" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium font-mono text-[10px] uppercase">Courses Completed (Comma-separated name list)</label>
                  <input 
                    type="text" 
                    name="coursesCompleted"
                    value={editingData.coursesCompleted}
                    onChange={handleEditChange}
                    placeholder="AI Tools Blueprint Masterclass"
                    className="w-full bg-neutral-905 border border-neutral-850 px-3.5 py-2.5 rounded-lg outline-none focus:border-brand-gold text-white text-xs" 
                  />
                </div>
              </div>

              {/* RAW PERSPECTIVE STORY INJECTION FOR GEMINI */}
              <div className="md:col-span-2 space-y-1.5 border-t border-neutral-900 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-brand-gold font-bold font-mono text-[10px] uppercase tracking-wide flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 animate-pulse" />
                    <span>Raw Success Story Perspective (Gemini Blueprint Source)</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateSuccessStory}
                    disabled={generating || !editingData.fullName || !editingData.userSuccessStory}
                    className="inline-flex items-center space-x-1.5 bg-neutral-900 hover:bg-neutral-850 hover:border-brand-gold/60 border border-neutral-800 text-brand-gold text-[10px] tracking-wide uppercase font-bold px-3.5 py-2 rounded-lg transition disabled:opacity-30"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>AI Generating story (1500-3000 words)...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Compile AI success story</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea 
                  name="userSuccessStory"
                  required
                  rows={4}
                  value={editingData.userSuccessStory}
                  onChange={handleEditChange}
                  placeholder="Share details about your background, the challenges you faced with tech friction, how Learn 2 Future courses helped you, what specific skills you mastered, and your future ambitions..."
                  className="w-full bg-neutral-905 border border-neutral-850 px-3.5 py-2.5 rounded-lg outline-none focus:border-brand-gold text-white text-xs leading-relaxed" 
                />
              </div>

              {/* AI BLOG STATE VIEW (If draft is prepared) */}
              {editingData.aiBlogContent && (
                <div className="md:col-span-2 bg-neutral-950 p-4 border border-brand-gold/20 rounded-xl space-y-3">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">AI SUCCESS STORY BIOGRAPHY DRAFT SUMMARY</span>
                  <div className="space-y-1 text-xs">
                    <p className="text-white"><strong>Draft Title:</strong> {editingData.aiBlogTitle}</p>
                    <p className="text-neutral-400"><strong>Meta Description:</strong> {editingData.metaDescription}</p>
                    <p className="text-neutral-500 font-mono text-[11px]"><strong>SEO Keywords:</strong> {editingData.seoKeywords}</p>
                  </div>
                  <div className="max-h-36 overflow-y-auto bg-[#070707] border border-neutral-900 p-3 rounded text-[11px] font-mono text-neutral-400 whitespace-pre-wrap leading-relaxed">
                    {editingData.aiBlogContent}
                  </div>
                </div>
              )}

            </div>

            <div className="pt-6 border-t border-neutral-900 flex items-center justify-between gap-4">
              <span className="text-xs text-neutral-550 font-mono">Changes reflecting to /student/{editingData.username}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 bg-neutral-950 hover:bg-neutral-900 text-neutral-350 rounded-xl text-xs font-bold uppercase transition"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={savePortfolio}
                  disabled={saving || !editingData.fullName}
                  className="inline-flex items-center space-x-2 bg-brand-gold hover:bg-[#F5B300] text-black font-semibold text-xs py-2.5 px-6 rounded-xl transition disabled:opacity-40"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Portfolio Settings</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
