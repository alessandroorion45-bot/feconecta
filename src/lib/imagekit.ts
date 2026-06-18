/**
 * ImageKit.io - Serviço de otimização de imagens
 *
 * BENEFÍCIOS:
 * - ✅ 20 GB bandwidth grátis/mês
 * - ✅ Otimização automática (WebP, AVIF)
 * - ✅ Resize, crop, compress on-the-fly
 * - ✅ CDN global
 * - ✅ Cache automático
 *
 * SETUP:
 * 1. Crie conta em: https://imagekit.io/
 * 2. Pegue as credenciais em Dashboard
 * 3. Adicione no .env:
 *    VITE_IMAGEKIT_PUBLIC_KEY
 *    VITE_IMAGEKIT_URL_ENDPOINT
 */

const IMAGEKIT_URL = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '';
const IMAGEKIT_PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '';

interface ImageKitUploadResponse {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  height: number;
  width: number;
  size: number;
}

/**
 * Upload de imagem para ImageKit
 */
export async function uploadToImageKit(
  file: File,
  folder: string = 'uploads',
  fileName?: string
): Promise<ImageKitUploadResponse> {
  try {
    // Converter file para base64
    const base64 = await fileToBase64(file);

    // Fazer upload via API do ImageKit
    const formData = new FormData();
    formData.append('file', base64);
    formData.append('fileName', fileName || file.name);
    formData.append('folder', folder);
    formData.append('publicKey', IMAGEKIT_PUBLIC_KEY);

    const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Erro ao fazer upload para ImageKit');
    }

    const data = await response.json();
    console.log('✅ Upload para ImageKit concluído:', data);

    return data;
  } catch (error) {
    console.error('❌ Erro no upload ImageKit:', error);
    throw error;
  }
}

/**
 * Gerar URL otimizada do ImageKit
 *
 * @param path - Caminho da imagem no ImageKit
 * @param transformations - Transformações (width, height, quality, format)
 */
export function getImageKitUrl(
  path: string,
  transformations?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
    aspectRatio?: string;
    crop?: 'maintain_ratio' | 'force' | 'at_max' | 'at_least';
  }
): string {
  if (!IMAGEKIT_URL) {
    console.warn('⚠️ IMAGEKIT_URL não configurado, retornando path original');
    return path;
  }

  // Se já é URL completa, retornar
  if (path.startsWith('http')) {
    return path;
  }

  // Construir URL com transformações
  let url = `${IMAGEKIT_URL}`;

  if (transformations) {
    const params: string[] = [];

    if (transformations.width) params.push(`w-${transformations.width}`);
    if (transformations.height) params.push(`h-${transformations.height}`);
    if (transformations.quality) params.push(`q-${transformations.quality}`);
    if (transformations.format) params.push(`f-${transformations.format}`);
    if (transformations.aspectRatio) params.push(`ar-${transformations.aspectRatio}`);
    if (transformations.crop) params.push(`c-${transformations.crop}`);

    if (params.length > 0) {
      url += `/tr:${params.join(',')}`;
    }
  }

  url += `/${path}`;

  return url;
}

/**
 * URLs responsivas para diferentes devices
 */
export function getResponsiveImageUrls(path: string) {
  return {
    thumbnail: getImageKitUrl(path, { width: 300, quality: 80, format: 'auto' }),
    small: getImageKitUrl(path, { width: 640, quality: 85, format: 'auto' }),
    medium: getImageKitUrl(path, { width: 1024, quality: 85, format: 'auto' }),
    large: getImageKitUrl(path, { width: 1920, quality: 90, format: 'auto' }),
    original: getImageKitUrl(path),
  };
}

/**
 * Helper: File to Base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Deletar imagem do ImageKit
 */
export async function deleteFromImageKit(fileId: string): Promise<void> {
  try {
    // TODO: Implementar com auth do backend
    console.log('🗑️ Deletando do ImageKit:', fileId);
    // Necessário fazer via backend por segurança (precisa private key)
  } catch (error) {
    console.error('❌ Erro ao deletar do ImageKit:', error);
    throw error;
  }
}

// Exemplos de uso:
/*
// Upload
const result = await uploadToImageKit(file, 'profile-photos', 'user-123.jpg');

// URL otimizada
const url = getImageKitUrl('profile-photos/user-123.jpg', {
  width: 400,
  height: 400,
  quality: 80,
  format: 'auto', // Serve WebP para navegadores compatíveis
  crop: 'maintain_ratio'
});

// URLs responsivas
const urls = getResponsiveImageUrls('profile-photos/user-123.jpg');
<img
  src={urls.small}
  srcSet={`${urls.small} 640w, ${urls.medium} 1024w, ${urls.large} 1920w`}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="Profile"
/>
*/
