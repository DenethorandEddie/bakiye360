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
  category_id: string; // Veritabanındaki kategori ID'si
  target: number; // Bu veritabanında 'target_amount' olarak saklanıyor
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
  // Kullanıcı abonelik durumu
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("free");
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setLoadingSubscription(false);
      return;
    }

    // Kullanıcının abonelik durumunu kontrol et
    const checkSubscription = async () => {
      try {
        console.log("Bütçe Hedefleri - Abonelik durumu kontrol ediliyor...");
        
        // SADECE user_settings tablosundan abonelik durumunu kontrol et
        const { data, error } = await supabase
          .from('user_settings')
          .select('subscription_status')
          .eq('user_id', user.id)
          .single();

        console.log("Bütçe Hedefleri - User settings tablosundan sorgu yapıldı");
        
        if (error) {
          if (error.code === 'PGRST116') {
            console.log("Bütçe Hedefleri - Kullanıcının settings kaydı bulunamadı");
          } else {
            console.error('Bütçe Hedefleri - Abonelik bilgisi alınamadı:', error);
            toast.error('Abonelik bilgisi yüklenemedi');
          }
        }

        if (data) {
          console.log("Bütçe Hedefleri - User settings tablosundan abonelik durumu:", data.subscription_status);
          setSubscriptionStatus(String(data.subscription_status));
        } else {
          console.log("Bütçe Hedefleri - User settings bulunamadı, varsayılan 'free' olarak ayarlanıyor");
          setSubscriptionStatus('free');
        }
      } catch (error) {
        console.error('Bütçe Hedefleri - Abonelik kontrolünde beklenmeyen hata:', error);
        setSubscriptionStatus('free'); // Hata durumunda varsayılan olarak free
      } finally {
        setLoadingSubscription(false);
        console.log("Bütçe Hedefleri - Abonelik durumu kontrol edildi. Durum:", subscriptionStatus);
      }
    };

    checkSubscription();

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
          let typedCategories = categoriesData.map(cat => ({
            id: String(cat.id),
            name: String(cat.name)
          }));
          
          console.log("Toplam kategori sayısı:", typedCategories.length);
          console.log("Abonelik durumu:", subscriptionStatus);
          
          // Free plan kullanıcıları için temel kategoriler
          const freeBasicCategories = [
            'Yiyecek', 'Ulaşım', 'Konut', 'Faturalar', 'Banka', 'Diğer Gider', 'Diğer'
          ];
          
          // Eğer free plan kullanıcısı ise, sadece temel kategorileri filtrele
          if (subscriptionStatus !== 'premium') {
            console.log("Free plan kullanıcısı için temel kategoriler filtreleniyor");
            typedCategories = typedCategories.filter(cat => 
              freeBasicCategories.includes(String(cat.name)) || // Temel kategorileri dahil et
              String(cat.name).includes('Diğer')                // "Diğer" içeren kategorileri dahil et
            );
            
            // Eğer filtreleme sonrası herhangi bir kategori kalmadıysa
            if (typedCategories.length === 0) {
              console.log("Filtrelemeden sonra kategori kalmadı, tüm kategoriler gösteriliyor");
              typedCategories = categoriesData.map(cat => ({
                id: String(cat.id),
                name: String(cat.name)
              }));
            }
          } else {
            console.log("Premium kullanıcı için tüm kategoriler gösteriliyor");
          }
          
          console.log("Filtreleme sonrası kategori sayısı:", typedCategories.length);
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
            current: Number(goal.current || 0),
            start_date: goal.start_date ? String(goal.start_date) : null,
            end_date: goal.end_date ? String(goal.end_date) : null
          }));
          setGoals(typedGoals);
          console.log("Bütçe hedefleri:", typedGoals);
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
          console.log("Kategori bazlı harcamalar:", categoryExpenses);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, category: value });
  };

  const handleCreateBudgetGoal = async () => {
    // Free kullanıcı için hedef sayısı kontrolü
    if (!isEditing && subscriptionStatus !== 'premium') {
      const existingGoalsCount = goals.length;
      
      if (existingGoalsCount >= 1) {
        toast.error("Ücretsiz pakette maksimum 1 bütçe hedefi oluşturabilirsiniz. Premium paketimize geçerek sınırsız hedef oluşturabilirsiniz.");
        setIsDialogOpen(false);
        return;
      }
    }

    try {
      if (!formData.name || !formData.category || !formData.target) {
        toast.error("Lütfen tüm alanları doldurun");
        return;
      }

      if (isEditing && currentGoal) {
        // Update existing goal
        const { error } = await supabase
          .from('budget_goals')
          .update({
            name: formData.name,
            category_id: formData.category,
            target_amount: parseFloat(formData.target),
          })
          .eq('id', currentGoal.id);

        if (error) throw error;

        toast.success("Bütçe hedefi güncellendi");
        
        // Update local state
        setGoals(goals.map(goal => 
          goal.id === currentGoal.id 
            ? { 
                ...goal, 
                name: formData.name, 
                category_id: formData.category, 
                target: parseFloat(formData.target) // Bu değer artık veritabanında target_amount olarak saklanacak
              } 
            : goal
        ));
      } else {
        // Create new goal
        const { data, error } = await supabase
          .from('budget_goals')
          .insert({
            name: formData.name,
            category_id: formData.category,
            target_amount: parseFloat(formData.target),
            user_id: user?.id,
            start_date: new Date().toISOString(),
            end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
          })
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          toast.success("Yeni bütçe hedefi oluşturuldu");
          
          // Doğru şekilde BudgetGoal oluştur, name alanını da dahil et
          const newGoal: BudgetGoal = {
            id: String(data[0].id),
            name: String(data[0].name),
            user_id: String(data[0].user_id),
            category_id: String(data[0].category_id),
            target: Number(data[0].target_amount),
            current: Number(data[0].current) || 0,
            start_date: data[0].start_date ? String(data[0].start_date) : null,
            end_date: data[0].end_date ? String(data[0].end_date) : null
          };
          
          setGoals([...goals, newGoal]);
        }
      }

      // Reset form
      setFormData({
        name: "",
        category: "",
        target: "",
      });
      setIsEditing(false);
      setCurrentGoal(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Bütçe hedefi oluşturma hatası:", error);
      toast.error("Bütçe hedefi oluşturulurken bir hata oluştu");
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
    try {
      const { error } = await supabase
        .from('budget_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      toast.success("Bütçe hedefi silindi");
      
      // Update local state
      setGoals(goals.filter(goal => goal.id !== goalId));
    } catch (error) {
      console.error("Bütçe hedefi silme hatası:", error);
      toast.error("Bütçe hedefi silinirken bir hata oluştu");
    }
  };

  const getProgressPercentage = (goal: BudgetGoal) => {
    const categoryId = goal.category_id;
    const spent = expenses[categoryId] || 0;
    const percentage = (spent / goal.target) * 100;
    
    // Limit percentage to 100% for display purposes
    return Math.min(percentage, 100);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Bilinmeyen Kategori';
  };

  const isPremiumEligible = () => {
    return subscriptionStatus === 'premium' || goals.length < 1;
  };

  if (loading || loadingSubscription) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Bütçe Hedefleri</h1>
          <p className="text-muted-foreground">
            Kategori bazlı harcama hedefleri oluşturun ve takip edin
          </p>
        </div>
        <Button 
          onClick={() => {
            // Free kullanıcı ve zaten 1 veya daha fazla hedef varsa engelle
            if (subscriptionStatus !== 'premium' && goals.length >= 1) {
              toast.error("Ücretsiz pakette maksimum 1 bütçe hedefi oluşturabilirsiniz. Premium paketimize geçerek sınırsız hedef oluşturabilirsiniz.");
              return;
            }
            
            setFormData({
              name: "",
              category: "",
              target: "",
            });
            setIsEditing(false);
            setCurrentGoal(null);
            setIsDialogOpen(true);
          }}
          disabled={loading || loadingSubscription || (subscriptionStatus !== 'premium' && goals.length >= 1)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Hedef
        </Button>
      </div>
      
      {/* Free kullanıcı için bilgilendirme mesajı */}
      {!loadingSubscription && subscriptionStatus !== 'premium' && (
        <div className="mb-6 bg-muted p-4 rounded-lg">
          <h3 className="font-medium flex items-center">
            <Target className="h-4 w-4 mr-2 text-primary" />
            Ücretsiz Paket Bilgisi
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Ücretsiz pakette maksimum 1 bütçe hedefi oluşturabilirsiniz. 
            {goals.length >= 1 ? " Şu anda maksimum hedef sayısına ulaştınız." : ""}
            {goals.length > 1 ? " Premium'dan ücretsiz pakete geçtiğiniz için mevcut hedefleriniz korunmuştur." : ""}
          </p>
          {goals.length >= 1 && (
            <div className="mt-2">
              <Link href="/dashboard/subscription">
                <Button variant="outline" size="sm">
                  Premium'a Yükselt
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
      
      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Henüz bütçe hedefi oluşturmadınız</h3>
            <p className="text-muted-foreground text-center max-w-md mt-1 mb-4">
              Bütçe hedefleri ile harcamalarınızı kategorilere göre sınırlandırabilir ve kontrolü elinizde tutabilirsiniz.
            </p>
            <Button 
              onClick={() => {
                setIsDialogOpen(true);
                setIsEditing(false);
                setFormData({
                  name: "",
                  category: "",
                  target: "",
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              İlk Bütçe Hedefini Oluştur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span>{goal.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditBudgetGoal(goal)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteBudgetGoal(goal.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  {getCategoryName(goal.category_id)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="mb-2">
                  <Progress value={getProgressPercentage(goal)} className="h-2" />
                </div>
                <div className="flex justify-between text-sm">
                  <span>
                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(expenses[goal.category_id] || 0)}
                  </span>
                  <span className="text-muted-foreground">
                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(goal.target)}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <div className="text-xs text-muted-foreground w-full">
                  {getProgressPercentage(goal) >= 100 ? (
                    <span className="text-destructive font-medium">Bütçe limitini aştınız!</span>
                  ) : getProgressPercentage(goal) >= 85 ? (
                    <span className="text-amber-500 dark:text-amber-400 font-medium">Bütçe limitine yaklaştınız!</span>
                  ) : (
                    <span>
                      Kalan:{" "}
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(goal.target - (expenses[goal.category_id] || 0))}
                    </span>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Bütçe Hedefini Düzenle" : "Yeni Bütçe Hedefi Oluştur"}</DialogTitle>
            <DialogDescription>
              Kategoriye özel bir bütçe limiti belirleyin
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
                placeholder="Aylık market harcaması"
              />
            </div>
            <div>
              <Label htmlFor="category">Kategori</Label>
              <Select value={formData.category} onValueChange={handleSelectChange}>
                <SelectTrigger id="category">
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
                placeholder="1000"
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
  );
}