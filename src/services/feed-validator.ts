import { fetchRssFeed } from "./fetch-rss";

export interface FeedValidationResult {
  valid: boolean;
  title?: string;
  description?: string;
  error?: string;
}

/**
 * Validate an RSS feed URL by attempting to fetch and parse it
 */
export async function validateFeedUrl(url: string): Promise<FeedValidationResult> {
  // Basic URL validation
  if (!url || url.trim() === "") {
    return { valid: false, error: "URL cannot be empty" };
  }

  try {
    new URL(url);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  // Must be http or https
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return { valid: false, error: "URL must start with http:// or https://" };
  }

  try {
    // Try to fetch and parse the feed
    const feed = await fetchRssFeed(url);
    
    if (!feed || !feed.title) {
      return { valid: false, error: "Could not parse RSS feed" };
    }

    return {
      valid: true,
      title: feed.title,
      description: feed.description,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { valid: false, error: `Failed to fetch feed: ${message}` };
  }
}

/**
 * Generate a unique ID from feed URL
 */
export function generateFeedId(url: string): string {
  // Create a simple ID from the URL hostname
  try {
    const hostname = new URL(url).hostname;
    const base = hostname.replace(/^www\./, "").split(".")[0];
    const timestamp = Date.now().toString(36);
    return `${base}-${timestamp}`;
  } catch {
    return `feed-${Date.now().toString(36)}`;
  }
}
