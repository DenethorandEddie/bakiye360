import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string): string {
  // İzin verilen HTML etiketlerini ve özelliklerini belirtin
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'img', 'a', 'blockquote', 'pre', 'code'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target']
  });
} 