import { TextAttributes } from "@opentui/core";
import type { ReactNode } from "react";

interface WindowProps {
  title: string;
  children: ReactNode;
  scrollPercent?: number;
  canScroll?: boolean;
}

export function Window({ title, children }: WindowProps) {
  const width = 78;
  
  // Create top border: ╔═══ Title ═══╗
  const titlePadded = ` ${title} `;
  const remainingWidth = width - 2 - titlePadded.length;
  const leftBorder = Math.floor(remainingWidth / 2);
  const rightBorder = remainingWidth - leftBorder;
  const topBorder = `╔${"═".repeat(leftBorder)}${titlePadded}${"═".repeat(rightBorder)}╗`;
  
  // Bottom border
  const bottomBorder = `╚${"═".repeat(width - 2)}╝`;

  return (
    <box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
      <box flexDirection="column">
        {/* Top border with title */}
        <text fg="#bada55" attributes={TextAttributes.BOLD}>{topBorder}</text>
        
        {/* Content with simple side borders */}
        <box flexDirection="column" paddingLeft={2} paddingRight={2}>
          {children}
        </box>
        
        {/* Bottom border */}
        <text fg="#bada55" attributes={TextAttributes.BOLD}>{bottomBorder}</text>
      </box>
    </box>
  );
}
