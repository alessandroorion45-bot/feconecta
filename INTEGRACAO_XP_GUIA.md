# 🎮 Guia de Integração do Sistema de XP

## ✅ Já Integrado

- ✅ **Login Diário** - DailyLoginTracker criado
- ✅ **Testemunhos (texto)** - Testimonies.tsx
- ✅ **Testemunhos (áudio)** - AudioRecorder.tsx
- ✅ **Comentários** - Testimonies.tsx

---

## 📋 Integrações Restantes

### 1. Orações (Prayers.tsx)

**Ao criar oração:**
```typescript
// Adicionar import
import { useGamification } from '@/hooks/useGamification';

// No componente
const { awardXP } = useGamification(user?.id);

// Após criar oração com sucesso
await awardXP('prayer_created');
```

**Ao interceder:**
```typescript
// Após interceder com sucesso
await awardXP('prayer_interceded');
```

---

### 2. Mural de Gratidão (GratitudeWall.tsx)

**Ao publicar gratidão:**
```typescript
import { useGamification } from '@/hooks/useGamification';

const { awardXP } = useGamification(user?.id);

// Após publicar com sucesso
await awardXP('gratitude_post');
```

---

### 3. Louvores (Worship.tsx)

**Ao favoritar louvor:**
```typescript
import { useGamification } from '@/hooks/useGamification';

const { awardXP } = useGamification(user?.id);

// Após favoritar
await awardXP('worship_favorited');
```

**Ao compartilhar louvor:**
```typescript
// Após compartilhar
await awardXP('worship_shared');
```

---

### 4. Devocional Diário (Devotional.tsx)

**Ao completar devocional:**
```typescript
import { useGamification } from '@/hooks/useGamification';

const { awardXP } = useGamification(user?.id);

// Após completar devocional
await awardXP('daily_devotional');
```

---

### 5. Estudos Bíblicos (BibleStudies.tsx)

**Ao completar estudo:**
```typescript
import { useGamification } from '@/hooks/useGamification';

const { awardXP } = useGamification(user?.id);

// Após completar estudo
await awardXP('bible_study');
```

---

### 6. Leitura Bíblica (Bible.tsx)

**Ao ler capítulos:**
```typescript
import { useGamification } from '@/hooks/useGamification';

const { awardXP } = useGamification(user?.id);

// Após marcar capítulo como lido
await awardXP('bible_reading');
```

---

### 7. Quiz / Caça-Palavras (WordSearch.tsx)

**Ao completar quiz:**
```typescript
import { useGamification } from '@/hooks/useGamification';

const { awardXP } = useGamification(user?.id);

// Ao completar
await awardXP('quiz_completed');

// Se acertou 100%
if (score === 100) {
  await awardXP('quiz_perfect');
}
```

---

### 8. Perguntas Bíblicas (BibleQuestions.tsx)

**Ao responder pergunta:**
```typescript
import { useGamification } from '@/hooks/useGamification';

const { awardXP } = useGamification(user?.id);

// Após responder corretamente
if (isCorrect) {
  await awardXP('bible_question_answered');
}
```

---

## 🎨 Componentes Visuais

### 1. Adicionar DailyLoginTracker no App.tsx

```typescript
import { DailyLoginTracker } from '@/components/gamification/DailyLoginTracker';

// Dentro do return, após AuthProvider
<AuthProvider>
  <DailyLoginTracker />
  {/* resto do código */}
</AuthProvider>
```

---

### 2. Adicionar LevelProgressBar no Profile.tsx

```typescript
import { LevelProgressBar } from '@/components/gamification/LevelProgressBar';

// Dentro do perfil, no topo
<LevelProgressBar userId={userId} />
```

**Versão compacta para header:**
```typescript
<LevelProgressBar userId={userId} compact />
```

---

## 🏆 Atualizar Ranking

### Ranking.tsx

Substituir a query atual por:

```typescript
const { data: rankingData } = await supabase
  .from('user_stats')
  .select(`
    user_id,
    total_xp,
    level,
    title,
    current_streak,
    profiles:user_id (
      username,
      full_name,
      avatar_url
    )
  `)
  .order('total_xp', { ascending: false })
  .limit(100);

// Calcular score final para cada usuário
const { count: achievementsCount } = await supabase
  .from('user_achievements')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.user_id);

// Usar calculateFinalScore
import { calculateFinalScore } from '@/lib/gamification';

const finalScore = calculateFinalScore(
  user.total_xp,
  user.current_streak,
  achievementsCount || 0
);
```

---

## 📊 Template de Integração

Para QUALQUER nova feature:

```typescript
// 1. Import
import { useGamification } from '@/hooks/useGamification';

// 2. Hook
const { awardXP } = useGamification(user?.id);

// 3. Chamar após ação bem-sucedida
const handleAction = async () => {
  try {
    // Executar ação...
    const result = await minhaAcao();

    if (result.success) {
      // Conceder XP
      await awardXP('action_key_aqui');

      // Toast/feedback...
    }
  } catch (error) {
    // Erro...
  }
};
```

---

## 🔧 Debugging

### Ver XP sendo concedido

Abra o console (F12) e procure por:

```
[Gamification] Concedendo XP: daily_devotional (+20 XP)
[Gamification] XP concedido: { xp_earned: 20, total_xp: 520, ... }
```

### Ver streak sendo atualizado

```
[DailyLogin] Rastreando login diário...
[DailyLogin] Streak atualizado: { current_streak: 5, ... }
```

### Testar manualmente no console do navegador

```javascript
// No console do browser
const { supabase } = window;

// Conceder XP manualmente
await supabase.rpc('award_xp', {
  p_user_id: 'SEU_USER_ID',
  p_action_key: 'daily_devotional'
});

// Atualizar streak
await supabase.rpc('update_user_streak', {
  p_user_id: 'SEU_USER_ID'
});
```

---

## ✅ Checklist de Integração

- [ ] Orações - criar
- [ ] Orações - interceder
- [ ] Mural de Gratidão
- [ ] Louvores - favoritar
- [ ] Louvores - compartilhar
- [ ] Devocional Diário
- [ ] Estudos Bíblicos
- [ ] Leitura Bíblica
- [ ] Quiz/Caça-Palavras
- [ ] Perguntas Bíblicas
- [ ] DailyLoginTracker no App
- [ ] LevelProgressBar no Profile
- [ ] Ranking atualizado
- [ ] Testar cada integração

---

## 🚀 Depois de Integrar

1. **Testar cada funcionalidade**
   - Fazer cada ação
   - Verificar se XP é concedido
   - Ver toast de XP
   - Conferir no perfil se XP aumentou

2. **Verificar no banco**
   ```sql
   -- Ver XP do usuário
   SELECT total_xp, level, title FROM user_stats WHERE user_id = 'xxx';

   -- Ver histórico de XP
   SELECT * FROM xp_history WHERE user_id = 'xxx' ORDER BY created_at DESC LIMIT 10;

   -- Ver streak
   SELECT * FROM user_streaks WHERE user_id = 'xxx';
   ```

3. **Testar ranking**
   - Verificar se pontuação está correta
   - Verificar ordenação

4. **Commit!**
   ```bash
   git add .
   git commit -m "feat: Integra awardXP em todas as features do app"
   git push
   ```

---

**Dica:** Comece pelas integrações mais simples (Gratidão, Louvores) e vá para as mais complexas (Quiz, Estudos).
