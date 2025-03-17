"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FolderOpen, Plus } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Admin Dashboard</h1>
        <Button asChild>
          <Link href="/admin/posts/new">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Blog Yazısı
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="dark:bg-gray-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-200">Toplam Yazı</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{stats.totalPosts}</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-200">Yayında</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{stats.publishedPosts}</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-200">Taslak</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{stats.draftPosts}</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-200">Kategoriler</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{stats.categories}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="dark:text-white">Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/posts/new">
                <Plus className="mr-2 h-4 w-4" />
                Yeni Blog Yazısı
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/categories">
                <FolderOpen className="mr-2 h-4 w-4" />
                Kategorileri Yönet
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 