// add_internacionales.js — agrega canales internacionales EN ESPAÑOL (verificados) al grupo Internacionales
// y quita el Telesur viejo de fuente no oficial (raw.githubusercontent BellezaEmporium). Uso: node scripts/add_internacionales.js
const fs = require('fs');
global.window = {};
eval(fs.readFileSync('data/channels.js', 'utf8'));
let chans = window.CHANNELS.filter(Boolean);
const before = chans.length;
chans = chans.filter(c => c.id !== 'telesur-ve'); // viejo Telesur [General] vía github raw (no oficial)
const add = [
  { id: 'france24-espanol', name: 'France 24 Español', group: 'Internacionales', region: 'Internacional', color: '#4f46e5', abbr: 'F24ES', url: 'https://live.france24.com/hls/live/2037220-b/F24_ES_HI_HLS/master_5000.m3u8', web: 'https://www.france24.com/es/', note: 'Noticias internacionales 24h en español · señal oficial france24.com (verificada 200)', cc: 'fr', chno: 1604 },
  { id: 'dw-espanol', name: 'DW Español (Deutsche Welle)', group: 'Internacionales', region: 'Internacional', color: '#4f46e5', abbr: 'DWES', url: 'https://dwamdstream104.akamaized.net/hls/live/2015530/dwstream104/master.m3u8', web: 'https://www.dw.com/es', note: 'Noticias internacionales en español · señal oficial DW (verificada 200)', cc: 'de', chno: 1605 },
  { id: 'euronews-espanol', name: 'Euronews Español', group: 'Internacionales', region: 'Internacional', color: '#4f46e5', abbr: 'EURES', url: 'https://iptv.bitred.cl/euronews/index.m3u8', web: 'https://es.euronews.com/live', note: 'Noticias europeas/internacionales en español · espejo ISP bitred.cl del feed oficial (verificado 206)', cc: 'fr', chno: 1606 },
  { id: 'telesur-intl', name: 'teleSUR', group: 'Internacionales', region: 'Internacional', color: '#4f46e5', abbr: 'TSUR', url: 'https://mblesmain01.telesur.ultrabase.net/mbliveMain/hd/playlist.m3u8', web: 'https://www.telesurtv.net/', note: 'Noticias de Latam y el mundo en español · señal oficial teleSUR ultrabase (verificada 206)', cc: 've', chno: 1607 },
  { id: 'cnn-en-espanol', name: 'CNN en Español', group: 'Internacionales', region: 'Internacional', color: '#4f46e5', abbr: 'CNNES', url: '', web: 'https://cnn.com/espanol', note: 'Solo web: CNN en Español en vivo por su sitio/app oficial (señal 24h requiere operador; clips gratis en cnn.com/espanol)', cc: 'us', chno: 1608 },
];
chans.push(...add);
let s = fs.readFileSync('data/channels.js', 'utf8');
const startMark = 'window.CHANNELS = [';
const i = s.indexOf(startMark);
const j = s.indexOf('\n];', i);
const prefix = s.slice(0, i) + startMark + '\n';
const suffix = s.slice(j);
const body = chans.map(c => ' ' + JSON.stringify(c, null, 1)).join(',\n');
fs.writeFileSync('data/channels.js', prefix + body + suffix);
console.log('quitados:', before - (chans.length - add.length), '| total ahora:', chans.length);
