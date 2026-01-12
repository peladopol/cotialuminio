export type Linea = "CLASICA";
export type Tipologia = "CORREDIZA_2H" | "PANO_FIJO" | "VENTANA_ABRIR_1H";
export type Variante = "VS" | "DVH";
export type Canal = "WEB" | "MOSTRADOR";
export type FormaPago = "TRANSFERENCIA" | "CONTADO" | "DIGITAL";

export type VidrioTipo = "INC" | "LAM" | "DVH";

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
  /** Solo para CORREDIZA_2H: define si la abertura se cotiza como PUERTA o VENTANA (cambia zócalo y tapajunta) */
  uso_corrediza?: "VENTANA" | "PUERTA";
  apertura?: "IZQ" | "DER";
  flete_ars?: number;
}

export interface QuoteOutputCliente {
  moneda: "ARS";
  precio_final_con_iva: number;
}

export interface QuoteOutputAdmin extends QuoteOutputCliente {
  desglose: {
    aluminio_ars: number;
    accesorios_ars: number;
    accesorios_detalle?: Array<{ codigo: string; descripcion: string; unidad: string; regla: string; precio_unit_ars: number; cantidad: number; subtotal_ars: number; notas?: string }>;
    vidrio_ars: number;
    separador_ars: number;
    mano_obra_ars: number;
    tapajunta_ars: number;
    flete_ars: number;
    costo_materiales_y_mo_sin_iva: number;
    margen_ars: number;
    subtotal_sin_iva: number;
    iva_ars: number;
  };
  meta: {
    kg_aluminio_total: number;
    area_m2: number;
    vidrio_piezas?: Array<{ label: string; ancho_mm: number; alto_mm: number; area_m2: number }>;
    perimetro_ml: number;
    tapajunta_ml: number;
    peso_hoja_vidrio_kg?: number;
  };
}
