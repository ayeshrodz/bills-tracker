# Supabase Setup Guide

This document explains how to bootstrap the database, storage bucket, and Row Level Security (RLS) policies required by the Bills Tracker app. Execute the SQL snippets in the Supabase SQL Editor for your project.

## Environment Variables

Add the following keys to your `.env` (already referenced in `src/config/index.ts`):

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
# Optional: override if you prefer a different bucket name
VITE_SUPABASE_BUCKET=bill-attachments
```

## Database Schema

Some non-sensitive defaults (bucket name, signed URL TTL) live in `config/app.config.json`. Adjust that file if you need different values per environment.

### 1. Bills

```sql
create table if not exists public.bills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bill_type text not null,
  billing_month smallint not null check (billing_month between 1 and 12),
  billing_year smallint not null,
  payment_date date not null,
  amount numeric(12,2) not null check (amount >= 0),
  note text,
  inserted_at timestamptz not null default now()
);
```

### 2. Bill Attachments

```sql
create table if not exists public.bill_attachments (
  id uuid primary key default uuid_generate_v4(),
  bill_id uuid not null references public.bills(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_type text not null default 'other',
  file_name text not null,
  file_path text not null unique,
  mime_type text,
  size_bytes bigint,
  uploaded_at timestamptz not null default now()
);
```

### 3. Bill Categories

```sql
create table if not exists public.bill_categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null check (length(name) > 0),
  inserted_at timestamptz not null default now()
);

insert into public.bill_categories (name)
  values ('House Rent'), ('Electricity'), ('Internet'), ('Mobile'), ('Groceries')
on conflict (name) do nothing;
```

## Row Level Security Policies

Enable RLS on each table and apply the policies below.

```sql
alter table public.bills enable row level security;
alter table public.bill_attachments enable row level security;
alter table public.bill_categories enable row level security;
```

### Bills Policies

```sql
create policy "Users view their bills"
on public.bills for select
using (auth.uid() = user_id);

create policy "Users manage their bills"
on public.bills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### Bill Attachments Policies

```sql
create policy "Users view their attachments"
on public.bill_attachments for select
using (auth.uid() = user_id);

create policy "Users manage their attachments"
on public.bill_attachments for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

### Categories Policies

```sql
create policy "Users view defaults + their categories"
on public.bill_categories for select
using (user_id is null or auth.uid() = user_id);

create policy "Users manage their categories"
on public.bill_categories for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

## Storage Bucket

Create a private bucket for attachments (name must match `VITE_SUPABASE_BUCKET` or the value in `config/app.config.json`, default `bill-attachments`):

```sql
select storage.create_bucket('bill-attachments', true, 'private');
```

Add storage policies so each user only accesses their own files:

```sql
create policy "Users view their files"
on storage.objects for select
using (bucket_id = 'bill-attachments' and auth.uid() = owner);

create policy "Users manage their files"
on storage.objects for all
using (bucket_id = 'bill-attachments' and auth.uid() = owner)
with check (bucket_id = 'bill-attachments' and auth.uid() = owner);
```

> Note: `owner` is automatically populated by Supabase Storage when uploading via authenticated clients.

## Verification Checklist

1. Run all SQL sections above.
2. Confirm the bucket exists under **Storage** and that RLS policies appear under **Policies** for each table.
3. Create a test user, sign in locally, and ensure you can add bills, attachments, and categories without API errors.
