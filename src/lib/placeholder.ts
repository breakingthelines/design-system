/**
 * Terminal punctuation that already closes a placeholder: a full stop, a
 * question mark, an exclamation mark, a colon or an ellipsis character. An
 * existing "..." is covered by the full stop.
 */
const TERMINAL_PUNCTUATION = /[.?!…:]$/;

/**
 * Appends "..." to a short placeholder ("What's happening") and leaves a
 * placeholder that already ends in terminal punctuation alone ("Who stood
 * out?", "Reply to Zach..."), so a full sentence never renders as "out?...".
 */
export function withEllipsis(placeholder: string): string {
  const trimmed = placeholder.trimEnd();
  if (trimmed === '') return placeholder;
  return TERMINAL_PUNCTUATION.test(trimmed) ? placeholder : `${placeholder}...`;
}
