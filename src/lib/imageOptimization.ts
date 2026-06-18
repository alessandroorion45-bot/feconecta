import { supabase } from "@/integrations/supabase/client";

export interface OptimizedImageResult {
  photo_url: string;
  thumbnail_url: string;
  medium_url: string;
  full_url: string;
  original_size: number;
  optimized_size: number;
  compression_ratio: number;
}

/**
 * Converte File para base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Otimiza uma imagem usando a Edge Function do Supabase
 *
 * @param file - Arquivo de imagem
 * @param type - Tipo de imagem (photo, avatar, cover)
 * @param userId - ID do usuário
 * @returns URLs das versões otimizadas
 */
export const optimizeImage = async (
  file: File,
  type: 'photo' | 'avatar' | 'cover',
  userId: string
): Promise<OptimizedImageResult> => {
  try {
    // Validar arquivo
    if (!file.type.startsWith('image/')) {
      throw new Error('O arquivo deve ser uma imagem');
    }

    // Validar tamanho
    const maxSizes = {
      photo: 10 * 1024 * 1024, // 10MB
      avatar: 5 * 1024 * 1024,  // 5MB
      cover: 5 * 1024 * 1024    // 5MB
    };

    if (file.size > maxSizes[type]) {
      throw new Error(`Imagem muito grande. Máximo: ${maxSizes[type] / 1024 / 1024}MB`);
    }

    console.log(`📸 Otimizando ${type}:`, {
      nome: file.name,
      tamanho: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      tipo: file.type
    });

    // Converter para base64
    const base64 = await fileToBase64(file);

    // Chamar Edge Function
    const { data, error } = await supabase.functions.invoke('optimize-image', {
      body: {
        file: base64,
        fileName: file.name,
        userId,
        type
      }
    });

    if (error) {
      console.error('❌ Erro na otimização:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Nenhum dado retornado pela função de otimização');
    }

    console.log(`✅ Imagem otimizada com sucesso!`, {
      compressão: `${data.compression_ratio}%`,
      original: `${(data.original_size / 1024).toFixed(0)}KB`,
      otimizado: `${(data.optimized_size / 1024).toFixed(0)}KB`
    });

    return data as OptimizedImageResult;

  } catch (error: any) {
    console.error('❌ Erro ao otimizar imagem:', error);
    throw new Error(error.message || 'Erro ao otimizar imagem');
  }
};

/**
 * Fallback: Upload direto sem otimização (caso a Edge Function falhe)
 */
export const uploadImageDirect = async (
  file: File,
  userId: string,
  bucket: string = 'photos'
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};

/**
 * Utilitário: Obter URL otimizada baseada no tamanho de tela
 */
export const getResponsiveImageUrl = (
  urls: {
    thumbnail_url?: string;
    medium_url?: string;
    photo_url?: string;
    full_url?: string;
  },
  size: 'thumbnail' | 'medium' | 'full' = 'medium'
): string => {
  // Priorizar versão otimizada
  if (size === 'thumbnail' && urls.thumbnail_url) {
    return urls.thumbnail_url;
  }

  if (size === 'medium' && urls.medium_url) {
    return urls.medium_url;
  }

  if (size === 'full' && urls.full_url) {
    return urls.full_url;
  }

  // Fallback para photo_url (imagem original ou full)
  return urls.photo_url || urls.full_url || urls.medium_url || urls.thumbnail_url || '';
};

/**
 * Hook para detectar tamanho ideal baseado na largura da tela
 */
export const getOptimalImageSize = (): 'thumbnail' | 'medium' | 'full' => {
  if (typeof window === 'undefined') return 'medium';

  const width = window.innerWidth;

  if (width < 640) return 'thumbnail';  // Mobile
  if (width < 1024) return 'medium';    // Tablet
  return 'full';                        // Desktop
};
