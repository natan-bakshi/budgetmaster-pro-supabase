import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

// Hardcoded full class strings so Tailwind JIT never purges them
const colorStyles = {
  green: {
    card: "bg-gradient-to-l from-green-50 to-white dark:from-green-900/30 dark:to-slate-800 border-green-200 dark:border-green-800",
    title: "text-green-700 dark:text-green-400",
    amount: "text-green-800 dark:text-green-300",
    icon: "bg-green-100 dark:bg-green-900/50",
    iconColor: "text-green-600 dark:text-green-400",
  },
  red: {
    card: "bg-gradient-to-l from-red-50 to-white dark:from-red-900/30 dark:to-slate-800 border-red-200 dark:border-red-800",
    title: "text-red-700 dark:text-red-400",
    amount: "text-red-800 dark:text-red-300",
    icon: "bg-red-100 dark:bg-red-900/50",
    iconColor: "text-red-600 dark:text-red-400",
  },
  blue: {
    card: "bg-gradient-to-l from-blue-50 to-white dark:from-blue-900/30 dark:to-slate-800 border-blue-200 dark:border-blue-800",
    title: "text-blue-700 dark:text-blue-400",
    amount: "text-blue-800 dark:text-blue-300",
    icon: "bg-blue-100 dark:bg-blue-900/50",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  orange: {
    card: "bg-gradient-to-l from-orange-50 to-white dark:from-orange-900/30 dark:to-slate-800 border-orange-200 dark:border-orange-800",
    title: "text-orange-700 dark:text-orange-400",
    amount: "text-orange-800 dark:text-orange-300",
    icon: "bg-orange-100 dark:bg-orange-900/50",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
};

function StatCard({ title, amount, icon, colorClass }) {
  const Icon = icon;
  const styles = colorStyles[colorClass] || colorStyles.blue;

  return (
    <Card className={`${styles.card} shadow-lg`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${styles.title}`}>{title}</p>
            <p className={`text-3xl font-bold ${styles.amount}`}>
              ₪{amount.toLocaleString()}
            </p>
          </div>
          <div className={`w-12 h-12 ${styles.icon} rounded-full flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${styles.iconColor}`} />
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
