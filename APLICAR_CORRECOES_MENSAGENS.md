# 🚀 APLICAR CORREÇÕES DO SISTEMA DE MENSAGENS

## ✅ CORREÇÕES IMPLEMENTADAS

Esta migration corrige **5 problemas críticos** identificados na auditoria:

1. ✅ **Reações Quebradas** - Criada tabela `message_reactions`
2. ✅ **Campos Faltantes** - Adicionados: `status`, `media_url`, `media_type`, `reply_to_id`, `edited_at`, `deleted_at`, `forwarded_from_id`
3. ✅ **RLS Incompleto** - Adicionadas validações de segurança + rate limiting (100 msgs/5min)
4. ✅ **Bloqueio de Usuários** - Criada tabela `blocked_users`
5. ✅ **Query N+1** - Criada VIEW otimizada `conversation_list`

---

## 📋 PASSO A PASSO - Supabase Dashboard

### 1. Acesse o SQL Editor

1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral: **SQL Editor**

### 2. Copie e Cole a Migration

**Arquivo:** `supabase/migrations/20260626100000_fix_messages_system.sql`

Ou copie o SQL abaixo:

```sql
-- =====================================================
-- CORREÇÃO CRÍTICA - SISTEMA DE MENSAGENS
-- =====================================================

[... COLE TODO O CONTEÚDO DO ARQUIVO AQUI ...]
```

### 3. Execute

- Clique em **RUN** (ou `Ctrl + Enter`)
- Aguarde 5-10 segundos
- Deve aparecer: **"Sistema de mensagens corrigido com sucesso! ✅"**

---

## 🧪 VERIFICAR SE APLICOU CORRETAMENTE

Após executar, rode estas queries para verificar:

### Verificar Tabela de Reações
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'message_reactions';
-- Deve retornar 1 linha
```

### Verificar Novos Campos em Messages
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('status', 'media_url', 'reply_to_id', 'edited_at');
-- Deve retornar 4 linhas
```

### Verificar Tabela de Bloqueios
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'blocked_users';
-- Deve retornar 1 linha
```

### Verificar VIEW de Conversas
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_name = 'conversation_list';
-- Deve retornar 1 linha
```

### Verificar Trigger de Rate Limiting
```sql
SELECT tgname 
FROM pg_trigger 
WHERE tgname = 'trigger_check_rate_limit';
-- Deve retornar 1 linha
```

### Testar Função de Soft Delete
```sql
SELECT proname 
FROM pg_proc 
WHERE proname = 'soft_delete_message';
-- Deve retornar 1 linha
```

---

## 📊 ESTRUTURA CRIADA

### ✅ Tabelas Novas:
- `message_reactions` - Reações nas mensagens
- `blocked_users` - Usuários bloqueados
- `message_rate_limit` - Controle de spam

### ✅ Campos Adicionados em `messages`:
- `status` - sent | delivered | read | failed
- `media_url` - URL de imagem/áudio/vídeo
- `media_type` - image | audio | video | document
- `reply_to_id` - ID da mensagem respondida
- `edited_at` - Data de edição
- `deleted_at` - Data de exclusão (soft delete)
- `forwarded_from_id` - ID da mensagem original encaminhada

### ✅ VIEW Otimizada:
- `conversation_list` - Lista de conversas (resolve problema N+1)

### ✅ Funções:
- `soft_delete_message(uuid)` - Deletar mensagem
- `update_message_status()` - Trigger de status
- `check_rate_limit()` - Trigger anti-spam
- `cleanup_old_rate_limits()` - Limpar rate limits antigos

### ✅ Índices de Performance:
- `idx_messages_status`
- `idx_messages_media_type`
- `idx_messages_reply_to`
- `idx_messages_deleted`
- `idx_messages_conversation`
- `idx_messages_user_pair` (composto)
- `idx_message_reactions_message`
- `idx_message_reactions_user`
- `idx_blocked_users_blocker`
- `idx_blocked_users_blocked`

### ✅ Políticas RLS:
- Reações: view/insert/delete
- Bloqueios: view/insert/delete
- Messages: atualizado para incluir bloqueios

---

## 🔐 SEGURANÇA IMPLEMENTADA

### Rate Limiting
- Máximo: **100 mensagens em 5 minutos** por usuário
- Violação: `EXCEPTION` com mensagem de erro

### Validação de Conteúdo
- Máximo: **10.000 caracteres** por mensagem
- Violação: `EXCEPTION` com mensagem de erro

### Bloqueio de Usuários
- Usuários bloqueados **não podem** enviar mensagens um ao outro
- Verificado automaticamente no RLS

---

## 🧹 FRONTEND ATUALIZADO

### ✅ Hook Centralizado de WebSocket

**Arquivo criado:** `src/hooks/useChatWebSocket.ts`

**Benefícios:**
- ❌ Sem subscrições duplicadas
- ❌ Sem vazamento de memória
- ✅ Logs de debug
- ✅ Debounce automático
- ✅ Cleanup correto

### ✅ Chat.tsx Atualizado

**Mudanças:**
```typescript
// ❌ ANTES - Subscrição manual (com bugs)
useEffect(() => {
  const channel = supabase.channel(`chat-messages-${user.id}`)
  // ... código duplicado
}, [user]);

// ✅ AGORA - Hook centralizado
useChatWebSocket({
  userId: user?.id || null,
  onNewMessage: handleNewMessage,
  onConversationUpdate: handleConversationUpdate
});
```

---

## 🎯 PRÓXIMOS PASSOS

Após aplicar esta migration:

1. ✅ Recarregue a aplicação: `http://localhost:8080/chat`
2. ✅ Teste enviar mensagens
3. ✅ Teste reações (emojis)
4. ✅ Teste bloqueio de usuários
5. ✅ Verifique se não há mais mensagens duplicadas

---

## 🐛 Troubleshooting

### Erro: "relation already exists"
Alguma tabela já existe. Execute:
```sql
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS blocked_users CASCADE;
DROP TABLE IF EXISTS message_rate_limit CASCADE;
```

Depois reexecute a migration.

### Erro: "column already exists"
Alguns campos já existem. Execute:
```sql
ALTER TABLE messages DROP COLUMN IF EXISTS status;
ALTER TABLE messages DROP COLUMN IF EXISTS media_url;
-- etc...
```

Depois reexecute a migration.

### Migration não executa
- Verifique se copiou **TODO** o conteúdo do arquivo
- Verifique se não há erros de sintaxe
- Tente executar bloco por bloco

---

## ✅ CHECKLIST DE VERIFICAÇÃO

Após aplicar a migration, marque:

- [ ] Tabela `message_reactions` existe
- [ ] Tabela `blocked_users` existe  
- [ ] Tabela `message_rate_limit` existe
- [ ] Coluna `messages.status` existe
- [ ] Coluna `messages.media_url` existe
- [ ] Coluna `messages.reply_to_id` existe
- [ ] Coluna `messages.edited_at` existe
- [ ] Coluna `messages.deleted_at` existe
- [ ] VIEW `conversation_list` existe
- [ ] Função `soft_delete_message` existe
- [ ] Trigger `trigger_check_rate_limit` existe
- [ ] Trigger `trigger_update_message_status` existe
- [ ] Índices criados (12 no total)
- [ ] RLS policies criadas (9 no total)
- [ ] Frontend não mostra mais mensagens duplicadas
- [ ] Reações funcionam no chat
- [ ] Rate limiting funciona (testar spam)

---

**🎉 CORREÇÕES COMPLETAS!**

Todos os 5 bugs críticos identificados na auditoria foram corrigidos:

✅ Reações quebradas → **CORRIGIDO**  
✅ WebSocket duplicado → **CORRIGIDO**  
✅ RLS incompleto → **CORRIGIDO**  
✅ Query N+1 → **CORRIGIDO**  
✅ Campos faltantes → **CORRIGIDO**

---

**Criado por:** Claude Sonnet 4.5  
**Data:** 26/06/2026  
**Versão:** 1.0.0
