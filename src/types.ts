export interface Course {
  id?: string;
  title: string;
  category: string;
  price: number;
  description: string;
  thumbnail: string;
  slug?: string;
  createdAt: any; // Firestore Timestamp
  deliveryUrl?: string; // Digital Delivery URL key
  deliverableLink?: string; // Secure deliverable Link assigned from Admin Panel
  welcomeVideoUrl?: string;
  deliveryInstructions?: string;
  thankYouHeading?: string;
  thankYouMessage?: string;

  // Expanded fields for sales page and SEO
  instructorName?: string;
  subCategory?: string;
  shortDescription?: string;
  longDescription?: string;
  courseOverview?: string;
  whoIsThisCourseFor?: string;
  whatYouWillLearn?: string;
  prerequisites?: string;
  courseDuration?: string;
  numberOfLessons?: number;
  language?: string;
  skillLevel?: string;
  certificateAvailable?: boolean;
  originalPrice?: number;
  offerPrice?: number;
  galleryImages?: string[];
  promoVideoUrl?: string;
  faqItems?: { question: string; answer: string }[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  courseTags?: string[];
  benefits?: string[];
  learningOutcomes?: string[];
  requirements?: string[];
  toolsNeeded?: string[];
  bonusResources?: string[];

  // Full CMS additions
  courseStatus?: "Draft" | "Published";
  isFeatured?: boolean;
  isPopular?: boolean;
  isTrending?: boolean;
  discountPercentage?: number;
  currency?: string;
  isLimitedTimeOffer?: boolean;
  bannerImage?: string;
  instructorImage?: string;
  previewVideoUrl?: string;
  courseSummary?: string;
  videoHours?: string;
  numberOfModules?: number;
  assignmentsCount?: number;
  projectsCount?: number;
  quizCount?: number;
  lifetimeAccess?: boolean;
  mobileAccess?: boolean;
  downloadableResources?: boolean;
  modules?: {
    id: string;
    title: string;
    lessons: {
      id: string;
      title: string;
      description: string;
      duration: string;
      type: "Video" | "PDF" | "Quiz" | "Assignment";
    }[];
  }[];
  focusKeyword?: string;
  secondaryKeywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  schemaDescription?: string;
  benefitsSection?: { title?: string; items?: string[] };
  whyBuySection?: { title?: string; description?: string; items?: string[] };
  whoIsThisForSection?: string;
  instructorBio?: string;
  successStories?: { studentName: string; studentImage?: string; resultsText: string; reviewComment?: string }[];
  studentResults?: string[];
  bonusSection?: { title?: string; value?: string; description?: string; items?: string[] };
  trustBadges?: string[];
  guaranteeSection?: { title?: string; period?: string; description?: string };
  deliveryLink?: string;
  googleDriveLink?: string;
  telegramLink?: string;
  privateResourceLink?: string;
  accessInstructions?: string;
  importantNotes?: string;
}

export interface Order {
  id?: string;
  userId?: string;
  name: string;
  email: string;
  telegram: string;
  mobile?: string;
  courseId: string;
  courseName?: string;
  price?: number;
  amount?: number; // compat price alias
  originalPrice?: number;
  discountApplied?: number;
  couponDiscount?: number; // compat discount alias
  couponCode?: string;
  screenshotUrl?: string;
  proofImage?: string; // Base64 proof image
  status: string;
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentId?: string;
  createdAt: any; // Firestore Timestamp
  date?: any; // compat date alias
  // Access course tracking metrics
  purchasedAt?: any;
  deliveredAt?: any;
  accessCount?: number;
  lastAccessTime?: any;
}

export interface Coupon {
  id?: string;
  code: string;         // uppercase code (e.g. WELCOME50)
  type: "percentage" | "fixed";
  value: number;        // e.g. 50 (percentage) or 199 (fixed rupee value discount)
  minOrderValue?: number; // minimum course price to apply (optional)
  isActive: boolean;
  expiresAt?: string;    // ISO Date string or null
  createdAt: any;       // Firestore Timestamp
  usedCount?: number;   // Number of times used
  totalSales?: number;  // Total paid revenue after discount generated from coupon
}

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: any; // Firestore Timestamp
}

export interface Admin {
  uid?: string;
  email: string;
  role: "Admin";
}

export interface Testimonial {
  id?: string;
  name: string;
  avatar?: string;
  rating: number;
  comment: string;
  courseTitle: string;
  occupation: string;
  createdAt: any; // Firestore Timestamp
}

export interface Review {
  id?: string;
  reviewId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhoto?: string;
  avatar?: string;
  courseId: string;
  courseName: string;
  category: string;
  rating: number;
  reviewText: string;
  verifiedPurchase: boolean;
  orderId: string;
  createdAt: any;
  updatedAt: any;
  status: "Approved" | "Pending" | "Rejected";
}

export interface TrackingSettings {
  metaPixelId: string;
  gtmId: string;
  ga4Id: string;
  searchConsoleVerification: string;
  facebookDomainVerification: string;
}

export interface Blog {
  id?: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  seoKeywords?: string;
  canonicalUrl?: string;
  featuredImage: string; // Base64 or URL
  category: string;
  content: string; // Markdown or HTML text
  contentUrl?: string; // Optional blog markdown/HTML storage URL
  author: string;
  publishDate: string; // simple YYYY-MM-DD
  createdAt: any; // Firestore Timestamp
}

export interface GlobalSettings {
  upiId: string;
  upiAccountName: string;
  upiQrCode: string; // Base64 or image URL
  paymentInstructions: string;
  telegramChannelLink: string;
  telegramSupportLink: string;
  telegramUsername: string;
  instagramLink: string;
  youtubeLink: string;
  supportEmail: string;
  brandLogoUrl?: string;
  ogDefaultImageUrl?: string;
  twitterPreviewImageUrl?: string;
  defaultCardTitle?: string;
  defaultCardDescription?: string;
}

export interface User {
  uid: string;
  fullName: string;
  email: string;
  dateOfBirth?: string;
  gender?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  photoURL?: string;
  onboardingCompleted: boolean;
  createdAt: any;
  updatedAt: any;
  disabled?: boolean;
  signupMethod: "Google" | "Email";
  emailVerified?: boolean;

  // Social Profile Urls (optional)
  youtubeUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  telegramUsername?: string;
  websiteUrl?: string;

  // Future eCommerce Compatibility Structure
  cartItems?: any[];
  wishlistItems?: any[];
  lastViewedProducts?: any[];
  totalOrders?: number;
  totalSpent?: number;
  lastPurchaseDate?: any;

  // Future Meta Ads Tracking Support Data
  viewedProduct?: string[];
  viewedCourse?: string[];
  initiatedCheckout?: string[];
  addedToCart?: string[];
  purchasedCourse?: string[];
}

export interface ActivityLog {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  details?: string;
  timestamp: any;
}


export interface UserProfile {
  uid: string;
  bio?: string;
  telegram?: string;
  updatedAt: any;
}

export interface UserSettings {
  uid: string;
  theme?: string;
  notificationsEnabled?: boolean;
  updatedAt: any;
}

export interface HomepageSettings {
  enableOrbitAnimation: boolean;
  enableOrbitGlow: boolean;
  enableParticleBackground: boolean;
  enableParallax: boolean;
  enableHoverEffects: boolean;
  enableAutoRotation: boolean;
  orbitSpeed: "Slow" | "Normal" | "Fast" | "Custom";
  customOrbitSpeed: number; // e.g. 10, 20, 30, 40, 60 seconds
  centerLogoType: "upload" | "url" | "course";
  centerLogoUrl: string;
  mainHeading: string;
  subHeading: string;
  ctaButtonText: string;
  ctaButtonLink: string;
  
  // V3 Experience System Toggles
  animationsEnabled: boolean;
  animationIntensity: "low" | "medium" | "high";
  pageTransitionsEnabled: boolean;
  counterAnimationsEnabled: boolean;
  backgroundEffectsEnabled: boolean;
  customCursorEnabled: boolean;

  // Hero Animation Manager Configs
  orbitRadius?: number;
  orbitCardSize?: number;
  orbitGlowIntensity?: "low" | "medium" | "high";
  orbitImage1?: string;
  orbitImage2?: string;
  orbitImage3?: string;
  orbitImage4?: string;
  orbitImageType1?: "upload" | "url";
  orbitImageType2?: "upload" | "url";
  orbitImageType3?: "upload" | "url";
  orbitImageType4?: "upload" | "url";
  orbitLabel1?: string;
  orbitLabel2?: string;
  orbitLabel3?: string;
  orbitLabel4?: string;
  orbitLink1?: string;
  orbitLink2?: string;
  orbitLink3?: string;
  orbitLink4?: string;
}

export interface HeroOrbitItem {
  id?: string;
  title: string;
  image: string; // Base64 or URL
  link: string; // Action Link
  description: string;
  displayOrder: number;
  ringAssignment: "Ring 1" | "Ring 2" | "Ring 3";
  enabled: boolean;
  imageSourceType: "course" | "external" | "upload";
  courseId?: string;
  clickActionType: "course" | "external" | "blog" | "none";
  targetSlug?: string;
  createdAt?: any;
}




