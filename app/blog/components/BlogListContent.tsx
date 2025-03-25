'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { BlogPost, Category } from './types';
// Diğer import'lar...

async function fetchData() {
  const supabase = createClientComponentClient();
  
  const [posts, categories] = await Promise.all([
    supabase.from('blog_posts').select('*, category:blog_categories(*)').eq('status', 'published'),
    supabase.from('blog_categories').select('*')
  ]);

  return {
    posts: posts.data || [],
    categories: categories.data || []
  };
}

export default function BlogListContent() {
  const [data, setData] = useState<{ posts: BlogPost[]; categories: Category[] }>({ posts: [], categories: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData().then((result) => {
      setData(result);
      setLoading(false);
    });
  }, []);

  // Render mantığı burada kalacak...
} 