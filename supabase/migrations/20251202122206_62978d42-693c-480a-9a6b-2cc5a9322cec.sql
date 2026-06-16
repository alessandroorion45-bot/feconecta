-- Criar tabela de salas de chat
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de membros das salas
CREATE TABLE public.chat_room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Criar tabela de mensagens das salas
CREATE TABLE public.chat_room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_messages ENABLE ROW LEVEL SECURITY;

-- Policies para chat_rooms
CREATE POLICY "Users can view rooms they are members of"
ON public.chat_rooms FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.chat_room_members WHERE room_id = chat_rooms.id AND user_id = auth.uid())
  OR created_by = auth.uid()
);

CREATE POLICY "Authenticated users can create rooms"
ON public.chat_rooms FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creators can update rooms"
ON public.chat_rooms FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Room creators can delete rooms"
ON public.chat_rooms FOR DELETE
USING (auth.uid() = created_by);

-- Policies para chat_room_members
CREATE POLICY "Members can view room members"
ON public.chat_room_members FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.chat_room_members crm WHERE crm.room_id = chat_room_members.room_id AND crm.user_id = auth.uid())
);

CREATE POLICY "Users can join rooms"
ON public.chat_room_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
ON public.chat_room_members FOR DELETE
USING (auth.uid() = user_id);

-- Policies para chat_room_messages
CREATE POLICY "Members can view room messages"
ON public.chat_room_messages FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.chat_room_members WHERE room_id = chat_room_messages.room_id AND user_id = auth.uid())
);

CREATE POLICY "Members can send messages"
ON public.chat_room_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM public.chat_room_members WHERE room_id = chat_room_messages.room_id AND user_id = auth.uid())
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_room_messages;

-- Indexes para performance
CREATE INDEX idx_chat_room_members_room_id ON public.chat_room_members(room_id);
CREATE INDEX idx_chat_room_members_user_id ON public.chat_room_members(user_id);
CREATE INDEX idx_chat_room_messages_room_id ON public.chat_room_messages(room_id);
CREATE INDEX idx_chat_room_messages_created_at ON public.chat_room_messages(created_at DESC);