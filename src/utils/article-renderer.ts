import { convert } from "html-to-text";

/**
 * Decode common HTML entities for display in terminal
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return str;
  
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&#39;': "'",
    '&nbsp;': ' ',
    '&ndash;': '–',
    '&mdash;': '—',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&hellip;': '...',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
  };
  
  // Replace named entities
  let result = str;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'gi'), char);
  }
  
  // Replace numeric entities like &#8217;
  result = result.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
  // Replace hex entities like &#x2019;
  result = result.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
  
  return result;
}

/**
 * Convert HTML content to terminal-friendly plain text
 */
export function renderArticle(htmlContent: string): string {
  if (!htmlContent || htmlContent.trim() === "") {
    return "No content available.";
  }

  // Convert HTML to plain text with formatting
  const text = convert(htmlContent, {
    wordwrap: 80,
    preserveNewlines: false,
    selectors: [
      // Preserve headings
      { selector: "h1", options: { uppercase: true } },
      { selector: "h2", options: { uppercase: false } },
      
      // Format lists
      { selector: "ul", options: { itemPrefix: "  • " } },
      { selector: "ol", options: { itemPrefix: "  " } },
      
      // Handle links
      { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
      
      // Skip images (terminal can't display them)
      { selector: "img", options: { ignoreHref: true } },
      
      // Preserve code blocks
      { selector: "pre", options: { leadingLineBreaks: 2, trailingLineBreaks: 2 } },
    ],
  });

  return text.trim();
}

/**
 * Render full webpage content - extract main article and convert to text
 */
export function renderWebpage(htmlContent: string): string {
  if (!htmlContent || htmlContent.trim() === "") {
    return "No content available.";
  }

  try {
    // Convert HTML to plain text with better content extraction
    const text = convert(htmlContent, {
      wordwrap: 70,
      preserveNewlines: false,
      selectors: [
        // Skip non-content elements
        { selector: "nav", format: "skip" },
        { selector: "header", format: "skip" },
        { selector: "footer", format: "skip" },
        { selector: "script", format: "skip" },
        { selector: "style", format: "skip" },
        { selector: "noscript", format: "skip" },
        { selector: "aside", format: "skip" },
        { selector: "form", format: "skip" },
        { selector: "button", format: "skip" },
        { selector: "iframe", format: "skip" },
        
        // IMPORTANT: Ignore all links - just show link text without URL
        { selector: "a", options: { ignoreHref: true } },
        
        // Preserve headings
        { selector: "h1", options: { uppercase: true, leadingLineBreaks: 2, trailingLineBreaks: 1 } },
        { selector: "h2", options: { uppercase: false, leadingLineBreaks: 2, trailingLineBreaks: 1 } },
        { selector: "h3", options: { leadingLineBreaks: 2, trailingLineBreaks: 1 } },
        
        // Format lists
        { selector: "ul", options: { itemPrefix: "  • " } },
        { selector: "ol", options: { itemPrefix: "  " } },
        
        // Skip images
        { selector: "img", format: "skip" },
        
        // Skip social/share divs by common class names
        { selector: ".share", format: "skip" },
        { selector: ".social", format: "skip" },
        { selector: ".comments", format: "skip" },
        { selector: ".related", format: "skip" },
        { selector: ".sidebar", format: "skip" },
        { selector: ".advertisement", format: "skip" },
        { selector: ".ad", format: "skip" },
        
        // Paragraphs
        { selector: "p", options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
      ],
      limits: {
        maxChildNodes: 500,
      },
    });

    // Post-process: Remove lines that are just URLs, noise, or footer content
    const cleanedText = text
      .split("\n")
      .filter(line => {
        const trimmed = line.trim();
        // Skip empty lines at start
        if (!trimmed) return true;
        // Skip lines that are just URLs
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return false;
        // Skip lines with URL-encoded content
        if (trimmed.includes("%2F") || trimmed.includes("%3A")) return false;
        // Skip social share text patterns
        if (/^(share|tweet|post|pin|email|submit|facebook|twitter|linkedin)/i.test(trimmed)) return false;
        // Skip bracket-only lines like "[link]" or "[image]"
        if (/^\[.*\]$/.test(trimmed)) return false;
        // Skip very short lines that are likely noise (single chars, dots, bullets)
        if (trimmed.length <= 2 && !/^[A-Za-z0-9]/.test(trimmed)) return false;
        // Skip common footer links
        if (/^(regulamin|reklama|kontakt|faq|o nas|ranking|osiągnięcia|privacy|terms|copyright|cookies)/i.test(trimmed)) return false;
        // Skip lines that are just punctuation or special chars
        if (/^[•·\-–—\s]+$/.test(trimmed)) return false;
        return true;
      })
      .join("\n")
      .replace(/\n{3,}/g, "\n\n") // Collapse multiple blank lines
      .trim();

    return cleanedText || "No readable content found.";
  } catch (error) {
    return "Failed to render webpage content.";
  }
}


/**
 * Truncate text to a specific length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return "Today";
  } else if (days === 1) {
    return "Yesterday";
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}
