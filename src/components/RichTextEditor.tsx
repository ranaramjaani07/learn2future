import React, { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";

import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough as StrikeIcon,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Image as ImageIcon,
  Link as LinkIcon,
  Link2Off,
  Table as TableIcon,
  Quote,
  Code,
  Minus,
  AlertCircle,
  Eye,
  FileText,
  RefreshCw,
  Sparkles,
  X,
  Palette,
  Undo2,
  Redo2,
  ChevronDown,
  Trash2
} from "lucide-react";
import { ref, uploadBytes as put, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import { compressAndUploadImage } from "../lib/imageUpload";

// Custom TextStyle extension with font-size custom attributes
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
    };
  },
});

// Custom Image extension supporting custom display size and horizontal alignment styles
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        parseHTML: (element) => element.style.width || element.getAttribute("width") || "100%",
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return {
            style: `width: ${attributes.width}; max-width: 100%; height: auto; display: block;`,
          };
        },
      },
      alignment: {
        default: "center",
        parseHTML: (element) => element.style.textAlign || element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => {
          const align = attributes.alignment || "center";
          let margin = "1.5rem auto";
          if (align === "left") margin = "1.5rem auto 1.5rem 0";
          if (align === "right") margin = "1.5rem 0 1.5rem auto";
          return {
            "data-align": align,
            style: `display: block; margin: ${margin}; max-width: 100%; height: auto; border-radius: 12px;`,
          };
        },
      },
    };
  },
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  postId?: string; // unique draft backup namespace
  onSaveDraft?: (value: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  postId = "new_post",
  onSaveDraft,
}) => {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [lastAutoSaved, setLastAutoSaved] = useState<string>("");

  // Dialog / modal states
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageWidth, setImageWidth] = useState("100%");
  const [imageAlign, setImageAlign] = useState("center");
  const [imageUploading, setImageUploading] = useState(false);

  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // Picker States for UI alignment sync
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [highlightColor, setHighlightColor] = useState("#D4AF37");
  const [fontSize, setFontSize] = useState("16px");
  const [fontFamily, setFontFamily] = useState("Inter");

  // Initialize TipTap Editor instance
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        blockquote: {
          HTMLAttributes: {
            class: "border-l-4 border-[#D4AF37] italic pl-4 my-6 py-2 text-neutral-300 bg-[#121212]/50 rounded-r-xl",
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: "bg-[#0f0f0f] border border-neutral-800 p-4 rounded-xl font-mono text-xs text-neutral-100 overflow-x-auto my-6",
          },
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-brand-gold hover:underline font-semibold",
          style: "color: #D4AF37; text-decoration: underline;",
        },
      }),
      CustomImage.configure({
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse border border-neutral-800 w-full rounded-xl overflow-hidden my-6 bg-[#0E0E0E]",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-neutral-800 p-3 bg-[#161616] text-[#D4AF37] font-bold text-left",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-neutral-800 p-3 bg-[#0A0A0A] text-neutral-300",
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "my-4 space-y-2",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "flex items-start gap-2 text-sm",
        },
      }),
      Placeholder.configure({
        placeholder: "Start composing your blog publication. Type freely with rich TipTap engine controls...",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph", "image"],
      }),
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({
        multicolor: true,
      }),
      FontSize,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync state changes from parents/database selectively when NOT focused to prevent cursor jumping
  useEffect(() => {
    if (!editor) return;
    if (editor.isFocused) return;
    
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "<p></p>");
    }
  }, [value, editor]);

  // Auto Save Draft logic (Triggered every 30 seconds)
  useEffect(() => {
    if (!editor) return;

    const interval = setInterval(() => {
      const html = editor.getHTML();
      if (html && html !== "<p></p>" && !editor.isEmpty) {
        localStorage.setItem(`blog_draft_${postId}`, html);
        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setLastAutoSaved(now);
        if (onSaveDraft) {
          onSaveDraft(html);
        }
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [editor, postId, onSaveDraft]);

  if (!editor) {
    return null;
  }

  // Restore Draft backup
  const loadSavedDraft = () => {
    const saved = localStorage.getItem(`blog_draft_${postId}`);
    if (saved) {
      editor.commands.setContent(saved);
      onChange(saved);
      alert("Draft backup successfully restored into editor!");
    } else {
      alert("No temporary backup copy was located for this specific article.");
    }
  };

  // Deleted inline compressImage helper in favor of optimized global imageUpload module

  // Image Upload handler
  const handleLocalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Chosen file size exceeds 10MB limit.");
      return;
    }

    setImageUploading(true);
    try {
      // Compress on-the-fly to < 200KB and upload securely to Firebase Storage
      const downloadUrl = await compressAndUploadImage(file, "blogs/editor");
      setImageUrl(downloadUrl);
    } catch (err: any) {
      console.error("[RichTextEditor] Image upload failed:", err);
      alert(`Could not upload image: ${err?.message || err}`);
    } finally {
      setImageUploading(false);
    }
  };

  // Insert Image trigger
  const handleInsertImageSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!imageUrl) return;

    editor.chain().focus().setImage({
      src: imageUrl,
      alt: imageAlt || "Empowering tech curriculum guide graphic",
      title: imageAlt,
      width: imageWidth,
      alignment: imageAlign,
    } as any).run();

    setImageUrl("");
    setImageAlt("");
    setImageWidth("100%");
    setImageAlign("center");
    setShowImageModal(false);
  };

  // Link Trigger
  const handleInsertLinkSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!linkUrl) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl, target: "_blank" }).run();
    }
    setLinkUrl("");
    setShowLinkModal(false);
  };

  // Table Insert
  const handleInsertTableSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
    setShowTableModal(false);
  };

  // Custom Content Block insert helpers
  const insertDivider = () => {
    editor.chain().focus().setHorizontalRule().run();
  };

  const insertQuote = () => {
    editor.chain().focus().toggleBlockquote().run();
  };

  const insertCodeBlock = () => {
    editor.chain().focus().toggleCodeBlock().run();
  };

  const insertCallout = () => {
    const calloutHtml = `
      <div class="callout-block" style="padding: 1.25rem; border: 1px solid rgba(212,175,55,0.25); background-color: rgba(212,175,55,0.06); border-radius: 12px; margin: 1.5rem 0; display: flex; align-items: flex-start; gap: 0.75rem; color: #FFFFFF;">
        <span style="font-size: 1.25rem; line-height: 1.2;">💡</span>
        <div>
          <strong style="color: #D4AF37; font-size: 0.875rem;">Important Notice:</strong>
          <p style="margin: 0.25rem 0 0 0; color: #E5E7EB; font-size: 0.85rem;">Input your critical warning, syllabus summary, or resource hyperlink detail coordinates here.</p>
        </div>
      </div>
    `;
    editor.chain().focus().insertContent(calloutHtml).run();
  };

  // Style helper callbacks
  const setFontFamilyValue = (family: string) => {
    setFontFamily(family);
    editor.chain().focus().setFontFamily(family).run();
  };

  const setFontSizeValue = (size: string) => {
    setFontSize(size);
    editor.chain().focus().setMark("textStyle", { fontSize: size }).run();
  };

  const setTextColorValue = (color: string) => {
    setTextColor(color);
    editor.chain().focus().setColor(color).run();
  };

  const setHighlightColorValue = (color: string) => {
    setHighlightColor(color);
    editor.chain().focus().setHighlight({ color: color }).run();
  };

  return (
    <div id="tiptap-editor-component" className="w-full flex flex-col border border-neutral-200 dark:border-brand-border rounded-2xl overflow-hidden bg-[#0A0A0A]">
      
      {/* 1. EMBEDDED DYNAMIC STYLESHEET EXPLICITLY SECURING ABSOLUTE VISUAL CORRECTIONS */}
      <style>{`
        /* TipTap Scrollbar */
        .scrollbar-horizontal::-webkit-scrollbar {
          height: 5px;
        }
        .scrollbar-horizontal::-webkit-scrollbar-track {
          background: #0A0A0A;
        }
        .scrollbar-horizontal::-webkit-scrollbar-thumb {
          background: #222222;
          border-radius: 99px;
        }
        .scrollbar-horizontal::-webkit-scrollbar-thumb:hover {
          background: #D4AF37;
        }

        /* Essential TipTap Core Structural Overrides - Solving text color, selection & cursor */
        .ProseMirror {
          min-height: 400px;
          max-height: 600px;
          overflow-y: auto;
          outline: none;
          background-color: #0A0A0A !important;
          color: #FFFFFF !important;
          padding: 1.5rem;
          font-family: inherit;
          font-size: 0.875rem;
          line-height: 1.75;
          text-align: left;
          caret-color: #D4AF37 !important;
        }

        /* Cursor/Caret must always capture yellow color securely */
        .ProseMirror * {
          caret-color: #D4AF37 !important;
        }

        /* Selection highlights must have vibrant gold background with robust accessibility values */
        .ProseMirror ::selection {
          background-color: rgba(212, 175, 55, 0.35) !important;
          color: #FFFFFF !important;
        }
        .ProseMirror * ::selection {
          background-color: rgba(212, 175, 55, 0.35) !important;
          color: #FFFFFF !important;
        }

        /* Empty state prompt text decoration configuration */
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9CA3AF !important;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }

        /* Semantic Block Typography stylings */
        .ProseMirror h1 {
          font-size: 2rem !important;
          font-weight: 800 !important;
          margin-top: 1.75rem !important;
          margin-bottom: 0.75rem !important;
          color: #FFFFFF !important;
          line-height: 1.3 !important;
        }
        .ProseMirror h2 {
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          margin-top: 1.5rem !important;
          margin-bottom: 0.5rem !important;
          color: #FFFFFF !important;
          line-height: 1.35 !important;
        }
        .ProseMirror h3 {
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          margin-top: 1.25rem !important;
          margin-bottom: 0.5rem !important;
          color: #FFFFFF !important;
          line-height: 1.4 !important;
        }
        .ProseMirror h4 {
          font-size: 1.125rem !important;
          font-weight: 600 !important;
          margin-top: 1rem !important;
          margin-bottom: 0.35rem !important;
          color: #FFFFFF !important;
        }
        .ProseMirror p {
          margin-bottom: 1rem !important;
          color: #E5E7EB !important;
        }

        /* List Items Core */
        .ProseMirror ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin-bottom: 1rem !important;
        }
        .ProseMirror ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin-bottom: 1rem !important;
        }
        .ProseMirror li {
          margin-bottom: 0.35rem !important;
          color: #E5E7EB !important;
        }

        /* Interactive Checklist elements */
        .ProseMirror ul[data-type="taskList"] {
          list-style-type: none !important;
          padding-left: 0.25rem !important;
          margin-bottom: 1rem !important;
        }
        .ProseMirror ul[data-type="taskList"] li {
          display: flex !important;
          align-items: flex-start !important;
          gap: 0.5rem !important;
        }
        .ProseMirror ul[data-type="taskList"] input[type="checkbox"] {
          accent-color: #D4AF37 !important;
          margin-top: 0.4rem !important;
          cursor: pointer !important;
          width: 14px !important;
          height: 14px !important;
        }

        /* Image embeds and interactive align behaviors */
        .ProseMirror img {
          max-width: 100% !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5) !important;
          border: 1px solid #1C1C1C !important;
        }
        
        /* Table rendering block */
        .ProseMirror table {
          border-collapse: collapse !important;
          margin: 1.5rem 0 !important;
          width: 100% !important;
          overflow: hidden !important;
          border-radius: 8px !important;
          border: 1px solid #222222 !important;
        }
        .ProseMirror td, .ProseMirror th {
          border: 1px solid #222222 !important;
          padding: 10px 14px !important;
          min-width: 100px !important;
        }
        .ProseMirror th {
          background-color: rgba(212, 175, 55, 0.08) !important;
          color: #D4AF37 !important;
          font-weight: 700 !important;
        }
      `}</style>

      {/* HEADER BAR: CANVAS CONTROLS / TAB SWITCHER */}
      <div className="flex items-center justify-between border-b border-neutral-900 bg-[#070707] p-2">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            id="tab-edit-composer"
            onClick={() => setActiveTab("edit")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold font-display transition-all ${
              activeTab === "edit"
                ? "bg-brand-gold text-black shadow-lg"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Composer Canvas</span>
          </button>
          <button
            type="button"
            id="tab-preview-live"
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold font-display transition-all ${
              activeTab === "preview"
                ? "bg-brand-gold text-black shadow-lg"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Live Simulator</span>
          </button>
        </div>

        {/* Draft Backup metadata and backup triggers */}
        <div className="flex items-center space-x-2.5 bg-black/40 px-2 py-1 rounded-xl">
          {lastAutoSaved && (
            <span className="text-[10px] font-mono text-[#D4AF37] flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin duration-3000" />
              AutoSaved {lastAutoSaved}
            </span>
          )}
          <button
            type="button"
            id="btn-restore-draft"
            onClick={loadSavedDraft}
            className="text-[10px] text-neutral-400 hover:text-white font-mono bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800/80 px-2.5 py-1 rounded-lg transition-colors"
            title="Restore last auto-save version"
          >
            Restore Backup
          </button>
        </div>
      </div>

      {activeTab === "edit" ? (
        <>
          {/* 2. COMPOSER WYSIWYG TOOLBAR */}
          <div className="p-2.5 bg-[#070707] border-b border-neutral-900 flex flex-wrap gap-2 items-center justify-start max-h-[180px] overflow-x-auto scrollbar-horizontal select-none">
            
            {/* UNDO / REDO GROUP */}
            <div className="flex items-center bg-[#111111] border border-neutral-800 rounded-lg p-0.5">
              <button
                type="button"
                id="btn-undo"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="Undo (Ctrl+Z)"
                className="p-1.5 hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent rounded text-neutral-300 hover:text-white transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="btn-redo"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="Redo (Ctrl+Y)"
                className="p-1.5 hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent rounded text-neutral-300 hover:text-white transition-colors"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* TYPOGRAPHY BLOCKS SELECTOR */}
            <div className="flex items-center bg-[#111111] border border-neutral-800 rounded-l-lg p-0.5">
              <button
                type="button"
                id="btn-h1"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                title="Heading 1"
                className={`px-2 py-1 text-xs font-black rounded transition-colors ${
                  editor.isActive("heading", { level: 1 })
                    ? "bg-brand-gold text-black"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                H1
              </button>
              <button
                type="button"
                id="btn-h2"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                title="Heading 2"
                className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                  editor.isActive("heading", { level: 2 })
                    ? "bg-brand-gold text-black"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                H2
              </button>
              <button
                type="button"
                id="btn-h3"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                title="Heading 3"
                className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                  editor.isActive("heading", { level: 3 })
                    ? "bg-brand-gold text-black"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                H3
              </button>
              <button
                type="button"
                id="btn-h4"
                onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                title="Heading 4"
                className={`px-2 py-1 text-[10px] lowercase font-semibold rounded transition-colors ${
                  editor.isActive("heading", { level: 4 })
                    ? "bg-brand-gold text-black"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                H4
              </button>
              <button
                type="button"
                id="btn-para"
                onClick={() => editor.chain().focus().setParagraph().run()}
                title="Standard Paragraph"
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  editor.isActive("paragraph")
                    ? "bg-brand-gold text-black"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                P
              </button>
            </div>

            {/* FONT FAMILY SELECTOR */}
            <div className="flex items-center bg-[#111111] border border-neutral-800 rounded-lg px-2 py-1">
              <span className="text-[9px] text-neutral-500 mr-1.5 font-mono">Font:</span>
              <select
                id="select-font-family"
                value={fontFamily}
                onChange={(e) => setFontFamilyValue(e.target.value)}
                className="text-[10px] font-sans font-bold bg-transparent border-none text-neutral-300 focus:outline-none cursor-pointer"
              >
                <option value="Inter" className="bg-[#0A0A0A] text-white">Inter (Sans)</option>
                <option value="Space Grotesk" className="bg-[#0A0A0A] text-white">Space Grotesk</option>
                <option value="JetBrains Mono" className="bg-[#0A0A0A] text-white">JetBrains Mono</option>
                <option value="Playfair Display" className="bg-[#0A0A0A] text-white">Playfair Display</option>
                <option value="Outfit" className="bg-[#0A0A0A] text-white">Outfit</option>
              </select>
            </div>

            {/* FONT SIZE SELECTOR */}
            <div className="flex items-center bg-[#111111] border border-neutral-800 rounded-lg px-2 py-1">
              <span className="text-[9px] text-neutral-500 mr-1.5 font-mono">Size:</span>
              <select
                id="select-font-size"
                value={fontSize}
                onChange={(e) => setFontSizeValue(e.target.value)}
                className="text-[10px] font-mono bg-transparent border-none text-neutral-300 focus:outline-none cursor-pointer"
              >
                <option value="12px" className="bg-[#0A0A0A] text-white">12px</option>
                <option value="14px" className="bg-[#0A0A0A] text-white">14px</option>
                <option value="16px" className="bg-[#0A0A0A] text-white">16px</option>
                <option value="18px" className="bg-[#0A0A0A] text-white">18px</option>
                <option value="20px" className="bg-[#0A0A0A] text-white">20px</option>
                <option value="24px" className="bg-[#0A0A0A] text-white">24px</option>
                <option value="32px" className="bg-[#0A0A0A] text-white">32px</option>
                <option value="40px" className="bg-[#0A0A0A] text-white">40px</option>
              </select>
            </div>

            {/* CORE CHARACTER FORMATS */}
            <div className="flex items-center bg-[#111111] border border-neutral-800 rounded-lg p-0.5">
              <button
                type="button"
                id="btn-bold"
                onClick={() => editor.chain().focus().toggleBold().run()}
                title="Bold (Ctrl+B)"
                className={`p-1.5 rounded transition bg-transparent ${
                  editor.isActive("bold") ? "text-[#D4AF37] bg-neutral-800" : "text-neutral-400 hover:text-white"
                }`}
              >
                <BoldIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="btn-italic"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                title="Italic (Ctrl+I)"
                className={`p-1.5 rounded transition bg-transparent ${
                  editor.isActive("italic") ? "text-[#D4AF37] bg-neutral-800" : "text-neutral-400 hover:text-white"
                }`}
              >
                <ItalicIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="btn-underline"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                title="Underline (Ctrl+U)"
                className={`p-1.5 rounded transition bg-transparent ${
                  editor.isActive("underline") ? "text-[#D4AF37] bg-neutral-800" : "text-neutral-400 hover:text-white"
                }`}
              >
                <UnderlineIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="btn-strikethrough"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                title="Strikethrough"
                className={`p-1.5 rounded transition bg-transparent ${
                  editor.isActive("strike") ? "text-[#D4AF37] bg-neutral-800" : "text-neutral-400 hover:text-white"
                }`}
              >
                <StrikeIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="btn-highlight"
                onClick={() => editor.chain().focus().toggleHighlight({ color: highlightColor }).run()}
                title="Highlight Range"
                className={`p-1.5 rounded transition bg-transparent ${
                  editor.isActive("highlight") ? "text-[#D4AF37] bg-neutral-800" : "text-neutral-400 hover:text-white"
                }`}
              >
                <span className="text-[10px] font-mono border-b border-[#D4AF37] px-0.5">High</span>
              </button>
            </div>

            {/* COLOR & HIGHLIGHT PICKERS */}
            <div className="flex items-center space-x-1 px-1.5 bg-[#111111] border border-neutral-800 rounded-lg py-1">
              <div className="flex items-center" title="Text Color">
                <Palette className="w-3 h-3 text-[#D4AF37]" />
                <input
                  type="color"
                  id="color-picker-text"
                  value={textColor}
                  onChange={(e) => setTextColorValue(e.target.value)}
                  className="w-4 h-4 border-none bg-transparent cursor-pointer ml-1 p-0 rounded-md"
                />
              </div>
              <div className="flex items-center border-l border-neutral-800 pl-1.5" title="Highlight Palette">
                <span className="text-[9px] text-neutral-500 px-0.5">Bg:</span>
                <input
                  type="color"
                  id="color-picker-highlight"
                  value={highlightColor}
                  onChange={(e) => setHighlightColorValue(e.target.value)}
                  className="w-4 h-4 border-none bg-transparent cursor-pointer p-0 rounded-md"
                />
              </div>
            </div>

            {/* ALIGNMENT BLOCK */}
            <div className="flex items-center bg-[#111111] border border-neutral-800 rounded-lg p-0.5" id="align-controls">
              <button
                type="button"
                id="btn-align-left"
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
                title="Align Left"
                className={`p-1.5 rounded transition ${
                  editor.isActive({ textAlign: "left" }) ? "text-[#D4AF37] bg-neutral-800" : "text-neutral-400 hover:text-white"
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="btn-align-center"
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
                title="Align Center"
                className={`p-1.5 rounded transition ${
                  editor.isActive({ textAlign: "center" }) ? "text-[#D4AF37] bg-neutral-800" : "text-neutral-400 hover:text-white"
                }`}
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="btn-align-right"
                onClick={() => editor.chain().focus().setTextAlign("right").run()}
                title="Align Right"
                className={`p-1.5 rounded transition ${
                  editor.isActive({ textAlign: "right" }) ? "text-[#D4AF37] bg-neutral-800" : "text-neutral-400 hover:text-white"
                }`}
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="btn-align-justify"
                onClick={() => editor.chain().focus().setTextAlign("justify").run()}
                title="Justify Text"
                className={`p-1.5 rounded transition ${
                  editor.isActive({ textAlign: "justify" }) ? "text-[#D4AF37] bg-neutral-800" : "text-neutral-400 hover:text-white"
                }`}
              >
                <AlignJustify className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* LIST TRIGGERS */}
            <div className="flex items-center bg-[#111111] border border-neutral-800 rounded-lg p-0.5">
              <button
                type="button"
                id="btn-bullet-list"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                title="Bullet List"
                className={`p-1.5 rounded transition ${
                  editor.isActive("bulletList") ? "text-[#D4AF37] bg-neutral-800" : "text-neutral-400 hover:text-white"
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="btn-ordered-list"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                title="Numbered List"
                className={`p-1.5 rounded transition ${
                  editor.isActive("orderedList") ? "text-[#D4AF37] bg-neutral-800" : "text-neutral-400 hover:text-white"
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="btn-checklist"
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                title="Interactive Checklist"
                className={`p-1.5 rounded transition ${
                  editor.isActive("taskList") ? "text-[#D4AF37] bg-neutral-800" : "text-neutral-400 hover:text-white"
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
              </button>
            </div>

            {/* LINKS CONTROLS */}
            <div className="flex items-center bg-[#111111] border border-neutral-800 rounded-lg p-0.5">
              <button
                type="button"
                id="btn-add-link"
                onClick={() => {
                  const previousUrl = editor.getAttributes("link").href || "";
                  setLinkUrl(previousUrl);
                  setShowLinkModal(true);
                }}
                title="Embed Hyperlink"
                className={`p-1.5 rounded transition ${
                  editor.isActive("link") ? "text-[#D4AF37] bg-neutral-800" : "text-neutral-400 hover:text-white"
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="btn-remove-link"
                onClick={() => editor.chain().focus().unsetLink().run()}
                disabled={!editor.isActive("link")}
                title="Cancel Hyperlink"
                className="p-1.5 hover:bg-neutral-800 disabled:opacity-40 rounded text-neutral-400 hover:text-white transition-colors"
              >
                <Link2Off className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* COMPONENT INSERTABLES (IMAGE / TABLE / DIVIDER) */}
            <div className="flex items-center bg-[#111111] border border-neutral-800 rounded-lg p-0.5 gap-0.5">
              <button
                type="button"
                id="btn-insert-image"
                onClick={() => setShowImageModal(true)}
                title="Embed Image"
                className="p-1.5 hover:bg-neutral-850 hover:text-[#D4AF37] transition rounded flex items-center gap-1 text-xs text-neutral-400 font-semibold"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-[10px]">Img</span>
              </button>

              <button
                type="button"
                id="btn-insert-table"
                onClick={() => setShowTableModal(true)}
                title="Insert Data Table"
                className={`p-1.5 hover:bg-neutral-850 hover:text-[#D4AF37] transition rounded flex items-center gap-1 text-xs font-semibold ${
                  editor.isActive("table") ? "text-[#D4AF37] bg-neutral-800" : "text-neutral-400"
                }`}
              >
                <TableIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-[10px]">Table</span>
              </button>
            </div>

            {/* BLOCK STYLES */}
            <div className="flex items-center bg-[#111111] border border-neutral-800 rounded-lg p-0.5 gap-0.5">
              <button
                type="button"
                id="btn-block-quote"
                onClick={insertQuote}
                title="Quote Block"
                className={`p-1.5 rounded transition ${
                  editor.isActive("blockquote") ? "text-[#D4AF37] bg-neutral-800" : "text-neutral-400 hover:text-white"
                }`}
              >
                <Quote className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                id="btn-block-code"
                onClick={insertCodeBlock}
                title="Pre-formatted Code Snippet"
                className={`p-1.5 rounded transition ${
                  editor.isActive("codeBlock") ? "text-[#D4AF37] bg-neutral-800" : "text-neutral-400 hover:text-white"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                id="btn-block-divider"
                onClick={insertDivider}
                title="Divider Splitter Line"
                className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                id="btn-block-callout"
                onClick={insertCallout}
                title="Pro Warning/Syllabus Callout Box"
                className="p-1.5 hover:bg-neutral-800 hover:text-orange-400 rounded text-neutral-400 transition"
              >
                <AlertCircle className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
              </button>
            </div>

          </div>

          {/* TABLE OPERATIONS CONTEXT BAR (DISPLAYS DYNAMICALLY WHEN CURSOR IS LOCATED INSIDE A TABLE CELL) */}
          {editor.isActive("table") && (
            <div className="bg-[#0f0e0f]/95 border-b border-neutral-900 p-2 flex flex-wrap gap-1.5 items-center justify-start text-[10px] animate-in slide-in-from-top-1 duration-200">
              <span className="text-[#D4AF37] font-mono uppercase tracking-widest font-black mr-2 font-display">CELL LAYOUT ACTIONS:</span>
              
              <button type="button" onClick={() => editor.chain().focus().addRowBefore().run()} className="px-2 py-1 bg-neutral-900 hover:bg-[#D4AF37] hover:text-black hover:font-bold rounded-md border border-neutral-800 text-neutral-300">
                + Row Above
              </button>
              <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="px-2 py-1 bg-neutral-900 hover:bg-[#D4AF37] hover:text-black hover:font-bold rounded-md border border-neutral-800 text-neutral-300">
                + Row Below
              </button>
              <button type="button" onClick={() => editor.chain().focus().addColumnBefore().run()} className="px-2 py-1 bg-neutral-900 hover:bg-[#D4AF37] hover:text-black hover:font-bold rounded-md border border-neutral-800 text-neutral-300">
                + Col Left
              </button>
              <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-2 py-1 bg-neutral-900 hover:bg-[#D4AF37] hover:text-black hover:font-bold rounded-md border border-neutral-800 text-neutral-300">
                + Col Right
              </button>
              
              <div className="h-4 w-px bg-neutral-800 mx-1.5" />
              
              <button type="button" onClick={() => editor.chain().focus().mergeCells().run()} className="px-2 py-1 bg-[#1e251a] border border-[#2e4024] text-green-400 hover:bg-green-500 hover:text-black text-[9.5px] rounded-md font-bold">
                Merge Cells
              </button>
              <button type="button" onClick={() => editor.chain().focus().splitCell().run()} className="px-2 py-1 bg-[#251e1a] border border-[#402e24] text-orange-400 hover:bg-orange-500 hover:text-black text-[9.5px] rounded-md font-bold">
                Split Cells
              </button>
              
              <div className="h-4 w-px bg-neutral-800 mx-1.5" />
              
              <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="px-1.5 py-1 text-red-500 hover:bg-red-500/10 rounded">
                Del Row
              </button>
              <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="px-1.5 py-1 text-red-500 hover:bg-red-500/10 rounded">
                Del Col
              </button>
              <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="px-2 py-1 bg-red-950/40 hover:bg-red-600 border border-red-900/60 text-red-400 hover:text-white rounded-md flex items-center gap-1 font-bold">
                <Trash2 className="w-3 h-3" />
                DELETE TABLE
              </button>
            </div>
          )}

          {/* ACTIVE EDITING ZONE HOSTING TIPTAP CANVAS */}
          <div className="relative bg-[#0A0A0A] border-none flex-1 min-h-[400px]">
            <EditorContent editor={editor} className="outline-none" />
          </div>
        </>
      ) : (
        /* LIVE STATIC PREVIEW ACCELERATION SHEET */
        <div className="p-6 bg-[#0E0E0E] min-h-[400px] overflow-y-auto max-h-[500px]">
          <div className="bg-[#050505] border border-neutral-900 p-8 rounded-2xl max-w-2xl mx-auto shadow-2xl text-left">
            <h1 className="font-display text-2.5xl font-black text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              <span>Article Active Preview Rendering</span>
            </h1>
            <hr className="border-neutral-900 mb-6" />
            
            <div 
              className="prose prose-neutral dark:prose-invert max-w-none text-sm text-neutral-300 space-y-4"
              dangerouslySetInnerHTML={{
                __html: editor.getHTML() || "<p class='italic text-neutral-500'>Draft Canvas is currently empty. Direct some dynamic typography to seed layout simulation.</p>"
              }} 
            />
          </div>
        </div>
      )}

      {/* FOOTER COUNTERS & METRICS PANEL */}
      <div className="bg-[#070707] border-t border-neutral-900 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-neutral-400">
        <div className="flex space-x-4">
          <span>Words: {editor.getHTML() ? editor.getHTML().replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length : 0}</span>
          <span>HTML Bytes: {editor.getHTML() ? editor.getHTML().length : 0}</span>
        </div>
        <div className="flex items-center space-x-1 text-neutral-500">
          <Sparkles className="w-3 h-3 text-brand-gold animate-bounce" />
          <span>Polished Professional Gutenberg TipTap Native Frame</span>
        </div>
      </div>

      {/* ==================================== MODAL OVERLAY DIRECTIVES ==================================== */}

      {/* 1. EMBED HYPERLINK SETTINGS MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F0F0F] border border-neutral-800 p-5 rounded-2xl w-full max-w-xs text-left animate-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-white font-display">Hyperlink Directive</h4>
              <button type="button" onClick={() => setShowLinkModal(false)} className="text-neutral-400 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[9px] font-mono text-neutral-400 uppercase mb-1">Anchor Address (URL)</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/future-syllabus"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleInsertLinkSubmit();
                    }
                  }}
                  className="w-full bg-black border border-neutral-800 rounded-lg p-2.5 outline-none focus:border-brand-gold text-white font-mono"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleInsertLinkSubmit()}
                  className="flex-1 bg-brand-gold text-black hover:bg-brand-gold/90 font-bold py-2 rounded-lg transition"
                >
                  Insert Link
                </button>
                {editor.isActive("link") && (
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run();
                      setShowLinkModal(false);
                    }}
                    className="bg-red-950/40 hover:bg-red-600 border border-red-900/60 text-red-400 hover:text-white font-bold px-3 py-2 rounded-lg transition"
                  >
                    Unlink
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. IMAGE INSERTION / UPLOAD DIALOG */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F0F0F] border border-neutral-800 p-5 rounded-2xl w-full max-w-md text-left animate-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-white font-display">Embed Media Element</h4>
              <button type="button" onClick={() => setShowImageModal(false)} className="text-neutral-400 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-[9px] font-mono text-neutral-400 uppercase mb-1.5">Upload Asset</label>
              <div className="border border-dashed border-neutral-800 rounded-xl p-4 text-center relative bg-black cursor-pointer hover:border-brand-gold transition duration-200">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLocalImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {imageUploading ? (
                  <div className="space-y-1.5 py-2">
                    <div className="w-5 h-5 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <span className="text-[10px] text-neutral-400 block font-mono">Uploading transaction copy to bucket...</span>
                  </div>
                ) : imageUrl ? (
                  <span className="text-[10px] text-brand-gold block font-mono">Image loaded! Click here to swap.</span>
                ) : (
                  <span className="text-[10px] text-neutral-500 block font-light">Drag asset here or click to browse up to 2MB (Cloud Persistent Storage)</span>
                )}
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[9px] font-mono text-neutral-400 uppercase mb-1">Or direct URL Location</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleInsertImageSubmit();
                    }
                  }}
                  className="w-full bg-black border border-neutral-800 rounded-lg p-2.5 outline-none focus:border-brand-gold text-white font-mono"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[9px] font-mono text-neutral-400 uppercase mb-1">Alt Text</label>
                  <input
                    type="text"
                    placeholder="Syllabus plot"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleInsertImageSubmit();
                      }
                    }}
                    className="w-full bg-black border border-neutral-800 rounded-lg p-2.5 outline-none focus:border-brand-gold text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-neutral-400 uppercase mb-1">Display Width</label>
                  <select
                    value={imageWidth}
                    onChange={(e) => setImageWidth(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-lg p-2.5 outline-none focus:border-brand-gold text-white cursor-pointer font-bold"
                  >
                    <option value="100%">100% (FullWidth)</option>
                    <option value="75%">75% (Centered)</option>
                    <option value="50%">50% (Compact)</option>
                    <option value="25%">25% (Thumb)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-neutral-400 uppercase mb-1">Align Placement</label>
                  <select
                    value={imageAlign}
                    onChange={(e) => setImageAlign(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-lg p-2.5 outline-none focus:border-brand-gold text-white cursor-pointer font-bold"
                  >
                    <option value="left">Left Align</option>
                    <option value="center">Centered</option>
                    <option value="right">Right Align</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleInsertImageSubmit()}
                className="w-full bg-brand-gold text-black hover:bg-brand-gold/90 font-bold py-2.5 rounded-lg transition mt-2"
              >
                Embed Image Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. TABLE DIMENSION MODAL */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F0F0F] border border-neutral-800 p-5 rounded-2xl w-full max-w-xs text-left animate-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-white font-display">Generate Matrix Table</h4>
              <button type="button" onClick={() => setShowTableModal(false)} className="text-neutral-400 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[9px] font-mono text-neutral-400 uppercase mb-1">Rows</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    required
                    value={tableRows}
                    onChange={(e) => setTableRows(parseInt(e.target.value) || 2)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleInsertTableSubmit();
                      }
                    }}
                    className="w-full bg-black border border-neutral-800 rounded-lg p-2.5 outline-none focus:border-brand-gold text-white font-bold text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-neutral-400 uppercase mb-1">Columns</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    required
                    value={tableCols}
                    onChange={(e) => setTableCols(parseInt(e.target.value) || 2)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleInsertTableSubmit();
                      }
                    }}
                    className="w-full bg-black border border-neutral-800 rounded-lg p-2.5 outline-none focus:border-brand-gold text-white font-bold text-center font-mono"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleInsertTableSubmit()}
                className="w-full bg-brand-gold text-black hover:bg-brand-gold/90 font-bold py-2.5 rounded-lg transition"
              >
                Incorporate Table Node
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
