-- Cadastro inicial de CONQUISTAS. A engine check_and_award_achievements()
-- concede por categoria lendo o user_stats (agora sincronizado):
--   bible -> bible_chapters_read | prayer(count) -> orações+intercessões
--   testimony -> testimonies_shared | event -> events_participated
--   social(streak) -> current_streak | social(count) -> total_points
-- Idempotente por nome.
insert into public.achievements (name, description, icon, category, level, points, requirement_type, requirement_value)
select v.name, v.description, v.icon, v.category, v.level, v.points, v.requirement_type, v.requirement_value
from (values
  ('Primeiros Passos',      'Alcance 100 pontos de fé.',                    '⭐','social',   1, 50,  'count',  100),
  ('Peregrino Dedicado',    'Alcance 1.000 pontos.',                        '🌟','social',   2, 150, 'count',  1000),
  ('Coração Constante',     'Alcance 5.000 pontos.',                        '💫','social',   3, 400, 'count',  5000),
  ('Chama Acesa',           'Mantenha 3 dias seguidos de atividade.',       '🔥','social',   1, 60,  'streak', 3),
  ('Semana Fiel',           'Mantenha 7 dias seguidos.',                    '🔥','social',   2, 150, 'streak', 7),
  ('Mês de Perseverança',   'Mantenha 30 dias seguidos.',                   '🏆','social',   3, 500, 'streak', 30),
  ('Primeiro Testemunho',   'Compartilhe seu primeiro testemunho.',         '🕊️','testimony',1, 50,  'count',  1),
  ('Voz do Reino',          'Compartilhe 5 testemunhos.',                   '📢','testimony',2, 150, 'count',  5),
  ('Testemunha Fiel',       'Compartilhe 20 testemunhos.',                  '👑','testimony',3, 400, 'count',  20),
  ('Primeira Oração',       'Faça ou interceda sua primeira oração.',       '🙏','prayer',   1, 50,  'count',  1),
  ('Intercessor',           'Alcance 10 orações/intercessões.',             '🙌','prayer',   2, 150, 'count',  10),
  ('Guerreiro de Oração',   'Alcance 50 orações/intercessões.',             '⚔️','prayer',   3, 400, 'count',  50),
  ('Primeiro Capítulo',     'Leia seu primeiro capítulo da Bíblia.',        '📖','bible',    1, 50,  'count',  1),
  ('Leitor Assíduo',        'Leia 10 capítulos.',                           '📚','bible',    2, 150, 'count',  10),
  ('Estudioso da Palavra',  'Leia 50 capítulos.',                           '🎓','bible',    3, 400, 'count',  50)
) as v(name, description, icon, category, level, points, requirement_type, requirement_value)
where not exists (select 1 from public.achievements a where a.name = v.name);
