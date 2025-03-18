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
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <Wallet className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Giriş Yap</CardTitle>
          <CardDescription>
            Bütçe yönetim uygulamanıza erişmek için giriş yapın
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifre</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground text-center">
            <Link href="/reset-password" className="text-primary hover:underline">
              Şifremi unuttum
            </Link>
          </div>
          <div className="text-sm text-center">
            Hesabınız yok mu?{" "}
            <Link href="/register" className="text-primary hover:underline font-semibold">
              Kayıt Ol
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}