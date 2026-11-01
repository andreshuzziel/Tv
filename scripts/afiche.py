#!/usr/bin/env python3
"""afiche.py — genera el afiche (imagen) con TODOS los canales: número + bandera + nombre.
Salida: AFICHE-CANALES.svg (vectorial, todos) + afiches/afiche-XX-seccion.svg (por bloque)
        AFICHE-CANALES.png (raster, con chip de código de país en vez de emoji)
Uso: python3 scripts/afiche.py   (lee /tmp/poster.json generado desde data/channels.js)
"""
import json, os, html

rows = json.load(open('/tmp/poster.json'))
SECTIONS = [
    (1, 32, '📺 Señal abierta nacional', '#d52b1e'),
    (33, 52, '📰 Noticias de Chile', '#2563eb'),
    (53, 85, '📍 Biobío (tu región)', '#0d9488'),
    (86, 308, '📍 Regiones de Chile (norte → sur)', '#0891b2'),
    (309, 317, '⚽ Deportes (legales)', '#16a34a'),
    (318, 322, '🧸 Infantil · animación · anime', '#f59e0b'),
    (323, 415, '🎵 Música y radios', '#9333ea'),
    (416, 433, '⛪ Religiosos', '#a16207'),
    (434, 446, '🎓 Cultura · educación · documentales', '#0891b2'),
    (447, 683, '📡 Resto de Chile', '#64748b'),
    (684, 3110, '🌎 Español — otros países', '#4f46e5'),
    (None, None, '🌐 Solo sitio web (sin stream)', '#334155'),
]
def seccion(r):
    if not r['url']: return SECTIONS[-1]
    for s in SECTIONS[:-1]:
        if s[0] <= r['chno'] <= s[1]: return s
    return SECTIONS[-2]

W, M, COLS, CH, PITCH = 1460, 20, 4, 22, 24
GAP = 8
COLW = (W - 2 * M - (COLS - 1) * GAP) / COLS
MAXCH = int((COLW - 84) / 6.55)

def esc(t): return html.escape(str(t), quote=True)
def trunc(t, n=MAXCH): return t if len(t) <= n else t[: n - 1] + '…'

def svg_doc(title, subtitle, items, fname):
    sec_h, head_h = 30, 168
    # calcular alto
    h = head_h
    i = 0
    blocks = []
    while i < len(items):
        s = seccion(items[i]); grp = [r for r in items[i:] if seccion(r) is s]
        blocks.append((s, grp)); i += len(grp)
    for s, grp in blocks:
        h += sec_h + 4
        h += ((len(grp) + COLS - 1) // COLS) * PITCH + 6
    h += M
    H = h
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="Segoe UI, Arial, Helvetica, sans-serif">',
           f'<rect width="{W}" height="{H}" fill="#0b1220"/>']
    # header
    out.append(f'<rect x="0" y="0" width="{W}" height="{head_h}" fill="#111a2e"/>')
    out.append(f'<rect x="0" y="{head_h-4}" width="{W}" height="4" fill="#d52b1e"/>')
    out.append(f'<text x="{M}" y="46" font-size="34" font-weight="700" fill="#f8fafc">{esc(title)}</text>')
    out.append(f'<text x="{M}" y="76" font-size="15" fill="#94a3b8">{esc(subtitle)}</text>')
    out.append(f'<text x="{M}" y="102" font-size="13" fill="#64748b">Cada celda:  #número  🏳️ bandera (país)  Nombre del canal   ·   al pasar el mouse: país y temática completos</text>')
    out.append(f'<text x="{M}" y="126" font-size="13" fill="#64748b">Rangos: 1–32 señal abierta CL · 33–52 noticias · 53–85 Biobío · 86–308 regiones · 309–317 deportes · 318–322 infantil/anime · 323–415 música · 416–433 religiosos · 434–446 cultura · 447–683 resto CL · 684–3110 español otros países</text>')
    out.append(f'<text x="{M}" y="148" font-size="13" fill="#64748b">Generado 01-nov-2026 · v3.112 · lista sanitizada (https, sin TV de pago) · repo tv-chile</text>')
    y = head_h
    for s, grp in blocks:
        label, color = s[2], s[3]
        rng = f'{s[0]}–{s[1]}' if s[0] else '—'
        out.append(f'<rect x="{M}" y="{y}" width="{W-2*M}" height="{sec_h-4}" rx="6" fill="{color}" opacity="0.9"/>')
        out.append(f'<text x="{M+10}" y="{y+sec_h-12}" font-size="15" font-weight="600" fill="#fff">{esc(label)}</text>')
        out.append(f'<text x="{W-M-10}" y="{y+sec_h-12}" font-size="13" fill="#e2e8f0" text-anchor="end">canales {rng} · {len(grp)}</text>')
        y += sec_h + 4
        for idx, r in enumerate(grp):
            cx = M + (idx % COLS) * (COLW + GAP)
            cy = y + (idx // COLS) * PITCH
            alt = '#121b30' if (idx // COLS) % 2 == 0 else '#0f172a'
            out.append(f'<rect x="{cx}" y="{cy}" width="{COLW}" height="{CH}" rx="4" fill="{alt}"/>')
            num = f'#{r["chno"]}' if r['chno'] else 'web'
            tip = f'{num} · {r["flag"]} {r["pais"] or r["cc"]} — {r["name"]} ({r["group"]})'
            out.append(f'<title>{esc(tip)}</title>')
            out.append(f'<text x="{cx+6}" y="{cy+16}" font-size="12.5" font-weight="700" fill="{color}" font-family="Consolas, Menlo, monospace">{esc(num)}</text>')
            out.append(f'<text x="{cx+48}" y="{cy+16}" font-size="12">{esc(r["flag"])}</text>')
            out.append(f'<text x="{cx+74}" y="{cy+16}" font-size="12" fill="#e2e8f0">{esc(trunc(r["name"]))}</text>')
        y += ((len(grp) + COLS - 1) // COLS) * PITCH + 6
    out.append('</svg>')
    open(fname, 'w', encoding='utf-8').write('\n'.join(out))
    return W, H

n_all = len(rows)
w, h = svg_doc('📺 TV CHILE — AFICHE DE TODOS LOS CANALES', f'{n_all} canales numerados · Chile primero (Biobío destacado) · español Latam/ES · actualizado 01-nov-2026 · v3.112', rows, 'AFICHE-CANALES.svg')
print(f'AFICHE-CANALES.svg: {w}x{h}px, {n_all} canales, {os.path.getsize("AFICHE-CANALES.svg")/1024:.0f} KB')

# por sección
os.makedirs('afiches', exist_ok=True)
i = 0; k = 0
while i < len(rows):
    s = seccion(rows[i]); grp = [r for r in rows[i:] if seccion(r) is s]
    k += 1
    slug = s[2].split(' ')[-1].lower().replace('(', '').replace(')', '').replace('→', 'a')[:14]
    fname = f'afiches/afiche-{k:02d}-{slug}.svg'
    rng = f'{s[0]}–{s[1]}' if s[0] else 'solo web'
    svg_doc(f'{s[2]} — canales {rng}', f'{len(grp)} canales · TV Chile v3.112 · 01-nov-2026', grp, fname)
    i += len(grp)
print('afiches por sección:', k)

# PNG raster (chip con código de país, sin depender de fuente emoji)
try:
    from PIL import Image, ImageDraw, ImageFont
    fp = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    fpB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
    f_num = ImageFont.truetype(fpB, 13); f_txt = ImageFont.truetype(fp, 12); f_head = ImageFont.truetype(fpB, 30); f_sub = ImageFont.truetype(fp, 13)
    PW, PH = W, h
    img = Image.new('RGB', (PW, PH), '#0b1220'); d = ImageDraw.Draw(img)
    d.rectangle([0, 0, PW, 160], fill='#111a2e'); d.rectangle([0, 156, PW, 160], fill='#d52b1e')
    d.text((M, 18), 'TV CHILE — AFICHE DE TODOS LOS CANALES', font=f_head, fill='#f8fafc')
    d.text((M, 62), f'{n_all} canales numerados · Chile primero · v3.112 · 01-nov-2026 · celda: #núm [PAÍS] Nombre', font=f_sub, fill='#94a3b8')
    y = 168
    i = 0
    while i < len(rows):
        s = seccion(rows[i]); grp = [r for r in rows[i:] if seccion(r) is s]
        color = s[3]
        rgb = tuple(int(color[j:j+2], 16) for j in (1, 3, 5))
        d.rectangle([M, y, PW - M, y + 26], fill=rgb)
        lab = s[2] + (f'  (canales {s[0]}–{s[1]})' if s[0] else '') + f'  ·  {len(grp)}'
        d.text((M + 10, y + 4), lab, font=f_sub, fill='#ffffff')
        y += 34
        for idx, r in enumerate(grp):
            cx = M + (idx % COLS) * (int(COLW) + GAP); cy = y + (idx // COLS) * PITCH
            d.rectangle([cx, cy, cx + COLW, cy + CH], fill='#121b30' if (idx // COLS) % 2 == 0 else '#0f172a')
            num = f'#{r["chno"]}' if r['chno'] else 'web'
            d.text((cx + 6, cy + 4), num, font=f_num, fill=rgb)
            # chip de país (2 letras) en vez de emoji
            cc = r['cc'] or '??'
            d.rounded_rectangle([cx + 46, cy + 4, cx + 68, cy + 18], radius=3, fill=rgb)
            d.text((cx + 50, cy + 5), cc, font=f_txt, fill='#ffffff')
            d.text((cx + 74, cy + 4), trunc(r['name']), font=f_txt, fill='#e2e8f0')
        y += ((len(grp) + COLS - 1) // COLS) * PITCH + 6
        i += len(grp)
    img.save('AFICHE-CANALES.png', optimize=True)
    print(f'AFICHE-CANALES.png: {PW}x{PH}px, {os.path.getsize("AFICHE-CANALES.png")/1048576:.1f} MB')
except Exception as e:
    print('PNG omitido:', e)
