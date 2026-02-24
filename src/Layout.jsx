
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { Household } from "@/entities/Household";
import {
  Menu,
  X,
  Home,
  CreditCard,
  Settings,
  History,
  Download,
  Wallet,
  LogOut,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from './components/budget/LoadingSpinner';

const navigationItems = [
  {
    title: "דף הבית",
    url: createPageUrl("Dashboard"),
    icon: Home,
    description: "מבט חודשי כללי"
  },
  {
    title: "מבט לחשבון",
    url: createPageUrl("Accounts"),
    icon: CreditCard,
    description: "ניהול חשבונות בנק"
  },
  {
    title: "הגדרות קטגוריות",
    url: createPageUrl("Categories"),
    icon: Settings,
    description: "הגדרת הכנסות והוצאות"
  },
   {
    title: "ניהול משק בית",
    url: createPageUrl("Household"),
    icon: Users,
    description: "ניהול חברים והרשאות"
  },
  {
    title: "היסטוריה חודשית",
    url: createPageUrl("History"),
    icon: History,
    description: "צפייה ועריכת נתונים היסטוריים"
  },
  {
    title: "ייצוא נתונים",
    url: createPageUrl("Export"),
    icon: Download,
    description: "ייצוא ל-CSV"
  }
];

export default function Layout({ children, currentPageName }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndSetup = async () => {
      setIsAuthLoading(true);
      try {
        let currentUser = await User.me();
        
        // Silent setup for new users
        if (!currentUser.householdId) {
          const personalHousehold = await Household.create({ 
            name: `${currentUser.full_name}'s Personal Space`,
            resetDay: 1
          });
          await User.updateMyUserData({ 
            householdId: personalHousehold.id,
            role: 'admin' 
          });
          // Refetch user to get the new householdId
          currentUser = await User.me();
        }
        
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      }
      setIsAuthLoading(false);
    };
    fetchUserAndSetup();
  }, [location.pathname]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await User.logout();
    setUser(null);
    closeMenu();
    window.location.href = createPageUrl('Dashboard');
  };

  if (isAuthLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <style>
        {`
          :root {
            --primary: #3B82F6;
            --primary-hover: #2563EB;
            --success: #10B981;
            --danger: #EF4444;
            --warning: #F59E0B;
            --info: #06B6D4;
            --surface: #FFFFFF;
            --background: #F8FAFC;
            --text-primary: #1E293B;
            --text-secondary: #64748B;
            --border: #E2E8F0;
          }

          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

          * {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
          }

          .menu-overlay {
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            transition: all 0.3s ease;
          }

          .menu-panel {
            transform: translateX(${isMenuOpen ? '0' : '100%'});
            transition: transform 0.3s ease;
          }

          .menu-item {
            transition: all 0.2s ease;
          }

          .menu-item:hover {
            background: var(--primary);
            color: white;
          }

          .menu-item.active {
            background: var(--primary);
            color: white;
          }
        `}
      </style>

      <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-3 fixed top-0 right-0 left-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">BudgetMaster</h1>
              <p className="text-xs text-slate-600">ניהול תקציב מתקדם</p>
            </div>
          </div>

          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </Button>
          )}
        </div>
      </header>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 menu-overlay"
          onClick={closeMenu}
        />
      )}

      {user && (
        <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col menu-panel overflow-y-auto`}>
          <div className="p-6 border-b border-slate-200 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user.full_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 truncate">{user.full_name}</h2>
                  <p className="text-sm text-slate-600 truncate">{user.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeMenu}
                className="hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <nav className="p-4 flex-grow overflow-y-auto">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={closeMenu}
                    className={`flex items-center gap-4 p-4 rounded-xl menu-item ${
                      isActive ? 'active' : 'hover:bg-slate-50'
                    }`}
                  >
                    <item.icon className="w-6 h-6" />
                    <div className="flex-1">
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-sm opacity-80">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="p-4 border-t border-slate-200 shrink-0">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="w-4 h-4 ml-2" />
              התנתק
            </Button>
          </div>
        </div>
      )}

      <main>
        {children}
      </main>
    </div>
  );
}
