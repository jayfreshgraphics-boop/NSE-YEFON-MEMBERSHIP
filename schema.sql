-- NSE Ikeja Branch — Graduate Member Onboarding Portal
-- Run this in your new Supabase project's SQL Editor (Database > SQL Editor > New query)

create table members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  full_name text not null,
  email text not null,
  phone text not null,

  confirmation_code text not null,
  code_status text not null default 'pending',      -- pending | approved | rejected

  certificate_url text,
  cert_status text not null default 'pending',       -- pending | approved | rejected

  social_proof_url text,
  social_status text not null default 'pending',     -- pending | approved | rejected

  receipt_url text,
  payment_status text not null default 'pending',    -- pending | approved | rejected

  overall_status text not null default 'pending',    -- pending | approved | rejected
  member_id text,                                     -- assigned once fully approved

  admin_notes text
);

-- Storage buckets for uploaded files (certificates, screenshots, receipts)
insert into storage.buckets (id, name, public) values ('member-uploads', 'member-uploads', true)
on conflict (id) do nothing;

-- Allow public inserts (registration form has no login) and public read of own uploads
alter table members enable row level security;

create policy "Anyone can register" on members
  for insert to anon
  with check (true);

create policy "Anyone can view their own status by id" on members
  for select to anon
  using (true);

-- Admin updates happen via the dashboard using the service role key in a Netlify Function,
-- so no anon UPDATE policy is needed — keep step-approval server-side only.

create policy "Public can upload files" on storage.objects
  for insert to anon
  with check (bucket_id = 'member-uploads');

create policy "Public can read files" on storage.objects
  for select to anon
  using (bucket_id = 'member-uploads');

-- Auto-generate member_id + update overall_status when all 4 steps are approved
create or replace function check_full_approval()
returns trigger as $$
begin
  if new.code_status = 'approved'
     and new.cert_status = 'approved'
     and new.social_status = 'approved'
     and new.payment_status = 'approved'
     and new.overall_status <> 'approved' then
    new.overall_status := 'approved';
    new.member_id := 'NSEIK-' || to_char(now(), 'YYYY') || '-' || substr(new.id::text, 1, 6);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_check_full_approval
before update on members
for each row execute function check_full_approval();
