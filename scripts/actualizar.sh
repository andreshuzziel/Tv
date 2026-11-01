#!/usr/bin/env bash
# ============================================================
# actualizar.sh — Pipeline de actualización automática del repo
# Descarga las fuentes públicas, las SANITIZA (scripts/sanitizar.py),
# regenera las playlists (incluida tv-chile-todo.m3u numerada) y
# hace commit+push SOLO si hubo cambios.
#
# El token de actualización NUNCA va en el repo: viene de la variable
# de entorno UPDATE_TOKEN (en GitHub Actions: secrets) o de gh/git local.
# ============================================================
set -u
cd "$(dirname "$0")/.."
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

echo "== 1/4 descargando fuentes =="
curl -sL --max-time 120 "https://iptv-org.github.io/iptv/countries/cl.m3u"      -o "$TMP/cl.m3u"
curl -sL --max-time 180 "https://iptv-org.github.io/iptv/languages/spa.m3u"    -o "$TMP/spa.m3u"
curl -sL --max-time 180 "https://iptv-org.github.io/iptv/regions/hispam.m3u"   -o "$TMP/hispam.m3u"
curl -sL --max-time 120 "https://m3u.cl/lista/CL.m3u"                          -o "$TMP/m3ucl.m3u"
curl -sL --max-time 120 "https://raw.githubusercontent.com/Alplox/json-teles/refs/heads/main/channels.m3u" -o "$TMP/alplox.m3u"
curl -sL --max-time 120 "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8"             -o "$TMP/freetv.m3u8"
curl -sL --max-time 120 "https://raw.githubusercontent.com/CharlieII/IPTV_mexico/refs/heads/main/lista.m3u" -o "$TMP/charlieii.m3u"
curl -sL --max-time 180 "https://raw.githubusercontent.com/JMigue85/IPTV-SV/refs/heads/main/IPTVSV.m3u"   -o "$TMP/iptvsv.m3u"
curl -sL --max-time 120 "https://raw.githubusercontent.com/JMigue85/IPTV-SV/refs/heads/main/PlutoTV.ES.m3u" -o "$TMP/plutoes.m3u"

echo "== 2/4 sanitizando =="
mkdir -p playlists/fuentes upstream/audit
LATAM_ES="cl,mx,ar,co,pe,uy,py,bo,ec,ve,cr,pa,gt,hn,sv,ni,do,cu,pr,es"
python3 scripts/sanitizar.py "$TMP/cl.m3u"       playlists/chile-segura.m3u        --csv upstream/audit/update-findings.csv
python3 scripts/sanitizar.py "$TMP/m3ucl.m3u"    playlists/fuentes/m3u-cl.m3u      --csv upstream/audit/update-findings-m3ucl.csv
python3 scripts/sanitizar.py "$TMP/alplox.m3u"   playlists/fuentes/alplox.m3u      --csv upstream/audit/update-findings-alplox.csv --region-paises "$LATAM_ES"
python3 scripts/sanitizar.py "$TMP/freetv.m3u8"  playlists/fuentes/freetv.m3u      --csv upstream/audit/update-findings-freetv.csv --region-paises "$LATAM_ES"
python3 scripts/sanitizar.py "$TMP/charlieii.m3u" playlists/fuentes/charlieii-mx-latam.m3u --csv upstream/audit/update-findings-charlieii.csv
python3 scripts/sanitizar.py "$TMP/iptvsv.m3u"   playlists/fuentes/iptv-sv.m3u     --csv upstream/audit/update-findings-iptvsv.csv
python3 scripts/sanitizar.py "$TMP/plutoes.m3u"  playlists/fuentes/pluto-es.m3u    --csv upstream/audit/update-findings-plutoes.csv
python3 scripts/sanitizar.py "$TMP/hispam.m3u"   playlists/fuentes/iptv-org-hispam.m3u --csv upstream/audit/update-findings-hispam.csv
python3 scripts/sanitizar.py "$TMP/spa.m3u"      playlists/tematicas-es-completa.m3u --csv upstream/audit/update-findings-spa.csv

echo "== 3/4 regenerando tv-chile-todo.m3u numerada =="
python3 - "$TMP" <<'PY'
import sys, glob, re, os
# junta todas las playlists sanitizadas, deduplica por URL y numera (tvg-chno)
seen, items = set(), []
files = ['playlists/chile-segura.m3u','playlists/tematicas-es-completa.m3u'] + sorted(glob.glob('playlists/fuentes/*.m3u')) + sorted(glob.glob('playlists/es/*.m3u')) + sorted(glob.glob('playlists/m3u-cl/*.m3u'))
pend = None
for f in files:
    for line in open(f, encoding='utf-8', errors='ignore'):
        s = line.strip()
        if s.startswith('#EXTINF'):
            i = s.rfind(',')
            pend = (s[:i], s[i+1:].strip())
        elif s and not s.startswith('#') and pend:
            if s.lower() not in seen:
                seen.add(s.lower()); items.append((pend[0], pend[1], s))
            pend = None
items.sort(key=lambda x: (x[1].lower()))
with open('playlists/tv-chile-todo.m3u', 'w', encoding='utf-8') as out:
    out.write('#EXTM3U\n')
    for n, (attrs, name, url) in enumerate(items, 1):
        attrs = re.sub(r'\s*tvg-chno="\d+"', '', attrs)
        out.write(f'#EXTINF:-1 {attrs} tvg-chno="{n}",{name}\n{url}\n')
print(f'tv-chile-todo.m3u: {len(items)} canales numerados')
PY

echo "== 4/4 commit/push si hubo cambios =="
git add -A
if git diff --cached --quiet; then
  echo "Sin cambios. Nada que publicar."
else
  git -c user.email=bot@tvchile.local -c user.name=tv-chile-bot commit -qm "chore: actualización automática de playlists ($(date -u +%Y-%m-%d))"
  if [ -n "${UPDATE_TOKEN:-}" ]; then
    git push "https://x-access-token:${UPDATE_TOKEN}@github.com/${GITHUB_REPOSITORY:-$(git remote get-url origin | sed -E 's#.*github.com[:/]([^/]+/[^/]+).*#\1#')}.git" HEAD:main || \
    git push origin HEAD:main
  else
    git push origin HEAD:main 2>/dev/null || echo "(sin remote/token: commit quedó local)"
  fi
  echo "Publicado ✔"
fi
