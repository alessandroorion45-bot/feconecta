# Fix: Problema ao Publicar Testemunhos

## Problema Identificado
Usuários não conseguem publicar testemunhos, recebendo erro "Não foi possível publicar o depoimento".

## Causas Possíveis

### 1. Perfil não encontrado no banco de dados
- O usuário está autenticado (tem conta no `auth.users`)
- Mas não tem registro correspondente na tabela `profiles`
- Isso viola a Foreign Key constraint `testimonies_user_id_fkey`

### 2. Problemas com RLS (Row Level Security)
- Política: "Usuários podem criar seus depoimentos" (`auth.uid() = user_id`)
- Se o `auth.uid()` não bater com o `user_id`, a inserção é bloqueada

### 3. Cache de perfil não atualizado
- O perfil pode ter sido criado mas não estar no cache do Supabase

## Alterações Realizadas

### 1. Melhor Tratamento de Erros ([Testimonies.tsx:205-267](src/pages/Testimonies.tsx#L205-L267))
```typescript
// Antes de inserir, verifica se o perfil existe
const { data: profileData, error: profileError } = await supabase
  .from("profiles")
  .select("id, username")
  .eq("id", user.id)
  .single();

if (profileError || !profileData) {
  // Mostra mensagem clara ao usuário
  toast({
    title: "Erro no perfil",
    description: "Seu perfil não foi encontrado. Tente fazer logout e login novamente.",
  });
  return;
}
```

### 2. Logs Detalhados
- Console logs adicionados para debugar:
  - Dados do usuário tentando inserir
  - Verificação de perfil
  - Detalhes completos do erro (code, message, details, hint)

### 3. Mensagens de Erro Específicas
```typescript
if (error.code === '23503') {
  // Foreign key violation
  errorMessage = "Erro: Perfil não encontrado no banco de dados";
} else if (error.code === '42501') {
  // Permission denied
  errorMessage = "Erro de permissão. Tente fazer logout e login novamente.";
}
```

### 4. AudioRecorder também atualizado ([AudioRecorder.tsx:153-182](src/components/AudioRecorder.tsx#L153-L182))
- Mesma verificação de perfil antes de inserir testemunho em áudio

## Como Testar

### 1. No Console do Browser (F12)
Ao tentar publicar um testemunho, você verá logs como:

```
[Testimonies] Tentando inserir testemunho: {
  user_id: "364...",
  title: "...",
  content_length: 123
}
[Testimonies] Perfil encontrado: {
  id: "364...",
  username: "alessandroorion45"
}
[Testimonies] Testemunho inserido com sucesso: [...]
```

Se houver erro:
```
[Testimonies] Perfil não encontrado: {...}
// OU
[Testimonies] Erro ao inserir testemunho: {
  code: "23503",
  message: "...",
  details: "..."
}
```

### 2. No Supabase SQL Editor
Execute o script [debug-testimony.sql](debug-testimony.sql) para diagnosticar:

```sql
-- Verificar perfil do usuário
SELECT p.id, p.username, p.full_name, a.email
FROM profiles p
JOIN auth.users a ON a.id = p.id
WHERE a.email = 'alessandroibama40@gmail.com';

-- Verificar políticas RLS
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'testimonies';
```

### 3. Teste Manual
1. Acesse https://feconecta-69w6.vercel.app/testimonies
2. Faça login
3. Clique em "Novo Testemunho"
4. Preencha título e conteúdo
5. Clique em "Publicar"
6. Verifique o console (F12) para ver os logs detalhados

## Soluções se o Problema Persistir

### Solução 1: Recriar o Perfil
Se o perfil não existe:
```sql
-- No SQL Editor do Supabase
INSERT INTO profiles (id, username, full_name)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
WHERE id = 'USER_ID_AQUI'
ON CONFLICT (id) DO NOTHING;
```

### Solução 2: Verificar Políticas RLS
Certifique-se de que a política de INSERT está correta:
```sql
-- Verificar política atual
SELECT * FROM pg_policies WHERE tablename = 'testimonies' AND cmd = 'INSERT';

-- Se necessário, recriar a política
DROP POLICY IF EXISTS "Usuários podem criar seus depoimentos" ON testimonies;

CREATE POLICY "Usuários podem criar seus depoimentos" 
ON testimonies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
```

### Solução 3: Cache do Supabase
Se o perfil existe mas o erro persiste, pode ser cache:
```typescript
// No código, forçar reload do perfil
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  await supabase.auth.refreshSession();
}
```

## Códigos de Erro Comuns

| Código | Significado | Solução |
|--------|-------------|---------|
| `23503` | Foreign key violation | Perfil não existe na tabela profiles |
| `42501` | Permission denied | Problema com RLS policy |
| `23505` | Unique violation | Registro duplicado (improvável aqui) |
| `PGRST` | PostgREST error | Erro na configuração do Supabase |

## Próximos Passos

1. **Deploy das alterações** ✅
2. **Testar em produção** ⏳
3. **Monitorar logs do console** ⏳
4. **Verificar se o perfil do usuário existe** ⏳
5. **Se necessário, executar script SQL para corrigir perfil** ⏳

## Arquivos Alterados

- [src/pages/Testimonies.tsx](src/pages/Testimonies.tsx) - Função `handleCreateTestimony`
- [src/components/AudioRecorder.tsx](src/components/AudioRecorder.tsx) - Função `handleUpload`
- [debug-testimony.sql](debug-testimony.sql) - Script de diagnóstico (novo arquivo)

## Contato

Se o problema persistir após essas alterações, verifique:
1. Console do browser para ver o erro específico
2. Execute o script `debug-testimony.sql` no Supabase
3. Compartilhe os logs completos do console para análise
