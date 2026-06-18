/**
 * Componente de teste - Upload ImageKit
 *
 * TESTE:
 * 1. Adicione este componente em qualquer página
 * 2. Selecione uma imagem
 * 3. Clique em "Testar Upload"
 * 4. Verifique o console e a resposta
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { uploadToImageKit, getImageKitUrl, getResponsiveImageUrls } from '@/lib/imagekit';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image as ImageIcon, CheckCircle } from 'lucide-react';

export function ImageKitUploadTest() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [preview, setPreview] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Preview local
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Erro',
        description: 'Selecione uma imagem primeiro',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      console.log('📤 Iniciando upload para ImageKit...');

      const result = await uploadToImageKit(file, 'test-uploads', `test-${Date.now()}.jpg`);

      console.log('✅ Upload concluído:', result);

      setUploadedUrl(result.url);

      toast({
        title: '🎉 Upload Concluído!',
        description: `Imagem otimizada e disponível no CDN`,
      });

      // Mostrar URLs otimizadas no console
      const urls = getResponsiveImageUrls(result.url);
      console.log('📸 URLs Responsivas:', urls);

    } catch (error) {
      console.error('❌ Erro no upload:', error);
      toast({
        title: 'Erro no upload',
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">🧪 Teste ImageKit.io</h2>

      <div className="space-y-4">
        {/* Input de arquivo */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Selecione uma imagem:
          </label>
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </div>

        {/* Preview local */}
        {preview && (
          <div className="border rounded p-4">
            <p className="text-sm font-medium mb-2">Preview Local:</p>
            <img
              src={preview}
              alt="Preview"
              className="max-w-full h-auto rounded max-h-64 object-contain"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Tamanho: {(file!.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        {/* Botão de upload */}
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-spin" />
              Fazendo upload...
            </>
          ) : (
            <>
              <ImageIcon className="mr-2 h-4 w-4" />
              Testar Upload para ImageKit
            </>
          )}
        </Button>

        {/* Resultado */}
        {uploadedUrl && (
          <div className="border border-green-500 rounded p-4 bg-green-50">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="font-semibold text-green-900">Upload Concluído!</p>
            </div>

            {/* Imagem otimizada */}
            <div className="mb-3">
              <p className="text-sm font-medium mb-2">Imagem Otimizada (400x400, WebP):</p>
              <img
                src={getImageKitUrl(uploadedUrl, {
                  width: 400,
                  height: 400,
                  quality: 80,
                  format: 'auto',
                })}
                alt="Otimizada"
                className="rounded border max-w-full"
              />
            </div>

            {/* URL */}
            <div>
              <p className="text-sm font-medium mb-1">URL Original:</p>
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline break-all"
              >
                {uploadedUrl}
              </a>
            </div>

            {/* Instruções */}
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                ✅ Abra o Console (F12) para ver todas as URLs geradas<br/>
                ✅ Verifique no Dashboard do ImageKit: <a href="https://imagekit.io/dashboard/media-library" target="_blank" className="text-blue-600 hover:underline">Media Library</a>
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
