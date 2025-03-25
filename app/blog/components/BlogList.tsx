'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  category: Category;
  published_at: string;
}

export default function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPosts = posts.filter(post =>
    (selectedCategory ? post.category?.id === selectedCategory : true) &&
    (
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Kategorilere göre yazıları grupla
  const groupedByCategory = filteredPosts.reduce((acc, post) => {
    const categoryId = post.category?.id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(post);
    return acc;
  }, {} as Record<string, BlogPost[]>);

  return (
    <div className="space-y-8">
      {/* Search and Title Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight dark:text-white">Blog</h1>
          <p className="text-muted-foreground mt-1 dark:text-gray-400">
            Finans dünyasından en güncel haberler ve ipuçları
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Blog yazılarında ara..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-8"
            />
          </div>
          <Button variant="default" size="icon" onClick={handleSearch} aria-label="Ara">
            <Search className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuItem 
                  onClick={() => setSelectedCategory(null)}
                  className="cursor-pointer"
                >
                  Tüm Kategoriler
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {categories.map((category) => (
                  <DropdownMenuItem 
                    key={category.id} 
                    onClick={() => setSelectedCategory(category.id)}
                    className="cursor-pointer"
                  >
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Selected Category Badge */}
      {selectedCategory && (
        <div className="flex items-center">
          <Badge variant="outline" className="px-3 py-1 dark:border-gray-700 dark:text-gray-300">
            Kategori: {categories.find(c => c.id === selectedCategory)?.name}
            <button 
              className="ml-2 text-muted-foreground hover:text-foreground dark:hover:text-gray-200"
              onClick={() => setSelectedCategory(null)}
            >
              ✕
            </button>
          </Badge>
        </div>
      )}

      {/* Blog Posts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3 dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <div className="aspect-video bg-muted dark:bg-gray-700 rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-muted dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-muted dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="space-y-12">
          {Object.entries(groupedByCategory).map(([categoryId, posts]) => {
            const category = categories.find(c => c.id === categoryId) || { name: 'Diğer' };
            return (
              <div key={categoryId} className="space-y-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight dark:text-white">{category.name}</h2>
                  <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-200">{posts.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`}>
                      <article className="group relative flex flex-col h-full border rounded-lg overflow-hidden hover:border-primary/50 transition-colors hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                        <div className="overflow-hidden">
                          {post.featured_image ? (
                            <div className="aspect-video bg-muted dark:bg-gray-700">
                              <Image
                                src={post.featured_image}
                                alt={post.title}
                                width={600}
                                height={400}
                                className="aspect-video object-cover h-full w-full transition-transform group-hover:scale-105 duration-300"
                              />
                            </div>
                          ) : (
                            <div className="aspect-video bg-muted dark:bg-gray-700" />
                          )}
                        </div>
                        <div className="flex flex-col flex-grow p-4 sm:p-4 p-3 space-y-2">
                          <div className="flex items-start mb-1">
                            <span className="text-primary px-2 py-1 bg-primary/10 rounded-full text-xs dark:bg-primary/20 dark:text-primary-foreground font-medium blog-category-tag">
                              {post.category?.name}
                            </span>
                            <time className="text-muted-foreground text-xs dark:text-gray-400 ml-auto">
                              {new Date(post.published_at).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long'
                              })}
                            </time>
                          </div>
                          
                          <h2 className="text-xl sm:text-xl text-lg font-semibold tracking-tight group-hover:text-primary transition-colors dark:text-foreground">
                            {post.title}
                          </h2>
                          
                          {/* Özet yerine "Devamını Oku" butonu */}
                          <div className="mt-auto pt-2 text-right">
                            <span className="text-primary text-sm font-medium hover:underline inline-flex items-center">
                              Devamını Oku
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Sonuç Bulunamadı</h2>
          <p className="text-muted-foreground mt-1">
            Arama kriterlerinize uygun blog yazısı bulunamadı.
          </p>
        </div>
      )}
    </div>
  );
} 