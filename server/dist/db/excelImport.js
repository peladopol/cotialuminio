import * as XLSX from "xlsx";
import { defaultCostDB } from "./defaultCostDB";
const toJSON = (sh) => XLSX.utils.sheet_to_json(sh, { defval: "" });
export function importCostDBFromExcel(buffer) {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const base = structuredClone(defaultCostDB);
    if (wb.Sheets["Parametros"]) {
        const rows = toJSON(wb.Sheets["Parametros"]);
        const p = structuredClone(base.parametros);
        for (const r of rows) {
            const k = String(r.Clave || "").trim();
            if (!k)
                continue;
            const v = Number(r.Valor);
            if (!Number.isNaN(v))
                p[k] = v;
        }
        base.parametros = p;
    }
    // Descuentos de vidrio (mm). Se guardan como claves numéricas dentro de Parametros
    // Ej: desc_vid_corrediza_ancho_mm = 78
    if (wb.Sheets["Descuentos_Vidrio"]) {
        const rows = toJSON(wb.Sheets["Descuentos_Vidrio"]);
        const p = structuredClone(base.parametros);
        for (const r of rows) {
            const k = String(r.Clave || "").trim();
            if (!k)
                continue;
            const v = Number(r.Valor_mm);
            if (!Number.isNaN(v))
                p[k] = v;
        }
        base.parametros = p;
    }
    // Accesorios: opción nueva (catálogo + mapping por tipología) y fallback al formato viejo
    if (wb.Sheets["Accesorios_Catalogo"] && (wb.Sheets["Accesorios_x_Tipologia"] || wb.Sheets["Accesorios_Tipologia"])) {
        const catRows = toJSON(wb.Sheets["Accesorios_Catalogo"]);
        const mapSheet = wb.Sheets["Accesorios_x_Tipologia"] || wb.Sheets["Accesorios_Tipologia"];
        const mapRows = toJSON(mapSheet);
        const catalog = new Map();
        for (const r of catRows) {
            const code = String(r.Codigo || "").trim();
            if (!code)
                continue;
            catalog.set(code, {
                descripcion: String(r.Descripcion || ""),
                unidad: String(r.Unidad || "u"),
                precio_ars: Number((r.Precio_ARS_sin_IVA ?? r.Precio_ARS ?? 0) || 0),
                linea: String(r.Linea || "CLASICA"),
                notas: String(r.Notas || ""),
            });
        }
        base.accesorios = mapRows.filter(r => r.Codigo && r.Tipologia).map(r => {
            const code = String(r.Codigo).trim();
            const c = catalog.get(code);
            return ({
                codigo: code,
                descripcion: String(r.Descripcion || c?.descripcion || ""),
                linea: String(r.Linea || c?.linea || "CLASICA"),
                tipologia: String(r.Tipologia || "GENERAL"),
                unidad: String(r.Unidad || c?.unidad || "u"),
                precio_ars: Number(r.Precio_ARS ?? c?.precio_ars ?? 0),
                regla: String(r.Regla || "por_abertura"),
                cantidad_base: Number(r.Cantidad_Base || 1),
                cada_mm: r.Cada_mm === "" ? undefined : Number(r.Cada_mm),
                notas: String(r.Notas || c?.notas || ""),
            });
        });
    }
    else if (wb.Sheets["Accesorios"]) {
        const rows = toJSON(wb.Sheets["Accesorios"]);
        base.accesorios = rows.filter(r => r.Codigo).map(r => ({
            codigo: String(r.Codigo),
            descripcion: String(r.Descripcion || ""),
            linea: String(r.Linea || "CLASICA"),
            tipologia: String(r.Tipologia || "GENERAL"),
            unidad: String(r.Unidad || "u"),
            precio_ars: Number((r.Precio_ARS_sin_IVA ?? r.Precio_ARS ?? 0) || 0),
            regla: String(r.Regla || "por_abertura"),
            cantidad_base: Number(r.Cantidad_Base || 1),
            cada_mm: r.Cada_mm === "" ? undefined : Number(r.Cada_mm),
            notas: String(r.Notas || ""),
        }));
    }
    if (wb.Sheets["Vidrios"]) {
        const rows = toJSON(wb.Sheets["Vidrios"]);
        base.vidrios = rows.filter(r => r.ID).map(r => {
            const rawTipo = String(r.Tipo || "").trim().toUpperCase();
            const tipo = (rawTipo === "VS" ? "INC" : (rawTipo === "LAMINADO" ? "LAM" : rawTipo));
            const rawId = String(r.ID).trim();
            // Aceptamos IDs con "_" o "-" tal como vienen en el Excel (seed.xlsx).
            return ({
                id: rawId,
                tipo,
                configuracion: String(r.Configuracion || ""),
                espesor_total_mm: Number(r.Espesor_total_mm || 0),
                camara_mm: r.Camara_mm === "" ? undefined : Number(r.Camara_mm),
                cavidad_min_mm: r.Cavidad_min_mm === "" ? undefined : Number(r.Cavidad_min_mm),
                precio_m2_ars: Number(r.Precio_m2_ARS || 0),
                notas: String(r.Notas || ""),
            });
        });
    }
    if (wb.Sheets["Separador"]) {
        const rows = toJSON(wb.Sheets["Separador"]);
        base.separadores = rows.filter(r => r.Ancho_mm !== "").map(r => ({
            ancho_mm: Number(r.Ancho_mm),
            precio_ml_ars: Number(r.Precio_ml_ARS || 0),
            sistema: String(r.Sistema || ""),
            notas: String(r.Notas || ""),
        }));
    }
    if (wb.Sheets["ManoObra"]) {
        const rows = toJSON(wb.Sheets["ManoObra"]);
        base.manoObra = rows.filter(r => r.Linea && r.Tipologia && r.Etapa).map(r => ({
            linea: String(r.Linea),
            tipologia: String(r.Tipologia),
            etapa: String(r.Etapa),
            hh: Number(r.HH || 0),
            costo_hora_ars: Number(r.Costo_hora_ARS || 0),
            notas: String(r.Notas || ""),
        }));
    }
    if (wb.Sheets["Margenes"]) {
        const rows = toJSON(wb.Sheets["Margenes"]);
        base.margenes = rows.filter(r => r.Linea && r.Tipologia && r.Canal && r.Forma_pago).map(r => ({
            linea: String(r.Linea),
            tipologia: String(r.Tipologia),
            canal: String(r.Canal),
            forma_pago: String(r.Forma_pago),
            margen_pct: Number(r.Margen_pct || 0),
            notas: String(r.Notas || ""),
        }));
    }
    if (wb.Sheets["Ruedas"]) {
        const rows = toJSON(wb.Sheets["Ruedas"]);
        base.ruedas = rows.filter(r => r.Categoria).map(r => ({
            categoria: String(r.Categoria),
            peso_min_kg: Number(r.Peso_min_kg || 0),
            peso_max_kg: Number(r.Peso_max_kg || 0),
            codigo_accesorio: String(r.Codigo_accesorio || ""),
            precio_ars: Number((r.Precio_ARS_sin_IVA ?? r.Precio_ARS ?? 0) || 0),
            notas: String(r.Notas || ""),
        }));
    }
    if (wb.Sheets["Perfiles"]) {
        const rows = toJSON(wb.Sheets["Perfiles"]);
        base.perfiles = rows.filter(r => r.Codigo).map(r => ({
            codigo: String(r.Codigo),
            kg_m: Number(r.Kg_m || 0),
        }));
    }
    if (wb.Sheets["BOM"]) {
        const rows = toJSON(wb.Sheets["BOM"]);
        base.bom = rows.filter(r => r.Linea && r.Tipologia && r.Variante && r.Perfil).map(r => ({
            linea: String(r.Linea),
            tipologia: String(r.Tipologia),
            variante: String(r.Variante),
            perfil: String(r.Perfil),
            descripcion: String(r.Descripcion || ""),
            cantidad: Number(r.Cantidad || 0),
            coefA: Number(r.CoefA || 0),
            coefH: Number(r.CoefH || 0),
            const_mm: Number(r.Const_mm || 0),
        }));
    }
    return base;
}
