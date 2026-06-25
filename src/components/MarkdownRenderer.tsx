import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Detect if content is HTML from WYSIWYG editor
  const isHTML = content.trim().startsWith("<") || /<[a-z][\s\S]*>/i.test(content);
  if (isHTML) {
    return (
      <div 
        className="prose prose-neutral dark:prose-invert max-w-none text-base text-neutral-800 dark:text-neutral-200 font-light text-left space-y-4 leading-relaxed break-words"
        id="html-content-renderer"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Split lines to parse custom markdown constructs
  const lines = content.split("\n");
  const parsedElements: React.ReactNode[] = [];
  
  let inCodeBlock = false;
  let codeSnippet: string[] = [];
  let inList = false;
  let listItems: string[] = [];

  const parseInlineStyles = (text: string) => {
    // Escape simple tags, then replace bold and links
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold replacement (`**text**`)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    
    // Inline code replacement (` `code` `)
    formatted = formatted.replace(/`(.*?)`/g, "<code class='bg-neutral-100 dark:bg-neutral-800 text-brand-gold text-[11px] px-1.5 py-0.5 rounded font-mono'>$1</code>");

    // Link replacement (`[text](url)`)
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' target='_blank' rel='noopener noreferrer' class='text-brand-gold hover:underline font-semibold'>$1</a>");

    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const flushList = (key: number) => {
    if (listItems.length > 0) {
      const listContent = (
        <ul key={`list-${key}`} className="list-disc list-inside space-y-2 my-4 text-base text-neutral-600 dark:text-neutral-350">
          {listItems.map((item, i) => (
            <li key={i}>{parseInlineStyles(item)}</li>
          ))}
        </ul>
      );
      parsedElements.push(listContent);
      listItems = [];
      inList = false;
    }
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const trimmed = rawLine.trim();

    // 1. Triple-backtick Code Blocks
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        parsedElements.push(
          <pre key={`code-${idx}`} className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl overflow-x-auto font-mono text-[11px] text-neutral-200 my-6 shadow-inner tracking-wide">
            <code>{codeSnippet.join("\n")}</code>
          </pre>
        );
        codeSnippet = [];
        inCodeBlock = false;
      } else {
        // Start code block
        flushList(idx);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeSnippet.push(rawLine);
      continue;
    }

    // 2. Unordered lists
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        inList = true;
      }
      listItems.push(trimmed.slice(2));
      continue;
    } else if (inList) {
      flushList(idx);
    }

    // 3. Headers
    if (trimmed.startsWith("# ")) {
      const headingText = trimmed.slice(2);
      const headingId = headingText.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      parsedElements.push(
        <h1 id={headingId} key={idx} className="font-display text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white mt-10 mb-4 tracking-tight leading-snug">
          {parseInlineStyles(headingText)}
        </h1>
      );
    } else if (trimmed.startsWith("## ")) {
      const headingText = trimmed.slice(3);
      const headingId = headingText.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      parsedElements.push(
        <h2 id={headingId} key={idx} className="font-display text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-8 mb-3.5 tracking-tight border-b border-neutral-100 dark:border-neutral-800 pb-2">
          {parseInlineStyles(headingText)}
        </h2>
      );
    } else if (trimmed.startsWith("### ")) {
      const headingText = trimmed.slice(4);
      const headingId = headingText.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      parsedElements.push(
        <h3 id={headingId} key={idx} className="font-display text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mt-6 mb-2 tracking-tight">
          {parseInlineStyles(headingText)}
        </h3>
      );
    } 
    // 4. Blockquotes
    else if (trimmed.startsWith("> ")) {
      parsedElements.push(
        <blockquote key={idx} className="border-l-4 border-brand-gold bg-neutral-50 dark:bg-[#121212] py-4 px-6 rounded-r-2xl text-neutral-700 dark:text-neutral-300 italic my-6 font-display text-sm">
          {parseInlineStyles(trimmed.slice(2))}
        </blockquote>
      );
    }
    // 5. Normal paragraphs or spaces
    else {
      if (trimmed === "") {
        // Skip empty paragraphs to keep vertical rhythm neat
        continue;
      }
      parsedElements.push(
        <p key={idx} className="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed my-4.5 font-light">
          {parseInlineStyles(trimmed)}
        </p>
      );
    }
  }

  // Final list flushing check
  if (inList) {
    flushList(lines.length);
  }

  return <div className="space-y-1">{parsedElements}</div>;
};
