/**
 * Cloudflare R2 - Armazenamento de Vídeos e Áudios
 *
 * BENEFÍCIOS:
 * - ✅ 10 GB storage grátis
 * - ✅ SEM taxa de saída (egress FREE!)
 * - ✅ Compatível com S3
 * - ✅ CDN global
 * - ✅ Domínio customizado grátis
 *
 * SETUP:
 * 1. Acesse: https://dash.cloudflare.com/
 * 2. Vá em R2 → Create Bucket
 * 3. Nome: feconecta-media
 * 4. Crie API Token em: R2 → Manage R2 API Tokens
 * 5. Adicione no .env as credenciais
 *
 * CUSTO (exemplo 100 GB storage + 1 TB download):
 * - Storage: 100 GB × $0.015 = $1.50/mês
 * - Download: GRÁTIS (vs $90 na AWS!)
 * - Total: $1.50/mês 🎉
 */

// AWS SDK v3 para S3 (compatível com R2)
// npm install @aws-sdk/client-s3 @aws-sdk/lib-storage

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = import.meta.env.VITE_R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY = import.meta.env.VITE_R2_ACCESS_KEY_ID || '';
const R2_SECRET_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET = import.meta.env.VITE_R2_BUCKET_NAME || 'feconecta-media';
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || '';

// Cliente S3 configurado para R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload de arquivo para R2 com progress
 */
export async function uploadToR2(
  file: File,
  folder: 'videos' | 'audios' | 'documents',
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  try {
    const fileName = `${folder}/${Date.now()}-${file.name}`;

    console.log('📤 Iniciando upload para R2:', fileName);

    const upload = new Upload({
      client: r2Client,
      params: {
        Bucket: R2_BUCKET,
        Key: fileName,
        Body: file,
        ContentType: file.type,
        // Tornar público
        // ACL: 'public-read', // R2 não suporta ACL, use Public Bucket ou Custom Domain
      },
    });

    // Monitorar progresso
    upload.on('httpUploadProgress', (progress) => {
      if (onProgress && progress.loaded && progress.total) {
        onProgress({
          loaded: progress.loaded,
          total: progress.total,
          percentage: Math.round((progress.loaded / progress.total) * 100),
        });
      }
    });

    await upload.done();

    console.log('✅ Upload para R2 concluído:', fileName);

    // Retornar URL pública
    return getR2PublicUrl(fileName);
  } catch (error) {
    console.error('❌ Erro no upload R2:', error);
    throw error;
  }
}

/**
 * Upload simples sem progress
 */
export async function uploadToR2Simple(
  file: File,
  folder: 'videos' | 'audios' | 'documents'
): Promise<string> {
  const fileName = `${folder}/${Date.now()}-${file.name}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: fileName,
    Body: file,
    ContentType: file.type,
  });

  await r2Client.send(command);

  console.log('✅ Upload simples R2:', fileName);
  return getR2PublicUrl(fileName);
}

/**
 * Deletar arquivo do R2
 */
export async function deleteFromR2(filePath: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: filePath,
    });

    await r2Client.send(command);
    console.log('🗑️ Deletado do R2:', filePath);
  } catch (error) {
    console.error('❌ Erro ao deletar do R2:', error);
    throw error;
  }
}

/**
 * Gerar URL assinada (para arquivos privados)
 */
export async function getR2SignedUrl(
  filePath: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: filePath,
    });

    const url = await getSignedUrl(r2Client, command, {
      expiresIn: expiresInSeconds,
    });

    return url;
  } catch (error) {
    console.error('❌ Erro ao gerar URL assinada:', error);
    throw error;
  }
}

/**
 * Obter URL pública do R2
 */
export function getR2PublicUrl(filePath: string): string {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${filePath}`;
  }

  // Fallback para URL padrão do R2 (se bucket for público)
  return `https://pub-${R2_ACCOUNT_ID}.r2.dev/${filePath}`;
}

/**
 * Helper: Validar tamanho de arquivo
 */
export function validateFileSize(
  file: File,
  maxSizeMB: number = 100
): { valid: boolean; error?: string } {
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Helper: Validar tipo de arquivo
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  const fileType = file.type;

  if (!allowedTypes.includes(fileType)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Permitidos: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

// Exemplos de uso:
/*
// Upload de vídeo com progress
const videoUrl = await uploadToR2(videoFile, 'videos', (progress) => {
  console.log(`Upload: ${progress.percentage}%`);
});

// Upload de áudio
const audioUrl = await uploadToR2Simple(audioFile, 'audios');

// Deletar
await deleteFromR2('videos/123456-video.mp4');

// URL assinada (privada, expira em 1h)
const privateUrl = await getR2SignedUrl('documents/private.pdf', 3600);

// Validação
const sizeCheck = validateFileSize(file, 50); // Max 50 MB
const typeCheck = validateFileType(file, ['video/mp4', 'video/webm']);

if (!sizeCheck.valid) {
  alert(sizeCheck.error);
}
*/
