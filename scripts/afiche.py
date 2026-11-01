#!/usr/bin/env python3
"""afiche.py v3 — afiche con TODOS los canales: #número + 🚩 bandera real + EMOTE 🏳️ + nombre.
 - Sección DEPORTES mejorada: celdas grandes en 2 columnas + bloque "alternativas legales" (window.SPORTS).
 - Lee /tmp/poster.json, /tmp/sports.json (desde data/channels.js) y flags/{cc}.svg (flagcdn, ISO 3166-1).
 - SVG: banderas en <defs> reutilizadas con <use> + emoji de bandera junto a la imagen (doble respaldo).
 - PNG: banderas rasterizadas (sin emoji, DejaVu no tiene glyphs de bandera).
Salida: AFICHE-CANALES.svg/.png + afiches/afiche-XX-*.svg.  Uso: python3 scripts/afiche.py
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
    h = head_h
    for s, grp in blocks:
        big = (s is DEPORTES); cols = COLS_BIG if big else 4
        colw = (W - 2 * M - (cols - 1) * GAP) / cols
        ch, pitch = (CH_BIG, PITCH_BIG) if big else (CH, PITCH)
        nsub = 1 + (1 if big else 0)  # deportes: fila extra "alternativas legales"
        h += sec_h + 4 + ((len(grp) + cols - 1) // cols) * pitch + 6
    h += M; H = int(h)
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="Segoe UI, Arial, Helvetica, sans-serif">',
         DEFS,
         f'<rect width="{W}" height="{H}" fill="#0b1220"/>',
         f'<rect x="0" y="0" width="{W}" height="{head_h}" fill="#111a2e"/>',
         f'<rect x="0" y="{head_h-4}" width="{W}" height="4" fill="#16a34a"/>',
         f'<text x="{M}" y="46" font-size="34" font-weight="700" fill="#f8fafc">{esc(title)}</text>',
         f'<text x="{M}" y="76" font-size="15" fill="#94a3b8">{esc(subtitle)}</text>',
         f'<text x="{M}" y="102" font-size="13" fill="#64748b">Cada celda:  #número  🚩 bandera real + emote 🏳️ del país de origen (flagcdn, ISO 3166-1)  Nombre   ·   tooltip: país + temática</text>',
         f'<text x="{M}" y="126" font-size="13" fill="#64748b">Orden: POR TEMÁTICA (igual que la app: nacional, noticias, regiones, deportes, …) y dentro de cada tema # cronológico ascendente · deportes con alternativas legales ✔ · OTT gratis cerca del final</text>',
         f'<text x="{M}" y="148" font-size="13" fill="#64748b">Generado 01-nov-2026 · v3.102 · ordenado por temática + # ascendente · sanitizado (https, sin TV de pago/piratería)</text>']
    y = head_h
    for s, grp in blocks:
        label, color = s[2], s[3]
        big = (s is DEPORTES); cols = COLS_BIG if big else 4
        colw = (W - 2 * M - (cols - 1) * GAP) / cols
        ch, pitch = (CH_BIG, PITCH_BIG) if big else (CH, PITCH)
        maxch = int((colw - 92) / 6.55)
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
        for idx, r in enumerate(grp):
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
            o.append(f'<text x="{fx}" y="{cy + (20 if big else 16)}" font-size="{10.5 if big else 10}" opacity="0.95">{fl}</text>')  # EMOTE de bandera
            o.append(f'<text x="{fx+14}" y="{cy + (20 if big else 16)}" font-size="{13 if big else 12}" fill="#e2e8f0">{esc(trunc(r["name"], maxch))}</text>')
        y += ((len(grp) + cols - 1) // cols) * pitch + 6
    o.append('</svg>')
    open(fname, 'w', encoding='utf-8').write('\n'.join(o))
    return W, H

n = len(rows)
w, h = svg_doc('📺 TV CHILE — AFICHE DE TODOS LOS CANALES', f'{n} canales numerados · Chile primero (Biobío destacado) · español Latam/ES · 01-nov-2026 · v3.112', rows, 'AFICHE-CANALES.svg')
print(f'AFICHE-CANALES.svg: {w}x{h}, {n} canales, {os.path.getsize("AFICHE-CANALES.svg")/1024:.0f} KB')

os.makedirs('afiches', exist_ok=True)
for f in os.listdir('afiches'): os.remove(f'afiches/{f}')
k = 0
for s, grp in blocks_of(rows):
    k += 1
    slug = re.sub(r'[^a-z0-9]+', '-', s[2].lower())[:24].strip('-')
    rng = f'{s[0]}–{s[1]}' if s[0] else 'solo web'
    svg_doc(f'{s[2]} — canales {rng}', f'{len(grp)} filas · TV Chile v3.112 · 01-nov-2026', grp, f'afiches/afiche-{k:02d}-{slug}.svg')
print('afiches por sección:', k)

try:
    from PIL import Image, ImageDraw, ImageFont
    f_num = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 13)
    f_big = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 15)
    f_txt = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
    f_txtb = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)
    f_head = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
    f_sub = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
    flagimg = {}
    for cc in FLAGS:
        p = f'flags_png/{ckey(cc)}.png'
        if os.path.exists(p): flagimg[cc] = Image.open(p).resize((18, 12))
    img = Image.new('RGB', (w, h), '#0b1220'); d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, 160], fill='#111a2e'); d.rectangle([0, 156, w, 160], fill='#16a34a')
    d.text((M, 18), 'TV CHILE — AFICHE DE TODOS LOS CANALES', font=f_head, fill='#f8fafc')
    d.text((M, 62), f'{n} canales numerados · Chile primero · v3.112 · 01-nov-2026 · celda: #núm [BANDERA] Nombre · deportes con alternativas legales ✔', font=f_sub, fill='#94a3b8')
    y = 168
    for s, grp in blocks_of(rows):
        color = s[3]; rgb = tuple(int(color[j:j+2], 16) for j in (1, 3, 5))
        big = (s is DEPORTES); cols = COLS_BIG if big else 4
        colw = (W - 2 * M - (cols - 1) * GAP) / cols
        ch, pitch = (CH_BIG, PITCH_BIG) if big else (CH, PITCH)
        maxch = int((colw - 80) / 6.9)
        d.rectangle([M, y, w - M, y + 26], fill=rgb)
        rng = f'{s[0]}–{s[1]}' if s[0] else '—'
        d.text((M + 10, y + 4), s[2] + f'  ·  canales {rng}  ·  {len(grp)} filas', font=f_sub, fill='#ffffff')
        y += 34
        if big:
            d.rectangle([M, y, w - M, y + 20], fill=(20, 83, 45))
            d.text((M + 10, y + 3), '⚽ Canales deportivos en vivo (legales) — abajo: alternativas oficiales ✔ sin piratería', font=f_sub, fill=(134, 239, 172))
            y += 24
        for idx, r in enumerate(grp):
            cx = M + (idx % cols) * (int(colw) + GAP); cy = y + (idx // cols) * pitch
            alt = r.get('alt')
            fill = (20, 83, 45) if alt else ((18, 27, 48) if (idx // cols) % 2 == 0 else (15, 23, 42))
            d.rectangle([cx, cy, cx + colw, cy + ch], fill=fill)
            num = f'#{r["chno"]}' if r['chno'] else ('✔' if alt else 'web')
            d.text((cx + 7, cy + (8 if big else 4)), num, font=f_big if big else f_num, fill=(74, 222, 128) if alt else rgb)
            ck = ckey(r['cc'])
            fx = int(cx + (44 if not alt else 32))
            if ck in flagimg: img.paste(flagimg[ck], (fx, int(cy + (9 if big else 5))))
            d.text((fx + 22, cy + (8 if big else 4)), trunc(r['name'], maxch), font=f_txtb if big else f_txt, fill='#e2e8f0')
        y += ((len(grp) + cols - 1) // cols) * pitch + 6
    img.save('AFICHE-CANALES.png', optimize=True)
    print(f'AFICHE-CANALES.png: {w}x{h}, {os.path.getsize("AFICHE-CANALES.png")/1048576:.1f} MB')
except Exception as e:
    print('PNG omitido:', repr(e))
