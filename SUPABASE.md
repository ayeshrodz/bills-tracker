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

## RPC: `get_bills_summary`

Use the SQL below (no dynamic SQL required). It safely checks each filter key in JSON and applies the condition when present. If you previously created a different version, run the `DROP FUNCTION` statement first, then create the new one.

```sql
drop function if exists public.get_bills_summary(jsonb);

create or replace function public.get_bills_summary(filters jsonb)
returns table (
  total_count bigint,
  total_amount numeric,
  latest_bill jsonb
)
language plpgsql
security definer
as $$
begin
  return query
  with filtered as (
    select *
    from bills
    where (coalesce(filters->>'category','') = '' or bill_type = filters->>'category')
      and (coalesce(filters->>'billingMonth','') = '' or billing_month = (filters->>'billingMonth')::int)
      and (coalesce(filters->>'billingYear','') = '' or billing_year = (filters->>'billingYear')::int)
      and (coalesce(filters->>'dateFrom','') = '' or payment_date >= (filters->>'dateFrom')::date)
      and (coalesce(filters->>'dateTo','') = '' or payment_date <= (filters->>'dateTo')::date)
      and (coalesce(filters->>'amountMin','') = '' or amount >= (filters->>'amountMin')::numeric)
      and (coalesce(filters->>'amountMax','') = '' or amount <= (filters->>'amountMax')::numeric)
  )
  select
    (select count(*) from filtered) as total_count,
    coalesce((select sum(amount) from filtered), 0) as total_amount,
    (
      select to_jsonb(sub)
      from (
        select *
        from filtered
        order by payment_date desc, billing_year desc, billing_month desc, inserted_at desc
        limit 1
      ) sub
    ) as latest_bill;
end;
$$;
```

Re-run this statement anytime you change the filters or return shape. No helper function is required.
> If you previously created an older version, re-run the DROP + CREATE statements above to replace it. No extra cleanup is necessary.

### Manual Verification
In the SQL editor you can run:
```sql
select * from public.get_bills_summary('{}'::jsonb);
select * from public.get_bills_summary('{"category":"Internet"}'::jsonb);
```
to confirm the RPC returns the expected totals before wiring up the frontend.

After running these statements, the frontend can call `supabase.rpc("get_bills_summary", { filters })`.

## Realtime Setup

1. In the Supabase dashboard, navigate to **Database → Replication → Realtime**.
2. Enable Realtime for the `public.bills` table.
3. The frontend subscribes via:
   ```ts
   supabase
     .channel(`public:bills:${user.id}`)
     .on(
       "postgres_changes",
       { event: "*", schema: "public", table: "bills", filter: `user_id=eq.${user.id}` },
       () => { /* refresh data */ }
     )
     .subscribe();
   ```
4. RLS already limits each user to their own rows, so Realtime events will only emit for the authenticated user.
