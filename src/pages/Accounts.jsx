import React, { useState, useEffect } from "react";
import { User } from '@/entities/User';
import { Account } from '@/entities/Account';
import { Transaction } from '@/entities/Transaction';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import LoggedOutState from '@/components/budget/LoggedOutState';
import LoadingSpinner from '@/components/budget/LoadingSpinner';
import AccountCard from "@/components/budget/AccountCard";
import AccountDetails from "@/components/budget/AccountDetails";
import AddAccountDialog from "@/components/budget/AddAccountDialog";

export default function Accounts() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [accountBalances, setAccountBalances] = useState({});
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        if (currentUser && currentUser.householdId) {
          loadAccounts(currentUser.householdId);
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        setUser(null);
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const loadAccounts = async (householdId) => {
    setIsLoading(true);
    try {
      const [fetchedAccounts, allTransactions] = await Promise.all([
        Account.filter({ householdId }),
        Transaction.filter({ householdId })
      ]);
      
      setAccounts(fetchedAccounts);
      
      // Calculate balance for each account
      const balances = {};
      fetchedAccounts.forEach(account => {
        let calculatedBalance = account.balance;
        const accountTransactions = allTransactions.filter(t => t.accountId === account.id && t.isExecuted);
        accountTransactions.forEach(transaction => {
          calculatedBalance += transaction.amount;
        });
        balances[account.id] = calculatedBalance;
      });
      setAccountBalances(balances);
      
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
    setIsLoading(false);
  };

  const addAccount = async (accountData) => {
    const newAccountData = {
      ...accountData,
      balance: parseFloat(accountData.balance) || 0,
      householdId: user.householdId,
    };
    
    await Account.create(newAccountData);
    
    if (accounts.length === 0) {
      const newAccounts = await Account.filter({ householdId: user.householdId });
      if(newAccounts.length > 0) {
        await setAsDefault(newAccounts[0].id);
      }
    }
    
    setShowAddDialog(false);
    loadAccounts(user.householdId);
  };

  const updateAccount = async (accountId, updates) => {
    await Account.update(accountId, updates);
    loadAccounts(user.householdId);
    if(selectedAccount?.id === accountId) {
        setSelectedAccount(prev => ({...prev, ...updates}));
    }
  };

  const deleteAccount = async (accountId) => {
    await Account.delete(accountId);
    if (user.defaultAccountId === accountId) {
      const remainingAccounts = accounts.filter(a => a.id !== accountId);
      if (remainingAccounts.length > 0) {
        await setAsDefault(remainingAccounts[0].id);
      } else {
        await User.updateMyUserData({ defaultAccountId: null });
      }
    }
    setSelectedAccount(null);
    loadAccounts(user.householdId);
  };

  const setAsDefault = async (accountId) => {
    await User.updateMyUserData({ defaultAccountId: accountId });
    setUser(prev => ({...prev, defaultAccountId: accountId}));
  };

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <LoggedOutState />;
  
  const sortedAccounts = [...accounts].sort((a, b) => {
    if (a.id === user.defaultAccountId) return -1;
    if (b.id === user.defaultAccountId) return 1;
    return 0;
  });

  if (selectedAccount) {
    return (
      <AccountDetails
        account={selectedAccount}
        onBack={() => setSelectedAccount(null)}
        onUpdate={updateAccount}
        onDelete={deleteAccount}
        isDefault={selectedAccount.id === user.defaultAccountId}
        onSetDefault={setAsDefault}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">חשבונות בנק</h1>
            <p className="text-slate-600">ניהול חשבונות והעברות</p>
          </div>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 ml-2" />
            הוסף חשבון
          </Button>
        </div>

        {accounts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <CreditCard className="w-16 h-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                אין חשבונות קיימים
              </h3>
              <p className="text-slate-500 mb-6">
                הוסף את החשבון הראשון שלך כדי להתחיל לנהל את התקציב
              </p>
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 ml-2" />
                הוסף חשבון ראשון
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {sortedAccounts.map((account, index) => (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AccountCard
                    account={account}
                    isDefault={account.id === user.defaultAccountId}
                    onClick={() => setSelectedAccount(account)}
                    calculatedBalance={accountBalances[account.id]}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <AddAccountDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onAdd={addAccount}
        />
      </div>
    </div>
  );
}