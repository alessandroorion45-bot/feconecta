# 🔍 AUDITORIA DE PERFORMANCE - FECONECTA
**Data:** 2026-06-23
**Problemas Identificados:** 4 críticos

---

## ❌ PROBLEMA 1: FALTA DE ÍNDICES

### Tabelas SEM índices otimizados:
- `user_activities` - sem índice em (user_id, created_at)
- `user_activities` - sem índice em activity_type
- `admin_logs` - sem índice em (admin_id, created_at)
- `vip_subscriptions` - índices OK ✅
- `user_themes` - índices OK ✅

### SQL para criar índices:
```sql
-- user_activities (query de perfil)
CREATE INDEX IF NOT EXISTS idx_user_activities_user_created 
ON public.user_activities(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activities_type 
ON public.user_activities(activity_type);

-- admin_logs
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_created 
ON public.admin_logs(admin_id, created_at DESC);

-- users (busca por email)
CREATE INDEX IF NOT EXISTS idx_users_email 
ON public.users(email);
```

---

## ❌ PROBLEMA 2: QUERIES COMPLEXAS

### Queries identificadas como lentas:

#### 1. Perfil do usuário (TIMEOUT 10s!)
**Arquivo:** Provavelmente `Profile.tsx` ou `AuthContext.tsx`

**Problema:** Carrega TODOS os dados do perfil de uma vez:
- Fotos
- Vídeos
- Atividades
- Conquistas
- Amigos
- Estatísticas

**Solução:** Lazy loading + paginação

#### 2. Dashboard Admin (JÁ OTIMIZADO!)
**Status:** ✅ View materializada criada

---

## ❌ PROBLEMA 3: RLS POLICIES PESADAS

### Policies que podem causar lentidão:

#### user_activities:
```sql
-- Policy atual (pode estar lenta):
CREATE POLICY "Users can view own activities"
ON user_activities FOR SELECT
USING (auth.uid() = user_id);
```

**Problema:** Se não houver índice em `user_id`, faz full table scan!

**Solução:** Criar índice (já incluído no Problema 1)

#### admin_logs:
```sql
-- Policy atual:
CREATE POLICY "Admins can view logs"
ON admin_logs FOR SELECT
USING (has_permission(auth.uid(), 'logs.view'));
```

**Problema:** `has_permission()` executa para CADA linha!

**Solução:** Usar função IMMUTABLE ou cache

---

## ❌ PROBLEMA 4: PROBLEMA DE REDE COM SUPABASE

### Possíveis causas:

1. **Região distante:**
   - Supabase: US East
   - Usuário: Brasil
   - Latência: ~150-300ms por query

2. **Muitas queries em sequência:**
   - N+1 problem
   - Waterfall de queries

3. **Falta de cache:**
   - Queries repetidas sem cache

### Soluções:

1. **Usar Supabase Edge Functions** (região mais próxima)
2. **Implementar cache agressivo**
3. **Usar batch queries**
4. **Prefetch de dados**

---

## 🎯 PLANO DE CORREÇÃO

### PRIORIDADE ALTA (5min cada):

1. ✅ Criar índices faltantes (SQL)
2. ✅ Otimizar RLS policies
3. ✅ Adicionar cache em queries críticas

### PRIORIDADE MÉDIA (30min):

4. ⏳ Implementar lazy loading no perfil
5. ⏳ Adicionar paginação em listas
6. ⏳ Otimizar queries N+1

### PRIORIDADE BAIXA (1h+):

7. ⏳ Migrar para Supabase Edge Functions
8. ⏳ Implementar prefetching
9. ⏳ Adicionar service worker

---

## 📊 GANHO ESPERADO

| Correção | Ganho |
|----------|-------|
| Índices | -70% tempo de query |
| RLS otimizado | -50% overhead |
| Cache | -80% queries repetidas |
| **TOTAL** | **-60-80% tempo de carga** |

---

## ✅ PRÓXIMOS PASSOS

1. Executar SQL de índices no Supabase
2. Implementar cache em queries críticas
3. Otimizar RLS policies
4. Testar e medir ganhos

