import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "../firebase";
import { Course, Blog as BlogType } from "../types";
import { useApp } from "../context/AppContext";
import { 
  ChevronRight, 
  BookOpen, 
  Sparkles, 
  Clock, 
  Tag, 
  TrendingUp, 
  Award
} from "lucide-react";

// --- 1. BREADCRUMBS COMPONENT ---
interface BreadcrumbItem {
  name: string;
  item: string;
}

interface BreadcrumbsProps {
  id?: string;
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ id = "seo-breadcrumbs", items }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav 
      id={id}
      aria-label="Breadcrumb" 
      className="flex items-center space-x-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-sans tracking-wide py-4 overflow-x-auto whitespace-nowrap scrollbar-none"
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <div key={item.item + idx} className="flex items-center">
            {idx > 0 && (
              <ChevronRight className="w-3 h-3 text-neutral-300 dark:text-neutral-800 mx-1.5 shrink-0" />
            )}
            {isLast ? (
              <span 
                className="font-semibold text-neutral-900 dark:text-brand-gold truncate max-w-[180px] sm:max-w-[280px]" 
                aria-current="page"
              >
                {item.name}
              </span>
            ) : (
              <Link 
                to={item.item} 
                className="hover:text-brand-gold dark:hover:text-white transition-colors duration-150 py-1"
              >
                {item.name}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

// --- 2. RELATED COURSES COMPONENT ---
interface RelatedCoursesProps {
  id?: string;
  currentCourseId?: string;
  category: string;
}

export const RelatedCourses: React.FC<RelatedCoursesProps> = ({ 
  id = "seo-related-courses", 
  currentCourseId, 
  category 
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load fallback bootstrap courses in case of offline/db limits
  const fallbackCourses: Course[] = [
    {
      id: "ai-gold",
      title: "AI & ChatGPT Goldmine: Automated Content Machine",
      category: "Artificial Intelligence",
      price: 299,
      originalPrice: 4999,
      description: "Step-by-step masterclass to launch an AI content generation agency.",
      thumbnail: "https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=600&auto=format&fit=crop",
      slug: "ai-gold",
      createdAt: null as any
    },
    {
      id: "edit-cine",
      title: "Cine-Edit Masterclass: Cinematic Video Editing Blueprint",
      category: "Video Editing",
      price: 199,
      originalPrice: 2999,
      description: "Learn color grading, visual storytelling, and high-retention video editing.",
      thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=600&auto=format&fit=crop",
      slug: "edit-cine",
      createdAt: null as any
    },
    {
      id: "tube-viral",
      title: "YouTube Viral Automation Blueprint: Organic Traffic Hacks",
      category: "YouTube",
      price: 199,
      originalPrice: 3499,
      description: "Master algorithm triggers, CTR optimization, and automated channels.",
      thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=600&auto=format&fit=crop",
      slug: "tube-viral",
      createdAt: null as any
    }
  ];

  useEffect(() => {
    let active = true;
    const fetchRelated = async () => {
      setLoading(true);
      try {
        const coursesCol = collection(db, "courses");
        const q = query(coursesCol, where("category", "==", category), limit(4));
        const snap = await getDocs(q);
        
        if (!active) return;

        if (!snap.empty) {
          const list: Course[] = [];
          snap.docs.forEach(docSnap => {
            const data = docSnap.data();
            if (docSnap.id !== currentCourseId) {
              list.push({
                id: docSnap.id,
                title: data.title || "",
                category: data.category || "",
                price: Number(data.price || 0),
                description: data.description || "",
                thumbnail: data.thumbnail || "",
                slug: data.slug || "",
                createdAt: null as any
              });
            }
          });
          setCourses(list.slice(0, 3));
        } else {
          // Filter fallback by category or general
          const matched = fallbackCourses.filter(c => c.id !== currentCourseId && (c.category === category || category === "all"));
          setCourses(matched.length > 0 ? matched : fallbackCourses.filter(c => c.id !== currentCourseId).slice(0, 3));
        }
      } catch (err) {
        if (active) {
          const matched = fallbackCourses.filter(c => c.id !== currentCourseId);
          setCourses(matched.slice(0, 3));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchRelated();
    return () => { active = false; };
  }, [category, currentCourseId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map(n => (
          <div key={n} className="bg-[#0c0c0c] border border-neutral-900 h-64 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (courses.length === 0) return null;

  return (
    <div id={id} className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
      {courses.map(c => (
        <Link
          key={c.id}
          to={`/course/${c.slug || c.id}`}
          className="bg-[#0b0b0b] border border-neutral-900/60 rounded-2xl overflow-hidden hover:border-brand-gold/30 transition shadow-sm hover:shadow-lg group flex flex-col h-full text-left"
        >
          <div className="relative aspect-video overflow-hidden border-b border-neutral-900/50 bg-neutral-950">
            <img 
              src={c.thumbnail || "/brand_logo.jpg"} 
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
              alt={c.title} 
              referrerPolicy="no-referrer" 
              loading="lazy"
            />
            <span className="absolute top-3 left-3 bg-neutral-950/95 border border-neutral-800 text-[10px] font-mono text-brand-gold py-1 px-2.5 rounded-md uppercase tracking-wider">
              {c.category}
            </span>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h4 className="font-bold text-sm sm:text-base font-display text-white group-hover:text-brand-gold line-clamp-1 transition-colors">
                {c.title}
              </h4>
              <p className="text-[11px] sm:text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                {c.description}
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-neutral-900/50 mt-auto">
              <span className="text-sm font-bold font-display text-brand-gold">₹{c.price.toLocaleString()}</span>
              <span className="text-[10px] font-mono text-neutral-500 uppercase group-hover:text-white transition tracking-wider">Blueprint →</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

// --- 3. RELATED BLOGS COMPONENT ---
interface RelatedBlogsProps {
  id?: string;
  currentBlogSlug?: string;
  category: string;
}

export const RelatedBlogs: React.FC<RelatedBlogsProps> = ({ 
  id = "seo-related-blogs", 
  currentBlogSlug, 
  category 
}) => {
  const [blogs, setBlogs] = useState<BlogType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fallbackBlogs: BlogType[] = [
    {
      id: "why-learn2future",
      title: "Why Learn2Future Exists: The Mission Behind Affordable Skill Education",
      slug: "why-learn2future-exists-affordable-skill-education",
      category: "About Us",
      metaTitle: "Why Learn2Future Exists",
      metaDescription: "The absolute vision behind Learn2Future brand licenses.",
      featuredImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600&auto=format&fit=crop",
      author: "Learn 2 Future Team",
      publishDate: "2026-06-26",
      content: "",
      createdAt: null
    },
    {
      id: "ai-copilots",
      title: "The Agentic Era: How AI Copilots are Redefining Freelance Workflows",
      slug: "agentic-era-ai-copilots",
      category: "Artificial Intelligence",
      metaTitle: "The Agentic Era & AI Copilots",
      metaDescription: "Learn how modern AI copilots speed up freelance client deliveries.",
      featuredImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
      author: "Technical Guides",
      publishDate: "2026-06-25",
      content: "",
      createdAt: null
    }
  ];

  useEffect(() => {
    let active = true;
    const fetchRelated = async () => {
      setLoading(true);
      try {
        const blogsCol = collection(db, "blogs");
        const q = query(blogsCol, where("category", "==", category), limit(3));
        const snap = await getDocs(q);

        if (!active) return;

        if (!snap.empty) {
          const list: BlogType[] = [];
          snap.docs.forEach(docSnap => {
            const data = docSnap.data();
            if (data.slug !== currentBlogSlug) {
              list.push({
                id: docSnap.id,
                title: data.title || "",
                slug: data.slug || "",
                category: data.category || "",
                featuredImage: data.featuredImage || "",
                author: data.author || "Advisors",
                publishDate: data.publishDate || "",
                metaTitle: data.metaTitle || "",
                metaDescription: data.metaDescription || "",
                content: "",
                createdAt: null as any
              });
            }
          });
          setBlogs(list.slice(0, 2));
        } else {
          const filtered = fallbackBlogs.filter(b => b.slug !== currentBlogSlug);
          setBlogs(filtered.slice(0, 2));
        }
      } catch (err) {
        if (active) {
          const filtered = fallbackBlogs.filter(b => b.slug !== currentBlogSlug);
          setBlogs(filtered.slice(0, 2));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchRelated();
    return () => { active = false; };
  }, [category, currentBlogSlug]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-pulse">
        <div className="bg-[#0c0c0c] border border-neutral-900 h-48 rounded-xl" />
        <div className="bg-[#0c0c0c] border border-neutral-900 h-48 rounded-xl" />
      </div>
    );
  }

  if (blogs.length === 0) return null;

  return (
    <div id={id} className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
      {blogs.map(b => (
        <Link 
          key={b.slug}
          to={`/blog/${b.slug}`}
          className="bg-[#070707] border border-neutral-900 hover:border-neutral-800 rounded-2xl p-5 block group transition-all"
        >
          <div className="aspect-[2/1] overflow-hidden rounded-xl mb-4 bg-neutral-950 relative">
            <img 
              src={b.featuredImage || "/brand_logo.jpg"} 
              alt={b.title} 
              className="w-full h-full object-cover group-hover:scale-103 transition duration-300" 
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-2.5 right-2.5 bg-neutral-950/90 border border-neutral-900 text-[9px] font-mono font-bold uppercase tracking-wider text-brand-gold py-0.5 px-2 rounded">
              {b.category}
            </span>
          </div>
          <h4 className="font-display font-bold text-sm text-neutral-200 group-hover:text-brand-gold transition line-clamp-2 leading-relaxed">
            {b.title}
          </h4>
          <div className="flex items-center gap-4 text-[10px] font-mono text-neutral-500 mt-4 pt-3 border-t border-neutral-950">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {b.publishDate}</span>
            <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-brand-gold" /> {b.author}</span>
          </div>
        </Link>
      ))}
    </div>
  );
};

// --- 4. SIDEBAR NAVIGATION COMPONENT ---
export const SidebarNavigation: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [featured, setFeatured] = useState<Course[]>([]);

  useEffect(() => {
    // Dynamic lists with elegant fallbacks
    const loadSidebarData = async () => {
      try {
        const coursesCol = collection(db, "courses");
        const snap = await getDocs(query(coursesCol, limit(10)));
        if (!snap.empty) {
          const list: Course[] = snap.docs.map(d => ({
            id: d.id,
            title: d.data().title || "",
            slug: d.data().slug || "",
            category: d.data().category || "",
            price: Number(d.data().price || 0),
            description: "",
            thumbnail: "",
            createdAt: null as any
          }));
          const uniqueCats = Array.from(new Set(list.map(c => c.category))).filter(Boolean);
          setCategories(uniqueCats.slice(0, 5));
          setFeatured(list.slice(0, 3));
        } else {
          setCategories(["Artificial Intelligence", "Video Editing", "Freelancing", "YouTube"]);
        }
      } catch (err) {
        setCategories(["Artificial Intelligence", "Video Editing", "Freelancing", "YouTube"]);
      }
    };
    loadSidebarData();
  }, []);

  return (
    <div className="space-y-8 text-left">
      {/* Search Bar / Redirection link */}
      <div className="bg-[#0b0b0b] border border-neutral-900 rounded-2xl p-5 space-y-4">
        <h4 className="text-xs font-mono font-extrabold uppercase text-brand-gold tracking-widest flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-gold shrink-0" /> Fast Search Engine
        </h4>
        <Link 
          to="/courses" 
          className="w-full bg-[#121212] border border-neutral-850 hover:border-neutral-800 text-neutral-400 py-2 px-3.5 rounded-xl text-xs font-sans text-left block transition duration-200"
        >
          Search across 3,000+ blueprinted programs...
        </Link>
      </div>

      {/* Hub Categories */}
      {categories.length > 0 && (
        <div className="bg-[#0b0b0b] border border-neutral-900 rounded-2xl p-5 space-y-3.5">
          <h4 className="text-xs font-mono font-bold uppercase text-neutral-400 tracking-wider">Topical Hub Blueprints</h4>
          <div className="flex flex-col gap-2">
            {categories.map(cat => (
              <Link
                key={cat}
                to={`/courses?category=${encodeURIComponent(cat)}`}
                className="text-xs font-medium text-neutral-400 hover:text-brand-gold flex items-center justify-between py-1 border-b border-neutral-950 hover:border-neutral-800 transition-all"
              >
                <span>{cat}</span>
                <ChevronRight className="w-3 h-3 text-neutral-600" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trending Blueprints */}
      {featured.length > 0 && (
        <div className="bg-[#0b0b0b] border border-neutral-900 rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-mono font-bold uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-brand-gold" /> High Demand Blueprints
          </h4>
          <div className="space-y-4">
            {featured.map(f => (
              <Link 
                key={f.id}
                to={`/course/${f.slug || f.id}`}
                className="flex items-start gap-3.5 group"
              >
                <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-850 shrink-0 flex items-center justify-center text-brand-gold font-display font-extrabold text-[10px]">
                  BPT
                </div>
                <div className="min-w-0 space-y-0.5">
                  <h5 className="text-xs font-bold text-neutral-200 group-hover:text-brand-gold transition line-clamp-1">
                    {f.title}
                  </h5>
                  <p className="text-[10px] font-mono text-neutral-500 uppercase">{f.category}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- 5. CATEGORY NAVIGATION COMPONENT ---
export const CategoryNavigation: React.FC = () => {
  const categories = [
    { name: "Artificial Intelligence", slug: "Artificial Intelligence" },
    { name: "Video Editing", slug: "Video Editing" },
    { name: "Freelancing", slug: "Freelancing" },
    { name: "SaaS Business", slug: "SaaS" },
    { name: "YouTube Growth", slug: "YouTube" },
    { name: "Marketing Strategy", slug: "Marketing" }
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 py-4">
      <Link
        to="/courses"
        className="px-4 py-2 rounded-full text-xs font-mono font-bold tracking-wider uppercase border border-neutral-850 bg-neutral-950/45 hover:border-brand-gold hover:text-brand-gold transition"
      >
        All Blueprints
      </Link>
      {categories.map(cat => (
        <Link
          key={cat.name}
          to={`/courses?category=${encodeURIComponent(cat.slug)}`}
          className="px-4 py-2 rounded-full text-xs font-mono font-semibold tracking-wider uppercase border border-neutral-900 bg-black/45 hover:border-brand-gold hover:text-brand-gold text-neutral-400 hover:text-white transition"
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
};
