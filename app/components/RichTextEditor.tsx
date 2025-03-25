'use client';

import { useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative min-h-[400px] border rounded-md">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30 rounded-md">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      )}
      
      <Editor
        apiKey="your-tinymce-api-key" // Ücretsiz anahtar için: https://www.tiny.cloud/auth/signup/
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
            'removeformat | help',
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
          language: 'tr', // Türkçe dil desteği
          language_url: '/langs/tr.js', // Dil dosyasının konumu (public klasöründe)
          entity_encoding: 'raw', // HTML entity'leri olduğu gibi korur
          forced_root_block: 'p', // Boş satırları p etiketi olarak ekler
          valid_elements: '*[*]', // Tüm HTML etiketlerine izin ver
          extended_valid_elements: 'span[*],img[*],a[*]', // Ek olarak izin verilen özel etiketler
          // Kod görüntüleme için codesample eklentisi
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