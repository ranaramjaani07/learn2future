import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { Search, X, BookOpen, User, FileText, Sparkles, ArrowRight, CornerDownLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Course, Blog } from "../types";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  type: "course" | "instructor" | "blog";
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  category?: string;
  url: string;
  price?: string;
  originalPrice?: string;
  instructorName?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "courses" | "instructors" | "blogs">("all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch courses and blogs when search is opened
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const coursesCol = collection(db, "courses");
          const blogsCol = collection(db, "blogs");

          const [coursesSnap, blogsSnap] = await Promise.all([
            getDocs(query(coursesCol, orderBy("createdAt", "desc"))),
            getDocs(query(blogsCol, orderBy("createdAt", "desc")))
          ]);

          const loadedCourses = coursesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Course[];

          const loadedBlogs = blogsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Blog[];

          setCourses(loadedCourses);
          setBlogs(loadedBlogs);
        } catch (error) {
          console.error("Error fetching global search data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
      
      // Auto-focus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
    } else {
      setSearchTerm("");
      setActiveTab("all");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const sTerm = searchTerm.toLowerCase().trim();

  // Search logic
  const matchedCourses = courses.filter(course => {
    if (!sTerm) return false;
    const title = (course.title || "").toLowerCase();
    const category = (course.category || "").toLowerCase();
    const subCategory = (course.subCategory || "").toLowerCase();
    const description = (course.description || "").toLowerCase();
    const shortDesc = (course.shortDescription || "").toLowerCase();
    const longDesc = (course.longDescription || "").toLowerCase();
    const overview = (course.courseOverview || "").toLowerCase();
    const learningOutcomes = Array.isArray(course.learningOutcomes) ? course.learningOutcomes.join(" ").toLowerCase() : "";
    const tags = Array.isArray(course.courseTags) ? course.courseTags.join(" ").toLowerCase() : "";
    const keywords = Array.isArray(course.secondaryKeywords) ? course.secondaryKeywords.join(" ").toLowerCase() : "";

    return (
      title.includes(sTerm) ||
      category.includes(sTerm) ||
      subCategory.includes(sTerm) ||
      description.includes(sTerm) ||
      shortDesc.includes(sTerm) ||
      longDesc.includes(sTerm) ||
      overview.includes(sTerm) ||
      learningOutcomes.includes(sTerm) ||
      tags.includes(sTerm) ||
      keywords.includes(sTerm)
    );
  });

  const matchedInstructors = courses.filter(course => {
    if (!sTerm) return false;
    const instructorName = (course.instructorName || "").toLowerCase();
    const instructorBio = (course.instructorBio || "").toLowerCase();
    return instructorName.includes(sTerm) || instructorBio.includes(sTerm);
  }).reduce((unique: { name: string; bio: string; image: string; courseSlug: string; courseTitle: string }[], course) => {
    const name = course.instructorName || "Aditya Raj Kashyap";
    const bio = course.instructorBio || "Expert Industry Guide at Learn 2 Future";
    const image = course.instructorImage || "";
    const courseSlug = course.slug || "";
    const courseTitle = course.title;
    
    if (!unique.some(inst => inst.name.toLowerCase() === name.toLowerCase())) {
      unique.push({ name, bio, image, courseSlug, courseTitle });
    }
    return unique;
  }, []);

  const matchedBlogs = blogs.filter(blog => {
    if (!sTerm) return false;
    const title = (blog.title || "").toLowerCase();
    const author = (blog.author || "").toLowerCase();
    const category = (blog.category || "").toLowerCase();
    const content = (blog.content || "").toLowerCase();
    const metaTitle = (blog.metaTitle || "").toLowerCase();
    const metaDesc = (blog.metaDescription || "").toLowerCase();
    const keywords = (blog.seoKeywords || "").toLowerCase();

    return (
      title.includes(sTerm) ||
      author.includes(sTerm) ||
      category.includes(sTerm) ||
      content.includes(sTerm) ||
      metaTitle.includes(sTerm) ||
      metaDesc.includes(sTerm) ||
      keywords.includes(sTerm)
    );
  });

  const totalResultsCount = matchedCourses.length + matchedInstructors.length + matchedBlogs.length;

  // Flattened active results list for key navigation
  const listToRender: SearchItem[] = [];

  if (matchedCourses.length > 0 && (activeTab === "all" || activeTab === "courses")) {
    matchedCourses.forEach(c => {
      listToRender.push({
        type: "course",
        id: `course-${c.id}`,
        title: c.title,
        subtitle: c.shortDescription || c.description,
        image: c.thumbnail || "/brand_logo.jpg",
        category: c.category,
        url: `/course/${c.slug || ""}`,
        price: c.offerPrice ? `₹${c.offerPrice}` : (c.price ? `₹${c.price}` : undefined),
        originalPrice: c.originalPrice ? `₹${c.originalPrice}` : undefined,
        instructorName: c.instructorName
      });
    });
  }

  if (matchedInstructors.length > 0 && (activeTab === "all" || activeTab === "instructors")) {
    matchedInstructors.forEach((inst, idx) => {
      listToRender.push({
        type: "instructor",
        id: `instructor-${idx}`,
        title: inst.name,
        subtitle: inst.bio,
        image: inst.image || "/brand_logo.jpg",
        category: "Instructor",
        url: `/course/${inst.courseSlug}`,
        instructorName: inst.courseTitle
      });
    });
  }

  if (matchedBlogs.length > 0 && (activeTab === "all" || activeTab === "blogs")) {
    matchedBlogs.forEach(b => {
      listToRender.push({
        type: "blog",
        id: `blog-${b.id}`,
        title: b.title,
        subtitle: b.category,
        image: b.featuredImage || "/brand_logo.jpg",
        category: "Blog Article",
        url: `/blog/${b.slug}`
      });
    });
  }

  // Reset index when search term or active tab changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm, activeTab]);

  // Handle keyboard events inside search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, listToRender.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + listToRender.length) % Math.max(1, listToRender.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (listToRender[selectedIndex]) {
          const selected = listToRender[selectedIndex];
          navigate(selected.url);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, listToRender, selectedIndex, navigate, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector("[data-active='true']");
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999] overflow-y-auto flex items-start justify-center p-4 pt-16 sm:pt-24">
          {/* Overlay backdrop with modern background blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/75 backdrop-blur-[12px] transition-opacity"
          />

          {/* Search container modal with float effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden bg-white dark:bg-[#0B0B0C] border border-neutral-200/90 dark:border-neutral-800/80 flex flex-col max-h-[85vh] z-10"
          >
            {/* Spotlight Header Input Bar */}
            <div className="relative p-4 sm:p-5 flex items-center justify-between border-b border-neutral-100/80 dark:border-neutral-900/60 bg-neutral-50/50 dark:bg-neutral-950/20">
              <div className="relative flex-grow flex items-center">
                <Search className="absolute left-3 text-neutral-400 dark:text-neutral-500 w-5 h-5" />
                <input
                  ref={inputRef}
                  type="text"
                  className="w-full bg-transparent pl-11 pr-4 py-1 text-base sm:text-lg font-sans font-semibold text-black dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none"
                  placeholder="Type to search courses, instructors, lessons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2.5 ml-2 shrink-0">
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-800/80 text-[10px] font-mono text-neutral-450 dark:text-neutral-500 shadow-sm select-none">
                  ESC
                </span>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-all cursor-pointer"
                  aria-label="Close search"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Category selection Tabs */}
            {sTerm && (
              <div className="flex px-4 py-2.5 bg-neutral-50/20 dark:bg-neutral-950/10 border-b border-neutral-100/60 dark:border-neutral-900/30 gap-1.5 overflow-x-auto scrollbar-none">
                {(["all", "courses", "instructors", "blogs"] as const).map((tab) => {
                  const isActive = activeTab === tab;
                  const label = 
                    tab === "all" ? `All (${totalResultsCount})` :
                    tab === "courses" ? `Courses (${matchedCourses.length})` :
                    tab === "instructors" ? `Instructors (${matchedInstructors.length})` :
                    `Blogs (${matchedBlogs.length})`;

                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 whitespace-nowrap cursor-pointer ${
                        isActive
                          ? "bg-brand-gold text-black shadow-sm font-bold scale-98"
                          : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 bg-neutral-100/50 dark:bg-neutral-900/40 border border-neutral-200/10 dark:border-neutral-800/20"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Results Window */}
            <div 
              ref={scrollContainerRef}
              className="flex-grow overflow-y-auto p-3 sm:p-5 scrollbar-thin max-h-[50vh]"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest animate-pulse">Syncing platform indices...</p>
                </div>
              ) : !searchTerm ? (
                /* Empty query state with hot masterclasses and tags */
                <div className="py-12 text-center max-w-md mx-auto space-y-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-gold/20 to-amber-500/10 text-brand-gold border border-brand-gold/25 flex items-center justify-center mx-auto shadow-lg shadow-brand-gold/5">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-base font-bold font-display text-neutral-900 dark:text-white tracking-tight">Spotlight Omnisearch</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Instant indexing across course content, direct mentor biographies, and premium editorial articles.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-1.5">
                    {["AI Agents", "Aditya", "Freelancing", "YouTube", "Deepak Sir", "Marketing"].map((suggest) => (
                      <button
                        key={suggest}
                        onClick={() => setSearchTerm(suggest)}
                        className="px-3 py-1.5 text-[11px] rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 text-neutral-600 dark:text-neutral-450 hover:text-black dark:hover:text-black hover:bg-brand-gold dark:hover:bg-brand-gold hover:border-brand-gold font-semibold transition-all duration-200 cursor-pointer shadow-xs"
                      >
                        {suggest}
                      </button>
                    ))}
                  </div>
                </div>
              ) : listToRender.length === 0 ? (
                /* No Results Matched state */
                <div className="py-16 text-center max-w-md mx-auto space-y-4">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mx-auto text-neutral-400 dark:text-neutral-600">
                    <Search className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white">No matches found for "{searchTerm}"</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-450 leading-relaxed">
                      Check your spelling or try search queries like "Aditya", "AI", or "Marketing".
                    </p>
                  </div>
                </div>
              ) : (
                /* Search Results Stack */
                <div className="space-y-1.5">
                  <div className="px-1.5 pb-2 text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center justify-between">
                    <span>Search Results ({listToRender.length})</span>
                    <span className="hidden sm:inline">Use ↑↓ keys to navigate</span>
                  </div>

                  {listToRender.map((item, idx) => {
                    const isSelected = selectedIndex === idx;
                    
                    return (
                      <Link
                        key={item.id}
                        to={item.url}
                        onClick={onClose}
                        data-active={isSelected}
                        className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? "bg-neutral-100/90 dark:bg-neutral-900/90 border-brand-gold/60 shadow-md translate-x-1"
                            : "bg-transparent border-transparent hover:bg-neutral-50/55 dark:hover:bg-neutral-900/30"
                        }`}
                      >
                        <div className="flex items-center space-x-3.5 min-w-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className={`w-11 h-11 rounded-lg object-cover shrink-0 border ${
                                item.type === "instructor" ? "rounded-full border-brand-gold" : "border-neutral-200/50 dark:border-neutral-800/40"
                              }`}
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-400 shrink-0 border border-neutral-200/40 dark:border-neutral-800/40">
                              {item.type === "course" ? <BookOpen className="w-4 h-4" /> : item.type === "instructor" ? <User className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider font-mono shrink-0 select-none ${
                                item.type === "course" ? "bg-brand-gold/15 text-brand-gold" :
                                item.type === "instructor" ? "bg-amber-550/15 text-amber-550 dark:text-amber-400" :
                                "bg-emerald-550/15 text-emerald-550 dark:text-emerald-400"
                              }`}>
                                {item.type}
                              </span>
                              {item.category && item.category !== "Instructor" && item.category !== "Blog Article" && (
                                <span className="text-[10px] text-neutral-400 truncate max-w-[120px]">
                                  {item.category}
                                </span>
                              )}
                            </div>
                            <h5 className={`text-sm font-bold truncate mt-0.5 transition-colors ${
                              isSelected ? "text-brand-gold" : "text-neutral-900 dark:text-neutral-100"
                            }`}>
                              {item.title}
                            </h5>
                            {item.subtitle && (
                              <p className="text-xs text-neutral-550 dark:text-neutral-450 truncate max-w-md mt-0.5">
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3.5 shrink-0 ml-4">
                          {item.price && (
                            <div className="text-right">
                              <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-200">
                                {item.price}
                              </span>
                              {item.originalPrice && (
                                <span className="block text-[9px] font-mono line-through text-neutral-400">
                                  {item.originalPrice}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {isSelected ? (
                            <div className="flex items-center space-x-1 text-brand-gold animate-pulse">
                              <span className="text-[10px] font-mono hidden sm:inline">Enter</span>
                              <CornerDownLeft className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <ArrowRight className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-600 transition-transform group-hover:translate-x-0.5" />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Premium keyboard actions footer panel */}
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-950/60 border-t border-neutral-100/80 dark:border-neutral-900/60 flex items-center justify-between text-[10px] font-mono text-neutral-400 dark:text-neutral-550 select-none">
              <div className="flex items-center space-x-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-neutral-200/60 dark:bg-neutral-900 rounded border border-neutral-300/40 dark:border-neutral-800 font-bold">↑↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-neutral-200/60 dark:bg-neutral-900 rounded border border-neutral-300/40 dark:border-neutral-800 font-bold">Enter</kbd>
                  to select
                </span>
              </div>
              <span>
                Press <strong className="text-neutral-500 dark:text-neutral-300 font-bold">ESC</strong> to exit
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
