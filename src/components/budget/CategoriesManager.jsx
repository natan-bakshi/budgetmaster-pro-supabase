import React, { useState, useEffect } from "react";
import { CategoryInstance } from '@/entities/CategoryInstance';
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Save, RotateCcw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const CategoryEntry = ({ category, instance, onOptimisticUpdate, onUpdate }) => {
    const [amount, setAmount] = useState(instance.currentAmount.toString());
    const [notes, setNotes] = useState(instance.notes || '');
    const [isSaving, setIsSaving] = useState(false);

    // Sync local state when instance prop changes (from optimistic updates by other components)
    useEffect(() => {
        setAmount(instance.currentAmount.toString());
        setNotes(instance.notes || '');
    }, [instance.currentAmount, instance.notes]);

    const hasUnsavedChanges = amount !== instance.currentAmount.toString() || notes !== (instance.notes || '');
    const isModifiedFromDefault = instance.currentAmount !== (category.defaultAmount || 0) || (instance.notes || '') !== '';

    const handleSave = async () => {
        const newAmount = parseFloat(amount) || 0;
        const newNotes = notes;
        setIsSaving(true);

        // 1. Optimistic update – update UI immediately
        onOptimisticUpdate({ instanceId: instance.id, newAmount, newNotes });

        try {
            // 2. Persist to server in background
            await CategoryInstance.update(instance.id, {
                currentAmount: newAmount,
                notes: newNotes
            });
            // 3. Update lastUpdateTime on server (fire and forget – UI already updated)
            User.updateMyUserData({ lastUpdateTime: new Date().toISOString() }).catch(console.error);
        } catch (error) {
            console.error('Error saving category:', error);
            // On error: roll back by reloading from server
            onUpdate();
        }
        setIsSaving(false);
    };

    const handleReset = async () => {
        const newAmount = category.defaultAmount || 0;
        const newNotes = '';

        // Optimistic update
        onOptimisticUpdate({ instanceId: instance.id, newAmount, newNotes });

        try {
            await CategoryInstance.update(instance.id, {
                currentAmount: newAmount,
                notes: newNotes
            });
            User.updateMyUserData({ lastUpdateTime: new Date().toISOString() }).catch(console.error);
        } catch (error) {
            console.error('Error resetting category:', error);
            onUpdate();
        }
    };

    const handleAmountFocus = (e) => { e.target.select(); };
    const handleNotesFocus = (e) => { e.target.select(); };

    const isIncome = category.type === 'income';

    return (
        <Card className="bg-slate-50">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        {isIncome ?
                            <TrendingUp className="w-5 h-5 text-green-600"/> :
                            <TrendingDown className="w-5 h-5 text-red-600"/>
                        }
                        <div>
                            <div className="font-semibold">{category.name}</div>
                            <div className="text-xs text-slate-500">
                                ברירת מחדל: ₪{(category.defaultAmount || 0).toLocaleString()}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {hasUnsavedChanges && (
                            <Button
                                size="sm"
                                onClick={handleSave}
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={isSaving}
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? 'שומר...' : ''}
                            </Button>
                        )}
                        {isModifiedFromDefault && !hasUnsavedChanges && (
                            <Button size="sm" variant="outline" onClick={handleReset} className="text-orange-600 hover:text-orange-700">
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
                {isModifiedFromDefault && !hasUnsavedChanges && (
                    <Badge variant="outline" className="w-fit text-xs">שונה מברירת מחדל</Badge>
                )}
            </CardHeader>
            <CardContent className="space-y-3">
                <div>
                    <label className="text-sm font-medium text-slate-700">סכום לחודש זה</label>
                    <Input
                        type="number"
                        value={amount}
                        placeholder={(category.defaultAmount || 0).toString()}
                        onChange={(e) => setAmount(e.target.value)}
                        className={`text-lg font-semibold ${isIncome ? 'text-green-700' : 'text-red-700'}`}
                        onFocus={handleAmountFocus}
                    />
                </div>

                {category.showNotes && (
                    <div>
                        <label className="text-sm font-medium text-slate-700">הערות</label>
                        <Textarea
                            value={notes}
                            placeholder="הערות לחודש זה..."
                            onChange={(e) => setNotes(e.target.value)}
                            className="h-20"
                            onFocus={handleNotesFocus}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default function CategoriesManager({ user, categories, categoryInstances, onOptimisticUpdate, onUpdate }) {
  const getInstanceForCategory = (categoryId) => {
    return categoryInstances.find(inst => inst.categoryId === categoryId);
  };

  const sortedIncomeCategories = [...categories.income].sort((a, b) => (a.order || 0) - (b.order || 0));
  const sortedExpenseCategories = [...categories.expense].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <Card>
      <CardHeader>
        <CardTitle>ניהול תקציב חודשי</CardTitle>
        <CardDescription>
          עדכן את הסכומים לתקופה הנוכחית. הערכים יתאפסו אוטומטית בתחילת התקופה הבאה בהתאם להגדרות משק הבית.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="expense" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <TabsTrigger
              value="income"
              className="flex items-center gap-2 rounded-lg font-semibold data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-500"
            >
              <TrendingUp className="w-4 h-4" />
              הכנסות ({sortedIncomeCategories.length})
            </TabsTrigger>
            <TabsTrigger
              value="expense"
              className="flex items-center gap-2 rounded-lg font-semibold data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-500"
            >
              <TrendingDown className="w-4 h-4" />
              הוצאות ({sortedExpenseCategories.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="income">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedIncomeCategories.map(category => {
                  const instance = getInstanceForCategory(category.id);
                  if (!instance) return null;
                  return (
                    <CategoryEntry
                      key={instance.id}
                      category={category}
                      instance={instance}
                      onOptimisticUpdate={onOptimisticUpdate}
                      onUpdate={onUpdate}
                    />
                  );
              })}
            </div>
          </TabsContent>

          <TabsContent value="expense">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedExpenseCategories.map(category => {
                  const instance = getInstanceForCategory(category.id);
                  if (!instance) return null;
                  return (
                    <CategoryEntry
                      key={instance.id}
                      category={category}
                      instance={instance}
                      onOptimisticUpdate={onOptimisticUpdate}
                      onUpdate={onUpdate}
                    />
                  );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
