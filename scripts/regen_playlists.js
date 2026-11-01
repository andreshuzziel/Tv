#!/usr/bin/env node
/* regen_playlists.js — regenera playlists/tematicas-es-completa.m3u y playlists/es/tema-*.m3u
   desde data/channels.js (fuente única de verdad). Uso: node scripts/regen_playlists.js */
const fs = require('fs');
global.window = {};
eval(fs.readFileSync('data/channels.js', 'utf8'));
const chans = window.CHANNELS.filter(Boolean);
const isReg = c => c.region && c.region !== 'Nacional' && !/espa/i.test(c.region);
const tem = chans.filter(c => c.url && !isReg(c));
const slug = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const lines = ['#EXTM3U'];
tem.sort((a, b) => (a.chno || 99999) - (b.chno || 99999) || a.name.localeCompare(b.name));
tem.forEach(c => lines.push(`#EXTINF:-1 tvg-id="${c.id}" tvg-name="${c.name}" tvg-chno="${c.chno || ''}" tvg-country="${(c.cc || '').toUpperCase()}" group-title="${c.group}",${c.name}`, c.url));
fs.writeFileSync('playlists/tematicas-es-completa.m3u', lines.join('\n') + '\n');
const byGroup = {};
tem.forEach(c => { (byGroup[c.group] = byGroup[c.group] || []).push(c); });
for (const [g, arr] of Object.entries(byGroup)) {
  const ls = ['#EXTM3U'];
  arr.sort((a, b) => (a.chno || 99999) - (b.chno || 99999));
  arr.forEach(c => ls.push(`#EXTINF:-1 tvg-id="${c.id}" tvg-name="${c.name}" tvg-chno="${c.chno || ''}" tvg-country="${(c.cc || '').toUpperCase()}" group-title="${g}",${c.name}`, c.url));
  fs.writeFileSync(`playlists/es/tema-${slug(g)}.m3u`, ls.join('\n') + '\n');
}
console.log('tematicas-es-completa.m3u:', tem.length, 'canales |', Object.keys(byGroup).length, 'temas');
console.log('tema-legislativo.m3u:', (byGroup['Legislativo'] || []).map(c => c.name + ' [' + c.cc + ']').join(' | '));
