import React, { useState, useEffect } from "react";
import { User } from '@/entities/User';
import { MonthlyHistory } from '@/entities/MonthlyHistory';
import { appCache } from '@/appCache';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Edit, Save, X, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

import LoggedOutState from '@/components/budget/LoggedOutState';
import LoadingSpinner from '@/components/budget/LoadingSpinner';

export default function History() {
  const cachedUser = appCache.getUser();
  const [user, setUser] = useState(() => cachedUser);
  const [monthlyHistory, setMonthlyHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        let currentUser = appCache.getUser();
        if (!currentUser || appCache.isStale()) {
          currentUser = await User.me();
          appCache.setUser(currentUser);
        }
        setUser(currentUser);
        if (currentUser && currentUser.householdId) {
          await loadHistory(currentUser.householdId);
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        setUser(null);
        setIsLoading(false);
      }
    };
    fetchUserAndData();
  }, []);

  const loadHistory = async (householdId) => {
    setIsLoading(true);
    try {
      const historyArray = await MonthlyHistory.filter({ householdId }, '-month');
      setMonthlyHistory(historyArray);
    } catch (error) {
      console.error('Error loading history:', error);
    }
    setIsLoading(false);
  };

  const startEdit = (record) => {
    setEditingRow(record.id);
    setEditData({
      totalIncome: record.totalIncome,
      totalExpenses: record.totalExpenses,
      balance: record.balance
    });
  };

  const cancelEdit = () => {
    setEditingRow(null);
    setEditData({});
  };

  const saveEdit = async (recordId) => {
    try {
      const calculatedBalance = editData.totalIncome - editData.totalExpenses;
      await MonthlyHistory.update(recordId, {
        totalIncome: parseFloat(editData.totalIncome) || 0,
        totalExpenses: parseFloat(editData.totalExpenses) || 0,
        balance: calculatedBalance
      });
      await User.updateMyUserData({ lastUpdateTime: new Date().toISOString() });
      setEditingRow(null);
      setEditData({});
      loadHistory(user.householdId);
    } catch (error) {
      console.error('Error updating history:', error);
      alert('שגיאה בעדכון הנתונים');
    }
  };

  const deleteRecord = async (recordId) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את הרשומה?')) {
      try {
        await MonthlyHistory.delete(recordId);
        await User.updateMyUserData({ lastUpdateTime: new Date().toISOString() });
        loadHistory(user.householdId);
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('שגיאה במחיקת הרשומה');
      }
    }
  };

  const formatMonthName = (dateString) => {
    try {
      const date = new Date(`${dateString}-02`);
      return format(date, 'MMMM yyyy', { locale: he });
    } catch {
      return dateString;
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <LoggedOutState />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">היסטוריה חודשית</h1>
          <p className="text-slate-600">צפייה ועריכה של סיכומים חודשיים</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                היסטוריית חודשים
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyHistory.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">אין היסטוריה זמינה</h3>
                <p className="text-slate-500">
                  בסוף כל תקופת תקציב, סיכום התקציב יאורכב ויופיע כאן באופן אוטומטי.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">חודש</TableHead>
                      <TableHead className="text-right">סך הכנסות</TableHead>
                      <TableHead className="text-right">סך הוצאות</TableHead>
                      <TableHead className="text-right">יתרה</TableHead>
                      <TableHead className="text-right">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyHistory.map((month) => (
                      <TableRow key={month.id}>
                        <TableCell className="font-medium">{formatMonthName(month.month)}</TableCell>
                        <TableCell>
                          {editingRow === month.id ? (
                            <Input
                              type="number"
                              value={editData.totalIncome}
                              onChange={(e) => setEditData({...editData, totalIncome: e.target.value})}
                              className="w-24"
                            />
                          ) : (
                            <span className="text-green-700 font-semibold">₪{month.totalIncome.toLocaleString()}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingRow === month.id ? (
                            <Input
                              type="number"
                              value={editData.totalExpenses}
                              onChange={(e) => setEditData({...editData, totalExpenses: e.target.value})}
                              className="w-24"
                            />
                          ) : (
                            <span className="text-red-700 font-semibold">₪{month.totalExpenses.toLocaleString()}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${
                            (editingRow === month.id
                              ? (editData.totalIncome - editData.totalExpenses)
                              : month.balance
                            ) >= 0 ? 'text-green-700' : 'text-red-700'
                          }`}>
                            ₪{(editingRow === month.id
                              ? ((parseFloat(editData.totalIncome) || 0) - (parseFloat(editData.totalExpenses) || 0)).toLocaleString()
                              : month.balance.toLocaleString()
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {editingRow === month.id ? (
                              <>
                                <Button size="sm" onClick={() => saveEdit(month.id)} className="bg-green-600 hover:bg-green-700">
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEdit}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="outline" onClick={() => startEdit(month)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => deleteRecord(month.id)} className="text-red-600 hover:text-red-700">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
