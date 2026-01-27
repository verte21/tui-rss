import { XMLParser } from "fast-xml-parser";
import type { RSSFeed, RSSItem } from "../types";
import { decodeHtmlEntities } from "../utils/article-renderer";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

/**
 * Generate a unique ID from the article link and title
 */
function generateId(link: string, title: string = "", index: number = 0): string {
  // Combine link, title, and index for better uniqueness
  const source = `${link}-${title}-${index}`;
  return btoa(encodeURIComponent(source)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}

/**
 * Parse RSS 2.0 format
 */
function parseRSS(data: any): RSSFeed {
  const channel = data.rss?.channel || data.channel;
  
  if (!channel) {
    throw new Error("Invalid RSS format");
  }

  const items = Array.isArray(channel.item) ? channel.item : [channel.item].filter(Boolean);

  return {
    title: decodeHtmlEntities(channel.title) || "Untitled Feed",
    description: channel.description || "",
    link: channel.link || "",
    items: items.map((item: any, index: number): RSSItem => ({
      id: generateId(item.link || item.guid?.["#text"] || item.guid || "", item.title || "", index),
      title: decodeHtmlEntities(item.title) || "Untitled",
      link: item.link || "",
      description: item.description || "",
      content: item["content:encoded"] || item.content || item.description || "",
      pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
      author: decodeHtmlEntities(item.author || item["dc:creator"]) || undefined,
      isFavorite: false,
    })),
  };
}

/**
 * Parse Atom format
 */
function parseAtom(data: any): RSSFeed {
  const feed = data.feed;
  
  if (!feed) {
    throw new Error("Invalid Atom format");
  }

  const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry].filter(Boolean);

  return {
    title: decodeHtmlEntities(feed.title?.["#text"] || feed.title) || "Untitled Feed",
    description: feed.subtitle?.["#text"] || feed.subtitle || "",
    link: Array.isArray(feed.link) 
      ? feed.link.find((l: any) => l["@_rel"] === "alternate")?.["@_href"] || feed.link[0]?.["@_href"] || ""
      : feed.link?.["@_href"] || "",
    items: entries.map((entry: any, index: number): RSSItem => {
      const link = Array.isArray(entry.link)
        ? entry.link.find((l: any) => l["@_rel"] === "alternate")?.["@_href"] || entry.link[0]?.["@_href"] || ""
        : entry.link?.["@_href"] || "";
      const title = decodeHtmlEntities(entry.title?.["#text"] || entry.title) || "Untitled";
      
      return {
        id: generateId(entry.id || link, title, index),
        title,
        link,
        description: entry.summary?.["#text"] || entry.summary || "",
        content: entry.content?.["#text"] || entry.content || entry.summary?.["#text"] || entry.summary || "",
        pubDate: entry.updated ? new Date(entry.updated) : entry.published ? new Date(entry.published) : new Date(),
        author: decodeHtmlEntities(entry.author?.name) || undefined,
        isFavorite: false,
      };
    }),
  };
}

/**
 * Fetch and parse RSS/Atom feed
 */
export const fetchRssFeed = async (url: string): Promise<RSSFeed> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Error fetching RSS feed: ${response.statusText}`);
  }

  const xmlText = await response.text();
  const data = parser.parse(xmlText);

  // Determine feed type and parse accordingly
  if (data.rss) {
    return parseRSS(data);
  } else if (data.feed) {
    return parseAtom(data);
  } else {
    throw new Error("Unknown feed format");
  }
};