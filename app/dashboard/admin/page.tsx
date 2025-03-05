"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/components/supabase-provider";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { 
  Users, Mail, Settings, Database, BarChart, TrendingUp, 
  ShieldCheck, Bell, HelpCircle, Search, Loader2, UserPlus, 
  MailPlus, ExternalLink, Activity, Percent, AlertTriangle,
  FileText, Home, Server, DollarSign, User, CheckCircle
} from "lucide-react";

// Chart component for system metrics
const MetricsChart = ({ data, title }: { data: any[], title: string }) => {
  return (
    <div className="h-[180px] p-2 flex flex-col">
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      <div className="w-full h-full bg-secondary/20 rounded-md overflow-hidden relative">
        <div className="absolute inset-0 p-2 flex items-end">
          {data.map((item, i) => (
            <div 
              key={i} 
              className="flex-1 mx-0.5"
              style={{ height: `${item.value}%` }}
            >
              <div 
                className="w-full h-full rounded-sm" 
                style={{ backgroundColor: item.color }}
              ></div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between mt-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center">
            <span 
              className="w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: item.color }}
            ></span>
            <span className="text-xs">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { supabase, user } = useSupabase();

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    emailSubscribers: 0,
    totalTransactions: 0,
    totalIncome: 0,
    totalExpense: 0,
    loading: true
  });

  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  // Sample chart data - would be replaced by real data in production
  const userActivityData = [
    { name: 'Mon', value: 60, color: '#4f46e5' },
    { name: 'Tue', value: 45, color: '#4f46e5' },
    { name: 'Wed', value: 80, color: '#4f46e5' },
    { name: 'Thu', value: 65, color: '#4f46e5' },
    { name: 'Fri', value: 70, color: '#4f46e5' },
    { name: 'Sat', value: 40, color: '#4f46e5' },
    { name: 'Sun', value: 30, color: '#4f46e5' },
  ];

  const transactionData = [
    { name: 'Gelir', value: 35, color: '#10b981' },
    { name: 'Gider', value: 65, color: '#ef4444' },
    { name: 'Diğer', value: 20, color: '#f59e0b' },
  ];

  useEffect(() => {
    if (!user) {
      // Redirect to landing page if user is not logged in
      window.location.href = '/';
    }
  }, [user]);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch user statistics
        const [usersResponse, subscribersResponse, transactionsResponse] = await Promise.all([
          // Total users
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          
          // Email subscribers
          supabase.from('profiles').select('id', { count: 'exact', head: true })
            .eq('email_notifications', true),
            
          // Total transactions
          supabase.from('transactions').select('id', { count: 'exact', head: true })
        ]);
        
        // Fetch sum of income and expenses (this would be adjusted based on your schema)
        const { data: incomeData } = await supabase
          .from('transactions')
          .select('amount')
          .eq('type', 'income')
          .gt('amount', 0);

        const { data: expenseData } = await supabase
          .from('transactions')
          .select('amount')
          .eq('type', 'expense')
          .gt('amount', 0);

        const totalIncome = incomeData?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
        const totalExpense = expenseData?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
        
        setStats({
          totalUsers: usersResponse.count || 0,
          activeUsers: Math.floor((usersResponse.count || 0) * 0.7), // Simulated active users (70%)
          emailSubscribers: subscribersResponse.count || 0,
          totalTransactions: transactionsResponse.count || 0,
          totalIncome,
          totalExpense,
          loading: false
        });
      } catch (error) {
        console.error("İstatistikler alınırken hata:", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    }
    
    async function fetchRecentUsers() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) throw error;
        setRecentUsers(data || []);
      } catch (error) {
        console.error("Kullanıcılar alınırken hata:", error);
      } finally {
        setUsersLoading(false);
      }
    }

    async function fetchRecentTransactions() {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*, profiles(full_name)')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) throw error;
        setRecentTransactions(data || []);
      } catch (error) {
        console.error("İşlemler alınırken hata:", error);
      } finally {
        setTransactionsLoading(false);
      }
    }
    
    fetchStats();
    fetchRecentUsers();
    fetchRecentTransactions();
  }, [supabase]);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      // Redirect to landing page upon successful logout
      window.location.href = '/';
    } else {
      console.error('Error during logout:', error);
    }
  }

  // CSS for maintaining image aspect ratio
  const imageStyle = {
    width: 'auto',
    height: 'auto'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yönetici Paneli</h1>
          <p className="text-muted-foreground">
            Bakiye360 platformunun tüm verilerine ve yönetim fonksiyonlarına buradan erişebilirsiniz.
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button size="sm" variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Rapor İndir
          </Button>
          <Button size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Sistem Ayarları
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats.loading ? (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>İstatistikler yükleniyor...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <span className="text-green-500 font-medium">+5%</span> geçen aya göre
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aktif Kullanıcılar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <div className="p-2 bg-green-100 rounded-full">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Toplam kullanıcıların {Math.round((stats.activeUsers / stats.totalUsers) * 100) || 0}%'i aktif
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">₺{stats.totalIncome.toLocaleString()}</div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.totalTransactions} işlemden toplam gelir
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">₺{stats.totalExpense.toLocaleString()}</div>
                <div className="p-2 bg-amber-100 rounded-full">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <span className="text-green-500 font-medium">+12%</span> geçen aya göre
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
          <TabsTrigger value="transactions">İşlemler</TabsTrigger>
          <TabsTrigger value="system">Sistem</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Sistem Özeti</CardTitle>
                <CardDescription>
                  Bakiye360 sisteminin genel durumu ve ana metrikleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Kullanıcı Aktivitesi</h3>
                      <MetricsChart 
                        data={userActivityData} 
                        title="Haftalık Kullanıcı Aktivitesi"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">İşlem Dağılımı</h3>
                      <MetricsChart 
                        data={transactionData} 
                        title="İşlem Tipi Dağılımı"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Sistem Kullanımı</span>
                        <span className="font-medium">68%</span>
                      </div>
                      <Progress value={68} className="h-2 mt-1" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Depolama Alanı</span>
                        <span className="font-medium">42%</span>
                      </div>
                      <Progress value={42} className="h-2 mt-1" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span>API Kullanımı</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <Progress value={85} className="h-2 mt-1" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  Detaylı Sistem Raporu
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Son Aktiviteler</CardTitle>
                <CardDescription>
                  Sistemdeki son yapılan değişiklikler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="p-2 bg-blue-100 rounded-full h-fit">
                      <UserPlus className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Yeni kullanıcı kaydoldu</p>
                      <p className="text-xs text-muted-foreground">15 dakika önce</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="p-2 bg-green-100 rounded-full h-fit">
                      <Settings className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Sistem ayarları güncellendi</p>
                      <p className="text-xs text-muted-foreground">2 saat önce</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="p-2 bg-amber-100 rounded-full h-fit">
                      <Mail className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">E-posta kampanyası gönderildi</p>
                      <p className="text-xs text-muted-foreground">5 saat önce</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="p-2 bg-purple-100 rounded-full h-fit">
                      <Bell className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Sistem bildirimi oluşturuldu</p>
                      <p className="text-xs text-muted-foreground">1 gün önce</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  Tüm Aktiviteleri Görüntüle
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Son Eklenen Kullanıcılar</CardTitle>
                <CardDescription>
                  Sisteme en son kayıt olan kullanıcılar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span className="text-sm">Kullanıcılar yükleniyor...</span>
                  </div>
                ) : recentUsers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Henüz kullanıcı kaydı bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || 'User'} />
                            <AvatarFallback>{(user.full_name || 'U')[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.full_name || 'İsimsiz Kullanıcı'}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <Badge variant={user.email_confirmed ? "outline" : "secondary"}>
                          {user.email_confirmed ? "Onaylı" : "Bekliyor"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/dashboard/admin/users">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Tüm Kullanıcıları Görüntüle
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Son İşlemler</CardTitle>
                <CardDescription>
                  Sistemde gerçekleşen son finansal işlemler
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span className="text-sm">İşlemler yükleniyor...</span>
                  </div>
                ) : recentTransactions.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Henüz işlem kaydı bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{transaction.description || 'İsimsiz İşlem'}</p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.profiles?.full_name || 'İsimsiz Kullanıcı'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'income' ? '+' : '-'}₺{transaction.amount?.toLocaleString() || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/dashboard/admin/transactions">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Tüm İşlemleri Görüntüle
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Kullanıcı Yönetimi</CardTitle>
                <CardDescription>
                  Sistemdeki kullanıcıları yönetin ve yetkilerini düzenleyin
                </CardDescription>
              </div>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Yeni Kullanıcı
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Kullanıcı ara..."
                    className="pl-8 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kullanıcı</TableHead>
                      <TableHead>E-posta</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : recentUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">Kullanıcı bulunamadı</TableCell>
                      </TableRow>
                    ) : (
                      recentUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || 'User'} />
                                <AvatarFallback>{(user.full_name || 'U')[0]}</AvatarFallback>
                              </Avatar>
                              <div>{user.full_name || 'İsimsiz Kullanıcı'}</div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.role || 'user'}</TableCell>
                          <TableCell>
                            <Badge variant={user.email_confirmed ? "outline" : "secondary"}>
                              {user.email_confirmed ? "Onaylı" : "Bekliyor"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">Düzenle</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm">Önceki</Button>
              <Button variant="outline" size="sm">Sonraki</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>İşlem Yönetimi</CardTitle>
              <CardDescription>
                Sistemdeki tüm finansal işlemleri görüntüleyin ve yönetin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="İşlem ara..."
                    className="pl-8 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Dışa Aktar
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Açıklama</TableHead>
                      <TableHead>Kullanıcı</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : recentTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">İşlem bulunamadı</TableCell>
                      </TableRow>
                    ) : (
                      recentTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.description || 'İsimsiz İşlem'}</TableCell>
                          <TableCell>{transaction.profiles?.full_name || 'İsimsiz Kullanıcı'}</TableCell>
                          <TableCell>{transaction.category || 'Genel'}</TableCell>
                          <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'income' ? '+' : '-'}₺{transaction.amount?.toLocaleString() || 0}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm">Önceki</Button>
              <Button variant="outline" size="sm">Sonraki</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="system">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sistem Durumu</CardTitle>
                <CardDescription>
                  Sistemin şu anki durumu ve performans göstergeleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Veritabanı Bağlantısı</span>
                    </div>
                    <span className="text-green-500 font-medium">Aktif</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>API Servisleri</span>
                    </div>
                    <span className="text-green-500 font-medium">Aktif</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Email Servisi</span>
                    </div>
                    <span className="text-green-500 font-medium">Aktif</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span>Arkaplan İşleri</span>
                    </div>
                    <span className="text-amber-500 font-medium">Kısmen Aktif</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span>CPU Kullanımı</span>
                        <span className="font-medium">42%</span>
                      </div>
                      <Progress value={42} className="h-2 mt-1" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Bellek Kullanımı</span>
                        <span className="font-medium">68%</span>
                      </div>
                      <Progress value={68} className="h-2 mt-1" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Disk Kullanımı</span>
                        <span className="font-medium">35%</span>
                      </div>
                      <Progress value={35} className="h-2 mt-1" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  Sistem Yenile
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Bakım & Güvenlik</CardTitle>
                <CardDescription>
                  Sistem bakım ve güvenlik durumu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-md p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Otomatik Yedekleme</div>
                      <div className="bg-green-100 text-green-600 text-xs font-medium px-2 py-1 rounded">Aktif</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Son yedekleme: 2 saat önce
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Bakım Modu</div>
                      <div className="bg-red-100 text-red-600 text-xs font-medium px-2 py-1 rounded">Kapalı</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Sistem şu anda tüm kullanıcılara açık
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Güvenlik Taraması</div>
                      <div className="bg-green-100 text-green-600 text-xs font-medium px-2 py-1 rounded">Tamamlandı</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Son tarama: 1 gün önce
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Sistem Güncellemesi</div>
                      <div className="bg-amber-100 text-amber-600 text-xs font-medium px-2 py-1 rounded">Bekliyor</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Yeni versiyon mevcut: v1.5.2
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button size="sm" className="w-full">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Güvenlik Taraması Başlat
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}