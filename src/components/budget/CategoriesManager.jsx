import React, { useState, useEffect, useRef } from "react";
import { CategoryInstance } from '@/entities/CategoryInstance';
import { User } from '@/entities/User';
import { appCache } from '@/appCache';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Save, RotateCcw, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

// ─────────────────────────────────────────────────────────────────────────────
// AccumulateRow – inline +₪ adder, no dialog, no extra clutter
// ─────────────────────────────────────────────────────────────────────────────
function AccumulateRow({ currentAmount, onAdd }) {
  const [addValue, setAddValue] = useState('');
  const [adding, setAdding] = useState(false);
  const inputRef = useRef(null);

  const handleConfirm = async () => {
    const delta = parseFloat(addValue);
    if (!delta || isNaN(delta)) return;
    setAdding(true);
    await onAdd(delta);
    setAddValue('');
    setAdding(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') setAddValue('');
  };

  return (
    <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-600">
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">
        הוסף לסכום הקיים – הקלד סכום ולחץ ✓ (ניתן לחזור כמה פעמים)
      </p>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 shrink-0">+₪</span>
        <Input
          ref={inputRef}
          type="number"
          min="0"
          value={addValue}
          onChange={(e) => setAddValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="0"
          className="h-8 text-sm dark:bg-slate-600 dark:border-slate-500 dark:text-slate-100"
        />
        <Button
          size="sm"
          disabled={!addValue || adding}
          onClick={handleConfirm}
          className="h-8 w-8 p-0 bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
          aria-label="הוסף לסכום"
        >
          <Check className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CategoryEntry
// ─────────────────────────────────────────────────────────────────────────────
const CategoryEntry = ({ category, instance, onOptimisticUpdate, onUpdate }) => {
  const [amount, setAmount] = useState(instance.currentAmount.toString());
  const [notes, setNotes] = useState(instance.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setAmount(instance.currentAmount.toString());
    setNotes(instance.notes || '');
  }, [instance.currentAmount, instance.notes]);

  const hasUnsavedChanges = amount !== instance.currentAmount.toString() || notes !== (instance.notes || '');
  const isModifiedFromDefault = instance.currentAmount !== (category.defaultAmount || 0) || (instance.notes || '') !== '';

  const persistSave = async (newAmount, newNotes) => {
    try {
      await CategoryInstance.update(instance.id, { currentAmount: newAmount, notes: newNotes });
      const now = new Date().toISOString();
      User.updateMyUserData({ lastUpdateTime: now }).catch(console.error);
    } catch (error) {
      console.error('Error saving category:', error);
      onUpdate();
    }
  };

  const handleSave = async () => {
    const newAmount = parseFloat(amount) || 0;
    const newNotes  = notes;
    setIsSaving(true);
    onOptimisticUpdate({ instanceId: instance.id, newAmount, newNotes });
    await persistSave(newAmount, newNotes);
    setIsSaving(false);
  };

  const handleReset = async () => {
    const newAmount = category.defaultAmount || 0;
    const newNotes  = '';
    onOptimisticUpdate({ instanceId: instance.id, newAmount, newNotes });
    await persistSave(newAmount, newNotes);
  };

  // Accumulate: add delta on top of CURRENT server-synced amount
  const handleAccumulate = async (delta) => {
    const newAmount = (parseFloat(instance.currentAmount) || 0) + delta;
    const newNotes  = instance.notes || '';
    onOptimisticUpdate({ instanceId: instance.id, newAmount, newNotes });
    await persistSave(newAmount, newNotes);
  };

  const handleAmountFocus = (e) => e.target.select();
  const handleNotesFocus  = (e) => e.target.select();
  const isIncome = category.type === 'income';

  return (
    <Card className="bg-slate-50 dark:bg-slate-700 dark:border-slate-600">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {isIncome
              ? <TrendingUp  className="w-5 h-5 text-green-600 dark:text-green-400" />
              : <TrendingDown className="w-5 h-5 text-red-600   dark:text-red-400"   />}
            <div>
              <div className="font-semibold dark:text-slate-100">{category.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
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
              <Button size="sm" variant="outline" onClick={handleReset}
                className="text-orange-600 hover:text-orange-700 dark:border-slate-500 dark:hover:bg-slate-600">
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        {isModifiedFromDefault && !hasUnsavedChanges && (
          <Badge variant="outline" className="w-fit text-xs dark:border-slate-500 dark:text-slate-300">
            שונה מברירת מחדל
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">סכום לחודש זה</label>
          <Input
            type="number"
            value={amount}
            placeholder={(category.defaultAmount || 0).toString()}
            onChange={(e) => setAmount(e.target.value)}
            className={`text-lg font-semibold dark:bg-slate-600 dark:border-slate-500 dark:text-slate-100
              ${isIncome ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}
            onFocus={handleAmountFocus}
          />
        </div>

        {category.showNotes && (
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">הערות</label>
            <Textarea
              value={notes}
              placeholder="הערות לחודש זה..."
              onChange={(e) => setNotes(e.target.value)}
              className="h-20 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-100 dark:placeholder-slate-400"
              onFocus={handleNotesFocus}
            />
          </div>
        )}

        {/* Accumulate row – shown only when feature is enabled for this category */}
        {category.allowAccumulate && (
          <AccumulateRow
            currentAmount={instance.currentAmount}
            onAdd={handleAccumulate}
          />
        )}
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CategoriesManager (parent)
// ─────────────────────────────────────────────────────────────────────────────
export default function CategoriesManager({ user, categories, categoryInstances, onOptimisticUpdate, onUpdate }) {
  const getInstanceForCategory = (categoryId) =>
    categoryInstances.find(inst => inst.categoryId === categoryId);

  const sortedIncomeCategories  = [...categories.income ].sort((a, b) => (a.order || 0) - (b.order || 0));
  const sortedExpenseCategories = [...categories.expense].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="dark:text-slate-100">ניהול תקציב חודשי</CardTitle>
        <CardDescription className="dark:text-slate-400">
          עדכן את הסכומים לתקופה הנוכחית. הערכים יתאפסו אוטומטית בתחילת התקופה הבאה בהתאם להגדרות משק הבית.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="expense" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
            <TabsTrigger
              value="income"
              className="flex items-center gap-2 rounded-lg font-semibold data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-500 dark:text-slate-400"
            >
              <TrendingUp className="w-4 h-4" />
              הכנסות ({sortedIncomeCategories.length})
            </TabsTrigger>
            <TabsTrigger
              value="expense"
              className="flex items-center gap-2 rounded-lg font-semibold data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-500 dark:text-slate-400"
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
