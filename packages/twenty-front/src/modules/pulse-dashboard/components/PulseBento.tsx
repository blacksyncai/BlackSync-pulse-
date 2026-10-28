// @ts-nocheck
/* Adapted from "Finance Bento" by vasnev.art: same cards, gradients and chart
   drawing, re-pointed at CRM numbers. Charts are plain DOM + SVG drawn in an
   effect, as in the original, so this file is checked as JavaScript. */

import { type PulseDashboardData } from '@/pulse-dashboard/types/PulseDashboardData';
import * as React from 'react';

const CSS = `.pbn{font-family:var(--t-font-family);-webkit-font-smoothing:antialiased;color:#fff;width:100%;
  --acc:#B9A6FF;--t1:#fff;--t2:rgba(255,255,255,.56);--t3:rgba(255,255,255,.38);--hair:rgba(255,255,255,.14);--ease:cubic-bezier(.32,.72,0,1);
  --early:#FFFFFF;--late:#A9B2FF;--won:#E8FF1F}
.pbn *{box-sizing:border-box}
.pbn .top{display:flex;align-items:center;gap:14px;margin-bottom:16px}
.pbn .top h1{margin:0;font-size:28px;font-weight:700;letter-spacing:-.03em;flex:1}
.pbn .top h1 span{font-weight:500;color:var(--t3);font-size:15px;letter-spacing:-.01em;margin-left:12px}
.pbn .grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:14px}
.pbn .h1{height:376px}.pbn .h2{height:168px}.pbn .h3{height:330px}
.pbn #nw{grid-column:span 8}.pbn #alloc{grid-column:span 4}.pbn .kpi{grid-column:span 3}
.pbn #flow{grid-column:span 5}.pbn #deals{grid-column:span 4}.pbn #stages{grid-column:span 3}
@media (max-width:1199px){.pbn #nw{grid-column:span 12}.pbn #alloc{grid-column:span 6;grid-row:span 2;height:auto}
.pbn .kpi{grid-column:span 6}.pbn #flow{grid-column:span 12}.pbn #deals,.pbn #stages{grid-column:span 6}}
@media (max-width:767px){.pbn #alloc{grid-column:span 12;grid-row:auto;height:376px}.pbn .kpi{grid-column:span 6}
.pbn #deals,.pbn #stages{grid-column:span 12}.pbn .grid{gap:12px}}
@media (max-width:520px){.pbn .kpi{grid-column:span 12}}
.pbn .card{position:relative;border-radius:28px;overflow:hidden;opacity:0;transform:translateY(14px) scale(.985);transition:opacity .7s ease,transform .9s var(--ease)}
.pbn .in .card{opacity:1;transform:none}
.pbn .card .rim{position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 1px 0 rgba(255,255,255,.2),inset 0 0 0 1px rgba(255,255,255,.06);pointer-events:none;z-index:9}
.pbn .g{position:absolute;inset:0}
.pbn .core{position:absolute;left:10%;right:10%;top:16%;bottom:-6%;border-radius:90px;filter:blur(60px)}
.pbn .glass{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(20px)}
.pbn .in-c{position:absolute;inset:0;padding:22px 24px;z-index:2}
.pbn .ttl{font-size:18px;font-weight:600;letter-spacing:-.02em}
.pbn .cap{font-size:11.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--t2)}
.pbn .solid .cap{color:rgba(0,0,0,.55)}
.pbn .big{font-size:40px;font-weight:200;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums}
.pbn .delta{font:600 12.5px ui-monospace,monospace;color:var(--won)}
.pbn .muted{font-size:12.5px;color:var(--t3);font-weight:500}
.pbn .chip{display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:11px;background:rgba(0,0,0,.85);color:#fff;font:600 11px ui-monospace,monospace}
.pbn .legend{display:flex;gap:16px;font-size:12px;font-weight:500;color:var(--t2)}
.pbn .legend span{display:inline-flex;align-items:center;gap:6px}
.pbn .legend i{width:8px;height:8px;border-radius:50%}
.pbn .row{display:flex;align-items:center;gap:12px}
.pbn .mono{font-family:ui-monospace,monospace;font-variant-numeric:tabular-nums}
.pbn .dots circle{transition:opacity .26s,transform .26s;transform-box:fill-box;transform-origin:center}
.pbn .tip{position:fixed;z-index:50;pointer-events:none;background:rgba(14,14,16,.92);color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:9px 11px;font-size:12px;
  backdrop-filter:blur(16px);opacity:0;transform:translateY(4px);transition:opacity .15s,transform .15s;white-space:nowrap;min-width:150px}
.pbn .tip.on{opacity:1;transform:none}
.pbn .tip .t{color:var(--t2);margin-bottom:5px;font-weight:500}
.pbn .tip .r{display:flex;justify-content:space-between;gap:14px;align-items:center;line-height:19px}
.pbn .tip .r span{display:inline-flex;align-items:center;gap:6px;color:var(--t2)}
.pbn .tip i{width:7px;height:7px;border-radius:50%}
.pbn .empty{position:absolute;left:24px;right:24px;bottom:24px;font-size:12.5px;color:var(--t3)}
@media (prefers-reduced-motion: reduce){.pbn .card{transition:none}}`;

const esc = (v) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );

const markup = (
  o,
) => `<div class="top"><h1>${esc(o.title)}<span>${esc(o.subtitle)}</span></h1></div>
  <div class="grid" id="grid">
    <section class="card h1" id="nw" aria-label="Pipeline"></section>
    <section class="card h1" id="alloc" aria-label="Win rate"></section>
    <section class="card h2 kpi solid" id="dials" aria-label="Dials"></section>
    <section class="card glass h2 kpi" id="tasks" aria-label="Open tasks"></section>
    <section class="card glass h2 kpi" id="next" aria-label="Next up"></section>
    <section class="card glass h2 kpi" id="won" aria-label="Won this month"></section>
    <section class="card h3" id="flow" aria-label="Deal flow"></section>
    <section class="card h3" id="deals" aria-label="Top deals"></section>
    <section class="card h3" id="stages" aria-label="Deals by stage"></section>
  </div>
  <div class="tip" id="tip"></div>`;

function mount(root, data) {
  let alive = true;
  const frames = new Set();
  const RAF = (cb) => {
    if (!alive) return 0;
    const id = requestAnimationFrame((t) => {
      frames.delete(id);
      if (alive) cb(t);
    });
    frames.add(id);
    return id;
  };
  const $id = (id) => root.querySelector('#' + id);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ACC = '#B9A6FF',
    WON = '#E8FF1F',
    T2 = 'rgba(255,255,255,.56)',
    T3 = 'rgba(255,255,255,.38)',
    HAIR = 'rgba(255,255,255,.14)';
  const COL = { early: '#FFFFFF', late: '#A9B2FF', won: WON };
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const NS = 'http://www.w3.org/2000/svg';
  const el = (t, a = {}, p) => {
    const e = document.createElementNS(NS, t);
    for (const k in a) e.setAttribute(k, a[k]);
    p && p.appendChild(e);
    return e;
  };
  const money = (v, { compact = false } = {}) => {
    if (compact && Math.abs(v) >= 1000)
      return (
        '$' +
        (v >= 1e6
          ? (v / 1e6).toFixed(1) + 'M'
          : (v / 1000).toFixed(Math.abs(v) >= 10000 ? 0 : 1) + 'K')
      );
    return '$' + Math.round(v).toLocaleString('en-US');
  };
  const bg = ({ top, base, bottom, core }) =>
    `<div class="g" style="background:linear-gradient(180deg,${top} 0%,${base} 36%,${base} 74%,${bottom} 100%)"></div><div class="core" style="background:${core}"></div>`;
  const GR = {
    violet: {
      top: '#c9b8ff',
      base: '#4b2fd6',
      bottom: '#7d64ff',
      core: '#0b0626',
    },
    graph: {
      top: '#9a9aa8',
      base: '#3a3a44',
      bottom: '#55555f',
      core: '#060608',
    },
    pink: {
      top: '#ffb3d6',
      base: '#ff2a85',
      bottom: '#ff6aa8',
      core: '#3a031c',
    },
    copper: {
      top: '#f6bf96',
      base: '#c2683a',
      bottom: '#dc8a5c',
      core: '#1d0b05',
    },
    green: {
      top: '#a6e8c8',
      base: '#36956f',
      bottom: '#58b58c',
      core: '#061d15',
    },
    lime: {
      top: '#f4ffb8',
      base: '#a3c400',
      bottom: '#c9e03a',
      core: '#121700',
    },
  };
  const smoothPath = (P, move = true) => {
    let d = (move ? 'M' : 'L') + `${P[0][0]},${P[0][1]}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i],
        p1 = P[i],
        p2 = P[i + 1],
        p3 = P[i + 2] || p2,
        k = 0.17;
      d += `C${p1[0] + (p2[0] - p0[0]) * k},${p1[1] + (p2[1] - p0[1]) * k} ${p2[0] - (p3[0] - p1[0]) * k},${p2[1] - (p3[1] - p1[1]) * k} ${p2[0]},${p2[1]}`;
    }
    return d;
  };
  const P2 = (r, a) => [
    r * Math.cos((a * Math.PI) / 180),
    r * Math.sin((a * Math.PI) / 180),
  ];
  const F = {
    '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
    '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
    '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
    '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
    '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
    '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
    '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
    '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
    $: ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
    ',': ['0', '0', '0', '0', '0', '1', '1'],
    ' ': ['00', '00', '00', '00', '00', '00', '00'],
  };
  function DotNumber(host, pitch) {
    const cols = 60,
      svg = el('svg', { class: 'dots', 'aria-hidden': 'true' }, host),
      cells = [];
    for (let c = 0; c < cols; c++)
      for (let r = 0; r < 7; r++) {
        const ci = el(
          'circle',
          {
            cx: c * pitch + pitch / 2,
            cy: r * pitch + pitch / 2,
            r: pitch * 0.36,
            fill: '#fff',
            opacity: 0,
          },
          svg,
        );
        ci.style.transitionDelay = c * 7 + 'ms';
        cells.push([c, r, ci]);
      }
    const set = (t) => {
      const on = new Set();
      let x = 0;
      for (const ch of t) {
        const g = F[ch] || F[' '];
        const w = g[0].length;
        for (let r = 0; r < 7; r++)
          for (let k = 0; k < w; k++)
            if (g[r][k] === '1') on.add((x + k) * 8 + r);
        x += w + 1;
      }
      const used = Math.max(1, x - 1);
      for (const [c, r, ci] of cells) {
        const v = on.has(c * 8 + r);
        ci.setAttribute('opacity', v ? 1 : c < used ? 0.08 : 0);
        ci.style.transform = v ? 'none' : 'scale(.55)';
      }
      svg.setAttribute('width', used * pitch);
      svg.setAttribute('height', 7 * pitch);
      svg.setAttribute('viewBox', `0 0 ${used * pitch} ${7 * pitch}`);
    };
    let cur = 0;
    return {
      count(to, dur = 900) {
        const from = cur,
          t0 = performance.now();
        let last = '';
        const f = (now) => {
          const t = reduce ? 1 : Math.min(1, (now - t0) / dur);
          cur = from + (to - from) * ease(t);
          const s = '$' + Math.round(cur).toLocaleString('en-US');
          if (s !== last) {
            set(s);
            last = s;
          }
          if (t < 1) RAF(f);
        };
        RAF(f);
      },
    };
  }
  function tween(node, to, fmt, dur = 900) {
    const t0 = performance.now();
    (function f(now) {
      const t = reduce ? 1 : Math.min(1, (now - t0) / dur);
      node.textContent = fmt(to * ease(t));
      if (t < 1) RAF(f);
    })(t0);
  }
  const tip = $id('tip');
  function showTip(x, y, title, rows) {
    tip.innerHTML =
      `<div class="t">${esc(title)}</div>` +
      rows
        .map(
          ([k, v, c]) =>
            `<div class="r"><span>${c ? `<i style="background:${c}"></i>` : ''}${esc(k)}</span><b>${esc(v)}</b></div>`,
        )
        .join('');
    tip.classList.add('on');
    const r = tip.getBoundingClientRect();
    let L = x + 16,
      T = y - r.height - 14;
    if (L + r.width > innerWidth - 8) L = x - r.width - 16;
    if (T < 8) T = y + 16;
    tip.style.left = L + 'px';
    tip.style.top = T + 'px';
  }
  const hideTip = () => tip.classList.remove('on');

  /* ---- Pipeline: stream of early / late-stage / won value ---- */
  const nw = $id('nw');
  const H = data.pipelineHistory;
  const total = (p) => p.early + p.late + p.won;
  const firstOpen = H[0].early + H[0].late,
    lastOpen = data.openPipeline;
  nw.innerHTML = `${bg(GR.violet)}<div class="in-c">
    <div class="row" style="justify-content:space-between"><div class="ttl">Open pipeline</div>
      <div class="legend"><span><i style="background:${COL.early}"></i>Early</span><span><i style="background:${COL.late}"></i>Late stage</span><span><i style="background:${COL.won}"></i>Won</span></div></div>
    <div class="row" style="margin-top:16px;align-items:flex-end;gap:16px"><div class="nwn"></div>
      <div style="padding-bottom:6px"><div class="delta">${data.openCount} open deals</div><div class="muted" style="margin-top:3px">${firstOpen > 0 ? (lastOpen >= firstOpen ? '+' : '−') + money(Math.abs(lastOpen - firstOpen)) + ' vs 12 months ago' : 'Last 12 months'}</div></div></div>
    <svg class="nws" style="position:absolute;left:0;right:0;bottom:0;display:block" aria-hidden="true"></svg></div><div class="rim"></div>`;
  DotNumber(nw.querySelector('.nwn'), innerWidth < 520 ? 5.4 : 7).count(
    lastOpen,
  );
  let nwGrow = 0;
  function drawNW() {
    const svg = nw.querySelector('.nws'),
      W = nw.clientWidth,
      Hh = 226,
      top = 26,
      bot = 26,
      mid = top + (Hh - top - bot) / 2;
    svg.setAttribute('width', W);
    svg.setAttribute('height', Hh);
    svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`);
    const n = H.length,
      mx = Math.max(1, ...H.map(total)),
      half = (Hh - top - bot) / 2,
      X = (i) => -20 + (i / (n - 1)) * (W + 40),
      g = ease(nwGrow);
    const lay = H.map((p) => {
      const q = (half * g) / mx;
      return { a: p.early * q, b: (p.early + p.late) * q, c: total(p) * q };
    });
    const band = (k) =>
      smoothPath(H.map((p, i) => [X(i), mid - lay[i][k] - 2])) +
      smoothPath(
        H.map((p, i) => [X(i), mid + lay[i][k] + 2]).reverse(),
        false,
      ) +
      'Z';
    const marks = [
      Math.round((n - 1) * 0.3),
      Math.round((n - 1) * 0.65),
      n - 1,
    ];
    svg.innerHTML = `<path d="${band('c')}" fill="${COL.won}" opacity=".9"/><path d="${band('b')}" fill="${COL.late}"/><path d="${band('a')}" fill="${COL.early}" opacity=".95"/>
      ${marks
        .map((i, k) => {
          const x = Math.min(W - 36, Math.max(36, X(i)));
          return `<g style="opacity:${g > 0.6 ? 1 : 0};transition:opacity .4s ${k * 0.08}s">
        <rect x="${x - 34}" y="${top - 14}" width="68" height="22" rx="11" fill="#000"/><text x="${x}" y="${top + 1}" text-anchor="middle" font-size="11" font-weight="600" fill="#fff" font-family="ui-monospace,monospace">${money(total(H[i]), { compact: true })}</text>
        <rect x="${x - 26}" y="${Hh - bot - 8}" width="52" height="22" rx="11" fill="#000"/><text x="${x}" y="${Hh - bot + 7}" text-anchor="middle" font-size="10.5" fill="rgba(255,255,255,.7)" font-family="ui-monospace,monospace">${H[i].label}</text></g>`;
        })
        .join('')}
      <line class="hl" y1="${top}" y2="${Hh - bot}" stroke="#fff" stroke-width="1.5" opacity="0"/><rect width="${W}" height="${Hh}" fill="transparent" class="hit"/>`;
    const hit = svg.querySelector('.hit'),
      hl = svg.querySelector('.hl');
    hit.onpointermove = (e) => {
      const r = svg.getBoundingClientRect(),
        z = r.width / W,
        x = (e.clientX - r.left) / z;
      const i = Math.max(
        0,
        Math.min(n - 1, Math.round(((x + 20) / (W + 40)) * (n - 1))),
      );
      const p = H[i];
      hl.setAttribute('x1', X(i));
      hl.setAttribute('x2', X(i));
      hl.setAttribute('opacity', 1);
      showTip(r.left + X(i) * z, r.top + (mid - lay[i].c) * z, p.label, [
        ['Won', money(p.won), COL.won],
        ['Late stage', money(p.late), COL.late],
        ['Early', money(p.early), COL.early],
      ]);
    };
    hit.onpointerleave = () => {
      hl.setAttribute('opacity', 0);
      hideTip();
    };
  }
  const t0 = performance.now();
  const grow = (now) => {
    nwGrow = reduce ? 1 : Math.min(1, (now - t0) / 1100);
    drawNW();
    if (nwGrow < 1) RAF(grow);
  };
  RAF(grow);

  /* ---- Win rate: half gauge of tick marks ---- */
  const al = $id('alloc');
  const deals = data.wonCount + data.openCount,
    wonShare = deals ? data.wonCount / deals : 0;
  al.innerHTML = `${bg(GR.graph)}<div class="in-c"><div class="row" style="justify-content:space-between"><div class="ttl">Win rate</div><span class="chip" style="background:rgba(255,255,255,.12)">${deals} deals</span></div>
    <svg width="300" height="168" viewBox="-150 -150 300 168" style="position:absolute;left:50%;margin-left:-150px;top:70px" aria-hidden="true">${(() => {
      let s = '<style>@keyframes tk{to{opacity:1}}</style>';
      const n = 56;
      for (let i = 0; i <= n; i++) {
        const f = i / n,
          a = 180 + f * 180,
          on = f <= wonShare;
        const [x1, y1] = P2(136, a),
          [x2, y2] = P2(i % 7 === 0 ? 112 : 118, a);
        s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${on ? WON : COL.late}" stroke-opacity="${on ? 1 : 0.35}" stroke-width="3.2" stroke-linecap="round" style="opacity:0;animation:tk .4s ${i * 12}ms forwards"/>`;
      }
      return (
        s +
        `<text y="-22" text-anchor="middle" font-weight="200" font-size="52" fill="#fff" letter-spacing="-2">${Math.round(wonShare * 100)}<tspan font-size="17" dy="-24" fill="${T2}">%</tspan></text><text y="0" text-anchor="middle" font-size="12" font-weight="500" fill="${T3}">deals won</text>`
      );
    })()}</svg>
    <div style="position:absolute;left:24px;right:24px;bottom:20px">${[
      ['Won', data.wonCount, money(data.wonAmount), WON],
      ['Open', data.openCount, money(data.openPipeline), COL.late],
      ['Contacts', data.peopleCount, data.companyCount + ' accounts', '#fff'],
    ]
      .map(
        ([k, c, v, col], i) =>
          `<div class="row" style="height:30px;${i ? 'border-top:1px solid rgba(255,255,255,.1)' : ''}"><i style="width:8px;height:8px;border-radius:50%;background:${col}"></i><span style="flex:1;font-size:13px;font-weight:600">${k}</span><span class="mono muted" style="width:44px;text-align:right">${c}</span><span class="mono" style="width:96px;text-align:right;font-size:13px">${v}</span></div>`,
      )
      .join('')}</div></div><div class="rim"></div>`;

  /* ---- KPI: dials ---- */
  const dials = $id('dials');
  dials.innerHTML = `${bg(GR.lime)}<div class="in-c"><div class="row" style="justify-content:space-between"><div class="cap">Dials today</div><span class="chip">${data.dialsThisWeek} this week</span></div>
    <div style="position:absolute;left:22px;bottom:32px"><span class="big dv" style="font-size:52px">0</span></div>
    <div class="muted" style="position:absolute;left:24px;bottom:14px;font-size:11.5px;color:rgba(0,0,0,.55)">Logged from click-to-call</div></div><div class="rim"></div>`;
  tween(dials.querySelector('.dv'), data.dialsToday, (v) =>
    String(Math.round(v)),
  );

  /* ---- KPI: open tasks with overdue ticks ---- */
  const tasks = $id('tasks');
  tasks.innerHTML = `<div class="in-c"><div class="row" style="justify-content:space-between"><div class="cap">Open tasks</div><span class="muted">${data.tasksOverdue} overdue</span></div>
    <div style="margin-top:14px"><span class="big tv" style="font-size:38px">0</span></div>
    <svg class="tt" width="100%" height="22" style="position:absolute;left:24px;bottom:22px;width:calc(100% - 48px)" aria-hidden="true"></svg></div>`;
  tween(tasks.querySelector('.tv'), data.tasksOpen, (v) =>
    String(Math.round(v)),
  );
  RAF(() => {
    const svg = tasks.querySelector('.tt'),
      W = svg.getBoundingClientRect().width || 220,
      n = 36,
      overdue = data.tasksOpen ? data.tasksOverdue / data.tasksOpen : 0;
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = 1 + (i * (W - 2)) / (n - 1),
        on = i / (n - 1) < overdue;
      s += `<line x1="${x}" x2="${x}" y1="${i % 6 === 0 ? 2 : 8}" y2="20" stroke="${on ? '#FF6AA8' : 'rgba(255,255,255,.28)'}" stroke-width="1.6" stroke-linecap="round"/>`;
    }
    svg.innerHTML = s;
  });

  /* ---- KPI: next tasks ---- */
  const next = $id('next');
  next.innerHTML = `<div class="in-c" style="padding-bottom:14px"><div class="row" style="justify-content:space-between"><div class="cap">Next up</div><span class="muted">${data.meetingsThisWeek} meetings this week</span></div>
    <div style="margin-top:10px">${data.upcomingTasks.length ? data.upcomingTasks.map((t, i) => `<div class="row" style="height:34px;${i ? 'border-top:1px solid rgba(255,255,255,.08)' : ''}"><i style="width:24px;height:24px;border-radius:8px;background:rgba(255,255,255,.1);display:grid;place-items:center;font:600 11px inherit;font-style:normal">${esc(t.title.charAt(0))}</i><span style="flex:1;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.title)}</span><span class="mono" style="font-size:11.5px;color:${t.isOverdue ? '#FF6AA8' : T3}">${esc(t.due)}</span></div>`).join('') : '<div class="muted" style="margin-top:14px">No tasks with a due date.</div>'}</div></div>`;

  /* ---- KPI: won this month ---- */
  const won = $id('won');
  won.innerHTML = `<div class="in-c"><div class="row" style="justify-content:space-between"><div class="cap">Won this month</div><span class="muted">${data.wonThisMonthCount} deals</span></div>
    <div style="margin-top:14px"><span class="big wv" style="font-size:38px">$0</span></div>
    <div class="muted" style="position:absolute;left:24px;bottom:22px">${money(data.wonAmount, { compact: true })} won all time</div></div>`;
  tween(won.querySelector('.wv'), data.wonThisMonthAmount, (v) => money(v));

  /* ---- Deal flow: deals created above, deals won below ---- */
  const flow = $id('flow');
  const A = data.activity;
  flow.innerHTML = `${bg(GR.pink)}<div class="in-c"><div class="row" style="justify-content:space-between"><div><div class="ttl">Deal flow</div><div class="muted" style="margin-top:4px">Last 6 months</div></div>
    <div class="legend" style="flex-direction:column;gap:4px;align-items:flex-end"><span><i style="background:#fff"></i>Created</span><span><i style="background:#FFD0E6"></i>Won</span></div></div>
    <svg class="fls" style="position:absolute;left:0;bottom:12px" aria-hidden="true"></svg></div><div class="rim"></div>`;
  function drawFlow() {
    const svg = flow.querySelector('.fls'),
      W = flow.clientWidth,
      Hh = 246,
      L = 44,
      R = W - 36,
      mid = Hh / 2,
      lab = 16,
      amp = mid - lab - 8,
      max = Math.max(4, ...A.created, ...A.won);
    svg.setAttribute('width', W);
    svg.setAttribute('height', Hh);
    svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`);
    const X = (i) => L + (i / (A.months.length - 1)) * (R - L),
      path = (arr, dir) =>
        smoothPath(
          arr.map((v, i) => [X(i), mid + dir * (lab + (v / max) * amp)]),
        );
    let s = '';
    [0, Math.round(max / 2), max].forEach((v) => {
      const yT = mid - lab - (v / max) * amp,
        yB = mid + lab + (v / max) * amp;
      s += `<line x1="${L}" x2="${R}" y1="${yT}" y2="${yT}" stroke="${HAIR}"/><line x1="${L}" x2="${R}" y1="${yB}" y2="${yB}" stroke="${HAIR}"/><text x="${L - 12}" y="${yT + 3.5}" text-anchor="end" font-size="10" fill="${T3}" font-family="ui-monospace,monospace">${v}</text><text x="${L - 12}" y="${yB + 3.5}" text-anchor="end" font-size="10" fill="${T3}" font-family="ui-monospace,monospace">${v}</text>`;
    });
    A.months.forEach(
      (m, i) =>
        (s += `<text x="${X(i)}" y="${mid + 4}" text-anchor="middle" font-size="10.5" fill="rgba(255,255,255,.75)" font-family="ui-monospace,monospace">${m}</text>`),
    );
    s += `<path d="${path(A.created, -1)}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="${path(A.won, 1)}" fill="none" stroke="#FFD0E6" stroke-width="2.4" stroke-linecap="round"/>`;
    s += `<line class="hl" y1="10" y2="${Hh - 10}" stroke="#fff" stroke-opacity=".5" opacity="0"/><rect class="hit" x="${L - 10}" width="${R - L + 20}" height="${Hh}" fill="transparent"/>`;
    svg.innerHTML = s;
    const hit = svg.querySelector('.hit'),
      hl = svg.querySelector('.hl'),
      last = A.months.length - 1;
    hit.onpointermove = (e) => {
      const r = svg.getBoundingClientRect(),
        z = r.width / W,
        x = (e.clientX - r.left) / z,
        i = Math.max(0, Math.min(last, Math.round(((x - L) / (R - L)) * last)));
      hl.setAttribute('x1', X(i));
      hl.setAttribute('x2', X(i));
      hl.setAttribute('opacity', 1);
      showTip(
        r.left + X(i) * z,
        r.top + (mid - lab - (A.created[i] / max) * amp) * z,
        A.months[i],
        [
          ['Created', String(A.created[i]), '#fff'],
          ['Won', String(A.won[i]), '#FFD0E6'],
        ],
      );
    };
    hit.onpointerleave = () => {
      hl.setAttribute('opacity', 0);
      hideTip();
    };
  }
  drawFlow();

  /* ---- Top open deals ---- */
  const dl = $id('deals');
  const topTotal = data.topDeals.reduce((t, d) => t + d.amount, 0) || 1;
  dl.innerHTML = `${bg(GR.copper)}<div class="in-c"><div class="row" style="justify-content:space-between"><div class="ttl">Top open deals</div><span class="muted">by value</span></div>
    <div class="row" style="margin-top:14px;align-items:flex-end;justify-content:space-between"><span class="big dlv">$0</span><span class="muted" style="padding-bottom:4px">top ${data.topDeals.length}</span></div>
    <div style="display:flex;gap:3px;height:6px;margin-top:16px">${data.topDeals.map((d, i) => `<div style="flex:0 0 calc(${(d.amount / topTotal) * 100}% - 2px);border-radius:3px;background:rgba(255,255,255,${[0.95, 0.6, 0.32][i]})"></div>`).join('')}</div>
    <div style="position:absolute;left:24px;right:24px;bottom:14px">${
      data.topDeals.length
        ? data.topDeals
            .map(
              (
                d,
                i,
              ) => `<div class="row" style="height:50px;${i ? 'border-top:1px solid rgba(255,255,255,.1)' : ''}">
      <div style="flex:1;min-width:0"><div style="font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(d.name)}</div><div class="mono muted" style="font-size:11px">${esc(d.company || '—')}</div></div>
      <div style="width:96px;text-align:right"><div class="mono" style="font-size:13px">${money(d.amount)}</div><div class="mono" style="font-size:11px;color:${WON}">${esc(d.stage)}</div></div></div>`,
            )
            .join('')
        : '<div class="muted">No open deals yet.</div>'
    }</div></div><div class="rim"></div>`;
  tween(
    dl.querySelector('.dlv'),
    data.topDeals.reduce((t, d) => t + d.amount, 0),
    (v) => money(v),
  );

  /* ---- Deals by stage: capsule columns ---- */
  const st = $id('stages');
  st.innerHTML = `${bg(GR.green)}<div class="in-c"><div class="ttl">Deals by stage</div>
    <div style="margin-top:14px"><span class="big sv" style="font-size:34px">0</span></div><div class="muted" style="margin-top:6px">deals in pipeline</div>
    <svg class="sts" style="position:absolute;left:18px;bottom:14px" aria-hidden="true"></svg></div><div class="rim"></div>`;
  tween(
    st.querySelector('.sv'),
    data.stages.reduce((t, s) => t + s.count, 0),
    (v) => String(Math.round(v)),
  );
  function drawStages() {
    const svg = st.querySelector('.sts'),
      S = data.stages,
      W = st.clientWidth - 36,
      Hh = 160,
      pb = 18,
      bw = 22,
      max = Math.max(1, ...S.map((s) => s.count)),
      gap = (W - 8 - bw * S.length) / (S.length - 1);
    svg.setAttribute('width', W);
    svg.setAttribute('height', Hh);
    const Y = (x) => (Hh - pb) * (1 - x / max);
    let s = '';
    S.forEach((x, i) => {
      const X = 4 + i * (bw + gap),
        last = i === S.length - 1;
      s += `<rect x="${X}" y="${Y(max)}" width="${bw}" height="${Hh - pb - Y(max)}" rx="${bw / 2}" fill="rgba(0,0,0,.28)"/>
        <rect class="sb" x="${X}" y="${Hh - pb}" width="${bw}" height="0" rx="${bw / 2}" fill="${last ? WON : '#fff'}" data-y="${Y(x.count)}" data-h="${Hh - pb - Y(x.count)}" style="transition:y .8s var(--ease) ${i * 70}ms,height .8s var(--ease) ${i * 70}ms"/>
        <text x="${X + bw / 2}" y="${Hh - 3}" text-anchor="middle" font-size="10" fill="${last ? '#fff' : T3}" font-family="ui-monospace,monospace">${esc(x.label)}</text>
        <rect class="hit" x="${X - 4}" y="0" width="${bw + 8}" height="${Hh}" fill="transparent" data-i="${i}"/>`;
    });
    svg.innerHTML = s;
    RAF(() =>
      RAF(() =>
        svg.querySelectorAll('.sb').forEach((b) => {
          b.setAttribute('y', b.dataset.y);
          b.setAttribute('height', b.dataset.h);
        }),
      ),
    );
    svg.querySelectorAll('.hit').forEach((h) => {
      h.onpointermove = (e) => {
        const x = S[+h.dataset.i];
        showTip(e.clientX, e.clientY, x.label, [
          ['Deals', String(x.count), '#fff'],
          ['Value', money(x.amount)],
        ]);
      };
      h.onpointerleave = hideTip;
    });
  }
  drawStages();

  let rz;
  const ro = new ResizeObserver(() => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      if (!alive) return;
      nwGrow = 1;
      drawNW();
      drawFlow();
      drawStages();
    }, 120);
  });
  ['nw', 'flow', 'stages'].forEach((id) => ro.observe($id(id)));
  RAF(() => {
    $id('grid').classList.add('in');
    root
      .querySelectorAll('.card')
      .forEach((c, i) => (c.style.transitionDelay = i * 60 + 'ms'));
  });

  return () => {
    alive = false;
    frames.forEach((f) => cancelAnimationFrame(f));
    ro.disconnect();
    clearTimeout(rz);
  };
}

type PulseBentoProps = {
  data: PulseDashboardData;
  title?: string;
  subtitle?: string;
};

export const PulseBento = ({
  data,
  title = 'Dashboard',
  subtitle = '',
}: PulseBentoProps) => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.innerHTML = markup({ title, subtitle });
    const stop = mount(node, data);
    return () => {
      stop();
      node.innerHTML = '';
    };
  }, [data, title, subtitle]);
  return (
    <>
      <style>{CSS}</style>
      <div ref={ref} className="pbn" />
    </>
  );
};
