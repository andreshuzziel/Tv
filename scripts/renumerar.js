// renumerar.js — renumera tvg-chno POR TEMÁTICA en bloques fijos (pedido 01-nov-2026):
//   📺1 · 📰100 · ⚽201 · 🎬301 · 🧸401 · ⛩️501 · 🎓601 · 🎵701 · 📻1001 · 🌿1101 ·
//   🏛️1201 · ⛪1301 · 🤝1501 · 🌐1601 · 📡OTT1701 · 📡Generalistas1801 · 📍Regiones 3501 (norte→sur)
// Dentro de cada bloque: # ascendente guardando el orden relativo anterior.
// Luego regenera tv-chile-todo.m3u. Uso: node scripts/renumerar.js
const fs = require('fs');
const src = fs.readFileSync('app.js', 'utf8');
const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const THEMES = eval(src.match(/const THEMES = (\[[\s\S]*?\n  \]);/)[1]);
const REGIONS = eval(src.match(/const REGIONS = (\[[\s\S]*?\n  \]);/)[1]);
let REGION_ALIAS = {};
const ma = src.match(/const REGION_ALIAS = (\{[\s\S]*?\});/);
if (ma) REGION_ALIAS = eval('(' + ma[1] + ')');

const STARTS = { nac: 1, noticias: 100, deportes: 201, entre: 301, infantil: 401, anime: 501, cultura: 601, musica: 701, radio: 1001, estilo: 1101, gob: 1201, religion: 1301, comunit: 1501, inter: 1601, ott: 1701, general: 1801 };
const REG_START = 3501;

global.window = {};
eval(fs.readFileSync('data/channels.js', 'utf8'));
const chans = window.CHANNELS.filter(Boolean);
const G2T = {}; THEMES.forEach(t => t.groups.forEach(g => { G2T[norm(g)] = t.k; }));
const themeOf = c => G2T[norm(c.group)] || 'general';
const regionOf = c => { const r = norm(c.region); const hit = REGIONS.find(x => norm(x.k) === r); return hit ? hit.k : (REGION_ALIAS[r] || null); };
const oldChno = c => c.chno || 1e9;

// asignar nuevos números
const byTheme = {}, byReg = {};
for (const c of chans) {
  const rg = regionOf(c);
  if (rg) (byReg[rg] = byReg[rg] || []).push(c);
  else (byTheme[themeOf(c)] = byTheme[themeOf(c)] || []).push(c);
}
const nuevo = {};
for (const t of THEMES) {
  const arr = (byTheme[t.k] || []).sort((a, b) => oldChno(a) - oldChno(b) || a.name.localeCompare(b.name));
  arr.forEach((c, i) => { nuevo[c.id] = STARTS[t.k] + i; });
}
let n = REG_START;
for (const r of REGIONS) {
  const arr = (byReg[r.k] || []).sort((a, b) => oldChno(a) - oldChno(b) || a.name.localeCompare(b.name));
  for (const c of arr) nuevo[c.id] = n++;
}
for (const c of chans) c.chno = nuevo[c.id];

// reescribir data/channels.js conservando cabecera y window.SPORTS
let s = fs.readFileSync('data/channels.js', 'utf8');
const startMark = 'window.CHANNELS = [';
const i = s.indexOf(startMark);
const j = s.indexOf('\n];', i);
const prefix = s.slice(0, i) + startMark + '\n';
const suffix = s.slice(j); // '\n];' + window.SPORTS...
const body = chans.map(c => ' ' + JSON.stringify(c, null, 1)).join(',\n');
fs.writeFileSync('data/channels.js', prefix + body + suffix);
console.log('channels.js renumerado:', chans.length, 'entradas · máximo chno =', Math.max(...chans.map(c => c.chno)));

// tv-chile-todo.m3u (sólo con url, ordenado por nuevo chno)
const withUrl = chans.filter(c => c.url).sort((a, b) => a.chno - b.chno);
const lines = ['#EXTM3U'];
for (const c of withUrl) {
  lines.push(`#EXTINF:-1 tvg-id="${c.id}" tvg-name="${c.name}" tvg-chno="${c.chno}" tvg-country="${(c.cc || '').toUpperCase()}" group-title="${c.group}",${c.name}`, c.url);
}
fs.writeFileSync('playlists/tv-chile-todo.m3u', lines.join('\n') + '\n');
console.log('tv-chile-todo.m3u:', withUrl.length, 'EXTINF · primero:', lines[1].match(/tvg-chno="(\d+)"/)[1], '· último:', lines[lines.length - 2].match(/tvg-chno="(\d+)"/)[1]);

// resumen por tema
for (const t of THEMES) {
  const arr = byTheme[t.k] || [];
  if (arr.length) console.log(`  ${t.icon} ${t.name}: #${STARTS[t.k]}–#${STARTS[t.k] + arr.length - 1} (${arr.length})`);
}
console.log(`  📍 Regiones: #${REG_START}–#${n - 1} (${n - REG_START})`);
