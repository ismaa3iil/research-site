(function () {
  "use strict";
  const $ = (s, el) => (el || document).querySelector(s);
  const app = $("#app");
  const st = { meta: null, top: null, first: null, thumbs: null, bestmap: null, names: null, arrays: {}, range: "paper", view: "ranks", measure: "Kspec", center: 2, sort: null };
  try { const r = localStorage.getItem("tcx-range"); if (r) st.range = r; } catch (e) {}
  $("#range").value = st.range;
  const NMAX = { paper: 63215, all: 73300 };
  const HM = window.HELP.MEASURES;

  const fmtv = v => v === null || v === undefined || Number.isNaN(v) ? "\u2013" : (Number.isInteger(v) ? v.toLocaleString("en-US") : (Math.abs(v) >= 100 ? v.toFixed(1) : Math.abs(v) >= 1 ? v.toFixed(3) : v.toPrecision(3)));
  const fmtr = r => r === null || r === undefined || Number.isNaN(r) ? "\u2013" : (Number.isInteger(r) ? r.toLocaleString("en-US") : r.toFixed(1));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const getJSON = u => fetch(u).then(r => { if (!r.ok) throw new Error(u + " " + r.status); return r.json(); });
  const mInfo = k => st.meta.measures.find(m => m.key === k);
  const isDiag = k => mInfo(k) && mInfo(k).group === "Diagrams";
  const cx = n => `<a class="cx" href="#center" data-center="${n}">X(${n})</a>`;
  const nm = n => st.names ? esc(st.names[n - 1] || "") : "";

  function thumb(n, map, big) {
    const k = st.thumbs && st.thumbs[n + "_" + map];
    const key = n + "_" + map;
    const note = st.previewStatus?.[key];
    if (!k) {
      const message = note || (map ? "Preview unavailable" : "Map unrecorded");
      return `<div class="thumb${big ? " big" : ""} none" title="${esc(message)}" ${big && !note ? `data-preview="${map}"` : ""}>${big && !note ? "Calculating…" : esc(message)}</div>`;
    }
    const [sheet, i] = k, f = big ? 1.5 : 0.5, x = (i % 10) * 120 * f, y = Math.floor(i / 10) * 104 * f;
    return `<div class="thumb${big ? " big" : ""}" role="img" aria-label="X(${n}) ${map} ${note?.startsWith("Early path") ? esc(note) : "diagram"}" title="X(${n}) ${map}${note ? ` — ${esc(note)}` : ""}" style="background-image:url(thumbs/sprite_${String(sheet).padStart(2, "0")}.png?v=previews2);background-position:-${x}px -${y}px">${note?.startsWith("Early path") ? '<span class="path-label">early path</span>' : ""}</div>`;
  }

  let previewWorkers = [];
  function cancelPreviews() {
    previewWorkers.forEach(worker => worker.terminate());
    previewWorkers = [];
  }
  function loadProfilePreviews(n) {
    for (const slot of app.querySelectorAll("[data-preview]")) {
      const map = slot.dataset.preview;
      const worker = new Worker("preview-worker.js");
      previewWorkers.push(worker);
      worker.onmessage = ({data}) => {
        worker.terminate();
        if (!slot.isConnected) return;
        if (!data.pixels) { slot.textContent = data.reason; return; }
        const canvas = document.createElement("canvas");
        canvas.width = 120; canvas.height = 104; canvas.className = "thumb big";
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", `X(${n}) ${map} calculated preview`);
        canvas.title = data.note || "Calculated 50,000-point preview";
        const ctx = canvas.getContext("2d");
        const image = ctx.createImageData(120, 104);
        data.pixels.forEach((v,i) => image.data.set([v,v,v,255], i*4));
        ctx.putImageData(image,0,0); slot.replaceWith(canvas);
        if (data.note) {
          const caption = document.createElement("div");
          caption.className = "small muted"; caption.textContent = data.note;
          canvas.after(caption);
        }
      };
      worker.onerror = () => { worker.terminate(); slot.textContent = "Could not load preview"; };
      worker.postMessage({n,map});
    }
  }
  async function loadArray(k) { if (!st.arrays[k]) st.arrays[k] = await getJSON(`data/m_${k}.json`); return st.arrays[k]; }
  function ranksOf(arr, better, n0, n1) { // average ranks among non-null values with index in [n0, n1]
    const idx = []; for (let n = n0; n <= n1; n++) { const v = arr[n - 1]; if (v !== null && v !== undefined) idx.push(n); }
    idx.sort((p, q) => better === "low" ? arr[p - 1] - arr[q - 1] : arr[q - 1] - arr[p - 1]);
    const r = new Map(); let i = 0;
    while (i < idx.length) { let j = i; while (j + 1 < idx.length && arr[idx[j + 1] - 1] === arr[idx[i] - 1]) j++; const avg = (i + j) / 2 + 1; for (let k = i; k <= j; k++) r.set(idx[k], avg); i = j + 1; }
    return r;
  }

  // ---------------------------------------------------------------- views
  function measureSelect(id, value, filter) {
    const groups = {}; st.meta.measures.filter(filter || (() => true)).forEach(m => (groups[m.group] = groups[m.group] || []).push(m));
    return `<select id="${id}">` + Object.entries(groups).map(([g, ms]) => `<optgroup label="${g}">` + ms.map(m => `<option value="${m.key}"${m.key === value ? " selected" : ""}>${esc(m.label)}</option>`).join("") + "</optgroup>").join("") + "</select>";
  }
  function defCard(k) {
    const m = mInfo(k), h = HM[k] || {}, first = st.first[st.range][k];
    const ex = [2, 1, 3].map(n => `X(${n}) ${fmtv(first[n - 1][0])} [rank ${fmtr(first[n - 1][1])}]`).join(" \u00b7 ");
    const lead = st.top[st.range][k][0];
    return `<div class="card def"><div class="k">${esc(m.group)} \u00b7 ${m.better === "low" ? "lower is better" : "higher is better"} \u00b7 ${esc(m.unit)}</div><h3>${esc(m.label)}</h3>
      <p>${esc(h.def || "")}</p>${h.how ? `<p><b>How it is computed.</b> ${esc(h.how)}</p>` : ""}${h.read ? `<p><b>How to read it.</b> ${esc(h.read)}</p>` : ""}
      ${k==="CPI4"?atlasLinks():""}<p class="small muted">Defined for ${m.coverage.toLocaleString()} centers in the catalogue, ${m.paper_ranked.toLocaleString()} in X(1)\u2013X(63215). Leader in this range: X(${lead[0]}) with ${fmtv(lead[1])}. ${k==="CPI4"?'<a href="#atlas57">Browse all 57 plates and standings.</a>':"Examples: "+ex+"."}</p></div>`;
  }

  const atlasBase = "../../beauty-of-triangle-centers/downloads/";
  const atlasLinks = () => `<p class="atlas-links"><a href="${atlasBase}Combined_Maps_57_Centers.pdf">57-center atlas (PDF)</a> · <a href="${atlasBase}CPI_Atlas_Top120.pdf">CPI Top 120 (PDF)</a> · <a href="../taste/">Personal Taste Studio</a></p>`;
  function atlasStrip(n) {
    return `<a href="#atlas57" data-atlas-center="${n}" title="Inspect all eight plots for X(${n})"><img width="224" height="25" loading="lazy" alt="Eight map words for X(${n})" src="thumbs/atlas57/X${n}.webp"></a>`;
  }
  async function viewAtlas57(){
    app.innerHTML = '<h1>Combined maps of 57 centers</h1><p>Loading plates…</p>';
    const all=st.atlas57||(st.atlas57=await getJSON("data/atlas57.json"));
    if(st.view!=="atlas57")return;
    const show=n=>{
      st.atlasCenter=n;
      const r=all.find(v=>v.n===n)||all[0];
      app.innerHTML=`<h1>Combined maps of 57 centers</h1><p class="lede">Both single maps placed in the survey’s top 3,500. The center rank sums its four highest live-word learning-progress scores. This atlas shows the full cohort, including centers beyond the paper range.</p>${atlasLinks()}
        <label>Atlas plate <select id="plate57">${all.map(v=>`<option value="${v.n}" ${v.n===r.n?"selected":""}>Rank ${v.rank} · X(${v.n}) · ${v.score.toLocaleString()} bits</option>`).join("")}</select></label>
        <p>${cx(r.n)} · M1 survey rank ${r.m1.toLocaleString()} · M3 survey rank ${r.m3.toLocaleString()}. A star marks a word in the sum.</p>
        <div class="word-gallery">${r.words.map(v=>`<figure><a href="../taste/media/w57-X${r.n}_${v.w}.webp"><img loading="lazy" src="../taste/media/w57-X${r.n}_${v.w}.webp" alt="X(${r.n}) ${v.w} orbit"></a><figcaption><b>${v.w}${v.star?" ★":""}</b> · ${v.map}<br>${v.status} · ${v.cpi} CPI bits<br>${v.count.toLocaleString()} retained steps</figcaption></figure>`).join("")}</div>
        <h2>The 57 standings</h2><div class="tablebox"><table><thead><tr><th>Atlas rank</th><th>Center</th><th>Top-four CPI (bits)</th><th>Open plate</th></tr></thead><tbody>${all.map(v=>`<tr><td>${v.rank}</td><td>${cx(v.n)}</td><td>${v.score.toLocaleString()}</td><td>${atlasStrip(v.n)}</td></tr>`).join("")}</tbody></table></div>`;
      $("#plate57").onchange=e=>show(Number(e.target.value));
    };
    show(st.atlasCenter||all[0].n);
  }
  function viewRanks() {
    const k = st.measure, rows = st.top[st.range][k], diag = isDiag(k), bm = st.bestmap[k] || {};
    app.innerHTML = `<h1>Leaderboards</h1><p class="lede">The first 200 positions of any measure. Ties share average ranks; the range is set in the header.</p>
      <div class="row" style="margin-top:14px"><label class="field" for="msel">Measure ${measureSelect("msel", k)}</label></div>
      <div class="grid2"><div>${defCard(k)}</div><div class="tablebox"><table><thead><tr><th class="num">Rank</th><th>Center</th>${k==="CPI4"?"<th>Eight words</th>":diag ? "<th>Best diagram</th>" : ""}<th>Name</th><th class="num">Value</th></tr></thead><tbody>
      ${rows.map(([n, v, r]) => `<tr><td class="num">${fmtr(r)}</td><td>${cx(n)}</td>${k==="CPI4"?`<td>${atlasStrip(n)}</td>`:diag ? `<td>${thumb(n, bm[n])}</td>` : ""}<td class="name">${nm(n)}</td><td class="num">${fmtv(v)}</td></tr>`).join("")}
      </tbody></table></div></div>`;
    $("#msel").onchange = e => { st.measure = e.target.value; viewRanks(); };
  }

  const GROUP_ORDER = ["Simplicity", "Documentation", "Central lines", "Diagrams", "Phase 1 (X1-X500)", "Combined maps", "Physics"];
  function viewFirst500() {
    const groups = st.f500groups || (st.f500groups = new Set(["Simplicity", "Documentation", "Central lines", "Diagrams", "Physics"]));
    const show = st.meta.measures.filter(m => groups.has(m.group));
    const F = st.first[st.range];
    let ns = Array.from({ length: 500 }, (_, i) => i + 1);
    if (st.sort) { const [k, dir] = st.sort; ns.sort((p, q) => { const a = F[k][p - 1][1], b = F[k][q - 1][1]; const A = a === null ? Infinity : a, B = b === null ? Infinity : b; return dir * (A - B); }); }
    const showT = st.f500thumbs !== false;
    app.innerHTML = `<h1>X(1)\u2013X(500): every rank</h1><p class="lede">Ranks of the first 500 centers under every measure (average ranks in the selected range). Click a column to sort by it; click a center for its full profile.</p>
      <div class="row" style="margin-top:12px"><div class="chips">${GROUP_ORDER.map(g => `<label><input type="checkbox" data-g="${g}"${groups.has(g) ? " checked" : ""}> ${g}</label>`).join("")}
      <label><input type="checkbox" id="tg"${showT ? " checked" : ""}> diagrams M1 / M3</label></div></div>
      <div class="tablebox" style="margin-top:12px;max-height:75vh"><table><thead><tr><th>Center</th>${showT ? "<th>M1</th><th>M3</th>" : ""}<th>Name</th>
      ${show.map(m => `<th class="num" data-k="${m.key}" title="${esc(m.label)}">${m.key}${st.sort && st.sort[0] === m.key ? (st.sort[1] > 0 ? " \u25b2" : " \u25bc") : ""}</th>`).join("")}</tr></thead><tbody>
      ${ns.map(n => `<tr><td>${cx(n)}</td>${showT ? `<td>${thumb(n, "M1")}</td><td>${thumb(n, "M3")}</td>` : ""}<td class="name">${nm(n)}</td>${show.map(m => `<td class="num" title="${esc(m.label)}: ${fmtv(F[m.key][n - 1][0])}">${fmtr(F[m.key][n - 1][1])}</td>`).join("")}</tr>`).join("")}
      </tbody></table></div>`;
    app.querySelectorAll("[data-g]").forEach(cb => cb.onchange = () => { cb.checked ? groups.add(cb.dataset.g) : groups.delete(cb.dataset.g); viewFirst500(); });
    $("#tg").onchange = e => { st.f500thumbs = e.target.checked; viewFirst500(); };
    app.querySelectorAll("th[data-k]").forEach(th => th.onclick = () => { const k = th.dataset.k; st.sort = st.sort && st.sort[0] === k ? [k, -st.sort[1]] : [k, 1]; viewFirst500(); });
  }

  async function viewCenter() {
    cancelPreviews();
    const n = st.center;
    app.innerHTML = `<h1>Center profile</h1><div class="row" style="margin-top:12px"><label class="field" for="cin">Center number <input id="cin" type="number" min="1" max="73300" value="${n}" style="width:9em"></label><button class="primary" id="cgo">Show</button><span class="status" id="cst"></span></div><div id="cbody" style="margin-top:16px"></div>`;
    $("#cgo").onclick = () => { const v = parseInt($("#cin").value, 10); if (v >= 1 && v <= 73300) { st.center = v; viewCenter(); } };
    $("#cin").onkeydown = e => { if (e.key === "Enter") $("#cgo").click(); };
    const ms = st.meta.measures; let vals;
    if (n <= 500) vals = ms.map(m => st.first[st.range][m.key][n - 1]);
    else {
      $("#cst").textContent = "Loading all measures\u2026";
      const arrs = await Promise.all(ms.map(m => loadArray(m.key)));
      if (st.view !== "center" || st.center !== n) return;
      vals = ms.map((m, i) => { const v = arrs[i][n - 1]; if (v === null || n > NMAX[st.range]) return [v, null]; const arr = arrs[i]; let better = 0, tie = 0;
        for (let j = 0; j < NMAX[st.range]; j++) { const w = arr[j]; if (w === null) continue; if (m.better === "low" ? w < v : w > v) better++; else if (w === v) tie++; }
        return [v, better + (tie + 1) / 2]; });
      $("#cst").textContent = "";
    }
    const exps = window.PHYSICS.experiments.filter(e => e.center === n);
    const byG = {}; ms.forEach((m, i) => (byG[m.group] = byG[m.group] || []).push([m, vals[i]]));
    $("#cbody").innerHTML = `<div class="card"><h2>X(${n})</h2><p class="lede">${nm(n) || "(no name recorded)"}</p>
      <div class="row" style="margin-top:12px;gap:18px"><div><div class="small muted">M1 (cevian map)</div>${thumb(n, "M1", true)}</div><div><div class="small muted">M3 (pedal map)</div>${thumb(n, "M3", true)}</div>
      <div class="small muted" style="max-width:40ch">Calculated previews start at 42°, 61°, 77°, discard 4,000 steps and plot 50,000 steps in all six angle orders. Archived previews use their recorded trajectories. A dot can represent a fixed point. An “early path” shows up to the last 256 valid steps of an incomplete run. Hover over it for the step count. ${exps.length ? `<br><b>${exps.length} physical experiment${exps.length > 1 ? "s" : ""}</b> select this center (see Physics).` : ""}</div></div></div>
      <div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr))">${GROUP_ORDER.filter(g => byG[g]).map(g => `<div class="tablebox"><table><thead><tr><th>${g}</th><th class="num">Value</th><th class="num">Rank</th></tr></thead><tbody>
      ${byG[g].map(([m, v]) => `<tr><td title="${esc(m.label)}"><a href="#ranks" data-measure="${m.key}" class="cx" style="font-family:var(--f-body)">${esc(m.label)}</a></td><td class="num">${fmtv(v[0])}</td><td class="num">${fmtr(v[1])}</td></tr>`).join("")}</tbody></table></div>`).join("")}</div>`;
    loadProfilePreviews(n);
  }

  // ---- correlations
  const BLOCKS = [[1, 500], [501, 5000], [5001, 20000], [20001, 40000], [40001, 63215], [1, 63215], [1, 73300]];
  function spearmanPearson(xs, ys, method) {
    const n = xs.length; if (n < 3) return NaN;
    let a = xs, b = ys;
    if (method === "spearman") { const rk = v => { const o = v.map((x, i) => [x, i]).sort((p, q) => p[0] - q[0]); const r = new Array(n); let i = 0; while (i < n) { let j = i; while (j + 1 < n && o[j + 1][0] === o[i][0]) j++; for (let k = i; k <= j; k++) r[o[k][1]] = (i + j) / 2 + 1; i = j + 1; } return r; }; a = rk(xs); b = rk(ys); }
    let ma = 0, mb = 0; for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n;
    let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { const da = a[i] - ma, db = b[i] - mb; sab += da * db; saa += da * da; sbb += db * db; }
    return sab / Math.sqrt(saa * sbb);
  }
  async function corr(k1, k2, n0, n1, method, chaotic) {
    const get = async k => k === "index" ? null : loadArray(k);
    const [A, B] = await Promise.all([get(k1), get(k2)]); const cp = chaotic ? await loadArray("CPI") : null;
    const xs = [], ys = [];
    for (let n = n0; n <= n1; n++) { const x = k1 === "index" ? n : A[n - 1], y = k2 === "index" ? n : B[n - 1]; if (x === null || y === null || x === undefined || y === undefined) continue; if (cp && !(cp[n - 1] > 0)) continue;
      // align directions: "higher is better" measures are negated so that positive correlation means agreement of preferences
      xs.push(k1 !== "index" && mInfo(k1).better === "high" ? -x : x); ys.push(k2 !== "index" && mInfo(k2).better === "high" ? -y : y); }
    return [spearmanPearson(xs, ys, method), xs.length];
  }
  const heat = v => { if (Number.isNaN(v)) return "transparent"; const a = Math.min(1, Math.abs(v)); return v >= 0 ? `color-mix(in srgb, var(--pos) ${Math.round(a * 75)}%, var(--panel))` : `color-mix(in srgb, var(--neg) ${Math.round(a * 75)}%, var(--panel))`; };
  function viewCorrelate() {
    const sel = st.corrSel || (st.corrSel = ["Kspec", "Kexec", "EDAG", "I", "L5", "QT50", "WQ", "CPI", "index"]);
    const opts = st.meta.measures.map(m => [m.key, m.label]).concat([["index", "Catalogue index n (age)"]]);
    app.innerHTML = `<h1>Correlations</h1><p class="lede">Rank (Spearman) or value (Pearson) correlations between any measures, on any sub-sequence of the catalogue. Directions are aligned: a positive value means the two measures prefer the same centers. "Catalogue index" tests the age effect (positive: the measure prefers early centers).</p>
      <div class="card" style="margin-top:14px"><div class="chips" id="csel">${opts.map(([k, l]) => `<label title="${esc(l)}"><input type="checkbox" value="${k}"${sel.includes(k) ? " checked" : ""}> ${k}</label>`).join("")}</div>
      <div class="row" style="margin-top:12px"><label class="field" for="c0">From X( <input id="c0" type="number" min="1" max="73300" value="${st.c0 || 1}" style="width:7em"></label><label class="field" for="c1">to X( <input id="c1" type="number" min="1" max="73300" value="${st.c1 || 63215}" style="width:7em"></label>
      <label class="field" for="cpre">Preset <select id="cpre"><option value="">choose\u2026</option>${BLOCKS.map(([a, b]) => `<option value="${a}-${b}">X(${a})\u2013X(${b})</option>`).join("")}</select></label>
      <label class="field" for="cmeth">Method <select id="cmeth"><option value="spearman">Spearman (ranks)</option><option value="pearson"${st.cmeth === "pearson" ? " selected" : ""}>Pearson (values)</option></select></label>
      <label class="chips"><label><input type="checkbox" id="cchaos"${st.cchaos ? " checked" : ""}> only centers with a chaotic diagram</label></label>
      <button class="primary" id="crun">Compute matrix</button><span class="status" id="cst"></span></div></div>
      <div id="cout" style="margin-top:16px"></div>
      <div class="card" style="margin-top:18px"><h3>One pair across catalogue blocks</h3><div class="row" style="margin-top:10px"><label class="field" for="p1">Measure 1 ${measureSelect("p1", st.p1 || "Kspec")}</label><label class="field" for="p2">Measure 2 <select id="p2">${opts.map(([k, l]) => `<option value="${k}"${(st.p2 || "index") === k ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></label><button id="prun">Compare blocks</button></div><div id="pout" style="margin-top:12px"></div></div>`;
    $("#cpre").onchange = e => { if (!e.target.value) return; const [a, b] = e.target.value.split("-"); $("#c0").value = a; $("#c1").value = b; };
    $("#crun").onclick = async () => {
      const keys = [...app.querySelectorAll("#csel input:checked")].map(i => i.value); st.corrSel = keys;
      const n0 = +$("#c0").value, n1 = +$("#c1").value, method = $("#cmeth").value, chaotic = $("#cchaos").checked; st.c0 = n0; st.c1 = n1; st.cmeth = method; st.cchaos = chaotic;
      if (keys.length < 2 || !(n1 > n0)) { $("#cst").textContent = "Choose at least two measures and a range with From < To."; return; }
      $("#cst").textContent = "Loading measures and computing\u2026";
      const M = {}; for (const a of keys) for (const b of keys) if (a < b || a === b) M[a + "|" + b] = a === b ? [1, null] : await corr(a, b, n0, n1, method, chaotic);
      const g = (a, b) => M[a + "|" + b] || M[b + "|" + a];
      $("#cout").innerHTML = `<div class="tablebox"><table class="heat"><thead><tr><th></th>${keys.map(k => `<th>${k}</th>`).join("")}</tr></thead><tbody>${keys.map(a => `<tr><td class="lab mono">${a}</td>${keys.map(b => { const [v, n] = g(a, b); return `<td style="background:${heat(v)}" title="${a} vs ${b}: n = ${n === null ? "" : n.toLocaleString()}">${Number.isNaN(v) ? "\u2013" : v.toFixed(2)}${n !== null ? `<br><span class="small muted">${n >= 1000 ? Math.round(n / 1000) + "k" : n}</span>` : ""}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div>
        <p class="small muted">X(${n0})\u2013X(${n1}), ${method === "spearman" ? "Spearman \u03c1" : "Pearson r"}${chaotic ? ", centers with a chaotic diagram only" : ""}. Small numbers: centers in each pair.</p>`;
      $("#cst").textContent = "";
    };
    $("#prun").onclick = async () => {
      const a = $("#p1").value, b = $("#p2").value; st.p1 = a; st.p2 = b; $("#pout").innerHTML = '<p class="loading">Computing\u2026</p>';
      const rows = []; for (const [n0, n1] of BLOCKS) { const [v, n] = await corr(a, b, n0, n1, "spearman", false); rows.push([n0, n1, v, n]); }
      $("#pout").innerHTML = `<div class="tablebox"><table><thead><tr><th>Block</th><th class="num">Spearman \u03c1</th><th class="num">Centers</th></tr></thead><tbody>${rows.map(([n0, n1, v, n]) => `<tr><td class="mono">X(${n0})\u2013X(${n1})</td><td class="num" style="background:${heat(v)}">${Number.isNaN(v) ? "\u2013" : v.toFixed(3)}</td><td class="num">${n.toLocaleString()}</td></tr>`).join("")}</tbody></table></div>`;
    };
    if (!st.corrDone) { st.corrDone = true; $("#crun").click(); }
  }

  // ---- physics
  function viewPhysics() {
    const P = window.PHYSICS, T = P.triangle, ex = P.experiments;
    const counts = {}; ex.forEach(e => counts[e.center] = (counts[e.center] || 0) + 1);
    const order = Object.keys(counts).map(Number).sort((p, q) => counts[q] - counts[p] || p - q);
    const f = st.physFilter || "all";
    const list = f === "all" ? ex : ex.filter(e => e.center === +f);
    app.innerHTML = `<h1>Physical experiments</h1>
      <p class="lede">Physical relevance counts distinct physical concepts: experiments that measure different physical quantities or use different physical systems count separately, even when the same formula describes them. Calibrated apparatus and reconstructed triangles do not count. Every diagram and number below is computed on the 13-20-21 reference triangle A(0, 0), B(21, 0), C(16, 12): area ${T.area}, inradius ${T.r.toFixed(3)}, circumradius ${T.R.toFixed(3)}, angles ${T.angles.map(x => x.toFixed(1) + "\u00b0").join(", ")}; it is acute and all its angles are below 120\u00b0, so every experiment applies.</p>
      <div class="row" style="margin-top:12px"><label class="field" for="pf">Show <select id="pf"><option value="all">all ${ex.length} experiments</option>${order.map(n => `<option value="${n}"${String(n) === String(f) ? " selected" : ""}>X(${n}) \u2014 ${counts[n]} experiment${counts[n] > 1 ? "s" : ""}</option>`).join("")}</select></label></div>
      <div class="tablebox" style="margin-top:12px"><table><thead><tr><th class="num">Rank</th><th>Center</th><th class="num">Experiments</th><th class="num">Monograph</th><th class="num">New</th><th>Point on 13-20-21</th></tr></thead><tbody>
      ${(() => { let prev = null, rank = 0; return order.map((n, i) => { if (counts[n] !== prev) { rank = i + 1; prev = counts[n]; } const m = ex.filter(e => e.center === n && e.src === "M").length;
        return `<tr><td class="num">${rank}</td><td>${cx(n)} <span class="small muted">${nm(n)}</span></td><td class="num">${counts[n]}</td><td class="num">${m}</td><td class="num">${counts[n] - m}</td><td class="mono small">${P.P2(P.centers[n])}</td></tr>`; }).join(""); })()}
      </tbody></table></div>
      <div class="phys-grid">${list.map(e => { let s = "", lines = []; try { [s, lines] = e.draw(); } catch (err) { s = '<p class="small muted">Diagram unavailable.</p>'; }
        return `<article class="phys-card"><div class="row" style="gap:6px"><span class="pill">X(${e.center})</span><span class="pill ${e.src === "N" ? "warm" : ""}">${e.src === "N" ? "new in Phase 2" : "monograph"}</span><span class="small muted">${esc(e.domain)}</span></div>
          <h3>${esc(e.title)}</h3><p class="small muted">Measured quantity: ${esc(e.quantity)}</p>${s}<p>${esc(e.text)}</p>${lines.length ? `<div class="num">${lines.map(esc).join("<br>")}</div>` : ""}</article>`; }).join("")}</div>`;
    $("#pf").onchange = e => { st.physFilter = e.target.value; viewPhysics(); };
  }

  function viewHelp() {
    const H = window.HELP;
    app.innerHTML = `<h1>Help</h1><p class="lede">Definitions, methods and findings, drawn from the project's papers and technical documentation.</p>
      <div class="help"><nav aria-label="Help sections">${H.SECTIONS.map(s => `<a href="#help" data-sec="${s.id}">${esc(s.title)}</a>`).join("")}<a href="#help" data-sec="dict">All measures A\u2013Z</a></nav>
      <article>${H.SECTIONS.map(s => `<section id="sec-${s.id}"><h2>${esc(s.title)}</h2>${s.html}</section>`).join("")}
      <section id="sec-dict"><h2>All measures</h2><dl class="measure-dict">${st.meta.measures.map(m => { const h = H.MEASURES[m.key] || {}; return `<dt>${esc(m.label)} <span class="pill">${m.key}</span> <span class="small muted">${esc(m.group)}, ${m.better === "low" ? "lower" : "higher"} is better, ${esc(m.unit)}</span></dt><dd>${esc(h.def || "")} ${h.how ? esc(h.how) : ""} ${h.read ? `<i>${esc(h.read)}</i>` : ""}</dd>`; }).join("")}</dl></section></article></div>`;
    app.querySelectorAll("[data-sec]").forEach(a => a.onclick = ev => { ev.preventDefault(); const el = $("#sec-" + a.dataset.sec); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); });
  }

  // ---------------------------------------------------------------- routing
  const VIEWS = { mytaste:()=>MyTaste.open(app,NMAX[st.range],location.hash.match(/^#mytaste\/entry\/([1-9]\d{0,8})$/)?.[1]), atlas57:viewAtlas57, ranks: viewRanks, first500: viewFirst500, center: viewCenter, correlate: viewCorrelate, physics: viewPhysics, help: viewHelp };
  function route() {
    cancelPreviews();
    const h = (location.hash || "#ranks").slice(1); st.view = /^mytaste\/entry\/[1-9]\d{0,8}$/.test(h) ? "mytaste" : Object.hasOwn(VIEWS,h) ? h : "ranks";
    document.querySelectorAll("nav.tabs a").forEach(a => a.setAttribute("aria-current", a.getAttribute("href") === "#" + st.view ? "page" : "false"));
    VIEWS[st.view](); window.scrollTo(0, 0);
  }
  document.addEventListener("click", e => {
    const plate=e.target.closest("[data-atlas-center]"); if(plate){st.atlasCenter=Number(plate.dataset.atlasCenter);if(location.hash==="#atlas57"){e.preventDefault();viewAtlas57();window.scrollTo(0,0);}return;}
    const c = e.target.closest("[data-center]"); if (c) { st.center = +c.dataset.center; if (location.hash === "#center") { e.preventDefault(); viewCenter(); } return; }
    const m = e.target.closest("[data-measure]"); if (m) { st.measure = m.dataset.measure; }
  });
  $("#range").onchange = e => { st.range = e.target.value; try { localStorage.setItem("tcx-range", st.range); } catch (err) {} route(); };
  window.addEventListener("hashchange", route);
  window.addEventListener("storage", e => {
    if (st.view==="mytaste" && (!e.key || e.key===TasteLibrary.profilesKey || e.key.startsWith(TasteLibrary.prefix))) VIEWS.mytaste();
  });

  Promise.all([getJSON("data/meta.json?edition=41"), getJSON("data/top200.json?edition=41"), getJSON("data/first500.json?edition=41"), getJSON("data/thumbs.json?v=previews2"), getJSON("data/bestmap.json"), getJSON("data/preview-status.json")])
    .then(([meta, top, first, thumbs, bestmap, previewStatus]) => { Object.assign(st, { meta, top, first, thumbs, bestmap, previewStatus }); route();
      getJSON("data/names.json").then(n => { st.names = n; if (!["correlate", "help", "mytaste"].includes(st.view)) VIEWS[st.view](); }); })
    .catch(err => { app.innerHTML = `<p>The data could not be loaded (${esc(err.message)}). Reload the page to try again.</p>`; });
})();
