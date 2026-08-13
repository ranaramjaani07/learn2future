import { Course, Campaign, Coupon } from "../types";

export interface CalculatedPriceResult {
  basePrice: number;            // Course original base price (e.g. 100)
  referencePrice: number;       // Crossed-out reference price shown in Red/Gray (e.g. 200)
  campaignPrice: number;        // Price after campaign adjustment (e.g. 100)
  couponDiscountAmount: number; // Additional discount amount from applied coupon
  finalPrice: number;           // Final payable price (e.g. 100 or 90)
  savingsAmount: number;        // Total savings (referencePrice - finalPrice)
  discountPercentage: number;   // Effective percentage discount
  hasActiveCampaign: boolean;   // True if an active campaign applied
  appliedCampaign: Campaign | null; // The campaign that applied
  badgeLabel?: string;          // e.g. "50% OFF" or "Independence Day Sale"
  stackedDiscountSummary?: string; // e.g. "Campaign 50% OFF + Coupon 10% OFF"
}

/**
 * Checks if a campaign is currently active based on dates and status
 */
export function isCampaignActive(campaign: Campaign, now: Date = new Date()): boolean {
  if (!campaign) return false;
  if (campaign.status === "Paused" || campaign.status === "Archived" || campaign.status === "Expired") {
    return false;
  }
  
  const current = now.getTime();
  const start = new Date(campaign.startDate).getTime();
  const end = new Date(campaign.endDate).getTime();

  if (isNaN(start) || isNaN(end)) return false;

  // Auto-expire check
  if (current > end) {
    return false;
  }

  return current >= start && current <= end;
}

/**
 * Checks if a campaign applies to a specific course
 */
export function doesCampaignApplyToCourse(campaign: Campaign, course: { id?: string; category?: string }): boolean {
  if (!campaign || !course) return false;
  if (campaign.targetType === "all") return true;
  if (campaign.targetType === "category") {
    if (!campaign.targetCategory || !course.category) return false;
    return campaign.targetCategory.trim().toLowerCase() === course.category.trim().toLowerCase();
  }
  if (campaign.targetType === "selected_courses") {
    if (!campaign.targetCourseIds || !Array.isArray(campaign.targetCourseIds) || !course.id) return false;
    return campaign.targetCourseIds.includes(course.id);
  }
  return false;
}

/**
 * Calculates authoritative pricing for a course given active campaigns and optional coupon
 */
export function calculateCoursePricing(
  course: Partial<Course>,
  campaigns: Campaign[] = [],
  coupon?: Coupon | null
): CalculatedPriceResult {
  // 1. Determine base original price of the course
  const courseBasePrice = Number(course.price || course.offerPrice || 0);
  const existingOriginal = Number(course.originalPrice || 0);

  const now = new Date();
  
  // Find matching active campaign (if multiple, pick highest priority or first)
  const activeCampaign = campaigns.find(c => isCampaignActive(c, now) && doesCampaignApplyToCourse(c, course)) || null;

  let referencePrice = existingOriginal > courseBasePrice ? existingOriginal : courseBasePrice;
  let campaignPrice = courseBasePrice;
  let badgeLabel = "";
  let hasActiveCampaign = false;

  if (activeCampaign) {
    hasActiveCampaign = true;
    const { adjustmentType, adjustmentValue, referencePriceMultiplier, customOriginalPrice } = activeCampaign;

    // A. Reference Price Calculation (Red/Gray Crossed-Out Price)
    if (customOriginalPrice && customOriginalPrice > 0) {
      referencePrice = customOriginalPrice;
    } else if (referencePriceMultiplier && referencePriceMultiplier > 1) {
      referencePrice = Math.round(courseBasePrice * referencePriceMultiplier);
    } else if (adjustmentType === "percent_increase") {
      referencePrice = Math.round(courseBasePrice * (1 + adjustmentValue / 100));
    } else if (adjustmentType === "fixed_increase") {
      referencePrice = courseBasePrice + adjustmentValue;
    } else if (existingOriginal > courseBasePrice) {
      referencePrice = existingOriginal;
    } else {
      referencePrice = courseBasePrice;
    }

    // B. Campaign Discounted Price Calculation (Green Final Price)
    if (adjustmentType === "percent_discount") {
      // Calculate percentage discount off reference price
      const discountVal = (referencePrice * adjustmentValue) / 100;
      campaignPrice = Math.round(referencePrice - discountVal);
      badgeLabel = `${adjustmentValue}% OFF`;
    } else if (adjustmentType === "fixed_discount") {
      campaignPrice = Math.max(0, referencePrice - adjustmentValue);
      badgeLabel = `₹${adjustmentValue} OFF`;
    } else if (adjustmentType === "fixed_price") {
      campaignPrice = adjustmentValue;
      badgeLabel = `SPECIAL DEAL`;
    } else if (adjustmentType === "percent_increase") {
      campaignPrice = courseBasePrice; // original selling price maintained as final
      badgeLabel = `${Math.round(((referencePrice - campaignPrice) / referencePrice) * 100)}% OFF`;
    } else if (adjustmentType === "fixed_increase") {
      campaignPrice = courseBasePrice;
      badgeLabel = `MAHA SALE`;
    }

    if (activeCampaign.bannerMessage) {
      badgeLabel = activeCampaign.bannerMessage;
    }
  }

  // Ensure referencePrice is at least equal to campaignPrice
  if (referencePrice < campaignPrice) {
    referencePrice = campaignPrice;
  }

  // 2. Coupon Discount Calculation
  let couponDiscountAmount = 0;
  let couponSummary = "";

  if (coupon && coupon.isActive) {
    const minVal = coupon.minOrderValue || 0;
    if (campaignPrice >= minVal) {
      if (coupon.type === "percentage") {
        couponDiscountAmount = Math.round((campaignPrice * coupon.value) / 100);
        couponSummary = `Coupon ${coupon.code} (${coupon.value}% OFF)`;
      } else if (coupon.type === "fixed") {
        couponDiscountAmount = Math.min(campaignPrice, coupon.value);
        couponSummary = `Coupon ${coupon.code} (₹${coupon.value} OFF)`;
      }
    }
  }

  // 3. Final calculations
  const finalPrice = Math.max(0, Math.round(campaignPrice - couponDiscountAmount));
  const savingsAmount = Math.max(0, referencePrice - finalPrice);
  const discountPercentage = referencePrice > 0 ? Math.min(100, Math.round((savingsAmount / referencePrice) * 100)) : 0;

  let stackedDiscountSummary = "";
  if (hasActiveCampaign && couponDiscountAmount > 0) {
    stackedDiscountSummary = `Campaign Discount + ${couponSummary}`;
  } else if (couponDiscountAmount > 0) {
    stackedDiscountSummary = couponSummary;
  } else if (hasActiveCampaign) {
    stackedDiscountSummary = badgeLabel || "Campaign Discount Applied";
  }

  return {
    basePrice: courseBasePrice,
    referencePrice,
    campaignPrice,
    couponDiscountAmount,
    finalPrice,
    savingsAmount,
    discountPercentage,
    hasActiveCampaign,
    appliedCampaign: activeCampaign,
    badgeLabel,
    stackedDiscountSummary
  };
}
