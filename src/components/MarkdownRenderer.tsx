import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Detect if content is HTML from WYSIWYG editor
  // TipTap saves as HTML which starts with an HTML tag (like <p>, <h2>, etc.)
  // Markdown files typically start with markdown elements or plain text, not tag elements.
  const isHTML = content.trim().startsWith("<") && 
                 !content.trim().startsWith("<!--") && 
                 !content.trim().startsWith("<title") && 
                 !content.trim().startsWith("<meta") && 
                 !content.trim().startsWith("<link");

  const parseInlineStyles = (text: string) => {
    // Escape simple tags, then replace bold, italic and links
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold replacement (`**text**`)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    
    // Italic replacement (`*text*` or `_text_`)
    formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");
    formatted = formatted.replace(/_(.*?)_/g, "<em>$1</em>");

    // Inline code replacement (` `code` `)
    formatted = formatted.replace(/`(.*?)`/g, "<code class='bg-neutral-100 dark:bg-neutral-800 text-brand-gold text-[12px] px-1.5 py-0.5 rounded font-mono'>$1</code>");

    // Link replacement (`[text](url)`)
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' target='_blank' rel='noopener noreferrer' class='text-brand-gold hover:underline font-semibold'>$1</a>");

    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  if (isHTML) {
    return (
      <div 
        className="prose prose-neutral dark:prose-invert max-w-none text-base text-neutral-800 dark:text-neutral-200 text-left space-y-4 leading-relaxed break-words blog-content-container"
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
  
  let currentListType: "ul" | "ol" | null = null;
  let currentListItems: { text: string; isChecked?: boolean }[] = [];

  let inTable = false;
  let tableRows: string[][] = [];

  const flushList = (key: number) => {
    if (currentListType && currentListItems.length > 0) {
      if (currentListType === "ol") {
        parsedElements.push(
          <ol key={`list-ol-${key}`} className="list-decimal pl-6 space-y-2.5 my-5 text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {currentListItems.map((item, i) => (
              <li key={i} className="pl-1">
                {parseInlineStyles(item.text)}
              </li>
            ))}
          </ol>
        );
      } else {
        parsedElements.push(
          <ul key={`list-ul-${key}`} className="space-y-2.5 my-5 text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {currentListItems.map((item, i) => {
              if (item.isChecked !== undefined) {
                return (
                  <li key={i} className="flex items-start space-x-2.5 pl-1">
                    <span className="flex-shrink-0 mt-1">
                      <input 
                        type="checkbox" 
                        checked={item.isChecked} 
                        readOnly 
                        className="h-4.5 w-4.5 rounded-sm border-neutral-300 text-amber-500 focus:ring-amber-500 dark:border-neutral-700 dark:bg-neutral-800" 
                      />
                    </span>
                    <span className={item.isChecked ? "line-through text-neutral-400 dark:text-neutral-500 font-light" : ""}>
                      {parseInlineStyles(item.text)}
                    </span>
                  </li>
                );
              }
              return (
                <li key={i} className="relative pl-6 before:absolute before:left-1 before:top-[0.625em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-brand-gold">
                  {parseInlineStyles(item.text)}
                </li>
              );
            })}
          </ul>
        );
      }
      currentListItems = [];
      currentListType = null;
    }
  };

  const flushTable = (key: number) => {
    if (inTable && tableRows.length > 0) {
      const filteredRows = tableRows.filter(row => {
        return !row.every(cell => cell.trim().match(/^-+$/) || cell.trim() === "");
      });

      if (filteredRows.length > 0) {
        const hasHeader = tableRows.length > 1;
        const headers = hasHeader ? filteredRows[0] : [];
        const dataRows = hasHeader ? filteredRows.slice(1) : filteredRows;

        parsedElements.push(
          <div key={`table-${key}`} className="overflow-x-auto my-6 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
              {hasHeader && headers.length > 0 && (
                <thead className="bg-neutral-50 dark:bg-neutral-900/40">
                  <tr>
                    {headers.map((header, hIdx) => (
                      <th key={hIdx} className="px-4 py-3 text-left font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-800">
                        {parseInlineStyles(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850 bg-white dark:bg-transparent">
                {dataRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-3 text-neutral-700 dark:text-neutral-350 border-b border-neutral-150 dark:border-neutral-800">
                        {parseInlineStyles(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      tableRows = [];
      inTable = false;
    }
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const trimmed = rawLine.trim();

    // 1. Triple-backtick Code Blocks
    if (trimmed.startsWith("```")) {
      flushList(idx);
      flushTable(idx);
      if (inCodeBlock) {
        parsedElements.push(
          <pre key={`code-${idx}`} className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl overflow-x-auto font-mono text-[11px] sm:text-xs text-neutral-200 my-6 shadow-inner tracking-wide leading-relaxed">
            <code>{codeSnippet.join("\n")}</code>
          </pre>
        );
        codeSnippet = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeSnippet.push(rawLine);
      continue;
    }

    // 2. Tables parsing
    const isTableLine = trimmed.startsWith("|") && trimmed.endsWith("|");
    if (isTableLine) {
      flushList(idx);
      inTable = true;
      const cells = rawLine.split("|").map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
      tableRows.push(cells);
      continue;
    } else {
      flushTable(idx);
    }

    // 3. Lists parsing (Checklists, Bullet lists, Numbered lists)
    const taskMatch = trimmed.match(/^-\s+\[([ xX])\]\s+(.*)$/);
    const ulMatch = trimmed.match(/^([-\*\+])\s+(.*)$/);
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);

    if (taskMatch) {
      const isChecked = taskMatch[1].toLowerCase() === "x";
      const text = taskMatch[2];
      if (currentListType !== "ul") {
        flushList(idx);
        currentListType = "ul";
      }
      currentListItems.push({ text, isChecked });
      continue;
    } else if (ulMatch) {
      const text = ulMatch[2];
      if (currentListType !== "ul") {
        flushList(idx);
        currentListType = "ul";
      }
      currentListItems.push({ text });
      continue;
    } else if (olMatch) {
      const text = olMatch[2];
      if (currentListType !== "ol") {
        flushList(idx);
        currentListType = "ol";
      }
      currentListItems.push({ text });
      continue;
    } else {
      flushList(idx);
    }

    // 4. Horizontal Rules
    const isDivider = trimmed === "---" || trimmed === "***" || trimmed === "___" || trimmed === "---" || /^[━─_=\-*]{4,}$/.test(trimmed);
    if (isDivider) {
      parsedElements.push(
        <hr key={idx} className="my-8 border-t border-neutral-200 dark:border-neutral-800" />
      );
      continue;
    }

    // 5. Headers
    if (trimmed.startsWith("# ")) {
      const headingText = trimmed.slice(2);
      const headingId = headingText.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      parsedElements.push(
        <h1 id={headingId} key={idx} className="font-display text-2xl sm:text-3.5xl font-extrabold text-neutral-900 dark:text-white mt-10 mb-4 tracking-tight leading-tight">
          {parseInlineStyles(headingText)}
        </h1>
      );
    } else if (trimmed.startsWith("## ")) {
      const headingText = trimmed.slice(3);
      const headingId = headingText.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      
      // If it contains only separator line, don't show text, show sub divider
      if (/^[━─_=\-*]+$/.test(headingText)) {
        parsedElements.push(
          <div key={idx} className="my-6 border-b border-dashed border-neutral-200 dark:border-neutral-800" />
        );
      } else {
        parsedElements.push(
          <h2 id={headingId} key={idx} className="font-display text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-8 mb-4 tracking-tight border-b border-neutral-100 dark:border-neutral-800 pb-2">
            {parseInlineStyles(headingText)}
          </h2>
        );
      }
    } else if (trimmed.startsWith("### ")) {
      const headingText = trimmed.slice(4);
      const headingId = headingText.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      parsedElements.push(
        <h3 id={headingId} key={idx} className="font-display text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mt-6 mb-2 tracking-tight">
          {parseInlineStyles(headingText)}
        </h3>
      );
    } 
    // 6. Blockquotes
    else if (trimmed.startsWith("> ")) {
      parsedElements.push(
        <blockquote key={idx} className="border-l-4 border-brand-gold bg-amber-50/20 dark:bg-amber-950/10 py-4 px-6 rounded-r-2xl text-neutral-700 dark:text-neutral-300 italic my-6 font-display text-sm md:text-base leading-relaxed">
          {parseInlineStyles(trimmed.slice(2))}
        </blockquote>
      );
    }
    // 7. Normal paragraphs
    else {
      if (trimmed === "") {
        continue;
      }
      parsedElements.push(
        <p key={idx} className="text-base sm:text-[16.5px] text-neutral-700 dark:text-neutral-300 leading-relaxed my-4.5 font-normal text-left break-words">
          {parseInlineStyles(trimmed)}
        </p>
      );
    }
  }

  // Final flushes
  flushList(lines.length);
  flushTable(lines.length);

  return (
    <div className="space-y-1 blog-content-container" id="html-content-renderer">
      {parsedElements}
    </div>
  );
};
