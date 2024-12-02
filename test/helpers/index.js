export function getNewWindowPromise() {
  const newWindowPromise = new Promise(resolve => browser.once('targetcreated', target => resolve(target.page())));
  return newWindowPromise;
}

export function waitForTimeout(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}
