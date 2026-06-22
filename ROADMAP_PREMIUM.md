# 🏆 ROADMAP PREMIUM - FECONECTA ENTERPRISE

## 📊 VISÃO GERAL DO PROJETO

**Objetivo**: Transformar FeConecta em uma plataforma cristã premium de nível enterprise com gamificação avançada, temas exclusivos, painel administrativo completo e sistema VIP.

**Estimativa Total**: 120-150 horas de desenvolvimento
**Complexidade**: Alta (Enterprise Level)
**Prioridade**: Modular (pode ser implementado em fases)

---

## 🎯 FASES DE IMPLEMENTAÇÃO

### **FASE 1: FUNDAÇÃO (20-25h)** ⭐ PRIORIDADE MÁXIMA

#### 1.1 Sistema de IDs Únicos (3h)
- [ ] Migração: Adicionar coluna `user_id_number` em `users`
- [ ] Função: Auto-increment para IDs (ID-000001, ID-000002...)
- [ ] Exibir ID no perfil do usuário
- [ ] Busca por ID no sistema

**Arquivos**:
- `supabase/migrations/20260623010000_user_ids_system.sql`
- `src/components/UserProfile.tsx` (modificar)

#### 1.2 Sistema de Roles e Permissões (5h)
- [ ] Tabela `admin_roles` (admin, moderator, vip, user)
- [ ] Tabela `admin_permissions`
- [ ] Middleware de autorização
- [ ] Políticas RLS para admins

**Arquivos**:
- `supabase/migrations/20260623020000_roles_permissions.sql`
- `src/hooks/useAdminAuth.ts` (novo)
- `src/contexts/AdminContext.tsx` (novo)

#### 1.3 Auditoria e Logs (4h)
- [ ] Tabela `admin_logs` (todas ações administrativas)
- [ ] Tabela `user_actions_log` (histórico usuários)
- [ ] Função trigger automática
- [ ] View de auditoria

**Arquivos**:
- `supabase/migrations/20260623030000_audit_system.sql`

#### 1.4 Sistema VIP Base (8h)
- [ ] Tabela `vip_subscriptions`
- [ ] Tabela `vip_benefits`
- [ ] Lógica de ativação/desativação VIP
- [ ] Badge VIP no perfil
- [ ] Benefits: 2x XP, temas exclusivos, sem anúncios

**Arquivos**:
- `supabase/migrations/20260623040000_vip_system.sql`
- `src/components/VIPBadge.tsx` (novo)
- `src/hooks/useVIP.ts` (novo)

---

### **FASE 2: TEMAS PREMIUM (25-30h)** 🎨

#### 2.1 Sistema de Temas (8h)
- [ ] Tabela `themes` (9 temas premium)
- [ ] Tabela `user_themes` (temas do usuário)
- [ ] Lógica de unlock (VIP, conquistas, compra)
- [ ] Aplicação dinâmica de temas

**Temas**:
1. ✨ Reino Celestial (branco perolado + dourado)
2. 🏛️ Nova Jerusalém (ouro + cristal)
3. 👑 Trono da Glória (roxo imperial + dourado)
4. 📦 Arca da Aliança (ouro antigo + madeira)
5. ⚔️ Guerreiro da Fé (preto + vermelho + ouro)
6. ⛰️ Monte Sião (azul profundo + branco)
7. 🌳 Jardim do Éden (verde esmeralda + natureza)
8. 💎 Diamante da Promessa (azul cristal + glass)
9. 🌌 Dark Royal Premium (preto + roxo neon + dourado) **[MAIS RARO]**

**Arquivos**:
- `supabase/migrations/20260623050000_themes_system.sql`
- `src/lib/themes/` (pasta com 9 arquivos de tema)
- `src/contexts/ThemeContext.tsx` (novo)
- `src/pages/ThemesGallery.tsx` (nova página)

#### 2.2 Customização por Tema (12h)
Cada tema terá:
- [ ] Paleta de cores única
- [ ] Gradientes exclusivos
- [ ] Molduras de perfil
- [ ] Ícones customizados
- [ ] Animações próprias
- [ ] Badges especiais
- [ ] Efeitos de brilho/partículas

**Arquivos**:
- `src/components/themed/ProfileFrame.tsx`
- `src/components/themed/AnimatedBackground.tsx`
- `src/components/themed/ThemeEffects.tsx`

#### 2.3 Loja de Temas (10h)
- [ ] Página de compra de temas
- [ ] Preview de temas
- [ ] Sistema de moedas/pontos
- [ ] Unlocks por conquistas
- [ ] Temas VIP exclusivos

**Arquivos**:
- `src/pages/ThemeStore.tsx` (novo)
- `supabase/migrations/20260623060000_theme_store.sql`

---

### **FASE 3: PAINEL ADMINISTRATIVO (35-40h)** 🛡️

#### 3.1 Dashboard Principal (10h)
- [ ] Métricas em tempo real
- [ ] Gráficos de crescimento
- [ ] KPIs principais
- [ ] Alertas de moderação

**Métricas**:
- Total de usuários
- Usuários online (Supabase Realtime)
- Novos usuários hoje/semana/mês
- Tempo médio de uso
- Total de postagens
- Total de denúncias pendentes
- Receita (se aplicável)
- Temas vendidos
- Usuários VIP ativos

**Arquivos**:
- `src/pages/admin/Dashboard.tsx` (novo)
- `src/components/admin/MetricsCard.tsx` (novo)
- `src/components/admin/GrowthChart.tsx` (novo)

#### 3.2 Gestão de Usuários (12h)
- [ ] Lista de usuários (paginada)
- [ ] Busca avançada (nome, email, ID)
- [ ] Perfil completo do usuário
- [ ] Histórico de ações
- [ ] Histórico de punições

**Ações Admin**:
- Advertir (warning)
- Silenciar (mute 1h, 24h, 7d)
- Suspender (7d, 30d)
- Banir temporário
- Banir permanente
- Remover conteúdo
- Conceder VIP
- Conceder temas
- Resetar senha

**Arquivos**:
- `src/pages/admin/Users.tsx` (novo)
- `src/pages/admin/UserDetail.tsx` (novo)
- `src/components/admin/UserActions.tsx` (novo)
- `supabase/migrations/20260623070000_admin_actions.sql`

#### 3.3 Sistema de Moderação (13h)
- [ ] Fila de revisão de conteúdo
- [ ] Aprovação manual de fotos
- [ ] Moderação de comentários
- [ ] Sistema de flags automáticos
- [ ] Filtro de palavras proibidas

**Arquivos**:
- `src/pages/admin/Moderation.tsx` (novo)
- `src/components/admin/ContentReview.tsx` (novo)
- `supabase/migrations/20260623080000_moderation_queue.sql`
- `supabase/functions/auto-moderate/index.ts` (Edge Function)

---

### **FASE 4: SISTEMA DE DENÚNCIAS (12-15h)** 🚨

#### 4.1 Denúncias de Usuários (8h)
- [ ] Formulário de denúncia
- [ ] Categorias (spam, ofensa, conteúdo impróprio, etc.)
- [ ] Upload de evidências (prints)
- [ ] Status da denúncia

**Arquivos**:
- `src/components/ReportModal.tsx` (novo)
- `supabase/migrations/20260623090000_reports_system.sql`

#### 4.2 Painel de Denúncias Admin (7h)
- [ ] Fila de denúncias
- [ ] Filtros (pendente, resolvido, rejeitado)
- [ ] Ações rápidas
- [ ] Histórico de decisões

**Arquivos**:
- `src/pages/admin/Reports.tsx` (novo)
- `src/components/admin/ReportCard.tsx` (novo)

---

### **FASE 5: ANALYTICS AVANÇADO (15-18h)** 📈

#### 5.1 Dashboard de Analytics (10h)
- [ ] Gráficos Chart.js/Recharts
- [ ] Usuários ativos (DAU, WAU, MAU)
- [ ] Retenção (D1, D7, D30)
- [ ] Horários de pico
- [ ] Funcionalidades mais usadas
- [ ] Conteúdos mais curtidos

**Arquivos**:
- `src/pages/admin/Analytics.tsx` (novo)
- `src/components/admin/charts/` (pasta com componentes)

#### 5.2 Relatórios Automáticos (5h)
- [ ] Exportar CSV
- [ ] Relatório semanal
- [ ] Relatório mensal
- [ ] Comparação períodos

#### 5.3 Métricas de Gamificação (3h)
- [ ] Conquistas mais obtidas
- [ ] Temas mais usados
- [ ] XP médio por usuário
- [ ] Streaks mais longos

---

### **FASE 6: GAMIFICAÇÃO AVANÇADA (13-15h)** 🎮

#### 6.1 Expansão do Sistema XP (5h)
- [ ] Multipliers VIP (2x XP)
- [ ] Eventos de XP em dobro
- [ ] Boost semanal
- [ ] Recompensas diárias progressivas

**Arquivos**:
- Modificar `src/hooks/useGamification.ts`
- `supabase/migrations/20260623100000_advanced_xp.sql`

#### 6.2 Conquistas Raras (8h)
- [ ] 50 novas conquistas
- [ ] Conquistas secretas
- [ ] Conquistas de eventos
- [ ] Progresso de conquistas complexas

**Exemplos**:
- 🏆 "Guerreiro Fiel" - 365 dias de streak
- 💎 "Sábio Bíblico" - 1000 quizzes perfeitos
- ⚔️ "Intercessor" - 10.000 orações
- 👑 "Fundador" - Primeiros 100 usuários

---

### **FASE 7: MELHORIAS UX/UI (10-12h)** ✨

#### 7.1 Animações Premium
- [ ] Framer Motion em transições
- [ ] Efeitos de hover sofisticados
- [ ] Partículas de fundo
- [ ] Micro-interações

#### 7.2 Componentes Glassmorphism
- [ ] Cards com efeito glass
- [ ] Modais premium
- [ ] Tooltips elegantes

#### 7.3 Loading States
- [ ] Skeletons personalizados
- [ ] Loaders temáticos
- [ ] Transições suaves

---

## 🗂️ ESTRUTURA DE ARQUIVOS (NOVA)

```
feconecta/
├── src/
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── Dashboard.tsx          ⭐ NOVO
│   │   │   ├── Users.tsx              ⭐ NOVO
│   │   │   ├── UserDetail.tsx         ⭐ NOVO
│   │   │   ├── Moderation.tsx         ⭐ NOVO
│   │   │   ├── Reports.tsx            ⭐ NOVO
│   │   │   ├── Analytics.tsx          ⭐ NOVO
│   │   │   └── Settings.tsx           ⭐ NOVO
│   │   ├── ThemesGallery.tsx          ⭐ NOVO
│   │   └── ThemeStore.tsx             ⭐ NOVO
│   ├── components/
│   │   ├── admin/                     ⭐ NOVO (pasta)
│   │   │   ├── MetricsCard.tsx
│   │   │   ├── UserActions.tsx
│   │   │   ├── ContentReview.tsx
│   │   │   ├── ReportCard.tsx
│   │   │   └── charts/                ⭐ NOVO (subpasta)
│   │   ├── themed/                    ⭐ NOVO (pasta)
│   │   │   ├── ProfileFrame.tsx
│   │   │   ├── AnimatedBackground.tsx
│   │   │   └── ThemeEffects.tsx
│   │   ├── VIPBadge.tsx               ⭐ NOVO
│   │   └── ReportModal.tsx            ⭐ NOVO
│   ├── contexts/
│   │   ├── AdminContext.tsx           ⭐ NOVO
│   │   └── ThemeContext.tsx           ⭐ NOVO
│   ├── hooks/
│   │   ├── useAdminAuth.ts            ⭐ NOVO
│   │   ├── useVIP.ts                  ⭐ NOVO
│   │   └── useTheme.ts                ⭐ NOVO
│   └── lib/
│       └── themes/                    ⭐ NOVO (pasta)
│           ├── reino-celestial.ts
│           ├── nova-jerusalem.ts
│           ├── trono-gloria.ts
│           ├── arca-alianca.ts
│           ├── guerreiro-fe.ts
│           ├── monte-siao.ts
│           ├── jardim-eden.ts
│           ├── diamante-promessa.ts
│           └── dark-royal.ts
├── supabase/
│   ├── migrations/
│   │   ├── 20260623010000_user_ids_system.sql         ⭐ NOVO
│   │   ├── 20260623020000_roles_permissions.sql       ⭐ NOVO
│   │   ├── 20260623030000_audit_system.sql            ⭐ NOVO
│   │   ├── 20260623040000_vip_system.sql              ⭐ NOVO
│   │   ├── 20260623050000_themes_system.sql           ⭐ NOVO
│   │   ├── 20260623060000_theme_store.sql             ⭐ NOVO
│   │   ├── 20260623070000_admin_actions.sql           ⭐ NOVO
│   │   ├── 20260623080000_moderation_queue.sql        ⭐ NOVO
│   │   ├── 20260623090000_reports_system.sql          ⭐ NOVO
│   │   └── 20260623100000_advanced_xp.sql             ⭐ NOVO
│   └── functions/
│       └── auto-moderate/
│           └── index.ts                                ⭐ NOVO
```

---

## 📦 DEPENDÊNCIAS ADICIONAIS

```bash
npm install recharts framer-motion chart.js react-chartjs-2
npm install @tanstack/react-table date-fns
npm install react-hot-toast sonner
```

---

## 🎯 CRONOGRAMA SUGERIDO

**Semana 1**: Fase 1 (Fundação) - Sistema crítico
**Semana 2**: Fase 2 (Temas Premium) - Visual impactante
**Semana 3-4**: Fase 3 (Painel Admin) - Gestão completa
**Semana 5**: Fase 4 (Denúncias) + Fase 5 (Analytics)
**Semana 6**: Fase 6 (Gamificação) + Fase 7 (UX/UI)
**Semana 7**: Testes, ajustes e deploy final

---

## ⚡ QUICK WINS (Implementação Rápida)

Se quiser resultados rápidos, comece por:

1. **Sistema de IDs** (3h) - Impacto visual imediato
2. **Badge VIP** (2h) - Mostra diferenciação
3. **1 Tema Premium** (3h) - Prova de conceito
4. **Dashboard básico** (5h) - Admin funcional

Total: **13h para MVP Premium**

---

## 🚨 DECISÕES IMPORTANTES

### 1. Sistema de Pagamento?
- Integrar Stripe/Mercado Pago para VIP?
- Ou VIP apenas por admin?

### 2. Moderação
- Manual completa?
- IA para filtro automático?
- Híbrido?

### 3. Temas
- Todos grátis para VIP?
- Alguns pagos separadamente?
- Unlock por conquistas?

### 4. Analytics
- Usar Vercel Analytics?
- Sistema próprio?
- Google Analytics + Dashboard próprio?

---

## ✅ STATUS ATUAL DO PROJETO

Já temos implementado:
- ✅ Sistema de XP básico (13 ações)
- ✅ Gamificação (17 badges)
- ✅ 10.000 perguntas
- ✅ 1.000 devocionais
- ✅ Performance otimizada
- ✅ Deploy funcional

Pronto para adicionar camada premium! 🚀

---

**PRÓXIMO PASSO**: Definir por onde começar e prioridades específicas.
