import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const sql = `
-- =============================================
-- FIX: Restaurar políticas RLS para tabela prayers
-- =============================================

-- DROP das policies existentes
DROP POLICY IF EXISTS "Prayers viewable by authenticated community members" ON public.prayers;
DROP POLICY IF EXISTS "Usuários podem criar suas orações" ON public.prayers;
DROP POLICY IF EXISTS "Usuários podem atualizar suas orações" ON public.prayers;
DROP POLICY IF EXISTS "Usuários podem deletar suas orações" ON public.prayers;

-- SELECT: Orações visíveis para usuários autenticados
CREATE POLICY "Prayers viewable by authenticated users"
ON public.prayers
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Usuários podem criar suas próprias orações
CREATE POLICY "Users can create prayers"
ON public.prayers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuários podem atualizar apenas suas próprias orações
CREATE POLICY "Users can update own prayers"
ON public.prayers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Usuários podem deletar apenas suas próprias orações
CREATE POLICY "Users can delete own prayers"
ON public.prayers
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
`;

async function fixPrayers() {
  console.log('🔧 Executando correção das políticas RLS para prayers...\n');

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Erro ao executar SQL:', error);
    process.exit(1);
  }

  console.log('✅ Políticas RLS corrigidas com sucesso!');
  console.log('\nAgora você pode publicar orações normalmente! 🙏');
}

fixPrayers();
