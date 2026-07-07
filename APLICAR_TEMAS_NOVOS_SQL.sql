-- Adiciona os 4 temas novos (Clássico, Sabedoria, Noite de Oração, Pentecostes)
-- ao catálogo já existente (public.themes, aplicado em 24/06 — confirmado
-- funcionando em produção pelo log "[Theme] Aplicado: Monte Sião").

INSERT INTO public.themes (theme_key, theme_name, description, colors, effects, rarity, tier) VALUES
  ('classico', 'Clássico', 'Minimalista, leve e elegante — branco limpo, poucas sombras',
   '{"primary": "#475569", "secondary": "#94a3b8", "accent": "#64748b", "background": "#ffffff", "text": "#1e293b", "gradient": ["#475569", "#94a3b8"]}'::jsonb,
   '{"animation": "subtle-fade"}'::jsonb, 1, NULL),

  ('sabedoria', 'Sabedoria', 'Azul profundo e cinza claro — elegância e conforto de leitura',
   '{"primary": "#1e40af", "secondary": "#64748b", "accent": "#3b82f6", "background": "#f8fafc", "text": "#1e293b", "gradient": ["#1e40af", "#3b82f6", "#64748b"]}'::jsonb,
   '{"glow": "soft-blue", "animation": "calm-focus"}'::jsonb, 3, 'standard'),

  ('noite-oracao', 'Noite de Oração', 'Roxo profundo e azul escuro — glow violeta, atmosfera silenciosa',
   '{"primary": "#7c3aed", "secondary": "#4c1d95", "accent": "#a78bfa", "background": "#0f0a1a", "text": "#f5f3ff", "gradient": ["#0f0a1a", "#4c1d95", "#7c3aed", "#a78bfa"]}'::jsonb,
   '{"particles": "candlelight", "glow": "violet-glow", "animation": "silent-breathe"}'::jsonb, 4, 'gold'),

  ('pentecostes', 'Pentecostes', 'Vermelho, laranja e dourado — energia e pequenas partículas de fogo',
   '{"primary": "#dc2626", "secondary": "#f97316", "accent": "#fbbf24", "background": "#fff7ed", "text": "#7c2d12", "gradient": ["#dc2626", "#f97316", "#fbbf24"]}'::jsonb,
   '{"particles": "fire-sparks", "glow": "flame-gold", "animation": "pentecost-flicker"}'::jsonb, 4, 'gold')
ON CONFLICT (theme_key) DO NOTHING;
