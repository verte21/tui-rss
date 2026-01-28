import { TextAttributes } from "@opentui/core";
import type { RSSItem } from "../types";
import { formatDate, truncate } from "../utils/article-renderer";

interface ArticleListProps {
  articles: RSSItem[];
  selectedIndex: number;
  feedTitle: string;
}

export function ArticleList({ articles, selectedIndex }: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <box>
        <text attributes={TextAttributes.DIM}>No articles found</text>
      </box>
    );
  }

  // Show max 12 articles with scrolling window
  const maxVisible = 12;
  const startIdx = Math.max(0, Math.min(selectedIndex - 2, articles.length - maxVisible));
  const visibleArticles = articles.slice(startIdx, startIdx + maxVisible);



  return (
    <box flexDirection="column">
      {visibleArticles.map((article, idx) => {
        const actualIdx = startIdx + idx;
        const isSelected = actualIdx === selectedIndex;
        
        return (
          <box key={`${article.id}-${actualIdx}`} flexDirection="column" paddingTop={idx === 0 ? 0 : 1}>
            <text
              fg={isSelected ? "#bada55" : undefined}
              attributes={isSelected ? TextAttributes.BOLD : TextAttributes.NONE}
            >
              {isSelected ? "▶ " : "  "}
              {article.isFavorite ? "★ " : ""}
              {truncate(article.title, 68)}
            </text>
            {isSelected && (
              <text attributes={TextAttributes.DIM}>
                {"    "}
                {formatDate(article.pubDate)}
                {article.author ? ` • ${truncate(article.author, 20)}` : ""}
              </text>
            )}
          </box>
        );
      })}
      
      {articles.length > maxVisible && (
        <box paddingTop={1}>
          <text attributes={TextAttributes.DIM}>
            {selectedIndex + 1} of {articles.length}
          </text>
        </box>
      )}
    </box>
  );
}
