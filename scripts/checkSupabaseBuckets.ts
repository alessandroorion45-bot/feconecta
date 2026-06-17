import { createClient } from '@supabase/supabase-js';

// Variáveis de ambiente do .env
const supabaseUrl = 'https://kfetvofrwtuduwmpvdlz.supabase.co';
const supabaseKey = 'sb_publishable_8-a3qVJjeLmRBhKui1rCvg_9hWQMqqR';

const supabase = createClient(supabaseUrl, supabaseKey);

const REQUIRED_BUCKETS = [
  { name: 'avatars', public: true },
  { name: 'photos', public: true },
  { name: 'videos', public: true },
  { name: 'worship-media', public: true },
];

async function checkAndCreateBuckets() {
  console.log('🔍 Verificando buckets do Supabase Storage...\n');

  try {
    // Listar buckets existentes
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError);
      return;
    }

    const existingBucketNames = existingBuckets?.map(b => b.name) || [];
    console.log('📦 Buckets existentes:', existingBucketNames.join(', ') || 'nenhum');
    console.log('');

    // Verificar e criar buckets faltantes
    for (const bucket of REQUIRED_BUCKETS) {
      if (existingBucketNames.includes(bucket.name)) {
        console.log(`✅ Bucket "${bucket.name}" já existe`);
      } else {
        console.log(`⚠️  Bucket "${bucket.name}" não encontrado. Tentando criar...`);

        const { error } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: bucket.name === 'videos'
            ? ['video/mp4', 'video/webm', 'video/quicktime']
            : ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        });

        if (error) {
          console.error(`   ❌ Erro ao criar bucket "${bucket.name}":`, error.message);
        } else {
          console.log(`   ✅ Bucket "${bucket.name}" criado com sucesso!`);
        }
      }
    }

    console.log('\n✨ Verificação concluída!');
  } catch (error: any) {
    console.error('❌ Erro fatal:', error.message);
  }
}

checkAndCreateBuckets();
