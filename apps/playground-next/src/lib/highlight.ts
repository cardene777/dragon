/**
 * Minimal JSON / TypeScript syntax highlighter (< 200 lines)。
 * escape + regex-based tokenizer + span classes、 no external lib。
 *
 * output = span tag string、 dangerouslySetInnerHTML で render。
 * class names = "hl-key" / "hl-string" / "hl-number" / "hl-boolean" / "hl-null" / "hl-comment" / "hl-keyword".
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function highlightJson(source: string): string {
  const escaped = escapeHtml(source);
  return escaped
    // string literal (must run first to avoid highlighting keywords inside strings)
    .replace(/(&quot;.*?&quot;)(\s*:)?/g, (_m: string, str: string, colon: string | undefined) => {
      if (colon) {
        return `<span class="hl-key">${str}</span>${colon}`;
      }
      return `<span class="hl-string">${str}</span>`;
    })
    .replace(/\b(-?\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>')
    .replace(/\b(true|false)\b/g, '<span class="hl-boolean">$1</span>')
    .replace(/\bnull\b/g, '<span class="hl-null">null</span>');
}

export function highlightTypeScript(source: string): string {
  const escaped = escapeHtml(source);
  return escaped
    .replace(/(\/\/[^\n]*)/g, '<span class="hl-comment">$1</span>')
    .replace(/(&quot;[^&]*?&quot;)/g, '<span class="hl-string">$1</span>')
    .replace(
      /\b(import|export|const|let|var|function|return|type|interface|from|as|extends|typeof)\b/g,
      '<span class="hl-keyword">$1</span>',
    )
    .replace(/\b(-?\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>')
    .replace(/\b(true|false)\b/g, '<span class="hl-boolean">$1</span>')
    .replace(/\bnull\b/g, '<span class="hl-null">null</span>');
}
