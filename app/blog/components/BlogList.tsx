'use client';

import { Suspense } from 'react';
import BlogListContent from './BlogListContent';

export default function BlogList() {
  return (
    <Suspense fallback={null}>
      <BlogListContent />
    </Suspense>
  );
} 