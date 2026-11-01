#!/usr/bin/env python3
"""
sanitizar.py — Sanitizador de playlists M3U (política anti-hackeo del repo).
Uso:
  python3 scripts/sanitizar.py ENTRADA.m3u SALIDA.m3u [--csv REPORTE.csv] [--lang spa] [--region-paises cl,mx,es,...]
Reglas (igual que las auditorías de REVISION-SEGURIDAD.md):
  - solo https:// con nombre de dominio (no IP directa)
  - fuera: .php/.exe/.apk, acortadores, wp-admin, credenciales en URL
  - fuera: TV de pago / adulto (lista de nombres) y VOD (grupos movies/series/xxx/shop)
  - opcional: filtrar por idioma/país (tvg-country / tvg-id .cc@)
"""
import re, sys, csv, unicodedata

SAFE = re.compile(r'^https://[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}(:\d+)?/')
IP = re.compile(r'^https?://\d+\.\d+\.\d+\.\d+')
SUSP = re.compile(r'\.(exe|apk|zip|rar|msi|php|htm?)(\?| |$)|bit\.ly|tinyurl|goo\.gl|cutt\.ly|wp-admin|admin-ajax|passw|login|signin', re.I)
PAYTV = re.compile(r'(ESPN|TNT\s*Sports|DSports|Sky\s*Sports|Fox\s*Sports|TyC|beIN|Cinecanal|Cartoon|Disney|Discovery|\bE!\b|TLC|MTV|CNN|Fox\s*News|AXN|Universal|Warner|Paramount|Golden|\bAMC\b|Syfy|History|NatGeo|National\s*Geographic|CDF|Claro\s*Sports|Gol\s*TV|Win\s*Sports|DAZN|HBO|Cinemax|Starz|Movistar\s*Deportes|Playboy|porn|xxx|adult)', re.I)
BADG = re.compile(r'movies|series|xxx|shop|adult|vod|pel[ií]culas|cine y pel', re.I)

def norm(s):
    return unicodedata.normalize('NFD', s or '').encode('ascii', 'ignore').decode().lower()

def main():
    inp, out = sys.argv[1], sys.argv[2]
    csvpath = sys.argv[sys.argv.index('--csv') + 1] if '--csv' in sys.argv else None
    paises = set()
    if '--region-paises' in sys.argv:
        paises = set(sys.argv[sys.argv.index('--region-paises') + 1].split(','))
    pend, kept, dropped = None, [], []
    for line in open(inp, encoding='utf-8', errors='ignore'):
        s = line.strip()
        if s.startswith('#EXTINF'):
            i = s.rfind(',')
            a = s[:i]
            pend = {'attrs': a, 'name': s[i + 1:].strip(),
                    'cc': ((re.search(r'tvg-country="([^"]*)"', a) or [None, ''])[1] or
                           (re.search(r'tvg-id="[^"]*\.([a-z]{2})@', a, re.I) or [None, ''])[1] or '').lower(),
                    'group': (re.search(r'group-title="([^"]*)"', a) or [None, ''])[1]}
        elif s and not s.startswith('#') and pend:
            e = pend; pend = None
            fl = []
            if not SAFE.match(s): fl.append('no-https')
            if IP.match(s): fl.append('ip-directa')
            if SUSP.search(s): fl.append('url-sospechosa')
            if PAYTV.search(e['name']): fl.append('tv-pago/adulto')
            if BADG.search(e['group']): fl.append('vod-no-autorizado')
            if paises and e['cc'] not in paises: fl.append('fuera-de-region')
            if fl:
                dropped.append((e['name'], e['group'], s, ';'.join(fl))); continue
            kept.append((e['attrs'], e['name'], s))
    with open(out, 'w', encoding='utf-8') as f:
        f.write('#EXTM3U\n')
        for attrs, name, url in kept:
            f.write(f'#EXTINF:-1 {attrs},{name}\n{url}\n')
    if csvpath:
        with open(csvpath, 'w', newline='', encoding='utf-8') as f:
            w = csv.writer(f); w.writerow(['canal', 'grupo', 'url', 'flags'])
            w.writerows(dropped)
    print(f'{inp} -> {out}: {len(kept)} conservados, {len(dropped)} descartados')

if __name__ == '__main__':
    main()
