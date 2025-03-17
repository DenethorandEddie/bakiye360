"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/components/supabase-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, ArrowUpRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { serviceIcons } from "@/app/components/ServiceIcons";

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

export default function SubscriptionsWidget() {
  const { supabase, user } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [totalMonthlyAmount, setTotalMonthlyAmount] = useState(0);
  const [totalSubscriptionsCount, setTotalSubscriptionsCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Önce toplam abonelik tutarını ve sayısını öğrenmek için tüm abonelikleri getir
        const { data: allData, error: totalError } = await supabase
          .from('subscriptions')
          .select('amount')
          .eq('user_id', user.id);

        if (totalError) throw totalError;

        if (allData) {
          // Toplam tutarı hesapla
          const total = allData.reduce((sum, sub) => sum + Number(sub.amount), 0);
          setTotalMonthlyAmount(total);
          setTotalSubscriptionsCount(allData.length);
        }

        // Yaklaşan ödemeleri görüntülemek için en yakın 5 aboneliği getir
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('payment_date', { ascending: true })
          .limit(5);

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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, user]);

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

  const upcomingSubscriptions = subscriptions
    .filter(sub => getDaysUntilPayment(sub.payment_date) <= 7)
    .sort((a, b) => getDaysUntilPayment(a.payment_date) - getDaysUntilPayment(b.payment_date));

  return (
    <Card className="shadow-md hover:shadow-xl transition-all duration-300 bg-card border-border/80">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-semibold text-foreground">Abonelikler</CardTitle>
          <CardDescription className="text-xs text-muted-foreground/90">Aktif abonelikleriniz</CardDescription>
        </div>
        <CalendarClock className="h-4 w-4 text-primary/80" />
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground/90">
              Aylık Toplam
            </div>
            <div className="text-xl font-bold mt-0.5 text-foreground">
              {totalMonthlyAmount.toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY'
              })}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground/90">
              Toplam Abonelik
            </div>
            <div className="text-xl font-bold mt-0.5 text-foreground">
              {totalSubscriptionsCount}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary shadow-[0_0_10px_rgba(var(--primary)/_0.2)]"></div>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 space-y-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground text-center">
              Henüz abonelik eklenmemiş
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mt-2">
              <h3 className="text-sm font-semibold text-foreground">Yaklaşan Ödemeler</h3>
              {upcomingSubscriptions.length > 0 ? (
                upcomingSubscriptions.slice(0, 3).map((subscription) => {
                  const service = subscription.icon ? serviceIcons[subscription.icon as keyof typeof serviceIcons] : null;
                  const daysUntilPayment = getDaysUntilPayment(subscription.payment_date);
                  const isPaymentToday = daysUntilPayment === 0;

                  return (
                    <div 
                      key={subscription.id} 
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg transition-all duration-300",
                        isPaymentToday 
                          ? "border-2 border-red-500 dark:border-red-400 shadow-sm" 
                          : "bg-background hover:bg-primary/5 border border-border/60 shadow-sm"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {service?.component && (
                          <div className="p-1.5 rounded-md bg-primary/10 shadow-inner dark:bg-gray-800">
                            <span className="[&>svg]:w-4 [&>svg]:h-4 [&>svg]:text-foreground/90">{service.component}</span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {subscription.name}
                          </p>
                          <p className="text-xs text-muted-foreground/90">
                            {isPaymentToday ? (
                              <span className="font-medium text-red-600 dark:text-red-400">Bugün ödeme günü!</span>
                            ) : (
                              `${daysUntilPayment} gün sonra`
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {subscription.amount.toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY'
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground/90 py-2 bg-background/80 px-3 rounded border border-border/30">
                  7 gün içinde yaklaşan ödeme bulunmuyor
                </p>
              )}
            </div>

            <div className="pt-3 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs hover:bg-primary/5 border-border/60 text-foreground"
                asChild
              >
                <Link href="/dashboard/subscriptions">
                  Tüm Abonelikleri Görüntüle
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 