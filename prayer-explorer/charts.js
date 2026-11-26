/* Responsive canvas charts with aligned inspection across all visible series. */
(() => {
  "use strict";
  const colors = ["#116b67", "#4065a5", "#b35b32", "#80529e", "#63812e", "#a4466b", "#267e99", "#9c7438"];
  class Chart {
    constructor(canvas, onPick) {
      this.canvas = canvas; this.onPick = onPick; this.options = {};
      this.tooltip = document.createElement("div"); this.tooltip.className = "chart-tooltip";
      this.tooltip.hidden = true; canvas.parentElement.append(this.tooltip);
      this.observer = new ResizeObserver(() => this.draw()); this.observer.observe(canvas.parentElement);
      canvas.addEventListener("pointermove", e => this.inspect(e));
      canvas.addEventListener("pointerleave", () => { this.tooltip.hidden = true; });
      canvas.addEventListener("click", e => { if (this.onPick && this.layout) this.onPick(this.nearestX(e)); });
    }
    update(options) { this.options = options; this.draw(); }
    nearestX(event) {
      const r = this.canvas.getBoundingClientRect(), l = this.layout;
      const x = Math.max(l.left, Math.min(l.right, event.clientX - r.left));
      return l.xmin + (x - l.left) * (l.xmax - l.xmin) / (l.right - l.left);
    }
    inspect(event) {
      const l = this.layout; if (!l) return;
      const x = this.nearestX(event), parts = [];
      for (const series of this.options.series || []) {
        const p = series.points.reduce((best, row) => Math.abs(row.x - x) < Math.abs(best.x - x) ? row : best,
                                      series.points[0] || {x: Infinity, y: null});
        if (!Number.isFinite(p.x)) continue;
        parts.push(`${series.name}${p.label ? " · " + p.label : ""}\n${Number.isFinite(p.y) ? (this.options.formatValue?.(p.y) ?? p.y.toFixed(2)) : "Event unavailable"}`);
      }
      if (!parts.length) return;
      this.tooltip.textContent = parts.slice(0, 10).join("\n"); this.tooltip.hidden = false;
      const r = this.canvas.getBoundingClientRect();
      this.tooltip.style.left = Math.max(0, Math.min(event.clientX - r.left + 12, r.width - this.tooltip.offsetWidth - 4)) + "px";
      this.tooltip.style.top = Math.max(0, Math.min(event.clientY - r.top + 10, r.height - this.tooltip.offsetHeight)) + "px";
    }
    draw() {
      const c = this.canvas, w = c.parentElement.clientWidth, h = c.parentElement.clientHeight;
      if (!w || !h) return;
      const ratio = window.devicePixelRatio || 1;
      c.width = Math.round(w * ratio); c.height = Math.round(h * ratio);
      const ctx = c.getContext("2d"); ctx.scale(ratio, ratio); ctx.clearRect(0, 0, w, h);
      const {series = [], band, xTicks = [], yLabel = "Minutes", xLabel = "", xRange, yRange, selected} = this.options;
      const points = series.flatMap(s => s.points).filter(p => Number.isFinite(p.y));
      const xmin = xRange?.[0] ?? 0, xmax = xRange?.[1] ?? 364;
      let ymin = yRange?.[0] ?? Math.min(0, band ? -band : 0, ...points.map(p => p.y));
      let ymax = yRange?.[1] ?? Math.max(0, band || 0, ...points.map(p => p.y));
      if (ymin === ymax) { ymin -= 1; ymax += 1; }
      if (!yRange) { const pad = (ymax - ymin) * .08; ymin -= pad; ymax += pad; }
      const left = 55, right = Math.max(left + 1, w - 12), top = 25, bottom = h - (xLabel ? 48 : 31);
      this.layout = {left, right, top, bottom, xmin, xmax};
      const sx = v => left + (v - xmin) / (xmax - xmin) * (right - left);
      const sy = v => bottom - (v - ymin) / (ymax - ymin) * (bottom - top);
      ctx.font = "12px 'Instrument Sans', system-ui, sans-serif";
      if (band) { ctx.fillStyle = "#eaf3ef"; ctx.fillRect(left, sy(band), right - left, sy(-band) - sy(band)); }
      ctx.fillStyle = "#586b7b"; ctx.textAlign = "left"; ctx.fillText(yLabel, 0, 12);
      const step = this.tickStep((ymax - ymin) / 5);
      for (let v = Math.ceil(ymin / step) * step; v <= ymax + 1e-8; v += step) {
        ctx.strokeStyle = Math.abs(v) < 1e-8 ? "#a9bcc4" : "#e4eaee"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(left, sy(v)); ctx.lineTo(right, sy(v)); ctx.stroke();
        ctx.fillStyle = "#586b7b"; ctx.textAlign = "right"; ctx.fillText(this.options.formatY?.(v) ?? (Math.abs(v) < 1e-8 ? "0" : +v.toFixed(2)), left - 8, sy(v) + 4);
      }
      for (let i = 0; i < xTicks.length; i++) {
        if (w < 510 && xTicks.length > 7 && i % 2) continue;
        const [v, label] = xTicks[i]; if (v < xmin || v > xmax) continue;
        ctx.fillStyle = "#586b7b"; ctx.textAlign = v === xmin ? "left" : v === xmax ? "right" : "center";
        ctx.fillText(label, sx(v), bottom + 20);
      }
      if (xLabel) { ctx.textAlign = "center"; ctx.fillStyle = "#586b7b"; ctx.fillText(xLabel, (left + right) / 2, h - 4); }
      ctx.save(); ctx.beginPath(); ctx.rect(left, top, right - left, bottom - top); ctx.clip();
      for (let index = 0; index < series.length; index++) {
        const s = series[index]; ctx.strokeStyle = s.color || colors[index % colors.length]; ctx.lineWidth = s.width || 1.9;
        ctx.setLineDash(s.dash || (index >= colors.length ? [4, 3] : [])); ctx.beginPath(); let open = false;
        for (const p of s.points) {
          if (!Number.isFinite(p.y)) { open = false; continue; }
          if (open) ctx.lineTo(sx(p.x), sy(p.y)); else { ctx.moveTo(sx(p.x), sy(p.y)); open = true; }
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      if (Number.isFinite(selected)) { ctx.strokeStyle = "#527381"; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(sx(selected), top); ctx.lineTo(sx(selected), bottom); ctx.stroke(); }
      ctx.restore();
      if (!points.length) { ctx.fillStyle = "#586b7b"; ctx.textAlign = "center"; ctx.fillText("No defined events on this domain", (left + right) / 2, (top + bottom) / 2); }
    }
    tickStep(size) { const e = 10 ** Math.floor(Math.log10(size)), n = size / e; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * e; }
  }
  globalThis.PrayerCharts = {Chart, colors};
})();
