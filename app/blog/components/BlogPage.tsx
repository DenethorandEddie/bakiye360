'use client';

import { Suspense } from 'react';
import BlogList from './BlogList';
import BlogHeader from './BlogHeader';
import LoadingSkeleton from './BlogSkeleton';

export default function BlogPage() {
  return (
    <div className="container py-8">
      <BlogHeader />
      <Suspense fallback={<LoadingSkeleton />}>
        <BlogList />
      </Suspense>
    </div>
  );
} 