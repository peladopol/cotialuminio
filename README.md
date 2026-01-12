# Cotizador MVP (Web) – Línea Clásica

## Levantar API
```bash
cd server
npm i
npm run dev
# http://localhost:8787/api/health
```

## Levantar widget (dev)
```bash
cd widget
npm i
npm run dev
```

## Build widget (embebible)
```bash
cd widget
npm run build
# dist/kurving-cotizador.iife.js
```

En tu web:
```html
<div id="cotizador"></div>
<script src="/ruta/kurving-cotizador.iife.js"></script>
<script>
  window.KurvingCotizador.mount(document.getElementById("cotizador"), {
    apiBaseUrl: "https://TU-DOMINIO.com/api",
    mode: "cliente"
  });
</script>
```

## Admin: cargar precios por Excel
Endpoint:
- POST `/api/admin/upload-excel` (multipart, key `file`)

Hojas admitidas:
- Parametros (Clave, Valor)
- Accesorios
- Vidrios
- Separador
- ManoObra
- Margenes
- Ruedas
- Perfiles (Codigo, Kg_m)
- BOM (Linea, Tipologia, Variante, Perfil, Descripcion, Cantidad, CoefA, CoefH, Const_mm)

Notas:
- CORREDIZA_2H y VENTANA_ABRIR_1H usan fórmulas del manual (no necesitan BOM).
- Para puerta corrediza faltan kg/m de 99209 y 99252: cargalos en Excel (hoja Perfiles).
- Para paño fijo y contravidrios (99229/99230/99233) también cargá kg/m.


## Límites de fabricación (editables en Excel -> Parametros)
- vidrio_hoja_ancho_mm=2500, vidrio_hoja_alto_mm=3600
- aluminio_barra_mm=6000
- min_/max_ por tipología: min_ancho_CORREDIZA_2H, max_alto_PANO_FIJO, etc.


## Seed (costos y reglas)

El **source of truth** del seed es:

- `server/assets/seed.json` (versionado, validable)
- `server/assets/seed.xlsx` es **derivado** (editable/visual)

### Flujo recomendado

1) Editás `server/assets/seed.json`
2) Corrés:

```bash
cd server
npm run seed:sync
```

Eso:
- valida (`seed:validate`)
- regenera el Excel (`seed:export`) en `server/assets/seed.xlsx`

> El backend siempre puede leer `seed.xlsx` (para el usuario final), pero el repo se mantiene consistente desde `seed.json`.

