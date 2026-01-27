import { TextAttributes } from "@opentui/core";
import { truncate } from "../utils/article-renderer";

interface FavoriteArticle {
  id: string;
  title: string;
  link: string;
  feedName?: string;
}

interface FavoritesViewProps {
  favorites: FavoriteArticle[];
  selectedIndex: number;
}

export function FavoritesView({ favorites, selectedIndex }: FavoritesViewProps) {
  if (favorites.length === 0) {
    return (
      <box flexDirection="column">
        <text attributes={TextAttributes.BOLD} fg="#bada55">
          ★ No Favorites Yet
        </text>
        <box paddingTop={1}>
          <text attributes={TextAttributes.DIM}>
            Press F on any article to save it here.
          </text>
        </box>
      </box>
    );
  }

  // Show max 10 favorites with scrolling window
  const maxVisible = 10;
  const startIdx = Math.max(0, Math.min(selectedIndex - 2, favorites.length - maxVisible));
  const visibleFavorites = favorites.slice(startIdx, startIdx + maxVisible);

  return (
    <box flexDirection="column">
      <text attributes={TextAttributes.DIM}>
        ★ {favorites.length} saved article{favorites.length !== 1 ? "s" : ""}
      </text>
      
      {visibleFavorites.map((fav, idx) => {
        const actualIdx = startIdx + idx;
        const isSelected = actualIdx === selectedIndex;
        
        return (
          <box key={`fav-${actualIdx}`} flexDirection="column" paddingTop={1}>
            <text
              fg={isSelected ? "#bada55" : undefined}
              attributes={isSelected ? TextAttributes.BOLD : TextAttributes.NONE}
            >
              {isSelected ? "▶ " : "  "}
              {truncate(fav.title, 68)}
            </text>
            {isSelected && fav.feedName && (
              <text attributes={TextAttributes.DIM}>
                {"    "}from {fav.feedName}
              </text>
            )}
          </box>
        );
      })}
      
      {favorites.length > maxVisible && (
        <box paddingTop={1}>
          <text attributes={TextAttributes.DIM}>
            {selectedIndex + 1} of {favorites.length}
          </text>
        </box>
      )}
    </box>
  );
}
