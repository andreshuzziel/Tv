(() => {
  const chans = (window.CHANNELS || []).filter(c => c && c.id);
  const sports = window.SPORTS || [];
  const $ = s => document.querySelector(s);
  const video = $('#video'), overlay = $('#overlay');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  // 🏳️ bandera del país de origen (campo cc = ISO 3166-1 alpha-2) → emoji regional indicator
  const flagOf = cc => /^[a-z]{2}$/i.test(cc || '')
    ? String.fromCodePoint(...[...(cc.toUpperCase() === 'UK' ? 'GB' : cc.toUpperCase())].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65))
    : '';
  const store = {
    get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  // ✏️ Renombres personalizados: base en data/renames.js (persistente en el repo) + localStorage
  const renames = Object.assign({}, window.RENAMES || {}, store.get('tvcl_renames', {}));
  const saveRenames = () => store.set('tvcl_renames', renames);
  const dispName = c => renames[c.id] || c.name;
  const paisName = cc => (window.PAISES || {})[String(cc || '').toLowerCase()] || String(cc || '?').toUpperCase();
  const toast = msg => {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2200);
  };

  /* =====================================================================
     1. CLASIFICACIÓN: canales regionales → su región · el resto → temática
     ===================================================================== */
  const REGIONS = [ // de norte a sur
    { k: 'Arica y Parinacota', code: 'XV',   cap: 'Arica' },
    { k: 'Tarapacá',           code: 'I',    cap: 'Iquique' },
    { k: 'Antofagasta',        code: 'II',   cap: 'Antofagasta' },
    { k: 'Atacama',            code: 'III',  cap: 'Copiapó' },
    { k: 'Coquimbo',           code: 'IV',   cap: 'La Serena' },
    { k: 'Valparaíso',         code: 'V',    cap: 'Valparaíso' },
    { k: 'Metropolitana',      code: 'RM',   cap: 'Santiago' },
    { k: "O'Higgins",          code: 'VI',   cap: 'Rancagua' },
    { k: 'Maule',              code: 'VII',  cap: 'Talca' },
    { k: 'Ñuble',              code: 'XVI',  cap: 'Chillán' },
    { k: 'Biobío',             code: 'VIII', cap: 'Concepción' },
    { k: 'Araucanía',          code: 'IX',   cap: 'Temuco' },
    { k: 'Los Ríos',           code: 'XIV',  cap: 'Valdivia' },
    { k: 'Los Lagos',          code: 'X',    cap: 'Puerto Montt' },
    { k: 'Aysén',              code: 'XI',   cap: 'Coyhaique' },
    { k: 'Magallanes',         code: 'XII',  cap: 'Punta Arenas' }
  ];
  // Degradado norte (cálido) → sur (frío)
  REGIONS.forEach((r, i) => { r.color = `hsl(${Math.round(18 + i * (200 / (REGIONS.length - 1)))} 70% 42%)`; });
  const REGION_ALIAS = { 'concepcion': 'Biobío', 'los angeles': 'Biobío', 'nuble/biobio': 'Ñuble', 'santiago': 'Metropolitana' };
  const regionOf = c => {
    const r = norm(c.region);
    const hit = REGIONS.find(x => norm(x.k) === r);
    return hit ? hit.k : (REGION_ALIAS[r] || null);
  };

  const THEMES = [
    { k: 'nac',      name: 'Señal abierta nacional', icon: '📺', color: '#d52b1e', groups: ['Nacional'] },
    { k: 'noticias', name: 'Noticias',               icon: '📰', color: '#2563eb', groups: ['Noticias'] },
    { k: 'deportes', name: 'Deportes',               icon: '⚽', color: '#16a34a', groups: ['Deportes'] },
    { k: 'entre',    name: 'Entretención y series',  icon: '🎬', color: '#db2777', groups: ['Entretenimiento', '13 FAST', 'Comedia', 'Familia', 'Clásicos'] },
    { k: 'infantil', name: 'Infantil y animación',   icon: '🧸', color: '#f59e0b', groups: ['Infantil', 'Animación'] },
    { k: 'anime',    name: 'Anime y doramas',        icon: '⛩️', color: '#e11d48', groups: ['Anime', 'Doramas'] },
    { k: 'cultura',  name: 'Cultura, educación y documentales', icon: '🎓', color: '#0891b2', groups: ['Cultura', 'Culturales', 'Educación', 'Documentales', 'Ciencia', 'Universitarios'] },
    { k: 'musica',   name: 'Música',                 icon: '🎵', color: '#9333ea', groups: ['Música'] },
    { k: 'radio',    name: 'Radios en video',        icon: '📻', color: '#ea580c', groups: ['Radio'] },
    { k: 'estilo',   name: 'Estilo de vida y viajes', icon: '🌿', color: '#65a30d', groups: ['Estilo de vida', 'Viajes', 'Cocina', 'Autos', 'Aire libre', 'Negocios'] },
    { k: 'gob',      name: 'Gobierno y legislativo', icon: '🏛️', color: '#475569', groups: ['Legislativo'] },
    { k: 'religion', name: 'Religiosos',             icon: '⛪', color: '#a16207', groups: ['Religioso', 'Religiosos'] },
    { k: 'comunit',  name: 'Comunitarios',           icon: '🤝', color: '#0d9488', groups: ['Comunitarios'] },
    { k: 'inter',    name: 'Internacionales',        icon: '🌐', color: '#4f46e5', groups: ['Internacionales'] },
    { k: 'ott',      name: 'Servicios OTT (streaming legal)', icon: '🌐', color: '#4f46e5', groups: ['OTT'] },
    { k: 'general',  name: 'Generalistas',           icon: '📡', color: '#64748b', groups: [] } // resto
  ];
  const G2T = {}; THEMES.forEach(t => t.groups.forEach(g => { G2T[norm(g)] = t.k; }));
  const themeOf = c => G2T[norm(c.group)] || 'general';
  const originOf = c => /espa/i.test(c.region) ? 'es' : 'cl';

  const KIND = g => {
    const n = norm(g);
    if (n === 'radio') return 'radio';
    if (['regionales', 'general', 'biobio', 'nacional'].includes(n)) return 'tv';
    return 'otros';
  };
  const KIND_LABEL = { tv: '📺 Televisión regional', radio: '📻 Radios', otros: '✨ Temáticos de la región' };

  chans.forEach(c => {
    c._reg = regionOf(c);
    c._theme = c._reg ? null : themeOf(c);
    c._origin = originOf(c);
    c._kind = KIND(c.group);
    c._flag = flagOf(c.cc) || (c._origin === 'es' ? '\u{1F30E}' : '\u{1F1E8}\u{1F1F1}');
    c._q = norm([c.name, dispName(c), c.region, c.group, c._reg || '', c.cc || '', c.note].join(' '));
  });
  const byId = new Map(chans.map(c => [c.id, c]));
  const regChans = chans.filter(c => c._reg);
  const temChans = chans.filter(c => !c._reg);
  // ⚽ Alternativas deportivas LEGALES (window.SPORTS) como pseudo-canales ✔ (abren su sitio oficial)
  const TLD2CC = { cl:'cl', mx:'mx', ar:'ar', es:'es', us:'us', br:'br', co:'co', pe:'pe', gt:'gt', bo:'bo', ec:'ec', uy:'uy', py:'py', cr:'cr', ve:'ve', do:'do', pa:'pa', hn:'hn', sv:'sv', ni:'ni', cu:'cu', pr:'pr' };
  const ccOfUrl = u => { const m = String(u || '').match(/https?:\/\/([^/]+)/); if (!m) return ''; return TLD2CC[m[1].split(':')[0].split('.').pop().toLowerCase()] || ''; };
  const legalChans = sports.map((sp, i) => {
    const cc = ccOfUrl(sp.url);
    return { id: 'legal-' + i, name: sp.name, url: '', web: sp.url, cc,
      group: 'Alternativa legal', note: (sp.type || '') + (sp.desc ? ' — ' + sp.desc : ''),
      color: '#16a34a', abbr: '✔', _reg: null, _theme: 'deportes',
      _origin: cc === 'cl' ? 'cl' : 'es', _kind: 'otros',
      _flag: flagOf(cc) || '\u{1F3DF}', _q: norm([sp.name, sp.type, sp.desc, sp.url].join(' ')) };
  });
  legalChans.forEach(c => byId.set(c.id, c));
  // ⚽ subtemas dentro de la temática Deportes
  const SPORT_LABEL = { fut: '⚽ Fútbol y deportes generales', hip: '🐎 Hípica y turf', comb: '🥊 Combate: MMA · boxeo · lucha', moto: '🏎️ Motor · poker · nichos', usa: '🇺🇸 Ligas USA / en inglés', s24: '🔴 Señales 24/7', intl: '🌐 Deportivos internacionales' };
  const SPORT_ORDER = ['fut', 'hip', 'comb', 'moto', 'usa', 's24', 'intl'];
  function sportKind(c) {
    const n = String(c.name || '').toLowerCase();
    if (/turf|hípica|hipica|monterrico|sporting/.test(n)) return 'hip';
    if (/ufc|mma|boxeo|lucha|kickbox|pfl|glory|knocks| box /.test(n)) return 'comb';
    if (/motor|rally|racer|fuel|ski|billiard|poker|hockey|racing|floho|florac/.test(n)) return 'moto';
    if (/\bmlb\b|\bnhl\b|ee\.uu|us\)| en\]/.test(n)) return 'usa';
    if (/24\/7|24-7/.test(n)) return 's24';
    if (/olympic|red ?bull|cazé|sbt|pluto|fite|women|powernation/.test(n)) return 'intl';
    return 'fut';
  }

  /* =====================================================================
     2. ESTADO DEL PANEL
     ===================================================================== */
  const ui = store.get('tvcl_ui', {});
  const state = {
    view: ui.view || 'reg',
    regKind: ui.regKind || 'all',     // all | tv | radio
    temOrigin: ui.temOrigin || 'all', // all | cl | es
    // ⭐ tema elegido en la columna izquierda de temáticas (filtra los canales de la derecha)
    theme: ui.theme || 'all',
    open: { reg: new Set(ui.openReg || ['Biobío']), tem: new Set(ui.openTem || ['nac']), fav: new Set(['favs', 'recent']) },
    query: '',
    expanded: new Set()
  };
  const saveUi = () => store.set('tvcl_ui', {
    view: state.view, regKind: state.regKind, temOrigin: state.temOrigin, theme: state.theme,
    openReg: [...state.open.reg], openTem: [...state.open.tem]
  });

  const favs = new Set(store.get('tvcl_favs', []));
  const saveFavs = () => store.set('tvcl_favs', [...favs]);
  let recent = store.get('tvcl_recent', []).filter(id => byId.has(id));

  let current = null;
  const PAGE = 60;

  /* ---------- Construcción de secciones según la vista ---------- */
  // ⭐ el filtro de temática (columna izquierda) se aplica siempre
  const themeFilter = c => state.theme === 'all' || c._theme === state.theme || c._reg === state.theme;
  function matches(c) {
    if (!themeFilter(c)) return false;
    return !state.query || c._q.includes(state.query);
  }

  function sectionsFor(view) {
    if (view === 'reg') {
      return REGIONS.map(r => {
        const all = regChans.filter(c => c._reg === r.k);
        const items = all.filter(c => (state.regKind === 'all' || c._kind === state.regKind) && matches(c));
        const tv = all.filter(c => c._kind !== 'radio').length, ra = all.length - tv;
        return {
          key: r.k, code: r.code, color: r.color, title: r.k,
          sub: `${r.cap} · ${tv} TV${ra ? ` · ${ra} radios` : ''}`,
          items, total: all.length, groupBy: c => c._kind, groupLabel: k => KIND_LABEL[k],
          groupOrder: ['tv', 'otros', 'radio']
        };
      });
    }
    if (view === 'tem') {
      const legalItems = legalChans.filter(matches);
      const legal = {
        key: 'legal', code: '✔', color: '#16a34a', title: 'Alternativas legales oficiales', emoji: true,
        sub: `${legalChans.length} opciones · ESPN/TNT/DSports solo por suscripción oficial (sin piratería) · tocan para abrir el sitio`,
        items: legalItems, total: (state.theme === 'all' || state.theme === 'deportes') ? legalChans.length : 0,
        groupBy: c => c._origin, groupLabel: k => (k === 'cl' ? '🇨🇱 Chile' : '🌎 Internacionales'), groupOrder: ['cl', 'es']
      };
      return [legal, ...THEMES.map(t => {
        const all = temChans.filter(c => c._theme === t.k);
        const items = all.filter(c => (state.temOrigin === 'all' || c._origin === state.temOrigin) && matches(c));
        const cl = all.filter(c => c._origin === 'cl').length, es = all.length - cl;
        const sec = {
          key: t.k, code: t.icon, color: t.color, title: t.name, emoji: true,
          sub: [cl && `🇨🇱 ${cl} Chile`, es && `🌎 ${es} hispanos`].filter(Boolean).join(' · '),
          items, total: all.length, groupBy: c => c._origin,
          groupLabel: k => (k === 'cl' ? '🇨🇱 Chile' : '🌎 Hispanoamérica y España'), groupOrder: ['cl', 'es']
        };
        if (t.k === 'deportes') {
          sec.sub += ` · ✔ ${legalChans.length} legales · subtemas abajo`;
          sec.groupBy = sportKind;
          sec.groupLabel = k => SPORT_LABEL[k] || k;
          sec.groupOrder = SPORT_ORDER;
        }
        return sec;
      })].sort((a, b) => {
        // ⭐ la temática elegida en la columna izquierda va primero
        if (state.theme === 'all') return 0;
        if (a.key === state.theme) return -1;
        if (b.key === state.theme) return 1;
        return 0;
      });
    }
    // favoritos + recientes
    return [
      { key: 'favs', code: '★', color: '#b7860b', title: 'Favoritos', emoji: true,
        sub: favs.size ? 'Tus canales guardados' : 'Marca ☆ Favorito bajo el reproductor',
        items: [...favs].map(id => byId.get(id)).filter(Boolean).filter(matches), total: favs.size },
      { key: 'recent', code: '🕘', color: '#334155', title: 'Vistos recientemente', emoji: true,
        sub: 'Últimos canales sintonizados',
        items: recent.map(id => byId.get(id)).filter(Boolean).filter(matches), total: recent.length }
    ];
  }

  /* ---------- Render ---------- */
  const chHTML = (c, sec) => {
    const ti = (THEMES.find(t => t.groups.includes(c.group)) || { icon: '📡' }).icon;
    const sub = sec === 'reg'
      ? `${ti} ` + ((c.note || '').split('·')[0].trim() || c.group)
      : c._reg ? `${ti} ${c._reg} · ${c.group}` : `${c._origin === 'es' ? '🌎' : '🇨🇱'} ${ti} ${c.group}${c.note ? ' · ' + c.note.split('·')[0].trim() : ''}`;
    return `<button class="ch ${current && current.id === c.id ? 'on' : ''} ${c.url ? '' : 'dis'}" data-id="${esc(c.id)}" title="${esc(dispName(c))} (${esc(paisName(c.cc))})${renames[c.id] ? ' · original: ' + esc(c.name) : ''}">
      <span class="cflag" title="${esc(paisName(c.cc))}">${c._flag}<span class="ccname">${esc(paisName(c.cc))}</span></span><span class="logo" style="background:${esc(c.color || '#334155')}">${esc((c.abbr || c.name || '?').slice(0, 4))}</span>
      <span class="meta"><span class="nm">${esc(dispName(c))}${renames[c.id] ? ' <span style="opacity:.55;font-size:11px">(renombrado)</span>' : ''}</span><span class="sb">${esc(sub)}</span></span>
      <span class="eq"><i></i><i></i><i></i></span>
      ${favs.has(c.id) ? '<span class="star">★</span>' : ''}
    </button>`;
  };

  function sectionBody(s) {
    const showAll = state.expanded.has(state.view + ':' + s.key) || state.query;
    let html = '';
    if (s.groupBy) {
      const buckets = {};
      s.items.forEach(c => { (buckets[s.groupBy(c)] ||= []).push(c); });
      const keys = s.groupOrder.filter(k => buckets[k]);
      let shown = 0;
      for (const k of keys) {
        if (!showAll && shown >= PAGE) break;
        const arr = showAll ? buckets[k] : buckets[k].slice(0, PAGE - shown);
        shown += arr.length;
        if (keys.length > 1) html += `<div class="sub-h">${s.groupLabel(k)} · ${buckets[k].length}</div>`;
        html += arr.map(c => chHTML(c, state.view)).join('');
      }
      if (!showAll && s.items.length > PAGE) html += `<button class="more" data-more="${esc(s.key)}">Ver los ${s.items.length} canales ▾</button>`;
    } else {
      html = s.items.map(c => chHTML(c, state.view)).join('');
    }
    return html || `<div class="empty">${state.view === 'fav' ? 'Aún no hay canales aquí.' : 'Sin canales con este filtro.'}</div>`;
  }

  let lastSections = [];

  /* =====================================================================
     2-bis. COLUMNA IZQUIERDA: selector de TEMÁTICAS
     ===================================================================== */
  function renderThemes() {
    // filtro de origen (CL / ES) aplicado a las temáticas
    const items = THEMES.map(t => {
      const all = temChans.filter(c => c._theme === t.k);
      const cl = all.filter(c => c._origin === 'cl').length;
      const es = all.length - cl;
      let n = all.length;
      if (state.temOrigin === 'cl') n = cl;
      else if (state.temOrigin === 'es') n = es;
      if (state.query) n = all.filter(c => c._q.includes(state.query)).length;
      return { t, n, cl, es, all };
    });
    const total = items.reduce((a, x) => a + x.n, 0);
    $('#tCount').textContent = state.theme === 'all'
      ? `${total} canales`
      : `${items.find(x => x.t.k === state.theme)?.n || 0} canales`;

    $('#tSub').innerHTML = [['all', 'Todas'], ['cl', '🇨🇱 Chile'], ['es', '🌎 Hispanos']]
      .map(([k, l]) => `<button data-torigin="${k}" class="${state.temOrigin === k ? 'on' : ''}">${l}</button>`).join('');

    const hasCur = current && (current._theme === state.theme || (state.theme === 'all' && current._theme));
    $('#tBody').innerHTML = `
      <button class="tcard ${state.theme === 'all' ? 'on' : ''}" data-theme="all">
        <span class="ic" style="background:#1a2237">🎛️</span>
        <span class="tt"><b>Todas las temáticas</b><small>sin filtro · ${chans.length} canales</small></span>
        <span class="n">${chans.length}</span>
      </button>` + items.map(({ t, n, cl, es }) => `
      <button class="tcard ${state.theme === t.k ? 'on' : ''} ${hasCur && current?._theme === t.k ? 'has-cur' : ''}" data-theme="${t.k}">
        <span class="ic" style="background:${t.color}22;color:${t.color}">${t.icon}</span>
        <span class="tt"><b>${esc(t.name)}</b><small>${cl ? `🇨🇱 ${cl}` : ''}${cl && es ? ' · ' : ''}${es ? `🌎 ${es}` : ''}${!cl && !es ? '—' : ''}</small></span>
        <span class="n">${n}</span>
      </button>`).join('');
  }

  function render() {
    const view = state.view;
    const secs = sectionsFor(view);
    const visibleSecs = state.query ? secs.filter(s => s.items.length) : secs.filter(s => view === 'fav' || s.total);
    // ⭐ con una temática seleccionada (columna izquierda), la derecha muestra solo esa
    const shownSecs = (view === 'tem' && state.theme !== 'all')
      ? visibleSecs.filter(s => s.key === state.theme || (s.key === 'legal' && state.theme === 'deportes'))
      : visibleSecs;
    lastSections = shownSecs;

    // Subfiltros
    const sub = $('#gSub');
    if (view === 'reg') {
      sub.innerHTML = [['all', 'Todo'], ['tv', '📺 Solo TV'], ['radio', '📻 Solo radios']]
        .map(([k, l]) => `<button data-kind="${k}" class="${state.regKind === k ? 'on' : ''}">${l}</button>`).join('')
        + `<span class="sp"></span><button class="lnk" data-all="1">${secs.every(s => !s.total || state.open.reg.has(s.key)) ? 'Contraer todo' : 'Abrir todo'}</button>`;
    } else if (view === 'tem') {
      sub.innerHTML = [['all', 'Todos'], ['cl', '🇨🇱 Chile'], ['es', '🌎 Hispanos']]
        .map(([k, l]) => `<button data-origin="${k}" class="${state.temOrigin === k ? 'on' : ''}">${l}</button>`).join('')
        + `<span class="sp"></span><button class="lnk" data-all="1">${secs.every(s => !s.total || state.open.tem.has(s.key)) ? 'Contraer todo' : 'Abrir todo'}</button>`;
    } else sub.innerHTML = '';

    const body = $('#gBody');
    if (!shownSecs.length) {
      const other = view === 'reg' ? 'tem' : 'reg';
      const n = state.query ? chans.filter(c => (other === 'reg' ? c._reg : !c._reg) && matches(c)).length : 0;
      body.innerHTML = `<div class="empty">Sin resultados para “${esc(state.query)}”.${n ? `<br><br><button class="more" data-goto="${other}">Ver ${n} resultado(s) en ${other === 'reg' ? '📍 Regiones' : '🎭 Temáticas'} →</button>` : ''}</div>`;
    } else {
      body.innerHTML = shownSecs.map(s => {
        const open = state.query || state.open[view].has(s.key);
        const hasCur = current && s.items.some(c => c.id === current.id);
        return `<section class="sec ${open ? 'open' : ''} ${hasCur ? 'has-cur' : ''}" data-sec="${esc(s.key)}">
          <button class="sec-h" data-toggle="${esc(s.key)}" aria-expanded="${!!open}">
            <span class="code" style="background:${s.emoji ? 'transparent;font-size:17px' : s.color}">${s.code}</span>
            <span class="ttl"><b>${esc(s.title)}</b><small>${esc(s.sub)}</small></span>
            <span class="cnt">${s.items.length}${s.items.length !== s.total && view !== 'fav' ? '/' + s.total : ''}</span>
            <span class="chev">▶</span>
          </button>
          <div class="sec-b">${open ? sectionBody(s) : ''}</div>
        </section>`;
      }).join('');
    }

    // Contadores
    $('#nReg').textContent = regChans.length;
    $('#nTem').textContent = temChans.length;
    $('#nFav').textContent = favs.size || '';
    [...$('#seg').children].forEach(b => b.classList.toggle('on', b.dataset.v === view));
    const shownCount = shownSecs.reduce((a, s) => a + s.items.length, 0);
    const nSec = shownSecs.filter(s => s.items.length).length;
    const temaSel = state.theme !== 'all' ? (THEMES.find(t => t.k === state.theme) || {}).name : null;
    $('#gCount').textContent = view === 'reg'
      ? `${shownCount} canales en ${nSec} regiones`
      : view === 'tem'
        ? (temaSel ? `${shownCount} canales · ${temaSel}` : `${shownCount} canales en ${nSec} temáticas`)
        : `${favs.size} favoritos · ${recent.length} recientes`;

    renderThemes();
  }

  /* ---------- Eventos de la columna izquierda (temáticas) ---------- */
  let qT;
  $('#tBody').addEventListener('click', e => {
    const b = e.target.closest('[data-theme]'); if (!b) return;
    state.theme = b.dataset.theme;
    saveUi();
    // al elegir una temática, la vista de la derecha salta a "Temáticas" para ver sus canales
    if (state.theme !== 'all') {
      state.view = 'tem';
      state.open.tem.add(state.theme);
      state.expanded.add('tem:' + state.theme);
    }
    render();
    $('#gBody').scrollTop = 0;
    toast(state.theme === 'all'
      ? 'Mostrando todos los canales'
      : `Temática: ${(THEMES.find(t => t.k === state.theme) || {}).name}`);
  });
  $('#tSub').addEventListener('click', e => {
    const b = e.target.closest('[data-torigin]'); if (!b) return;
    state.temOrigin = b.dataset.torigin; saveUi(); render();
  });
  $('#q').addEventListener('input', e => {
    clearTimeout(qT);
    qT = setTimeout(() => { state.query = norm(e.target.value.trim()); render(); }, 120);
  });

  /* ---------- Eventos del panel ---------- */
  $('#seg').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    state.view = b.dataset.v; saveUi(); render(); $('#gBody').scrollTop = 0;
  });
  $('#gSub').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.kind) state.regKind = b.dataset.kind;
    if (b.dataset.origin) state.temOrigin = b.dataset.origin;
    if (b.dataset.all) {
      const set = state.open[state.view];
      const keys = sectionsFor(state.view).filter(s => s.total).map(s => s.key);
      const allOpen = keys.every(k => set.has(k));
      keys.forEach(k => allOpen ? set.delete(k) : set.add(k));
    }
    saveUi(); render();
  });
  $('#gBody').addEventListener('click', e => {
    const t = e.target.closest('[data-toggle],[data-more],[data-goto],.ch'); if (!t) return;
    if (t.dataset.toggle) {
      const set = state.open[state.view], k = t.dataset.toggle;
      set.has(k) ? set.delete(k) : set.add(k);
      saveUi(); render();
      if (set.has(k)) document.querySelector(`.sec[data-sec="${CSS.escape(k)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else if (t.dataset.more) {
      state.expanded.add(state.view + ':' + t.dataset.more); render();
    } else if (t.dataset.goto) {
      state.view = t.dataset.goto; saveUi(); render();
    } else {
      play(byId.get(t.dataset.id));
    }
  });

  // Lista plana (orden del panel) para el zapping con ↑ / ↓
  function zapList() {
    const view = state.view;
    let list = [];
    lastSections.forEach(s => { if (state.query || state.open[view].has(s.key)) list.push(...orderInSection(s)); });
    if (current && !list.some(c => c.id === current.id)) {
      const s = lastSections.find(x => x.items.some(c => c.id === current.id));
      if (s) list = orderInSection(s);
    }
    list = list.filter(c => themeFilter(c));
    if (!list.length) list = lastSections.flatMap(orderInSection).filter(c => themeFilter(c));
    return list;
  }
  function orderInSection(s) {
    if (!s.groupBy) return s.items;
    const out = [];
    s.groupOrder.forEach(k => out.push(...s.items.filter(c => s.groupBy(c) === k)));
    return out;
  }

  // Al sintonizar un canal, abrir su sección en el panel
  function reveal(ch) {
    if (state.view === 'reg' && ch._reg) state.open.reg.add(ch._reg);
    else if (state.view === 'tem' && ch._theme) state.open.tem.add(ch._theme);
    else if (state.view !== 'fav') { state.view = ch._reg ? 'reg' : 'tem'; state.open[state.view].add(ch._reg || ch._theme); }
    // ⭐ sincronizar la columna izquierda de temáticas con el canal actual
    if (ch._theme && state.theme !== 'all' && state.theme !== ch._theme) state.theme = ch._theme;
    const s = sectionsFor(state.view).find(x => x.key === (ch._reg || ch._theme));
    if (s) {
      const idx = orderInSection(s).findIndex(c => c.id === ch.id);
      if (idx >= PAGE) state.expanded.add(state.view + ':' + s.key);
    }
    saveUi();
  }

  /* =====================================================================
     3. REPRODUCTOR — sintonía automática, sin botón de reproducir
     ===================================================================== */
  let hls = null, playToken = 0;
  video.autoplay = true;
  const unmuteBtn = $('#unmuteBtn');

  video.addEventListener('playing', () => { overlay.classList.add('hide'); $('#dot').classList.add('live'); });
  video.addEventListener('waiting', () => $('#dot').classList.remove('live'));
  video.addEventListener('volumechange', () => { if (!video.muted) unmuteBtn.hidden = true; });

  function startPlayback(token) {
    const p = video.play();
    if (!p || !p.catch) return;
    p.catch(err => {
      if (token !== playToken || (err && err.name === 'AbortError')) return;
      video.muted = true;
      video.play().then(() => { if (token === playToken) unmuteBtn.hidden = false; })
        .catch(() => {
          if (token !== playToken) return;
          overlay.classList.remove('hide');
          $('#ovStatus').textContent = 'Tu navegador bloqueó la reproducción automática. Toca la pantalla para sintonizar.';
        });
    });
  }

  function play(ch) {
    if (!ch) return;
    const token = ++playToken;
    current = ch;
    recent = [ch.id, ...recent.filter(id => id !== ch.id)].slice(0, 12);
    store.set('tvcl_recent', recent);
    store.set('tvcl_last', ch.id);
    reveal(ch); render();
    requestAnimationFrame(() => document.querySelector(`.ch[data-id="${CSS.escape(ch.id)}"]`)?.scrollIntoView({ block: 'nearest' }));

    $('#nowName').textContent = dispName(ch);
    const nf = $('#nowFlag'); if (nf) nf.textContent = ch._flag || '';
    const nc = $('#nowCountry'); if (nc) nc.textContent = paisName(ch.cc);
    $('#nowGroup').textContent = [ch._reg ? `Región de ${ch._reg}` : (THEMES.find(t => t.k === ch._theme) || {}).name, ch.note].filter(Boolean).join(' · ');
    $('#ovLogo').textContent = (ch.abbr || ch.name).slice(0, 4);
    $('#ovLogo').style.background = ch.color || '#1b2440';
    $('#ovName').textContent = dispName(ch);
    $('#ovNote').textContent = ch.note || '';
    $('#webBtn').hidden = !ch.web; if (ch.web) $('#webBtn').href = ch.web;
    $('#favBtn').textContent = favs.has(ch.id) ? '★ Favorito' : '☆ Favorito';
    $('#dot').classList.remove('live');
    overlay.classList.remove('hide');
    unmuteBtn.hidden = true;

    if (hls) { hls.destroy(); hls = null; }
    video.removeAttribute('src'); video.load();

    const onFail = m => {
      if (token !== playToken) return;
      overlay.classList.remove('hide');
      $('#dot').classList.remove('live');
      $('#ovStatus').textContent = m;
    };
    if (!ch.url) {
      if (ch.web) { window.open(ch.web, '_blank', 'noopener'); toast('✔ Abriendo sitio oficial: ' + dispName(ch)); render(); return; }
      return onFail('Este canal solo se ve en su sitio oficial.');
    }
    $('#ovStatus').innerHTML = '<span class="spin"></span> Sintonizando…';

    if (window.Hls && Hls.isSupported()) {
      hls = new Hls({ lowLatencyMode: true, maxBufferLength: 20 });
      hls.attachMedia(video);
      hls.loadSource(ch.url);
      startPlayback(token);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { if (video.paused) startPlayback(token); });
      let recovered = false;
      hls.on(Hls.Events.ERROR, (_, d) => {
        if (!d.fatal || token !== playToken) return;
        if (!recovered && d.type === Hls.ErrorTypes.MEDIA_ERROR) { recovered = true; hls.recoverMediaError(); return; }
        hls.destroy(); hls = null;
        onFail('No se pudo cargar la señal (caída, geobloqueo o CORS). Prueba el sitio oficial o ábrelo en VLC.');
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = ch.url;
      startPlayback(token);
      video.addEventListener('error', () => onFail('No se pudo cargar la señal.'), { once: true });
    } else {
      onFail('Tu navegador no soporta HLS. Copia la URL y ábrela en VLC.');
    }
  }

  // Si el navegador bloqueó el autoplay, basta tocar la pantalla
  $('#screen').addEventListener('click', () => {
    if (!current || !current.url || !video.paused) return;
    video.muted = false;
    video.play().catch(() => { video.muted = true; video.play().catch(() => toast('No fue posible reproducir aquí. Usa VLC.')); });
  });
  unmuteBtn.addEventListener('click', e => {
    e.stopPropagation();
    video.muted = false; video.volume = Math.max(video.volume, 0.6);
    unmuteBtn.hidden = true;
  });

  // Zapping ↑ / ↓ siguiendo el orden del panel
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const v = zapList(); if (!v.length) return;
    e.preventDefault();
    let i = current ? v.findIndex(c => c.id === current.id) : -1;
    i = e.key === 'ArrowDown' ? (i + 1) % v.length : (i - 1 + v.length) % v.length;
    play(v[i]);
  });

  $('#copyBtn').addEventListener('click', () => {
    if (!current || !current.url) return toast('Elige un canal primero');
    navigator.clipboard?.writeText(current.url).then(() => toast('URL copiada ✔'), () => toast(current.url));
  });
  $('#vlcBtn').addEventListener('click', () => toast('VLC → Medio → Abrir ubicación de red → pega la URL copiada'));
  $('#favBtn').addEventListener('click', () => {
    if (!current) return toast('Elige un canal primero');
    favs.has(current.id) ? favs.delete(current.id) : favs.add(current.id);
    saveFavs();
    $('#favBtn').textContent = favs.has(current.id) ? '★ Favorito' : '☆ Favorito';
    render();
  });

  // ✏️ Renombrar canal (vacío = vuelve al nombre original)
  $('#renBtn').addEventListener('click', () => {
    if (!current) return toast('Elige un canal primero');
    const nn = prompt('Nuevo nombre para "' + dispName(current) + '"\n(deja vacío para volver al original: "' + current.name + '")', renames[current.id] || '');
    if (nn === null) return;
    const v = nn.trim();
    if (v && v !== current.name) { renames[current.id] = v; toast('✏️ Renombrado: ' + v); }
    else { delete renames[current.id]; toast('Nombre restaurado al original'); }
    saveRenames();
    current._q = norm([current.name, dispName(current), current.region, current.group, current._reg || '', current.cc || '', current.note].join(' '));
    $('#nowName').textContent = dispName(current);
    $('#ovName').textContent = dispName(current);
    render();
  });

  /* ---------- Descargar la vista actual como M3U (group-title = región o temática) ---------- */
  $('#dl').addEventListener('click', () => {
    const body = ['#EXTM3U'];
    let n = 0;
    lastSections.forEach(s => orderInSection(s).forEach(c => {
      if (!c.url) return;
      const g = state.view === 'reg' ? `Región ${s.title}` : s.title;
      body.push(`#EXTINF:-1 tvg-id="${c.id}" group-title="${g.replace(/"/g, '')}",${dispName(c)}`, c.url); n++;
    }));
    const blob = new Blob([body.join('\n') + '\n'], { type: 'audio/x-mpegurl' });
    const a = document.createElement('a');
    const tname = state.theme !== 'all' ? (THEMES.find(t => t.k === state.theme) || {}).name : null;
    a.href = URL.createObjectURL(blob);
    a.download = state.view === 'reg' ? 'tv-chile-regiones.m3u' : state.view === 'tem' ? 'tv-chile-tematicas.m3u' : 'tv-chile-favoritos.m3u';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(`Playlist descargada (${n} canales)${tname ? ' · ' + tname : ''}`);
  });

  /* ---------- Deportes legales + estadísticas ---------- */
  $('#sports').innerHTML = sports.map(s => `
    <a class="sport" href="${esc(s.url)}" target="_blank" rel="noopener">
      <span><b>${esc(s.name)}</b><small>${esc(s.desc)}</small></span>
      <span class="tag ${s.type === 'Gratis' ? 'free' : 'paid'}">${esc(s.type)}</span>
    </a>`).join('');
  const nRegs = new Set(regChans.map(c => c._reg)).size;
  $('#topStats').innerHTML = `<span><b>${chans.length}</b> canales</span><span><b>${regChans.length}</b> regionales · ${nRegs} regiones</span><span><b>${temChans.length}</b> por temática</span><span class="upd">🔄 actualizado 01-nov-2026 · v3.120 (incluye 8 servicios OTT 🌐)</span>`;
  $('#gFoot').textContent = 'Solo señales abiertas https · sanitizado (iptv-org + m3u.cl + 6 fuentes)';
  $('#tFoot').textContent = 'Elige una temática para filtrar los canales →';

  render();

  // Al abrir la página, se vuelve a sintonizar el último canal visto
  const last = byId.get(store.get('tvcl_last', null)) || byId.get(localStorage.getItem('tvcl_last'));
  if (last) play(last);
})();
