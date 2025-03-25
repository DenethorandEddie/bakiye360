import DOMPurify from 'isomorphic-dompurify';

/**
 * HTML içeriğini güvenli bir şekilde temizler
 * @param html Temizlenecek HTML içeriği
 * @returns Temizlenmiş güvenli HTML
 */
export function sanitizeHtml(html: string): string {
  // İzin verilen HTML etiketlerini ve özelliklerini belirtin
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
      'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'u',
      'img', 'a', 'blockquote', 'pre', 'code', 'hr',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'figure', 'figcaption', 'iframe',
      'del', 'sup', 'sub'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'target',
      'id', 'width', 'height', 'style', 'data-*',
      'frameborder', 'allowfullscreen'
    ],
    ADD_TAGS: ['iframe'], // Özel olarak eklenen etiketler (video gömme için)
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'], // Video özellikleri
    WHOLE_DOCUMENT: false,
    SANITIZE_DOM: true
  });
}

/**
 * HTML içeriğinden metin özetini çıkarır
 * @param html HTML içerik
 * @param maxLength Maksimum özet uzunluğu
 * @returns Düz metin özet
 */
export function extractExcerpt(html: string, maxLength: number = 160): string {
  // HTML etiketlerini kaldır
  const text = html.replace(/(<([^>]+)>)/gi, '');
  
  // Boşlukları ve yeni satırları düzenle
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  
  // Maksimum uzunluğa göre kırp
  if (normalizedText.length <= maxLength) {
    return normalizedText;
  }
  
  // Son kelimeyi tamamlayarak kırp
  const excerpt = normalizedText.substring(0, maxLength);
  const lastSpaceIndex = excerpt.lastIndexOf(' ');
  
  return excerpt.substring(0, lastSpaceIndex) + '...';
}

/**
 * HTML içeriğini blog sayfasında görüntülemek için prose stillerine uygun hale getirir
 * @param html HTML içerik
 * @returns İşlenmiş HTML
 */
export function renderBlogContent(html: string): string {
  let processedHtml = html;
  
  // Kod bloklarını işle
  processedHtml = processedHtml.replace(
    /<pre><code>([\s\S]*?)<\/code><\/pre>/g,
    '<pre class="language-typescript"><code>$1</code></pre>'
  );
  
  // Resimleri responsive yap
  processedHtml = processedHtml.replace(
    /<img(.*?)>/g,
    '<img class="rounded-lg w-full h-auto" $1>'
  );
  
  // Link'leri yeni sekmede aç
  processedHtml = processedHtml.replace(
    /<a(.*?)href="(.*?)"(.*?)>/g,
    '<a$1href="$2"$3 target="_blank" rel="noopener noreferrer">'
  );
  
  return processedHtml;
} 