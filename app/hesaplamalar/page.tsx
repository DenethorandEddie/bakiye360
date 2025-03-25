"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, ChevronRight, BadgeDollarSign, Percent, ArrowUpDown, Building, CreditCard, PiggyBank } from "lucide-react";

const calculators = [
  {
    id: 'kredi-hesaplama',
    title: 'Kredi Hesaplayıcısı',
    description: 'Kredi tutarı, faiz oranı ve vade bilgilerine göre aylık taksitleri hesaplayın.',
    icon: <CreditCard className="h-5 w-5" />,
    href: '/hesaplamalar/kredi-hesaplamasi',
    isAvailable: true,
  },
  {
    id: 'yatirim-getiri',
    title: 'Yatırım Getirisi Hesaplayıcısı',
    description: 'Yatırımlarınızın süreye ve getiri oranına göre potansiyel değerini hesaplayın.',
    icon: <BadgeDollarSign className="h-5 w-5" />,
    href: '/hesaplamalar/yatirim-getirisi-hesaplama',
    isAvailable: true,
  },
  {
    id: 'kredi-karti-borcu',
    title: 'Kredi Kartı Asgari Ödeme Hesaplayıcısı',
    description: 'Kredi kartı limitinize göre asgari ödeme tutarınızı hesaplayın.',
    icon: <CreditCard className="h-5 w-5" />,
    href: '/hesaplamalar/kredi-karti-borcu-hesaplama',
    isAvailable: true,
  },
  {
    id: 'faiz-hesaplama',
    title: 'Faiz Hesaplayıcısı',
    description: 'Basit veya bileşik faiz yöntemine göre birikim hesaplayın.',
    icon: <Percent className="h-5 w-5" />,
    href: '/hesaplamalar/faiz-hesaplama',
    isAvailable: true,
  },
  {
    id: 'konut-kredisi',
    title: 'Konut Kredisi Hesaplayıcısı',
    description: 'Konut kredisi tutarı, faiz oranı ve vadesi ile aylık ödemelerinizi hesaplayın.',
    icon: <Building className="h-5 w-5" />,
    href: '/hesaplamalar/konut-kredisi-hesaplama',
    isAvailable: true,
  },
  {
    id: 'doviz-hesaplama',
    title: 'Döviz Hesaplayıcısı',
    description: 'Döviz kurlarına göre para biriminizi dönüştürün.',
    icon: <ArrowUpDown className="h-5 w-5" />,
    href: '/hesaplamalar/doviz-hesaplama',
    isAvailable: true,
  },
];

export default function HesaplamaPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Finansal Hesaplayıcılar</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {calculators.map((calculator) => (
          <div key={calculator.id}>
            {calculator.isAvailable ? (
              <Link href={calculator.href}>
                <Card className="group h-full border border-foreground/10 bg-gradient-to-br from-background via-background/80 to-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50 hover:bg-gradient-to-br hover:from-primary/5 hover:via-background hover:to-background transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_25px_rgba(0,0,0,0.15)] hover:border-primary/20 rounded-xl overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors duration-300">
                        {calculator.icon}
                      </span>
                      <div className="space-y-1">
                        <CardTitle className="text-base group-hover:text-primary transition-colors duration-300">
                          {calculator.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {calculator.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ) : (
              <Card className="h-full border border-foreground/5 bg-gradient-to-br from-background/80 via-background/60 to-background/40 backdrop-blur supports-[backdrop-filter]:bg-background/30 rounded-xl overflow-hidden opacity-60">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-muted/50 text-muted-foreground">
                      {calculator.icon}
                    </span>
                    <div className="space-y-1">
                      <CardTitle className="text-base text-muted-foreground">
                        {calculator.title}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {calculator.description}
                      </CardDescription>
                      <div className="text-xs text-muted-foreground/80 mt-1">Yakında</div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}
          </div>
        ))}
      </div>
      
      <div className="bg-background/30 backdrop-blur border border-foreground/5 rounded-xl p-4 mt-6 text-xs text-muted-foreground">
        <p>
          Finansal hesaplayıcılarımız bilgilendirme amaçlıdır. Önemli finansal kararlar vermeden önce bir finans uzmanına danışmanızı öneririz.
        </p>
      </div>
    </div>
  );
} 