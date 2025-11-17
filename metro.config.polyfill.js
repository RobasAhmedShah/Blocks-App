// Polyfill for URL.canParse for Node.js compatibility
// Some Metro versions expect this method which was added in Node.js 19.9.0
if (typeof URL.canParse !== 'function') {
  URL.canParse = function (url, base) {
    try {
      new URL(url, base);
      return true;
    } catch {
      return false;
    }
  };
}

