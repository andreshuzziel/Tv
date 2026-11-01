# 🔒 Auditoría de M3U.CL — lista IPTV Chile (`m3u.cl/lista-iptv-chile.php`)

**Fecha:** 31-10-2026 · **Fuente:** página HTML (394 filas con `id_canal`/`nombre_categoria`/`sitio_web`) + `https://m3u.cl/lista/CL.m3u` (392 canales) · **Método:** estático, nada ejecutado.

## Hallazgos de seguridad (detalle: `m3u-cl-findings.csv`)

| Flag | Cantidad | Acción |
|---|---|---|
| relay de terceros (info) | 85 | conservados (son https con dominio) pero marcados |
| `http://` plano | 4 | ❌ eliminados |
| IP directa | 2 | ❌ eliminados |
| VOD "Películas y Series" | 3 | ❌ eliminados (retransmisión no autorizada de cine/series) |
| TV de pago / adulto | 2 | ❌ eliminados |
| token de rastreo en URL (`?PlaylistM3UCL`, `?WebM3UCL`) | 3 | marcados (se conservan porque el servidor los exige) |

- **Resultado: 381 de 392 canales quedaron "seguros"** (https + dominio, sin TV de pago, sin VOD pirata, sin URLs sospechosas).
- La lista cruda se conserva solo como evidencia en `upstream/m3u-cl/CL-raw.m3u` — **no usarla directo**.
- Nota: el sitio mete un `session_start()` warning en el HTML y reproduce un video propio con errores; no afecta los datos.

## Salidas generadas (sanitizadas)

- `playlists/m3u-cl/region-*.m3u` — **16 regiones**: Metropolitana (36), Valparaíso (29), **Biobío (27)**, Maule (25), Magallanes (19), Ñuble (17), Atacama (15), O'Higgins (15), Araucanía (9), Aysén (9), Coquimbo (8), Los Ríos (8), Los Lagos (23), Antofagasta (4), Arica y Parinacota (4), Tarapacá (3), Nacional (130).
- `playlists/m3u-cl/tema-*.m3u` — **16 temáticas**: Radio (104), Regionales (113), Música (33), TV general (27), Religiosos (23), Universitarios (12), Comunitarios (11), Deportes (8, solo legales/abiertos), Noticias (7), Animación (4), Culturales (4), Internacionales (3), etc.
- Índice con conteos: `playlists/m3u-cl/README.md`.

## Integración en la app

- `data/channels.js` pasó de 186 → **566 canales** (380 nuevos de m3u.cl, 1 duplicado omitido). Cada canal nuevo lleva grupo (temática), región (16 regiones de Chile) y nota `vía m3u.cl (lista sanitizada)`. Los de tu zona aparecen en el grupo/filtro **Biobío (29 canales)**.
- La app sigue con reproducción automática al hacer clic.
