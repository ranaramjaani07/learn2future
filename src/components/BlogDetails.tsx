import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Blog as BlogType } from "../types";
import { useApp } from "../context/AppContext";
import { SEO } from "./SEO";
import { Breadcrumbs, RelatedBlogs } from "./SEOComponents";
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
import { BOOTSTRAP_BLOGS } from "../lib/bootstrapBlogs";

export const BlogDetails: React.FC = () => {
  const { selectedBlogSlug, setCurrentPage, logUserActivity } = useApp();
  const [blog, setBlog] = useState<BlogType | null>(null);
  const [related, setRelated] = useState<BlogType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [headers, setHeaders] = useState<{ id: string; text: string; level: number }[]>([]);

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

  // Extract headers for Table of Contents
  useEffect(() => {
    if (blog && blog.content) {
      const lines = blog.content.split("\n");
      const list: { id: string; text: string; level: number }[] = [];
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith("## ")) {
          const text = trimmed.slice(3).replace(/[*_`]/g, "").trim();
          const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
          list.push({ id, text, level: 2 });
        } else if (trimmed.startsWith("### ")) {
          const text = trimmed.slice(4).replace(/[*_`]/g, "").trim();
          const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
          list.push({ id, text, level: 3 });
        }
      });
      setHeaders(list);
    }
  }, [blog]);

  const scrollToHeader = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90; // offset for fixed navbar
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

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

  const TableOfContents = () => {
    if (headers.length === 0) return null;
    return (
      <div className="bg-white dark:bg-neutral-950 border border-neutral-150 dark:border-brand-border p-6 rounded-2xl space-y-4 shadow-sm">
        <h3 className="font-display text-xs font-bold text-neutral-950 dark:text-white flex items-center gap-2 uppercase tracking-wider">
          <BookOpen className="w-4 h-4 text-brand-gold" />
          <span>Table of Contents</span>
        </h3>
        <nav className="space-y-2">
          {headers.map((h, i) => (
            <button
              key={i}
              onClick={() => scrollToHeader(h.id)}
              className={`block text-left text-xs font-medium hover:text-brand-gold transition-colors select-none leading-relaxed ${
                h.level === 3 
                  ? "pl-4 text-neutral-450 dark:text-neutral-500" 
                  : "text-neutral-700 dark:text-neutral-300 font-semibold"
              }`}
            >
              • {h.text}
            </button>
          ))}
        </nav>
      </div>
    );
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
        <Link
          to="/blog"
          className="bg-brand-gold hover:bg-brand-gold/90 text-black font-bold text-xs py-3 px-6 rounded-xl transition-all block text-center w-full max-w-xs mx-auto"
        >
          Return to Blog Catalog
        </Link>
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
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Blog", item: "/blogs" },
          { name: blog.title, item: `/blog/${blog.slug}` }
        ]}
        blogData={blog}
      />

      <div className="max-w-4xl mx-auto px-6 space-y-12">
        
        {/* Back navigation */}
        <div className="flex flex-col gap-2">
          <Link
            to="/blog"
            className="inline-flex items-center space-x-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-brand-gold transition-colors select-none group focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Blog Catalog</span>
          </Link>
          <Breadcrumbs items={[
            { name: "Home", item: "/" },
            { name: "Blog", item: "/blog" },
            { name: blog.title, item: `/blog/${blog.slug}` }
          ]} />
        </div>

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

        {/* Dynamic Markdown Article and Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            {/* Table of Contents for Mobile Screens */}
            <div className="lg:hidden">
              <TableOfContents />
            </div>
            
            <article className="prose prose-neutral dark:prose-invert max-w-none text-neutral-850 dark:text-neutral-300">
              <MarkdownRenderer content={blog.content} />
            </article>
          </div>

          {/* Sticky Table of Contents Sidebar for Desktop Screens */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-6">
            <TableOfContents />
          </aside>
        </div>

        {/* Related Articles Read more footer block */}
        <div className="pt-16 border-t border-neutral-200 dark:border-brand-border select-none">
          <div className="flex items-center space-x-2.5 mb-8">
            <BookOpen className="w-5 h-5 text-brand-gold" />
            <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Related Resources</h3>
          </div>

          <RelatedBlogs currentBlogSlug={blog.slug} category={blog.category} />
        </div>

      </div>
    </div>
  );
};
