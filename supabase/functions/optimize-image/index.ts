import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Sharp via npm: (Deno suporta importar pacotes npm diretamente)
// @ts-ignore
import sharp from 'npm:sharp@0.33.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OptimizeRequest {
  file: string; // base64 encoded file
  fileName: string;
  userId: string;
  type: 'photo' | 'avatar' | 'cover';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { file, fileName, userId, type }: OptimizeRequest = await req.json();

    if (!file || !userId) {
      throw new Error('Missing required fields: file, userId');
    }

    // Decode base64
    const base64Data = file.split(',')[1] || file;
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const timestamp = Date.now();
    const baseName = fileName.split('.')[0] || 'image';
    const basePath = `${userId}/${timestamp}_${baseName}`;

    const results: Record<string, string> = {};

    // Configurações por tipo
    const configs = {
      photo: {
        thumbnail: { width: 300, height: 300, quality: 80 },
        medium: { width: 800, height: 800, quality: 85 },
        full: { width: 1920, height: 1920, quality: 90 }
      },
      avatar: {
        thumbnail: { width: 150, height: 150, quality: 80 },
        medium: { width: 400, height: 400, quality: 85 },
        full: { width: 800, height: 800, quality: 90 }
      },
      cover: {
        thumbnail: { width: 400, height: 150, quality: 75 },
        medium: { width: 1200, height: 400, quality: 85 },
        full: { width: 1920, height: 600, quality: 90 }
      }
    };

    const config = configs[type] || configs.photo;

    // Gerar thumbnail
    const thumbnailBuffer = await sharp(buffer)
      .resize(config.thumbnail.width, config.thumbnail.height, {
        fit: type === 'cover' ? 'cover' : 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: config.thumbnail.quality })
      .toBuffer();

    const thumbnailPath = `${basePath}_thumb.webp`;
    const { error: thumbError } = await supabase.storage
      .from('photos')
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000' // 1 year
      });

    if (thumbError) throw thumbError;

    const { data: thumbUrl } = supabase.storage
      .from('photos')
      .getPublicUrl(thumbnailPath);

    results.thumbnail_url = thumbUrl.publicUrl;

    // Gerar medium
    const mediumBuffer = await sharp(buffer)
      .resize(config.medium.width, config.medium.height, {
        fit: type === 'cover' ? 'cover' : 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: config.medium.quality })
      .toBuffer();

    const mediumPath = `${basePath}_medium.webp`;
    const { error: mediumError } = await supabase.storage
      .from('photos')
      .upload(mediumPath, mediumBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000'
      });

    if (mediumError) throw mediumError;

    const { data: mediumUrl } = supabase.storage
      .from('photos')
      .getPublicUrl(mediumPath);

    results.medium_url = mediumUrl.publicUrl;

    // Gerar full
    const fullBuffer = await sharp(buffer)
      .resize(config.full.width, config.full.height, {
        fit: type === 'cover' ? 'cover' : 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: config.full.quality })
      .toBuffer();

    const fullPath = `${basePath}_full.webp`;
    const { error: fullError } = await supabase.storage
      .from('photos')
      .upload(fullPath, fullBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000'
      });

    if (fullError) throw fullError;

    const { data: fullUrl } = supabase.storage
      .from('photos')
      .getPublicUrl(fullPath);

    results.photo_url = fullUrl.publicUrl;
    results.full_url = fullUrl.publicUrl;

    // Metadados da imagem
    const metadata = await sharp(buffer).metadata();
    results.original_size = buffer.length;
    results.optimized_size = thumbnailBuffer.length + mediumBuffer.length + fullBuffer.length;
    results.compression_ratio = Math.round((1 - results.optimized_size / results.original_size) * 100);

    console.log(`✅ Image optimized: ${results.compression_ratio}% compression`);

    return new Response(
      JSON.stringify(results),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Error optimizing image:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
