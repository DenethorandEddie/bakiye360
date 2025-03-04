"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ReloadIcon } from "@radix-ui/react-icons";
import { Checkbox } from '@/components/ui/checkbox';

// Basit bir bildirim bileşeni
const Notification = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = 
    type === 'success' ? 'bg-green-100 border-green-500 text-green-800' :
    type === 'error' ? 'bg-red-100 border-red-500 text-red-800' :
    'bg-blue-100 border-blue-500 text-blue-800';

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-md border-l-4 shadow-md ${bgColor} max-w-md animate-fade-in`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">{type === 'success' ? 'Başarılı' : type === 'error' ? 'Hata' : 'Bilgi'}</p>
          <p className="text-sm mt-1">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ×
        </button>
      </div>
    </div>
  );
};

// State için tanımlamaları oluşturalım
type NotificationType = 'success' | 'error' | 'info' | 'warning';
type Notification = {
  message: string;
  type: NotificationType;
} | null;

type User = {
  id: string;
  email: string;
  created_at: string;
};

type Payment = {
  id: string;
  description: string;
  category: string;
  amount: number;
  due_date: string;
  status: string;
};

export default function RealDataTestPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);
  const [daysRange, setDaysRange] = useState(7);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectAll, setSelectAll] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [notification, setNotification] = useState<Notification>(null);
  const [error, setError] = useState<string | null>(null);

  // Bildirim göster
  const showNotification = (notification: Notification) => {
    if (!notification) return null;

    const bgColors = {
      success: 'bg-green-50 border-green-500 text-green-700',
      error: 'bg-red-50 border-red-500 text-red-700',
      info: 'bg-blue-50 border-blue-500 text-blue-700',
      warning: 'bg-yellow-50 border-yellow-500 text-yellow-700'
    };

    return (
      <div className={`p-4 mb-4 rounded-md border ${bgColors[notification.type]} animate-fade-in`}>
        {notification.message}
      </div>
    );
  };

  // Bildirim kapat
  const closeNotification = () => {
    setNotification(null);
  };

  // Kullanıcı listesini getir
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/users/list');
        if (!response.ok) throw new Error('Kullanıcılar getirilemedi');
        
        const data = await response.json();
        
        if (data.users && data.users.length > 0) {
          setUsers(data.users);
        } else {
          // Kullanıcı listesi boşsa test kullanıcıları ekleyelim
          console.log('Kullanıcı listesi boş, test kullanıcıları ekleniyor');
          setUsers([
            { id: 'test-1', email: 'test@bakiye360.com', created_at: new Date().toISOString() },
            { id: 'test-2', email: 'demo@bakiye360.com', created_at: new Date().toISOString() },
            { id: 'test-3', email: 'ornek@bakiye360.com', created_at: new Date().toISOString() }
          ]);
        }
      } catch (error) {
        console.error('Kullanıcıları getirirken hata:', error);
        showNotification({
          type: 'error',
          message: 'Kullanıcıları getirirken bir hata oluştu, test kullanıcıları gösteriliyor.'
        });
        
        // Hata durumunda test kullanıcıları gösterelim
        setUsers([
          { id: 'test-1', email: 'test@bakiye360.com', created_at: new Date().toISOString() },
          { id: 'test-2', email: 'demo@bakiye360.com', created_at: new Date().toISOString() },
          { id: 'test-3', email: 'ornek@bakiye360.com', created_at: new Date().toISOString() }
        ]);
      } finally {
        setLoadingUsers(false);
      }
    }

    fetchUsers();
  }, []);

  // Kullanıcı değiştiğinde ödemeleri getir
  useEffect(() => {
    if (userId) {
      handleFetchPayments();
    } else {
      setPayments([]);
    }
  }, [userId, daysRange]);

  // Ödemeleri getir
  const handleFetchPayments = async () => {
    if (!userId) {
      setNotification({
        type: 'error',
        message: 'Lütfen bir kullanıcı seçin!'
      });
      return;
    }

    setLoading(true);
    setPayments([]);
    setError(null);

    try {
      const response = await fetch(`/api/payments/upcoming?userId=${userId}&days=${daysRange}`);
      const data = await response.json();

      if (data.success) {
        setPayments(data.payments);
        
        // Kullanıcının e-postasını al
        const selectedUser = users.find(u => u.id === userId);
        if (selectedUser) {
          setUserEmail(selectedUser.email || '');
        }
        
        if (data.meta?.isTestData) {
          setNotification({
            type: 'warning',
            message: 'Seçilen kullanıcı için gerçek ödeme bulunamadı. Test verileri gösteriliyor.'
          });
        } else {
          setNotification({
            type: 'success',
            message: `${data.payments.length} ödeme başarıyla yüklendi!`
          });
        }
      } else {
        throw new Error(data.error || 'Ödemeler yüklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Ödemeleri getirirken hata:', error);
      setError('Ödemeler yüklenirken bir hata oluştu');
      setNotification({
        type: 'error',
        message: 'Ödemeler yüklenirken bir hata oluştu!'
      });
    } finally {
      setLoading(false);
    }
  };

  // Bir ödemeyi seç/kaldır
  const togglePaymentSelection = (paymentId: string) => {
    setSelectedPaymentIds(prev => {
      if (prev.includes(paymentId)) {
        return prev.filter(id => id !== paymentId);
      } else {
        return [...prev, paymentId];
      }
    });
  };

  // Tüm ödemeleri seç/kaldır
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedPaymentIds([]);
    } else {
      setSelectedPaymentIds(payments.map(p => p.id));
    }
    setSelectAll(!selectAll);
  };

  // Seçili ödemeler için test e-postası gönder
  const sendTestEmail = async () => {
    if (selectedPaymentIds.length === 0 || !userEmail) {
      showNotification({
        type: 'error',
        message: 'Lütfen en az bir ödeme seçin ve e-posta adresi girin.'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Seçili ödemeleri filtrele
      const selectedPayments = payments.filter(p => selectedPaymentIds.includes(p.id));
      
      const response = await fetch("/api/test/manual-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          payments: selectedPayments
        })
      });

      const data = await response.json();
      setResult(data);

      if (response.ok) {
        showNotification({
          type: 'success',
          message: `${selectedPayments.length} ödeme için bildirim e-postası gönderildi.`
        });
      } else {
        showNotification({
          type: 'error',
          message: data.message || data.error || "Bildirim gönderilemedi."
        });
      }
    } catch (error) {
      console.error('Test e-postası gönderirken hata:', error);
      showNotification({
        type: 'error',
        message: 'İşlem sırasında bir sorun oluştu.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10">
      {notification && showNotification(notification)}

      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>Gerçek Veri ile Bildirim Testi</CardTitle>
          <CardDescription>
            Veritabanındaki gerçek ödemeler ile test bildirimler gönderin.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid gap-6">
            {/* Kullanıcı ve Tarih Aralığı Seçimi */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-select">Kullanıcı Seçin</Label>
                <Select 
                  value={userId} 
                  onValueChange={setUserId}
                  disabled={loadingUsers}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kullanıcı seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email || user.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-posta Adresi</Label>
                <Input
                  id="email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="E-posta adresi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="days-range">Gün Aralığı</Label>
                <Select 
                  value={String(daysRange)} 
                  onValueChange={(value) => setDaysRange(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kaç günlük ödemeleri göster" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Gün (Sadece Yarın)</SelectItem>
                    <SelectItem value="3">3 Gün</SelectItem>
                    <SelectItem value="7">7 Gün (Bir Hafta)</SelectItem>
                    <SelectItem value="14">14 Gün (İki Hafta)</SelectItem>
                    <SelectItem value="30">30 Gün (Bir Ay)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Ödemeler Tablosu */}
            {userId ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Yaklaşan Ödemeler</h3>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="select-all" 
                      checked={selectAll}
                      onCheckedChange={toggleSelectAll}
                    />
                    <Label htmlFor="select-all">Tümünü Seç</Label>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Ödemeler yükleniyor...</div>
                ) : payments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Seç</TableHead>
                        <TableHead>Açıklama</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Tutar</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Durum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <Switch 
                              checked={selectedPaymentIds.includes(payment.id)}
                              onCheckedChange={() => togglePaymentSelection(payment.id)}
                            />
                          </TableCell>
                          <TableCell>{payment.description || 'Belirtilmemiş'}</TableCell>
                          <TableCell>{payment.category || 'Kategorisiz'}</TableCell>
                          <TableCell>{payment.amount.toFixed(2)} ₺</TableCell>
                          <TableCell>
                            {format(new Date(payment.due_date), 'd MMM yyyy', { locale: tr })}
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                              {payment.status || 'beklemede'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableCaption>
                      {selectedPaymentIds.length} / {payments.length} ödeme seçildi
                    </TableCaption>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {daysRange} gün içinde yaklaşan ödeme bulunamadı.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                Ödemeleri görmek için lütfen bir kullanıcı seçin.
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleFetchPayments}
            disabled={!userId || loading}
          >
            {loading ? (
              <>
                <span className="mr-2">↻</span> Yükleniyor
              </>
            ) : (
              <>
                <span className="mr-2">↻</span> Ödemeleri Getir
              </>
            )}
          </Button>
          <Button 
            onClick={sendTestEmail} 
            disabled={loading || selectedPaymentIds.length === 0 || !userEmail}
          >
            {loading ? "Gönderiliyor..." : "Seçili Ödemeler İçin Bildirim Gönder"}
          </Button>
        </CardFooter>

        {result && (
          <div className="px-6 py-2 mb-4">
            <div className="bg-primary/15 text-primary p-3 rounded-md">
              <pre className="whitespace-pre-wrap overflow-auto text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
} 