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
  password: z.string().min(6, {
    message: "Şifre en az 6 karakter olmalıdır.",
  }),
  confirmPassword: z.string().min(6, {
    message: "Şifre en az 6 karakter olmalıdır.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
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
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // Gerçek Supabase bağlantısı olmadığı için demo amaçlı kayıt işlemi
      if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://example.supabase.co') {
        // Demo mod - gerçek kayıt yapmadan simüle et
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simüle edilmiş gecikme
        toast.success("Demo mod: Kayıt başarılı! Giriş yapabilirsiniz.");
        router.push("/login");
        return;
      }

      // Gerçek Supabase kayıt işlemi
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `https://bakiye360.com/auth/callback`,
        },
      });

      if (error) {
        console.error("Kayıt hatası:", error);
        toast.error(error.message || "Kayıt olurken bir hata oluştu");
        return;
      }

      console.log("Kayıt başarılı:", data);
      toast.success("Kayıt başarılı! Giriş yapabilirsiniz.");
      router.push("/login");
    } catch (error) {
      console.error("Kayıt işlemi hatası:", error);
      toast.error("Kayıt olurken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen relative items-center justify-center bg-background">
      {/* Arka plan efektleri */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-background to-background" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
      </div>

      {/* Ana içerik */}
      <div className="relative w-full max-w-lg px-4 py-8">
        <Card className="border-none shadow-2xl bg-background/60 backdrop-blur-xl">
          <CardHeader className="space-y-1 text-center pb-8">
            <div className="flex justify-center mb-4 relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
              <div className="relative bg-gradient-to-tr from-blue-600 to-blue-400 p-3 rounded-xl shadow-xl">
                <Wallet className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Hesap Oluşturun
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Finansal özgürlüğünüze giden ilk adımı atın
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
                      <FormLabel className="text-foreground/80">E-posta</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ornek@mail.com" 
                          {...field}
                          className="bg-background/50 border-border/50 focus:border-blue-600/50 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Şifre</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••" 
                          {...field}
                          className="bg-background/50 border-border/50 focus:border-blue-600/50 transition-colors"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Şifreyi Doğrula</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••" 
                          {...field}
                          className="bg-background/50 border-border/50 focus:border-blue-600/50 transition-colors"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/25" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>Hesap Oluşturuluyor...</span>
                    </div>
                  ) : (
                    "Hesap Oluştur"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 border-t border-border/50 mt-4 pt-6">
            <div className="text-sm text-center space-x-1">
              <span className="text-muted-foreground">Zaten hesabınız var mı?</span>
              <Link 
                href="/login" 
                className="text-blue-600 hover:text-blue-500 transition-colors font-medium hover:underline"
              >
                Giriş Yapın
              </Link>
            </div>
            <p className="text-xs text-center text-muted-foreground px-6">
              Kayıt olarak, 
              <Link href="/terms" className="text-blue-600 hover:text-blue-500 mx-1 hover:underline">Kullanım Koşullarını</Link>
              ve
              <Link href="/privacy" className="text-blue-600 hover:text-blue-500 mx-1 hover:underline">Gizlilik Politikasını</Link>
              kabul etmiş olursunuz
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}