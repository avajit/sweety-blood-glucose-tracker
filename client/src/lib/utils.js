/**
 * Merges and filters CSS class names.
 * Lightweight, zero-dependency utility suitable for pure JS.
 *
 * @param  {...(string | boolean | null | undefined | object)} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  const classes = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string') {
      classes.push(input);
    } else if (Array.isArray(input)) {
      const inner = cn(...input);
      if (inner) classes.push(inner);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(' ');
}
