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
});

export default function LoginPage() {
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
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // Gerçek Supabase bağlantısı olmadığı için demo amaçlı giriş işlemi
      if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://example.supabase.co') {
        // Demo mod - gerçek giriş yapmadan simüle et
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simüle edilmiş gecikme
        
        // Demo kullanıcı oluştur ve localStorage'a kaydet
        const demoUser = {
          id: 'demo-user-id',
          email: values.email,
          user_metadata: {
            full_name: 'Demo Kullanıcı'
          },
          created_at: new Date().toISOString()
        };
        
        localStorage.setItem('demoUser', JSON.stringify(demoUser));
        
        // Storage event'i tetikle (diğer componentlerin haberdar olması için)
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'demoUser',
          newValue: JSON.stringify(demoUser)
        }));
        
        toast.success("Demo mod: Başarıyla giriş yapıldı");
        router.push("/dashboard");
        return;
      }

      // Gerçek Supabase giriş işlemi
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        console.error("Giriş hatası:", error);
        
        // Rate limit hatasını yakala ve kullanıcıya özel mesaj göster
        if (error.message?.includes('rate limit') || error.status === 429) {
          toast.error(
            "Çok fazla giriş denemesi yapıldı. Bu hata, aynı ağdaki diğer kullanıcıların giriş denemeleri nedeniyle de görülebilir. Lütfen birkaç dakika bekleyip tekrar deneyin veya farklı bir ağ üzerinden giriş yapmayı deneyin."
          );
          return;
        }
        
        // Diğer hata mesajlarını kontrol et
        if (error.message?.includes('credentials') || error.message?.includes('Invalid login')) {
          toast.error("E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.");
        } else if (error.message?.includes('confirm your email')) {
          toast.error("Lütfen önce e-posta adresinizi onaylayın.");
        } else {
          toast.error(error.message || "Giriş yapılırken bir hata oluştu");
        }
        return;
      }

      console.log("Giriş başarılı:", data);
      toast.success("Başarıyla giriş yapıldı");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Giriş işlemi hatası:", error);
      
      // Genel try-catch bloğunda da rate limit kontrolü yapalım
      if (error?.message?.includes('rate limit') || error?.status === 429) {
        toast.error("Çok fazla giriş denemesi yapıldı. Bu hata, aynı ağdaki diğer kullanıcıların giriş denemeleri nedeniyle de görülebilir. Lütfen birkaç dakika bekleyip tekrar deneyin veya farklı bir ağ üzerinden giriş yapmayı deneyin.");
      } else {
        toast.error("Giriş yapılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
      }
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
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
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
              Tekrar Hoş Geldiniz
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Hesabınıza giriş yaparak kaldığınız yerden devam edin
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
                      <FormMessage />
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
                      <span>Giriş yapılıyor...</span>
                    </div>
                  ) : (
                    "Giriş Yap"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 border-t border-border/50 mt-4 pt-6">
            <div className="text-sm text-muted-foreground text-center">
              <Link 
                href="/reset-password" 
                className="text-blue-600 hover:text-blue-500 transition-colors hover:underline"
              >
                Şifrenizi mi unuttunuz?
              </Link>
            </div>
            <div className="text-sm text-center space-x-1">
              <span className="text-muted-foreground">Hesabınız yok mu?</span>
              <Link 
                href="/register" 
                className="text-blue-600 hover:text-blue-500 transition-colors font-medium hover:underline"
              >
                Hemen Kayıt Olun
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}