# הגדרת הפרויקט - מדריך צעד אחר צעד

## ✅ שלב 1: Pull את הקוד

```bash
cd budgetmaster-pro-supabase
git pull origin main
npm install
```

## ✅ שלב 2: הגדרת Supabase Database

### 2.1 כניסה ל-Supabase Dashboard
עבור ל: [https://supabase.com/project/xzsbrmxwvqnrxtqizfsw](https://supabase.com/project/xzsbrmxwvqnrxtqizfsw)

### 2.2 הרצת SQL Schema
1. לחץ על **SQL Editor** בתפריט הצד
2. לחץ על **New Query**
3. העתק את כל התוכן מהקובץ `supabase-schema.sql` (בשורש הפרויקט)
4. לחץ על **Run** (או Ctrl+Enter)

זה ייצור את כל הטבלאות, הטריגרים וה-RLS policies.

## ✅ שלב 3: הגדרת משתני סביבה

### 3.1 פיתוח לוקלי
צור קובץ `.env.local` בשורש הפרויקט:

```env
VITE_SUPABASE_URL=https://xzsbrmxwvqnrxtqizfsw.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_0uDhxiOJCx1wZnyHnZNogQ_wZvCFNKb
```

### 3.2 Production (Netlify)
בהגדרות Netlify → Environment Variables, הוסף:
- `VITE_SUPABASE_URL` = `https://xzsbrmxwvqnrxtqizfsw.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `sb_publishable_0uDhxiOJCx1wZnyHnZNogQ_wZvCFNKb`

## ✅ שלב 4: הרצה לוקלית

```bash
npm run dev
```

פתח דפדפן ב-[http://localhost:5173](http://localhost:5173)

## ✅ שלב 5: Deploy ל-Netlify

### אופציה 1: דרך Dashboard
1. עבור ל-[Netlify Dashboard](https://app.netlify.com/)
2. **Add new site** → **Import an existing project**
3. בחר את `natan-bakshi/budgetmaster-pro-supabase`
4. הגדרות:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. **Environment variables** (לחץ על Advanced):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. **Deploy site**

### אופציה 2: דרך CLI
```bash
npm install -g netlify-cli
netlify login
netlify init

# הוסף משתני סביבה
netlify env:set VITE_SUPABASE_URL "https://xzsbrmxwvqnrxtqizfsw.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "sb_publishable_0uDhxiOJCx1wZnyHnZNogQ_wZvCFNKb"

# Build ו-Deploy
npm run build
netlify deploy --prod
```

## 🔐 משימות אבטחה להמשך

### ⚠️ שינוי סיסמת Postgres
1. עבור ל-[Supabase Dashboard](https://supabase.com/project/xzsbrmxwvqnrxtqizfsw/settings/database)
2. **Database Settings** → **Database password**
3. לחץ על **Reset database password**
4. בחר סיסמה חזקה חדשה
5. עדכן את ה-connection strings במקומות שבהם השתמשת

### 🔑 חידוש Anon Key (אם נדרש)
אם ה-`sb_publishable_...` לא עובד:
1. עבור ל-[API Settings](https://supabase.com/project/xzsbrmxwvqnrxtqizfsw/settings/api)
2. העתק את **anon public key** (מתחת ל-Project API keys)
3. עדכן ב-.env.local ובהגדרות Netlify

## ✅ בדיקת תקינות

### בדוק שהכל עובד:
1. ✅ הרשמה של משתמש חדש
2. ✅ יצירת household אוטומטית
3. ✅ גישה לדשבורד
4. ✅ יצירת חשבון ראשון
5. ✅ יצירת קטגוריה

אם הכל עובד - הפרויקט מוכן לשימוש! 🎉

## 📞 תמיכה

אם משהו לא עובד:
1. בדוק את ה-Console בדפדפן (F12)
2. בדוק שה-SQL Schema רץ בהצלחה
3. בדוק שמשתני הסביבה מוגדרים נכון
4. ודא שה-RLS policies פעילות בטבלאות
