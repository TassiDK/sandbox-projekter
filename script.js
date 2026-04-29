/**
 * Hype-Træet – script.js (v3)
 * ============================
 * Stamme + grene: SVG
 * Blade:          HTML <div> positioneret absolut over SVG
 *
 * Denne tilgang er 100% browser-kompatibel og kræver ingen
 * SVG-path-rendering af blade.
 */

/* ── DATA (inline fallback – spejl af data.json) ── */
const FALLBACK = {
  profile: {
    name: "Alex Møller", title: "Full Stack Developer",
    tagline: "Bygger fremtiden én commit ad gangen",
    avatar: "🧑‍💻", startYear: 2020
  },
  branches: [
    { id:"skills", label:"Kompetencer", icon:"⚡", color:"#4ade80", angle:-55, leaves:[
      { id:"s1", title:"React & TypeScript", description:"Avanceret komponent-arkitektur, hooks og performance-optimering.", date:"2021-03-15", level:5, type:"skill", tags:["frontend","javascript"] },
      { id:"s2", title:"Node.js & Express", description:"REST API-design, middleware og skalerbar backend-arkitektur.", date:"2020-08-10", level:4, type:"skill", tags:["backend","javascript"] },
      { id:"s3", title:"PostgreSQL", description:"Komplekse forespørgsler, indeksering og databaseoptimering.", date:"2021-01-20", level:4, type:"skill", tags:["database","backend"] },
      { id:"s4", title:"Docker & Kubernetes", description:"Containerisering og orkestrering af mikrotjenester i produktion.", date:"2022-06-05", level:3, type:"skill", tags:["devops","cloud"] }
    ]},
    { id:"achievements", label:"Bedrifter", icon:"🏆", color:"#fbbf24", angle:-18, leaves:[
      { id:"a1", title:"Lancerede SaaS-produkt", description:"Byggede og lancerede et SaaS-produkt fra bunden med 500+ aktive brugere.", date:"2023-04-01", level:5, type:"achievement", link:"https://example.com", tags:["produkt","entrepreneurship"] },
      { id:"a2", title:"Open Source Bidrag", description:"Bidrag til React Query accepteret med 200+ GitHub-stjerner.", date:"2022-11-15", level:4, type:"achievement", link:"https://github.com", tags:["open source","community"] },
      { id:"a3", title:"Tech Talk på JavaZone", description:"Holdt foredrag om mikrofrontend-arkitektur for 300+ deltagere.", date:"2023-09-06", level:5, type:"achievement", tags:["speaking","community"] }
    ]},
    { id:"feedback", label:"Anerkendelse", icon:"💬", color:"#a78bfa", angle:18, leaves:[
      { id:"f1", title:'"Exceptionel kodekvalitet"', description:'Fra Sarah Jensen: "Alex skriver den reneste, mest vedligeholdbare kode på teamet."', date:"2023-12-01", level:5, type:"feedback", from:"Sarah Jensen, Tech Lead", tags:["code quality","teamwork"] },
      { id:"f2", title:'"Born problemløser"', description:'Fra Mads Christensen: "Alex løste et kritisk produktionsproblem på rekordtid."', date:"2023-08-14", level:4, type:"feedback", from:"Mads Christensen, CEO", tags:["problem-solving"] },
      { id:"f3", title:"Årets Medarbejder 2023", description:"Tildelt årets medarbejderpris for ekstraordinær indsats og teamspirit.", date:"2024-01-10", level:5, type:"feedback", from:"Hele holdet", tags:["award","recognition"] }
    ]},
    { id:"learning", label:"Læring", icon:"📚", color:"#38bdf8", angle:55, leaves:[
      { id:"l1", title:"AWS Solutions Architect", description:"Certificeret AWS Solutions Architect – Associate. 80+ timers studium.", date:"2023-03-20", level:4, type:"learning", link:"https://aws.amazon.com/certification", tags:["cloud","certification"] },
      { id:"l2", title:"Machine Learning Fundamentals", description:"Gennemførte Courseras ML-specialisering med topkarakter.", date:"2023-07-30", level:3, type:"learning", link:"https://coursera.org", tags:["ai","python"] },
      { id:"l3", title:"System Design Mastery", description:"Skalerbare systemer: load balancing, caching og distribuerede databaser.", date:"2024-02-15", level:4, type:"learning", tags:["architecture","scalability"] }
    ]}
  ]
};

const TYPE_ICONS = { skill:"⚡", achievement:"🏆", feedback:"💬", learning:"📚" };

/* ── SVG helpers ── */
const NS = "http://www.w3.org/2000/svg";
function se(tag, attrs) {
  const el = document.createElementNS(NS, tag);
  if (attrs) Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, String(v)));
  return el;
}

function fmtDate(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("da-DK", { day:"numeric", month:"short", year:"numeric" }); }
  catch(e) { return iso; }
}

/* ── SVG viewport ── */
const VW = 700, VH = 480;
const CX = VW / 2;
const TBASE = VH - 30;  // trunk base y
const TTOP  = VH - 200; // trunk top y
const THW   = 14;       // trunk half-width at base
const TTHW  = 8;        // trunk half-width at top

/* ── State ── */
let activeBranchId = null;
const branchEls = {}; // { id: { pathEl, leafEls:[], color } }
let modalLock = false;

/* ── Load data ── */
async function loadData() {
  try {
    const r = await fetch("data.json");
    if (!r.ok) throw new Error("HTTP " + r.status);
    const d = await r.json();
    console.log("Loaded data.json");
    return d;
  } catch(e) {
    console.warn("fetch failed, using fallback:", e.message);
    return FALLBACK;
  }
}

/* ═══════════════════════════════════════════
   RENDER PROFILE
═══════════════════════════════════════════ */
function renderProfile(p, branches) {
  document.getElementById("profile-avatar").textContent  = p.avatar || "🧑‍💻";
  document.getElementById("profile-name").textContent    = p.name;
  document.getElementById("profile-title").textContent   = p.title;
  document.getElementById("profile-tagline").textContent = p.tagline;

  const total  = branches.reduce((n,b) => n + b.leaves.length, 0);
  const years  = new Date().getFullYear() - (p.startYear || 2020);
  document.getElementById("profile-stats").innerHTML =
    `<span class="stat-pill"><strong>${total}</strong> blade</span>
     <span class="stat-pill"><strong>${branches.length}</strong> grene</span>
     <span class="stat-pill"><strong>${years}+</strong> år</span>`;

  const leg = document.getElementById("legend-items");
  leg.innerHTML = "";
  branches.forEach(b => {
    const d = document.createElement("div");
    d.className = "legend-item";
    d.dataset.id = b.id;
    d.innerHTML = `<span class="legend-dot" style="background:${b.color}"></span>${b.icon} ${b.label}<small style="margin-left:auto;color:var(--muted)">${b.leaves.length}</small>`;
    d.addEventListener("click", () => toggleBranch(b.id));
    leg.appendChild(d);
  });
}

/* ═══════════════════════════════════════════
   RENDER SVG TREE (trunk + branches only)
═══════════════════════════════════════════ */
function renderSVG(svg, branches) {
  svg.setAttribute("viewBox", "0 0 " + VW + " " + VH);
  svg.innerHTML = "";

  /* defs */
  const defs = se("defs");

  const tg = se("linearGradient", { id:"tG", x1:"0%", y1:"0%", x2:"100%", y2:"0%" });
  [["0%","#5c3d1e"],["45%","#7a5230"],["100%","#3b2510"]].forEach(([o,c]) => {
    const s = se("stop", { offset:o }); s.style.stopColor = c; tg.appendChild(s);
  });
  defs.appendChild(tg);

  const gg = se("radialGradient", { id:"gG", cx:"50%", cy:"50%", r:"50%" });
  [["0%","rgba(74,222,128,0.15)"],["100%","rgba(74,222,128,0)"]].forEach(([o,c]) => {
    const s = se("stop", { offset:o }); s.style.stopColor = c; gg.appendChild(s);
  });
  defs.appendChild(gg);

  svg.appendChild(defs);

  /* ground */
  svg.appendChild(se("ellipse", { cx:CX, cy:VH-12, rx:240, ry:22, fill:"url(#gG)" }));

  /* grass blades */
  for (let i = 0; i < 16; i++) {
    const x = 80 + Math.random() * (VW - 160);
    const y = VH - 12 - Math.random() * 8;
    const h = 5 + Math.random() * 10;
    const l = (Math.random() - 0.5) * 5;
    svg.appendChild(se("path", {
      d: "M" + x + "," + y + " Q" + (x+l) + "," + (y-h/2) + " " + (x+l*0.5) + "," + (y-h),
      stroke:"#2d8a50", "stroke-width":"1.2", "stroke-linecap":"round", fill:"none", opacity:"0.5"
    }));
  }

  /* roots */
  [
    "M" + (CX-8) + "," + TBASE + " Q" + (CX-50) + "," + (TBASE+18) + " " + (CX-110) + "," + (TBASE+8),
    "M" + (CX+8) + "," + TBASE + " Q" + (CX+55) + "," + (TBASE+20) + " " + (CX+115) + "," + (TBASE+6),
    "M" + CX     + "," + TBASE + " Q" + (CX-18) + "," + (TBASE+26) + " " + (CX-38)  + "," + (TBASE+30)
  ].forEach(d => svg.appendChild(se("path", { d, stroke:"#3b2510", "stroke-width":"5", "stroke-linecap":"round", fill:"none", opacity:"0.75" })));

  /* trunk */
  const tmid = (TBASE + TTOP) / 2;
  svg.appendChild(se("path", {
    d: "M" + (CX-THW) + "," + TBASE +
       " C" + (CX-THW-3) + "," + tmid + " " + (CX-TTHW-2) + "," + (TTOP+25) + " " + (CX-TTHW) + "," + TTOP +
       " L" + (CX+TTHW) + "," + TTOP +
       " C" + (CX+TTHW+2) + "," + (TTOP+25) + " " + (CX+THW+3) + "," + tmid + " " + (CX+THW) + "," + TBASE + " Z",
    fill:"url(#tG)"
  }));
  /* trunk shadow */
  svg.appendChild(se("path", {
    d: "M" + (CX-THW) + "," + TBASE +
       " C" + (CX-THW-3) + "," + tmid + " " + (CX-TTHW-2) + "," + (TTOP+25) + " " + (CX-TTHW) + "," + TTOP +
       " L" + (CX-TTHW+5) + "," + TTOP +
       " C" + (CX-TTHW+5) + "," + (TTOP+25) + " " + (CX-THW+3) + "," + tmid + " " + (CX-THW+7) + "," + TBASE + " Z",
    fill:"rgba(0,0,0,0.15)"
  }));
  /* bark lines */
  [[0.3],[0.58]].forEach(([t]) => {
    const y = TTOP + (TBASE - TTOP) * t;
    const w = TTHW + (THW - TTHW) * t;
    svg.appendChild(se("path", {
      d: "M" + (CX-w+3) + "," + y + " Q" + CX + "," + (y-5) + " " + (CX+w-3) + "," + y,
      fill:"none", stroke:"#7a5230", "stroke-width":"1.1", opacity:"0.4"
    }));
  });

  /* branches */
  branches.forEach((branch, bi) => {
    const ang = branch.angle * Math.PI / 180;
    const t   = 0.15 + (bi / (branches.length - 1)) * 0.7;
    const sY  = TTOP + (TBASE - TTOP) * (1 - t);
    const sX  = CX + (ang < 0 ? -TTHW : TTHW) * (0.5 + t * 0.5);
    const len = 110 + Math.abs(branch.angle) * 0.4;
    const eX  = sX + Math.sin(ang) * len;
    const eY  = sY - Math.cos(ang) * len * 0.72;
    const cpX = sX + Math.sin(ang) * len * 0.5;
    const cpY = sY - Math.cos(ang) * len * 0.4;

    /* store endpoints for leaf placement */
    branch._start = { x:sX, y:sY };
    branch._end   = { x:eX, y:eY };
    branch._cp    = { x:cpX, y:cpY };

    const path = se("path", {
      d: "M" + sX + "," + sY + " Q" + cpX + "," + cpY + " " + eX + "," + eY,
      stroke: branch.color + "99",
      "stroke-width": "8",
      "stroke-linecap": "round",
      fill: "none"
    });
    path.style.cursor = "pointer";
    path.style.transition = "stroke 0.2s, stroke-width 0.2s";
    path.addEventListener("mouseenter", () => { path.setAttribute("stroke", branch.color); });
    path.addEventListener("mouseleave", () => { if (activeBranchId !== branch.id) path.setAttribute("stroke", branch.color + "99"); });
    path.addEventListener("click", () => toggleBranch(branch.id));
    svg.appendChild(path);

    /* branch label */
    const lbl = se("text", {
      x: eX, y: eY - 16,
      "text-anchor": "middle",
      fill: branch.color,
      "font-size": "12",
      "font-family": "Georgia, serif",
      "font-weight": "700"
    });
    lbl.style.cursor = "pointer";
    lbl.textContent = branch.icon + " " + branch.label;
    lbl.addEventListener("click", () => toggleBranch(branch.id));
    svg.appendChild(lbl);

    branchEls[branch.id] = { pathEl: path, leafEls: [], color: branch.color };
  });
}

/* ═══════════════════════════════════════════
   RENDER HTML LEAVES
   Placed as absolute <div> elements over SVG.
   Position calculated from SVG viewBox coords
   mapped to container pixel coords.
═══════════════════════════════════════════ */
function renderLeaves(container, svg, branches) {
  /* Remove any existing leaf nodes */
  container.querySelectorAll(".leaf-node").forEach(e => e.remove());

  /* Get rendered size of SVG element */
  const svgRect = svg.getBoundingClientRect();
  const cRect   = container.getBoundingClientRect();

  /* Scale factors: viewBox → pixels */
  const scaleX = svgRect.width  / VW;
  const scaleY = svgRect.height / VH;

  /* SVG offset within container */
  const offX = svgRect.left - cRect.left;
  const offY = svgRect.top  - cRect.top;

  branches.forEach(branch => {
    const { _start:s, _end:e, _cp:cp } = branch;

    branch.leaves.forEach((leaf, li) => {
      /* Point along quadratic bezier */
      const t  = (li + 1) / (branch.leaves.length + 1);
      const mt = 1 - t;
      /* Bezier formula */
      const bx = mt*mt*s.x + 2*mt*t*cp.x + t*t*e.x;
      const by = mt*mt*s.y + 2*mt*t*cp.y + t*t*e.y;

      /* Spread leaves around bezier point */
      const spread = 28 + li * 8;
      const lx = bx + (Math.random() - 0.5) * spread;
      const ly = by - 18 - Math.random() * 20;

      /* Convert to container pixels */
      const px = offX + lx * scaleX;
      const py = offY + ly * scaleY;

      /* Leaf size based on level */
      const lv   = leaf.level || 3;
      const size = (18 + lv * 4) * Math.min(scaleX, scaleY);

      /* Create leaf div */
      const div = document.createElement("div");
      div.className = "leaf-node";
      div.style.width  = size + "px";
      div.style.height = size + "px";
      div.style.left   = (px - size / 2) + "px";
      div.style.top    = (py - size / 2) + "px";
      div.style.background = branch.color;
      div.style.boxShadow  = "0 0 " + (lv * 3) + "px " + branch.color + "88";

      /* Inner shine */
      const shine = document.createElement("div");
      shine.className = "leaf-shine";
      div.appendChild(shine);

      /* Level indicator */
      if (lv >= 4) {
        const lvl = document.createElement("div");
        lvl.className = "leaf-level";
        lvl.textContent = "★".repeat(lv - 3);
        div.appendChild(lvl);
      }

      /* Events */
      div.addEventListener("mouseenter", e => showTooltip(e, leaf, branch));
      div.addEventListener("mousemove",  e => moveTooltip(e));
      div.addEventListener("mouseleave", hideTooltip);
      div.addEventListener("click", e => {
        e.stopPropagation();
        hideTooltip();
        openModal(leaf, branch);
      });

      container.appendChild(div);
      branchEls[branch.id].leafEls.push(div);
    });
  });
}

/* ═══════════════════════════════════════════
   TOGGLE BRANCH FOCUS
═══════════════════════════════════════════ */
function toggleBranch(id) {
  activeBranchId = activeBranchId === id ? null : id;

  Object.entries(branchEls).forEach(([bid, { pathEl, leafEls, color }]) => {
    const active = activeBranchId === null || bid === activeBranchId;
    pathEl.setAttribute("stroke", active ? color : color + "22");
    pathEl.setAttribute("stroke-width", bid === activeBranchId ? "12" : "8");
    leafEls.forEach(el => {
      el.style.opacity    = active ? "1" : "0.12";
      el.style.transition = "opacity 0.3s";
    });
  });

  /* Update legend */
  document.querySelectorAll(".legend-item").forEach(el => {
    el.classList.toggle("active", el.dataset.id === activeBranchId);
  });
}

/* ═══════════════════════════════════════════
   TOOLTIP
═══════════════════════════════════════════ */
const tipEl = document.getElementById("tooltip");

function showTooltip(event, leaf, branch) {
  document.getElementById("tt-title").textContent = leaf.title;
  document.getElementById("tt-desc").textContent  = (leaf.description || "").slice(0, 90) + ((leaf.description||"").length > 90 ? "…" : "");
  const stars = document.getElementById("tt-stars");
  stars.textContent = "★".repeat(leaf.level || 3) + "☆".repeat(5 - (leaf.level || 3));
  stars.style.color = branch.color;
  tipEl.style.borderLeft = "3px solid " + branch.color;
  tipEl.classList.add("visible");
  moveTooltip(event);
}

function moveTooltip(event) {
  const pad = 14;
  const tw  = tipEl.offsetWidth  || 230;
  const th  = tipEl.offsetHeight || 90;
  let tx = event.clientX + pad;
  let ty = event.clientY - th / 2;
  if (tx + tw > window.innerWidth  - pad) tx = event.clientX - tw - pad;
  if (ty < pad)                           ty = pad;
  if (ty + th > window.innerHeight - pad) ty = window.innerHeight - th - pad;
  tipEl.style.left = tx + "px";
  tipEl.style.top  = ty + "px";
}

function hideTooltip() { tipEl.classList.remove("visible"); }

document.addEventListener("click", () => hideTooltip());

/* ═══════════════════════════════════════════
   LEAF DETAIL MODAL
═══════════════════════════════════════════ */
function openModal(leaf, branch) {
  modalLock = true;
  setTimeout(() => { modalLock = false; }, 80);

  /* Banner */
  const banner = document.getElementById("lm-banner");
  banner.style.background = "linear-gradient(135deg," + branch.color + "cc," + branch.color + "55)";
  document.getElementById("lm-icon").textContent     = TYPE_ICONS[leaf.type] || branch.icon;
  document.getElementById("lm-category").textContent = branch.icon + " " + branch.label;
  document.getElementById("lm-date").textContent     = leaf.date ? "📅 " + fmtDate(leaf.date) : "";

  /* Level dots */
  const dotsEl = document.getElementById("lm-dots");
  dotsEl.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const d = document.createElement("span");
    d.className = "lm-dot" + (i <= (leaf.level || 3) ? " filled" : "");
    dotsEl.appendChild(d);
  }

  /* Body */
  document.getElementById("lm-title").textContent = leaf.title;

  const fromEl = document.getElementById("lm-from");
  fromEl.textContent = leaf.from ? "— " + leaf.from : "";
  fromEl.classList.toggle("visible", !!leaf.from);

  document.getElementById("lm-desc").textContent = leaf.description || "";

  document.getElementById("lm-tags").innerHTML =
    (leaf.tags || []).map(t => `<span class="lm-tag">#${t}</span>`).join("");

  /* Level bar */
  document.getElementById("lm-num").textContent = (leaf.level || 3) + " / 5";
  const fill = document.getElementById("lm-fill");
  fill.style.background = branch.color;
  fill.style.width = "0%";
  requestAnimationFrame(() => requestAnimationFrame(() => {
    fill.style.width = ((leaf.level || 3) / 5 * 100) + "%";
  }));

  /* Link */
  const lnk = document.getElementById("lm-link");
  if (leaf.link) {
    lnk.href = leaf.link;
    lnk.style.color = branch.color;
    lnk.classList.remove("hidden");
  } else {
    lnk.classList.add("hidden");
  }

  document.getElementById("leaf-modal").classList.add("open");
}

function closeModal() {
  if (modalLock) return;
  document.getElementById("leaf-modal").classList.remove("open");
}

document.getElementById("lm-close").addEventListener("click", e => { e.stopPropagation(); closeModal(); });
document.getElementById("leaf-modal").addEventListener("click", e => { if (e.target === document.getElementById("leaf-modal")) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

/* ═══════════════════════════════════════════
   SHARE MODAL
═══════════════════════════════════════════ */
function initShare(profile) {
  const url  = encodeURIComponent(window.location.href);
  const text = encodeURIComponent("Tjek mit Hype-Træ – min karriere som et voksende træ 🌳");
  document.getElementById("share-linkedin").href = "https://www.linkedin.com/sharing/share-offsite/?url=" + url;
  document.getElementById("share-twitter").href  = "https://twitter.com/intent/tweet?text=" + text + "&url=" + url;

  document.getElementById("share-btn").addEventListener("click", () => {
    document.getElementById("share-modal").classList.add("open");
  });
  document.getElementById("share-close").addEventListener("click", e => {
    e.stopPropagation();
    document.getElementById("share-modal").classList.remove("open");
  });
  document.getElementById("share-modal").addEventListener("click", e => {
    if (e.target === document.getElementById("share-modal"))
      document.getElementById("share-modal").classList.remove("open");
  });
  document.getElementById("share-copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      document.getElementById("share-copy").innerHTML = "<span>✅</span> Kopieret!";
      setTimeout(() => { document.getElementById("share-copy").innerHTML = "<span>🔗</span> Kopier link"; }, 2000);
    } catch(e) {}
  });
}

/* ═══════════════════════════════════════════
   THEME TOGGLE
═══════════════════════════════════════════ */
function initTheme() {
  const btn = document.getElementById("theme-toggle");
  const saved = localStorage.getItem("hype-theme");
  let dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;

  function apply() {
    document.body.classList.toggle("dark-mode",  dark);
    document.body.classList.toggle("light-mode", !dark);
    btn.textContent = dark ? "☀️" : "🌙";
    localStorage.setItem("hype-theme", dark ? "dark" : "light");
  }
  apply();
  btn.addEventListener("click", () => { dark = !dark; apply(); });
}

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
async function init() {
  initTheme();

  const data = await loadData();
  const { profile, branches } = data;

  renderProfile(profile, branches);

  const container = document.getElementById("tree-container");
  const svg       = document.getElementById("tree-svg");

  renderSVG(svg, branches);

  /* Wait for SVG to be laid out before placing HTML leaves */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      renderLeaves(container, svg, branches);
    });
  });

  /* Re-render leaves on window resize */
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => renderLeaves(container, svg, branches), 150);
  });

  initShare(profile);
}

document.addEventListener("DOMContentLoaded", init);
