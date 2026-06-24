# 🚀 INSTRUÇÕES DE DEPLOY - PAINEL ADMINISTRATIVO

## ✅ Arquivo Consolidado Criado!

**Arquivo:** `deploy-admin-panel-consolidated.sql`  
**Tamanho:** ~58 KB  
**Migrations:** 6 arquivos consolidados  

---

## 📋 MÉTODO 1: Deploy via Supabase Dashboard (RECOMENDADO)

### Passo 1: Abrir Supabase Dashboard
1. Acesse: https://app.supabase.com/projects
2. Selecione seu projeto: **FeConecta**
3. Clique em **SQL Editor** no menu lateral

### Passo 2: Criar Nova Query
1. Clique em **New query**
2. Cole o conteúdo do arquivo `deploy-admin-panel-consolidated.sql`

### Passo 3: Executar SQL
1. Clique no botão **RUN** (ou pressione Ctrl+Enter)
2. Aguarde a execução (pode levar 30-60 segundos)
3. Verifique se não há erros no console

### Passo 4: Verificar Instalação
Execute esta query para verificar:

```sql
-- Verificar se as tabelas foram criadas
SELECT 
  COUNT(*) FILTER (WHERE table_name = 'admin_logs') as admin_logs_exists,
  COUNT(*) FILTER (WHERE table_name = 'admin_notifications') as notifications_exists,
  COUNT(*) FILTER (WHERE table_name = 'user_punishments') as punishments_exists,
  COUNT(*) FILTER (WHERE table_name = 'banned_words') as banned_words_exists
FROM information_schema.tables
WHERE table_schema = 'public';

-- Verificar se as views foram criadas
SELECT COUNT(*) as total_views
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE 'admin_%';

-- Verificar se as functions foram criadas
SELECT COUNT(*) as total_functions
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
  routine_name LIKE '%admin%' OR
  routine_name LIKE 'ban_%' OR
  routine_name LIKE 'suspend_%' OR
  routine_name LIKE 'warn_%' OR
  routine_name LIKE 'send_mass%'
);
```

**Resultados esperados:**
- `admin_logs_exists`: 1
- `notifications_exists`: 1
- `punishments_exists`: 1
- `banned_words_exists`: 1
- `total_views`: 16 (ou mais)
- `total_functions`: 15 (ou mais)

---

## 📋 MÉTODO 2: Deploy via Supabase CLI (Alternativo)

### Pré-requisitos:
```powershell
# Instalar Supabase CLI
scoop install supabase

# OU via npm
npm install -g supabase
```

### Executar Deploy:
```powershell
cd e:\feconecta

# Fazer login
supabase login

# Linkar projeto
supabase link --project-ref [SEU_PROJECT_ID]

# Aplicar migrations
supabase db push
```

---

## 📋 MÉTODO 3: Deploy Manual (Arquivo por Arquivo)

Se preferir aplicar as migrations individualmente:

### Ordem de Execução:

1. **`20260623080000_admin_panel_real_data.sql`**
   - Dashboard + Logs + Views básicas
   - Tempo estimado: ~10 segundos

2. **`20260623081000_admin_photos_management.sql`**
   - Gerenciador de Fotos
   - Tempo estimado: ~5 segundos

3. **`20260623082000_admin_notifications.sql`**
   - Sistema de Notificações
   - Tempo estimado: ~8 segundos

4. **`20260623083000_admin_analytics.sql`**
   - Analytics + Views de métricas
   - Tempo estimado: ~10 segundos

5. **`20260623084000_admin_user_actions.sql`**
   - Punições de usuários
   - Tempo estimado: ~8 segundos

6. **`20260623085000_moderation_automation.sql`**
   - Automações de moderação
   - Tempo estimado: ~12 segundos

**Tempo total:** ~1 minuto

---

## ✅ Checklist Pós-Deploy

Após executar o deploy, verifique:

- [ ] Dashboard mostra dados reais (não mockados)
- [ ] Página `/admin/users` carrega perfis completos
- [ ] Página `/admin/themes` lista temas premium
- [ ] Página `/admin/photos` mostra fotos consolidadas
- [ ] Página `/admin/notifications` permite envio em massa
- [ ] Página `/admin/logs` exibe histórico de ações
- [ ] Página `/admin/analytics` mostra gráficos
- [ ] Página `/admin/automation` permite adicionar palavras proibidas
- [ ] Busca global (Ctrl+K) funciona
- [ ] Ações de banir/suspender funcionam

---

## 🔧 Troubleshooting

### Erro: "relation already exists"
**Solução:** Algumas tabelas já existem. Modifique as migrations para usar `IF NOT EXISTS`:
```sql
CREATE TABLE IF NOT EXISTS ...
```

### Erro: "permission denied"
**Solução:** Verifique se você está usando o usuário `postgres` ou um usuário com permissões de administrador.

### Erro: "column does not exist"
**Solução:** Execute as migrations na ordem correta (1 a 6).

### Views retornam vazias
**Solução:** Aguarde alguns segundos e recarregue a página. As views dependem de dados existentes nas tabelas.

---

## 📊 Estrutura Criada

### Tabelas Novas (8):
1. `admin_logs` - Logs de ações administrativas
2. `admin_notifications` - Notificações enviadas
3. `notification_templates` - Templates de notificações
4. `user_punishments` - Histórico de punições
5. `banned_words` - Palavras proibidas
6. `moderation_rules` - Regras de automação
7. `auto_moderation_logs` - Logs de automação

### Views Criadas (16):
1. `admin_dashboard_stats`
2. `admin_vip_users`
3. `admin_theme_stats`
4. `admin_reports_detailed`
5. `admin_all_photos`
6. `admin_recent_photos`
7. `admin_reported_photos`
8. `admin_notifications_history`
9. `admin_analytics_user_growth`
10. `admin_analytics_retention`
11. `admin_analytics_daily_activity`
12. `admin_analytics_top_themes`
13. `admin_analytics_top_achievements`
14. `admin_analytics_level_distribution`
15. `admin_analytics_hourly_engagement`
16. `admin_analytics_summary`

### Functions Criadas (15):
1. `log_admin_action()`
2. `send_mass_notification()`
3. `hide_photo()`
4. `delete_photo()`
5. `approve_photo()`
6. `warn_user()`
7. `suspend_user()`
8. `ban_user()`
9. `revoke_punishment()`
10. `check_banned_words()`
11. `apply_moderation_rules()`
12. E outras funções auxiliares...

---

## 🎯 Teste Rápido

Após o deploy, execute este SQL para testar:

```sql
-- 1. Verificar dashboard stats
SELECT * FROM admin_dashboard_stats;

-- 2. Verificar se há temas
SELECT * FROM admin_theme_stats LIMIT 5;

-- 3. Verificar templates de notificação
SELECT name, title FROM notification_templates;

-- 4. Verificar palavras proibidas padrão
SELECT word, severity FROM banned_words WHERE is_active = true;

-- 5. Verificar regras de moderação
SELECT name, trigger_type, action_type FROM moderation_rules WHERE is_active = true;
```

Se todas as queries retornarem resultados, o deploy foi bem-sucedido! ✅

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do Supabase
2. Revise a ordem das migrations
3. Verifique se todas as tabelas base existem (users, posts, etc)
4. Execute as queries de verificação acima

---

**Boa sorte com o deploy! 🚀**
