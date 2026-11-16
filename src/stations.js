import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Set pieces for the section stations of the 3D world. One long studio floor runs along +x; every section has its
// own corner of it (monitor desk, tool shelf, question board, bookshelf path, photo desk) and the camera trucks
// sideways from one to the next. Everything here is a pure function of a scroll value k (see world.js), so
// scrolling up plays it back exactly in reverse.
//   k < 0: the section is still below (k = -1 one screen before its anchor), k = 0 at the anchor, k > 0 after.
const PAL = { teal: '#0F6E6A', tealB: '#4CB8B0', butter: '#F0D36A', coral: '#E87862', lilac: '#A888D4', mint: '#5EC4A8', sky: '#5AA3C8', ink: '#1A1916', paper: '#F6F5F1', cream: '#F0EBE3' };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = THREE.MathUtils.lerp;
const back = (t) => { const s = 1.6; t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1; }; // overshoot ease

export function buildStations({ scene, lite, journeyCount = 6, photoUrl }) {
  const mats = new Map();
  const std = (color, rough = 0.6, metal = 0, extra = {}) => {
    const key = color + rough + metal + JSON.stringify(extra);
    if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra }));
    return mats.get(key);
  };
  const shadow = (m, cast = true, recv = true) => { if (!lite) { m.castShadow = cast; m.receiveShadow = recv; } return m; };
  const rbox = (w, h, d, r, mat) => shadow(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, lite ? 2 : 4, r), mat));
  const box = (w, h, d, mat) => shadow(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat));
  const themed = []; // materials that follow the light/dark theme: [material, lightColor, darkColor]
  const tm = (light, dark, rough = 0.85, metal = 0) => { const m = new THREE.MeshStandardMaterial({ color: light, roughness: rough, metalness: metal }); themed.push([m, light, dark]); return m; };

  const root = new THREE.Group(); scene.add(root);

  // ---- shared room: one floor and a back wall under all section stations
  const floorMat = tm('#E7DFD2', '#1F1B17', 0.95);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(130, 40), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.set(64, 0, 2); if (!lite) floor.receiveShadow = true; root.add(floor);
  const wallMat = tm('#F1EBE1', '#181512', 1);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(130, 24), wallMat); wall.position.set(64, 12, -7); if (!lite) wall.receiveShadow = true; root.add(wall);
  const deskMat = tm('#C9A27A', '#5A4532', 0.55);
  const deskLeg = tm('#2B2622', '#0F0D0B', 0.4, 0.6);
  function desk(w, d, x, z = 0) {
    const g = new THREE.Group();
    const top = rbox(w, 0.16, d, 0.05, deskMat); top.position.y = 1.5; g.add(top);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { const l = box(0.1, 1.5, 0.1, deskLeg); l.position.set(sx * (w / 2 - 0.25), 0.75, sz * (d / 2 - 0.2)); g.add(l); });
    g.position.set(x, 0, z); root.add(g); return g;
  }

  // canvas textures for screens
  function screenTex(draw, w = 512, h = 320) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); draw(g, w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  const glowTex = screenTex((g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); }, 128, 128);
  const glow = (color, s) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 0.7), new THREE.MeshBasicMaterial({ map: glowTex, color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); return m; };

  const stations = {};

  // ================= PROYEK: three monitors on a desk, screens power on one by one =================
  {
    const X = 22, g = new THREE.Group(); g.position.x = X; root.add(g);
    desk(7.4, 2.6, X, 0);
    const shots = [
      (c, w, h) => { c.fillStyle = '#E6F3F2'; c.fillRect(0, 0, w, h); [[0.4, PAL.butter], [0.75, PAL.teal], [0.55, PAL.coral], [0.9, PAL.mint], [0.65, PAL.sky]].forEach(([v, col], i) => { c.fillStyle = col; const bw = w * 0.11; c.fillRect(w * 0.12 + i * bw * 1.45, h * 0.86 - v * h * 0.66, bw, v * h * 0.66); }); c.strokeStyle = PAL.teal; c.lineWidth = 6; c.beginPath(); c.moveTo(w * 0.1, h * 0.7); c.lineTo(w * 0.35, h * 0.45); c.lineTo(w * 0.55, h * 0.55); c.lineTo(w * 0.88, h * 0.18); c.stroke(); },
      (c, w, h) => { c.fillStyle = '#EEE7F8'; c.fillRect(0, 0, w, h); const n = [[0.3, 0.45], [0.62, 0.25], [0.7, 0.68], [0.45, 0.78], [0.85, 0.45]]; c.strokeStyle = PAL.lilac; c.lineWidth = 5; n.slice(1).forEach(([x, y]) => { c.beginPath(); c.moveTo(n[0][0] * w, n[0][1] * h); c.lineTo(x * w, y * h); c.stroke(); }); n.forEach(([x, y], i) => { c.fillStyle = [PAL.lilac, PAL.mint, PAL.sky, PAL.butter, PAL.coral][i]; c.beginPath(); c.arc(x * w, y * h, i ? 18 : 30, 0, 7); c.fill(); }); },
      (c, w, h) => { c.fillStyle = '#FBE4DF'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.fillRect(w * 0.1, h * 0.14, w * 0.8, h * 0.72); c.fillStyle = PAL.coral; c.fillRect(w * 0.1, h * 0.14, w * 0.8, h * 0.1); [0, 1, 2].forEach((i) => { c.fillStyle = [PAL.butter, PAL.mint, PAL.sky][i]; c.fillRect(w * (0.15 + i * 0.25), h * 0.34, w * 0.2, h * 0.3); c.fillStyle = '#E6E2DA'; c.fillRect(w * (0.15 + i * 0.25), h * 0.68, w * 0.2, h * 0.06); }); },
    ];
    const frameMat = std('#22201D', 0.35, 0.5);
    const mons = shots.map((draw, i) => {
      const m = new THREE.Group();
      const body = rbox(2.2, 1.4, 0.12, 0.05, frameMat); m.add(body);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.04, 1.24), new THREE.MeshStandardMaterial({ map: screenTex(draw), emissive: '#ffffff', emissiveMap: null, emissiveIntensity: 0, roughness: 0.3, color: '#111' }));
      scr.material.emissiveMap = scr.material.map; scr.position.z = 0.065; m.add(scr);
      const neck = box(0.12, 0.5, 0.12, frameMat); neck.position.set(0, -0.92, -0.05); m.add(neck);
      const foot = rbox(0.7, 0.05, 0.4, 0.02, frameMat); foot.position.set(0, -1.17, 0); m.add(foot);
      const gl = glow([PAL.teal, PAL.lilac, PAL.coral][i], 4.2); gl.position.z = -0.2; m.add(gl);
      m.position.set((i - 1) * 2.35, 1.58 + 1.2, (i === 1 ? -0.35 : 0)); m.rotation.y = (1 - i) * 0.28;
      g.add(m); return { m, scr, gl, baseY: m.position.y };
    });
    // keyboard + mug
    const kb = rbox(1.6, 0.06, 0.5, 0.03, std('#EDE7DD', 0.6)); kb.position.set(0, 1.62, 0.8); g.add(kb);
    const mug = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.34, 24), std(PAL.butter, 0.4))); mug.position.set(2.6, 1.75, 0.7); g.add(mug);
    stations.proyek = {
      x: X,
      pose(k, o) { const d = k * 0.9; o.P.set(X + d, 3.9 - k * 0.3, 13 - ss(-1, 0, k) * 1.6); o.L.set(X + d * 0.6, 2.55, 0); },
      update(k, t) {
        mons.forEach((s, i) => {
          const on = ss(-0.9 + i * 0.18, -0.25 + i * 0.18, k);
          s.m.position.y = s.baseY - (1 - back(ss(-1.1 + i * 0.12, -0.45 + i * 0.12, k))) * 1.2;
          s.scr.scale.y = Math.max(0.02, on); s.scr.material.emissiveIntensity = on * 0.95;
          s.gl.material.opacity = on * (0.32 + 0.06 * Math.sin(t * 1.5 + i));
        });
      },
    };
  }

  // ================= TOOLS: wall shelf, the six tools drop onto it =================
  {
    const X = 38, g = new THREE.Group(); g.position.x = X; root.add(g);
    const wood = tm('#D8C2A4', '#4A3A2C', 0.7);
    const shelves = [1.6, 3.0];
    shelves.forEach((y) => { const s = rbox(7, 0.14, 1.2, 0.04, wood); s.position.set(0, y, -5.6); g.add(s); });
    [-3.4, 3.4].forEach((x) => { const s = rbox(0.14, 3.4, 1.2, 0.04, wood); s.position.set(x, 1.7, -5.6); g.add(s); });
    const objs = [];
    const put = (obj, x, y) => { obj.userData.home = new THREE.Vector3(x, y, -5.4); g.add(obj); objs.push(obj); };
    // megaphone (ads)
    { const o = new THREE.Group(); const cone = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.14, 0.9, 32, 1, true), std(PAL.butter, 0.4, 0, { side: THREE.DoubleSide }))); cone.rotation.z = Math.PI / 2; o.add(cone); const h = box(0.14, 0.35, 0.14, std(PAL.ink, 0.5)); h.position.set(0.2, -0.25, 0); o.add(h); put(o, -2.4, shelves[1] + 0.5); }
    // shopping bag (marketplace)
    { const o = new THREE.Group(); const b = rbox(0.8, 0.8, 0.45, 0.04, std(PAL.coral, 0.6)); o.add(b); const hd = shadow(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 10, 32, Math.PI), std(PAL.ink, 0.4))); hd.position.y = 0.4; o.add(hd); put(o, 0, shelves[1] + 0.47); }
    // spreadsheet tile (sheets)
    { const o = new THREE.Group(); const b = rbox(0.9, 0.9, 0.12, 0.04, std('#2E9E5B', 0.5)); o.add(b); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const cell = box(0.22, 0.18, 0.02, std('#FFFFFF', 0.7)); cell.position.set(-0.25 + c * 0.25, 0.22 - r * 0.22, 0.07); o.add(cell); } o.rotation.x = -0.2; put(o, 2.3, shelves[1] + 0.52); }
    // agent network (orchestration)
    { const o = new THREE.Group(); const hub = shadow(new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 2), std(PAL.lilac, 0.3, 0.1))); o.add(hub); for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; const n = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 14), std([PAL.mint, PAL.sky, PAL.butter, PAL.coral][i], 0.4))); n.position.set(Math.cos(a) * 0.45, 0.12 * Math.sin(a * 2), Math.sin(a) * 0.3); o.add(n); const link = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6), std(PAL.ink, 0.5)); link.position.copy(n.position).multiplyScalar(0.5); link.lookAt(n.position); link.rotateX(Math.PI / 2); o.add(link); } put(o, -2.4, shelves[0] + 0.45); }
    // gear (routines)
    { const o = new THREE.Group(); const m = std(PAL.mint, 0.35, 0.3); const ring = shadow(new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.1, 12, 40), m)); o.add(ring); for (let i = 0; i < 10; i++) { const tth = box(0.12, 0.14, 0.16, m); const a = (i / 10) * Math.PI * 2; tth.position.set(Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0); tth.rotation.z = a; o.add(tth); } o.userData.spin = true; put(o, 0, shelves[0] + 0.62); }
    // code window (full-stack web)
    { const o = new THREE.Group(); const b = rbox(1.0, 0.72, 0.1, 0.05, std(PAL.sky, 0.45)); o.add(b); const bar = box(0.9, 0.08, 0.02, std('#FFFFFF', 0.6)); bar.position.set(0, 0.27, 0.06); o.add(bar); const tex = screenTex((c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = 'bold 150px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('</>', w / 2, h / 2 + 10); }, 512, 256); const code = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), new THREE.MeshBasicMaterial({ map: tex, transparent: true })); code.position.set(0, -0.05, 0.06); o.add(code); put(o, 2.3, shelves[0] + 0.45); }
    // wall clock-ish sign + plant to fill the corner
    const pot = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.6, 24), std(PAL.coral, 0.7))); pot.position.set(4.4, 0.3, -5); g.add(pot);
    const leaves = []; for (let i = 0; i < 7; i++) { const l = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), std(PAL.mint, 0.6))); l.scale.set(0.5, 1.4, 0.25); const a = (i / 7) * Math.PI * 2; l.position.set(4.4 + Math.cos(a) * 0.25, 1.1 + (i % 2) * 0.25, -5 + Math.sin(a) * 0.25); l.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5); g.add(l); leaves.push(l); }
    stations.tools = {
      x: X,
      pose(k, o) { const d = k * 1.1; o.P.set(X + 1.2 + d, 3.9, 9.4 - ss(-1, 0, k) * 1.2); o.L.set(X + d * 0.5, 2.85, -5.4); },
      update(k, t) {
        objs.forEach((o, i) => {
          const h = o.userData.home, p = ss(-1 + i * 0.1, -0.35 + i * 0.1, k);
          o.position.set(h.x, h.y + (1 - back(p)) * 4.5, h.z + (1 - p) * 1.5);
          o.rotation.y = (1 - p) * 2.4 + Math.sin(t * 0.8 + i) * 0.08;
          if (o.userData.spin) o.rotation.z = k * 3;
          o.visible = p > 0.001;
        });
      },
    };
  }

  // ================= TANYA: speech bubbles pop out of a phone and settle in a cloud =================
  {
    const X = 54, g = new THREE.Group(); g.position.x = X; root.add(g);
    desk(4.6, 2.2, X, 0.4);
    const phone = rbox(0.9, 0.08, 1.7, 0.08, std('#22201D', 0.35, 0.4)); phone.position.set(0, 1.63, 0.6); phone.rotation.y = -0.3; g.add(phone);
    const pscr = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 1.55), new THREE.MeshBasicMaterial({ color: PAL.tealB })); pscr.rotation.x = -Math.PI / 2; pscr.position.y = 0.045; phone.add(pscr);
    const cols = [PAL.butter, PAL.coral, PAL.sky, PAL.lilac, PAL.mint, PAL.tealB];
    const spots = [[-2.6, 4.6, -1.2], [-0.6, 5.4, -1.8], [1.7, 4.9, -1.4], [-1.7, 3.3, -0.6], [0.5, 3.7, -0.8], [2.6, 3.4, -0.4]];
    const bubbles = cols.map((col, i) => {
      const b = new THREE.Group();
      const body = rbox(1.5, 0.85, 0.3, 0.2, std(col, 0.45)); b.add(body);
      const tail = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.36, 4), std(col, 0.45))); tail.rotation.z = Math.PI + (i % 2 ? -0.5 : 0.5); tail.position.set(i % 2 ? 0.45 : -0.45, -0.5, 0); b.add(tail);
      for (let d = 0; d < 3; d++) { const dot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), std('#FFFFFF', 0.5)); dot.position.set((d - 1) * 0.28, 0, 0.16); b.add(dot); }
      b.userData.spot = new THREE.Vector3(...spots[i]); g.add(b); return b;
    });
    // big question mark made of a torus arc + dot
    const qm = new THREE.Group(); const qMat = std(PAL.teal, 0.35, 0.2);
    const arc = shadow(new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.16, 16, 48, Math.PI * 1.5), qMat)); arc.rotation.z = -Math.PI * 0.5; arc.position.y = 0.7; qm.add(arc);
    const stem = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 20), qMat)); stem.position.set(0, -0.05, 0); qm.add(stem);
    const dotQ = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 16), qMat)); dotQ.position.y = -0.6; qm.add(dotQ);
    qm.position.set(-4.2, 2.6, -2.5); g.add(qm);
    stations.tanya = {
      x: X,
      pose(k, o) { const d = k * 1.0; o.P.set(X - 0.8 + d, 5.4, 13.6 - ss(-1, 0, k) * 1.4); o.L.set(X - 0.7 + d * 0.5, 4.55, -1); },
      update(k, t) {
        bubbles.forEach((b, i) => {
          const p = ss(-0.95 + i * 0.09, -0.3 + i * 0.09, k), s = b.userData.spot;
          const from = new THREE.Vector3(0, 1.7, 0.6);
          b.position.lerpVectors(from, s, p); b.position.y += Math.sin(t * 1.2 + i) * 0.06 * p;
          b.scale.setScalar(Math.max(0.001, back(p)));
          b.rotation.set(0, (1 - p) * 1.5 + Math.sin(t * 0.7 + i) * 0.06, Math.sin(t + i) * 0.04);
          b.visible = p > 0.001;
        });
        qm.rotation.y = k * 2.2 + Math.sin(t * 0.6) * 0.1; qm.position.y = 2.6 + ss(-1, 0, k) * 0.8;
      },
    };
  }

  // ================= JEJAK: bookshelf + a stepped path, a marker climbs one step per journey stop =================
  {
    const X = 70, g = new THREE.Group(); g.position.x = X; root.add(g);
    const wood = tm('#B98C62', '#3E2E21', 0.65);
    const case_ = new THREE.Group(); case_.position.set(-3.3, 0, -4.6); g.add(case_);
    const sides = [[-1.6, 2.4], [1.6, 2.4]]; sides.forEach(([x]) => { const s = box(0.14, 4.8, 1.2, wood); s.position.set(x, 2.4, 0); case_.add(s); });
    [0.1, 1.6, 3.1, 4.75].forEach((y) => { const s = box(3.34, 0.12, 1.2, wood); s.position.set(0, y, 0); case_.add(s); });
    const bookCols = [PAL.teal, PAL.butter, PAL.coral, PAL.lilac, PAL.mint, PAL.sky, '#7A5C45', '#D9D1C7'];
    const books = [];
    [0.16, 1.66, 3.16].forEach((y, row) => {
      let x = -1.45;
      while (x < 1.3) { const w = 0.16 + ((x * 7 + row * 3) % 1 + 1) % 1 * 0.14, h = 0.9 + ((x * 13 + row) % 1 + 1) % 1 * 0.42;
        const b = box(w, h, 0.9, std(bookCols[books.length % bookCols.length], 0.7)); b.position.set(x + w / 2, y + h / 2, 0.1); b.userData.home = b.position.clone(); case_.add(b); books.push(b); x += w + 0.03; }
    });
    // stepped path: one step per journey stop, rising to the right
    const n = Math.max(3, journeyCount);
    const steps = [], stepMat = tm('#EDE6DA', '#2A2520', 0.8);
    const path = new THREE.Group(); path.position.set(0.2, 1.4, -1.2); g.add(path);
    for (let i = 0; i < n; i++) {
      const s = rbox(Math.min(1.1, 5.2 / Math.max(1, n - 1) - 0.08), 0.3 + i * 0.32, 1.1, 0.06, stepMat); s.position.set(-1.0 + i * (5.2 / Math.max(1, n - 1)), (0.3 + i * 0.32) / 2, -1.6); path.add(s);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 32), std(bookCols[i % 6], 0.5, 0, { emissive: bookCols[i % 6], emissiveIntensity: 0 })); cap.position.set(s.position.x, 0.3 + i * 0.32 + 0.02, -1.6); path.add(cap);
      steps.push({ s, cap, top: 0.3 + i * 0.32 });
    }
    const flagPole = box(0.05, 1.2, 0.05, std(PAL.ink, 0.4)); const last = steps[n - 1];
    flagPole.position.set(last.s.position.x + 0.35, last.top + 0.6, -1.9); path.add(flagPole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.38, 8, 1), std(PAL.coral, 0.6, 0, { side: THREE.DoubleSide })); flag.position.set(last.s.position.x + 0.66, last.top + 1.0, -1.9); path.add(flag);
    const marker = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 20), std(PAL.teal, 0.25, 0.3))); path.add(marker);
    stations.jejak = {
      x: X,
      pose(k, o) { const d = k * 1.2; o.P.set(X + 0.4 + d, 6.0, 15.6 - ss(-1, 0, k) * 1.4); o.L.set(X + 0.4 + d * 0.5, 3.95, -3); }, // pulled back so the flag on the top step stays in frame
      update(k, t) {
        books.forEach((b, i) => { const p = ss(-1 + (i % 9) * 0.03, -0.45 + (i % 9) * 0.03, k); b.position.z = b.userData.home.z + (1 - p) * 1.2; b.rotation.z = (1 - p) * 0.25; });
        const climb = ss(-0.6, 0.35, k) * (n - 1);
        const i0 = Math.floor(climb), f = climb - i0, a = steps[Math.min(i0, n - 1)], b = steps[Math.min(i0 + 1, n - 1)];
        marker.position.set(lerp(a.s.position.x, b.s.position.x, f), lerp(a.top, b.top, f) + 0.22 + Math.sin(f * Math.PI) * 0.5, -1.6);
        steps.forEach((s, i) => { s.cap.material.emissiveIntensity = clamp(climb - i + 1) * 0.6; });
        flag.rotation.y = Math.sin(t * 2) * 0.2; flag.scale.x = 0.2 + 0.8 * ss(n - 2, n - 1, climb);
      },
    };
  }

  // ================= FOTO: a laptop opens, the camera zooms into its screen (Rifqy's photo) =================
  {
    const X = 86, g = new THREE.Group(); g.position.x = X; root.add(g);
    desk(5.2, 2.6, X, 0);
    const alu = std('#B9BCC2', 0.32, 0.8);
    const lap = new THREE.Group(); lap.position.set(0, 1.58, 0.1); g.add(lap);
    const base = rbox(2.6, 0.1, 1.8, 0.04, alu); base.position.y = 0.05; lap.add(base);
    const keys = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.85), std('#2B2B2E', 0.6)); keys.rotation.x = -Math.PI / 2; keys.position.set(0, 0.105, -0.25); lap.add(keys);
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), std('#A9ACB2', 0.4, 0.6)); pad.rotation.x = -Math.PI / 2; pad.position.set(0, 0.105, 0.5); lap.add(pad);
    const hinge = new THREE.Group(); hinge.position.set(0, 0.1, -0.88); lap.add(hinge);
    const lid = rbox(2.6, 1.95, 0.07, 0.04, alu); lid.position.y = 0.975; hinge.add(lid);
    const bezel = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.85), std('#111214', 0.4)); bezel.position.set(0, 0.975, 0.037); hinge.add(bezel);
    // 4:3 screen; the photo is 886x790, crop rows 40..704 for the screen
    const photoMat = new THREE.MeshBasicMaterial({ color: '#000000' });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.28, 1.71), photoMat); screen.position.set(0, 0.975, 0.04); hinge.add(screen);
    if (photoUrl) {
      new THREE.TextureLoader().load(photoUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
        tex.repeat.set(1, 664 / 790); tex.offset.set(0, 86 / 790);
        photoMat.map = tex; photoMat.color.set('#ffffff'); photoMat.needsUpdate = true;
      });
    }
    const screenGlow = glow('#FFF3D6', 6); screenGlow.position.set(0, 0.975, -0.2); hinge.add(screenGlow);
    // props: lamp + notebook + plant
    const lampMat = std(PAL.teal, 0.4, 0.2);
    const lampBase = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.08, 32), lampMat)); lampBase.position.set(-2.0, 1.62, -0.6); g.add(lampBase);
    const arm = box(0.06, 1.3, 0.06, lampMat); arm.position.set(-2.0, 2.25, -0.6); arm.rotation.z = -0.25; g.add(arm);
    const shade = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.4, 28, 1, true), std(PAL.butter, 0.5, 0, { side: THREE.DoubleSide, emissive: PAL.butter, emissiveIntensity: 0.3 }))); shade.position.set(-1.75, 2.95, -0.6); shade.rotation.z = -0.9; g.add(shade);
    const book = rbox(0.9, 0.12, 1.2, 0.03, std(PAL.coral, 0.6)); book.position.set(1.9, 1.64, 0.3); book.rotation.y = 0.3; g.add(book);
    stations.foto = {
      x: X,
      screen,
      fixed: true, // its window is a whole screen tall: no ride-along offset
      pose(k, o) {
        // Arrive already zoomed on the portrait (k ≈ 0). The dolly-in happens while leaving the hero
        // (k < 0) so the handoff stays smooth. Scrolling on toward "Sekarang" (k > 0) pulls back to
        // the open laptop and desk. Scroll up plays the same path in reverse.
        const z = ss(-0.65, 0.0, k), back_ = ss(0.22, 0.92, k);
        const zoom = z * (1 - back_);
        o.P.set(X + lerp(1.6, 0, zoom), lerp(4.4, 2.74, zoom), lerp(10, 3.7, zoom));
        o.L.set(X, lerp(2.0, 2.64, zoom), lerp(0, -0.95, zoom));
      },
      update(k) {
        const open = ss(-0.9, -0.2, k);
        hinge.rotation.x = lerp(Math.PI * 0.5, -0.18, open);
        screenGlow.material.opacity = open * 0.35;
        photoMat.color.setScalar(photoMat.map ? 0.15 + 0.85 * ss(-0.55, -0.05, k) : 0);
      },
    };
  }

  function setTheme(dark) { themed.forEach(([m, l, d]) => m.color.set(dark ? d : l)); }
  return { root, stations, setTheme };
}
