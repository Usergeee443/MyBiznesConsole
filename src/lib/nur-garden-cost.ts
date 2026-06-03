import { isMySqlConfigured } from "./mysql";

type CostModule = typeof import("./nur-garden-cost-sqlite");
type CostFnKey = {
  [K in keyof CostModule]: CostModule[K] extends (...args: never[]) => unknown
    ? K
    : never;
}[keyof CostModule];

async function loadBackend(): Promise<CostModule> {
  if (isMySqlConfigured()) {
    return import("./nur-garden-cost-mysql") as unknown as Promise<CostModule>;
  }
  return import("./nur-garden-cost-sqlite");
}

function wrap<K extends CostFnKey>(name: K) {
  return (async (...args: Parameters<CostModule[K]>) => {
    const mod = await loadBackend();
    const impl = mod[name] as (...a: Parameters<CostModule[K]>) => unknown;
    return impl(...args);
  }) as unknown as CostModule[K];
}

export const PRICE_TIERS = {
  shop: { label: "Do'kon", key: "shop" },
  wholesale: { label: "Optom", key: "wholesale" },
  online: { label: "Online marketplace", key: "online" },
} as const;

export const getPackaging = wrap("getPackaging");
export const updatePackaging = wrap("updatePackaging");
export const getProductPrices = wrap("getProductPrices");
export const setProductPrices = wrap("setProductPrices");
export const getProductCostConfig = wrap("getProductCostConfig");
export const updateProductCostConfig = wrap("updateProductCostConfig");
export const getPurchases = wrap("getPurchases");
export const addPurchase = wrap("addPurchase");
export const updatePurchase = wrap("updatePurchase");
export const deletePurchase = wrap("deletePurchase");
export const getSupplierDebts = wrap("getSupplierDebts");
export const paySupplierDebt = wrap("paySupplierDebt");
export const getBoxPurchases = wrap("getBoxPurchases");
export const addBoxPurchase = wrap("addBoxPurchase");
export const deleteBoxPurchase = wrap("deleteBoxPurchase");
export const getLogistics = wrap("getLogistics");
export const addLogistics = wrap("addLogistics");
export const deleteLogistics = wrap("deleteLogistics");
export const calculateProductCost = wrap("calculateProductCost");
export const getNurGardenCostingOverview = wrap("getNurGardenCostingOverview");
