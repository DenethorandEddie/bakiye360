'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

export default function BlogHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-gray-900/95 dark:border-gray-800">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="transition-transform hover:scale-105">
            <Image 
              src="/logo.png" 
              alt="Bakiye360 Logo" 
              width={150} 
              height={60} 
              className="h-auto w-auto dark:hidden"
              style={{ maxHeight: '100px' }}
              priority
            />
            <Image 
              src="/logo_dark.png" 
              alt="Bakiye360 Logo" 
              width={150} 
              height={60} 
              className="h-auto w-auto hidden dark:block"
              style={{ maxHeight: '100px' }}
              priority
            />
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/blog" 
              className="text-sm font-medium relative group dark:text-white"
            >
              Blog
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <Button variant="outline" className="hidden sm:flex dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:text-gray-200" asChild>
              <Link href="/register">
                Kayıt Ol
              </Link>
            </Button>
            <Button asChild className="dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white">
              <Link href="/login" className="flex items-center">
                <ArrowRight className="mr-2 h-4 w-4" />
                Giriş Yap / Panel
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
} 