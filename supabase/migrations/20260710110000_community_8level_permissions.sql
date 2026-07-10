-- ============================================================
-- COMUNIDADE DA IGREJA — FASE 13: Permissões reais de 8 níveis
-- ============================================================
-- O sistema de 8 níveis (Administrador/Pastor/Supervisor/Líder/
-- Vice-líder/Professor/Membro/Visitante) reaproveita os valores de
-- role já reconhecidos em TODAS as políticas de liderança criadas
-- nas fases anteriores (admin/pastor/presbitero/lider_geral/
-- moderador/professor_ebd/member) — nenhuma política precisa ser
-- reescrita. O único ajuste real: "Supervisor" (presbitero) estava
-- de fora da política que permite reatribuir o papel de outros
-- membros, apesar de ser um nível de liderança sênior.
-- ============================================================

DROP POLICY IF EXISTS "Leaders can manage member roles" ON public.church_community_members;
CREATE POLICY "Leaders can manage member roles"
ON public.church_community_members FOR UPDATE
USING (
  public.community_member_role(community_id, auth.uid())
  IN ('admin', 'pastor', 'pastora', 'presbitero', 'lider_geral', 'secretario')
);

SELECT 'ok' as status;
