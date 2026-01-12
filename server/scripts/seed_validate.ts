import fs from "fs";
import path from "path";

type Seed = {
  parametros?: Record<string, any>;
  vidrios?: any[];
  separador?: any[];
  mano_obra?: any[];
  margenes?: any[];
  ruedas?: any[];
  perfiles?: any[];
  bom?: any[];
  accesorios_catalogo?: any[];
  accesorios_x_tipologia?: any[];
  accesorios_legacy?: any[];
};

const REQUIRED_PARAM_KEYS = [
  "tipo_cambio_ars_usd",
  "iva_pct",
  "aluminio_usd_kg",
  "peso_vidrio_kg_m2_mm",
];

function isNum(v: any): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function die(msg: string): never {
  console.error("SEED VALIDATION ERROR:", msg);
  process.exit(1);
}

function warn(msg: string) {
  console.warn("SEED VALIDATION WARNING:", msg);
}

function main() {
  const seedPath = path.resolve(process.cwd(), "assets", "seed.json");
  if (!fs.existsSync(seedPath)) die(`No existe ${seedPath}`);

  const seed = JSON.parse(fs.readFileSync(seedPath, "utf-8")) as Seed;

  if (!seed.parametros) die("Falta 'parametros' en seed.json");
  for (const k of REQUIRED_PARAM_KEYS) {
    const v = (seed.parametros as any)[k];
    if (!isNum(v)) die(`Parametro obligatorio '${k}' inválido o vacío: ${v}`);
  }

  // Parametros: detectar vacíos
  for (const [k, v] of Object.entries(seed.parametros)) {
    if (v === null || v === undefined || v === "") {
      warn(`Parametro '${k}' está vacío (null/undefined/"")`);
    }
  }

  // Accesorios catálogo: códigos únicos y precios numéricos
  const cat = seed.accesorios_catalogo ?? [];
  const seen = new Set<string>();
  for (const r of cat) {
    const code = String(r.Codigo ?? "").trim();
    if (!code) die("Accesorios_Catalogo: 'Codigo' vacío");
    if (seen.has(code)) die(`Accesorios_Catalogo: Codigo duplicado '${code}'`);
    seen.add(code);

    const precio = Number((r.Precio_ARS_sin_IVA ?? r.Precio_ARS ?? 0));
    if (!Number.isFinite(precio) || precio < 0) die(`Accesorios_Catalogo: precio inválido para '${code}': ${r.Precio_ARS_sin_IVA ?? r.Precio_ARS}`);
  }

  // Mapping tipologías: códigos deben existir en catálogo (si se usa formato nuevo)
  const map = seed.accesorios_x_tipologia ?? [];
  if (cat.length && map.length) {
    for (const r of map) {
      const code = String(r.Codigo ?? "").trim();
      if (!code) die("Accesorios_x_Tipologia: 'Codigo' vacío");
      if (!seen.has(code)) die(`Accesorios_x_Tipologia: Codigo '${code}' no existe en Accesorios_Catalogo`);
    }
  }

  // Vidrios: campos mínimos
  for (const v of (seed.vidrios ?? [])) {
    const id = String(v.ID ?? "").trim();
    if (!id) die("Vidrios: 'ID' vacío");
    const precio = Number(v.Precio_m2_ARS ?? 0);
    if (!Number.isFinite(precio) || precio < 0) die(`Vidrios: Precio_m2_ARS inválido para '${id}': ${v.Precio_m2_ARS}`);
  }

  console.log("OK: seed.json válido.");
}

main();