-- Criação da tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  church_name TEXT,
  bio TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de depoimentos/testemunhos
CREATE TABLE public.testimonies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  glory_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de pedidos de oração
CREATE TABLE public.prayers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  intercessor_count INT NOT NULL DEFAULT 0,
  is_answered BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de eventos
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  image_url TEXT,
  participant_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de curtidas em depoimentos
CREATE TABLE public.testimony_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimony_id UUID NOT NULL REFERENCES public.testimonies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(testimony_id, user_id)
);

-- Tabela de "Glória a Deus" em depoimentos
CREATE TABLE public.testimony_glories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimony_id UUID NOT NULL REFERENCES public.testimonies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(testimony_id, user_id)
);

-- Tabela de intercessores em orações
CREATE TABLE public.prayer_intercessors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_id UUID NOT NULL REFERENCES public.prayers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(prayer_id, user_id)
);

-- Tabela de participantes em eventos
CREATE TABLE public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Tabela de comentários (universal para depoimentos, orações e eventos)
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  testimony_id UUID REFERENCES public.testimonies(id) ON DELETE CASCADE,
  prayer_id UUID REFERENCES public.prayers(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de seguidores
CREATE TABLE public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimony_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimony_glories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_intercessors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies para profiles
CREATE POLICY "Profiles são visíveis para todos" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Usuários podem criar seu próprio perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies para testimonies
CREATE POLICY "Depoimentos são visíveis para todos" ON public.testimonies FOR SELECT USING (true);
CREATE POLICY "Usuários podem criar seus depoimentos" ON public.testimonies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus depoimentos" ON public.testimonies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus depoimentos" ON public.testimonies FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies para prayers
CREATE POLICY "Orações são visíveis para todos" ON public.prayers FOR SELECT USING (true);
CREATE POLICY "Usuários podem criar suas orações" ON public.prayers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas orações" ON public.prayers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar suas orações" ON public.prayers FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies para events
CREATE POLICY "Eventos são visíveis para todos" ON public.events FOR SELECT USING (true);
CREATE POLICY "Usuários podem criar seus eventos" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus eventos" ON public.events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus eventos" ON public.events FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies para likes e glories
CREATE POLICY "Likes são visíveis para todos" ON public.testimony_likes FOR SELECT USING (true);
CREATE POLICY "Usuários podem adicionar likes" ON public.testimony_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem remover seus likes" ON public.testimony_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Glórias são visíveis para todos" ON public.testimony_glories FOR SELECT USING (true);
CREATE POLICY "Usuários podem adicionar glórias" ON public.testimony_glories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem remover suas glórias" ON public.testimony_glories FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies para intercessors
CREATE POLICY "Intercessores são visíveis para todos" ON public.prayer_intercessors FOR SELECT USING (true);
CREATE POLICY "Usuários podem se tornar intercessores" ON public.prayer_intercessors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem deixar de interceder" ON public.prayer_intercessors FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies para participants
CREATE POLICY "Participantes são visíveis para todos" ON public.event_participants FOR SELECT USING (true);
CREATE POLICY "Usuários podem participar de eventos" ON public.event_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem cancelar participação" ON public.event_participants FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies para comments
CREATE POLICY "Comentários são visíveis para todos" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Usuários podem criar comentários" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus comentários" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus comentários" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies para followers
CREATE POLICY "Seguidores são visíveis para todos" ON public.followers FOR SELECT USING (true);
CREATE POLICY "Usuários podem seguir outros" ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Usuários podem deixar de seguir" ON public.followers FOR DELETE USING (auth.uid() = follower_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonies_updated_at BEFORE UPDATE ON public.testimonies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prayers_updated_at BEFORE UPDATE ON public.prayers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para criar perfil automaticamente ao registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Membro'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Índices para performance
CREATE INDEX idx_testimonies_user_id ON public.testimonies(user_id);
CREATE INDEX idx_testimonies_created_at ON public.testimonies(created_at DESC);
CREATE INDEX idx_prayers_user_id ON public.prayers(user_id);
CREATE INDEX idx_prayers_created_at ON public.prayers(created_at DESC);
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_event_date ON public.events(event_date);
CREATE INDEX idx_events_city ON public.events(city);
CREATE INDEX idx_comments_testimony_id ON public.comments(testimony_id);
CREATE INDEX idx_comments_prayer_id ON public.comments(prayer_id);
CREATE INDEX idx_comments_event_id ON public.comments(event_id);
CREATE INDEX idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX idx_followers_following_id ON public.followers(following_id);