import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function AddCategoryDialog({ 
  open, 
  onClose, 
  onAdd, 
  type, 
  accounts, 
  editingCategory 
}) {
  const [categoryData, setCategoryData] = useState({
    name: '',
    defaultAmount: '',
    executionDate: '',
    showNotes: false
  });

  useEffect(() => {
    if (editingCategory) {
      setCategoryData({
        name: editingCategory.name || '',
        defaultAmount: editingCategory.defaultAmount || '',
        executionDate: editingCategory.executionDate || '',
        showNotes: editingCategory.showNotes || false
      });
    } else {
      setCategoryData({ name: '', defaultAmount: '', executionDate: '', showNotes: false });
    }
  }, [editingCategory, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (categoryData.name.trim()) {
      const dataToSave = {
        ...categoryData,
        defaultAmount: parseFloat(categoryData.defaultAmount) || 0,
        type: type,
      };
      onAdd(dataToSave);
    }
  };

  const handleClose = () => {
    setCategoryData({ name: '', defaultAmount: '', executionDate: '', showNotes: false });
    onClose();
  };

  const executionDays = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-slate-800">
            {editingCategory ? 'ערוך קטגוריה' : `הוסף ${type === 'income' ? 'הכנסה' : 'הוצאה'} חדשה`}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-slate-700">שם הקטגוריה</Label>
            <Input
              id="name"
              value={categoryData.name}
              onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value })}
              placeholder={`לדוגמה: ${type === 'income' ? 'משכורת' : 'שכר דירה'}`}
              className="bg-white text-slate-900"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="defaultAmount" className="text-slate-700">סכום ברירת מחדל</Label>
            <Input
              id="defaultAmount"
              type="number"
              value={categoryData.defaultAmount}
              onChange={(e) => setCategoryData({ ...categoryData, defaultAmount: e.target.value })}
              placeholder="0"
              className="bg-white text-slate-900"
            />
          </div>

          <div>
            <Label className="text-slate-700">תאריך ביצוע בחודש</Label>
            <Select
              value={categoryData.executionDate}
              onValueChange={(value) => setCategoryData({ ...categoryData, executionDate: value })}
            >
              <SelectTrigger className="bg-white text-slate-900">
                <SelectValue placeholder="בחר תאריך (אופציונלי)" />
              </SelectTrigger>
              <SelectContent className="bg-white max-h-60 overflow-y-auto">
                {executionDays.map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Switch
              id="showNotes"
              checked={categoryData.showNotes}
              onCheckedChange={(checked) => setCategoryData({ ...categoryData, showNotes: checked })}
            />
            <Label htmlFor="showNotes" className="text-slate-700">הצג שדה הערות</Label>
          </div>
          
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              ביטול
            </Button>
            <Button 
              type="submit" 
              className={type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {editingCategory ? 'עדכן' : 'הוסף'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
