'use client';

import { useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  const handleImageUpload = async (blobInfo: any) => {
    try {
      const file = blobInfo.blob();
      const fileExt = file.name?.split('.').pop() || 'jpg';
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `blog-images/${fileName}`;

      const { data, error } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Resim yüklenirken hata:', error);
      return '';
    }
  };

  return (
    <div className="relative min-h-[400px] border rounded-md">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30 rounded-md">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      )}
      
      <Editor
        apiKey="u24dfegz4mahvg746vim5pc2wbojtqbnp0ykio4y4sob9f9h"
        onInit={(evt, editor) => {
          editorRef.current = editor;
          setIsLoading(false);
        }}
        initialValue={value}
        onEditorChange={(newValue) => onChange(newValue)}
        init={{
          height: 500,
          menubar: true,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'image media | removeformat | help',
          content_style: `
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; 
              font-size: 16px; 
              line-height: 1.6;
              padding: 20px;
            }
            p { 
              margin: 0 0 1em 0; 
            }
            h1, h2, h3, h4, h5, h6 { 
              margin-top: 1.5em; 
              margin-bottom: 0.5em; 
            }
            img { 
              max-width: 100%; 
              height: auto; 
            }
            ul, ol { 
              padding-left: 2em; 
              margin-bottom: 1em; 
            }
            blockquote {
              border-left: 4px solid #e0e0e0;
              padding-left: 16px;
              margin-left: 0;
              color: #666;
            }
            pre {
              background-color: #f5f5f5;
              padding: 16px;
              border-radius: 4px;
              overflow-x: auto;
            }
            code {
              font-family: Monaco, Consolas, monospace;
              background-color: #f5f5f5;
              padding: 2px 4px;
              border-radius: 3px;
            }
          `,
          language: 'tr',
          language_url: '/langs/tr.js',
          entity_encoding: 'raw',
          forced_root_block: 'p',
          valid_elements: '*[*]',
          extended_valid_elements: 'span[*],img[*],a[*]',
          images_upload_handler: handleImageUpload,
          automatic_uploads: true,
          file_picker_types: 'image',
          codesample_languages: [
            { text: 'HTML/XML', value: 'markup' },
            { text: 'JavaScript', value: 'javascript' },
            { text: 'CSS', value: 'css' },
            { text: 'PHP', value: 'php' },
            { text: 'Python', value: 'python' },
            { text: 'Java', value: 'java' },
            { text: 'C', value: 'c' },
            { text: 'C#', value: 'csharp' },
            { text: 'C++', value: 'cpp' }
          ]
        }}
      />
    </div>
  );
} 