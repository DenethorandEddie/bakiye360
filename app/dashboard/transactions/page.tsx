"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { DateRange } from "react-day-picker";
import { addDays, format, isAfter, isBefore, startOfMonth, endOfMonth } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "@/components/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import { Sparkles, AlertCircle, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import Link from "next/link";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string;
  date: string;
  created_at: string;
}

interface SubscriptionStatus {
  isPremium: boolean;
  monthlyTransactionCount: number;
}

export default function TransactionsPage() {
  const supabase = createClientComponentClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isPremium: true,
    monthlyTransactionCount: 0
  });
  const [reachedTransactionLimit, setReachedTransactionLimit] = useState(false);

  // Kullanıcının işlemlerini getir
  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);

        // Kullanıcı bilgilerini al
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error(userError);
          toast.error("Kullanıcı bilgileri alınamadı");
          return;
        }

        if (!user) {
          return;
        }

        // Abonelik durumunu kontrol et
        await checkSubscriptionStatus();

        // Kullanıcının işlemlerini al
        const { data, error } = await supabase
          .from("transactions")
          .select(`
            *,
            categories(name)
          `)
          .eq("user_id", user.id)
          .order("date", { ascending: false });

        if (error) {
          console.error("İşlemler alınırken hata:", error);
          toast.error("İşlemler alınırken bir hata oluştu");
          return;
        }

        if (!data || data.length === 0) {
          setTransactions([]);
          setFilteredTransactions([]);
          return;
        }
        
        // İşlemlerin kategori bilgilerini düzenle
        const processedData = data.map(transaction => {
          // categories ilişkisi varsa kategori adını al, yoksa null kullan
          const categoryName = transaction.categories ? transaction.categories.name : "Kategorisiz";
          return {
            ...transaction,
            category: categoryName
          };
        });
        
        // Kategorileri topla (benzersiz)
        const uniqueCategories = Array.from(new Set(processedData.map(item => item.category))).filter(Boolean);
        console.log("Benzersiz kategoriler:", uniqueCategories);
        setCategories(uniqueCategories);

        // İşlemleri ayarla
        setTransactions(processedData);
        filterTransactions(processedData, searchTerm, typeFilter, categoryFilter, dateRange);
      } catch (error) {
        console.error("İşlemler alınırken bir hata oluştu:", error);
        toast.error("İşlemler alınırken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [supabase]);

  // Abonelik durumunu ve bu ayki işlem sayısını kontrol et
  const checkSubscriptionStatus = async () => {
    try {
      // Her zaman premium olarak ayarla
      let isPremium = true;
      
      // User settings tablosundaki güncelleme yapılıyor
      setSubscriptionStatus({
        isPremium,
        monthlyTransactionCount: 0
      });
      
      // İşlem limitini her zaman false yap
      setReachedTransactionLimit(false);
      
    } catch (error) {
      console.error("Abonelik kontrol hatası:", error);
      // Hata durumunda bile premium yap
      setSubscriptionStatus({
        isPremium: true,
        monthlyTransactionCount: 0
      });
      setReachedTransactionLimit(false);
    }
  };

  // İşlemleri filtrele
  const filterTransactions = (
    data: Transaction[],
    search: string,
    type: string,
    category: string,
    dates: DateRange | undefined
  ) => {
    let filtered = [...data];

    // Arama terimini uygula
    if (search) {
      filtered = filtered.filter(
        (transaction) =>
          (transaction.description?.toLowerCase() || '').includes(search.toLowerCase()) ||
          (transaction.category?.toLowerCase() || '').includes(search.toLowerCase())
      );
    }

    // Tip filtresini uygula
    if (type !== "all") {
      filtered = filtered.filter((transaction) => transaction.type === type);
    }

    // Kategori filtresini uygula
    if (category !== "all") {
      filtered = filtered.filter((transaction) => transaction.category === category);
    }

    // Tarih filtresini uygula
    if (dates?.from) {
      filtered = filtered.filter((transaction) =>
        isAfter(new Date(transaction.date), new Date(dates.from!))
      );
    }

    if (dates?.to) {
      filtered = filtered.filter((transaction) =>
        isBefore(new Date(transaction.date), addDays(new Date(dates.to!), 1))
      );
    }

    setFilteredTransactions(filtered);
  };

  // Filtre değişikliklerini işle
  useEffect(() => {
    filterTransactions(transactions, searchTerm, typeFilter, categoryFilter, dateRange);
  }, [searchTerm, typeFilter, categoryFilter, dateRange, transactions]);

  // Tarih aralığı değiştiğinde işlemleri filtrele
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  // İşlem tipi değiştiğinde işlemleri filtrele
  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
  };

  // Kategori değiştiğinde işlemleri filtrele
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">İşlemler</h1>
          <p className="text-muted-foreground">
            Tüm finansal işlemlerinizi görüntüleyin ve yönetin
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/transactions/new">
            <Plus className="mr-2 h-4 w-4" />
            Yeni İşlem
          </Link>
        </Button>
      </div>

      <Card className="mb-8 border-none bg-gradient-to-br from-primary/5 via-background to-background backdrop-blur supports-[backdrop-filter]:bg-background/60 hover:bg-gradient-to-br hover:from-primary/10 hover:via-background hover:to-background transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_25px_rgba(0,0,0,0.15)] rounded-xl">
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
          <CardDescription>İşlemlerinizi filtrelemek için aşağıdaki seçenekleri kullanın</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Ara</Label>
              <Input
                id="search"
                placeholder="Açıklama veya kategori ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-background/50 backdrop-blur-sm border-primary/10 focus:border-primary/20 hover:border-primary/20 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">İşlem Tipi</Label>
              <Select value={typeFilter} onValueChange={handleTypeChange}>
                <SelectTrigger id="type" className="bg-background/50 backdrop-blur-sm border-primary/10 focus:border-primary/20 hover:border-primary/20 transition-colors">
                  <SelectValue placeholder="Tüm İşlemler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm İşlemler</SelectItem>
                  <SelectItem value="income">Gelirler</SelectItem>
                  <SelectItem value="expense">Giderler</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                <SelectTrigger id="category" className="bg-background/50 backdrop-blur-sm border-primary/10 focus:border-primary/20 hover:border-primary/20 transition-colors">
                  <SelectValue placeholder="Tüm Kategoriler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tarih Aralığı</Label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={handleDateRangeChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* İşlem Limiti Uyarısı */}
      {reachedTransactionLimit && (
        <Alert className="mb-4 bg-gradient-to-r from-amber-500/10 via-background to-background border-amber-500/20 backdrop-blur supports-[backdrop-filter]:bg-amber-500/10 shadow-[0_2px_10px_rgba(251,191,36,0.1)]">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-600">İşlem Limiti</AlertTitle>
          <AlertDescription className="text-amber-600">
            Bu ay için ücretsiz işlem limitinize ulaştınız. Premium üyeliğe geçerek sınırsız işlem yapabilirsiniz.
          </AlertDescription>
        </Alert>
      )}

      {/* Premium Özellik Bildirimi */}
      {!subscriptionStatus.isPremium && (
        <Alert className="mb-4 bg-gradient-to-r from-primary/10 via-background to-background border-primary/20 backdrop-blur supports-[backdrop-filter]:bg-primary/10 shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertTitle>Premium Özellik</AlertTitle>
          <AlertDescription>
            Premium üyeliğe geçerek gelişmiş filtreleme ve raporlama özelliklerine erişebilirsiniz.
          </AlertDescription>
        </Alert>
      )}

      {/* İşlem Tablosu */}
      <div className="rounded-xl overflow-hidden border-none bg-gradient-to-br from-background/50 via-background to-background backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-[0_0_15px_rgba(0,0,0,0.1)]">
        <TransactionTable transactions={filteredTransactions} loading={loading} />
      </div>
    </div>
  );
}