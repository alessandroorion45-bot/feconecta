# 🔍 DEBUG: Logout Automático

## ❌ PROBLEMA RELATADO

O usuário está sendo **deslogado automaticamente** quando tenta carregar algo (ex: upload de capa).

## 🕵️ POSSÍVEIS CAUSAS

### 1. **Token Expirado** (MAIS PROVÁVEL)
- O Supabase tem sessão de **1 hora** por padrão
- Se o token expira, ele tenta refresh automático
- Se o refresh falhar, ele desloga

### 2. **Erro de CORS / Storage**
- Upload para bucket pode estar causando erro
- Erro pode acionar `SIGNED_OUT` por engano

### 3. **RLS Policy Negando Acesso**
- Se a policy negar o upload, pode deslogar

### 4. **Multiple Tabs**
- Se tiver 2 abas abertas e uma deslogar, a outra também desloga

## ✅ CORREÇÕES APLICADAS

### 1. **Tratamento de TOKEN_EXPIRED**
Adicionei handler para token expirado que tenta refresh ao invés de deslogar:

```typescript
else if (event === 'TOKEN_EXPIRED') {
  console.error('[AuthContext] Token expired - refreshing session');
  supabase.auth.refreshSession().then(({ data, error }) => {
    if (error) {
      console.error('[AuthContext] Failed to refresh token:', error);
      setSession(null);
      setUser(null);
    } else {
      console.log('[AuthContext] Token refreshed successfully');
      setSession(data.session);
      setUser(data.session?.user ?? null);
    }
  });
}
```

### 2. **Melhorias no Supabase Client**
Adicionei configurações de segurança e persistência:

```typescript
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // PKCE flow mais seguro
  },
  global: {
    headers: {
      'X-Client-Info': 'feconecta-web',
    },
  },
});
```

### 3. **Logs Detalhados**
Adicionei logs para rastrear eventos de auth:

```typescript
console.log('[AuthContext] Auth state changed:', event, 'Session:', newSession ? 'exists' : 'null');
console.warn('[AuthContext] User signed out - event triggered');
```

## 🧪 COMO TESTAR

1. **Abra o Console do DevTools** (F12)
2. **Vá para a aba Console**
3. **Faça login**
4. **Tente fazer upload da capa**
5. **Observe os logs:**
   - Se aparecer `TOKEN_EXPIRED` → token expirou
   - Se aparecer `SIGNED_OUT` → algo está deslogando
   - Se aparecer erro de Storage → problema no bucket

## 📋 PRÓXIMOS PASSOS

### Se o problema persistir, verifique:

1. **Console do Browser:**
   - Erros de Storage?
   - Erros de RLS?
   - Erros de CORS?

2. **Supabase Dashboard:**
   - Logs de Auth
   - Logs de Storage
   - Políticas RLS do bucket `covers`

3. **Teste em Incógnito:**
   - Para descartar problema de extensões
   - Para descartar cache

## 🔧 OUTRAS SOLUÇÕES SE NECESSÁRIO

### Se TOKEN_EXPIRED continuar:

```typescript
// Aumentar tempo de expiração do token (no Supabase Dashboard)
// Settings → Auth → JWT Settings
// JWT expiry limit: 3600 (1 hora) → 7200 (2 horas)
```

### Se for problema de múltiplas abas:

```typescript
// Adicionar broadcast channel para sincronizar auth entre abas
const channel = new BroadcastChannel('auth-channel');
channel.postMessage({ type: 'SIGNED_OUT' });
```

### Se for erro de Storage:

```typescript
// Adicionar try/catch no upload para não quebrar auth
try {
  await supabase.storage.from('covers').upload(...);
} catch (error) {
  console.error('Upload failed:', error);
  // NÃO desloga, só mostra erro
}
```

---

**Data:** 17/06/2026  
**Status:** Correções aplicadas, aguardando teste
