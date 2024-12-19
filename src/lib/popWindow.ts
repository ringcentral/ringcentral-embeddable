export function popWindow(url: string, id: string, w: number, h: number) {
  if (url.indexOf('javascript') > 0) {
    throw new Error('Invalid window open url');
  }
  // Fixes dual-screen position                         Most browsers      Firefox
  const dualScreenLeft =
    window.screenLeft !== undefined
      ? window.screenLeft
      : (window.screen as any).left;
  const dualScreenTop =
    window.screenTop !== undefined
      ? window.screenTop
      : (window.screen as any).top;

  const width = window.screen.width || window.outerWidth;
  const height = window.screen.height || window.innerHeight;
  const left = width / 2 - w / 2 + dualScreenLeft;
  const top = height / 2 - h / 2 + dualScreenTop;

  const newWindow = window.open(
    url,
    id,
    `scrollbars=yes, width=${w}, height=${h}, top=${top}, left=${left}`,
  );

  // Puts focus on the newWindow
  try {
    newWindow?.focus();
  } catch (error) {
    /* ignore error */
  }
  return newWindow;
}

export default popWindow;
