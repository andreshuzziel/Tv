#!/usr/bin/env python3
"""
aplicar_renames.py — aplica renombres personalizados (data/renames.js) sobre una playlist .m3u
Uso: python3 scripts/aplicar_renames.py playlists/tv-chile-todo.m3u data/renames.js
Cambia el nombre tras la coma del #EXTINF cuando el tvg-id está en RENAMES.
Los números (tvg-chno) y tvg-id NO se tocan: el canal conserva su número.
"""
import re, sys, json

m3u_path, renames_path = sys.argv[1], sys.argv[2]
src = open(renames_path, encoding='utf-8').read()
m = re.search(r'window\.RENAMES\s*=\s*(\{.*\})\s*;', src, re.S)
renames = json.loads(m.group(1)) if m else {}

out = []
changed = 0
for line in open(m3u_path, encoding='utf-8'):
    s = line.rstrip('\n')
    if s.startswith('#EXTINF'):
        tid = re.search(r'tvg-id="([^"]*)"', s)
        if tid and tid.group(1) in renames:
            i = s.rfind(',')
            s = s[:i + 1] + renames[tid.group(1)]
            changed += 1
    out.append(s)
open(m3u_path, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print(f'{m3u_path}: {changed} canales renombrados según {renames_path}')
