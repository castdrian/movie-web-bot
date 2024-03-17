// Define the regular expression pattern for URLs to suppress
const urlRegex = /https:\/\/stream\.voidboost\.cc\/[^\s,]+\.mp4/;

const originalConsoleLog = console.log;

function containsUrl(obj: any): boolean {
  if (typeof obj === 'string' && urlRegex.test(obj)) {
    return true;
  }

  if (Array.isArray(obj)) {
    return obj.some(containsUrl);
  }

  if (typeof obj === 'object' && obj !== null) {
    return Object.values(obj).some(containsUrl);
  }

  return false;
}

// Override console.log with a custom function
console.log = function log(...args: any[]) {
  for (const arg of args) {
    if (containsUrl(arg)) {
      return;
    }
  }

  originalConsoleLog(...args);
};
