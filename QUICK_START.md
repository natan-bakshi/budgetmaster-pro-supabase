# 🚀 Quick Start - התחל מייד

## כבר כל הכינויים מוכנים! ✅

### צעד 1: Pull + Install

```bash
cd budgetmaster-pro-supabase
git pull origin main
npm install
```

### צעד 2: הרץ SQL ב-Supabase

1. עבור ל: **[Supabase SQL Editor](https://supabase.com/project/xzsbrmxwvqnrxtqizfsw/editor)**
2. לחץ **New Query**
3. העתק את כל התוכן מ-`supabase-schema.sql`
4. לחץ **Run** (Ctrl+Enter)

### צעד 3: צור `.env.local`

צור קובץ `.env.local` בשורש הפרויקט:

```env
VITE_SUPABASE_URL=https://xzsbrmxwvqnrxtqizfsw.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_0uDhxiOJCx1wZnyHnZNogQ_wZvCFNKb
```

### צעד 4: הרץ!

```bash
npm run dev
```

🎉 **זהו!** פתח [http://localhost:5173](http://localhost:5173)

---

## Deploy ל-Netlify (5 דקות)

### אופציה 1: Dashboard (UI)

1. עבור ל-[Netlify](https://app.netlify.com/)
2. **Add new site** → **Import an existing project**
3. בחר `natan-bakshi/budgetmaster-pro-supabase`
4. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
5. **Environment variables:**
   - `VITE_SUPABASE_URL` = `https://xzsbrmxwvqnrxtqizfsw.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_0uDhxiOJCx1wZnyHnZNogQ_wZvCFNKb`
6. לחץ **Deploy**

### אופציה 2: CLI (3 פקודות)

```bash
npm install -g netlify-cli
netlify login
netlify init

netlify env:set VITE_SUPABASE_URL "https://xzsbrmxwvqnrxtqizfsw.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "sb_publishable_0uDhxiOJCx1wZnyHnZNogQ_wZvCFNKb"

npm run build
netlify deploy --prod
```

---

## ✅ בדיקת תקינות

1. פתח את האפליקציה
2. לחץ על "הרשמה"
3. הזן אימייל וסיסמה (6+ תווים)
4. בדוק מייל אימות
5. התחבר ונסה ליצור חשבון

אם הכל עובד - מזל טוב! 🎉

---

## ⚠️ משימות קריטיות

ראה `TODO.md` למשימות שצריך לבצע:
- 🔐 **שינוי סיסמת Postgres** (דחוף!)
- 📧 הפעלת email verification
- 🔑 Password reset flow

---

## 🐛 בעיות?

1. בדוק Console (F12) בדפדפן
2. ודא ש-SQL רץ בהצלחה
3. ודא שמשתני הסביבה נכונים
4. בדוק ש-RLS פעיל בטבלאות

---

## 📚 מסמכים נוספים

- `README.md` - מדריך מפורט
- `SETUP.md` - הוראות התקנה מלאות
- `TODO.md` - משימות לעתיד
- `supabase-schema.sql` - סכמת ה-DB
