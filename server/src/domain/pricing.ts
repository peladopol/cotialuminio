export interface Parametros {
  aluminio_usd_kg: number;
  tipo_cambio_ars_usd: number;
  iva_pct: number;
  peso_vidrio_kg_m2_mm: number;
  holgura_cavidad_mm_por_lado: number;
  puerta_corrediza_alto_mm: number;
  mano_obra_min_por_ml_tapajunta: number;

  // Extras editables por Excel (hoja Parametros)
  vidrio_hoja_ancho_mm?: number;
  vidrio_hoja_alto_mm?: number;
  aluminio_barra_mm?: number;

  min_ancho_CORREDIZA_2H?: number;
  min_alto_CORREDIZA_2H?: number;
  max_ancho_CORREDIZA_2H?: number;
  max_alto_CORREDIZA_2H?: number;

  min_ancho_PANO_FIJO?: number;
  min_alto_PANO_FIJO?: number;
  max_ancho_PANO_FIJO?: number;
  max_alto_PANO_FIJO?: number;

  min_ancho_VENTANA_ABRIR_1H?: number;
  min_alto_VENTANA_ABRIR_1H?: number;
  max_ancho_VENTANA_ABRIR_1H?: number;
  max_alto_VENTANA_ABRIR_1H?: number;

  [key: string]: any;
}

export interface Accesorio {
  codigo: string;
  descripcion: string;
  linea: string;
  tipologia: string;
  unidad: "u" | "ml" | "m2";
  precio_ars: number;
  regla:
    | "por_abertura"
    | "por_hoja"
    | "por_perimetro_ml"
    | "por_perimetro_hoja_ml"
    | "por_perimetro_hojas_ml"
    | "cada_mm_perimetro"
    | "cada_mm_perimetro_hoja"
    | "segun_peso"
    | "segun_peso_hoja"
    | "por_m2"
    | "por_m2_mosq"
    | "felpa_fe004_ml"
    | "mosq_tope_alto_x2_ml"
    | "por_mosq_hoja"
    | "clips_tapajunta";
  cantidad_base: number;
  cada_mm?: number;
  notas?: string;
}

export interface RuedaRegla {
  categoria: string;
  peso_min_kg: number;
  peso_max_kg: number;
  codigo_accesorio: string;
  precio_ars: number;
  notas?: string;
}

export interface Vidrio {
  id: string;
  tipo: "INC" | "LAM" | "DVH";
  configuracion: string;
  espesor_total_mm: number;
  camara_mm?: number;
  cavidad_min_mm?: number;
  precio_m2_ars: number;
  notas?: string;
}

export interface Separador {
  ancho_mm: number;
  precio_ml_ars: number;
  sistema?: string;
  notas?: string;
}

export interface ManoObraEtapa {
  linea: string;
  tipologia: string;
  etapa: string;
  hh: number;
  costo_hora_ars: number;
  notas?: string;
}

export interface Margen {
  linea: string;
  tipologia: string;
  canal: string;
  forma_pago: string;
  margen_pct: number;
  notas?: string;
}

export interface PerfilKgM {
  codigo: string;
  kg_m: number;
}

export interface BOMItem {
  linea: string;
  tipologia: string;
  variante: "VS" | "DVH";
  perfil: string;
  descripcion: string;
  cantidad: number;
  coefA: number;
  coefH: number;
  const_mm: number;
}

export interface CostDB {
  parametros: Parametros;
  accesorios: Accesorio[];
  ruedas: RuedaRegla[];
  vidrios: Vidrio[];
  separadores: Separador[];
  manoObra: ManoObraEtapa[];
  margenes: Margen[];
  perfiles: PerfilKgM[];
  bom: BOMItem[];
}
