import { QuoteInput, QuoteOutputCliente, QuoteOutputAdmin } from "./types";

export interface ApiConfig {
  baseUrl: string;
  mode: "cliente" | "admin";
}

export async function quote(cfg: ApiConfig, input: QuoteInput): Promise<QuoteOutputCliente | QuoteOutputAdmin> {
  const r = await fetch(`${cfg.baseUrl}/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error || "Error cotizando");
  return j;
}

export async function fetchVidrios(cfg: ApiConfig): Promise<Array<{id: string; label: string; tipo: string}>> {
  const r = await fetch(`${cfg.baseUrl}/catalog/vidrios`);
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error || "Error leyendo catálogo de vidrios");
  return (j?.items || []) as Array<{id: string; label: string; tipo: string}>;
}
