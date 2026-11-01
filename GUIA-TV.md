# 📺 Cómo usar TV Chile en tu TV con un LINK (app IPTV)

Tu lista completa vive en **`playlists/tv-chile-todo.m3u`** (3.110 canales, todos https). Para usarla en la TV necesitas que ese archivo tenga una **URL pública**. Tienes 2 opciones:

---

## 🅰️ Opción recomendada: publicar en GitHub (gratis, URL permanente)

1. Crea una cuenta en https://github.com y un repositorio nuevo, p.ej. `tv-chile` (público).
2. En esta carpeta (ya es un repo git listo para subir):
   ```bash
   git remote add origin https://github.com/TU-USUARIO/tv-chile.git
   git branch -M main
   git push -u origin main
   ```
3. Tu **LINK para la app IPTV** será:
   ```
   https://raw.githubusercontent.com/TU-USUARIO/tv-chile/main/playlists/tv-chile-todo.m3u
   ```
   (cambia `TU-USUARIO` por tu usuario de GitHub).

   Listas parciales que también puedes usar como link:
   - Chile sanitizado: `.../playlists/chile-segura.m3u`
   - Por región (Biobío): `.../playlists/m3u-cl/region-biobio.m3u`
   - Por tema ES: `.../playlists/es/tema-infantil.m3u`, `tema-deportes.m3u`, `tema-anime.m3u`…
   - Por fuente: `.../playlists/fuentes/iptv-sv.m3u`, `pluto-es.m3u`…

> GitHub Pages alternativo: activa *Settings → Pages → main / root* y usa `https://TU-USUARIO.github.io/tv-chile/playlists/tv-chile-todo.m3u`

## 🅱️ Opción sin Internet pública: tu propia red (PC o Raspberry Pi)

1. Copia esta carpeta a una PC/Raspberry Pi que esté siempre encendida y en la **misma WiFi que la TV**.
2. En esa máquina ejecuta: `python3 -m http.server 8000 --bind 0.0.0.0`
3. Averigua la IP local: `ip addr` (Linux) o `ipconfig` (Windows) → p.ej. `192.168.1.50`
4. El **LINK** para la app será:
   ```
   http://192.168.1.50:8000/playlists/tv-chile-todo.m3u
   ```

## 📲 Pasos dentro de la app IPTV en la TV

- **TiviMate** (Android TV / Fire Stick): `+ Añadir playlist → URL` → pega el link → listo. (También: Ajustes → Playlist).
- **IPTV Smarters / Smarters Pro**: pantalla de inicio → `Cargar playlist mediante URL (M3U)` → pega el link.
- **OTT Navigator** (Android TV): `Playlist → Add → URL`.
- **VLC** (en TV o PC): `Medio → Abrir ubicación de red` → pega el link.
- **Samsung/LG (Tizen)**: busca **OTT Navigator**, **IPTV Smarters** o **SSIPTV** en la tienda de apps y usa "add by URL".

## ⚠️ Notas
- Todos los enlaces son **HLS (m3u8) sobre HTTPS** — compatibles con esas apps.
- Algunos canales tienen **geobloqueo** o no emiten 24/7: si uno falla, prueba otro del mismo grupo.
- No incluyas señales de TV de pago (ESPN/TNT piratas): no están en esta lista a propósito (ver `REVISION-SEGURIDAD.md`); para deportes usa las vías legales del panel ⚽ de la app web.
- Para actualizar la lista en la TV: vuelve a hacer `git push` (opción A) o reinicia el servidor (opción B) y en la app toca "actualizar playlist".

## ✏️ Personalizar los nombres de los canales (SÍ se puede)

- **En la app web:** botón **✏️ Renombrar** junto al reproductor → escribe el nombre nuevo (vacío = vuelve al original). Se guarda en tu navegador (localStorage) y también puede quedar fijo en el repo en `data/renames.js` (formato `{ "id": "Nombre" }`); la exportación `.m3u` usa el nombre personalizado.
- **En la playlist .m3u:** el nombre es el texto después de la coma en `#EXTINF:-1 ...,Nombre` — edítalo a mano y listo. **El número no cambia** (`tvg-chno`/`tvg-id` siguen iguales).
- **En apps IPTV de la TV (TiviMate, etc.):** mantén presionado el canal → *Rename* / *Renombrar*.
- **Al actualizar automático** (`scripts/actualizar.sh`): los renombres de `data/renames.js` se reaplican solos sobre la lista nueva con `scripts/aplicar_renames.py`, así tus nombres propios sobreviven a las actualizaciones.


## 🏳️ Banderas y temáticas en la TV
El archivo `tv-chile-todo.m3u` lleva `tvg-country="XX"` (ISO 3166-1 alpha-2) en cada canal: las apps compatibles muestran la bandera automáticamente (los emojis de bandera son los pares de *regional indicators* U+1F1E6+letra, según la tabla pública de emojis de bandera). El grupo (`group-title`) es la temática. En la app web cada canal muestra 🏳️ bandera + icono de temática junto al nombre.
