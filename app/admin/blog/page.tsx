'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, MoreVertical, Pencil, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
  category: {
    name: string;
  };
}

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const postsPerPage = 10;

  const router = useRouter();
  const supabase = createClientComponentClient();

  // Blog yazılarını yükle
  useEffect(() => {
    fetchPosts();
  }, [page, searchTerm, statusFilter]);

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('blog_posts')
        .select('*, category:blog_categories(name)', { count: 'exact' });

      // Arama filtresi
      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      // Durum filtresi
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Sayfalama
      const start = (page - 1) * postsPerPage;
      const end = start + postsPerPage - 1;
      
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;

      setPosts(data || []);
      if (count) {
        setTotalPages(Math.ceil(count / postsPerPage));
      }
    } catch (error) {
      console.error('Blog yazıları yüklenirken hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu blog yazısını silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPosts(posts.filter(post => post.id !== id));
    } catch (error) {
      console.error('Blog yazısı silinirken hata oluştu:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`${selectedPosts.length} blog yazısını silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .in('id', selectedPosts);

      if (error) throw error;

      setPosts(posts.filter(post => !selectedPosts.includes(post.id)));
      setSelectedPosts([]);
    } catch (error) {
      console.error('Blog yazıları silinirken hata oluştu:', error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(posts.map(post => post.id));
    }
  };

  const toggleSelectPost = (postId: string) => {
    if (selectedPosts.includes(postId)) {
      setSelectedPosts(selectedPosts.filter(id => id !== postId));
    } else {
      setSelectedPosts([...selectedPosts, postId]);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Blog Yazıları</h1>
        <Button asChild>
          <Link href="/admin/blog/new">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Yazı
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Blog yazılarında ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="draft">Taslak</SelectItem>
            <SelectItem value="published">Yayında</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedPosts.length > 0 && (
        <div className="bg-muted/50 p-4 rounded-lg mb-6 flex items-center justify-between">
          <p className="text-sm">{selectedPosts.length} yazı seçildi</p>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Seçilenleri Sil
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedPosts.length === posts.length && posts.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Başlık</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Oluşturulma</TableHead>
              <TableHead>Son Güncelleme</TableHead>
              <TableHead className="w-28">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedPosts.includes(post.id)}
                    onCheckedChange={() => toggleSelectPost(post.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{post.title}</div>
                  <div className="text-sm text-muted-foreground">{post.slug}</div>
                </TableCell>
                <TableCell>{post.category?.name}</TableCell>
                <TableCell>
                  <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                    {post.status === 'published' ? 'Yayında' : 'Taslak'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(post.created_at), 'PPP', { locale: tr })}
                </TableCell>
                <TableCell>
                  {format(new Date(post.updated_at), 'PPP', { locale: tr })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/blog/${post.slug}`} className="flex items-center">
                          <Eye className="mr-2 h-4 w-4" />
                          Görüntüle
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/blog/edit/${post.id}`} className="flex items-center">
                          <Pencil className="mr-2 h-4 w-4" />
                          Düzenle
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="flex items-center text-destructive"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Sayfalama */}
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Önceki
        </Button>
        <span className="text-sm text-muted-foreground">
          Sayfa {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Sonraki
        </Button>
      </div>
    </div>
  );
} 