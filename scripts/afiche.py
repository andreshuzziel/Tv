#!/usr/bin/env python3
"""afiche.py v3 — afiche con TODOS los canales: #número + 🚩 bandera real + EMOTE 🏳️ + nombre.
 - Sección DEPORTES mejorada: celdas grandes en 2 columnas + bloque "alternativas legales" (window.SPORTS).
 - Lee /tmp/poster.json, /tmp/sports.json (desde data/channels.js) y flags/{cc}.svg (flagcdn, ISO 3166-1).
 - SVG: banderas en <defs> reutilizadas con <use> + emoji de bandera junto a la imagen (doble respaldo).
 - PNG: banderas rasterizadas (sin emoji, DejaVu no tiene glyphs de bandera).
Salida: AFICHE-CANALES.svg (único afiche completo, SVG, paneles por temática).  Uso: python3 scripts/afiche.py
"""
import json, os, re, html

rows = json.load(open('/tmp/poster.json'))
sports = json.load(open('/tmp/sports.json'))
TLD_CC = {'cl':'CL','mx':'MX','ar':'AR','es':'ES','us':'US','br':'BR','co':'CO','pe':'PE'}
def cc_of_url(u):
    m = re.search(r'https?://([^/]+)', u or '')
    if not m: return ''
    tld = m.group(1).split('.')[-1].lower()
    return TLD_CC.get(tld, '')
SECTIONS = [
    (1, 32, '📺 Señal abierta nacional', '#d52b1e'), (33, 52, '📰 Noticias de Chile', '#2563eb'),
    (53, 85, '📍 Biobío (tu región)', '#0d9488'), (86, 308, '📍 Regiones de Chile (norte → sur)', '#0891b2'),
    (309, 317, '⚽ Deportes (legales) — sección ampliada', '#16a34a'), (318, 322, '🧸 Infantil · animación · anime', '#f59e0b'),
    (323, 415, '🎵 Música y radios', '#9333ea'), (416, 433, '⛪ Religiosos', '#a16207'),
    (434, 446, '🎓 Cultura · educación · documentales', '#0891b2'), (447, 683, '📡 Resto de Chile', '#64748b'),
    (684, 3110, '🌎 Español — otros países', '#4f46e5'), (3111, 99999, '✨ Nuevos FAST gratis (nov-2026)', '#a16207'),
    (None, None, '🌐 Servicios OTT gratis (enlaces, sin stream)', '#4f46e5'), (None, None, '🌐 Solo sitio web (sin stream)', '#334155'),
]
THEME_SECS = json.load(open('/tmp/themes.json'))
SECMAP = {t['tord']: (None, None, t['label'], t['color']) for t in THEME_SECS}
DEPORTES = SECMAP[[t['tord'] for t in THEME_SECS if t.get('big')][0]]
def seccion(r):
    if r.get('alt'): return DEPORTES
    if r.get('tord') is not None: return SECMAP[r['tord']]
    if r.get('group') == 'OTT': return SECTIONS[-2]
    if not r['url'] or not r['chno']: return SECTIONS[-1]
    for s in SECTIONS[:-1]:
        if s[0] <= r['chno'] <= s[1]: return s
    return SECTIONS[-2]
# filas extra: alternativas legales de deportes (window.SPORTS)
ALT = [{'chno': None, 'cc': cc_of_url(s.get('url','')), 'name': s['name'] + ' — ' + s.get('type',''),
        'group': 'Alternativa legal', 'url': True, 'alt': True,
        'tip': f"✔ {s['name']} · {s.get('type','')} — {s.get('desc','')} · {s.get('url','')}"}
       for s in sports]

ALIAS = {'uk': 'gb'}
def ckey(cc): return ALIAS.get((cc or '').lower(), (cc or '').lower())
FLAGS = {}
for fn in os.listdir('flags'):
    cc = fn[:-4]; src = open(f'flags/{fn}', encoding='utf-8').read()
    m = re.search(r'<svg[^>]*?viewBox="([^"]+)"', src)
    if m: vb = m.group(1)
    else:
        w = re.search(r'width="(\d+)"', src); h = re.search(r'height="(\d+)"', src)
        vb = f'0 0 {w.group(1) if w else 900} {h.group(1) if h else 600}'
    inner = re.sub(r'^<svg[^>]*>|</svg>\s*$', '', src, flags=re.S)
    inner = re.sub(r'id="([^"]+)"', lambda mm: f'id="{cc}-{mm.group(1)}"', inner)
    inner = re.sub(r'url\(#([^)]+)\)', lambda mm: f'url(#{cc}-{mm.group(1)})', inner)
    inner = re.sub(r'xlink:href="#([^"]+)"', lambda mm: f'xlink:href="#{cc}-{mm.group(1)}"', inner)
    FLAGS[cc] = (vb, inner)
def flag_emoji(cc):
    return ''.join(chr(0x1F1E6 + ord(c) - 65) for c in cc) if re.fullmatch(r'[A-Z]{2}', cc or '') else '🏟️'

W, M, GAP = 1460, 20, 8
CH, PITCH = 22, 24
CH_BIG, PITCH_BIG, COLS_BIG = 30, 32, 2
def esc(t): return html.escape(str(t), quote=True)

def blocks_of(items):
    out, i = [], 0
    while i < len(items):
        s = seccion(items[i]); grp = [r for r in items[i:] if seccion(r) is s]
        if s is DEPORTES and not any(r.get('alt') for r in grp): grp = grp + ALT  # deportes: + alternativas legales (sin duplicar)
        out.append((s, grp)); i += len([r for r in items[i:] if seccion(r) is s])
    return out
def trunc(t, n): return t if len(t) <= n else t[: n - 1] + '…'

DEFS = ['<defs>']
for cc, (vb, inner) in FLAGS.items():
    DEFS.append(f'<g id="flag-{cc}"><svg x="0" y="0" width="18" height="12" viewBox="{vb}" preserveAspectRatio="none">{inner}</svg></g>')
DEFS.append('</defs>')
DEFS = '\n'.join(DEFS)

def svg_doc(title, subtitle, items, fname):
    blocks = blocks_of(items)
    head_h, sec_h = 168, 30
    try:
        REGIONS_META = json.load(open('/tmp/regions.json'))
    except Exception:
        REGIONS_META = []
    reg_order = ['Biobío'] + [r['k'] for r in REGIONS_META if r['k'] != 'Biobío']
    def is_regiones(s): return s[2].startswith('📍')
    def segments(s, grp):
        if not is_regiones(s): return [('all', grp)]
        by = {}
        for r in grp: by.setdefault(r.get('reg') or r.get('group') or '—', []).append(r)
        keys = [k for k in reg_order if k in by] + sorted(k for k in by if k not in reg_order)
        return [(k, by[k]) for k in keys]
    def layout(s, grp):
        big = (s is DEPORTES); cols = COLS_BIG if big else 4
        ch, pitch = (CH_BIG, PITCH_BIG) if big else (CH, PITCH)
        segs = segments(s, grp)
        content = sum(((24 if (is_regiones(s) and k != 'all') else 0) + ((len(sg) + cols - 1) // cols) * pitch + 4) for k, sg in segs)
        bh = sec_h + 4 + (24 if big else 0) + content + 6
        return big, cols, ch, pitch, segs, bh, 16 + bh + 16
    H = int(head_h + sum(layout(s, grp)[6] for s, grp in blocks) + M)
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="Segoe UI, Arial, Helvetica, sans-serif">',
         DEFS,
         f'<rect width="{W}" height="{H}" fill="#0b1220"/>',
         f'<rect x="0" y="0" width="{W}" height="{head_h}" fill="#111a2e"/>',
         f'<rect x="0" y="{head_h-4}" width="{W}" height="4" fill="#16a34a"/>',
         f'<text x="{M}" y="46" font-size="34" font-weight="700" fill="#f8fafc">{esc(title)}</text>',
         f'<text x="{M}" y="76" font-size="15" fill="#94a3b8">{esc(subtitle)}</text>',
         f'<text x="{M}" y="102" font-size="13" fill="#64748b">Cada celda:  #número  🚩 bandera real + emote 🏳️ del país de origen (flagcdn, ISO 3166-1)  Nombre   ·   tooltip: país + temática</text>',
         f'<text x="{M}" y="126" font-size="13" fill="#64748b">Orden: POR TEMÁTICA (igual que la app) y dentro de cada tema # cronológico ascendente · CADA TEMA EN SU PROPIO PANEL · el panel 📍 Regiones va subdividido POR REGIÓN (Biobío primero, luego norte→sur) · deportes con ✔ legales</text>',
         f'<text x="{M}" y="148" font-size="13" fill="#64748b">Generado 01-nov-2026 · v3.103 · ordenado por temática + # ascendente · sanitizado (https, sin TV de pago/piratería)</text>']
    y = head_h
    for s, grp in blocks:
        label, color = s[2], s[3]
        big, cols, ch, pitch, segs, bh, _tot = layout(s, grp)
        colw = (W - 2 * M - (cols - 1) * GAP) / cols
        maxch = int((colw - 92) / 6.55)
        o.append(f'<rect x="{M-9}" y="{y-9}" width="{W-2*M+18}" height="{bh+12}" rx="12" fill="#0d1526" stroke="{color}" stroke-opacity="0.45" stroke-width="1.5"/>')
        if s[0] is not None:
            rng = f'{s[0]}–{s[1]}'
        else:
            nums = [r['chno'] for r in grp if r.get('chno')]
            rng = f'#{min(nums)}–#{max(nums)}' if nums else 'web'
        o.append(f'<rect x="{M}" y="{y}" width="{W-2*M}" height="{sec_h-4}" rx="6" fill="{color}"/>')
        o.append(f'<text x="{M+10}" y="{y+sec_h-12}" font-size="15" font-weight="600" fill="#fff">{esc(label)}</text>')
        o.append(f'<text x="{W-M-10}" y="{y+sec_h-12}" font-size="13" fill="#e2e8f0" text-anchor="end">canales {rng} · {len(grp)}</text>')
        y += sec_h + 4
        if big:
            o.append(f'<rect x="{M}" y="{y}" width="{W-2*M}" height="20" rx="4" fill="#14532d"/>')
            o.append(f'<text x="{M+10}" y="{y+14}" font-size="12" fill="#86efac">⚽ Canales de deportes en vivo (legales, sanitizados) — abajo, alternativas oficiales ✔ (sin piratería de TV de pago)</text>')
            y += 24
        for k, sg in segs:
            if is_regiones(s) and k != 'all':
                nums = [r['chno'] for r in sg if r.get('chno')]
                srng = f' · #{min(nums)}–#{max(nums)}' if nums else ''
                cap = next((r['cap'] for r in REGIONS_META if r['k'] == k), '')
                o.append(f'<rect x="{M}" y="{y}" width="{W-2*M}" height="20" rx="4" fill="{color}" fill-opacity="0.22" stroke="{color}" stroke-opacity="0.6"/>')
                o.append(f'<text x="{M+10}" y="{y+14}" font-size="12" font-weight="600" fill="#e2e8f0">📍 {esc(k)}{f" ({esc(cap)})" if cap else ""} · {len(sg)} canales{srng}</text>')
                y += 24
            for idx, r in enumerate(sg):
                cx = M + (idx % cols) * (colw + GAP); cy = y + (idx // cols) * pitch
                alt = r.get('alt')
                fill = '#14532d' if alt else ('#121b30' if (idx // cols) % 2 == 0 else '#0f172a')
                o.append(f'<rect x="{cx}" y="{cy}" width="{colw}" height="{ch}" rx="5" fill="{fill}"/>')
                num = f'#{r["chno"]}' if r['chno'] else ('✔' if alt else 'web')
                cc = r['cc']; ck = ckey(cc); fl = flag_emoji(cc) if not alt else ('🏟️' if not cc else flag_emoji(cc))
                tip = r.get('tip') or f'{num} · {fl} {cc} — {r["name"]} ({r["group"]})'
                o.append(f'<title>{esc(tip)}</title>')
                ncol = '#4ade80' if alt else color
                o.append(f'<text x="{cx+7}" y="{cy+ (20 if big else 16)}" font-size="{13 if big else 12.5}" font-weight="700" fill="{ncol}" font-family="Consolas, Menlo, monospace">{esc(num)}</text>')
                if ck in FLAGS:
                    o.append(f'<use href="#flag-{ck}" xlink:href="#flag-{ck}" x="{cx+ (44 if not alt else 30)}" y="{cy + (9 if big else 5)}"/>')
                    fx = cx + (44 if not alt else 30) + 20
                else:
                    fx = cx + (44 if not alt else 30)
                o.append(f'<text x="{fx}" y="{cy + (20 if big else 16)}" font-size="{10.5 if big else 10}" opacity="0.95">{fl}</text>')
                o.append(f'<text x="{fx+14}" y="{cy + (20 if big else 16)}" font-size="{13 if big else 12}" fill="#e2e8f0">{esc(trunc(r["name"], maxch))}</text>')
            y += ((len(sg) + cols - 1) // cols) * pitch + 4
        y += 6 + 16
    o.append('</svg>')
    open(fname, 'w', encoding='utf-8').write('\n'.join(o))
    return W, H

def prune_flags(path):
    """Quita del <defs> las banderas que el archivo no referencia (achica cada lámina)."""
    s = open(path, encoding='utf-8').read()
    used = set(re.findall(r'href="#flag-([a-z]{2})"', s))
    out = [ln for ln in s.split('\n')
           if not (re.match(r'<g id="flag-([a-z]{2})">', ln) and re.match(r'<g id="flag-([a-z]{2})">', ln).group(1) not in used)]
    open(path, 'w', encoding='utf-8').write('\n'.join(out))

n = len(rows)
w, h = svg_doc('📺 TV CHILE — AFICHE DE TODOS LOS CANALES', f'{n} canales numerados · Chile primero (Biobío destacado) · español Latam/ES · 01-nov-2026 · v3.103', rows, 'AFICHE-CANALES.svg')
prune_flags('AFICHE-CANALES.svg')
print(f'AFICHE-CANALES.svg: {w}x{h}, {n} canales, {os.path.getsize("AFICHE-CANALES.svg")/1024:.0f} KB')


