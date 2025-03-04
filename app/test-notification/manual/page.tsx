"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ManualTestNotificationPage() {
  const [email, setEmail] = useState("");
  const [paymentData, setPaymentData] = useState(`[
  {
    "description": "Test Ödemesi 1",
    "amount": 1500,
    "category": "Fatura",
    "due_date": "${new Date().toISOString().split('T')[0]}"
  },
  {
    "description": "Test Ödemesi 2",
    "amount": 850.50,
    "category": "Abonelik",
    "due_date": "${new Date().toISOString().split('T')[0]}"
  }
]`);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTest = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      // JSON verisini parse et
      const payments = JSON.parse(paymentData);

      const response = await fetch("/api/test/manual-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          payments
        })
      });

      const data = await response.json();
      setResult(data);
      
      if (!response.ok) {
        setError(`Hata kodu: ${response.status}. Detay: ${data.message || data.error || "Bilinmeyen hata"}`);
      }
    } catch (err) {
      setError("Bir hata oluştu: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Manuel Bildirim Testi</CardTitle>
          <CardDescription>
            Belirli bir e-posta adresine manuel olarak test bildirimi gönderin.
            Bu sayfa yalnızca test amaçlıdır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-posta Adresi</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="payment-data">Ödeme Verileri (JSON formatında)</Label>
              <Textarea
                id="payment-data"
                value={paymentData}
                onChange={(e) => setPaymentData(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                JSON formatında test ödeme verilerini girin. Her ödeme için description, amount, category ve due_date alanları gereklidir.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleTest} disabled={loading || !email || !paymentData}>
            {loading ? "Gönderiliyor..." : "Test E-postası Gönder"}
          </Button>
        </CardFooter>

        {error && (
          <div className="px-6 py-2 mb-4">
            <div className="bg-destructive/15 text-destructive p-3 rounded-md">
              {error}
            </div>
          </div>
        )}

        {result && (
          <div className="px-6 py-2 mb-4">
            <div className="bg-primary/15 text-primary p-3 rounded-md">
              <pre className="whitespace-pre-wrap overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
} 