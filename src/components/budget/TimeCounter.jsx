import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

const getRelativeTime = (dateString) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMinutes < 1) return 'לפני רגע';
    if (diffMinutes < 60) return `לפני ${diffMinutes} דקות`;
    if (diffHours < 24) {
      if (diffHours === 1) return 'לפני שעה';
      if (diffHours === 2) return 'לפני שעתיים';
      return `לפני ${diffHours} שעות`;
    }
    if (diffDays < 30) {
      if (diffDays === 1) return 'אתמול';
      if (diffDays === 2) return 'לפני יומיים';
      return `לפני ${diffDays} ימים`;
    }
    if (diffMonths < 12) {
      if (diffMonths === 1) return 'בחודש שעבר';
      return `לפני ${diffMonths} חודשים`;
    }
    if (diffYears === 1) return 'לפני שנה';
    return `לפני ${diffYears} שנים`;
  } catch {
    return null;
  }
};

// Now receives lastUpdateTime as a prop from Dashboard (no internal fetch needed)
export default function TimeCounter({ budgetPeriod, lastUpdateTime }) {
  const [timeData, setTimeData] = useState({
    daysLeft: 0,
    weeksLeft: 0,
    progress: 0,
    nextReset: null
  });
  const [relativeTime, setRelativeTime] = useState(() => getRelativeTime(lastUpdateTime));

  // Update relative time badge whenever lastUpdateTime prop changes
  useEffect(() => {
    setRelativeTime(getRelativeTime(lastUpdateTime));
  }, [lastUpdateTime]);

  // Keep relative-time text ticking every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(getRelativeTime(lastUpdateTime));
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [lastUpdateTime]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!budgetPeriod.start || !budgetPeriod.resetDay) return;

      const resetDay = budgetPeriod.resetDay || 1;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const currentDay = today.getDate();

      let nextReset;
      if (currentDay < resetDay) {
        nextReset = new Date(today.getFullYear(), today.getMonth(), resetDay);
      } else {
        nextReset = new Date(today.getFullYear(), today.getMonth() + 1, resetDay);
      }

      const daysLeft = Math.round((nextReset - today) / (1000 * 60 * 60 * 24));
      const weeksLeft = Math.ceil(daysLeft / 7);

      const periodStart = new Date(
        budgetPeriod.start.getFullYear(),
        budgetPeriod.start.getMonth(),
        budgetPeriod.start.getDate()
      );
      const totalDays = Math.round((nextReset - periodStart) / (1000 * 60 * 60 * 24));
      const passedDays = Math.round((today - periodStart) / (1000 * 60 * 60 * 24));
      const progress = totalDays > 0 ? Math.min(100, (passedDays / totalDays) * 100) : 0;

      setTimeData({ daysLeft, weeksLeft, progress, nextReset });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, [budgetPeriod]);

  const formatLastUpdate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('he-IL', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: date.toLocaleTimeString('he-IL', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    } catch {
      return null;
    }
  };

  const lastUpdateFormatted = formatLastUpdate(lastUpdateTime);

  const formatNextReset = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-l from-purple-50 to-white dark:from-purple-900/30 dark:to-slate-800 border-purple-200 dark:border-purple-800 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
            <Calendar className="w-5 h-5" />
            זמן שנותר לסוף התקופה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-800 dark:text-purple-300">{timeData.daysLeft}</div>
              <div className="text-sm text-purple-600 dark:text-purple-400">ימים</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-800 dark:text-purple-300">{timeData.weeksLeft}</div>
              <div className="text-sm text-purple-600 dark:text-purple-400">שבועות</div>
            </div>
            {timeData.nextReset && (
              <div className="text-center">
                <div className="text-sm font-bold text-purple-800 dark:text-purple-300">{formatNextReset(timeData.nextReset)}</div>
                <div className="text-sm text-purple-600 dark:text-purple-400">איפוס הבא</div>
              </div>
            )}
          </div>

          <div className="w-full bg-purple-100 dark:bg-purple-900/50 rounded-full h-2">
            <div
              className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${timeData.progress}%` }}
            />
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-2 text-center">
            {Math.round(timeData.progress)}% מהתקופה עבר
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-l from-indigo-50 to-white dark:from-indigo-900/30 dark:to-slate-800 border-indigo-200 dark:border-indigo-800 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
            <Clock className="w-5 h-5" />
            עדכון אחרון
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            {lastUpdateFormatted ? (
              <>
                <div className="text-lg font-semibold text-indigo-800 dark:text-indigo-300 mb-1">
                  {lastUpdateFormatted.date}
                </div>
                <div className="text-sm text-indigo-600 dark:text-indigo-400 mb-2">
                  {lastUpdateFormatted.time}
                </div>
                {relativeTime && (
                  <div className="inline-block bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-medium px-3 py-1 rounded-full">
                    {relativeTime}
                  </div>
                )}
              </>
            ) : (
              <div className="text-lg font-semibold text-indigo-800 dark:text-indigo-300">
                אין עדכונים
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
