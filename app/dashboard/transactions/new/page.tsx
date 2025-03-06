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
// Türkiye için UTC+3 saatini hesaplar ve tarihi doğru şekilde ayarlar
function adjustDateForTimezone(date) {
  if (!date) return null;
  
  // UTC'de saat olmayan ISO tarih formatına çevir (YYYY-MM-DD)
  const dateString = new Date(date).toISOString().split('T')[0];
  
  // Tarihi yeniden oluştur ve gün ortasına ayarla (saat dilimi etkilemesin)
  const utcDate = new Date(`${dateString}T12:00:00Z`);
  
  return utcDate;
}

export default function NewTransactionPage() {
  const router = useRouter();
  const { supabase, user } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [reachedTransactionLimit, setReachedTransactionLimit] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(false);
  const [monthlyTransactionCount, setMonthlyTransactionCount] = useState(0);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "expense",
    category: "",
    date: new Date(),
    notes: "",
    isRecurring: false,
  });

  // Kullanıcının abonelik durumunu kontrol et
  const checkSubscription = async () => {
    try {
      setLoadingSubscription(true);
      
      // 1. User settings tablosundan abonelik durumunu kontrol et
      const { data: userSettings, error: settingsError } = await supabase
        .from('user_settings')
        .select('subscription_status')
        .eq('user_id', user.id)
        .single();

      console.log("User settings tablosundan abonelik durumu sorgulanıyor...");
      
      if (settingsError) {
        if (settingsError.code === 'PGRST116') {
          console.log("Kullanıcının settings kaydı bulunamadı");
        } else {
          console.error('Abonelik bilgisi alınamadı:', settingsError);
        }
      }
      
      if (userSettings) {
        console.log("User settings tablosundan alınan abonelik durumu:", userSettings.subscription_status);
      } else {
        console.log("User settings bulunamadı, varsayılan olarak free olarak ayarlanıyor");
      }

      if (userSettings && userSettings.subscription_status === 'premium') {
        setIsPremium(true);
        console.log("Kullanıcı premium aboneliğe sahip olarak işaretlendi");
      } else {
        setIsPremium(false);
        console.log("Kullanıcı ücretsiz planda olarak işaretlendi");
      }
    } catch (error) {
      console.error('Abonelik kontrolünde beklenmeyen hata:', error);
      setIsPremium(false); // Hata durumunda varsayılan olarak free
    } finally {
      setLoadingSubscription(false);
      console.log("Abonelik durumu kontrol edildi. Premium:", isPremium);
    }
  };

  // Premium kullanıcı ve işlem limiti kontrolü
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user) return;
      
      setCheckingLimit(true);
      
      try {
        // İlk önce premium durumunu kontrol et (hızlı bir sorgu)
        const { data: userSettings, error: userSettingsError } = await supabase
          .from("user_settings")
          .select("subscription_status")
          .eq("user_id", user.id)
          .single();
          
        let isPremiumUser = false;
        
        if (userSettings && userSettings.subscription_status === 'premium') {
          console.log("User settings tablosunda premium abonelik bulundu");
          isPremiumUser = true;
          setIsPremium(true);
          
          // Premium kullanıcı ise hemen yükleme durumunu kapat
          setCheckingLimit(false);
          return; // Premium kullanıcı için limit kontrolü yapmaya gerek yok
        }
        
        setIsPremium(false);
        
        // Premium değilse, bu ayki işlem sayısını kontrol et
        const currentMonthStart = new Date();
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0, 0, 0, 0);
        
        const currentMonthEnd = new Date();
        currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);
        currentMonthEnd.setDate(0);
        currentMonthEnd.setHours(23, 59, 59, 999);
        
        const { count, error: countError } = await supabase
          .from("transactions")
          .select("*", { count: "exact", head: true }) // Sadece sayım için head: true kullan
          .eq("user_id", user.id)
          .gte("date", currentMonthStart.toISOString())
          .lte("date", currentMonthEnd.toISOString());
          
        if (countError) {
          console.error("İşlem sayısı alınamadı:", countError);
        }
        
        const monthlyCount = count || 0;
        setMonthlyTransactionCount(monthlyCount);
        
        // Premium olmayan kullanıcı için limit kontrolü
        if (!isPremiumUser) {
          const isOverLimit = monthlyCount >= 30;
          setReachedTransactionLimit(isOverLimit);
          
          if (isOverLimit) {
            console.log("Aylık işlem limiti aşıldı:", monthlyCount);
            const wasFormerlyPremium = monthlyCount > 30;
            
            if (wasFormerlyPremium) {
              toast.error("Premium üyeliğiniz sona erdiği için ve aylık 30 işlem limitini aşmış durumdasınız. Mevcut işlemleriniz korunacak, ancak yeni işlem ekleyemezsiniz.");
            } else {
              toast.error("Aylık 30 işlem limitine ulaştınız. Premium'a yükseltmek için abonelik sayfasını ziyaret edin.");
            }
            
            // Limit aşıldıysa ana sayfaya yönlendir
            router.push("/dashboard/transactions");
          }
        }
      } catch (error) {
        console.error("Abonelik kontrolü sırasında hata:", error);
      } finally {
        setCheckingLimit(false);
      }
    };
    
    checkSubscriptionStatus();
  }, [supabase, user, router]);

  // Kategorileri yükle
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        // Paralel veri çekme işlemi - Daha hızlı yükleme için
        const [userCategoriesResponse, generalCategoriesResponse] = await Promise.all([
          // User-specific categories
          supabase
            .from('categories')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', formData.type),
            
          // General categories  
          supabase
            .from('categories')
            .select('*')
            .is('user_id', null)
            .eq('type', formData.type)
        ]);

        const userCategories = userCategoriesResponse.data || [];
        const generalCategories = generalCategoriesResponse.data || [];

        // Merge user-specific and general categories
        let allCategories = [...userCategories, ...generalCategories];

        // Free plan kullanıcıları için temel kategoriler
        const freeBasicCategories = [
          'Yiyecek', 'Ulaşım', 'Konut', 'Faturalar', 'Banka', 'Maaş', 'Diğer'
        ];

        // Eğer free plan kullanıcısı ise, sadece temel kategorileri göster
        if (!isPremium) {
          console.log("Free plan kullanıcısı için temel kategoriler filtreleniyor");
          console.log("Premium durumu:", isPremium);
          console.log("Filtreleme öncesi kategori sayısı:", allCategories.length);
          
          allCategories = allCategories.filter(cat => 
            freeBasicCategories.includes(String(cat.name)) || // Tip güvenliği için String dönüşümü
            String(cat.name).includes('Diğer')                // Tip güvenliği için String dönüşümü
          );
          
          console.log("Filtreleme sonrası kategori sayısı:", allCategories.length);
          
          // Eğer filtreleme sonrası herhangi bir kategori kalmadıysa, tüm kategorileri göster
          if (allCategories.length === 0) {
            console.log("Filtrelemeden sonra kategori kalmadı, tüm kategoriler gösteriliyor");
            allCategories = [...userCategories, ...generalCategories];
          }
        } else {
          console.log("Premium kullanıcı - tüm kategoriler gösteriliyor");
          console.log("Premium durumu:", isPremium);
          console.log("Toplam kategori sayısı:", allCategories.length);
        }

        setCategories(allCategories);
      } catch (error) {
        console.error("Kategorileri yükleme hatası:", error);
        toast.error("Kategoriler yüklenirken bir hata oluştu");
      } finally {
        setLoadingCategories(false);
      }
    };

    if (user) {
      fetchCategories();
    }
  }, [supabase, user, formData.type, isPremium]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.category) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }
    
    setIsLoading(true);

    try {
      if (!user) {
        toast.error("Oturum bilgisi bulunamadı");
        return;
      }

      // Tarihi yerel saat dilimine göre kaydet
      let dateToSave: string | null = null;
      if (formData.date) {
        // Tarih kısmını al (YYYY-MM-DD) ve yerel saat dilimine göre formatla
        dateToSave = formData.date.toLocaleDateString('en-CA');
      }
      
      // Supabase işlem kaydetme
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        category_id: formData.category,
        amount: parseFloat(formData.amount),
        type: formData.type,
        description: formData.description,
        date: dateToSave,
        is_recurring: formData.isRecurring,
        notes: formData.notes
      });

      if (error) {
        console.error("İşlem kaydetme hatası:", error);
        toast.error("İşlem kaydedilirken bir hata oluştu");
        return;
      }

      toast.success("İşlem başarıyla kaydedildi");
      router.push("/dashboard/transactions");
    } catch (error) {
      console.error("İşlem kaydetme hatası:", error);
      toast.error("İşlem kaydedilirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Yeni İşlem</h1>
        <p className="text-muted-foreground">
          Yeni bir gelir veya gider işlemi ekleyin
        </p>
      </div>

      {checkingLimit ? (
        <Card className="max-w-2xl mx-auto p-6">
          <div className="flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Kontrol ediliyor...</span>
          </div>
        </Card>
      ) : reachedTransactionLimit && !isPremium ? (
        <Card className="max-w-2xl mx-auto p-6">
          <CardHeader>
            <CardTitle className="text-center text-amber-500">İşlem Limiti Aşıldı</CardTitle>
            <CardDescription className="text-center">
              {monthlyTransactionCount > 30 ? (
                <>
                  Premium üyeliğiniz sona erdiği için yeni işlem ekleyemiyorsunuz.
                  <p className="mt-2">
                    Bu ay toplam <strong>{monthlyTransactionCount}</strong> işlem girdiniz, 
                    ücretsiz pakette ise aylık 30 işlem hakkınız vardır.
                  </p>
                  <p className="mt-2">
                    Mevcut işlemleriniz korunmaktadır ve görüntüleyebilirsiniz, ancak
                    yeni işlem eklemek için premium üyeliğinizi yenilemeniz gerekiyor.
                  </p>
                </>
              ) : (
                <>
                  Ücretsiz pakette aylık 30 işlem girişi yapabilirsiniz. Bu ay için işlem limitinize ulaştınız.
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push("/dashboard/subscription")}>
              Premium'a Yükselt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>İşlem Detayları</CardTitle>
              <CardDescription>
                {formData.type === "income" ? "Gelir" : "Gider"} detaylarını doldurun
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

              {/* Diğer form alanları - kategoriler yüklenene kadar skeleton gösterimi */}
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
                    Kaydediliyor...
                  </>
                ) : (
                  "Kaydet"
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}
    </div>
  );
}