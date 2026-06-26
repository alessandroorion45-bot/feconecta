# 🚀 COMO APLICAR A MIGRATION DO SISTEMA DE MENSAGENS

## ⚠️ IMPORTANTE

A migration **NÃO PODE** ser aplicada via CLI porque as migrations antigas já estão no banco.  
Você precisa aplicar **APENAS** a nova migration via **Supabase Dashboard**.

---

## 📋 PASSO A PASSO

### PASSO 1: Acesse o Supabase Dashboard

1. Abra: https://supabase.com/dashboard
2. Faça login
3. Selecione o projeto **FeConecta**
4. No menu lateral esquerdo, clique em **SQL Editor**

---

### PASSO 2: Abra a Migration

Abra o arquivo:
```
supabase/migrations/20260626110000_sistema_mensagens_completo.sql
```

**OU** copie o conteúdo diretamente (está no final deste documento)

---

### PASSO 3: Cole no SQL Editor

1. No SQL Editor, clique em **"New query"**
2. Cole **TODO** o conteúdo do arquivo
3. Clique em **RUN** (ou pressione `Ctrl + Enter`)

---

### PASSO 4: Aguarde a Execução

- A migration tem ~700 linhas e pode demorar **10-20 segundos**
- Aguarde até aparecer a mensagem de sucesso
- Se aparecer algum erro, leia a seção "Troubleshooting" abaixo

---

### PASSO 5: Verificar se Aplicou Corretamente

Execute estas queries no SQL Editor para verificar:

#### 5.1 - Verificar Enums Criados
```sql
SELECT typname 
FROM pg_type 
WHERE typname IN (
  'message_type', 
  'message_status', 
  'conversation_type', 
  'participant_role', 
  'presence_status'
);
```
**Deve retornar 5 linhas**

#### 5.2 - Verificar Tabelas Criadas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
  'conversations',
  'conversation_participants',
  'message_receipts',
  'user_presence',
  'typing_indicators',
  'stickers',
  'user_favorite_stickers',
  'polls',
  'poll_votes',
  'message_reports',
  'saved_messages'
);
```
**Deve retornar 11 linhas**

#### 5.3 - Verificar Campos Adicionados em Messages
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'messages'
AND column_name IN (
  'conversation_id',
  'type',
  'waveform',
  'mentions',
  'hashtags',
  'is_pinned',
  'is_starred',
  'scheduled_for',
  'expires_at',
  'tsv'
);
```
**Deve retornar 10 linhas**

#### 5.4 - Verificar Funções RPC
```sql
SELECT proname 
FROM pg_proc 
WHERE proname IN (
  'get_or_create_private_conversation',
  'mark_messages_as_read',
  'increment_unread_count',
  'update_conversation_last_message',
  'cleanup_expired_typing_indicators'
);
```
**Deve retornar 5 linhas**

#### 5.5 - Verificar Realtime
```sql
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN (
  'conversations',
  'conversation_participants',
  'message_receipts',
  'user_presence',
  'typing_indicators'
);
```
**Deve retornar 5 linhas**

---

## ✅ CHECKLIST DE VERIFICAÇÃO

Após aplicar, marque:

- [ ] Migration executou sem erros
- [ ] 5 ENUMs criados
- [ ] 11 tabelas criadas/atualizadas
- [ ] 10 campos adicionados em `messages`
- [ ] 5 funções RPC criadas
- [ ] 5 tabelas habilitadas no Realtime
- [ ] Nenhum erro ao executar as queries de verificação

---

## 🐛 TROUBLESHOOTING

### Erro: "type already exists"

**Causa:** O ENUM já foi criado em migration anterior

**Solução:**
```sql
-- Remover ENUMs existentes primeiro
DROP TYPE IF EXISTS message_type CASCADE;
DROP TYPE IF EXISTS message_status CASCADE;
DROP TYPE IF EXISTS conversation_type CASCADE;
DROP TYPE IF EXISTS participant_role CASCADE;
DROP TYPE IF EXISTS presence_status CASCADE;
```

Depois execute a migration novamente.

---

### Erro: "table already exists"

**Causa:** A tabela já existe

**Soluções:**

**Opção 1 - Manter dados existentes:**
```sql
-- Para cada tabela que deu erro, mudar:
CREATE TABLE nome_tabela (...);

-- Para:
CREATE TABLE IF NOT EXISTS nome_tabela (...);
```

**Opção 2 - Recriar do zero (CUIDADO: APAGA DADOS!):**
```sql
DROP TABLE IF EXISTS nome_tabela CASCADE;
```

Depois execute a migration novamente.

---

### Erro: "column already exists"

**Causa:** O campo já existe na tabela `messages`

**Solução:** Os campos já têm `IF NOT EXISTS`, então:

1. Localize qual linha deu erro
2. Verifique se o campo realmente existe:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages'
AND column_name = 'NOME_DO_CAMPO';
```

3. Se existir, comente ou remova essa linha da migration

---

### Erro: "function already exists"

**Causa:** A função RPC já foi criada

**Solução:**
```sql
-- Adicionar OR REPLACE em todas as funções
CREATE OR REPLACE FUNCTION nome_funcao(...)
```

A migration já tem `OR REPLACE` em todas as funções, então esse erro não deve acontecer.

---

### Erro: "publication does not exist"

**Causa:** A publicação `supabase_realtime` não existe

**Solução:**
```sql
-- Criar a publicação primeiro
CREATE PUBLICATION supabase_realtime;
```

Depois execute a migration.

---

## 📊 ESTRUTURA CRIADA

### Tabelas Novas (11):
1. `conversations` - Conversas (privadas, grupos, comunidades, canais)
2. `conversation_participants` - Participantes das conversas
3. `message_receipts` - Status de entrega (✓✓)
4. `user_presence` - Online/offline/praying
5. `typing_indicators` - "Digitando..."
6. `stickers` - Stickers proprietários
7. `user_favorite_stickers` - Stickers favoritos do usuário
8. `polls` - Enquetes
9. `poll_votes` - Votos nas enquetes
10. `message_reports` - Denúncias de mensagens
11. `saved_messages` - Mensagens favoritas/salvas

### Campos Adicionados em `messages`:
- `conversation_id` - ID da conversa
- `type` - Tipo (texto, áudio, vídeo, etc)
- `waveform` - Waveform do áudio
- `mentions` - Usuários mencionados
- `hashtags` - Hashtags
- `is_pinned` - Mensagem fixada
- `is_starred` - Favorita
- `scheduled_for` - Mensagem programada
- `expires_at` - Mensagem temporária
- `tsv` - Full-text search

### ENUMs (5):
- `message_type` (13 tipos)
- `message_status` (5 status)
- `conversation_type` (4 tipos)
- `participant_role` (5 roles)
- `presence_status` (6 status)

### Funções RPC (5):
- `get_or_create_private_conversation()`
- `mark_messages_as_read()`
- `increment_unread_count()`
- `update_conversation_last_message()`
- `cleanup_expired_typing_indicators()`

### Triggers (3):
- `trigger_increment_unread` - Incrementa contador não lido
- `trigger_update_last_message` - Atualiza timestamp da conversa
- `messages_tsv_update` - Atualiza índice de busca

### RLS Policies (30+):
- Conversations (3)
- Participants (2)
- Messages (2 atualizadas)
- Receipts (3)
- Presence (3)
- Typing (4)
- Stickers (3)
- Favorite Stickers (3)
- Polls (2)
- Poll Votes (2)
- Saved Messages (3)

### Realtime (5 tabelas habilitadas):
- `conversations`
- `conversation_participants`
- `message_receipts`
- `user_presence`
- `typing_indicators`

---

## 🎯 APÓS APLICAR A MIGRATION

### 1. Testar no Frontend

Criar uma página de teste simples:

```typescript
// src/pages/TestChat.tsx
import { useChatEngine } from '@/hooks/useChatEngine';

export default function TestChat() {
  const {
    conversations,
    selectedConversation,
    messages,
    sendMessage,
    setSelectedConversation,
    isLoading
  } = useChatEngine();

  return (
    <div className="p-4">
      <h1>Test Chat Engine</h1>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Lista de conversas */}
        <div>
          <h2>Conversas ({conversations.length})</h2>
          {conversations.map(conv => (
            <div 
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className="p-2 border cursor-pointer"
            >
              {conv.name || conv.other_user?.full_name || 'Conversa'}
            </div>
          ))}
        </div>

        {/* Mensagens */}
        <div className="col-span-2">
          {selectedConversation ? (
            <>
              <h2>Mensagens</h2>
              {messages.map(msg => (
                <div key={msg.id} className="p-2 border">
                  {msg.content}
                </div>
              ))}
              
              <button onClick={() => sendMessage('Teste!')}>
                Enviar Teste
              </button>
            </>
          ) : (
            <p>Selecione uma conversa</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 2. Adicionar Rota

```typescript
// src/App.tsx ou router
<Route path="/test-chat" element={<TestChat />} />
```

### 3. Acessar e Testar

1. Acesse: `http://localhost:8080/test-chat`
2. Verifique se carrega conversas
3. Tente enviar uma mensagem
4. Verifique se aparece em tempo real

---

## 📞 PRÓXIMOS PASSOS

Após a migration aplicada e testada:

1. ✅ Criar componentes MVP:
   - MessageBubble
   - MessageInput
   - ConversationList

2. ✅ Migrar página Chat.tsx atual para usar `useChatEngine`

3. ✅ Implementar features incrementalmente:
   - Reações (já tem o picker)
   - Gravação de voz
   - Stickers
   - Grupos
   - Etc.

---

## ✅ PRONTO!

Após aplicar esta migration, você terá:
- ✅ Sistema completo de mensagens
- ✅ Suporte a grupos/comunidades/canais
- ✅ Reações exclusivas da Rede da Fé
- ✅ Sistema de stickers proprietários
- ✅ Enquetes
- ✅ Presence (online/offline/orando)
- ✅ Typing indicators
- ✅ Full-text search
- ✅ Mensagens programadas/temporárias
- ✅ E muito mais!

---

**Criado por:** Claude Sonnet 4.5  
**Data:** 26/06/2026  
**Versão:** 1.0.0

---

# 📄 CONTEÚDO DA MIGRATION

```sql
[... cole aqui o conteúdo de supabase/migrations/20260626110000_sistema_mensagens_completo.sql ...]
```
