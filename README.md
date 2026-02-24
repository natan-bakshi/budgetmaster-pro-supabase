# BudgetMaster Pro - Supabase Edition

אפליקציית ניהול תקציב ביתי מתקדמת עם Supabase.

## התקנה מקומית

### 1. Clone הפרויקט
```bash
git clone https://github.com/natan-bakshi/budgetmaster-pro-supabase.git
cd budgetmaster-pro-supabase
```

### 2. התקנת Dependencies
```bash
npm install
```

### 3. הגדרת Supabase

#### יצירת פרויקט Supabase
1. עבור ל-[Supabase Dashboard](https://supabase.com/dashboard)
2. צור פרויקט חדש
3. שמור את ה-URL וה-Anon Key

#### הרצת SQL Schema
1. בפאנל של Supabase, עבור ל-**SQL Editor**
2. העתק והרץ את הסכמה הבאה:

```sql
create extension if not exists "uuid-ossp";

create table public.households (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  reset_day integer default 1,
  created_at timestamptz default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  household_id uuid references public.households(id),
  role text default 'admin',
  last_reset_check timestamptz,
  created_at timestamptz default now()
);

create table public.accounts (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references public.households(id) on delete cascade,
  name text not null,
  balance numeric default 0,
  created_at timestamptz default now()
);

create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references public.households(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  default_amount numeric default 0,
  account_id uuid references public.accounts(id),
  execution_date text,
  "order" integer default 0,
  created_at timestamptz default now()
);

create table public.category_instances (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.categories(id) on delete cascade,
  household_id uuid references public.households(id) on delete cascade,
  month text not null,
  current_amount numeric default 0,
  notes text default '',
  created_at timestamptz default now()
);

create table public.monthly_history (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references public.households(id) on delete cascade,
  month text not null,
  total_income numeric default 0,
  total_expenses numeric default 0,
  balance numeric default 0,
  created_at timestamptz default now()
);

create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.categories(id),
  account_id uuid references public.accounts(id),
  household_id uuid references public.households(id) on delete cascade,
  amount numeric not null,
  date timestamptz,
  scheduled_date timestamptz,
  type text check (type in ('income', 'expense')),
  notes text,
  is_automatic boolean default false,
  is_executed boolean default false,
  created_at timestamptz default now()
);

-- Trigger for creating household and profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_household_id uuid;
begin
  insert into public.households (name, reset_day)
  values (coalesce(new.raw_user_meta_data->>'full_name', 'My') || '''s Household', 1)
  returning id into new_household_id;

  insert into public.profiles (id, email, full_name, household_id, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new_household_id,
    'admin'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.category_instances enable row level security;
alter table public.monthly_history enable row level security;
alter table public.transactions enable row level security;

-- RLS Policies
create policy "profile_select" on public.profiles for select
  using (household_id in (select household_id from public.profiles where id = auth.uid()));
create policy "profile_update" on public.profiles for update
  using (household_id in (select household_id from public.profiles where id = auth.uid()));
create policy "profile_insert" on public.profiles for insert
  with check (id = auth.uid());

create policy "household_all" on public.households for all
  using (id in (select household_id from public.profiles where id = auth.uid()));

create policy "accounts_all" on public.accounts for all
  using (household_id in (select household_id from public.profiles where id = auth.uid()));

create policy "categories_all" on public.categories for all
  using (household_id in (select household_id from public.profiles where id = auth.uid()));

create policy "instances_all" on public.category_instances for all
  using (household_id in (select household_id from public.profiles where id = auth.uid()));

create policy "history_all" on public.monthly_history for all
  using (household_id in (select household_id from public.profiles where id = auth.uid()));

create policy "transactions_all" on public.transactions for all
  using (household_id in (select household_id from public.profiles where id = auth.uid()));
```

### 4. הגדרת Environment Variables

צור קובץ `.env.local` בשורש הפרויקט:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. הרצה מקומית

```bash
npm run dev
```

האפליקציה תהיה זמינה ב-`http://localhost:5173`

## Deploy ל-Netlify

### דרך Netlify Dashboard

1. עבור ל-[Netlify](https://app.netlify.com/)
2. לחץ על **Add new site** > **Import an existing project**
3. בחר את הריפו `budgetmaster-pro-supabase`
4. הגדרות Build:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. הוסף Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. לחץ **Deploy site**

### דרך CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:set VITE_SUPABASE_URL "https://your-project.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key"
npm run build
netlify deploy --prod
```

## מבנה הפרויקט

```
src/
├── components/     # React components
├── entities/       # Supabase data layer
├── hooks/          # Custom React hooks
├── lib/            # Auth, utils, Supabase client
├── pages/          # Page components
└── App.jsx         # Main app component
```

## טכנולוגיות

- **React** - UI Framework
- **Vite** - Build tool
- **Supabase** - Backend (Auth, Database, RLS)
- **Tailwind CSS** - Styling
- **React Query** - Server state management
- **React Router** - Client-side routing
- **Radix UI** - Accessible UI primitives

## תכונות

✅ אימות משתמשים (הרשמה/התחברות)
✅ ניהול תקציב חודשי
✅ מעקב הכנסות והוצאות
✅ חשבונות וקטגוריות
✅ היסטוריה חודשית
✅ ייצוא נתונים
✅ תמיכה ב-RTL (עברית)

## License

MIT
