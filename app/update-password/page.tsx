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

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key-for-development'
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Şifreniz başarıyla güncellendi");
      router.push("/login");
    } catch (error) {
      toast.error("Şifre güncelleme işlemi sırasında bir hata oluştu");
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
          <CardTitle className="text-2xl font-bold">Şifre Güncelleme</CardTitle>
          <CardDescription>
            Yeni şifrenizi belirleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yeni Şifre</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifreyi Doğrula</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
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