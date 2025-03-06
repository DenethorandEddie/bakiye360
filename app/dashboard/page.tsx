"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/components/supabase-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, Sector, Area, AreaChart, RadialBarChart, RadialBar, ReferenceLine } from "recharts";
import { Progress } from "@/components/ui/progress";
import { format, subMonths, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { ArrowUpRight, ArrowDownRight, Plus, Wallet, Target, TrendingUp, CreditCard, Loader2, Calendar, DollarSign, BarChart3, PieChart as PieChartIcon, ArrowUp, ArrowDown, PercentIcon, TrendingDown, MinusIcon, ShieldCheck } from "lucide-react";
import Link from "next/link";

// Grafik renkleri - daha profesyonel ve uyumlu renkler
const COLORS = [
  'hsl(var(--chart-1))', 
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))', 
  'hsl(var(--chart-4))', 
  'hsl(var(--chart-5))'
];

// Aktif dilim için render fonksiyonu
const renderActiveShape = (props: any) => {
  const { 
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value, name
  } = props;

  // Küçük ekranlarda daha küçük yazı boyutları
  const isMobile = window.innerWidth < 768;
  const titleSize = isMobile ? '14px' : '16px';
  const valueSize = isMobile ? '18px' : '22px';
  const percentSize = isMobile ? '12px' : '14px';

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <text 
        x={cx} 
        y={cy} 
        dy={-20} 
        textAnchor="middle" 
        fill={fill}
        style={{ fontWeight: 'bold', fontSize: titleSize }}
      >
        {name}
      </text>
      <text 
        x={cx} 
        y={cy} 
        textAnchor="middle" 
        fill={fill}
        style={{ fontSize: valueSize, fontWeight: 'bold' }}
      >
        ₺{value.toLocaleString('tr-TR')}
      </text>
      <text 
        x={cx} 
        y={cy} 
        dy={24} 
        textAnchor="middle" 
        fill="#999"
        style={{ fontSize: percentSize }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
};

// Custom bar shape renderer for tasarruf trendi
const renderSavingsBar = (props: any) => {
  const { x, y, width, height, value } = props;
  const fill = value >= 0 ? '#2a9d90' : '#e87356';
  
  // For positive values: normal positioning
  // For negative values: Start at zero line and go down
  const zeroY = y + height; // y position of zero line (for positive bars, this is where the bar ends)
  
  // Calculate the proper height and y position
  // For positive values: Keep original
  // For negative values: Start at zero line and go down with positive height
  const barHeight = Math.abs(height);
  const barY = value >= 0 ? y : zeroY;
  
  return (
    <g>
      <rect
        x={x}
        y={barY}
        width={width}
        height={barHeight}
        fill={fill}
        rx={4}
        ry={4}
      />
    </g>
  );
};

// Ay adlarını düzgün formatlama
const formatMonthName = (monthStr: string) => {
  // Kısaltılmış ay adlarını tam aya çevir
  const monthMap: Record<string, string> = {
    'Oca': 'Ocak',
    'Şub': 'Şubat',
    'Mar': 'Mart',
    'Nis': 'Nisan',
    'May': 'Mayıs',
    'Haz': 'Haziran',
    'Tem': 'Temmuz',
    'Ağu': 'Ağustos',
    'Eyl': 'Eylül',
    'Eki': 'Ekim',
    'Kas': 'Kasım',
    'Ara': 'Aralık'
  };
  
  return monthMap[monthStr] || monthStr;
};

// Özel tooltip içeriği
const CustomTooltip = ({ active, payload, label }: { 
  active?: boolean; 
  payload?: any[]; 
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-md p-2 sm:p-3 text-xs sm:text-sm">
        <p className="font-medium">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value.toLocaleString('tr-TR')} ₺`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Özel RadialBar tooltip içeriği - Value metni olmadan sadece değer gösteren
const CustomRadialBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const value = data.value;
    const name = data.payload.name; // Use payload name
    const fill = data.fill;
    
    // Tooltip içeriğini tamamen özelleştir
    return (
      <div className="bg-black bg-opacity-90 text-white rounded-lg shadow-md p-2 sm:p-3 text-xs sm:text-sm" style={{ border: 'none' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm" style={{ backgroundColor: fill }} />
          <span className="font-medium">{name}</span>
        </div>
        <p className="text-base sm:text-lg font-bold mt-1">₺{value.toLocaleString('tr-TR')}</p>
      </div>
    );
  }
  return null;
};

// Aylık veri için tip tanımı
interface MonthlyData {
  name: string;
  gelir: number;
  gider: number;
  oran?: number;
  tasarruf?: number;
  tasarrufMiktar?: number;
  [key: string]: string | number | undefined;
}

export default function DashboardPage() {
  const { supabase, user } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    savingsRate: 0,
  });
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [budgetGoals, setBudgetGoals] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [savingsHistory, setSavingsHistory] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("thisMonth");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminWarning, setShowAdminWarning] = useState(false);
  
  // Mobil görünüm için durum
  const [isMobile, setIsMobile] = useState(false);

  // Kaç ay veri gösterileceği (mobil için 3, masaüstü için 6)
  const [monthsToShow, setMonthsToShow] = useState(6);
  
  // Ekran boyutu değişikliğini takip et
  useEffect(() => {
    const checkMobileView = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setMonthsToShow(mobile ? 3 : 6); // Mobil için 3, masaüstü için 6 ay göster
    };
    
    // İlk yükleme
    checkMobileView();
    
    // Ekran boyutu değiştiğinde kontrol et
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Demo mod için örnek veriler
        if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://example.supabase.co') {
          // Demo işlemleri al
          const demoTransactions = JSON.parse(localStorage.getItem('demoTransactions') || '[]');
          
          // Son işlemler
          const sortedTransactions = [...demoTransactions].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setRecentTransactions(sortedTransactions.slice(0, 5));
          
          // Kategorilere göre harcamaları hesapla
          const categories: Record<string, number> = {};
          demoTransactions.forEach((transaction: any) => {
            if (transaction.type === 'expense') {
              const categoryName = getCategoryName(transaction.category_id);
              categories[categoryName] = (categories[categoryName] || 0) + transaction.amount;
            }
          });
          
          const expensesData = Object.entries(categories)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Büyükten küçüğe sırala
          
          // Aylık verileri hesapla
          const monthlyDataMap: Record<string, MonthlyData> = {};
          
          // Son 6 ay için boş veri oluştur
          for (let i = 0; i < 6; i++) {
            const date = subMonths(new Date(), i);
            const monthKey = format(date, "MMM", { locale: tr });
            monthlyDataMap[monthKey] = { name: monthKey, gelir: 0, gider: 0 };
          }
          
          // İşlemleri aylara göre grupla
          demoTransactions.forEach((transaction: any) => {
            const date = new Date(transaction.date);
            const monthKey = format(date, "MMM", { locale: tr });
            
            if (monthlyDataMap[monthKey]) {
              if (transaction.type === 'income') {
                monthlyDataMap[monthKey].gelir += Number(transaction.amount);
              } else {
                monthlyDataMap[monthKey].gider += Number(transaction.amount);
              }
            }
          });
          
          // Ay adlarını düzgün formatlayarak aylık veriyi oluştur
          const monthlyDataArray = Object.entries(monthlyDataMap)
            .map(([name, data]) => ({
              name: formatMonthName(name),
              ...(data as object)
            }))
            .reverse() as MonthlyData[];
          
          // Tasarruf geçmişi
          const savingsHistoryData = monthlyDataArray.map((month: MonthlyData) => ({
            name: month.name,
            tasarruf: month.gelir - month.gider,
            oran: month.gelir > 0 ? ((month.gelir - month.gider) / month.gelir) * 100 : 0
          }));
          setSavingsHistory(savingsHistoryData);
          
          // Bütçe hedefleri
          const demoGoals = [
            { category: "Yiyecek", current: categories["Yiyecek"] || 0, target: 3000, name: "Yiyecek Bütçesi" },
            { category: "Ulaşım", current: categories["Ulaşım"] || 0, target: 1500, name: "Ulaşım Bütçesi" },
            { category: "Eğlence", current: categories["Eğlence"] || 0, target: 1000, name: "Eğlence Bütçesi" },
          ];
          
          // Özet verileri hesapla
          const totalIncome = demoTransactions.reduce((sum: number, t: any) => 
            t.type === 'income' ? sum + t.amount : sum, 0);
          
          const totalExpense = demoTransactions.reduce((sum: number, t: any) => 
            t.type === 'expense' ? sum + t.amount : sum, 0);
          
          const balance = totalIncome - totalExpense;
          const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
          
          setSummary({
            totalIncome,
            totalExpense,
            balance,
            savingsRate,
          });
          setExpensesByCategory(expensesData);
          setMonthlyData(monthlyDataArray);
          setBudgetGoals(demoGoals);
          setLoading(false);
          return;
        }

        // Gerçek Supabase sorguları
        if (user) {
          console.log("Kullanıcı ID'si ile veri çekiliyor:", user.id);
          
          // Son işlemleri al
          const { data: transactionsData, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
            
          if (transactionsError) {
            console.error("İşlemler yüklenirken hata oluştu:", transactionsError);
            throw transactionsError;
          }
          
          // Kategorileri al - kullanıcıya özel ve genel kategoriler
          const [userCategoriesResponse, generalCategoriesResponse] = await Promise.all([
            // Kullanıcıya özel kategoriler
            supabase
              .from('categories')
              .select('*')
              .eq('user_id', user.id),
            
            // Genel kategoriler
            supabase
              .from('categories')
              .select('*')
              .filter('user_id', 'is', null)
          ]);
          
          if (userCategoriesResponse.error) {
            console.error("Kullanıcı kategorileri yüklenirken hata oluştu:", userCategoriesResponse.error);
          }
          
          if (generalCategoriesResponse.error) {
            console.error("Genel kategoriler yüklenirken hata oluştu:", generalCategoriesResponse.error);
          }
          
          // Tüm kategorileri birleştir
          const userCategories = userCategoriesResponse.data || [];
          const generalCategories = generalCategoriesResponse.data || [];
          const allCategories = [...userCategories, ...generalCategories];
          
          console.log("Kategori bilgileri:", { 
            kullaniciKategorileri: userCategories.length, 
            genelKategoriler: generalCategories.length, 
            toplamKategori: allCategories.length 
          });
          
          console.log("Çekilen işlem sayısı:", transactionsData?.length || 0);
          
          // Eğer işlem yoksa boş değerlerle devam et
          if (!transactionsData || transactionsData.length === 0) {
            setSummary({
              totalIncome: 0,
              totalExpense: 0,
              balance: 0,
              savingsRate: 0,
            });
            setExpensesByCategory([]);
            setMonthlyData([]);
            setRecentTransactions([]);
            setSavingsHistory([]);
            setBudgetGoals([]);
            setLoading(false);
            return;
          }
          
          // Son 5 işlemi göster
          setRecentTransactions(transactionsData.slice(0, 5));
          
          // Mevcut ayın başlangıç ve bitiş tarihlerini hesapla
          const today = new Date();
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          
          // Sadece mevcut aya ait işlemleri filtrele
          const currentMonthTransactions = transactionsData.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
          });
          
          // Mevcut aya ait toplam gelir, gider, bakiye ve tasarruf oranını hesapla
          const totalIncome = currentMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
            
          const totalExpense = currentMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
            
          const balance = totalIncome - totalExpense;
          const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
          
          // Özet bilgileri state'e ata
          setSummary({
            totalIncome,
            totalExpense,
            balance,
            savingsRate,
          });
          
          // Kategorilere göre giderleri hesapla
          const expenseCategoriesMap = {}; // Kategori adına göre
          const expenseCategoriesIdMap = {}; // Kategori ID'sine göre
          
          // Sadece mevcut aya ait gider işlemlerini kategorilere göre grupla
          currentMonthTransactions
            .filter(t => t.type === 'expense')
            .forEach(transaction => {
              // Kategori adını bul
              const categoryId = transaction.category_id;
              const category = allCategories.find(c => c.id === categoryId);
              const categoryName = category ? category.name : 'Diğer';
              
              // İki farklı map'e ekle
              expenseCategoriesMap[categoryName] = (expenseCategoriesMap[categoryName] || 0) + Number(transaction.amount);
              expenseCategoriesIdMap[categoryId] = (expenseCategoriesIdMap[categoryId] || 0) + Number(transaction.amount);
            });
            
          const expensesData = Object.entries(expenseCategoriesMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
            
          setExpensesByCategory(expensesData);
          
          // Aylık verileri hesapla
          const monthlyDataMap: Record<string, MonthlyData> = {};
          
          // Son 6 ay için boş veri oluştur
          for (let i = 0; i < 6; i++) {
            const date = subMonths(new Date(), i);
            const monthKey = format(date, "MMM", { locale: tr });
            monthlyDataMap[monthKey] = { name: monthKey, gelir: 0, gider: 0 };
          }
          
          // İşlemleri aylara göre grupla
          transactionsData.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = format(date, "MMM", { locale: tr });
            
            if (monthlyDataMap[monthKey]) {
              if (transaction.type === 'income') {
                monthlyDataMap[monthKey].gelir += Number(transaction.amount);
              } else {
                monthlyDataMap[monthKey].gider += Number(transaction.amount);
              }
            }
          });
          
          // Ay adlarını düzgün formatlayarak aylık veriyi oluştur
          const monthlyDataArray = Object.entries(monthlyDataMap)
            .map(([name, data]) => ({
              name: formatMonthName(name),
              ...(data as object)
            }))
            .reverse() as MonthlyData[];
            
          setMonthlyData(monthlyDataArray);
          
          // Tasarruf geçmişi
          const savingsHistoryData = monthlyDataArray.map((month: MonthlyData) => ({
            name: month.name,
            tasarruf: month.gelir - month.gider,
            oran: month.gelir > 0 ? ((month.gelir - month.gider) / month.gelir) * 100 : 0
          }));
          
          setSavingsHistory(savingsHistoryData);
          
          // Bütçe hedefleri - veritabanından çek
          const { data: budgetGoalsData, error: budgetGoalsError } = await supabase
            .from('budget_goals')
            .select('*')
            .eq('user_id', user.id);
            
          if (budgetGoalsError) {
            console.error("Bütçe hedefleri yüklenirken hata oluştu:", budgetGoalsError);
          }
          
          // Eğer veritabanından bütçe hedefleri çekilebildiyse onları kullan
          // Yoksa boş dizi kullan
          if (budgetGoalsData && budgetGoalsData.length > 0) {
            // Aktif bütçe hedeflerini filtrele
            const activeGoals = budgetGoalsData.filter(goal => {
              // Eğer başlangıç ve bitiş tarihi varsa, hedefin şu an aktif olup olmadığını kontrol et
              if (goal.start_date && goal.end_date) {
                const startDate = new Date(goal.start_date);
                const endDate = new Date(goal.end_date);
                const now = new Date();
                return now >= startDate && now <= endDate;
              }
              // Tarih bilgisi yoksa varsayılan olarak aktif kabul et
              return true;
            });
            
            // Her bir bütçe hedefi için mevcut harcamaları hesapla
            const goalsWithExpenses = activeGoals.map(goal => {
              // Veritabanındaki sütun adları ile UI'daki prop adları farklı olabilir
              // Kategori bilgisini bul
              const categoryId = goal.category_id || '';
              const category = allCategories.find(c => c.id === categoryId);
              const categoryName = category ? category.name : categoryId;
              
              return {
                ...goal,
                target: goal.target_amount || 0, // Veritabanında target_amount olarak saklanıyor
                category: categoryName, // Kategori adını gösteriyoruz
                current: expenseCategoriesIdMap[categoryId] || 0 // Sadece mevcut aya ait harcamalar
              };
            });
            setBudgetGoals(goalsWithExpenses);
          } else {
            setBudgetGoals([]);
          }
        } else {
          console.log("Kullanıcı oturum açmamış, veri çekilemiyor");
        }
      } catch (error) {
        console.error("Veri yükleme hatası:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, user?.id]);

  useEffect(() => {
    // Check if user is admin
    async function checkAdminRole() {
      if (!user) return;
      
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
          
        if (!error && profile?.role === "admin") {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error("Admin role check error:", err);
      }
    }
    
    checkAdminRole();
  }, [supabase, user]);

  // Demo kategorileri
  const getCategoryName = (categoryId: string) => {
    const categories: Record<string, string> = {
      '1': 'Yiyecek',
      '2': 'Ulaşım',
      '3': 'Konut',
      '4': 'Eğlence',
      '5': 'Faturalar',
      '6': 'Maaş',
      '7': 'Yatırım',
      '8': 'Diğer',
    };
    
    return categories[categoryId] || 'Bilinmeyen';
  };

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Genel Bakış</h1>
          <p className="text-muted-foreground">
            Finansal durumunuza genel bir bakış
          </p>
        </div>
        <div className="flex gap-2 self-start">
          <Button asChild variant="outline" size={isMobile ? "sm" : "default"}>
            <Link href="/dashboard/reports">
              <BarChart3 className="mr-2 h-4 w-4" />
              Raporlar
            </Link>
          </Button>
          <Button asChild size={isMobile ? "sm" : "default"}>
            <Link href="/dashboard/transactions/new">
              <Plus className="mr-2 h-4 w-4" />
              Yeni İşlem
            </Link>
          </Button>
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="flex items-center justify-center text-primary font-bold text-base">₺</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{summary.totalIncome.toLocaleString('tr-TR')}</div>
            <div className="flex items-center pt-1 text-xs text-green-500">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              <span>%8 artış</span>
              <span className="text-muted-foreground ml-1">geçen aya göre</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
            <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{summary.totalExpense.toLocaleString('tr-TR')}</div>
            <div className="flex items-center pt-1 text-xs text-destructive">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              <span>%12 artış</span>
              <span className="text-muted-foreground ml-1">geçen aya göre</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bakiye</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{summary.balance.toLocaleString('tr-TR')}</div>
            <div className="flex items-center pt-1 text-xs text-green-500">
              <ArrowDownRight className="mr-1 h-3 w-3" />
              <span>%5 artış</span>
              <span className="text-muted-foreground ml-1">geçen aya göre</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasarruf Oranı</CardTitle>
            <div className="rounded-full bg-blue-100 p-1">
              <PercentIcon className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              %{summary.savingsRate !== undefined
                ? summary.savingsRate.toFixed(1)
                : "0.0"}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.savingsRate > 0 ? (
                <span className="text-green-500 flex items-center">
                  %{(summary.savingsRate).toFixed(1)}
                </span>
              ) : (
                <span className="text-gray-500 flex items-center">
                  Değişim yok
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ana İçerik */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        {/* Sol Sütun */}
        <div className="lg:col-span-2 space-y-4">
          {/* Gelir/Gider Grafiği */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Gelir ve Gider Trendi</CardTitle>
                  <CardDescription>Son {monthsToShow} aylık gelir ve gider karşılaştırması</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-2))]"></div>
                    <span className="text-xs">Gelir</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-1))]"></div>
                    <span className="text-xs">Gider</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyData.slice(-monthsToShow)}
                    margin={{
                      top: 10,
                      right: isMobile ? 5 : 20,
                      left: isMobile ? -20 : 0,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="name" 
                      tickFormatter={(value) => formatMonthName(value)} 
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      axisLine={{ stroke: '#888', strokeWidth: 1 }}
                      tickLine={{ stroke: '#888', strokeWidth: 1 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `₺${value/1000}K`}
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      width={isMobile ? 40 : 60}
                      axisLine={{ stroke: '#888', strokeWidth: 1 }}
                      tickLine={{ stroke: '#888', strokeWidth: 1 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      formatter={(value) => value === 'gelir' ? 'Gelir' : 'Gider'} 
                      iconSize={isMobile ? 8 : 10}
                      wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="gelir" 
                      stackId="1" 
                      stroke="#2a9d90" 
                      fill="#2a9d90"
                      fillOpacity={0.6} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="gider" 
                      stackId="2" 
                      stroke="#e87356" 
                      fill="#e87356"
                      fillOpacity={0.6} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bütçe Hedefleri */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Bütçe Hedefleri</CardTitle>
                  <CardDescription>Belirlediğiniz bütçe hedeflerine göre ilerleme durumu</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/budget-goals">Tümünü Gör</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {budgetGoals.map((goal) => {
                  const progress = (goal.current / goal.target) * 100;
                  const isOverBudget = goal.current > goal.target;
                  
                  return (
                    <div key={goal.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{goal.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {goal.category} kategorisi için aylık bütçe hedefi
                          </div>
                        </div>
                        <div className="font-medium">
                          <span className={isOverBudget ? "text-destructive" : "text-green-500"}>
                            ₺{goal.current.toLocaleString('tr-TR')}
                          </span> / ₺{goal.target.toLocaleString('tr-TR')}
                        </div>
                      </div>
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-primary/10 text-primary">
                              {Math.min(progress, 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-muted-foreground">
                              {isOverBudget ? (
                                <span className="text-destructive">
                                  Bütçe aşımı: ₺{(goal.current - goal.target).toLocaleString('tr-TR')}
                                </span>
                              ) : (
                                <span className="text-green-500">
                                  Kalan: ₺{(goal.target - goal.current).toLocaleString('tr-TR')}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 text-xs flex rounded-full bg-muted">
                          <div 
                            style={{ width: `${Math.min(progress, 100)}%` }} 
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                              isOverBudget ? "bg-destructive" : progress > 80 ? "bg-amber-500" : "bg-primary"
                            }`}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sağ Sütun */}
        <div className="space-y-4">
          {/* Gelir-Gider Dağılımı */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Harcama Dağılımı</CardTitle>
              <CardDescription>Kategorilere göre harcama dağılımı</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] sm:h-[220px] md:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 40 : 60} 
                      outerRadius={isMobile ? 60 : 80}
                      paddingAngle={2}
                      dataKey="value"
                      onMouseEnter={onPieEnter}
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Tasarruf Trendi */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tasarruf Oranı Değişimi</CardTitle>
              <CardDescription>Aylık tasarruf miktarı değişimi</CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <div className="h-[220px] sm:h-[250px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={savingsHistory}
                    margin={{
                      top: 10,
                      right: 10,
                      left: 0,
                      bottom: 20,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      interval={isMobile ? 1 : 0}
                    />
                    <YAxis 
                      tickFormatter={(value) => `%${value}`} 
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      width={isMobile ? 35 : 40}
                    />
                    <Tooltip formatter={(value, name) => [
                      `%${Number(value).toFixed(1)}`, 
                      'Tasarruf Oranı'
                    ]} />
                    
                    <ReferenceLine y={5} stroke="#ff8c00" strokeDasharray="3 3" label={{ 
                      value: "Hedef %5", 
                      position: "insideBottomRight",
                      fill: "#ff8c00",
                      fontSize: isMobile ? 10 : 12
                    }} />
                    
                    <Line
                      type="monotone"
                      dataKey="oran"
                      name="Tasarruf Oranı"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={2}
                      dot={{ r: isMobile ? 3 : 4, strokeWidth: 2, fill: 'hsl(var(--chart-3))' }}
                      activeDot={{ r: isMobile ? 5 : 6, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Son İşlemler */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Son İşlemler</CardTitle>
                  <CardDescription>En son gerçekleştirilen finansal işlemler</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/transactions">Tümünü Gör</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.slice(0, 4).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'income' 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {transaction.type === 'income' 
                          ? <ArrowDown className="h-5 w-5" /> 
                          : <ArrowUp className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(transaction.date), "d MMMM yyyy", { locale: tr })} • {getCategoryName(transaction.category_id)}
                        </div>
                      </div>
                    </div>
                    <div className={`font-medium ${
                      transaction.type === 'income' ? 'text-green-500' : 'text-destructive'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}₺{transaction.amount.toLocaleString('tr-TR')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detaylı Analizler */}
      <div className="mt-6">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="w-full flex justify-start overflow-x-auto py-1 gap-1 sm:gap-2">
            <TabsTrigger value="overview" className="flex-shrink-0 text-xs sm:text-sm">Genel</TabsTrigger>
            <TabsTrigger value="income-expense" className="flex-shrink-0 text-xs sm:text-sm">Gelir/Gider</TabsTrigger>
            <TabsTrigger value="categories" className="flex-shrink-0 text-xs sm:text-sm">Kategori Dağılımı</TabsTrigger>
            <TabsTrigger value="savings" className="flex-shrink-0 text-xs sm:text-sm">Tasarruf Trendi</TabsTrigger>
            <TabsTrigger value="budget" className="flex-shrink-0 text-xs sm:text-sm">Bütçe Hedefleri</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Finansal Performans</CardTitle>
                <CardDescription>Gelir, gider ve tasarruf oranınızın karşılaştırmalı analizi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Gelir-Gider Dengesi</h3>
                    <div className="h-[250px] sm:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart 
                          width={500} 
                          height={300} 
                          innerRadius={isMobile ? "20%" : "30%"} 
                          outerRadius={isMobile ? "80%" : "90%"} 
                          data={[
                            {
                              name: 'Gelir',
                              value: summary.totalIncome,
                              fill: 'hsl(var(--chart-2))'
                            },
                            {
                              name: 'Gider',
                              value: summary.totalExpense,
                              fill: 'hsl(var(--chart-1))'
                            },
                            {
                              name: 'Tasarruf',
                              value: summary.balance,
                              fill: 'hsl(var(--chart-3))'
                            }
                          ]}
                          startAngle={90}
                          endAngle={-270}
                        >
                          <RadialBar
                            minAngle={15}
                            background
                            clockWise
                            dataKey="value"
                            cornerRadius={10}
                            label={false}
                            isAnimationActive={false}
                            labelList={false}
                          />
                          <Legend 
                            iconSize={isMobile ? 8 : 10} 
                            layout="vertical" 
                            verticalAlign="middle" 
                            wrapperStyle={isMobile ? { fontSize: '12px' } : { fontSize: '14px' }}
                            align={isMobile ? "center" : "right"}
                            formatter={(value, entry) => (
                              <span style={{ color: 'var(--foreground)', fontSize: isMobile ? '12px' : '14px', marginLeft: '5px' }}>
                                {value}: ₺{entry.payload.value.toLocaleString('tr-TR')}
                              </span>
                            )}
                          />
                          <Tooltip content={<CustomRadialBarTooltip />} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Tasarruf Trendi</h3>
                    <div className="h-[250px] sm:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={savingsHistory.map(item => {
                            const matchingMonth = monthlyData.find(m => m.name === item.name);
                            const tasarrufMiktar = matchingMonth ? (item.oran / 100) * matchingMonth.gelir : 0;
                            return {
                              ...item,
                              tasarrufMiktar
                            };
                          })}
                          margin={{
                            top: 10,
                            right: 10,
                            left: 0,
                            bottom: 30,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: isMobile ? 10 : 12 }} 
                            interval={isMobile ? 1 : 0}
                          />
                          <YAxis 
                            tickFormatter={(value) => `₺${Math.round(value/1000)}K`} 
                            tick={{ fontSize: isMobile ? 10 : 12 }} 
                            domain={[(dataMin) => dataMin < 0 ? dataMin * 1.1 : 0, (dataMax) => dataMax * 1.1]}
                            allowDataOverflow={false}
                            includeHidden={true}
                            width={isMobile ? 35 : 40}
                          />
                          <Tooltip formatter={(value, name) => [
                            `₺${Number(value).toLocaleString('tr-TR')}`, 
                            'Tasarruf Miktarı'
                          ]} />
                          <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                          <Bar
                            dataKey="tasarrufMiktar"
                            name="Tasarruf Miktarı"
                            shape={renderSavingsBar}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="income-expense" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gelir-Gider Analizi</CardTitle>
                <CardDescription>Gelir ve giderlerin aylık dağılımı</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={monthlyData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis 
                        dataKey="name" 
                        tickFormatter={(value) => formatMonthName(value)} 
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        axisLine={{ stroke: '#888', strokeWidth: 1 }}
                        tickLine={{ stroke: '#888', strokeWidth: 1 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => `₺${value/1000}K`}
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        width={isMobile ? 40 : 60}
                        axisLine={{ stroke: '#888', strokeWidth: 1 }}
                        tickLine={{ stroke: '#888', strokeWidth: 1 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        formatter={(value) => value === 'gelir' ? 'Gelir' : 'Gider'} 
                        iconSize={isMobile ? 8 : 10}
                        wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="gelir" 
                        stackId="1" 
                        stroke="#2a9d90" 
                        fill="#2a9d90"
                        fillOpacity={0.6} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="gider" 
                        stackId="2" 
                        stroke="#e87356" 
                        fill="#e87356"
                        fillOpacity={0.6} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kategori Bazlı Harcamalar</CardTitle>
                <CardDescription>Kategorilere göre harcama dağılımı</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
                  <BarChart
                    data={expensesByCategory}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: isMobile ? 15 : 30,
                      left: isMobile ? 15 : 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      type="number" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      tickFormatter={(value) => isMobile ? `₺${Math.round(value/1000)}K` : `₺${value.toLocaleString('tr-TR')}`}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={isMobile ? 70 : 100}
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip formatter={(value) => [`₺${Number(value).toLocaleString('tr-TR')}`, '']} />
                    <Bar 
                      dataKey="value" 
                      name="" 
                      fill="hsl(var(--chart-1))" 
                      radius={[0, 4, 4, 0]}
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="savings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tasarruf Trendi</CardTitle>
                <CardDescription>Aylık tasarruf miktarı değişimi</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-[220px] sm:h-[250px] md:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={savingsHistory}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        interval={isMobile ? 1 : 0}
                      />
                      <YAxis 
                        tickFormatter={(value) => `%${value}`} 
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        width={isMobile ? 35 : 40}
                      />
                      <Tooltip formatter={(value, name) => [
                        `%${Number(value).toFixed(1)}`, 
                        'Tasarruf Oranı'
                      ]} />
                      
                      <ReferenceLine y={5} stroke="#ff8c00" strokeDasharray="3 3" label={{ 
                        value: "Hedef %5", 
                        position: "insideBottomRight",
                        fill: "#ff8c00",
                        fontSize: isMobile ? 10 : 12
                      }} />
                      
                      <Line
                        type="monotone"
                        dataKey="oran"
                        name="Tasarruf Oranı"
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={2}
                        dot={{ r: isMobile ? 3 : 4, strokeWidth: 2, fill: 'hsl(var(--chart-3))' }}
                        activeDot={{ r: isMobile ? 5 : 6, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="budget" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bütçe Hedefleri</CardTitle>
                <CardDescription>Belirlediğiniz bütçe hedeflerine göre ilerleme durumu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {budgetGoals.map((goal) => {
                    const progress = (goal.current / goal.target) * 100;
                    const isOverBudget = goal.current > goal.target;
                    
                    return (
                      <div key={goal.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{goal.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {goal.category} kategorisi için aylık bütçe hedefi
                            </div>
                          </div>
                          <div className="font-medium">
                            <span className={isOverBudget ? "text-destructive" : "text-green-500"}>
                              ₺{goal.current.toLocaleString('tr-TR')}
                            </span> / ₺{goal.target.toLocaleString('tr-TR')}
                          </div>
                        </div>
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-primary/10 text-primary">
                                {Math.min(progress, 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-muted-foreground">
                                {isOverBudget ? (
                                  <span className="text-destructive">
                                    Bütçe aşımı: ₺{(goal.current - goal.target).toLocaleString('tr-TR')}
                                  </span>
                                ) : (
                                  <span className="text-green-500">
                                    Kalan: ₺{(goal.target - goal.current).toLocaleString('tr-TR')}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 text-xs flex rounded-full bg-muted">
                            <div 
                              style={{ width: `${Math.min(progress, 100)}%` }} 
                              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                                isOverBudget ? "bg-destructive" : progress > 80 ? "bg-amber-500" : "bg-primary"
                              }`}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Masaüstü Görünüm - Son Bölümler */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 xl:grid-cols-9">
        {/* Gelir-Gider Analizi */}
        <Card className="col-span-9 xl:col-span-5">
          {/* ... existing code ... */}
        </Card>

        {/* Yaklaşan Ödemeler */}
        <Card className="col-span-9 xl:col-span-5">
          {/* ... existing code ... */}
        </Card>
      </div>
    </div>
  );
}