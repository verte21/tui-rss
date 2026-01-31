import { TextAttributes } from "@opentui/core";
import type { ViewMode } from "../types";

interface StatusBarProps {
  viewMode: ViewMode;
}

export function StatusBar({ viewMode }: StatusBarProps) {
  const getHelp = () => {
    switch (viewMode) {
      case "feed-list":
        return "↑↓: Navigate | A: Add | D: Delete | S: Saved | Enter: Open | Q: Quit";
      case "article-list":
        return "↑↓: Navigate | Enter: Read | F: Favorite | Esc: Back | Q: Quit";
      case "article-viewer":
        return "↑↓: Scroll | O: Open | W: Web | F: Fav | Esc: Back";
      case "add-feed":
        return "Type URL | Enter: Add | Esc: Cancel";
      case "favorites":
        return "↑↓: Navigate | Enter: Open in Browser | Esc: Back";
      default:
        return "";
    }
  };

  return (
    <box flexDirection="column">
      <text attributes={TextAttributes.DIM} fg="#bada55">{"─".repeat(92)}</text>
      <box flexDirection="row" justifyContent="space-between" paddingTop={0} paddingBottom={1}>
        <text fg="#bada55"> 📡 Tui-RSS </text>
        <text attributes={TextAttributes.DIM}>{getHelp()}</text>
      </box>
    </box>
  );
}





