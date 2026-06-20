/**
 * Utility functions to extract raw tracking IDs or content strings from 
 * pasted third-party HTML scripts, noscripts, and meta tags.
 */

/**
 * Extracts a numeric Meta (Facebook) Pixel ID from a pasted pixel script block or iframe source snippet.
 */
export const extractMetaPixelId = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return "";

  // 1. If it's a plain sequence of 10 to 18 digits, it's already a clean ID
  if (/^\d{10,18}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. Search for fbq('init', 'ID') or fbq("init", "ID")
  const fbqMatch = trimmed.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d+)['"]/i);
  if (fbqMatch && fbqMatch[1]) {
    return fbqMatch[1].trim();
  }

  // 3. Search for tr?id=ID URL query param (often found in <noscript> or <img> tags)
  const urlMatch = trimmed.match(/[?&]id=(\d+)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].trim();
  }

  const trMatch = trimmed.match(/tr\?id=(\d+)/i);
  if (trMatch && trMatch[1]) {
    return trMatch[1].trim();
  }

  // 4. Fallback search for any continuous sequence of 10-18 numbers in script snippets
  if (trimmed.includes("<script") || trimmed.includes("fbq") || trimmed.includes("<noscript") || trimmed.includes("facebook.com")) {
    const sequenceMatch = trimmed.match(/\b(\d{10,18})\b/);
    if (sequenceMatch && sequenceMatch[1]) {
      return sequenceMatch[1].trim();
    }
  }

  return trimmed;
};

/**
 * Extracts a Google Tag Manager Container ID (starts with GTM-) from pasted tag code or iframe source snippet.
 */
export const extractGtmId = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return "";

  // 1. If it's already a clean GTM-XXXXXXX string
  if (/^GTM-[A-Z0-9]+$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // 2. Search for GTM-[A-Z0-9]+ anywhere inside the code block (case insensitive)
  const gtmMatch = trimmed.match(/\b(GTM-[A-Z0-9]+)\b/i);
  if (gtmMatch && gtmMatch[1]) {
    return gtmMatch[1].trim().toUpperCase();
  }

  return trimmed;
};

/**
 * Extracts a Google Analytics Measurement ID (starts with G-) or Ad-words ID (starts with AW-)
 * from dynamic gtag.js script loading snippets or configurator scripts.
 */
export const extractGa4Id = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return "";

  // 1. If it's already a clean measurement ID (e.g. G-XXXXXXX or AW-XXXXXXX or UA-XXXXX-X or GT-XXXXX)
  if (/^(G|AW|UA|GT)-[A-Z0-9\-_]+$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // 2. Search for G-[A-Z0-9]+
  const gaMatch = trimmed.match(/\s*['"]?\b(G-[A-Z0-9]+)\b['"]?/i);
  if (gaMatch && gaMatch[1]) {
    return gaMatch[1].trim().toUpperCase();
  }

  // 3. Search for AW-[A-Z0-9]+
  const awMatch = trimmed.match(/\s*['"]?\b(AW-[A-Z0-9]+)\b['"]?/i);
  if (awMatch && awMatch[1]) {
    return awMatch[1].trim().toUpperCase();
  }

  // 4. Search for UA-[0-9]+-[0-9]+
  const uaMatch = trimmed.match(/\s*['"]?\b(UA-\d+-\d+)\b['"]?/i);
  if (uaMatch && uaMatch[1]) {
    return uaMatch[1].trim().toUpperCase();
  }

  // 5. Search for GT-[A-Z0-9]+
  const gtMatch = trimmed.match(/\s*['"]?\b(GT-[A-Z0-9]+)\b['"]?/i);
  if (gtMatch && gtMatch[1]) {
    return gtMatch[1].trim().toUpperCase();
  }

  return trimmed;
};

/**
 * Extracts a Google Search Console verification token from a complete <meta name="google-site-verification" content="..." /> tag.
 */
export const extractSearchConsoleVerification = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return "";

  // 1. If it doesn't look like HTML or a key=value pair, assume it is already a clean string
  if (!trimmed.includes("<") && !trimmed.includes("=") && !trimmed.includes("content")) {
    return trimmed;
  }

  // 2. Search for content="..." or content='...'
  const contentMatch = trimmed.match(/content=["']([^"']+)["']/i);
  if (contentMatch && contentMatch[1]) {
    return contentMatch[1].trim();
  }

  // 3. Search for google-site-verification=value pattern
  const verificationMatch = trimmed.match(/google-site-verification=["']?([^"'>\s]+)/i);
  if (verificationMatch && verificationMatch[1]) {
    return verificationMatch[1].replace(/["']/g, '').trim();
  }

  return trimmed;
};

/**
 * Extracts a Facebook domain verification token from a complete <meta name="facebook-domain-verification" content="..." /> tag,
 * or a raw content string.
 */
export const extractFacebookDomainVerification = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return "";

  // 1. If it doesn't look like HTML or a key=value pair, assume it is already a clean string
  if (!trimmed.includes("<") && !trimmed.includes("=") && !trimmed.includes("content")) {
    return trimmed;
  }

  // 2. Search for content="..." or content='...'
  const contentMatch = trimmed.match(/content=["']([^"']+)["']/i);
  if (contentMatch && contentMatch[1]) {
    return contentMatch[1].trim();
  }

  // 3. Search for facebook-domain-verification=value pattern
  const verificationMatch = trimmed.match(/facebook-domain-verification=["']?([^"'>\s]+)/i);
  if (verificationMatch && verificationMatch[1]) {
    return verificationMatch[1].replace(/["']/g, '').trim();
  }

  return trimmed;
};
