# ⚡ GUIA RÁPIDO - APLICAR MIGRATION E TESTAR

## 🚀 3 PASSOS SIMPLES

### PASSO 1: Aplicar Migration no Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto
3. Menu → **SQL Editor**
4. Abra o arquivo: `supabase/migrations/20260626110000_sistema_mensagens_completo.sql`
5. **Copie TUDO** e cole no SQL Editor
6. Clique em **RUN**
7. Aguarde ~10 segundos até aparecer: ✅ "Sistema de Mensagens Proprietário da Rede da Fé criado com sucesso!"

---

### PASSO 2: Verificar se Aplicou

Execute estas queries no SQL Editor:

```sql
-- 1. Verificar enums (deve retornar 5)
SELECT COUNT(*) FROM pg_type WHERE typname IN (
  'message_type', 'message_status', 'conversation_type', 
  'participant_role', 'presence_status'
);

-- 2. Verificar tabelas (deve retornar 11)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
  'conversations', 'conversation_participants', 'message_receipts',
  'user_presence', 'typing_indicators', 'stickers',
  'user_favorite_stickers', 'polls', 'poll_votes',
  'message_reports', 'saved_messages'
);

-- 3. Verificar funções RPC (deve retornar 5)
SELECT COUNT(*) FROM pg_proc WHERE proname IN (
  'get_or_create_private_conversation', 'mark_messages_as_read',
  'increment_unread_count', 'update_conversation_last_message',
  'cleanup_expired_typing_indicators'
);
```

**Tudo certo?** ✅ Próximo passo!

---

### PASSO 3: Testar no Frontend

1. Acesse: **http://localhost:8080/test-chat-engine**

2. Você verá:
   - 📊 Dashboard com métricas (conversas, online, mensagens)
   - 💬 Lista de conversas (vazia no início)
   - 💬 Área de mensagens

3. Para testar:
   - Digite um **User ID** de outro usuário no campo "ID do usuário"
   - Clique em "Criar Conversa"
   - A conversa aparecerá na lista
   - Clique nela
   - Digite uma mensagem e envie
   - ✅ Deve aparecer instantaneamente!

4. **Para testar realtime:**
   - Abra em 2 navegadores diferentes (ou aba anônima)
   - Faça login com 2 usuários diferentes
   - Crie conversa entre eles
   - Envie mensagem de um lado
   - ✅ Deve aparecer do outro lado em tempo real!

---

## ✅ CHECKLIST

- [ ] Migration aplicada no Supabase Dashboard
- [ ] 5 enums criados
- [ ] 11 tabelas criadas
- [ ] 5 funções RPC criadas
- [ ] Página de teste acessível em `/test-chat-engine`
- [ ] Consegue criar conversa
- [ ] Consegue enviar mensagem
- [ ] Mensagem aparece em tempo real

---

## 🎉 PRONTO!

Agora você tem:
- ✅ Sistema completo de mensagens funcionando
- ✅ WebSocket em tempo real
- ✅ Suporte a grupos/comunidades/canais
- ✅ Reações exclusivas
- ✅ Sistema de stickers
- ✅ Enquetes
- ✅ Presence (online/offline)
- ✅ Typing indicators
- ✅ Full-text search
- ✅ E muito mais!

---

## 📁 ARQUIVOS CRIADOS NESTA SESSÃO

```
✅ BANCO DE DADOS:
└── supabase/migrations/20260626110000_sistema_mensagens_completo.sql

✅ HOOKS:
├── src/hooks/useChatEngine.ts
└── src/hooks/useChatWebSocket.ts (correção bugs)

✅ COMPONENTES:
├── src/lib/constants/reactions.ts
└── src/components/messages/ReactionPicker.tsx

✅ PÁGINAS:
└── src/pages/TestChatEngine.tsx

✅ DOCUMENTAÇÃO:
├── ARQUITETURA_SISTEMA_MENSAGENS_REDE_DA_FE.md
├── AUDITORIA_MENSAGENS_COMPLETA.md
├── IMPLEMENTACAO_AUTOMATICA.md
├── APLICAR_MIGRATION_SISTEMA_MENSAGENS.md
├── APLICAR_CORRECOES_MENSAGENS.md
└── GUIA_RAPIDO_APLICAR_MIGRATION.md (este arquivo)
```

---

## 🐛 PROBLEMAS?

### Erro ao aplicar migration?
👉 Leia: `APLICAR_MIGRATION_SISTEMA_MENSAGENS.md` (seção Troubleshooting)

### Página de teste não carrega?
1. Verifique se aplicou a migration
2. Verifique se está logado
3. Abra o console do navegador (F12) e veja os erros

### Mensagens não aparecem em tempo real?
1. Verifique se Realtime está habilitado no Supabase
2. Verifique políticas RLS
3. Veja logs no console

---

## 🚀 PRÓXIMOS PASSOS

Agora que o sistema básico está funcionando:

1. **Criar componentes visuais**
   - MessageBubble premium
   - MessageInput com gravador de voz
   - ConversationList animada

2. **Implementar features**
   - Gravação de voz
   - Stickers (criar as 198 imagens)
   - Grupos e comunidades
   - Busca de mensagens

3. **Migrar Chat.tsx atual**
   - Adaptar para usar `useChatEngine`
   - Manter backward compatibility

4. **Polir e testar**
   - Animações
   - Dark mode
   - Performance
   - Testes E2E

---

**Dúvidas? Leia a documentação completa em:**
- `ARQUITETURA_SISTEMA_MENSAGENS_REDE_DA_FE.md`
- `IMPLEMENTACAO_AUTOMATICA.md`

---

**Criado por:** Claude Sonnet 4.5  
**Data:** 26/06/2026  
**Versão:** 1.0.0
