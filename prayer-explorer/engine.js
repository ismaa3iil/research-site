/* Analytic, frozen-declination geometry. All internal angles are radians. */
(() => {
  "use strict";
  const R = Math.PI / 180, F = 720 / Math.PI, M = 21.4225;
  const clamp = (x) => Math.max(-1, Math.min(1, x));
  const finite = Number.isFinite;
  const fields = ["fajr", "duha", "asr1", "asr2", "isha"];
  const calibrationCache = new Map();
  const yearCache = new Map();
  const defaults = {year: 2026, latitude: 21.4225, longitude: 39.8262, city: "Makka · Kaaba",
    timeZone: "Asia/Riyadh", offset: 180, refraction: false, solarDisk: false,
    nightDenominator: 8, fractions: "approximate", shadowMode: "one", tolerance: 20, fitTolerance: 20};

  function validate(config) {
    if (!Number.isInteger(config.year) || config.year < 2026 || config.year > 2030) throw Error("Choose a year from 2026 to 2030.");
    if (!finite(config.latitude) || Math.abs(config.latitude) > 90) throw Error("Latitude must be between −90° and 90°.");
    if (!finite(config.longitude) || Math.abs(config.longitude) > 180) throw Error("Longitude must be between −180° and 180°.");
    if (![6, 7, 8, 9, 10].includes(config.nightDenominator)) throw Error("Choose a night fraction from 1/6 to 1/10.");
    if (![5, 10, 15, 20, 25, 30].includes(config.tolerance) || ![5, 10, 15, 20, 25, 30].includes(config.fitTolerance)) throw Error("Choose a supported tolerance.");
    if (!["zero", "one", "mixed", "optimal"].includes(config.shadowMode)) throw Error("Choose a shadow correction.");
    if (!["exact", "approximate"].includes(config.fractions)) throw Error("Choose exact or approximate fractions.");
    if (!finite(config.offset) || config.offset < -840 || config.offset > 840) throw Error("UTC offset must be between −14 and +14 hours.");
  }

  function dates(year) {
    return globalThis.PRAYER_EPHEMERIS.years[year].map((row, i) => ({
      date: new Date(Date.UTC(year, 0, i + 1)).toISOString().slice(0, 10), index: i, delta: row[0], eot: row[1]
    }));
  }

  function horizon(config) { return -((config.refraction ? 34 / 60 : 0) + (config.solarDisk ? 16 / 60 : 0)); }

  function geometry(latitude, delta, horizonDegrees = 0) {
    const phi = latitude * R, a = Math.sin(phi) * Math.sin(delta), b = Math.cos(phi) * Math.cos(delta);
    const noonSin = clamp(a + b), h0 = Math.asin(noonSin);
    const cosine = (Math.sin(horizonDegrees * R) - a) / b;
    const crossing = Math.abs(b) > 1e-14 && Math.abs(cosine) < 1;
    return {a, b, h0, q: h0 > 0 ? Math.cos(h0) / Math.sin(h0) : null,
      hs: crossing ? Math.acos(cosine) : null, crossing,
      state: crossing ? "normal" : a + Math.abs(b) <= Math.sin(horizonDegrees * R) ? "polar-night" : "polar-day"};
  }

  function angleHour(g, elevation) {
    if (Math.abs(g.b) < 1e-14) return null;
    const c = (Math.sin(elevation * R) - g.a) / g.b;
    return Math.abs(c) < 1 ? Math.acos(c) : null;
  }

  function elevation(g, hour) { return Math.asin(clamp(g.a + g.b * Math.cos(hour))) / R; }

  function shadowHour(g, n, k) {
    if (!(g.h0 > 0) || !finite(k)) return null;
    const s = n + k * g.q;
    if (s < g.q - 1e-10) return null;
    const c = (1 / Math.hypot(1, s) - g.a) / g.b;
    return Math.abs(g.b) > 1e-14 && c <= 1 + 1e-12 && c >= -1 ? Math.acos(clamp(c)) : null;
  }

  function calibration(config) {
    const key = [config.year, horizon(config), config.nightDenominator].join("/");
    if (calibrationCache.has(key)) return calibrationCache.get(key);
    const rows = dates(config.year);
    const candidates = ["05", "07"].map(month => rows.filter(d => d.date.slice(5, 7) === month)
      .reduce((best, d) => Math.abs(d.delta / R - M) < Math.abs(best.delta / R - M) ? d : best));
    const pick = candidates.reduce((a, b) => Math.abs(a.delta / R - M) <= Math.abs(b.delta / R - M) ? a : b);
    const g = geometry(M, pick.delta, horizon(config));
    const targetHour = g.hs + 2 * (Math.PI - g.hs) / config.nightDenominator;
    const result = {date: pick.date, noonElevation: g.h0 / R, noonShadow: g.q,
      angle: -elevation(g, targetHour), r1: shadowHour(g, 1, 0) / g.hs, r2: shadowHour(g, 2, 0) / g.hs,
      candidates: candidates.map(d => ({date: d.date, noonShadow: geometry(M, d.delta).q,
        noonElevation: geometry(M, d.delta).h0 / R})), horizon: horizon(config)};
    calibrationCache.set(key, result);
    return result;
  }

  function bisect(fn, low, high) {
    for (let i = 0; i < 65; i++) {
      const middle = (low + high) / 2;
      if (fn(middle) > 0) high = middle; else low = middle;
    }
    return (low + high) / 2;
  }

  function shadowFit(geometries, n, fraction, tolerance) {
    const entries = geometries.filter(g => g.crossing && g.h0 > 0);
    if (!entries.length) return {k: null, count: 0, available: 0, minimax: null, interval: null};
    const floor = Math.max(0, ...entries.map(g => g.q > 1e-13 ? 1 - n / g.q : 0));
    const errors = k => entries.map(g => F * (shadowHour(g, n, k) - fraction * g.hs));
    const balance = k => { const e = errors(k); return Math.min(...e) + Math.max(...e); };
    let high = Math.max(2, floor + 1);
    for (let i = 0; i < 64 && balance(high) < 0; i++) high *= 2;
    const preferred = balance(floor) >= 0 ? floor : bisect(balance, floor, high);
    const count = k => errors(k).filter(e => Math.abs(e) < tolerance).length;
    const intervals = [];
    let constant = 0;
    for (const g of entries) {
      const target = fraction * g.hs, early = target - tolerance / F, late = target + tolerance / F;
      if (g.q < 1e-13) { if (Math.abs(F * (shadowHour(g, n, 0) - target)) < tolerance) constant++; continue; }
      const geoSunset = angleHour(g, 0);
      if (early >= geoSunset) continue;
      const totalAt = hour => {
        const sin = clamp(g.a + g.b * Math.cos(hour));
        return sin <= 0 ? Infinity : Math.sqrt(Math.max(0, 1 - sin * sin)) / sin;
      };
      const low = Math.max(floor, early <= 0 ? -Infinity : (totalAt(early) - n) / g.q);
      const up = late >= geoSunset ? Infinity : (totalAt(late) - n) / g.q;
      if (low < up) intervals.push([low, up]);
    }
    const points = new Map([[floor, 0]]);
    for (const [lo, hi] of intervals) {
      points.set(lo, (points.get(lo) || 0) + 1);
      if (finite(hi)) points.set(hi, (points.get(hi) || 0) - 1);
    }
    const ordered = [...points].sort((a, b) => a[0] - b[0]);
    let running = constant, best = -1, winners = [];
    for (let i = 0; i < ordered.length; i++) {
      running += ordered[i][1];
      const lo = ordered[i][0], hi = ordered[i + 1]?.[0] ?? Infinity;
      if (!(lo < hi)) continue;
      if (running > best) { best = running; winners = []; }
      if (running === best) winners.push([lo, hi]);
    }
    let chosen = preferred, verified = count(preferred), interval = null;
    if (verified < best) {
      winners.sort((a, b) => Math.max(a[0] - preferred, preferred - a[1], 0) - Math.max(b[0] - preferred, preferred - b[1], 0));
      for (const pair of winners) {
        const k = finite(pair[1]) ? pair[0] + (pair[1] - pair[0]) / 2 : pair[0] + Math.max(1, pair[0]);
        const actual = count(k);
        if (actual > verified) { chosen = k; verified = actual; interval = pair; }
      }
    }
    return {k: chosen, count: verified, available: entries.length, minimax: preferred, interval, floor};
  }

  function offsetMinutes(config, isoDate) {
    if (!config.timeZone) return config.offset;
    const moment = new Date(isoDate + "T12:00:00Z");
    const parts = new Intl.DateTimeFormat("en-US", {timeZone: config.timeZone, hourCycle: "h23", year: "numeric",
      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit"}).formatToParts(moment);
    const p = Object.fromEntries(parts.map(row => [row.type, row.value]));
    return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - moment.getTime()) / 60000;
  }

  function metric(rows, field, tolerance) {
    const e = rows.map(d => d.errors[field]).filter(finite), abs = e.map(Math.abs);
    return {days: abs.filter(x => x < tolerance).length, defined: e.length, total: rows.length,
      rms: e.length ? Math.sqrt(e.reduce((s, v) => s + v * v, 0) / e.length) : null,
      maximum: e.length ? Math.max(...abs) : null, mean: e.length ? e.reduce((s, v) => s + v, 0) / e.length : null};
  }

  function calculate(config, withClock = true) {
    config = {...defaults, ...config}; validate(config);
    const key = JSON.stringify([config, withClock]);
    if (yearCache.has(key)) return yearCache.get(key);
    const cal = calibration(config), ratios = config.fractions === "exact" ? [cal.r1, cal.r2] : [.5, .7];
    const records = dates(config.year), geometries = records.map(d => geometry(config.latitude, d.delta, horizon(config)));
    const fits = config.shadowMode === "optimal" ? ratios.map((r, i) => shadowFit(geometries, i + 1, r, config.fitTolerance)) : null;
    const ks = config.shadowMode === "zero" ? [0, 0] : config.shadowMode === "one" ? [1, 1] : config.shadowMode === "mixed" ? [1, 2] : fits.map(f => f.k);
    const rows = records.map((d, i) => {
      const g = geometries[i], offset = withClock ? offsetMinutes(config, d.date) : 0;
      const transit = config.clock === "solar" ? 720 : 720 - 4 * config.longitude - d.eot + offset;
      const base = {date: d.date, index: i, delta: d.delta, geometry: g, offset, transit, sunrise: null, noon: null, sunset: null,
        angular: Object.fromEntries(fields.map(name => [name, null])),
        fractional: Object.fromEntries(fields.map(name => [name, null])),
        errors: Object.fromEntries(fields.map(name => [name, null]))};
      if (!g.crossing) return base;
      base.sunrise = transit - F * g.hs; base.sunset = transit + F * g.hs;
      base.noon = (base.sunrise + base.sunset) / 2;
      base.night = 1440 - 2 * F * g.hs;
      base.fractional.fajr = base.sunrise - base.night / config.nightDenominator;
      // Reflect dawn about the midnight preceding sunrise and report the
      // corresponding evening event on this row's date (one day later).
      base.fractional.isha = base.sunset + base.night / config.nightDenominator;
      const dawn = angleHour(g, -cal.angle);
      if (dawn !== null) {
        base.angular.fajr = transit - F * dawn;
        base.angular.isha = transit + F * dawn;
      }
      for (let j = 0; j < 2; j++) {
        const name = j ? "asr2" : "asr1", hour = shadowHour(g, j + 1, ks[j]);
        base.fractional[name] = transit + F * ratios[j] * g.hs;
        if (hour !== null) base.angular[name] = transit + F * hour;
      }
      base.fractional.duha = 2 * transit - base.fractional.asr1;
      if (finite(base.angular.asr1)) base.angular.duha = 2 * transit - base.angular.asr1;
      for (const name of fields) {
        const a = base.angular[name], b = base.fractional[name];
        base.errors[name] = finite(a) && finite(b) ? a - b : null;
      }
      return base;
    });
    const result = {config, calibration: cal, ratios, ks, fits, rows,
      metrics: Object.fromEntries(fields.map(name => [name, metric(rows, name, config.tolerance)]))};
    if (yearCache.size > 160) yearCache.delete(yearCache.keys().next().value);
    yearCache.set(key, result);
    return result;
  }

  function time(minutes, seconds = false) {
    if (!finite(minutes)) return "—";
    const total = Math.round(minutes * (seconds ? 60 : 1)), unit = seconds ? 86400 : 1440;
    const dateShift = Math.floor(total / unit), normalized = ((total % unit) + unit) % unit;
    const h = Math.floor(normalized / (seconds ? 3600 : 60)), m = Math.floor(normalized / (seconds ? 60 : 1)) % 60;
    const value = [h, m, ...(seconds ? [normalized % 60] : [])].map(x => String(x).padStart(2, "0")).join(":");
    return value + (dateShift ? ` (${dateShift > 0 ? "+" : ""}${dateShift}d)` : "");
  }

  function sunPosition(row, latitude, clockMinutes) {
    const h = (clockMinutes - row.transit) / F, phi = latitude * R, d = row.delta;
    const east = -Math.cos(d) * Math.sin(h), north = Math.cos(phi) * Math.sin(d) - Math.sin(phi) * Math.cos(d) * Math.cos(h);
    return {elevation: elevation(row.geometry, h), azimuth: Math.hypot(east, north) < 1e-10 ? null : (Math.atan2(east, north) / R + 360) % 360};
  }

  globalThis.PrayerEngine = {R, F, fields, defaults, validate, dates, geometry, angleHour, elevation, shadowHour,
    calibration, calculate, metric, time, horizon, shadowFit, sunPosition};
})();
