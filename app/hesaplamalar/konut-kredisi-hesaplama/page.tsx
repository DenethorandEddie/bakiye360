"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building, Calculator, Info } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type OdemePlani = {
  donem: number;
  taksit: number;
  anapara: number;
  faiz: number;
  kalanAnapara: number;
}

export default function KonutKredisiPage() {
  const [krediTutari, setKrediTutari] = useState<number>(500000);
  const [faizOrani, setFaizOrani] = useState<number>(3.0);
  const [vadeSuresi, setVadeSuresi] = useState<number>(120);
  const [aylikTaksit, setAylikTaksit] = useState<number>(0);
  const [toplamOdeme, setToplamOdeme] = useState<number>(0);
  const [toplamFaiz, setToplamFaiz] = useState<number>(0);
  const [yillikMaliyetOrani, setYillikMaliyetOrani] = useState<number>(0);
  const [odemePlani, setOdemePlani] = useState<Array<OdemePlani>>([]);

  useEffect(() => {
    if (krediTutari > 0 && faizOrani > 0 && vadeSuresi > 0) {
      hesaplaKredi();
    }
  }, [krediTutari, faizOrani, vadeSuresi]);

  const hesaplaKredi = () => {
    try {
      // Aylık faiz oranı - Direkt aylık oran olarak alıyoruz
      const aylikFaizOrani = faizOrani / 100;

      // Aylık taksit formülü: PMT = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
      // P: Ana para, r: Aylık faiz oranı, n: Toplam ay sayısı
      const taksit = krediTutari * 
        (aylikFaizOrani * Math.pow(1 + aylikFaizOrani, vadeSuresi)) / 
        (Math.pow(1 + aylikFaizOrani, vadeSuresi) - 1);

      if (isFinite(taksit) && !isNaN(taksit)) {
        setAylikTaksit(taksit);
        const toplamOdemeTutari = taksit * vadeSuresi;
        setToplamOdeme(toplamOdemeTutari);
        setToplamFaiz(toplamOdemeTutari - krediTutari);

        // Yıllık Maliyet Oranı Hesaplama (APR)
        // APR = ((1 + aylık faiz)^12 - 1) * 100
        const yillikMaliyet = (Math.pow(1 + aylikFaizOrani, 12) - 1) * 100;
        setYillikMaliyetOrani(yillikMaliyet);

        // Ödeme planı oluştur
        const yeniOdemePlani: Array<OdemePlani> = [];
        let kalanAnapara = krediTutari;

        for (let ay = 1; ay <= Math.min(vadeSuresi, 360); ay++) {
          const odenecekFaiz = kalanAnapara * aylikFaizOrani;
          const odenecekAnapara = taksit - odenecekFaiz;
          kalanAnapara = Math.max(0, kalanAnapara - odenecekAnapara);

          if (ay % 12 === 1 || ay === vadeSuresi) {
            yeniOdemePlani.push({
              donem: Math.ceil(ay / 12),
              taksit: taksit,
              anapara: odenecekAnapara,
              faiz: odenecekFaiz,
              kalanAnapara: kalanAnapara
            });
          }
        }

        setOdemePlani(yeniOdemePlani);
      }
    } catch (error) {
      console.error("Hesaplama hatası:", error);
      setAylikTaksit(0);
      setToplamOdeme(0);
      setToplamFaiz(0);
      setYillikMaliyetOrani(0);
      setOdemePlani([]);
    }
  };

  const handleKrediTutariChange = (value: string) => {
    const temizDeger = value.replace(/[^0-9]/g, "");
    const tutar = Number(temizDeger);
    if (!isNaN(tutar)) {
      setKrediTutari(tutar);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <Building className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Konut Kredisi Hesaplama</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-foreground/10 bg-gradient-to-br from-background via-background/80 to-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Kredi Detayları
            </CardTitle>
            <CardDescription>
              Kredi tutarı, faiz oranı ve vade bilgilerini girin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Kredi Tutarı */}
            <div className="space-y-2">
              <Label htmlFor="krediTutari">Kredi Tutarı</Label>
              <div className="flex gap-4">
                <Input
                  id="krediTutari"
                  type="text"
                  value={formatCurrency(krediTutari)}
                  onChange={(e) => handleKrediTutariChange(e.target.value)}
                  className="flex-1"
                />
                <Slider
                  value={[krediTutari]}
                  onValueChange={(values) => setKrediTutari(values[0])}
                  min={0}
                  max={10000000}
                  step={10000}
                  className="flex-[2]"
                />
              </div>
            </div>

            {/* Faiz Oranı */}
            <div className="space-y-2">
              <Label htmlFor="faizOrani">Aylık Faiz Oranı (%)</Label>
              <div className="flex gap-4">
                <Input
                  id="faizOrani"
                  type="number"
                  value={faizOrani}
                  onChange={(e) => setFaizOrani(Number(e.target.value))}
                  min={0}
                  max={100}
                  step={0.01}
                  className="flex-1"
                />
                <Slider
                  value={[faizOrani]}
                  onValueChange={(values) => setFaizOrani(values[0])}
                  min={0}
                  max={10}
                  step={0.01}
                  className="flex-[2]"
                />
              </div>
            </div>

            {/* Vade Süresi */}
            <div className="space-y-2">
              <Label htmlFor="vadeSuresi">Vade Süresi (Ay)</Label>
              <div className="flex gap-4">
                <Input
                  id="vadeSuresi"
                  type="number"
                  value={vadeSuresi}
                  onChange={(e) => setVadeSuresi(Number(e.target.value))}
                  min={12}
                  max={360}
                  className="flex-1"
                />
                <Slider
                  value={[vadeSuresi]}
                  onValueChange={(values) => setVadeSuresi(values[0])}
                  min={12}
                  max={360}
                  step={12}
                  className="flex-[2]"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.floor(vadeSuresi / 12)} yıl {vadeSuresi % 12} ay
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-foreground/10 bg-gradient-to-br from-primary/5 via-background to-background backdrop-blur supports-[backdrop-filter]:bg-background/50">
          <CardHeader>
            <CardTitle className="text-lg">Hesaplama Sonuçları</CardTitle>
            <CardDescription>
              Kredi ödeme planı ve maliyet detayları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Aylık Taksit</div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(aylikTaksit)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Toplam Geri Ödeme</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(toplamOdeme)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Toplam Faiz</div>
                <div className="text-2xl font-bold text-orange-500">
                  {formatCurrency(toplamFaiz)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Yıllık Maliyet Oranı</div>
                <div className="text-2xl font-bold text-orange-500">
                  {formatPercentage(yillikMaliyetOrani)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ödeme Planı */}
      <Card className="mt-6 border border-foreground/10">
        <CardHeader>
          <CardTitle className="text-lg">Yıllık Ödeme Planı</CardTitle>
          <CardDescription>
            Kredi ödeme planınızın yıllık özeti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Yıl</TableHead>
                  <TableHead>Taksit Tutarı</TableHead>
                  <TableHead>Anapara</TableHead>
                  <TableHead>Faiz</TableHead>
                  <TableHead>Kalan Anapara</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {odemePlani.map((odeme, index) => (
                  <TableRow key={index}>
                    <TableCell>{odeme.donem}. Yıl</TableCell>
                    <TableCell>{formatCurrency(odeme.taksit)}</TableCell>
                    <TableCell>{formatCurrency(odeme.anapara)}</TableCell>
                    <TableCell>{formatCurrency(odeme.faiz)}</TableCell>
                    <TableCell>{formatCurrency(odeme.kalanAnapara)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Alert className="mt-6 bg-blue-500/5 border-blue-500/20 backdrop-blur supports-[backdrop-filter]:bg-blue-500/5">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-xs">
          Bu hesaplama aracı bilgilendirme amaçlıdır. Kredi başvurusu öncesinde bankanızdan güncel faiz oranları ve şartlar hakkında bilgi almanızı öneririz.
          Hesaplamalar aylık faiz oranı üzerinden yapılmaktadır. Yıllık maliyet oranı, aylık faiz oranının yıllık eşdeğerini gösterir.
        </AlertDescription>
      </Alert>
    </div>
  );
} 