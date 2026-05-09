export function stripHtml(html: string): string {
  if (!html) return "";

  // Safe environment check for Server Components vs Client
  if (typeof window === "undefined") {
    // Regex based simple stripper for server-side
    return html.replace(/<[^>]*>?/gm, '');
  }
  
  // DOM element for client-side
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
}

export function calculateReadingTime(html: string): number {
  const text = stripHtml(html);
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return minutes === 0 ? 1 : minutes;
}

export function getExcerpt(html: string, length: number = 150): string {
  const text = stripHtml(html);
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}
