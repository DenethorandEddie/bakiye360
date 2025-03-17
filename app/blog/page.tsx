"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search } from "lucide-react";

// Sample blog post data
const blogPosts = [
  {
    id: 1,
    title: "Kişisel Finans Yönetiminde 5 Temel İpucu",
    excerpt: "Finansal özgürlüğünüze giden yolda size yardımcı olacak temel ipuçlarını derledik.",
    date: "15 Mart 2024",
    readTime: "5 dk",
    category: "Finansal Tavsiyeler",
    image: "/blog/financial-tips.jpg"
  },
  {
    id: 2,
    title: "Bütçe Planlaması Nasıl Yapılır?",
    excerpt: "Etkili bir bütçe planlaması için adım adım rehber ve öneriler.",
    date: "10 Mart 2024",
    readTime: "7 dk",
    category: "Bütçe Yönetimi",
    image: "/blog/budget-planning.jpg"
  },
  {
    id: 3,
    title: "Tasarruf Etmenin Akıllı Yolları",
    excerpt: "Günlük hayatta uygulayabileceğiniz pratik tasarruf yöntemleri.",
    date: "5 Mart 2024",
    readTime: "6 dk",
    category: "Tasarruf",
    image: "/blog/saving-money.jpg"
  }
];

export default function BlogPage() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <Image 
                src={theme === "dark" ? "/logo_dark.png" : "/logo.png"} 
                alt="Bakiye360 Logo" 
                width={180} 
                height={80} 
                className="h-auto w-auto"
                style={{ maxHeight: '118px' }}
                priority
              />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/#features" className="text-sm font-medium transition-colors hover:text-primary">
                Özellikler
              </Link>
              <Link href="/#testimonials" className="text-sm font-medium transition-colors hover:text-primary">
                Kullanıcı Yorumları
              </Link>
              <Link href="/#pricing" className="text-sm font-medium transition-colors hover:text-primary">
                Fiyatlandırma
              </Link>
              <Link href="/blog" className="text-sm font-medium text-primary">
                Blog
              </Link>
            </nav>
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
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tighter">
                Bakiye360 Blog
              </h1>
              <p className="text-muted-foreground max-w-[600px]">
                Finansal özgürlüğünüz için güncel bilgiler, ipuçları ve uzman tavsiyeleri.
              </p>
              <div className="w-full max-w-sm space-y-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Blog yazılarında ara..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-12 md:py-16">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts
                .filter(post => 
                  post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  post.category.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(post => (
                  <article key={post.id} className="group relative flex flex-col space-y-2">
                    <Image
                      src={post.image}
                      alt={post.title}
                      width={600}
                      height={400}
                      className="rounded-lg object-cover w-full aspect-[16/9]"
                    />
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{post.category}</span>
                      <span>•</span>
                      <span>{post.date}</span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h2 className="text-xl font-bold">{post.title}</h2>
                    <p className="text-muted-foreground">{post.excerpt}</p>
                    <Button variant="link" className="p-0 h-auto font-medium">
                      Devamını Oku
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </article>
                ))}
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
                  src={theme === "dark" ? "/logo_dark.png" : "/logo.png"} 
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
                  <Link href="/#features" className="text-muted-foreground hover:text-foreground">
                    Özellikler
                  </Link>
                </li>
                <li>
                  <Link href="/#pricing" className="text-muted-foreground hover:text-foreground">
                    Fiyatlandırma
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Şirket</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-foreground">
                    Hakkımızda
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-muted-foreground hover:text-foreground">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 