// regen_guia.js — regenera GUIA-ORDEN.md ordenado POR TEMÁTICA (mismo orden que app.js THEMES,
// con 📍 Regiones de Chile después de Noticias) y dentro de cada tema por # (tvg-chno) ascendente.
// Además emite /tmp/poster.json (con tord/tlabel/tcolor), /tmp/themes.json y /tmp/sports.json para afiche.py.
// Uso: node scripts/regen_guia.js
const fs = require('fs');
const src = fs.readFileSync('app.js', 'utf8');
const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function extractArr(name) {
  const m = src.match(new RegExp('const ' + name + ' = (\\[[\\s\\S]*?\\n  \\]);'));
  if (!m) throw new Error('no se encontró ' + name);
  return eval(m[1]);
}
const THEMES = extractArr('THEMES');
const REGIONS = extractArr('REGIONS');
let REGION_ALIAS = {};
const ma = src.match(/const REGION_ALIAS = (\{[\s\S]*?\});/);
if (ma) REGION_ALIAS = eval('(' + ma[1] + ')');

global.window = {};
eval(fs.readFileSync('data/channels.js', 'utf8'));
const chans = window.CHANNELS.filter(Boolean);
const sports = window.SPORTS || [];

const flagOf = cc => /^[a-z]{2}$/i.test(cc || '')
  ? String.fromCodePoint(...[...cc.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)) : '';
const G2T = {}; THEMES.forEach(t => t.groups.forEach(g => { G2T[norm(g)] = t.k; }));
const themeOf = c => G2T[norm(c.group)] || 'general';
const regionOf = c => {
  const r = norm(c.region);
  const hit = REGIONS.find(x => norm(x.k) === r);
  return hit ? hit.k : (REGION_ALIAS[r] || null);
};

// secciones: temas en orden de la app; regiones insertadas tras 'noticias'
const noticiasIdx = THEMES.findIndex(t => t.k === 'noticias');
const REG_TORD = noticiasIdx + 0.5;
const themeSec = THEMES.map((t, i) => ({ tord: i, label: t.name.startsWith(t.icon) ? t.name : `${t.icon} ${t.name}`, color: t.color, big: t.k === 'deportes', key: t.k }));
const regSec = { tord: REG_TORD, label: '📍 Regiones de Chile (Biobío y norte→sur)', color: '#0891b2', big: false, key: 'regiones' };
const ALL_SECS = [...themeSec.slice(0, noticiasIdx + 1), regSec, ...themeSec.slice(noticiasIdx + 1)];

const rows = chans.map(c => {
  const reg = regionOf(c);
  const theme = reg ? null : themeOf(c);
  const tord = reg ? REG_TORD : THEMES.findIndex(t => t.k === theme);
  return { c, reg, theme, tord,
    chno: c.chno || null, flag: flagOf(c.cc), cc: (c.cc || '').toUpperCase(),
    name: c.name, group: c.group, region: c.region || '', url: !!c.url,
    note: c.note || '', web: c.web || '' };
});
// orden: por temática (tord) y dentro de cada tema # cronológico ascendente (sin chno al final, por nombre)
rows.sort((a, b) => (a.tord - b.tord) || ((a.chno || 1e9) - (b.chno || 1e9)) || a.name.localeCompare(b.name));

// ---------- /tmp para afiche.py ----------
fs.writeFileSync('/tmp/themes.json', JSON.stringify(ALL_SECS.map(s => ({ tord: s.tord, label: s.label, color: s.color, big: !!s.big }))));
fs.writeFileSync('/tmp/poster.json', JSON.stringify(rows.map(r => ({
  chno: r.chno, id: r.c.id, flag: r.flag, cc: r.cc, name: r.name, group: r.group,
  url: r.url, tord: r.tord,
}))));
fs.writeFileSync('/tmp/sports.json', JSON.stringify(sports));

// ---------- GUIA-ORDEN.md ----------
const total = chans.length;
const numerados = rows.filter(r => r.chno).length;
const sinStream = rows.filter(r => !r.url).length;
const esc = s => String(s).replace(/\|/g, '\\|');
const rowLine = r => {
  const note = r.url ? '' : ` — *(solo web: ${esc(r.web || 'sitio oficial')})*`;
  return `| ${r.chno || '—'} | ${r.flag || '🏳️'} | ${esc(r.name)}${note} | ${esc(r.group)} | ${esc(r.region || r.cc)} |`;
};
let md = `# 📖 GUIA-ORDEN — Guía de canales con números (LCN / tvg-chno)

Generada: 01-nov-2026 · **${numerados} canales numerados** (de ${total} en el catálogo; ${sinStream} sin stream van solo a sitio oficial).
Cada canal lleva su número en \`tvg-chno\` dentro de \`playlists/tv-chile-todo.m3u\` → la app IPTV los ordena con esos números.
**Orden de esta lista: por temática (igual que en la app) y, dentro de cada tema, números cronológicos ascendentes.**

## 🗂️ Esquema de numeración (rangos)

- **1–32** · 🇨🇱 Señal abierta nacional de Chile (32)
- **33–52** · 📰 Noticias de Chile (20)
- **53–85** · 📍 Biobío (tu región) (33)
- **86–308** · 📍 Otras regiones de Chile (norte → sur) (223)
- **309–317** · ⚽ Deportes (legales/FAST) (9)
- **318–322** · 🧸 Infantil · Animación · ⛩️ Anime (5)
- **323–415** · 🎵 Música · 📻 Radio (93)
- **416–433** · ⛪ Religiosos (18)
- **434–446** · 🎓 Cultura · Educación · Documentales · Universitarios · Ciencia · Comunitarios (13)
- **447–683** · 📺 Resto de Chile (entretenimiento, generalistas, regionales varios) (237)
- **684–3110** · 🌎 Español de otros países (Latam/España), por tema (2427)
- **3111+** · ✨ Nuevos FAST gratis + 🏛️ Gobierno y Congreso de Chile (solo 🇨🇱)

## 🔢 Lista completa ordenada por temática (dentro de cada tema: # ascendente)
`;
for (const s of ALL_SECS) {
  const grp = rows.filter(r => r.tord === s.tord);
  if (!grp.length) continue;
  md += `\n### ${s.label} — ${grp.length} canales\n\n| # | Bandera | Canal | Grupo | Región/País |\n|---:|---|---|---|---|\n`;
  md += grp.map(rowLine).join('\n') + '\n';
}
// canales sin tema ni región (no deberían existir, por si acaso)
const sobrantes = rows.filter(r => r.tord === undefined || r.tord === null);
if (sobrantes.length) {
  md += `\n### 📦 Otros — ${sobrantes.length}\n\n| # | Bandera | Canal | Grupo | Región/País |\n|---:|---|---|---|---|\n` + sobrantes.map(rowLine).join('\n') + '\n';
}
md += `
## 📝 Notas

- 🧹 Limpieza 01-nov-2026: la temática 🏛️ **Gobierno y Congreso de Chile** es **solo 🇨🇱** — se eliminaron los 28 canales legislativos extranjeros del catálogo, m3u, afiches y playlists. Quedan: TV Senado #51 (señal oficial senado.cl + tv.senado.cl + @TVSENADOCHILE), TV Cámara/CDTV #438 (cdtv.cl + YouTube oficial), Gobierno de Chile #555, y solo-web oficiales: TV Senado #440, Poder Judicial #3113, Servel #3114, Tribunal Constitucional #3115, BCN #3116 (@CongresoChile · bcn.cl) y Democracia en Vivo #3117 (democraciaenvivo.cl).
- Los OTT de pago (Max/HBO, TNT Sports, Disney+, Prime, Paramount+) NO están como canales; van por suscripción oficial (ver alternativas ✔ legales para deportes en window.SPORTS).
- Orden de la lista: temáticas en el mismo orden del panel de la app; 📍 Regiones de Chile después de Noticias; dentro de cada sección, \`tvg-chno\` ascendente (orden cronológico de asignación).
`;
fs.writeFileSync('GUIA-ORDEN.md', md);
console.log(`GUIA-ORDEN.md regenerada: ${total} canales, ${numerados} numerados, ${ALL_SECS.length} secciones temáticas`);
