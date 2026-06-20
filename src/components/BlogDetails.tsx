import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Blog as BlogType } from "../types";
import { useApp } from "../context/AppContext";
import { SEO } from "./SEO";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Tag, 
  Clock, 
  Share2, 
  Check, 
  Sparkles,
  BookOpen,
  ArrowUpRight
} from "lucide-react";

// Fallback high quality blogs array 
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

export const BlogDetails: React.FC = () => {
  const { selectedBlogSlug, setCurrentPage, logUserActivity } = useApp();
  const [blog, setBlog] = useState<BlogType | null>(null);
  const [related, setRelated] = useState<BlogType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedBlogSlug) {
      setCurrentPage("blog");
      return;
    }

    const loadBlogData = async () => {
      setLoading(true);
      try {
        const blogsCol = collection(db, "blogs");
        const q = query(blogsCol, where("slug", "==", selectedBlogSlug), limit(1));
        const snapshot = await getDocs(q);

        let activeBlog: BlogType | null = null;

        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data();
          activeBlog = {
            id: docSnap.id,
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
        } else {
          // Fall back to bootstrap list search
          const found = BOOTSTRAP_BLOGS.find(b => b.slug === selectedBlogSlug);
          if (found) activeBlog = found;
        }

        if (activeBlog) {
          // Fetch raw markdown content on-the-fly if stored in contentUrl
          if (activeBlog.contentUrl) {
            try {
              const res = await fetch(activeBlog.contentUrl);
              if (res.ok) {
                const fetchedMarkdown = await res.text();
                activeBlog.content = fetchedMarkdown;
              }
            } catch (err) {
              console.warn("Could not fetch blog content from contentUrl:", err);
            }
          }
          setBlog(activeBlog);
          if (logUserActivity) {
            logUserActivity("Blog View", `Article: ${activeBlog.title}`);
          }
          
          // Load related posts (exclude current)
          const allDocsQuery = query(blogsCol);
          const allDocsSnap = await getDocs(allDocsQuery);
          if (!allDocsSnap.empty) {
            const list: BlogType[] = allDocsSnap.docs
              .map(doc => {
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
                } as BlogType;
              })
              .filter(item => item.slug !== selectedBlogSlug)
              .slice(0, 3);
            setRelated(list.length > 0 ? list : BOOTSTRAP_BLOGS.filter(b => b.slug !== selectedBlogSlug).slice(0, 3));
          } else {
            setRelated(BOOTSTRAP_BLOGS.filter(b => b.slug !== selectedBlogSlug).slice(0, 3));
          }

        } else {
          setBlog(null);
        }
      } catch (err: any) {
        console.warn("Error retrieving blog node. Reverting to bootstrap dataset lookup:", err);
        const f = BOOTSTRAP_BLOGS.find(b => b.slug === selectedBlogSlug);
        setBlog(f || null);
        setRelated(BOOTSTRAP_BLOGS.filter(b => b.slug !== selectedBlogSlug).slice(0, 3));
        handleFirestoreError(err, OperationType.GET, `blogs/${selectedBlogSlug}`);
      } finally {
        setLoading(false);
      }
    };

    loadBlogData();
  }, [selectedBlogSlug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Estimate read time
  const getReadingTime = (text: string) => {
    const wordsPerMinute = 225;
    const wordsCount = text ? text.split(/\s+/).length : 0;
    return Math.max(1, Math.ceil(wordsCount / wordsPerMinute));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] py-20 px-6 space-y-4">
        <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin font-sans"></div>
        <p className="text-xs text-neutral-400 font-mono">Loading full learning guide...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="max-w-md mx-auto py-32 px-6 text-center space-y-6">
        <h2 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Article Not Found</h2>
        <p className="text-sm text-neutral-450">
          The requested guide could not be located inside our database. It may have been renamed or removed by an administrator.
        </p>
        <button
          onClick={() => setCurrentPage("blog")}
          className="bg-brand-gold hover:bg-brand-gold/90 text-black font-bold text-xs py-3 px-6 rounded-xl transition-all"
        >
          Return to Blog Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="py-24 bg-neutral-50 dark:bg-[#000000] transition-colors duration-300">
      
      {/* Dynamic SEO context injection */}
      <SEO 
        title={blog.metaTitle || blog.title}
        description={blog.metaDescription}
        keywords={blog.seoKeywords}
        image={blog.featuredImage}
        url={window.location.href}
        canonicalUrl={blog.canonicalUrl || window.location.href}
        author={blog.author}
        publishDate={blog.publishDate}
        type="article"
      />

      <div className="max-w-4xl mx-auto px-6 space-y-12">
        
        {/* Back navigation */}
        <button
          onClick={() => setCurrentPage("blog")}
          className="inline-flex items-center space-x-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-brand-gold transition-colors select-none group focus:outline-none"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Blog Catalog</span>
        </button>

        {/* Article header metadata and Title */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center space-x-1.5 bg-brand-gold/10 text-brand-gold text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              <Tag className="w-3 h-3" />
              <span>{blog.category}</span>
            </span>
            <span className="text-neutral-300 dark:text-neutral-800">•</span>
            <span className="text-[11px] font-mono text-neutral-505 dark:text-neutral-400 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>{getReadingTime(blog.content)} min read</span>
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 dark:text-white leading-tight tracking-tight">
            {blog.title}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 pb-6 border-b border-neutral-200 dark:border-brand-border">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-brand-gold font-bold font-mono">
                {blog.author[0]}
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-900 dark:text-white block">{blog.author}</span>
                <span className="text-[10px] text-neutral-450 block font-mono flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-neutral-400 mr-0.5" />
                  <span>Published on {blog.publishDate}</span>
                </span>
              </div>
            </div>

            {/* Social Share action button */}
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center space-x-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all border border-neutral-150 dark:border-brand-border"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share Guide</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Featured Image */}
        <div className="relative h-64 sm:h-96 w-full rounded-2xl overflow-hidden shadow-md">
          <img
            src={blog.featuredImage || "https://images.unsplash.com/photo-1516116211223-5c359a36298a?q=80&w=1200"}
            alt={blog.title}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1516116211223-5c359a36298a?q=80&w=1200";
            }}
          />
        </div>

        {/* Dynamic Markdown Article Content */}
        <article className="prose prose-neutral dark:prose-invert max-w-none text-neutral-850 dark:text-neutral-300">
          <MarkdownRenderer content={blog.content} />
        </article>

        {/* Related Articles Read more footer block */}
        <div className="pt-16 border-t border-neutral-200 dark:border-brand-border select-none">
          <div className="flex items-center space-x-2.5 mb-8">
            <BookOpen className="w-5 h-5 text-brand-gold" />
            <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Related Resources</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map(item => (
              <div 
                key={item.id} 
                onClick={() => setCurrentPage("blog-details", item.slug)}
                className="group flex flex-col justify-between p-5 bg-white dark:bg-[#111] rounded-2xl border border-neutral-100 dark:border-brand-border hover:border-neutral-250 dark:hover:border-neutral-800 hover:shadow-md cursor-pointer transition-all duration-350"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-450">
                    <span>{item.category}</span>
                    <span>{item.publishDate}</span>
                  </div>
                  <h4 className="font-display text-xs sm:text-sm font-bold text-neutral-950 dark:text-white leading-snug line-clamp-2 group-hover:text-brand-gold transition-colors">
                    {item.title}
                  </h4>
                </div>
                <div className="flex items-center space-x-1 text-[10px] font-mono text-brand-gold pt-3 border-t border-neutral-50 dark:border-neutral-900 mt-4 font-bold">
                  <span>Read Guide</span>
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
