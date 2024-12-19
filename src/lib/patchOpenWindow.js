try {
  if (!window.__originalOpen) {
    window.__originalOpen = window.open;
    window.open = function(url, id, options) {
      if (typeof url === 'string' && url.indexOf('javascript') > -1) {
        throw new Error('Invalid open window uri');
      }
      return window.__originalOpen(url, id, options);
    }
  }
} catch (e) {
  console.error(e);
}


