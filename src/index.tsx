import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { useState, useEffect, useCallback } from "react";
import type { AppState, RSSItem, FeedSource } from "./types";
import { useKeyboard, Keys } from "./hooks/useKeyboard";
import { FeedList } from "./components/FeedList";
import { ArticleList } from "./components/ArticleList";
import { ArticleViewer } from "./components/ArticleViewer";
import { StatusBar } from "./components/StatusBar";
import { Window } from "./components/Window";
import { AddFeedDialog } from "./components/AddFeedDialog";
import { EmptyState } from "./components/EmptyState";
import { FavoritesView } from "./components/FavoritesView";

import { fetchRssFeed } from "./services/fetch-rss";
import { loadData, saveData, toggleFavorite, addFeedSource, removeFeedSource, getFavoriteArticles, removeFavorite } from "./services/storage";
import { fetchWebpage } from "./services/fetch-webpage";
import { validateFeedUrl, generateFeedId } from "./services/feed-validator";
import { renderArticle, renderWebpage } from "./utils/article-renderer";

function App() {
  const [state, setState] = useState<AppState>({
    viewMode: "feed-list",
    selectedFeedIndex: 0,
    selectedArticleIndex: 0,
    currentFeed: null,
    currentArticle: null,
    feedSources: [],
    favorites: new Set(),
    scrollPosition: 0,
    viewingWebpage: false,
    inputText: "",
    editingFeedId: null,
    inputError: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    async function init() {
      try {
        const data = await loadData();
        setState((prev) => ({
          ...prev,
          feedSources: data.feeds,
          favorites: new Set(data.favorites),
        }));
        setLoading(false);
      } catch (err) {
        setError("Failed to load data");
        setLoading(false);
      }
    }
    init();
  }, []);

  // Save favorites when they change
  useEffect(() => {
    if (!loading) {
      saveData({
        feeds: state.feedSources,
        favorites: Array.from(state.favorites),
      }).catch(console.error);
    }
  }, [state.favorites, state.feedSources, loading]);

  // Load feed articles
  const loadFeed = useCallback(async (feedSource: FeedSource) => {
    setError(null);
    try {
      const feed = await fetchRssFeed(feedSource.url);
      
      // Get current favorites from database (not stale state)
      const currentFavorites = getFavoriteArticles();
      const favoriteIds = new Set(currentFavorites.map(f => f.id));
      
      // Clone items and mark favorites (create fresh objects to avoid reference issues)
      const itemsWithFavorites = feed.items.map(item => ({
        ...item,
        isFavorite: favoriteIds.has(item.id),
      }));

      setState((prev) => ({
        ...prev,
        currentFeed: { ...feed, items: itemsWithFavorites },
        favorites: favoriteIds,
        viewMode: "article-list",
        selectedArticleIndex: 0,
        scrollPosition: 0,
        viewingWebpage: false,
      }));
    } catch (err) {
      setError(`Failed to load feed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [state.favorites]);

  // Keyboard handler
  const handleKey = useCallback(
    (key: string) => {
      // Quit on 'q' or Ctrl+C
      if (key === "q" || key === "Q" || key === Keys.CTRL_C) {
        process.exit(0);
      }

      // Feed list view
      if (state.viewMode === "feed-list") {
        if (key === Keys.UP) {
          setState((prev) => ({
            ...prev,
            selectedFeedIndex: Math.max(0, prev.selectedFeedIndex - 1),
          }));
        } else if (key === Keys.DOWN) {
          setState((prev) => ({
            ...prev,
            selectedFeedIndex: Math.min(
              prev.feedSources.length - 1,
              prev.selectedFeedIndex + 1
            ),
          }));
        } else if (key === Keys.ENTER) {
          const selectedFeed = state.feedSources[state.selectedFeedIndex];
          if (selectedFeed) {
            loadFeed(selectedFeed);
          }
        } else if (key === "a" || key === "A") {
          // Add new feed
          setState((prev) => ({
            ...prev,
            viewMode: "add-feed",
            inputText: "",
            inputError: null,
          }));
        } else if (key === "d" || key === "D") {
          // Delete selected feed
          const selectedFeed = state.feedSources[state.selectedFeedIndex];
          if (selectedFeed) {
            removeFeedSource(selectedFeed.id);
            setState((prev) => ({
              ...prev,
              feedSources: prev.feedSources.filter((f) => f.id !== selectedFeed.id),
              selectedFeedIndex: Math.max(0, prev.selectedFeedIndex - 1),
            }));
          }
        } else if (key === "s" || key === "S") {
          // Open favorites/saved articles
          setState((prev) => ({
            ...prev,
            viewMode: "favorites",
            selectedArticleIndex: 0,
          }));
        }
      }

      // Article list view
      else if (state.viewMode === "article-list" && state.currentFeed) {
        if (key === Keys.UP) {
          setState((prev) => ({
            ...prev,
            selectedArticleIndex: Math.max(0, prev.selectedArticleIndex - 1),
          }));
        } else if (key === Keys.DOWN) {
          setState((prev) => ({
            ...prev,
            selectedArticleIndex: Math.min(
              (prev.currentFeed?.items.length || 1) - 1,
              prev.selectedArticleIndex + 1
            ),
          }));
        } else if (key === Keys.ENTER) {
          const article = state.currentFeed.items[state.selectedArticleIndex];
          if (article) {
            setState((prev) => ({
              ...prev,
              currentArticle: article,
              viewMode: "article-viewer",
              scrollPosition: 0,
            }));
          }
        } else if (key === "f" || key === "F") {
          const article = state.currentFeed.items[state.selectedArticleIndex];
          const articleIndex = state.selectedArticleIndex;
          if (article) {
            toggleFavorite(article.id, article.title, article.link, state.currentFeed.title).then((isFav) => {
              setState((prev) => {
                const newFavorites = new Set(prev.favorites);
                if (isFav) {
                  newFavorites.add(article.id);
                } else {
                  newFavorites.delete(article.id);
                }

                // Clone ALL items to avoid reference issues
                if (prev.currentFeed) {
                  const updatedItems = prev.currentFeed.items.map((item, idx) => ({
                    ...item,
                    isFavorite: idx === articleIndex ? isFav : item.isFavorite,
                  }));
                  return {
                    ...prev,
                    currentFeed: { ...prev.currentFeed, items: updatedItems },
                    favorites: newFavorites,
                  };
                }
                return { ...prev, favorites: newFavorites };
              });
            });
          }
        } else if (key === Keys.ESC) {
          setState((prev) => ({
            ...prev,
            viewMode: "feed-list",
            currentFeed: null,
            selectedArticleIndex: 0,
          }));
        }
      }

      // Article viewer
      else if (state.viewMode === "article-viewer" && state.currentArticle) {
        if (key === Keys.UP || key === Keys.SCROLL_UP) {
          setState((prev) => ({
            ...prev,
            scrollPosition: Math.max(0, prev.scrollPosition - 1),
          }));
        } else if (key === Keys.DOWN || key === Keys.SCROLL_DOWN) {
          // Calculate max scroll based on RENDERED content (same as ArticleViewer)
          const htmlContent = state.viewingWebpage && state.currentArticle.webpageContent
            ? state.currentArticle.webpageContent
            : (state.currentArticle.content || state.currentArticle.description || "");
          const renderedContent = state.viewingWebpage && state.currentArticle.webpageContent
            ? renderWebpage(htmlContent)
            : renderArticle(htmlContent);
          const lines = renderedContent.split("\n").length;
          const visibleLines = 18;
          const maxScroll = Math.max(0, lines - visibleLines);
          
          setState((prev) => ({
            ...prev,
            scrollPosition: Math.min(maxScroll, prev.scrollPosition + 1),
          }));
        } else if (key === "f" || key === "F") {
          const article = state.currentArticle;
          toggleFavorite(article.id, article.title, article.link, state.currentFeed?.title).then((isFav) => {
            setState((prev) => {
              if (!prev.currentArticle) return prev;
              const newFavorites = new Set(prev.favorites);
              if (isFav) {
                newFavorites.add(prev.currentArticle.id);
              } else {
                newFavorites.delete(prev.currentArticle.id);
              }

              // Update both currentArticle AND ALL feed items (clone all for safety)
              const updatedFeed = prev.currentFeed ? {
                ...prev.currentFeed,
                items: prev.currentFeed.items.map((item) => ({
                  ...item,
                  isFavorite: item.id === prev.currentArticle!.id ? isFav : item.isFavorite,
                })),
              } : null;

              return {
                ...prev,
                currentFeed: updatedFeed,
                currentArticle: { ...prev.currentArticle, isFavorite: isFav },
                favorites: newFavorites,
              };
            });
          });
        } else if (key === "w" || key === "W") {
          // Fetch and display full webpage
          const article = state.currentArticle;
          if (!article.webpageContent) {
            // Fetch webpage if not already cached
            setLoading(true);
            fetchWebpage(article.link)
              .then((html) => {
                setState((prev) => {
                  if (!prev.currentArticle) return prev;
                  // Only update currentArticle, don't modify feed items
                  return {
                    ...prev,
                    viewingWebpage: true,
                    scrollPosition: 0,
                    currentArticle: { ...prev.currentArticle, webpageContent: html },
                  };
                });
                setLoading(false);
              })
              .catch((err) => {
                setError(`Failed to fetch webpage: ${err.message}`);
                setLoading(false);
              });
          } else {
            // Toggle between RSS content and webpage
            setState((prev) => ({
              ...prev,
              viewingWebpage: !prev.viewingWebpage,
              scrollPosition: 0,
            }));
          }
        } else if (key === "o" || key === "O") {
          // Open article in system browser
          const url = state.currentArticle.link;
          if (url) {
            // Use macOS 'open' command to launch default browser
            Bun.spawn(["open", url]);
          }
        } else if (key === Keys.ESC) {
          // Refresh favorites from database when returning to article-list
          const currentFavorites = getFavoriteArticles();
          const favoriteIds = new Set(currentFavorites.map(f => f.id));
          
          setState((prev) => {
            const updatedFeed = prev.currentFeed ? {
              ...prev.currentFeed,
              items: prev.currentFeed.items.map((item) => ({
                ...item,
                isFavorite: favoriteIds.has(item.id),
              })),
            } : null;
            
            return {
              ...prev,
              viewMode: "article-list",
              currentFeed: updatedFeed,
              currentArticle: null,
              scrollPosition: 0,
              viewingWebpage: false,
              favorites: favoriteIds,
            };
          });
        }
      }
      
      // Add feed dialog
      else if (state.viewMode === "add-feed") {
        if (key === Keys.ESC) {
          setState((prev) => ({
            ...prev,
            viewMode: "feed-list",
            inputText: "",
            inputError: null,
          }));
        } else if (key === Keys.ENTER) {
          // Validate and add feed
          const url = state.inputText.trim();
          if (url) {
            setLoading(true);
            validateFeedUrl(url).then((result) => {
              setLoading(false);
              if (result.valid && result.title) {
                // Add the feed
                const newFeed = {
                  id: generateFeedId(url),
                  name: result.title,
                  url: url,
                };
                addFeedSource(newFeed);
                setState((prev) => ({
                  ...prev,
                  viewMode: "feed-list",
                  feedSources: [...prev.feedSources, newFeed],
                  inputText: "",
                  inputError: null,
                }));
              } else {
                setState((prev) => ({
                  ...prev,
                  inputError: result.error || "Invalid feed",
                }));
              }
            });
          }
        } else if (key === Keys.BACKSPACE) {
          setState((prev) => ({
            ...prev,
            inputText: prev.inputText.slice(0, -1),
            inputError: null,
          }));
        } else if (key.length === 1 && key.charCodeAt(0) >= 32) {
          // Regular character input
          setState((prev) => ({
            ...prev,
            inputText: prev.inputText + key,
            inputError: null,
          }));
        }
      }
      
      // Favorites view
      else if (state.viewMode === "favorites") {
        if (key === Keys.ESC) {
          setState((prev) => ({
            ...prev,
            viewMode: "feed-list",
          }));
        } else if (key === Keys.UP) {
          setState((prev) => ({
            ...prev,
            selectedArticleIndex: Math.max(0, prev.selectedArticleIndex - 1),
          }));
        } else if (key === Keys.DOWN) {
          const favorites = getFavoriteArticles();
          setState((prev) => ({
            ...prev,
            selectedArticleIndex: Math.min(favorites.length - 1, prev.selectedArticleIndex + 1),
          }));
        } else if (key === Keys.ENTER) {
          // Open favorite article in article viewer
          const favorites = getFavoriteArticles();
          const selected = favorites[state.selectedArticleIndex];
          if (selected) {
            // Create a minimal RSSItem from favorite data
            const articleToView: RSSItem = {
              id: selected.id,
              title: selected.title,
              link: selected.link,
              description: "",
              content: "",
              pubDate: new Date(),
              isFavorite: true,
            };
            setState((prev) => ({
              ...prev,
              currentArticle: articleToView,
              viewMode: "article-viewer",
              scrollPosition: 0,
              viewingWebpage: false,
            }));
            // Auto-fetch webpage content for favorites
            setLoading(true);
            fetchWebpage(selected.link)
              .then((html) => {
                setState((prev) => {
                  if (!prev.currentArticle) return prev;
                  return {
                    ...prev,
                    currentArticle: { ...prev.currentArticle, webpageContent: html },
                    viewingWebpage: true,
                  };
                });
                setLoading(false);
              })
              .catch(() => setLoading(false));
          }
        } else if (key === "o" || key === "O") {
          // Open in browser
          const favorites = getFavoriteArticles();
          const selected = favorites[state.selectedArticleIndex];
          if (selected) {
            Bun.spawn(["open", selected.link]);
          }
        } else if (key === "d" || key === "D") {
          // Delete from favorites
          const favorites = getFavoriteArticles();
          const selected = favorites[state.selectedArticleIndex];
          if (selected) {
            removeFavorite(selected.id);
            const newFavorites = new Set(state.favorites);
            newFavorites.delete(selected.id);
            setState((prev) => ({
              ...prev,
              favorites: newFavorites,
              selectedArticleIndex: Math.max(0, prev.selectedArticleIndex - 1),
            }));
          }
        }
      }
    },
    [state, loadFeed]
  );

  useKeyboard(handleKey, !loading);

  // Render views
  if (loading && state.feedSources.length === 0) {
    return (
      <box alignItems="center" justifyContent="center" flexGrow={1}>
        <text>Loading...</text>
      </box>
    );
  }

  if (error) {
    return (
      <box flexDirection="column" flexGrow={1}>
        <box alignItems="center" justifyContent="center" flexGrow={1}>
          <text>Error: {error}</text>
        </box>
        <StatusBar viewMode={state.viewMode} />
      </box>
    );
  }

  const getWindowTitle = () => {
    switch (state.viewMode) {
      case "feed-list":
        return "📰 RSS FEEDS";
      case "article-list":
        return state.currentFeed ? `📖 ${state.currentFeed.title}` : "📖 Articles";
      case "article-viewer":
        return state.currentArticle 
          ? `${state.currentArticle.isFavorite ? "★ " : ""}${state.currentArticle.title.substring(0, 50)}${state.currentArticle.title.length > 50 ? "..." : ""}`
          : "Article";
      case "add-feed":
        return "➕ Add Feed";
      case "favorites":
        return "⭐ Favorites";
      case "edit-feed":
        return "✏️ Edit Feed";
      default:
        return "TUI RSS Reader";
    }
  };

  // Calculate scroll percentage for article viewer
  const getScrollInfo = () => {
    if (state.viewMode === "article-viewer" && state.currentArticle) {
      // We approximate the content length
      const content = state.viewingWebpage && state.currentArticle.webpageContent
        ? state.currentArticle.webpageContent
        : (state.currentArticle.content || state.currentArticle.description || "");
      const lines = content.split("\n").length;
      const visibleLines = 18; // Match ArticleViewer MAX_VISIBLE_LINES
      const maxScroll = Math.max(0, lines - visibleLines);
      const percent = maxScroll > 0 ? Math.round((state.scrollPosition / maxScroll) * 100) : 100;
      return { canScroll: lines > visibleLines, scrollPercent: Math.min(100, percent) };
    }
    return { canScroll: false, scrollPercent: undefined };
  };
  
  const scrollInfo = getScrollInfo();

  return (
    <box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center">
      <Window 
        title={getWindowTitle()}
        canScroll={scrollInfo.canScroll}
        scrollPercent={scrollInfo.scrollPercent}
        wide={state.viewMode === "article-viewer"}
      >
        {loading && state.viewMode !== "add-feed" ? (
          <box alignItems="center" justifyContent="center" height={18}>
            <text>Loading...</text>
          </box>
        ) : state.viewMode === "add-feed" ? (
          <AddFeedDialog
            inputText={state.inputText}
            error={state.inputError}
            validating={loading}
          />
        ) : state.viewMode === "favorites" ? (
          <FavoritesView
            favorites={getFavoriteArticles()}
            selectedIndex={state.selectedArticleIndex}
          />
        ) : state.viewMode === "feed-list" ? (
          state.feedSources.length === 0 ? (
            <EmptyState />
          ) : (
            <FeedList
              feeds={state.feedSources}
              selectedIndex={state.selectedFeedIndex}
            />
          )
        ) : state.viewMode === "article-list" && state.currentFeed ? (
          <ArticleList
            articles={state.currentFeed.items}
            selectedIndex={state.selectedArticleIndex}
            feedTitle={state.currentFeed.title}
          />
        ) : state.viewMode === "article-viewer" && state.currentArticle ? (
          <ArticleViewer
            article={state.currentArticle}
            scrollPosition={state.scrollPosition}
            viewingWebpage={state.viewingWebpage}
          />
        ) : null}
      </Window>
      <StatusBar viewMode={state.viewMode} />
    </box>
  );
}



const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);

