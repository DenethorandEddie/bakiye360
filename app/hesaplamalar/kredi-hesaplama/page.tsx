'use client';

import { Card } from "@/components/ui/card";

export default function KrediHesaplamaPage() {
  return (
    <div className="container py-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Kredi Hesaplama</h1>
        <p className="text-muted-foreground">
          Kredi hesaplama aracı ile konut kredisi, ihtiyaç kredisi ve taşıt kredisi hesaplamalarınızı yapabilirsiniz.
        </p>
      </Card>
    </div>
  );
} 