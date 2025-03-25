"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AsgariOdemeHesaplama {
  donemBorcu: number;
  kartLimiti: number;
  asgariOdemeOrani: number;
  asgariOdemeTutari: number;
  kalanBorc: number;
}

export default function KrediKartiAsgariOdemePage() {
  // Temel parametreler
  const [donemBorcu, setDonemBorcu] = useState<number>(10000);
  const [kartLimiti, setKartLimiti] = useState<number>(20000);
  const [asgariOdemeOrani, setAsgariOdemeOrani] = useState<number>(20);
  const [hesaplamaSonucu, setHesaplamaSonucu] = useState<AsgariOdemeHesaplama | null>(null);
  
  useEffect(() => {
    // Kart limitine göre asgari ödeme oranını otomatik güncelle
    if (kartLimiti >= 50000) {
      setAsgariOdemeOrani(40); // %40
    } else {
      setAsgariOdemeOrani(20); // %20
    }
    
    // Asgari ödeme hesapla
    const asgariOdemeTutari = Math.max(
      donemBorcu * (asgariOdemeOrani / 100),
      100 // Minimum 100 TL
    );
    
    setHesaplamaSonucu({
      donemBorcu,
      kartLimiti,
      asgariOdemeOrani,
      asgariOdemeTutari,
      kalanBorc: donemBorcu - asgariOdemeTutari
    });
  }, [donemBorcu, kartLimiti, asgariOdemeOrani]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  };
  
  const handleDonemBorcuInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const newAmount = value ? parseInt(value) : 0;
    if (newAmount >= 0 && newAmount <= 1000000) {
      setDonemBorcu(newAmount);
    }
  };
  
  const handleKartLimitiInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const newAmount = value ? parseInt(value) : 0;
    if (newAmount >= 0 && newAmount <= 1000000) {
      setKartLimiti(newAmount);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <CreditCard className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Kredi Kartı Asgari Ödeme Hesaplayıcısı</h1>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Card */}
        <Card className="border-foreground/10 bg-background/50 backdrop-blur shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hesaplama Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Dönem Borcu */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="donemBorcu" className="text-xs">Dönem Borcu</Label>
                <div className="flex items-center">
                  <Input
                    id="donemBorcu"
                    type="text"
                    value={donemBorcu.toLocaleString('tr-TR')}
                    onChange={handleDonemBorcuInput}
                    className="h-7 w-24 text-xs text-right mr-1 py-1"
                  />
                  <span className="text-xs font-medium">₺</span>
                </div>
              </div>
              <Slider
                value={[donemBorcu]}
                min={0}
                max={100000}
                step={1000}
                onValueChange={(value) => setDonemBorcu(value[0])}
                className="my-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₺0</span>
                <span>₺100.000</span>
              </div>
            </div>
            
            {/* Kart Limiti */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="kartLimiti" className="text-xs">Kart Limiti</Label>
                <div className="flex items-center">
                  <Input
                    id="kartLimiti"
                    type="text"
                    value={kartLimiti.toLocaleString('tr-TR')}
                    onChange={handleKartLimitiInput}
                    className="h-7 w-24 text-xs text-right mr-1 py-1"
                  />
                  <span className="text-xs font-medium">₺</span>
                </div>
              </div>
              <Slider
                value={[kartLimiti]}
                min={0}
                max={100000}
                step={1000}
                onValueChange={(value) => setKartLimiti(value[0])}
                className="my-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₺0</span>
                <span>₺100.000</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Kart limitiniz {formatCurrency(kartLimiti)}. {kartLimiti >= 50000 ? 
                  'Limit 50.000 TL ve üzerinde olduğu için asgari ödeme oranı %40 olarak uygulanır.' : 
                  'Limit 50.000 TL altında olduğu için asgari ödeme oranı %20 olarak uygulanır.'}
              </div>
            </div>
            
            {/* Asgari Ödeme Oranı */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="asgariOdemeOrani" className="text-xs">Asgari Ödeme Oranı</Label>
                <div className="flex items-center">
                  <Input
                    id="asgariOdemeOrani"
                    type="text"
                    value={asgariOdemeOrani}
                    disabled
                    className="h-7 w-16 text-xs text-right mr-1 py-1"
                  />
                  <span className="text-xs font-medium">%</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Asgari ödeme oranı kart limitinize göre otomatik belirlenir. 
                Bu ödeme tutarı, kredi kartı borcunuzun bir kısmını ödeyerek gecikme faizi oluşmasını engellerken, 
                kalan borç üzerinden faiz işlemeye devam eder.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className="border-foreground/10 bg-gradient-to-br from-primary/5 to-background shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hesaplama Sonucu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hesaplamaSonucu && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Asgari Ödeme Tutarı</div>
                    <div className="text-xl font-bold text-primary">
                      {formatCurrency(hesaplamaSonucu.asgariOdemeTutari)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Dönem borcunun %{asgariOdemeOrani}'si
                    </div>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Kalan Borç</div>
                    <div className="text-xl font-bold text-red-500">
                      {formatCurrency(hesaplamaSonucu.kalanBorc)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Faiz işleyecek tutar
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Detay</TableHead>
                        <TableHead className="text-xs text-right">Tutar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-xs">Dönem Borcu</TableCell>
                        <TableCell className="text-xs text-right">{formatCurrency(hesaplamaSonucu.donemBorcu)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Asgari Ödeme Oranı</TableCell>
                        <TableCell className="text-xs text-right">%{hesaplamaSonucu.asgariOdemeOrani}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Asgari Ödeme Tutarı</TableCell>
                        <TableCell className="text-xs text-right font-medium">{formatCurrency(hesaplamaSonucu.asgariOdemeTutari)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Kalan Borç</TableCell>
                        <TableCell className="text-xs text-right text-red-500">{formatCurrency(hesaplamaSonucu.kalanBorc)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Bilgilendirme */}
      <Alert className="bg-blue-500/5 border-blue-500/20">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-sm font-medium text-blue-500">Kredi Kartı Asgari Ödeme Bilgilendirmesi</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          <p className="mt-1">
            Kredi kartı asgari ödeme tutarı, dönem borcunuzun son ödeme tarihine kadar ödemeniz gereken minimum tutardır. 
            Bu ödeme tutarı, kredi kartı borcunuzun bir kısmını ödeyerek gecikme faizi oluşmasını engellerken, 
            kalan borç üzerinden faiz işlemeye devam eder.
          </p>
          <p className="mt-2">
            Önemli Bilgiler:
          </p>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>50.000 TL altındaki kart limitleri için asgari ödeme oranı %20'dir</li>
            <li>50.000 TL ve üzerindeki kart limitleri için asgari ödeme oranı %40'tır</li>
            <li>Dönem borcunuzun tamamını ödeyemiyorsanız, asgari ödeme tutarını bilmek ve zamanında ödemek kredi notunuzun olumsuz etkilenmesini engeller</li>
            <li>Asgari ödeme tutarı en az 100 TL'dir</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
} 