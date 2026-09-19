/**
 * Auto-escaping HTML templates.
 *
 * Both apps render with innerHTML, and most of the text on screen (request titles, claim
 * descriptions, messages, client names) is typed by other users. Interpolating it raw would let a
 * client run script inside an adviser's session. Use the `html` tag for every template that
 * contains dynamic values: interpolations are escaped unless they are themselves `html` results.
 */
export class SafeHtml {
  constructor(readonly value: string) {}
  toString(): string {
    return this.value;
  }
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

export function esc(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"'`]/g, (c) => ESCAPES[c]);
}

/** Mark a string as trusted markup (static SVG icons and the like). Never pass user input. */
export function raw(markup: string): SafeHtml {
  return new SafeHtml(markup);
}

function render(value: unknown): string {
  if (value === null || value === undefined || typeof value === 'boolean') return '';
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  return esc(value);
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): SafeHtml {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    out += render(values[i]) + strings[i + 1];
  }
  return new SafeHtml(out);
}
