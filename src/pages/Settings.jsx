import React from 'react';
import { useTheme } from '@/themeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Moon, Monitor } from 'lucide-react';

const options = [
  { value: 'light', label: 'בהיר', icon: Sun,     desc: 'תמיד מצב בהיר' },
  { value: 'dark',  label: 'כהה',  icon: Moon,    desc: 'תמיד מצב כהה' },
  { value: 'system',label: 'לפי המכשיר', icon: Monitor, desc: 'מתאים אוטומטית לבחירת המערכת' },
];

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4" dir="rtl">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">הגדרות</h1>
          <p className="text-slate-600 dark:text-slate-400">הגדרות תצוגה ואפשרויות כלליות</p>
        </div>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-slate-100">
              <Moon className="w-5 h-5" />
              מצב תצוגה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {options.map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  aria-pressed={theme === value}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right w-full
                    ${
                      theme === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 bg-white dark:bg-slate-700'
                    }`}
                >
                  <Icon className={`w-6 h-6 shrink-0 ${
                    theme === value ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                  }`} />
                  <div className="flex-1">
                    <div className={`font-semibold ${
                      theme === value ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'
                    }`}>{label}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{desc}</div>
                  </div>
                  {theme === value && (
                    <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
