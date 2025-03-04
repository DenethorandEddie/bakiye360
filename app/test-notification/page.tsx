"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TestNotificationPage() {
  const [apiKey, setApiKey] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTest = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/cron/send-notifications", {
        headers: {
          "x-api-key": apiKey
        }
      });

      const data = await response.json();
      setResult(data);
      
      if (!response.ok) {
        setError(`Hata kodu: ${response.status}. Detay: ${data.message || "Bilinmeyen hata"}`);
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
          <CardTitle>Bildirim Sistemi Test Sayfası</CardTitle>
          <CardDescription>
            Bu sayfa, bildirim sistemini test etmek için kullanılır. API anahtarınızı girerek
            test bildirimlerini gönderebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="api-key">API Anahtarı (CRON_API_KEY değeri)</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API anahtarınızı girin"
              />
              <p className="text-sm text-muted-foreground">
                Bu değer, .env dosyasındaki CRON_API_KEY değeri ile aynı olmalıdır.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleTest} disabled={loading || !apiKey}>
            {loading ? "İşleniyor..." : "Bildirimleri Test Et"}
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