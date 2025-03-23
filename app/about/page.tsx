"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Target, Users, Sparkles, Award, Brain, Shield, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-24">
        <Button variant="ghost" asChild className="mb-8 hover:bg-blue-800/10">
          <Link href="/" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ana Sayfaya Dön
          </Link>
        </Button>

        <div className="text-center max-w-3xl mx-auto mb-16 pt-20">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-700 to-blue-500 text-transparent bg-clip-text">
            Finansal Özgürlüğünüzün Anahtarı
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Bakiye360, finansal yönetimi herkes için erişilebilir ve anlaşılır kılma misyonuyla 2024 yılında kuruldu. 
            Modern teknoloji ve kullanıcı dostu arayüzümüzle, bütçe yönetimini kolaylaştırıyoruz.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild className="bg-blue-700 hover:bg-blue-800">
              <Link href="/register" className="flex items-center">
                Hemen Başla
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">Giriş Yap</Link>
            </Button>
          </div>
        </div>

        {/* Misyon ve Vizyon */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-800/10 to-blue-700/5 rounded-lg blur-xl transition-all duration-500 group-hover:blur-2xl" />
            <div className="relative p-8 rounded-lg border bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-all">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Target className="h-6 w-6 mr-2 text-blue-600" />
                Misyonumuz
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Finansal özgürlüğe giden yolda kullanıcılarımızı güçlendirmek, harcama alışkanlıklarını optimize etmek ve 
                akıllı finansal kararlar almalarına yardımcı olmak için yenilikçi çözümler sunmak.
              </p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-800/10 to-blue-700/5 rounded-lg blur-xl transition-all duration-500 group-hover:blur-2xl" />
            <div className="relative p-8 rounded-lg border bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-all">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Sparkles className="h-6 w-6 mr-2 text-blue-600" />
                Vizyonumuz
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Türkiye'nin en güvenilir ve yenilikçi kişisel finans yönetim platformu olmak. Yapay zeka destekli 
                çözümlerimizle kullanıcılarımızın finansal refahını artırmak için sürekli gelişmek.
              </p>
            </div>
          </div>
        </div>

        {/* Tarihçe */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-12 text-center">Yolculuğumuz</h2>
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="relative">
              <div className="absolute left-8 h-full w-0.5 bg-gradient-to-b from-blue-700 via-blue-600/50 to-transparent" />
              
              {/* 2024 Q3 */}
              <div className="relative pl-20">
                <div className="absolute left-0 w-16 h-16 rounded-full bg-blue-800/10 flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xl font-bold">2024 Q3</h3>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-800/10 text-blue-600">Başlangıç</span>
                  </div>
                  <p className="text-muted-foreground">
                    Bakiye360'ın ilk versiyonu yayınlandı. Temel bütçe takibi, gelir-gider yönetimi ve 
                    kategori bazlı harcama analizi özellikleri ile kullanıcılarımıza hizmet vermeye başladık.
                  </p>
                </div>
              </div>

              {/* 2024 Q4 */}
              <div className="relative pl-20 mt-12">
                <div className="absolute left-0 w-16 h-16 rounded-full bg-blue-800/10 flex items-center justify-center">
                  <Award className="h-8 w-8 text-blue-600" />
                </div>
                <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xl font-bold">2024 Q4</h3>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-500">Gelişme</span>
                  </div>
                  <p className="text-muted-foreground">
                    Premium üyelik sistemi ve gelişmiş raporlama özellikleri eklendi. Kullanıcı deneyimini 
                    iyileştirmek için yeni özellikler geliştirmeye devam ediyoruz.
                  </p>
                </div>
              </div>

              {/* 2025 Q1 */}
              <div className="relative pl-20 mt-12">
                <div className="absolute left-0 w-16 h-16 rounded-full bg-blue-800/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-blue-600" />
                </div>
                <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xl font-bold">2025 Q1</h3>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-800/10 text-blue-600">Planlanan</span>
                  </div>
                  <p className="text-muted-foreground">
                    Mobil uygulama lansmanı ve otomatik kategorizasyon sistemi geliştirmeleri. 
                    Banka entegrasyonları için altyapı çalışmalarının başlatılması hedefleniyor.
                  </p>
                </div>
              </div>

              {/* 2025 Q3 */}
              <div className="relative pl-20 mt-12">
                <div className="absolute left-0 w-16 h-16 rounded-full bg-blue-800/10 flex items-center justify-center">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xl font-bold">2025 Q3</h3>
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/10 text-yellow-500">Vizyon</span>
                  </div>
                  <p className="text-muted-foreground">
                    Yapay Zeka entegrasyonu ile kişiselleştirilmiş finansal tahminler ve akıllı bütçe önerileri 
                    sunmayı hedefliyoruz. Kullanıcılarımızın finansal kararlarında yapay zeka destekli 
                    öngörüler sağlamak için çalışmalarımız devam edecek.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Değerlerimiz */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-12 text-center">Değerlerimiz</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-800/5 to-transparent rounded-lg blur-xl transition-all duration-500 group-hover:blur-2xl" />
              <div className="relative p-8 rounded-lg border bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-all">
                <div className="w-12 h-12 rounded-full bg-blue-800/10 flex items-center justify-center mb-6">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Güvenlik</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Kullanıcılarımızın finansal verilerinin güvenliği ve gizliliği bizim için en önemli önceliktir.
                  En yüksek güvenlik standartlarını uyguluyoruz.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-800/5 to-transparent rounded-lg blur-xl transition-all duration-500 group-hover:blur-2xl" />
              <div className="relative p-8 rounded-lg border bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-all">
                <div className="w-12 h-12 rounded-full bg-blue-800/10 flex items-center justify-center mb-6">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Yenilikçilik</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Sürekli gelişen teknoloji ve kullanıcı ihtiyaçlarına uygun yenilikçi çözümler geliştiriyoruz.
                  Her zaman bir adım ileride olmayı hedefliyoruz.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-800/5 to-transparent rounded-lg blur-xl transition-all duration-500 group-hover:blur-2xl" />
              <div className="relative p-8 rounded-lg border bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-all">
                <div className="w-12 h-12 rounded-full bg-blue-800/10 flex items-center justify-center mb-6">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Kullanıcı Odaklılık</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Her geliştirmemizde kullanıcılarımızın ihtiyaç ve geri bildirimlerini ön planda tutuyoruz.
                  Sizin başarınız bizim başarımızdır.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-700 to-blue-500 text-transparent bg-clip-text">Finansal Yolculuğunuza Başlayın</h2>
          <p className="text-muted-foreground mb-8">
            Bakiye360 ile finansal hedeflerinize ulaşmak artık çok daha kolay. 
            Hemen ücretsiz hesap oluşturun ve yolculuğunuza başlayın.
          </p>
          <Button size="lg" asChild className="bg-blue-950 hover:bg-blue-800">
            <Link href="/register" className="flex items-center">
              Ücretsiz Hesap Oluştur
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 