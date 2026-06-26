# 🚨 PROBLEMAS URGENTES DETECTADOS - 26/06/2026

## 🔴 ERROS CRÍTICOS (Prioridade Máxima)

### 1. React Error #185 - Loop Infinito de Renderização
**Erro:** `Minified React error #185`  
**Localização:** `index-toKmkxuI.js:2:114395`  
**Causa:** Array.map() causando loop infinito  
**Impacto:** CRÍTICO - App trava em algumas páginas  
**Arquivos Suspeitos:**
- Quiz (erros aparecem ao acessar `/quiz`)
- ChurchCommunity (erros aparecem ao acessar `/church-community`)

**Solução Necessária:**
- Identificar componente com `.map()` sem `key` ou com `key` instável
- Adicionar `key={item.id}` estável
- Verificar se `.map()` não está criando componente a cada render

---

### 2. F5 Ainda Retorna 404
**Status:** ❌ NÃO RESOLVIDO  
**Última tentativa:** Commit 765f4ee com `routes` no vercel.json  
**Problema:** Deploy pode não ter aplicado a configuração  

**Ações Necessárias:**
1. Verificar se build da Vercel usou o novo vercel.json
2. Forçar novo deploy (commit vazio)
3. Verificar logs da Vercel

---

### 3. Admin/Auth Timeouts Excessivos
**Erros:**
```
[AdminContext] Query timeout or error: Error: ROLES_QUERY_TIMEOUT
[AuthContext] Unexpected error: Error: AUTH_TIMEOUT
```

**Causa:** Queries demoram mais de 10s  
**Impacto:** UX ruim, usuário espera muito  

**Solução Necessária:**
- Otimizar query de `user_roles`
- Adicionar índice na tabela
- Aumentar timeout para 15s (temporário)

---

## 🟠 ERROS DE ALTA PRIORIDADE

### 4. Dialog sem Acessibilidade
**Warning:** `Missing Description or aria-describedby={undefined} for {DialogContent}`  
**Localização:** Múltiplos diálogos (Comunidade, Orações, etc.)  
**Impacto:** Acessibilidade quebrada para screen readers  

**Solução:**
```tsx
<DialogContent aria-describedby="dialog-description">
  <DialogDescription id="dialog-description">
    Descrição aqui
  </DialogDescription>
</DialogContent>
```

---

### 5. WebSocket SUBSCRIBED/CLOSED Rápido
**Erro:**
```
[WebSocket] Status da subscrição: SUBSCRIBED
[WebSocket] Limpando subscrição...
[WebSocket] Status da subscrição: CLOSED
```

**Causa:** Subscription é criada e destruída imediatamente  
**Impacto:** Chat não funciona corretamente  

**Solução Necessária:**
- Verificar cleanup no useEffect
- Garantir que subscription persiste enquanto usuário está na página

---

## 🟡 FUNCIONALIDADES FALTANDO

### 6. Leitura Compartilhada - Sem Criar Sala
**Problema Reportado:** "em leitura em grupo não tem opção de criar sala de leitura e convidar irmão"  
**Página:** `/shared-reading`  
**Status:** Funcionalidade não implementada ou botão escondido  

**Arquivos para Verificar:**
- `src/pages/SharedReading.tsx`
- Verificar se há botão "Criar Sala"
- Verificar se há sistema de convites

---

## 📊 ESTATÍSTICAS DOS ERROS

| Tipo | Quantidade | Gravidade |
|------|-----------|-----------|
| React Error #185 | 3 ocorrências | 🔴 Crítico |
| Timeouts | 2 (Auth + Admin) | 🔴 Crítico |
| F5 404 | 1 | 🔴 Crítico |
| Dialog Warning | ~5 | 🟠 Alto |
| WebSocket | 1 | 🟠 Alto |
| Funcionalidade | 1 | 🟡 Médio |

---

## 🎯 PLANO DE CORREÇÃO

### FASE 1 - Erros Críticos (Agora)
1. ✅ Corrigir React Error #185 (Quiz + ChurchCommunity)
2. ✅ Forçar novo deploy da Vercel (F5 404)
3. ✅ Otimizar query de roles (Timeouts)

### FASE 2 - Alta Prioridade (30 min)
4. ✅ Adicionar `aria-describedby` em todos os Dialogs
5. ✅ Corrigir WebSocket subscription

### FASE 3 - Funcionalidades (1h)
6. ✅ Implementar "Criar Sala" em SharedReading
7. ✅ Implementar sistema de convites

---

## 🔍 COMO REPRODUZIR OS ERROS

### React Error #185:
1. Acesse: `/quiz`
2. Abra DevTools → Console
3. Veja 3 erros idênticos `#185`

### F5 404:
1. Acesse: `/bible`
2. Pressione F5
3. Retorna 404

### Timeouts:
1. Faça login
2. Observe console
3. Veja `ROLES_QUERY_TIMEOUT`

---

## 📞 PRIORIDADES

**URGENTE (Corrigir agora):**
- React Error #185
- F5 404
- Timeouts

**IMPORTANTE (Próximas horas):**
- Dialog acessibilidade
- WebSocket
- SharedReading sala

---

**Status:** 🔴 CRÍTICO - Requer ação imediata
**Responsável:** Claude + Usuário
**Prazo:** Hoje (26/06/2026)
