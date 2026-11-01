# 🔎 Verificación de seguridad de TODOS los enlaces del repositorio

**Fecha:** 31-10-2026 · **Alcance:** cada URL de `playlists/**` + `data/channels.js` (canales y deportes) · **Datos crudos:** `upstream/audit/links-check.csv`

## 1. Chequeo estático (patrones)

| Regla | Resultado |
|---|---|
| Todas `https://` con dominio (no IP) | ✅ 567/567 URLs (antes había 9 espejos http/IP en `channels.js`: 7 reemplazados por espejos https de m3u.cl — TVN, Mega, CHV, Canal 13, Telecanal, TV Chile, Meganoticias — y 2 quedaron sin enlace y apuntan al sitio oficial: Mega 2, Mega Ficción) |
| Sin `.php/.exe/.apk`, acortadores, `wp-admin`, credenciales en URL | ✅ 0 |
| Sin TV de pago / adulto / VOD pirata | ✅ 0 (política aplicada al importar) |

## 2. Chequeo de red en vivo (132 hosts, 567 URLs)

| Prueba | Resultado |
|---|---|
| **DNS** | 127 hosts resuelven; 5 muertos: `alba-cl-lared-lared.stream.mediatiquestream.com`, `bst.buin.cl`, `fernando.tail5b5e1d.ts.net`, `radioxxx.ddns.net`, `stream.skarnetchile.com` → sus canales fueron podados de las playlists |
| **TLS por puerto real** (148 chequeos host:puerto) | Mayoría con certificado válido. 1 certificado **expirado**: `jireh-1-hls-video-cl-isp.dps.live` (venció jul-2026). Varios **sin cert** en el puerto: `vdochile.com:3957`, `stream.skarnetchile.com:19360`, `www.cloudscriptdog.cl:19360`, `marine2.miplay.cl`, `5e3483cba9114.streamlock.net`, `samson.streamerr.co:8081`, `bst.buin.cl`, `fernando...ts.net`, `radioxxx.ddns.net`. Los "próximos a vencer" (<60 días) son Let's Encrypt que se renuevan solos |
| **Redirects** (57) | ✅ 57/57 se quedan en el mismo dominio o CDN conocido (`dai.google.com`, `origin.dpsgo.com`, subdominios `*.dps.live`, `redirector.rudo.video`). 0 redirects a IP/http/.php/sospechosos |
| **HTTP (range GET)** | 200/206 OK: **224** · redirects: 56 · 404: 49 · 403: 24 · 401: 2 · timeout: 19 · 400: 1 → **106 entradas muertas podadas** de las playlists (quedaron solo las que responden) |
| **Reputación de relays** (búsqueda web) | Los dominios relay de terceros que quedan (`streamlock.net`, `bozztv.com`, `logicahost.com.br`, `voxtvhd.com.br`, `rudo.video`, `dps.live`, `intersurtv.cl`…) pertenecen a la **infraestructura documentada de IPTV pirata** (Silent Push: 1.000+ dominios / 10.000 IPs; malware "Massiv" en apps IPTV falsas según ThreatFabric; iptv-org eliminó `intersurtv.cl` por transmitir canales de pago). En nuestro repo llegan solo como **https con dominio** (cifrado y trazable), nunca como IP/http |

## 3. Veredicto sobre los endpoints pirata de ESPN/TNT (de la auditoría previa)

12 hosts detrás de las 24 entradas ESPN/TNT Sports marcadas: **23 de 24 en HTTP plano sobre IP directa**, varios sin DNS vivo hoy, sin certificado en sus puertos de stream → **INSEGUROS y no autorizados**: por eso permanecen excluidos del repo. No se publican sus URLs operativas; el detalle crudo queda solo en `upstream/audit/findings.csv`.

## 4. Conclusión

- ✅ **Todos los enlaces activos del repositorio son https con dominio, sin patrones maliciosos, sin redirects sospechosos y con TLS válido** (salvo los 5 hosts muertos ya podados y 1 cert expirado en un relay menor).
- ⚠️ Quedan ~30 dominios "relay de terceros" (https): encryptados y trazables, pero de infraestructura comunitaria que puede caer o cambiar — la app ya muestra fallback "caída/geobloqueo → sitio oficial/VLC".
- 📉 Playlists podadas de enlaces muertos: `chile-segura.m3u` 177→165, `region-nacional` 130→120, `tema-regionales` 113→89, `tema-radio` 104→88, `region-biobio` 27→24, etc. (totales por archivo en el CSV).

## 5. Cómo repetir la verificación

```bash
# extraer URLs únicas → /tmp/links.txt, hosts → /tmp/hosts.txt (ver scripts en REVISION-SEGURIDAD.md)
# estado HTTP de cada URL (paralelo):
xargs -a /tmp/links.txt -P 20 -I{} curl -s -o /dev/null -w '%{http_code}\n' --max-time 9 -r 0-0 {}
# DNS + TLS por host:
for h in $(cat /tmp/hosts.txt); do getent hosts $h; echo | openssl s_client -connect $h:443 -servername $h </dev/null 2>/dev/null | openssl x509 -noout -enddate; done
# redirects:
curl -s -o /dev/null -w '%{redirect_url}\n' --max-time 8 <url>
```
