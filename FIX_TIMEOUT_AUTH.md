# Fix: Timeouts na Autenticação

## Problema Identificado

Erros de timeout aparecendo no console:
```
[AuthContext] Unexpected error: Error: AUTH_TIMEOUT
Error checking Google auth: Error: TIMEOUT
Session check timeout - keeping existing state
Google auth check timeout - continuing anyway
```

## Causa Raiz

Os **timeouts de 5 segundos** eram muito curtos para:
- Conexões lentas ou instáveis
- Servidor do Supabase demorar a responder
- Cache do browser precisar revalidar sessão

### Timeouts Anteriores

| Local | Operação | Timeout Anterior |
|-------|----------|------------------|
| AuthContext.tsx:49 | `getSession()` | 5000ms (5s) |
| Auth.tsx:152 | `getUser()` OAuth | 5000ms (5s) |
| Auth.tsx:175 | Buscar perfil | 5000ms (5s) |

## Correções Aplicadas

### 1. AuthContext.tsx - Aumentado de 5s → 15s

**Antes:**
```typescript
const timeoutPromise = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error('AUTH_TIMEOUT')), 5000)
);
```

**Depois:**
```typescript
// Get session with timeout (15000ms - mais tempo para conexões lentas)
const timeoutPromise = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error('AUTH_TIMEOUT')), 15000)
);
```

### 2. Auth.tsx - OAuth Callback - Aumentado de 5s → 15s

**Antes:**
```typescript
const timeoutPromise = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error('TIMEOUT')), 5000)
);
```

**Depois:**
```typescript
// Add timeout (15s para conexões lentas)
const timeoutPromise = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error('TIMEOUT')), 15000)
);
```

### 3. Auth.tsx - Profile Check - Aumentado de 5s → 15s

**Antes:**
```typescript
new Promise<never>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 5000))
```

**Depois:**
```typescript
new Promise<never>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 15000))
```

## Benefícios

✅ **Menos erros de timeout** em conexões lentas  
✅ **Melhor experiência** para usuários com internet instável  
✅ **Compatível** com o timeout de 15s já usado em outras partes do código  
✅ **Mantém proteção** contra travamentos (ainda tem timeout, só que maior)

## Comportamento em Caso de Timeout

### AuthContext
Se o timeout ocorrer:
- **Mantém o estado atual** da sessão (não limpa)
- Loga warning: "Session check timeout - keeping existing state"
- Define `isLoading = false` para desbloquear a UI

### Auth.tsx (OAuth)
Se o timeout ocorrer:
- Loga warning: "Google auth check timeout - continuing anyway"
- **Não bloqueia** o fluxo de login
- Permite que o usuário continue usando o app

## Timeouts em Todo o Projeto

| Arquivo | Operação | Timeout Atual |
|---------|----------|---------------|
| AuthContext.tsx | getSession | 15000ms (15s) ✅ |
| Auth.tsx | OAuth getUser | 15000ms (15s) ✅ |
| Auth.tsx | Profile check | 15000ms (15s) ✅ |
| Auth.tsx | Sign up | 15000ms (15s) ✅ |
| Auth.tsx | Password reset | 15000ms (15s) ✅ |
| authWithRetry | Default timeout | 15000ms (15s) ✅ |

## Monitoramento

Verifique o console após deploy:

### ✅ Sucesso (esperado)
```
[AuthContext] Initializing auth...
[AuthContext] Session found for user: user@example.com
```

### ⚠️ Warning (aceitável)
```
[AuthContext] Session check timeout - keeping existing state
```
_(Usuário continua logado, apenas o refresh da sessão demorou)_

### ❌ Erro (problema real)
```
[AuthContext] Error getting session: <erro diferente de timeout>
```
_(Erro de rede, servidor, etc - precisa investigar)_

## Próximos Passos

Se os timeouts AINDA ocorrerem mesmo com 15s:

1. **Verificar rede do usuário**
   - Pode estar com internet muito lenta
   - Firewall bloqueando Supabase
   - VPN/Proxy interferindo

2. **Verificar Supabase Status**
   - https://status.supabase.com
   - Pode haver lentidão no servidor

3. **Considerar aumentar ainda mais** (se for problema generalizado)
   - Testar com 20s ou 30s
   - Mas isso pode deixar a UI mais lenta

4. **Implementar retry automático**
   - Já existe `authWithRetry` no código
   - Poderia ser usado em mais lugares

## Arquivos Alterados

- [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx#L49) - Timeout aumentado
- [src/pages/Auth.tsx](src/pages/Auth.tsx#L152) - OAuth timeout aumentado
- [src/pages/Auth.tsx](src/pages/Auth.tsx#L175) - Profile check timeout aumentado

## Relacionado

Este fix está relacionado ao [FIX_TESTEMUNHOS.md](FIX_TESTEMUNHOS.md):
- Timeouts causavam perda de sessão
- Sessão perdida → perfil não carregado
- Perfil não carregado → não consegue inserir testemunho

Agora com timeouts maiores, a sessão é mantida por mais tempo, reduzindo esses problemas em cascata.
