"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowLeft, Users, Lightbulb, Target, Shield, Award, Clock, TrendingUp, Calendar, Sparkles, Rocket, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

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
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ana Sayfaya Dön
          </Link>
        </Button>
        <h1 className="text-4xl font-bold mb-4">Hakkımızda</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Bakiye360, kişisel ve işletme finanslarını yönetmek için modern ve kullanıcı dostu bir platform olarak 
          2024 yılında kuruldu. Amacımız, kullanıcılarımızın finansal hedeflerine ulaşmalarına yardımcı olmak ve 
          finansal özgürlük yolculuklarında onlara rehberlik etmektir.
        </p>
      </div>

      {/* Misyon ve Vizyon */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="p-6 rounded-lg border bg-card">
          <h2 className="text-2xl font-bold mb-4">Misyonumuz</h2>
          <p className="text-muted-foreground">
            Finansal özgürlüğe giden yolda kullanıcıları güçlendirmek, harcama davranışlarını optimize etmek ve 
            yatırım potansiyellerini maksimize etmek için kullanıcı dostu, güvenli ve akıllı bir finansal yönetim aracı sunmak.
          </p>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <h2 className="text-2xl font-bold mb-4">Vizyonumuz</h2>
          <p className="text-muted-foreground">
            Türkiye'nin en güvenilir ve kapsamlı kişisel finans yönetim platformu olmak ve yapay zeka destekli 
            çözümlerimizle kullanıcılarımızın finansal refahını artırmak.
          </p>
        </div>
      </div>

      {/* Tarihçe */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-8">Tarihçemiz ve Hedeflerimiz</h2>
        <div className="space-y-8">
          {/* 2024 Q3 */}
          <div className="flex gap-4">
            <div className="flex-none">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold">2024 Q3</h3>
                <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">Başlangıç</span>
              </div>
              <p className="text-muted-foreground">
                Bakiye360'ın ilk versiyonu yayınlandı. Temel bütçe takibi, gelir-gider yönetimi ve 
                kategori bazlı harcama analizi özellikleri kullanıma sunuldu.
              </p>
            </div>
          </div>

          {/* 2024 Q4 */}
          <div className="flex gap-4">
            <div className="flex-none">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold">2024 Q4</h3>
                <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-500">Büyüme</span>
              </div>
              <p className="text-muted-foreground">
                Premium üyelik sistemi ve gelişmiş raporlama özellikleri eklendi. İlk 1000 aktif kullanıcıya ulaşıldı.
              </p>
            </div>
          </div>

          {/* 2025 Q1 */}
          <div className="flex gap-4">
            <div className="flex-none">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold">2025 Q1</h3>
                <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-500">Yenilik</span>
              </div>
              <p className="text-muted-foreground">
                Mobil uygulama lansmanı ve otomatik kategorizasyon sistemi devreye alındı. 
                Banka entegrasyonları için altyapı çalışmaları başlatıldı.
              </p>
            </div>
          </div>

          {/* 2025 Q2 */}
          <div className="flex gap-4">
            <div className="flex-none">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold">2025 Q2</h3>
                <span className="px-2 py-1 text-xs rounded-full bg-purple-500/10 text-purple-500">Genişleme</span>
              </div>
              <p className="text-muted-foreground">
                Banka entegrasyonları tamamlandı ve canlıya alındı. İşletmeler için özel çözümler geliştirildi.
                10.000 aktif kullanıcı hedefine ulaşıldı.
              </p>
            </div>
          </div>

          {/* 2025 Q3 */}
          <div className="flex gap-4">
            <div className="flex-none">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold">2025 Q3</h3>
                <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/10 text-yellow-500">Gelecek Hedef</span>
              </div>
              <p className="text-muted-foreground">
                Yapay Zeka entegrasyonu ile kişiselleştirilmiş finansal tahminler, akıllı bütçe önerileri ve 
                otomatik tasarruf stratejileri sunulması planlanıyor. Hedef: Kullanıcıların finansal kararlarında 
                yapay zeka destekli öngörüler ve öneriler sağlamak.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Değerlerimiz */}
      <div>
        <h2 className="text-3xl font-bold mb-8">Değerlerimiz</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg border bg-card">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Güvenlik</h3>
            <p className="text-muted-foreground">
              Kullanıcılarımızın finansal verilerinin güvenliği ve gizliliği bizim için en önemli önceliktir.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Yenilikçilik</h3>
            <p className="text-muted-foreground">
              Sürekli gelişen teknoloji ve kullanıcı ihtiyaçlarına uygun yenilikçi çözümler geliştiriyoruz.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Kullanıcı Odaklılık</h3>
            <p className="text-muted-foreground">
              Her geliştirmemizde kullanıcılarımızın ihtiyaç ve geri bildirimlerini ön planda tutuyoruz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 