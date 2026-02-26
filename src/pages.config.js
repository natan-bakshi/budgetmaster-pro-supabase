/**
 * pages.config.js - Page routing configuration
 */
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import History from './pages/History';
import Export from './pages/Export';
import Household from './pages/Household';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Dashboard": Dashboard,
    "Categories": Categories,
    "History": History,
    "Export": Export,
    "Household": Household,
    "Settings": Settings,
};

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
