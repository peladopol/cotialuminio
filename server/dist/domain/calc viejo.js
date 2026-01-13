const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const round3 = (n) => Math.round((n + Number.EPSILON) * 1000) / 1000;
const ceil = Math.ceil;
function areaM2(a_mm, h_mm) { return (a_mm / 1000) * (h_mm / 1000); }
function perimetroMl(a_mm, h_mm) { return 2 * ((a_mm / 1000) + (h_mm / 1000)); }
function getMargenPct(db, i) {
    const m = db.margenes.find(x => x.linea === i.linea && x.tipologia === i.tipologia && x.canal === i.canal && x.forma_pago === i.forma_pago);
    return m?.margen_pct ?? 30;
}
function normId(s) {
    return String(s ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
function getVidrio(db, id) {
    const raw = String(id ?? "").trim();
    // primero, match exacto
    let v = db.vidrios.find(x => x.id === raw);
    if (v)
        return v;
    // fallback: match normalizado (evita problemas tipo LAM_33 vs LAM-33 o espacios invisibles)
    const nid = normId(raw);
    v = db.vidrios.find(x => normId(x.id) === nid);
    if (!v)
        throw new Error(`Vidrio no encontrado: ${raw}`);
    return v;
}
function getSeparadorPrecio(db, camara_mm) {
    if (!camara_mm)
        return 0;
    const exact = db.separadores.find(x => x.ancho_mm === camara_mm);
    if (exact)
        return exact.precio_ml_ars;
    if (db.separadores.length === 0)
        return 0;
    const best = db.separadores.reduce((b, c) => Math.abs(c.ancho_mm - camara_mm) < Math.abs(b.ancho_mm - camara_mm) ? c : b);
    return best.precio_ml_ars;
}
function vidrioIdFromToken(db, token) {
    // Tokens posibles desde Excel/Widget: 4,5,33,L33,INC_4,LAM_33, etc.
    const tRaw = String(token || "").trim().toUpperCase();
    const t = normId(tRaw);
    // Si ya viene con el formato de ID (INC_4, LAM_33, etc.) devolvemos tal cual.
    const direct = db.vidrios.find(v => normId(v.id) === t);
    if (direct)
        return direct.id;
    // Laminado 3+3
    if (t === "33" || t === "L33" || t === "LAM33") {
        const cand = db.vidrios.find(v => v.tipo === "LAM" && /33/.test(normId(v.id)));
        return cand?.id ?? "LAM_33";
    }
    // Monolítico por espesor (4, 5, etc.)
    if (/^\d+(\.\d+)?$/.test(tRaw.replace(",", "."))) {
        const mm = Number(tRaw.replace(",", "."));
        const cand = db.vidrios.find(v => v.tipo === "INC" && Math.abs((v.espesor_total_mm ?? 0) - mm) < 0.01);
        if (cand)
            return cand.id;
        // fallback común
        if (mm === 4)
            return "INC_4";
        if (mm === 5)
            return "INC_5";
    }
    throw new Error(`Token de vidrio no soportado en DVH: ${token}`);
}
function parseDVHId(db, dvhId) {
    // Acepta IDs con guiones o guiones bajos:
    // - DVH-4-9-4
    // - DVH_4_9_4
    // - DVH_L33_12_L33
    const parts = String(dvhId).trim().split(/[-_]/g);
    if (parts[0]?.toUpperCase() !== "DVH") {
        throw new Error(`ID DVH inválido: ${dvhId}`);
    }
    // Soportamos 2 formatos:
    // 1) DVH_L33_12_4  -> [DVH, L33, 12, 4]
    // 2) DVH_3_3_12_4  -> [DVH, 3, 3, 12, 4]  (equivale a 3+3/12/4)
    const isSplit33 = parts.length === 5 && parts[1] === "3" && parts[2] === "3";
    const camara_idx = isSplit33 ? 3 : 2;
    const ext_idx = isSplit33 ? 4 : 3;
    const int_token = isSplit33 ? "3+3" : parts[1];
    if (!(parts.length === 4 || isSplit33)) {
        throw new Error(`ID DVH inválido: ${dvhId}`);
    }
    const camara_mm = Number(parts[camara_idx]);
    if (!Number.isFinite(camara_mm) || camara_mm <= 0) {
        throw new Error(`Cámara DVH inválida en ${dvhId}`);
    }
    // Convención: laminado SIEMPRE adentro -> token parts[1]
    const interior = vidrioIdFromToken(db, int_token);
    const exterior = vidrioIdFromToken(db, parts[ext_idx]);
    return { interior, exterior, camara_mm };
}
function kg_m(db, codigo) {
    const v = db.perfiles.find(p => p.codigo === codigo)?.kg_m;
    if (v == null)
        throw new Error(`Falta kg/m para perfil ${codigo}`);
    if (v <= 0)
        throw new Error(`kg/m inválido para perfil ${codigo}. Cargalo en Excel (hoja Perfiles).`);
    return v;
}
function kgPerfil(db, codigo, largo_mm, cantidad, validateLength = true) {
    if (validateLength) {
        const barra = db.parametros.aluminio_barra_mm ?? 6000;
        if (largo_mm > barra)
            throw new Error(`Corte de perfil ${codigo} = ${Math.round(largo_mm)} mm supera barra de ${barra} mm.`);
        if (largo_mm <= 0)
            throw new Error(`Corte inválido para perfil ${codigo}: ${largo_mm} mm`);
    }
    return (largo_mm / 1000) * kg_m(db, codigo) * cantidad;
}
function validateRangos(db, i) {
    const p = db.parametros;
    const a = i.ancho_mm;
    const h = i.alto_mm;
    const minA = p[`min_ancho_${i.tipologia}`] ?? 0;
    const minH = p[`min_alto_${i.tipologia}`] ?? 0;
    const maxA = p[`max_ancho_${i.tipologia}`] ?? 1e9;
    const maxH = p[`max_alto_${i.tipologia}`] ?? 1e9;
    if (a < minA || h < minH)
        throw new Error(`Medida fuera de rango para ${i.tipologia}. Mínimo: ${minA} x ${minH} mm.`);
    if (a > maxA || h > maxH)
        throw new Error(`Medida fuera de rango para ${i.tipologia}. Máximo: ${maxA} x ${maxH} mm.`);
}
function fitsInGlassSheet(db, w_mm, h_mm) {
    const W = db.parametros.vidrio_hoja_ancho_mm ?? 2500;
    const H = db.parametros.vidrio_hoja_alto_mm ?? 3600;
    return (w_mm <= W && h_mm <= H) || (w_mm <= H && h_mm <= W);
}
function validateVidrioSheet(db, pieces) {
    for (const g of pieces) {
        if (g.w <= 0 || g.h <= 0)
            throw new Error(`Descuento de vidrio inválido (${g.label}): ${g.w} x ${g.h} mm.`);
        if (!fitsInGlassSheet(db, g.w, g.h)) {
            const W = db.parametros.vidrio_hoja_ancho_mm ?? 2500;
            const H = db.parametros.vidrio_hoja_alto_mm ?? 3600;
            throw new Error(`Vidrio (${g.label}) no entra en plancha ${W}x${H} mm: pieza ${Math.round(g.w)}x${Math.round(g.h)} mm.`);
        }
    }
}
function usoCorrediza(i) {
    return i.uso_corrediza === "PUERTA" ? "PUERTA" : "VENTANA";
}
/** CORREDIZA 2 HOJAS – Marco 2 guías (manual) */
function kgCorrediza2H(db, i) {
    const A = i.ancho_mm;
    const H = i.alto_mm;
    const esPuerta = H >= db.parametros.puerta_corrediza_alto_mm;
    let total = 0;
    total += kgPerfil(db, "99200", A - 42, 2);
    total += kgPerfil(db, "99201", H, 2);
    total += kgPerfil(db, (i.variante === "DVH" ? "99248" : "99203"), H - 79, 2);
    total += kgPerfil(db, (i.variante === "DVH" ? "99250" : "99207"), H - 79, 2);
    const zocalo = esPuerta ? (i.variante === "DVH" ? "99252" : "99209") : (i.variante === "DVH" ? "99249" : "99204");
    total += kgPerfil(db, zocalo, (A / 2) - 25, 4);
    if (i.mosquitero) {
        total += kgPerfil(db, "99255", (A / 2) - 4, 2);
        total += kgPerfil(db, "99255", H - 88, 2);
        total += kgPerfil(db, "99228", H - 101, 2);
    }
    return total;
}
/** VENTANA ABRIR 1 HOJA (manual) – hoja curva 99235 */
function kgVentanaAbrir1H(db, i) {
    const A = i.ancho_mm;
    const H = i.alto_mm;
    let total = 0;
    total += kgPerfil(db, "99216", A, 2);
    total += kgPerfil(db, "99216", H, 2);
    total += kgPerfil(db, "99235", A - 39, 2);
    total += kgPerfil(db, "99235", H - 39, 2);
    // Contravidrios (VS 99230 / DVH 99233) modelado como perímetro de hoja, sin validar largo de barra
    const contra = (i.variante === "DVH" ? "99233" : "99230");
    const perHoja_mm = 2 * (A - 39) + 2 * (H - 39);
    total += kgPerfil(db, contra, perHoja_mm, 1, false);
    return total;
}
function kgAluminio(db, i) {
    if (i.tipologia === "CORREDIZA_2H")
        return kgCorrediza2H(db, i);
    if (i.tipologia === "VENTANA_ABRIR_1H")
        return kgVentanaAbrir1H(db, i);
    const items = db.bom.filter(x => x.linea === i.linea && x.tipologia === i.tipologia && x.variante === i.variante);
    if (!items.length)
        throw new Error(`BOM vacío para ${i.linea}/${i.tipologia}/${i.variante}`);
    let total = 0;
    for (const it of items) {
        const largo_mm = it.coefA * i.ancho_mm + it.coefH * i.alto_mm + it.const_mm;
        total += kgPerfil(db, it.perfil, largo_mm, it.cantidad);
    }
    return total;
}
function calcAcc(db, a, meta) {
    const cantidadBase = Number(a.cantidad_base ?? 1);
    // Ruedas: el precio depende del peso de hoja
    if (a.regla === "segun_peso" || a.regla === "segun_peso_hoja") {
        if (meta.peso_hoja_vidrio_kg == null)
            return { subtotal: 0, cantidad: 0 };
        const r = db.ruedas.find(x => meta.peso_hoja_vidrio_kg >= x.peso_min_kg && meta.peso_hoja_vidrio_kg < x.peso_max_kg);
        const unit = (r?.precio_ars ?? a.precio_ars);
        return { subtotal: unit * cantidadBase, cantidad: cantidadBase };
    }
    if (a.regla === "por_abertura")
        return { subtotal: a.precio_ars * cantidadBase, cantidad: cantidadBase };
    if (a.regla === "por_hoja") {
        const cant = cantidadBase * meta.hojas;
        return { subtotal: a.precio_ars * cant, cantidad: cant };
    }
    // Perímetro de la abertura (marco)
    if (a.regla === "por_perimetro_ml") {
        const cant = cantidadBase * meta.per_ml;
        return { subtotal: a.precio_ars * cant, cantidad: cant };
    }
    // Perímetro de hoja (sumatoria de hojas)
    if (a.regla === "por_perimetro_hojas_ml" || a.regla === "por_perimetro_hoja_ml") {
        const cant = cantidadBase * (meta.per_hoja_ml * meta.hojas);
        return { subtotal: a.precio_ars * cant, cantidad: cant };
    }
    // Tela mosquitera: se cotiza por m2, sobre 1 sola hoja (ancho = A/2, alto = H)
    if (a.regla === "por_m2_mosq") {
        const m2 = ((meta.ancho_mm / 2) * meta.alto_mm) / 1e6;
        const cant = cantidadBase * m2;
        return { subtotal: a.precio_ars * cant, cantidad: cant };
    }
    // Felpa FE004: se cotiza por metro lineal y su consumo es (A*4 + H*6)
    // (A,H en mm de la abertura, el resultado se pasa a metros)
    if (a.regla === "felpa_fe004") {
        const ml = ((meta.ancho_mm * 4) + (meta.alto_mm * 6)) / 1000;
        const cant = cantidadBase * ml;
        return { subtotal: a.precio_ars * cant, cantidad: cant };
    }
    // Clips tapajunta T-096: a 250mm de cada extremo y luego cada 500mm.
    // - Ventana: todo el perímetro.
    // - Puerta corrediza: solo laterales + superior.
    if (a.regla === "clips_tapajunta") {
        const esPuerta = meta.uso === "PUERTA"; // lo inyectamos desde calcAccesorios
        const segs = esPuerta ? [meta.ancho_mm, meta.alto_mm, meta.alto_mm] : [meta.ancho_mm, meta.ancho_mm, meta.alto_mm, meta.alto_mm];
        const nSeg = (L) => {
            if (L <= 0)
                return 0;
            if (L <= 1000)
                return 2;
            return 2 + Math.floor((L - 1000) / 500);
        };
        const cantPieces = segs.reduce((s, L) => s + nSeg(L), 0);
        const cant = cantidadBase * cantPieces;
        return { subtotal: a.precio_ars * cant, cantidad: cant };
    }
    // Cantidad de fijaciones cada X mm en el perímetro de la abertura (aprox)
    if (a.regla && a.regla.startsWith("cada_")) {
        // formatos soportados: cada_500mm_perimetro / cada_400mm_perimetro / cada_500mm_por_lado
        const mm = Number(String(a.regla).match(/cada_(\d+)mm/)?.[1] || 0);
        if (!Number.isFinite(mm) || mm <= 0)
            return { subtotal: 0, cantidad: 0 };
        const A = meta.ancho_mm;
        const H = meta.alto_mm;
        let cantPieces = 0;
        if (a.regla.endsWith("_por_lado")) {
            // 2 lados de ancho + 2 lados de alto
            cantPieces = (Math.ceil(A / mm) * 2) + (Math.ceil(H / mm) * 2);
        }
        else {
            // perímetro completo
            cantPieces = Math.ceil((2 * (A + H)) / mm);
        }
        const cant = cantidadBase * cantPieces;
        return { subtotal: a.precio_ars * cant, cantidad: cant };
    }
    // Fórmula específica (por ahora, solo FE004)
    if (a.regla === "formula_personalizada") {
        const notas = String(a.notas || "");
        const mA = Number(notas.match(/Ancho\s+por\s+(\d+)/i)?.[1] || 0);
        const mH = Number(notas.match(/alto\s+por\s+(\d+)/i)?.[1] || 0);
        if (mA > 0 || mH > 0) {
            const ml = ((meta.ancho_mm * mA) + (meta.alto_mm * mH)) / 1000;
            const cant = cantidadBase * ml;
            return { subtotal: a.precio_ars * cant, cantidad: cant };
        }
    }
    // Regla no reconocida => 0 para no contaminar
    return { subtotal: 0, cantidad: 0 };
}
function calcAccesorios(db, i, meta) {
    const base = db.accesorios.filter(a => a.linea === "CLASICA" && a.tipologia === i.tipologia);
    // Condicionales globales
    // OJO: el tapajunta completo (aluminio + burlete + escuadras + clips + MO) se calcula en tapajuntaCosto().
    // Acá solo sumamos accesorios propios de la tipología y (si aplica) mosquitero.
    const mosq = i.mosquitero ? db.accesorios.filter(a => a.tipologia === "MOSQUITEROS") : [];
    // Algunos accesorios de mosquitero están embebidos en CORREDIZA_2H con notas "MOSQ"
    const baseFiltrado = base.filter(a => {
        const notas = String(a.notas || "");
        if (!i.mosquitero && /MOSQ/i.test(notas))
            return false;
        return true;
    });
    const items = [...baseFiltrado, ...mosq];
    const lines = items.map(a => {
        const metaLocal = a.tipologia === "MOSQUITEROS" ? { ...meta, hojas: 1 } : meta;
        const r = calcAcc(db, a, metaLocal);
        return {
            codigo: a.codigo,
            descripcion: a.descripcion,
            unidad: a.unidad,
            regla: a.regla,
            precio_unit_ars: a.precio_ars,
            cantidad: round3(r.cantidad),
            subtotal_ars: round2(r.subtotal),
            notas: a.notas
        };
    }).filter(x => x.subtotal_ars > 0);
    const total = round2(lines.reduce((s, x) => s + x.subtotal_ars, 0));
    return { total, lines };
}
function tapajuntaML(i, params) {
    if (!i.tapajunta)
        return 0;
    const a = i.ancho_mm / 1000;
    const h = i.alto_mm / 1000;
    const esPuerta = (i.tipologia === "CORREDIZA_2H") && (usoCorrediza(i) === "PUERTA");
    return esPuerta ? (2 * h + a) : (2 * (a + h));
}
function tapajuntaCosto(db, i, tap_ml) {
    if (tap_ml <= 0)
        return { total: 0, lines: [] };
    const ars_kg = db.parametros.aluminio_usd_kg * db.parametros.tipo_cambio_ars_usd;
    const kg = kg_m(db, "99206") * tap_ml;
    const costo_al = kg * ars_kg;
    // Escuadras de alineación E-066:
    // - Ventana: 4 unidades (esquinas).
    // - Puerta corrediza: 2 unidades (solo esquinas superiores; abajo va embutida).
    const e066 = db.accesorios.find(a => a.codigo === "E-066")?.precio_ars ?? 0;
    const esPuerta = (i.tipologia === "CORREDIZA_2H") && (usoCorrediza(i) === "PUERTA");
    const n_e066 = esPuerta ? 2 : 4;
    const costo_e066 = n_e066 * e066;
    const b057 = db.accesorios.find(a => a.codigo === "B-057")?.precio_ars ?? 0;
    const costo_b057 = b057 * tap_ml;
    // T-096 "clip tapajunta": a 250 mm de los extremos y luego cada 500 mm.
    const t096 = db.accesorios.find(a => a.codigo === "T-096")?.precio_ars ?? 0;
    const countSeg = (Lmm) => {
        if (Lmm <= 0)
            return 0;
        if (Lmm <= 1000)
            return 2;
        return 2 + Math.floor((Lmm - 1000) / 500);
    };
    const n_t096 = esPuerta
        ? (countSeg(i.alto_mm) + countSeg(i.alto_mm) + countSeg(i.ancho_mm))
        : (countSeg(i.ancho_mm) + countSeg(i.ancho_mm) + countSeg(i.alto_mm) + countSeg(i.alto_mm));
    const costo_t096 = n_t096 * t096;
    const min_ml = db.parametros.mano_obra_min_por_ml_tapajunta ?? 5;
    const hh = (min_ml * tap_ml) / 60;
    const costoHora = db.manoObra.find(x => x.linea === i.linea && x.tipologia === "TAPA_JUNTA")?.costo_hora_ars ?? 0;
    const costo_mo = hh * costoHora;
    const lines = [
        { codigo: "99206", descripcion: "Tapajunta (perfil)", unidad: "kg", cantidad: round2(kg), unitario_ars: round2(ars_kg), subtotal_ars: round2(costo_al) },
        { codigo: "E-066", descripcion: "Escuadra alineación tapajunta", unidad: "u", cantidad: n_e066, unitario_ars: round2(e066), subtotal_ars: round2(costo_e066) },
        { codigo: "T-096", descripcion: "Clip tapajunta", unidad: "u", cantidad: n_t096, unitario_ars: round2(t096), subtotal_ars: round2(costo_t096) },
        { codigo: "B-057", descripcion: "Burlete tapajunta", unidad: "ml", cantidad: round2(tap_ml), unitario_ars: round2(b057), subtotal_ars: round2(costo_b057) },
        { codigo: "MO-TAP", descripcion: "Mano de obra tapajunta", unidad: "hh", cantidad: round2(hh), unitario_ars: round2(costoHora), subtotal_ars: round2(costo_mo) },
    ];
    const total = costo_al + costo_e066 + costo_t096 + costo_b057 + costo_mo;
    return { total, lines };
}
function areaVidrioM2(db, i) {
    // El área de vidrio se calcula como suma de paños (una unidad por hoja).
    // En DVH la fórmula de costo ya suma vidrio interior+exterior, así que acá NO se duplica por panes.
    const pieces = vidrioPiecesMm(db, i);
    const sum = pieces.reduce((acc, p) => acc + (p.w / 1000) * (p.h / 1000), 0);
    return sum;
}
function vidrioPiezas(db, i) {
    const A = i.ancho_mm;
    const H = i.alto_mm;
    if (i.tipologia === "CORREDIZA_2H") {
        const w = (A / 2) - Number(db.parametros.desc_corrediza_ancho_mm ?? 78);
        const h = H - (usoCorrediza(i) === "PUERTA" ? Number(db.parametros.desc_corrediza_alto_puerta_mm ?? 222) : Number(db.parametros.desc_corrediza_alto_ventana_mm ?? 167));
        const area = (w / 1000) * (h / 1000);
        return [
            { label: "Hoja 1", ancho_mm: w, alto_mm: h, area_m2: round3(area) },
            { label: "Hoja 2", ancho_mm: w, alto_mm: h, area_m2: round3(area) }
        ];
    }
    if (i.tipologia === "VENTANA_ABRIR_1H") {
        const w = A - Number(db.parametros.desc_abrir_ancho_mm ?? 95);
        const h = H - Number(db.parametros.desc_abrir_alto_mm ?? 95);
        const area = (w / 1000) * (h / 1000);
        return [{ label: "Hoja", ancho_mm: w, alto_mm: h, area_m2: round3(area) }];
    }
    if (i.tipologia === "PANO_FIJO") {
        const w = A - Number(db.parametros.desc_pano_fijo_ancho_mm ?? 62);
        const h = H - Number(db.parametros.desc_pano_fijo_alto_mm ?? 62);
        const area = (w / 1000) * (h / 1000);
        return [{ label: "Paño", ancho_mm: w, alto_mm: h, area_m2: round3(area) }];
    }
    // PANO_FIJO y otros: asumimos 1 paño a medida total
    const area = areaM2(A, H);
    return [{ label: "Paño", ancho_mm: A, alto_mm: H, area_m2: round3(area) }];
}
function vidrioPiecesMm(db, i) {
    if (i.tipologia === "CORREDIZA_2H") {
        const A = i.ancho_mm;
        const H = i.alto_mm;
        const w = (A / 2) - Number(db.parametros.desc_corrediza_ancho_mm ?? 78);
        const h = H - (usoCorrediza(i) === "PUERTA" ? Number(db.parametros.desc_corrediza_alto_puerta_mm ?? 222) : Number(db.parametros.desc_corrediza_alto_ventana_mm ?? 167));
        return [{ w, h, label: "Hoja 1" }, { w, h, label: "Hoja 2" }];
    }
    if (i.tipologia === "VENTANA_ABRIR_1H") {
        const w = i.ancho_mm - Number(db.parametros.desc_abrir_ancho_mm ?? 95);
        const h = i.alto_mm - Number(db.parametros.desc_abrir_alto_mm ?? 95);
        return [{ w, h, label: "Hoja" }];
    }
    if (i.tipologia === "PANO_FIJO") {
        const w = i.ancho_mm - Number(db.parametros.desc_pano_fijo_ancho_mm ?? 62);
        const h = i.alto_mm - Number(db.parametros.desc_pano_fijo_alto_mm ?? 62);
        return [{ w, h, label: "Paño" }];
    }
    return [{ w: i.ancho_mm, h: i.alto_mm, label: "Paño" }];
}
export function cotizar(db, i) {
    const A = i.ancho_mm;
    const H = i.alto_mm;
    validateRangos(db, i);
    validateVidrioSheet(db, vidrioPiecesMm(db, i));
    const areaV = areaVidrioM2(db, i);
    const per = perimetroMl(A, H);
    const hojas = i.tipologia === "CORREDIZA_2H" ? 2 : 1;
    const per_hoja = i.tipologia === "CORREDIZA_2H" ? perimetroMl(A / 2, H) : per;
    const v = getVidrio(db, i.vidrio_id);
    const isDVH = v.tipo === "DVH";
    let vidrio_ars = 0;
    let separador_ars = 0;
    let mo_dvh_extra = 0;
    if (!isDVH) {
        vidrio_ars = areaV * v.precio_m2_ars;
    }
    else {
        // DVH por componentes: (vidrio interior + vidrio exterior) por m2 + separador por ml + armado por m2
        const { interior, exterior, camara_mm } = parseDVHId(db, i.vidrio_id);
        const vInt = getVidrio(db, interior);
        const vExt = getVidrio(db, exterior);
        vidrio_ars = areaV * (vInt.precio_m2_ars + vExt.precio_m2_ars);
        separador_ars = per * getSeparadorPrecio(db, camara_mm);
        const armado_m2 = Number(db.parametros.armado_dvh_ars_m2 ?? 0);
        mo_dvh_extra = areaV * (Number.isFinite(armado_m2) ? armado_m2 : 0);
    }
    // Peso por hoja: se usa para ruedas. En DVH se considera solo el espesor de vidrio (sin cámara).
    let espesor_vidrio_mm = v.espesor_total_mm;
    if (v.tipo === "DVH") {
        const { interior, exterior } = parseDVHId(db, i.vidrio_id);
        const vInt = getVidrio(db, interior);
        const vExt = getVidrio(db, exterior);
        espesor_vidrio_mm = (vInt.espesor_total_mm ?? 0) + (vExt.espesor_total_mm ?? 0);
    }
    const peso_hoja_vidrio_kg = (areaV / hojas) * espesor_vidrio_mm * db.parametros.peso_vidrio_kg_m2_mm * 1.02; // +2%
    const kg_al = kgAluminio(db, i);
    const ars_kg = db.parametros.aluminio_usd_kg * db.parametros.tipo_cambio_ars_usd;
    const aluminio_ars = kg_al * ars_kg;
    const accDet = calcAccesorios(db, i, { per_ml: per, per_hoja_ml: per_hoja, hojas, peso_hoja_vidrio_kg, ancho_mm: A, alto_mm: H });
    const accesorios_ars = accDet.total;
    const moItems = db.manoObra.filter(x => x.linea === i.linea && x.tipologia === i.tipologia && !x.etapa.startsWith("2-"));
    let mano_obra_ars = moItems.reduce((s, x) => s + (x.hh * (x.costo_hora_ars ?? 0)), 0);
    mano_obra_ars += mo_dvh_extra;
    const tap_ml = tapajuntaML(i, db.parametros);
    const tapDet = tapajuntaCosto(db, i, tap_ml);
    const tap_ars = tapDet.total;
    const flete_ars = i.flete_ars ?? 0;
    const costo_sin_iva = aluminio_ars + accesorios_ars + vidrio_ars + separador_ars + mano_obra_ars + tap_ars + flete_ars;
    const margen_pct = getMargenPct(db, i);
    const margen_ars = costo_sin_iva * (margen_pct / 100);
    const subtotal = costo_sin_iva + margen_ars;
    const iva_ars = subtotal * (db.parametros.iva_pct / 100);
    const total = subtotal + iva_ars;
    return {
        moneda: "ARS",
        precio_final_con_iva: round2(total),
        desglose: {
            aluminio_ars: round2(aluminio_ars),
            accesorios_ars: round2(accesorios_ars),
            vidrio_ars: round2(vidrio_ars),
            separador_ars: round2(separador_ars),
            mano_obra_ars: round2(mano_obra_ars),
            tapajunta_ars: round2(tap_ars),
            flete_ars: round2(flete_ars),
            costo_materiales_y_mo_sin_iva: round2(costo_sin_iva),
            margen_ars: round2(margen_ars),
            subtotal_sin_iva: round2(subtotal),
            iva_ars: round2(iva_ars),
        },
        meta: {
            kg_aluminio_total: round2(kg_al),
            area_m2: round2(areaV),
            perimetro_ml: round2(per),
            tapajunta_ml: round2(tap_ml),
            peso_hoja_vidrio_kg: round2(peso_hoja_vidrio_kg),
        },
        detalles: {
            accesorios: accDet.lines,
            tapajunta: tapDet.lines,
            vidrio_piezas_mm: vidrioPiecesMm(db, i),
        }
    };
}
