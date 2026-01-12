export type Linea = "CLASICA";
export type Tipologia = "CORREDIZA_2H" | "PANO_FIJO" | "VENTANA_ABRIR_1H";
export type Variante = "VS" | "DVH";
export type Canal = "WEB" | "MOSTRADOR";
export type FormaPago = "TRANSFERENCIA" | "CONTADO" | "DIGITAL";
export type Apertura = "IZQ" | "DER";

export interface QuoteInput {
  linea: Linea;
  tipologia: Tipologia;
  variante: Variante;
  ancho_mm: number;
  alto_mm: number;
  vidrio_id: string;
  canal: Canal;
  forma_pago: FormaPago;
  mosquitero?: boolean;
  tapajunta?: boolean;
  uso_corrediza?: "VENTANA" | "PUERTA";
  apertura?: Apertura;
  flete_ars?: number;
}

export interface QuoteOutputCliente {
  moneda: "ARS";
  precio_final_con_iva: number;
}

export interface QuoteOutputAdmin extends QuoteOutputCliente {
  desglose: any;
  meta: any;
}
