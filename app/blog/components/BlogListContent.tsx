'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { BlogPost, Category } from './types';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BlogListContent() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [postsResult, categoriesResult] = await Promise.all([
        supabase
          .from('blog_posts')
          .select('*, category:blog_categories(*)')
          .eq('status', 'published')
          .order('published_at', { ascending: false }),
        supabase
          .from('blog_categories')
          .select('*')
          .order('name')
      ]);

      if (postsResult.error) throw postsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      setPosts(postsResult.data || []);
      setCategories(categoriesResult.data || []);
    } catch (error) {
      console.error('Blog verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Henüz blog yazısı yok</h2>
        <p className="text-muted-foreground">Yakında yeni yazılar eklenecek.</p>
      </div>
    );
  }

  // Kategorilere göre yazıları grupla
  const groupedByCategory = posts.reduce((acc, post) => {
    const categoryId = post.category?.id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(post);
    return acc;
  }, {} as Record<string, BlogPost[]>);

  return (
    <div className="space-y-12">
      {Object.entries(groupedByCategory).map(([categoryId, categoryPosts]) => {
        const category = categories.find(c => c.id === categoryId) || { name: 'Diğer' };
        return (
          <div key={categoryId} className="space-y-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{category.name}</h2>
              <Badge variant="outline">{categoryPosts.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categoryPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <article className="group p-6 flex flex-col h-full border rounded-lg hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {post.category?.name}
                      </span>
                      <time className="text-sm text-muted-foreground">
                        {new Date(post.published_at).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long'
                        })}
                      </time>
                    </div>
                    <h3 className="text-xl font-semibold group-hover:text-primary transition-colors mb-3">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-muted-foreground line-clamp-3 mb-4">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="mt-auto">
                      <span className="text-primary text-sm font-medium hover:underline inline-flex items-center">
                        Devamını Oku
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
} 