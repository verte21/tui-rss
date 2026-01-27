export interface RSSItem {
  id: string;
  title: string;
  link: string;
  description: string;
  content?: string;
  webpageContent?: string; // Full webpage HTML fetched from link
  pubDate: Date;
  author?: string;
  isFavorite: boolean;
}


export interface RSSFeed {
  title: string;
  description: string;
  link: string;
  items: RSSItem[];
}

export interface FeedSource {
  id: string;
  name: string;
  url: string;
}

export interface AppData {
  feeds: FeedSource[];
  favorites: string[]; // Array of article IDs
}

export type ViewMode = 'feed-list' | 'article-list' | 'article-viewer' | 'add-feed' | 'favorites' | 'edit-feed';

export interface AppState {
  viewMode: ViewMode;
  selectedFeedIndex: number;
  selectedArticleIndex: number;
  currentFeed: RSSFeed | null;
  currentArticle: RSSItem | null;
  feedSources: FeedSource[];
  favorites: Set<string>;
  scrollPosition: number;
  viewingWebpage: boolean;
  inputText: string; // For text input in add-feed/edit dialogs
  editingFeedId: string | null; // Which feed is being edited
  inputError: string | null; // Validation error message
}


