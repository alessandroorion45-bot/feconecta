// Script para aplicar migration diretamente no Supabase
const fs = require('fs');
const https = require('https');

// Ler arquivo da migration
const migrationSQL = fs.readFileSync('./supabase/migrations/20260626110000_sistema_mensagens_completo.sql', 'utf8');

// Ler .env para pegar credenciais
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    env[key.trim()] = values.join('=').trim().replace(/['"]/g, '');
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Erro: SUPABASE_URL ou SUPABASE_KEY não encontrados no .env');
  process.exit(1);
}

console.log('🚀 Aplicando migration no Supabase...');
console.log('📦 Arquivo: 20260626110000_sistema_mensagens_completo.sql');
console.log(`🔗 URL: ${SUPABASE_URL}`);
console.log('');

// Extrair project ID da URL
const projectId = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectId) {
  console.error('❌ Não foi possível extrair project ID da URL');
  process.exit(1);
}

// Preparar requisição
const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
const data = JSON.stringify({
  query: migrationSQL
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'return=minimal'
  }
};

// Fazer requisição
const urlObj = new URL(url);
const req = https.request({
  hostname: urlObj.hostname,
  port: urlObj.port,
  path: urlObj.pathname + urlObj.search,
  method: options.method,
  headers: options.headers
}, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Migration aplicada com sucesso!');
      console.log('');
      console.log('🎉 Sistema de Mensagens criado no banco de dados!');
      console.log('');
      console.log('📊 Próximos passos:');
      console.log('  1. Acesse: http://localhost:8080/test-chat-engine');
      console.log('  2. Teste o sistema de mensagens');
      console.log('  3. Verifique se as reações funcionam');
      console.log('');
    } else {
      console.error('❌ Erro ao aplicar migration:');
      console.error(`Status: ${res.statusCode}`);
      console.error('Body:', body);
      console.log('');
      console.log('💡 Solução alternativa:');
      console.log('  1. Acesse: https://supabase.com/dashboard');
      console.log('  2. Vá em SQL Editor');
      console.log('  3. Copie o conteúdo de: supabase/migrations/20260626110000_sistema_mensagens_completo.sql');
      console.log('  4. Cole no editor e execute');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message);
  console.log('');
  console.log('💡 A API REST do Supabase não suporta executar SQL diretamente.');
  console.log('');
  console.log('✅ SOLUÇÃO SIMPLES:');
  console.log('');
  console.log('  1. Acesse: https://supabase.com/dashboard/project/' + projectId);
  console.log('  2. Clique em "SQL Editor" no menu lateral');
  console.log('  3. Clique em "New query"');
  console.log('  4. Abra o arquivo: supabase/migrations/20260626110000_sistema_mensagens_completo.sql');
  console.log('  5. Copie TODO o conteúdo');
  console.log('  6. Cole no SQL Editor');
  console.log('  7. Clique em "RUN" (ou Ctrl + Enter)');
  console.log('  8. Aguarde ~10 segundos');
  console.log('  9. Deve aparecer: "Sistema de Mensagens Proprietário da Rede da Fé criado com sucesso!"');
  console.log('');
  console.log('🔗 Link direto: https://supabase.com/dashboard/project/' + projectId + '/sql');
  console.log('');
});

req.write(data);
req.end();
