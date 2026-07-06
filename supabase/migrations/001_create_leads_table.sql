`-- Create saved_searches table
create table if not exists saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  search_id text not null,
  query text not null,
  category text not null,
  city text not null,
  area text,
  country text,
  industry text,
  lead_count integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists saved_searches_search_id_unique on saved_searches(search_id);
create index if not exists saved_searches_user_id_idx on saved_searches(user_id);

-- Create saved_leads table
create table if not exists saved_leads (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  search_id text not null,
  business_name text not null,
  category text not null,
  address text not null,
  city text not null,
  phone text,
  email text,
  website text,
  rating real,
  reviews integer,
  google_maps_link text,
  business_status text,
  lead_score integer not null default 0,
  priority text not null default 'low',
  website_status text not null default 'not_checked',
  weak_digital_presence boolean not null default false,
  search_params jsonb,
  created_at timestamptz not null default now()
);

create index if not exists saved_leads_user_id_idx on saved_leads(user_id);
create index if not exists saved_leads_search_id_idx on saved_leads(search_id);
create index if not exists saved_leads_created_at_idx on saved_leads(created_at desc);

-- Disable RLS so the anon key can read/write (auth is handled by Clerk on the API layer)
alter table saved_searches disable row level security;
alter table saved_leads disable row level security;
`