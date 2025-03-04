"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { ArrowRight, BarChart3, CreditCard, LineChart, PieChart, Shield, Target, Wallet, CheckCircle2, TrendingUp, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { theme, resolvedTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<string | undefined>(undefined);
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key-for-development'
  });

  useEffect(() => {
    setCurrentTheme(theme === 'system' ? resolvedTheme : theme);
  }, [theme, resolvedTheme]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Demo mod kontrolü
        if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://example.supabase.co') {
          // Demo modda kullanıcı oturumu kontrolü
          const demoUser = localStorage.getItem('demoUser');
          if (demoUser) {
            setIsAuthenticated(true);
            router.push('/dashboard');
            return;
          }
          setLoading(false);
          return;
        }

        // Gerçek Supabase oturum kontrolü
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
          router.push('/dashboard');
          return;
        }
        setLoading(false);
      } catch (error) {
        console.error("Error checking session:", error);
        setLoading(false);
      }
    };

    checkSession();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Yükleniyor...</h2>
          <p className="text-muted-foreground">Lütfen bekleyin</p>
        </div>
      </div>
    );
  }

  // If authenticated, don't render the landing page
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Image 
              src={currentTheme === "dark" ? "/logo_dark.png" : "/logo.png"} 
              alt="Bakiye360 Logo" 
              width={180} 
              height={80} 
              className="h-auto w-auto"
              style={{ maxHeight: '118px' }}
              priority
            />
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium transition-colors hover:text-primary">
                Özellikler
              </a>
              <a href="#testimonials" className="text-sm font-medium transition-colors hover:text-primary">
                Kullanıcı Yorumları
              </a>
              <a href="#pricing" className="text-sm font-medium transition-colors hover:text-primary">
                Fiyatlandırma
              </a>
            </nav>
            <div className="flex items-center gap-2">
              <ModeToggle />
              <Button variant="ghost" asChild>
                <Link href="/login">Giriş Yap</Link>
              </Button>
              <Button asChild>
                <Link href="/login">
                  Panele Git
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
          <div className="container px-4 md:px-6 relative">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-6 z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Finansal özgürlüğünüz için
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                  Finansal Geleceğinizi<br />Kontrol Altına Alın
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Bakiye360 ile gelir ve giderlerinizi akıllıca yönetin, finansal hedeflerinize ulaşın ve tasarruflarınızı artırın. Kişisel finans yönetimi artık çok daha kolay.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="group" asChild>
                    <Link href="/register">
                      Hemen Başla
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="group" asChild>
                    <a href="#features">
                      Özellikleri Keşfet
                      <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </a>
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-8">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted overflow-hidden">
                        <Image 
                          src={`https://i.pravatar.cc/150?img=${i+10}`} 
                          alt="User avatar" 
                          width={32} 
                          height={32}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">1,000+</span> kullanıcı tarafından tercih ediliyor
                  </div>
                </div>
              </div>
              <div className="mx-auto lg:mx-0 relative">
                <div className="relative rounded-xl border bg-card shadow-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5"></div>
                  <div className="relative p-6 pt-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium">Bakiye360 Panelim</h3>
                        <p className="text-xs text-muted-foreground">Finansal durumunuza genel bakış</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg bg-background p-3 border border-border/50">
                          <div className="text-xs text-muted-foreground mb-1">Toplam Gelir</div>
                          <div className="text-lg font-bold text-primary flex items-center gap-1">
                            ₺12,500
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          </div>
                        </div>
                        <div className="rounded-lg bg-background p-3 border border-border/50">
                          <div className="text-xs text-muted-foreground mb-1">Toplam Gider</div>
                          <div className="text-lg font-bold text-destructive flex items-center gap-1">
                            ₺8,320
                            <TrendingUp className="h-3 w-3 text-red-500" />
                          </div>
                        </div>
                        <div className="rounded-lg bg-background p-3 border border-border/50">
                          <div className="text-xs text-muted-foreground mb-1">Tasarruf</div>
                          <div className="text-lg font-bold text-green-500">₺4,180</div>
                        </div>
                      </div>
                      
                      <div className="rounded-lg bg-background p-4 border border-border/50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium">Harcama Dağılımı</h4>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-[140px] w-1/2 relative rounded-md" style={{ backgroundColor: currentTheme === "light" ? "#ffffff" : "#0a0a0a" }}>
                            <Image
                              src={currentTheme === "light" ? "/image_light.png" : "/image.png"}
                              alt="Harcama Dağılımı Grafiği"
                              fill
                              className="object-contain"
                            />
                          </div>
                          <div className="h-[140px] w-1/2 relative rounded-md" style={{ backgroundColor: currentTheme === "light" ? "#ffffff" : "#0a0a0a" }}>
                            <Image
                              src={currentTheme === "light" ? "/image_light2.png" : "/image2.png"}
                              alt="Harcama Dağılımı Grafiği 2"
                              fill
                              className="object-contain"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="rounded-lg bg-background p-4 border border-border/50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium">Bütçe Hedefleri</h4>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">Tümünü Gör</Button>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>Yiyecek</span>
                              <span>₺1,200 / ₺1,500</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: '80%' }}></div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>Ulaşım</span>
                              <span>₺600 / ₺800</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: '75%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Harcama Trendleri - Yeni Eklenen Bölüm */}
                      <div className="rounded-lg bg-background p-4 border border-border/50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium">Harcama Trendleri</h4>
                        </div>
                        <div className="h-[140px] w-full relative">
                          <div className="text-xs text-muted-foreground mb-2">Son 6 aylık harcama trendi</div>
                          <div className="flex items-end h-16 w-full justify-between mt-2">
                            {/* 6 aylık çubuk grafik */}
                            <div className="flex flex-col items-center">
                              <div className="h-8 w-6 bg-primary/80 rounded-sm"></div>
                              <span className="text-[10px] mt-1">Oca</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="h-10 w-6 bg-primary/80 rounded-sm"></div>
                              <span className="text-[10px] mt-1">Şub</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="h-12 w-6 bg-primary/80 rounded-sm"></div>
                              <span className="text-[10px] mt-1">Mar</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="h-9 w-6 bg-primary/80 rounded-sm"></div>
                              <span className="text-[10px] mt-1">Nis</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="h-14 w-6 bg-primary/80 rounded-sm"></div>
                              <span className="text-[10px] mt-1">May</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="h-11 w-6 bg-primary/80 rounded-sm"></div>
                              <span className="text-[10px] mt-1">Haz</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -bottom-6 -right-6 -z-10 h-[350px] w-[350px] rounded-full bg-primary/20 blur-3xl"></div>
                <div className="absolute -top-6 -left-6 -z-10 h-[350px] w-[350px] rounded-full bg-secondary/20 blur-3xl"></div>
                
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 bg-background rounded-lg border shadow-lg p-3 flex items-center gap-2 z-20">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">Tasarruf Oranı</div>
                    <div className="text-sm font-bold">%33.4</div>
                  </div>
                </div>
                
                <div className="absolute -bottom-4 -left-4 bg-background rounded-lg border shadow-lg p-3 flex items-center gap-2 z-20">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">Hedef Tamamlandı</div>
                    <div className="text-sm font-bold">2/5</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Background decorative elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-primary/5 opacity-70 pointer-events-none -z-10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary/10 opacity-70 pointer-events-none -z-10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-primary/20 opacity-70 pointer-events-none -z-10"></div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Finansal Kontrolü Elinize Alın
              </h2>
              <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
                Bakiye360 ile finansal hedeflerinize ulaşmanın en kolay yolu
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Gelir ve Gider Takibi</h3>
                <p className="text-muted-foreground">
                  Tüm gelir ve giderlerinizi kategorilere göre takip edin, finansal durumunuzu anlık olarak görüntüleyin.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Bütçe Hedefleri</h3>
                <p className="text-muted-foreground">
                  Kategorilere göre bütçe hedefleri belirleyin, harcamalarınızı kontrol altında tutun ve tasarruf edin.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Detaylı Raporlar</h3>
                <p className="text-muted-foreground">
                  Harcama alışkanlıklarınızı analiz edin, gelir-gider dengenizi görselleştirin ve finansal kararlar alın.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Trend Analizi</h3>
                <p className="text-muted-foreground">
                  Zaman içindeki finansal değişimlerinizi izleyin, gelecek için daha iyi planlar yapın.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <PieChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Kategori Bazlı Analiz</h3>
                <p className="text-muted-foreground">
                  Harcamalarınızı kategorilere göre analiz edin, gereksiz harcamaları tespit edin ve tasarruf fırsatlarını keşfedin.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Güvenli ve Özel</h3>
                <p className="text-muted-foreground">
                  Finansal verileriniz güvende. Verileriniz şifrelenir ve sadece sizin erişiminize açıktır.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Nasıl Çalışır?
              </h2>
              <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
                Sadece üç kolay adımda finansal kontrolü elinize alın
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="relative flex flex-col items-center text-center p-6 bg-card rounded-lg border shadow-sm">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div className="mt-6 mb-4 h-48 w-full relative">
                  <Image
                    src="https://images.unsplash.com/photo-1556155092-490a1ba16284?q=80&w=300&auto=format&fit=crop"
                    alt="Kayıt ol"
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold mb-2">Hesap Oluşturun</h3>
                <p className="text-muted-foreground">
                  Hızlı ve kolay bir şekilde hesabınızı oluşturun ve uygulamaya giriş yapın.
                </p>
              </div>
              <div className="relative flex flex-col items-center text-center p-6 bg-card rounded-lg border shadow-sm">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div className="mt-6 mb-4 h-48 w-full relative">
                  <Image
                    src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=300&auto=format&fit=crop"
                    alt="İşlemleri girin"
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold mb-2">İşlemlerinizi Girin</h3>
                <p className="text-muted-foreground">
                  Gelir ve giderlerinizi kategorilere göre ekleyin, düzenli işlemlerinizi otomatikleştirin.
                </p>
              </div>
              <div className="relative flex flex-col items-center text-center p-6 bg-card rounded-lg border shadow-sm">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div className="mt-6 mb-4 h-48 w-full relative">
                  <Image
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=300&auto=format&fit=crop"
                    alt="Analiz edin"
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold mb-2">Analizleri İnceleyin</h3>
                <p className="text-muted-foreground">
                  Detaylı raporlar ve grafiklerle finansal durumunuzu analiz edin, tasarruf fırsatlarını keşfedin.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Kullanıcılarımız Ne Diyor?
              </h2>
              <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
                Binlerce kullanıcı finansal hedeflerine ulaşmak için Bakiye360'ı kullanıyor
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-6 rounded-lg border bg-card shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                    <span className="font-bold text-white">ZA</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Zeynep Aydın</h4>
                    <p className="text-sm text-muted-foreground">Finans Uzmanı, İzmir</p>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  "Bakiye360'ı kullanmaya başladıktan sonra harcamalarımı çok daha iyi kontrol edebiliyorum. 
                  Artık her ay düzenli olarak tasarruf edebiliyorum."
                </p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div className="p-6 rounded-lg border bg-card shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mr-3">
                    <span className="font-bold text-white">EY</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Eren Yılmaz</h4>
                    <p className="text-sm text-muted-foreground">KOBİ Sahibi, İstanbul</p>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  "Bütçe hedefleri özelliği sayesinde harcamalarımı kategorilere göre sınırlandırabiliyorum. 
                  Görsel raporlar finansal durumumu anlamama çok yardımcı oluyor."
                </p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div className="p-6 rounded-lg border bg-card shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center mr-3">
                    <span className="font-bold text-white">SK</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Selin Kaya</h4>
                    <p className="text-sm text-muted-foreground">Yazılım Mühendisi, Ankara</p>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  "Kullanımı çok kolay ve sezgisel bir arayüze sahip. Artık tüm finansal işlemlerimi tek bir yerden 
                  yönetebiliyorum. Kesinlikle tavsiye ederim!"
                </p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-5 h-5 ${i < 4 ? "text-yellow-500" : "text-yellow-300"} fill-current`} viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 md:py-24 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Basit ve Şeffaf Fiyatlandırma
              </h2>
              <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
                İhtiyaçlarınıza uygun planı seçin ve finansal kontrolü elinize alın
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Free Plan */}
              <div className="flex flex-col p-6 rounded-lg border bg-card shadow-sm h-full">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-primary/10"></div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold">Ücretsiz</h3>
                  <div className="mt-4 mb-4">
                    <span className="text-4xl font-bold">₺0</span>
                    <span className="text-muted-foreground">/ay</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Temel finansal takip için ideal
                  </p>
                </div>
                <ul className="space-y-3 mb-6 flex-1">
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                    <span>Sınırsız gelir/gider takibi</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                    <span>Temel raporlar</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                    <span>5 bütçe hedefi</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                    <span>Web uygulaması erişimi</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                    <span>E-posta desteği</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full group mt-auto" asChild>
                  <Link href="/register">
                    Ücretsiz Başla
                    <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
              
              {/* Premium Plan */}
              <div className="flex flex-col p-6 rounded-lg border-2 border-primary bg-card shadow-xl relative h-full transform hover:scale-105 transition-all duration-300 z-10">
                <div className="absolute -top-5 -left-5 -right-5 -bottom-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl -z-10 blur-sm"></div>
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-primary/60 rounded-t-lg"></div>
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold py-1 px-4 rounded-full shadow-lg">
                  En Popüler
                </div>
                <div className="text-center mb-6 pt-2">
                  <h3 className="text-xl font-bold">Premium</h3>
                  <div className="mt-4 mb-4">
                    <span className="text-4xl font-bold">₺49</span>
                    <span className="text-muted-foreground">/ay</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Detaylı finansal analiz için
                  </p>
                </div>
                <ul className="space-y-3 mb-6 flex-1">
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                    <span>Ücretsiz planın tüm özellikleri</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                    <span>Gelişmiş raporlar ve analizler</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                    <span>Sınırsız bütçe hedefi</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                    <span>Tekrarlayan işlemler</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                    <span>Veri yedekleme</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                    <span>Mobil uygulama erişimi</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                    <span>Öncelikli destek</span>
                  </li>
                </ul>
                <Button className="w-full group mt-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-md" asChild>
                  <Link href="/register">
                    Şimdi Başla
                    <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
              
              {/* Business Plan */}
              <div className="flex flex-col p-6 rounded-lg border bg-card shadow-sm h-full">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/60 to-primary/40"></div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold">İşletme</h3>
                  <div className="mt-4 mb-4">
                    <span className="text-4xl font-bold">₺149</span>
                    <span className="text-muted-foreground">/ay</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Küçük işletmeler için
                  </p>
                </div>
                <ul className="space-y-3 mb-6 flex-1">
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                    <span>Premium planın tüm özellikleri</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                    <span>5 kullanıcı hesabı</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                    <span>İşletme raporları</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                    <span>Gelir-gider projeksiyonları</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                    <span>Nakit akışı analizi</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                    <span>Özel API erişimi</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                    <span>7/24 öncelikli destek</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full group mt-auto" asChild>
                  <Link href="/register">
                    Şimdi Başla
                    <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-4 md:space-y-6 max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Finansal Özgürlüğünüz İçin İlk Adımı Atın
              </h2>
              <p className="text-muted-foreground md:text-xl">
                Bütçenizi yönetmek, tasarruf etmek ve finansal hedeflerinize ulaşmak için hemen başlayın.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/register">
                    Ücretsiz Hesap Oluştur
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#features">Daha Fazla Bilgi</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center">
                <Image 
                  src={currentTheme === "dark" ? "/logo_dark.png" : "/logo.png"} 
                  alt="Bakiye360 Logo" 
                  width={180} 
                  height={45} 
                  className="h-auto w-auto"
                  style={{ maxHeight: '112px' }}
                  priority
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Finansal özgürlüğünüz için akıllı bütçe yönetimi çözümü.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Ürün</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="text-muted-foreground hover:text-foreground">Özellikler</a>
                </li>
                <li>
                  <a href="#pricing" className="text-muted-foreground hover:text-foreground">Fiyatlandırma</a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">Sık Sorulan Sorular</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Şirket</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-foreground">Hakkımızda</Link>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">Blog</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Yasal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground">Gizlilik Politikası</Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="text-muted-foreground hover:text-foreground">Kullanım Şartları</Link>
                </li>
                <li>
                  <Link href="/cookie-policy" className="text-muted-foreground hover:text-foreground">Çerez Politikası</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Bakiye360. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}