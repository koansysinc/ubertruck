/**
 * Jest setup file
 * Runs before all tests
 */

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Suppress not-implemented errors from jsdom
const originalConsoleError = console.error;
global.console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Not implemented: navigation') ||
     args[0].includes('Not implemented: HTMLFormElement'))
  ) {
    return;
  }
  originalConsoleError.call(console, ...args);
};
