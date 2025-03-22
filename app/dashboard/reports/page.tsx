"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSupabase } from "@/components/supabase-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, subMonths, eachMonthOfInterval } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Sector,
  Area,
  AreaChart,
  ComposedChart,
  Scatter,
  ReferenceLine,
  RadialBarChart,
  RadialBar,
  Treemap
} from "recharts";
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon, 
  Loader2,
  Share2, 
  Sliders, 
  TrendingUp,
  Filter,
  Mail,
  Copy,
  Printer,
  Check,
  Calendar,
  CreditCard,
  Settings,
  Palette,
  Target,
  Wallet,
  InfoIcon,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

// Grafik renkleri
const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

// Aktif dilim için render fonksiyonu
const renderActiveShape = (props) => {
  const { 
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value, name
  } = props;

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
        style={{ fontWeight: 'bold', fontSize: '16px' }}
      >
        {name}
      </text>
      <text 
        x={cx} 
        y={cy} 
        textAnchor="middle" 
        fill={fill}
        style={{ fontSize: '22px', fontWeight: 'bold' }}
      >
        ₺{value.toLocaleString('tr-TR')}
      </text>
      <text 
        x={cx} 
        y={cy} 
        dy={24} 
        textAnchor="middle" 
        fill="#999"
        style={{ fontSize: '14px' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
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
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-md p-3">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 mt-1">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">{entry.name}: ₺{entry.value.toLocaleString('tr-TR')}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Özel kategori tooltip içeriği
const CustomCategoryTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-background border rounded-lg shadow-md p-3">
        <p className="font-medium">{data.name}</p>
        <p className="text-lg font-bold mt-1">₺{data.value.toLocaleString('tr-TR')}</p>
        {data.payload.percent && (
          <p className="text-sm text-muted-foreground mt-1">
            Toplam harcamanın %{(data.payload.percent * 100).toFixed(1)}'i
          </p>
        )}
      </div>
    );
  }
  return null;
};

// Özel trend tooltip içeriği
const CustomTrendTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-md p-3">
        <p className="font-medium">{label}</p>
        <div className="mt-2 space-y-1">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm">{entry.name}:</span>
              </div>
              <span className="text-sm font-medium">₺{entry.value.toLocaleString('tr-TR')}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Özel tasarruf oranı tooltip içeriği
const CustomSavingsRateTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // Filter to only show 'oran' data
    const oranData = payload.find(entry => entry.dataKey === 'oran');
    if (oranData) {
      return (
        <div className="bg-background border rounded-lg shadow-md p-3">
          <p className="font-medium">{label}</p>
          <div className="mt-2">
            <span className="text-sm">%{Number(oranData.value).toFixed(1)}</span>
          </div>
        </div>
      );
    }
  }
  return null;
};

export default function ReportsPage() {
  const { supabase, user } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("thisMonth");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [availableMonths, setAvailableMonths] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [summaryStats, setSummaryStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    savingsRate: 0
  });
  const [isCopied, setIsCopied] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("free");
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  
  // Initialize customizeSettings with saved targetSavingsRate if available
  const [customizeSettings, setCustomizeSettings] = useState(() => {
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      const savedTargetRate = localStorage.getItem('targetSavingsRate');
      const targetRate = savedTargetRate ? parseInt(savedTargetRate, 10) : 20;
      
      return {
        showIncome: true,
        showExpense: true,
        showBalance: true,
        showSavingsRate: true,
        showTopCategories: true,
        showRecommendations: true,
        colorTheme: "default",
        targetSavingsRate: targetRate
      };
    }
    
    // Default settings for server-side rendering
    return {
      showIncome: true,
      showExpense: true,
      showBalance: true,
      showSavingsRate: true,
      showTopCategories: true,
      showRecommendations: true,
      colorTheme: "default",
      targetSavingsRate: 20
    };
  });
  
  const [categorySavingsData, setCategorySavingsData] = useState([]);
  const [customizeModalOpen, setCustomizeModalOpen] = useState(false);
  
  // Target savings rate - kullanıcı tarafından özelleştirilebilir, localStorage'dan alınır
  const [targetSavingsRate, setTargetSavingsRate] = useState(() => {
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      const savedTargetRate = localStorage.getItem('targetSavingsRate');
      return savedTargetRate ? parseInt(savedTargetRate, 10) : 20;
    }
    return 20; // Default for server-side rendering
  });

  // Raw transaction data ve kategoriler
  const [transactions, setTransactions] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);

  // Filtrelenmiş kategori verisi
  const filteredCategoryData = useMemo(() => {
    // İşlemler periyoda göre filtrelenir
    const filteredTransactions = (() => {
      if (selectedPeriod === "thisMonth") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return transactions.filter(t => {
          const txDate = new Date(t.date);
          return txDate >= startOfMonth && t.type === 'expense';
        });
      } else if (selectedPeriod === "last3Months") {
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        return transactions.filter(t => {
          const txDate = new Date(t.date);
          return txDate >= threeMonthsAgo && t.type === 'expense';
        });
      } else if (selectedPeriod === "last6Months") {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        return transactions.filter(t => {
          const txDate = new Date(t.date);
          return txDate >= sixMonthsAgo && t.type === 'expense';
        });
      } else if (selectedPeriod === "thisYear") {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return transactions.filter(t => {
          const txDate = new Date(t.date);
          return txDate >= startOfYear && t.type === 'expense';
        });
      } else if (selectedPeriod === "custom" && selectedMonth) {
        const [year, month] = selectedMonth.split('-').map(Number);
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);
        return transactions.filter(t => {
          const txDate = new Date(t.date);
          return txDate >= startOfMonth && txDate <= endOfMonth && t.type === 'expense';
        });
      }
      // Varsayılan: son 6 ay
      return transactions.filter(t => t.type === 'expense');
    })();

    // Filtrelenmiş işlemlere göre kategori verisini hesapla
    const expensesMap = {};

    filteredTransactions.forEach(transaction => {
      const categoryId = transaction.category_id;
      const category = allCategories.find(c => c.id === categoryId);
      const categoryName = category ? category.name : 'Diğer';
      
      expensesMap[categoryName] = (expensesMap[categoryName] || 0) + (transaction.amount || 0);
    });

    return Object.entries(expensesMap)
      .map(([name, value]) => ({ 
        name, 
        value,
        percent: value / Object.values(expensesMap).reduce((sum, val) => sum + (val || 0), 0)
      }))
      .sort((a, b) => b.value - a.value);
  }, [selectedPeriod, selectedMonth, transactions, allCategories]);

  // Filtrelenmiş trend verisi
  const filteredTrendData = useMemo(() => {
    let periodFilteredData = [];
    
    if (selectedPeriod === "thisMonth") {
      // Sadece mevcut ayın verisi
      const currentMonth = format(new Date(), "MMM yyyy", { locale: tr });
      periodFilteredData = trendData.filter(month => 
        formatMonthName(currentMonth) === month.name
      );
    } else if (selectedPeriod === "last3Months") {
      // Son 3 ayın verisini al
      periodFilteredData = trendData.slice(0, 3);
    } else if (selectedPeriod === "last6Months") {
      // Son 6 ayın verisini al
      periodFilteredData = trendData.slice(0, 6);
    } else if (selectedPeriod === "thisYear") {
      // Bu yılın tüm aylarını al
      const currentYear = new Date().getFullYear();
      periodFilteredData = trendData.filter(month => {
        // Ay formatını ayır ve yıl kısmını kontrol et
        const monthName = month.name;
        const yearPart = monthName.split(' ')[1];
        return yearPart && parseInt(yearPart) === currentYear;
      });
    } else if (selectedPeriod === "custom" && selectedMonth) {
      // Seçili ayın verisi
      const [year, month] = selectedMonth.split('-').map(Number);
      const targetDate = new Date(year, month - 1, 1);
      const targetMonthStr = format(targetDate, "MMM yyyy", { locale: tr });
      periodFilteredData = trendData.filter(month => month.name === formatMonthName(targetMonthStr));
    } else {
      // Varsayılan: tüm veri
      periodFilteredData = trendData;
    }

    // Kategori filtresi uygulanır
    if (selectedCategory !== 'all') {
      return periodFilteredData.map(month => ({
        name: month.name,
        [selectedCategory.toLowerCase()]: month[selectedCategory.toLowerCase()] || 0
      }));
    }
    
    return periodFilteredData;
  }, [selectedPeriod, selectedMonth, selectedCategory, trendData]);

  // Filtrelenmiş özet istatistikler
  const filteredSummaryStats = useMemo(() => {
    let filteredTransactions = [...transactions];
    
    // Seçilen döneme göre işlemleri filtrele
    if (selectedPeriod === "thisMonth") {
      // Mevcut ay
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      filteredTransactions = filteredTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      });
    } else if (selectedPeriod === "last3Months") {
      // Son 3 ay
      const threeMonthsAgo = subMonths(new Date(), 3);
      
      filteredTransactions = filteredTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= threeMonthsAgo;
      });
    } else if (selectedPeriod === "last6Months") {
      // Son 6 ay
      const sixMonthsAgo = subMonths(new Date(), 6);
      
      filteredTransactions = filteredTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= sixMonthsAgo;
      });
    } else if (selectedPeriod === "thisYear") {
      // Bu yıl
      const currentYear = new Date().getFullYear();
      
      filteredTransactions = filteredTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getFullYear() === currentYear;
      });
    } else if (selectedPeriod === "custom" && selectedMonth) {
      // Özel seçilen ay
      const [year, month] = selectedMonth.split('-').map(Number);
      
      filteredTransactions = filteredTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === (month - 1) && 
               transactionDate.getFullYear() === year;
      });
    }
    
    // Filtrelenmiş işlemler üzerinden özet istatistikleri hesapla
    const today = new Date();
    const totalIncome = filteredTransactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'income' && transactionDate <= today;
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const totalExpense = filteredTransactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'expense' && transactionDate <= today;
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
    
    return {
      totalIncome,
      totalExpense,
      balance,
      savingsRate
    };
  }, [selectedPeriod, selectedMonth, transactions]);

  // Abonelik durumu kontrolü
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setLoadingSubscription(false);
        return;
      }
      
      // Her kullanıcıyı premium olarak ayarla
      setSubscriptionStatus('premium');
      setLoadingSubscription(false);
    };
    
    checkSubscription();
  }, [user]);
  
  // Premium olmayan kullanıcı için zorunlu olarak "thisMonth" periyoduna sınırla - Bu kısıtlamayı kaldır
  useEffect(() => {
    // Kısıtlamayı kaldır - tüm kullanıcılar tüm özelliklere erişebilir
  }, [loadingSubscription, subscriptionStatus, selectedPeriod]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Gerçek Supabase sorguları
        // Burada gerçek Supabase sorguları yapılacak
        // Şimdilik demo verilerle devam ediyoruz
        
        if (!user) {
          console.log("Kullanıcı oturum açmamış, veri çekilemiyor");
          setLoading(false);
          return;
        }
        
        // Kullanılabilir ayları oluştur
        const today = new Date();
        const twelveMonthsAgo = subMonths(today, 12);
        const months = eachMonthOfInterval({
          start: twelveMonthsAgo,
          end: today
        }).map(date => ({
          value: format(date, "yyyy-MM"),
          label: format(date, "MMMM yyyy", { locale: tr })
        }));
        setAvailableMonths(months);
        
        // İşlemleri ve kategorileri getir
        const [transactionsResponse, userCategoriesResponse, generalCategoriesResponse] = await Promise.all([
          // İşlemleri getir
          supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id),
          
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
        
        if (transactionsResponse.error) {
          console.error("İşlemler yüklenirken hata oluştu:", transactionsResponse.error);
          throw transactionsResponse.error;
        }
        
        // Kategorileri birleştir
        const userCategories = userCategoriesResponse.data || [];
        const generalCategories = generalCategoriesResponse.data || [];
        const allCategoriesData = [...userCategories, ...generalCategories];
        setAllCategories(allCategoriesData);
        
        console.log("Kategori bilgileri:", { 
          kullaniciKategorileri: userCategories.length, 
          genelKategoriler: generalCategories.length, 
          toplamKategori: allCategoriesData.length 
        });
        
        const transactionsData = transactionsResponse.data || [];
        setTransactions(transactionsData);
        
        if (transactionsData.length === 0) {
          console.log("Kullanıcının işlemi bulunmuyor");
          setMonthlyData([]);
          setCategoryData([]);
          setTrendData([]);
          setSummaryStats({
            totalIncome: 0,
            totalExpense: 0,
            balance: 0,
            savingsRate: 0
          });
          setLoading(false);
          return;
        }
        
        // Aylık veri için işlemleri grupla
        const monthlyDataMap: Record<string, { gelir: number, gider: number, tasarruf: number, oran: number }> = {};
        
        // Son 6 ay için boş veri oluştur
        for (let i = 0; i < 6; i++) {
          const date = subMonths(new Date(), i);
          const monthKey = format(date, "MMM yyyy", { locale: tr });
          monthlyDataMap[monthKey] = { gelir: 0, gider: 0, tasarruf: 0, oran: 0 };
        }
        
        // İşlemleri aylara göre grupla
        transactionsData.forEach(transaction => {
          const date = new Date(transaction.date);
          const monthKey = format(date, "MMM yyyy", { locale: tr });
          
          if (monthlyDataMap[monthKey] && date <= today) {
            if (transaction.type === 'income') {
              monthlyDataMap[monthKey].gelir += transaction.amount;
            } else {
              monthlyDataMap[monthKey].gider += transaction.amount;
            }
          }
        });
        
        // Tasarruf ve oran hesapla
        Object.keys(monthlyDataMap).forEach(month => {
          const { gelir, gider } = monthlyDataMap[month];
          const tasarruf = gelir - gider;
          const oran = gelir > 0 ? (tasarruf / gelir) * 100 : 0;
          
          monthlyDataMap[month].tasarruf = tasarruf;
          monthlyDataMap[month].oran = oran;
        });
        
        // Ay adlarını düzgün formatlayarak aylık veriyi oluştur
        const realMonthlyData = Object.entries(monthlyDataMap)
          .map(([name, data]) => ({ 
            name: formatMonthName(name), 
            ...data 
          }))
          .reverse();
        
        // Kategorilere göre harcamaları hesapla
        const expensesMap: Record<string, number> = {};
        
        transactionsData
          .filter(t => t.type === 'expense')
          .forEach(transaction => {
            // Kategori adını bul
            const categoryId = transaction.category_id;
            const category = allCategoriesData.find(c => c.id === categoryId);
            const categoryName = category ? category.name : 'Diğer';
            
            expensesMap[categoryName] = (expensesMap[categoryName] || 0) + transaction.amount;
          });
        
        const realCategoryData = Object.entries(expensesMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value); // Büyükten küçüğe sırala
        
        // Trend verisi için kategoriler
        const uniqueCategories = Object.keys(expensesMap);
        const categoryTrends: Record<string, Record<string, number>> = {};
        
        // Son 6 ay için boş veri oluştur
        for (let i = 0; i < 6; i++) {
          const date = subMonths(new Date(), i);
          const monthKey = format(date, "MMM yyyy", { locale: tr });
          categoryTrends[monthKey] = {};
          
          // Her kategori için 0 değeri ata
          uniqueCategories.forEach(category => {
            categoryTrends[monthKey][category.toLowerCase()] = 0;
          });
        }
        
        // İşlemleri aylara ve kategorilere göre grupla
        transactionsData
          .filter(t => t.type === 'expense')
          .forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = format(date, "MMM yyyy", { locale: tr });
            
            if (categoryTrends[monthKey]) {
              const categoryId = transaction.category_id;
              const category = allCategoriesData.find(c => c.id === categoryId);
              const categoryName = category ? category.name.toLowerCase() : 'diğer';
              
              categoryTrends[monthKey][categoryName] = (categoryTrends[monthKey][categoryName] || 0) + transaction.amount;
            }
          });
        
        // Ay adlarını düzgün formatlayarak trend verisini oluştur
        const realTrendData = Object.entries(categoryTrends)
          .map(([name, categories]) => ({ 
            name: formatMonthName(name), 
            ...categories 
          }))
          .reverse();
        
        // Özet istatistikler
        const totalIncome = transactionsData
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const totalExpense = transactionsData
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const balance = totalIncome - totalExpense;
        const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
        
        setSummaryStats({
          totalIncome,
          totalExpense,
          balance,
          savingsRate
        });
        
        setMonthlyData(realMonthlyData);
        setCategoryData(realCategoryData);
        setTrendData(realTrendData);
        
      } catch (error) {
        console.error("Veri yükleme hatası:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, user?.id]);

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

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    // No need to reload the page or fetch data again here
    // The useEffect with the dependencies will handle that
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    // No need to reload the page or fetch data again here
    // The useEffect with the dependencies will handle that
  };

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  // Rapor paylaşma fonksiyonu
  const handleShareReport = async (method: string) => {
    try {
      if (method === 'copy') {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast.success("Rapor bağlantısı panoya kopyalandı");
      } else if (method === 'email') {
        // E-posta ile paylaşma
        const subject = encodeURIComponent("Bakiye360 Finansal Rapor");
        const body = encodeURIComponent(`Bakiye360 finansal raporumu sizinle paylaşmak istiyorum: ${window.location.href}`);
        window.open(`mailto:?subject=${subject}&body=${body}`);
        toast.success("E-posta uygulaması açıldı");
      } else if (method === 'print') {
        window.print();
        toast.success("Yazdırma penceresi açıldı");
      }
    } catch (error) {
      toast.error("Rapor paylaşılırken bir hata oluştu");
    }
  };

  // Özelleştirme ayarlarını kaydetme
  const saveCustomizeSettings = () => {
    // Hedef tasarruf oranını güncelle
    setTargetSavingsRate(customizeSettings.targetSavingsRate);
    
    // Hedef tasarruf oranını localStorage'a kaydet
    if (typeof window !== 'undefined') {
      localStorage.setItem('targetSavingsRate', customizeSettings.targetSavingsRate.toString());
    }
    
    setIsCustomizeOpen(false);
    toast.success("Rapor görünümü özelleştirildi");
  };

  // Add a function to handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Raporlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finansal Raporlar</h1>
          <p className="text-muted-foreground">
            Gelir ve giderlerinizin detaylı analizi
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Genel Bakış
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Kategoriler
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <LineChartIcon className="h-4 w-4" />
            Trendler
          </TabsTrigger>
        </TabsList>
        
        {/* Genel Bakış Sekmesi */}
        <TabsContent value="overview" className="space-y-6">
          {/* Gelir ve Gider Karşılaştırması */}
          <Card>
            <CardHeader>
              <CardTitle>Gelir ve Gider Karşılaştırması</CardTitle>
              <CardDescription>
                {selectedPeriod === "thisMonth" 
                  ? "Bu ayki" 
                  : selectedPeriod === "last3Months" 
                    ? "Son 3 aydaki" 
                    : selectedPeriod === "last6Months" 
                      ? "Son 6 aydaki" 
                      : selectedPeriod === "thisYear" 
                        ? "Bu yıldaki" 
                        : "Seçilen dönemdeki"} gelir ve giderlerinizin karşılaştırması
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={monthlyData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 20,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `₺${value/1000}K`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
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
                    <Bar 
                      dataKey="gelir" 
                      name="Gelir" 
                      fill="url(#colorIncome)" 
                      radius={[4, 4, 0, 0]}
                      barSize={30}
                    />
                    <Bar 
                      dataKey="gider" 
                      name="Gider" 
                      fill="url(#colorExpense)" 
                      radius={[4, 4, 0, 0]}
                      barSize={30}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tasarruf" 
                      name="Tasarruf" 
                      stroke="hsl(var(--chart-3))" 
                      strokeWidth={2}
                      dot={{ r: 4, fill: 'hsl(var(--chart-3))' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Gelir-Gider Dengesi ve Tasarruf Oranı */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Gelir-Gider Dengesi</CardTitle>
                <CardDescription>
                  Aylık gelir ve gider dengenizin özeti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {monthlyData.map((month, index) => {
                    const balance = month.gelir - month.gider;
                    const isPositive = balance >= 0;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{month.name}</div>
                          <div className={`font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
                            {isPositive ? "+" : ""}₺{balance.toLocaleString('tr-TR')}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div>Gelir: ₺{month.gelir.toLocaleString('tr-TR')}</div>
                          <div>Gider: ₺{month.gider.toLocaleString('tr-TR')}</div>
                        </div>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div 
                            className={`absolute h-full left-0 top-0 ${isPositive ? "bg-green-500" : "bg-red-500"}`}
                            style={{ 
                              width: `${Math.min(Math.abs(balance) / Math.max(month.gelir, month.gider) * 100, 100)}%`,
                              opacity: 0.8
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border border-border shadow-sm">
              <CardHeader className="bg-card">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-foreground" />
                  Tasarruf Oranı
                  <div className="relative group ml-1">
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                    <div className="absolute left-full top-0 ml-2 w-64 p-2 bg-popover rounded-md shadow-md text-xs text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-border z-50">
                      Hedef tasarruf oranınızı sayfanın altındaki <strong>Özelleştir</strong> butonu ile değiştirebilirsiniz.
                    </div>
                  </div>
                </CardTitle>
                <CardDescription>
                  Aylık tasarruf oranınızın değişimi
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={monthlyData.map(month => ({
                        name: month.name,
                        oran: month.gelir > 0 ? ((month.gelir - month.gider) / month.gelir) * 100 : 0,
                        hedef: targetSavingsRate // Hedef tasarruf oranı - kullanıcı tarafından ayarlanabilir olmalı
                      }))}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `%${value.toFixed(0)}`}
                        domain={[0, 'dataMax + 10']}
                      />
                      <Tooltip 
                        content={<CustomSavingsRateTooltip />}
                        cursor={{ opacity: 0.5 }}
                      />
                      <ReferenceLine 
                        y={targetSavingsRate} 
                        stroke="hsl(var(--chart-4))" 
                        strokeDasharray="3 3" 
                        label={{ 
                          value: `Hedef %${targetSavingsRate}`, 
                          position: 'right', 
                          fill: 'hsl(var(--chart-4))',
                          fontSize: 12,
                          offset: -65,
                          dy: -6
                        }} 
                      />
                      <defs>
                        <linearGradient id="colorSavingsRate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorHighSavingsRate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
                        </linearGradient>
                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="hsl(var(--muted-foreground))" floodOpacity="0.2"/>
                        </filter>
                      </defs>
                      <Bar 
                        dataKey="oran" 
                        name="Tasarruf Oranı" 
                        radius={[6, 6, 0, 0]}
                        barSize={35}
                      >
                        {
                          monthlyData.map((entry, index) => {
                            const oran = entry.gelir > 0 ? ((entry.gelir - entry.gider) / entry.gelir) * 100 : 0;
                            return (
                              <Cell 
                                key={`cell-${index}`}
                                fill={oran >= 20 ? 'url(#colorHighSavingsRate)' : 'url(#colorSavingsRate)'}
                                filter="url(#shadow)"
                              />
                            )
                          })
                        }
                      </Bar>
                      <Line 
                        type="monotone" 
                        dataKey="oran" 
                        stroke="hsl(var(--chart-3))" 
                        strokeWidth={3}
                        dot={{
                          stroke: 'hsl(var(--background))',
                          strokeWidth: 2,
                          r: 6,
                          fill: 'hsl(var(--chart-3))',
                          filter: 'drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.2))'
                        }}
                        activeDot={{
                          stroke: 'hsl(var(--background))',
                          strokeWidth: 2,
                          r: 8,
                          fill: 'hsl(var(--chart-3))',
                          filter: 'drop-shadow(0px 3px 3px rgba(0, 0, 0, 0.3))'
                        }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col items-center p-4 rounded-lg bg-muted/30 border border-border">
                    <span className="text-sm text-muted-foreground mb-1">En Yüksek</span>
                    <span className="text-2xl font-semibold text-foreground">
                      %{Math.max(...monthlyData.map(m => m.gelir > 0 ? ((m.gelir - m.gider) / m.gelir) * 100 : 0)).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-muted/30 border border-border">
                    <span className="text-sm text-muted-foreground mb-1">Ortalama</span>
                    <span className="text-2xl font-semibold text-foreground">
                      %{(monthlyData.reduce((acc, m) => acc + (m.gelir > 0 ? ((m.gelir - m.gider) / m.gelir) * 100 : 0), 0) / monthlyData.length).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-muted/30 border border-border">
                    <span className="text-sm text-muted-foreground mb-1">Son Ay</span>
                    <span className="text-2xl font-semibold text-foreground">
                      %{monthlyData.length > 0 && monthlyData[monthlyData.length - 1]?.gelir > 0 
                        ? ((monthlyData[monthlyData.length - 1].gelir - monthlyData[monthlyData.length - 1].gider) / monthlyData[monthlyData.length - 1].gelir * 100).toFixed(1) 
                        : monthlyData.length > 0 
                          ? ((monthlyData[monthlyData.length - 1]?.oran || 0)).toFixed(1)
                          : "0.0"
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Kategoriler Sekmesi */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-end mb-4">
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Dönem Seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisMonth">Bu Ay</SelectItem>
                <SelectItem value="last3Months">Son 3 Ay</SelectItem>
                <SelectItem value="last6Months">Son 6 Ay</SelectItem>
                <SelectItem value="thisYear">Bu Yıl</SelectItem>
                <SelectItem value="custom">Özel Tarih</SelectItem>
              </SelectContent>
            </Select>
            
            {selectedPeriod === "custom" && (
              <div className="ml-2">
                <Select value={selectedMonth} onValueChange={handleMonthChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Ay Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Kategori Dağılımı */}
            <Card>
              <CardHeader>
                <CardTitle>Kategori Dağılımı</CardTitle>
                <CardDescription>
                  Harcamalarınızın kategorilere göre dağılımı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        data={filteredCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        dataKey="value"
                        onMouseEnter={onPieEnter}
                      >
                        {filteredCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomCategoryTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Kategori Detayları */}
            <Card>
              <CardHeader>
                <CardTitle>Kategori Detayları</CardTitle>
                <CardDescription>
                  Her kategorinin toplam harcama içindeki payı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {filteredCategoryData.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-sm" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <span className="font-medium">₺{category.value.toLocaleString('tr-TR')}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <Progress value={category.percent * 100} className="h-2" />
                        <span className="ml-2 w-12 text-right">%{(category.percent * 100).toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Trendler Sekmesi */}
        <TabsContent value="trends" className="space-y-6">
          <div className="flex flex-wrap justify-end gap-2 mb-4">
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Dönem Seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisMonth">Bu Ay</SelectItem>
                <SelectItem value="last3Months">Son 3 Ay</SelectItem>
                <SelectItem value="last6Months">Son 6 Ay</SelectItem>
                <SelectItem value="thisYear">Bu Yıl</SelectItem>
                <SelectItem value="custom">Özel</SelectItem>
              </SelectContent>
            </Select>
            
            {selectedPeriod === "custom" && (
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ay Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Kategori Seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {categoryData.map((category) => (
                  <SelectItem key={category.name} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Harcama Trendleri</CardTitle>
              <CardDescription>
                Kategorilere göre harcama trendlerinizin zaman içindeki değişimi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  {filteredTrendData.length > 0 ? (
                    <AreaChart
                      data={filteredTrendData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `₺${value/1000}K`}
                      />
                      <Tooltip content={<CustomTrendTooltip />} />
                      <Legend />
                      {Object.keys(filteredTrendData[0] || {})
                        .filter(key => key !== 'name')
                        .map((key, index) => (
                          <Area
                            key={key}
                            type="monotone"
                            dataKey={key}
                            name={key.charAt(0).toUpperCase() + key.slice(1)}
                            stroke={COLORS[index % COLORS.length]}
                            fill={COLORS[index % COLORS.length]}
                            fillOpacity={0.2}
                            strokeWidth={2}
                          />
                        ))}
                    </AreaChart>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <p className="text-muted-foreground">Seçilen dönem için veri bulunamadı</p>
                    </div>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Rapor Özeti */}
      <Card className="mt-6 bg-card border shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Rapor Özeti</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {customizeSettings.showIncome && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Toplam Gelir</h3>
                  <p className="text-2xl font-bold">₺{filteredSummaryStats.totalIncome.toLocaleString('tr-TR')}</p>
                </div>
              )}
              
              {customizeSettings.showExpense && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Toplam Gider</h3>
                  <p className="text-2xl font-bold">₺{filteredSummaryStats.totalExpense.toLocaleString('tr-TR')}</p>
                </div>
              )}
              
              {customizeSettings.showBalance && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Net Bakiye</h3>
                  <p className="text-2xl font-bold">₺{filteredSummaryStats.balance.toLocaleString('tr-TR')}</p>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="grid gap-6 md:grid-cols-2">
              {customizeSettings.showTopCategories && (
                <div>
                  <h3 className="text-sm font-medium mb-3">En Yüksek Harcama Kategorileri</h3>
                  <ul className="space-y-3">
                    {filteredCategoryData.slice(0, 3).map((category, index) => (
                      <li key={category.name} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="mr-2 h-3 w-3 rounded-sm" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                          />
                          <span>{category.name}</span>
                        </div>
                        <span className="font-medium">₺{category.value.toLocaleString('tr-TR')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {customizeSettings.showSavingsRate && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Tasarruf Oranı</h3>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full border-4 border-muted flex items-center justify-center">
                        <div 
                          className="absolute inset-0 rounded-full"
                          style={{ 
                            background: `conic-gradient(hsl(var(--primary)) 0% ${filteredSummaryStats.savingsRate}%, transparent ${filteredSummaryStats.savingsRate}% 100%)`,
                            borderRadius: '50%',
                          }}
                        ></div>
                        <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold z-10">%{filteredSummaryStats.savingsRate.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {filteredSummaryStats.savingsRate >= 20 
                          ? "Harika bir tasarruf oranınız var!" 
                          : filteredSummaryStats.savingsRate >= 10 
                            ? "İyi bir tasarruf oranındasınız." 
                            : "Tasarruf oranınızı artırmak için harcamalarınızı gözden geçirin."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {customizeSettings.showRecommendations && (
              <div>
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-3">Öneriler</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-green-500/10 p-1 mt-0.5">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      </div>
                      <span>
                        {filteredCategoryData[0]?.name} kategorisinde harcamalarınız toplam giderlerinizin %{((filteredCategoryData[0]?.value / filteredSummaryStats.totalExpense) * 100).toFixed(1)}'ini oluşturuyor. 
                        {filteredCategoryData[0]?.name === 'Banka' || 
                         filteredCategoryData[0]?.name === 'Kredi' || 
                         filteredCategoryData[0]?.name === 'Borç' ? 
                          'Bu kategorideki harcamaları azaltmak için borç yapılandırması veya daha düşük faizli kredilere geçiş yapabilirsiniz.' : 
                          filteredCategoryData[0]?.name === 'Kira' || 
                          filteredCategoryData[0]?.name === 'Konut' ?
                          'Konut harcamalarınız yüksek görünüyor. Uzun vadede tasarruf için ev sahibi olmayı düşünebilirsiniz.' :
                          filteredCategoryData[0]?.name === 'Alışveriş' || 
                          filteredCategoryData[0]?.name === 'Eğlence' || 
                          filteredCategoryData[0]?.name === 'Yemek' ? 
                          'Bu alanda yapacağınız küçük tasarruflar bile bütçenizi dengelemenize yardımcı olabilir.' :
                          'Bu kategorideki harcamalarınızı gözden geçirerek bütçenizde iyileştirme fırsatları yaratabilirsiniz.'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-green-500/10 p-1 mt-0.5">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      </div>
                      <span>
                        {monthlyData.length >= 2 ? (
                          <>
                            Tasarruf oranınız geçen aya göre {
                              monthlyData[monthlyData.length - 1]?.oran > monthlyData[monthlyData.length - 2]?.oran 
                                ? "artış" 
                                : "azalış"
                            } göstermiştir. 
                            {
                              monthlyData[monthlyData.length - 1]?.oran > monthlyData[monthlyData.length - 2]?.oran 
                                ? "Bu olumlu trendi sürdürmeye çalışın." 
                                : `Tasarruf oranınızı %${targetSavingsRate}'nin üzerine çıkarmayı hedefleyebilirsiniz.`
                            }
                          </>
                        ) : (
                          <>Tasarruf oranınızı %{targetSavingsRate}'nin üzerine çıkarmayı hedefleyebilirsiniz.</>
                        )}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 flex justify-between">
          <p className="text-xs text-muted-foreground">
            Bu rapor {format(new Date(), "d MMMM yyyy", { locale: tr })} tarihinde oluşturulmuştur.
          </p>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  <Share2 className="h-4 w-4 mr-2" />
                  Paylaş
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleShareReport('copy')}>
                  <Copy className="h-4 w-4 mr-2" />
                  {isCopied ? "Kopyalandı!" : "Bağlantıyı Kopyala"}
                  {isCopied && <Check className="h-4 w-4 ml-2 text-green-500" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShareReport('email')}>
                  <Mail className="h-4 w-4 mr-2" />
                  E-posta ile Paylaş
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShareReport('print')}>
                  <Printer className="h-4 w-4 mr-2" />
                  Yazdır
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Dialog open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
              <DialogTrigger asChild>
                <Button variant="primary" size="sm" className="h-8 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Sliders className="h-4 w-4 mr-2" />
                  Özelleştir
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[90%] md:max-w-[425px] max-h-[80vh] overflow-y-auto fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95%] md:w-auto">
                <DialogHeader className="pb-1">
                  <DialogTitle>Rapor Ayarları</DialogTitle>
                  <DialogDescription>
                    Raporunuzun görünümünü özelleştirin
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <Label htmlFor="target-savings-rate">Hedef Tasarruf Oranı: %{customizeSettings.targetSavingsRate}</Label>
                    </div>
                    <Slider 
                      id="target-savings-rate"
                      min={5} 
                      max={50} 
                      step={5}
                      value={[customizeSettings.targetSavingsRate]} 
                      onValueChange={(value) => 
                        setCustomizeSettings({...customizeSettings, targetSavingsRate: value[0]})
                      }
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>%5</span>
                      <span>%25</span>
                      <span>%50</span>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCustomizeOpen(false)}>İptal</Button>
                    <Button type="submit" onClick={saveCustomizeSettings}>Kaydet</Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}