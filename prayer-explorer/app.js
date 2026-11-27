(() => {
  "use strict";
  const E = PrayerEngine, C = PrayerCharts, $ = id => document.getElementById(id);
  const LIMITS = [5, 10, 15, 20, 25, 30], FIELDS = E.fields;
  const NAMES = {fajr: "Fajr", duha: "Ḍuḥā", asr1: "ʿAṣr 1", asr2: "ʿAṣr 2", isha: "ʿIshāʾ"};
  const KEY = "prayer-explorer-v1";
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[c]));
  const fmt = (v, digits = 2) => Number.isFinite(v) ? v.toFixed(digits) : "—";
  const signed = v => Number.isFinite(v) ? (Math.abs(v) < .005 ? "0.00 min" : (v > 0 ? "+" : "") + v.toFixed(2) + " min") : "—";
  const dateLabel = date => new Date(date + "T12:00:00Z").toLocaleDateString("en-GB", {weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"UTC"});
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch { /* Recover from unavailable storage or invalid prior state. */ }
  let config = {...E.defaults, ...saved.config};
  try { E.validate(config); } catch { config = {...E.defaults}; }
  let selectedDate = /^20(26|27|28|29|30)-\d\d-\d\d$/.test(saved.date || "") ? saved.date : "2026-05-28";
  let favoriteCities = Array.isArray(saved.favorites) ? saved.favorites.filter(validLocation).slice(0, 30) : PRAYER_CITIES.slice(0, 9);
  let scenarios = Array.isArray(saved.scenarios) ? saved.scenarios.filter(s => {
    try { E.validate(s.config); return typeof s.id === "string" && typeof s.name === "string"; } catch { return false; }
  }).slice(0, 30) : [];
  const mutedScenarios = new Set(Array.isArray(saved.mutedScenarios) ? saved.mutedScenarios.filter(id => scenarios.some(s => s.id === id)) : []);
  let graphData = null;
  let annual, prayer = "asr1", activeView = "daily", latitudeResult = null, sweepVersion = 0, debounce, toastTimer;
  const charts = {
    annual: new C.Chart($("annual-chart"), x => selectDay(annual.rows[Math.max(0, Math.min(annual.rows.length - 1, Math.round(x)))].date)),
    solar: new C.Chart($("sun-chart")), comparison: new C.Chart($("comparison-chart")), latitude: new C.Chart($("latitude-chart"))
  };

  function validLocation(c) { return c && typeof c.name === "string" && Number.isFinite(c.latitude) && Math.abs(c.latitude) <= 90 && Number.isFinite(c.longitude) && Math.abs(c.longitude) <= 180; }
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify({config, date:selectedDate, favorites:favoriteCities, scenarios, mutedScenarios:[...mutedScenarios]}));
      return true;
    } catch { return false; }
  }
  function toast(text) { $("toast").textContent = text; $("toast").hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $("toast").hidden = true, 3500); }

  function populateForm() {
    $("city").value = config.city || "Custom position";
    $("latitude").value = config.latitude; $("longitude").value = config.longitude;
    $("year").value = config.year;
    const suffix = selectedDate.slice(5), requested = `${config.year}-${suffix}`;
    const parsed = new Date(requested + "T12:00:00Z");
    selectedDate = parsed.getUTCFullYear() === config.year ? parsed.toISOString().slice(0, 10) : `${config.year}-05-28`;
    $("date").min = `${config.year}-01-01`; $("date").max = `${config.year}-12-31`; $("date").value = selectedDate;
    $("refraction").checked = config.refraction; $("solar-disk").checked = config.solarDisk;
    $("night-fraction").value = config.nightDenominator; $("fractions").value = config.fractions;
    $("shadow-mode").value = config.shadowMode; $("tolerance").value = config.tolerance; $("fit-tolerance").value = config.fitTolerance;
    $("offset").value = config.offset / 60;
    $("time-zone").value = config.clock === "solar" ? "solar" : config.timeZone ? "city" : "fixed";
    conditionalControls(); renderFavorites();
  }

  function conditionalControls() {
    $("fit-wrap").hidden = $("shadow-mode").value !== "optimal";
    $("offset-wrap").hidden = $("time-zone").value !== "fixed";
    $("zone-note").textContent = $("time-zone").value === "city" ? (config.timeZone || "Choose a city for its time zone.") :
      $("time-zone").value === "solar" ? "Solar noon is displayed as 12:00." : "Set the clock offset for these coordinates.";
  }

  function readForm() {
    const zone = $("time-zone").value;
    const next = {...config, latitude:$("latitude").valueAsNumber, longitude:$("longitude").valueAsNumber,
      year:+$("year").value, refraction:$("refraction").checked, solarDisk:$("solar-disk").checked,
      nightDenominator:+$("night-fraction").value, fractions:$("fractions").value, shadowMode:$("shadow-mode").value,
      tolerance:+$("tolerance").value, fitTolerance:+$("fit-tolerance").value, offset:$("offset").valueAsNumber * 60,
      clock:zone === "solar" ? "solar" : "civil", timeZone:zone === "city" ? config.timeZone : null};
    if (zone === "city" && !next.timeZone) throw Error("Select a city, or choose a fixed UTC offset.");
    E.validate(next); return next;
  }

  function update() {
    clearTimeout(debounce);
    try {
      const previous = config; config = readForm();
      if (+selectedDate.slice(0, 4) !== config.year) {
        const d = new Date(`${config.year}-${selectedDate.slice(5)}T12:00:00Z`);
        selectedDate = d.toISOString().slice(0, 10);
      } else if ($("date").value && $("date").value.slice(0,4) === String(config.year)) selectedDate = $("date").value;
      $("date").min = `${config.year}-01-01`; $("date").max = `${config.year}-12-31`; $("date").value = selectedDate;
      annual = E.calculate(config); $("error").hidden = true;
      conditionalControls(); renderDaily(); renderAnnual(); persist();
      if (JSON.stringify(previous) !== JSON.stringify(config) && latitudeResult) $("latitude-state").textContent = "Settings changed. Calculate again to refresh the latitude results.";
    } catch (error) { $("error").textContent = error.message; $("error").hidden = false; }
  }

  function chooseLocation(city) {
    config = {...config, city:city.name, latitude:city.latitude, longitude:city.longitude,
      timeZone:city.timeZone || null, offset:city.offset ?? config.offset, clock:city.clock || "civil"};
    populateForm(); update();
  }

  function renderFavorites() {
    $("favorite-chips").innerHTML = favoriteCities.map((city, i) => `<button type="button" data-favorite="${i}" class="${city.name === config.city ? "current" : ""}">${esc(city.name.split(" · ")[0])}</button>`).join("");
    $("favorite-list").innerHTML = favoriteCities.map((c, i) => `<div><span>${esc(c.name)}<small class="field-note"> ${fmt(c.latitude, 4)}°, ${fmt(c.longitude, 4)}°</small></span><button class="small quiet" data-remove-favorite="${i}" aria-label="Remove ${esc(c.name)}">Remove</button></div>`).join("");
  }

  function findCity(query) {
    const name = query.trim().toLowerCase();
    if (!name) return null;
    return PRAYER_CITIES.find(c => c.name.toLowerCase() === name)
      || PRAYER_CITIES.find(c => c.name.toLowerCase().includes(name));
  }

  function favoriteLocation() {
    const selected = $("favorite-location").value;
    return selected === "current" ? {...config, name:config.city} : PRAYER_CITIES[+selected];
  }

  function previewFavorite() {
    const city = favoriteLocation();
    $("favorite-coordinates").textContent = `${fmt(city.latitude, 4)}° latitude · ${fmt(city.longitude, 4)}° longitude · ${city.timeZone || (city.clock === "solar" ? "solar time" : "fixed offset")}`;
    $("favorite-name").value = city.name;
  }

  function saveFavorite(city) {
    const existing = favoriteCities.findIndex(c => c.name.toLowerCase() === city.name.toLowerCase());
    if (existing < 0 && favoriteCities.length >= 30) return "The list holds 30 favorites. Remove one to add another.";
    const entry = {name:city.name, latitude:city.latitude, longitude:city.longitude,
      timeZone:city.timeZone || null, offset:city.offset ?? config.offset, clock:city.clock || "civil"};
    if (existing < 0) favoriteCities.push(entry);
    else favoriteCities[existing] = entry;
    const saved = persist();
    renderFavorites();
    return saved ? `${entry.name} saved to favorites.` : `${entry.name} added for this visit. Browser storage is unavailable.`;
  }

  function dailyTimes(row) {
    const event = name => [NAMES[name], row.angular[name], row.fractional[name], name];
    return [event("fajr"), ["Sunrise",row.sunrise,row.sunrise,null], event("duha"),
      ["Solar noon",row.noon,row.noon,null], event("asr1"), event("asr2"), ["Sunset",row.sunset,row.sunset,null], event("isha")];
  }

  function renderDaily() {
    const row = annual.rows.find(d => d.date === selectedDate) || annual.rows[0]; selectedDate = row.date;
    $("location-heading").textContent = config.city || "Custom position";
    $("position").textContent = `${fmt(Math.abs(config.latitude), 4)}° ${config.latitude < 0 ? "S" : "N"}  ·  ${fmt(Math.abs(config.longitude), 4)}° ${config.longitude < 0 ? "W" : "E"}`;
    $("day-heading").textContent = dateLabel(row.date);
    $("clock-label").textContent = config.clock === "solar" ? "Local apparent solar time" : `${config.timeZone || "Fixed offset"} · UTC${row.offset >= 0 ? "+" : ""}${row.offset / 60}`;
    const cal = annual.calibration;
    $("calibration-summary").textContent = `Makka reference ${cal.date} · Fajr and ʿIshāʾ ${cal.angle.toFixed(4)}° · ʿAṣr ${annual.ratios.map(r => (100*r).toFixed(4)+"%").join(" / ")}`;
    $("day-table").querySelector("tbody").innerHTML = dailyTimes(row).map(([name, a, b, field]) => {
      const error = field ? row.errors[field] : null, valid = Number.isFinite(error);
      return `<tr ${field ? `class="inspectable" data-event="${field}"` : ""}><td class="prayer-name">${name}</td><td class="time">${E.time(a,true)}</td><td class="time">${E.time(b,true)}</td><td class="difference">${field ? signed(error) : "—"}</td><td>${field ? `<span class="pill ${valid ? Math.abs(error) < config.tolerance ? "yes" : "no" : "missing"}">${valid ? Math.abs(error) < config.tolerance ? "Yes" : "No" : "Unavailable"}</span>` : "Shared anchor"}</td></tr>`;
    }).join("");
    $("day-warning").hidden = row.geometry.crossing;
    $("day-warning").textContent = row.geometry.state === "polar-day" ? "No paired sunrise and sunset crossing. Fractional prayer times and their noon midpoint are unavailable on this date." : "No paired sunrise and sunset crossing. Some or all of the day remains below the selected horizon.";
    $("day-details").innerHTML = `<span>Noon elevation <b>${fmt(row.geometry.h0/E.R,4)}°</b></span><span>Sunrise/sunset centre <b>${fmt(E.horizon(config),6)}°</b></span><span>k₁ <b>${fmt(annual.ks[0],6)}</b></span><span>k₂ <b>${fmt(annual.ks[1],6)}</b></span>`;
    renderSolar(row);
  }

  function monthTicks(year) { return Array.from({length:12},(_,m) => [(Date.UTC(year,m,1)-Date.UTC(year,0,1))/86400000,new Date(Date.UTC(year,m,1)).toLocaleDateString("en",{month:"short",timeZone:"UTC"})]); }

  function renderAnnual() {
    $("annual-year").textContent = config.year; $("active-tolerance").textContent = config.tolerance;
    $("metrics").innerHTML = FIELDS.map(name => {
      const m=annual.metrics[name]; return `<article class="metric"><h3>${NAMES[name]}</h3><div class="count">${m.days} <small>/ ${m.total} days</small></div><p class="summary">${m.defined} defined pairs · RMS ${fmt(m.rms)} min<br>Largest difference ${fmt(m.maximum)} min</p><div class="meter" aria-hidden="true"><span style="width:${100*m.days/m.total}%"></span></div></article>`;
    }).join("");
    renderAnnualGraph(); renderCalendar();
  }

  function renderAnnualGraph() {
    const index = annual.rows.findIndex(d=>d.date===selectedDate);
    charts.annual.update({series:[{name:NAMES[prayer],color:C.colors[0],points:annual.rows.map(d=>({x:d.index,y:d.errors[prayer],label:d.date}))}],band:config.tolerance,
      xRange:[0,annual.rows.length-1],xTicks:monthTicks(config.year),selected:index,formatValue:signed});
  }

  function renderCalendar() {
    $("calendar-heading").textContent = `${NAMES[prayer]} · daily compatibility`;
    const months = Array.from({length:12},()=>[]); annual.rows.forEach(d => months[+d.date.slice(5,7)-1].push(d));
    $("compatibility-calendar").innerHTML = months.map((rows,m) => `<div class="month-row"><span class="month-name">${monthTicks(config.year)[m][1]}</span>${rows.map(d=>{
      const e=d.errors[prayer], cls = Number.isFinite(e) ? Math.abs(e) < config.tolerance ? "yes" : "no" : "missing";
      return `<button class="calendar-day ${cls} ${d.date===selectedDate ? "selected" : ""}" data-date="${d.date}" title="${d.date}: ${signed(e)}" aria-label="${d.date}, ${cls === "yes" ? "compatible" : cls === "no" ? "outside tolerance" : "unavailable"}, ${signed(e)}"></button>`;
    }).join("")}${Array.from({length:31-rows.length},()=>'<span class="calendar-day empty"></span>').join("")}</div>`).join("");
  }

  function selectDay(date) { selectedDate = date; $("date").value = date; renderDaily(); renderAnnualGraph(); renderCalendar(); persist(); }

  function renderSolar(row) {
    const points = Array.from({length:145},(_,i) => {const t=row.transit-720+i*10;return{x:t,y:E.sunPosition(row,config.latitude,t).elevation,label:E.time(t)}});
    const ticks = Array.from({length:7},(_,i)=>[row.transit-720+i*240,E.time(row.transit-720+i*240)]);
    charts.solar.update({series:[{name:"Solar elevation",points}],xRange:[row.transit-720,row.transit+720],xTicks:ticks,yRange:[-90,90],yLabel:"Elevation (°)",formatValue:v=>`${fmt(v,3)}°`});
    $("sun-description").textContent = `Noon elevation ${fmt(row.geometry.h0/E.R,4)}°. Select a prayer row to inspect the angles at its two times.`;
  }

  function inspectEvent(name) {
    const row=annual.rows.find(d=>d.date===selectedDate);
    const desc=["angular","fractional"].map(kind=>{
      const t=row[kind][name]; if(!Number.isFinite(t))return `${kind}: unavailable`;
      const p=E.sunPosition(row,config.latitude,t);return `${kind}: elevation ${fmt(p.elevation,4)}°, azimuth ${fmt(p.azimuth,3)}°`;
    });
    const detail=$("sun-chart").closest("details");detail.open=true;
    $("sun-description").textContent=`${NAMES[name]} · ${desc.join(" · ")}`; charts.solar.draw(); detail.scrollIntoView({behavior:"smooth",block:"nearest"});
  }

  function setView(name) {
    activeView=name;document.querySelectorAll(".view").forEach(el=>el.hidden=el.id!==`view-${name}`);
    document.querySelectorAll(".nav").forEach(el=>{el.classList.toggle("active",el.dataset.view===name);el.setAttribute("aria-current",el.dataset.view===name ? "page" : "false");});
    if(name==="daily"){renderAnnualGraph();renderSolar(annual.rows.find(d=>d.date===selectedDate));}
    if(name==="compare")renderComparison(); if(name==="latitude"&&latitudeResult)renderLatitude();
  }

  function addScenarios(items) {
    const newScenarios = items.slice(0, 30 - scenarios.length).map((item, i) => ({
      id:crypto.randomUUID?.() || `${Date.now()}-${scenarios.length + i}`, name:item.name, config:{...item.config}
    }));
    scenarios.push(...newScenarios);
    const stored = persist(), added = newScenarios.length;
    if (!added) toast("The list holds 30 scenarios. Remove one before saving another.");
    else toast(`${added === 1 ? newScenarios[0].name : `${added} scenarios`} ${stored ? "saved" : "added for this visit (browser storage unavailable)"}${added < items.length ? " · limit of 30 reached" : ""}.`);
    setView("compare");
  }

  function addPreset(type) {
    update();if(!$("error").hidden)return;
    const base={...config}, name=config.city?.split(" · ")[0]||"Custom";
    const item=(label,changes)=>({name:`${name} · ${label}`,config:{...base,...changes}});
    const groups={
      fractions:()=>[6,7,8,9,10].map(n=>item(`night 1/${n}`,{nightDenominator:n})),
      shadows:()=>["zero","one","mixed","optimal"].map(mode=>item(shadowLabel(mode),{shadowMode:mode})),
      horizon:()=>[[false,false],[true,false],[false,true],[true,true]].map(([r,s])=>item(`${r ? "refraction" : "no refraction"} / ${s ? "disk" : "centre"}`,{refraction:r,solarDisk:s})),
      years:()=>[2026,2027,2028,2029,2030].map(year=>item(String(year),{year})),
      favorites:()=>favoriteCities.map(c=>({name:c.name,config:{...base,city:c.name,latitude:c.latitude,longitude:c.longitude,timeZone:c.timeZone||null,offset:c.offset??base.offset}})),
      fit:()=>LIMITS.map(t=>item(`k fitted at ${t} min`,{shadowMode:"optimal",fitTolerance:t}))
    };addScenarios(groups[type]());
  }

  function shadowLabel(mode){return {zero:"k = 0, 0",one:"k = 1, 1",mixed:"k = 1, 2",optimal:"Fitted k"}[mode];}

  function comparisonRows() {
    const field=$("compare-prayer").value,tol=+$("compare-tolerance").value;
    return scenarios.map(s=>{const result=E.calculate(s.config), m=E.metric(result.rows,field,tol);return {...s,result,metric:m};});
  }

  function renderComparison() {
    $("scenario-badge").textContent=scenarios.length;const empty=!scenarios.length;
    $("comparison-empty").hidden=!empty;$("comparison-content").hidden=empty;$("export-comparison").disabled=empty;if(empty)return;
    const results=comparisonRows();
    $("comparison-table").querySelector("thead").innerHTML="<tr><th>Scenario</th><th>Year</th><th>Fajr angle</th><th>k₁ / k₂</th><th>Compatible</th><th>Defined</th><th>RMS (min)</th><th>Max (min)</th><th></th></tr>";
    $("comparison-table").querySelector("tbody").innerHTML=results.map((s,i)=>`<tr><td><input class="scenario-name" aria-label="Scenario name" data-name="${i}" value="${esc(s.name)}"><div class="scenario-detail">${esc(s.config.city)} · ${s.config.latitude.toFixed(4)}° · ${s.config.longitude.toFixed(4)}° · ${s.config.fractions} · night 1/${s.config.nightDenominator}<br>horizon ${fmt(E.horizon(s.config),4)}° · ${shadowLabel(s.config.shadowMode)}${s.config.shadowMode==="optimal" ? ` at ${s.config.fitTolerance} min` : ""}</div></td><td>${s.config.year}</td><td>${fmt(s.result.calibration.angle,4)}°</td><td>${s.result.ks.map(k=>fmt(k,5)).join(" / ")}</td><td><b>${s.metric.days}</b> / ${s.metric.total}</td><td>${s.metric.defined}</td><td>${fmt(s.metric.rms)}</td><td>${fmt(s.metric.maximum)}</td><td><button class="small quiet" data-remove-scenario="${i}" aria-label="Remove ${esc(s.name)}">Remove</button></td></tr>`).join("");
    $("compare-scenarios").innerHTML = scenarios.map(s => `<label class="check"><input type="checkbox" value="${esc(s.id)}" ${mutedScenarios.has(s.id) ? "" : "checked"}><span>${esc(s.name)}</span></label>`).join("");
    for (const [index, id] of ["compare-a", "compare-b"].entries()) {
      const select = $(id), previous = select.value;
      select.innerHTML = scenarios.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join("");
      select.value = scenarios.some(s => s.id === previous) ? previous : scenarios[(1-index) % scenarios.length].id;
    }
    if (scenarios.length > 1 && $("compare-a").value === $("compare-b").value) {
      $("compare-a").value = scenarios.find(s => s.id !== $("compare-b").value).id;
    }
    renderComparisonGraph();
  }

  const DAY_MS = 86400000;
  const dateIndex = date => Date.parse(date + "T00:00:00Z") / DAY_MS;

  function renderComparisonGraph(resetDates = false) {
    const field = $("compare-prayer").value, value = $("compare-value").value;
    const tolerance = +$("compare-tolerance").value, subtract = $("compare-mode").value === "subtract";
    const byTolerance = value === "tolerance", cumulative = value === "cumulative";
    const clockTimes = value === "angular" || value === "fractional";
    const from = $("compare-from"), through = $("compare-through");
    const selected = subtract ? ["compare-a", "compare-b"].map(id => scenarios.find(s => s.id === $(id).value)).filter(Boolean)
      : scenarios.filter(s => !mutedScenarios.has(s.id));
    $("compare-overlay").hidden = subtract;
    $("compare-operands").hidden = !subtract;
    $("compare-dates").hidden = byTolerance || selected.length === 0;
    function message(note) {
      $("comparison-note").textContent = note;
      $("comparison-plot").hidden = true;
      $("comparison-legend").innerHTML = "";
      $("export-graph").disabled = true;
      graphData = null;
    }
    if (!selected.length) return message("Select at least one scenario to plot.");
    if (subtract && (selected.length < 2 || selected[0].id === selected[1].id)) return message("Choose two different scenarios for A and B.");
    const years = selected.map(s => s.config.year);
    const min = `${subtract ? Math.max(...years) : Math.min(...years)}-01-01`;
    const max = `${subtract ? Math.min(...years) : Math.max(...years)}-12-31`;
    if (!byTolerance && min > max) return message("These scenarios have no common calendar dates. Use scenarios from the same year to subtract daily values.");
    for (const input of [from, through]) { input.min = min; input.max = max; }
    if (!byTolerance) {
      if (resetDates || !from.value || from.value < min || from.value > max) from.value = min;
      if (resetDates || !through.value || through.value < min || through.value > max) through.value = max;
      if (from.value > through.value) return message("Choose an end date on or after the start date.");
    }

    const dailyPoint = (row, y) => ({x:dateIndex(row.date), y, label:row.date});
    let series = selected.map(s => {
      const rows = E.calculate(s.config).rows;
      let total = 0;
      const points = byTolerance ? LIMITS.map(t => ({x:t, y:E.metric(rows,field,t).days, label:`< ${t} min`}))
        : rows.map(row => {
          const error = row.errors[field];
          if (Number.isFinite(error) && Math.abs(error) < tolerance) total++;
          return dailyPoint(row, cumulative ? total : clockTimes ? row[value][field] : error);
        }).filter(p => p.label >= from.value && p.label <= through.value);
      return {name:s.name, points, color:C.colors[scenarios.indexOf(s) % C.colors.length]};
    });
    if (subtract) {
      const [a,b] = series;
      const byDate = new Map(b.points.map(p => [p.x, p.y]));
      series = [{name:`${a.name} − ${b.name}`, points:a.points.map(p => {
        const y = byDate.get(p.x);
        return {...p, y:Number.isFinite(p.y) && Number.isFinite(y) ? p.y - y : null};
      })}];
    }
    const first = dateIndex(from.value), last = dateIndex(through.value);
    const ticks = byTolerance ? LIMITS.map(t => [t,String(t)]) : [...new Set(Array.from({length:5}, (_,i) => Math.round(first + i*(last-first)/4)))].map(x =>
      [x,new Date(x*DAY_MS).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:min.slice(0,4)===max.slice(0,4)?undefined:"2-digit",timeZone:"UTC"})]);
    const countValue = cumulative || byTolerance;
    const clockAxis = clockTimes && !subtract;
    const note = [
      subtract ? `${selected[0].name} minus ${selected[1].name}. ` : "",
      clockTimes ? "Times use each scenario’s saved clock settings." : value === "errors" ? "Each scenario’s discrepancy is angular or shadow time minus fractional time." :
        cumulative ? `Counts begin on 1 January in each scenario’s year and use < ${tolerance} minutes.` : "Counts use the full calendar year.",
      byTolerance ? "" : " Daily values are matched by calendar date."
    ].join("");
    $("comparison-note").textContent = note;
    $("comparison-plot").hidden = false;
    $("export-graph").disabled = !series.some(s => s.points.length);
    graphData = {field, value, series, byTolerance};
    charts.comparison.update({series, xRange:byTolerance?[5,30]:first===last?[first-.5,last+.5]:[first,last], xTicks:ticks,
      xLabel:byTolerance?"Tolerance (minutes)":"",
      band:value==="errors"&&!subtract?tolerance:undefined,
      includeZero:!clockAxis, yLabel:countValue?"Days":clockAxis?"Scenario clock":"Difference (min)",
      formatY:clockAxis ? v=>E.time(v) : undefined,
      formatValue:countValue?v=>`${Math.round(v)} days`:clockAxis?v=>E.time(v,true):signed});
    legend($("comparison-legend"),series);
  }

  function legend(container,series){container.innerHTML=series.map((s,i)=>`<span><i style="background:${s.color||C.colors[i%C.colors.length]}"></i>${esc(s.name)}</span>`).join("");}

  async function sweep() {
    update();if(!$("error").hidden)return;
    const version=++sweepVersion,base={...config},field=$("latitude-prayer").value,step=+$("latitude-step").value;
    const n=Math.round(180/step),rows=[];$("run-latitude").disabled=true;$("cancel-latitude").hidden=false;$("latitude-progress").hidden=false;
    try{
      for(let i=0;i<n;i++){
        if(version!==sweepVersion)return;
        const latitude=-90+(i+.5)*step,result=E.calculate({...base,latitude,timeZone:null,clock:"solar"},false);
        rows.push({latitude,weight:(Math.sin((-90+(i+1)*step)*E.R)-Math.sin((-90+i*step)*E.R))/2,
          coverage:result.metrics[field].defined,ks:result.ks,counts:LIMITS.map(t=>E.metric(result.rows,field,t).days)});
        if(i%8===0){$("latitude-state").textContent=`Calculating ${field === "fajr" ? "Fajr" : NAMES[field]} · ${i+1} of ${n} latitude bands`;
          $("latitude-progress").value=100*(i+1)/n;await new Promise(resolve=>setTimeout(resolve,0));}
      }
      latitudeResult={rows,config:base,field,step,total:E.dates(base.year).length};renderLatitude();
      $("latitude-state").textContent=`${n} latitude bands · ${base.year} · ${NAMES[field]} · ${base.shadowMode==="optimal" ? `k fitted at ${base.fitTolerance} min` : shadowLabel(base.shadowMode)} · horizon ${fmt(E.horizon(base),4)}°`;
    }catch(error){toast(error.message);}finally{if(version===sweepVersion){$("run-latitude").disabled=false;$("cancel-latitude").hidden=true;$("latitude-progress").hidden=true;}}
  }

  function renderLatitude(){
    if(!latitudeResult)return;$("latitude-output").hidden=false;$("export-latitude").disabled=false;
    const {rows,total,step}=latitudeResult;
    const series=LIMITS.map((t,i)=>({name:`< ${t} min`,color:C.colors[i],points:rows.map(r=>({x:r.latitude,y:r.counts[i],label:`${r.latitude.toFixed(3)}°`}))}));
    charts.latitude.update({series,xRange:[-90,90],xTicks:[[-90,"90° S"],[-60,"60° S"],[-30,"30° S"],[0,"0°"],[30,"30° N"],[60,"60° N"],[90,"90° N"]],yRange:[0,total+5],yLabel:"Qualifying days",xLabel:"Latitude",formatValue:v=>`${Math.round(v)} days`});legend($("latitude-legend"),series);
    $("latitude-bands").querySelector("tbody").innerHTML=LIMITS.map((t,j)=>{
      const bands=[];let start=null;
      rows.forEach((r,i)=>{if(r.counts[j]===total&&start===null)start=i;
        if(start!==null&&(r.counts[j]!==total||i===rows.length-1)){const end=r.counts[j]===total?i:i-1;bands.push(`${rows[start].latitude.toFixed(2)}° to ${rows[end].latitude.toFixed(2)}°`);start=null;}});
      return `<tr><td>&lt; ${t} min</td><td>${bands.join("; ")||"None at this resolution"}</td><td>${rows.reduce((s,r)=>s+r.weight*r.counts[j],0).toFixed(2)} / ${total}</td></tr>`;
    }).join("");
    $("latitude-table").querySelector("thead").innerHTML=`<tr><th>Latitude</th><th>Defined</th>${LIMITS.map(t=>`<th>&lt; ${t} min</th>`).join("")}<th>k₁</th><th>k₂</th></tr>`;
    $("latitude-table").querySelector("tbody").innerHTML=rows.map(r=>`<tr><td>${r.latitude.toFixed(3)}°</td><td>${r.coverage}</td>${r.counts.map(c=>`<td>${c}</td>`).join("")}<td>${fmt(r.ks[0],6)}</td><td>${fmt(r.ks[1],6)}</td></tr>`).join("");
  }

  function calibrationHtml(){
    const cal=annual.calibration;
    return `<table><thead><tr><th>Reference candidate</th><th>Noon elevation</th><th>Noon shadow / stick</th></tr></thead><tbody>${cal.candidates.map(c=>`<tr><td>${c.date}${c.date===cal.date?" · selected":""}</td><td>${fmt(c.noonElevation,6)}°</td><td>${fmt(c.noonShadow,9)}</td></tr>`).join("")}</tbody></table><p>Selected night fraction 1/${config.nightDenominator} · Fajr depression <b>${fmt(cal.angle,6)}°</b>.<br>Calibrated first-afternoon fraction <b>${fmt(cal.r1,10)}</b> · second <b>${fmt(cal.r2,10)}</b>.</p>`;
  }

  function openHelp(id){
    const topic=PRAYER_HELP.find(t=>t.id===id)||PRAYER_HELP[0];$("dialog-title").textContent=topic.title;
    $("dialog-content").innerHTML=`<div class="help-content">${topic.html.replace('<div id="live-calibration"></div>',calibrationHtml())}</div>`;
    $("help-dialog").showModal();
  }

  function renderHelp(){
    const query=$("help-search").value.trim().toLowerCase();
    $("help-topics").innerHTML=PRAYER_HELP.filter(t=>(t.title+" "+t.html).toLowerCase().includes(query)).map(t=>`<details class="help-topic" ${query?"open":""}><summary>${t.title}</summary><div class="help-content">${t.html.replace('<div id="live-calibration"></div>',calibrationHtml())}</div></details>`).join("");
  }

  function download(name,headers,rows){
    const quote=v=>{let s=String(v??"");if(typeof v==="string"&&/^[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
    const csv=[headers,...rows].map(r=>r.map(quote).join(",")).join("\r\n");
    const url=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"})),link=document.createElement("a");
    link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000);toast(`Prepared ${rows.length} CSV rows for download.`);
  }

  function annualExport(){
    const headers=["date","city","latitude","longitude","year","horizon_degrees","night_denominator","fajr_angle_degrees","asr1_fraction","asr2_fraction","k1","k2","fit_tolerance_min","count_tolerance_min","utc_offset_min","sunrise_clock_min","noon_clock_min","sunset_clock_min",...FIELDS.flatMap(n=>[`${n}_angular_clock_min`,`${n}_fractional_clock_min`,`${n}_difference_min`,`${n}_compatible`])];
    const rows=annual.rows.map(d=>[d.date,config.city,config.latitude,config.longitude,config.year,E.horizon(config),config.nightDenominator,annual.calibration.angle,...annual.ratios,...annual.ks,config.fitTolerance,config.tolerance,d.offset,d.sunrise,d.noon,d.sunset,...FIELDS.flatMap(n=>[d.angular[n],d.fractional[n],d.errors[n],Number.isFinite(d.errors[n])&&Math.abs(d.errors[n])<config.tolerance])]);
    download(`prayer-models-${config.year}.csv`,headers,rows);
  }

  document.querySelectorAll(".nav").forEach(button=>button.addEventListener("click",()=>{if(button.dataset.view==="help")renderHelp();setView(button.dataset.view);}));
  document.querySelector(".brand").addEventListener("click",e=>{e.preventDefault();setView("daily");window.scrollTo({top:0,behavior:"smooth"});});
  $("settings").addEventListener("submit",e=>{e.preventDefault();update();});
  $("settings").addEventListener("input",e=>{
    if(["city"].includes(e.target.id))return;
    if(["latitude","longitude"].includes(e.target.id)){config.city="Custom position";config.timeZone=null;$("city").value="Custom position";if($("time-zone").value==="city")$("time-zone").value="fixed";}
    clearTimeout(debounce);debounce=setTimeout(update,250);
  });
  $("settings").addEventListener("change",e=>{if(e.target.id!=="city")update();});
  $("city").addEventListener("change",()=>{const c=PRAYER_CITIES.find(c=>c.name===$("city").value);if(c)chooseLocation(c);});
  $("use-city").addEventListener("click",()=>{const c=findCity($("city").value);if(c)chooseLocation(c);else toast("Choose a city from the list, or enter its coordinates below.");});
  $("favorite-chips").addEventListener("click",e=>{const b=e.target.closest("[data-favorite]");if(b)chooseLocation(favoriteCities[+b.dataset.favorite]);});
  $("add-favorite").addEventListener("click",()=>{
    if ($("city").value.trim() !== config.city) {
      const city = findCity($("city").value);
      if (!city) return toast("Choose a city or enter its coordinates before saving.");
      chooseLocation(city);
    } else update();
    if ($("error").hidden) toast(saveFavorite({...config, name:config.city}));
  });
  $("manage-favorites").addEventListener("click",()=>{
    update();
    $("favorite-location").value = "current";
    previewFavorite();
    $("favorite-status").textContent = "Favorites stay in this browser.";
    renderFavorites();
    $("favorites-dialog").showModal();
  });
  $("favorite-location").addEventListener("change",previewFavorite);
  $("close-favorites").addEventListener("click",()=>$("favorites-dialog").close());
  $("favorite-form").addEventListener("submit",e=>{
    e.preventDefault();
    const name = $("favorite-name").value.trim(), city = favoriteLocation();
    $("favorite-status").textContent = !name ? "Enter a favorite name."
      : $("favorite-location").value === "current" && !$("error").hidden ? "Correct the current experiment settings before saving this location."
      : saveFavorite({...city, name});
  });
  $("favorite-list").addEventListener("click",e=>{
    const b=e.target.closest("[data-remove-favorite]");if(!b)return;
    const [removed] = favoriteCities.splice(+b.dataset.removeFavorite,1);
    $("favorite-status").textContent = persist() ? `${removed.name} removed.` : "Removed for this visit. Browser storage is unavailable.";
    renderFavorites();
  });
  $("reset").addEventListener("click",()=>{config={...E.defaults};selectedDate="2026-05-28";populateForm();update();});
  $("prayer-picker").addEventListener("click",e=>{const b=e.target.closest("[data-prayer]");if(!b)return;prayer=b.dataset.prayer;document.querySelectorAll("[data-prayer]").forEach(el=>el.classList.toggle("selected",el===b));renderAnnualGraph();renderCalendar();});
  $("compatibility-calendar").addEventListener("click",e=>{const b=e.target.closest("[data-date]");if(b)selectDay(b.dataset.date);});
  $("day-table").addEventListener("click",e=>{const row=e.target.closest("[data-event]");if(row)inspectEvent(row.dataset.event);});
  $("sun-chart").closest("details").addEventListener("toggle",()=>charts.solar.draw());
  document.addEventListener("click",e=>{const help=e.target.closest("[data-help]");if(help)openHelp(help.dataset.help);});
  $("close-help").addEventListener("click",()=>$("help-dialog").close());$("help-search").addEventListener("input",renderHelp);
  let scenarioDraft;
  $("add-scenario").addEventListener("click",()=>{
    update();
    if (!$("error").hidden) return;
    if (scenarios.length >= 30) return toast("The list holds 30 scenarios. Remove one before saving another.");
    scenarioDraft = {...config};
    const city = config.city.split(" · ")[0];
    let number = 1;
    while (scenarios.some(s => s.name.toLowerCase() === `${city}${number}`.toLowerCase())) number++;
    $("new-scenario-name").value = `${city}${number}`.slice(0,120);
    $("scenario-preview").textContent = `${config.city} · ${config.year} · night 1/${config.nightDenominator} · ${config.fractions} fractions · ${shadowLabel(config.shadowMode)}`;
    $("scenario-status").textContent = "";
    $("scenario-dialog").showModal();
    $("new-scenario-name").select();
  });
  $("close-scenario").addEventListener("click",()=>$("scenario-dialog").close());
  $("scenario-form").addEventListener("submit",e=>{
    e.preventDefault();
    const name = $("new-scenario-name").value.trim();
    if (!name || scenarios.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      $("scenario-status").textContent = "Enter a unique scenario name.";
      return;
    }
    $("scenario-dialog").close();
    $("compare-mode").value = "overlay";
    addScenarios([{name,config:scenarioDraft}]);
  });
  document.querySelectorAll("[data-preset]").forEach(b=>b.addEventListener("click",()=>addPreset(b.dataset.preset)));
  ["compare-prayer","compare-tolerance"].forEach(id=>$(id).addEventListener("change",renderComparison));
  ["compare-mode","compare-value","compare-a","compare-b","compare-from","compare-through"].forEach(id=>$(id).addEventListener("change",()=>renderComparisonGraph()));
  $("compare-full-range").addEventListener("click",()=>renderComparisonGraph(true));
  $("compare-scenarios").addEventListener("change",e=>{
    const box = e.target;
    if (box.checked) mutedScenarios.delete(box.value);
    else mutedScenarios.add(box.value);
    persist();
    renderComparisonGraph();
  });
  $("clear-comparison").addEventListener("click",()=>{scenarios=[];mutedScenarios.clear();persist();renderComparison();});
  $("comparison-table").addEventListener("click",e=>{const b=e.target.closest("[data-remove-scenario]");if(b){const [removed]=scenarios.splice(+b.dataset.removeScenario,1);mutedScenarios.delete(removed.id);persist();renderComparison();}});
  $("comparison-table").addEventListener("change",e=>{
    if (e.target.dataset.name === undefined) return;
    const scenario = scenarios[+e.target.dataset.name], name = e.target.value.trim().slice(0,120);
    if (!name || scenarios.some(s=>s!==scenario && s.name.toLowerCase()===name.toLowerCase())) {
      e.target.value=scenario.name; toast("Enter a unique scenario name."); return;
    }
    scenario.name=name; persist(); renderComparison();
  });
  $("run-latitude").addEventListener("click",sweep);
  $("cancel-latitude").addEventListener("click",()=>{sweepVersion++;$("run-latitude").disabled=false;$("cancel-latitude").hidden=true;$("latitude-progress").hidden=true;$("latitude-state").textContent="Sweep cancelled. Choose settings and calculate again.";});
  $("export-annual").addEventListener("click",annualExport);
  $("export-daily").addEventListener("click",()=>{const d=annual.rows.find(r=>r.date===selectedDate);download(`prayer-day-${selectedDate}.csv`,["event","angular_or_shadow","fractional","difference_minutes"],dailyTimes(d).map(([name,a,b,field])=>[name,E.time(a,true),E.time(b,true),field?d.errors[field]:Number.isFinite(a)?0:null]));});
  $("export-graph").addEventListener("click",()=>{
    if (!graphData) return;
    const {field,value,series,byTolerance} = graphData;
    download("prayer-comparison-graph.csv", ["series","prayer","value",byTolerance?"tolerance_min":"date","graph_value"],
      series.flatMap(s=>s.points.map(p=>[s.name,field,value,byTolerance?p.x:p.label,p.y])));
  });
  $("export-comparison").addEventListener("click",()=>download("prayer-comparison.csv",["scenario","prayer","city","latitude","longitude","year","horizon_deg","night_denominator","fraction_mode","fajr_angle","k1","k2","fit_tolerance_min","count_tolerance_min","compatible_days","defined_days","total_days","rms_min","max_min"],comparisonRows().map(s=>[s.name,$("compare-prayer").value,s.config.city,s.config.latitude,s.config.longitude,s.config.year,E.horizon(s.config),s.config.nightDenominator,s.config.fractions,s.result.calibration.angle,...s.result.ks,s.config.fitTolerance,+$("compare-tolerance").value,s.metric.days,s.metric.defined,s.metric.total,s.metric.rms,s.metric.maximum])));
  $("export-latitude").addEventListener("click",()=>{if(!latitudeResult)return;const l=latitudeResult;download("latitude-compatibility.csv",["latitude","area_weight","year","prayer","horizon_deg","fajr_angle","asr1_fraction","asr2_fraction","fit_tolerance_min","defined_days",...LIMITS.map(t=>`days_under_${t}min`),"k1","k2"],l.rows.map(r=>[r.latitude,r.weight,l.config.year,l.field,E.horizon(l.config),E.calibration(l.config).angle,...(l.config.fractions==="exact"?[E.calibration(l.config).r1,E.calibration(l.config).r2]:[.5,.7]),l.config.fitTolerance,r.coverage,...r.counts,...r.ks]));});
  $("cities").innerHTML=PRAYER_CITIES.map(c=>`<option value="${esc(c.name)}"></option>`).join("");
  $("favorite-location").innerHTML = '<option value="current">Current location</option>' + PRAYER_CITIES
    .map((city,index)=>({city,index})).sort((a,b)=>a.city.name.localeCompare(b.city.name))
    .map(({city,index})=>`<option value="${index}">${esc(city.name)}</option>`).join("");
  for (const id of ["compare-prayer","latitude-prayer"]) $(id).innerHTML = FIELDS.map(name=>`<option value="${name}">${NAMES[name]}</option>`).join("");
  $("prayer-picker").innerHTML = FIELDS.map(name=>`<button data-prayer="${name}" class="${name===prayer?"selected":""}">${NAMES[name]}</button>`).join("");
  populateForm();update();$("scenario-badge").textContent=scenarios.length;
  globalThis.prayerExplorer = {get config(){return {...config}},get result(){return annual},get scenarios(){return scenarios},setView,openHelp};
})();
