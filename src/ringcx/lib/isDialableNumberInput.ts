// `*` and `#` are allowed to lead so that star codes typed on the keypad
// (`*67`, `*82`, …) count as dialable. Directory names never start with them.
const DIALABLE_INPUT_PATTERN = /^[+\d*#][\d\s()\-+*#]*$/;

/**
 * Whether an input field holds something dialable rather than a directory
 * search query. Shared by the dial page and the transfer panel, which both let
 * one field serve as a number entry and a corporate directory search box.
 */
export const isDialableNumberInput = (value: string): boolean => {
  const trimmed = value.trim();
  return !!trimmed && DIALABLE_INPUT_PATTERN.test(trimmed);
};
