import { CostDB } from "../domain/pricing";
import { defaultCostDB } from "./defaultCostDB";
import { importCostDBFromExcel } from "./excelImport";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Carga inicial:
// 1) Si existe server/assets/seed.xlsx, lo importamos (precios/reglas editables desde Excel)
// 2) Si no existe, usamos defaultCostDB
function loadSeedOrDefault(): CostDB {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const seedPath = path.resolve(__dirname, "../../assets/seed.xlsx");
    if (fs.existsSync(seedPath)) {
      const buf = fs.readFileSync(seedPath);
      return importCostDBFromExcel(buf);
    }
  } catch {
    // fall back
  }
  return structuredClone(defaultCostDB);
}

let db: CostDB = loadSeedOrDefault();
export const getDB = () => db;
export const setDB = (next: CostDB) => { db = next; };
