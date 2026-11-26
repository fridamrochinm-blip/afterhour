-- AFTER HOUR · Tarjetas digitales NFC
-- Pega todo este archivo en Supabase › SQL Editor › New query › Run.

-- ─────────────────────────────────────────────
-- Tarjetas (una por persona / lanyard)
-- ─────────────────────────────────────────────
create table if not exists public.cards (
  id          uuid primary key default gen_random_uuid(),
  token       text not null unique check (char_length(token) >= 16),   -- va grabado en el chip
  lanyard_no  text unique,                                             -- número impreso en el lanyard
  user_id     uuid unique references auth.users(id) on delete set null, -- se liga al primer login
  email       text not null unique check (email = lower(email)),
  name        text not null check (char_length(name) between 1 and 80),
  phone       text check (char_length(phone) <= 30),
  title       text check (char_length(title) <= 80),
  company     text check (char_length(company) <= 80),
  bio         text check (char_length(bio) <= 160),
  instagram   text check (char_length(instagram) <= 60),
  linkedin    text check (char_length(linkedin) <= 200),
  website     text check (char_length(website) <= 200),
  photo_url   text,
  show_phone  boolean not null default true,
  show_email  boolean not null default true,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Administradores (tú y quien tú agregues)
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Protección: el miembro NO puede cambiar correo, token,
-- número de lanyard, dueño ni estatus, aunque lo intente.
-- ─────────────────────────────────────────────
create or replace function public.protect_card_columns()
returns trigger language plpgsql as $$
begin
  if current_user = 'authenticated' then
    new.token      := old.token;
    new.lanyard_no := old.lanyard_no;
    new.user_id    := old.user_id;
    new.email      := old.email;
    new.active     := old.active;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists cards_protect on public.cards;
create trigger cards_protect before update on public.cards
for each row execute function public.protect_card_columns();

-- ─────────────────────────────────────────────
-- Row Level Security
-- La tarjeta pública y el panel admin se leen desde el servidor
-- con la service role key (nunca desde el navegador).
-- ─────────────────────────────────────────────
alter table public.cards  enable row level security;
alter table public.admins enable row level security;

drop policy if exists "member reads own card"   on public.cards;
drop policy if exists "member updates own card" on public.cards;
drop policy if exists "admin reads own row"     on public.admins;

create policy "member reads own card" on public.cards
  for select to authenticated using (user_id = auth.uid());

create policy "member updates own card" on public.cards
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "admin reads own row" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- Sin políticas de insert/delete: solo el servidor (admin) crea o borra.

-- ─────────────────────────────────────────────
-- Fotos de perfil (Storage)
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 4194304, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "upload own photo" on storage.objects;
drop policy if exists "update own photo" on storage.objects;
drop policy if exists "delete own photo" on storage.objects;

create policy "upload own photo" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "update own photo" on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "delete own photo" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
