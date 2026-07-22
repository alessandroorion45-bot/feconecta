-- Permite ao dono do perfil fixar um depoimento no topo da lista.
alter table public.friend_testimonials
  add column if not exists is_pinned boolean not null default false;
