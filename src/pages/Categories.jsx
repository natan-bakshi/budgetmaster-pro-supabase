import React, { useState, useEffect } from "react";
import { User } from '@/entities/User';
import { Category } from '@/entities/Category';
import { appCache } from '@/appCache';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";

import LoggedOutState from '@/components/budget/LoggedOutState';
import LoadingSpinner from '@/components/budget/LoadingSpinner';
import CategoryList from "@/components/budget/CategoryList";
import AddCategoryDialog from "@/components/budget/AddCategoryDialog";

export default function Categories() {
  const cachedUser = appCache.getUser();
  const cachedCats = appCache.getCategoriesData();

  const [user, setUser] = useState(() => cachedUser);
  const [categories, setCategories] = useState(() => cachedCats || { income: [], expense: [] });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [dialogType, setDialogType] = useState('income');
  const [editingCategory, setEditingCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(() => !cachedUser || !cachedCats);
  const [activeTab, setActiveTab] = useState('income');
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const hadCachedUser = !!appCache.getUser();
        const hadCachedCats = !!appCache.getCategoriesData();
        let currentUser;
        if (hadCachedUser && !appCache.isStale()) {
          currentUser = appCache.getUser();
        } else {
          currentUser = await User.me();
          appCache.setUser(currentUser);
        }
        setUser(currentUser);
        if (currentUser && currentUser.householdId) {
          await loadData(currentUser.householdId, hadCachedUser && hadCachedCats);
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
    setScrollPosition(window.pageYOffset);
    if (!silent) setIsLoading(true);
    try {
      const allCategories = await Category.filter({ householdId }, 'order');
      const newCats = {
        income: allCategories.filter(c => c.type === 'income'),
        expense: allCategories.filter(c => c.type === 'expense')
      };
      setCategories(newCats);
      appCache.setCategoriesData(newCats);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    if (!silent) setIsLoading(false);
    setTimeout(() => { window.scrollTo(0, scrollPosition); }, 100);
  };

  const addCategory = async (categoryData) => {
    try {
      if (editingCategory) {
        await Category.update(editingCategory.id, categoryData);
      } else {
        const newCategory = {
          ...categoryData,
          householdId: user.householdId,
          order: categories[dialogType].length,
          currentAmount: 0,
          createdAt: new Date().toISOString()
        };
        await Category.create(newCategory);
      }
      await User.updateMyUserData({ lastUpdateTime: new Date().toISOString() });
      appCache.setDashboardData(null);
      setShowAddDialog(false);
      setEditingCategory(null);
      loadData(user.householdId, false);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('שגיאה בשמירת הקטגוריה: ' + (error.message || error));
    }
  };

  const deleteCategory = async (type, categoryId) => {
    await Category.delete(categoryId);
    await User.updateMyUserData({ lastUpdateTime: new Date().toISOString() });
    appCache.setDashboardData(null);
    loadData(user.householdId, false);
  };

  const moveCategory = async (type, categoryId, direction) => {
    const list = categories[type];
    const categoryIndex = list.findIndex(cat => cat.id === categoryId);
    if (categoryIndex === -1) return;
    const newIndex = direction === 'up' ? categoryIndex - 1 : categoryIndex + 1;
    if (newIndex < 0 || newIndex >= list.length) return;
    const currentCategory = list[categoryIndex];
    const otherCategory = list[newIndex];
    await Promise.all([
      Category.update(currentCategory.id, { order: otherCategory.order }),
      Category.update(otherCategory.id, { order: currentCategory.order })
    ]);
    await User.updateMyUserData({ lastUpdateTime: new Date().toISOString() });
    appCache.setDashboardData(null);
    loadData(user.householdId, false);
  };

  const handleAddCategory = (type) => {
    setDialogType(type);
    setEditingCategory(null);
    setShowAddDialog(true);
  };

  const handleEditCategory = (type, category) => {
    setDialogType(type);
    setEditingCategory(category);
    setShowAddDialog(true);
  };

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <LoggedOutState />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">הגדרות קטגוריות</h1>
          <p className="text-slate-600 dark:text-slate-400">ניהול קטגוריות הכנסות והוצאות</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
            <TabsTrigger
              value="income"
              className="flex items-center gap-2 rounded-lg font-semibold data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-500 dark:text-slate-400"
            >
              <TrendingUp className="w-4 h-4" />
              הכנסות ({categories.income.length})
            </TabsTrigger>
            <TabsTrigger
              value="expense"
              className="flex items-center gap-2 rounded-lg font-semibold data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-500 dark:text-slate-400"
            >
              <TrendingDown className="w-4 h-4" />
              הוצאות ({categories.expense.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="space-y-4">
            {/* Button above title on mobile, side-by-side on desktop */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <Button onClick={() => handleAddCategory('income')} className="bg-green-600 hover:bg-green-700 sm:order-2 w-full sm:w-auto">
                <Plus className="w-4 h-4 ml-2" />
                הוסף הכנסה
              </Button>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 sm:order-1">קטגוריות הכנסות</h2>
            </div>
            <CategoryList
              categories={categories.income}
              type="income"
              accounts={[]}
              onEdit={handleEditCategory}
              onDelete={deleteCategory}
              onMove={moveCategory}
            />
          </TabsContent>

          <TabsContent value="expense" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <Button onClick={() => handleAddCategory('expense')} className="bg-red-600 hover:bg-red-700 sm:order-2 w-full sm:w-auto">
                <Plus className="w-4 h-4 ml-2" />
                הוסף הוצאה
              </Button>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 sm:order-1">קטגוריות הוצאות</h2>
            </div>
            <CategoryList
              categories={categories.expense}
              type="expense"
              accounts={[]}
              onEdit={handleEditCategory}
              onDelete={deleteCategory}
              onMove={moveCategory}
            />
          </TabsContent>
        </Tabs>

        <AddCategoryDialog
          open={showAddDialog}
          onClose={() => { setShowAddDialog(false); setEditingCategory(null); }}
          onAdd={addCategory}
          type={dialogType}
          accounts={[]}
          editingCategory={editingCategory}
        />
      </div>
    </div>
  );
}
