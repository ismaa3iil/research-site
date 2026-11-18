/* Numerical previews use the fixed seed in the survey, with all six angle permutations. */
const formulas = {};
function previewOrbit(n, map) {
  if (map === "M3" && (n === 30 || n === 74 || (n >= 98 && n <= 112) || n === 476 || n === 477))
    return {reason: n === 30 ? "No finite pedal point" : "Collinear pedal feet"};
  const weight = formulas[n];
  if (!weight) return {reason: "Formula unavailable for preview"};
  const width = 120, height = 104, counts = new Uint32Array(width * height);
  let A = 42 * Math.PI / 180, B = 61 * Math.PI / 180, C = 77 * Math.PI / 180;
  const tail = new Float64Array(256*3);
  let completed = 0;
  function plot(top,left,right) {
    const x = Math.round((0.5+0.48*(right-left)/Math.PI)*(width-1));
    const y = Math.round((0.98-0.96*top/Math.PI)*(height-1));
    counts[y*width+x]++;
  }
  function deposit(a,b,c) {
    plot(a,b,c); plot(a,c,b); plot(b,c,a); plot(b,a,c); plot(c,a,b); plot(c,b,a);
  }
  function image() {
    const peak = counts.reduce((m,x)=>Math.max(m,x),0);
    return Uint8Array.from(counts, x=>255-Math.round(255*Math.pow(x/peak,0.35)));
  }
  function stopped() {
    if (completed < 2) return {reason:"Numerical orbit stopped"};
    const used = Math.min(completed,256);
    counts.fill(0);
    for (let j=0;j<used;j++) deposit(tail[j*3],tail[j*3+1],tail[j*3+2]);
    return {pixels:image(), note:`Early path · last ${used} of ${completed} completed steps`};
  }
  for (let i = 0; i < 54000; ++i) {
    const a = Math.sin(A), b = Math.sin(B), c = Math.sin(C);
    let u = weight(a,b,c,A,B,C), v = weight(b,c,a,B,C,A), w = weight(c,a,b,C,A,B);
    const scale = Math.max(Math.abs(u), Math.abs(v), Math.abs(w));
    if (!(scale > 0 && Number.isFinite(scale))) return stopped();
    u /= scale; v /= scale; w /= scale;
    const cx = b*Math.cos(A), cy = b*Math.sin(A);
    let x1,y1,x2,y2,x3;
    if (map === "M1") {
      x1 = (v*c+w*cx)/(v+w); y1 = w*cy/(v+w);
      x2 = w*cx/(w+u); y2 = w*cy/(w+u);
      x3 = v*c/(u+v);
    } else {
      const total = u+v+w;
      if (Math.abs(total) < 1e-14) return stopped();
      const px = (v*c+w*cx)/total, py = w*cy/total;
      const dx = cx-c, dy = cy;
      const t = ((px-c)*dx+py*dy)/(dx*dx+dy*dy);
      x1 = c+t*dx; y1 = t*dy;
      const q = (px*cx+py*cy)/(b*b);
      x2 = q*cx; y2 = q*cy; x3 = px;
    }
    const dx = x2-x1, dy = y2-y1, ex = x3-x1, ey = -y1;
    const cross = Math.abs(dx*ey-dy*ex);
    A = Math.atan2(cross,dx*ex+dy*ey);
    B = Math.atan2(cross,-dx*(ex-dx)-dy*(ey-dy));
    C = Math.atan2(cross,ex*(ex-dx)+ey*(ey-dy));
    if (!(Math.min(A,B,C)>1e-13 && Math.abs(A+B+C-Math.PI)<1e-9))
      return stopped();
    const slot=(completed%256)*3;
    tail[slot]=A; tail[slot+1]=B; tail[slot+2]=C; completed++;
    if (i >= 4000) deposit(A,B,C);
  }
  return {pixels:image()};

}
if (typeof self !== "undefined") {
  const loaded = new Set();
  self.onmessage = ({data:{n,map}}) => {
    try {
      const chunk = Math.floor((n-1)/256);
      if (n<=72807 && !loaded.has(chunk)) { importScripts("formulas/"+chunk+".js"); loaded.add(chunk); }
      self.postMessage(previewOrbit(n,map));
    } catch { self.postMessage({reason:"Could not load preview"}); }
  };
}
