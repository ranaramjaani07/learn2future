import React, { useState, useRef, useEffect, useId } from "react";
import { Search, Plus, Check, ChevronDown, X } from "lucide-react";
import { Course } from "../../../types";
import { DEFAULT_CATEGORIES } from "../../../lib/categoryUtils";

interface CategoryComboboxProps {
  value: string;
  onChange: (category: string) => void;
  courses?: Course[];
  label?: string;
  required?: boolean;
}

/**
 * Cleanly normalizes category names for comparison.
 * Trims leading/trailing whitespace and collapses internal multiple spaces.
 */
export function normalizeCategoryName(name: string): string {
  if (!name) return "";
  return name.trim().replace(/\s+/g, " ");
}

export const CategoryCombobox: React.FC<CategoryComboboxProps> = ({
  value,
  onChange,
  courses = [],
  label = "Category *",
  required = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  // 1. Derive available unique categories dynamically from course data + default categories
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    const list: string[] = [];

    const addCategory = (cat: string) => {
      const clean = normalizeCategoryName(cat);
      if (!clean) return;
      const lower = clean.toLowerCase();
      if (!set.has(lower)) {
        set.add(lower);
        list.push(clean);
      }
    };

    // Add default baseline categories first
    DEFAULT_CATEGORIES.filter((c) => c !== "All").forEach(addCategory);

    // Add categories dynamically from existing course catalog
    courses.forEach((c) => {
      if (c.category) {
        addCategory(c.category);
      }
    });

    // Add current selected value if it's new and not in the set
    if (value) {
      addCategory(value);
    }

    return list;
  }, [courses, value]);

  // 2. Filter categories based on search term (case-insensitive)
  const trimmedSearch = normalizeCategoryName(searchTerm);
  const filteredCategories = React.useMemo(() => {
    if (!trimmedSearch) return categories;
    return categories.filter((cat) =>
      cat.toLowerCase().includes(trimmedSearch.toLowerCase())
    );
  }, [categories, trimmedSearch]);

  // 3. Check for exact case-insensitive match to prevent duplicate creation
  const exactMatch = React.useMemo(() => {
    if (!trimmedSearch) return null;
    return categories.find(
      (cat) => cat.toLowerCase() === trimmedSearch.toLowerCase()
    ) || null;
  }, [categories, trimmedSearch]);

  const showAddOption = Boolean(trimmedSearch && !exactMatch);

  // Total selectable items in list
  const totalItems = filteredCategories.length + (showAddOption ? 1 : 0);

  // Reset active keyboard focus when search or dropdown visibility changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [searchTerm, isOpen]);

  // Handle outside click to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle category selection
  const handleSelect = (catName: string) => {
    const clean = normalizeCategoryName(catName);
    onChange(clean);
    setSearchTerm("");
    setIsOpen(false);
  };

  // Handle keydown for accessibility and keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape" || e.key === "Tab") {
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1 < totalItems ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filteredCategories.length) {
        handleSelect(filteredCategories[activeIndex]);
      } else if (activeIndex === filteredCategories.length && showAddOption) {
        handleSelect(trimmedSearch);
      } else if (filteredCategories.length > 0) {
        handleSelect(filteredCategories[0]);
      } else if (showAddOption) {
        handleSelect(trimmedSearch);
      }
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-[9.5px] text-neutral-400 tracking-wider font-mono uppercase mb-1">
          {label}
        </label>
      )}

      {/* Main Combobox Input / Trigger */}
      <div
        className="relative flex items-center cursor-pointer"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        <div
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-brand-border rounded-xl px-3.5 py-2.5 text-[11px] text-neutral-900 dark:text-white font-semibold flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-brand-gold transition-colors"
        >
          <span className="truncate pr-2">
            {value ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0" />
                {value}
              </span>
            ) : (
              <span className="text-neutral-400 font-normal">
                🔍 Search or select category...
              </span>
            )}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 shrink-0 ${
              isOpen ? "rotate-180 text-brand-gold" : ""
            }`}
          />
        </div>
      </div>

      {/* Hidden input for HTML form requirement validation if applicable */}
      {required && (
        <input
          type="text"
          tabIndex={-1}
          required={required}
          value={value}
          onChange={() => {}}
          className="sr-only"
          aria-hidden="true"
        />
      )}

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-[#181818] border border-neutral-200 dark:border-brand-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-72"
        >
          {/* Search Bar Input inside Popover */}
          <div className="p-2 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-black/40 flex items-center gap-2 shrink-0">
            <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-1.5" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type category name (e.g. Motion Graphics)..."
              className="w-full bg-transparent text-[11px] text-neutral-900 dark:text-white placeholder-neutral-400 font-medium focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm("");
                  inputRef.current?.focus();
                }}
                className="p-1 text-neutral-400 hover:text-white rounded-md"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Results List */}
          <div className="overflow-y-auto p-1.5 space-y-0.5 max-h-56">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat, idx) => {
                const isSelected =
                  value.toLowerCase() === cat.toLowerCase();
                const isHighlighted = idx === activeIndex;

                return (
                  <button
                    key={cat}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(cat)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full min-h-[38px] px-3 py-2 text-left text-[11px] font-medium rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-brand-gold/15 text-brand-gold font-bold"
                        : isHighlighted
                        ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-850"
                    }`}
                  >
                    <span className="truncate pr-2">{cat}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                    )}
                  </button>
                );
              })
            ) : !showAddOption ? (
              <div className="py-4 text-center text-[10.5px] text-neutral-400">
                No categories available
              </div>
            ) : null}

            {/* "+ Add Category" Option */}
            {showAddOption && (
              <button
                type="button"
                role="option"
                aria-selected={
                  activeIndex === filteredCategories.length
                }
                onClick={() => handleSelect(trimmedSearch)}
                onMouseEnter={() =>
                  setActiveIndex(filteredCategories.length)
                }
                className={`w-full min-h-[42px] mt-1 px-3 py-2 text-left text-[11px] font-bold rounded-xl flex items-center gap-2 border border-dashed transition-all cursor-pointer ${
                  activeIndex === filteredCategories.length
                    ? "bg-brand-gold text-black border-brand-gold shadow-md"
                    : "border-brand-gold/40 bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20"
                }`}
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  Add Category <strong className="underline">"{trimmedSearch}"</strong>
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
