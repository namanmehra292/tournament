import DOMPurify from "isomorphic-dompurify";

// ---------------------------------------------------------------
// Defense-in-depth against XSS. React already escapes all values
// it renders by default (the primary XSS defense — never use
// dangerouslySetInnerHTML with user content). This helper exists
// for the few spots where user text might need to be rendered as
// HTML-ish content (e.g. a future "notes" field) or echoed into
// non-React contexts (emails, PDFs). Strips all tags/attributes
// by default — safe for plain-text contexts.
// ---------------------------------------------------------------

export function sanitizePlainText(input: string): string {
  // Strip any HTML entirely; registration fields are plain text only.
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}
