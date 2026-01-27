import { TextAttributes } from "@opentui/core";
import type { ReactNode } from "react";

interface WindowProps {
  title: string;
  children: ReactNode;
  scrollPercent?: number;
  canScroll?: boolean;
  wide?: boolean; // For article viewer mode
}

export function Window({ title, children, wide = false }: WindowProps) {
  const width = wide ? 90 : 78;
  
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
        
        {/* Content with padding */}
        <box flexDirection="column" paddingLeft={3} paddingRight={3} paddingTop={1} paddingBottom={1}>
          {children}
        </box>
        
        {/* Bottom border */}
        <text fg="#bada55" attributes={TextAttributes.BOLD}>{bottomBorder}</text>
      </box>
    </box>
  );
}
