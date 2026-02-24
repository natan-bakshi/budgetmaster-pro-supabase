import React, { useState, useEffect } from "react";
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

export default function TimeCounter({ budgetPeriod }) {
  const [timeData, setTimeData] = useState({
    daysLeft: 0,
    weeksLeft: 0,
    progress: 0,
    nextReset: null
  });
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const fetchLastUpdate = async () => {
      try {
        const user = await User.me();
        setLastUpdate(user.lastUpdateTime);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchLastUpdate();
  }, []);

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!budgetPeriod.start || !budgetPeriod.resetDay) return;

      const resetDay = budgetPeriod.resetDay || 1;
      const now = new Date();
      // Use midnight of today for clean day calculations
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const currentDay = today.getDate();

      // Find the next reset date
      let nextReset;
      if (currentDay < resetDay) {
        // Reset is later this month
        nextReset = new Date(today.getFullYear(), today.getMonth(), resetDay);
      } else {
        // Reset is next month
        nextReset = new Date(today.getFullYear(), today.getMonth() + 1, resetDay);
      }

      // Days left = exact days from today midnight to next reset
      const daysLeft = Math.round((nextReset - today) / (1000 * 60 * 60 * 24));
      const weeksLeft = Math.ceil(daysLeft / 7);

      // Progress: days passed / total days in this period
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
    const interval = setInterval(calculateTimeLeft, 1000 * 60 * 60); // Update every hour

    return () => clearInterval(interval);
  }, [budgetPeriod]);

  const formatLastUpdate = (dateString) => {
    if (!dateString) return 'אין עדכונים';
    
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
      return 'תאריך לא תקין';
    }
  };

  const lastUpdateFormatted = formatLastUpdate(lastUpdate);

  const formatNextReset = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-l from-purple-50 to-white border-purple-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Calendar className="w-5 h-5" />
            זמן שנותר לסוף התקופה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-800">{timeData.daysLeft}</div>
              <div className="text-sm text-purple-600">ימים</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-800">{timeData.weeksLeft}</div>
              <div className="text-sm text-purple-600">שבועות</div>
            </div>
            {timeData.nextReset && (
              <div className="text-center">
                <div className="text-sm font-bold text-purple-800">{formatNextReset(timeData.nextReset)}</div>
                <div className="text-sm text-purple-600">איפוס הבא</div>
              </div>
            )}
          </div>
          
          <div className="w-full bg-purple-100 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${timeData.progress}%` }}
            />
          </div>
          <div className="text-xs text-purple-600 mt-2 text-center">
            {Math.round(timeData.progress)}% מהתקופה עבר
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-l from-indigo-50 to-white border-indigo-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-indigo-700">
            <Clock className="w-5 h-5" />
            עדכון אחרון
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            {typeof lastUpdateFormatted === 'object' ? (
              <>
                <div className="text-lg font-semibold text-indigo-800 mb-2">
                  {lastUpdateFormatted.date}
                </div>
                <div className="text-sm text-indigo-600">
                  {lastUpdateFormatted.time}
                </div>
              </>
            ) : (
              <div className="text-lg font-semibold text-indigo-800">
                {lastUpdateFormatted}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}