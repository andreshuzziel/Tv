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

// v3.112 (pedido usuario): numeración SECUENCIAL 1..N sólo para canales con stream (así los detecta la app IPTV de Play Store, que numera el m3u 1..2576). Los web-only quedan sin # (chno=null).
const STARTS = { nac: 1, noticias: 1, deportes: 1, entre: 1, infantil: 1, anime: 1, cultura: 1, musica: 1, radio: 1, estilo: 1, gob: 1, religion: 1, comunit: 1, inter: 1, ott: 1, general: 1 };
const REG_START = 1;

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
let prevEnd = 0;
for (const t of THEMES) {
  const arr = (byTheme[t.k] || []).sort((a, b) => oldChno(a) - oldChno(b) || a.name.localeCompare(b.name));
  if (!arr.length) continue;
  const start = Math.max(STARTS[t.k], prevEnd + 1);   // sin solaparse con el bloque anterior
  let last = start - 1; arr.forEach((c) => { if (c.url) nuevo[c.id] = ++last; else nuevo[c.id] = null; });
  prevEnd = last;
}
let n = Math.max(REG_START, prevEnd + 1);
for (const r of REGIONS) {
  const arr = (byReg[r.k] || []).sort((a, b) => oldChno(a) - oldChno(b) || a.name.localeCompare(b.name));
  for (const c of arr) { if (c.url) nuevo[c.id] = n++; else nuevo[c.id] = null; }
}
prevEnd = n - 1;
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
console.log('channels.js renumerado:', chans.length, 'entradas · numerados (con stream):', chans.filter(c=>c.chno).length, '· máximo chno =', Math.max(...chans.map(c => c.chno||0)), '· web-only sin #: ', chans.filter(c=>!c.chno).length);

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
  if (arr.length) { const ns = arr.map(c => nuevo[c.id]).filter(x => x); if (ns.length) console.log(`  ${t.icon} ${t.name}: #${Math.min(...ns)}–#${Math.max(...ns)} (${ns.length} con stream, ${arr.length - ns.length} web-only)`); }
}
console.log(`  📍 Regiones: hasta #${n - 1}`);
