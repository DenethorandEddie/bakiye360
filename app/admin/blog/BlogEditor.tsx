'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// TinyMCE veya başka bir editör kullanabilirsiniz
const RichTextEditor = dynamic(() => import('../../components/RichTextEditor'), { ssr: false });

export default function BlogEditor() {
  const [content, setContent] = useState('');
  
  return (
    <div>
      <RichTextEditor 
        value={content}
        onChange={setContent}
      />
      <button className="btn-primary mt-4">Kaydet</button>
    </div>
  );
} 