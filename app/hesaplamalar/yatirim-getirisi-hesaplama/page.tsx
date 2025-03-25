"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Info, PieChart, AlertTriangle, BadgeDollarSign, Percent } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// ROI projeksiyonu için veri tipi
interface YearProjection {
  year: number;
  startValue: number;
  contribution: number;
  interestEarned: number;
  endValue: number;
  totalContributions: number;
  totalInterestEarned: number;
  inflationAdjustedValue?: number;
}

export default function YatirimGetirisiPage() {
  // Temel parametreler
  const [initialInvestment, setInitialInvestment] = useState<number>(10000);
  const [annualReturn, setAnnualReturn] = useState<number>(12);
  const [investmentPeriod, setInvestmentPeriod] = useState<number>(10);
  const [periodUnit, setPeriodUnit] = useState<'year' | 'month'>('year');
  
  // İlave parametreler
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
  const [inflationRate, setInflationRate] = useState<number>(15);
  const [includeInflation, setIncludeInflation] = useState<boolean>(true);
  const [contributionType, setContributionType] = useState<'start' | 'end'>('end');
  
  // Hesaplama sonuçları
  const [futureValue, setFutureValue] = useState<number>(0);
  const [totalContributions, setTotalContributions] = useState<number>(0);
  const [totalInterestEarned, setTotalInterestEarned] = useState<number>(0);
  const [inflationAdjustedValue, setInflationAdjustedValue] = useState<number>(0);
  const [roi, setRoi] = useState<number>(0);
  const [annualizedROI, setAnnualizedROI] = useState<number>(0);
  const [yearlyProjections, setYearlyProjections] = useState<YearProjection[]>([]);
  
  useEffect(() => {
    calculateROI();
  }, [initialInvestment, annualReturn, investmentPeriod, periodUnit, monthlyContribution, inflationRate, includeInflation, contributionType]);
  
  const calculateROI = () => {
    // Hesaplamalar için dönem sayısını belirleme
    const periods = periodUnit === 'year' ? investmentPeriod : investmentPeriod / 12;
    
    // Aylık getiri oranı (yıllık oranın 12'ye bölünmesi)
    const monthlyRate = annualReturn / 100 / 12;
    
    // Aylık enflasyon oranı
    const monthlyInflation = inflationRate / 100 / 12;
    
    // Toplam dönem sayısı (aylık hesaplama için)
    const totalMonths = periods * 12;
    
    let currentValue = initialInvestment;
    let totalContrib = initialInvestment;
    let totalInterest = 0;
    
    // Yıl bazlı projeksiyon için değişkenler
    let projections: YearProjection[] = [];
    let yearlyTotalContributions = initialInvestment;
    let yearlyTotalInterestEarned = 0;
    
    // Her ay için hesaplama
    for (let month = 1; month <= totalMonths; month++) {
      // Dönem başında katkı ekleme
      if (contributionType === 'start') {
        currentValue += monthlyContribution;
        totalContrib += monthlyContribution;
      }
      
      // Faiz hesaplama
      const monthlyInterest = currentValue * monthlyRate;
      currentValue += monthlyInterest;
      totalInterest += monthlyInterest;
      
      // Dönem sonunda katkı ekleme
      if (contributionType === 'end') {
        currentValue += monthlyContribution;
        totalContrib += monthlyContribution;
      }
      
      // Her yıl sonunda projeksiyon kaydetme
      if (month % 12 === 0) {
        const yearIndex = month / 12;
        const startValue = yearIndex === 1 
          ? initialInvestment 
          : projections[yearIndex - 2].endValue;
          
        const yearlyContribution = monthlyContribution * 12;
        yearlyTotalContributions += yearlyContribution;
        
        // Yıllık kazanılan faiz = Şimdiki değer - Başlangıç değeri - Yıllık katkı
        const yearlyInterestEarned = currentValue - startValue - yearlyContribution;
        yearlyTotalInterestEarned += yearlyInterestEarned;
        
        // Enflasyona göre düzeltilmiş değer
        const inflationAdjustedVal = includeInflation
          ? currentValue / Math.pow(1 + (inflationRate / 100), yearIndex)
          : undefined;
          
        projections.push({
          year: yearIndex,
          startValue: startValue,
          contribution: yearlyContribution,
          interestEarned: yearlyInterestEarned,
          endValue: currentValue,
          totalContributions: yearlyTotalContributions,
          totalInterestEarned: yearlyTotalInterestEarned,
          inflationAdjustedValue: inflationAdjustedVal
        });
      }
    }
    
    // Son katkı tutarını çıkar (eğer dönem sonunda eklendiyse)
    if (contributionType === 'end') {
      totalContrib -= monthlyContribution;
    }
    
    // Enflasyona göre düzeltilmiş değer
    const adjustedValue = includeInflation
      ? currentValue / Math.pow(1 + (inflationRate / 100), periods)
      : currentValue;
    
    // ROI hesaplama
    const returnOnInvestment = ((currentValue - totalContrib) / totalContrib) * 100;
    
    // Yıllık ortalama ROI
    const annualizedReturnOnInvestment = Math.pow((currentValue / initialInvestment), 1 / periods) - 1;
    
    // State'leri güncelle
    setFutureValue(currentValue);
    setTotalContributions(totalContrib);
    setTotalInterestEarned(totalInterest);
    setInflationAdjustedValue(adjustedValue);
    setRoi(returnOnInvestment);
    setAnnualizedROI(annualizedReturnOnInvestment * 100);
    setYearlyProjections(projections);
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
  
  const handleInitialInvestmentInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const newAmount = value ? parseInt(value) : 0;
    if (newAmount >= 0 && newAmount <= 100000000) {
      setInitialInvestment(newAmount);
    }
  };
  
  const handleMonthlyContributionInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const newAmount = value ? parseInt(value) : 0;
    if (newAmount >= 0 && newAmount <= 1000000) {
      setMonthlyContribution(newAmount);
    }
  };
  
  const handleRateInput = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<number>>, maxValue: number = 50) => {
    // Sadece rakamlar, nokta ve virgül kabul ediyoruz
    let value = e.target.value.replace(/[^0-9.,]/g, '');
    
    // Kullanıcının giriş yaparken yaşadığı zorlukları önlemek için işleme
    if (value.includes('.') && value.includes(',')) {
      const firstSeparatorIndex = Math.min(
        value.indexOf('.') !== -1 ? value.indexOf('.') : Number.MAX_SAFE_INTEGER,
        value.indexOf(',') !== -1 ? value.indexOf(',') : Number.MAX_SAFE_INTEGER
      );
      
      // Diğer tüm ayırıcıları kaldırıyoruz
      value = value.replace(/[.,]/g, '');
      
      // İlk ayırıcıyı doğru konuma geri ekliyoruz
      if (firstSeparatorIndex < value.length) {
        value = value.substring(0, firstSeparatorIndex) + '.' + value.substring(firstSeparatorIndex);
      }
    } 
    else if ((value.match(/\./g) || []).length > 1) {
      const parts = value.split('.');
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    else if ((value.match(/,/g) || []).length > 1) {
      const parts = value.split(',');
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    else if (value.includes(',')) {
      const parts = value.split(',');
      value = parts[0] + '.' + parts[1];
    }
    
    const numericValue = parseFloat(value);
    const isValidNumber = !isNaN(numericValue);
    
    if (!isValidNumber) {
      if (value === '.' || value === ',') {
        setter(0);
      }
    } else if (numericValue >= 0 && numericValue <= maxValue) {
      setter(numericValue);
    }
  };
  
  const handleInvestmentPeriodInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const newPeriod = value ? parseInt(value) : 0;
    const maxPeriod = periodUnit === 'year' ? 50 : 600; // 50 yıl veya 600 ay
    
    if (newPeriod >= 1 && newPeriod <= maxPeriod) {
      setInvestmentPeriod(newPeriod);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Yatırım Getirisi (ROI) Hesaplayıcısı</h1>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Card */}
        <Card className="border-foreground/10 bg-background/50 backdrop-blur shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Yatırım Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="initialInvestment" className="text-xs">Başlangıç Yatırım Tutarı</Label>
                <div className="flex items-center">
                  <Input
                    id="initialInvestment"
                    type="text"
                    value={initialInvestment.toLocaleString('tr-TR')}
                    onChange={handleInitialInvestmentInput}
                    className="h-7 w-24 text-xs text-right mr-1 py-1"
                  />
                  <span className="text-xs font-medium">₺</span>
                </div>
              </div>
              <Slider
                value={[initialInvestment]}
                min={0}
                max={100000}
                step={1000}
                onValueChange={(value) => setInitialInvestment(value[0])}
                className="my-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₺0</span>
                <span>₺100.000</span>
              </div>
            </div>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="monthlyContribution" className="text-xs">Aylık Katkı Tutarı</Label>
                <div className="flex items-center">
                  <Input
                    id="monthlyContribution"
                    type="text"
                    value={monthlyContribution.toLocaleString('tr-TR')}
                    onChange={handleMonthlyContributionInput}
                    className="h-7 w-24 text-xs text-right mr-1 py-1"
                  />
                  <span className="text-xs font-medium">₺</span>
                </div>
              </div>
              <Slider
                value={[monthlyContribution]}
                min={0}
                max={10000}
                step={100}
                onValueChange={(value) => setMonthlyContribution(value[0])}
                className="my-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₺0</span>
                <span>₺10.000</span>
              </div>
            </div>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="annualReturn" className="text-xs">Yıllık Getiri Oranı</Label>
                <div className="flex items-center">
                  <Input
                    id="annualReturn"
                    type="text"
                    value={annualReturn.toString().replace('.', ',')}
                    onChange={(e) => handleRateInput(e, setAnnualReturn, 100)}
                    className="h-7 w-16 text-xs text-right mr-1 py-1"
                  />
                  <span className="text-xs font-medium">%</span>
                </div>
              </div>
              <Slider
                value={[annualReturn]}
                min={0}
                max={50}
                step={0.5}
                onValueChange={(value) => setAnnualReturn(value[0])}
                className="my-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>%0</span>
                <span>%50</span>
              </div>
            </div>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="investmentPeriod" className="text-xs">Yatırım Süresi</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="investmentPeriod"
                    type="text"
                    value={investmentPeriod}
                    onChange={handleInvestmentPeriodInput}
                    className="h-7 w-14 text-xs text-right mr-1 py-1"
                  />
                  <Select 
                    value={periodUnit} 
                    onValueChange={(value: 'year' | 'month') => setPeriodUnit(value)}
                  >
                    <SelectTrigger className="h-7 w-20 text-xs">
                      <SelectValue placeholder="Birim" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="year">Yıl</SelectItem>
                      <SelectItem value="month">Ay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Slider
                value={[investmentPeriod]}
                min={1}
                max={periodUnit === 'year' ? 50 : 120}
                step={1}
                onValueChange={(value) => setInvestmentPeriod(value[0])}
                className="my-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 {periodUnit === 'year' ? 'yıl' : 'ay'}</span>
                <span>{periodUnit === 'year' ? '50 yıl' : '120 ay'}</span>
              </div>
            </div>
            
            <div className="border-t border-foreground/10 pt-3 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Katkı Zamanlaması</Label>
                <RadioGroup 
                  defaultValue="end" 
                  value={contributionType} 
                  onValueChange={(value: 'start' | 'end') => setContributionType(value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="start" id="start" />
                    <Label htmlFor="start" className="text-xs">Dönem Başında</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="end" id="end" />
                    <Label htmlFor="end" className="text-xs">Dönem Sonunda</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2.5">
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="inflationRate" className="text-xs">Enflasyon Oranı</Label>
                  <div className="flex items-center">
                    <Input
                      id="inflationRate"
                      type="text"
                      value={inflationRate.toString().replace('.', ',')}
                      onChange={(e) => handleRateInput(e, setInflationRate, 100)}
                      className="h-7 w-16 text-xs text-right mr-1 py-1"
                      disabled={!includeInflation}
                    />
                    <span className="text-xs font-medium">%</span>
                  </div>
                </div>
                <Slider
                  value={[inflationRate]}
                  min={0}
                  max={100}
                  step={0.5}
                  onValueChange={(value) => setInflationRate(value[0])}
                  className="my-2"
                  disabled={!includeInflation}
                />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="includeInflation" 
                      checked={includeInflation} 
                      onCheckedChange={setIncludeInflation}
                    />
                    <Label htmlFor="includeInflation" className="text-xs">Enflasyon Etkisini Hesapla</Label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className="border-foreground/10 bg-gradient-to-br from-primary/5 to-background shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hesaplama Sonuçları</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-between h-[calc(100%-64px)]">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Toplam Birikimi</div>
                  <div className="text-xl font-bold text-primary">{formatCurrency(futureValue)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {includeInflation && (
                      <>Enf. Düzeltilmiş: {formatCurrency(inflationAdjustedValue)}</>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Toplam Getiri</div>
                  <div className="text-xl font-bold">{formatCurrency(totalInterestEarned)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatPercent(roi)} toplam
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Yatırım Dağılımı</div>
                <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${(totalContributions / futureValue) * 100}%` }}
                  />
                  <div 
                    className="h-full bg-green-500" 
                    style={{ width: `${(totalInterestEarned / futureValue) * 100}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 text-xs gap-1 mt-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span>Yatırılan: {formatCurrency(totalContributions)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Kazanç: {formatCurrency(totalInterestEarned)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Getiri Oranları</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-1">
                      <BadgeDollarSign className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold">Toplam ROI:</span>
                    </div>
                    <div className="ml-5">{formatPercent(roi)}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <Percent className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold">Yıllık Ort. ROI:</span>
                    </div>
                    <div className="ml-5">{formatPercent(annualizedROI)}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground mt-4 border-t border-foreground/10 pt-3">
              Bu hesaplama aracı sadece bilgilendirme amaçlıdır ve gerçek yatırım sonuçlarından farklılık gösterebilir.
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Yearly Projections Table */}
      <Card className="border-foreground/10 bg-background/50 backdrop-blur shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Yıllık Projeksiyon</CardTitle>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              <span>Yatırımınızın zaman içindeki tahmini değeri</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[300px] scrollbar-thin">
            <Table>
              <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 text-xs">Yıl</TableHead>
                  <TableHead className="text-xs">Başlangıç Değeri</TableHead>
                  <TableHead className="text-xs">Yıllık Katkı</TableHead>
                  <TableHead className="text-xs">Kazanılan Getiri</TableHead>
                  <TableHead className="text-xs">Yıl Sonu Değeri</TableHead>
                  {includeInflation && (
                    <TableHead className="text-xs">Enf. Düzeltilmiş Değer</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearlyProjections.map((projection) => (
                  <TableRow key={projection.year} className="hover:bg-muted/30 text-xs">
                    <TableCell className="py-2">{projection.year}</TableCell>
                    <TableCell className="py-2">{formatCurrency(projection.startValue)}</TableCell>
                    <TableCell className="py-2">{formatCurrency(projection.contribution)}</TableCell>
                    <TableCell className="py-2">{formatCurrency(projection.interestEarned)}</TableCell>
                    <TableCell className="py-2">{formatCurrency(projection.endValue)}</TableCell>
                    {includeInflation && projection.inflationAdjustedValue && (
                      <TableCell className="py-2">{formatCurrency(projection.inflationAdjustedValue)}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Bilgilendirme */}
      <Alert className="bg-blue-500/5 border-blue-500/20">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-sm font-medium text-blue-500">Yatırım Getirisi (ROI) Hakkında</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          <p className="mt-1">
            Yatırım Getirisi (ROI), bir yatırımdan elde edilen kazanç veya kaybın, yatırım tutarına oranını ifade eder. Bu hesaplayıcı, bileşik faiz hesaplaması kullanarak, düzenli katkılarla birlikte yatırımınızın zaman içinde nasıl büyüyeceğini tahmin eder.
          </p>
          <p className="mt-2">
            Hesaplamalar teorik olup, gerçek piyasa koşulları, vergiler, enflasyon ve diğer faktörler nedeniyle sonuçlar farklılık gösterebilir. Önemli yatırım kararları vermeden önce bir finans danışmanına başvurmanızı öneririz.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
} 