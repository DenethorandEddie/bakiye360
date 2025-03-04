"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSupabase } from "@/components/supabase-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Plus, Search, ArrowUpRight, ArrowDownRight, Filter, Loader2, Pencil, Trash } from "lucide-react";
import { toast } from "sonner";

export default function TransactionsPage() {
  const { supabase, user } = useSupabase();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Demo mod için örnek veriler
        if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://example.supabase.co') {
          // Demo kategoriler
          const demoCategories = [
            { id: '1', name: "Yiyecek", type: "expense" },
            { id: '2', name: "Ulaşım", type: "expense" },
            { id: '3', name: "Konut", type: "expense" },
            { id: '4', name: "Eğlence", type: "expense" },
            { id: '5', name: "Faturalar", type: "expense" },
            { id: '6', name: "Maaş", type: "income" },
            { id: '7', name: "Yatırım", type: "income" },
            { id: '8', name: "Diğer", type: "expense" },
          ];
          
          // Demo işlemler
          let demoTransactions = JSON.parse(localStorage.getItem('demoTransactions') || '[]');
          
          // Eğer demo işlemler boşsa, örnek veriler oluştur
          if (demoTransactions.length === 0) {
            demoTransactions = Array.from({ length: 10 }, (_, i) => {
              const isIncome = Math.random() > 0.6;
              const amount = isIncome 
                ? Math.floor(Math.random() * 5000) + 1000 
                : Math.floor(Math.random() * 1000) + 100;
              
              const categoryId = isIncome 
                ? ['6', '7'][Math.floor(Math.random() * 2)]
                : ['1', '2', '3', '4', '5', '8'][Math.floor(Math.random() * 6)];
              
              const date = new Date();
              date.setDate(date.getDate() - Math.floor(Math.random() * 30));
              
              return {
                id: i + 1,
                description: isIncome 
                  ? ["Maaş", "Freelance Ödemesi", "Yatırım Geliri"][Math.floor(Math.random() * 3)] 
                  : ["Market Alışverişi", "Akaryakıt", "Kira", "Sinema", "Elektrik Faturası", "Yemek"][Math.floor(Math.random() * 6)],
                amount,
                type: isIncome ? "income" : "expense",
                category_id: categoryId,
                date: date.toISOString().split('T')[0],
                is_recurring: Math.random() > 0.7,
                user_id: 'demo-user-id',
                created_at: new Date().toISOString()
              };
            });
            
            localStorage.setItem('demoTransactions', JSON.stringify(demoTransactions));
          }
          
          // İşlemleri kategorilerle birleştir
          const transactionsWithCategories = demoTransactions.map((transaction: any) => {
            const category = demoCategories.find(cat => cat.id === transaction.category_id);
            return {
              ...transaction,
              category: category ? category.name : 'Bilinmeyen Kategori'
            };
          });
          
          // İşlemleri tarihe göre sırala (en yeni en üstte)
          transactionsWithCategories.sort((a: any, b: any) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });
          
          setCategories(demoCategories);
          setTransactions(transactionsWithCategories);
          setLoading(false);
          return;
        }

        // Gerçek Supabase sorguları
        const [userCategoriesResponse, generalCategoriesResponse, transactionsResponse] = await Promise.all([
          // Kullanıcıya özel kategoriler
          user?.id ? supabase
            .from('categories')
            .select('*')
            .eq('user_id', user.id)
          : Promise.resolve({ data: [], error: null }),
          
          // Genel kategoriler
          supabase
            .from('categories')
            .select('*')
            .filter('user_id', 'is', null),
          
          // İşlem sorgusu - user?.id değeri undefined ise boş dizi döndür
          user?.id ? supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
          : Promise.resolve({ data: [], error: null })
        ]);

        // Kategori hata kontrolü ve birleştirme
        if (userCategoriesResponse.error) {
          console.error("Kullanıcı kategori yükleme hatası:", userCategoriesResponse.error);
        }
        
        if (generalCategoriesResponse.error) {
          console.error("Genel kategori yükleme hatası:", generalCategoriesResponse.error);
        }
        
        if (userCategoriesResponse.error && generalCategoriesResponse.error) {
          toast.error("Kategoriler yüklenirken bir hata oluştu");
          
          // Hata olursa varsayılan kategorileri göster
          const fallbackCategories = [
            { id: 'f1', name: "Yiyecek", type: "expense" },
            { id: 'f2', name: "Ulaşım", type: "expense" },
            { id: 'f3', name: "Konut", type: "expense" },
            { id: 'f4', name: "Eğlence", type: "expense" },
            { id: 'f5', name: "Faturalar", type: "expense" },
            { id: 'f6', name: "Maaş", type: "income" },
            { id: 'f7', name: "Yatırım", type: "income" },
            { id: 'f8', name: "Diğer", type: "expense" },
          ];
          setCategories(fallbackCategories);
        } else {
          // Kullanıcı ve genel kategorileri birleştir
          const userCategories = userCategoriesResponse.data || [];
          const generalCategories = generalCategoriesResponse.data || [];
          const allCategories = [...userCategories, ...generalCategories];
          
          console.log("Kategori bilgileri:", { 
            kullaniciKategorileri: userCategories.length, 
            genelKategoriler: generalCategories.length, 
            toplamKategori: allCategories.length 
          });
          
          setCategories(allCategories);
        }

        if (transactionsResponse.error) {
          console.error("İşlem yükleme hatası:", transactionsResponse.error);
          toast.error("İşlemler yüklenirken bir hata oluştu");
          setTransactions([]);
          return;
        }
        
        // İşlemleri kategorilerle manuel olarak birleştir
        const allCategories = [...(userCategoriesResponse.data || []), ...(generalCategoriesResponse.data || [])];
        
        // İşlemleri kategorilerle manuel olarak birleştir
        const transactionsWithCategories = transactionsResponse.data.map(transaction => {
          const category = allCategories.find(cat => cat.id === transaction.category_id);
          return {
            ...transaction,
            category: category ? category.name : 'Bilinmeyen Kategori'
          };
        });
        
        setTransactions(transactionsWithCategories);
      } catch (error) {
        console.error("Veri yükleme hatası:", error);
        toast.error("Veriler yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, user?.id]);

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Bu işlemi silmek istediğinizden emin misiniz?")) {
      return;
    }
    
    try {
      // Demo mod için silme işlemi
      if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://example.supabase.co') {
        const demoTransactions = JSON.parse(localStorage.getItem('demoTransactions') || '[]');
        const updatedTransactions = demoTransactions.filter((t: any) => t.id !== id);
        localStorage.setItem('demoTransactions', JSON.stringify(updatedTransactions));
        
        // Görüntülenen işlemleri güncelle
        setTransactions(transactions.filter(t => t.id !== id));
        toast.success("İşlem başarıyla silindi");
        return;
      }

      // Gerçek Supabase silme işlemi
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        console.error("İşlem silme hatası:", error);
        toast.error("İşlem silinirken bir hata oluştu");
        return;
      }

      // Görüntülenen işlemleri güncelle
      setTransactions(transactions.filter(t => t.id !== id));
      toast.success("İşlem başarıyla silindi");
    } catch (error) {
      console.error("İşlem silme hatası:", error);
      toast.error("İşlem silinirken bir hata oluştu");
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || transaction.category_id === categoryFilter;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">İşlemler</h1>
          <p className="text-muted-foreground">
            Tüm gelir ve gider işlemlerinizi görüntüleyin ve yönetin
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button asChild>
            <Link href="/dashboard/transactions/new">
              <Plus className="mr-2 h-4 w-4" />
              Yeni İşlem
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>İşlem Listesi</CardTitle>
          <CardDescription>
            Tüm gelir ve gider işlemlerinizin detaylı listesi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="İşlem ara..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="İşlem Tipi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="income">Gelir</SelectItem>
                  <SelectItem value="expense">Gider</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Yükleniyor...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-muted-foreground mb-4">Hiç işlem bulunamadı</p>
              <Button asChild variant="outline">
                <Link href="/dashboard/transactions/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni İşlem Ekle
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.date), "d MMMM yyyy", { locale: tr })}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell className={transaction.type === "income" ? "text-green-500" : "text-red-500"}>
                        <div className="flex items-center">
                          {transaction.type === "income" ? (
                            <ArrowUpRight className="mr-1 h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="mr-1 h-4 w-4" />
                          )}
                          ₺{transaction.amount.toLocaleString('tr-TR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          transaction.type === "income" 
                            ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100" 
                            : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                        }`}>
                          {transaction.type === "income" ? "Gelir" : "Gider"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Sil</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}