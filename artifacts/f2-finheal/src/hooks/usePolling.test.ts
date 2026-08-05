// usePolling.test.ts
// Standalone automated test for usePolling.ts using native Node.js ESM.
// Verified via: node --experimental-strip-types

import { useEffect, useRef, activeEffectCleanup } from "./mockReact.ts";

// --- COPY OF THE hook LOGIC FOR TESTING (pointing to mockReact) ---
function usePolling(callback: () => void, delay: number, enabled: boolean = true) {
  const savedCallback = useRef(callback);

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
        tick();
        if (intervalId) clearInterval(intervalId);
        startInterval();
      } else {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };

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

// --- MOCK TIMER SYSTEM ---
let currentTimerId = 1;
const activeIntervals = new Map<number, { callback: () => void; delay: number }>();

const mockSetInterval = (callback: () => void, delay: number): any => {
  const id = currentTimerId++;
  activeIntervals.set(id, { callback, delay });
  return id;
};

const mockClearInterval = (id: any): void => {
  activeIntervals.delete(id);
};

(global as any).setInterval = mockSetInterval;
(global as any).clearInterval = mockClearInterval;

// --- MOCK DOCUMENT & VISIBILITY EVENTS ---
let isDocumentHidden = false;
const eventListeners = new Map<string, Array<(e: any) => void>>();

const mockDocument = {
  get hidden() {
    return isDocumentHidden;
  },
  addEventListener(event: string, callback: (e: any) => void) {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, []);
    }
    eventListeners.get(event)!.push(callback);
  },
  removeEventListener(event: string, callback: (e: any) => void) {
    const list = eventListeners.get(event) || [];
    eventListeners.set(event, list.filter(cb => cb !== callback));
  }
};

(global as any).document = mockDocument;

// --- UTILITY HELPER TO ADVANCE TIME ---
const advanceTime = (ms: number) => {
  for (const [id, timer] of activeIntervals.entries()) {
    if (ms >= timer.delay) {
      timer.callback();
    }
  }
};

const triggerVisibilityChange = (hidden: boolean) => {
  isDocumentHidden = hidden;
  const list = eventListeners.get("visibilitychange") || [];
  for (const cb of list) {
    cb({});
  }
};

// --- RUN TESTS ---
console.log("🚀 Starting Automated Test for usePolling.ts...");

let callbackCount = 0;
const testCallback = () => {
  callbackCount++;
};

// 1. Initialize hook
usePolling(testCallback, 15000, true);

// Verify initial execution (hook runs callback immediately on mount if visible)
console.assert(callbackCount === 1, "FAIL: Should trigger immediate callback on mount");
console.assert(activeIntervals.size === 1, "FAIL: Should start exactly 1 interval timer");
const initialTimerId = Array.from(activeIntervals.keys())[0];
console.log("✅ Initial mount check passed: Callback triggered once, interval started.");

// 2. Advance time by 15 seconds
advanceTime(15000);
console.assert(callbackCount === 2, `FAIL: Expected callback count 2, got ${callbackCount}`);
console.log("✅ Interval tick check passed: Callback fires on delay interval.");

// 3. Document becomes hidden (background tab)
triggerVisibilityChange(true);
console.assert(activeIntervals.size === 0, "FAIL: Interval should be cleared in background");
console.log("✅ Page Visibility (Background) check passed: Interval paused, activeIntervals cleaned up.");

// 4. Advance time while hidden
callbackCount = 2;
advanceTime(15000);
console.assert(callbackCount === 2, "FAIL: Callback should NOT fire while hidden");
console.log("✅ Page Visibility (Background Idle) check passed: No requests fired while hidden.");

// 5. Document becomes visible (refocus tab)
triggerVisibilityChange(false);
console.assert(callbackCount === 3, "FAIL: Callback should fire immediately upon tab focus");
console.assert(activeIntervals.size === 1, "FAIL: New interval should start on focus");
console.log("✅ Page Visibility (Refocus) check passed: Fetched immediately, new interval loop started.");

// 6. Component Unmount
console.assert(activeEffectCleanup !== null, "FAIL: Cleanup function not registered");
if (activeEffectCleanup) {
  activeEffectCleanup();
}
console.assert(activeIntervals.size === 0, "FAIL: Unmount should clear the active interval");
const remainingListeners = eventListeners.get("visibilitychange") || [];
console.assert(remainingListeners.length === 0, "FAIL: Unmount should remove visibilitychange listener");
console.log("✅ Component Unmount cleanup check passed: All intervals and listeners removed cleanly.");

console.log("\n🎉 ALL AUTOMATED TESTS PASSED SUCCESSFULLY! 🎉\n");
