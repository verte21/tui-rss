import { TextAttributes } from "@opentui/core";

export function EmptyState() {
  return (
    <box flexDirection="column">
      <text attributes={TextAttributes.BOLD} fg="#bada55">
        📭 No Feeds
      </text>
      
      <box paddingTop={1}>
        <text attributes={TextAttributes.DIM}>
          You haven't added any RSS feeds yet.
        </text>
      </box>
      
      <box paddingTop={1}>
        <text>
          Press A to add your first feed
        </text>
      </box>
      
      <box flexDirection="column" paddingTop={2}>
        <text attributes={TextAttributes.DIM}>Popular feeds to get started:</text>
        <text attributes={TextAttributes.DIM}>• https://hnrss.org/frontpage</text>
        <text attributes={TextAttributes.DIM}>• https://techcrunch.com/feed/</text>
      </box>
    </box>
  );
}
