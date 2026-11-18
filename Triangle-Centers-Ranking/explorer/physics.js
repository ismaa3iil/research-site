/* Physical experiments that select triangle centers, computed on the 13-20-21 reference triangle.
   A = (0,0), B = (21,0), C = (16,12): a = BC = 13, b = CA = 20, c = AB = 21, area 126, r = 14/3, R = 65/6.
   Each experiment is one physical concept (a different measured quantity or physical system); several share
   the same mathematics, and they are counted separately on purpose. */
(function () {
  "use strict";
  const A = [0, 0], B = [21, 0], C = [16, 12];
  const V = [A, B, C];
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
  const mul = (p, k) => [p[0] * k, p[1] * k];
  const dot = (p, q) => p[0] * q[0] + p[1] * q[1];
  const len = p => Math.hypot(p[0], p[1]);
  const dist = (p, q) => len(sub(p, q));
  const lerp = (p, q, t) => add(p, mul(sub(q, p), t));
  const comb = (w, P) => { const s = w[0] + w[1] + w[2]; return [(w[0] * P[0][0] + w[1] * P[1][0] + w[2] * P[2][0]) / s, (w[0] * P[0][1] + w[1] * P[1][1] + w[2] * P[2][1]) / s]; };
  const foot = (p, u, v) => { const d = sub(v, u); return add(u, mul(d, dot(sub(p, u), d) / dot(d, d))); };
  const reflect = (p, u, v) => sub(mul(foot(p, u, v), 2), p);
  const sides = T => [dist(T[1], T[2]), dist(T[2], T[0]), dist(T[0], T[1])];
  const area = T => Math.abs((T[1][0] - T[0][0]) * (T[2][1] - T[0][1]) - (T[2][0] - T[0][0]) * (T[1][1] - T[0][1])) / 2;
  const angles = T => { const [a, b, c] = sides(T); return [Math.acos((b * b + c * c - a * a) / (2 * b * c)), Math.acos((c * c + a * a - b * b) / (2 * c * a)), Math.acos((a * a + b * b - c * c) / (2 * a * b))]; };
  const centroid = T => comb([1, 1, 1], T);
  const incenter = T => comb(sides(T), T);
  const circumcenter = T => { const [a0, b0, c0] = T; const d = 2 * (a0[0] * (b0[1] - c0[1]) + b0[0] * (c0[1] - a0[1]) + c0[0] * (a0[1] - b0[1]));
    return [(dot(a0, a0) * (b0[1] - c0[1]) + dot(b0, b0) * (c0[1] - a0[1]) + dot(c0, c0) * (a0[1] - b0[1])) / d,
            (dot(a0, a0) * (c0[0] - b0[0]) + dot(b0, b0) * (a0[0] - c0[0]) + dot(c0, c0) * (b0[0] - a0[0])) / d]; };
  const spieker = T => { const [a, b, c] = sides(T); const P = a + b + c;
    return mul(add(add(mul(add(T[1], T[2]), a), mul(add(T[2], T[0]), b)), mul(add(T[0], T[1]), c)), 1 / (2 * P)); };
  const sdist = (p, u, v, w) => { const n = [u[1] - v[1], v[0] - u[0]]; const s = dot(sub(p, u), n) / len(n); return s * Math.sign(dot(sub(w, u), n)); };
  const LINES = [[B, C, A], [C, A, B], [A, B, C]];

  const [a, b, c] = sides(V), s = (a + b + c) / 2, S = area(V), ang = angles(V);
  const G = centroid(V), I = incenter(V), O = circumcenter(V), H = sub(mul(G, 3), mul(O, 2));
  const N = mul(add(O, H), 0.5), X10 = spieker(V), r = S / s, R = a * b * c / (4 * S);
  const K = comb([a * a, b * b, c * c], V);
  const X360 = comb(ang, V);
  const X1125 = mul(add(mul(G, 3), I), 0.25), X140 = mul(add(mul(G, 3), O), 0.25), X549 = mul(add(G, O), 0.5);
  const orth = [foot(A, B, C), foot(B, C, A), foot(C, A, B)];
  const X51 = centroid(orth), X389 = spieker(orth);
  const X15 = comb(ang.map((t, i) => [a, b, c][i] * Math.sin(t + Math.PI / 3)), V);
  // Fermat point by Weiszfeld iteration
  let F = G.slice(); for (let k = 0; k < 500; k++) { let wx = 0, wy = 0, ws = 0; for (const v of V) { const d = dist(F, v); wx += v[0] / d; wy += v[1] / d; ws += 1 / d; } F = [wx / ws, wy / ws]; }
  const X13 = F;
  const touch = [foot(I, B, C), foot(I, C, A), foot(I, A, B)];
  const CENTERS = { 1: I, 2: G, 3: O, 4: H, 5: N, 6: K, 10: X10, 13: X13, 15: X15, 51: X51, 140: X140, 360: X360, 389: X389, 549: X549, 1125: X1125 };

  // ---------- small deterministic RNG
  function rng(seed) { let x = seed >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
  function randInTri(u) { let p = u(), q = u(); if (p + q > 1) { p = 1 - p; q = 1 - q; } return add(A, add(mul(sub(B, A), p), mul(sub(C, A), q))); }
  function inside(p) { return sdist(p, B, C, A) >= 0 && sdist(p, C, A, B) >= 0 && sdist(p, A, B, C) >= 0; }

  // ---------- simulations (computed once)
  const SIM = {};
  SIM.gas = (() => { const u = rng(7); let sx = 0, sy = 0; const pts = []; const n = 20000; for (let k = 0; k < n; k++) { const p = randInTri(u); sx += p[0]; sy += p[1]; if (k < 350) pts.push(p); } return { pts, mean: [sx / n, sy / n], n }; })();
  SIM.brown = (() => { const u = rng(11); let p = I.slice(); const path = [p]; let sx = 0, sy = 0; const n = 400000;
    for (let k = 0; k < n; k++) { const t = u() * 2 * Math.PI; let q = add(p, [0.45 * Math.cos(t), 0.45 * Math.sin(t)]);
      for (const [x, y, w] of LINES) if (sdist(q, x, y, w) < 0) q = reflect(q, x, y); if (!inside(q)) q = p; p = q; sx += p[0]; sy += p[1]; if (k < 1500) path.push(p); }
    return { path, mean: [sx / n, sy / n], n }; })();
  SIM.billiard = (() => { let p = [6, 2], d = [Math.cos(0.7317), Math.sin(0.7317)]; const path = [p]; let sx = 0, sy = 0, T = 0; const segs = 60000;
    for (let k = 0; k < segs; k++) { let best = Infinity, which = -1;
      LINES.forEach(([x, y], i) => { const e = sub(y, x), den = d[0] * e[1] - d[1] * e[0]; if (Math.abs(den) < 1e-12) return; const w = sub(x, p);
        const t = (w[0] * e[1] - w[1] * e[0]) / den, s2 = (w[0] * d[1] - w[1] * d[0]) / den; if (t > 1e-9 && s2 >= -1e-9 && s2 <= 1 + 1e-9 && t < best) { best = t; which = i; } });
      if (which < 0) break; const q = add(p, mul(d, best)); const mid = mul(add(p, q), 0.5); sx += mid[0] * best; sy += mid[1] * best; T += best;
      const [x, y] = LINES[which]; const e = sub(y, x); const n = [-e[1], e[0]]; const nn = len(n); const nu = [n[0] / nn, n[1] / nn];
      d = sub(d, mul(nu, 2 * dot(d, nu))); p = q; if (k < 45) path.push(p); }
    return { path, mean: [sx / T, sy / T], segs }; })();
  SIM.pursuit = (() => { let P = V.map(v => v.slice()); const paths = [[], [], []]; const k = 0.02;
    for (let t = 0; t < 600; t++) { const Q = P.map((p, i) => add(p, mul(sub(P[(i + 1) % 3], p), k))); P = Q; if (t % 6 === 0) P.forEach((p, i) => paths[i].push(p)); }
    return { paths, end: centroid(P) }; })();
  SIM.wireField = (() => { // Coulomb field of uniformly charged sides (k*lambda = 1), numerical quadrature
    const field = p => { let E = [0, 0]; for (const [x, y] of LINES) { const L = dist(x, y), n = 400; for (let i = 0; i < n; i++) { const q = lerp(x, y, (i + 0.5) / n); const d = sub(p, q); const r3 = Math.pow(len(d), 3); E = add(E, mul(d, (L / n) / r3)); } } return E; };
    return { atI: len(field(I)), atG: len(field(G)), atO: len(field(O)) }; })();
  SIM.band = (() => { const eps = 0.5, kap = 1 - eps / r; const inner = V.map(v => add(I, mul(sub(v, I), kap)));
    const ci = centroid(inner); const m = (S * 1) * 1, mi = S * kap * kap; return { inner, com: mul(sub(mul(G, m), mul(ci, mi)), 1 / (m - mi)), eps }; })();
  SIM.chips = (() => { const eps = 1.0; let mx = 0, my = 0, M = 0; V.forEach((v, i) => { const al = ang[i]; const ar = al * eps * eps / 2; const u1 = sub(V[(i + 1) % 3], v), u2 = sub(V[(i + 2) % 3], v);
      const bis = add(mul(u1, 1 / len(u1)), mul(u2, 1 / len(u2))); const bu = mul(bis, 1 / len(bis)); const dcen = 4 * eps * Math.sin(al / 2) / (3 * al); const cpt = add(v, mul(bu, dcen));
      mx += cpt[0] * ar; my += cpt[1] * ar; M += ar; }); return { com: [mx / M, my / M], eps }; })();

  // ---------- drawing
  const W = 360, Hh = 230, pad = 18;
  const sc = Math.min((W - 2 * pad) / 21, (Hh - 2 * pad) / 12);
  const X = p => (pad + p[0] * sc).toFixed(1), Y = p => (Hh - pad - p[1] * sc).toFixed(1);
  const pt = p => `${X(p)},${Y(p)}`;
  function svg(inner, extraH) { return `<svg viewBox="0 0 ${W} ${Hh + (extraH || 0)}" class="phys-svg" role="img" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`; }
  const tri = (fill) => `<polygon points="${V.map(pt).join(" ")}" class="${fill ? "tri-fill" : "tri"}"/>` + ["A", "B", "C"].map((l, i) => `<text x="${+X(V[i]) + (i === 1 ? 5 : i === 0 ? -12 : -4)}" y="${+Y(V[i]) + (i === 2 ? -6 : 14)}" class="lbl">${l}</text>`).join("");
  const dotp = (p, cls, rr) => `<circle cx="${X(p)}" cy="${Y(p)}" r="${rr || 3.2}" class="${cls || "pt-main"}"/>`;
  const lab = (p, t, dx, dy) => `<text x="${+X(p) + (dx || 6)}" y="${+Y(p) + (dy || -6)}" class="lbl">${t}</text>`;
  const seg = (p, q, cls) => `<line x1="${X(p)}" y1="${Y(p)}" x2="${X(q)}" y2="${Y(q)}" class="${cls || "ln"}"/>`;
  const circ = (p, rad, cls) => `<circle cx="${X(p)}" cy="${Y(p)}" r="${(rad * sc).toFixed(1)}" class="${cls || "cir"}"/>`;
  const poly = (P, cls) => `<polygon points="${P.map(pt).join(" ")}" class="${cls}"/>`;
  const pline = (P, cls) => `<polyline points="${P.map(pt).join(" ")}" class="${cls}"/>`;
  function zig(p, q) { const n = 9, d = sub(q, p), L = len(d), nu = [-d[1] / L, d[0] / L]; const P = [p];
    for (let i = 1; i < n; i++) P.push(add(lerp(p, q, i / n), mul(nu, (i % 2 ? 0.35 : -0.35)))); P.push(q); return pline(P, "spring"); }
  function arrow(p, q, cls) { const d = sub(q, p), L = len(d) || 1, u = [d[0] / L, d[1] / L], nrm = [-u[1], u[0]]; const h1 = add(q, add(mul(u, -0.5), mul(nrm, 0.25))), h2 = add(q, add(mul(u, -0.5), mul(nrm, -0.25)));
    return seg(p, q, cls || "arr") + `<polygon points="${pt(q)} ${pt(h1)} ${pt(h2)}" class="arrh"/>`; }
  const contours = (k) => { let o = ""; for (let i = 1; i <= k; i++) { const kap = 1 - i / (k + 1); o += poly(V.map(v => add(I, mul(sub(v, I), kap))), "contour"); } return o; };
  const ridges = () => V.map(v => seg(v, I, "ridge")).join("");
  const images = p => LINES.map(([x, y]) => reflect(p, x, y));

  const fmt = (v, d) => (+v).toFixed(d === undefined ? 2 : d);
  const P2 = p => `(${fmt(p[0])}, ${fmt(p[1])})`;

  // diagram builders: return [svg, numeric example lines]
  const D = {
    plate: (p, n, extra) => [svg(tri(true) + (extra || "") + dotp(p) + lab(p, n)), []],
    masses: () => [svg(tri() + V.map(v => `<circle cx="${X(v)}" cy="${Y(v)}" r="8" class="mass"/>`).join("") + V.map(v => seg(v, G, "ln-faint")).join("") + dotp(G) + lab(G, "X(2)")),
      [`Three 1 kg masses at A, B, C balance at ((0+21+16)/3, (0+0+12)/3) = ${P2(G)}.`]],
    rods: () => { const mids = LINES.map(([x, y]) => mul(add(x, y), 0.5));
      return [svg(LINES.map(([x, y]) => seg(x, y, "rod")).join("") + tri() + mids.map(m => dotp(m, "pt-aux")).join("") + dotp(G) + lab(G, "X(2)")),
        [`Each rod weighs 1 kg although the rods are 13, 20 and 21 long; the midpoints ${mids.map(P2).join(", ")} average to ${P2(G)}.`, "With equal linear density instead, the balance point moves to the Spieker center X(10)."]]; },
    springsV: () => [svg(tri() + V.map(v => zig(v, G)).join("") + dotp(G) + lab(G, "X(2)")),
      [`Energy k/2\u00b7\u03a3|P\u2212V|\u00b2 is least where 3P = A+B+C, i.e. at ${P2(G)}.`, `At the equilibrium the spring lengths are ${V.map(v => fmt(dist(v, G))).join(", ")}.`]],
    sampled: (title) => { const u = rng(3); let o = ""; for (let k = 0; k < 60; k++) { const q = randInTri(u); o += seg(G, q, "ln-faint") + dotp(q, "pt-aux", 1.2); }
      return [svg(tri(true) + o + dotp(G) + lab(G, "X(2)")), [title || `The pull of every element of the uniform plate (area 126) balances at the area centroid ${P2(G)}.`]]; },
    gas: () => [svg(tri() + SIM.gas.pts.map(q => dotp(q, "pt-aux", 1.1)).join("") + dotp(G) + lab(G, "X(2)") + dotp(SIM.gas.mean, "pt-sim", 2.4)),
      [`Monte Carlo with ${SIM.gas.n.toLocaleString()} molecule positions: mean ${P2(SIM.gas.mean)}; exact centroid ${P2(G)}.`]],
    brown: () => [svg(tri() + pline(SIM.brown.path, "path") + dotp(G) + lab(G, "X(2)") + dotp(SIM.brown.mean, "pt-sim", 2.4)),
      [`Reflecting random walk, ${SIM.brown.n.toLocaleString()} steps of length 0.45 from the incenter: time-averaged position ${P2(SIM.brown.mean)}; exact ${P2(G)}.`]],
    billiard: () => [svg(tri() + pline(SIM.billiard.path, "path") + dotp(G) + lab(G, "X(2)") + dotp(SIM.billiard.mean, "pt-sim", 2.4)),
      [`A ball bouncing specularly for ${SIM.billiard.segs.toLocaleString()} segments (first 45 drawn) spends its time on average at ${P2(SIM.billiard.mean)}; the exact limit is ${P2(G)}.`]],
    blur: () => [svg(`<defs><filter id="blr"><feGaussianBlur stdDeviation="6"/></filter></defs><polygon points="${V.map(pt).join(" ")}" class="glow" filter="url(#blr)"/>` + tri() + dotp(G) + lab(G, "X(2)")),
      [`A symmetric blur moves light around but not its centroid: the image of the uniformly lit triangle stays centered at ${P2(G)}.`]],
    field: (p, n, label) => [svg(tri(true) + `<text x="${W / 2}" y="${Hh - 3}" class="cap" text-anchor="middle">${label}</text>` + dotp(p) + lab(p, n)), []],
    table: (p, n, kind) => { const w = [sdist(p, B, C, A) * a, sdist(p, C, A, B) * b, sdist(p, A, B, C) * c].map(x => x / (2 * S));
      const legs = V.map((v, i) => `<rect x="${+X(v) - 4}" y="${+Y(v) - 4}" width="8" height="8" class="leg"/>` + lab(v, (100 * w[i]).toFixed(1) + "%", i === 1 ? -36 : 6, i === 2 ? -8 : 16)).join("");
      const lines = kind === "load" ? [`A 300 N load at ${P2(p)} is carried by the legs at A, B, C as ${w.map(x => fmt(300 * x, 0) + " N").join(", ")} (its barycentric coordinates); no leg takes more than 100 N, the best possible.`]
        : [`At the incenter the load is ${fmt(r)} units from every tipping edge (the inradius); any other point is closer to some edge.`];
      return [svg(tri(true) + legs + (kind === "tip" ? touch.map(t => seg(p, t, "ln-dash")).join("") : "") + dotp(p) + lab(p, n)), lines]; },
    pursuit: () => [svg(tri() + SIM.pursuit.paths.map(P => pline(P, "path")).join("") + dotp(G) + lab(G, "X(2)")),
      [`Each robot moves toward the next with speed proportional to the distance; the three paths meet at ${P2(SIM.pursuit.end)} = X(2).`]],
    roof: (p, n, what) => [svg(tri(true) + contours(5) + ridges() + dotp(p) + lab(p, n)), what || []],
    disk: () => [svg(tri() + circ(I, r, "cir-fill") + touch.map(t => seg(I, t, "ln-dash")).join("") + dotp(I) + lab(I, "X(1)")),
      [`The largest balloon that fits has radius r = area/s = 126/27 = ${fmt(r, 3)}, centered at ${P2(I)}.`]],
    wave: (label) => [svg(tri() + contours(6) + dotp(I) + lab(I, "X(1)")), [label || `Fronts moving inward at unit speed from all three sides meet last at the incenter, after time r = ${fmt(r, 3)}.`]],
    wire: () => { let arcs = ""; const pts = touch; [[0, 1], [1, 2], [2, 0]].forEach(() => {}); arcs = circ(I, r, "cir-dash");
      return [svg(LINES.map(([x, y]) => seg(x, y, "rod")).join("") + tri() + arcs + V.map(v => seg(I, v, "ln-faint")).join("") + dotp(I) + lab(I, "X(1)")),
        [`Numerical field of the charged frame (k\u03bb = 1): |E| at the incenter = ${SIM.wireField.atI.toExponential(1)}, at the centroid = ${fmt(SIM.wireField.atG, 3)}, at the circumcenter = ${fmt(SIM.wireField.atO, 3)}.`,
         "Each side acts at the incenter like the arc of the incircle in the same angular sector; the three arcs make the whole incircle, so the forces cancel."]]; },
    echo: (p, n) => { const im = images(p); return [svg(tri() + im.map(q => seg(p, q, "ln-dash") + dotp(q, "pt-aux", 2.5)).join("") + dotp(p) + lab(p, n)),
      [`Distances from ${n} to its three images: ${im.map(q => fmt(dist(p, q))).join(", ")} (twice the inradius, ${fmt(2 * r)}): echoes return together after 2r/c.`]]; },
    images: (p, n, kind) => { const im = images(p); const g = centroid(im); const [x, y, z] = sides(im);
      const lines = { centroid: [`Images of the lamp at ${P2(p)}: ${im.map(P2).join(", ")}; their centroid ${P2(g)} coincides with the lamp.`],
        equi: [`Images: ${im.map(P2).join(", ")}; side lengths ${fmt(x)}, ${fmt(y)}, ${fmt(z)}: equilateral.`],
        area: [`Image triangle area with the lamp at the circumcenter: ${fmt(area(im))}; with the lamp at the centroid: ${fmt(area(images(G)))}.`],
        inc: [`Images of a lamp at the orthocenter ${P2(p)}: their incenter ${P2(incenter(im))} is the lamp itself.`] }[kind];
      return [svg(tri() + poly(im, "img-tri") + im.map(q => seg(p, q, "ln-dash") + dotp(q, "pt-aux", 2.5)).join("") + dotp(p) + lab(p, n)), lines]; },
    wireframe: () => { const mids = LINES.map(([x, y]) => mul(add(x, y), 0.5));
      return [svg(LINES.map(([x, y]) => seg(x, y, "rod")).join("") + tri() + mids.map((m, i) => dotp(m, "pt-aux") + lab(m, ["13", "20", "21"][i], 4, 12)).join("") + dotp(X10) + lab(X10, "X(10)")),
        [`A frame of uniform wire weighs 13, 20 and 21 units on the three sides; the side midpoints weighted by length balance at ${P2(X10)}.`]]; },
    band: () => [svg(tri(true) + poly(SIM.band.inner, "inner") + dotp(X10) + lab(X10, "X(10)") + dotp(SIM.band.com, "pt-sim", 2.4)),
      [`A band of width ${SIM.band.eps} cut from the plate balances at ${P2(SIM.band.com)}; as the width shrinks it tends to X(10) = ${P2(X10)}.`]],
    loop: (p, n, text) => [svg(LINES.map(([x, y]) => arrow(lerp(x, y, 0.3), lerp(x, y, 0.7), "arr-cur")).join("") + tri() + dotp(p) + lab(p, n)), [text]],
    emit: () => [svg(tri() + circ(O, R, "cir-dash") + V.map(v => seg(v, O, "ln-dash")).join("") + dotp(O) + lab(O, "X(3)")),
      [`Pulses sent at the same moment from A, B and C arrive together at ${P2(O)}, after travelling R = abc/(4\u00b7area) = ${fmt(R, 3)} each.`]],
    tripod: () => [svg(tri() + V.map(v => seg(v, O, "rod")).join("") + dotp(O) + lab(O, "apex over X(3)") + dotp(X549, "pt-sim", 2.6) + lab(X549, "X(549)", -40, 14)),
      [`Legs of length 15 reach a common apex at height \u221a(15\u00b2 \u2212 R\u00b2) = ${fmt(Math.sqrt(225 - R * R))} above ${P2(O)}.`, `The three equal rods balance above ${P2(X549)} = midpoint of X(2) and X(3).`]],
    burn: () => [svg(tri() + V.map(v => circ(v, R * 0.92, "cir-faint")).join("") + dotp(O) + lab(O, "X(3)")),
      [`Fires lit at the three corners burn outward at equal speed; the last point of the field to burn is ${P2(O)}, at distance R = ${fmt(R, 3)} from every corner.`]],
    fermat: (label) => [svg(tri() + V.map(v => seg(v, X13, "string")).join("") + dotp(X13) + lab(X13, "X(13)")),
      [label || `The three strings meet at ${P2(X13)} at 120\u00b0 to each other; total length ${fmt(V.reduce((t, v) => t + dist(v, X13), 0))} (from the centroid it would be ${fmt(V.reduce((t, v) => t + dist(v, G), 0))}).`]],
    walls: () => { const th = LINES.map(([x, y]) => { const u = sub(x, X13), v = sub(y, X13); return Math.acos(dot(u, v) / (len(u) * len(v))) * 180 / Math.PI; });
      return [svg(tri() + V.map(v => seg(X13, v, "ln-dash")).join("") + `<circle cx="${X(X13)}" cy="${Y(X13)}" r="7" class="lamp"/>` + lab(X13, "X(13)")),
        [`From the lamp at ${P2(X13)} the walls BC, CA, AB are seen under ${th.map(t => fmt(t, 1) + "\u00b0").join(", ")}: each receives one third of the light.`]]; },
    chips: () => [svg(tri() + V.map((v, i) => { const u1 = sub(V[(i + 1) % 3], v), u2 = sub(V[(i + 2) % 3], v); const e = 1.6; const p1 = add(v, mul(u1, e / len(u1))), p2 = add(v, mul(u2, e / len(u2)));
        return `<path d="M${pt(v)} L${pt(p1)} A${(e * sc).toFixed(1)} ${(e * sc).toFixed(1)} 0 0 0 ${pt(p2)} Z" class="chip"/>`; }).join("") + dotp(X360) + lab(X360, "X(360)") + dotp(SIM.chips.com, "pt-sim", 2.4)),
      [`Chips of radius ${SIM.chips.eps} at the corners have areas proportional to the angles ${ang.map(t => fmt(t * 180 / Math.PI, 1) + "\u00b0").join(", ")}; they balance at ${P2(SIM.chips.com)}, tending to X(360) = ${P2(X360)} as the radius shrinks.`]],
    currents: () => [svg(tri() + V.map(v => `<circle cx="${X(v)}" cy="${Y(v)}" r="6" class="wirein"/><circle cx="${X(v)}" cy="${Y(v)}" r="1.6" class="wiredot"/>`).join("") + dotp(X360) + lab(X360, "X(360)")),
      [`Three equal currents perpendicular to the plate through the vertices; the energy mean inside the triangle weights each vertex by its angle: X(360) = (\u03b1A+\u03b2B+\u03b3C)/\u03c0 = ${P2(X360)}.`]],
    corner: () => { const x = Math.sqrt((b * b + c * c - a * a) / 2), y = Math.sqrt((c * c + a * a - b * b) / 2), z = Math.sqrt((a * a + b * b - c * c) / 2);
      return [svg(tri() + V.map((v, i) => seg(v, orth[i], "ln-dash")).join("") + dotp(H) + lab(H, "X(4)") + dotp(N, "pt-sim", 2.6) + lab(N, "X(5)", 6, 14)),
        [`The pane fits the box corner with the vertices at distances ${fmt(x)}, ${fmt(y)}, ${fmt(z)} along the three edges; its point nearest the corner is the orthocenter ${P2(H)}.`,
         `The sawn-off block balances above (3\u00b7X(2) + X(4))/4 = ${P2(N)} = X(5).`]]; },
    fagnano: (focus) => { const lines = { 4: `The mirror normals at the bounce points ${orth.map(P2).join(", ")} are the altitudes; they meet at ${P2(H)}.`,
        5: `The bounce points lie on the nine-point circle of radius R/2 = ${fmt(R / 2, 3)} centered at ${P2(N)}.`,
        51: `Equal dwell at each bounce: centroid of the bounce points = ${P2(X51)}.`,
        389: `Uniform speed along the light path of length ${fmt(sides(orth).reduce((t, x) => t + x, 0))}: average position ${P2(X389)}.` }[focus];
      const p = CENTERS[focus];
      return [svg(tri() + poly(orth, "light") + V.map((v, i) => seg(v, orth[i], "ln-faint")).join("") + (focus === 5 ? circ(N, R / 2, "cir-dash") : "") + dotp(p) + lab(p, `X(${focus})`)), [lines]]; },
    pyramid: () => [svg(tri(true) + V.map(v => seg(v, O, "ln-dash")).join("") + dotp(O, "pt-aux") + lab(O, "apex", -26, -6) + dotp(X140) + lab(X140, "X(140)", 6, 14)),
      [`A solid pyramid whose lateral edges are equal has its apex above ${P2(O)}; it balances above (3\u00b7X(2) + X(3))/4 = ${P2(X140)}.`]],
    railsprings: (label) => { const ft = LINES.map(([x, y]) => foot(K, x, y)); const d = LINES.map(([x, y, w]) => sdist(K, x, y, w));
      return [svg(tri() + ft.map(f => zig(K, f)).join("") + dotp(K) + lab(K, "X(6)")),
        [label || `Distances to the sides at equilibrium: ${d.map(x => fmt(x, 3)).join(", ")}, proportional to a : b : c = 13 : 20 : 21; least energy \u03a3d\u00b2 = ${fmt(d.reduce((t, x) => t + x * x, 0), 2)}.`]]; },
  };

  // ---------- the experiments (one per physical concept)
  const E = [];
  const ex = (center, title, quantity, src, text, draw, domain) => E.push({ center, title, quantity, src, text, draw, domain: domain || "all triangles" });
  const plateNum = n => [`Center of ${n}: ${P2(CENTERS[n === "X(2)" ? 2 : 0] || G)}.`];
  const limit = (center, title, quantity, src, text, label) => ex(center, title, quantity, src, text, () => { const p = CENTERS[center]; const r0 = D.field(p, `X(${center})`, label); r0[1] = [`Limit point on the 13-20-21 triangle: ${P2(p)}.`]; return r0; });

  // X(2) \u2014 27 experiments
  ex(2, "Balance of a uniform plate", "center of mass (area)", "M", "A flat plate of constant thickness and density balances on a pin at its area centroid.", () => { const r0 = D.plate(G, "X(2)"); r0[1] = [`Area 126; the centroid (A+B+C)/3 = ${P2(G)}.`]; return r0; });
  ex(2, "Three equal masses at the corners", "center of mass (point masses)", "M", "Equal point masses at the vertices: a different mass distribution with the same balance point.", D.masses);
  ex(2, "Three rods of equal mass", "center of mass (rods)", "M", "Rods of different lengths but equal mass laid along the sides balance at the centroid of their midpoints.", D.rods);
  ex(2, "Three equal springs to the corners", "elastic equilibrium", "M", "A ring tied to the vertices by identical zero-length springs comes to rest where the elastic energy is least.", D.springsV);
  ex(2, "Distributed attraction to the plate", "equilibrium under a distributed linear force", "M", "A junction pulled by every element of the plate with a force proportional to distance settles at the area centroid.", () => D.sampled());
  ex(2, "Uniform pressure on a horizontal hatch", "center of pressure", "M", "Water pressing uniformly on a horizontal triangular hatch: the resultant force acts through the centroid.", () => { const r0 = D.field(G, "X(2)", "uniform pressure p on every element"); r0[1] = [`Resultant force p\u00b7126 acting through ${P2(G)}.`]; return r0; });
  ex(2, "Buoyancy of a submerged prism", "center of buoyancy", "M", "A fully submerged right prism with triangular cross-section: the buoyant force acts through the centroid of the displaced volume, above the triangle's centroid.", () => { const r0 = D.field(G, "X(2)", "displaced volume: prism over the triangle"); r0[1] = [`Center of buoyancy above ${P2(G)}.`]; return r0; });
  ex(2, "Uniform DC current in a prism", "current-flux centroid", "M", "A homogeneous conducting prism with equipotential end faces carries a uniform current density; the current's centroid in the cross-section is the centroid.", () => { let o = ""; for (let i = 1; i < 21; i += 2) for (let j = 1; j < 12; j += 2) { const q = [i, j]; if (inside(q)) o += `<circle cx="${X(q)}" cy="${Y(q)}" r="2.2" class="wiredot"/>`; } const r0 = [svg(tri() + o + dotp(G) + lab(G, "X(2)")), [`Uniform current density J; the total current 126\u00b7J flows through a section whose centroid is ${P2(G)}.`]]; return r0; });
  ex(2, "Ideal gas in a triangular box", "mean molecular position", "M", "At equilibrium without external forces the molecules are uniformly distributed, so their average position is the centroid.", D.gas);
  ex(2, "Reflecting Brownian motion", "stationary mean position", "M", "A particle diffusing with reflecting walls forgets its start; its long-run average position is the centroid.", D.brown);
  ex(2, "Billiard ball", "time-averaged position", "M", "A ball bouncing specularly without friction samples the table uniformly in the long run.", D.billiard);
  ex(2, "Blurred image of a lit aperture", "image centroid", "M", "Imaging a uniformly luminous triangle through any symmetric blur leaves the light's centroid unchanged.", D.blur);
  limit(2, "Far-field phase slope of an aperture", "phase gradient of the diffraction pattern", "M", "The derivative of the phase of the Fraunhofer pattern at zero frequency locates the aperture's area centroid.", "phase slope of the far field at zero frequency");
  limit(2, "Far-field current-loop translation", "leading multipole offset", "M", "Far from a planar current loop, its field is that of the spanning area, whose first moment sits at the centroid.", "far field of a triangular current loop");
  limit(2, "Hot quantum gas", "thermal mean position (high temperature)", "M", "A quantum particle in the triangular well at very high temperature is spread uniformly; its mean position tends to the centroid.", "\u03b2 \u2192 0: thermal density becomes uniform");
  limit(2, "High-energy spectral average", "average over all eigenstates below a cutoff", "M", "Averaging the positions of all quantum states below an energy cutoff tends to the uniform average (Weyl's law).", "average over states with energy < E, E \u2192 \u221e");
  limit(2, "Strong absorption with uniform production", "mean concentration", "M", "A substance produced uniformly and removed fast is nearly constant except near the walls; its mean tends to the centroid.", "removal rate \u03bc \u2192 \u221e");
  limit(2, "Logistic growth with lethal walls", "mean population position", "M", "A population growing logistically fills the interior at its carrying capacity when growth is strong; its mean tends to the centroid.", "growth rate \u2192 \u221e");
  limit(2, "Thickened plate in four dimensions", "charge centroid of a conductor", "M", "The equilibrium charge on a slightly thickened plate in four-dimensional space becomes uniform, so its centroid tends to X(2).", "uniform-thickness limit (E4)");
  limit(2, "Lamp high above the floor", "brightest point under a large lamp at great height", "M", "A uniformly glowing triangular ceiling at great height lights the floor most strongly below its centroid.", "height h \u2192 \u221e");
  limit(2, "Weak darkness preference", "optical moment", "M", "With a vanishing preference for dark regions the darkness weights become uniform and the optical moment tends to the centroid.", "\u03b2 \u2192 0");
  limit(2, "Gaussian two-photon fluorescence", "detection centroid at extreme beam widths", "M", "With a very narrow or very broad Gaussian beam, quadratic fluorescence detection returns the centroid.", "beam width \u2192 0 or \u221e");
  ex(2, "Source centroid of three vertex currents", "current-source centroid", "M", "Three equal straight currents through the vertices have their source centroid at the centroid.", () => { const r0 = D.currents(); r0[0] = svg(tri() + V.map(v => `<circle cx="${X(v)}" cy="${Y(v)}" r="6" class="wirein"/><circle cx="${X(v)}" cy="${Y(v)}" r="1.6" class="wiredot"/>`).join("") + dotp(G) + lab(G, "X(2)")); r0[1] = [`Equal currents at A, B, C: source centroid ${P2(G)}.`]; return r0; });
  limit(2, "Axial energy of a shrinking disk loop", "axial field-energy mean", "M", "A magnetostatic disk-limit construction whose axial energy mean is the centroid.", "disk-limit axial energy mean");
  ex(2, "Load capacity of a three-legged table", "maximum safe load", "N", "With equal legs at the corners, the leg reactions are the barycentric coordinates of the load point; the heaviest load is carried at the centroid.", () => D.table(G, "X(2)", "load"));
  ex(2, "Linear pursuit of three robots", "meeting point", "N", "Each robot heads for the next with speed proportional to the distance; the sum of positions never changes, so they meet at the centroid.", D.pursuit);
  ex(2, "Roof sheet of an equal-pitch hip roof", "center of mass of a uniform sheet", "N", "All three roof faces have the same slope, so sheet area is proportional to floor area and the sheet balances above the floor centroid.", () => D.roof(G, "X(2)", [`Every roof face rises at the same pitch, so the uniform roofing sheet balances above ${P2(G)}.`]));

  // X(1) \u2014 15 experiments
  ex(1, "Largest inscribed disk (expanding balloon)", "maximal radius", "M", "A circular balloon inflated inside the triangle reaches its largest size at the incenter.", D.disk);
  ex(1, "Wave entering from all sides", "arrival time", "M", "A front moving inward from every wall at the same speed reaches the incenter last.", () => D.wave());
  ex(1, "Uniform inward erosion", "collapse point", "M", "Eroding all walls at the same rate shrinks the triangle into similar triangles that collapse at the incenter.", () => D.wave(`Erosion by depth t leaves a triangle similar to ABC, scaled by 1 \u2212 t/r about the incenter; it vanishes at t = r = ${fmt(r, 3)}.`));
  ex(1, "Heat escaping through cold walls (short time)", "temperature maximum", "M", "A warm plate with cold edges keeps its heat longest where the nearest wall is farthest: at short times the hottest point tends to the incenter.", () => D.wave(`Short-time heat content is governed by the distance to the nearest wall, largest (= r = ${fmt(r, 3)}) at the incenter.`));
  ex(1, "Plastic torsion of a triangular bar", "maximum of the limiting stress function", "M", "In the infinite-exponent limit of torsion, the stress function becomes the distance to the boundary, maximal at the incenter.", () => D.wave(`Limiting profile = distance to the boundary, maximum ${fmt(r, 3)} at ${P2(I)}.`));
  ex(1, "Tetrahedral hanging sheet", "lowest point", "M", "A sheet hanging from the triangular frame in three planar faces of equal slope has its lowest point below the incenter.", () => D.roof(I, "X(1)", ["The three planar faces meet below the incenter, like an inverted hip roof."]));
  ex(1, "Charged wire frame", "zero of the electric field", "N", "A uniformly charged triangular wire exerts no force at the incenter: a test charge there is in in-plane equilibrium.", D.wire);
  ex(1, "Gravitating wire frame", "zero of the gravitational field", "N", "The same geometry for gravity: a small mass at the incenter is pulled equally by the three sides of a uniform wire frame.", () => { const r0 = D.wire(); r0[1][0] = r0[1][0].replace("Numerical field of the charged frame", "Numerical gravitational field of the frame"); return r0; });
  ex(1, "Summit of a sand pile", "maximum height", "N", "Sand poured on a triangular tray until it overflows forms a pile whose height is proportional to the distance from the edge; the summit is above the incenter.", () => D.roof(I, "X(1)", [`With angle of repose 33\u00b0, the summit is ${fmt(r * Math.tan(33 * Math.PI / 180))} high, above ${P2(I)}.`]));
  ex(1, "Apex of an equal-pitch hip roof", "highest point", "N", "A roof whose three faces have the same pitch peaks above the incenter.", () => D.roof(I, "X(1)", [`At pitch 30\u00b0 the apex is r\u00b7tan 30\u00b0 = ${fmt(r * Math.tan(Math.PI / 6))} above ${P2(I)}.`]));
  ex(1, "Deepest point of a pond with sloping banks", "maximum depth", "N", "Banks of uniform slope all around the shore make the pond deepest at the incenter.", () => D.roof(I, "X(1)", [`With bank slope 1:4 the deepest point is r/4 = ${fmt(r / 4)} deep.`]));
  ex(1, "Trapped field in a superconducting prism", "maximum of the trapped magnetic field", "N", "In Bean's critical state the trapped field grows linearly from the surface, so it peaks at the incenter.", () => D.roof(I, "X(1)", [`B(P) = \u03bc\u2080Jc \u00b7 distance to the surface; peak \u03bc\u2080Jc \u00b7 ${fmt(r, 3)} at the incenter.`]));
  ex(1, "Safest place on a three-legged table", "tipping margin", "N", "A heavy object is safest where it is farthest from every tipping edge.", () => D.table(I, "X(1)", "tip"));
  ex(1, "Clap whose echoes return together", "echo delay", "N", "A clap at the incenter is reflected by the three walls after the same delay.", () => D.echo(I, "X(1)"));
  ex(1, "Lamp with equidistant mirror images", "image distance", "N", "In a triangular mirror room, a lamp at the incenter sees its three first images at the same distance.", () => D.echo(I, "X(1)"));

  // X(10) \u2014 11
  ex(10, "Balanced wire frame", "center of mass (uniform wire)", "M", "A frame bent from uniform wire balances at the Spieker center, not at the centroid.", D.wireframe);
  ex(10, "Uniform heat source on the perimeter", "first moment of the heat source", "M", "Heating the frame uniformly per unit length puts the first moment of the heat input at X(10).", D.wireframe);
  ex(10, "Image of a glowing wire", "image centroid", "M", "A uniformly glowing wire frame, imaged linearly, has its light centroid at X(10).", D.wireframe);
  ex(10, "Diffusion along the wire", "stationary mean position", "M", "A particle diffusing along the closed wire with reflecting rules spends equal time per unit length, averaging to X(10).", D.wireframe);
  limit(10, "Thin conducting wire in 3-D", "charge centroid of a conductor", "M", "The equilibrium charge on a thin conducting frame becomes uniform per length in the thin limit (S3).", "radius \u2192 0 (S3)");
  limit(10, "Thin conducting wire in 4-D", "charge centroid of a conductor", "M", "The same limit in four dimensions (S4).", "radius \u2192 0 (S4)");
  ex(10, "Regularized loop-field moment", "area moment of the magnetic field", "M", "The field of a current loop, regularized near the wire, has its area moment at the perimeter centroid.", () => D.loop(X10, "X(10)", `Cutoff mean of the loop field \u2192 ${P2(X10)}.`));
  ex(10, "Squared normal field at vanishing height", "field-energy centroid", "M", "The squared normal field just above the loop is concentrated along the wire; its centroid tends to X(10).", () => D.loop(X10, "X(10)", `Observation height \u2192 0: centroid \u2192 ${P2(X10)}.`));
  ex(10, "Axial energy mean of the loop", "axial field-energy mean", "M", "Disk-limit axial energy mean of the loop itself.", () => D.loop(X10, "X(10)", `Axial energy mean ${P2(X10)}.`));
  ex(10, "Frame band cut from a plate", "center of mass (thin band)", "N", "A band of constant small width cut along the edge of a plate balances near X(10).", D.band);
  ex(10, "Ash of a grassfire at short time", "center of mass of the burnt region", "N", "A field ignited along its whole border: the burnt band at short times balances at X(10).", D.band);

  // X(3) \u2014 6
  ex(3, "Synchronized emitters at the corners", "equal arrival time", "M", "Signals sent simultaneously from the vertices arrive together at the circumcenter.", D.emit);
  ex(3, "Circular track through three pins", "rotation center", "M", "A rigid circular track through the three vertices rotates about the circumcenter.", D.emit);
  ex(3, "Smallest disk covering the corners", "minimax range", "M", "The smallest disk containing the vertices is centered at the circumcenter when the triangle is acute (13-20-21 is acute).", D.emit, "acute triangles");
  ex(3, "Apex of an equal-leg tripod", "apex position", "N", "Three equal legs standing on the vertices meet above the circumcenter.", D.tripod);
  ex(3, "Mirror room: largest image triangle", "area of the image triangle", "N", "A lamp in a triangular mirror room produces the largest triangle of first images at the circumcenter (Euler's pedal theorem).", () => D.images(O, "X(3)", "area"), "acute triangles");
  ex(3, "Last point to burn with corner fires", "last ignition time", "N", "Fires lit at the three corners meet last at the circumcenter.", D.burn, "acute triangles");

  // X(13) \u2014 5
  ex(13, "Varignon frame", "equilibrium of equal hanging weights", "M", "Strings through holes at the vertices, each carrying the same weight, are knotted together; the knot settles at the Fermat point.", () => D.fermat(), "angles < 120\u00b0");
  ex(13, "Shortest network", "total length", "M", "The shortest road network joining three towns meets at the Fermat point.", () => D.fermat(), "angles < 120\u00b0");
  ex(13, "Least mean travel cost", "mean travel distance", "M", "A depot serving three equally important destinations minimizes the total distance at the Fermat point.", () => D.fermat(), "angles < 120\u00b0");
  ex(13, "Soap-film triple junction", "film junction", "M", "A soap film spanning three pins between two plates meets in a triple junction with 120\u00b0 angles at the Fermat point.", () => D.fermat(), "angles < 120\u00b0");
  ex(13, "Lamp lighting three walls equally", "radiant power per wall", "N", "A long line lamp in a room of triangular cross-section sends equal power to the three walls only at the Fermat point.", D.walls, "angles < 120\u00b0");

  // X(1125) \u2014 4
  const solid = (title, q, text, num) => ex(1125, title, q, "N", text, () => D.roof(X1125, "X(1125)", [num + ` Center of mass above (3\u00b7X(2) + X(1))/4 = ${P2(X1125)}.`]));
  solid("Center of mass of a maximal sand pile", "center of mass (granular pile)", "The pile is a union of three tetrahedra over the triangles IBC, ICA, IAB with volumes proportional to a, b, c.", "Volumes \u221d 13 : 20 : 21.");
  solid("Center of mass of a solid hip roof", "center of mass (solid)", "A solid roof of equal pitch has the same shape as the sand pile.", "Same tetrahedra as the sand pile.");
  solid("Water in a pond with sloping banks", "center of mass of the water", "The water body under a uniformly sloping shore balances at X(1125).", "Depth \u221d distance to the shore.");
  solid("Trapped flux in a superconducting prism", "flux-weighted centroid", "The trapped field is a 'magnetic sand pile'; its centroid is X(1125).", "B \u221d distance to the surface.");

  // X(6) \u2014 3
  ex(6, "Springs on rails along the sides", "elastic equilibrium", "M", "A junction tied to frictionless guides on the three sides by equal springs normal to the sides rests at the symmedian point.", () => D.railsprings());
  ex(6, "Navigator's cocked hat", "least-squares position fix", "N", "Three bearing lines with equal errors form a small triangle; the most likely position is its symmedian point.", () => D.railsprings(`Equal Gaussian errors across each line: the maximum-likelihood fix minimizes \u03a3d\u00b2, at ${P2(K)}.`));
  ex(6, "Kaleidoscope: images balance at the lamp", "centroid of the images", "N", "In a triangular mirror room, the three first images of a lamp balance at the lamp exactly when it stands at the symmedian point.", () => D.images(K, "X(6)", "centroid"));

  // X(360), X(4), X(5) \u2014 2 each
  ex(360, "Three vertex currents: interior energy mean", "magnetic energy mean (equal-core limit)", "M", "Three equal currents through the vertices; the interior field-energy mean weights each vertex by its angle.", D.currents);
  ex(360, "Corner chips", "center of mass of three corner pieces", "N", "Cut equal small circular chips from the three corners of a plate; they balance near X(360).", D.chips);
  ex(4, "Pane wedged into a box corner", "nearest point to the corner", "N", "A triangular pane with each vertex on one edge of a box corner is closest to the corner at the orthocenter.", D.corner, "acute triangles");
  ex(4, "Periodic light ray in a mirror cavity", "concurrency of mirror normals", "N", "Fagnano's orbit: the light path joining the feet of the altitudes; the normals at the bounce points meet at the orthocenter.", () => D.fagnano(4), "acute triangles");
  ex(5, "Block sawn off a box corner", "center of mass (solid block)", "N", "The block cut off by the pane balances above the nine-point center.", D.corner, "acute triangles");
  ex(5, "Circle through the bounce points", "center of the bounce circle", "N", "The three bounce points of the periodic light ray lie on the nine-point circle.", () => D.fagnano(5), "acute triangles");

  // one each
  ex(140, "Pyramid with equal lateral edges", "center of mass (solid pyramid)", "N", "A uniform solid pyramid standing on the triangle with equal lateral edges.", D.pyramid);
  ex(15, "Kaleidoscope: equilateral images", "shape of the image triangle", "N", "A lamp whose three first mirror images form an equilateral triangle stands at the first isodynamic point.", () => D.images(X15, "X(15)", "equi"), "angles < 120\u00b0");
  ex(51, "Bounce points of the periodic light ray", "centroid of the bounce points", "N", "Equal dwell at each reflection of Fagnano's orbit.", () => D.fagnano(51), "acute triangles");
  ex(389, "Photon on the periodic light ray", "time-averaged position", "N", "A photon travelling the Fagnano orbit at constant speed: its average position is the Spieker center of the orthic triangle.", () => D.fagnano(389), "acute triangles");
  ex(549, "Equal-leg tripod of uniform rods", "center of mass (tripod)", "N", "The center of mass of three equal uniform rods meeting above the circumcenter.", D.tripod, "acute (to stand)");

  window.PHYSICS = { experiments: E, centers: CENTERS, triangle: { A, B, C, a, b, c, area: S, r, R, angles: ang.map(t => t * 180 / Math.PI) }, P2 };
})();
