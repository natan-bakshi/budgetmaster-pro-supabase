
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { Household } from "@/entities/Household";
import { base44 } from "@/api/base44Client";
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
    // Redirect to login or home page after logout
    window.location.href = createPageUrl('Dashboard');
  };

  if (isAuthLoading) {
    return <LoadingSpinner />;
  }

  // If user is not logged in, children will handle the logged-out state.
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

          <div className="p-4 border-t border-slate-200 shrink-0 space-y-3">
            <a
              href={base44.agents.getWhatsAppConnectURL('budget_master_agent')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
            >
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
              <div className="flex-1 text-right">
                <div className="font-semibold text-slate-800">מאסטר בוואטסאפ</div>
                <div className="text-xs text-slate-600">נהל תקציב מהנייד</div>
              </div>
            </a>
            
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
