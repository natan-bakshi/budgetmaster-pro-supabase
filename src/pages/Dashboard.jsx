import React, { useState, useEffect, useCallback } from "react";
import { User } from '@/entities/User';
import { Category } from '@/entities/Category';
import { CategoryInstance } from '@/entities/CategoryInstance';
import { Household } from '@/entities/Household';
import { MonthlyHistory } from '@/entities/MonthlyHistory';
import { Transaction } from '@/entities/Transaction';
import { Account } from '@/entities/Account';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Settings } from "lucide-react";
import { format } from 'date-fns';

import LoggedOutState from '@/components/budget/LoggedOutState';
import LoadingSpinner from '@/components/budget/LoadingSpinner';
import OverviewCards from "@/components/budget/OverviewCards";
import CategoriesManager from "@/components/budget/CategoriesManager";
import TimeCounter from "@/components/budget/TimeCounter";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [categoryInstances, setCategoryInstances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBudgetPeriod, setCurrentBudgetPeriod] = useState({
    start: null,
    end: null,
    resetDay: 1
  });

  const calculateBudgetPeriod = (resetDay = 1) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    let periodStart, periodEnd;
    if (currentDay >= resetDay) {
      periodStart = new Date(currentYear, currentMonth, resetDay);
      periodEnd = new Date(currentYear, currentMonth + 1, resetDay - 1);
    } else {
      periodStart = new Date(currentYear, currentMonth - 1, resetDay);
      periodEnd = new Date(currentYear, currentMonth, resetDay - 1);
    }
    return { start: periodStart, end: periodEnd };
  };

  const getBudgetPeriodString = (periodStart) => {
    return format(periodStart, 'yyyy-MM-dd');
  };

  const checkForMonthlyReset = async (userId, householdId, currentUser) => {
    if (!householdId) return 1;
    try {
      const household = await Household.get(householdId);
      const resetDay = household.resetDay || 1;
      const lastResetCheck = currentUser.lastResetCheck;
      const { start: periodStart, end: periodEnd } = calculateBudgetPeriod(resetDay);
      const currentPeriodStr = getBudgetPeriodString(periodStart);
      setCurrentBudgetPeriod({ start: periodStart, end: periodEnd, resetDay });
      const now = new Date();
      const lastCheck = lastResetCheck ? new Date(lastResetCheck) : null;
      const shouldCheck = !lastCheck || (now - lastCheck) > 24 * 60 * 60 * 1000;
      if (!shouldCheck) return resetDay;
      const today = new Date();
      if (today >= periodStart) {
        const prevPeriodStart = new Date(periodStart);
        prevPeriodStart.setMonth(prevPeriodStart.getMonth() - 1);
        const prevPeriodStr = getBudgetPeriodString(prevPeriodStart).substring(0, 7);
        const prevMonthHistory = await MonthlyHistory.filter({ householdId, month: prevPeriodStr });
        if (prevMonthHistory.length === 0) {
          const prevMonthInstances = await CategoryInstance.filter({ householdId, month: prevPeriodStr });
          if (prevMonthInstances.length > 0) {
            let totalIncome = 0;
            let totalExpenses = 0;
            const allCategories = await Category.filter({ householdId });
            const categoryMap = new Map(allCategories.map(c => [c.id, c]));
            prevMonthInstances.forEach(inst => {
              const category = categoryMap.get(inst.categoryId);
              if (category) {
                if (category.type === 'income') totalIncome += inst.currentAmount;
                else totalExpenses += inst.currentAmount;
              }
            });
            await MonthlyHistory.create({
              month: prevPeriodStr,
              totalIncome,
              totalExpenses,
              balance: totalIncome - totalExpenses,
              householdId,
            });
          }
        }
        await User.updateMyUserData({ lastResetCheck: now.toISOString() });
        await executeScheduledTransactions(householdId, resetDay);
      }
      return resetDay;
    } catch (error) {
      console.error('Error during monthly reset check:', error);
      return 1;
    }
  };

  const executeScheduledTransactions = async (householdId, resetDay) => {
    try {
      const categories = await Category.filter({ householdId });
      const accounts = await Account.filter({ householdId });
      for (const category of categories) {
        if (category.accountId && category.defaultAmount && category.defaultAmount !== 0) {
          const account = accounts.find(a => a.id === category.accountId);
          if (!account) continue;
          let transactionDate = new Date();
          if (category.executionDate) {
            const executionDay = parseInt(category.executionDate);
            const { start: periodStart } = calculateBudgetPeriod(resetDay);
            transactionDate = new Date(periodStart);
            transactionDate.setDate(executionDay);
            if (transactionDate < periodStart) {
              transactionDate.setMonth(transactionDate.getMonth() + 1);
            }
          }
          await Transaction.create({
            categoryId: category.id,
            accountId: category.accountId,
            amount: category.type === 'expense' ? -Math.abs(category.defaultAmount) : Math.abs(category.defaultAmount),
            date: transactionDate.toISOString(),
            scheduledDate: transactionDate.toISOString(),
            type: category.type,
            householdId,
            notes: `עסקה אוטומטית - ${category.name}`,
            isAutomatic: true,
            isExecuted: transactionDate <= new Date()
          });
          if (transactionDate <= new Date()) {
            const newBalance = account.balance + (category.type === 'expense' ? -Math.abs(category.defaultAmount) : Math.abs(category.defaultAmount));
            await Account.update(account.id, { balance: newBalance });
          }
        }
      }
    } catch (error) {
      console.error('Error executing scheduled transactions:', error);
    }
  };

  const createMissingInstances = async (categories, existingInstances, month, householdId) => {
    const existingCategoryIds = existingInstances.map(inst => inst.categoryId);
    const missingCategories = categories.filter(cat => !existingCategoryIds.includes(cat.id));
    if (missingCategories.length > 0) {
      const instancesToCreate = missingCategories.map(cat => ({
        categoryId: cat.id,
        currentAmount: cat.defaultAmount || 0,
        month,
        householdId,
        notes: ''
      }));
      await Promise.all(instancesToCreate.map(instance => CategoryInstance.create(instance)));
    }
    return missingCategories.length > 0;
  };

  const loadData = useCallback(async (currentUser) => {
    setIsLoading(true);
    try {
      const userId = currentUser.id;
      const householdId = currentUser.householdId;
      if (householdId) {
        const resetDay = await checkForMonthlyReset(userId, householdId, currentUser) || 1;
        const { start: periodStart } = calculateBudgetPeriod(resetDay);
        const currentMonth = format(periodStart, 'yyyy-MM');
        const [fetchedCategories, fetchedInstances] = await Promise.all([
          Category.filter({ householdId }, 'order'),
          CategoryInstance.filter({ householdId, month: currentMonth })
        ]);
        const incomeCategories = fetchedCategories.filter(c => c.type === 'income');
        const expenseCategories = fetchedCategories.filter(c => c.type === 'expense');
        setCategories({ income: incomeCategories, expense: expenseCategories });
        const hadMissingInstances = await createMissingInstances(fetchedCategories, fetchedInstances, currentMonth, householdId);
        const updatedInstances = hadMissingInstances
          ? await CategoryInstance.filter({ householdId, month: currentMonth })
          : fetchedInstances;
        setCategoryInstances(updatedInstances);
        setCurrentBudgetPeriod({
          start: periodStart,
          end: calculateBudgetPeriod(resetDay).end,
          resetDay
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        await loadData(currentUser);
      } catch (e) {
        setUser(null);
        setIsLoading(false);
      }
    };
    fetchUserAndData();
  }, [loadData]);

  const getCurrentAmount = (categoryId) => {
    const instance = categoryInstances.find(inst => inst.categoryId === categoryId);
    return instance ? instance.currentAmount : 0;
  };

  const getTotals = () => {
    const totals = { income: 0, expenses: 0 };
    categories.income.forEach(cat => { totals.income += getCurrentAmount(cat.id); });
    categories.expense.forEach(cat => { totals.expenses += getCurrentAmount(cat.id); });
    return totals;
  };

  const reloadData = async () => { if (user) await loadData(user); };

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <LoggedOutState />;

  const { income, expenses } = getTotals();
  const balance = income - expenses;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            ברוך הבא, {user.full_name.split(' ')[0]}
          </h1>
          <p className="text-slate-600">
            {user.householdId ? 'זהו סיכום התקציב החודשי שלך.' : 'זהו החשבון האישי שלך.'}
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              מבט כללי
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              ניהול עסקאות
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewCards
              monthlyIncome={income}
              monthlyExpenses={expenses}
              monthlyBalance={balance}
            />
            <TimeCounter budgetPeriod={currentBudgetPeriod} />
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            <CategoriesManager
              user={user}
              categories={categories}
              categoryInstances={categoryInstances}
              onUpdate={reloadData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
