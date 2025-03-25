'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import dynamic from 'next/dynamic';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { sanitizeHtml } from '@/app/lib/blog';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// TinyMCE editörü server-side rendering yapmamalı
const RichTextEditor = dynamic(() => import('@/app/components/RichTextEditor'), { ssr: false });

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
  category_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function EditBlogPostPage({
  params,
}: {
  params: { id: string };
}) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const router = useRouter();
  const supabase = createClientComponentClient();

  // Blog yazısını yükle
  useEffect(() => {
    async function fetchPost() {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        if (data) {
          setPost(data);
          setTitle(data.title);
          setSlug(data.slug);
          setExcerpt(data.excerpt || '');
          setContent(data.content);
          setFeaturedImage(data.featured_image || '');
          setCategoryId(data.category_id);
          setStatus(data.status);
        }
      } catch (error) {
        console.error('Blog yazısı yüklenirken hata oluştu:', error);
        router.push('/admin/blog');
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [params.id]);

  // Kategori listesini yükle
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('blog_categories')
          .select('*')
          .order('name');

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Kategoriler yüklenirken hata oluştu:', error);
      } finally {
        setLoadingCategories(false);
      }
    }

    fetchCategories();
  }, []);

  // Başlıktan otomatik slug oluştur
  const generateSlug = (text: string) => {
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    // Eğer slug manuel olarak değiştirilmemişse, otomatik güncelle
    if (slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !slug || !content || !categoryId) {
      alert('Lütfen gerekli tüm alanları doldurun.');
      return;
    }

    setSaving(true);

    try {
      // HTML içeriğini sanitize et
      const sanitizedContent = sanitizeHtml(content);

      // Blog yazısını güncelle
      const { error } = await supabase
        .from('blog_posts')
        .update({
          title,
          slug,
          content: sanitizedContent,
          excerpt: excerpt || title,
          featured_image: featuredImage,
          category_id: categoryId,
          status,
          updated_at: new Date().toISOString(),
          published_at: status === 'published' ? new Date().toISOString() : null
        })
        .eq('id', params.id);

      if (error) throw error;

      // Başarılı olduğunda blog listesine yönlendir
      router.push('/admin/blog');
    } catch (error) {
      console.error('Blog yazısı güncellenirken hata oluştu:', error);
      alert('Blog yazısı güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Yükleniyor...</h1>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Blog Yazısı Bulunamadı</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Blog Yazısını Düzenle</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Oluşturulma: {format(new Date(post.created_at), 'PPP', { locale: tr })}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Başlık</Label>
              <Input
                id="title"
                value={title}
                onChange={handleTitleChange}
                placeholder="Blog yazısı başlığı"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="blog-yazisi-url"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Özet</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Blog yazısı özeti (isteğe bağlı)"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="featured_image">Kapak Görseli URL</Label>
              <Input
                id="featured_image"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Taslak</SelectItem>
                  <SelectItem value="published">Yayınla</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">İçerik</Label>
          <RichTextEditor value={content} onChange={setContent} />
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            İptal
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  );
} 