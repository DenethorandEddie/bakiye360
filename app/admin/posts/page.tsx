"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Plus, Pencil, Trash2, Eye, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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
  status: 'draft' | 'published';
  author_id: string;
  published_at: string;
  created_at: string;
  category: Category;
}

export default function BlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    featured_image: "",
    category_id: "",
    status: "draft" as "draft" | "published"
  });

  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Blog yazıları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Kategoriler yüklenirken bir hata oluştu');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Türkçe karakterleri İngilizce karakterlere dönüştürme
      const turkishToEnglish = (text: string): string => {
        const charMap: Record<string, string> = {
          'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c',
          'İ': 'I', 'Ğ': 'G', 'Ü': 'U', 'Ş': 'S', 'Ö': 'O', 'Ç': 'C'
        };
        
        return text.replace(/[ıİğĞüÜşŞöÖçÇ]/g, (match) => charMap[match] || match);
      };

      const slug = turkishToEnglish(formData.title)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const postData = {
        title: formData.title,
        slug,
        content: formData.content,
        excerpt: formData.excerpt,
        featured_image: formData.featured_image,
        category_id: formData.category_id,
        status: formData.status,
        published_at: formData.status === 'published' ? new Date().toISOString() : null
      };

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);

        if (error) throw error;
        toast.success('Blog yazısı güncellendi');
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([postData]);

        if (error) throw error;
        toast.success('Blog yazısı oluşturuldu');
      }

      setIsDialogOpen(false);
      setEditingPost(null);
      setFormData({
        title: "",
        content: "",
        excerpt: "",
        featured_image: "",
        category_id: "",
        status: "draft"
      });
      fetchPosts();
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('Blog yazısı kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(post: BlogPost) {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || "",
      featured_image: post.featured_image || "",
      category_id: post.category_id,
      status: post.status
    });
    setIsDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Bu blog yazısını silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Blog yazısı silindi');
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Blog yazısı silinirken bir hata oluştu');
    }
  }

  async function handlePublish(postId: string) {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) throw error;
      toast.success('Blog yazısı yayınlandı');
      fetchPosts();
    } catch (error) {
      console.error('Error publishing post:', error);
      toast.error('Blog yazısı yayınlanırken bir hata oluştu');
    }
  }

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Blog Yazıları</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button
            type="button"
            data-href="#"
            className="inline-flex items-center"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setEditingPost(null);
              setFormData({
                title: "",
                content: "",
                excerpt: "",
                featured_image: "",
                category_id: "",
                status: "draft"
              });
              setIsDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Yazı
          </Button>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {editingPost ? 'Blog Yazısını Düzenle' : 'Yeni Blog Yazısı'}
              </DialogTitle>
              <DialogDescription>
                Bu formu kullanarak blog yazınızı oluşturun veya düzenleyin. 
                Sonra "Taslak" veya "Yayında" olarak kaydedebilirsiniz.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Başlık</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Blog yazısı başlığı"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">İçerik</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Blog yazısı içeriği"
                  className="min-h-[200px] font-mono"
                  required
                />
                <p className="text-muted-foreground text-sm">
                  HTML formatında içerik yazabilirsiniz. Örneğin: &lt;h2&gt;Başlık&lt;/h2&gt;, &lt;p&gt;Paragraf&lt;/p&gt;, 
                  &lt;ul&gt;&lt;li&gt;Liste öğesi&lt;/li&gt;&lt;/ul&gt;, &lt;a href="https://ornek.com"&gt;Link&lt;/a&gt;
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Özet</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Blog yazısı özeti"
                  className="min-h-[100px] font-mono"
                />
                <p className="text-muted-foreground text-sm">
                  Özet de HTML formatını destekler. Blog sayfasında yazılar listelenirken gösterilir. SEO için önemlidir.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="featured_image">Öne Çıkan Görsel URL</Label>
                <Input
                  id="featured_image"
                  type="url"
                  value={formData.featured_image}
                  onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                  placeholder="https://ornek.com/gorsel.jpg"
                />
                {formData.featured_image && (
                  <div className="mt-2">
                    <img
                      src={formData.featured_image}
                      alt="Preview"
                      className="max-h-40 rounded-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        toast.error('Görsel yüklenemedi. URL geçerli olmayabilir.');
                      }}
                      onLoad={(e) => {
                        (e.target as HTMLImageElement).style.display = 'block';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  required
                >
                  <SelectTrigger>
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
                <Select
                  value={formData.status}
                  onValueChange={(value: 'draft' | 'published') => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Taslak (sadece admin panelinde görünür)</SelectItem>
                    <SelectItem value="published">Yayında (herkes tarafından görünür)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-sm mt-1">
                  {formData.status === 'draft' 
                    ? 'Taslak olarak kaydedilen yazılar sadece admin panelinde görünür. Daha sonra "Yayınla" butonu ile yayınlayabilirsiniz.' 
                    : 'Yayında olarak kaydedilen yazılar anında blog sayfasında görünür olacaktır.'}
                </p>
              </div>

              <Button type="submit" className="w-full">
                {editingPost ? 'Güncelle' : 'Oluştur'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border dark:border-gray-700">
        <Table>
          <TableHeader className="bg-muted/50 dark:bg-gray-800/50">
            <TableRow className="hover:bg-muted/60 dark:hover:bg-gray-800/70">
              <TableHead className="w-[250px] dark:text-gray-300">Başlık</TableHead>
              <TableHead className="hidden md:table-cell dark:text-gray-300">Kategori</TableHead>
              <TableHead className="hidden md:table-cell dark:text-gray-300">Durum</TableHead>
              <TableHead className="hidden md:table-cell dark:text-gray-300">Tarih</TableHead>
              <TableHead className="text-right dark:text-gray-300">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id} className="hover:bg-muted/60 dark:hover:bg-gray-800/30">
                <TableCell className="font-medium dark:text-gray-200">{post.title}</TableCell>
                <TableCell className="hidden md:table-cell dark:text-gray-300">{post.category?.name || '-'}</TableCell>
                <TableCell className="hidden md:table-cell dark:text-gray-300">
                  <Badge 
                    variant={post.status === 'published' ? "default" : "secondary"}
                    className={post.status === 'published' ? "bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-400" : "bg-gray-500/20 text-gray-700 dark:bg-gray-500/30 dark:text-gray-400"}
                  >
                    {post.status === 'published' ? 'Yayında' : 'Taslak'}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell dark:text-gray-300">
                  {post.created_at ? format(new Date(post.created_at), 'd MMMM yyyy', { locale: tr }) : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {post.status === 'published' ? (
                      <Link href={`/blog/${post.slug}`} target="_blank" passHref>
                        <Button
                          variant="ghost"
                          size="icon"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Görüntüle</span>
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handlePublish(post.id);
                        }}
                      >
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Yayınla</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEdit(post);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Düzenle</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(post.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Sil</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {posts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Henüz blog yazısı bulunmuyor
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 