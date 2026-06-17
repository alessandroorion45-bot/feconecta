# 🔧 CORREÇÃO: Upload de Capa de Perfil

## ❌ PROBLEMA

O usuário não consegue fazer upload da capa do perfil. Erro 404 no console:

```
Failed to load resource: the server responded with a status of 404
```

## 🔍 CAUSA RAIZ

O código em `CoverImageUpload.tsx` tenta fazer upload para o bucket **`covers`**, mas esse bucket **NÃO EXISTE** no Supabase.

### Código atual (linha 157):
```typescript
const { error: uploadError } = await supabase.storage
  .from("covers")  // ❌ Bucket não existe!
  .upload(fileName, croppedBlob, {
    contentType: "image/jpeg",
    upsert: true,
  });
```

## ✅ SOLUÇÃO

### Passo 1: Criar o bucket `covers` no Supabase

Execute o SQL abaixo no Supabase SQL Editor:

**Arquivo:** `supabase-covers-bucket-setup.sql`

```sql
-- Criar bucket "covers"
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers',
  'covers',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS
CREATE POLICY "Capas de perfil são públicas para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'covers');

CREATE POLICY "Usuários podem fazer upload da própria capa"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Usuários podem atualizar a própria capa"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Usuários podem deletar a própria capa"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Passo 2: Verificar criação

Execute esta query para confirmar:

```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'covers';
```

**Resultado esperado:**

| id     | name   | public | file_size_limit | allowed_mime_types                         |
|--------|--------|--------|-----------------|-------------------------------------------|
| covers | covers | true   | 5242880         | {image/jpeg, image/png, image/webp}       |

## 🎯 APÓS EXECUTAR

1. ✅ O bucket `covers` estará criado
2. ✅ Upload de capa funcionará
3. ✅ RLS permitirá apenas o dono fazer upload na sua pasta
4. ✅ Capas serão públicas (qualquer um pode ver)

## 📋 BUCKETS EXISTENTES (ANTES)

- ✅ `avatars` - Fotos de perfil
- ✅ `photos` - Fotos do usuário
- ✅ `videos` - Vídeos do usuário
- ✅ `worship-media` - Mídia de louvor
- ❌ `covers` - **FALTANDO** (capa de perfil)

## 📋 BUCKETS EXISTENTES (DEPOIS)

- ✅ `avatars` - Fotos de perfil
- ✅ `photos` - Fotos do usuário
- ✅ `videos` - Vídeos do usuário
- ✅ `worship-media` - Mídia de louvor
- ✅ `covers` - **CRIADO** (capa de perfil)

## 🚀 COMO O USUÁRIO DEVE PROCEDER

1. Acesse: https://supabase.com/dashboard/project/kfetvofrwtuduwmpvdlz/sql/new
2. Cole o SQL do arquivo `supabase-covers-bucket-setup.sql`
3. Clique em **RUN**
4. Verifique se retornou sucesso
5. Tente fazer upload da capa novamente

---

**Data:** 17/06/2026  
**Por:** Claude Code (Anthropic)
