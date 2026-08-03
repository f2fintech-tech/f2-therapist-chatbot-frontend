// mockReact.ts
// Headless React mock for testing custom hooks in Node.js

let mockRefValue: any = null;
const mockRef = {
  get current() {
    return mockRefValue;
  },
  set current(val) {
    mockRefValue = val;
  }
};

export function useRef(initialValue: any) {
  mockRef.current = initialValue;
  return mockRef;
}

export let activeEffectCleanup: (() => void) | null = null;

export function resetMockReact() {
  activeEffectCleanup = null;
  mockRefValue = null;
}

export function useEffect(effect: () => (void | (() => void)), deps?: any[]) {
  const cleanup = effect();
  if (typeof cleanup === "function") {
    activeEffectCleanup = cleanup;
  }
}
