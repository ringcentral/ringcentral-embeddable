export function getNewWindowPromise() {
  const newWindowPromise = new Promise(resolve => browser.once('targetcreated', target => resolve(target.page())));
  return newWindowPromise;
}
