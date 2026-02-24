import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Star } from "lucide-react";

export default function AccountCard({ account, isDefault, onClick, calculatedBalance }) {
  // Use calculated balance if provided, otherwise use account balance
  const displayBalance = calculatedBalance !== undefined ? calculatedBalance : account.balance;

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
      onClick={onClick}
      style={{ borderRightColor: account.color, borderRightWidth: '4px' }}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: account.color + '20' }}
            >
              <CreditCard 
                className="w-6 h-6" 
                style={{ color: account.color }} 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-800">
                  {account.name}
                </h3>
                {isDefault && (
                  <Badge variant="outline" className="text-xs">
                    <Star className="w-3 h-3 ml-1" />
                    ברירת מחדל
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500">
                נוצר: {account.created_date ? new Date(account.created_date).toLocaleDateString('he-IL') : 'לא ידוע'}
              </p>
            </div>
          </div>
          
          <div className="text-left">
            <div className={`text-2xl font-bold ${
              displayBalance >= 0 ? 'text-green-700' : 'text-red-700'
            }`}>
              ₪{displayBalance.toLocaleString()}
            </div>
            <div className="text-sm text-slate-500">יתרה נוכחית</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}