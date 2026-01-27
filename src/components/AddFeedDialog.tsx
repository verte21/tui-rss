import { TextAttributes } from "@opentui/core";

interface AddFeedDialogProps {
  inputText: string;
  error: string | null;
  validating: boolean;
  feedTitle?: string; // Shows when validation successful
}

export function AddFeedDialog({ inputText, error, validating, feedTitle }: AddFeedDialogProps) {
  return (
    <box flexDirection="column">
      <box paddingBottom={1}>
        <text attributes={TextAttributes.BOLD} fg="#bada55">
          Add New Feed
        </text>
      </box>
      
      <box paddingBottom={1}>
        <text attributes={TextAttributes.DIM}>
          Enter RSS feed URL and press Enter to validate:
        </text>
      </box>
      
      {/* Input field */}
      <box flexDirection="row" paddingBottom={1}>
        <text fg="#bada55">▸ </text>
        <text>{inputText || " "}</text>
        <text attributes={TextAttributes.BLINK} fg="#bada55">▋</text>
      </box>
      
      {/* Status message */}
      {validating && (
        <box paddingTop={1}>
          <text fg="#bada55">⏳ Validating feed...</text>
        </box>
      )}
      
      {error && (
        <box paddingTop={1}>
          <text fg="#ff6b6b">✗ {error}</text>
        </box>
      )}
      
      {feedTitle && !error && !validating && (
        <box paddingTop={1} flexDirection="column">
          <text fg="#4ecdc4">✓ Valid feed: {feedTitle}</text>
          <text attributes={TextAttributes.DIM}>Press Enter again to add, Esc to cancel</text>
        </box>
      )}
      
      {/* Help text */}
      <box paddingTop={2}>
        <text attributes={TextAttributes.DIM}>
          Example: https://example.com/rss.xml
        </text>
      </box>
    </box>
  );
}
