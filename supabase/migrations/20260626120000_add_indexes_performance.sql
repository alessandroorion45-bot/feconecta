-- =====================================================
-- ÍNDICES DE PERFORMANCE
-- =====================================================
-- Resolver timeouts em AdminContext e melhorar queries
-- =====================================================

-- Índice para user_roles (resolver ROLES_QUERY_TIMEOUT)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
ON user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_active
ON user_roles(user_id, is_active)
WHERE is_active = true;

-- Índice para user_roles por role
CREATE INDEX IF NOT EXISTS idx_user_roles_role
ON user_roles(role);

-- Índice composto para queries comuns
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup
ON user_roles(user_id, role, is_active);

-- Índices para tabelas de interações de versículos
CREATE INDEX IF NOT EXISTS idx_verse_favorites_user
ON verse_favorites(user_id);

CREATE INDEX IF NOT EXISTS idx_verse_favorites_verse
ON verse_favorites(book, chapter, verse);

CREATE INDEX IF NOT EXISTS idx_verse_reactions_user
ON verse_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_verse_reactions_verse
ON verse_reactions(book, chapter, verse);

-- Índice para verse_comments
CREATE INDEX IF NOT EXISTS idx_verse_comments_verse
ON verse_comments(book, chapter, verse);

CREATE INDEX IF NOT EXISTS idx_verse_comments_user
ON verse_comments(user_id);

-- Índice para profiles (queries frequentes)
CREATE INDEX IF NOT EXISTS idx_profiles_username
ON profiles(username);

CREATE INDEX IF NOT EXISTS idx_profiles_full_name
ON profiles(full_name);

-- Índice para friendships
CREATE INDEX IF NOT EXISTS idx_friendships_user1
ON friendships(user_id_1);

CREATE INDEX IF NOT EXISTS idx_friendships_user2
ON friendships(user_id_2);

CREATE INDEX IF NOT EXISTS idx_friendships_status
ON friendships(status);

-- Índice composto para friendships
CREATE INDEX IF NOT EXISTS idx_friendships_lookup
ON friendships(user_id_1, user_id_2, status);

-- Sucesso
SELECT '✅ Índices de performance criados com sucesso!' as message;
