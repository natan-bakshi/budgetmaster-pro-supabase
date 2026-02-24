import React, { useState, useEffect } from "react";
import { User } from '@/entities/User';
import { Account } from '@/entities/Account';
import { Category } from '@/entities/Category';
import { Transaction } from '@/entities/Transaction';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Database, Calendar } from "lucide-react";
import { format } from "date-fns";
import LoggedOutState from '@/components/budget/LoggedOutState';
import LoadingSpinner from '@/components/budget/LoadingSpinner';

export default function Export() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        if (currentUser && currentUser.householdId) {
          loadData(currentUser.householdId, currentUser.defaultAccountId);
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

  const loadData = async (householdId, defaultAccountId) => {
    setIsLoading(true);
    try {
      const [accounts, categories, transactions] = await Promise.all([
        Account.filter({ householdId }),
        Category.filter({ householdId }),
        Transaction.filter({ householdId })
      ]);
      setData({
        accounts,
        categories: {
          income: categories.filter(c => c.type === 'income'),
          expense: categories.filter(c => c.type === 'expense')
        },
        transactions,
        defaultAccount: defaultAccountId,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const exportToCSV = async (type) => {
    setIsExporting(true);
    
    try {
      let csvContent = '';
      let filename = '';

      switch (type) {
        case 'categories':
          csvContent = generateCategoriesCSV();
          filename = `categories_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;
        case 'accounts':
          csvContent = generateAccountsCSV();
          filename = `accounts_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;
        case 'transactions':
          csvContent = generateTransactionsCSV();
          filename = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;
        case 'all':
          csvContent = generateCompleteCSV();
          filename = `budget_master_complete_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;
      }

      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('שגיאה בייצוא הנתונים');
    }

    setIsExporting(false);
  };

  const generateCategoriesCSV = () => {
    const headers = ['סוג,שם קטגוריה,סכום ברירת מחדל,תאריך ביצוע,חשבון,הערות'];
    const rows = [];

    if (data?.categories?.income) {
      data.categories.income.forEach(cat => {
        rows.push([
          'הכנסה',
          cat.name || '',
          cat.defaultAmount || 0,
          cat.executionDate || '',
          cat.accountId || '',
          cat.showNotes ? 'כן' : 'לא'
        ].join(','));
      });
    }

    if (data?.categories?.expense) {
      data.categories.expense.forEach(cat => {
        rows.push([
          'הוצאה',
          cat.name || '',
          cat.defaultAmount || 0,
          cat.executionDate || '',
          cat.accountId || '',
          cat.showNotes ? 'כן' : 'לא'
        ].join(','));
      });
    }

    return headers.concat(rows).join('\n');
  };

  const generateAccountsCSV = () => {
    const headers = ['שם חשבון,יתרה,צבע,חשבון ברירת מחדל,תאריך יצירה'];
    const rows = [];

    if (data?.accounts) {
      data.accounts.forEach(account => {
        rows.push([
          account.name || '',
          account.balance || 0,
          account.color || '',
          account.id === data.defaultAccount ? 'כן' : 'לא',
          account.created_date || ''
        ].join(','));
      });
    }

    return headers.concat(rows).join('\n');
  };

  const generateTransactionsCSV = () => {
    const headers = ['תאריך,סכום,סוג,הערות,קטגוריה,חשבון'];
    const rows = [];

    if (data?.transactions) {
      data.transactions.forEach(transaction => {
        rows.push([
          transaction.date || '',
          transaction.amount || 0,
          transaction.type === 'income' ? 'הכנסה' : 'הוצאה',
          transaction.notes || '',
          transaction.categoryId || '',
          transaction.accountId || ''
        ].join(','));
      });
    }

    return headers.concat(rows).join('\n');
  };

  const generateCompleteCSV = () => {
    const sections = [
      '=== קטגוריות ===',
      generateCategoriesCSV(),
      '',
      '=== חשבונות ===',
      generateAccountsCSV(),
      '',
      '=== עסקאות ===',
      generateTransactionsCSV()
    ];

    return sections.join('\n');
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
    if (!data) return { categories: 0, accounts: 0, transactions: 0 };
    
    return {
      categories: (data.categories?.income?.length || 0) + (data.categories?.expense?.length || 0),
      accounts: data.accounts?.length || 0,
      transactions: data.transactions?.length || 0
    };
  };

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <LoggedOutState />;

  const stats = getDataStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">ייצוא נתונים</h1>
          <p className="text-slate-600">ייצא את הנתונים שלך לקובץ CSV</p>
        </div>

        {/* Data Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              סיכום נתונים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{stats.categories}</div>
                <div className="text-sm text-blue-600">קטגוריות</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{stats.accounts}</div>
                <div className="text-sm text-green-600">חשבונות</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">{stats.transactions}</div>
                <div className="text-sm text-purple-600">עסקאות</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                קטגוריות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                ייצא את כל קטגוריות ההכנסות וההוצאות עם הפרטים שלהן
              </p>
              <Button 
                onClick={() => exportToCSV('categories')}
                disabled={isExporting || stats.categories === 0}
                className="w-full"
              >
                <Download className="w-4 h-4 ml-2" />
                ייצא קטגוריות
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-green-600" />
                חשבונות בנק
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                ייצא את פרטי כל החשבונות ויתרותיהם
              </p>
              <Button 
                onClick={() => exportToCSV('accounts')}
                disabled={isExporting || stats.accounts === 0}
                className="w-full"
              >
                <Download className="w-4 h-4 ml-2" />
                ייצא חשבונות
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                עסקאות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                ייצא את כל העסקאות שבוצעו במערכת
              </p>
              <Button 
                onClick={() => exportToCSV('transactions')}
                disabled={isExporting || stats.transactions === 0}
                className="w-full"
              >
                <Download className="w-4 h-4 ml-2" />
                ייצא עסקאות
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Download className="w-5 h-5" />
                ייצוא מלא
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                ייצא את כל הנתונים במערכת בקובץ אחד
              </p>
              <Button 
                onClick={() => exportToCSV('all')}
                disabled={isExporting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 ml-2" />
                {isExporting ? 'מייצא...' : 'ייצא הכל'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {stats.categories === 0 && stats.accounts === 0 && stats.transactions === 0 && (
          <Card className="mt-8 text-center">
            <CardContent className="py-12">
              <FileText className="w-16 h-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                אין נתונים לייצוא
              </h3>
              <p className="text-slate-500">
                הוסף קטגוריות וחשבונות כדי שיהיה ניתן לייצא נתונים
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}