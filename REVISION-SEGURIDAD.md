# 🔒 Revisión de seguridad ("anti-hackeo") — repositorio `iptv-org/iptv`

**Fecha:** 31-10-2026 · **Repo auditado:** https://github.com/iptv-org/iptv · **Método:** 100% estático (API pública de GitHub + archivos raw + escaneo de playlists). **Nada del repo fue ejecutado.**

Script reutilizable para auditar cualquier repo externo: `./audit-repo.sh org/repo` (incluido en este proyecto).

---

## 1. Identidad y reputación del repositorio

| Dato | Valor |
|---|---|
| Organización | `iptv-org` (org real, verificada por API) |
| Creado | 14-nov-2018 (8 años activo) |
| Estrellas / forks | 142.930 ⭐ / 8.478 |
| Licencia | Unlicense (CC0 — dominio público) |
| Homepage oficial | `iptv-org.github.io` (coincide con el sitio que revisaste) |
| Estado | público, no archivado, no deshabilitado, último push reciente, 19 issues abiertos |

✅ **Veredicto:** organización legítima y consolidada. El dominio `iptv-org.github.io` que usas es el `has_pages` oficial de este repo (no un clon).

## 2. Inventario de archivos (árbol completo: 645 entradas, no truncado)

- 438 playlists `.m3u` (`streams/`), 63 `.ts` + 3 `.js` (solo tooling de CI en `scripts/` y `tests/`), 22 `.json`, 16 `.md`, 15 `.yml`, docs, `LICENSE`.
- **0 binarios ejecutables** (`.exe .apk .dll .so .bat .cmd .ps1 .msi .zip` …): no hay ningún payload descargable.

✅ El repo es **solo datos + utilidades de mantenimiento**, no contiene software instalable.

## 3. Workflows de GitHub Actions (7 archivos en `.github/workflows/`)

- Todas las acciones `uses:` están **fijadas por SHA** (ej. `actions/checkout@3d3c42e…`) ✔
- `update.yml` corre a diario por cron + manual; permisos mínimos (`contents: read`); el token (GitHub App) solo se usa para checkout/push del bot `iptv-bot[bot]`.
- **Sin patrones peligrosos:** no hay `curl | sh`, no `wget | bash`, no `base64 -d`, no descargas a `/tmp` y ejecución, no exfiltración de `secrets`, no tokens `ghp_…` hardcodeados.
- ⚠️ `package.json` incluye `"postinstall": "npm run api:load"`: si clonas el repo y haces `npm install`, **se ejecuta código automáticamente**. Las dependencias son conocidas (axios, @octokit, eslint, vitest, tsx…) y además fijan `overrides` de seguridad (`esbuild`, `@xmldom/xmldom`) ✔, pero la regla es: **como usuario final no ejecutes nada del repo** — solo usa los enlaces `.m3u`.

## 4. Código de los scripts (`scripts/`)

Revisados los clave (`streamTester.ts`, `proxyParser.ts`, `utils.ts`, `api.ts`): usan `axios` para testear los streams (ese es el propósito del proyecto). **Sin `child_process`, `eval`, `exec` ni ofuscación.** `package.json` es privado (no publicable a npm).

## 5. Escaneo de las playlists servidas (`index.m3u`: 11.388 canales, 2,6 MB)

| Hallazgo | Cantidad | Riesgo |
|---|---|---|
| URLs `https://` | 9.054 | ✔ normal |
| URLs `http://` **plano** | 2.320 | ⚠️ sin cifrar: manipulable en tránsito (MITM) |
| `rtmp://` / `mmsh://` / `srt://` | 14 | ⚠️ protocolos legacy, superficie de riesgo mayor en algunos players |
| **IPs directas** (sin dominio) | cientos (top: `88.212.7.14` con 86 canales…) | ⚠️⚠️ servidores comunitarios sin TLS; cambian de dueño seguido |
| URLs `.php?…` | 14 | ⚠️ típico de paneles no oficiales |
| `.exe/.apk/.zip`, acortadores (bit.ly…), `passw/login` en URL | **0** | ✔ no se encontró malware/phishing en las URLs |
| Tokens en query string | varios | ⚠️ pueden filtrarse/exponer acceso |

📌 El propio README admite: *"we have no control over the destination of the link"* — los streams son enviados por la comunidad y **no verificados**.

## 6. Conclusión sobre `iptv-org/iptv`

- ✅ **El repositorio en sí está LIMPIO**: datos + CI legítimo. Navegarlo, clonarlo o leer sus playlists es seguro; no ejecutes sus scripts (`npm install` corre un `postinstall`).
- ⚠️ **El riesgo real está en las URLs de stream de terceros** dentro de las playlists: `http` plano, IPs directas, `.php`, `rtmp`. Pueden caerse, geobloquearse, o —en casos raros— un servidor tomado por terceros puede servir contenido malicioso o pedir "login". Por eso: usa solo reproductores serios (VLC, TiviMate), filtra la playlist antes de importarla y nunca ingreses credenciales que "pida" un stream.
- ⚖️ Recordatorio legal: las entradas de TV de pago/deportes de estas listas (TNT Sports, ESPN, DSports…) son retransmisiones **no autorizadas**; para deportes usa las opciones legales (señal abierta oficial, Pluto TV, o suscripción oficial).

## 7. Revisión de TU app local (los 9 archivos de este workspace)

| Archivo | Hallazgo | Recomendación |
|---|---|---|
| `index.html` | Carga `hls.js@1.5.17` desde jsDelivr (CDN reputado, versión fijada) | ✔ aceptable; idealmente vendorizarlo local para 0 dependencias externas |
| `app.js` | Sin `eval`/fetch externo; solo carga `ch.url` en el player HLS; `localStorage` solo para favoritos; enlaces externos con `rel="noopener"`; el `.m3u` se genera como Blob local | ✔ limpio |
| `data/channels.js` (42 canales) | Varias señales usan `http://` + IP directa (`15.204.246.24:8080`, `38.252.238.18:8000`, `45.232.210.1:8029`…) | ⚠️ son mirrors no oficiales; sustitúelos por los HLS `https` oficiales de tvn.cl / mega.cl / chilevision.cl / 13.cl cuando existan (los campos `web` ya apuntan a los sitios oficiales) |
| `playlists/*.m3u` (58 canales) | Todas `http/https`, sin esquemas raros ni extensiones peligrosas | ✔ limpio; algunas IP directas ⚠️ (misma nota de arriba) |

## 8. Checklist anti-hackeo para CUALQUIER repo externo

1. **Metadatos:** ¿org real? edad, estrellas, licencia, ¿archivado?, último push, homepage que coincida.
2. **Inventario:** ¿hay binarios ejecutables o extensiones inesperadas? (`audit-repo.sh` paso 2)
3. **Workflows:** ¿`uses:` fijados por SHA? ¿hay `curl|sh`, `base64`, descargas+ejecución, permisos amplios, secretos expuestos? (paso 3)
4. **`package.json`:** hooks `pre/postinstall`, dependencias desconocidas/typosquatting. (paso 4)
5. **Código:** grep de `eval` / `exec` / `child_process` / base64 larguísimo / `require("http…")`. (paso 5)
6. **Archivos de datos** (m3u/json/csv): esquemas raros (`rtmp`, `mmsh`), IPs directas, `http` plano, extensiones `.exe/.php`, acortadores, tokens. (paso 6)
7. **Nunca ejecutes código de un repo desconocido** fuera de un sandbox/VM. Para listas IPTV solo importa el archivo de datos.
8. Revisa los **commits recientes** por cambios sospechosos en workflows/scripts.
9. Para streams: prefiere `https`, evita IP directa y `http` plano; usa un reproductor confiable y actualizado; nunca metas credenciales donde lo pida un stream.

## 9. Cómo repetir esta revisión

```bash
./audit-repo.sh iptv-org/iptv          # cualquier repo público de GitHub
./audit-repo.sh org/repo nombre-rama   # rama específica
```

El script solo consulta la API pública de GitHub y descarga archivos de texto a un directorio temporal para inspeccionarlos con grep; **no instala ni ejecuta nada del repo auditado**.

---

## 10. Auditoría sobre el CLON completo (realizada después)

Se clonó el repo completo (shallow) en `upstream/iptv-clone/` (commit `d5a172b`, 603 archivos, 6,8 MB) y se escanearon **todos** los archivos, no solo muestras:

- **Código: 0 hallazgos.** 0 archivos ejecutables, 0 binarios, 0 patrones peligrosos (`child_process`/`eval`/`exec`/tokens) en `scripts/` y `.github/`, 0 `curl|sh`, todas las actions fijadas por SHA. Único aviso: el `postinstall` de `package.json` (no ejecutar nada del repo).
- **Datos: 438 playlists `.m3u`, 18.568 URLs, de las cuales 4.007 tienen hallazgos** (3.815 HTTP plano, 2.612 IPs directas, 144 tokens en URL, 41 URLs sospechosas incl. 30 `.php`, 19 esquemas legacy `rtmp/srt/mmsh/rtsp`). Detalle completo en `upstream/audit/findings.csv`; resumen en `upstream/audit/RESUMEN-AUDIT.md`.

**Sanitización aplicada a este repositorio** (política: solo `https://` con dominio + extensión de stream normal + sin patrones sospechosos + sin TV de pago no autorizada):

| Acción | Resultado |
|---|---|
| `playlists/chile-segura.m3u` (nueva, recomendada) | 177 canales conservados / 34 eliminados → `upstream/audit/chile-segura-reporte.csv` |
| Playlists locales sanitizadas | 42 conservadas / 16 eliminadas → `upstream/audit/limpieza-playlists-locales.csv` |
| `data/channels.js` | 9 espejos http/IP marcados con `⚠ espejo no oficial` |

Verificación: `grep -E '^[^#]' playlists/*.m3u | grep -vE '^https://[a-zA-Z0-9.-]+\.[a-z]{2,}'` debe devolver **0 líneas** (todas las URLs son https con dominio).

---

## 11. Auditoría de M3U.CL (`m3u.cl/lista-iptv-chile.php`) — segunda fuente externa

Se descargó la lista `CL.m3u` (392 canales) y la página HTML (que trae categoría y sitio web por canal). Resultados en `upstream/audit/RESUMEN-AUDIT-M3UCL.md` y `upstream/audit/m3u-cl-findings.csv`:

- **381/392 canales seguros** (https + dominio). Eliminados 11: 4 http plano, 2 IPs directas, 3 VOD de películas no autorizado, 2 TV de pago/adulto. 85 marcados como relay de terceros (informativo).
- Salidas sanitizadas separadas por **región** (`playlists/m3u-cl/region-*.m3u`, 16 regiones — Biobío: 27 canales) y por **temática** (`tema-*.m3u`, 16 temas — Radio: 104, Regionales: 113, Música: 33…).
- La app (`data/channels.js`) ahora tiene **566 canales** (186 de iptv-org + 380 de m3u.cl), con grupo = temática y región asignada.
- Lista cruda guardada solo como evidencia: `upstream/m3u-cl/CL-raw.m3u` (no usar directo).

---

## 12. Verificación en vivo de TODOS los enlaces del repo (DNS / TLS / HTTP / redirects)

Ver `REPORTE-SEGURIDAD-LINKS.md` y `upstream/audit/links-check.csv`. Resumen:

- **567 URLs únicas / 132 hosts**, todas `https://` con dominio (se reemplazaron los últimos 9 espejos http/IP de `channels.js`: 7 pasaron a espejos https y 2 quedaron sin enlace → sitio oficial).
- **0 patrones maliciosos**, **57/57 redirects benignos** (mismo dominio o CDN), **TLS válido** salvo 1 cert expirado (`jireh-1-...dps.live`) y 5 hosts sin DNS (muertos, podados).
- **224 URLs responden OK**; 106 entradas muertas (404/timeout/DNS) fueron **podadas de las playlists**.
- Los endpoints pirata de ESPN/TNT (12 hosts) son http-plano/IP directa sin TLS → **inseguros**, siguen excluidos.
- Reputación: los relays restantes (streamlock, bozztv, logicahost, voxtvhd, rudo.video, dps.live…) son infraestructura pirata documentada (Silent Push, ThreatFabric), pero en nuestro repo llegan solo como https+domininio trazable.

---

## 13. Fuentes extras en español (Latam/ES) — búsqueda web + auditoría + fusión

Fuentes públicas curadas encontradas y auditadas (misma política: https+domininio, sin TV de pago/VOD/adulto, sin patrones sospechosos; detalle en `upstream/audit/fuentes-extras-findings.csv`):

| Fuente | URL | Canales | Nuevos agregados a la app |
|---|---|---|---|
| Alplox/json-teles (curado, exige HTTPS+web oficial) | raw.githubusercontent.com/Alplox/json-teles/.../channels.m3u (+channels.json para país/categoría/web) | 247 | 101 |
| Free-TV/IPTV (filtrado a tvg-country LatAm+ES) | raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8 | 2.053 | 79 |
| CharlieII/IPTV_mexico (FTA México/Latam) | .../CharlieII/IPTV_mexico/.../lista.m3u | 277 | 57 |
| JMigue85/IPTV-SV (Latam+España, ~1.700) | .../JMigue85/IPTV-SV/.../IPTVSV.m3u | 1.888 | 554 |
| Pluto TV España (FAST legal) | .../JMigue85/IPTV-SV/.../PlutoTV.ES.m3u | 137 | 97 |
| iptv-org región hispam | iptv-org.github.io/iptv/regions/hispam.m3u | 2.086 | 74 |

**Resultado: la app pasó de 2.150 → 3.112 canales** (+962 únicos; el resto eran duplicados o se descartaron por seguridad/legalidad). Se sumó la temática nueva **⛩️ Anime y doramas (46 canales)**. Playlists sanitizadas por fuente en `playlists/fuentes/*.m3u`.

⚠️ Se evitó a propósito las listas tipo bit.ly "PREMIUM", paneles zonictv/xTream, playlists con +18 (dzh0ni XXX) y la de Sunstar16 (pide VPN y aloja players de canales de pago) — mismo criterio que ESPN/TNT: no son seguras ni legales.
