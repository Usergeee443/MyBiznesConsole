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
      return NextResponse.json(await getProducts());
    case "customers":
      return NextResponse.json(await getCustomers());
    case "sales":
      return NextResponse.json(await getSales());
    case "debts":
      return NextResponse.json(await getDebts());
    case "analytics":
      return NextResponse.json(await getNurGardenAnalytics());
    case "costing":
      return NextResponse.json(await getNurGardenCostingOverview());
    case "productCost":
      return NextResponse.json(
        await calculateProductCost(Number(searchParams.get("productId")))
      );
    default:
      return NextResponse.json({
        products: await getProducts(),
        customers: await getCustomers(),
        sales: await getSales(),
        debts: await getDebts(),
        analytics: await getNurGardenAnalytics(),
        costing: await getNurGardenCostingOverview(),
      });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, ...data } = body;

  switch (action) {
    case "addProduct":
      return NextResponse.json(await addProduct(data));
    case "updateProduct":
      return NextResponse.json(await updateProduct(data.id, data));
    case "deleteProduct":
      return NextResponse.json(await deleteProduct(data.id));
    case "addCustomer":
      return NextResponse.json(await addCustomer(data));
    case "createSale":
      return NextResponse.json(await createSale(data));
    case "deleteSale":
      return NextResponse.json(await deleteSale(data.id));
    case "payDebt":
      return NextResponse.json(await payDebt(data.id, data.amount));
    case "updatePackaging":
      return NextResponse.json(await updatePackaging(data));
    case "addPurchase":
      return NextResponse.json(await addPurchase(data));
    case "updatePurchase":
      return NextResponse.json(await updatePurchase(data.id, data));
    case "deletePurchase":
      return NextResponse.json(await deletePurchase(data.id));
    case "paySupplierDebt":
      return NextResponse.json(await paySupplierDebt(data.id, data.amount));
    case "addBoxPurchase":
      return NextResponse.json(await addBoxPurchase(data));
    case "deleteBoxPurchase":
      return NextResponse.json(await deleteBoxPurchase(data.id));
    case "addLogistics":
      return NextResponse.json(await addLogistics(data));
    case "deleteLogistics":
      return NextResponse.json(await deleteLogistics(data.id));
    case "setProductPrices":
      return NextResponse.json(
        await setProductPrices(data.productId, data.prices)
      );
    case "updateProductCostConfig":
      return NextResponse.json(
        await updateProductCostConfig(data.productId, data)
      );
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
