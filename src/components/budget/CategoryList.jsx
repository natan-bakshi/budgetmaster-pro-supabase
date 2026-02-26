import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Edit, Trash2, Calendar, DollarSign, PlusCircle } from "lucide-react";

export default function CategoryList({
  categories,
  type,
  accounts,
  onEdit,
  onDelete,
  onMove
}) {
  const handleDelete = (categoryId) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את הקטגוריה?')) {
      onDelete(type, categoryId);
    }
  };

  if (categories.length === 0) {
    return (
      <Card className="text-center py-12 dark:bg-slate-800 dark:border-slate-700">
        <CardContent>
          <DollarSign className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
            אין קטגוריות {type === 'income' ? 'הכנסות' : 'הוצאות'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            הוסף את הקטגוריה הראשונה כדי להתחיל
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((category, index) => (
        <Card key={category.id} className="hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg dark:text-slate-100">{category.name}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() => onMove(type, category.id, 'up')}
                  disabled={index === 0}
                  className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 disabled:dark:opacity-40"
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => onMove(type, category.id, 'down')}
                  disabled={index === categories.length - 1}
                  className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 disabled:dark:opacity-40"
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => onEdit(type, category)}
                  className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => handleDelete(category.id)}
                  className="text-red-600 dark:text-red-400 dark:border-slate-600 dark:hover:bg-slate-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-slate-600 dark:text-slate-400">סכום ברירת מחדל</div>
              <div className="font-semibold dark:text-slate-200">
                ₪{(category.defaultAmount || 0).toLocaleString()}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {category.executionDate && (
                <Badge variant="outline" className="flex items-center gap-1 dark:border-slate-600 dark:text-slate-300">
                  <Calendar className="w-3 h-3" />
                  {category.executionDate} בחודש
                </Badge>
              )}
              {category.showNotes && (
                <Badge variant="outline" className="dark:border-slate-600 dark:text-slate-300">יש הערות</Badge>
              )}
              {category.allowAccumulate && (
                <Badge variant="outline" className="flex items-center gap-1 text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-700">
                  <PlusCircle className="w-3 h-3" />
                  מצב צבירה
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
