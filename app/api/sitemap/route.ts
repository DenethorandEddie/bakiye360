import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Yayınlanmış blog yazılarını getir
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  // Statik sayfaların listesi
  const pages = [
    {
      url: '/',
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: '1.0'
    },
    {
      url: '/hesaplamalar',
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      url: '/hesaplamalar/kredi-hesaplama',
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      url: '/hesaplamalar/konut-kredisi-hesaplama',
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      url: '/hesaplamalar/doviz-hesaplama',
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      url: '/blog',
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: '0.9'
    }
  ];

  // Blog yazılarını sitemap'e ekle
  const blogUrls = posts?.map(post => ({
    url: `/blog/${post.slug}`,
    lastmod: post.updated_at || new Date().toISOString(),
    changefreq: 'weekly',
    priority: '0.7'
  })) || [];

  // Tüm URL'leri birleştir
  const urls = [...pages, ...blogUrls];

  // XML formatında sitemap oluştur
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls.map(({ url, lastmod, changefreq, priority }) => `
        <url>
          <loc>https://bakiye360.com${url}</loc>
          <lastmod>${lastmod}</lastmod>
          <changefreq>${changefreq}</changefreq>
          <priority>${priority}</priority>
        </url>
      `).join('')}
    </urlset>`;

  // XML response döndür
  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
    }
  });
} 