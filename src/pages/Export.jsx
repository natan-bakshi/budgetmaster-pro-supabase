import React, { useState, useEffect } from "react";
import { User } from '@/entities/User';
import { Category } from '@/entities/Category';
import { Transaction } from '@/entities/Transaction';
import { appCache } from '@/appCache';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Calendar, Database } from "lucide-react";
import { format } from "date-fns";
import LoggedOutState from '@/components/budget/LoggedOutState';
import LoadingSpinner from '@/components/budget/LoadingSpinner';

export default function Export() {
  const cachedUser = appCache.getUser();
  const cachedExport = appCache.getExportData();

  const [user, setUser] = useState(() => cachedUser);
  const [data, setData] = useState(() => cachedExport || null);
  const [isLoading, setIsLoading] = useState(() => !cachedUser || !cachedExport);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const hadCachedUser = !!appCache.getUser();
        const hadCachedExport = !!appCache.getExportData();

        let currentUser;
        if (hadCachedUser && !appCache.isStale()) {
          currentUser = appCache.getUser();
        } else {
          currentUser = await User.me();
          appCache.setUser(currentUser);
        }
        setUser(currentUser);

        if (currentUser && currentUser.householdId) {
          await loadData(currentUser.householdId, hadCachedUser && hadCachedExport);
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

  const loadData = async (householdId, silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [categories, transactions] = await Promise.all([
        Category.filter({ householdId }),
        Transaction.filter({ householdId })
      ]);
      const newData = {
        categories: {
          income: categories.filter(c => c.type === 'income'),
          expense: categories.filter(c => c.type === 'expense')
        },
        transactions,
      };
      setData(newData);
      appCache.setExportData(newData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    if (!silent) setIsLoading(false);
  };

  const exportToCSV = async (type) => {
    setIsExporting(true);
    try {
      let csvContent = '';
      let filename = '';
      if (type === 'categories') {
        csvContent = generateCategoriesCSV();
        filename = `categories_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      } else if (type === 'transactions') {
        csvContent = generateTransactionsCSV();
        filename = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      } else if (type === 'all') {
        csvContent = generateCompleteCSV();
        filename = `budget_master_complete_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      }
      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('שגיאה בייצוא הנתונים');
    }
    setIsExporting(false);
  };

  const generateCategoriesCSV = () => {
    const headers = ['סוג,שם קטגוריה,סכום ברירת מחדל,תאריך ביצוע,הערות'];
    const rows = [];
    data?.categories?.income?.forEach(cat => {
      rows.push(['הכנסה', cat.name || '', cat.defaultAmount || 0, cat.executionDate || '', cat.showNotes ? 'כן' : 'לא'].join(','));
    });
    data?.categories?.expense?.forEach(cat => {
      rows.push(['הוצאה', cat.name || '', cat.defaultAmount || 0, cat.executionDate || '', cat.showNotes ? 'כן' : 'לא'].join(','));
    });
    return headers.concat(rows).join('\n');
  };

  const generateTransactionsCSV = () => {
    const headers = ['תאריך,סכום,סוג,הערות,קטגוריה'];
    const rows = [];
    data?.transactions?.forEach(transaction => {
      rows.push([transaction.date || '', transaction.amount || 0, transaction.type === 'income' ? 'הכנסה' : 'הוצאה', transaction.notes || '', transaction.categoryId || ''].join(','));
    });
    return headers.concat(rows).join('\n');
  };

  const generateCompleteCSV = () => {
    return [
      '=== קטגוריות ===', generateCategoriesCSV(), '',
      '=== עסקאות ===', generateTransactionsCSV()
    ].join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDataStats = () => {
    if (!data) return { categories: 0, transactions: 0 };
    return {
      categories: (data.categories?.income?.length || 0) + (data.categories?.expense?.length || 0),
      transactions: data.transactions?.length || 0
    };
  };

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <LoggedOutState />;

  const stats = getDataStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">ייצוא נתונים</h1>
          <p className="text-slate-600 dark:text-slate-400">ייצא את הנתונים שלך לקובץ CSV</p>
        </div>

        {/* Data summary – no accounts */}
        <Card className="mb-8 dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-slate-100">
              <Database className="w-5 h-5" />
              סיכום נתונים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.categories}</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">קטגוריות</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.transactions}</div>
                <div className="text-sm text-purple-600 dark:text-purple-400">עסקאות</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                <FileText className="w-5 h-5 text-blue-600" />
                קטגוריות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400 mb-4">ייצא את כל קטגוריות ההכנסות וההוצאות</p>
              <Button onClick={() => exportToCSV('categories')} disabled={isExporting || stats.categories === 0} className="w-full">
                <Download className="w-4 h-4 ml-2" aria-hidden="true" />
                ייצא קטגוריות
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                <Calendar className="w-5 h-5 text-purple-600" />
                עסקאות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400 mb-4">ייצא את כל העסקאות שבוצעו במערכת</p>
              <Button onClick={() => exportToCSV('transactions')} disabled={isExporting || stats.transactions === 0} className="w-full">
                <Download className="w-4 h-4 ml-2" aria-hidden="true" />
                ייצא עסקאות
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Download className="w-5 h-5" />
                ייצוא מלא
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400 mb-4">ייצא את כל הנתונים בקובץ אחד</p>
              <Button onClick={() => exportToCSV('all')} disabled={isExporting} className="w-full bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 ml-2" aria-hidden="true" />
                {isExporting ? 'מייצא...' : 'ייצא הכל'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {stats.categories === 0 && stats.transactions === 0 && (
          <Card className="mt-8 text-center dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="py-12">
              <FileText className="w-16 h-16 mx-auto text-slate-400 mb-4" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">אין נתונים לייצוא</h3>
              <p className="text-slate-500 dark:text-slate-400">הוסף קטגוריות כדי שיהיה ניתן לייצא נתונים</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
