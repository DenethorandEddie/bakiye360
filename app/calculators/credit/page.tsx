"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, Info, PieChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define the type for amortization schedule rows
interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export default function CreditCalculatorPage() {
  const [amount, setAmount] = useState<number>(50000);
  const [rate, setRate] = useState<number>(2.5);
  const [term, setTerm] = useState<number>(12);
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [amortization, setAmortization] = useState<AmortizationRow[]>([]);

  useEffect(() => {
    calculateLoan();
  }, [amount, rate, term]);

  const calculateLoan = () => {
    // Monthly interest rate (annual rate / 12 / 100)
    const monthlyRate = rate / 12 / 100;
    
    // Monthly payment calculation using the formula: P = A * (r * (1 + r)^n) / ((1 + r)^n - 1)
    // Where P = monthly payment, A = loan amount, r = monthly interest rate, n = loan term in months
    const payment = amount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
    
    const totalPaid = payment * term;
    const interestPaid = totalPaid - amount;
    
    setMonthlyPayment(payment);
    setTotalPayment(totalPaid);
    setTotalInterest(interestPaid);
    
    // Calculate amortization schedule
    let balance = amount;
    let amortizationSchedule: AmortizationRow[] = [];
    
    for (let i = 1; i <= Math.min(term, 36); i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = payment - interestPayment;
      balance -= principalPayment;
      
      amortizationSchedule.push({
        month: i,
        payment: payment,
        principal: principalPayment,
        interest: interestPayment,
        balance: balance > 0 ? balance : 0
      });
    }
    
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
    const value = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
    const newRate = value ? parseFloat(value) : 0;
    if (newRate >= 0.1 && newRate <= 50) {
      setRate(newRate);
    }
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
                <Label htmlFor="rate" className="text-xs">Yıllık Faiz Oranı</Label>
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
                min={0.1}
                max={50}
                step={0.1}
                onValueChange={(value) => setRate(value[0])}
                className="my-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>%0,1</span>
                <span>%50</span>
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
                  <div className="text-xs text-muted-foreground mb-1">Toplam Faiz</div>
                  <div className="text-sm font-semibold">{formatCurrency(totalInterest)}</div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Kredi / Faiz Oranı</div>
                <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${(amount / totalPayment) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span>{Math.round((amount / totalPayment) * 100)}% Anapara</span>
                  <span>{Math.round((totalInterest / totalPayment) * 100)}% Faiz</span>
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
                  <TableHead className="w-16 text-xs">Ay</TableHead>
                  <TableHead className="text-xs">Taksit</TableHead>
                  <TableHead className="text-xs">Anapara</TableHead>
                  <TableHead className="text-xs">Faiz</TableHead>
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
                    <TableCell className="py-2">{formatCurrency(row.balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 