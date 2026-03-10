import React, { useState } from 'react';
import { X, Smartphone, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISMISSED_KEY = 'applepay_shortcut_dismissed';

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export default function ApplePayShortcutBanner({ user }) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1'
  );
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  if (!isIOS() || dismissed) return null;
  if (!user?.shortcutApiKey) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(user.shortcutApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-gradient-to-l from-blue-600 to-blue-500 text-white rounded-2xl p-4 mb-6 shadow-lg" dir="rtl">
      <button
        onClick={handleDismiss}
        className="absolute top-3 left-3 text-white/70 hover:text-white transition-colors"
        aria-label="סגור"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="shrink-0 bg-white/20 rounded-xl p-2">
          <Smartphone className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm mb-0.5">הוסף עסקאות מהירות מ-Apple Pay 🍎</p>
          <p className="text-xs text-white/80 mb-3 leading-relaxed">
            שלם עם Apple Pay → קיצור דרך יפתח אוטומטית → בחר קטגוריה → הסכום יתעדכן
          </p>

          {!showKey ? (
            <Button
              size="sm"
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold text-xs h-8 px-4"
              onClick={() => setShowKey(true)}
            >
              הגדר קיצור דרך
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-white/90 font-medium">שלב 1 — עתק את הקוד האישי שלך:</p>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <code className="text-xs font-mono flex-1 truncate">{user.shortcutApiKey}</code>
                <button onClick={handleCopy} className="shrink-0 text-white/80 hover:text-white">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-white/80">שלב 2 — <a href="https://www.icloud.com/shortcuts/" target="_blank" rel="noreferrer" className="underline">לחץ כאן להורדת הקיצור</a> והדבק את הקוד בשדה המתאים</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
