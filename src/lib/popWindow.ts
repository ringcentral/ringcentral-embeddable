export function popWindow(
  url: string,
  id: string,
  width: number,
  height: number,
): Window | null {
  if (url.includes('javascript')) {
    throw new Error('Invalid window open url');
  }

  const dualScreenLeft =
    window.screenLeft !== undefined
      ? window.screenLeft
      : (window.screen as any).left;
  const dualScreenTop =
    window.screenTop !== undefined
      ? window.screenTop
      : (window.screen as any).top;

  const screenWidth = window.screen.width || window.outerWidth;
  const screenHeight = window.screen.height || window.innerHeight;
  const left = screenWidth / 2 - width / 2 + dualScreenLeft;
  const top = screenHeight / 2 - height / 2 + dualScreenTop;

  const popupWindow = window.open(
    url,
    id,
    `scrollbars=yes,width=${width},height=${height},top=${top},left=${left}`,
  );

  try {
    popupWindow?.focus();
  } catch {
    //
  }

  return popupWindow;
}

export default popWindow;
