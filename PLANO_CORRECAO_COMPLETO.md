# 📋 PLANO DE CORREÇÃO COMPLETO - FECONECTA

**Data:** 26/06/2026  
**Status Projeto:** 🟡 Funcional com erros críticos  
**Prioridade:** ALTA

---

## 📊 RESUMO EXECUTIVO

- ✅ **11 correções aplicadas** (auditoria anterior)
- ❌ **6 problemas novos** detectados
- 🔴 **3 críticos**
- 🟠 **2 altos**
- 🟡 **1 médio**

---

## 🎯 DECISÃO NECESSÁRIA

**Você precisa escolher:**

### Opção A: Corrigir APENAS os 3 críticos (2-3 horas)
1. React Error #185
2. F5 404
3. Timeouts

### Opção B: Corrigir TUDO (1 dia)
1-6. Todos os problemas

### Opção C: Focar em FUNCIONALIDADES (Ignorar erros técnicos)
- Implementar "Criar Sala" em SharedReading
- Deixar erros técnicos para depois

---

## 🔴 PROBLEMAS CRÍTICOS

### #1 - React Error #185 (Loop Infinito)

**Sintoma:**
```
Error: Minified React error #185
at Array.map (<anonymous>)
```

**Onde ocorre:**
- `/quiz` - 3 ocorrências
- `/church-community` - Aparece ao criar comunidade

**Causa possível:**
- Componente criando objeto novo a cada render
- `.map()` com `key` instável
- Estado sendo atualizado dentro do render

**Como corrigir:**
1. Procurar por `.map()` sem `useMemo()`
2. Verificar se `key={}` usa valor estável
3. Mover criação de arrays para fora do component

**Tempo estimado:** 30-60 min

---

### #2 - F5 Retorna 404

**Sintoma:**
- Ao pressionar F5 em qualquer rota → 404

**Status:** 
- ✅ Código corrigido (commit 765f4ee)
- ❌ Deploy pode não ter aplicado

**Como corrigir:**
1. Verificar se Vercel aplicou novo vercel.json
2. Forçar rebuild (commit vazio)
3. OU usar dashboard da Vercel para forçar redeploy

**Tempo estimado:** 10 min

---

### #3 - Auth/Admin Timeouts

**Sintoma:**
```
[AdminContext] Query timeout: ROLES_QUERY_TIMEOUT
[AuthContext] Unexpected error: AUTH_TIMEOUT
```

**Causa:**
- Query de `user_roles` demora >10s
- Pode ser falta de índice no banco

**Como corrigir:**
```sql
-- Adicionar índice na tabela user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
ON user_roles(user_id);

-- Adicionar índice composto
CREATE INDEX IF NOT EXISTS idx_user_roles_active 
ON user_roles(user_id, is_active) 
WHERE is_active = true;
```

**Tempo estimado:** 15 min

---

## 🟠 PROBLEMAS DE ALTA PRIORIDADE

### #4 - Dialog Sem Acessibilidade

**Sintoma:**
```
Warning: Missing Description or aria-describedby for DialogContent
```

**Onde ocorre:**
- Criar Comunidade
- Criar Oração
- Compartilhar Versículo
- ~5 modais

**Como corrigir:**
```tsx
// Antes:
<DialogContent>
  <DialogHeader>
    <DialogTitle>Criar Comunidade</DialogTitle>
  </DialogHeader>
  ...
</DialogContent>

// Depois:
<DialogContent aria-describedby="dialog-desc">
  <DialogHeader>
    <DialogTitle>Criar Comunidade</DialogTitle>
    <DialogDescription id="dialog-desc">
      Crie um espaço para sua comunidade participar de decisões
    </DialogDescription>
  </DialogHeader>
  ...
</DialogContent>
```

**Tempo estimado:** 30 min (5 arquivos)

---

### #5 - WebSocket SUBSCRIBED/CLOSED Imediato

**Sintoma:**
```
[WebSocket] Status: SUBSCRIBED
[WebSocket] Limpando subscrição...
[WebSocket] Status: CLOSED
```

**Causa:**
- Subscription é criada e destruída no mesmo ciclo
- useEffect executando cleanup antes do tempo

**Como corrigir:**
- Já foi corrigido em Friends.tsx (commit 90a3773)
- Verificar se há outros lugares com mesmo problema

**Tempo estimado:** 15 min

---

## 🟡 FUNCIONALIDADES FALTANDO

### #6 - SharedReading: Criar Sala

**Problema reportado:**
> "em leitura em grupo não tem opção de criar sala de leitura e convidar irmão"

**Status atual:**
- Página `/shared-reading` existe
- Não tem botão "Criar Sala"
- Não tem sistema de convites

**Como implementar:**

1. **Adicionar botão "Criar Sala"**
```tsx
<Button onClick={() => setShowCreateModal(true)}>
  <Plus className="h-4 w-4 mr-2" />
  Criar Sala de Leitura
</Button>
```

2. **Modal de criação:**
- Nome da sala
- Livro da Bíblia
- Horário
- Privacidade (pública/privada)

3. **Sistema de convites:**
- Lista de amigos
- Checkbox para selecionar
- Enviar notificação

**Tempo estimado:** 2-3 horas

---

## 📅 CRONOGRAMA SUGERIDO

### Hoje (26/06) - Erros Críticos
- ✅ 14:00-14:30 - Forçar redeploy Vercel (#2)
- ✅ 14:30-15:30 - Corrigir React Error #185 (#1)
- ✅ 15:30-15:45 - Adicionar índices no banco (#3)

### Amanhã (27/06) - Alta Prioridade
- ✅ 09:00-09:30 - Dialog acessibilidade (#4)
- ✅ 09:30-09:45 - WebSocket (#5)

### Próxima semana - Funcionalidades
- ✅ Criar Sala SharedReading (#6)

---

## 🛠️ COMANDOS PRONTOS

### Forçar Redeploy Vercel (#2)
```bash
cd e:/feconecta
git commit --allow-empty -m "chore: Force Vercel redeploy"
git push origin master
```

### Adicionar Índices no Banco (#3)
```sql
-- Cole no Supabase SQL Editor:
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(user_id, is_active) WHERE is_active = true;
```

---

## ❓ QUAL CAMINHO SEGUIR?

**Me diga qual opção você prefere:**

### A. Focar nos erros técnicos (corrigir #1, #2, #3)
- ✅ App fica estável
- ✅ Sem erros no console
- ❌ Funcionalidades faltando

### B. Focar em funcionalidades (#6 - Criar Sala)
- ✅ Usuários podem criar salas
- ✅ Nova feature
- ❌ Erros permanecem

### C. Fazer TUDO (#1-#6)
- ✅ Completo
- ❌ Demora mais (1 dia)

---

**Aguardando sua decisão!** 🎯
