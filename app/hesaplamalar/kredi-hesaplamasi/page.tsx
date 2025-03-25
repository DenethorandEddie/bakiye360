"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, Info, PieChart, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

// Define the type for amortization schedule rows
interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  kkdf: number;
  bsmv: number;
  balance: number;
}

export default function KrediHesaplamaPage() {
  const [amount, setAmount] = useState<number>(50000);
  const [rate, setRate] = useState<number>(1.79);
  const [term, setTerm] = useState<number>(12);
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [totalKKDF, setTotalKKDF] = useState<number>(0);
  const [totalBSMV, setTotalBSMV] = useState<number>(0);
  const [amortization, setAmortization] = useState<AmortizationRow[]>([]);
  const [includeKKDFBSMV, setIncludeKKDFBSMV] = useState<boolean>(true);

  // KKDF ve BSMV oranları
  const KKDF_RATE = 0.15; // %15
  const BSMV_RATE = 0.15; // %15

  useEffect(() => {
    calculateLoan();
  }, [amount, rate, term, includeKKDFBSMV]);

  const calculateLoan = () => {
    // Aylık nominal faiz oranı (% değeri)
    const monthlyNominalRate = rate / 100;
    
    // KKDF ve BSMV dahil efektif faiz oranı hesaplaması
    let monthlyEffectiveRate;
    if (includeKKDFBSMV) {
      // Efektif faiz = Nominal faiz * (1 + KKDF + BSMV)
      monthlyEffectiveRate = monthlyNominalRate * (1 + KKDF_RATE + BSMV_RATE);
    } else {
      monthlyEffectiveRate = monthlyNominalRate;
    }
    
    // Monthly payment calculation using the formula: P = A * (r * (1 + r)^n) / ((1 + r)^n - 1)
    // Where P = monthly payment, A = loan amount, r = monthly effective interest rate, n = loan term in months
    const payment = amount * (monthlyEffectiveRate * Math.pow(1 + monthlyEffectiveRate, term)) / (Math.pow(1 + monthlyEffectiveRate, term) - 1);
    
    const totalPaid = payment * term;
    
    // Calculate amortization schedule
    let balance = amount;
    let amortizationSchedule: AmortizationRow[] = [];
    let totalInterestAmount = 0;
    let totalKKDFAmount = 0;
    let totalBSMVAmount = 0;
    
    for (let i = 1; i <= Math.min(term, 36); i++) {
      // Faiz tutarı
      const interestAmount = balance * monthlyNominalRate;
      
      // KKDF ve BSMV hesaplamaları (faiz üzerinden)
      const kkdfAmount = includeKKDFBSMV ? interestAmount * KKDF_RATE : 0;
      const bsmvAmount = includeKKDFBSMV ? interestAmount * BSMV_RATE : 0;
      
      // Toplam finans maliyeti (faiz + vergiler)
      const totalFinanceCost = interestAmount + kkdfAmount + bsmvAmount;
      
      // Anaparaya giden kısım
      const principalPayment = payment - totalFinanceCost;
      
      // Kalan borç
      balance -= principalPayment;
      
      // Toplam tutarları güncelle
      totalInterestAmount += interestAmount;
      totalKKDFAmount += kkdfAmount;
      totalBSMVAmount += bsmvAmount;
      
      amortizationSchedule.push({
        month: i,
        payment: payment,
        principal: principalPayment,
        interest: interestAmount,
        kkdf: kkdfAmount,
        bsmv: bsmvAmount,
        balance: balance > 0 ? balance : 0
      });
    }
    
    // Toplam faiz ve vergileri ayarla
    const totalInterestPaid = totalInterestAmount * (term / Math.min(term, 36));
    const totalKKDFPaid = totalKKDFAmount * (term / Math.min(term, 36));
    const totalBSMVPaid = totalBSMVAmount * (term / Math.min(term, 36));
    
    setMonthlyPayment(payment);
    setTotalPayment(totalPaid);
    setTotalInterest(totalInterestPaid);
    setTotalKKDF(totalKKDFPaid);
    setTotalBSMV(totalBSMVPaid);
    setAmortization(amortizationSchedule);
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(value);
  };

  const handleAmountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const newAmount = value ? parseInt(value) : 0;
    if (newAmount >= 1000 && newAmount <= 1000000) {
      setAmount(newAmount);
    }
  };

  const handleRateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sadece rakamlar, nokta ve virgül kabul ediyoruz
    let value = e.target.value.replace(/[^0-9.,]/g, '');
    
    // Kullanıcının giriş yaparken yaşadığı zorlukları önlemek için daha akıllı işleme:
    
    // 1. Hem nokta hem virgül olursa, ilkini koruyoruz
    if (value.includes('.') && value.includes(',')) {
      const firstSeparatorIndex = Math.min(
        value.indexOf('.') !== -1 ? value.indexOf('.') : Number.MAX_SAFE_INTEGER,
        value.indexOf(',') !== -1 ? value.indexOf(',') : Number.MAX_SAFE_INTEGER
      );
      const firstSeparator = value[firstSeparatorIndex];
      
      // Diğer tüm ayırıcıları kaldırıyoruz
      value = value.replace(/[.,]/g, '');
      
      // İlk ayırıcıyı doğru konuma geri ekliyoruz
      if (firstSeparatorIndex < value.length) {
        value = value.substring(0, firstSeparatorIndex) + '.' + value.substring(firstSeparatorIndex);
      }
    } 
    // 2. Birden fazla aynı tür ayırıcı varsa, ilkini koruyoruz
    else if ((value.match(/\./g) || []).length > 1) {
      const parts = value.split('.');
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    else if ((value.match(/,/g) || []).length > 1) {
      const parts = value.split(',');
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    // 3. Tek bir ayırıcı var, bunu korumalıyız
    else if (value.includes(',')) {
      // JavaScript'in hesaplama yapabilmesi için virgülü noktaya çeviriyoruz
      const parts = value.split(',');
      value = parts[0] + '.' + parts[1];
    }
    
    // Şimdi güvenli bir şekilde sayısal değere çevirebiliriz
    // Sadece '.' veya ',' girildiyse NaN olacaktır
    const numericValue = parseFloat(value);
    const isValidNumber = !isNaN(numericValue);
    
    // Aylık faiz için gerçekçi aralık kontrolü
    if (!isValidNumber) {
      // Sadece ayırıcı girilmiş, bu durumda 0 değerini kabul ediyoruz
      if (value === '.' || value === ',') {
        setRate(0);
      }
      // Diğer tüm geçersiz değerleri engelliyoruz
    } else if (numericValue >= 0.01 && numericValue <= 10) {
      setRate(numericValue);
    }
    
    // Önemli: Input değerini doğrudan değiştirmeyelim,
    // Sadece state güncelleme yapalım, React kontrollü inputları kendisi yönetsin
  };

  const handleTermInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const newTerm = value ? parseInt(value) : 0;
    if (newTerm >= 1 && newTerm <= 120) {
      setTerm(newTerm);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Calculator className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Kredi Hesaplayıcısı</h1>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Card */}
        <Card className="border-foreground/10 bg-background/50 backdrop-blur shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Kredi Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="amount" className="text-xs">Kredi Tutarı</Label>
                <div className="flex items-center">
                  <Input
                    id="amount"
                    type="text"
                    value={amount.toLocaleString('tr-TR')}
                    onChange={handleAmountInput}
                    className="h-7 w-24 text-xs text-right mr-1 py-1"
                  />
                  <span className="text-xs font-medium">₺</span>
                </div>
              </div>
              <Slider
                value={[amount]}
                min={1000}
                max={1000000}
                step={1000}
                onValueChange={(value) => setAmount(value[0])}
                className="my-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₺1.000</span>
                <span>₺1.000.000</span>
              </div>
            </div>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="rate" className="text-xs">Aylık Faiz Oranı</Label>
                <div className="flex items-center">
                  <Input
                    id="rate"
                    type="text"
                    value={rate.toString().replace('.', ',')}
                    onChange={handleRateInput}
                    className="h-7 w-16 text-xs text-right mr-1 py-1"
                  />
                  <span className="text-xs font-medium">%</span>
                </div>
              </div>
              <Slider
                value={[rate]}
                min={0.01}
                max={5}
                step={0.01}
                onValueChange={(value) => setRate(value[0])}
                className="my-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>%0,01</span>
                <span>%5</span>
              </div>
            </div>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="term" className="text-xs">Vade (Ay)</Label>
                <div className="flex items-center">
                  <Input
                    id="term"
                    type="text"
                    value={term}
                    onChange={handleTermInput}
                    className="h-7 w-16 text-xs text-right mr-1 py-1"
                  />
                  <span className="text-xs font-medium">ay</span>
                </div>
              </div>
              <Slider
                value={[term]}
                min={1}
                max={120}
                step={1}
                onValueChange={(value) => setTerm(value[0])}
                className="my-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 ay</span>
                <span>120 ay</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-foreground/10">
              <Label htmlFor="taxes" className="text-xs">KKDF (%15) ve BSMV (%15) Dahil</Label>
              <Switch 
                id="taxes" 
                checked={includeKKDFBSMV} 
                onCheckedChange={setIncludeKKDFBSMV} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className="border-foreground/10 bg-gradient-to-br from-primary/5 to-background shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hesaplama Sonuçları</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-between h-[calc(100%-64px)]">
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-muted-foreground">Aylık Taksit</div>
                <div className="text-2xl font-bold text-primary">{formatCurrency(monthlyPayment)}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-foreground/10">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Toplam Ödeme</div>
                  <div className="text-sm font-semibold">{formatCurrency(totalPayment)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Toplam Maliyet</div>
                  <div className="text-sm font-semibold">{formatCurrency(totalInterest + totalKKDF + totalBSMV)}</div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Kredi Maliyet Dağılımı</div>
                <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-primary rounded-l-full" 
                    style={{ width: `${(amount / totalPayment) * 100}%` }}
                  />
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ width: `${(totalInterest / totalPayment) * 100}%` }}
                  />
                  {includeKKDFBSMV && (
                    <>
                      <div 
                        className="h-full bg-amber-500" 
                        style={{ width: `${(totalKKDF / totalPayment) * 100}%` }}
                      />
                      <div 
                        className="h-full bg-red-500 rounded-r-full" 
                        style={{ width: `${(totalBSMV / totalPayment) * 100}%` }}
                      />
                    </>
                  )}
                </div>
                <div className="grid grid-cols-2 text-xs gap-1 mt-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span>{Math.round((amount / totalPayment) * 100)}% Anapara</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>{Math.round((totalInterest / totalPayment) * 100)}% Faiz</span>
                  </div>
                  {includeKKDFBSMV && (
                    <>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span>{Math.round((totalKKDF / totalPayment) * 100)}% KKDF</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span>{Math.round((totalBSMV / totalPayment) * 100)}% BSMV</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground mt-4 border-t border-foreground/10 pt-3">
              Bu hesaplama aracı sadece bilgilendirme amaçlıdır ve gerçek kredi tekliflerinden farklılık gösterebilir.
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Payment Schedule Table in Tabs */}
      <Card className="border-foreground/10 bg-background/50 backdrop-blur shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Ödeme Planı</CardTitle>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              {term > 36 && <span>(İlk 36 ay gösteriliyor)</span>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[300px] scrollbar-thin">
            <Table>
              <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 text-xs">Ay</TableHead>
                  <TableHead className="text-xs">Taksit</TableHead>
                  <TableHead className="text-xs">Anapara</TableHead>
                  <TableHead className="text-xs">Faiz</TableHead>
                  {includeKKDFBSMV && (
                    <>
                      <TableHead className="text-xs">KKDF</TableHead>
                      <TableHead className="text-xs">BSMV</TableHead>
                    </>
                  )}
                  <TableHead className="text-xs">Kalan Borç</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {amortization.map((row) => (
                  <TableRow key={row.month} className="hover:bg-muted/30 text-xs">
                    <TableCell className="py-2">{row.month}</TableCell>
                    <TableCell className="py-2">{formatCurrency(row.payment)}</TableCell>
                    <TableCell className="py-2">{formatCurrency(row.principal)}</TableCell>
                    <TableCell className="py-2">{formatCurrency(row.interest)}</TableCell>
                    {includeKKDFBSMV && (
                      <>
                        <TableCell className="py-2">{formatCurrency(row.kkdf)}</TableCell>
                        <TableCell className="py-2">{formatCurrency(row.bsmv)}</TableCell>
                      </>
                    )}
                    <TableCell className="py-2">{formatCurrency(row.balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Yasal Uyarı */}
      <Alert variant="destructive" className="bg-red-500/5 border-red-500/20">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <AlertTitle className="text-sm font-medium text-red-500">Yasal Uyarı</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          <p className="mt-1">
            Bu kredi hesaplama aracı tamamen bilgilendirme amaçlıdır ve yasal bir taahhüt içermez. Hesaplamalarda kullanılan formüller standart amortizasyon yöntemlerine dayanmaktadır ancak bankalar farklı hesaplama yöntemleri kullanabilir.
          </p>
          <p className="mt-2">
            KKDF (%15) ve BSMV (%15) oranları faiz üzerinden hesaplanmaktadır. Kredi başvurusundan önce bankanızdan güncel faiz oranları, ücretler, koşullar ve yürürlükteki mevzuat hakkında detaylı bilgi almanızı öneririz. Bu hesaplama aracı aracılığıyla yapılan herhangi bir işlem için hiçbir sorumluluk kabul edilmez.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
} 