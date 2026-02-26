// Module-level in-memory cache – survives React re-renders and page navigation
// _lastUpdateTime also persisted in localStorage so it survives full browser refresh

const LS_KEY = 'bm_last_update_time';

let _user = null;
let _lastFetched = 0;
let _dashboardData = null;   // { categories, categoryInstances, currentBudgetPeriod, lastUpdateTime }
let _categoriesData = null;  // { income: [], expense: [] }
let _historyData = null;     // MonthlyHistory[]
let _exportData = null;      // { categories, transactions }
let _householdData = null;   // { members: [], household: {} }
// Initialise from localStorage so the value survives a browser refresh
let _lastUpdateTime = (() => { try { return localStorage.getItem(LS_KEY) || null; } catch { return null; } })();

const CACHE_TTL = 60 * 1000; // 1 minute stale-while-revalidate

export const appCache = {
  // ── User ──────────────────────────────────────────
  getUser() { return _user; },
  setUser(user) { _user = user; _lastFetched = Date.now(); },
  isStale() { return !_user || (Date.now() - _lastFetched) > CACHE_TTL; },

  // ── Dashboard ─────────────────────────────────────
  getDashboardData() { return _dashboardData; },
  setDashboardData(data) {
    _dashboardData = data;
    // keep global lastUpdateTime in sync
    if (data?.lastUpdateTime) this.setLastUpdateTime(data.lastUpdateTime);
  },

  // ── Last update time (global, survives page nav AND browser refresh) ───
  getLastUpdateTime() { return _lastUpdateTime; },
  setLastUpdateTime(t) {
    _lastUpdateTime = t;
    try { if (t) localStorage.setItem(LS_KEY, t); else localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
  },

  // ── Categories page ───────────────────────────────
  getCategoriesData() { return _categoriesData; },
  setCategoriesData(data) { _categoriesData = data; },

  // ── History page ──────────────────────────────────
  getHistoryData() { return _historyData; },
  setHistoryData(data) { _historyData = data; },

  // ── Export page ───────────────────────────────────
  getExportData() { return _exportData; },
  setExportData(data) { _exportData = data; },

  // ── Household page ────────────────────────────────
  getHouseholdData() { return _householdData; },
  setHouseholdData(data) { _householdData = data; },

  // ── Full clear (logout / join household) ──────────
  clear() {
    _user = null;
    _lastFetched = 0;
    _dashboardData = null;
    _categoriesData = null;
    _historyData = null;
    _exportData = null;
    _householdData = null;
    this.setLastUpdateTime(null); // also clears localStorage
  }
};
