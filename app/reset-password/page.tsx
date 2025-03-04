"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({
    message: "Geçerli bir e-posta adresi giriniz.",
  }),
});

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key-for-development'
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi");
      router.push("/login");
    } catch (error) {
      toast.error("Şifre sıfırlama işlemi sırasında bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <Wallet className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Şifre Sıfırlama</CardTitle>
          <CardDescription>
            Şifrenizi sıfırlamak için e-posta adresinizi girin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta</FormLabel>
                    <FormControl>
                      <Input placeholder="ornek@mail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-sm text-center">
          <Link href="/login" className="text-primary hover:underline">
            Giriş sayfasına dön
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}