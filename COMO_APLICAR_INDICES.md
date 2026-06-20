# 🚀 COMO APLICAR OS ÍNDICES NO SUPABASE

## 📋 **CONTEXTO:**

O perfil está demorando **30+ segundos** para carregar porque faltam índices nas tabelas do Supabase.

Esta migration cria **índices críticos** que vão reduzir o tempo de **30s para <1 segundo**.

---

## ⚡ **PASSO A PASSO:**

### **1. ABRA O SUPABASE SQL EDITOR:**

```
https://supabase.com/dashboard/project/kfetvofrwtuduwmpvdlz/sql/new
```

### **2. COPIE O SQL ABAIXO:**

```sql
-- Migration: Criar índices para melhorar performance
-- Data: 2026-06-20
-- Objetivo: Resolver timeout de 30s na query de perfil

-- CRÍTICO: Índice explícito na tabela profiles
-- Impacto: Reduzir query de 30s para <100ms
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- OTIMIZAÇÃO: Índices em foreign keys de tabelas relacionadas
-- Impacto: Acelerar queries de fotos, vídeos, badges e depoimentos

-- Índice para profile_photos (usado em ProfilePhotos component)
CREATE INDEX IF NOT EXISTS idx_profile_photos_user_id ON public.profile_photos(user_id);

-- Índice para user_videos (usado em ProfileVideos component)
CREATE INDEX IF NOT EXISTS idx_user_videos_user_id ON public.user_videos(user_id);

-- Índice para user_badges (usado em Profile component)
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);

-- Índice para friend_testimonials (usado em FriendTestimonials component)
CREATE INDEX IF NOT EXISTS idx_friend_testimonials_recipient_id ON public.friend_testimonials(recipient_id);
CREATE INDEX IF NOT EXISTS idx_friend_testimonials_author_id ON public.friend_testimonials(author_id);

-- Índice composto para queries comuns em posts
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON public.posts(user_id, created_at DESC);

-- Índice para prayer_comments
CREATE INDEX IF NOT EXISTS idx_prayer_comments_prayer_id ON public.prayer_comments(prayer_id);
```

### **3. CLIQUE EM "RUN" (ou pressione Ctrl+Enter)**

### **4. AGUARDE A CONFIRMAÇÃO:**

Você deve ver: **"Success. No rows returned"**

---

## ✅ **VERIFICAR SE FUNCIONOU:**

Execute este SQL para ver todos os índices criados:

```sql
SELECT 
  tablename, 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

Deve retornar **9 índices** criados!

---

## 🎯 **IMPACTO ESPERADO:**

| Antes | Depois |
|-------|--------|
| 30+ segundos | <1 segundo |
| Timeout | ✅ Funcionando |
| Usuário frustrado | Usuário feliz 🎉 |

---

## 🚨 **SE DER ERRO:**

### **Erro: "permission denied"**
- Você precisa ter permissão de ADMIN no projeto Supabase
- Faça login com a conta correta

### **Erro: "relation does not exist"**
- Alguma tabela não existe ainda
- Execute apenas os índices de tabelas que existem

---

## 📞 **SUPORTE:**

Se continuar dando timeout após aplicar os índices, verificar:
1. Aba Network (F12) → ver se requisição demora
2. Aba Console → ver logs detalhados
3. Supabase Logs → verificar slow queries

---

**Arquivo de migration:** `supabase/migrations/20260620_create_performance_indexes.sql`
