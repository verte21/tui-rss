import { Database } from "bun:sqlite";
import { homedir } from "os";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import type { FeedSource } from "../types";

const APP_DIR = join(homedir(), ".tui-rss");
const DB_FILE = join(APP_DIR, "rss-reader.db");

// Initialize app directory
if (!existsSync(APP_DIR)) {
  mkdirSync(APP_DIR, { recursive: true });
}

// Initialize database
const db = new Database(DB_FILE);

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS feeds (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id TEXT NOT NULL UNIQUE,
    article_title TEXT NOT NULL,
    article_link TEXT NOT NULL,
    feed_name TEXT,
    saved_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS read_later (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id TEXT NOT NULL UNIQUE,
    article_title TEXT NOT NULL,
    article_link TEXT NOT NULL,
    feed_name TEXT,
    saved_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE INDEX IF NOT EXISTS idx_favorites_article_id ON favorites(article_id);
  CREATE INDEX IF NOT EXISTS idx_read_later_article_id ON read_later(article_id);
`);

// Default feeds
const DEFAULT_FEEDS: FeedSource[] = [
  {
    id: "hn",
    name: "Hacker News",
    url: "https://hnrss.org/frontpage",
  },
  {
    id: "bbc",
    name: "BBC News",
    url: "http://feeds.bbci.co.uk/news/rss.xml",
  },
  {
    id: "techcrunch",
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/",
  },
];

// Initialize default feeds if database is empty
const feedCount = db.query("SELECT COUNT(*) as count FROM feeds").get() as { count: number };
if (feedCount.count === 0) {
  const insertFeed = db.query("INSERT OR IGNORE INTO feeds (id, name, url) VALUES (?, ?, ?)");
  for (const feed of DEFAULT_FEEDS) {
    insertFeed.run(feed.id, feed.name, feed.url);
  }
}

// Feed operations
export function getAllFeeds(): FeedSource[] {
  return db.query("SELECT id, name, url FROM feeds ORDER BY created_at").all() as FeedSource[];
}

export function addFeed(feed: FeedSource): void {
  db.query("INSERT OR IGNORE INTO feeds (id, name, url) VALUES (?, ?, ?)").run(
    feed.id,
    feed.name,
    feed.url
  );
}

export function removeFeed(feedId: string): void {
  db.query("DELETE FROM feeds WHERE id = ?").run(feedId);
}

// Favorite operations
export function getAllFavorites(): string[] {
  const favorites = db.query("SELECT article_id FROM favorites").all() as { article_id: string }[];
  return favorites.map((f) => f.article_id);
}

export interface FavoriteArticle {
  id: string;
  title: string;
  link: string;
  feedName?: string;
}

export function getFavoriteArticles(): FavoriteArticle[] {
  const favorites = db.query(
    "SELECT article_id, article_title, article_link, feed_name FROM favorites ORDER BY saved_at DESC"
  ).all() as { article_id: string; article_title: string; article_link: string; feed_name: string | null }[];
  
  return favorites.map((f) => ({
    id: f.article_id,
    title: f.article_title,
    link: f.article_link,
    feedName: f.feed_name || undefined,
  }));
}

export function isFavorite(articleId: string): boolean {
  const result = db.query("SELECT 1 FROM favorites WHERE article_id = ? LIMIT 1").get(articleId);
  return result !== null;
}

export function addFavorite(articleId: string, articleTitle: string, articleLink: string, feedName?: string): void {
  db.query("INSERT OR IGNORE INTO favorites (article_id, article_title, article_link, feed_name) VALUES (?, ?, ?, ?)").run(
    articleId,
    articleTitle,
    articleLink,
    feedName || null
  );
}

export function removeFavorite(articleId: string): void {
  db.query("DELETE FROM favorites WHERE article_id = ?").run(articleId);
}

export function toggleFavorite(articleId: string, articleTitle: string, articleLink: string, feedName?: string): boolean {
  if (isFavorite(articleId)) {
    removeFavorite(articleId);
    return false;
  } else {
    addFavorite(articleId, articleTitle, articleLink, feedName);
    return true;
  }
}

// Read later operations
export function getAllReadLater(): string[] {
  const items = db.query("SELECT article_id FROM read_later").all() as { article_id: string }[];
  return items.map((i) => i.article_id);
}

export function isReadLater(articleId: string): boolean {
  const result = db.query("SELECT 1 FROM read_later WHERE article_id = ? LIMIT 1").get(articleId);
  return result !== null;
}

export function addReadLater(articleId: string, articleTitle: string, articleLink: string, feedName?: string): void {
  db.query("INSERT OR IGNORE INTO read_later (article_id, article_title, article_link, feed_name) VALUES (?, ?, ?, ?)").run(
    articleId,
    articleTitle,
    articleLink,
    feedName || null
  );
}

export function removeReadLater(articleId: string): void {
  db.query("DELETE FROM read_later WHERE article_id = ?").run(articleId);
}

export function toggleReadLater(articleId: string, articleTitle: string, articleLink: string, feedName?: string): boolean {
  if (isReadLater(articleId)) {
    removeReadLater(articleId);
    return false;
  } else {
    addReadLater(articleId, articleTitle, articleLink, feedName);
    return true;
  }
}

// Close database on exit
process.on("exit", () => {
  db.close();
});

export default db;

