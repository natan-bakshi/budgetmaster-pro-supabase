import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { appCache } from "@/appCache";
import { useTheme } from "@/themeContext";
import {
  Menu,
  X,
  Home,
  Settings,
  History,
  Download,
  Wallet,
  LogOut,
  Users,
  SlidersHorizontal,
  Accessibility
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "דף הבית",            url: createPageUrl("Dashboard"),  icon: Home,              description: "מבט חודשי כללי" },
  { title: "הגדרות קטגוריות",    url: createPageUrl("Categories"), icon: Settings,          description: "הגדרת הכנסות והוצאות" },
  { title: "ניהול משק בית",      url: createPageUrl("Household"),  icon: Users,             description: "ניהול חברים והרשאות" },
  { title: "היסטוריה חודשית",    url: createPageUrl("History"),    icon: History,           description: "צפייה ועריכת נתונים היסטוריים" },
  { title: "ייצוא נתונים",       url: createPageUrl("Export"),     icon: Download,          description: "ייצוא ל-CSV" },
  { title: "הגדרות",             url: createPageUrl("Settings"),   icon: SlidersHorizontal, description: "מצב תצוגה והגדרות" },
];

const bottomNavItems = [
  { title: "בית",       url: createPageUrl("Dashboard"),  icon: Home },
  { title: "קטגוריות",  url: createPageUrl("Categories"), icon: Settings },
  { title: "משק בית",   url: createPageUrl("Household"),  icon: Users },
  { title: "היסטוריה",  url: createPageUrl("History"),    icon: History },
  { title: "ייצוא",     url: createPageUrl("Export"),     icon: Download },
];

export default function Layout({ children, currentPageName }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(() => appCache.getUser());
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    const fetchUser = async () => {
      if (!appCache.isStale()) {
        setUser(appCache.getUser());
        return;
      }
      try {
        const currentUser = await User.me();
        if (cancelled) return;
        if (!currentUser.householdId) {
          appCache.setUser(null);
          setUser(null);
        } else {
          appCache.setUser(currentUser);
          setUser(currentUser);
        }
      } catch (e) {
        if (!cancelled) {
          appCache.setUser(null);
          setUser(null);
        }
      }
    };
    fetchUser();
    return () => { cancelled = true; };
  }, [location.pathname]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu  = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    await User.logout();
    appCache.clear();
    setUser(null);
    closeMenu();
    window.location.href = createPageUrl('Dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" dir="rtl">
      {/* ── Accessibility: skip to main content ── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold"
      >
        דלג לתוכן הראשי
      </a>

      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
          .menu-overlay { background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); transition: all 0.3s ease; }
          .menu-panel { transform: translateX(${isMenuOpen ? '0' : '100%'}); transition: transform 0.3s ease; }
          .menu-item { transition: all 0.2s ease; }
          .menu-item:hover { background: #3B82F6; color: white; }
          .menu-item.active { background: #3B82F6; color: white; }
          :focus-visible { outline: 3px solid #3B82F6 !important; outline-offset: 2px !important; border-radius: 4px !important; }
        `}
      </style>

      {/* ── Top header ── */}
      <header
        role="banner"
        className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 px-4 py-3 fixed top-0 right-0 left-0 z-40 h-16"
      >
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">BudgetMaster</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">ניהול תקציב</p>
            </div>
          </div>
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}
              aria-expanded={isMenuOpen}
              aria-controls="main-nav-panel"
              className="hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <Menu className="w-6 h-6" aria-hidden="true" />
            </Button>
          )}
        </div>
      </header>

      {/* ── Burger overlay ── */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 menu-overlay"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* ── Burger side panel ── */}
      {user && (
        <div
          id="main-nav-panel"
          role="navigation"
          aria-label="תפריט ראשי"
          className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-800 shadow-2xl z-50 flex flex-col menu-panel overflow-y-auto"
          aria-hidden={!isMenuOpen}
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  aria-hidden="true"
                >
                  {user.full_name ? user.full_name.charAt(0) : 'U'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">{user.full_name}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeMenu}
                aria-label="סגור תפריט"
                className="hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </Button>
            </div>
          </div>

          <nav aria-label="ניווט דפים" className="p-4 flex-grow overflow-y-auto">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={closeMenu}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-4 p-4 rounded-xl menu-item ${
                      isActive ? 'active' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <item.icon className="w-6 h-6 shrink-0" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{item.title}</div>
                      <div className="text-sm opacity-70 truncate">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <LogOut className="w-4 h-4 ml-2" aria-hidden="true" />
              התנתק
            </Button>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main id="main-content" className="pt-16 pb-20 md:pb-0" role="main" tabIndex={-1}>
        {children}
      </main>

      {/* ── Accessibility floating button ── */}
      {user && (
        <button
          onClick={() => navigate(createPageUrl('Settings'))}
          aria-label="הגדרות נגישות ותצוגה"
          title="הגדרות נגישות ותצוגה"
          className="fixed bottom-24 left-4 md:bottom-6 z-40 w-11 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        >
          <Accessibility className="w-5 h-5" aria-hidden="true" />
        </button>
      )}

      {/* ── Mobile bottom navigation ── */}
      {user && (
        <nav
          aria-label="ניווט תחתון"
          className="md:hidden fixed bottom-0 right-0 left-0 z-40 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg"
        >
          <div className="flex items-stretch h-16">
            {bottomNavItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  aria-label={item.title}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                    aria-hidden="true"
                  />
                  <span className={`font-medium ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : ''
                  }`}>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
