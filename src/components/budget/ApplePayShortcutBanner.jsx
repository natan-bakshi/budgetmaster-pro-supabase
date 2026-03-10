import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Smartphone } from 'lucide-react';

const DISMISSED_KEY = 'shortcut_banner_dismissed';

// Detect iOS (iPhone/iPad)
const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export default function ApplePayShortcutBanner({ supabaseUrl, anonKey }) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1'
  );

  // Show only on iOS and only if not yet dismissed
  if (!isIOS() || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  // Deep-link to the Shortcut file hosted in the repo (public folder)
  const shortcutUrl = `${window.location.origin}/ApplePayBudget.shortcut`;

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-slate-700 dark:border-slate-600 mb-4">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start gap-3" dir="rtl">
          <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-1">
              הוסף עסקאות מהיר מ-Apple Pay 🍎
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              הורד קיצור דרך ל-iPhone — אחרי כל תשלום תוכל לתעד אותו בשתי הקשות.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                onClick={() => window.open(shortcutUrl, '_blank')}
              >
                הורד את הקיצור דרך
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-8 text-slate-500"
                onClick={handleDismiss}
              >
                לא עכשיו
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="סגור"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
