import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const defaultColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export default function AddAccountDialog({ open, onClose, onAdd }) {
  const [accountData, setAccountData] = useState({
    name: '',
    balance: '',
    color: defaultColors[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (accountData.name.trim()) {
      onAdd(accountData);
      setAccountData({ name: '', balance: '', color: defaultColors[0] });
    }
  };

  const handleClose = () => {
    setAccountData({ name: '', balance: '', color: defaultColors[0] });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוסף חשבון בנק חדש</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">שם החשבון</Label>
            <Input
              id="name"
              value={accountData.name}
              onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
              placeholder="לדוגמה: חשבון עובר ושב"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="balance">יתרה התחלתית</Label>
            <Input
              id="balance"
              type="number"
              value={accountData.balance}
              onChange={(e) => setAccountData({ ...accountData, balance: e.target.value })}
              placeholder="0"
            />
          </div>
          
          <div>
            <Label>צבע החשבון</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {defaultColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-10 h-10 rounded-full border-2 ${
                    accountData.color === color ? 'border-slate-400' : 'border-slate-200'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setAccountData({ ...accountData, color })}
                />
              ))}
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              ביטול
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              הוסף חשבון
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}