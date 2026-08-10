export interface CategoryConfig {
  name: string;
  slug: string;
  h1: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
}

export const CATEGORIES_CONFIG: CategoryConfig[] = [
  {
    name: "AI Tools",
    slug: "aitools",
    h1: "AI Tools & Autonomous Agents Courses",
    description: "Explore practical AI tools, autonomous agent workflows, prompt engineering, and LLM automation courses for beginners and professionals.",
    seoTitle: "AI Tools & Automation Courses | Learn 2 Future",
    seoDescription: "Master AI tools, prompt engineering, custom GPTs, and autonomous AI agents. Practical step-by-step courses to automate workflows and scale output."
  },
  {
    name: "Video Editing",
    slug: "videoediting",
    h1: "Video Editing Courses",
    description: "Explore practical video editing courses for beginners, creators and freelancers. Learn professional editing workflows, tools and techniques.",
    seoTitle: "Video Editing Courses | Learn 2 Future",
    seoDescription: "Learn Premiere Pro, After Effects, viral reel editing, and motion graphics. Master video editing skills to build a high-income freelance career."
  },
  {
    name: "Digital Marketing",
    slug: "digitalmarketing",
    h1: "Digital Marketing & Funnel Courses",
    description: "Master high-ROI digital marketing, paid advertising on Meta & Google, conversion funnels, and customer acquisition strategies.",
    seoTitle: "Digital Marketing & Funnels Courses | Learn 2 Future",
    seoDescription: "Comprehensive digital marketing courses. Master paid ads, conversion rate optimization, sales funnels, and performance marketing tactics."
  },
  {
    name: "YouTube Growth",
    slug: "youtubegrowth",
    h1: "YouTube Growth & Automation Courses",
    description: "Learn YouTube growth strategies, channel automation, high-retention editing, and monetization frameworks.",
    seoTitle: "YouTube Growth & Channel Automation Courses | Learn 2 Future",
    seoDescription: "Scale your YouTube channel with retention editing, viral script frameworks, and automated cash-cow workflows. High-impact courses for creators."
  },
  {
    name: "Freelancing",
    slug: "freelancing",
    h1: "High-Ticket Freelancing Courses",
    description: "Master high-ticket freelance client acquisition, cold outreach strategies, portfolio building, and international client pricing systems.",
    seoTitle: "High-Ticket Freelancing Courses | Learn 2 Future",
    seoDescription: "Learn how to find, close, and retain high-paying international freelance clients. Proven cold outreach, Upwork, and offer creation blueprints."
  },
  {
    name: "Business",
    slug: "business",
    h1: "Digital Business & Zero-Code SaaS Courses",
    description: "Discover zero-code SaaS accelerators, digital product frameworks, automated business models, and revenue systems.",
    seoTitle: "Digital Business & Zero-Code SaaS Courses | Learn 2 Future",
    seoDescription: "Launch and scale digital businesses, micro-SaaS subscriptions, and automated revenue products without writing complex code."
  },
  {
    name: "Self Improvement",
    slug: "selfimprovement",
    h1: "Self Improvement & Productivity Courses",
    description: "Build high-performance habits, cognitive frameworks, focus systems, and mental models for continuous digital execution.",
    seoTitle: "Self Improvement & Focus Systems | Learn 2 Future",
    seoDescription: "Upgrade your focus, discipline, and execution habits. Master mental models and systems designed for high-performing modern digital learners."
  }
];

export const DEFAULT_CATEGORIES = [
  "All",
  "AI Tools",
  "Video Editing",
  "Digital Marketing",
  "YouTube Growth",
  "Freelancing",
  "Business",
  "Self Improvement"
];

/**
 * Converts a display category name to its canonical URL slug.
 */
export function categoryToSlug(categoryName: string): string {
  if (!categoryName || categoryName === "All") return "";
  const match = CATEGORIES_CONFIG.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  if (match) return match.slug;
  return categoryName.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Resolves a URL slug to a matching category name.
 * Handles both hyphenated and un-hyphenated slugs (e.g. videoediting vs video-editing).
 */
export function slugToCategory(
  slug: string,
  availableCategories: string[] = DEFAULT_CATEGORIES
): string | null {
  if (!slug) return null;
  const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, "");

  // 1. Direct match in predefined configs
  const configMatch = CATEGORIES_CONFIG.find((c) => c.slug === normalizedSlug);
  if (configMatch) return configMatch.name;

  // 2. Match against available category names from DB or defaults
  for (const cat of availableCategories) {
    if (cat === "All") continue;
    const catNorm = cat.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (catNorm === normalizedSlug) return cat;
  }

  return null;
}

/**
 * Returns metadata (SEO title, description, h1) for a given category name.
 */
export function getCategoryMetadata(categoryName: string): CategoryConfig {
  const match = CATEGORIES_CONFIG.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  if (match) return match;

  const slug = categoryToSlug(categoryName);
  return {
    name: categoryName,
    slug: slug,
    h1: `${categoryName} Courses`,
    description: `Explore practical ${categoryName} courses for beginners and professionals. Master modern workflows and high-value digital skills.`,
    seoTitle: `${categoryName} Courses | Learn 2 Future`,
    seoDescription: `Browse top ${categoryName} courses on Learn 2 Future. Learn high-value skills to elevate your career and digital earning potential.`
  };
}
