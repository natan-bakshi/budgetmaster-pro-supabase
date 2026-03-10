import React, { useState } from 'react';
import { X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISMISSED_KEY = 'applepay_shortcut_dismissed';

// Detect iOS (iPhone/iPad)
const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export default function ApplePayShortcutBanner({ supabaseUrl }) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1'
  );

  // Only show on iOS devices
  if (!isIOS() || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  // The shortcut file URL — served from public folder
  const shortcutUrl = `${window.location.origin}/BudgetMasterShortcut.shortcut`;

  return (
    <div className="relative bg-gradient-to-l from-blue-600 to-blue-500 text-white rounded-2xl p-4 mb-6 shadow-lg flex items-start gap-3" dir="rtl">
      <button
        onClick={handleDismiss}
        className="absolute top-3 left-3 text-white/70 hover:text-white transition-colors"
        aria-label="סגור"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="shrink-0 bg-white/20 rounded-xl p-2">
        <Smartphone className="w-6 h-6" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm mb-0.5">הוסף עסקאות מהירות מ-Apple Pay 🍎</p>
        <p className="text-xs text-white/80 mb-3 leading-relaxed">
          שלם עם Apple Pay → קיצור דרך יפתח אוטומטית → בחר קטגוריה → הסכום יתעדכן במערכת
        </p>
        <Button
          size="sm"
          className="bg-white text-blue-600 hover:bg-blue-50 font-semibold text-xs h-8 px-4"
          onClick={() => window.open(shortcutUrl, '_blank')}
        >
          הורד קיצור דרך
        </Button>
      </div>
    </div>
  );
}
