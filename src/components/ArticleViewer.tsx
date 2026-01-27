import { TextAttributes } from "@opentui/core";
import type { RSSItem } from "../types";
import { formatDate, renderArticle, renderWebpage } from "../utils/article-renderer";

interface ArticleViewerProps {
  article: RSSItem;
  scrollPosition: number;
  viewingWebpage: boolean;
}

// Export max visible lines so parent can limit scrolling
export const MAX_VISIBLE_LINES = 18;

export function ArticleViewer({ article, scrollPosition, viewingWebpage }: ArticleViewerProps) {
  const htmlContent = viewingWebpage && article.webpageContent 
    ? article.webpageContent 
    : (article.content || article.description);
  
  const renderedContent = viewingWebpage && article.webpageContent
    ? renderWebpage(htmlContent)
    : renderArticle(htmlContent);
    
  const lines = renderedContent.split("\n");
  const maxScrollPosition = Math.max(0, lines.length - MAX_VISIBLE_LINES);
  const clampedScroll = Math.min(scrollPosition, maxScrollPosition);
  const visibleLines = lines.slice(clampedScroll, clampedScroll + MAX_VISIBLE_LINES);
  
  const scrollPercentage = maxScrollPosition > 0 
    ? Math.round((clampedScroll / maxScrollPosition) * 100)
    : 100;

  const canScroll = lines.length > MAX_VISIBLE_LINES;

  return (
    <box flexDirection="column">
      {/* Metadata */}
      <box paddingBottom={1}>
        <text attributes={TextAttributes.DIM}>
          {formatDate(article.pubDate)}
          {article.author ? ` • ${article.author}` : ""}
        </text>
      </box>
      
      {/* Content */}
      {visibleLines.map((line, index) => (
        <text key={clampedScroll + index}>{line || " "}</text>
      ))}
      
      {/* Scroll indicator - only show if scrollable */}
      {canScroll && (
        <box paddingTop={1}>
          <text attributes={TextAttributes.DIM} fg="#bada55">
            ↑↓ scroll • {Math.min(100, scrollPercentage)}%
            {viewingWebpage ? " • Webpage" : " • [W] full page"}
          </text>
        </box>
      )}
      
      {/* No scroll message if content fits */}
      {!canScroll && (
        <box paddingTop={1}>
          <text attributes={TextAttributes.DIM} fg="#bada55">
            {viewingWebpage ? "Webpage" : "[W] load full page"} • [O] open in browser
          </text>
        </box>
      )}
    </box>
  );
}




