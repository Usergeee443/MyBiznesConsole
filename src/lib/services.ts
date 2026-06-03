import { isMySqlConfigured } from "./mysql";

type ServiceModule = typeof import("./services-sqlite");

async function loadBackend(): Promise<ServiceModule> {
  if (isMySqlConfigured()) {
    return import("./services-mysql") as Promise<ServiceModule>;
  }
  return import("./services-sqlite");
}

function wrap<K extends keyof ServiceModule>(name: K) {
  const fn = async (...args: Parameters<ServiceModule[K]>) => {
    const mod = await loadBackend();
    const impl = mod[name] as (...a: Parameters<ServiceModule[K]>) => unknown;
    return impl(...args);
  };
  return fn as ServiceModule[K];
}

export const getAccountBalance = wrap("getAccountBalance");
export const getFundBalance = wrap("getFundBalance");
export const getAllAccounts = wrap("getAllAccounts");
export const getBalanceOverview = wrap("getBalanceOverview");
export const addTransaction = wrap("addTransaction");
export const getRecentTransactions = wrap("getRecentTransactions");
export const getTransaction = wrap("getTransaction");
export const updateTransaction = wrap("updateTransaction");
export const deleteTransaction = wrap("deleteTransaction");
export const getProducts = wrap("getProducts");
export const addProduct = wrap("addProduct");
export const updateProduct = wrap("updateProduct");
export const deleteProduct = wrap("deleteProduct");
export const getCustomers = wrap("getCustomers");
export const addCustomer = wrap("addCustomer");
export const getSales = wrap("getSales");
export const createSale = wrap("createSale");
export const deleteSale = wrap("deleteSale");
export const getDebts = wrap("getDebts");
export const payDebt = wrap("payDebt");
export const getNurGardenAnalytics = wrap("getNurGardenAnalytics");
export const getArenaTopStats = wrap("getArenaTopStats");
export const addArenaTopStat = wrap("addArenaTopStat");
export const updateArenaTopStat = wrap("updateArenaTopStat");
export const deleteArenaTopStat = wrap("deleteArenaTopStat");
export const getArenaTopAnalytics = wrap("getArenaTopAnalytics");
export const getFunds = wrap("getFunds");
export const getFundAllocations = wrap("getFundAllocations");
export const getFundDeposits = wrap("getFundDeposits");
export const deleteFundDeposit = wrap("deleteFundDeposit");
export const allocateFundsForMonth = wrap("allocateFundsForMonth");
export const getFundsOverview = wrap("getFundsOverview");
export const getMonthlyExpenses = wrap("getMonthlyExpenses");
export const getDashboardStats = wrap("getDashboardStats");
