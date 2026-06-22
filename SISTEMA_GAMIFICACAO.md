# 🎮 SISTEMA CENTRAL DE GAMIFICAÇÃO

## Visão Geral

Este documento descreve o sistema unificado de gamificação implementado no FeConecta, que conecta todas as funcionalidades do app (Devocionais, Estudos, Quiz, Testemunhos, Oração, etc.) a um único motor central de progressão.

**Objetivo:** Tornar o app magnético e viciante sem alterar tema, layout ou estrutura visual existente.

---

## 🎯 Conceito Central

**Toda ação gera XP → XP gera níveis → Níveis geram títulos → Tudo alimenta o Ranking**

```
Usuário faz ação
    ↓
awardXP() é chamado
    ↓
Atualiza XP, Nível, Título
    ↓
Atualiza Ranking
    ↓
Verifica Conquistas
    ↓
Dispara Notificações
```

---

## 📊 Sistema de XP

### Valores de XP por Ação

| Ação                           | XP  | Categoria     |
| ------------------------------ | --- | ------------- |
| **Devocional & Estudos**       |     |               |
| Devocional Diário              | 20  | devotional    |
| Estudo Bíblico                 | 30  | study         |
| Leitura Bíblica                | 15  | study         |
| **Quiz & Perguntas**           |     |               |
| Quiz Completado                | 15  | quiz          |
| Quiz 100%                      | 50  | quiz          |
| Pergunta Bíblica Respondida    | 10  | quiz          |
| **Social**                     |     |               |
| Testemunho Publicado           | 25  | social        |
| Oração Criada                  | 15  | social        |
| Intercessão Realizada          | 10  | social        |
| Mural de Gratidão              | 15  | social        |
| Comentário                     | 5   | social        |
| **Louvores**                   |     |               |
| Louvor Favoritado              | 5   | social        |
| Louvor Compartilhado           | 10  | social        |
| **Diário**                     |     |               |
| Login Diário                   | 5   | daily         |
| Sequência 7 Dias               | 50  | daily         |
| Sequência 30 Dias              | 200 | daily         |
| Sequência 100 Dias             | 1000| daily         |
| Sequência 1 Ano                | 5000| daily         |
| **Desafios**                   |     |               |
| Desafio Semanal Completado     | 100 | challenge     |

---

## 🏆 Sistema de Níveis

### Progressão de XP por Nível

| Nível  | XP Necessário | Diferença do Anterior |
| ------ | ------------- | --------------------- |
| 1      | 0             | -                     |
| 2      | 100           | +100                  |
| 3      | 250           | +150                  |
| 4      | 500           | +250                  |
| 5      | 1000          | +500                  |
| 6      | 1750          | +750                  |
| 7      | 2750          | +1000                 |
| 8      | 4000          | +1250                 |
| 9      | 5500          | +1500                 |
| 10     | 7500          | +2000                 |
| 11-20  | Progressivo   | Aumenta gradualmente  |
| 21+    | +5000/nível   | Fórmula logarítmica   |
| 100    | Máximo        | Teto do sistema       |

### Títulos por Faixa de Nível

| Níveis  | Título              | Emoji |
| ------- | ------------------- | ----- |
| 1-10    | Discípulo           | ✝️    |
| 11-20   | Servo               | 🙏    |
| 21-30   | Evangelista         | 📢    |
| 31-40   | Obreiro             | 🛠️    |
| 41-50   | Missionário         | 🌍    |
| 51-70   | Pastor Digital      | ⛪    |
| 71-90   | Mestre da Palavra   | 📚    |
| 91-100  | Lenda da Fé         | 🏆    |

---

## 🔥 Sistema de Streak (Sequência Diária)

### Funcionamento

- **Login todo dia:** Sequência aumenta
- **Perde 1 dia:** Sequência reinicia
- **Proteção:** 1x por mês (pode perder 1 dia sem reiniciar)

### Emojis de Streak

| Sequência    | Emoji       |
| ------------ | ----------- |
| 1 dia        | 🔥          |
| 7 dias       | 🔥🔥        |
| 30 dias      | 🔥🔥🔥      |
| 100 dias     | 👑          |
| 365 dias     | 🏆          |

### Bônus de Streak

- **7 dias:** +50 XP
- **30 dias:** +200 XP
- **100 dias:** +1000 XP
- **365 dias:** +5000 XP

---

## 🎯 Sistema de Desafios Semanais

### Exemplos de Desafios

```typescript
{
  title: "Leia 3 Capítulos",
  description: "Leia 3 capítulos da Bíblia esta semana",
  requirement: 3,
  xp_reward: 50,
  icon: "📖"
}

{
  title: "Complete 2 Quizzes",
  description: "Complete 2 quizzes bíblicos esta semana",
  requirement: 2,
  xp_reward: 80,
  icon: "🎯"
}

{
  title: "Sequência de 5 Dias",
  description: "Mantenha uma sequência de 5 dias consecutivos",
  requirement: 5,
  xp_reward: 150,
  icon: "🔥"
}
```

---

## 📈 Sistema de Ranking

### Fórmula de Pontuação Final

```
Pontuação Final = XP Total + Bônus de Streak + Bônus de Conquistas
```

**Detalhes:**
- **XP Total:** Acumulado de todas as ações
- **Bônus de Streak:** `current_streak × 10`
- **Bônus de Conquistas:** `total_achievements × 50`

### Exemplo de Cálculo

```
João:
- XP Total: 8500
- Streak: 35 dias → 35 × 10 = 350 pontos
- Conquistas: 12 → 12 × 50 = 600 pontos

Score Final: 8500 + 350 + 600 = 9450 pontos
```

---

## 🏅 Sistema de Conquistas

### Categorias de Conquistas

#### Devocional

- 🥉 **Primeiro Devocional:** Complete 1 devocional
- 🥈 **Devoto:** Complete 7 devocionais
- 🥇 **Disciplinado:** Complete 30 devocionais
- 👑 **Fiel:** Complete 365 devocionais

#### Quiz

- 🥉 **Primeiro Quiz:** Complete 1 quiz
- 🥈 **Estudioso:** Acerte 50 questões
- 🥇 **Sábio:** Acerte 500 questões
- 👑 **Mestre da Bíblia:** Acerte 2000 questões

#### Gratidão

- 🙏 **Grato:** Primeiro agradecimento
- 💚 **Coração Grato:** 50 agradecimentos
- ✨ **Gratidão Transbordante:** 200 agradecimentos

#### Estudos

- 📖 **Leitor:** Primeiro estudo
- 📚 **Estudante:** 100 estudos
- 🏆 **Teólogo em Formação:** 500 estudos

---

## 💻 Implementação Técnica

### Arquitetura

```
┌─────────────────────────────────────┐
│         Frontend (React)            │
│  ┌──────────────────────────────┐   │
│  │  useGamification() Hook      │   │
│  │  - awardXP()                 │   │
│  │  - updateStreak()            │   │
│  │  - getUserStats()            │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│       Supabase (PostgreSQL)         │
│  ┌──────────────────────────────┐   │
│  │  award_xp()                  │   │
│  │  - Atualiza XP               │   │
│  │  - Calcula nível             │   │
│  │  - Atualiza título           │   │
│  │  - Registra histórico        │   │
│  │  - Retorna resultado         │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Arquivos Principais

#### Frontend

- **`src/lib/gamification.ts`** - Constantes, tipos e utilitários
- **`src/hooks/useGamification.ts`** - Hook principal
- **`src/components/gamification/LevelProgressBar.tsx`** - Barra de progresso

#### Backend (Supabase)

- **`supabase/migrations/20260622000000_gamification_system.sql`** - Migração completa

### Tabelas do Banco

| Tabela                     | Descrição                                    |
| -------------------------- | -------------------------------------------- |
| `user_stats`               | XP, nível, título, streak de cada usuário    |
| `action_xp_values`         | Quanto XP cada ação vale                     |
| `xp_history`               | Histórico completo de XP ganho               |
| `user_streaks`             | Rastreamento de sequências diárias           |
| `weekly_challenges`        | Desafios semanais disponíveis                |
| `user_challenge_progress`  | Progresso do usuário nos desafios            |

### Funções do Banco

| Função                      | Descrição                                    |
| --------------------------- | -------------------------------------------- |
| `award_xp()`                | Concede XP ao usuário                        |
| `update_user_streak()`      | Atualiza streak e concede XP bônus           |
| `calculate_level_from_xp()` | Calcula nível baseado no XP                  |
| `get_title_from_level()`    | Retorna título baseado no nível              |

---

## 🚀 Como Usar

### 1. Conceder XP

Em qualquer parte do código onde o usuário faz uma ação:

```typescript
import { useGamification } from '@/hooks/useGamification';

function MeuComponente() {
  const { awardXP } = useGamification(userId);

  const handleAcaoCompleta = async () => {
    // Executar a ação...

    // Conceder XP
    await awardXP('daily_devotional');
  };
}
```

### 2. Atualizar Streak

No login diário do usuário:

```typescript
const { updateStreak } = useGamification(userId);

useEffect(() => {
  if (userId) {
    updateStreak();
  }
}, [userId]);
```

### 3. Exibir Progresso

```typescript
import { LevelProgressBar } from '@/components/gamification/LevelProgressBar';

<LevelProgressBar userId={userId} />
```

### 4. Buscar Desafios

```typescript
const { getWeeklyChallenges } = useGamification(userId);

const challenges = await getWeeklyChallenges();
```

---

## 📦 Integrações Necessárias

Para que o sistema funcione completamente, cada feature precisa chamar `awardXP()`:

### ✅ Devocional Diário

```typescript
// Ao completar devocional
awardXP('daily_devotional');
```

### ✅ Estudo Bíblico

```typescript
// Ao finalizar estudo
awardXP('bible_study');
```

### ✅ Quiz

```typescript
// Ao completar quiz
awardXP('quiz_completed');

// Se acertou 100%
if (score === 100) {
  awardXP('quiz_perfect');
}
```

### ✅ Perguntas Bíblicas

```typescript
// Ao responder pergunta
awardXP('bible_question_answered');
```

### ✅ Testemunhos

```typescript
// Ao publicar testemunho
awardXP('testimony_shared');
```

### ✅ Orações

```typescript
// Ao criar oração
awardXP('prayer_created');

// Ao interceder
awardXP('prayer_interceded');
```

### ✅ Mural de Gratidão

```typescript
// Ao publicar gratidão
awardXP('gratitude_post');
```

### ✅ Louvores

```typescript
// Ao favoritar
awardXP('worship_favorited');

// Ao compartilhar
awardXP('worship_shared');
```

### ✅ Comentários

```typescript
// Ao comentar
awardXP('comment_posted');
```

---

## 🎨 UI/UX

### Notificações

- **XP Ganho:** Toast com `+X XP` e descrição da ação
- **Level Up:** Toast especial com `🎉 Nível X!` e novo título
- **Streak:** Toast com emoji e dias consecutivos
- **Milestone:** Toast com `🏆 Milestone Alcançado!`

### Barra de Progresso

Exibida no perfil do usuário:

```
Nível 24 ⛪ Pastor Digital

████████░░░░ 78%

8,420 / 10,000 XP
1,580 XP para Nv 25

🔥 35 dias  🏆 12 conquistas  ⭐ 9,400 pontos
```

### Ranking Atualizado

```
1º João       9,450 pts  🏆 Nv 28  🔥 35
2º Maria      8,200 pts  ⛪ Nv 24  🔥 50
3º Pedro      7,100 pts  ⛪ Nv 22  🔥 12
```

---

## 📊 Métricas de Sucesso

### KPIs do Sistema

| Métrica                        | Objetivo  |
| ------------------------------ | --------- |
| Taxa de Login Diário           | > 60%     |
| Sequência Média                | > 7 dias  |
| Ações por Usuário/Dia          | > 5       |
| Desafios Completados/Semana    | > 50%     |
| Engajamento (Retorno D7)       | > 70%     |

---

## 🔮 Próximas Funcionalidades

### Fase 2 (Futuro)

- [ ] Ligas (Bronze, Prata, Ouro)
- [ ] Batalhas de Quiz entre amigos
- [ ] Eventos sazonais (Natal, Páscoa)
- [ ] Loja de recompensas (badges, molduras)
- [ ] Sistema de mentorias
- [ ] Conquistas secretas

---

## 🐛 Troubleshooting

### Problema: XP não está sendo concedido

1. Verificar se `award_xp()` está sendo chamado
2. Verificar console para erros
3. Verificar se `action_key` está correto
4. Verificar se usuário tem registro em `user_stats`

### Problema: Streak não atualiza

1. Verificar se `update_user_streak()` é chamado no login
2. Verificar última data de login em `user_streaks`
3. Verificar se proteção de streak está ativa

### Problema: Nível não sobe

1. Verificar se XP foi de fato adicionado
2. Verificar cálculo de nível em `calculate_level_from_xp()`
3. Verificar se `user_stats` foi atualizado

---

## 📝 Changelog

### v1.0.0 (2026-06-22)

- ✅ Sistema central de XP implementado
- ✅ Níveis e títulos funcionando
- ✅ Sistema de streak com bônus
- ✅ Desafios semanais criados
- ✅ Ranking com pontuação final
- ✅ Hook `useGamification` completo
- ✅ Componente de barra de progresso
- ✅ Migração SQL completa
- ✅ Documentação detalhada

---

**Desenvolvido com ❤️ para o FeConecta**

_Sistema de gamificação que conecta todas as funcionalidades do app a um único motor central de progressão, tornando-o magnético e viciante._
