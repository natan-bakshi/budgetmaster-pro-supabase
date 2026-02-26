import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

// Hardcoded full class strings so Tailwind JIT never purges them
const colorStyles = {
  green: {
    card: "bg-gradient-to-l from-green-50 to-white border-green-200",
    title: "text-green-700",
    amount: "text-green-800",
    icon: "bg-green-100",
    iconColor: "text-green-600",
  },
  red: {
    card: "bg-gradient-to-l from-red-50 to-white border-red-200",
    title: "text-red-700",
    amount: "text-red-800",
    icon: "bg-red-100",
    iconColor: "text-red-600",
  },
  blue: {
    card: "bg-gradient-to-l from-blue-50 to-white border-blue-200",
    title: "text-blue-700",
    amount: "text-blue-800",
    icon: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  orange: {
    card: "bg-gradient-to-l from-orange-50 to-white border-orange-200",
    title: "text-orange-700",
    amount: "text-orange-800",
    icon: "bg-orange-100",
    iconColor: "text-orange-600",
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
