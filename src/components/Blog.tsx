import React, { useState, useEffect } from "react";
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

// Pre-seeded high quality blogs to serve as immediate content if database is empty on first boot.
const BOOTSTRAP_BLOGS: BlogType[] = [
  {
    id: "bootstrap-1",
    title: "The Agentic Era: How Autonomous AI Co-Pilots Are Redefining Engineering",
    slug: "agentic-era-ai-copilots",
    metaTitle: "The Agentic Era: How Autonomous AI Co-Pilots Redefine Engineering",
    metaDescription: "Dive into how autonomous agent workflows and co-pilots are changing software design and engineering methodologies.",
    category: "AI & Future Tech",
    featuredImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600&auto=format&fit=crop",
    content: "# The Agentic Era: Autonomous Software Co-Pilots\n\nSoftware development is undergoing its grandest transition since the compiler. Code generation was first about simple autocomplete. Now, we enter **the era of agentic architecture**.\n\nAutonomous co-pilots do not just tell you what function to write next; they collaborate with your local files to execute commands, build systems, run audits, and solve runtime failures in real-time. This changes the core mission of computer science education from passive syntax-memorization to high-level systemic instruction.\n\n## The Shift to Prompt-Engineering & Agent Orchestration\n\n- **Declarative Programming:** Engineers state *intent* rather than direct step-by-step logic loops.\n- **Infinite Prototyping:** Turn ideas into a fully compilable, sandbox-ready UI in seconds.\n- **Self-Healing Runtimes:** Agents analyze test suites, interpret terminal failures, and solve their own bugs.\n\n> \"The future coder is not a keyboard operator, but an architect coordinating a specialized guild of agentic modules.\"\n\nIn our newly updated Learn 2 Future modules, we dive deep into building, hosting, and deploying customized AI software agents using Node.js and Python.",
    author: "Dr. Elena Rostova",
    publishDate: "2026-06-10",
    createdAt: null
  },
  {
    id: "bootstrap-2",
    title: "TypeScript 5.8 and Beyond: Mastering Type Stripping and Native ESM Execution",
    slug: "typescript-native-esm-type-stripping",
    metaTitle: "TypeScript 5.8: Native ESM and Type Stripping Best Practices",
    metaDescription: "Learn how the latest TS updates enable compilation-free Node runtime execution and perfect native ES Modules structure.",
    category: "Career Skills",
    featuredImage: "https://images.unsplash.com/photo-1516116211223-5c359a36298a?q=80&w=600&auto=format&fit=crop",
    content: "# TypeScript 5.8 and Beyond\n\nFor years, executing TypeScript files required heavy transpilers like `babel`, `ts-node`, or tedious build configurations that compiled `.ts` into raw javascript outputs. With recent advancements in the active standards and Node.js runtimes, **TypeScript is becoming natively executable**.\n\nBy leveraging the native type stripping capabilities, developers can execute TS source files directly in production without a separate slow offline compilation step.\n\n## Why Native Type Stripping Matters\n\n1. **Zero Cold-Start Latency:** Eliminates the delay introduced by on-the-fly transpilers.\n2. **Clean Container Images:** No need to pack build-step toolchains inside your lightweight production containers.\n3. **Perfect CJS-ESM Interoperability:** Run your packages without module resolution friction.\n\n### Simple Implementation Workflow\n\nBy adding the following script tag, transpilers leverage type-stripping flags:\n```bash\nnode --experimental-strip-types app.ts\n```\nThis enables modern developers to ship light, secure, high-performance services with zero dependencies.",
    author: "Siddharth Mehta",
    publishDate: "2026-06-08",
    createdAt: null
  },
  {
    id: "bootstrap-3",
    title: "Quantum Computing Algorithms Explained: Grover’s and Shor’s Algorithms Simply",
    slug: "quantum-computing-algorithms-grover-shor",
    metaTitle: "Quantum Algorithms Explained: Deciphering Grover's and Shor's",
    metaDescription: "A plain-English deep dive into quantum algorithms, state superposition, entanglement, and real-world cryptanalysis risks.",
    category: "AI & Future Tech",
    featuredImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop",
    content: "# Quantum Algorithms Demystified\n\nQuantum computers are not just ultra-fast standard supercomputers. They run on entirely different physical principles, exploiting superposition and quantum entanglement to solve mathematically dense problems in seconds that would require millennia on silicon chips.\n\nLet's break down the two main algorithms forming the threat and potential vectors of quantum computing: **Shor's Algorithm** and **Grover's Algorithm**.\n\n## 1. Shor's Algorithm (The Cryptography Disruptor)\n\nShor's algorithm solves prime factorization in polynomial time. Because current secure RSA encryption relies on the sheer mathematical difficulty of factoring enormous prime composites, Shor's represents a massive cybersecurity paradigm shift.\n\n## 2. Grover's Algorithm (The Database Accelerator)\n\nGrover's algorithm speeds up unsorted database searches quadratically, reducing structured search cycles from $O(N)$ steps to $O(\\sqrt{N})$. This optimizes general sorting, regression, and state models globally.\n\nIn our upcoming curriculum, we teach how to prepare architectures for post-quantum security requirements.",
    author: "Prof. Arthur Pendelton",
    publishDate: "2026-06-04",
    createdAt: null
  }
];

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
          setBlogs(list);
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
              <div 
                className="group relative grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white dark:bg-[#111] rounded-3xl border border-neutral-100 dark:border-neutral-900 shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
                onClick={() => setCurrentPage("blog-details", filteredBlogs[0].slug)}
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
              </div>
            )}

            {/* Standard Grid list of Blogs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBlogs.slice(selectedCategory === "All" && searchQuery === "" ? 1 : 0).map(post => (
                <article 
                  key={post.id || post.slug}
                  className="group flex flex-col justify-between bg-white dark:bg-[#111] rounded-3xl border border-neutral-100 dark:border-brand-border overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  onClick={() => setCurrentPage("blog-details", post.slug)}
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

                    <div className="flex items-center justify-between pt-4 border-t border-neutral-50 dark:border-neutral-900 select-none">
                      <span className="text-[11px] font-mono font-bold text-brand-gold flex items-center space-x-1 hover:underline">
                        <span>Read Full Guide</span>
                        <ArrowRight className="w-3.5 h-3.5 mt-0.5 group-hover:translate-x-1.5 transition-transform duration-300" />
                      </span>
                      <Bookmark className="w-3.5 h-3.5 text-neutral-400 hover:text-brand-gold transition-colors" />
                    </div>
                  </div>
                </article>
              ))}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
