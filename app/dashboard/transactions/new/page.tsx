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
import { CalendarIcon, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";

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
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "expense",
    category: "",
    date: new Date(),
    notes: "",
    isRecurring: false,
    frequency: "monthly",
  });

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

        // Tüm kategorileri birleştir
        const allCategories = [...userCategories, ...generalCategories];
        setCategories(allCategories);
      } catch (error) {
        console.error("Kategorileri yükleme hatası:", error);
        toast.error("Kategoriler yüklenirken bir hata oluştu");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [supabase, user, formData.type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Oturum açmanız gerekiyor");
      return;
    }

    setIsLoading(true);
    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Geçerli bir tutar girin");
        return;
      }

      // Temel işlem verilerini hazırla
      const transactionData = {
        user_id: user.id,
        description: formData.description,
        amount: amount,
        type: formData.type,
        category_id: formData.category,
        date: formData.date.toISOString().split("T")[0],
        notes: formData.notes,
      };

      // Eğer düzenli işlem ise
      if (formData.isRecurring) {
        try {
          // Düzenli işlem verilerini hazırla
          const recurringData = {
            user_id: user.id,
            description: formData.description,
            amount: amount,
            type: formData.type,
            category_id: formData.category,
            start_date: formData.date.toISOString().split("T")[0],
            notes: formData.notes,
            frequency: formData.frequency || "monthly",
          };

          // Düzenli işlem kaydı oluştur
          const { data: recurringResult, error: recurringError } = await supabase
            .from("recurring_transactions")
            .insert(recurringData)
            .select()
            .single();

          if (recurringError) {
            console.error("Düzenli işlem kaydedilirken hata:", recurringError);
            throw new Error(recurringError.message);
          }

          console.log("Düzenli işlem başarıyla kaydedildi:", recurringResult);
        } catch (recurringError) {
          console.error("Düzenli işlem kaydedilirken hata:", recurringError);
          toast.error("Düzenli işlem kaydedilirken bir hata oluştu");
          return;
        }
      }

      // Normal işlem kaydı oluştur
      const { data: transactionResult, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          ...transactionData,
          date: formData.date.toISOString().split("T")[0], // YYYY-MM-DD formatında kaydet
        })
        .select()
        .single();

      if (transactionError) {
        console.error("İşlem kaydedilirken hata:", transactionError);
        throw new Error(transactionError.message);
      }

      console.log("İşlem başarıyla kaydedildi:", transactionResult);
      toast.success("İşlem başarıyla kaydedildi");
      router.push("/dashboard/transactions");
    } catch (error) {
      console.error("İşlem kaydedilirken hata:", error);
      toast.error("İşlem kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Yeni İşlem</h1>
        <p className="text-muted-foreground">
          Yeni bir gelir veya gider işlemi ekleyin
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            {/* Form içeriği buraya gelecek */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="type">İşlem Tipi</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Gider</SelectItem>
                    <SelectItem value="income">Gelir</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="İşlem açıklaması"
                />
              </div>

              <div>
                <Label htmlFor="amount">Tutar (₺)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleChange("amount", e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange("category", value)}
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

              <div>
                <Label htmlFor="date">Tarih</Label>
                <DatePicker
                  date={formData.date}
                  setDate={(date) => handleChange("date", date)}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notlar (Opsiyonel)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="İşlem hakkında ek notlar..."
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Düzenli İşlem</Label>
                    <div className="text-sm text-muted-foreground">
                      Bu işlemi otomatik olarak tekrarla
                    </div>
                  </div>
                  <Switch
                    checked={formData.isRecurring}
                    onCheckedChange={(checked) => {
                      handleChange("isRecurring", checked);
                      if (checked && !formData.frequency) {
                        handleChange("frequency", "monthly");
                      }
                    }}
                  />
                </div>

                {formData.isRecurring && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Tekrarlama Sıklığı</Label>
                      <Select
                        value={formData.frequency || "monthly"}
                        onValueChange={(value) => handleChange("frequency", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sıklık seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Günlük</SelectItem>
                          <SelectItem value="weekly">Haftalık</SelectItem>
                          <SelectItem value="monthly">Aylık</SelectItem>
                          <SelectItem value="yearly">Yıllık</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>Düzenli işlem bilgisi</span>
                      </div>
                      <p className="text-sm">
                        {formData.frequency === "daily" && "Her gün"}
                        {formData.frequency === "weekly" && "Her hafta"}
                        {formData.frequency === "monthly" && "Her ay"}
                        {formData.frequency === "yearly" && "Her yıl"}
                        {" "}
                        {formData.type === "expense" ? "ödenecek" : "alınacak"} tutar:{" "}
                        <span className="font-medium">
                          {new Intl.NumberFormat("tr-TR", {
                            style: "currency",
                            currency: "TRY",
                          }).format(parseFloat(formData.amount) || 0)}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/transactions")}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}