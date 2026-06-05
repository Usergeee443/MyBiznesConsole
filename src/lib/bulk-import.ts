import { isMySqlConfigured } from "./mysql";
import type { ImportResult, ImportType } from "./utils";

type ImportOptions = { historical?: boolean; dryRun?: boolean };

export async function runBulkImport(
  type: ImportType,
  rows: Record<string, unknown>[],
  options: ImportOptions = {}
): Promise<ImportResult> {
  if (isMySqlConfigured()) {
    const mod = await import("./bulk-import-mysql");
    return mod.runBulkImport(type, rows, options);
  }
  const mod = await import("./bulk-import-sqlite");
  return mod.runBulkImport(type, rows, options);
}
