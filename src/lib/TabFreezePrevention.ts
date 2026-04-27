import { v4 as uuidv4 } from 'uuid';
import { isFirefox } from './isFirefox';
/**
 * If the browser supports web lock api, obtain a web lock indefinitely.
 * This will prevent chrome's proactive tab freeze feature from freezing
 * our app.
 *
 * https://www.chromestatus.com/feature/5193677469122560
 * https://developer.mozilla.org/en-US/docs/Web/API/Lock
 *
 * Use randomly generated uuid to prevent lock collision. While it should not
 * have any affect if multiple tabs uses the same name for the lock, we want to
 * avoid this since the api is still experimental and might have strange results.
 */

if (!isFirefox()) {
  window.navigator?.locks?.request?.(uuidv4(), () => {
    return new Promise(() => {});
  });
}
