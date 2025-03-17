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
import { Plus, Edit, Trash2, Target, AlertCircle, TrendingUp, TrendingDown, DollarSign, Wallet, PiggyBank, CheckCircle2, BarChart4, CircleDollarSign } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

  // Aşırı harcama olup olmadığını kontrol et
  const isOverBudget = (goal: BudgetGoal) => {
    const categoryExpense = expenses[goal.category_id] || 0;
    return categoryExpense > goal.target;
  };

  // İlerleme yüzdesi hesapla
  const getProgressPercentage = (goal: BudgetGoal) => {
    const categoryExpense = expenses[goal.category_id] || 0;
    const percentage = (categoryExpense / goal.target) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "Bilinmeyen Kategori";
  };

  // Toplam bütçe ve harcamayı hesapla
  const calculateTotals = () => {
    let totalBudget = 0;
    let totalExpense = 0;
    
    goals.forEach(goal => {
      totalBudget += goal.target;
      totalExpense += expenses[goal.category_id] || 0;
    });
    
    return { totalBudget, totalExpense };
  };
  
  const { totalBudget, totalExpense } = calculateTotals();
  const totalSavings = totalBudget - totalExpense;
  const overallPercentage = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0;

  // Hedefleri ilerleme durumuna göre sırala
  const sortedGoals = [...goals].sort((a, b) => {
    const aProgress = getProgressPercentage(a);
    const bProgress = getProgressPercentage(b);
    return bProgress - aProgress;
  });

  // Kritik durumdaki (>90%) hedefleri bul
  const criticalGoals = goals.filter(goal => {
    const progress = getProgressPercentage(goal);
    return progress > 90;
  });

  return (
    <div className="container mx-auto px-4 py-6 space-y-8 min-h-screen bg-gradient-to-b from-background to-background/40">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Bütçe Hedefleri
          </h1>
          <p className="text-muted-foreground/80 mt-1">
            Harcama kategorileriniz için aylık bütçe hedefleri belirleyin ve takip edin
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="px-6 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
              <Plus className="w-5 h-5 mr-2" />
              Yeni Hedef
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {isEditing ? "Bütçe Hedefini Düzenle" : "Yeni Bütçe Hedefi"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/90">
                {isEditing
                  ? "Mevcut bütçe hedefini güncelleyin"
                  : "Yeni bir bütçe hedefi oluşturun ve harcamalarınızı daha iyi yönetin"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Hedef Adı</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Örn: Yemek Harcamaları"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">Kategori</Label>
                <Select value={formData.category} onValueChange={handleSelectChange}>
                  <SelectTrigger className="w-full">
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
                <Label htmlFor="target" className="text-sm font-medium">Hedef Tutar (₺)</Label>
                <Input
                  id="target"
                  name="target"
                  type="number"
                  value={formData.target}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleCreateBudgetGoal} className="px-6">
                {isEditing ? "Güncelle" : "Oluştur"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary shadow-[0_0_15px_rgba(var(--primary)/_0.2)]"></div>
            <p className="text-muted-foreground animate-pulse">Bütçe hedefleri yükleniyor...</p>
          </div>
        </div>
      ) : goals.length === 0 ? (
        <Card className="w-full max-w-2xl mx-auto shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-card to-card/95">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Henüz bütçe hedefi yok</CardTitle>
            <CardDescription>
              Harcamalarınızı kontrol altında tutmak için bütçe hedefleri oluşturun
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-primary/5">
                <Target className="w-16 h-16 text-muted-foreground" />
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsDialogOpen(true)}
                className="mt-4 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2" />
                İlk Hedefini Oluştur
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Özet Bölümü */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Toplam Bütçe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CircleDollarSign className="h-8 w-8 text-primary mr-2" />
                    <div className="text-2xl font-bold">
                      {totalBudget.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4 border-l-destructive">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Toplam Harcama</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wallet className="h-8 w-8 text-destructive mr-2" />
                    <div className="text-2xl font-bold">
                      {totalExpense.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Kalan Bütçe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <PiggyBank className="h-8 w-8 text-green-500 mr-2" />
                    <div className="text-2xl font-bold">
                      {totalSavings.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Genel Durum</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <BarChart4 className="h-8 w-8 text-amber-500 mr-2" />
                    <div className="text-2xl font-bold">
                      {Math.min(Math.round(overallPercentage), 100)}%
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(overallPercentage, 100)} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Kritik Hedefler */}
          {criticalGoals.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground pl-1 border-l-4 border-destructive ml-1">Kritik Hedefler</h2>
              <Card className="shadow-md border border-destructive/30 bg-destructive/5">
                <CardContent className="p-4 space-y-4">
                  {criticalGoals.map((goal) => {
                    const progress = getProgressPercentage(goal);
                    const categoryExpense = expenses[goal.category_id] || 0;
                    const isOver = isOverBudget(goal);
                    
                    return (
                      <div key={goal.id} className="flex items-center justify-between gap-4">
                        <div className="space-y-1 flex-grow">
                          <div className="flex items-center">
                            <AlertCircle className={cn(
                              "h-4 w-4 mr-2",
                              isOver ? "text-destructive" : "text-amber-500"
                            )} />
                            <p className="font-medium text-sm">{goal.name} ({getCategoryName(goal.category_id)})</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                {progress.toFixed(0)}% kullanıldı
                              </span>
                              <span className={cn(
                                "font-medium",
                                isOver ? "text-destructive" : "text-amber-500"
                              )}>
                                {categoryExpense.toLocaleString('tr-TR', {
                                  style: 'currency',
                                  currency: 'TRY'
                                })} / {goal.target.toLocaleString('tr-TR', {
                                  style: 'currency',
                                  currency: 'TRY'
                                })}
                              </span>
                            </div>
                            <Progress value={progress} className={cn(
                              "h-2",
                              isOver ? "bg-destructive/20" : "bg-amber-500/20"
                            )} 
                            indicatorClassName={isOver ? "bg-destructive" : "bg-amber-500"}
                            />
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          onClick={() => handleEditBudgetGoal(goal)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Düzenle
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Tüm Hedefler */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground pl-1 border-l-4 border-primary ml-1">Tüm Bütçe Hedefleri</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedGoals.map((goal) => {
                const progress = getProgressPercentage(goal);
                const categoryExpense = expenses[goal.category_id] || 0;
                const isOver = isOverBudget(goal);
                const remaining = goal.target - categoryExpense;
                
                return (
                  <Card 
                    key={goal.id} 
                    className={cn(
                      "shadow-md hover:shadow-xl transition-all duration-300",
                      isOver 
                        ? "border-2 border-destructive/60" 
                        : progress > 80 
                          ? "border-2 border-amber-500/60" 
                          : "border border-border/60"
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-semibold">
                            {goal.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {getCategoryName(goal.category_id)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 transition-colors duration-300"
                            onClick={() => handleEditBudgetGoal(goal)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-300"
                            onClick={() => handleDeleteBudgetGoal(goal.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-6 space-y-5">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Hedef</span>
                          <span className="font-medium">
                            {goal.target.toLocaleString('tr-TR', {
                              style: 'currency',
                              currency: 'TRY'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Harcama</span>
                          <span className={cn(
                            "font-medium",
                            isOver ? "text-destructive" : ""
                          )}>
                            {categoryExpense.toLocaleString('tr-TR', {
                              style: 'currency',
                              currency: 'TRY'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-border/60 pt-2">
                          <span className="text-muted-foreground">Kalan</span>
                          <span className={cn(
                            "font-medium",
                            isOver ? "text-destructive" : "text-green-600"
                          )}>
                            {isOver ? "-" : ""}{Math.abs(remaining).toLocaleString('tr-TR', {
                              style: 'currency',
                              currency: 'TRY'
                            })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">İlerleme ({progress.toFixed(0)}%)</span>
                          {isOver ? (
                            <span className="text-xs font-medium bg-destructive/10 text-destructive px-2 py-1 rounded-full">
                              %{(((categoryExpense / goal.target) - 1) * 100).toFixed(0)} Aşım
                            </span>
                          ) : (
                            <span className={cn(
                              "text-xs font-medium px-2 py-1 rounded-full",
                              progress > 80 
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" 
                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            )}>
                              %{(100 - progress).toFixed(0)} Kaldı
                            </span>
                          )}
                        </div>
                        <Progress 
                          value={progress} 
                          className={cn(
                            "h-2",
                            isOver 
                              ? "bg-destructive/20" 
                              : progress > 80 
                                ? "bg-amber-500/20" 
                                : "bg-primary/20"
                          )} 
                          indicatorClassName={
                            isOver 
                              ? "bg-destructive" 
                              : progress > 80 
                                ? "bg-amber-500" 
                                : "bg-primary"
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}