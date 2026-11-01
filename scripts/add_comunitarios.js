// add_comunitarios.js — agrega canales COMUNITARIOS en español (web oficial/YouTube verificado) al grupo Comunitarios.
// Uso: node scripts/add_comunitarios.js
const fs = require('fs');
global.window = {};
eval(fs.readFileSync('data/channels.js', 'utf8'));
let chans = window.CHANNELS.filter(Boolean);
const add = [
  { id: 'quilicura-tv', name: 'Quilicura TV (canal comunitario 42.1)', group: 'Comunitarios', region: 'Nacional', color: '#0d9488', abbr: 'QUIL', url: '', web: 'https://www.youtube.com/channel/UCv8Rol2gjlxlbZRDUjrnI1Q', note: 'TV comunitaria de población Parinacota, Quilicura · emite 24h por YouTube (TVD 42.1/42.2) · verificado 01-nov-2026', cc: 'cl', chno: 1503 },
  { id: 'senal3-la-victoria', name: 'Señal 3 La Victoria (canal 47.1)', group: 'Comunitarios', region: 'Nacional', color: '#0d9488', abbr: 'S3LV', url: '', web: 'https://canal3lavictoria.cl/senal-en-vivo-senal-3-la-victoria-12/', note: 'Primer canal comunitario de Chile (1997) · señal en vivo en canal3lavictoria.cl y YouTube UCvrQj9UUs3fQ94xU7ceu7Dg', cc: 'cl', chno: 1504 },
  { id: 'cntv-infantil-comunitarios', name: 'CNTV Infantil — Canales comunitarios', group: 'Comunitarios', region: 'Nacional', color: '#0d9488', abbr: 'CNTV', url: '', web: 'https://cntvinfantil.cl/canales-comunitarios/', note: 'Directorio oficial CNTV de canales comunitarios de Chile (frecuencias y cobertura)', cc: 'cl', chno: 1505 },
];
const ids = new Set(chans.map(c => c.id));
for (const a of add) { if (!ids.has(a.id)) chans.push(a); }
let s = fs.readFileSync('data/channels.js', 'utf8');
const startMark = 'window.CHANNELS = [';
const i = s.indexOf(startMark);
const j = s.indexOf('\n];', i);
const body = chans.map(c => ' ' + JSON.stringify(c, null, 1)).join(',\n');
fs.writeFileSync('data/channels.js', s.slice(0, i) + startMark + '\n' + body + s.slice(j));
console.log('total ahora:', chans.length, '| Comunitarios:', chans.filter(c => c.group === 'Comunitarios').length);
