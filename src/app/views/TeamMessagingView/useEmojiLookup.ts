import { useEffect, useState } from 'react';

import type { EmojiLookup } from './formatPostText';

type EmojiSkin = { native?: string };
type EmojiData = { skins?: EmojiSkin[] };

let emojiLookupPromise: Promise<EmojiLookup> | null = null;
let loadedEmojiLookup: EmojiLookup | undefined;

/**
 * Load the emoji index once. emoji-mart fetches its data the same way the
 * emoji picker does.
 */
function loadEmojiLookup(): Promise<EmojiLookup> {
  if (!emojiLookupPromise) {
    emojiLookupPromise = import('emoji-mart').then(
      async ({ init, SearchIndex }) => {
        await init({});
        // The bundled typings name `SearchIndex.get` as `_get2`.
        const searchIndex = SearchIndex as unknown as {
          get(shortcode: string): EmojiData | undefined;
        };
        const lookup: EmojiLookup = (shortcode) =>
          searchIndex.get(shortcode)?.skins?.[0]?.native;
        loadedEmojiLookup = lookup;
        return lookup;
      },
    );
  }
  return emojiLookupPromise;
}

/**
 * Resolves `:shortcode:` emoji once the index has loaded; `undefined` until
 * then, when shortcodes show as text.
 */
export function useEmojiLookup(): EmojiLookup | undefined {
  const [lookup, setLookup] = useState<EmojiLookup | undefined>(
    () => loadedEmojiLookup,
  );
  useEffect(() => {
    if (lookup) {
      return undefined;
    }
    let active = true;
    loadEmojiLookup()
      .then((loaded) => {
        if (active) {
          setLookup(() => loaded);
        }
      })
      .catch(() => {
        emojiLookupPromise = null;
      });
    return () => {
      active = false;
    };
  }, [lookup]);
  return lookup;
}
