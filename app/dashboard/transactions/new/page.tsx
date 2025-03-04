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
  
  // Yeni bir tarih nesnesi oluştur (aynı tarih ve saat değerleri ile)
  const newDate = new Date(date);
  
  // Türkiye saat dilimi (UTC+3) için offset hesapla
  const tzOffset = 3 * 60; // 3 saat = 180 dakika
  
  // Kullanıcının yerel saat dilimi offseti (dakika cinsinden)
  const localOffset = newDate.getTimezoneOffset();
  
  // Toplam offset farkını dakika cinsinden hesapla
  const offsetDiff = localOffset + tzOffset; 
  
  // Tarih nesnesini offsetDiff kadar ileri al
  newDate.setMinutes(newDate.getMinutes() + offsetDiff);
  
  return newDate;
}

export default function NewTransactionPage() {
  const router = useRouter();
  const { supabase, user } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "expense",
    category: "",
    date: new Date(),
    notes: "",
    isRecurring: false,
  });

  // Kategorileri yükle
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      
      // Her durumda gösterilecek varsayılan kategoriler
      const defaultCategories = [
        { id: 'f1', name: "Yiyecek", type: "expense" },
        { id: 'f2', name: "Ulaşım", type: "expense" },
        { id: 'f3', name: "Konut", type: "expense" },
        { id: 'f4', name: "Eğlence", type: "expense" },
        { id: 'f5', name: "Faturalar", type: "expense" },
        { id: 'f6', name: "Maaş", type: "income" },
        { id: 'f7', name: "Yatırım", type: "income" },
        { id: 'f8', name: "Diğer", type: "expense" },
      ];
      
      try {
        // Gerçek Supabase sorgusu
        // Önce kullanıcıya özel kategorileri al
        let userCategories: any[] = [];
        if (user?.id) {
          const { data: userCats, error: userCatsError } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', user.id);
          
          if (userCatsError) {
            console.error("Kullanıcı kategorileri yükleme hatası:", userCatsError);
          } else {
            userCategories = userCats || [];
          }
        }
        
        // Genel kategorileri al (user_id = null)
        const { data: generalCats, error: generalCatsError } = await supabase
          .from('categories')
          .select('*')
          .is('user_id', null);
          
        if (generalCatsError) {
          console.error("Genel kategoriler yükleme hatası:", generalCatsError);
          console.error("Hata detayları:", generalCatsError.details, generalCatsError.hint, generalCatsError.message);
          throw generalCatsError;
        }
        
        // İki kategori listesini birleştir
        const allCategories = [...userCategories, ...(generalCats || [])];
        
        if (allCategories.length === 0) {
          console.warn("Hiç kategori bulunamadı. Varsayılan kategorilere dönülüyor.");
          // Kategori bulunamazsa varsayılan kategorileri göster
          setCategories(defaultCategories);
        } else {
          setCategories(allCategories);
        }
      } catch (error) {
        console.error("Kategori yükleme hatası:", error);
        toast.error("Kategoriler yüklenirken bir hata oluştu");
        
        // Hata olursa varsayılan kategorileri göster
        setCategories(defaultCategories);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [supabase, user]);

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

      // Tarihi timezone için düzelt
      const adjustedDate = adjustDateForTimezone(formData.date);
      
      // Supabase işlem kaydetme
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        category_id: formData.category,
        amount: parseFloat(formData.amount),
        type: formData.type,
        description: formData.description,
        date: adjustedDate ? adjustedDate.toISOString().split('T')[0] : null,
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

  // Seçilen işlem tipine göre kategorileri filtrele
  const filteredCategories = categories.filter(
    category => category.type === formData.type || category.type === 'both'
  );

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Yeni İşlem</h1>
        <p className="text-muted-foreground">
          Yeni bir gelir veya gider işlemi ekleyin
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>İşlem Detayları</CardTitle>
          <CardDescription>
            Lütfen işlem bilgilerini eksiksiz doldurun
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">İşlem Türü</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="İşlem türü seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Gelir</SelectItem>
                  <SelectItem value="expense">Gider</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Input
                id="description"
                placeholder="İşlem açıklaması"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Tutar (₺)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              {loadingCategories ? (
                <div className="flex items-center space-x-2 h-10 px-3 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground text-sm">Kategoriler yükleniyor...</span>
                </div>
              ) : (
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((category) => (
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
                    onSelect={(date) => handleChange("date", date || new Date())}
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
        </form>
      </Card>
    </div>
  );
}