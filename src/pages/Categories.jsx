import React, { useState, useEffect } from "react";
import { User } from '@/entities/User';
import { Category } from '@/entities/Category';
import { Account } from '@/entities/Account';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";

import LoggedOutState from '@/components/budget/LoggedOutState';
import LoadingSpinner from '@/components/budget/LoadingSpinner';
import CategoryList from "@/components/budget/CategoryList";
import AddCategoryDialog from "@/components/budget/AddCategoryDialog";

export default function Categories() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [accounts, setAccounts] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [dialogType, setDialogType] = useState('income');
  const [editingCategory, setEditingCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('income');
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        if (currentUser && currentUser.householdId) {
          loadData(currentUser.householdId);
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

  const loadData = async (householdId) => {
    setScrollPosition(window.pageYOffset);
    setIsLoading(true);
    try {
      const [allCategories, allAccounts] = await Promise.all([
        Category.filter({ householdId }, 'order'),
        Account.filter({ householdId })
      ]);
      setCategories({
        income: allCategories.filter(c => c.type === 'income'),
        expense: allCategories.filter(c => c.type === 'expense')
      });
      setAccounts(allAccounts);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
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
      setShowAddDialog(false);
      setEditingCategory(null);
      loadData(user.householdId);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('שגיאה בשמירת הקטגוריה: ' + (error.message || error));
    }
  };

  const deleteCategory = async (type, categoryId) => {
    await Category.delete(categoryId);
    await User.updateMyUserData({ lastUpdateTime: new Date().toISOString() });
    loadData(user.householdId);
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
    loadData(user.householdId);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">הגדרות קטגוריות</h1>
          <p className="text-slate-600">ניהול קטגוריות הכנסות והוצאות</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm">
            <TabsTrigger value="income" className="flex items-center gap-2 text-green-700">
              <TrendingUp className="w-4 h-4" />
              הכנסות ({categories.income.length})
            </TabsTrigger>
            <TabsTrigger value="expense" className="flex items-center gap-2 text-red-700">
              <TrendingDown className="w-4 h-4" />
              הוצאות ({categories.expense.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-800">קטגוריות הכנסות</h2>
              <Button onClick={() => handleAddCategory('income')} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 ml-2" />
                הוסף הכנסה
              </Button>
            </div>
            <CategoryList
              categories={categories.income}
              type="income"
              accounts={accounts}
              onEdit={handleEditCategory}
              onDelete={deleteCategory}
              onMove={moveCategory}
            />
          </TabsContent>

          <TabsContent value="expense" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-800">קטגוריות הוצאות</h2>
              <Button onClick={() => handleAddCategory('expense')} className="bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4 ml-2" />
                הוסף הוצאה
              </Button>
            </div>
            <CategoryList
              categories={categories.expense}
              type="expense"
              accounts={accounts}
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
          accounts={accounts}
          editingCategory={editingCategory}
        />
      </div>
    </div>
  );
}
