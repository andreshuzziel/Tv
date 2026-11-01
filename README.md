# 📺 TV Chile — Repositorio de canales abiertos

> 🔄 **Última actualización:** 01-nov-2026 · **3.112 canales** (Chile + español Latam/ES de 7 fuentes, todo sanitizado https) · servidor sirviendo en el puerto 8000

Repositorio y reproductor web de canales de **televisión abierta y pública de Chile**, con foco extra en la **Región del Biobío**. Datos obtenidos del proyecto open-source [iptv-org](https://github.com/iptv-org/iptv).

## Contenido

```
index.html              → Reproductor web (abre y listo)
styles.css / app.js     → Interfaz y lógica del player HLS
data/channels.js        → Catálogo de canales (3.112 = Chile + español Latam/ES de 7 fuentes, todo sanitizado)
vendor/hls.min.js       → reproductor HLS local (sin CDN externo)
playlists/
  ├ chile-segura.m3u    → ✅ LISTA RECOMENDADA: solo HTTPS con dominio, sin TV de pago (177 canales)
  ├ chile-completa.m3u  → canales del repo (sanitizada: sin http/IP/.php)
  ├ nacionales.m3u      → TVN, Mega, CHV, Canal 13, La Red, Telecanal… (sanitizada)
  ├ noticias.m3u        → T13, Meganoticias, ADN, Cooperativa, TV Senado (sanitizada)
  └ biobio.m3u          → Bío Bío TV, Concepción TV, Canal 9, El 3 de Conce… (sanitizada)
  └ m3u-cl/             → lista M3U.CL sanitizada, separada por región (16) y tema (16) — ver su README
upstream/
  ├ iptv-clone/         → clon shallow (depth 1) de github.com/iptv-org/iptv @ d5a172b
  └ audit/              → findings.csv (4.007 URLs con hallazgos) + reportes de limpieza
REVISION-SEGURIDAD.md   → auditoría anti-hackeo completa del repo externo
audit-repo.sh           → script para auditar CUALQUIER repo de GitHub sin ejecutarlo
```

## Uso

**Navegador:** abre `index.html` y haz clic en un canal.

**VLC:** `Medio → Abrir ubicación de red` y pega:
```
https://iptv-org.github.io/iptv/countries/cl.m3u      # todo Chile
https://iptv-org.github.io/iptv/subdivisions/cl-bi.m3u # Biobío
```
o abre directamente cualquier archivo de `playlists/`.

**TiviMate / IPTV Smarters / OTT Navigator:** agrega una playlist tipo M3U apuntando al archivo.

## Canales incluidos (3.112)

Se incluyen **todos los canales seguros** de: (1) iptv-org Chile (`chile-segura.m3u` + catálogo curado con sitios oficiales: TVN, Mega, CHV, Canal 13, La Red…), (2) **M3U.CL** (381 canales, por región y tema en `playlists/m3u-cl/`) y (3) iptv-org **en español de otros países, COMPLETO** y (4) **fuentes extras curadas**: Alplox/json-teles, Free-TV (LatAm+ES), CharlieII/IPTV_mexico, JMigue85/IPTV-SV, Pluto TV ES (`playlists/fuentes/*.m3u`) (`spa`: los 1.584 canales sanitizados entran en la app dentro de las temáticas existentes — Noticias 101, Música 187, Religioso 170, General 987, Entretenimiento 133…; además por temática en `playlists/es/` y completa en `playlists/tematicas-es-completa.m3u`). Se excluyen solo entradas riesgosas (http/IP/.php) o de TV de pago/VOD no autorizada (ver `upstream/audit/*.csv`).

Grupos automáticos (desde las categorías de iptv-org): General, Noticias, Deportes, Infantil, Cine, Música, Entretenimiento, Religioso, Cultura, Comedia, Educación, Negocios, Viajes, Estilo de vida, Biobío (canales locales de tu región), 13 FAST…

Cada canal muestra la **🏳️ bandera emoji de su país de origen** (campo `cc` ISO 3166-1, derivado del `tvg-id` de iptv-org: 🇨🇱 567, 🇩🇴 234, 🇪🇸 164, 🇺🇸 144, 🇦🇷 139, 🇵🇪 135, 🇲🇽 130…), en la lista y en la barra del canal en reproducción.

La app **sintoniza sola**: no hay botón de reproducir — al hacer clic en un canal reproduce al instante (si el navegador bloquea el sonido, arranca en silencio con el aviso 🔊, y si bloquea todo, basta **tocar la pantalla**). Al volver a abrir la página **reabre automáticamente el último canal visto**, y hay zapping con ↑ / ↓.

## ⚽ Deportes

**No se incluyen** señales de TNT Sports, ESPN, DSports ni similares: los enlaces que circulan en listas públicas son retransmisiones no autorizadas de TV de pago. Alternativas legales dentro de la app (pestaña Deportes): TNT Sports oficial, ESPN/Disney+, Chilevisión y Mega en abierto, FIFA+, Pluto TV Deportes, Zapping, Movistar TV, DirecTV GO.

## 🔒 Seguridad

El upstream `iptv-org/iptv` fue sometido a una **auditoría anti-hackeo completa** (ver `REVISION-SEGURIDAD.md` y `upstream/audit/RESUMEN-AUDIT.md`). Conclusión: el **código** del repo está limpio (0 binarios ejecutables, 0 patrones peligrosos en workflows/scripts, actions fijadas por SHA), pero sus playlists contienen miles de URLs de riesgo (HTTP plano, IPs directas, endpoints `.php`, `rtmp`). Por eso este repo aplica una política de sanitización:

- `playlists/*.m3u` quedaron **sanitizadas**: solo `https://` con nombre de dominio; fuera TV de pago no autorizada, IPs directas, `.php` y URLs sospechosas (detalle en `upstream/audit/limpieza-playlists-locales.csv`).
- `playlists/chile-segura.m3u` es la lista pública recomendada (177 canales conservados, 34 eliminados).
- Las entradas de `data/channels.js` que dependen de espejos http/IP llevan el aviso `⚠ espejo no oficial`; si una señal falla, usa el botón **Sitio oficial** (tvn.cl, mega.cl, etc.).
- Para auditar cualquier otro repo externo antes de usarlo: `./audit-repo.sh org/repo`.
- **Verificación en vivo de enlaces** (DNS/TLS/HTTP/redirects): ver `REPORTE-SEGURIDAD-LINKS.md` — 567 URLs chequeadas, 0 riesgosas, 106 muertas podadas.

## Aviso

Solo se enlazan señales publicadas por los propios canales. Los enlaces pueden caerse, cambiar o tener geobloqueo. Si una señal falla, usa el botón **Sitio oficial**.

Licencia MIT para el código. Las marcas y contenidos pertenecen a sus respectivos titulares.

## Panel de canales (derecha) — Regiones y Temáticas
El panel lateral se rehízo desde cero y ahora está a la **derecha** del reproductor:
- **📍 Regiones** — 260 canales regionales en las 16 regiones, de norte a sur (XV Arica y Parinacota → XII Magallanes), cada una con su número romano y capital; dentro, separados en *Televisión regional*, *Temáticos de la región* y *Radios*. Filtro *Todo / Solo TV / Solo radios*.
- **🎭 Temáticas** — los otros 1.106 canales (nacionales + hispanos) en 14 temas: Señal abierta nacional, Noticias, Deportes, Entretención y series, Infantil, Cultura/educación, Música, Radios, Estilo de vida, Gobierno, Religiosos, Comunitarios, Internacionales y Generalistas. Filtro *Todos / 🇨🇱 Chile / 🌎 Hispanos*.
- **★** — Favoritos + vistos recientemente.
- Buscador sin tildes, secciones desplegables (se recuerdan), zapping ↑/↓ en el orden del panel, descarga M3U de la vista actual con `group-title` = región o temática.


## 📺 Usar en tu TV con un link (app IPTV)

La lista completa está en `playlists/tv-chile-todo.m3u` (3.110 canales). Para usarla en TiviMate / IPTV Smarters / OTT Navigator / VLC en tu TV, publica este repo en GitHub y usa el link raw:

```
https://raw.githubusercontent.com/TU-USUARIO/tv-chile/main/playlists/tv-chile-todo.m3u
```

(o sirviendo la carpeta en tu red local: `http://IP-DE-TU-PC:8000/playlists/tv-chile-todo.m3u`)

👉 Guía paso a paso completa: **`GUIA-TV.md`**


## 🖥️ Layout (3 columnas)

| Izquierda | Centro | Derecha |
|---|---|---|
| 🎭 **Temáticas** (15) + filtro CL/ES + buscador | 📺 **Pantalla** grande (autoplay, sin botón ▶) + canal actual | 📋 **Canales**: 📍 Regiones / 🎭 Temáticas / ★ Favoritos + ⬇ M3U |

Elegir una temática en la izquierda filtra en vivo la lista de la derecha (p. ej. *Deportes* → 78 canales, *Noticias* → 150).


## 🛠️ Guías

- **`GUIA-IMPLEMENTACION.md`** — cómo publicar en GitHub y usar **dos tokens**: uno de *lectura* (ver la lista en la TV si el repo es privado) y otro de *actualización* (pipeline automático con GitHub Actions + `scripts/actualizar.sh` + `scripts/sanitizar.py`).
- **`GUIA-ORDEN.md`** — guía de canales **con números** (rangos 1–32 señal abierta CL, 53–85 Biobío, … 684+ español Latam/ES) y lista numerada completa; los números van en `tvg-chno` de `playlists/tv-chile-todo.m3u`.
- **`GUIA-TV.md`** — pasos para cargar el link en la app IPTV de tu TV.

## ✏️ Nombres personalizados
Sí: botón **✏️ Renombrar** en la app (se guarda en localStorage y puede fijarse en `data/renames.js`, que el pipeline reaplica sobre la playlist numerada sin cambiar los números). En la TV: en la app IPTV mantén presionado el canal → renombrar; o edita el nombre tras la coma del `#EXTINF` en el `.m3u`.

## 🏳️ Bandera + temática por canal
Cada canal muestra su **bandera del país de origen** (campo `cc` = ISO 3166-1 alpha-2 → emoji formado con los *Regional Indicator Symbols* U+1F1E6–U+1F1FF, el mismo sistema de la tabla pública de emojis de bandera) y su **temática** con icono (📺📰⚽🎬🧸⛩️🎓🎵📻…). Los 3.112 canales tienen `cc` verificado (proveniencia de la fuente; `scripts/mejorar_cc.js` re-verifica). La playlist `tv-chile-todo.m3u` incluye `tvg-country="XX"` en cada `#EXTINF`.

## 🖼️ Afiches (imagen)
- **`AFICHE-CANALES.svg`** (vectorial) y **`AFICHE-CANALES.png`** — afiche con **los 3.112 canales: número + 🚩 bandera real del país de origen (imágenes flagcdn incrustadas, no emojis) + nombre**, por bloques (1–32 señal abierta CL, 53–85 Biobío, … 684+ español otros países).
- **`afiches/afiche-*.svg`** — un afiche por bloque para leer/imprimir por sección.
- Cada canal lleva el **emoji gráfico de su bandera de origen** incrustado, también en PNG: no depende de que el equipo tenga una fuente de emojis. Para el código heredado `uk` se muestra correctamente 🇬🇧. Iconos Twemoji (CC BY 4.0), atribución en `assets/flags/README.md`.
- Regenerar: `python3 scripts/afiche.py` (lee `data/channels.js` y `data/paises.js`; utiliza los iconos locales).

- La sección **⚽ Deportes (309–317)** va ampliada: celdas grandes en 2 columnas + bloque ✔ con las **10 alternativas legales** (`window.SPORTS`: TNT Sports, ESPN/Disney+, Chilevisión/Mega Deportes, FIFA+, Pluto TV Deportes, Zapping/Movistar/DirectV GO, Movistar Play…). Cada celda del afiche trae **bandera real + emote 🏳️** del país de origen.

## ⚽ Temática Deportes mejorada (app)
- Sección **✔ Alternativas legales oficiales** arriba de las temáticas: las 10 opciones de `window.SPORTS` (TNT Sports, ESPN/Disney+, Chilevisión/Mega Deportes, FIFA+, Pluto TV Deportes, Zapping/Movistar/DirectV GO, Movistar Play…) — al tocarlas **abren su sitio oficial** (tienen bandera 🇨🇱/🏟️ y tipo Gratis/Suscripción).
- La temática **Deportes (79 canales)** ahora se agrupa en subtemas: ⚽ fútbol/general 41 · 🏎️ motor/poker/nichos 12 · 🐎 hípica/turf 6 · 🇺🇸 ligas USA/inglés 6 · 🌐 internacionales 7 · 🥊 combate 5 · 🔴 24/7 2.
- Canales sin stream pero con sitio oficial (Mega Ficción, Mega 2, alternativas) abren la web al tocarlos.

## 🧹 Dedupe nov-2026 (grillas cable/telefónicas CL)
Crucé las grillas de Movistar/VTR/Claro/GTD/Telsur/Entel/Zapping con el catálogo: de **175 nombres duplicados** se probó cada URL (HTTP + tipo de contenido) y se **desactivaron 226 alternativas muertas** (quedó la mejor señal viva por canal; ver nota ⚠️ en GUIA-ORDEN). Resultado: **3.112 canales, 2.884 con stream activo**. Los FTA restantes de m3u.cl (CNN Chile, Opinionsur Cine, Radio Universal, Radio Navarino) tenían URL caída → no se agregaron. Los canales de pago de cable (TNT/ESPN/HBO/Discovery…) **no se implementan como stream** — van por suscripción oficial (Movistar Play, Zapping, etc.; deportes ya en la sección ✔ legales).

## 🌐 Sección OTT implementada (streaming legal, sin cable)
Nueva temática **🌐 Servicios OTT** en el panel izquierdo: 8 entradas (Max/HBO, **TNT Sports en Max** ~$13.990, Disney+ con Star+ESPN, Fanatiz, Pluto TV, Vix, Prime Video, Paramount+) con su web oficial, precio aprox. 2026 y nota; al tocarlas **abren el sitio oficial** (son enlaces, no streams). Catálogo: 3.120 entradas (3.112 canales + 8 OTT).

## 🌐 OTT: solo los GRATIS implementados
La temática **🌐 Servicios OTT** quedó solo con servicios **gratuitos** (Pluto TV, Vix tier gratis, Tubi, Samsung TV Plus, LG Channels, Plex gratis, YouTube en vivo, RTVE Play, Twitch, Dailymotion) — los de pago (Max/HBO, TNT Sports en Max, Disney+, Prime, Paramount+, Fanatiz de pago) **no** están como OTT; los deportes de pago siguen solo como referencia en la sección ✔ legales. Además se agregaron 2 canales FAST gratis con stream oficial verificado vivo: **#3111 Clan RTVE** 🇪🇸 y **#3112 La 2 de TVE** 🇪🇸. Total: 3.125 entradas, 2.886 con stream.

- La temática **🌐 Servicios OTT** también figura como bloque propio en `GUIA-ORDEN.md` y en los afiches (`afiches/`, bloque final 🌐).

## 🏛️ Temática Gobierno = SOLO Chile
La temática **🏛️ Gobierno de Chile (solo 🇨🇱)** muestra únicamente canales del Estado chileno (TV Senado #51, Cámara de Diputados #438, Gobierno de Chile #555 — reasignados al grupo `Legislativo`). Los legislativos extranjeros (Congreso de España, canales ciudad USA, etc.) quedan fuera de esta temática (siguen en General/Español otros países).
