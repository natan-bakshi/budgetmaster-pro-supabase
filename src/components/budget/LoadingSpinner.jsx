import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]" dir="rtl">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
        <p className="text-slate-700 dark:text-slate-300 text-lg">טוען נתונים...</p>
      </div>
    </div>
  );
}