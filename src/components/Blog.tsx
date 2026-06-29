import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Blog as BlogType } from "../types";
import { useApp } from "../context/AppContext";
import { SEO } from "./SEO";
import { 
  Search, 
  Calendar, 
  User, 
  Tag, 
  ArrowRight, 
  BookOpen, 
  Sparkles, 
  TrendingUp,
  Bookmark,
  ExternalLink
} from "lucide-react";
import { BOOTSTRAP_BLOGS } from "../lib/bootstrapBlogs";

const CATEGORIES = [
  "All",
  "AI & Future Tech",
  "Video Editing",
  "Freelancing",
  "Digital Marketing",
  "YouTube Growth",
  "Business",
  "Self Improvement",
  "Career Skills",
  "Course Comparisons",
  "Software Reviews"
];

export const Blog: React.FC = () => {
  const { setCurrentPage } = useApp();
  const [blogs, setBlogs] = useState<BlogType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const blogsCollection = collection(db, "blogs");
        const q = query(blogsCollection, orderBy("publishDate", "desc"));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          // Fall back to pre-seeded bootstrap blogs if firestore collection has zero records
          setBlogs(BOOTSTRAP_BLOGS);
        } else {
          const list: BlogType[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title || "",
              slug: data.slug || "",
              metaTitle: data.metaTitle || "",
              metaDescription: data.metaDescription || "",
              seoKeywords: data.seoKeywords || "",
              canonicalUrl: data.canonicalUrl || "",
              featuredImage: data.featuredImage || "",
              category: data.category || "",
              content: data.content || "",
              contentUrl: data.contentUrl || "",
              author: data.author || "",
              publishDate: data.publishDate || "",
              createdAt: data.createdAt
            };
          });
          
          // Merge with unique bootstrap blogs that are not yet in Firestore
          const firestoreSlugs = new Set(list.map(b => b.slug));
          const uniqueBootstrap = BOOTSTRAP_BLOGS.filter(b => !firestoreSlugs.has(b.slug));
          const merged = [...list, ...uniqueBootstrap].sort((a, b) => {
            return (b.publishDate || "").localeCompare(a.publishDate || "");
          });
          
          setBlogs(merged);
        }
      } catch (error: any) {
        console.warn("Error fetching blogs from Firestore. Using high quality fallback dataset:", error);
        setBlogs(BOOTSTRAP_BLOGS);
        handleFirestoreError(error, OperationType.GET, "blogs");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  // Filter logic
  const filteredBlogs = blogs.filter(post => {
    const pTitle = post.title || "";
    const pMetaDesc = post.metaDescription || "";
    const pCategory = post.category || "";
    const pContent = post.content || "";

    const sQuery = searchQuery.toLowerCase();

    const matchesCategory = 
      selectedCategory === "All" || 
      pCategory.trim().toLowerCase() === selectedCategory.trim().toLowerCase();

    const matchesSearch = 
      pTitle.toLowerCase().includes(sQuery) ||
      pMetaDesc.toLowerCase().includes(sQuery) ||
      pCategory.toLowerCase().includes(sQuery) ||
      pContent.toLowerCase().includes(sQuery);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="py-24 bg-neutral-50 dark:bg-[#000000] transition-colors duration-300">
      <SEO 
        title="Knowledge Blog & Guides"
        description="Learn 2 Future - Explore our latest articles covering generative artificial intelligence, native ESM execution, software engineering, and future computing trends."
        keywords="learn blog, generative ai tutorials, quantum algorithms, software design, future tech"
        type="website"
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-16">
        
        {/* Banner Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 bg-brand-gold/10 text-brand-gold py-1.5 px-4 rounded-full text-xs font-mono font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover the Future</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-none">
            Tech Trends &amp; <span className="text-brand-gold">Learning Guides</span>
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 font-light leading-relaxed">
            Stay ahead of the curve. Read carefully crafted articles from technology architects, researchers, and professional mentors detailing modern digital changes.
          </p>
        </div>

        {/* Filters and Search Bar Container */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white dark:bg-[#111] p-6 rounded-3xl border border-neutral-100 dark:border-neutral-900 shadow-sm select-none">
          
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`py-2.5 px-4 rounded-xl text-xs font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-brand-gold text-black font-bold shadow-md shadow-brand-gold/15"
                    : "bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-800"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search Box Input */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search guides, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800 text-neutral-900 dark:text-white pl-11 pr-4 py-3.5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-brand-gold font-sans transition-all"
            />
          </div>

        </div>

        {/* Loader State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-neutral-400 font-mono">Loading dynamic blog library...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-[#111] rounded-3xl border border-neutral-100 dark:border-neutral-900 shadow-sm space-y-4">
            <Tag className="w-12 h-12 text-neutral-400 mx-auto" />
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">No articles matched your criteria</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Please check spelling, change category filters, or write another dynamic search query.
            </p>
            <button
              onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
              className="text-xs font-bold text-brand-gold hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            
            {/* Featured Post Card (Visible only when filtering is minimal and we have post/bootstrap data) */}
            {selectedCategory === "All" && searchQuery === "" && filteredBlogs.length > 0 && (
              <Link 
                to={`/blog/${filteredBlogs[0].slug}`}
                className="group relative grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white dark:bg-[#111] rounded-3xl border border-neutral-100 dark:border-neutral-900 shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 text-left block"
              >
                <div className="lg:col-span-7 relative h-64 sm:h-96 w-full overflow-hidden">
                  <img
                    src={filteredBlogs[0].featuredImage || "https://images.unsplash.com/photo-1516116211223-5c359a36298a?q=80&w=1200"}
                    alt={filteredBlogs[0].title}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1516116211223-5c359a36298a?q=80&w=1200";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"></div>
                  <div className="absolute top-6 left-6 bg-brand-gold text-black text-[10px] font-mono font-extrabold px-3.5 py-1.5 rounded-lg uppercase tracking-wider shadow-md">
                    Featured Guide
                  </div>
                </div>

                <div className="lg:col-span-5 p-8 lg:p-10 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2.5 text-xs font-mono font-bold text-brand-gold uppercase">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{filteredBlogs[0].category}</span>
                    </div>

                    <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-neutral-900 dark:text-white leading-tight group-hover:text-brand-gold transition-colors">
                      {filteredBlogs[0].title}
                    </h2>

                    <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 line-clamp-3 font-light leading-relaxed">
                      {filteredBlogs[0].metaDescription}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-neutral-100 dark:border-neutral-900">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-brand-gold font-bold text-xs">
                        {filteredBlogs[0].author[0]}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-neutral-900 dark:text-white block">{filteredBlogs[0].author}</span>
                        <span className="text-[10px] text-neutral-450 block font-mono">{filteredBlogs[0].publishDate}</span>
                      </div>
                    </div>
                    
                    <div className="text-neutral-400 group-hover:text-brand-gold transition-colors">
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Standard Grid list of Blogs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBlogs.slice(selectedCategory === "All" && searchQuery === "" ? 1 : 0).map(post => (
                <Link 
                  key={post.id || post.slug}
                  to={`/blog/${post.slug}`}
                  className="group flex flex-col justify-between bg-white dark:bg-[#111] rounded-3xl border border-neutral-100 dark:border-brand-border overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left block"
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={post.featuredImage || "https://images.unsplash.com/photo-1516116211223-5c359a36298a?q=80&w=800"}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1516116211223-5c359a36298a?q=80&w=800";
                      }}
                    />
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[9px] font-mono font-bold py-1 px-2.5 rounded-md">
                      {post.category}
                    </div>
                  </div>

                  <div className="p-6 flex-grow flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-[10px] text-neutral-500 dark:text-neutral-450 font-mono">
                        <Calendar className="w-3 h-3 text-brand-gold" />
                        <span>{post.publishDate}</span>
                        <span>•</span>
                        <User className="w-3 h-3 text-brand-gold" />
                        <span className="truncate max-w-[100px]">{post.author}</span>
                      </div>

                      <h3 className="font-display text-base sm:text-md font-bold text-neutral-900 dark:text-white leading-snug line-clamp-2 group-hover:text-brand-gold transition-colors">
                        {post.title}
                      </h3>

                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-3 leading-relaxed font-light">
                        {post.metaDescription}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-neutral-50 dark:border-neutral-900 select-none mt-auto">
                      <span className="text-[11px] font-mono font-bold text-brand-gold flex items-center space-x-1 hover:underline">
                        <span>Read Full Guide</span>
                        <ArrowRight className="w-3.5 h-3.5 mt-0.5 group-hover:translate-x-1.5 transition-transform duration-300" />
                      </span>
                      <Bookmark className="w-3.5 h-3.5 text-neutral-400 hover:text-brand-gold transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
