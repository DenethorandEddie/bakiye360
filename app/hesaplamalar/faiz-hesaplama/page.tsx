"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FaizHesaplama {
  anaPara: number;
  faizOrani: number;
  sure: number;
  faizTutari: number;
  toplamTutar: number;
  aylikKazanc: number;
  yillikKazanc: number;
  birikimTablosu: BirikimDetay[];
}

interface BirikimDetay {
  donem: number;
  anaPara: number;
  faizTutari: number;
  toplamTutar: number;
}

export default function FaizHesaplamaPage() {
  // Temel parametreler
  const [anaPara, setAnaPara] = useState<number>(10000);
  const [faizOrani, setFaizOrani] = useState<number>(20);
  const [sure, setSure] = useState<number>(12);
  const [sureBirimi, setSureBirimi] = useState<'ay' | 'yil'>('ay');
  const [faizTipi, setFaizTipi] = useState<'basit' | 'bilesik'>('basit');
  const [hesaplamaSonucu, setHesaplamaSonucu] = useState<FaizHesaplama | null>(null);
  
  useEffect(() => {
    hesaplaFaiz();
  }, [anaPara, faizOrani, sure, sureBirimi, faizTipi]);
  
  const hesaplaFaiz = () => {
    const yillikSure = sureBirimi === 'ay' ? sure / 12 : sure;
    const aylikSure = sureBirimi === 'ay' ? sure : sure * 12;
    let faizTutari = 0;
    let toplamTutar = 0;
    const birikimTablosu: BirikimDetay[] = [];
    
    if (faizTipi === 'basit') {
      // Basit faiz: A = P(1 + rt) formülü
      faizTutari = (anaPara * faizOrani * yillikSure) / 100;
      toplamTutar = anaPara + faizTutari;
      
      // Birikim tablosu oluştur
      for (let i = 1; i <= yillikSure; i++) {
        const donemFaizi = (anaPara * faizOrani * i) / 100;
        birikimTablosu.push({
          donem: i,
          anaPara: anaPara,
          faizTutari: donemFaizi,
          toplamTutar: anaPara + donemFaizi
        });
      }
    } else {
      // Bileşik faiz: A = P(1 + r)^t formülü
      const yillikFaizOrani = faizOrani / 100;
      let birikimTutari = anaPara;
      
      // Birikim tablosu oluştur
      for (let i = 1; i <= yillikSure; i++) {
        const yeniBirikimTutari = birikimTutari * (1 + yillikFaizOrani);
        const donemFaizi = yeniBirikimTutari - birikimTutari;
        
        birikimTablosu.push({
          donem: i,
          anaPara: birikimTutari,
          faizTutari: donemFaizi,
          toplamTutar: yeniBirikimTutari
        });
        
        birikimTutari = yeniBirikimTutari;
      }
      
      toplamTutar = birikimTutari;
      faizTutari = toplamTutar - anaPara;
    }
    
    setHesaplamaSonucu({
      anaPara,
      faizOrani,
      sure,
      faizTutari,
      toplamTutar,
      aylikKazanc: faizTutari / aylikSure,
      yillikKazanc: faizTutari / yillikSure,
      birikimTablosu
    });
  };
  
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
  
  const handleAnaParaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const newAmount = value ? parseInt(value) : 0;
    if (newAmount >= 0 && newAmount <= 10000000) {
      setAnaPara(newAmount);
    }
  };
  
  const handleFaizOraniInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
    const newRate = parseFloat(value);
    if (!isNaN(newRate) && newRate >= 0 && newRate <= 100) {
      setFaizOrani(newRate);
    }
  };
  
  const handleSureInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const newDuration = value ? parseInt(value) : 0;
    if (newDuration >= 0 && newDuration <= 360) {
      setSure(newDuration);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Calculator className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Faiz Hesaplayıcısı</h1>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Card */}
        <Card className="border-foreground/10 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50 hover:bg-background/80 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(0,0,0,0.15)] rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hesaplama Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Faiz Tipi */}
            <div className="space-y-2.5">
              <Label className="text-xs">Faiz Tipi</Label>
              <RadioGroup
                value={faizTipi}
                onValueChange={(value: 'basit' | 'bilesik') => setFaizTipi(value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="basit" id="basit" />
                  <Label htmlFor="basit" className="text-xs">Basit Faiz</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bilesik" id="bilesik" />
                  <Label htmlFor="bilesik" className="text-xs">Bileşik Faiz</Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Ana Para */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="anaPara" className="text-xs">Ana Para</Label>
                <div className="flex items-center">
                  <Input
                    id="anaPara"
                    type="text"
                    value={anaPara.toLocaleString('tr-TR')}
                    onChange={handleAnaParaInput}
                    className="h-7 w-24 text-xs text-right mr-1 py-1"
                  />
                  <span className="text-xs font-medium">₺</span>
                </div>
              </div>
              <Slider
                value={[anaPara]}
                min={0}
                max={1000000}
                step={1000}
                onValueChange={(value) => setAnaPara(value[0])}
                className="my-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₺0</span>
                <span>₺1.000.000</span>
              </div>
            </div>
            
            {/* Faiz Oranı */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="faizOrani" className="text-xs">Yıllık Faiz Oranı</Label>
                <div className="flex items-center">
                  <Input
                    id="faizOrani"
                    type="text"
                    value={faizOrani.toString().replace('.', ',')}
                    onChange={handleFaizOraniInput}
                    className="h-7 w-16 text-xs text-right mr-1 py-1"
                  />
                  <span className="text-xs font-medium">%</span>
                </div>
              </div>
              <Slider
                value={[faizOrani]}
                min={0}
                max={100}
                step={0.1}
                onValueChange={(value) => setFaizOrani(value[0])}
                className="my-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>%0</span>
                <span>%100</span>
              </div>
            </div>
            
            {/* Vade */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="sure" className="text-xs">Vade</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="sure"
                    type="text"
                    value={sure}
                    onChange={handleSureInput}
                    className="h-7 w-16 text-xs text-right mr-1 py-1"
                  />
                  <RadioGroup
                    value={sureBirimi}
                    onValueChange={(value: 'ay' | 'yil') => setSureBirimi(value)}
                    className="flex gap-2"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="ay" id="ay" className="h-3 w-3" />
                      <Label htmlFor="ay" className="text-xs">Ay</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="yil" id="yil" className="h-3 w-3" />
                      <Label htmlFor="yil" className="text-xs">Yıl</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              <Slider
                value={[sure]}
                min={0}
                max={sureBirimi === 'ay' ? 360 : 30}
                step={1}
                onValueChange={(value) => setSure(value[0])}
                className="my-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 {sureBirimi}</span>
                <span>{sureBirimi === 'ay' ? '360 ay' : '30 yıl'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className="border-foreground/10 bg-gradient-to-br from-primary/5 via-background to-background supports-[backdrop-filter]:bg-background/50 hover:bg-gradient-to-br hover:from-primary/10 hover:via-background hover:to-background transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(0,0,0,0.15)] rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hesaplama Sonucu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hesaplamaSonucu && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Toplam Kazanç</div>
                    <div className="text-xl font-bold text-primary">
                      {formatCurrency(hesaplamaSonucu.faizTutari)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Toplam faiz getirisi
                    </div>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Toplam Birikim</div>
                    <div className="text-xl font-bold text-green-500">
                      {formatCurrency(hesaplamaSonucu.toplamTutar)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Ana para + Faiz
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
                        <TableCell className="text-xs">Ana Para</TableCell>
                        <TableCell className="text-xs text-right">{formatCurrency(hesaplamaSonucu.anaPara)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Faiz Oranı</TableCell>
                        <TableCell className="text-xs text-right">%{hesaplamaSonucu.faizOrani}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Faiz Tutarı</TableCell>
                        <TableCell className="text-xs text-right text-primary">{formatCurrency(hesaplamaSonucu.faizTutari)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Toplam Tutar</TableCell>
                        <TableCell className="text-xs text-right text-green-500">{formatCurrency(hesaplamaSonucu.toplamTutar)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Aylık Ortalama Kazanç</TableCell>
                        <TableCell className="text-xs text-right">{formatCurrency(hesaplamaSonucu.aylikKazanc)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Yıllık Ortalama Kazanç</TableCell>
                        <TableCell className="text-xs text-right">{formatCurrency(hesaplamaSonucu.yillikKazanc)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Birikim Tablosu */}
      {hesaplamaSonucu && hesaplamaSonucu.birikimTablosu.length > 0 && (
        <Card className="border-foreground/10 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50 hover:bg-background/80 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(0,0,0,0.15)] rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Dönemsel Birikim Tablosu</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[300px] scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10">
                  <TableRow>
                    <TableHead className="text-xs">Dönem</TableHead>
                    <TableHead className="text-xs text-right">Ana Para</TableHead>
                    <TableHead className="text-xs text-right">Faiz Tutarı</TableHead>
                    <TableHead className="text-xs text-right">Toplam Tutar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hesaplamaSonucu.birikimTablosu.map((donem) => (
                    <TableRow key={donem.donem}>
                      <TableCell className="text-xs">{donem.donem}. {sureBirimi}</TableCell>
                      <TableCell className="text-xs text-right">{formatCurrency(donem.anaPara)}</TableCell>
                      <TableCell className="text-xs text-right text-primary">{formatCurrency(donem.faizTutari)}</TableCell>
                      <TableCell className="text-xs text-right text-green-500">{formatCurrency(donem.toplamTutar)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Bilgilendirme */}
      <Alert className="bg-blue-500/5 border-blue-500/20 backdrop-blur supports-[backdrop-filter]:bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-sm font-medium text-blue-500">Faiz Hesaplama Bilgilendirmesi</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          <p className="mt-1">
            Bu hesaplama aracı, yatırımlarınızın potansiyel getirisini hesaplamanıza yardımcı olur. 
            İki farklı faiz hesaplama yöntemi sunulmaktadır:
          </p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>
              <span className="font-medium">Basit Faiz:</span> Ana para üzerinden sabit oranda faiz işler. 
              Faiz tutarı her dönem aynı kalır ve biriken faizler tekrar faize tabi tutulmaz.
            </li>
            <li>
              <span className="font-medium">Bileşik Faiz:</span> Biriken faizler de ana paraya eklenerek faiz getirir. 
              Bu nedenle, uzun vadede daha yüksek getiri sağlar.
            </li>
          </ul>
          <p className="mt-2">
            Hesaplamalar gösterge niteliğindedir ve gerçek yatırım getirileri piyasa koşullarına göre farklılık gösterebilir.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
} 