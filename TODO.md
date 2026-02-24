# משימות לביצוע

## ⚠️ אבטחה - דחוף!

### 1. ~~שינוי סיסמת Postgres Database~~
**סטטוס:** ✅ **הושלם!**

**סיסמה חדשה:** `Natib8000@gmail.com`

✅ הסיסמה עודכנה בהצלחה ב-[Database Settings](https://supabase.com/project/xzsbrmxwvqnrxtqizfsw/settings/database)

**Connection String עודכן:**
```
postgresql://postgres:Natib8000@gmail.com@db.xzsbrmxwvqnrxtqizfsw.supabase.co:5432/postgres
```

---

## 🛠️ שיפורים טכניים

### 2. אימות Anon Key
**סטטוס:** ✅ **תקין**

ה-Key הנוכחי `sb_publishable_...` הוא הפורמט החדש של Supabase והוא תקין לחלוטין.

אם בכל זאת יש בעיות חיבור:
1. עבור ל-[API Settings](https://supabase.com/project/xzsbrmxwvqnrxtqizfsw/settings/api)
2. ודא שה-**anon public key** זהה למה שב-.env

### 3. הוספת Email Verification
**סטטוס:** ⚠️ לא בוצע

כרגע משתמשים יכולים להירשם בלי אימות מייל.

**להפעלה:**
1. עבור ל-[Authentication Settings](https://supabase.com/project/xzsbrmxwvqnrxtqizfsw/settings/auth)
2. במקטע **Email Auth** ודא ש-"Enable email confirmations" מסומן
3. הגדר **Site URL** ל-URL הסופי של האפליקציה (Netlify URL)
4. עדכן את `LoggedOutState.jsx` לטפל בהודעת "בדוק את המייל"

### 4. Password Reset Flow
**סטטוס:** ⚠️ לא בוצע

הוסף קומפוננטה ל"שכחתי סיסמה" ב-`LoggedOutState.jsx`

**דוגמה:**
```jsx
const handlePasswordReset = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) {
    setError(error.message)
  } else {
    alert('נשלח לינק לאיפוס סיסמה למייל')
  }
}
```

### 5. הגנה על Environment Variables
**סטטוס:** ✅ חלקי

`.env.local` ב-`.gitignore` ✅
אבל `.env.example` מכיל את הערכים האמיתיים ⚠️

**לתיקון:**
עדכן את `.env.example` להסיר את הערכים האמיתיים:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 📊 אנליטיקה ומוניטורינג

### 6. Sentry לדיווח שגיאות
**סטטוס:** ⚠️ לא מותקן

התקנת Sentry למעקב אחר שגיאות ב-production:
```bash
npm install @sentry/react
```

### 7. Google Analytics / Plausible
**סטטוס:** ⚠️ לא מותקן

הוסף analytics למעקב אחר שימוש ופעולות משתמשים.

---

## 📦 Backup & Recovery

### 8. גיבויים אוטומטיים
**סטטוס:** ✅ מופעל ב-Supabase (בתוכנית Free)

ודא שהגיבויים פעילים ב-[Supabase Backups](https://supabase.com/project/xzsbrmxwvqnrxtqizfsw/settings/database)

**ב-Free Plan:**
- גיבוי אוטומטי יומי
- שמירה ל-7 ימים

**ב-Pro Plan ($25/חודש):**
- גיבוי כל שעה
- שמירה ל-30 ימים
- Point-in-time recovery

---

## 🎨 UI/UX

### 9. Dark Mode
**סטטוס:** ⚠️ חלקי (יש next-themes אבל לא מושלם)

השלם את ה-toggle ווודא שכל הקומפוננטות תומכות במצב כהה.

### 10. תמיכה במובייל
**סטטוס:** ✅ עובד

Responsive design מושלם, אבל בדוק שהכל עובד במכשירים שונים.

### 11. Progressive Web App (PWA)
**סטטוס:** ⚠️ לא מוגדר

הוסף manifest.json ו-service worker להפיכת האפליקציה ל-PWA:
```bash
npm install vite-plugin-pwa
```

---

## 📢 תכונות עתידיות

### 12. שיתוף Household
**סטטוס:** ⚠️ לא מיושם

אפשר למשתמשים להזמין אחרים ל-household שלהם:
- שליחת הזמנות במייל
- ניהול הרשאות (admin/member)
- היסטוריית שינויים

### 13. ניתוחים מתקדמים
**סטטוס:** ⚠️ לא מיושם

גרפים ודוחות עם Recharts:
- מגמות הוצאות לאורך זמן
- השוואה בין חודשים
- חלוקה לפי קטגוריות
- ניבוי הוצאות עתידיות

### 14. ייצוא לPDF/Excel
**סטטוס:** ⚠️ לא מיושם

ייצוא דוחות חודשיים:
- PDF עם לוגו ועיצוב
- Excel לניתוח נוסף
- שליחה במייל אוטומטית

### 15. תזכורות והתראות
**סטטוס:** ⚠️ לא מיושם

שליחת התראות:
- חריגות מתוכננות
- חריגה מתקציב
- תזכורות לתשלומים
- התראות Push (PWA)

### 16. סנכרון עם בנקים
**סטטוס:** 💡 רעיון

אינטגרציה עם API בנקאי לייבוא אוטומטי של עסקאות:
- Plaid API
- Salt Edge
- TrueLayer

### 17. מצב Offline
**סטטוס:** ⚠️ לא מיושם

עבודה ללא אינטרנט עם Service Worker:
- שמירה מקומית
- סנכרון כשחוזרים online
- Cache של נתונים

---

## ✅ מה שכבר עובד

- ✅ מעבר מלא ל-Supabase
- ✅ Authentication (הרשמה/התחברות/יציאה)
- ✅ RLS Policies מוגדרים
- ✅ Entities layer עם Supabase
- ✅ כל הקומפוננטות עובדות
- ✅ Netlify config מוכן
- ✅ README מפורט
- ✅ סיסמת Postgres עודכנה ✨

---

## 📋 סדר עדיפויות מומלץ

### דחוף (השבוע):
1. ~~✅ שינוי סיסמת Postgres~~ **הושלם!**
2. ⚠️ עדכון `.env.example` להסרת ערכים אמיתיים
3. ⚠️ הפעלת Email Verification

### חשוב (השבועיים הקרובים):
4. Password Reset Flow
5. PWA setup
6. Sentry integration

### Nice to have (בעתיד):
7. ניתוחים מתקדמים
8. שיתוף Household
9. ייצוא PDF
10. אינטגרציה בנקאית
