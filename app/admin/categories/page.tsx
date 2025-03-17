"use client";

import { useState, useEffect } from "react";
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
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchCategories();
  }, []);

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
    } finally {
      setLoading(false);
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

      const slug = turkishToEnglish(formData.name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const categoryData = {
        name: formData.name,
        slug
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('blog_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Kategori güncellendi');
      } else {
        const { error } = await supabase
          .from('blog_categories')
          .insert([categoryData]);

        if (error) throw error;
        toast.success('Kategori oluşturuldu');
      }

      setIsDialogOpen(false);
      setEditingCategory(null);
      setFormData({
        name: ""
      });
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Kategori kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(category: Category) {
    setEditingCategory(category);
    setFormData({
      name: category.name
    });
    setIsDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz? Bu kategoriye ait blog yazıları kategorisiz kalabilir.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blog_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Kategori silindi');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Kategori silinirken bir hata oluştu. Bu kategoriye ait blog yazıları olabilir.');
    }
  }

  if (loading && categories.length === 0) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Kategoriler</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button
            onClick={() => {
              setEditingCategory(null);
              setFormData({ name: "" });
              setIsDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Kategori
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}
              </DialogTitle>
              <DialogDescription>
                Kategori adını girerek blog yazılarınız için kategoriler oluşturabilirsiniz.
                Slug otomatik olarak oluşturulacaktır.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Kategori Adı</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder="Kategori adı"
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                {editingCategory ? 'Güncelle' : 'Oluştur'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border dark:border-gray-700">
        <Table>
          <TableHeader className="bg-muted/50 dark:bg-gray-800/50">
            <TableRow className="hover:bg-muted/60 dark:hover:bg-gray-800/70">
              <TableHead className="dark:text-gray-300">Kategori Adı</TableHead>
              <TableHead className="dark:text-gray-300">Slug</TableHead>
              <TableHead className="w-[100px] dark:text-gray-300">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id} className="hover:bg-muted/60 dark:hover:bg-gray-800/30">
                <TableCell className="font-medium dark:text-gray-200">{category.name}</TableCell>
                <TableCell className="dark:text-gray-300">{category.slug}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Düzenle</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Sil</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground dark:text-gray-400">
                  Henüz kategori bulunmuyor
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 