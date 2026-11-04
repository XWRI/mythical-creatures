(() => {
  const DATA = window.NANSHAN;
  const SCALE = 0.32;   // 每里多少 SVG 单位
  const ROW = 330;      // 山系之间的竖向间距
  const DIRS = { "东": [1, 0], "西": [-1, 0], "南": [0, 1], "北": [0, -1], "东南": [Math.SQRT1_2, Math.SQRT1_2], "东北": [Math.SQRT1_2, -Math.SQRT1_2] };
  const TAGS = ["养生", "心性", "吉兆", "凶兆", "危险", "奇异"];
  const HINTS = ["不迷路", "不嫉妒", "不饿", "大旱", "吃人"];
  const KIND_SEAL = { "兽": "兽", "鸟": "鸟", "鱼": "鱼", "水族": "鳞", "木": "木", "草": "草" };
  const NS = "http://www.w3.org/2000/svg";

  // ---------- 数据整理 ----------
  const mountains = [];
  const byId = {};
  DATA.chains.forEach((chain, ci) => {
    let x = 0, y = ci * ROW;
    chain.mountains.forEach((m, i) => {
      if (m.dir) {
        const [dx, dy] = DIRS[m.dir];
        x += dx * m.li * SCALE;
        y += dy * m.li * SCALE;
      }
      Object.assign(m, { x, y, chain, index: i });
      mountains.push(m);
      byId[m.id] = m;
    });
  });
  const products = mountains.flatMap(m => m.products.map(p => ({ ...p, mountain: m })));

  const digits = "零一二三四五六七八九";
  function cnNum(n) {
    const parts = [];
    const units = [[10000, "万"], [1000, "千"], [100, "百"], [10, "十"]];
    let rest = n, zero = false;
    for (const [u, name] of units) {
      const d = Math.floor(rest / u);
      rest %= u;
      if (d) { if (zero) parts.push("零"); parts.push(digits[d] + name); zero = false; }
      else if (parts.length) zero = true;
    }
    if (rest) { if (zero) parts.push("零"); parts.push(digits[rest]); }
    return parts.join("") || "零";
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function hl(s, q) {
    s = esc(s || "");
    if (!q) return s;
    const qe = esc(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return s.replace(new RegExp(qe, "g"), m => `<mark>${m}</mark>`);
  }

  // ---------- 地图 ----------
  const svg = document.getElementById("map");
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const world = el("g", {}, svg);
  const nodeEls = {};

  DATA.chains.forEach(chain => {
    const ms = chain.mountains;
    const first = ms[0];
    const g = el("g", {}, world);
    const title = el("text", { x: first.x - 10, y: first.y - 56, class: "chain-title" }, g);
    title.textContent = chain.name;
    const sub = el("text", { x: first.x - 8, y: first.y - 36, class: "chain-sub" }, g);
    sub.textContent = `首山 ${first.name} · 其神${chain.god}`;
    for (let i = 1; i < ms.length; i++) {
      const a = ms[i - 1], b = ms[i];
      el("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: "edge" }, g);
      const t = el("text", { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 10, class: "edge-li" }, g);
      t.textContent = `${b.dir}${cnNum(b.li)}里`;
    }
    ms.forEach(m => {
      const ng = el("g", { class: "mtn" + (m.products.length ? " has-beast" : ""), transform: `translate(${m.x},${m.y})`, "data-id": m.id }, g);
      el("rect", { x: -18, y: -18, width: 36, height: 36, class: "sel-ring", transform: "rotate(45)" }, ng);
      el("path", { d: "M-15 9 L-6 -5 L-1 2 L6 -13 L15 9 Z", class: "peak" }, ng);
      const label = el("text", { x: 0, y: 20, class: "label", "text-anchor": "start" }, ng);
      label.textContent = m.name;
      if (m.products.length) {
        const c = el("text", { x: 14, y: -10, class: "count" }, ng);
        c.textContent = m.products.length;
      }
      const tip = el("title", {}, ng);
      tip.textContent = m.name + (m.products.length ? `：${m.products.map(p => p.name).join("、")}` : "");
      nodeEls[m.id] = ng;
    });
  });

  // 视口：viewBox 平移/缩放
  const bounds = (() => {
    const xs = mountains.map(m => m.x), ys = mountains.map(m => m.y);
    return { x: Math.min(...xs) - 60, y: Math.min(...ys) - 90, w: Math.max(...xs) - Math.min(...xs) + 140, h: Math.max(...ys) - Math.min(...ys) + 220 };
  })();
  let vb = { ...bounds };
  const applyVB = () => svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  const fit = () => { vb = { ...bounds }; applyVB(); };
  function toSvg(cx, cy) {
    const pt = svg.createSVGPoint();
    pt.x = cx; pt.y = cy;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  function zoomAt(f, cx, cy) {
    const p = cx == null ? { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 } : toSvg(cx, cy);
    const w = Math.min(Math.max(vb.w * f, 200), bounds.w * 3);
    const k = w / vb.w;
    vb = { x: p.x - (p.x - vb.x) * k, y: p.y - (p.y - vb.y) * k, w, h: vb.h * k };
    applyVB();
  }
  svg.addEventListener("wheel", e => { e.preventDefault(); zoomAt(e.deltaY > 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY); }, { passive: false });
  let drag = null;
  svg.addEventListener("pointerdown", e => {
    drag = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y, moved: false, target: e.target.closest(".mtn") };
  });
  window.addEventListener("pointermove", e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    svg.classList.add("dragging");
    const s = 1 / svg.getScreenCTM().a;
    vb.x = drag.vx - dx * s;
    vb.y = drag.vy - dy * s;
    applyVB();
  });
  window.addEventListener("pointerup", () => {
    if (drag && !drag.moved && drag.target) select(drag.target.dataset.id);
    drag = null;
    svg.classList.remove("dragging");
  });
  document.getElementById("zin").onclick = () => zoomAt(1 / 1.3);
  document.getElementById("zout").onclick = () => zoomAt(1.3);
  document.getElementById("zfit").onclick = fit;
  function centerOn(m) {
    if (m.x < vb.x || m.x > vb.x + vb.w || m.y < vb.y || m.y > vb.y + vb.h) {
      vb.x = m.x - vb.w / 2; vb.y = m.y - vb.h / 2; applyVB();
    }
  }

  // ---------- 状态 ----------
  const state = { sel: null, q: "", tag: null };
  const qInput = document.getElementById("q");
  const tagBox = document.getElementById("tags");
  const panel = document.getElementById("panel");

  // 去掉虚字再比，让“不迷路”能命中“不会迷路”
  const norm = s => s.replace(/食人/g, "吃人").replace(/[会能了的得要就也都很]/g, "");
  function matches() {
    const q = norm(state.q.trim());
    if (!q && !state.tag) return null;
    return products.filter(p => {
      if (state.tag && !p.tags.includes(state.tag)) return false;
      if (!q) return true;
      return [p.name, p.desc, p.effect, p.plain, p.note, p.mountain.name].some(s => s && norm(s).includes(q));
    });
  }

  function renderTags() {
    tagBox.innerHTML = TAGS.map(t => `<button class="tag${state.tag === t ? " on" : ""}" data-tag="${t}">${t}</button>`).join("")
      + HINTS.map(h => `<button class="tag hint" data-hint="${h}">${h}</button>`).join("");
  }
  tagBox.addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.tag) state.tag = state.tag === b.dataset.tag ? null : b.dataset.tag;
    if (b.dataset.hint) { state.q = b.dataset.hint; qInput.value = state.q; }
    state.sel = null;
    render();
  });
  qInput.addEventListener("input", () => { state.q = qInput.value; state.sel = null; render(); });

  function select(id) {
    state.sel = id;
    render();
    centerOn(byId[id]);
  }

  // ---------- 古籍插图 ----------
  const ILL = window.ILLUSTRATIONS || { editions: {}, products: {}, gods: {} };
  // 本地副本由 tools/fetch_illustrations.py 下载，命名规则与其 local_name() 一致
  const imgUrl = file => "assets/illustrations/" + encodeURIComponent(file.replace(/ /g, "_").replace(/\.svg$/i, ".png"));
  const pageUrl = file => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`;
  const edLabel = ed => `${ILL.editions[ed].name} · ${ILL.editions[ed].era}`;

  function figure(list, alt) {
    if (!list || !list.length) return "";
    const [ed, file] = list[0];
    const tabs = list.length > 1
      ? `<span class="fig-tabs">${list.map(([e, f], i) => `<button class="fig-tab${i ? "" : " on"}" data-ed="${e}" data-file="${esc(f)}">${ILL.editions[e].short}</button>`).join("")}</span>`
      : "";
    return `<figure class="fig">
      <a class="fig-img" href="${pageUrl(file)}" target="_blank" rel="noopener"><img src="${imgUrl(file, 480)}" alt="${esc(alt)}" loading="lazy"></a>
      <figcaption><span class="fig-cap" title="${esc(ILL.editions[ed].credit)}">${edLabel(ed)}</span>${tabs}</figcaption>
    </figure>`;
  }

  // ---------- 面板 ----------
  function card(p, q, clickable) {
    const ef = p.effect ? `<div class="ef"><b>${hl(p.effect, q)}</b>${p.plain ? " —— " + hl(p.plain, q) : ""}</div>` : `<div class="ef"></div>`;
    const imgs = ILL.products[p.name];
    const badge = clickable && imgs
      ? `<img class="thumb" src="${imgUrl(imgs[0][1], 120)}" alt="${esc(p.name)}" loading="lazy">`
      : `<div class="seal k-${p.kind}">${KIND_SEAL[p.kind] || p.kind}</div>`;
    return `<div class="card${clickable ? " click" : ""}" data-id="${p.mountain.id}">
      ${clickable ? "" : figure(imgs, p.name)}
      ${badge}
      <div class="nm">${hl(p.name, q)}<small>${clickable ? esc(p.mountain.name) + " · " : ""}${esc(p.kind)}</small></div>
      <div class="ds">${hl(p.desc, q)}${p.note ? `（${esc(p.note)}）` : ""}</div>
      ${ef}
      ${p.tags.length ? `<div class="ctags">${p.tags.map(t => `<i>${t}</i>`).join("")}</div>` : ""}
    </div>`;
  }

  function homeView() {
    const rows = DATA.chains.map(c => {
      const n = c.mountains.length;
      const li = c.mountains.reduce((s, m) => s + m.li, 0);
      return `<div>${c.name}</div>
        <div class="${n !== c.stated.count ? "bad" : ""}">${n} / ${c.stated.count}</div>
        <div class="${li !== c.stated.li ? "bad" : ""}">${li} / ${c.stated.li}</div>`;
    }).join("");
    const beasts = products.length;
    return `<h2>南山经</h2>
      <div class="crumb">五藏山经之首 · 三列山系 · ${mountains.length} 座山 · ${beasts} 种有名奇物</div>
      <h3>怎么用</h3>
      <p class="baihua">点地图上的山看原文与物产。青色的山有异兽奇木，红色数字是数量。上方可以按功效反查，比如“不迷路”“不嫉妒”，也可以按标签筛选。</p>
      <h3>原文自洽检查</h3>
      <div class="stats">
        <div class="h">山系</div><div class="h">山数 录/载</div><div class="h">里程 推/载</div>
        ${rows}
      </div>
      <p class="baihua">红色表示原文条目与总结句对不上：首经少一山、少二百五十里，次三经少一山、少八百里，一般认为是传抄脱文；次二经则多出十里。</p>
      <p class="yuanwen">${esc(DATA.closing)}</p>
      <h3>山神与祭祀</h3>
      ${DATA.chains.map(c => `<p class="baihua"><b>${c.name}</b>：${esc(c.summary)}</p>${figure(ILL.gods[c.id], c.name + "山神")}`).join("")}
      <h3>插图出处</h3>
      <p class="baihua">异兽图取自明清刻本的公版扫描（Wikimedia Commons），点图可看原始文件页。</p>`;
  }

  function mountainView(m, q, fromSearch) {
    const c = m.chain;
    const prev = c.mountains[m.index - 1], next = c.mountains[m.index + 1];
    return `${fromSearch ? `<p><span class="link" data-back>← 返回检索结果</span></p>` : `<p><span class="link" data-home>← 南山经总览</span></p>`}
      <div class="crumb">${c.name} · 第 ${m.index + 1} 山${m.dir ? ` · 自上一山${m.dir}行${cnNum(m.li)}里` : " · 首山"}</div>
      <h2>${esc(m.name)}</h2>
      ${m.note ? `<div class="note">${esc(m.note)}</div>` : ""}
      <h3>原文</h3>
      <div class="yuanwen">${hl(m.text, q)}</div>
      <h3>白话</h3>
      <div class="baihua">${esc(m.bh)}</div>
      ${m.products.length ? `<h3>异兽奇珍</h3>${m.products.map(p => card({ ...p, mountain: m }, q, false)).join("")}` : ""}
      ${m.res.length ? `<h3>物产</h3><div class="res">${m.res.map(r => `<span>${esc(r)}</span>`).join("")}</div>` : ""}
      <h3>沿途</h3>
      <p class="baihua">
        ${prev ? `<span class="link" data-go="${prev.id}">← ${esc(prev.name)}</span>` : "（首山）"}
        &nbsp;·&nbsp;
        ${next ? `<span class="link" data-go="${next.id}">${esc(next.name)} →</span>` : "（山系终点）"}
      </p>`;
  }

  function resultsView(list, q) {
    const label = [state.tag, q].filter(Boolean).join(" + ");
    if (!list.length) return `<h2>检索</h2><p class="empty">没有找到与「${esc(label)}」相关的记载。试试“不饥”“佩之”“见则”。</p>`;
    return `<h2>检索</h2>
      <div class="crumb">「${esc(label)}」· ${list.length} 条，分布于 ${new Set(list.map(p => p.mountain.id)).size} 座山</div>
      <h3>结果</h3>
      ${list.map(p => card(p, q, true)).join("")}`;
  }

  panel.addEventListener("click", e => {
    const t = e.target;
    const tab = t.closest(".fig-tab");
    if (tab) {
      const fig = tab.closest(".fig");
      const file = tab.dataset.file;
      fig.querySelector("img").src = imgUrl(file, 480);
      fig.querySelector(".fig-img").href = pageUrl(file);
      const cap = fig.querySelector(".fig-cap");
      cap.textContent = edLabel(tab.dataset.ed);
      cap.title = ILL.editions[tab.dataset.ed].credit;
      fig.querySelectorAll(".fig-tab").forEach(b => b.classList.toggle("on", b === tab));
      return;
    }
    if (t.closest("[data-home]")) { state.sel = null; render(); return; }
    if (t.closest("[data-back]")) { state.sel = null; render(); return; }
    const go = t.closest("[data-go]");
    if (go) { select(go.dataset.go); return; }
    const c = t.closest(".card.click");
    if (c) select(c.dataset.id);
  });

  function render() {
    renderTags();
    const list = matches();
    const hit = list ? new Set(list.map(p => p.mountain.id)) : null;
    for (const id in nodeEls) {
      const n = nodeEls[id];
      n.classList.toggle("hit", !!hit && hit.has(id));
      n.classList.toggle("dim", !!hit && !hit.has(id));
      n.classList.toggle("sel", state.sel === id);
    }
    const q = state.q.trim();
    if (state.sel) panel.innerHTML = mountainView(byId[state.sel], q, !!list);
    else if (list) panel.innerHTML = resultsView(list, q);
    else panel.innerHTML = homeView();
    panel.scrollTop = 0;
  }

  // 初始视图：从西端开始、字号可读；⟲ 才是全图
  function start() {
    const w = Math.min(bounds.w, svg.clientWidth / 0.8);
    const h = w * svg.clientHeight / svg.clientWidth;
    vb = { x: bounds.x, y: bounds.y + bounds.h / 2 - h / 2, w, h };
    applyVB();
  }
  start();
  render();
})();
