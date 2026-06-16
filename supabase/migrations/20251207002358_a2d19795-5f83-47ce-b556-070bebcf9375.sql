-- Add private room support with password
ALTER TABLE public.chat_rooms 
ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS password_hash text DEFAULT NULL;

-- Add message status for delivery tracking
ALTER TABLE public.chat_room_messages 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'sent';

-- Add status to direct messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'sent';