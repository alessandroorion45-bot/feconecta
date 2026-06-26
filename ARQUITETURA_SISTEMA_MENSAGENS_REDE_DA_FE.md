# 🏛️ ARQUITETURA - SISTEMA DE MENSAGENS DA REDE DA FÉ

**Sistema proprietário completo de comunicação cristã**

Data: 26/06/2026  
Versão: 1.0.0  
Status: **PLANEJAMENTO**

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Requisitos Funcionais](#requisitos-funcionais)
3. [Arquitetura Técnica](#arquitetura-técnica)
4. [Banco de Dados](#banco-de-dados)
5. [Backend / API](#backend--api)
6. [Frontend / UI](#frontend--ui)
7. [Componentes Exclusivos](#componentes-exclusivos)
8. [Performance](#performance)
9. [Segurança](#segurança)
10. [Escalabilidade](#escalabilidade)
11. [Plano de Implementação](#plano-de-implementação)

---

## 🎯 VISÃO GERAL

### Objetivo
Criar o **melhor sistema de mensagens para comunidades cristãs**, com identidade própria, 100% proprietário, sem dependências externas para chat, emojis, stickers ou interface.

### Diferenciais
- ✝️ **Identidade cristã** em cada detalhe
- 🎨 **Design premium** e experiência única
- 🚀 **Performance extrema** (sub-100ms)
- 🔐 **Segurança máxima** (E2E encryption futuro)
- 📱 **Mobile-first** responsivo
- 🌐 **Offline-first** com sincronização
- 🤖 **Preparado para IA** (assistente bíblico)

### Pilares Técnicos
1. **Supabase Realtime** - WebSocket nativo
2. **React + TypeScript** - Type-safe
3. **Framer Motion** - Animações fluídas
4. **IndexedDB** - Cache local
5. **React Query** - Estado servidor
6. **Web APIs** - MediaRecorder, Canvas, Web Workers

---

## ✅ REQUISITOS FUNCIONAIS

### 1. Tipos de Conversa

#### 1.1 Chat Privado (1-a-1)
- Mensagens diretas entre dois usuários
- Histórico infinito com paginação
- Busca de mensagens
- Arquivar/Silenciar/Bloquear

#### 1.2 Grupos
- Até 256 membros
- Admins e membros normais
- Permissões configuráveis
- Descrição, foto, regras
- Adicionar/remover membros
- Sair do grupo

#### 1.3 Comunidades
- Ilimitado de membros
- Múltiplos canais dentro da comunidade
- Sistema de categorias
- Níveis: Fundador, Moderador, Membro, Visitante
- Verificação de comunidades oficiais

#### 1.4 Canais (Broadcast)
- Apenas admins enviam mensagens
- Membros podem reagir e comentar
- Ideal para anúncios de igrejas
- Estatísticas de alcance

---

### 2. Tipos de Mensagem

| Tipo | Descrição | Tamanho Máx |
|------|-----------|-------------|
| **Texto** | Mensagens simples | 10.000 chars |
| **Áudio** | Gravação de voz | 10 minutos |
| **Imagem** | JPG, PNG, WebP | 10 MB |
| **Vídeo** | MP4, WebM | 50 MB |
| **Documento** | PDF, DOCX, TXT | 20 MB |
| **Versículo** | Compartilhamento especial | - |
| **Oração** | Pedido de oração | - |
| **Testemunho** | Relato de fé | - |
| **Evento** | Convite para evento | - |

---

### 3. Funcionalidades de Mensagem

#### 3.1 Ações Básicas
- ✅ Enviar
- ✅ Editar (até 24h)
- ✅ Deletar (para mim / para todos)
- ✅ Responder (thread)
- ✅ Encaminhar
- ✅ Copiar texto
- ✅ Favoritar

#### 3.2 Ações Avançadas
- 📌 Fixar mensagem (grupos/canais)
- 🔖 Salvar em coleções
- 🔗 Criar link permanente
- 📊 Ver estatísticas (canais)
- 🔔 Mencionar usuários (@)
- 🏷️ Hashtags (#tema)

#### 3.3 Reações Exclusivas da Rede da Fé

**10 Reações Customizadas:**

```typescript
const REDE_DA_FE_REACTIONS = [
  { id: 'amem', emoji: '❤️', label: 'Amém', color: '#EF4444' },
  { id: 'orei', emoji: '🙏', label: 'Orei por você', color: '#F59E0B' },
  { id: 'gloria', emoji: '🔥', label: 'Glória a Deus', color: '#F97316' },
  { id: 'aleluia', emoji: '✨', label: 'Aleluia', color: '#FBBF24' },
  { id: 'paz', emoji: '🕊️', label: 'Paz de Cristo', color: '#60A5FA' },
  { id: 'palavra', emoji: '📖', label: 'Palavra!', color: '#8B5CF6' },
  { id: 'fe', emoji: '💙', label: 'Fé', color: '#3B82F6' },
  { id: 'esperanca', emoji: '🌿', label: 'Esperança', color: '#10B981' },
  { id: 'gratidao', emoji: '🤲', label: 'Gratidão', color: '#EC4899' },
  { id: 'inspirador', emoji: '⭐', label: 'Inspirador', color: '#FBBF24' }
];
```

**UI das Reações:**
- Aparecem embaixo da mensagem
- Agrupadas por tipo
- Mostrar quantidade + preview de quem reagiu
- Animação suave ao adicionar/remover
- Long-press para escolher reação
- Quick-reaction: tap rápido = Amém (❤️)

---

### 4. Gravação de Voz Customizada

#### 4.1 UI/UX

```
┌─────────────────────────────────────────┐
│  [🎤] Segure para gravar               │
│       ←  Deslize para cancelar         │
└─────────────────────────────────────────┘

Ao segurar:
┌─────────────────────────────────────────┐
│  ⏺️ 00:12                              │
│  ▁▂▃▅▇▅▃▂▁ (waveform animado)         │
│  ← Deslize para cancelar     Soltar ✓ │
└─────────────────────────────────────────┘

Após gravar:
┌─────────────────────────────────────────┐
│  ▶️ 00:12  ▁▂▃▅▇▅▃▂▁  [1x] [🗑️] [✓]   │
│           (velocidade)  (del) (send)   │
└─────────────────────────────────────────┘
```

#### 4.2 Features
- ✅ Waveform em tempo real (Canvas API)
- ✅ Timer de gravação
- ✅ Deslizar para cancelar (gesture)
- ✅ Preview antes de enviar
- ✅ Velocidades: 1x / 1.5x / 2x
- ✅ Formato: WebM Opus (melhor compressão)
- ✅ Limite: 10 minutos
- ✅ Indicador "gravando voz" no chat

#### 4.3 Player de Áudio

```
┌─────────────────────────────────────────┐
│  👤 Nome do Usuário                    │
│  ▶️ ━━●━━━━━━━━ 00:12 / 00:45  [1.5x]│
│  ▁▂▃▅▇▅▃▂▁▂▃▅▇▅▃▂ (waveform estático) │
└─────────────────────────────────────────┘
```

---

### 5. Sistema de Stickers Proprietário

#### 5.1 Categorias de Stickers

**12 Coleções Exclusivas:**

1. **Fé & Oração** (20 stickers)
   - Mãos orando, bíblia aberta, cruz, etc.

2. **Louvor & Adoração** (20 stickers)
   - Pessoas louvando, instrumentos, notas musicais

3. **Versículos Animados** (15 stickers)
   - Versículos populares com animação

4. **Emojis Cristãos** (30 stickers)
   - Versões animadas das reações

5. **Frutas do Espírito** (9 stickers)
   - Amor, alegria, paz, paciência, etc.

6. **Dons Espirituais** (12 stickers)
   - Sabedoria, fé, cura, milagres, etc.

7. **Eventos Bíblicos** (20 stickers)
   - Páscoa, Natal, Pentecostes, etc.

8. **Personagens Bíblicos** (15 stickers)
   - Moisés, Davi, Jesus, Paulo, etc.

9. **Animais da Bíblia** (12 stickers)
   - Pomba, cordeiro, leão, peixe, etc.

10. **Motivacionais** (20 stickers)
    - Frases de encorajamento

11. **Intercessão** (15 stickers)
    - Pedidos de oração específicos

12. **Testemunho** (10 stickers)
    - Expressões de vitória e gratidão

**TOTAL: 198 stickers exclusivos**

#### 5.2 Formato dos Stickers
- Formato: **WebP animado** (leve e com transparência)
- Tamanho: 512x512px
- Peso máx: 50kb cada
- FPS: 30 (animados)
- Licença: Proprietária da Rede da Fé

#### 5.3 UI do Seletor de Stickers

```
┌─────────────────────────────────────────┐
│  [Fé] [Louvor] [Versículos] [Emojis]  │
│  ┌────┬────┬────┬────┬────┐            │
│  │ 🙏 │ 📖 │ ✝️ │ ❤️ │ 🕊️ │            │
│  ├────┼────┼────┼────┼────┤            │
│  │ 🔥 │ ✨ │ 🌿 │ 💙 │ ⭐ │            │
│  ├────┼────┼────┼────┼────┤            │
│  │ ... (scroll infinito)   │            │
│  └────┴────┴────┴────┴────┘            │
│  [❤️ Favoritos]                        │
└─────────────────────────────────────────┘
```

#### 5.4 Criação de Stickers Customizados
- Usuários VIP podem criar seus próprios stickers
- Moderação automática (IA)
- Limite: 5 stickers personalizados por usuário VIP

---

### 6. Indicadores de Status

#### 6.1 Status de Mensagem

| Ícone | Status | Descrição |
|-------|--------|-----------|
| ⏱️ | `sending` | Enviando... |
| ✓ | `sent` | Enviada |
| ✓✓ | `delivered` | Entregue |
| ✓✓ (azul) | `read` | Lida |
| ❌ | `failed` | Falhou |

#### 6.2 Status de Presença

```typescript
type PresenceStatus = 
  | 'online'      // 🟢 Online
  | 'away'        // 🟡 Ausente (5min sem atividade)
  | 'busy'        // 🔴 Ocupado (em chamada)
  | 'praying'     // 🙏 Orando (status manual)
  | 'offline'     // ⚫ Offline
  | 'invisible';  // 👻 Invisível (online mas aparece offline)
```

#### 6.3 Indicadores em Tempo Real
- **"digitando..."** - 3 pontinhos animados
- **"gravando áudio..."** - microfone pulsando
- **"online"** - bolinha verde no avatar
- **"visto por último"** - "visto há 5 min"

---

### 7. Busca Inteligente

#### 7.1 Tipos de Busca

**Busca por Conteúdo:**
```typescript
interface SearchQuery {
  text?: string;              // Busca em conteúdo
  from?: string;              // De qual usuário
  type?: MessageType;         // Tipo de mensagem
  hasMedia?: boolean;         // Tem mídia?
  dateRange?: [Date, Date];   // Período
  isStarred?: boolean;        // Favoritadas
  hasReactions?: string[];    // Com reações específicas
  inConversation?: string;    // Dentro de qual conversa
}
```

**Busca Avançada:**
- Busca por texto completo (Full-text search)
- Busca por data/período
- Busca por remetente
- Busca por tipo de arquivo
- Busca por versículos compartilhados
- Busca por mensagens com link
- Busca por hashtags

#### 7.2 UI de Busca

```
┌─────────────────────────────────────────┐
│  🔍 Buscar mensagens...                │
│  [Filtros ▼]                           │
│                                         │
│  📅 Última semana                      │
│  └─ De: @João                          │
│      "oração"                          │
│      💬 15 resultados                  │
│      ─────────────────────────         │
│      [João] "Vamos orar juntos?"       │
│      há 2 dias                         │
│      ─────────────────────────         │
│      [João] "Peço oração pela minha..."│
│      há 5 dias                         │
└─────────────────────────────────────────┘
```

---

### 8. Funcionalidades Avançadas

#### 8.1 Mensagens Programadas
- Agendar envio para data/hora específica
- Editar/cancelar antes de enviar
- Notificação antes do envio

#### 8.2 Mensagens Temporárias
- Auto-destruição após X tempo
- Para conversas sensíveis
- Não podem ser encaminhadas

#### 8.3 Respostas Rápidas
- Templates salvos pelo usuário
- Exemplos: "Amém!", "Orarei por você", etc.
- Quick-access no input

#### 8.4 Enquetes
```
┌─────────────────────────────────────────┐
│  📊 Qual horário para o culto?         │
│  ☐ 18h (12 votos) ███████░░░ 60%      │
│  ☐ 19h (8 votos)  █████░░░░░ 40%      │
│  Total: 20 votos                       │
│  Encerra em: 2 dias                    │
└─────────────────────────────────────────┘
```

#### 8.5 Localização
- Compartilhar localização em tempo real
- Útil para encontros da igreja
- Privacidade: apenas durante 1h

#### 8.6 Contatos
- Compartilhar contato (vCard)
- Adicionar múltiplos contatos ao grupo

---

## 🏗️ ARQUITETURA TÉCNICA

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────┐
│                   CLIENTE                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  React   │  │  Framer  │  │  React   │      │
│  │   App    │→ │  Motion  │→ │  Query   │      │
│  └────┬─────┘  └──────────┘  └────┬─────┘      │
│       │                            │             │
│       ↓                            ↓             │
│  ┌──────────────────────────────────────┐       │
│  │         useChatEngine (Hook)         │       │
│  │  • WebSocket Manager                 │       │
│  │  • Message Queue                     │       │
│  │  • Offline Sync                      │       │
│  │  • Cache Strategy                    │       │
│  └──────────────┬───────────────────────┘       │
│                 │                                │
└─────────────────┼────────────────────────────────┘
                  │
                  ↓ WebSocket + HTTP
┌─────────────────────────────────────────────────┐
│                 SUPABASE                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Realtime │  │PostgreSQL│  │  Storage │      │
│  │ (WS)     │  │   (DB)   │  │  (S3)    │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │   Auth   │  │   RLS    │  │  Edge    │      │
│  │          │  │          │  │ Functions│      │
│  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────┐
│              CLIENTE (Cache)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ IndexedDB│  │  Service │  │  Web     │      │
│  │  (10GB)  │  │  Worker  │  │  Workers │      │
│  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────┘
```

---

### Camadas da Aplicação

#### 1. **Presentation Layer** (UI)
```
src/
├── components/
│   └── messages/
│       ├── MessageBubble/          # Bolha de mensagem
│       ├── MessageInput/           # Input customizado
│       ├── VoiceRecorder/          # Gravador de voz
│       ├── StickerPicker/          # Seletor de stickers
│       ├── ReactionPicker/         # Seletor de reações
│       ├── MediaGallery/           # Galeria de mídia
│       ├── MessageActions/         # Menu de ações
│       └── ThreadView/             # Visualização de threads
```

#### 2. **Business Logic Layer** (Hooks)
```
src/hooks/
├── useChatEngine.ts           # Motor principal
├── useMessageQueue.ts         # Fila de mensagens
├── useOfflineSync.ts          # Sincronização offline
├── useVoiceRecorder.ts        # Gravação de voz
├── useTypingIndicator.ts      # Indicador digitando
├── usePresence.ts             # Status online/offline
├── useMessageReactions.ts     # Sistema de reações
├── useMessageSearch.ts        # Busca de mensagens
└── useConversations.ts        # Gerenciamento de conversas
```

#### 3. **Data Layer** (Services)
```
src/services/
├── chat/
│   ├── ChatService.ts         # CRUD de mensagens
│   ├── RealtimeService.ts     # WebSocket manager
│   ├── CacheService.ts        # IndexedDB wrapper
│   ├── MediaService.ts        # Upload/download de mídia
│   ├── SearchService.ts       # Full-text search
│   └── SyncService.ts         # Sync queue
```

#### 4. **Infrastructure Layer** (Utils)
```
src/lib/
├── websocket/
│   ├── WebSocketManager.ts    # Gerenciador centralizado
│   ├── MessageQueue.ts        # Fila de mensagens
│   └── RetryStrategy.ts       # Retry exponencial
├── cache/
│   ├── IndexedDBAdapter.ts    # Wrapper IndexedDB
│   └── CacheStrategy.ts       # Estratégia de cache
└── media/
    ├── ImageCompressor.ts     # Compressão de imagens
    ├── AudioProcessor.ts      # Processamento de áudio
    └── WaveformGenerator.ts   # Gerador de waveform
```

---

## 🗄️ BANCO DE DADOS

### Schema Completo

```sql
-- =====================================================
-- 1. MENSAGENS
-- =====================================================

CREATE TYPE message_type AS ENUM (
  'text', 'audio', 'image', 'video', 'document',
  'verse', 'prayer', 'testimony', 'event', 'poll',
  'location', 'contact', 'sticker'
);

CREATE TYPE message_status AS ENUM (
  'sending', 'sent', 'delivered', 'read', 'failed'
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  forwarded_from_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  
  -- Conteúdo
  type message_type NOT NULL DEFAULT 'text',
  content TEXT,
  
  -- Mídia
  media_url TEXT,
  media_type TEXT,
  media_size INTEGER,
  media_duration INTEGER,  -- Para áudio/vídeo (em segundos)
  media_thumbnail TEXT,
  waveform JSONB,          -- Para áudios: array de amplitudes
  
  -- Metadata
  mentions UUID[],         -- IDs de usuários mencionados
  hashtags TEXT[],         -- Hashtags extraídas
  link_preview JSONB,      -- Preview de links
  
  -- Status
  status message_status NOT NULL DEFAULT 'sent',
  is_pinned BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,  -- Mensagem programada
  expires_at TIMESTAMPTZ,      -- Mensagem temporária
  
  -- Índices
  tsv tsvector GENERATED ALWAYS AS (to_tsvector('portuguese', content)) STORED
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_fulltext ON messages USING GIN(tsv);
CREATE INDEX idx_messages_mentions ON messages USING GIN(mentions);
CREATE INDEX idx_messages_hashtags ON messages USING GIN(hashtags);
CREATE INDEX idx_messages_scheduled ON messages(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- =====================================================
-- 2. CONVERSAS
-- =====================================================

CREATE TYPE conversation_type AS ENUM (
  'private',    -- 1-a-1
  'group',      -- Grupo
  'community',  -- Comunidade
  'channel'     -- Canal (broadcast)
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  type conversation_type NOT NULL,
  
  -- Metadata
  name TEXT,
  description TEXT,
  avatar_url TEXT,
  
  -- Configurações
  settings JSONB DEFAULT '{}'::jsonb,
  -- { 
  --   "is_muted": false,
  --   "notifications": "all",
  --   "theme": "default"
  -- }
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ,
  
  -- Soft delete
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- =====================================================
-- 3. PARTICIPANTES
-- =====================================================

CREATE TYPE participant_role AS ENUM (
  'owner',      -- Dono (grupos/comunidades)
  'admin',      -- Administrador
  'moderator',  -- Moderador
  'member',     -- Membro
  'visitor'     -- Visitante
);

CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  role participant_role NOT NULL DEFAULT 'member',
  
  -- Permissões específicas
  permissions JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "can_send_messages": true,
  --   "can_send_media": true,
  --   "can_add_members": false,
  --   "can_pin_messages": false
  -- }
  
  -- Tracking
  last_read_message_id UUID REFERENCES messages(id),
  last_read_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,
  
  -- Status
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_participants_unread ON conversation_participants(user_id, unread_count) 
  WHERE unread_count > 0;

-- =====================================================
-- 4. REAÇÕES
-- =====================================================

CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Reação exclusiva da Rede da Fé
  reaction_id TEXT NOT NULL CHECK (reaction_id IN (
    'amem', 'orei', 'gloria', 'aleluia', 'paz',
    'palavra', 'fe', 'esperanca', 'gratidao', 'inspirador'
  )),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(message_id, user_id, reaction_id)
);

CREATE INDEX idx_reactions_message ON message_reactions(message_id);
CREATE INDEX idx_reactions_user ON message_reactions(user_id);

-- =====================================================
-- 5. STATUS DE ENTREGA
-- =====================================================

CREATE TABLE message_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_receipts_message ON message_receipts(message_id);
CREATE INDEX idx_receipts_user ON message_receipts(user_id);

-- =====================================================
-- 6. PRESENCE (Online/Offline)
-- =====================================================

CREATE TYPE presence_status AS ENUM (
  'online', 'away', 'busy', 'praying', 'offline', 'invisible'
);

CREATE TABLE user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  status presence_status NOT NULL DEFAULT 'offline',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Metadata
  device_info JSONB,
  -- { "platform": "web", "version": "1.0.0" }
  
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_presence_status ON user_presence(status) WHERE status != 'offline';

-- =====================================================
-- 7. TYPING INDICATORS
-- =====================================================

CREATE TABLE typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  is_typing BOOLEAN DEFAULT true,
  is_recording BOOLEAN DEFAULT false,
  
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '10 seconds'),
  
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_typing_conversation ON typing_indicators(conversation_id, expires_at);

-- =====================================================
-- 8. STICKERS
-- =====================================================

CREATE TABLE stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  category TEXT NOT NULL,  -- 'fe', 'louvor', 'versiculos', etc.
  name TEXT NOT NULL,
  
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  is_animated BOOLEAN DEFAULT false,
  is_official BOOLEAN DEFAULT true,  -- Sticker oficial da Rede da Fé
  
  creator_id UUID REFERENCES auth.users(id),  -- Para stickers customizados
  
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,  -- Moderação
  
  UNIQUE(category, name)
);

CREATE INDEX idx_stickers_category ON stickers(category);
CREATE INDEX idx_stickers_popular ON stickers(usage_count DESC);

-- =====================================================
-- 9. ENQUETES
-- =====================================================

CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  -- [
  --   { "id": "a", "text": "Opção 1" },
  --   { "id": "b", "text": "Opção 2" }
  -- ]
  
  allows_multiple BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  
  closes_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  option_id TEXT NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(poll_id, user_id, option_id)
);

CREATE INDEX idx_poll_votes_poll ON poll_votes(poll_id);

-- =====================================================
-- 10. BLOQUEIOS E DENÚNCIAS
-- =====================================================

CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  reason TEXT NOT NULL,
  details TEXT,
  
  status TEXT DEFAULT 'pending',  -- pending, reviewed, resolved
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_reports_status ON message_reports(status) WHERE status = 'pending';
```

---

## 🚀 BACKEND / API

### Edge Functions (Supabase)

```typescript
// functions/send-message/index.ts
export default async (req: Request) => {
  const { conversationId, content, type, mediaUrl } = await req.json();
  
  // 1. Validar permissões
  // 2. Criar mensagem
  // 3. Enviar via Realtime
  // 4. Notificar participantes
  // 5. Atualizar contadores
  // 6. Return message
};

// functions/process-audio/index.ts
export default async (req: Request) => {
  const { audioFile } = await req.json();
  
  // 1. Gerar waveform
  // 2. Comprimir áudio
  // 3. Upload para storage
  // 4. Return URL + waveform
};

// functions/moderate-content/index.ts
export default async (req: Request) => {
  // IA para moderar mensagens/stickers
  // Perspectiva API ou modelo próprio
};
```

---

## 🎨 FRONTEND / UI

### Design System Exclusivo

```typescript
// src/design-system/colors.ts
export const REDE_DA_FE_COLORS = {
  primary: {
    50: '#f0f9ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8'
  },
  sacred: {
    gold: '#FBBF24',
    purple: '#8B5CF6',
    heavenly: '#60A5FA'
  },
  reactions: {
    amem: '#EF4444',
    orei: '#F59E0B',
    gloria: '#F97316',
    // ...
  }
};

// src/design-system/animations.ts
export const MESSAGE_ANIMATIONS = {
  enter: {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  },
  reaction: {
    whileTap: { scale: 1.3 },
    transition: { type: 'spring', stiffness: 400, damping: 10 }
  }
};
```

### Componentes Premium

```typescript
// MessageBubble com gradientes e sombras suaves
<MessageBubble
  variant="sent" // sent | received | system
  theme="faith"  // faith | prayer | testimony
  hasReactions={true}
  isPinned={false}
/>

// VoiceRecorder com animações fluidas
<VoiceRecorder
  onRecordingComplete={(blob, waveform) => {}}
  maxDuration={600} // 10 min
  showWaveform={true}
/>

// StickerPicker com categorias animadas
<StickerPicker
  categories={STICKER_CATEGORIES}
  favorites={userFavorites}
  onSelect={(sticker) => {}}
/>
```

---

## ⚡ PERFORMANCE

### Otimizações Implementadas

#### 1. Virtualização de Mensagens
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const MessageList = ({ messages }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5
  });
  
  // Renderiza apenas mensagens visíveis + overscan
};
```

#### 2. Lazy Loading de Mídia
```typescript
<img
  src={placeholderUrl}
  data-src={actualUrl}
  loading="lazy"
  onIntersectionObserver={loadActualImage}
/>
```

#### 3. IndexedDB para Cache
```typescript
// Cache de 10GB local
const cache = {
  messages: 5GB,      // Últimas 50.000 mensagens
  media: 3GB,         // Imagens/áudios recentes
  stickers: 1GB,      // Todos os stickers
  metadata: 1GB       // Conversas, participantes, etc.
};
```

#### 4. Web Workers para Processamento
```typescript
// worker.ts - Processar waveform em background
self.addEventListener('message', (e) => {
  const { audioBuffer } = e.data;
  const waveform = generateWaveform(audioBuffer);
  self.postMessage({ waveform });
});
```

#### 5. Debounce e Throttle
```typescript
// Typing indicator
const sendTypingIndicator = useDebouncedCallback(() => {
  supabase.from('typing_indicators').upsert({...});
}, 500);

// Scroll position
const saveScrollPosition = useThrottledCallback(() => {
  localStorage.setItem('scroll', scrollY);
}, 1000);
```

### Métricas de Performance Alvo

| Métrica | Target | Crítico |
|---------|--------|---------|
| Time to Interactive (TTI) | < 2s | < 3s |
| First Contentful Paint (FCP) | < 1s | < 1.5s |
| Largest Contentful Paint (LCP) | < 2s | < 2.5s |
| Cumulative Layout Shift (CLS) | < 0.1 | < 0.25 |
| WebSocket Latency | < 50ms | < 100ms |
| Message Send Delay | < 100ms | < 200ms |
| Cache Hit Rate | > 90% | > 80% |

---

## 🔐 SEGURANÇA

### Camadas de Segurança

#### 1. Row Level Security (RLS)
```sql
-- Política: Usuário só vê mensagens de conversas que participa
CREATE POLICY "Users can view their messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = messages.conversation_id
    AND user_id = auth.uid()
    AND left_at IS NULL
  )
);
```

#### 2. Rate Limiting
```typescript
// 100 mensagens por 5 minutos
// 10 uploads por minuto
// 5 enquetes por dia
```

#### 3. Validação de Conteúdo
```typescript
const validateMessage = (content: string) => {
  if (content.length > 10000) throw new Error('Too long');
  if (containsSpam(content)) throw new Error('Spam detected');
  if (containsProfanity(content)) throw new Error('Inappropriate');
};
```

#### 4. Sanitização
```typescript
import DOMPurify from 'isomorphic-dompurify';

const sanitizedContent = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href']
});
```

#### 5. Encriptação (Futuro - E2E)
```typescript
// Fase 2: End-to-End Encryption
// Usando Web Crypto API + Signal Protocol
```

---

## 🌐 ESCALABILIDADE

### Preparação para Futuro

#### 1. Chamadas de Voz/Vídeo
```typescript
// Preparar infraestrutura para WebRTC
interface CallConfig {
  type: 'voice' | 'video';
  participants: string[];
  quality: 'low' | 'medium' | 'high';
}
```

#### 2. Live Streaming
```typescript
// Transmissões ao vivo para comunidades
interface LiveStream {
  community_id: string;
  title: string;
  viewers_count: number;
  chat_enabled: boolean;
}
```

#### 3. AI Assistant
```typescript
// Assistente bíblico integrado
interface BibleAssistant {
  askQuestion: (question: string) => Promise<string>;
  suggestVerses: (context: string) => Promise<Verse[]>;
  prayerSuggestions: () => Promise<string[]>;
}
```

#### 4. Multi-device Sync
```typescript
// Sincronização entre web, mobile, desktop
// IndexedDB + WebSocket + Service Worker
```

---

## 📅 PLANO DE IMPLEMENTAÇÃO

### FASE 1 - FUNDAÇÃO (2 semanas)
**Objetivo:** Base sólida e funcional

- [ ] Criar schema de banco completo
- [ ] Implementar `useChatEngine` hook
- [ ] WebSocket manager centralizado
- [ ] IndexedDB wrapper
- [ ] MessageBubble component
- [ ] MessageInput component
- [ ] Chat privado 1-a-1 funcionando

### FASE 2 - RECURSOS ESSENCIAIS (2 semanas)
**Objetivo:** Features core

- [ ] Sistema de reações exclusivas
- [ ] Gravador de voz customizado
- [ ] Player de áudio com waveform
- [ ] Upload de imagens/vídeos
- [ ] Indicadores de status (✓✓)
- [ ] Typing indicators
- [ ] Online/offline presence

### FASE 3 - STICKERS E MÍDIA (1 semana)
**Objetivo:** Identidade visual

- [ ] Criar 198 stickers proprietários
- [ ] StickerPicker component
- [ ] Sistema de favoritos
- [ ] Compressão de imagens
- [ ] Galeria de mídia
- [ ] Preview de links

### FASE 4 - GRUPOS E COMUNIDADES (2 semanas)
**Objetivo:** Comunicação em grupo

- [ ] Criar grupos
- [ ] Adicionar/remover membros
- [ ] Sistema de permissões
- [ ] Comunidades multi-canal
- [ ] Canais broadcast
- [ ] Mensagens fixadas

### FASE 5 - BUSCA E ORGANIZAÇÃO (1 semana)
**Objetivo:** Encontrar tudo facilmente

- [ ] Full-text search
- [ ] Busca avançada (filtros)
- [ ] Mensagens favoritas
- [ ] Arquivar conversas
- [ ] Silenciar notificações
- [ ] Collections de mensagens

### FASE 6 - FEATURES AVANÇADAS (1 semana)
**Objetivo:** Recursos premium

- [ ] Enquetes
- [ ] Mensagens programadas
- [ ] Mensagens temporárias
- [ ] Compartilhar localização
- [ ] Compartilhar contatos
- [ ] Respostas rápidas

### FASE 7 - POLIMENTO (1 semana)
**Objetivo:** Experiência premium

- [ ] Animações fluidas
- [ ] Temas customizáveis
- [ ] Dark mode otimizado
- [ ] Haptic feedback (mobile)
- [ ] Sounds personalizados
- [ ] Easter eggs

### FASE 8 - TESTES E DEPLOY (1 semana)
**Objetivo:** Produção

- [ ] Testes unitários (80% coverage)
- [ ] Testes E2E (Playwright)
- [ ] Performance testing
- [ ] Security audit
- [ ] Beta com usuários reais
- [ ] Deploy gradual

---

## 📊 MÉTRICAS DE SUCESSO

### KPIs Técnicos
- [ ] 99.9% uptime
- [ ] < 100ms latência média
- [ ] > 90% cache hit rate
- [ ] 0 message loss
- [ ] < 1% error rate

### KPIs de Produto
- [ ] 70% dos usuários enviam pelo menos 1 mensagem/dia
- [ ] 40% dos usuários usam reações exclusivas
- [ ] 30% dos usuários usam gravação de voz
- [ ] 20% dos usuários usam stickers
- [ ] NPS > 50

---

## ✅ CHECKLIST FINAL

### Antes de Lançar
- [ ] Todos os testes passando
- [ ] Performance dentro dos targets
- [ ] Segurança auditada
- [ ] Documentação completa
- [ ] Stickers criados (198)
- [ ] Reações testadas (10)
- [ ] Mobile responsivo 100%
- [ ] Offline-first funcionando
- [ ] Notificações configuradas
- [ ] Backup automático configurado

---

**🎉 ARQUITETURA COMPLETA!**

Este é o sistema de mensagens mais completo e exclusivo para comunidades cristãs.  
Proprietário, seguro, rápido e com identidade única.

**Próximo passo:** Começar a implementação! 🚀

---

**Criado por:** Claude Sonnet 4.5  
**Para:** Rede da Fé  
**Data:** 26/06/2026  
**Versão:** 1.0.0
