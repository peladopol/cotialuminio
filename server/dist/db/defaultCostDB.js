export const defaultCostDB = {
    parametros: {
        aluminio_usd_kg: 8,
        tipo_cambio_ars_usd: 1500,
        iva_pct: 21,
        peso_vidrio_kg_m2_mm: 2.5,
        holgura_cavidad_mm_por_lado: 1,
        puerta_corrediza_alto_mm: 1800,
        mano_obra_min_por_ml_tapajunta: 5,
        // DVH por componentes: costo de armado por m2 (sin IVA)
        armado_dvh_ars_m2: 0,
        // Límites físicos / comerciales (editables por Excel en hoja Parametros)
        vidrio_hoja_ancho_mm: 2500,
        vidrio_hoja_alto_mm: 3600,
        aluminio_barra_mm: 6000,
        // Rangos por tipología (mm)
        min_ancho_CORREDIZA_2H: 500,
        min_alto_CORREDIZA_2H: 300,
        max_ancho_CORREDIZA_2H: 3000,
        max_alto_CORREDIZA_2H: 2200,
        min_ancho_PANO_FIJO: 200,
        min_alto_PANO_FIJO: 200,
        max_ancho_PANO_FIJO: 4000,
        max_alto_PANO_FIJO: 2500,
        min_ancho_VENTANA_ABRIR_1H: 300,
        min_alto_VENTANA_ABRIR_1H: 300,
        max_ancho_VENTANA_ABRIR_1H: 1200,
        max_alto_VENTANA_ABRIR_1H: 1800,
    },
    accesorios: [
        { codigo: "ACC-0001", descripcion: "Manija (modelo único)", linea: "CLASICA", tipologia: "GENERAL", unidad: "u", precio_ars: 5000, regla: "por_hoja", cantidad_base: 1 },
        { codigo: "ACC-0002", descripcion: "Cerradura (modelo único)", linea: "CLASICA", tipologia: "GENERAL", unidad: "u", precio_ars: 5000, regla: "por_abertura", cantidad_base: 1 },
        { codigo: "RUEDA-BASE", descripcion: "Ruedas (según peso)", linea: "CLASICA", tipologia: "CORREDIZA_2H", unidad: "u", precio_ars: 5000, regla: "segun_peso", cantidad_base: 2 },
        { codigo: "T-087", descripcion: "Fijación tapajunta", linea: "CLASICA", tipologia: "GENERAL", unidad: "u", precio_ars: 500, regla: "por_abertura", cantidad_base: 1 },
        { codigo: "B-057", descripcion: "Burlete tapajunta", linea: "CLASICA", tipologia: "GENERAL", unidad: "ml", precio_ars: 200, regla: "por_abertura", cantidad_base: 1 }
    ],
    ruedas: [
        { categoria: "LIVIANA", peso_min_kg: 0, peso_max_kg: 40, codigo_accesorio: "RUEDA-LIV", precio_ars: 5000 },
        { categoria: "MEDIA", peso_min_kg: 40, peso_max_kg: 80, codigo_accesorio: "RUEDA-MED", precio_ars: 5000 },
        { categoria: "PESADA", peso_min_kg: 80, peso_max_kg: 140, codigo_accesorio: "RUEDA-PES", precio_ars: 5000 }
    ],
    vidrios: [
        { id: "INC-4", tipo: "INC", configuracion: "4mm incoloro", espesor_total_mm: 4, precio_m2_ars: 10000 },
        { id: "INC-5", tipo: "INC", configuracion: "5mm incoloro", espesor_total_mm: 5, precio_m2_ars: 10000 },
        { id: "LAM-33", tipo: "LAM", configuracion: "3+3 laminado incoloro", espesor_total_mm: 6.5, precio_m2_ars: 40000 },
        { id: "DVH-4-9-4", tipo: "DVH", configuracion: "4/9/4 incoloro", espesor_total_mm: 17, camara_mm: 9, precio_m2_ars: 0 },
        { id: "DVH-4-12-4", tipo: "DVH", configuracion: "4/12/4 incoloro", espesor_total_mm: 20, camara_mm: 12, precio_m2_ars: 0 },
        { id: "DVH-33-12-4", tipo: "DVH", configuracion: "3+3/12/4 incoloro", espesor_total_mm: 22.5, camara_mm: 12, cavidad_min_mm: 24.5, precio_m2_ars: 0 },
        { id: "DVH-33-12-33", tipo: "DVH", configuracion: "3+3/12/3+3 incoloro", espesor_total_mm: 25, camara_mm: 12, precio_m2_ars: 0 }
    ],
    separadores: [
        { ancho_mm: 9, precio_ml_ars: 8000, sistema: "Warm edge + Hotmelt" },
        { ancho_mm: 12, precio_ml_ars: 11500, sistema: "Warm edge + Hotmelt" }
    ],
    manoObra: [
        { linea: "CLASICA", tipologia: "CORREDIZA_2H", etapa: "1-Armado abertura", hh: 0.8, costo_hora_ars: 0 },
        { linea: "CLASICA", tipologia: "CORREDIZA_2H", etapa: "2-Corte vidrio + Armado DVH", hh: 0.6, costo_hora_ars: 0 },
        { linea: "CLASICA", tipologia: "CORREDIZA_2H", etapa: "3-Colocación vidrio", hh: 0.4, costo_hora_ars: 0 },
        { linea: "CLASICA", tipologia: "CORREDIZA_2H", etapa: "4-Embalado", hh: 0.2, costo_hora_ars: 0 },
        { linea: "CLASICA", tipologia: "PANO_FIJO", etapa: "1-Armado abertura", hh: 0.4, costo_hora_ars: 0 },
        { linea: "CLASICA", tipologia: "PANO_FIJO", etapa: "2-Corte vidrio + Armado DVH", hh: 0.5, costo_hora_ars: 0 },
        { linea: "CLASICA", tipologia: "PANO_FIJO", etapa: "3-Colocación vidrio", hh: 0.2, costo_hora_ars: 0 },
        { linea: "CLASICA", tipologia: "PANO_FIJO", etapa: "4-Embalado", hh: 0.15, costo_hora_ars: 0 },
        { linea: "CLASICA", tipologia: "VENTANA_ABRIR_1H", etapa: "1-Armado abertura", hh: 0.6, costo_hora_ars: 0 },
        { linea: "CLASICA", tipologia: "VENTANA_ABRIR_1H", etapa: "2-Corte vidrio + Armado DVH", hh: 0.5, costo_hora_ars: 0 },
        { linea: "CLASICA", tipologia: "VENTANA_ABRIR_1H", etapa: "3-Colocación vidrio", hh: 0.25, costo_hora_ars: 0 },
        { linea: "CLASICA", tipologia: "VENTANA_ABRIR_1H", etapa: "4-Embalado", hh: 0.15, costo_hora_ars: 0 },
        { linea: "CLASICA", tipologia: "TAPA_JUNTA", etapa: "COLOCACION", hh: 0, costo_hora_ars: 0 }
    ],
    margenes: [
        { linea: "CLASICA", tipologia: "CORREDIZA_2H", canal: "WEB", forma_pago: "TRANSFERENCIA", margen_pct: 35 },
        { linea: "CLASICA", tipologia: "PANO_FIJO", canal: "WEB", forma_pago: "TRANSFERENCIA", margen_pct: 30 },
        { linea: "CLASICA", tipologia: "VENTANA_ABRIR_1H", canal: "WEB", forma_pago: "TRANSFERENCIA", margen_pct: 32 }
    ],
    perfiles: [
        // Corrediza 2 hojas (manual)
        { codigo: "99200", kg_m: 1.193 },
        { codigo: "99201", kg_m: 0.654 },
        { codigo: "99228", kg_m: 0.186 },
        { codigo: "99203", kg_m: 0.632 },
        { codigo: "99248", kg_m: 0.603 },
        { codigo: "99207", kg_m: 0.605 },
        { codigo: "99250", kg_m: 0.573 },
        { codigo: "99204", kg_m: 0.667 },
        { codigo: "99249", kg_m: 0.642 },
        { codigo: "99255", kg_m: 0.424 },
        { codigo: "99206", kg_m: 0.186 },
        // Puerta corrediza (kg/m faltante -> cargalo en Excel)
        { codigo: "99209", kg_m: 1.250 },
        { codigo: "99252", kg_m: 1.223 },
        // Ventana de abrir (manual)
        { codigo: "99216", kg_m: 0.728 },
        { codigo: "99235", kg_m: 0.902 },
        // Paño fijo / contravidrios (kg/m a cargar)
        { codigo: "99229", kg_m: 0.760 },
        { codigo: "99230", kg_m: 0.210 },
        { codigo: "99233", kg_m: 0.146 }
    ],
    bom: [
        // Paño fijo: marco 99229 + contravidrio según VS/DVH (acá queda como fallback si cargás kg/m)
        { linea: "CLASICA", tipologia: "PANO_FIJO", variante: "VS", perfil: "99229", descripcion: "Marco", cantidad: 2, coefA: 1, coefH: 0, const_mm: 0 },
        { linea: "CLASICA", tipologia: "PANO_FIJO", variante: "VS", perfil: "99229", descripcion: "Marco", cantidad: 2, coefA: 0, coefH: 1, const_mm: 0 },
        { linea: "CLASICA", tipologia: "PANO_FIJO", variante: "VS", perfil: "99230", descripcion: "Contravidrio VS", cantidad: 2, coefA: 1, coefH: 0, const_mm: 0 },
        { linea: "CLASICA", tipologia: "PANO_FIJO", variante: "VS", perfil: "99230", descripcion: "Contravidrio VS", cantidad: 2, coefA: 0, coefH: 1, const_mm: 0 },
        { linea: "CLASICA", tipologia: "PANO_FIJO", variante: "DVH", perfil: "99229", descripcion: "Marco", cantidad: 2, coefA: 1, coefH: 0, const_mm: 0 },
        { linea: "CLASICA", tipologia: "PANO_FIJO", variante: "DVH", perfil: "99229", descripcion: "Marco", cantidad: 2, coefA: 0, coefH: 1, const_mm: 0 },
        { linea: "CLASICA", tipologia: "PANO_FIJO", variante: "DVH", perfil: "99233", descripcion: "Contravidrio DVH", cantidad: 2, coefA: 1, coefH: 0, const_mm: 0 },
        { linea: "CLASICA", tipologia: "PANO_FIJO", variante: "DVH", perfil: "99233", descripcion: "Contravidrio DVH", cantidad: 2, coefA: 0, coefH: 1, const_mm: 0 }
    ]
};
