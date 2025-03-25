"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowUpDown, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const CURRENCIES = [
  { code: "TRY", name: "Türk Lirası" },
  { code: "USD", name: "Amerikan Doları" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "İngiliz Sterlini" },
  { code: "JPY", name: "Japon Yeni" },
  { code: "CHF", name: "İsviçre Frangı" },
  { code: "AUD", name: "Avustralya Doları" },
  { code: "CAD", name: "Kanada Doları" },
  { code: "CNY", name: "Çin Yuanı" },
  { code: "SAR", name: "Suudi Arabistan Riyali" },
  { code: "KWD", name: "Kuveyt Dinarı" },
  { code: "AED", name: "BAE Dirhemi" },
];

export default function DovizHesaplamaPage() {
  const [amount, setAmount] = useState<string>("1");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("TRY");
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExchangeRate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
      );
      const data = await response.json();
      setExchangeRate(data.rates[toCurrency]);
      setLastUpdated(new Date().toLocaleString("tr-TR"));
    } catch (error) {
      console.error("Döviz kuru alınamadı:", error);
      setError("Döviz kuru alınırken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeRate();
    // Her 5 dakikada bir güncelle
    const interval = setInterval(fetchExchangeRate, 1 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fromCurrency, toCurrency]);

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const convertedAmount = exchangeRate ? Number(amount) * exchangeRate : 0;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <ArrowUpDown className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Döviz Hesaplayıcısı</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-foreground/10 bg-background/5 backdrop-blur supports-[backdrop-filter]:bg-background/50 hover:bg-background/80 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(0,0,0,0.15)] rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">Para Birimi Dönüştürücü</CardTitle>
            <CardDescription>
              Güncel kurlar ile döviz hesaplama yapın
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Miktar</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-end">
              <div className="space-y-2">
                <Label>Kaynak Para Birimi</Label>
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.name} ({currency.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={handleSwapCurrencies}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>

              <div className="space-y-2">
                <Label>Hedef Para Birimi</Label>
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.name} ({currency.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-foreground/10 bg-gradient-to-br from-primary/5 via-background to-background supports-[backdrop-filter]:bg-background/50 hover:bg-gradient-to-br hover:from-primary/10 hover:via-background hover:to-background transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(0,0,0,0.15)] rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">Sonuç</CardTitle>
            <CardDescription>
              {isLoading ? (
                "Döviz kuru alınıyor..."
              ) : (
                <>
                  1 {fromCurrency} = {exchangeRate?.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                  {toCurrency}
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">
              {convertedAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCurrency}
            </div>
            <div className="text-sm text-muted-foreground">
              {Number(amount).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {fromCurrency} karşılığı
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <RefreshCcw className="h-3 w-3" />
                Son güncelleme: {lastUpdated}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={fetchExchangeRate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCcw className="h-3 w-3 animate-spin" />
                ) : (
                  "Güncelle"
                )}
              </Button>
            </div>
            {error && (
              <div className="text-xs text-red-500 mt-2">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Alert className="bg-blue-500/5 border-blue-500/20 backdrop-blur supports-[backdrop-filter]:bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl mt-6">
        <AlertDescription className="text-xs">
          Döviz kurları otomatik olarak 5 dakikada bir güncellenmektedir. Gösterilen değerler yaklaşık değerlerdir ve bilgilendirme amaçlıdır. Gerçek işlemler için bankanız veya döviz bürosu ile iletişime geçiniz.
        </AlertDescription>
      </Alert>
    </div>
  );
} 