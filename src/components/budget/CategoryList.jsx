import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Edit, Trash2, Calendar, DollarSign } from "lucide-react";

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
      <Card className="text-center py-12">
        <CardContent>
          <DollarSign className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            אין קטגוריות {type === 'income' ? 'הכנסות' : 'הוצאות'}
          </h3>
          <p className="text-slate-500">
            הוסף את הקטגוריה הראשונה כדי להתחיל
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((category, index) => (
        <Card key={category.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMove(type, category.id, 'up')}
                  disabled={index === 0}
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMove(type, category.id, 'down')}
                  disabled={index === categories.length - 1}
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(type, category)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(category.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-slate-600">סכום ברירת מחדל</div>
              <div className="font-semibold">
                ₪{(category.defaultAmount || 0).toLocaleString()}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {category.executionDate && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {category.executionDate} בחודש
                </Badge>
              )}
              {category.showNotes && (
                <Badge variant="outline">
                  יש הערות
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
