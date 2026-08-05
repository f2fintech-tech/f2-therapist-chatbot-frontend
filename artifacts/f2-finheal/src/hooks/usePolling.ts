import { useEffect, useRef } from "react";

export function usePolling(callback: () => void, delay: number, enabled: boolean = true) {
  const savedCallback = useRef(callback);

  // Keep callback reference updated to prevent stale closures
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (!document.hidden) {
        savedCallback.current();
      }
    };

    const startInterval = () => {
      intervalId = setInterval(tick, delay);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Fetch immediately upon refocus so the user doesn't wait
        tick();
        // Clear existing interval and start a fresh 15-second cycle
        if (intervalId) clearInterval(intervalId);
        startInterval();
      } else {
        // Pause polling in background to save database resources
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };

    // Trigger initial fetch and start interval
    tick();
    startInterval();

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [delay, enabled]);
}
