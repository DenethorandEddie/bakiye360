"use client";

import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ArrowUpRight, ArrowDownRight, Loader2, Trash, Pencil, Clock } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string;
  date: string;
  created_at: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  loading: boolean;
}

export function TransactionTable({ transactions, loading }: TransactionTableProps) {
  const supabase = createClientComponentClient();
  const [deleting, setDeleting] = useState<string | null>(null);

  // İşlem silme
  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Bu işlemi silmek istediğinizden emin misiniz?")) {
      return;
    }

    setDeleting(id);

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("İşlem silme hatası:", error);
        toast.error("İşlem silinirken bir hata oluştu");
        return;
      }

      toast.success("İşlem başarıyla silindi");
      // Sayfayı yenile
      window.location.reload();
    } catch (error) {
      console.error("İşlem silme hatası:", error);
      toast.error("İşlem silinirken bir hata oluştu");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Yükleniyor...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-muted/40 rounded-md">
        <p className="text-muted-foreground mb-4">Hiç işlem bulunamadı</p>
        <Button
          variant="outline"
          onClick={() => window.location.href = "/dashboard/transactions/new"}
        >
          Yeni İşlem Ekle
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Tutar</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const transactionDate = new Date(transaction.date);
              const today = new Date();
              const isFutureTransaction = transactionDate > today;

              return (
                <TableRow key={transaction.id} className={isFutureTransaction ? "opacity-60" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isFutureTransaction && (
                        <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-1" title="Gelecek tarihli işlem">
                          <Clock className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                        </div>
                      )}
                      {format(transactionDate, "d MMMM yyyy", { locale: tr })}
                    </div>
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell className={transaction.type === "income" ? "text-green-500" : "text-red-500"}>
                    <div className="flex items-center">
                      {transaction.type === "income" ? (
                        <ArrowUpRight className="mr-1 h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="mr-1 h-4 w-4" />
                      )}
                      ₺{transaction.amount.toLocaleString("tr-TR")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        transaction.type === "income"
                          ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                          : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                      }`}
                    >
                      {transaction.type === "income" ? "Gelir" : "Gider"}
                      {isFutureTransaction && " (Gelecek)"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.location.href = `/dashboard/transactions/edit/${transaction.id}`}
                      >
                        <Pencil className="h-4 w-4 text-primary" />
                        <span className="sr-only">Düzenle</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        disabled={deleting === transaction.id}
                      >
                        {deleting === transaction.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                        ) : (
                          <Trash className="h-4 w-4 text-red-500" />
                        )}
                        <span className="sr-only">Sil</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
} 