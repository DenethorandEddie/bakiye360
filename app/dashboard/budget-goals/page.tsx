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
import Link from "next/link";

// Define types for our data structures
interface BudgetGoal {
  id: string;
  name: string;
  category_id: string;
  target: number;
  current: number;
  user_id: string;
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
  const [loadingCategories, setLoadingCategories] = useState(true);

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
        }

        // 2. Then fetch budget goals
        const { data: budgetGoalsData, error: budgetGoalsError } = await supabase
          .from('budget_goals')
          .select('*')
          .eq('user_id', user.id);
        
        if (budgetGoalsError) throw budgetGoalsError;
        
        if (budgetGoalsData) {
          const typedGoals: BudgetGoal[] = budgetGoalsData.map(goal => ({
            id: String(goal.id),
            name: String(goal.name),
            user_id: String(goal.user_id),
            category_id: String(goal.category_id),
            target: Number(goal.target_amount || 0),
            current: Number(goal.current || 0)
          }));
          setGoals(typedGoals);
        }

        // 3. Fetch transactions for current month to calculate progress
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'expense')
          .gte('date', firstDayOfMonth)
          .lte('date', lastDayOfMonth);
        
        if (transactionsError) throw transactionsError;
        
        if (transactionsData) {
          // Calculate total expenses by category
          const categoryExpenses: Record<string, number> = {};
          
          (transactionsData as any[]).forEach((transaction) => {
            if (transaction && transaction.category_id && transaction.amount) {
              const categoryId = String(transaction.category_id);
              const amount = Number(transaction.amount);
              
              if (!categoryExpenses[categoryId]) {
                categoryExpenses[categoryId] = 0;
              }
              
              categoryExpenses[categoryId] += amount;
            }
          });
          
          setExpenses(categoryExpenses);
        }
      } catch (error) {
        console.error("Veri yükleme hatası:", error);
        toast.error("Bütçe hedefleri yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, user]);

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
            .eq('type', 'expense'),
            
          // Genel kategoriler  
          supabase
            .from('categories')
            .select('*')
            .is('user_id', null)
            .eq('type', 'expense')
        ]);

        const userCategories = userCategoriesResponse.data || [];
        const generalCategories = generalCategoriesResponse.data || [];

        // Kategorileri birleştir
        const allCategories = [...userCategories, ...generalCategories];
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
  }, [supabase, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, category: value });
  };

  const handleCreateBudgetGoal = async () => {
    if (!formData.name || !formData.category || !formData.target) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }

    try {
      const targetAmount = parseFloat(formData.target);
      if (isNaN(targetAmount) || targetAmount <= 0) {
        toast.error("Geçerli bir hedef tutar girin");
        return;
      }

      if (isEditing && currentGoal) {
        // Mevcut hedefi güncelle
        const { error } = await supabase
          .from('budget_goals')
          .update({
            name: formData.name,
            category_id: formData.category,
            target_amount: targetAmount,
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
          })
          .eq('id', currentGoal.id);

        if (error) throw error;
        toast.success("Bütçe hedefi güncellendi");
      } else {
        // Yeni hedef oluştur
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        const { error } = await supabase
          .from('budget_goals')
          .insert({
            user_id: user?.id,
            name: formData.name,
            category_id: formData.category,
            target_amount: targetAmount,
            start_date: firstDayOfMonth,
            end_date: lastDayOfMonth
          });

        if (error) throw error;
        toast.success("Yeni bütçe hedefi oluşturuldu");
      }

      // Formu sıfırla ve dialogu kapat
      setFormData({ name: "", category: "", target: "" });
      setIsDialogOpen(false);
      setIsEditing(false);
      setCurrentGoal(null);

      // Hedefleri yeniden yükle
      const { data, error } = await supabase
        .from('budget_goals')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      if (data) {
        const typedGoals: BudgetGoal[] = data.map(goal => ({
          id: String(goal.id),
          name: String(goal.name),
          user_id: String(goal.user_id),
          category_id: String(goal.category_id),
          target: Number(goal.target_amount || 0),
          current: 0
        }));
        setGoals(typedGoals);
      }
    } catch (error) {
      console.error("Bütçe hedefi oluşturma/güncelleme hatası:", error);
      toast.error("Bütçe hedefi kaydedilirken bir hata oluştu");
    }
  };

  const handleEditBudgetGoal = (goal: BudgetGoal) => {
    setCurrentGoal(goal);
    setFormData({
      name: goal.name,
      category: goal.category_id,
      target: goal.target.toString(),
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteBudgetGoal = async (goalId: string) => {
    if (!window.confirm("Bu bütçe hedefini silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('budget_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      setGoals(goals.filter(goal => goal.id !== goalId));
      toast.success("Bütçe hedefi silindi");
    } catch (error) {
      console.error("Bütçe hedefi silme hatası:", error);
      toast.error("Bütçe hedefi silinirken bir hata oluştu");
    }
  };

  const getProgressPercentage = (goal: BudgetGoal) => {
    const categoryExpense = expenses[goal.category_id] || 0;
    const percentage = (categoryExpense / goal.target) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "Bilinmeyen Kategori";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bütçe Hedefleri</h1>
          <p className="text-sm text-muted-foreground">
            Harcama kategorileriniz için aylık bütçe hedefleri belirleyin
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Hedef
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Bütçe Hedefini Düzenle" : "Yeni Bütçe Hedefi"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Mevcut bütçe hedefini güncelleyin"
                  : "Yeni bir bütçe hedefi oluşturun"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Hedef Adı</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Örn: Yemek Harcamaları"
                />
              </div>
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select value={formData.category} onValueChange={handleSelectChange}>
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
                <Label htmlFor="target">Hedef Tutar (₺)</Label>
                <Input
                  id="target"
                  name="target"
                  type="number"
                  value={formData.target}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleCreateBudgetGoal}>
                {isEditing ? "Güncelle" : "Oluştur"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Henüz bütçe hedefi yok</CardTitle>
            <CardDescription>
              Harcamalarınızı kontrol altında tutmak için bütçe hedefleri oluşturun
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Target className="w-12 h-12 text-muted-foreground" />
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              İlk Hedefini Oluştur
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{goal.name}</CardTitle>
                    <CardDescription>
                      {getCategoryName(goal.category_id)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditBudgetGoal(goal)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteBudgetGoal(goal.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">İlerleme</span>
                    <span className="font-medium">
                      {expenses[goal.category_id]?.toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY'
                      }) || '₺0'} / {goal.target.toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY'
                      })}
                    </span>
                  </div>
                  <Progress value={getProgressPercentage(goal)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}