# 🐛 פתרון בעיות התחברות

## בעיה: מתחבר אבל לא עובר לדשבורד

### סיבה:
הטריגר `handle_new_user()` לא רץ, או שה-profile/household לא נוצרו.

---

## פתרון 1: בדיקת הטבלאות

### 1. עבור ל-Supabase Table Editor
[https://supabase.com/project/xzsbrmxwvqnrxtqizfsw/editor](https://supabase.com/project/xzsbrmxwvqnrxtqizfsw/editor)

### 2. בדוק את הטבלה `profiles`
- האם יש שורה עם המייל שלך?
- האם יש `household_id`?

### 3. בדוק את הטבלה `households`
- האם נוצר household בכלל?

---

## פתרון 2: יצירה ידנית של Profile + Household

### אם הטריגר לא עבד, הרץ את זה ב-SQL Editor:

```sql
-- 1. מצא את ה-user ID שלך
SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL@gmail.com';

-- 2. שמור את ה-ID והרץ (החלף את YOUR_USER_ID ו-YOUR_EMAIL):
DO $$
DECLARE
  new_household_id uuid;
  user_id uuid := 'YOUR_USER_ID'::uuid;  -- הדבק את ה-ID משלב 1
  user_email text := 'YOUR_EMAIL@gmail.com';
  user_name text := 'Your Name';
BEGIN
  -- יצירת household
  INSERT INTO public.households (name, reset_day)
  VALUES (user_name || '''s Household', 1)
  RETURNING id INTO new_household_id;

  -- יצירת profile
  INSERT INTO public.profiles (id, email, full_name, household_id, role)
  VALUES (user_id, user_email, user_name, new_household_id, 'admin')
  ON CONFLICT (id) DO UPDATE
  SET household_id = new_household_id, role = 'admin';
  
  RAISE NOTICE 'Created household % and profile for user %', new_household_id, user_id;
END $$;
```

### 3. אחרי הריצה - נסה שוב להתחבר

---

## פתרון 3: בדיקת RLS Policies

### ודא ש-RLS פעיל:

```sql
-- בדוק אם RLS פעיל
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'households', 'accounts', 'categories');

-- הכל צריך להיות rowsecurity = true
```

### בדוק policies:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## פתרון 4: בדיקת Console בדפדפן

### 1. פתח Developer Tools (F12)
### 2. עבור ל-Console
### 3. נסה להתחבר וראה את השגיאות

חפש את:
- `Error fetching user`
- `No household found`
- `RLS policy violation`

---

## פתרון 5: איפוס מלא של הטריגר

### אם הטריגר לא עובד כלל, מחק וצור מחדש:

```sql
-- מחק את הטריגר הקיים
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- צור מחדש
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_household_id uuid;
begin
  -- יצירת household
  insert into public.households (name, reset_day)
  values (coalesce(new.raw_user_meta_data->>'full_name', 'My') || '''s Household', 1)
  returning id into new_household_id;

  -- יצירת profile
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

-- צור את הטריגר
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## פתרון 6: Email Confirmation לא מופעל

### אם אתה רוצה להישאר בלי אימות מייל (לפיתוח):

1. עבור ל-[Auth Settings](https://supabase.com/project/xzsbrmxwvqnrxtqizfsw/settings/auth)
2. במקטע **Email** הסר את הסימון מ-"Enable email confirmations"
3. שמור
4. הירשם מחדש או אמת את המשתמש ידנית

---

## פתרון מהיר: מחק והירשם מחדש

```sql
-- מחק את המשתמש (זה ימחק גם profile ו-household בגלל CASCADE)
DELETE FROM auth.users WHERE email = 'YOUR_EMAIL@gmail.com';
```

אחרי המחיקה, הירשם שוב באפליקציה.

---

## אם שום דבר לא עובד

שלח לי צילום מסך של:
1. Console errors (F12 → Console)
2. Network tab בזמן ההתחברות
3. הטבלאות `profiles` ו-`households` ב-Supabase
