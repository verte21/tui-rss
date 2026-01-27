import { TextAttributes } from "@opentui/core";
import type { FeedSource } from "../types";

interface FeedListProps {
  feeds: FeedSource[];
  selectedIndex: number;
}

export function FeedList({ feeds, selectedIndex }: FeedListProps) {
  // Show max 8 feeds with scrolling window
  const maxVisible = 8;
  const startIdx = Math.max(0, Math.min(selectedIndex - 2, feeds.length - maxVisible));
  const visibleFeeds = feeds.slice(startIdx, startIdx + maxVisible);

  return (
    <box flexDirection="column">
      {visibleFeeds.map((feed, idx) => {
        const actualIdx = startIdx + idx;
        const isSelected = actualIdx === selectedIndex;
        
        return (
          <box key={feed.id} flexDirection="row" paddingTop={idx === 0 ? 0 : 1}>
            <text
              fg={isSelected ? "#bada55" : undefined}
              attributes={isSelected ? TextAttributes.BOLD : TextAttributes.NONE}
            >
              {isSelected ? "▶ " : "  "}
              {feed.name}
            </text>
          </box>
        );
      })}
      
      {feeds.length > maxVisible && (
        <box paddingTop={1}>
          <text attributes={TextAttributes.DIM}>
            {selectedIndex + 1} of {feeds.length}
          </text>
        </box>
      )}
    </box>
  );
}
