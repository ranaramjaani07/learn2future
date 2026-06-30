import React from "react";
import { Plus, FileText, Trash, Edit, X, Upload, Check } from "lucide-react";

const RichTextEditor = React.lazy(() => import("../../RichTextEditor").then(m => ({ default: m.RichTextEditor })));

interface Blog {
  id: string;
  title: string;
  slug: string;
  category: string;
  publishDate: string;
  author: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  seoKeywords?: string;
  canonicalUrl?: string;
  content: string;
}

interface BlogsTabProps {
  loadingBlogs: boolean;
  blogsList: Blog[];
  openBlogModal: (blogToEdit: Blog | null) => void;
  handleDeleteBlog: (blog: Blog) => void;
  showBlogModal: boolean;
  setShowBlogModal: (show: boolean) => void;
  editingBlog: Blog | null;
  blogError: string;
  handleSaveBlog: (e: React.FormEvent) => void;
  blogTitle: string;
  setBlogTitle: (title: string) => void;
  blogSlug: string;
  setBlogSlug: (slug: string) => void;
  blogCategory: string;
  setBlogCategory: (category: string) => void;
  blogPublishDate: string;
  setBlogPublishDate: (date: string) => void;
  blogAuthor: string;
  setBlogAuthor: (author: string) => void;
  blogMetaTitle: string;
  setBlogMetaTitle: (title: string) => void;
  blogMetaDescription: string;
  setBlogMetaDescription: (desc: string) => void;
  blogKeywords: string;
  setBlogKeywords: (keywords: string) => void;
  blogCanonicalUrl: string;
  setBlogCanonicalUrl: (url: string) => void;
  blogFeaturedImage: string;
  handleBlogImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingImage: boolean;
  blogContent: string;
  setBlogContent: (content: string) => void;
}

export const BlogsTab: React.FC<BlogsTabProps> = ({
  loadingBlogs,
  blogsList,
  openBlogModal,
  handleDeleteBlog,
  showBlogModal,
  setShowBlogModal,
  editingBlog,
  blogError,
  handleSaveBlog,
  blogTitle,
  setBlogTitle,
  blogSlug,
  setBlogSlug,
  blogCategory,
  setBlogCategory,
  blogPublishDate,
  setBlogPublishDate,
  blogAuthor,
  setBlogAuthor,
  blogMetaTitle,
  setBlogMetaTitle,
  blogMetaDescription,
  setBlogMetaDescription,
  blogKeywords,
  setBlogKeywords,
  blogCanonicalUrl,
  setBlogCanonicalUrl,
  blogFeaturedImage,
  handleBlogImageUpload,
  uploadingImage,
  blogContent,
  setBlogContent,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-200" id="admin-blogs-tab">
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
                    <React.Suspense fallback={<div className="p-4 text-center text-xs text-neutral-500 font-mono border border-dashed border-neutral-800 rounded-xl">Loading rich text editor engine...</div>}>
                      <RichTextEditor
                        postId={editingBlog ? editingBlog.id : "new_draft"}
                        value={blogContent}
                        onChange={setBlogContent}
                      />
                    </React.Suspense>
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
    </div>
  );
};
