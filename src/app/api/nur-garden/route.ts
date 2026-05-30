import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getCustomers,
  addCustomer,
  getSales,
  createSale,
  deleteSale,
  getDebts,
  payDebt,
  getNurGardenAnalytics,
} from "@/lib/services";
import {
  getNurGardenCostingOverview,
  getPackaging,
  updatePackaging,
  addPurchase,
  updatePurchase,
  deletePurchase,
  paySupplierDebt,
  addBoxPurchase,
  deleteBoxPurchase,
  addLogistics,
  deleteLogistics,
  setProductPrices,
  updateProductCostConfig,
  calculateProductCost,
} from "@/lib/nur-garden-cost";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  switch (type) {
    case "products":
      return NextResponse.json(getProducts());
    case "customers":
      return NextResponse.json(getCustomers());
    case "sales":
      return NextResponse.json(getSales());
    case "debts":
      return NextResponse.json(getDebts());
    case "analytics":
      return NextResponse.json(getNurGardenAnalytics());
    case "costing":
      return NextResponse.json(getNurGardenCostingOverview());
    case "productCost":
      return NextResponse.json(
        calculateProductCost(Number(searchParams.get("productId")))
      );
    default:
      return NextResponse.json({
        products: getProducts(),
        customers: getCustomers(),
        sales: getSales(),
        debts: getDebts(),
        analytics: getNurGardenAnalytics(),
        costing: getNurGardenCostingOverview(),
      });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, ...data } = body;

  switch (action) {
    case "addProduct":
      return NextResponse.json(addProduct(data));
    case "updateProduct":
      return NextResponse.json(updateProduct(data.id, data));
    case "deleteProduct":
      return NextResponse.json(deleteProduct(data.id));
    case "addCustomer":
      return NextResponse.json(addCustomer(data));
    case "createSale":
      return NextResponse.json(createSale(data));
    case "deleteSale":
      return NextResponse.json(deleteSale(data.id));
    case "payDebt":
      return NextResponse.json(payDebt(data.id, data.amount));
    case "updatePackaging":
      return NextResponse.json(updatePackaging(data));
    case "addPurchase":
      return NextResponse.json(addPurchase(data));
    case "updatePurchase":
      return NextResponse.json(updatePurchase(data.id, data));
    case "deletePurchase":
      return NextResponse.json(deletePurchase(data.id));
    case "paySupplierDebt":
      return NextResponse.json(paySupplierDebt(data.id, data.amount));
    case "addBoxPurchase":
      return NextResponse.json(addBoxPurchase(data));
    case "deleteBoxPurchase":
      return NextResponse.json(deleteBoxPurchase(data.id));
    case "addLogistics":
      return NextResponse.json(addLogistics(data));
    case "deleteLogistics":
      return NextResponse.json(deleteLogistics(data.id));
    case "setProductPrices":
      return NextResponse.json(
        setProductPrices(data.productId, data.prices)
      );
    case "updateProductCostConfig":
      return NextResponse.json(
        updateProductCostConfig(data.productId, data)
      );
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
