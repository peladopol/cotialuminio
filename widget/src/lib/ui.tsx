import React, { useEffect, useMemo, useState } from "react";
import { ApiConfig, fetchVidrios, quote } from "./api";
import { QuoteInput, Tipologia, Variante, Apertura } from "./types";

// Formateadores
const fmtMoney = (n?: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n as number) ? (n as number) : 0);

const fmtNum = (n?: number, digits = 2) =>
  new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(n as number) ? (n as number) : 0);

const fmtInt = (n?: number) =>
  new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n as number) ? (n as number) : 0);

type VidrioOpt = { id: string; label: string; tipo: string };

export function CotizadorWidget({ api }: { api: ApiConfig }) {
  const [tipologia, setTipologia] = useState<Tipologia>("CORREDIZA_2H");
  const [ancho, setAncho] = useState(1500);
  const [alto, setAlto] = useState(1200);
  const [vidrioOptions, setVidrioOptions] = useState<VidrioOpt[]>([]);
  const [vidrio, setVidrio] = useState("");
  const [mosq, setMosq] = useState(false);
  const [tap, setTap] = useState(false);
  const [usoCorrediza, setUsoCorrediza] = useState<"VENTANA" | "PUERTA">("VENTANA");
  const [apertura, setApertura] = useState<Apertura>("DER");
  const [loading, setLoading] = useState(false);
  const [precio, setPrecio] = useState<number | null>(null);
  const [admin, setAdmin] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const isDVH = useMemo(() => vidrio.startsWith("DVH-"), [vidrio]);
  const variante = useMemo(() => (isDVH ? "DVH" : "VS") as Variante, [isDVH]);

  const canMosq = tipologia === "CORREDIZA_2H";
  const canApertura = tipologia === "VENTANA_ABRIR_1H";
  const canUsoCorrediza = tipologia === "CORREDIZA_2H";

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const items = await fetchVidrios(api);
        if (!alive) return;
        setVidrioOptions(items);
        // Default: primer item disponible
        if (!vidrio && items.length) {
          setVidrio(items[0].id);
        }
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || String(e));
      }
    })();
    return () => { alive = false; };
  }, [api.baseUrl]);

  async function onCotizar() {
    setErr(null);
    setLoading(true);
    setPrecio(null);
    setAdmin(null);
    try {
      if (!vidrio) throw new Error("No hay vidrios cargados en Admin. Subí el Excel y recargá.");

      const input: QuoteInput = {
        linea: "CLASICA",
        tipologia,
        variante,
        ancho_mm: Number(ancho),
        alto_mm: Number(alto),
        vidrio_id: vidrio,
        canal: "WEB",
        forma_pago: "TRANSFERENCIA",
        mosquitero: canMosq ? mosq : false,
        tapajunta: tap,
        uso_corrediza: canUsoCorrediza ? usoCorrediza : undefined,
        apertura: canApertura ? apertura : undefined
      };
      const out: any = await quote(api, input);
      setPrecio(out.precio_final_con_iva);
      if (api.mode === "admin") setAdmin(out);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial", maxWidth: 520 }}>
      <div style={{ border: "1px solid #ddd", borderRadius: 16, padding: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: 0 }}>Cotizador de Aberturas</h2>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Línea Clásica</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <label>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Producto</div>
            <select value={tipologia} onChange={(e) => setTipologia(e.target.value as any)} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}>
              <option value="CORREDIZA_2H">Corrediza 2 hojas</option>
              <option value="PANO_FIJO">Paño fijo</option>
              <option value="VENTANA_ABRIR_1H">Ventana de abrir (1 hoja)</option>
            </select>
          </label>

          <label>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Vidrio</div>
            <select value={vidrio} onChange={(e) => setVidrio(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}>
              {vidrioOptions.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </label>

          <label>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Ancho (mm)</div>
            <input type="number" value={ancho} onChange={(e) => setAncho(Number(e.target.value))} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }} />
          </label>

          <label>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Alto (mm)</div>
            <input type="number" value={alto} onChange={(e) => setAlto(Number(e.target.value))} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }} />
          </label>

          {canMosq && (
            <label>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Mosquitero</div>
              <select value={mosq ? "SI" : "NO"} onChange={(e) => setMosq(e.target.value === "SI")} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}>
                <option value="NO">No</option>
                <option value="SI">Sí</option>
              </select>
            </label>
          )}

          {canUsoCorrediza && (
            <label>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Uso (corrediza)</div>
              <select value={usoCorrediza} onChange={(e) => setUsoCorrediza(e.target.value as any)} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}>
                <option value="VENTANA">Ventana</option>
                <option value="PUERTA">Puerta</option>
              </select>
            </label>
          )}

          <label>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Tapajunta (99206)</div>
            <select value={tap ? "SI" : "NO"} onChange={(e) => setTap(e.target.value === "SI")} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}>
              <option value="NO">No</option>
              <option value="SI">Sí</option>
            </select>
          </label>

          {canApertura && (
            <label>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Apertura</div>
              <select value={apertura} onChange={(e) => setApertura(e.target.value as any)} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}>
                <option value="IZQ">Izquierda</option>
                <option value="DER">Derecha</option>
              </select>
            </label>
          )}
        </div>

        <button onClick={onCotizar} disabled={loading} style={{ marginTop: 14, width: "100%", padding: 12, borderRadius: 12, border: "1px solid #111", background: "#111", color: "white", cursor: "pointer" }}>
          {loading ? "Calculando..." : "Cotizar"}
        </button>

        {err && <div style={{ marginTop: 10, color: "#b00020", fontSize: 13 }}>{err}</div>}

        {precio != null && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "#f6f7f8" }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Precio final (con IVA)</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{fmtMoney(precio)}</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>El detalle se muestra solo en Admin.</div>
          </div>
        )}

        {api.mode === "admin" && admin && (
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: "pointer" }}>Ver desglose (Admin)</summary>
            <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: "#0b1020", color: "#cfe6ff" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
                <div><b>Aluminio</b>: {fmtMoney(admin.desglose?.aluminio_ars)}</div>
                <div><b>Accesorios</b>: {fmtMoney(admin.desglose?.accesorios_ars)}</div>
                <div><b>Vidrio</b>: {fmtMoney(admin.desglose?.vidrio_ars)}</div>
                <div><b>Separador</b>: {fmtMoney(admin.desglose?.separador_ars)}</div>
                <div><b>Mano de obra</b>: {fmtMoney(admin.desglose?.mano_obra_ars)}</div>
                <div><b>Tapajunta</b>: {fmtMoney(admin.desglose?.tapajunta_ars)}</div>
                <div><b>Flete</b>: {fmtMoney(admin.desglose?.flete_ars)}</div>
                <div><b>Costo sin IVA</b>: {fmtMoney(admin.desglose?.costo_materiales_y_mo_sin_iva)}</div>
                <div><b>Margen</b>: {fmtMoney(admin.desglose?.margen_ars)}</div>
                <div><b>Subtotal sin IVA</b>: {fmtMoney(admin.desglose?.subtotal_sin_iva)}</div>
                <div><b>IVA</b>: {fmtMoney(admin.desglose?.iva_ars)}</div>
              </div>

              {admin.detalle?.accesorios?.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Accesorios aplicados</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.15)", padding: "6px 4px" }}>Código</th>
                          <th style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.15)", padding: "6px 4px" }}>Descripción</th>
                          <th style={{ textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.15)", padding: "6px 4px" }}>Cant.</th>
                          <th style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.15)", padding: "6px 4px" }}>Unidad</th>
                          <th style={{ textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.15)", padding: "6px 4px" }}>$/u</th>
                          <th style={{ textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.15)", padding: "6px 4px" }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admin.detalle.accesorios.map((a, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: "6px 4px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{a.codigo}</td>
                            <td style={{ padding: "6px 4px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{a.descripcion}</td>
                            <td style={{ padding: "6px 4px", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "right" }}>{fmtNum(a.cantidad, 2)}</td>
                            <td style={{ padding: "6px 4px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{a.unidad}</td>
                            <td style={{ padding: "6px 4px", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "right" }}>{fmtMoney(a.precio_unitario_ars)}</td>
                            <td style={{ padding: "6px 4px", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "right" }}>{fmtMoney(a.subtotal_ars)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {admin.detalle?.vidrio_piezas?.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Piezas de vidrio consideradas</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.15)", padding: "6px 4px" }}>Etiqueta</th>
                          <th style={{ textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.15)", padding: "6px 4px" }}>Ancho (mm)</th>
                          <th style={{ textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.15)", padding: "6px 4px" }}>Alto (mm)</th>
                          <th style={{ textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.15)", padding: "6px 4px" }}>Área (m²)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admin.detalle.vidrio_piezas.map((p, idx) => {
                          const area = (Number(p.w_mm) * Number(p.h_mm)) / 1_000_000;
                          return (
                            <tr key={idx}>
                              <td style={{ padding: "6px 4px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{p.label}</td>
                              <td style={{ padding: "6px 4px", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "right" }}>{fmtInt(p.w_mm)}</td>
                              <td style={{ padding: "6px 4px", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "right" }}>{fmtInt(p.h_mm)}</td>
                              <td style={{ padding: "6px 4px", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "right" }}>{fmtNum(area, 3)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: "pointer" }}>Ver JSON crudo</summary>
                <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, marginTop: 8 }}>
                  {JSON.stringify(admin, null, 2)}
                </pre>
              </details>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
