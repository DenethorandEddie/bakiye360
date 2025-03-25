"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  category: Category;
  published_at: string;
}

export default function BlogPostPage({
  params
}: {
  params: { slug: string }
}) {
  const { theme } = useTheme();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchPost();
  }, [params.slug]);

  async function fetchPost() {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .eq('slug', params.slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      if (!data) return notFound();

      setPost(data);
      fetchRelatedPosts(data.category.id, data.id);
    } catch (error) {
      console.error('Error fetching post:', error);
      notFound();
    } finally {
      setLoading(false);
    }
  }

  async function fetchRelatedPosts(categoryId: string, currentPostId: string) {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .eq('category_id', categoryId)
        .eq('status', 'published')
        .neq('id', currentPostId)
        .limit(3);

      if (error) throw error;
      setRelatedPosts(data || []);
    } catch (error) {
      console.error('Error fetching related posts:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-gray-900 bg-background w-full overflow-x-hidden dark-bg">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-gray-900/95 dark:border-gray-800">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="transition-transform hover:scale-105">
                <Image 
                  src="/logo.png" 
                  alt="Bakiye360 Logo" 
                  width={150} 
                  height={60} 
                  className="h-auto w-auto dark:hidden"
                  style={{ maxHeight: '100px' }}
                  priority
                />
                <Image 
                  src="/logo_dark.png" 
                  alt="Bakiye360 Logo" 
                  width={150} 
                  height={60} 
                  className="h-auto w-auto hidden dark:block"
                  style={{ maxHeight: '100px' }}
                  priority
                />
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6">
                <Link 
                  href="/blog" 
                  className="text-sm font-medium relative group dark:text-white"
                >
                  Blog
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                </Link>
              </nav>
              <div className="flex items-center gap-3">
                <ModeToggle />
                <Button variant="outline" className="hidden sm:flex dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:text-gray-200" asChild>
                  <Link href="/register">
                    Kayıt Ol
                  </Link>
                </Button>
                <Button asChild className="dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white">
                  <Link href="/login" className="flex items-center">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Giriş Yap / Panel
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Loading State */}
        <main className="flex-1 container py-8 dark:bg-gray-900">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-muted dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-6 w-1/2 bg-muted dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="aspect-video bg-muted dark:bg-gray-700 rounded-lg animate-pulse" />
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-muted dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen dark:bg-gray-900 bg-background w-full overflow-x-hidden dark-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-gray-900/95 dark:border-gray-800">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="transition-transform hover:scale-105">
              <Image 
                src="/logo.png" 
                alt="Bakiye360 Logo" 
                width={150} 
                height={60} 
                className="h-auto w-auto dark:hidden"
                style={{ maxHeight: '100px' }}
                priority
              />
              <Image 
                src="/logo_dark.png" 
                alt="Bakiye360 Logo" 
                width={150} 
                height={60} 
                className="h-auto w-auto hidden dark:block"
                style={{ maxHeight: '100px' }}
                priority
              />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                href="/blog" 
                className="text-sm font-medium relative group dark:text-white"
              >
                Blog
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <ModeToggle />
              <Button variant="outline" className="hidden sm:flex dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:text-gray-200" asChild>
                <Link href="/register">
                  Kayıt Ol
                </Link>
              </Button>
              <Button asChild className="dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white">
                <Link href="/login" className="flex items-center">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Giriş Yap / Panel
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12 dark:bg-gray-900 w-full">
        <article className="max-w-3xl mx-auto">
          {/* Back to Blog */}
          <div className="mb-8">
            <Button variant="ghost" asChild>
              <Link href="/blog" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Blog'a Dön
              </Link>
            </Button>
          </div>

          {/* Article Header */}
          <header className="space-y-4 mb-8">
            <div className="flex items-center gap-2 text-sm mb-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground blog-category-tag">
                {post.category?.name}
              </span>
              <span className="text-muted-foreground dark:text-gray-400">•</span>
              <time className="text-muted-foreground dark:text-gray-400">
                {new Date(post.published_at).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </time>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight dark:text-white">
              {post.title}
            </h1>
          </header>

          {/* Featured Image */}
          {post.featured_image && (
            <div className="relative aspect-video mb-8 bg-muted dark:bg-gray-800 rounded-lg overflow-hidden">
              <Image
                src={post.featured_image}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Article Content */}
          <div 
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="max-w-3xl mx-auto mt-16 border-t pt-16">
            <h2 className="text-2xl font-bold tracking-tight mb-6 dark:text-white">
              İlgili Yazılar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                  <article className="group relative flex flex-col space-y-3 border rounded-lg p-3 hover:border-primary/50 transition-colors dark:border-gray-700 dark:bg-gray-800">
                    {relatedPost.featured_image ? (
                      <div className="overflow-hidden rounded-lg">
                        <Image
                          src={relatedPost.featured_image}
                          alt={relatedPost.title}
                          width={400}
                          height={225}
                          className="aspect-video object-cover transition-transform group-hover:scale-105 duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted rounded-lg" />
                    )}
                    <h3 className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors dark:text-gray-200">
                      {relatedPost.title}
                    </h3>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0 dark:bg-gray-900 dark:border-gray-800 w-full">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 md:h-16">
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            © {new Date().getFullYear()} Bakiye360. Tüm hakları saklıdır.
          </p>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors dark:text-gray-400 dark:hover:text-white">
              Gizlilik Politikası
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors dark:text-gray-400 dark:hover:text-white">
              Kullanım Koşulları
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
} 