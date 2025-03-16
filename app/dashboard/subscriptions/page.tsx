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

interface Subscription {
  id: string;
  name: string;
  amount: number;
  payment_date: Date;
  description?: string;
  created_at: string;
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
  });

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
          const typedSubscriptions: Subscription[] = data.map(sub => ({
            id: String(sub.id),
            name: String(sub.name),
            amount: Number(sub.amount),
            payment_date: new Date(sub.payment_date),
            description: sub.description,
            created_at: sub.created_at
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
      setFormData(prev => ({ ...prev, payment_date: date }));
    }
  };

  const handleCreateSubscription = async () => {
    if (!formData.name || !formData.amount) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Geçerli bir tutar girin");
        return;
      }

      if (isEditing && currentSubscription) {
        const { error } = await supabase
          .from('subscriptions')
          .update({
            name: formData.name,
            amount: amount,
            payment_date: formData.payment_date.toISOString().split('T')[0],
            description: formData.description
          })
          .eq('id', currentSubscription.id);

        if (error) throw error;
        toast.success("Abonelik güncellendi");
      } else {
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user?.id,
            name: formData.name,
            amount: amount,
            payment_date: formData.payment_date.toISOString().split('T')[0],
            description: formData.description
          });

        if (error) throw error;
        toast.success("Yeni abonelik oluşturuldu");
      }

      setFormData({
        name: "",
        amount: "",
        payment_date: new Date(),
        description: "",
      });
      setIsDialogOpen(false);
      setIsEditing(false);
      setCurrentSubscription(null);

      // Abonelikleri yeniden yükle
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .order('payment_date', { ascending: true });

      if (error) throw error;

      if (data) {
        const typedSubscriptions: Subscription[] = data.map(sub => ({
          id: String(sub.id),
          name: String(sub.name),
          amount: Number(sub.amount),
          payment_date: new Date(sub.payment_date),
          description: sub.description,
          created_at: sub.created_at
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Abonelikler</h1>
          <p className="text-sm text-muted-foreground">
            Düzenli ödemelerinizi ve aboneliklerinizi takip edin
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
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
                <Label htmlFor="name">Abonelik Adı</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Netflix, Spotify, vb."
                />
              </div>
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
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
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
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      ) : subscriptions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Henüz abonelik yok</CardTitle>
            <CardDescription>
              Düzenli ödemelerinizi takip etmek için abonelikler ekleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              İlk Aboneliği Ekle
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((subscription) => {
            const daysUntilPayment = getDaysUntilPayment(subscription.payment_date);
            const isPaymentSoon = daysUntilPayment <= 3;
            const isPaymentToday = daysUntilPayment === 0;
            
            return (
              <Card key={subscription.id} className={cn(
                isPaymentToday ? "border-red-500" :
                isPaymentSoon ? "border-yellow-500" : ""
              )}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{subscription.name}</CardTitle>
                      <CardDescription>
                        {subscription.description || "Açıklama yok"}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditSubscription(subscription)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSubscription(subscription.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Aylık Tutar</span>
                      <span className="font-medium">
                        {subscription.amount.toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Ödeme Günü</span>
                      <span className="font-medium">
                        Her ayın {subscription.payment_date.getDate()}. günü
                      </span>
                    </div>
                    <div className={cn(
                      "mt-4 p-2 rounded-md text-sm",
                      isPaymentToday ? "bg-red-100 text-red-800" :
                      isPaymentSoon ? "bg-yellow-100 text-yellow-800" :
                      "bg-green-100 text-green-800"
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
      )}
    </div>
  );
} 