import React, { useState, useEffect } from "react";
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

export default function TimeCounter({ budgetPeriod }) {
  const [timeData, setTimeData] = useState({
    daysLeft: 0,
    weeksLeft: 0,
    progress: 0
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
      if (!budgetPeriod.start || !budgetPeriod.end) return;
      
      const now = new Date();
      const endDate = budgetPeriod.end;
      const startDate = budgetPeriod.start;
      
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const passedDays = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
      const daysLeft = Math.max(0, totalDays - passedDays);
      const weeksLeft = Math.ceil(daysLeft / 7);
      const progress = Math.min(100, (passedDays / totalDays) * 100);

      setTimeData({ daysLeft, weeksLeft, progress });
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