"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import {
  ArrowRight,
  BarChart3,
  LineChart,
  Wallet,
  Bell,
  Target,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  ArrowUpRight,
  Menu,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

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
        if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://example.supabase.co') {
          const demoUser = localStorage.getItem('demoUser');
          if (demoUser) {
            setIsAuthenticated(true);
            router.push('/dashboard');
            return;
          }
          setLoading(false);
          return;
        }

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

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-[#02051A]">
      {/* Ana Arka Plan Efektleri */}
      <div className="fixed inset-0 w-full h-full">
        {/* Ana Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#02051A] via-[#040B2C] to-[#02051A]" />
        
        {/* Alt Dalga Efekti */}
        <div className="absolute bottom-0 left-0 right-0 h-[600px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#0A1B4F_0%,transparent_60%)]" />
        </div>

        {/* İnce Çizgiler */}
        <div className="absolute inset-0">
          <div className="absolute top-[30%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#1E3A8A]/10 to-transparent" />
          <div className="absolute top-[60%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#1E3A8A]/10 to-transparent" />
        </div>

        {/* Minimal Yıldızlar */}
        <div className="absolute inset-0">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-[1px] h-[1px] bg-white"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.3 + 0.1
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="container z-40 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-blue-800/10 to-blue-900/10 backdrop-blur-sm rounded-2xl" />
        <div className="flex h-20 items-center justify-between py-6 relative">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/" className="hidden md:block">
              <Image
                src="/logo_dark.png"
                alt="Bakiye360"
                width={80}
                height={80}
                className="h-30 w-auto"
              />
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-200 hover:text-white transition-colors"
            >
              Giriş Yap
            </Link>
            <Button asChild className="bg-blue-700 hover:bg-blue-800 text-white transition-colors">
              <Link href="/register" className="flex items-center gap-2">
                Ücretsiz Hesap Oluştur
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 -z-10">
            {/* Ana Gradient Arka Plan */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-background to-blue-900/30" />
            
            {/* Parlak Efektler */}
            <div className="absolute inset-0">
              <div className="absolute top-20 left-20 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-[128px] animate-pulse" />
              <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[128px] animate-pulse delay-700" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-500/20 rounded-full blur-[128px] animate-pulse delay-1000" />
            </div>
            
            {/* Izgara Deseni */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_40%,transparent_100%)]" />
            
            {/* Parıltı Efekti */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
            
            {/* Yıldız Efekti */}
            <div className="absolute inset-0">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`
                  }}
                />
              ))}
            </div>
          </div>

          <div className="container relative">
            <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-3xl text-center mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-sm font-medium bg-foreground/5 text-foreground/80"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                  </span>
                  Tamamen Ücretsiz
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-6"
                >
                  Finansal Geleceğinizi{" "}
                  <span className="text-primary">Kontrol Altına Alın</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
                >
                  Bakiye360 ile gelir ve giderlerinizi akıllıca yönetin, finansal hedeflerinize ulaşın.
                  Kişisel finans yönetimi artık çok daha kolay.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <Button 
                    size="lg" 
                    className="bg-foreground text-background hover:bg-foreground/90 dark:bg-background dark:text-foreground dark:hover:bg-background/90 h-12 px-8 rounded-full"
                    asChild
                  >
                    <Link href="/register">
                      Hemen Ücretsiz Başla
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="h-12 px-8 rounded-full border-foreground/20"
                    asChild
                  >
                    <a href="#features">
                      Daha Fazla Bilgi
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </motion.div>
                    </div>
                    
              {/* Dashboard Preview */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.7 }}
                className="relative mt-16 md:mt-24"
              >
                <div className="relative rounded-xl overflow-hidden shadow-2xl border border-foreground/10">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/10" />
                            <Image
                    src="/dashboard-preview.png"
                    alt="Bakiye360 Dashboard"
                    width={2880}
                    height={1620}
                    className="w-full h-auto"
                    priority
                  />
                      </div>
                      
                {/* Stats Overlay */}
                <div className="absolute -bottom-6 md:-bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mx-4 mt-8 md:mt-0">
                    {[
                      { value: "1000+", label: "Aktif Kullanıcı" },
                      { value: "50K+", label: "İşlem Kaydı" },
                      { value: "4.9/5", label: "Kullanıcı Puanı" },
                      { value: "%100", label: "Ücretsiz" }
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                        className="bg-background/80 backdrop-blur-lg rounded-lg p-3 md:p-4 text-center border border-foreground/10 shadow-lg"
                      >
                        <div className="text-lg md:text-2xl font-bold text-foreground">
                          {stat.value}
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground">
                          {stat.label}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section - Updated with modern design */}
        <section id="features" className="py-24 md:py-32 relative overflow-hidden bg-[#040B2C]">
          <div className="container relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-3xl md:text-4xl font-bold mb-4 text-white"
              >
                Öne Çıkan Özellikler
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-gray-300 text-lg"
              >
                Finansal hayatınızı kolaylaştıracak güçlü özellikler ile tanışın
              </motion.p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Wallet className="h-6 w-6" />,
                  title: "Gelir/Gider Takibi",
                  description: "Tüm finansal hareketlerinizi kolayca takip edin ve kategorize edin."
                },
                {
                  icon: <BarChart3 className="h-6 w-6" />,
                  title: "Detaylı Raporlar",
                  description: "Harcama alışkanlıklarınızı analiz edin ve finansal trendleri görün."
                },
                {
                  icon: <Target className="h-6 w-6" />,
                  title: "Bütçe Hedefleri",
                  description: "Kategori bazlı bütçe hedefleri belirleyin ve takip edin."
                },
                {
                  icon: <Bell className="h-6 w-6" />,
                  title: "Akıllı Bildirimler",
                  description: "Önemli finansal olaylar için anında bildirimler alın."
                },
                {
                  icon: <LineChart className="h-6 w-6" />,
                  title: "Trend Analizi",
                  description: "Gelir ve gider trendlerinizi görselleştirin ve analiz edin."
                },
                {
                  icon: <ArrowUpRight className="h-6 w-6" />,
                  title: "Tasarruf Önerileri",
                  description: "Kişiselleştirilmiş tasarruf önerileri ile birikimlerinizi artırın."
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="group relative bg-[#02051A]/80 backdrop-blur-sm rounded-xl p-6 border border-blue-500/10 hover:border-blue-500/30 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
                    <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                      <div className="text-blue-400">{feature.icon}</div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Arka Plan Efektleri */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0A1B4F_0%,transparent_60%)]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-[#02051A] relative">
          <div className="container relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4 text-white">Nasıl Çalışır?</h2>
              <p className="text-gray-400">
                Bakiye360'ı kullanmaya başlamak çok kolay
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center space-y-4 bg-[#040B2C]/50 p-8 rounded-xl border border-blue-500/10 hover:border-blue-500/30 transition-all">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                  <span className="text-lg font-bold text-blue-400">1</span>
                </div>
                <h3 className="text-xl font-semibold text-white">Hesap Oluşturun</h3>
                <p className="text-gray-400">
                  Ücretsiz hesabınızı oluşturun ve hemen kullanmaya başlayın.
                </p>
              </div>

              <div className="text-center space-y-4 bg-[#040B2C]/50 p-8 rounded-xl border border-blue-500/10 hover:border-blue-500/30 transition-all">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                  <span className="text-lg font-bold text-blue-400">2</span>
                </div>
                <h3 className="text-xl font-semibold text-white">İşlemlerinizi Girin</h3>
                <p className="text-gray-400">
                  Gelir ve giderlerinizi kolayca kaydedin ve kategorize edin.
                </p>
              </div>

              <div className="text-center space-y-4 bg-[#040B2C]/50 p-8 rounded-xl border border-blue-500/10 hover:border-blue-500/30 transition-all">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                  <span className="text-lg font-bold text-blue-400">3</span>
                </div>
                <h3 className="text-xl font-semibold text-white">Analiz Edin</h3>
                <p className="text-gray-400">
                  Detaylı raporlar ve grafiklerle finansal durumunuzu analiz edin.
                </p>
              </div>
            </div>
          </div>

          {/* Arka Plan Efektleri */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0A1B4F_0%,transparent_60%)]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-[#040B2C] relative">
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Finansal Özgürlüğünüze İlk Adımı Atın
              </h2>
              <p className="text-xl text-gray-400">
                Bakiye360 ile finansal hedeflerinize ulaşmak artık çok daha kolay.
                Hemen ücretsiz hesabınızı oluşturun ve yolculuğunuza başlayın.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white" 
                  asChild
                >
                  <Link href="/register">
                    Ücretsiz Hesap Oluştur
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Arka Plan Efektleri */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0A1B4F_0%,transparent_60%)]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative bg-[#02051A] border-t border-blue-500/10 mt-20">
        {/* Footer Arka Plan Efektleri */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#0A1B4F_0%,transparent_50%)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        </div>

        <div className="container relative z-10 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <h4 className="font-semibold text-white text-lg">Ürün</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors duration-200">Özellikler</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition-colors duration-200">Nasıl Çalışır</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors duration-200">Kayıt Ol</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors duration-200">Giriş Yap</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white text-lg">Şirket</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors duration-200">Hakkımızda</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors duration-200">Blog</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white text-lg">Yasal</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/privacy-policy" className="hover:text-white transition-colors duration-200">Gizlilik Politikası</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-white transition-colors duration-200">Kullanım Koşulları</Link></li>
                <li><Link href="/cookie-policy" className="hover:text-white transition-colors duration-200">Çerez Politikası</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white text-lg">İletişim</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="hover:text-white transition-colors duration-200">destek@bakiye360.com</li>
                <li className="hover:text-white transition-colors duration-200">İstanbul, Türkiye</li>
              </ul>
            </div>
          </div>

          {/* Alt Kısım */}
          <div className="pt-8 border-t border-blue-500/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Bakiye360. Tüm hakları saklıdır.
            </p>
              <div className="flex items-center gap-4">
                <Link href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}