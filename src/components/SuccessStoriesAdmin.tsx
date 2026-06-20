import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy 
} from "firebase/firestore";
import { db } from "../firebase";
import { 
  Search, 
  Sparkles, 
  Eye, 
  Check, 
  X, 
  ThumbsUp, 
  AlertTriangle, 
  Globe, 
  ChevronRight, 
  Clock, 
  UserCheck, 
  ArrowLeft,
  Loader2,
  Trash,
  CheckCircle,
  FileText,
  BadgeAlert
} from "lucide-react";

interface Portfolio {
  id: string;
  fullName: string;
  username: string;
  bio?: string;
  location?: string;
  occupation?: string;
  blogStatus: "Draft" | "Pending Review" | "Approved" | "Rejected" | "Published";
  aiBlogTitle?: string;
  aiBlogContent?: string;
  metaDescription?: string;
  seoKeywords?: string;
  updatedAt?: any;
}

export const SuccessStoriesAdmin: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [isEditingStory, setIsEditingStory] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedMetaDesc, setEditedMetaDesc] = useState("");
  const [editedKeywords, setEditedKeywords] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch all portfolios
  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "student_portfolios"));
      const snap = await getDocs(q);
      const list: Portfolio[] = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Portfolio[];
      setPortfolios(list);
    } catch (e) {
      console.error("Error fetching portfolios:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPortfolio = (p: Portfolio) => {
    setSelectedPortfolio(p);
    setEditedTitle(p.aiBlogTitle || "");
    setEditedContent(p.aiBlogContent || "");
    setEditedMetaDesc(p.metaDescription || "");
    setEditedKeywords(p.seoKeywords || "");
    setIsEditingStory(false);
  };

  const updateStatus = async (portfolioId: string, newStatus: Portfolio["blogStatus"]) => {
    setSaving(true);
    try {
      const refDef = doc(db, "student_portfolios", portfolioId);
      await updateDoc(refDef, { blogStatus: newStatus });
      
      // Update local state
      setPortfolios(prev => prev.map(p => p.id === portfolioId ? { ...p, blogStatus: newStatus } : p));
      if (selectedPortfolio && selectedPortfolio.id === portfolioId) {
        setSelectedPortfolio(prev => prev ? { ...prev, blogStatus: newStatus } : null);
      }
    } catch (err) {
      console.error("Failed to transition blogStatus:", err);
    } finally {
      setSaving(false);
    }
  };

  const saveStoryChanges = async () => {
    if (!selectedPortfolio) return;
    setSaving(true);
    try {
      const refDef = doc(db, "student_portfolios", selectedPortfolio.id);
      const updateData = {
        aiBlogTitle: editedTitle.trim(),
        aiBlogContent: editedContent.trim(),
        metaDescription: editedMetaDesc.trim(),
        seoKeywords: editedKeywords.trim()
      };
      await updateDoc(refDef, updateData);
      
      // Update local states
      setPortfolios(prev => prev.map(p => p.id === selectedPortfolio.id ? { ...p, ...updateData } : p));
      setSelectedPortfolio(prev => prev ? { ...prev, ...updateData } : null);
      setIsEditingStory(false);
    } catch (err) {
      console.error("Failed to commit story updates:", err);
    } finally {
      setSaving(false);
    }
  };

  const filteredPortfolios = portfolios.filter(p => {
    const queryLower = searchQuery.toLowerCase();
    const matchesSearch = 
      p.fullName.toLowerCase().includes(queryLower) || 
      (p.username && p.username.toLowerCase().includes(queryLower)) ||
      (p.occupation && p.occupation.toLowerCase().includes(queryLower));
    
    if (statusFilter === "All") return matchesSearch;
    return matchesSearch && p.blogStatus === statusFilter;
  });

  return (
    <div className="space-y-6 pt-4 text-xs sm:text-sm text-neutral-800 dark:text-neutral-200">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-900 pb-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white font-display flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-brand-gold" />
            <span>Success Story Blog Editorial Dashboard</span>
          </h2>
          <p className="text-xs text-neutral-500">Edit, approve, and dynamic publish generated student profiles & stories.</p>
        </div>
      </div>

      {!selectedPortfolio ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3.5 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search student or niche..."
                className="w-full bg-neutral-100 dark:bg-[#141414] border border-neutral-250 dark:border-neutral-900 px-9 py-2.5 rounded-xl outline-none focus:border-brand-gold text-xs"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap gap-1.5 self-start md:self-auto">
              {["All", "Draft", "Pending Review", "Approved", "Rejected", "Published"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition ${
                    statusFilter === status 
                      ? "bg-brand-gold text-black font-bold" 
                      : "bg-neutral-100 dark:bg-neutral-905 hover:bg-neutral-200 dark:hover:bg-neutral-900 text-neutral-550"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Table / Grid */}
          {loading ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 text-brand-gold animate-spin mx-auto" />
              <p className="mt-2 text-xs text-neutral-500 font-mono">LOADING SUCCESS STORY RECORDS...</p>
            </div>
          ) : filteredPortfolios.length > 0 ? (
            <div className="bg-white dark:bg-[#0f0f0f] border border-neutral-200 dark:border-neutral-900 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-950 text-[10px] font-mono tracking-wider uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-900/60">
                    <th className="p-4">Student Info</th>
                    <th className="p-4">SEO URL</th>
                    <th className="p-4">Occupation</th>
                    <th className="p-4">Blog Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                  {filteredPortfolios.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-neutral-900 dark:text-white">{p.fullName}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">UID: {p.id.substring(0, 8)}...</div>
                      </td>
                      <td className="p-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                        /student/<span className="text-brand-gold font-bold">{p.username}</span>
                      </td>
                      <td className="p-4 text-neutral-500">
                        {p.occupation || "Certified Professional"}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                          p.blogStatus === "Published" ? "bg-green-500/10 text-green-505 border border-green-500/20" :
                          p.blogStatus === "Approved" ? "bg-emerald-500/10 text-emerald-505 border border-emerald-500/20" :
                          p.blogStatus === "Pending Review" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse" :
                          p.blogStatus === "Rejected" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                          "bg-neutral-100 dark:bg-neutral-900 text-neutral-500"
                        }`}>
                          {p.blogStatus || "Draft"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleSelectPortfolio(p)}
                          className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-850 hover:text-brand-gold text-neutral-700 dark:text-neutral-300 transition px-3 py-1.5 rounded-lg text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review & Publish</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 bg-neutral-50 dark:bg-[#0f0f0f] border border-dashed border-neutral-250 dark:border-neutral-900 rounded-2xl text-neutral-500 text-xs font-mono">
              No matching success store portfolio drafts found under status "{statusFilter}".
            </div>
          )}
        </div>
      ) : (
        /* DETAIL REVIEW VIEWPORT */
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedPortfolio(null)}
            className="inline-flex items-center gap-1 text-neutral-500 hover:text-white transition font-mono text-xs uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back to Registry</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Meta Data panel (Left) */}
            <div className="lg:col-span-1 bg-white dark:bg-[#0f0f0f] border border-neutral-200 dark:border-neutral-900 p-5 rounded-2xl space-y-5 shadow-sm">
              <h3 className="font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-900 pb-3 font-display">Student Properties</h3>
              
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[9px] font-mono uppercase text-neutral-500 block">Student Name</span>
                  <span className="font-bold text-neutral-900 dark:text-white text-sm">{selectedPortfolio.fullName}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase text-neutral-500 block">SEO Public Link Handle</span>
                  <span className="font-mono text-xs text-brand-gold">/student/{selectedPortfolio.username}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase text-neutral-500 block">Niche / Occupation</span>
                  <span className="text-neutral-700 dark:text-neutral-300">{selectedPortfolio.occupation || "None"}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase text-neutral-500 block">Student Location</span>
                  <span className="text-neutral-700 dark:text-neutral-300">{selectedPortfolio.location || "India"}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase text-neutral-500 block">Short Biography</span>
                  <p className="text-neutral-500 leading-relaxed italic">"{selectedPortfolio.bio || "No biography provided."}"</p>
                </div>
              </div>

              {/* Status Actions Bar */}
              <div className="border-t border-neutral-100 dark:border-neutral-900 pt-5 space-y-3">
                <span className="text-[9px] font-mono uppercase text-neutral-500 block">State Transition Catalyst</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateStatus(selectedPortfolio.id, "Approved")}
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold py-2 px-3 rounded-lg transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Draft</span>
                  </button>
                  <button
                    onClick={() => updateStatus(selectedPortfolio.id, "Published")}
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-1 bg-brand-gold hover:bg-[#F5B300] disabled:opacity-40 text-black font-extrabold py-2 px-3 rounded-lg transition"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Publish Live</span>
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(selectedPortfolio.id, "Rejected")}
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-lg transition"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => updateStatus(selectedPortfolio.id, "Draft")}
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-1 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold py-2 px-3 rounded-lg transition"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Revert to Draft</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Compiled Success Story Content (Right / 2 cols) */}
            <div className="lg:col-span-2 bg-white dark:bg-[#0f0f0f] border border-neutral-200 dark:border-neutral-900 p-6 rounded-2xl space-y-5 shadow-sm text-left">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900 pb-3">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-neutral-905 dark:text-neutral-100 font-display">Success Story Compilation Text</h3>
                  <p className="text-xs text-neutral-500">Refine headlines, meta descriptions, or editorial body texts below.</p>
                </div>
                <button
                  onClick={() => setIsEditingStory(!isEditingStory)}
                  className="bg-neutral-100 dark:bg-neutral-900 hover:bg-brand-gold hover:text-black border border-neutral-250 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-mono font-bold px-3 py-1.5 rounded-lg transition"
                >
                  {isEditingStory ? "Cancel Editing" : "Live Refine text"}
                </button>
              </div>

              {isEditingStory ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-neutral-500">Story Title</label>
                    <input 
                      type="text" 
                      value={editedTitle}
                      onChange={e => setEditedTitle(e.target.value)}
                      className="w-full bg-neutral-100 dark:bg-neutral-905 border border-neutral-250 dark:border-neutral-850 px-4 py-2.5 rounded-xl outline-none focus:border-brand-gold text-white text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-neutral-500">Google SEO Meta Description</label>
                    <input 
                      type="text" 
                      value={editedMetaDesc}
                      onChange={e => setEditedMetaDesc(e.target.value)}
                      className="w-full bg-neutral-100 dark:bg-neutral-905 border border-neutral-250 dark:border-neutral-850 px-4 py-2.5 rounded-xl outline-none focus:border-brand-gold text-white text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-neutral-500">Google SEO Keywords (Comma-separated)</label>
                    <input 
                      type="text" 
                      value={editedKeywords}
                      onChange={e => setEditedKeywords(e.target.value)}
                      className="w-full bg-neutral-100 dark:bg-neutral-905 border border-neutral-250 dark:border-neutral-850 px-4 py-2.5 rounded-xl outline-none focus:border-brand-gold text-white text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-neutral-500">Markdown Compiled Article Body</label>
                    <textarea 
                      rows={14}
                      value={editedContent}
                      onChange={e => setEditedContent(e.target.value)}
                      className="w-full bg-neutral-100 dark:bg-neutral-905 border border-neutral-250 dark:border-neutral-850 px-4 py-3 rounded-xl outline-none focus:border-brand-gold text-white font-mono text-xs leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-3.5 border-t border-neutral-100 dark:border-neutral-900 pt-4">
                    <button
                      onClick={() => setIsEditingStory(false)}
                      className="px-4 py-2 bg-neutral-100 dark:bg-neutral-900 text-neutral-605 rounded-xl text-xs font-bold uppercase transition"
                    >
                      Discard edits
                    </button>
                    <button
                      onClick={saveStoryChanges}
                      disabled={saving}
                      className="bg-brand-gold hover:bg-[#F5B300] text-black font-extrabold text-xs px-6 py-2.5 rounded-xl transition"
                    >
                      {saving ? "Saving changes..." : "Commit story text"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-4 bg-neutral-50 dark:bg-[#070707] border border-neutral-200 dark:border-neutral-900 rounded-xl space-y-1">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase block">Story Title</span>
                    <h4 className="font-bold text-neutral-905 dark:text-white text-base font-display">{selectedPortfolio.aiBlogTitle || "Untitled Draft"}</h4>
                  </div>
                  
                  <div className="p-4 bg-neutral-50 dark:bg-[#070707] border border-neutral-200 dark:border-neutral-900 rounded-xl space-y-1">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase block">SEO Meta Description</span>
                    <p className="text-xs text-neutral-450">{selectedPortfolio.metaDescription || "Not set."}</p>
                  </div>

                  <div className="p-4 bg-neutral-50 dark:bg-[#070707] border border-neutral-200 dark:border-neutral-900 rounded-xl space-y-1">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase block">SEO Search Keywords</span>
                    <p className="font-mono text-xs text-brand-gold">{selectedPortfolio.seoKeywords || "None linked."}</p>
                  </div>

                  <div className="p-5 bg-neutral-50 dark:bg-[#070707] border border-neutral-200 dark:border-neutral-900 rounded-xl text-neutral-350 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                    {selectedPortfolio.aiBlogContent || "No AI story created. Let the student generate the draft first!"}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
