import { useEffect, useRef } from "react";

export type KeyHandler = (key: string, input: string) => void;

/**
 * Custom hook for handling keyboard input including mouse scroll
 */
export function useKeyboard(handler: KeyHandler, enabled: boolean = true) {
  const handlerRef = useRef<KeyHandler>(handler);

  // Update ref when handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const stdin = process.stdin;
    
    // Set raw mode to capture individual key presses
    if (stdin.isTTY && !stdin.isRaw) {
      stdin.setRawMode(true);
    }
    stdin.resume();
    stdin.setEncoding("utf8");

    const onData = (data: string) => {
      // Check for mouse wheel events (SGR mouse mode)
      // Format: ESC [ < Cb ; Cx ; Cy M  or  ESC [ < Cb ; Cx ; Cy m
      // Scroll up: button 64, scroll down: button 65
      if (data.startsWith("\x1b[<")) {
        const match = data.match(/\x1b\[<(\d+);(\d+);(\d+)[Mm]/);
        if (match) {
          const button = parseInt(match[1]!, 10);
          // Button 64 = scroll up, Button 65 = scroll down
          if (button === 64) {
            handlerRef.current(Keys.SCROLL_UP, data);
            return;
          } else if (button === 65) {
            handlerRef.current(Keys.SCROLL_DOWN, data);
            return;
          }
        }
      }
      handlerRef.current(data, data);
    };

    stdin.on("data", onData);

    return () => {
      stdin.off("data", onData);
    };
  }, [enabled]);
}

/**
 * Key codes for common keys
 */
export const Keys = {
  UP: "\u001b[A",
  DOWN: "\u001b[B",
  LEFT: "\u001b[C",
  RIGHT: "\u001b[D",
  ENTER: "\r",
  ESC: "\u001b",
  CTRL_C: "\u0003",
  SPACE: " ",
  BACKSPACE: "\u007f",
  SCROLL_UP: "SCROLL_UP",
  SCROLL_DOWN: "SCROLL_DOWN",
} as const;
