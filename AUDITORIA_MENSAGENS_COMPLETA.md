# 🔍 AUDITORIA COMPLETA - SISTEMA DE MENSAGENS

Data: 26/06/2026  
Status: **EM ANDAMENTO**

---

## 📊 RESUMO EXECUTIVO

Sistema atual de mensagens analisado completamente.  
**Problemas críticos identificados:** 12  
**Problemas médios:** 8  
**Melhorias necessárias:** 15

---

## 🏗️ ESTRUTURA ATUAL

### **Frontend**
- `src/pages/Chat.tsx` - Página principal (609 linhas)
- `src/components/chat/ChatBubble.tsx` - Bolha de mensagem
- `src/components/chat/ChatInput.tsx` - Input de mensagem
- `src/components/chat/ChatHeader.tsx` - Cabeçalho do chat
- `src/components/chat/ConversationList.tsx` - Lista de conversas
- `src/components/chat/ChatAudioPlayer.tsx` - Player de áudio
- `src/components/chat/ChatMediaUpload.tsx` - Upload de mídia
- `src/components/chat/ChatSettingsSheet.tsx` - Configurações
- `src/components/chat/TypingIndicator.tsx` - Indicador "digitando..."

### **Backend/Database**
- Tabela: `messages` (criada em 20251111194117)
- Tabela: `chat_room_messages` (criada em 20251202122206)
- Tabela: `friendships` - Relacionamento de amigos
- Tabela: `friend_requests` - Pedidos de amizade

---

## ❌ PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **PERFORMANCE - Query N+1**
**Localização:** `Chat.tsx` linha 206-296  
**Problema:** Ao carregar conversas, a função `loadConversations` faz:
- 1 query para friendships
- 1 query para profiles
- 1 query para unread messages
- 1 query para últimas mensagens (200 limite)

**Impacto:** **ALTO** - Lentidão ao abrir o chat com muitos amigos  
**Solução:** Usar uma única query com JOIN ou criar uma VIEW materializada

---

### 2. **MEMÓRIA - Sem Paginação Real**
**Localização:** `Chat.tsx` linha 48, 306-342  
**Problema:** 
```typescript
const MESSAGES_PAGE_SIZE = 50;
```
Carrega 50 mensagens por vez, mas:
- Não há virtualização da lista
- Todas as mensagens ficam em memória
- Ao rolar para cima, carrega mais 50 (acumula)

**Impacto:** **ALTO** - Vazamento de memória em conversas longas  
**Solução:** Implementar virtualização (react-window ou react-virtual)

---

### 3. **WEBSOCKET - Múltiplas Subscrições**
**Localização:** `Chat.tsx` linha 92-142  
**Problema:**
```typescript
useEffect(() => {
  const channel = supabase.channel(`chat-messages-${user.id}`)
  // Subscrição por usuário, não por conversa
}, [user]);
```
- Nova subscrição a CADA mudança de usuário
- Não desinscreve corretamente em alguns casos
- Pode ter subscrições duplicadas

**Impacto:** **CRÍTICO** - Mensagens duplicadas, consumo de memória  
**Solução:** Gerenciador centralizado de websocket

---

### 4. **BANCO DE DADOS - Sem Campo `status`**
**Localização:** Migration 20251111194117, linha 26  
**Problema:**
```sql
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**Falta:**
- Campo `status` (sent, delivered, read)
- Campo `media_url`
- Campo `media_type`
- Campo `reply_to_id` (responder mensagens)
- Campo `edited_at`
- Campo `deleted_at` (soft delete)

**Impacto:** **ALTO** - Funcionalidades limitadas  
**Solução:** Criar nova migration com campos adicionais

---

### 5. **SEGURANÇA - RLS Incompleto**
**Localização:** Migration linha 80-98  
**Problema:**
```sql
CREATE POLICY "Users can send messages to friends"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM friendships WHERE ...)
  );
```
**Falta:**
- Validação de conteúdo (SQL injection possível)
- Rate limiting (spam)
- Validação de tamanho de mensagem
- Bloqueio de usuários

**Impacto:** **CRÍTICO** - Vulnerabilidade de segurança  
**Solução:** Adicionar validações + rate limiting

---

### 6. **UX - Sem Indicadores Visuais Corretos**
**Localização:** `ChatBubble.tsx` linha 180-187  
**Problema:**
```typescript
{status === 'read' || isRead ? (
  <CheckCheck className="h-3.5 w-3.5 text-sky-300" />
) : (
  <Check className="h-3.5 w-3.5" />
)}
```
- Apenas 2 estados (lido/enviado)
- Falta: enviando, falhou, entregue
- Não mostra horário de leitura

**Impacto:** **MÉDIO** - Confusão do usuário  
**Solução:** Sistema completo de status

---

### 7. **ÁUDIO - Sem Implementação de Gravação**
**Localização:** `ChatInput.tsx`  
**Problema:** Componente espera receber áudio, mas não há:
- Botão de gravação
- Gravador de voz
- Preview de áudio
- Cancelamento por deslize

**Impacto:** **ALTO** - Feature não funciona  
**Solução:** Implementar gravador completo

---

### 8. **CACHE - Estratégia Inconsistente**
**Localização:** `Chat.tsx`  
**Problema:**
- React Query não está sendo usado para messages
- Estado local duplicado (conversations + messages)
- Sem sincronização offline
- Perde estado ao trocar de conversa

**Impacto:** **MÉDIO** - Performance ruim  
**Solução:** Migrar para React Query + IndexedDB

---

### 9. **REAÇÕES - Tabela Não Existe**
**Localização:** `ChatBubble.tsx` linha 383-393  
**Problema:**
```typescript
const handleReaction = useCallback(async (messageId: string, emoji: string) => {
  await supabase
    .from('message_reactions')  // ❌ TABELA NÃO EXISTE!
    .upsert({ ... });
}, [user]);
```

**Impacto:** **CRÍTICO** - Feature quebrada  
**Solução:** Criar tabela `message_reactions`

---

### 10. **TYPING INDICATOR - Hook Não Encontrado**
**Localização:** `Chat.tsx` linha 177-181  
**Problema:**
```typescript
const { startTyping, stopTyping, subscribeToTyping } = useTypingIndicator(
  selectedConversation?.friendId || null,
  user?.id || null
);
```
Hook `useTypingIndicator` não foi encontrado no projeto!

**Impacto:** **MÉDIO** - Feature pode não funcionar  
**Solução:** Verificar se existe ou criar

---

### 11. **PRESENCE - Sistema Simples Demais**
**Localização:** `Chat.tsx` linha 145-169  
**Problema:**
```typescript
const presenceChannel = supabase.channel('online-presence', {
  config: { presence: { key: user.id } }
});
```
- Apenas online/offline (sem "digitando", "ausente", "invisível")
- Não persiste último visto
- Não mostra "visto por último às..."

**Impacto:** **BAIXO** - UX limitada  
**Solução:** Expandir sistema de presence

---

### 12. **ERRO 404 - Chat Perde Estado ao F5**
**Localização:** Toda a página Chat.tsx  
**Problema:**
- Ao atualizar a página, perde conversa selecionada
- Não salva scroll position
- Não persiste draft de mensagem

**Impacto:** **MÉDIO** - UX frustrante  
**Solução:** Usar localStorage + URL params

---

## ⚠️ PROBLEMAS MÉDIOS

### 13. Sem Sistema de Grupos
- Apenas chat 1-a-1
- Falta: grupos, canais, comunidades

### 14. Sem Encaminhamento de Mensagens
- Não é possível encaminhar
- Não é possível copiar mensagem

### 15. Sem Edição de Mensagens
- Campo `edited_at` não existe
- UI não suporta

### 16. Sem Busca de Mensagens
- Impossível buscar em histórico
- Sem filtros

### 17. Sem Arquivar/Silenciar Conversas
- Todas as conversas sempre visíveis
- Sem organização

### 18. Sem Bloqueio de Usuários (no chat)
- RLS permite mensagens de qualquer amigo
- Falta tabela `blocked_users`

### 19. Sem Mensagens Fixadas
- Não há como fixar mensagens importantes

### 20. Sem Denúncia de Mensagens
- Falta sistema de moderação

---

## 📈 MELHORIAS NECESSÁRIAS

### UX/UI
1. Animações muito pesadas (Framer Motion em excesso)
2. Sem modo compacto
3. Sem temas de bolhas personalizados
4. Emoji picker genérico (não exclusivo)

### Performance
5. Debounce no typing indicator
6. Lazy loading de imagens
7. Compression de imagens antes do upload
8. WebP em vez de PNG/JPG

### Features
9. Stickers próprios não existem
10. Chamadas de voz/vídeo não preparado
11. Compartilhamento de localização
12. Enquetes no chat
13. Agendamento de mensagens
14. Respostas rápidas
15. Bot/IA não integrado

---

## 🎯 RECOMENDAÇÕES

### ✅ Corrigir IMEDIATAMENTE:
1. Problema #3 - WebSocket duplicado
2. Problema #5 - RLS incompleto
3. Problema #9 - Reações quebradas

### ⚠️ Corrigir ANTES da reconstrução:
4. Performance (Query N+1)
5. Paginação/virtualização
6. Tabela messages (adicionar campos)

### 🚀 Implementar no NOVO sistema:
- Arquitetura modular
- Sistema de plugins
- Design system próprio
- Stickers/reações exclusivas
- Preparação para chamadas
- AI integrada

---

## 📦 DEPENDÊNCIAS EXTERNAS ENCONTRADAS

```json
{
  "framer-motion": "^12.40.0",  // ⚠️ Pesada
  "date-fns": "^3.6.0",         // ✅ OK
  "@supabase/supabase-js": "^2.79.0"  // ✅ OK
}
```

**Não há:**
- Emoji picker externo ❌
- SDK de chamadas ❌
- Sistema de notificações push ❌

---

## 🔄 PRÓXIMOS PASSOS

1. ✅ Completar auditoria (este documento)
2. ⏳ Corrigir bugs críticos (#3, #5, #9)
3. ⏳ Planejar nova arquitetura
4. ⏳ Criar design system exclusivo
5. ⏳ Implementar novo sistema
6. ⏳ Migrar dados
7. ⏳ Testar
8. ⏳ Deploy

---

**Status da Auditoria:** ✅ FASE 1 COMPLETA  
**Próxima Fase:** CORREÇÃO DE BUGS CRÍTICOS

---

**Assinatura:**
```
Auditoria realizada por: Claude Sonnet 4.5
Data: 26/06/2026
Versão: 1.0.0
```
