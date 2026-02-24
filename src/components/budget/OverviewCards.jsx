import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

function StatCard({ title, amount, icon, colorClass }) {
  const Icon = icon;

  return (
    <Card className={`bg-gradient-to-l from-${colorClass}-50 to-white border-${colorClass}-200 shadow-lg`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium text-${colorClass}-700`}>{title}</p>
            <p className={`text-3xl font-bold text-${colorClass}-800`}>
              ₪{amount.toLocaleString()}
            </p>
          </div>
          <div className={`w-12 h-12 bg-${colorClass}-100 rounded-full flex items-center justify-center`}>
            <Icon className={`w-6 h-6 text-${colorClass}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OverviewCards({ 
  monthlyIncome, 
  monthlyExpenses, 
  monthlyBalance
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="הכנסות חודשיות"
        amount={monthlyIncome}
        icon={TrendingUp}
        colorClass="green"
      />
      <StatCard
        title="הוצאות חודשיות"
        amount={monthlyExpenses}
        icon={TrendingDown}
        colorClass="red"
      />
      <StatCard
        title="יתרה חודשית"
        amount={monthlyBalance}
        icon={Wallet}
        colorClass={monthlyBalance >= 0 ? 'blue' : 'orange'}
      />
    </div>
  );
}