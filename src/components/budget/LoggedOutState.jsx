import React from 'react';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Wallet } from 'lucide-react';

export default function LoggedOutState() {
  const handleLogin = async () => {
    try {
      await User.login();
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl animate-fade-in">
        <CardHeader className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">ברוכים הבאים ל-BudgetMaster</CardTitle>
          <p className="text-slate-600 pt-2">
            מערכת ניהול התקציב האישי שלך.
            <br />
            התחבר כדי להתחיל לנהל את הכספים שלך.
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleLogin}
            className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700"
          >
            <LogIn className="w-5 h-5 ml-2" />
            התחבר עם גוגל
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}