/**
 * Hype-Træet – script.js
 * ========================
 * Indlæser data.json og tegner et interaktivt SVG-karriere-træ.
 *
 * Indholdsfortegnelse:
 *  1. Konstanter & konfiguration
 *  2. DOM-hjælpere
 *  3. Data-loading
 *  4. Profil-rendering
 *  5. Træ-rendering (stamme, rødder, grene, blade)
 *  6. Tooltip-logik
 *  7. Partikel-effekter
 *  8. Dark/light mode toggle
 *  9. Del-modal
 * 10. Init
 */

/* ============================================================
   1. KONSTANTER & KONFIGURATION
   ============================================================ */

/** Farvekort: branch-id → CSS-variabel-navn */
const BRANCH_COLORS = {
  skills:       'var(--accent-green)',
  achievements: 'var(--accent-gold)',
  feedback:     'var(--accent-violet)',
  learning:     'var(--accent-sky)',
};

/** Ikon per leaf-type */
const TYPE_ICONS = {
  skill:       '⚡',
  achievement: '🏆',
  feedback:    '💬',
  learning:    '📚',
};

/** SVG viewport */
const SVG_W = 860;
const SVG_H = 680;

/** Stamme-dimensioner */
const TRUNK = {
  x:        SVG_W / 2,
  baseY:    SVG_H - 60,
  topY:     SVG_H - 260,
  width:    36,
  topWidth: 20,
};

/* ============================================================
   2. DOM-HJÆLPERE
   ============================================================ */

/** Opretter et SVG-element med givne attributter */
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

/** Formaterer en dato-streng (ISO → "15. mar 2023") */
function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Genererer stjerne-streng ("★★★☆☆") for niveau 1-5 */
function stars(level = 3, max = 5) {
  return '★'.repeat(level) + '☆'.repeat(max - level);
}

/* ============================================================
   3. DATA-LOADING
   ============================================================ */

async function loadData() {
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Kunne ikke indlæse data.json:', err);
    return null;
  }
}

/* ============================================================
   4. PROFIL-RENDERING
   ============================================================ */

function renderProfile(profile, branches) {
  const nameEl    = document.getElementById('profile-name');
  const titleEl   = document.getElementById('profile-title');
  const taglineEl = document.getElementById('profile-tagline');
  const statsEl   = document.getElementById('profile-stats');
  const legendEl  = document.getElementById('legend');

  if (profile.avatar) {
    document.getElementById('profile-avatar').textContent = profile.avatar;
  }

  nameEl.textContent    = profile.name;
  titleEl.textContent   = profile.title;
  taglineEl.textContent = profile.tagline;

  // Stats pills
  const totalLeaves = branches.reduce((n, b) => n + b.leaves.length, 0);
  const yearsActive = new Date().getFullYear() - (profile.startYear || 2020);
  const maxLevel    = Math.max(...branches.flatMap(b => b.leaves.map(l => l.level || 0)));

  statsEl.innerHTML = `
    <span class="stat-pill"><strong>${totalLeaves}</strong> blade</span>
    <span class="stat-pill"><strong>${branches.length}</strong> grene</span>
    <span class="stat-pill"><strong>${yearsActive}+</strong> år aktiv</span>
    <span class="stat-pill">Maks. <strong>${stars(maxLevel,5).slice(0,maxLevel)}</strong></span>
  `;

  // Legend
  legendEl.innerHTML = `<p class="legend-title">Kategorier</p>`;
  branches.forEach(b => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.dataset.branchId = b.id;
    item.innerHTML = `
      <span class="legend-dot" style="background:${b.color};color:${b.color};"></span>
      <span>${b.icon} ${b.label}</span>
      <small style="margin-left:auto;color:var(--text-muted)">${b.leaves.length}</small>
    `;
    // Klik på legend → highlight gren
    item.addEventListener('click', () => toggleBranch(b.id));
    legendEl.appendChild(item);
  });
}

/* ============================================================
   5. TRÆ-RENDERING
   ============================================================ */

/** Global tilstand for udfoldet gren */
const treeState = { activeBranch: null };

/** Reference til alle blade-grupper per gren */
const branchGroups = {};

/**
 * Tegner hele træet i SVG-elementet.
 */
function renderTree(data) {
  const svg = document.getElementById('tree-svg');
  svg.setAttribute('viewBox', `0 0 ${SVG_W} ${SVG_H}`);
  svg.innerHTML = '';

  // Definitioner (defs)
  renderDefs(svg, data.branches);

  // Baggrund
  renderBackground(svg);

  // Rødder
  renderRoots(svg);

  // Stamme
  renderTrunk(svg);

  // Grene + blade
  data.branches.forEach((branch, i) => renderBranch(svg, branch, i, data.branches.length));

  // Krone (bagved blade)
  renderCanopy(svg);

  // Animér blade ind
  scheduleLeafAnimation(svg);
}

/** SVG <defs>: gradienter, filtre */
function renderDefs(svg, branches) {
  const defs = svgEl('defs');

  // Trunk gradient
  const trunkGrad = svgEl('linearGradient', { id: 'trunkGrad', x1: '0%', y1: '0%', x2: '100%', y2: '0%' });
  [['0%','#5c3d1e'],['40%','#7a5230'],['60%','#6b4826'],['100%','#3b2510']]
    .forEach(([o,c]) => { const s=svgEl('stop',{offset:o}); s.style.stopColor=c; trunkGrad.appendChild(s); });
  defs.appendChild(trunkGrad);

  // Ground gradient
  const groundGrad = svgEl('radialGradient', { id: 'groundGrad', cx:'50%', cy:'50%', r:'50%' });
  [['0%','rgba(74,222,128,0.18)'],['100%','rgba(74,222,128,0)']]
    .forEach(([o,c]) => { const s=svgEl('stop',{offset:o}); s.style.stopColor=c; groundGrad.appendChild(s); });
  defs.appendChild(groundGrad);

  // Glow filters per branch
  branches.forEach(b => {
    const filter = svgEl('filter', { id: `glow-${b.id}`, x:'-50%', y:'-50%', width:'200%', height:'200%' });
    const blur   = svgEl('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '4', result: 'blur' });
    const comp   = svgEl('feComposite',    { in: 'SourceGraphic', in2: 'blur', operator: 'over' });
    filter.appendChild(blur);
    filter.appendChild(comp);
    defs.appendChild(filter);
  });

  // General glow
  const gGlow = svgEl('filter', { id: 'glow-general', x:'-30%', y:'-30%', width:'160%', height:'160%' });
  gGlow.appendChild(svgEl('feGaussianBlur', { in:'SourceGraphic', stdDeviation:'3', result:'blur' }));
  gGlow.appendChild(svgEl('feComposite',    { in:'SourceGraphic', in2:'blur', operator:'over' }));
  defs.appendChild(gGlow);

  svg.appendChild(defs);
}

/** Jord-ellipse og gress-tekstur */
function renderBackground(svg) {
  // Jord-ellipse
  const ground = svgEl('ellipse', {
    cx: SVG_W / 2,
    cy: SVG_H - 30,
    rx: 340, ry: 38,
    fill: 'url(#groundGrad)',
    class: 'ground-ellipse',
  });
  svg.appendChild(ground);

  // Gress-streger
  for (let i = 0; i < 18; i++) {
    const x = 120 + Math.random() * (SVG_W - 240);
    const y = SVG_H - 30 - Math.random() * 15;
    const h = 8 + Math.random() * 14;
    const lean = (Math.random() - 0.5) * 6;
    const blade = svgEl('path', {
      d: `M${x},${y} Q${x+lean},${y-h/2} ${x+lean*0.5},${y-h}`,
      stroke: '#2d8a50',
      'stroke-width': '1.5',
      'stroke-linecap': 'round',
      fill: 'none',
      opacity: '0.5',
    });
    svg.appendChild(blade);
  }
}

/** Rødder under stammen */
function renderRoots(svg) {
  const roots = [
    { d: `M${TRUNK.x-10},${TRUNK.baseY} Q${TRUNK.x-60},${TRUNK.baseY+20} ${TRUNK.x-120},${TRUNK.baseY+10}` },
    { d: `M${TRUNK.x+10},${TRUNK.baseY} Q${TRUNK.x+65},${TRUNK.baseY+25} ${TRUNK.x+130},${TRUNK.baseY+8}` },
    { d: `M${TRUNK.x},${TRUNK.baseY} Q${TRUNK.x-20},${TRUNK.baseY+30} ${TRUNK.x-40},${TRUNK.baseY+35}` },
    { d: `M${TRUNK.x},${TRUNK.baseY} Q${TRUNK.x+18},${TRUNK.baseY+28} ${TRUNK.x+42},${TRUNK.baseY+36}` },
  ];
  roots.forEach(r => {
    svg.appendChild(svgEl('path', { ...r, class: 'root-line' }));
  });
}

/** Stamme */
function renderTrunk(svg) {
  const cx   = TRUNK.x;
  const bY   = TRUNK.baseY;
  const tY   = TRUNK.topY;
  const hw   = TRUNK.width / 2;
  const thw  = TRUNK.topWidth / 2;

  // Hoved-stamme form
  const trunk = svgEl('path', {
    d: `M${cx-hw},${bY} C${cx-hw-4},${(bY+tY)/2} ${cx-thw-2},${tY+40} ${cx-thw},${tY}
        L${cx+thw},${tY} C${cx+thw+2},${tY+40} ${cx+hw+4},${(bY+tY)/2} ${cx+hw},${bY} Z`,
    fill: 'url(#trunkGrad)',
    class: 'trunk-main',
  });

  // Skygge-side
  const shadow = svgEl('path', {
    d: `M${cx-hw},${bY} C${cx-hw-4},${(bY+tY)/2} ${cx-thw-2},${tY+40} ${cx-thw},${tY}
        L${cx-thw+6},${tY} C${cx-thw+6},${tY+40} ${cx-hw+4},${(bY+tY)/2} ${cx-hw+8},${bY} Z`,
    fill: 'rgba(0,0,0,0.18)',
    class: 'trunk-shadow',
  });

  // Bark-detaljer
  const barkLines = [0.3, 0.5, 0.7].map(t => {
    const y   = tY + (bY - tY) * t;
    const wid = thw + (hw - thw) * t;
    return svgEl('path', {
      d: `M${cx-wid+4},${y} Q${cx},${y-8} ${cx+wid-4},${y}`,
      class: 'bark-detail',
    });
  });

  svg.appendChild(trunk);
  svg.appendChild(shadow);
  barkLines.forEach(l => svg.appendChild(l));
}

/** Baggrundskrone (grøn klat bag grenene) */
function renderCanopy(svg) {
  const cx = TRUNK.x;
  const cy = TRUNK.topY - 80;

  // Baggrundscirkel
  const c = svgEl('ellipse', {
    cx, cy,
    rx: 200, ry: 160,
    fill: 'rgba(45,138,80,0.04)',
    stroke: 'none',
  });
  svg.insertBefore(c, svg.firstChild);
}

/**
 * Tegner én gren med blade.
 * @param {SVGElement} svg
 * @param {Object}     branch  – data fra data.json
 * @param {number}     index   – grennens indeks
 * @param {number}     total   – samlet antal grene
 */
function renderBranch(svg, branch, index, total) {
  const cx   = TRUNK.x;
  const tY   = TRUNK.topY;
  const col  = branch.color;

  // Beregn grenudfald
  const angle = (branch.angle || 0) * (Math.PI / 180);

  // Startpunkt på stammen (lodret fordelt)
  const startT  = 0.15 + (index / (total - 1)) * 0.7;
  const startY  = tY + (TRUNK.baseY - tY) * (1 - startT);
  const startX  = cx + (angle < 0 ? -TRUNK.topWidth/2 : TRUNK.topWidth/2) * (0.5 + startT * 0.5);

  // Grenens endepunkt
  const length  = 140 + Math.abs(branch.angle || 0) * 0.4;
  const endX    = startX + Math.sin(angle) * length;
  const endY    = startY - Math.cos(angle) * length * 0.7;

  // Kontrol-punkt for kurvet gren
  const cpX = startX + Math.sin(angle) * length * 0.5 + (Math.random()-0.5)*20;
  const cpY = startY - Math.cos(angle) * length * 0.4;

  // Gren-linje
  const branchPath = svgEl('path', {
    d: `M${startX},${startY} Q${cpX},${cpY} ${endX},${endY}`,
    'stroke-width': '10',
    class: 'branch-line',
    style: `stroke:${col}99`,
    'data-branch': branch.id,
  });

  // Hover/klik på gren
  branchPath.addEventListener('mouseenter', () => { branchPath.style.stroke = col; });
  branchPath.addEventListener('mouseleave', () => {
    if (treeState.activeBranch !== branch.id)
      branchPath.style.stroke = `${col}99`;
  });
  branchPath.addEventListener('click', () => toggleBranch(branch.id));

  svg.appendChild(branchPath);

  // Gren-label
  renderBranchLabel(svg, branch, endX, endY, col);

  // Bladgruppe
  const group = svgEl('g', {
    class: 'leaf-cluster',
    'data-branch': branch.id,
    style: 'opacity:1',
  });
  branchGroups[branch.id] = { group, path: branchPath, color: col };

  // Fordel blade langs grenen
  branch.leaves.forEach((leaf, li) => {
    const t      = (li + 1) / (branch.leaves.length + 1);
    const lx     = startX + (endX - startX) * t + (cpX - startX * (1-t) - endX * t) * 2 * t * (1-t);
    const ly     = startY + (endY - startY) * t + (cpY - startY * (1-t) - endY * t) * 2 * t * (1-t);
    const spread = 30 + li * 6;
    const leafX  = lx + (Math.random() - 0.5) * spread;
    const leafY  = ly - 20 - Math.random() * 20;

    renderLeaf(group, leaf, branch, leafX, leafY, li);
  });

  svg.appendChild(group);
}

/** Gren-label som afrundet boks */
function renderBranchLabel(svg, branch, x, y, col) {
  const g    = svgEl('g', { class: 'branch-tag', 'data-branch': branch.id, style:'cursor:pointer' });
  const text = `${branch.icon} ${branch.label}`;

  const label = svgEl('text', {
    x: 0, y: 0,
    class: 'branch-label',
    style: `fill:${col}`,
    'text-anchor': 'middle',
  });
  label.textContent = text;

  // Midlertidigt tilføj for at måle bredde
  svg.appendChild(label);
  const bbox = label.getBBox ? label.getBBox() : { width: 80, height: 14 };
  svg.removeChild(label);

  const padX = 10, padY = 5;
  const bw   = bbox.width  + padX * 2;
  const bh   = bbox.height + padY * 2;

  // Placer etiketten lidt over endepunktet
  const lx = x;
  const ly = y - 24;

  const bg = svgEl('rect', {
    x: lx - bw/2, y: ly - bh/2 - 2,
    width: bw, height: bh,
    class: 'branch-tag-bg',
  });

  const lbl = svgEl('text', {
    x: lx, y: ly + bh/4,
    class: 'branch-label',
    style: `fill:${col}`,
    'text-anchor': 'middle',
  });
  lbl.textContent = text;

  g.appendChild(bg);
  g.appendChild(lbl);
  g.addEventListener('click', () => toggleBranch(branch.id));
  svg.appendChild(g);
}

/**
 * Tegner ét blad.
 */
function renderLeaf(group, leaf, branch, x, y, index) {
  const col    = branch.color;
  const level  = leaf.level || 3;
  const size   = 14 + level * 3;    // Størrelse baseret på niveau
  const rotate = (Math.random() - 0.5) * 60;

  const leafG = svgEl('g', {
    class: 'leaf',
    transform: `translate(${x},${y})`,
    style: `opacity:0`,   // Starter usynlig, animeres ind
    'pointer-events': 'all',
    'data-leaf': leaf.id,
    'data-branch': branch.id,
  });

  // Selve bladformen
  const shape = leafShape(size, col, level);
  leafG.appendChild(shape);

  // Stjerner for niveau (kun niveau 4+)
  if (level >= 4) {
    const star = svgEl('text', {
      x: 0, y: size * 0.7,
      class: 'leaf-stars',
      'text-anchor': 'middle',
    });
    star.textContent = '★'.repeat(level - 3);
    leafG.appendChild(star);
  }

  // Tooltip-interaktion
  leafG.addEventListener('mouseenter', (e) => showTooltip(e, leaf, branch));
  leafG.addEventListener('mousemove',  (e) => moveTooltip(e));
  leafG.addEventListener('mouseleave', ()  => hideTooltip());
  leafG.addEventListener('click',      (e) => {
    e.stopPropagation();
    hideTooltip();
    showLeafModal(leaf, branch, leafG);
  });

  // Tilføj rotation via transform
  leafG.setAttribute('transform', `translate(${x},${y}) rotate(${rotate})`);
  leafG._animIndex = index;

  group.appendChild(leafG);
}

/** Genererer bladform som SVG-path */
function leafShape(size, color, level) {
  const g = svgEl('g');

  // Simpel løvblad-form
  const path = svgEl('path', {
    d: `M0,0 C${-size*0.6},${-size} 0,${-size*1.8} 0,${-size*2}
        C0,${-size*1.8} ${size*0.6},${-size} 0,0`,
    fill: color,
    opacity: 0.85,
    stroke: 'rgba(255,255,255,0.15)',
    'stroke-width': '0.8',
    'pointer-events': 'visiblePainted',
  });

  // Midterribbe
  const rib = svgEl('line', {
    x1: 0, y1: 0,
    x2: 0, y2: -size * 1.8,
    stroke: 'rgba(255,255,255,0.25)',
    'stroke-width': '0.8',
    'pointer-events': 'visiblePainted',
  });

  // Glød for høj-niveau
  if (level >= 4) {
    path.setAttribute('filter', 'url(#glow-general)');
  }

  g.appendChild(path);
  g.appendChild(rib);
  return g;
}

/**
 * Udfolder/skjuler blade for en gren.
 */
function toggleBranch(branchId) {
  const isActive = treeState.activeBranch === branchId;
  treeState.activeBranch = isActive ? null : branchId;

  Object.entries(branchGroups).forEach(([id, { group, path, color }]) => {
    const active = treeState.activeBranch === null || id === treeState.activeBranch;
    group.style.opacity      = active ? '1' : '0.25';
    group.style.transition   = 'opacity 0.35s ease';
    path.style.stroke        = active ? color : `${color}40`;
    path.style.strokeWidth   = id === treeState.activeBranch ? '14' : '10';
  });

  // Opdater legend
  document.querySelectorAll('.legend-item').forEach(item => {
    const isFocused = item.dataset.branchId === treeState.activeBranch;
    item.style.background = isFocused ? 'var(--bg-secondary)' : '';
    item.style.fontWeight = isFocused ? '600' : '';
  });
}

/**
 * Animerer blade ind med forsinkelse.
 */
function scheduleLeafAnimation(svg) {
  const leaves = svg.querySelectorAll('.leaf');
  leaves.forEach((leaf, i) => {
    setTimeout(() => {
      leaf.style.opacity   = '1';
      leaf.style.transition = 'opacity 0.3s ease';
      leaf.classList.add('popped');
    }, 300 + i * 80);
  });
}

/* ============================================================
   6. TOOLTIP-LOGIK  (hover preview)
   ============================================================ */

const tooltip = document.getElementById('tooltip');

function showTooltip(event, leaf, branch) {
  document.getElementById('tt-icon').textContent  = TYPE_ICONS[leaf.type] || branch.icon;
  document.getElementById('tt-title').textContent = leaf.title;
  document.getElementById('tt-desc').textContent  = leaf.description;

  const metaEl = document.getElementById('tt-meta');
  const linkEl = document.getElementById('tt-link');

  // Stjerner
  const starsEl = document.querySelector('.tooltip-stars') || (() => {
    const s = document.createElement('span');
    s.className = 'tooltip-stars';
    metaEl.before(s);
    return s;
  })();
  starsEl.textContent = stars(leaf.level || 3);
  starsEl.style.color = branch.color;

  // Dato
  let dateSpan = tooltip.querySelector('.tooltip-date');
  if (!dateSpan) {
    dateSpan = document.createElement('span');
    dateSpan.className = 'tooltip-date';
    metaEl.before(dateSpan);
  }
  dateSpan.textContent = leaf.date ? `📅 ${formatDate(leaf.date)}` : '';

  // Fra (feedback)
  let fromSpan = tooltip.querySelector('.tooltip-from');
  if (!fromSpan) {
    fromSpan = document.createElement('span');
    fromSpan.className = 'tooltip-from';
    metaEl.before(fromSpan);
  }
  fromSpan.textContent = leaf.from ? `— ${leaf.from}` : '';

  // Tags
  metaEl.innerHTML = (leaf.tags || [])
    .map(t => `<span class="tooltip-tag">#${t}</span>`)
    .join('');

  // Link
  if (leaf.link) {
    linkEl.href = leaf.link;
    linkEl.classList.remove('hidden');
  } else {
    linkEl.classList.add('hidden');
  }

  // Farve accent
  tooltip.style.borderLeftColor  = branch.color;
  tooltip.style.borderLeftWidth  = '3px';
  tooltip.style.borderLeftStyle  = 'solid';

  // Hint om at klikke
  let hintSpan = tooltip.querySelector('.tooltip-click-hint');
  if (!hintSpan) {
    hintSpan = document.createElement('p');
    hintSpan.className = 'tooltip-click-hint';
    hintSpan.style.cssText = 'font-size:0.68rem;color:var(--text-muted);margin-top:0.5rem;';
    tooltip.appendChild(hintSpan);
  }
  hintSpan.textContent = '🖱 Klik for fuld detaljevisning';

  tooltip.classList.add('visible');
  tooltip.setAttribute('aria-hidden', 'false');
  moveTooltip(event);
}

function moveTooltip(event) {
  const pad = 16;
  const tw  = tooltip.offsetWidth  || 260;
  const th  = tooltip.offsetHeight || 120;
  let   tx  = event.clientX + pad;
  let   ty  = event.clientY - th / 2;

  if (tx + tw > window.innerWidth  - pad) tx = event.clientX - tw - pad;
  if (ty < pad)                           ty = pad;
  if (ty + th > window.innerHeight - pad) ty = window.innerHeight - th - pad;

  tooltip.style.left = `${tx}px`;
  tooltip.style.top  = `${ty}px`;
}

function hideTooltip() {
  tooltip.classList.remove('visible');
  tooltip.setAttribute('aria-hidden', 'true');
}

// Skjul tooltip ved klik på baggrunden
document.addEventListener('click', (e) => {
  if (!e.target.closest('.leaf') && !e.target.closest('.tooltip')) {
    hideTooltip();
  }
});

/* ============================================================
   6b. LEAF DETAIL MODAL  (klik → fuld visning)
   ============================================================ */

/** Holder styr på det sidst åbnede blad-element (til puls-animation) */
let activeLeafEl = null;

/**
 * Åbner leaf-detail-modalen med alle oplysninger om bladet.
 * @param {Object}     leaf    – blade-data fra data.json
 * @param {Object}     branch  – forældregren
 * @param {SVGElement} leafEl  – SVG-element der blev klikket
 */
function showLeafModal(leaf, branch, leafEl) {
  console.log('🌳 Opening leaf modal for:', leaf.title, 'in branch:', branch.label);
  const modal = document.getElementById('leaf-modal');

  // --- Banner ---
  const banner = document.getElementById('lm-banner');
  // Sæt gradient-baggrund fra grenens farve
  banner.style.background = `linear-gradient(135deg, ${branch.color}cc 0%, ${branch.color}66 100%)`;

  document.getElementById('lm-type-icon').textContent = TYPE_ICONS[leaf.type] || branch.icon;
  document.getElementById('lm-category').textContent  = `${branch.icon} ${branch.label}`;
  document.getElementById('lm-date').textContent      = leaf.date ? `📅 ${formatDate(leaf.date)}` : '';

  // Niveau-prikker
  const levelEl = document.getElementById('lm-level');
  levelEl.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const dot = document.createElement('span');
    dot.className = `level-dot${i <= (leaf.level || 3) ? ' filled' : ''}`;
    levelEl.appendChild(dot);
  }

  // --- Titel ---
  document.getElementById('lm-title').textContent = leaf.title;

  // --- Fra ---
  const fromEl = document.getElementById('lm-from');
  if (leaf.from) {
    fromEl.textContent = `— ${leaf.from}`;
    fromEl.classList.add('visible');
  } else {
    fromEl.textContent = '';
    fromEl.classList.remove('visible');
  }

  // --- Beskrivelse ---
  document.getElementById('lm-desc').textContent = leaf.description || '';

  // --- Tags ---
  const tagsEl = document.getElementById('lm-tags');
  tagsEl.innerHTML = (leaf.tags || [])
    .map(t => `<span class="leaf-modal-tag">#${t}</span>`)
    .join('');

  // Skjul divider hvis ingen tags
  document.getElementById('lm-divider').style.display =
    (leaf.tags && leaf.tags.length) ? '' : 'none';

  // --- Niveau-bar ---
  const levelPct = ((leaf.level || 3) / 5) * 100;
  document.getElementById('lm-level-num').textContent = `${leaf.level || 3} / 5`;
  const fill = document.getElementById('lm-level-fill');
  fill.style.background = branch.color;
  fill.style.boxShadow  = `0 0 8px ${branch.color}88`;
  // Reset og re-animér
  fill.style.width = '0%';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { fill.style.width = `${levelPct}%`; });
  });

  // --- Link ---
  const linkEl = document.getElementById('lm-link');
  if (leaf.link) {
    linkEl.href = leaf.link;
    linkEl.classList.remove('hidden');
    // Farv link-knap efter gren
    linkEl.style.color       = branch.color;
    linkEl.style.borderColor = `${branch.color}55`;
  } else {
    linkEl.classList.add('hidden');
  }

  // --- Åbn modal ---
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');

  // Puls-animation på bladet
  if (activeLeafEl) activeLeafEl.classList.remove('active-leaf');
  activeLeafEl = leafEl;
  leafEl.classList.remove('active-leaf');
  void leafEl.offsetWidth; // reflow for at genstarte animation
  leafEl.classList.add('active-leaf');

  // Fokus til luk-knap (tilgængelighed)
  document.getElementById('leaf-modal-close').focus();
}

/** Lukker leaf-modal */
function closeLeafModal() {
  const modal = document.getElementById('leaf-modal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  if (activeLeafEl) {
    activeLeafEl.classList.remove('active-leaf');
    activeLeafEl = null;
  }
}

/** Initialiserer leaf-modal-lyttere */
function initLeafModal() {
  document.getElementById('leaf-modal-close')
    .addEventListener('click', closeLeafModal);

  document.getElementById('leaf-modal')
    .addEventListener('click', (e) => {
      if (e.target === document.getElementById('leaf-modal')) closeLeafModal();
    });

  // Escape-tast lukker modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLeafModal();
  });
}

/* ============================================================
   7. PARTIKEL-EFFEKTER
   ============================================================ */

function spawnParticles(branches) {
  const layer  = document.getElementById('particle-layer');
  const colors = branches.map(b => b.color);

  function createParticle() {
    const p = document.createElement('div');
    p.className = 'particle';
    const size  = 4 + Math.random() * 6;
    const col   = colors[Math.floor(Math.random() * colors.length)];
    const left  = 20 + Math.random() * 60;
    const top   = 20 + Math.random() * 50;
    const delay = Math.random() * 4;

    Object.assign(p.style, {
      width:  `${size}px`,
      height: `${size}px`,
      left:   `${left}%`,
      top:    `${top}%`,
      background: col,
      boxShadow:  `0 0 ${size}px ${col}`,
      animationDelay:    `${delay}s`,
      animationDuration: `${3 + Math.random() * 3}s`,
    });

    layer.appendChild(p);

    // Fjern partikel efter animation
    setTimeout(() => p.remove(), (delay + 6) * 1000);
  }

  // Start kontinuerlig partikel-spawn
  function loop() {
    createParticle();
    setTimeout(loop, 600 + Math.random() * 800);
  }
  loop();
}

/* ============================================================
   8. DARK/LIGHT MODE TOGGLE
   ============================================================ */

function initThemeToggle() {
  const btn      = document.getElementById('theme-toggle');
  const iconEl   = btn.querySelector('.theme-icon');
  const prefDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  let   isDark   = localStorage.getItem('hype-theme') !== 'light' && prefDark !== false;

  function applyTheme() {
    document.body.classList.toggle('dark-mode',  isDark);
    document.body.classList.toggle('light-mode', !isDark);
    iconEl.textContent    = isDark ? '☀️' : '🌙';
    localStorage.setItem('hype-theme', isDark ? 'dark' : 'light');
  }

  // Anvend gemt præference
  const saved = localStorage.getItem('hype-theme');
  if (saved === 'light') isDark = false;
  if (saved === 'dark')  isDark = true;
  applyTheme();

  btn.addEventListener('click', () => {
    isDark = !isDark;
    applyTheme();
  });
}

/* ============================================================
   9. DEL-MODAL
   ============================================================ */

function initShareModal(profile) {
  const shareBtn    = document.getElementById('share-btn');
  const modal       = document.getElementById('share-modal');
  const closeBtn    = document.getElementById('modal-close');
  const copyBtn     = document.getElementById('share-copy');
  const liBtn       = document.getElementById('share-linkedin');
  const twBtn       = document.getElementById('share-twitter');

  const pageUrl     = encodeURIComponent(window.location.href);
  const shareText   = encodeURIComponent(`Tjek mit Hype-Træ – min karriere som et voksende træ 🌳 ${profile?.name ? '– ' + profile.name : ''}`);

  liBtn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`;
  twBtn.href = `https://twitter.com/intent/tweet?text=${shareText}&url=${pageUrl}`;

  shareBtn.addEventListener('click',  () => { modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); });
  closeBtn.addEventListener('click',  () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); });
  modal.addEventListener('click',     (e) => { if (e.target === modal) { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); } });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      copyBtn.innerHTML = '<span>✅</span> Kopieret!';
      setTimeout(() => { copyBtn.innerHTML = '<span>🔗</span> Kopier link'; }, 2000);
    } catch {
      copyBtn.innerHTML = '<span>❌</span> Fejl';
    }
  });
}

/* ============================================================
   10. INIT
   ============================================================ */

async function init() {
  // Vis loading-spinner
  const treeContainer = document.getElementById('tree-container');
  const loadingDiv    = document.createElement('div');
  loadingDiv.className = 'loading-overlay';
  loadingDiv.innerHTML = '<div class="loading-spinner">🌱</div>';
  treeContainer.appendChild(loadingDiv);

  // Initialiser tema
  initThemeToggle();

  // Indlæs data
  const data = await loadData();

  if (!data) {
    loadingDiv.innerHTML = '<p style="color:var(--accent-rose);font-size:0.85rem;padding:1rem;">Kunne ikke indlæse data.json</p>';
    return;
  }

  // Skjul loader
  loadingDiv.style.opacity = '0';
  setTimeout(() => loadingDiv.remove(), 500);

  // Render
  renderProfile(data.profile, data.branches);
  renderTree(data);
  spawnParticles(data.branches);
  initShareModal(data.profile);
  initLeafModal();

  // Demo: Åbn modalen med det første læring-blad
  const learningBranch = data.branches.find(b => b.id === 'learning');
  if (learningBranch && learningBranch.leaves.length > 0) {
    setTimeout(() => {
      console.log('📖 Auto-opening learning example modal...');
      const firstLeaf = learningBranch.leaves[0];
      showLeafModal(firstLeaf, learningBranch);
    }, 800);
  }
}

// Start når DOM er klar
document.addEventListener('DOMContentLoaded', init);
