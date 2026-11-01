#!/usr/bin/env node
/* mejorar_cc.js — ajusta cc (ISO 3166-1 alpha-2, país de origen) por canal.
 * Proveniencia primero: falta cc → sufijo del id (-cl,-mx,-ar-sd…) o 'cl'; nombres
 * inequívocos de país (China Channel → cn). El resto conserva el cc de la fuente
 * (m3u.cl=CL, hispam por grupo-país, Alplox por channels.json, IPTV-SV=SV, CharlieII=MX,
 * Pluto ES=ES): el origen es el del emisor, no el del CDN (.com.pe/.com.br mirrors).
 * Banderas = Regional Indicator Symbols U+1F1E6..U+1F1FF según ISO 3166-1 alpha-2.
 * Uso: node scripts/mejorar_cc.js  (reescribe data/channels.js, exporta /tmp/ccmap.json)
 */
const fs = require('fs');
global.window = {};
eval(fs.readFileSync('data/channels.js', 'utf8'));
const cs = window.CHANNELS;
const changes = [];
const SUFFIX = /-([a-z]{2})(?:-sd|-s)?$/i;
const NAME_FIX = [ [/^china channel$/i, 'cn'], [/^cctv/i, 'cn'], [/^cgt(n)?/i, 'cn'] ];
for (const c of cs) {
  const before = c.cc || null;
  if (!c.cc) {
    const m = (c.id || '').match(SUFFIX);
    c.cc = (m && m[1].toLowerCase()) || 'cl';
  }
  for (const [re, cc] of NAME_FIX) if (re.test(c.name || '')) c.cc = cc;
  if ((c.cc || null) !== before) changes.push(c.id + ': ' + before + ' -> ' + c.cc + ' (' + c.name + ')');
}
let src = fs.readFileSync('data/channels.js', 'utf8');
const mArr = src.match(/window\.CHANNELS = \[[\s\S]*?\n\];/);
if (!mArr) { console.error('no se encontró window.CHANNELS'); process.exit(1); }
src = src.replace(mArr[0], 'window.CHANNELS = ' + JSON.stringify(cs, null, 1) + '\n];');
fs.writeFileSync('data/channels.js', src);
const map = {}; cs.forEach(c => { map[c.id] = (c.cc || 'xx').toUpperCase(); });
fs.writeFileSync('/tmp/ccmap.json', JSON.stringify(map));
const dist = {};
cs.forEach(c => { dist[c.cc] = (dist[c.cc] || 0) + 1; });
console.log('total:', cs.length, '| sin cc:', cs.filter(c => !c.cc).length);
console.log('cambios:', changes.length); changes.slice(0, 20).forEach(x => console.log('  ' + x));
console.log('dist cc:', Object.entries(dist).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ':' + v).join(' '));
