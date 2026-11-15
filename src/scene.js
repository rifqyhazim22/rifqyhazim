import * as THREE from 'three';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
gsap.registerPlugin(CustomEase);
if (!CustomEase.get('smooth')) CustomEase.create('smooth', 'M0,0 C0.6,0 0.25,1 1,1');
import { ADS, AGENT } from './sprites.js';
import { buildVoxel, wave } from './voxel.js';
import { t, onLang } from './i18n.js';
import { drawClock } from './clock.js';

// Procedural desk room, built in code: no external models.
// lite = phones/tablets: DPR cap 1.5, no shadow maps (blob shadows only), fewer floaters, simple camera moves, tap instead of hover.
export function createScene({ canvas, hero, bubble, onCharHover, onCharTap, lite = false }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, alpha: true, powerPreference: lite ? 'default' : 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, lite ? 1.5 : 2)); // native sharpness on desktop (capped at 2)
  renderer.shadowMap.enabled = !lite;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);
  const themed = [];
  const mats = {};
  const std = (hex, opts = {}) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.82, metalness: 0, ...opts });
  const cached = (hex) => (mats[hex] ||= std(hex));
  const themedMat = (light, dark, opts) => { const m = std(light, opts); themed.push({ m, light, dark }); return m; };
  const shadowy = (mesh, cast = true, receive = true) => { mesh.castShadow = cast; mesh.receiveShadow = receive; return mesh; };

  // ---------- Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0xf0ebe3, 1.7);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff6ea, 1.6);
  sun.position.set(-4, 9, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 6, bottom: -4, near: 1, far: 30 });
  sun.shadow.bias = -0.0004; sun.shadow.radius = 9; sun.shadow.blurSamples = 16;
  scene.add(sun);

  const room = new THREE.Group();
  scene.add(room);

  // ---------- Floor: rounded platform
  const floorShape = new THREE.Shape();
  const fw = 9.6, fd = 4.6, fr = 1.9;
  floorShape.moveTo(-fw / 2 + fr, -fd / 2);
  floorShape.lineTo(fw / 2 - fr, -fd / 2); floorShape.quadraticCurveTo(fw / 2, -fd / 2, fw / 2, -fd / 2 + fr);
  floorShape.lineTo(fw / 2, fd / 2 - fr); floorShape.quadraticCurveTo(fw / 2, fd / 2, fw / 2 - fr, fd / 2);
  floorShape.lineTo(-fw / 2 + fr, fd / 2); floorShape.quadraticCurveTo(-fw / 2, fd / 2, -fw / 2, fd / 2 - fr);
  floorShape.lineTo(-fw / 2, -fd / 2 + fr); floorShape.quadraticCurveTo(-fw / 2, -fd / 2, -fw / 2 + fr, -fd / 2);
  const floor = shadowy(new THREE.Mesh(new THREE.ExtrudeGeometry(floorShape, { depth: 0.16, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3 }), themedMat('#F6F5F1', '#24201C')), false, true);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.16, 0.6);
  room.add(floor);

  // ---------- Desk
  const deskMat = themedMat('#FFFFFF', '#F0EBE3');
  const desk = new THREE.Group();
  const top = shadowy(new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.12, 1.5), deskMat));
  top.position.y = 1.0;
  desk.add(top);
  for (const x of [-2.25, 2.25]) {
    const leg = shadowy(new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 1.2), deskMat));
    leg.position.set(x, 0.5, 0); desk.add(leg);
  }
  const kb = shadowy(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.4), themedMat('#E6E2DA', '#B4AAA0')));
  kb.position.set(0, 1.08, 0.38); desk.add(kb);
  desk.position.z = -0.2;
  room.add(desk);

  // ---------- Monitors with live canvas screens
  function screenCanvas() { const c = document.createElement('canvas'); c.width = 512; c.height = 320; return c; }
  const adsCanvas = screenCanvas(), agentCanvas = screenCanvas();
  const adsTex = new THREE.CanvasTexture(adsCanvas), agentTex = new THREE.CanvasTexture(agentCanvas);
  for (const tx of [adsTex, agentTex]) { tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; }
  const bodyMat = themedMat('#1A1916', '#2E2924', { roughness: 0.5 });
  function monitor(x, tex, rotY) {
    const g = new THREE.Group();
    const body = shadowy(new THREE.Mesh(new THREE.BoxGeometry(1.95, 1.22, 0.09), bodyMat));
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.83, 1.12), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    screen.position.z = 0.047;
    const neck = shadowy(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.36, 0.07), bodyMat));
    neck.position.set(0, -0.78, -0.02);
    const base = shadowy(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.3), bodyMat));
    base.position.set(0, -0.96, 0);
    g.add(body, screen, neck, base);
    g.position.set(x, 2.04, -0.5); g.rotation.y = rotY;
    room.add(g);
    return { g, screen };
  }
  const monAds = monitor(-1.05, adsTex, 0.1);
  const monAgent = monitor(1.05, agentTex, -0.1);

  // ---------- Wall clock (visitor-local time): round frame floating above the monitors, live canvas face
  const clockCanvas = document.createElement('canvas'); clockCanvas.width = clockCanvas.height = 256;
  const clockTex = new THREE.CanvasTexture(clockCanvas); clockTex.colorSpace = THREE.SRGBColorSpace; clockTex.anisotropy = 4;
  const wallClock = new THREE.Group();
  const rim = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 48), themedMat('#1A1916', '#F0EBE3', { roughness: 0.45 })));
  rim.rotation.x = Math.PI / 2;
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.47, 48), new THREE.MeshBasicMaterial({ map: clockTex, transparent: true, toneMapped: false }));
  face.position.z = 0.042;
  wallClock.add(rim, face); wallClock.position.set(0, 3.32, -0.75);
  room.add(wallClock);
  let clockStart = null, clockDark = false, lastClockDraw = 0;

  // ---------- Lamp: coral cone shade, hinge, neck, base, soft light
  const lamp = new THREE.Group();
  const lampBase = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.06, 32), cached('#5F5A54')));
  lampBase.position.y = 0.03;
  const lampBaseTop = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.04, 32), cached('#1A1916')));
  lampBaseTop.position.y = 0.08;
  const neck = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.0, 16), cached('#5F5A54')));
  neck.position.y = 0.58;
  const hinge = shadowy(new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.08, 0.1), cached('#1A1916')));
  hinge.position.y = 1.1;
  const shade = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.4, 0.44, 40, 1, true), std('#E87862', { side: THREE.DoubleSide, roughness: 0.6 })));
  shade.position.y = 1.36;
  const bulbMat = new THREE.MeshBasicMaterial({ color: '#FBF3D4', toneMapped: false });
  const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.39, 40), bulbMat);
  bulb.rotation.x = Math.PI / 2; bulb.position.y = 1.15;
  const lampLight = new THREE.PointLight(0xffd79a, 4, 7, 1.6);
  lampLight.position.y = 1.0;
  lamp.add(lampBase, lampBaseTop, neck, hinge, shade, bulb, lampLight);
  // Soft glow halo behind the lamp
  const gc = document.createElement('canvas'); gc.width = gc.height = 256;
  const gx = gc.getContext('2d'); const grd = gx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.45, 'rgba(255,255,255,0.55)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  gx.fillStyle = grd; gx.fillRect(0, 0, 256, 256);
  const glowTex = new THREE.CanvasTexture(gc);
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, color: '#FBF3D4', transparent: true, opacity: 0.85, depthWrite: false });
  const glow = new THREE.Sprite(glowMat); glow.scale.set(2.4, 2.4, 1); glow.position.set(0, 1.2, -0.45); glow.renderOrder = -1;
  lamp.add(glow);
  lamp.position.set(-2.2, 1.06, -0.45);
  room.add(lamp);

  // ---------- Plant + mug
  const plant = new THREE.Group();
  const pot = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.28, 24), cached('#5F5A54')));
  pot.position.y = 0.14; plant.add(pot);
  [['#0F6E6A', -0.07, -0.25], ['#5EC4A8', 0.0, 0.05], ['#7ED9C4', 0.08, 0.3]].forEach(([c, x, rz]) => {
    const leaf = shadowy(new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.26, 6, 12), cached(c)));
    leaf.position.set(x, 0.48, 0); leaf.rotation.z = rz; plant.add(leaf);
  });
  plant.position.set(2.3, 1.06, -0.3);
  room.add(plant);
  const mug = new THREE.Group();
  const cup = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 24), cached('#E87862')));
  cup.position.y = 0.1;
  const handle = shadowy(new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 16), cached('#E87862')));
  handle.position.set(0.11, 0.1, 0);
  mug.add(cup, handle); mug.position.set(1.65, 1.06, 0.22);
  room.add(mug);

  // ---------- "Versi diri" voxel characters, extruded from the pixel sprites
  const chAds = buildVoxel(ADS, { mat: cached }); chAds.g.position.set(-3.15, 0.0, 1.35); chAds.g.rotation.y = 0.28; room.add(chAds.g);
  const chAgent = buildVoxel(AGENT, { mat: cached }); chAgent.g.position.set(3.2, 0.0, 1.35); chAgent.g.rotation.y = -0.28; room.add(chAgent.g);

  // Baked-look contact shadows (soft blobs) under props, cheap and always soft
  const blobC = document.createElement('canvas'); blobC.width = blobC.height = 128;
  { const x = blobC.getContext('2d'); const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(26,25,22,0.35)'); gr.addColorStop(1, 'rgba(26,25,22,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); }
  const blobTex = new THREE.CanvasTexture(blobC);
  const blob = (w, d, x, z, y = 0.005) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); room.add(m); return m; };
  blob(6.2, 2.4, 0, -0.2); const blobAds = blob(1.8, 1.0, -3.15, 1.35); const blobAgent = blob(1.8, 1.0, 3.2, 1.35);

  // Floating pixels rising from the screens (ads: colour cubes, agents: glowing dots)
  const floaters = [];
  const fcols = ['#F0D36A', '#E87862', '#5EC4A8', '#A888D4', '#5AA3C8'];
  const nF = lite ? 6 : 14;
  for (let i = 0; i < nF; i++) {
    const ads = i < nF / 2;
    const m = new THREE.Mesh(ads ? new THREE.BoxGeometry(0.07, 0.07, 0.07) : new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: fcols[i % 5], transparent: true }));
    m.userData = { x: ads ? -1.05 : 1.05, ph: Math.random(), sp: 0.12 + Math.random() * 0.1, dx: (Math.random() - 0.5) * 1.6 };
    room.add(m); floaters.push(m);
  }
  chAds.key = 'iklan'; chAgent.key = 'agen';
  const chars = [chAds, chAgent];
  const baseZ = { iklan: 1.35, agen: 1.35 };

  // ---------- Screen drawing
  let lit = { iklan: 0.9, agen: 0.9 };
  const mono = '600 15px "IBM Plex Mono", monospace';
  function titleBar(ctx, txt) {
    ctx.fillStyle = '#24201C'; ctx.fillRect(0, 0, 512, 40);
    ctx.fillStyle = '#F0EBE3'; ctx.font = mono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.letterSpacing = '3px'; ctx.fillText(txt, 256, 21);
  }
  function drawAds(time) {
    const ctx = adsCanvas.getContext('2d');
    ctx.fillStyle = '#1A1916'; ctx.fillRect(0, 0, 512, 320);
    titleBar(ctx, t('scr.ads'));
    ctx.strokeStyle = 'rgba(240,235,227,0.08)'; ctx.lineWidth = 1;
    for (let y = 90; y < 300; y += 50) { ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(472, y); ctx.stroke(); }
    const cols = ['#F0D36A', '#2A9D96', '#E87862', '#5EC4A8'], base = [0.32, 0.62, 0.44, 0.86];
    const boost = focus === 'iklan' ? 1 : 0;
    cols.forEach((c, i) => {
      const wob = 0.06 * Math.sin(time * 1.6 + i * 1.3) + boost * 0.08 * Math.sin(time * 4 + i);
      const h = Math.max(0.15, Math.min(1, base[i] + wob)) * 210;
      ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(70 + i * 100, 295 - h, 66, h, [6, 6, 0, 0]); ctx.fill();
    });
    ctx.strokeStyle = '#F0EBE3'; ctx.lineWidth = 3; ctx.beginPath();
    [0.32, 0.62, 0.44, 0.86].forEach((v, i) => { const x = 103 + i * 100, y = 295 - (v + 0.06 * Math.sin(time * 1.6 + i * 1.3)) * 210 - 18; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
    adsTex.needsUpdate = true;
  }
  const nodes = [[130, 120, '#A888D4'], [390, 105, '#5AA3C8'], [262, 240, '#5EC4A8'], [420, 245, '#F0D36A']];
  const links = [[0, 1], [0, 2], [2, 3], [1, 3]];
  function drawAgent(time) {
    const ctx = agentCanvas.getContext('2d');
    ctx.fillStyle = '#1E3A38'; ctx.fillRect(0, 0, 512, 320);
    titleBar(ctx, t('scr.agent'));
    ctx.lineWidth = 3; ctx.strokeStyle = '#4CB8B0';
    links.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(nodes[a][0], nodes[a][1]); ctx.lineTo(nodes[b][0], nodes[b][1]); ctx.stroke(); });
    links.forEach(([a, b], i) => { // packets travelling along links
      const k = (time * 0.45 + i * 0.27) % 1, x = nodes[a][0] + (nodes[b][0] - nodes[a][0]) * k, y = nodes[a][1] + (nodes[b][1] - nodes[a][1]) * k;
      ctx.fillStyle = '#F0EBE3'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
    });
    const pulse = focus === 'agen' ? 1 : 0.35;
    nodes.forEach(([x, y, c], i) => {
      const ph = (time * 1.2 + i * 0.5) % 1;
      ctx.strokeStyle = c; ctx.globalAlpha = (1 - ph) * pulse; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, 18 + ph * 26 * (0.6 + pulse), 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, i === 2 ? 22 : 17, 0, 7); ctx.fill();
    });
    agentTex.needsUpdate = true;
  }

  // ---------- Camera rig
  const poses = {
    intro: { px: 7, py: 12, pz: 36, lx: 0, ly: 1.6, lz: 0, off: -0.18, fov: 22 },
    idle: { px: 0, py: 3.6, pz: 16.5, lx: 0.1, ly: 1.2, lz: 0, off: -0.18, fov: 30 },
    iklan: { px: -1.4, py: 3.1, pz: 13.6, lx: -0.7, ly: 1.3, lz: 0, off: -0.17, fov: 27 },
    agen: { px: 1.4, py: 3.1, pz: 14.6, lx: 0.8, ly: 1.3, lz: 0, off: -0.235, fov: 27 },
    scroll: { px: 0, py: 13, pz: 17, lx: 0, ly: 0.2, lz: 0, off: -0.1, fov: 34 },
  };
  // lite: narrower frame, pull back so the whole platform (plus a margin for the soft edge fade) stays in frame; no side offset.
  // Re-framed on every resize (orientation change, Safari toolbar show/hide).
  function frameLite() {
    const w = hero.clientWidth, asp = w / Math.max(1, hero.clientHeight), phone = innerWidth <= 600; // phones keep their original framing
    const d = phone ? Math.min(22, Math.max(13, 21.5 / asp)) : Math.min(24, Math.max(14, 23.5 / asp));
    Object.assign(poses.idle, { px: 0, pz: d, py: 3.8, ly: 1.45 }); Object.assign(poses.iklan, { px: -1.2, pz: d * (phone ? 0.84 : 0.86) }); Object.assign(poses.agen, { px: 1.2, pz: d * (phone ? 0.84 : 0.86) });
  }
  if (lite) frameLite();
  const rig = { ...poses.intro };
  let focus = null, active = 'iklan', scrollP = 0, intro = true;
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  let wide = true, vw = 1, vh = 1;

  function resize() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    wide = !lite && w > 900; vw = w; vh = h;
    if (lite) { frameLite(); if (!intro && !(flight && flight.isActive())) Object.assign(rig, poses[focus || 'idle']); }
  }
  new ResizeObserver(resize).observe(hero);
  resize();

  // Cinematic flight: camera travels on a curved (lifted, pulled-back) path, look target and FOV ease along
  let flight = null;
  function flyTo(name, dur = 1.1, viaOverride) {
    const to = poses[name], from = { ...rig };
    const p0 = new THREE.Vector3(from.px, from.py, from.pz), p2 = new THREE.Vector3(to.px, to.py, to.pz);
    const d = p0.distanceTo(p2);
    const mid = viaOverride || p0.clone().lerp(p2, 0.5).add(new THREE.Vector3(0, 0.25 * d + 0.25, 0.45 * d + 0.3));
    const curve = new THREE.CatmullRomCurve3([p0, mid, p2], false, 'centripetal');
    const st = { t: 0 };
    flight?.kill();
    flight = gsap.to(st, { t: 1, duration: dur, ease: 'smooth', onUpdate: () => {
      const v = curve.getPoint(st.t), k = st.t;
      rig.px = v.x; rig.py = v.y; rig.pz = v.z;
      for (const key of ['lx', 'ly', 'lz', 'off', 'fov']) rig[key] = from[key] + (to[key] - from[key]) * k;
    } });
    return flight;
  }
  function setFocus(f) {
    if (f === focus) return;
    const prev = focus; focus = f;
    if (lite) { flight?.kill(); flight = gsap.to(rig, { ...poses[f || 'idle'], duration: 0.8, ease: 'smooth' }); } else flyTo(f || 'idle', f ? 1.1 : 1.0);
    gsap.to(lit, { iklan: f === 'iklan' ? 1.15 : f ? 0.55 : 0.9, agen: f === 'agen' ? 1.15 : f ? 0.55 : 0.9, duration: 0.5 });
    if (f === 'iklan') { gsap.fromTo(chAds.body.position, { y: 0 }, { y: 0.45, duration: 0.22, yoyo: true, repeat: 3, ease: 'power2.out' }); gsap.to(chAds.g.rotation, { y: 0.55, duration: 0.6, ease: 'smooth' }); }
    else gsap.to(chAds.g.rotation, { y: 0.28, duration: 0.6, ease: 'smooth' });
    if (f === 'agen') { gsap.to(chAgent.g.position, { z: 2.1, duration: 0.5, ease: 'power3.out' }); gsap.fromTo(chAgent.body.position, { y: 0 }, { y: 0.3, duration: 0.2, yoyo: true, repeat: 1 }); }
    if (prev === 'agen') gsap.to(chAgent.g.position, { z: baseZ.agen, duration: 0.6, ease: 'power3.out' });
    if (f) setActive(f);
  }
  function setActive(a) {
    active = a;
    bubble.classList.toggle('agen', a === 'agen');
    bubble.firstElementChild.dataset.i18n = a === 'agen' ? 'bubble.agent' : 'bubble.ads';
    bubble.firstElementChild.textContent = t(bubble.firstElementChild.dataset.i18n);
  }
  onLang(() => setActive(active));

  // Raycast hover on the characters
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let hovered = null;
  addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = (e.clientY / innerHeight) * 2 - 1;
    if (lite && e.pointerType !== 'mouse') return;
    if (e.clientY < r.top || e.clientY > r.bottom || intro) { if (hovered) { hovered = null; onCharHover(null); } return; }
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(chars.map((c) => c.hit), false)[0];
    const key = hit ? chars.find((c) => c.hit === hit.object).key : null;
    if (key !== hovered) { hovered = key; onCharHover(key); }
  }, { passive: true });
  // Touch / lite: tap a character to switch Versi Iklan <-> Agen
  canvas.addEventListener('click', (e) => {
    if (intro || !onCharTap) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(chars.map((c) => c.hit), false)[0];
    onCharTap(hit ? chars.find((c) => c.hit === hit.object).key : null);
  });

  // ---------- Theme
  function setTheme(dark, instant = false) {
    clockDark = dark;
    const d = instant ? 0 : 0.7;
    themed.forEach(({ m, light, dark: dk }) => { const c = new THREE.Color(dark ? dk : light); gsap.to(m.color, { r: c.r, g: c.g, b: c.b, duration: d }); });
    gsap.to(hemi, { intensity: dark ? 0.45 : 1.7, duration: d });
    gsap.to(sun, { intensity: dark ? 0.25 : 1.6, duration: d });
    gsap.to(lampLight, { intensity: dark ? 16 : 4, duration: d });
    const gcol = new THREE.Color(dark ? '#E8C24A' : '#FBF3D4');
    gsap.to(glowMat.color, { r: gcol.r, g: gcol.g, b: gcol.b, duration: d });
    gsap.to(glowMat, { opacity: dark ? 0.55 : 0.85, duration: d });
    gsap.to(glow.scale, { x: dark ? 3.2 : 2.4, y: dark ? 3.2 : 2.4, duration: d });
  }

  // ---------- Intro: preloader done -> camera flies into the room, props assemble
  const props = [monAds.g, monAgent.g, lamp, plant, mug, kb, chAds.g, chAgent.g];
  props.forEach((p) => p.scale.setScalar(0.001)); wallClock.scale.setScalar(0.001);
  function playIntro() {
    const tl = gsap.timeline({ onComplete: () => { intro = false; } });
    tl.to(wallClock.scale, { x: 1, y: 1, z: 1, duration: 0.7, ease: 'back.out(2)', onStart: () => { clockStart = performance.now(); } }, 1.0);
    if (lite) { tl.to(rig, { ...poses.idle, duration: 1.6, ease: 'smooth' }, 0); }
    else // swoop in from high/far right, around the left, then settle (2.6s, smooth ease)
    tl.add(flyTo('idle', 2.6, new THREE.Vector3(-9, 6.5, 24)), 0);
    props.forEach((p, i) => tl.to(p.scale, { x: 1, y: 1, z: 1, duration: 0.7, ease: 'back.out(2)' }, 0.9 + i * 0.09));
    tl.from([chAds.g.position, chAgent.g.position], { y: 2.5, duration: 0.8, ease: 'bounce.out' }, 1.5);
    tl.fromTo(bubble, { clipPath: 'inset(100% -20% -60% -20%)' }, { clipPath: 'inset(-20% -20% -60% -20%)', duration: 0.4, ease: 'power2.out', onComplete: () => { bubble.style.clipPath = 'none'; } }, 2.3);
    tl.add(wave(gsap, chAds.arm, 3), 2.5);
    tl.add(wave(gsap, chAgent.arm, 2), 2.9);
    return tl;
  }
  function hello(which) { const c = which === 'agen' ? chAgent : chAds; if (!gsap.isTweening(c.arm.rotation)) wave(gsap, c.arm, 2); }

  // ---------- Loop
  const t0 = performance.now();
  const tmp = new THREE.Vector3(), look = new THREE.Vector3();
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }).observe(hero);
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const time = (performance.now() - t0) / 1000;
    pointer.sx += (pointer.x - pointer.sx) * 0.05; pointer.sy += (pointer.y - pointer.sy) * 0.05;
    const s = scrollP, e = s * s * (3 - 2 * s);
    const fl = intro ? 0 : 1;
    camera.position.set(
      THREE.MathUtils.lerp(rig.px, poses.scroll.px, e) + pointer.sx * (lite ? 0.25 : 0.6) * fl + Math.sin(time * 0.5) * 0.12 * fl,
      THREE.MathUtils.lerp(rig.py, poses.scroll.py, e) - pointer.sy * 0.3 * fl + Math.sin(time * 0.7) * 0.08 * fl,
      THREE.MathUtils.lerp(rig.pz, poses.scroll.pz, e));
    look.set(THREE.MathUtils.lerp(rig.lx, poses.scroll.lx, e), THREE.MathUtils.lerp(rig.ly, poses.scroll.ly, e), 0);
    camera.lookAt(look);
    camera.fov = THREE.MathUtils.lerp(rig.fov, poses.scroll.fov, e);
    camera.setViewOffset(vw, vh, wide ? vw * THREE.MathUtils.lerp(rig.off, poses.scroll.off, e) : 0, 0, vw, vh);
    room.scale.setScalar(1 - e * 0.25);
    canvas.style.opacity = String(1 - e * 0.85);

    chAds.body.scale.y = 1 + Math.sin(time * 2.2) * 0.012;
    if (!intro) { // characters hop out of the room as the sheet scrolls away (they reappear in the studio stage)
      const out = THREE.MathUtils.clamp((e - 0.25) / 0.4, 0, 1), o2 = out * out;
      chAds.g.position.y = o2 * 7; chAgent.g.position.y = o2 * 7.5;
      blobAds.material.opacity = blobAgent.material.opacity = 1 - out;
    }
    floaters.forEach((m) => {
      const u = m.userData, k = (time * u.sp + u.ph) % 1;
      m.position.set(u.x + u.dx * k, 2.7 + k * 1.6, -0.4 + Math.sin(k * 6 + u.ph * 9) * 0.15);
      m.material.opacity = Math.sin(k * Math.PI) * (focus && ((focus === 'iklan') !== (u.x < 0)) ? 0.25 : 0.9);
      m.rotation.set(k * 4, k * 3, 0);
    });
    chAgent.orbit.rotation.z = Math.sin(time * 1.4) * 0.12;
    chAgent.orbit.children.forEach((o, i) => { o.position.z = 0.1 + Math.sin(time * 2 + i) * 0.12; });
    lampLight.intensity *= 1; // baked feel: keep steady
    monAds.screen.material.color.setScalar(Math.min(1, lit.iklan));
    monAgent.screen.material.color.setScalar(Math.min(1, lit.agen));
    if (!lite || ((time * 30) | 0) % 2 === 0) { drawAds(time); drawAgent(time); }
    if (clockStart !== null && (!lite || time - lastClockDraw > 1 / 20)) { lastClockDraw = time; drawClock(clockCanvas.getContext('2d'), 256, clockDark, clockStart); clockTex.needsUpdate = true; }

    // Speech bubble follows the active character's head
    const ch = active === 'agen' ? chAgent : chAds;
    ch.g.getWorldPosition(tmp); tmp.y += 1.95 * room.scale.y; tmp.project(camera);
    const r = canvas.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    const bw = bubble.offsetWidth / 2 + 8; bubble.style.left = `${Math.min(hr.width - bw, Math.max(bw, (tmp.x * 0.5 + 0.5) * r.width + r.left - hr.left))}px`;
    bubble.style.top = `${(-tmp.y * 0.5 + 0.5) * r.height + r.top - hr.top}px`;
    bubble.style.visibility = s > 0.35 ? 'hidden' : 'visible';

    renderer.render(scene, camera);
  }
  // Compile shaders off the critical path (parallel where the GPU supports it), then start the loop.
  const ready = (renderer.compileAsync && renderer.extensions.has('KHR_parallel_shader_compile') ? renderer.compileAsync(scene, camera) : Promise.resolve()).catch(() => {}).then(() => { frame(); });

  return {
    ready,
    info: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, dpr: renderer.getPixelRatio(), shadows: renderer.shadowMap.enabled }),
    playIntro, setFocus, setActive, setTheme, hello,
    // ---- touch drag (used by touch.js on coarse pointers): which character is under a screen point
    hitTest(cx, cy) {
      if (intro) return null;
      const r = canvas.getBoundingClientRect();
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(chars.map((c) => c.hit), false)[0];
      return hit ? chars.find((c) => c.hit === hit.object).key : null;
    },
    // slide a character sideways by a screen-pixel offset (mapped to world units across the canvas width)
    dragChar(key, dxPx) {
      const c = key === 'agen' ? chAgent : chAds, base = key === 'agen' ? 3.2 : -3.15;
      const w = canvas.getBoundingClientRect().width || 1;
      gsap.killTweensOf(c.g.position, 'x');
      c.g.position.x = base + (dxPx / w) * 9;
      c.g.rotation.z = THREE.MathUtils.clamp(-dxPx / w, -0.25, 0.25);
    },
    releaseChar(key) {
      const c = key === 'agen' ? chAgent : chAds, base = key === 'agen' ? 3.2 : -3.15;
      gsap.to(c.g.position, { x: base, duration: 0.9, ease: 'elastic.out(1, 0.45)' });
      gsap.to(c.g.rotation, { z: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
    },
    // back to the first-load look: wide shot, both monitors evenly lit, bubble on Versi Iklan
    reset() {
      if (intro) return;
      hovered = null;
      if (focus) setFocus(null);
      else { gsap.to(lit, { iklan: 0.9, agen: 0.9, duration: 0.5 }); gsap.to(chAds.g.rotation, { y: 0.28, duration: 0.6, ease: 'smooth' }); gsap.to(chAgent.g.position, { z: baseZ.agen, duration: 0.6, ease: 'power3.out' }); }
      if (active !== 'iklan') setActive('iklan');
    },
    setScroll(p) { scrollP = p; },
  };
}

export function webglOK() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch { return false; }
}
