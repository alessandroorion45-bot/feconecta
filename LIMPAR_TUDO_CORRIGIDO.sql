-- =====================================================
-- LIMPAR TUDO - VERSÃO CORRIGIDA
-- =====================================================

-- Dropar MATERIALIZED VIEWS (se existirem)
DROP MATERIALIZED VIEW IF EXISTS admin_dashboard_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS admin_notifications_history CASCADE;
DROP MATERIALIZED VIEW IF EXISTS admin_user_profile CASCADE;
DROP MATERIALIZED VIEW IF EXISTS admin_analytics_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS admin_analytics_user_growth CASCADE;
DROP MATERIALIZED VIEW IF EXISTS admin_analytics_top_themes CASCADE;
DROP MATERIALIZED VIEW IF EXISTS admin_analytics_top_achievements CASCADE;

-- Dropar VIEWS normais também (por garantia)
DROP VIEW IF EXISTS admin_dashboard_stats CASCADE;
DROP VIEW IF EXISTS admin_notifications_history CASCADE;
DROP VIEW IF EXISTS admin_user_profile CASCADE;
DROP VIEW IF EXISTS admin_analytics_summary CASCADE;
DROP VIEW IF EXISTS admin_analytics_user_growth CASCADE;
DROP VIEW IF EXISTS admin_analytics_top_themes CASCADE;
DROP VIEW IF EXISTS admin_analytics_top_achievements CASCADE;

-- Dropar functions
DROP FUNCTION IF EXISTS log_admin_action CASCADE;
DROP FUNCTION IF EXISTS send_mass_notification CASCADE;
DROP FUNCTION IF EXISTS warn_user CASCADE;
DROP FUNCTION IF EXISTS suspend_user CASCADE;
DROP FUNCTION IF EXISTS ban_user CASCADE;
DROP FUNCTION IF EXISTS check_banned_words CASCADE;

-- Dropar tabelas
DROP TABLE IF EXISTS auto_moderation_logs CASCADE;
DROP TABLE IF EXISTS moderation_rules CASCADE;
DROP TABLE IF EXISTS banned_words CASCADE;
DROP TABLE IF EXISTS user_punishments CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;
DROP TABLE IF EXISTS admin_notifications CASCADE;
DROP TABLE IF EXISTS admin_logs CASCADE;

-- Remover colunas em users
DO $$ BEGIN
    ALTER TABLE users DROP COLUMN IF EXISTS is_banned;
    ALTER TABLE users DROP COLUMN IF EXISTS banned_at;
    ALTER TABLE users DROP COLUMN IF EXISTS banned_by;
EXCEPTION
    WHEN undefined_column THEN null;
END $$;

-- Dropar ENUMs
DROP TYPE IF EXISTS user_punishment_type CASCADE;
DROP TYPE IF EXISTS theme_unlock_type CASCADE;
DROP TYPE IF EXISTS moderation_status CASCADE;
DROP TYPE IF EXISTS report_type CASCADE;

-- Verificar
SELECT '✅ LIMPEZA COMPLETA! Execute o SQL principal agora.' as status;
