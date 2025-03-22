"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/supabase-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Tarih kaydetme sırasında zaman dilimi farkını dengeleyen yardımcı fonksiyon
function adjustDateForTimezone(date) {
  if (!date) return null;
  
  // UTC'de saat olmayan ISO tarih formatına çevir (YYYY-MM-DD)
  const dateString = new Date(date).toISOString().split('T')[0];
  
  // Tarihi yeniden oluştur ve gün ortasına ayarla (saat dilimi etkilemesin)
  const utcDate = new Date(`${dateString}T12:00:00Z`);
  
  return utcDate;
}

export default function EditTransactionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { supabase, user } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTransaction, setLoadingTransaction] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [isPremium, setIsPremium] = useState(true);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "expense",
    category: "",
    date: new Date(),
    notes: "",
    isRecurring: false,
  });

  // İşlemi getir
  useEffect(() => {
    const fetchTransaction = async () => {
      if (!user) return;
      
      setLoadingTransaction(true);
      try {
        // İşlemi getir
        const { data: transaction, error } = await supabase
          .from('transactions')
          .select(`
            *,
            categories(name)
          `)
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('İşlem bulunamadı:', error);
          toast.error('İşlem bulunamadı veya erişim izniniz yok.');
          router.push('/dashboard/transactions');
          return;
        }
        
        if (!transaction) {
          toast.error('İşlem bulunamadı.');
          router.push('/dashboard/transactions');
          return;
        }
        
        // Kategori adını al
        const categoryName = transaction.categories ? transaction.categories.name : "Kategorisiz";
        
        // Form verilerini ayarla
        setFormData({
          description: transaction?.description || "",
          amount: transaction?.amount?.toString() || "",
          type: transaction?.type || "expense",
          category: transaction?.category_id || "",
          date: transaction?.date ? new Date(transaction.date) : new Date(),
          notes: transaction?.notes || "",
          isRecurring: transaction?.is_recurring || false,
        });
        
        console.log('İşlem bulundu:', transaction);
      } catch (error) {
        console.error('İşlem yüklenirken hata:', error);
        toast.error('İşlem yüklenirken bir hata oluştu.');
      } finally {
        setLoadingTransaction(false);
      }
    };
    
    fetchTransaction();
  }, [supabase, user, params.id, router]);

  // Abonelik kontrolünü basitleştir ve her zaman premium yap
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        // Her zaman premium yap
        setIsPremium(true);
      } catch (error) {
        console.error("Abonelik kontrolü hatası:", error);
        // Hata durumunda bile premium yap
        setIsPremium(true);
      }
    };

    checkSubscriptionStatus();
  }, []);

  // Kategorileri yükle
  useEffect(() => {
    const fetchCategories = async () => {
      if (!user) return;
      
      setLoadingCategories(true);
      try {
        // Paralel veri çekme işlemi
        const [userCategoriesResponse, generalCategoriesResponse] = await Promise.all([
          // Kullanıcıya özel kategoriler
          supabase
            .from('categories')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', formData.type),
            
          // Genel kategoriler  
          supabase
            .from('categories')
            .select('*')
            .is('user_id', null)
            .eq('type', formData.type)
        ]);

        const userCategories = userCategoriesResponse.data || [];
        const generalCategories = generalCategoriesResponse.data || [];

        // Kategorileri birleştir
        let allCategories = [...userCategories, ...generalCategories];

        // Free plan kullanıcıları için temel kategoriler
        const freeBasicCategories = [
          'Yiyecek', 'Ulaşım', 'Konut', 'Faturalar', 'Banka', 'Maaş', 'Diğer'
        ];

        // Eğer free plan kullanıcısı ise, sadece temel kategorileri göster
        if (!isPremium) {
          console.log("Free plan kullanıcısı için temel kategoriler filtreleniyor");
          
          allCategories = allCategories.filter(cat => 
            freeBasicCategories.includes(String(cat.name)) || 
            String(cat.name).includes('Diğer')
          );
          
          // Eğer filtreleme sonrası herhangi bir kategori kalmadıysa, tüm kategorileri göster
          if (allCategories.length === 0) {
            console.log("Filtrelemeden sonra kategori kalmadı, tüm kategoriler gösteriliyor");
            allCategories = [...userCategories, ...generalCategories];
          }
        } else {
          console.log("Premium kullanıcı - tüm kategoriler gösteriliyor");
        }

        setCategories(allCategories);
      } catch (error) {
        console.error("Kategorileri yükleme hatası:", error);
        toast.error("Kategoriler yüklenirken bir hata oluştu");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [supabase, user, formData.type, isPremium]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.category) {
      toast.error("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    try {
      setIsLoading(true);
      console.log('Updating transaction with data:', {
        category_id: formData.category,
        amount: parseFloat(formData.amount),
        type: formData.type,
        description: formData.description,
        date: formData.date,
        is_recurring: formData.isRecurring,
        notes: formData.notes,
      });

      const { data, error } = await supabase
        .from('transactions')
        .update({
          category_id: formData.category,
          amount: parseFloat(formData.amount),
          type: formData.type,
          description: formData.description,
          date: formData.date.toISOString().split("T")[0], // YYYY-MM-DD formatında kaydet
          is_recurring: formData.isRecurring,
          notes: formData.notes
        })
        .eq('id', params.id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update response:', data);
      
      toast.success("İşlem başarıyla güncellendi.");
      
      router.push('/dashboard/transactions');
      router.refresh();
    } catch (error) {
      console.error('Transaction update error:', error);
      toast.error("İşlem güncellenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  // Yükleniyor durumu
  if (loadingTransaction) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">İşlem yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">İşlem Düzenle</h1>
        <p className="text-muted-foreground">
          İşlem bilgilerini güncelleyin
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>İşlem Detayları</CardTitle>
            <CardDescription>
              {formData.type === "income" ? "Gelir" : "Gider"} detaylarını güncelleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* İşlem Türü Seçimi */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={formData.type === "income" ? "default" : "outline"}
                className={formData.type === "income" ? "bg-green-500 hover:bg-green-600" : ""}
                onClick={() => {
                  handleChange("type", "income");
                  handleChange("category", ""); // Kategori seçimini sıfırla
                }}
                disabled={isLoading}
              >
                Gelir
              </Button>
              <Button
                type="button"
                variant={formData.type === "expense" ? "default" : "outline"}
                className={formData.type === "expense" ? "bg-red-500 hover:bg-red-600" : ""}
                onClick={() => {
                  handleChange("type", "expense");
                  handleChange("category", ""); // Kategori seçimini sıfırla
                }}
                disabled={isLoading}
              >
                Gider
              </Button>
            </div>

            {/* Diğer form alanları */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Input
                  id="description"
                  placeholder="İşlem açıklaması"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="amount">Tutar (₺)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleChange("amount", e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="category">Kategori</Label>
                
                {loadingCategories ? (
                  <div className="w-full h-10 bg-gray-200 animate-pulse rounded-md"></div>
                ) : (
                  <>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleChange("category", value)}
                      disabled={isLoading}
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
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Tarih</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? (
                        format(formData.date, "d MMMM yyyy", { locale: tr })
                      ) : (
                        <span>Tarih seçin</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => {
                        if (date) {
                          // Seçilen tarihin UTC gün başlangıcını oluştur (günü korumak için)
                          const selectedDate = new Date(date);
                          selectedDate.setHours(12, 0, 0, 0); // Günü korumak için ortada bir saat belirle
                          handleChange("date", selectedDate);
                        } else {
                          handleChange("date", null);
                        }
                      }}
                      initialFocus
                      locale={tr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  placeholder="İşlem hakkında ek notlar"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => handleChange("isRecurring", checked)}
                />
                <Label htmlFor="recurring">Tekrarlayan İşlem</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/transactions")}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                "Güncelle"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 