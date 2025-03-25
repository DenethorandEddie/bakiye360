"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FolderOpen, Plus, PlusCircle, Settings, Users } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    categories: 0
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch total posts and counts by status
        const { data: posts, error: postsError } = await supabase
          .from('blog_posts')
          .select('id, status');

        if (postsError) throw postsError;

        if (posts) {
          const publishedPosts = posts.filter(post => post.status === 'published').length;
          const draftPosts = posts.filter(post => post.status === 'draft').length;
          
          setStats(prev => ({
            ...prev,
            totalPosts: posts.length,
            publishedPosts,
            draftPosts
          }));
        }

        // Fetch categories count
        const { count, error: categoriesError } = await supabase
          .from('blog_categories')
          .select('*', { count: 'exact', head: true });

        if (categoriesError) throw categoriesError;

        if (count !== null) {
          setStats(prev => ({
            ...prev,
            categories: count
          }));
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }

    fetchStats();
  }, [supabase]);

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Yönetim Paneli</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/admin/blog/new">
          <Card className="p-6 hover:shadow-md transition-all cursor-pointer border-primary/10 hover:border-primary">
            <div className="flex flex-col items-center text-center space-y-3">
              <PlusCircle className="h-10 w-10 text-primary" />
              <h2 className="text-xl font-semibold">Yeni Blog Yazısı</h2>
              <p className="text-muted-foreground text-sm">HTML formatında içerikle yeni blog yazısı oluşturun</p>
            </div>
          </Card>
        </Link>
        
        <Link href="/admin/blog">
          <Card className="p-6 hover:shadow-md transition-all cursor-pointer">
            <div className="flex flex-col items-center text-center space-y-3">
              <FileText className="h-10 w-10 text-blue-500" />
              <h2 className="text-xl font-semibold">Blog Yönetimi</h2>
              <p className="text-muted-foreground text-sm">Mevcut blog yazılarını düzenleyin, silin veya yayınlayın</p>
            </div>
          </Card>
        </Link>
        
        <Link href="/admin/users">
          <Card className="p-6 hover:shadow-md transition-all cursor-pointer">
            <div className="flex flex-col items-center text-center space-y-3">
              <Users className="h-10 w-10 text-yellow-500" />
              <h2 className="text-xl font-semibold">Kullanıcı Yönetimi</h2>
              <p className="text-muted-foreground text-sm">Kullanıcıları görüntüleyin ve yönetin</p>
            </div>
          </Card>
        </Link>
        
        <Link href="/admin/settings">
          <Card className="p-6 hover:shadow-md transition-all cursor-pointer">
            <div className="flex flex-col items-center text-center space-y-3">
              <Settings className="h-10 w-10 text-green-500" />
              <h2 className="text-xl font-semibold">Site Ayarları</h2>
              <p className="text-muted-foreground text-sm">Site yapılandırması ve ayarlarını yönetin</p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
} 