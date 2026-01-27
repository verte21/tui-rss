import type { AppData, FeedSource } from "../types";
import * as db from "./db";

/**
 * Load app data (for compatibility)
 */
export async function loadData(): Promise<AppData> {
  const feeds = db.getAllFeeds();
  const favorites = db.getAllFavorites();

  return {
    feeds,
    favorites,
  };
}

/**
 * Save app data (for compatibility - SQLite auto-saves)
 */
export async function saveData(data: AppData): Promise<void> {
  // SQLite operations are synchronous and auto-persist
  // This function exists for API compatibility
}

/**
 * Add a feed source
 */
export async function addFeedSource(feed: FeedSource): Promise<void> {
  db.addFeed(feed);
}

/**
 * Remove a feed source
 */
export async function removeFeedSource(feedId: string): Promise<void> {
  db.removeFeed(feedId);
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(
  articleId: string,
  articleTitle: string,
  articleLink: string,
  feedName?: string
): Promise<boolean> {
  return db.toggleFavorite(articleId, articleTitle, articleLink, feedName);
}

/**
 * Toggle read later status
 */
export async function toggleReadLater(
  articleId: string,
  articleTitle: string,
  articleLink: string,
  feedName?: string
): Promise<boolean> {
  return db.toggleReadLater(articleId, articleTitle, articleLink, feedName);
}

/**
 * Get all favorite articles with details
 */
export function getFavoriteArticles() {
  return db.getFavoriteArticles();
}

/**
 * Remove a favorite article
 */
export function removeFavorite(articleId: string): void {
  db.removeFavorite(articleId);
}
