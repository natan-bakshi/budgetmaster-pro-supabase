# משימות לביצוע

## ⚠️ אבטחה - דחוף!

### 1. שינוי סיסמת Postgres Database
**סטטוס:** ⛔ לא בוצע

**סיבה:** הסיסמה הנוכחית נוצרה בטעות ומכילה תווים לא תקינים

**פעולות:**
1. עבור ל-[Supabase Database Settings](https://supabase.com/project/xzsbrmxwvqnrxtqizfsw/settings/database)
2. לחץ על **Reset database password**
3. בחר סיסה חזקה חדשה (מומלץ: מינימום 16 תווים, אותיות + מספרים + תווים מיוחדים)
4. שמור את הסיסמה החדשה במנהל סיסמאות (1Password, LastPass, וכו')
5. עדכן את ה-connection string בכל מקום שבו השתמשת

---

## 🛠️ שיפורים טכניים

### 2. אימות Anon Key
**סטטוס:** ⚠️ לאימות

ה-Key הנוכחי `sb_publishable_...` נראה לא סטנדרטי (Supabase keys בדרך כלל מתחילים ב-`eyJ...`).

**אם האפליקציה לא מתחברת:**
1. עבור ל-[API Settings](https://supabase.com/project/xzsbrmxwvqnrxtqizfsw/settings/api)
2. העתק את **anon public** key מתחת ל-"Project API keys"
3. עדכן ב-`.env.local`:
   ```env
   VITE_SUPABASE_ANON_KEY=eyJxxxxxxx...
   ```
4. עדכן גם ב-Netlify Environment Variables

### 3. הוספת Email Verification
**סטטוס:** ⛔ לא בוצע

כרגע משתמשים יכולים להירשם בלי אימות מייל.

**להפעלה:**
1. עבור ל-[Authentication Settings](https://supabase.com/project/xzsbrmxwvqnrxtqizfsw/settings/auth)
2. במקטע **Email Auth** ודא ש-"Enable email confirmations" מסומן
3. הגדר **Site URL** ל-URL הסופי של האפליקציה (Netlify URL)
4. עדכן את `LoggedOutState.jsx` לטפל בהודעת "בדוק את המייל"

### 4. Password Reset Flow
**סטטוס:** ⛔ לא בוצע

הוסף קומפוננטה ל"שכחתי סיסמה" ב-`LoggedOutState.jsx`

---

## 📊 אנליטיקה ומוניטורינג

### 5. Sentry לדיווח שגיאות
**סטטוס:** ⛔ לא מותקן

התקנת Sentry למעקב אחר שגיאות ב-production:
```bash
npm install @sentry/react
```

### 6. Google Analytics / Plausible
**סטטוס:** ⛔ לא מותקן

הוסף analytics למעקב אחר שימוש ופעולות משתמשים.

---

## 📦 Backup & Recovery

### 7. גיבויים אוטומטיים
**סטטוס:** ✅ מופעל ב-Supabase (בתוכנית Pro)

ודא שהגיבויים פעילים ב-[Supabase Backups](https://supabase.com/project/xzsbrmxwvqnrxtqizfsw/settings/database)

---

## 🎨 UI/UX

### 8. Dark Mode
**סטטוס:** ⚠️ חלקי (יש next-themes אבל לא מושלם)

השלם את ה-toggle וודא שכל הקומפוננטות תומכות במצב כהה.

### 9. תמיכה במובייל
**סטטוס:** ✅ עובד

Responsive design מושלם, אבל בדוק שהכל עובד במכשירים שונים.

---

## 📢 תכונות עתידיות

### 10. שיתוף Household
אפשר למשתמשים להזמין אחרים ל-household שלהם.

### 11. ניתוחים מתקדמים
גרפים ודוחות עם Recharts.

### 12. ייצוא ל-PDF
ייצוא דוחות חודשיים ל-PDF או Excel.

### 13. תזכורות והתראות
שליחת התראות על חריגות מתוכננות או חריגה מתקציב.

---

## ✅ מה שכבר עובד

- ✅ מעבר מלא ל-Supabase
- ✅ Authentication (הרשמה/התחברות/יציאה)
- ✅ RLS Policies מוגדרים
- ✅ Entities layer עם Supabase
- ✅ כל הקומפוננטות עובדות
- ✅ Netlify config מוכן
- ✅ README מפורט
