// Module-level in-memory cache – survives React re-renders and page navigation
// but resets on full browser refresh (that's fine – it's a session cache)

let _user = null;
let _lastFetched = 0;
let _dashboardData = null; // { categories, categoryInstances, currentBudgetPeriod, lastUpdateTime }
const CACHE_TTL = 60 * 1000; // 1 minute stale-while-revalidate

export const appCache = {
  getUser() {
    return _user;
  },

  setUser(user) {
    _user = user;
    _lastFetched = Date.now();
  },

  isStale() {
    return !_user || (Date.now() - _lastFetched) > CACHE_TTL;
  },

  getDashboardData() {
    return _dashboardData;
  },

  setDashboardData(data) {
    _dashboardData = data;
  },

  clear() {
    _user = null;
    _lastFetched = 0;
    _dashboardData = null;
  }
};
