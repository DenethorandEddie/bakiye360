"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowLeft, Users, Lightbulb, Target, Shield, Award, Clock, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

// Animasyon varyantları
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function AboutPage() {
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<string>("light");

  useEffect(() => {
    setCurrentTheme(theme === "system" ? "light" : theme || "light");
  }, [theme]);

  const teamMembers = [
    {
      name: "Ayşe Yılmaz",
      role: "Kurucu & CEO",
      bio: "10+ yıllık finans sektörü deneyimi ile Bakiye360'ı kişisel finans yönetiminde bir devrim yaratmak amacıyla kurdu.",
      image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=500&h=500&auto=format&fit=crop"
    },
    {
      name: "Mehmet Kaya",
      role: "CTO",
      bio: "15 yıllık yazılım geliştirme tecrübesi, yapay zeka ve veri bilimi konularında uzmanlık.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=500&h=500&auto=format&fit=crop"
    },
    {
      name: "Zeynep Demir",
      role: "Ürün Direktörü",
      bio: "Kullanıcı deneyimi tasarımı ve ürün yönetimi konusunda 8 yıllık tecrübe.",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=500&h=500&auto=format&fit=crop"
    }
  ];

  const values = [
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Güvenlik",
      description: "Kullanıcılarımızın finansal verilerinin gizliliği ve güvenliği en büyük önceliğimizdir."
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-primary" />,
      title: "Yenilikçilik",
      description: "Sürekli olarak yeni teknolojileri ve yaklaşımları benimsiyor, çözümlerimizi geliştiriyoruz."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Kullanıcı Odaklılık",
      description: "Tüm kararlarımızı kullanıcılarımızın ihtiyaçları ve geri bildirimleri doğrultusunda alıyoruz."
    },
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: "Erişilebilirlik",
      description: "Finansal yönetim araçlarını herkes için erişilebilir ve anlaşılır kılmayı hedefliyoruz."
    }
  ];

  const milestones = [
    {
      year: "2021",
      title: "Fikrin Doğuşu",
      description: "Bakiye360 fikri, kişisel finans yönetiminde yaşanan zorlukları çözmek amacıyla ortaya çıktı."
    },
    {
      year: "2022",
      title: "Şirket Kuruluşu",
      description: "Bakiye360 resmen kuruldu ve ilk ekip üyeleri bir araya geldi."
    },
    {
      year: "2023 Q2",
      title: "Beta Sürümü",
      description: "Uygulamanın beta sürümü sınırlı sayıda kullanıcıyla test edilmeye başlandı."
    },
    {
      year: "2023 Q4",
      title: "Resmi Lansman",
      description: "Bakiye360 tüm özellikleriyle kullanıcılara sunuldu."
    },
    {
      year: "2025 Q3",
      title: "Yapay Zeka Entegrasyonu",
      description: "Akıllı bütçe önerileri ve harcama tahminleri için yapay zeka desteği eklendi."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center">
            <Image 
              src={currentTheme === "dark" ? "/logo_dark.png" : "/logo.png"} 
              alt="Bakiye360 Logo" 
              width={110} 
              height={28} 
              className="h-auto"
              priority
            />
          </Link>
          <div className="ml-auto flex items-center space-x-4">
            <Link 
              href="/" 
              className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/50">
          <div className="container px-4 md:px-6">
            <motion.div 
              className="max-w-3xl mx-auto text-center"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6">
                Bakiye360 Hakkında
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Finansal özgürlüğünüze giden yolda güvenilir partneriniz.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="py-16 bg-background">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
              <motion.div 
                className="space-y-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
              >
                <div className="inline-block p-2 bg-primary/10 rounded-lg mb-4">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold tracking-tighter">Vizyonumuz</h2>
                <p className="text-lg text-muted-foreground">
                  Bakiye360 olarak, her bireyin finansal kararlarını bilinçli bir şekilde almasını ve 
                  finansal hedeflerine ulaşmasını sağlayan en kapsamlı ve kullanıcı dostu çözümü sunmayı hedefliyoruz.
                </p>
              </motion.div>
              
              <motion.div 
                className="space-y-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
              >
                <div className="inline-block p-2 bg-primary/10 rounded-lg mb-4">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold tracking-tighter">Misyonumuz</h2>
                <p className="text-lg text-muted-foreground">
                  İnsanların finansal verilerini güvenli bir şekilde analiz eden, 
                  akıllı içgörüler sunan ve finansal okuryazarlığı artıran teknolojiler geliştirerek 
                  herkesin finansal özgürlüğe ulaşmasına yardımcı olmak.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter mb-4">Değerlerimiz</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Bakiye360 olarak, tüm kararlarımızı ve ürün geliştirme süreçlerimizi şekillendiren temel değerlerimiz:
              </p>
            </div>
            
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {values.map((value, index) => (
                <motion.div 
                  key={index} 
                  className="bg-background rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow"
                  variants={fadeIn}
                >
                  <div className="mb-4">{value.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* History & Milestones */}
        <section className="py-16 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter mb-4">Tarihçemiz</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Bakiye360'ın kuruluşundan bugüne kadar olan yolculuğu:
              </p>
            </div>
            
            <div className="relative max-w-3xl mx-auto">
              {/* Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-border"></div>
              
              {/* Timeline items */}
              <motion.div 
                className="space-y-12"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {milestones.map((milestone, index) => (
                  <motion.div 
                    key={index} 
                    className={`relative flex items-center ${index % 2 === 0 ? 'flex-row-reverse' : ''}`}
                    variants={fadeIn}
                  >
                    <div className="flex-1"></div>
                    <div className="z-10 flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-full shadow-sm mx-4">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className={`flex-1 ${index % 2 === 0 ? 'text-right' : ''}`}>
                      <div className="bg-background rounded-lg p-5 shadow-sm border">
                        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
                          {milestone.year}
                        </span>
                        <h3 className="text-lg font-semibold mb-2">{milestone.title}</h3>
                        <p className="text-muted-foreground">{milestone.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8">
            <div className="flex items-center">
              <Image 
                src={currentTheme === "dark" ? "/logo_dark.png" : "/logo.png"} 
                alt="Bakiye360 Logo" 
                width={110} 
                height={28} 
                className="h-auto"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-right">
              &copy; {new Date().getFullYear()} Bakiye360. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 