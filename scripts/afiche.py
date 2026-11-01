#!/usr/bin/env python3
"""afiche.py — afiche con TODOS los canales: #número + BANDERA REAL (incrustada una vez por país en <defs>,
reutilizada con <use>) + nombre. Lee /tmp/poster.json y flags/{cc}.svg (flagcdn, ISO 3166-1).
Salida: AFICHE-CANALES.svg/.png (completos) + afiches/afiche-XX-*.svg (por bloque). Uso: python3 scripts/afiche.py
"""
import json, os, re, html

rows = json.load(open('/tmp/poster.json'))
SECTIONS = [
    (1, 32, '📺 Señal abierta nacional', '#d52b1e'), (33, 52, '📰 Noticias de Chile', '#2563eb'),
    (53, 85, '📍 Biobío (tu región)', '#0d9488'), (86, 308, '📍 Regiones de Chile (norte → sur)', '#0891b2'),
    (309, 317, '⚽ Deportes (legales)', '#16a34a'), (318, 322, '🧸 Infantil · animación · anime', '#f59e0b'),
    (323, 415, '🎵 Música y radios', '#9333ea'), (416, 433, '⛪ Religiosos', '#a16207'),
    (434, 446, '🎓 Cultura · educación · documentales', '#0891b2'), (447, 683, '📡 Resto de Chile', '#64748b'),
    (684, 3110, '🌎 Español — otros países', '#4f46e5'), (None, None, '🌐 Solo sitio web (sin stream)', '#334155'),
]
def seccion(r):
    if not r['url']: return SECTIONS[-1]
    for s in SECTIONS[:-1]:
        if s[0] <= r['chno'] <= s[1]: return s
    return SECTIONS[-2]

ALIAS = {'uk': 'gb'}  # flagcdn usa gb para Reino Unido
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
    return ''.join(chr(0x1F1E6 + ord(c) - 65) for c in cc) if re.fullmatch(r'[A-Z]{2}', cc or '') else ''

W, M, COLS, CH, PITCH, GAP = 1460, 20, 4, 22, 24, 8
COLW = (W - 2 * M - (COLS - 1) * GAP) / COLS
MAXCH = int((COLW - 82) / 6.55)
def esc(t): return html.escape(str(t), quote=True)
def trunc(t, n=MAXCH): return t if len(t) <= n else t[: n - 1] + '…'
def blocks_of(items):
    out, i = [], 0
    while i < len(items):
        s = seccion(items[i]); grp = [r for r in items[i:] if seccion(r) is s]
        out.append((s, grp)); i += len(grp)
    return out

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
        h += sec_h + 4 + ((len(grp) + COLS - 1) // COLS) * PITCH + 6
    h += M; H = int(h)
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="Segoe UI, Arial, Helvetica, sans-serif">',
         DEFS,
         f'<rect width="{W}" height="{H}" fill="#0b1220"/>',
         f'<rect x="0" y="0" width="{W}" height="{head_h}" fill="#111a2e"/>',
         f'<rect x="0" y="{head_h-4}" width="{W}" height="4" fill="#d52b1e"/>',
         f'<text x="{M}" y="46" font-size="34" font-weight="700" fill="#f8fafc">{esc(title)}</text>',
         f'<text x="{M}" y="76" font-size="15" fill="#94a3b8">{esc(subtitle)}</text>',
         f'<text x="{M}" y="102" font-size="13" fill="#64748b">Cada celda:  #número   🚩 bandera real del país de origen (flagcdn, ISO 3166-1)   Nombre del canal   ·   tooltip: país + temática</text>',
         f'<text x="{M}" y="126" font-size="13" fill="#64748b">Rangos: 1–32 señal abierta CL · 33–52 noticias · 53–85 Biobío · 86–308 regiones · 309–317 deportes · 318–322 infantil/anime · 323–415 música · 416–433 religiosos · 434–446 cultura · 447–683 resto CL · 684–3110 español otros países</text>',
         f'<text x="{M}" y="148" font-size="13" fill="#64748b">Generado 01-nov-2026 · v3.112 · sanitizado (https, sin TV de pago)</text>']
    y = head_h
    for s, grp in blocks:
        label, color = s[2], s[3]
        rng = f'{s[0]}–{s[1]}' if s[0] else '—'
        o.append(f'<rect x="{M}" y="{y}" width="{W-2*M}" height="{sec_h-4}" rx="6" fill="{color}"/>')
        o.append(f'<text x="{M+10}" y="{y+sec_h-12}" font-size="15" font-weight="600" fill="#fff">{esc(label)}</text>')
        o.append(f'<text x="{W-M-10}" y="{y+sec_h-12}" font-size="13" fill="#e2e8f0" text-anchor="end">canales {rng} · {len(grp)}</text>')
        y += sec_h + 4
        for idx, r in enumerate(grp):
            cx = M + (idx % COLS) * (COLW + GAP); cy = y + (idx // COLS) * PITCH
            o.append(f'<rect x="{cx}" y="{cy}" width="{COLW}" height="{CH}" rx="4" fill="{"#121b30" if (idx//COLS)%2==0 else "#0f172a"}"/>')
            num = f'#{r["chno"]}' if r['chno'] else 'web'
            cc = r['cc']; ck = ckey(cc); fl = flag_emoji(cc)
            o.append(f'<title>{esc(f"{num} · {fl} {cc} — {r[chr(110)+chr(97)+chr(109)+chr(101)]} ({r[chr(103)+chr(114)+chr(111)+chr(117)+chr(112)]})")}</title>')
            o.append(f'<text x="{cx+6}" y="{cy+16}" font-size="12.5" font-weight="700" fill="{color}" font-family="Consolas, Menlo, monospace">{esc(num)}</text>')
            if ck in FLAGS:
                o.append(f'<use href="#flag-{ck}" xlink:href="#flag-{ck}" x="{cx+46}" y="{cy+5}"/>')
            else:
                o.append(f'<text x="{cx+46}" y="{cy+16}" font-size="12">{fl}</text>')
            o.append(f'<text x="{cx+72}" y="{cy+16}" font-size="12" fill="#e2e8f0">{esc(trunc(r["name"]))}</text>')
        y += ((len(grp) + COLS - 1) // COLS) * PITCH + 6
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
    svg_doc(f'{s[2]} — canales {rng}', f'{len(grp)} canales · TV Chile v3.112 · 01-nov-2026', grp, f'afiches/afiche-{k:02d}-{slug}.svg')
print('afiches por sección:', k)

try:
    from PIL import Image, ImageDraw, ImageFont
    f_num = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 13)
    f_txt = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
    f_head = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
    f_sub = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
    flagimg = {}
    for cc in FLAGS:
        p = f'flags_png/{ckey(cc)}.png'
        if os.path.exists(p): flagimg[cc] = Image.open(p).resize((18, 12))
    img = Image.new('RGB', (w, h), '#0b1220'); d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, 160], fill='#111a2e'); d.rectangle([0, 156, w, 160], fill='#d52b1e')
    d.text((M, 18), 'TV CHILE — AFICHE DE TODOS LOS CANALES', font=f_head, fill='#f8fafc')
    d.text((M, 62), f'{n} canales numerados · Chile primero · v3.112 · 01-nov-2026 · celda: #núm [BANDERA] Nombre', font=f_sub, fill='#94a3b8')
    y = 168
    for s, grp in blocks_of(rows):
        color = s[3]; rgb = tuple(int(color[j:j+2], 16) for j in (1, 3, 5))
        d.rectangle([M, y, w - M, y + 26], fill=rgb)
        d.text((M + 10, y + 4), s[2] + (f'  (canales {s[0]}–{s[1]})' if s[0] else '') + f'  ·  {len(grp)}', font=f_sub, fill='#ffffff')
        y += 34
        for idx, r in enumerate(grp):
            cx = M + (idx % COLS) * (int(COLW) + GAP); cy = y + (idx // COLS) * PITCH
            d.rectangle([cx, cy, cx + COLW, cy + CH], fill='#121b30' if (idx // COLS) % 2 == 0 else '#0f172a')
            num = f'#{r["chno"]}' if r['chno'] else 'web'
            d.text((cx + 6, cy + 4), num, font=f_num, fill=rgb)
            ck = ckey(r['cc'])
            if ck in flagimg: img.paste(flagimg[ck], (int(cx + 46), int(cy + 5)))
            else: d.text((cx + 46, cy + 4), flag_emoji(r['cc']), font=f_txt, fill='#e2e8f0')
            d.text((cx + 72, cy + 4), trunc(r['name']), font=f_txt, fill='#e2e8f0')
        y += ((len(grp) + COLS - 1) // COLS) * PITCH + 6
    img.save('AFICHE-CANALES.png', optimize=True)
    print(f'AFICHE-CANALES.png: {w}x{h}, {os.path.getsize("AFICHE-CANALES.png")/1048576:.1f} MB')
except Exception as e:
    print('PNG omitido:', repr(e))
