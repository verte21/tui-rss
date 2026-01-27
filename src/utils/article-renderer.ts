import { convert } from "html-to-text";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

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
  
  let result = str;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'gi'), char);
  }
  
  result = result.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
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

  const text = convert(htmlContent, {
    wordwrap: 82,
    preserveNewlines: false,
    selectors: [
      { selector: "h1", options: { uppercase: true } },
      { selector: "h2", options: { uppercase: false } },
      { selector: "ul", options: { itemPrefix: "  • " } },
      { selector: "ol", options: { itemPrefix: "  " } },
      { selector: "a", options: { ignoreHref: true } },
      { selector: "img", format: "skip" },
      { selector: "pre", options: { leadingLineBreaks: 2, trailingLineBreaks: 2 } },
    ],
  });

  return text.trim();
}

/**
 * Render full webpage content using Mozilla Readability (Firefox Reader View)
 */
export function renderWebpage(htmlContent: string): string {
  if (!htmlContent || htmlContent.trim() === "") {
    return "No content available.";
  }

  try {
    // Use Mozilla Readability to extract article content
    const dom = new JSDOM(htmlContent);
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    if (!article || !article.content) {
      return "Could not extract readable content from this page.";
    }
    
    // Convert extracted article HTML to plain text
    const text = convert(article.content, {
      wordwrap: 82,
      preserveNewlines: false,
      selectors: [
        { selector: "a", options: { ignoreHref: true } },
        { selector: "h1", options: { uppercase: true, leadingLineBreaks: 2, trailingLineBreaks: 1 } },
        { selector: "h2", options: { uppercase: false, leadingLineBreaks: 2, trailingLineBreaks: 1 } },
        { selector: "h3", options: { leadingLineBreaks: 2, trailingLineBreaks: 1 } },
        { selector: "ul", options: { itemPrefix: "  • " } },
        { selector: "ol", options: { itemPrefix: "  " } },
        { selector: "img", format: "skip" },
        { selector: "figure", format: "skip" },
        { selector: "figcaption", format: "skip" },
        { selector: "p", options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
      ],
    });

    // Build header with article metadata if available
    const headerParts: string[] = [];
    if (article.byline) {
      headerParts.push(`By ${article.byline}`);
    }
    if (article.publishedTime) {
      try {
        const pubDate = new Date(article.publishedTime);
        headerParts.push(pubDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }));
      } catch {
        // Ignore invalid dates
      }
    }
    if (article.siteName) {
      headerParts.push(article.siteName);
    }
    
    // Calculate reading time based on word count (~200 words per minute)
    if (article.textContent) {
      const wordCount = article.textContent.trim().split(/\s+/).length;
      const readingTimeMinutes = Math.ceil(wordCount / 200);
      headerParts.push(`${readingTimeMinutes} min read`);
    }
    
    // Clean up any remaining noise
    const cleanedText = text
      .split("\n")
      .filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return true;
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return false;
        if (/^\[.*\]$/.test(trimmed)) return false;
        return true;
      })
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    
    // Prepend metadata header with separator if we have it
    const finalText = headerParts.length > 0
      ? `${headerParts.join("\n")}\n${"─".repeat(40)}\n\n${cleanedText}`
      : cleanedText;

    return finalText || "No readable content found.";
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
