#!/usr/bin/env bash
# ============================================================
# audit-repo.sh — Revisión de seguridad ("anti-hackeo") rápida
# de un repositorio GitHub externo, SIN ejecutarlo.
#
# Uso:   ./audit-repo.sh org/repo [rama]
# Ej.:   ./audit-repo.sh iptv-org/iptv master
#
# Solo usa la API pública de GitHub + raw.githubusercontent.com.
# NUNCA descarga ni ejecuta código del repo auditado.
# Requiere: curl, python3
# ============================================================
set -u
REPO="${1:?Uso: ./audit-repo.sh org/repo [rama]}"
BRANCH="${2:-master}"
API="https://api.github.com/repos/${REPO}"
RAW="https://raw.githubusercontent.com/${REPO}/${BRANCH}"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
step(){ printf '\n== %s ==\n' "$1"; }

step "1/6 Metadatos del repo (API pública de GitHub)"
curl -sL --max-time 30 "$API" -o "$TMP/meta.json"
python3 - "$TMP/meta.json" <<'PY'
import json,sys
d=json.load(open(sys.argv[1]))
if "full_name" not in d:
    print("  !! Error API:", d.get("message")); raise SystemExit(1)
for k in ("full_name","description","created_at","pushed_at","stargazers_count",
          "forks_count","open_issues_count","license","default_branch",
          "archived","disabled","homepage"):
    print(f"  {k}: {d.get(k)}")
PY

step "2/6 Inventario de archivos: binarios y estructura"
curl -sL --max-time 60 "${API}/git/trees/${BRANCH}?recursive=1" -o "$TMP/tree.json"
python3 - "$TMP/tree.json" "$TMP" <<'PY'
import json,sys,collections
d=json.load(open(sys.argv[1])); tmp=sys.argv[2]
paths=[t["path"] for t in d.get("tree",[])]
print(f"  entradas: {len(paths)}   arbol truncado: {d.get('truncated')}")
bad=(".exe",".apk",".dll",".so",".bat",".cmd",".ps1",".scr",".msi",".deb",".rar",".7z",".zip")
hits=[p for p in paths if p.lower().endswith(bad)]
print(f"  archivos binarios/ejecutables: {len(hits)}")
for p in hits[:20]: print("   !!", p)
ext=collections.Counter(p.rsplit(".",1)[1].lower() if "." in p.split("/")[-1] else "(sin ext)" for p in paths)
print("  extensiones (top10):", ext.most_common(10))
wf=[p for p in paths if p.startswith(".github/workflows/") and p.endswith((".yml",".yaml"))]
print(f"  workflows encontrados: {len(wf)}")
open(tmp+"/wf.txt","w").write("\n".join(wf))
code=[t["path"] for t in d["tree"] if t["path"].endswith((".ts",".js",".mjs",".cjs",".py",".sh")) and not t["path"].startswith("tests/")]
open(tmp+"/code.txt","w").write("\n".join(code[:60]))
print(f"  archivos de codigo (muestra a inspeccionar): {min(len(code),60)} de {len(code)}")
PY

step "3/6 Workflows de GitHub Actions: patrones peligrosos y actions sin fijar"
while IFS= read -r w; do
  [ -z "$w" ] && continue
  curl -sL --max-time 30 "$RAW/$w" -o "$TMP/w.yml"
  echo "  -- $w"
  if grep -nE 'curl[^|]*\|[[:space:]]*(sudo[[:space:]]+)?(ba|z)?sh|wget[^|]*\|[[:space:]]*(sudo[[:space:]]+)?(ba|z)?sh|base64[[:space:]]+(-d|--decode)|\beval[[:space:]]|child_process|ghp_[A-Za-z0-9]{20,}|curl[^"]*-[oO][[:space:]]*/tmp' "$TMP/w.yml"; then
    echo "     !!! PATRON SOSPECHOSO ENCONTRADO — revisar a mano"
  else
    echo "     sin patrones criticos (curl|sh, base64, tokens, /tmp)"
  fi
  unpinned=$(grep -E '^\s*-?\s*uses:' "$TMP/w.yml" | grep -vE '@[0-9a-f]{40}' || true)
  if [ -n "$unpinned" ]; then echo "     ! action SIN fijar por SHA:"; echo "$unpinned" | sed 's/^/       /'; else echo "     actions fijadas por SHA ✔"; fi
  grep -nE '^permissions:' -A3 "$TMP/w.yml" | sed 's/^/     perm: /'
done < "$TMP/wf.txt"

step "4/6 package.json: hooks de instalacion y dependencias"
curl -sL --max-time 30 "$RAW/package.json" -o "$TMP/pkg.json"
python3 - "$TMP/pkg.json" <<'PY'
import json,sys
try: p=json.load(open(sys.argv[1]))
except Exception: print("  (el repo no tiene package.json)"); raise SystemExit
for s in ("preinstall","postinstall","install","prepare"):
    if s in p.get("scripts",{}): print(f"  !! hook '{s}' se ejecuta solo al instalar: {p['scripts'][s]}")
deps=p.get("dependencies",{})
print(f"  dependencias: {len(deps)}")
print(f"  overrides de seguridad: {p.get('overrides',{})}")
known={"axios","chalk","commander","vitest","tsx","eslint","typescript","lodash","glob","octokit"}
odd=[k for k in deps if not any(k.startswith(n) or n in k for n in known)]
print(f"  dependencias poco conocidas (revisar typosquatting): {odd[:15]}")
PY

step "5/6 Codigo fuente (muestra): eval/exec/ofuscacion"
n=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  curl -sL --max-time 20 "$RAW/$f" | grep -nE 'child_process|execSync|spawnSync|\bexec\(|\beval\(|new Function|atob\(|fromCharCode|require\(.https?|[A-Za-z0-9+/]{4}={0,2}"[ ]*\)|[A-Za-z0-9+/]{200,}' | sed "s|^|  $f:|" && n=1
done < "$TMP/code.txt"
[ "$n" = "0" ] && echo "  0 hallazgos en la muestra (eval/exec/child_process/base64 largo) ✔"

step "6/6 Playlists/datos: URLs de stream sospechosas"
curl -sL --max-time 120 "https://${REPO%%/*}.github.io/${REPO##*/}/index.m3u" -o "$TMP/index.m3u" 2>/dev/null
[ -s "$TMP/index.m3u" ] || curl -sL --max-time 60 "$RAW/streams/index.m3u" -o "$TMP/index.m3u" 2>/dev/null
python3 - "$TMP/index.m3u" <<'PY'
import sys,re,collections
try:
    lines=open(sys.argv[1],encoding="utf-8",errors="ignore").read().splitlines()
except Exception:
    print("  (no se pudo descargar una playlist publica)"); raise SystemExit
urls=[l.strip() for l in lines if l.strip() and not l.startswith("#")]
print(f"  URLs de stream: {len(urls)}")
sch=collections.Counter((re.match(r"([a-zA-Z]+)://",u) or ["?"])[0].lower() for u in urls)
print("  esquemas:", dict(sch))
ips=collections.Counter(m.group(1) for u in urls for m in [re.match(r"https?://(\d+\.\d+\.\d+\.\d+)",u)] if m)
print(f"  IPs directas (sin nombre de dominio): {len(ips)} distintas; top5: {ips.most_common(5)}")
http_plano=sum(1 for u in urls if u.startswith("http://"))
print(f"  streams en HTTP plano (sin cifrar): {http_plano}")
susp=[u for u in urls if re.search(r"\.(exe|apk|zip|rar|msi|php|htm?|js)(\?| |$)|bit\.ly|tinyurl|goo\.gl|cutt\.ly|passw|login|signin",u,re.I)]
print(f"  URLs sospechosas (ejecutables/.php/acortadores/creds): {len(susp)}")
for u in susp[:10]: print("   !", u[:160])
PY

printf '\n== FIN ==\nRevisión completada. Ningún archivo del repo auditado fue descargado a disco ni ejecutado.\n'
