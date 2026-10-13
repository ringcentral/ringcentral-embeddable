/**
 * Fills a custom template with the number's digits from the right, as 3.x
 * did: `#` and `*` take a digit, `x` hides one, and anything else is kept.
 * Digits left over once the template is full are dropped, and so is template
 * text in front of the first digit when the number is shorter.
 *
 * Returns an empty string when the number has no digits.
 */
export function formatWithTemplate(
  phoneNumber: string,
  template: string,
): string {
  const digits = phoneNumber.replace(/\D/g, '');
  if (!digits) {
    return '';
  }
  let formatted = '';
  let digitIndex = digits.length - 1;
  for (let index = template.length - 1; index >= 0; index -= 1) {
    const char = template[index];
    if (char === '#' || char === '*') {
      if (digitIndex < 0) {
        // Drop the template text left in front of the first digit.
        return formatted.replace(/^[^\dx]+/, '');
      }
      formatted = `${digits[digitIndex]}${formatted}`;
      digitIndex -= 1;
    } else if (char === 'x') {
      formatted = `x${formatted}`;
      digitIndex -= 1;
    } else {
      formatted = `${char}${formatted}`;
    }
  }
  return formatted;
}
