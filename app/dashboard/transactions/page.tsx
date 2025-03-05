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
import { Sparkles, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

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
  const [categoryFilter, setcategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isPremium: false,
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
        await checkSubscriptionStatus(user.id);

        // Kullanıcının işlemlerini al
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });

        if (error) {
          console.error(error);
          toast.error("İşlemler alınırken bir hata oluştu");
          return;
        }

        if (!data) {
          setTransactions([]);
          setFilteredTransactions([]);
          return;
        }

        // Kategorileri topla (benzersiz)
        const uniqueCategories = Array.from(new Set(data.map((item) => item.category)));
        setCategories(uniqueCategories);

        // İşlemleri ayarla
        setTransactions(data);
        filterTransactions(data, searchTerm, typeFilter, categoryFilter, dateRange);
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
  const checkSubscriptionStatus = async (userId: string) => {
    try {
      // Kullanıcının abonelik durumunu kontrol et
      const { data: subscription, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .single();

      // Bu ayki işlemlerin sayısını kontrol et
      const currentMonthStart = startOfMonth(new Date()).toISOString();
      const currentMonthEnd = endOfMonth(new Date()).toISOString();
      
      const { count, error: countError } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: false })
        .eq("user_id", userId)
        .gte("date", currentMonthStart)
        .lte("date", currentMonthEnd);

      if (countError) {
        console.error("İşlem sayısı alınamadı:", countError);
      }

      const isPremium = !!subscription;
      const monthlyTransactionCount = count || 0;
      
      setSubscriptionStatus({
        isPremium,
        monthlyTransactionCount
      });

      // Ücretsiz kullanıcı ve aylık limit aşıldıysa
      setReachedTransactionLimit(!isPremium && monthlyTransactionCount >= 30);
      
    } catch (error) {
      console.error("Abonelik durumu kontrol edilirken bir hata oluştu:", error);
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
          transaction.description.toLowerCase().includes(search.toLowerCase()) ||
          transaction.category.toLowerCase().includes(search.toLowerCase())
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
    setcategoryFilter(value);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">İşlemler</h1>

      {reachedTransactionLimit && (
        <Alert className="mb-6 border-amber-500 bg-amber-500/10">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <AlertTitle>İşlem limiti aşıldı</AlertTitle>
          <AlertDescription>
            Ücretsiz pakette aylık 30 işlem girişi yapabilirsiniz. Bu ay için işlem limitinize ulaştınız.
            <div className="mt-2">
              <Button
                variant="outline"
                className="bg-background"
                onClick={() => window.location.href = "/dashboard/subscription"}
              >
                <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                Premium'a Yükselt
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
          <CardDescription>İşlemleri filtrelemek için aşağıdaki seçenekleri kullanın</CardDescription>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">İşlem Tipi</Label>
              <Select value={typeFilter} onValueChange={handleTypeChange}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Tüm İşlemler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm İşlemler</SelectItem>
                  <SelectItem value="income">Gelir</SelectItem>
                  <SelectItem value="expense">Gider</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                <SelectTrigger id="category">
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
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-medium">
            {filteredTransactions.length} İşlem Bulundu
          </h2>
          {!subscriptionStatus.isPremium && (
            <p className="text-sm text-muted-foreground">
              Bu ay {subscriptionStatus.monthlyTransactionCount}/30 işlem girişi yaptınız
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => window.location.href = "/dashboard/transactions/new"}
            disabled={reachedTransactionLimit}
          >
            {reachedTransactionLimit ? "İşlem Limiti Aşıldı" : "Yeni İşlem Ekle"}
          </Button>
        </div>
      </div>

      <TransactionTable 
        transactions={filteredTransactions} 
        loading={loading} 
      />
    </div>
  );
}