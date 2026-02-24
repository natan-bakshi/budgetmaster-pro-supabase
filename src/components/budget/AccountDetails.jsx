import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Edit, Trash2, Star, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Transaction } from '@/entities/Transaction';
import { format } from "date-fns";

export default function AccountDetails({ 
  account, 
  onBack, 
  onUpdate, 
  onDelete, 
  isDefault, 
  onSetDefault 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: account.name,
    balance: account.balance,
    color: account.color
  });
  const [transactions, setTransactions] = useState([]);
  const [calculatedBalance, setCalculatedBalance] = useState(account.balance);

  useEffect(() => {
    const fetchTransactionsAndCalculateBalance = async () => {
      if(account?.id) {
        const fetched = await Transaction.filter({ accountId: account.id }, '-date');
        setTransactions(fetched.slice(0, 10)); // Show last 10 transactions
        
        // Calculate current balance based on initial balance + all transactions
        let currentBalance = account.balance;
        fetched.forEach(transaction => {
          if (transaction.isExecuted) {
            currentBalance += transaction.amount;
          }
        });
        setCalculatedBalance(currentBalance);
      }
    }
    fetchTransactionsAndCalculateBalance();
  }, [account]);

  const handleSave = () => {
    onUpdate(account.id, {
      ...editData,
      balance: parseFloat(editData.balance) || 0
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm(`האם אתה בטוח שברצונך למחוק את החשבון "${account.name}"?`)) {
      onDelete(account.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            חזור
          </Button>
          <h1 className="text-3xl font-bold text-slate-800">פרטי חשבון</h1>
        </div>

        {/* Account Info Card */}
        <Card className="mb-8" style={{ borderRightColor: account.color, borderRightWidth: '4px' }}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: account.color + '20' }}
                >
                  <span className="text-xl font-bold" style={{ color: account.color }}>
                    {account.name.charAt(0)}
                  </span>
                </div>
                <div>
                  {isEditing ? (
                    <Input
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="text-xl font-semibold"
                    />
                  ) : (
                    <span className="text-xl font-semibold">{account.name}</span>
                  )}
                  {isDefault && (
                    <Badge variant="outline" className="text-xs mr-2">
                      <Star className="w-3 h-3 ml-1" />
                      ברירת מחדל
                    </Badge>
                  )}
                </div>
              </CardTitle>
              
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} size="sm">שמור</Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)} 
                      size="sm"
                    >
                      ביטול
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {!isDefault && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onSetDefault(account.id)}
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDelete}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-slate-700">יתרה נוכחית (כולל עסקאות)</label>
                <div className={`text-2xl font-bold mt-1 ${
                  calculatedBalance >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  ₪{calculatedBalance.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">יתרה בסיסית</label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editData.balance}
                    onChange={(e) => setEditData({ ...editData, balance: e.target.value })}
                    className="text-lg font-medium mt-1"
                  />
                ) : (
                  <div className="text-lg font-medium mt-1">
                    ₪{account.balance.toLocaleString()}
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700">צבע חשבון</label>
                {isEditing ? (
                  <Input
                    type="color"
                    value={editData.color}
                    onChange={(e) => setEditData({ ...editData, color: e.target.value })}
                    className="w-full h-12 mt-1"
                  />
                ) : (
                  <div 
                    className="w-full h-12 rounded-md border mt-1"
                    style={{ backgroundColor: account.color }}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>תנועות אחרונות בחשבון</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                אין תנועות להצגה בחשבון זה.
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{transaction.notes || 'ללא תיאור'}</div>
                        <div className="text-sm text-slate-500">
                          {format(new Date(transaction.date), 'dd/MM/yyyy')}
                          {!transaction.isExecuted && (
                            <span className="text-orange-600 mr-2">(מתוכנן)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`font-semibold ${
                      transaction.amount >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      ₪{Math.abs(transaction.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}