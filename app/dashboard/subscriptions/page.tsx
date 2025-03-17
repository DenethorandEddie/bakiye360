"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/components/supabase-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { serviceIcons } from "../../components/ServiceIcons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React from "react";
import { FiPlusCircle } from "react-icons/fi";

interface Subscription {
  id: string;
  name: string;
  amount: number;
  payment_date: Date;
  description?: string;
  created_at: string;
  icon?: string;
}

interface SupabaseSubscription {
  id: string;
  name: string;
  amount: number;
  payment_date: string;
  description: string | null;
  created_at: string;
  icon: string | null;
  user_id: string;
}

export default function SubscriptionsPage() {
  const { supabase, user } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    payment_date: new Date(),
    description: "",
    icon: "",
  });
  const [customServiceName, setCustomServiceName] = useState("");
  const [showCustomServiceInput, setShowCustomServiceInput] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSubscriptions = async () => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('payment_date', { ascending: true });

        if (error) throw error;

        if (data) {
          const typedSubscriptions: Subscription[] = (data as unknown as SupabaseSubscription[]).map(sub => ({
            id: sub.id,
            name: sub.name,
            amount: Number(sub.amount),
            payment_date: new Date(sub.payment_date),
            description: sub.description || undefined,
            created_at: sub.created_at,
            icon: sub.icon || undefined
          }));
          setSubscriptions(typedSubscriptions);
        }
      } catch (error) {
        console.error("Abonelikler yüklenirken hata:", error);
        toast.error("Abonelikler yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [supabase, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Seçilen tarihi yerel saat dilimine göre ayarla
      const localDate = new Date(date);
      localDate.setHours(12, 0, 0, 0); // Günün ortasına ayarla (saat dilimi sorunlarını önlemek için)
      setFormData(prev => ({ ...prev, payment_date: localDate }));
    }
  };

  const handleServiceSelect = (value: string) => {
    setFormData(prev => ({
      ...prev,
      icon: value,
      name: value === "other" ? "" : serviceIcons[value as keyof typeof serviceIcons].name
    }));
    
    // Yeni servis seçildiğinde diğer alanları sıfırla
    if (value !== "other") {
      setCustomServiceName("");
      setShowCustomServiceInput(false);
      setFormData(prev => ({
        ...prev,
        amount: "",
        payment_date: new Date(),
        description: ""
      }));
    } else {
      setShowCustomServiceInput(true);
    }
  };

  const handleDialogOpen = (open: boolean) => {
    if (!open) {
      setFormData({
        name: "",
        amount: "",
        payment_date: new Date(),
        description: "",
        icon: "",
      });
      setCustomServiceName("");
      setShowCustomServiceInput(false);
      setIsEditing(false);
      setCurrentSubscription(null);
    }
    setIsDialogOpen(open);
  };

  const handleCreateSubscription = async () => {
    if (!formData.amount || !user?.id) {
      toast.error("Lütfen tutarı doldurun");
      return;
    }

    if (formData.icon === "other" && !customServiceName) {
      toast.error("Lütfen özel abonelik adını girin");
      return;
    }

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Geçerli bir tutar girin");
        return;
      }

      // Tarihi yerel saat dilimine göre ayarla
      const paymentDate = new Date(formData.payment_date);
      paymentDate.setHours(12, 0, 0, 0);
      
      const subscriptionName = formData.icon === "other" 
        ? customServiceName.charAt(0).toUpperCase() + customServiceName.slice(1)
        : serviceIcons[formData.icon as keyof typeof serviceIcons].name;
      
      const subscriptionData = {
        name: subscriptionName,
        amount: amount,
        payment_date: paymentDate.toISOString().split('T')[0], // YYYY-MM-DD formatında gönder
        description: formData.description || null,
        icon: formData.icon,
        user_id: user.id
      };

      if (isEditing && currentSubscription) {
        const { error } = await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', currentSubscription.id)
          .eq('user_id', user.id);

        if (error) {
          console.error("Güncelleme hatası:", error);
          throw error;
        }
        toast.success("Abonelik güncellendi");
      } else {
        const { error } = await supabase
          .from('subscriptions')
          .insert([subscriptionData])
          .select();

        if (error) {
          console.error("Ekleme hatası:", error);
          throw error;
        }
        toast.success("Yeni abonelik oluşturuldu");
      }

      setFormData({
        name: "",
        amount: "",
        payment_date: new Date(),
        description: "",
        icon: "",
      });
      setCustomServiceName("");
      setShowCustomServiceInput(false);
      setIsDialogOpen(false);
      setIsEditing(false);
      setCurrentSubscription(null);

      // Abonelikleri yeniden yükle
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: true });

      if (error) {
        console.error("Veri yükleme hatası:", error);
        throw error;
      }

      if (data) {
        const typedSubscriptions: Subscription[] = (data as unknown as SupabaseSubscription[]).map(sub => ({
          id: sub.id,
          name: sub.name,
          amount: Number(sub.amount),
          payment_date: new Date(sub.payment_date),
          description: sub.description || undefined,
          created_at: sub.created_at,
          icon: sub.icon || undefined
        }));
        setSubscriptions(typedSubscriptions);
      }
    } catch (error) {
      console.error("Abonelik oluşturma/güncelleme hatası:", error);
      toast.error("Abonelik kaydedilirken bir hata oluştu");
    }
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setCurrentSubscription(subscription);
    setFormData({
      name: subscription.name,
      amount: subscription.amount.toString(),
      payment_date: subscription.payment_date,
      description: subscription.description || "",
      icon: subscription.icon || "",
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (!window.confirm("Bu aboneliği silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', subscriptionId);

      if (error) throw error;

      setSubscriptions(subscriptions.filter(sub => sub.id !== subscriptionId));
      toast.success("Abonelik silindi");
    } catch (error) {
      console.error("Abonelik silme hatası:", error);
      toast.error("Abonelik silinirken bir hata oluştu");
    }
  };

  const getDaysUntilPayment = (paymentDate: Date) => {
    const today = new Date();
    const nextPayment = new Date(paymentDate);
    
    // Ayın gününü ayarla
    nextPayment.setFullYear(today.getFullYear());
    nextPayment.setMonth(today.getMonth());
    
    // Eğer ödeme günü geçtiyse, bir sonraki aya geç
    if (today.getDate() > nextPayment.getDate()) {
      nextPayment.setMonth(nextPayment.getMonth() + 1);
    }
    
    const diffTime = nextPayment.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // İkon seçeneklerini kategorilere ayır
  const iconCategories = {
    "Streaming & Eğlence": [
      "netflix", "spotify", "youtube", "disneyPlus", "amazonPrime", 
      "appleTv", "hboMax", "bluTv", "gain", "mubi", "twitch", 
      "deezer", "appleMusic"
    ],
    "Faturalar & Hizmetler": [
      "internet", "phone", "electricity", "water", "gas", "cableTv"
    ],
    "Finans & Sigorta": [
      "creditCard", "insurance"
    ],
    "Ulaşım": [
      "car", "bus", "train", "bike"
    ],
    "Ev & Yaşam": [
      "rent", "tools", "repair"
    ],
    "Eğlence & Hobiler": [
      "playstation", "xbox", "gym", "gaming", "books", "health"
    ],
    "Profesyonel Hizmetler": [
      "microsoft365", "adobe", "icloud", "googleOne", "zoom", 
      "linkedinPremium", "domainHosting"
    ],
    "Eğitim": [
      "udemy", "cambly", "chatgpt"
    ],
    "Diğer": [
      "coffee", "food", "clothing", "savings", "office", 
      "education", "calendar", "gift", "package", "other"
    ]
  };

  return (
    <div className="space-y-6 container mx-auto px-4 py-6 min-h-screen bg-gradient-to-b from-background to-background/40">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Abonelikler
          </h1>
          <p className="text-muted-foreground/80 mt-1">
            Düzenli ödemelerinizi ve aboneliklerinizi takip edin
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="px-6 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
              <Plus className="w-5 h-5 mr-2" />
              Yeni Abonelik
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Aboneliği Düzenle" : "Yeni Abonelik"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Mevcut aboneliği güncelleyin"
                  : "Yeni bir abonelik ekleyin"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="icon">Abonelik Türü</Label>
                <Select onValueChange={handleServiceSelect} value={formData.icon}>
                  <SelectTrigger>
                    <SelectValue placeholder="Servis seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(serviceIcons).map(([key, service]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {service.component}
                          {service.name}
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="other">
                      <div className="flex items-center gap-2">
                        <FiPlusCircle className="w-5 h-5" />
                        Diğer
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {showCustomServiceInput && (
                <div>
                  <Label htmlFor="customServiceName">Özel Abonelik Adı</Label>
                  <Input
                    id="customServiceName"
                    name="customServiceName"
                    value={customServiceName}
                    onChange={(e) => setCustomServiceName(e.target.value)}
                    placeholder="Özel abonelik adını girin"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="amount">Aylık Tutar (₺)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="payment_date">Ödeme Günü</Label>
                <DatePicker
                  date={formData.payment_date}
                  setDate={handleDateChange}
                />
              </div>
              <div>
                <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Abonelik hakkında notlar..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleCreateSubscription}>
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
            <p className="text-muted-foreground animate-pulse">Abonelikler yükleniyor...</p>
          </div>
        </div>
      ) : subscriptions.length === 0 ? (
        <Card className="w-full max-w-2xl mx-auto shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-card to-card/95">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Henüz abonelik yok</CardTitle>
            <CardDescription>
              Düzenli ödemelerinizi takip etmek için abonelikler ekleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-primary/5">
                <AlertCircle className="w-16 h-16 text-muted-foreground" />
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleDialogOpen(true)}
                className="mt-4 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2" />
                İlk Aboneliği Ekle
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Toplam İstatistikler */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-background/60 backdrop-blur-sm shadow-inner hover:shadow-md transition-all duration-300 border border-border/50">
                  <p className="text-sm font-medium text-muted-foreground">Toplam Abonelik</p>
                  <p className="text-2xl font-bold mt-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {subscriptions.length}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/60 backdrop-blur-sm shadow-inner hover:shadow-md transition-all duration-300 border border-border/50">
                  <p className="text-sm font-medium text-muted-foreground">Aylık Toplam</p>
                  <p className="text-2xl font-bold mt-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {subscriptions.reduce((sum, sub) => sum + sub.amount, 0).toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: 'TRY'
                    })}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/60 backdrop-blur-sm shadow-inner hover:shadow-md transition-all duration-300 border border-border/50">
                  <p className="text-sm font-medium text-muted-foreground">Yaklaşan Ödemeler</p>
                  <p className="text-2xl font-bold mt-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {subscriptions.filter(sub => getDaysUntilPayment(sub.payment_date) <= 3).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kategorilere Göre Abonelikler */}
          {Object.entries(iconCategories).map(([category, icons]) => {
            const categorySubscriptions = subscriptions.filter(
              sub => sub.icon && icons.includes(sub.icon)
            );

            if (categorySubscriptions.length === 0) return null;

            return (
              <div key={category} className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight pl-1 border-l-4 border-primary/50 ml-1">
                  {category}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categorySubscriptions.map((subscription) => {
                    const service = subscription.icon ? serviceIcons[subscription.icon as keyof typeof serviceIcons] : null;
                    const daysUntilPayment = getDaysUntilPayment(subscription.payment_date);
                    const isPaymentSoon = daysUntilPayment <= 3;
                    const isPaymentToday = daysUntilPayment === 0;

                    return (
                      <Card 
                        key={subscription.id} 
                        className={cn(
                          "transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm shadow-lg hover:shadow-xl",
                          isPaymentToday 
                            ? "border-2 border-red-500 dark:border-red-400" 
                            : isPaymentSoon 
                              ? "border-2 border-yellow-500 dark:border-yellow-400" 
                              : "hover:border-primary/50"
                        )}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              {service?.component && (
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 shadow-inner dark:bg-gray-800/60 dark:from-gray-800 dark:to-gray-800/90">
                                  <span className="[&>svg]:w-6 [&>svg]:h-6 [&>svg]:transition-transform [&>svg]:duration-300 hover:[&>svg]:scale-110 [&>svg]:text-foreground">
                                    {service.component}
                                  </span>
                                </div>
                              )}
                              <div>
                                <CardTitle className="text-lg font-semibold text-foreground">
                                  {subscription.name}
                                </CardTitle>
                                {subscription.description && (
                                  <CardDescription className="mt-1 line-clamp-1">
                                    {subscription.description}
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-primary/10 transition-colors duration-300"
                                onClick={() => handleEditSubscription(subscription)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-300"
                                onClick={() => handleDeleteSubscription(subscription.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-2 rounded-lg bg-primary/5">
                              <span className="text-sm text-muted-foreground">Aylık Tutar</span>
                              <span className="font-semibold text-foreground">
                                {subscription.amount.toLocaleString('tr-TR', {
                                  style: 'currency',
                                  currency: 'TRY'
                                })}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded-lg bg-primary/5">
                              <span className="text-sm text-muted-foreground">Ödeme Günü</span>
                              <span className="font-semibold text-foreground">
                                Her ayın {subscription.payment_date.getDate()}. günü
                              </span>
                            </div>
                            <div className={cn(
                              "mt-3 p-2.5 rounded-lg text-sm text-center font-medium transition-all duration-300",
                              isPaymentToday 
                                ? "border-2 border-red-500 dark:border-red-400 text-red-800 dark:text-red-300" 
                                : isPaymentSoon 
                                  ? "border-2 border-yellow-500 dark:border-yellow-400 text-yellow-800 dark:text-yellow-300" 
                                  : "border-2 border-green-500 dark:border-green-400 text-green-800 dark:text-green-300"
                            )}>
                              {isPaymentToday ? (
                                "Bugün ödeme günü!"
                              ) : isPaymentSoon ? (
                                `${daysUntilPayment} gün sonra ödeme günü`
                              ) : (
                                `${daysUntilPayment} gün sonra ödenecek`
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 