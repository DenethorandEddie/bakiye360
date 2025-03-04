"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/components/supabase-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Target } from "lucide-react";

// Define types for our data structures
interface BudgetGoal {
  id: string;
  name: string;
  category_id: string; // Veritabanındaki kategori ID'si
  target: number;
  current: number;
  user_id: string;
  start_date?: string | null;
  end_date?: string | null;
}

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  category_id: string;
  date: string;
  description?: string;
  created_at?: string;
}

export default function BudgetGoalsPage() {
  const { supabase, user } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<BudgetGoal[]>([]);
  const [expenses, setExpenses] = useState<Record<string, number>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<BudgetGoal | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    target: "",
  });
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. First fetch expense categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .eq('type', 'expense')
          .or(`user_id.is.null,user_id.eq.${user.id}`);
        
        if (categoriesError) throw categoriesError;
        
        if (categoriesData) {
          const typedCategories = categoriesData.map(cat => ({
            id: String(cat.id),
            name: String(cat.name)
          }));
          setCategories(typedCategories);
          console.log("Kategori bilgileri:", typedCategories);
        }

        // 2. Then fetch budget goals
        const { data: budgetGoalsData, error: budgetGoalsError } = await supabase
          .from('budget_goals')
          .select('*')
          .eq('user_id', user.id);
        
        if (budgetGoalsError) throw budgetGoalsError;
        console.log("Çekilen işlem sayısı:", budgetGoalsData ? budgetGoalsData.length : 0);
        
        // 3. Fetch transactions to calculate current expenses
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'expense');
        
        if (transactionsError) throw transactionsError;
        
        // Veriyi doğru tiplerle işleme
        const typedTransactions: Transaction[] = transactionsData ? transactionsData.map((t: any) => ({
          id: String(t.id),
          user_id: String(t.user_id),
          amount: Number(t.amount),
          type: String(t.type),
          category_id: String(t.category_id),
          date: String(t.date),
          description: t.description ? String(t.description) : undefined,
          created_at: t.created_at ? String(t.created_at) : undefined
        })) : [];
        
        // 3.1 Sadece mevcut aya ait işlemleri filtrele
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const currentMonthTransactions = typedTransactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
        });
        
        // 3.2 Kategorilere göre harcamaları hesapla (sadece mevcut ay için)
        const categoryExpenses: Record<string, number> = {};
        currentMonthTransactions.forEach(transaction => {
          const categoryId = transaction.category_id;
          if (categoryId) {
            categoryExpenses[categoryId] = (categoryExpenses[categoryId] || 0) + transaction.amount;
          }
        });
        
        setExpenses(categoryExpenses);
        
        // 4. Her bir bütçe hedefine mevcut harcama bilgisini ekle
        if (budgetGoalsData) {
          // 4.1 Aktif bütçe hedeflerini filtrele
          const activeGoals = budgetGoalsData.filter(goal => {
            // Eğer başlangıç ve bitiş tarihi varsa, hedefin şu an aktif olup olmadığını kontrol et
            if (goal.start_date && goal.end_date) {
              const startDate = new Date(goal.start_date as string);
              const endDate = new Date(goal.end_date as string);
              const now = new Date();
              return now >= startDate && now <= endDate;
            }
            // Tarih bilgisi yoksa varsayılan olarak aktif kabul et
            return true;
          });
        
          const goalsWithCurrentExpenses = activeGoals.map(goal => {
            // Kategori ID'sini al
            const categoryId = goal.category_id as string;
            
            return {
              id: goal.id,
              name: goal.name,
              category_id: categoryId,
              target: goal.target_amount, // Veritabanında 'target_amount' olarak saklanıyor
              user_id: goal.user_id,
              start_date: goal.start_date,
              end_date: goal.end_date,
              current: categoryExpenses[categoryId] || 0
            } as BudgetGoal;
          });
          
          setGoals(goalsWithCurrentExpenses);
        } else {
          setGoals([]);
        }
      } catch (error) {
        console.error('Veri yüklenirken hata oluştu:', error);
        toast.error('Veriler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, user?.id]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenDialog = (goal: any = null) => {
    if (goal) {
      setIsEditing(true);
      setCurrentGoal(goal);
      setFormData({
        name: goal.name,
        category: goal.category_id, // Use category_id for editing
        target: goal.target.toString(),
      });
    } else {
      setIsEditing(false);
      setCurrentGoal(null);
      setFormData({
        name: "",
        category: "",
        target: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setCurrentGoal(null);
    setFormData({
      name: "",
      category: "",
      target: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Lütfen giriş yapın");
      return;
    }
    
    if (!formData.name || !formData.category || !formData.target) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }
    
    // Hedef tutarın geçerli bir sayı olduğundan emin olalım
    const targetAmount = parseFloat(formData.target);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      toast.error("Lütfen geçerli bir hedef tutar girin");
      return;
    }
    
    try {
      // Supabase'in bütçe hedefleri tablosuna gönderilecek veri
      const newGoalData = {
        name: formData.name,
        category_id: formData.category, // This is now a UUID from the database
        target_amount: targetAmount,
        start_date: new Date().toISOString().split('T')[0], // Current date as start date
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0], // One month from now as end date
        user_id: user.id
      };
      
      console.log("Kaydedilecek bütçe hedefi verisi:", newGoalData);
      
      if (isEditing && currentGoal) {
        // Bütçe hedefini güncelle
        const { error } = await supabase
          .from('budget_goals')
          .update({
            name: formData.name,
            category_id: formData.category, // This is now a UUID from the database
            target_amount: targetAmount,
            // Not updating start_date and end_date during edit to preserve original values
          })
          .eq('id', currentGoal.id)
          .eq('user_id', user.id);
          
        if (error) {
          console.error("Bütçe güncelleme hatası detayları:", error);
          throw error;
        }
        
        // Yerel state'i güncelle
        setGoals(goals.map(goal => 
          goal.id === currentGoal.id 
            ? { ...goal, name: formData.name, category_id: formData.category, target: targetAmount } 
            : goal
        ));
        
        toast.success("Bütçe hedefi güncellendi");
      } else {
        // Yeni bütçe hedefi ekle
        const { data, error } = await supabase
          .from('budget_goals')
          .insert({
            name: formData.name,
            category_id: formData.category, // This is now a UUID from the database
            target_amount: targetAmount,
            start_date: new Date().toISOString().split('T')[0], // Current date as start date
            end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0], // One month from now as end date
            user_id: user.id
          })
          .select();
          
        if (error) {
          console.error("Bütçe ekleme hatası detayları:", error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          throw new Error("Bütçe hedefi eklendi ancak veri döndürülmedi");
        }
        
        // Yerel state'i güncelle
        const newGoal: BudgetGoal = { 
          id: String(data[0].id),
          name: String(data[0].name),
          category_id: formData.category,
          target: targetAmount,
          user_id: String(data[0].user_id),
          current: expenses[formData.category] || 0 
        };
        
        setGoals([...goals, newGoal]);
        
        toast.success("Bütçe hedefi eklendi");
      }
      
      // Formu sıfırla ve dialog'u kapat
      setFormData({ name: "", category: "", target: "" });
      setIsDialogOpen(false);
      setIsEditing(false);
      setCurrentGoal(null);
    } catch (error) {
      console.error("Bütçe hedefi kaydedilirken hata oluştu:", error);
      toast.error("Bütçe hedefi kaydedilirken bir hata oluştu");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Veritabanından sil
      const { error } = await supabase
        .from('budget_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);
        
      if (error) throw error;
      
      // Yerel state'i güncelle
      setGoals(goals.filter(goal => goal.id !== id));
      toast.success("Bütçe hedefi silindi");
    } catch (error) {
      console.error("Bütçe hedefi silinirken hata oluştu:", error);
      toast.error("Bütçe hedefi silinirken bir hata oluştu");
    }
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  // Hedefin aktif olup olmadığını kontrol eden fonksiyon
  const isGoalActive = (goal: BudgetGoal) => {
    // Eğer başlangıç veya bitiş tarihi yoksa her zaman aktif
    if (!goal.start_date || !goal.end_date) {
      return true;
    }
    
    try {
      const today = new Date();
      const startDate = goal.start_date ? new Date(goal.start_date) : null;
      const endDate = goal.end_date ? new Date(goal.end_date) : null;
      
      // Eğer startDate veya endDate geçerli bir tarih değilse 
      if (!startDate || !endDate) {
        return true;
      }
      
      return today >= startDate && today <= endDate;
    } catch (error) {
      console.error("Tarih değerlendirme hatası:", error);
      return true; // Hata durumunda hedefi aktif kabul et
    }
  };

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bütçe Hedefleri</h1>
          <p className="text-muted-foreground">
            Harcama kategorileriniz için bütçe hedefleri belirleyin ve takip edin
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Hedef
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isEditing ? "Hedefi Düzenle" : "Yeni Bütçe Hedefi"}</DialogTitle>
                <DialogDescription>
                  {isEditing 
                    ? "Bütçe hedefi bilgilerini güncelleyin" 
                    : "Yeni bir bütçe hedefi eklemek için aşağıdaki bilgileri doldurun"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Hedef Adı</Label>
                    <Input
                      id="name"
                      placeholder="Örn: Aylık Yiyecek Bütçesi"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
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
                  <div className="space-y-2">
                    <Label htmlFor="target">Hedef Tutar (₺)</Label>
                    <Input
                      id="target"
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={formData.target}
                      onChange={(e) => handleChange("target", e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    İptal
                  </Button>
                  <Button type="submit">
                    {isEditing ? "Güncelle" : "Ekle"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p>Yükleniyor...</p>
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Henüz bir bütçe hedefi oluşturmadınız</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  İlk Hedefi Oluştur
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {goals.map((goal) => {
            const progress = (goal.current / goal.target) * 100;
            const isOverBudget = goal.current > goal.target;
            
            return (
              <Card key={goal.id} className="mb-4">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle>{goal.name}</CardTitle>
                    <CardDescription>{getCategoryLabel(goal.category_id)}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleOpenDialog(goal)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDelete(goal.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">İlerleme</span>
                      <span className={`font-medium ${isOverBudget ? "text-red-500" : ""}`}>
                        ₺{goal.current.toLocaleString('tr-TR')} / ₺{goal.target.toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(progress, 100)} 
                      className={isOverBudget ? "bg-red-200" : ""}
                    />
                    <div className="text-sm text-right">
                      {isOverBudget ? (
                        <span className="text-red-500">
                          Bütçe aşımı: ₺{(goal.current - goal.target).toLocaleString('tr-TR')}
                        </span>
                      ) : (
                        <span className="text-green-500">
                          Kalan: ₺{(goal.target - goal.current).toLocaleString('tr-TR')}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}