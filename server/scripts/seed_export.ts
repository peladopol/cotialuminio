import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

type Seed = Record<string, any>;

function main() {
  const assetsDir = path.resolve(process.cwd(), "assets");
  const seedPath = path.join(assetsDir, "seed.json");
  if (!fs.existsSync(seedPath)) {
    console.error("No existe", seedPath);
    process.exit(1);
  }
  const seed = JSON.parse(fs.readFileSync(seedPath, "utf-8")) as Seed;

  const wb = XLSX.utils.book_new();

  // Parametros
  const p = seed.parametros ?? {};
  const paramRows = Object.entries(p).map(([Clave, Valor]) => ({ Clave, Valor }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paramRows), "Parametros");

  // Helper: append array sheets if present
  const appendArraySheet = (key: string, sheetName: string) => {
    const arr = seed[key];
    if (!Array.isArray(arr)) return;
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(arr), sheetName);
  };

  appendArraySheet("vidrios", "Vidrios");
  appendArraySheet("separador", "Separador");
  appendArraySheet("mano_obra", "ManoObra");
  appendArraySheet("margenes", "Margenes");
  appendArraySheet("ruedas", "Ruedas");
  appendArraySheet("perfiles", "Perfiles");
  appendArraySheet("bom", "BOM");

  // Accesorios (formato nuevo)
  if (Array.isArray(seed.accesorios_catalogo)) {
    const cat = seed.accesorios_catalogo.map((r: any) => {
      const Precio_ARS_sin_IVA = r.Precio_ARS_sin_IVA ?? r.Precio_ARS ?? 0;
      return {
        Codigo: r.Codigo,
        Descripcion: r.Descripcion,
        Unidad: r.Unidad ?? "u",
        Precio_ARS_sin_IVA,
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cat), "Accesorios_Catalogo");
  }

  if (Array.isArray(seed.accesorios_x_tipologia)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(seed.accesorios_x_tipologia), "Accesorios_x_Tipologia");
    // compat: nombre viejo
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(seed.accesorios_x_tipologia), "Accesorios_Tipologia");
  }

  // Accesorios legacy (si existe)
  appendArraySheet("accesorios_legacy", "Accesorios");

  const outPath = path.join(assetsDir, "seed.xlsx");
  XLSX.writeFile(wb, outPath);
  console.log("OK: generado", outPath);
}

main();