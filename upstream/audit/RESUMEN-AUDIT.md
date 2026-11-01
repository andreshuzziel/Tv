# 🔒 Auditoría del clon completo — `iptv-org/iptv`

**Clon:** `upstream/iptv-clone/` — `git clone --depth 1 https://github.com/iptv-org/iptv.git` · commit `d5a172b` ("[Bot] Update PLAYLISTS.md") · 603 archivos · 6,8 MB · 1 commit de historia (shallow).

**Método:** 100% estático. Nada del clon fue instalado ni ejecutado.

## Resultados del escaneo de código

| Chequeo | Resultado |
|---|---|
| Archivos ejecutables (`perm -u+x`) | **0** |
| Binarios (.exe/.apk/.dll/.so/.bat/.ps1/.zip…) | **0** |
| `child_process` / `exec` / `eval` / `new Function` / `atob` / tokens `ghp_…` en `scripts/` y `.github/` | **0 hallazgos** |
| `curl`/`wget` en workflows | **0** (solo `npm install` + scripts propios) |
| Actions de GitHub **sin fijar por SHA** | **0** (todas con `@<sha40>`) |
| `require`/`import` desde URL http(s) en código | **0** |
| ⚠️ `package.json` → `"postinstall": "npm run api:load"` | se ejecuta al hacer `npm install` → **no ejecutar nada del repo** |

## Resultados del escaneo de playlists (datos)

- 438 archivos `.m3u` · **18.568 canales/URLs** totales.
- **4.007 URLs con hallazgos** (detalle completo: `findings.csv`):

| Flag | Cantidad |
|---|---|
| `http` plano (sin cifrar) | 3.815 |
| IP directa (sin nombre de dominio) | 2.612 |
| `token=` en la URL | 144 |
| URL sospechosa (`.php`, acortadores, `wp-admin`, `login`…) | 41 |
| extensiones `.php` | 30 |
| esquemas legacy `rtmp` / `srt` / `mmsh` / `rtsp` / sin esquema | 19 |
| otras extensiones raras (`.flv`, `.htm`, `.smil`, `.ogg`…) | 13 |

- Archivos con más URLs problemáticas: `streams/ru.m3u` (467), `cn.m3u` (419), `us.m3u` (374), `br.m3u` (216), `co.m3u` (158)…
- Ejemplos concretos de riesgo: `http://158.101.222.193:88/georgia_play.php?id=…`, `https://php.jdshipin.com/TVOD/iptv.php?id=…`, `https://tinyurl.com/canal5uy`, proxies `wp-admin/admin-ajax.php?action=frp_hls_proxy&url=…`, y cientos de `http://IP:8000/play/xxxx/index.m3u8` (paneles comunitarios sin TLS).

## Política de sanitización aplicada a este repo

Se conservó una URL solo si cumple **todas**:
1. esquema `https://` (con nombre de dominio, no IP directa),
2. extensión de stream normal (`.m3u8/.m3u/.mpd/.mp4/.ts/.m4a/.aac`),
3. no contiene patrones sospechosos (`.php`, `.exe`, acortadores, `wp-admin`, credenciales),
4. no es TV de pago / cable no autorizada (ESPN, TNT Sports, DSports, Disney, Cartoon Network, Cinecanal, CDF…).

## Acciones realizadas

| Acción | Resultado | Registro |
|---|---|---|
| `playlists/chile-segura.m3u` creada desde `countries/cl.m3u` | **177 conservadas / 34 eliminadas** (31 http, 26 IP directa, 15 TV de pago) | `chile-segura-reporte.csv` |
| Playlists locales sanitizadas (`chile-completa`, `nacionales`, `noticias`, `biobio`) | **42 conservadas / 16 eliminadas** | `limpieza-playlists-locales.csv` |
| `data/channels.js` | 9 entradas con espejo http/IP marcadas con `⚠ espejo no oficial` | — |

## Veredicto final

- **Código del upstream: LIMPIO** (solo datos + CI legítimo). Seguro de clonar/leer; no ejecutar sus scripts.
- **Datos del upstream: RIESGOSO en bruto** → usar solo las versiones sanitizadas de este repo (`playlists/chile-segura.m3u`) o filtrar con `audit-repo.sh`.
- Repetir auditoría: `./audit-repo.sh iptv-org/iptv master` (desde la raíz del repo).
