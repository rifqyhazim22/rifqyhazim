import * as THREE from 'three';
import { gsap } from 'gsap';
import { ADS, AGENT } from './sprites.js';
import { buildVoxel, wave } from './voxel.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildStations } from './stations.js';

// One fixed full-screen 3D world behind the page: "Studio Versi" (scan stage), a long studio room with a corner for
// every content section (stations.js) and the contact vignette. The camera travels between them as you scroll:
// its pose is a pure function of a scrubbed scroll value, so scrolling up replays the exact path backwards.
//   lite (phones/tablets): section stations only, lower pixel ratio, no shadows.
export function createWorld({ canvas, worldEl, studioEl, contactEl, sections = {}, getScroll, lite = false, journeyCount, photoUrl }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, alpha: true, powerPreference: lite ? 'default' : 'high-performance' });
  // full device pixel ratio like a native render (capped at 2); phones 1.5. Steps down by itself if frames run slow.
  const maxDpr = Math.min(devicePixelRatio || 1, lite ? 1.5 : 2), minDpr = Math.min(maxDpr, lite ? 1 : 1.25);
  let dpr = maxDpr; renderer.setPixelRatio(dpr);
  renderer.shadowMap.enabled = !lite; renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.localClippingEnabled = true;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  const scene = new THREE.Scene();
  // soft studio reflections for the section stations (the scan stage and contact keep their own flat look)
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  // ================= STUDIO (at origin) =================
  const studio = new THREE.Group(); scene.add(studio);
  const sHemi = new THREE.HemisphereLight('#bfeee9', '#0b1f1e', 1.2); studio.add(sHemi);
  const sKey = new THREE.DirectionalLight('#ffffff', 1.4); sKey.position.set(3, 8, 6); studio.add(sKey);
  const grid = new THREE.GridHelper(40, 40, '#4CB8B0', '#4CB8B0');
  grid.material.transparent = true; grid.material.opacity = 0.16; grid.position.y = -0.3; studio.add(grid);
  scene.fog = null;

  const beamMat = (color) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uAmp: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 uColor; uniform float uTime; uniform float uAmp; varying vec2 vUv; void main(){ float a = pow(1.0 - vUv.y, 2.2) * 0.55 * uAmp; a *= 0.85 + 0.15 * sin(vUv.y * 40.0 - uTime * 3.0); gl_FragColor = vec4(uColor, a); }',
  });
  const clipSolid = [], clipHolo = [];
  function stageChar(sprite, x, accent) {
    const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);  // keep y <= scan
    const planeH = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);  // keep y >= scan
    clipSolid.push(plane); clipHolo.push(planeH);
    const mats = {};
    const mat = (c) => (mats[c] ||= new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, clippingPlanes: [plane] }));
    const edges = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.85, clippingPlanes: [planeH] });
    const ch = buildVoxel(sprite, { mat, edges, shadows: false });
    const ped = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.12, 0.3, 48), new THREE.MeshStandardMaterial({ color: '#16302E', roughness: 0.5, metalness: 0.2 }));
    base.position.y = -0.15;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.025, 8, 64), new THREE.MeshBasicMaterial({ color: accent }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.01;
    const ring2 = ring.clone(); ring2.scale.setScalar(0.72); ring2.material = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.5 });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.98, 3.2, 48, 1, true), beamMat(accent));
    beam.position.y = 1.6;
    const scanRing = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.02, 6, 64), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.9 }));
    scanRing.rotation.x = Math.PI / 2;
    ped.add(base, ring, ring2, beam, scanRing, ch.g);
    ped.position.x = x;
    studio.add(ped);
    return { ch, ped, plane, planeH, beam, scanRing, ring2 };
  }
  const sAds = stageChar(ADS, -1.9, '#4CB8B0');
  const sAgent = stageChar(AGENT, 1.9, '#C4B0E8');
  sAgent.ped.rotation.y = -0.18; sAds.ped.rotation.y = 0.18;

  // ================= CONTACT (at x = 104, past the end of the room) =================
  const CX = 104;
  const contact = new THREE.Group(); contact.position.x = CX; scene.add(contact);
  const cHemi = new THREE.HemisphereLight('#ffffff', '#F0EBE3', 1.6); contact.add(cHemi);
  const cSun = new THREE.DirectionalLight('#fff6ea', 1.5); cSun.position.set(-3, 8, 6); cSun.castShadow = true;
  cSun.shadow.mapSize.set(1024, 1024); Object.assign(cSun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -3 });
  cSun.shadow.radius = 8; cSun.shadow.blurSamples = 16; cSun.shadow.bias = -0.0004;
  contact.add(cSun); contact.add(cSun.target);
  const discMat = new THREE.MeshStandardMaterial({ color: '#F6F5F1', roughness: 0.9 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.3, 0.25, 64), discMat); disc.position.y = -0.125; disc.receiveShadow = true;
  contact.add(disc);
  const cm = {}; const cmat = (c) => (cm[c] ||= new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }));
  const cAds = buildVoxel(ADS, { mat: cmat }); cAds.g.position.set(-1.55, 0, 0.5); cAds.g.rotation.y = 0.35; contact.add(cAds.g);
  const cAgent = buildVoxel(AGENT, { mat: cmat }); cAgent.g.position.set(1.6, 0, 0.5); cAgent.g.rotation.y = -0.35; contact.add(cAgent.g);
  // Envelope with an opening flap
  const env = new THREE.Group();
  const envBody = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 0.12), cmat('#FFFFFF')); envBody.castShadow = true; envBody.position.y = 0.5;
  const flapShape = new THREE.Shape(); flapShape.moveTo(-0.75, 0); flapShape.lineTo(0.75, 0); flapShape.lineTo(0, -0.55); flapShape.closePath();
  const flap = new THREE.Mesh(new THREE.ShapeGeometry(flapShape), new THREE.MeshStandardMaterial({ color: '#E87862', side: THREE.DoubleSide }));
  const flapPivot = new THREE.Group(); flapPivot.position.set(0, 1.0, 0.065); flapPivot.add(flap); flap.castShadow = true;
  const seal = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), cmat('#0F6E6A')); seal.position.set(0, -0.5, 0.005); flap.add(seal);
  env.add(envBody, flapPivot); env.position.set(0, 0.25, 0.2); env.rotation.x = -0.08;
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 0.6), cmat('#F0D36A')); stand.position.set(0, 0.125, 0.2); stand.castShadow = true;
  contact.add(env, stand);
  // Paper plane (own geometry)
  const planeGeo = new THREE.BufferGeometry();
  planeGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.5, -0.32, 0, -0.3, 0, 0.02, -0.18, 0, 0, 0.5, 0, 0.02, -0.18, 0.32, 0, -0.3, 0, 0, 0.5, 0, 0.02, -0.18, 0, -0.14, -0.25], 3));
  planeGeo.computeVertexNormals();
  const paper = new THREE.Mesh(planeGeo, new THREE.MeshStandardMaterial({ color: '#FFFFFF', side: THREE.DoubleSide, roughness: 0.6 }));
  paper.castShadow = true; contact.add(paper);
  let paperLaunch = 0; // 0 orbit, 1 launched away

  // keep the scan stage and the contact vignette as they were (flat studio light, no room reflections)
  [studio, contact].forEach((g) => g.traverse((o) => { const ms = o.material ? [].concat(o.material) : []; ms.forEach((m) => { if ('envMapIntensity' in m) m.envMapIntensity = 0; }); }));

  // ================= section stations (shared room) =================
  const room = buildStations({ scene, lite, journeyCount, photoUrl });
  const rHemi = new THREE.HemisphereLight('#ffffff', '#cbbfae', 0.9); scene.add(rHemi);
  const rKey = new THREE.DirectionalLight('#fff4e4', 1.6); rKey.position.set(4, 10, 7); scene.add(rKey, rKey.target);
  if (!lite) {
    rKey.castShadow = true; rKey.shadow.mapSize.set(2048, 2048);
    Object.assign(rKey.shadow.camera, { left: -9, right: 9, top: 9, bottom: -5, near: 1, far: 40 });
    rKey.shadow.radius = 6; rKey.shadow.blurSamples = 12; rKey.shadow.bias = -0.0005;
  }

  // ================= camera stations =================
  const stations = {
    studio: { from: { p: [0, 7.5, 16], l: [0, 0.4, 0] }, to: { p: [0, 2.6, 9.6], l: [0, 1.1, 0] } },
    contact: { p: [CX + 1.0, 3.8, 15.5], l: [CX + 0.2, 0.55, 0] },
  };
  let studioP = 0, visible = false, cta = false;
  const held = new Set(); // reasons the world is covered (project detail, section wipe): skip rendering meanwhile
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', (e) => { pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  function setTheme(dark) {
    const c = new THREE.Color(dark ? '#24201C' : '#F6F5F1');
    gsap.to(discMat.color, { r: c.r, g: c.g, b: c.b, duration: 0.6 });
    gsap.to(cHemi, { intensity: dark ? 0.6 : 1.6, duration: 0.6 });
    gsap.to(cSun, { intensity: dark ? 0.9 : 1.5, duration: 0.6 });
    room.setTheme(dark);
    rHemi.color.set(dark ? '#d8cfc4' : '#ffffff'); rHemi.groundColor.set(dark ? '#2a241e' : '#cbbfae');
    roomLight = dark ? 0.55 : 1; scene.environmentIntensity = dark ? 0.3 : 0.55;
  }
  let roomLight = 1;

  // ---- outputs for the HTML overlay (counter, card anchors)
  const anchors = { ads: new THREE.Vector3(), agent: new THREE.Vector3() };
  const tmp = new THREE.Vector3();
  function project(v) { tmp.copy(v).project(camera); return { x: (tmp.x * 0.5 + 0.5) * innerWidth, y: (-tmp.y * 0.5 + 0.5) * innerHeight }; }

  // ---- scroll stops: where each station is "at rest" (document scroll px), refreshed on layout changes
  const docTop = (el) => el.getBoundingClientRect().top + scrollY - (Number(gsap.getProperty(el, 'y')) || 0);
  let stops = [];
  function refresh() {
    const vh = innerHeight, list = [];
    if (!lite && studioEl) list.push({ key: 'studio', top: docTop(studioEl), at: docTop(studioEl) + studioEl.offsetHeight - vh });
    Object.entries(sections).forEach(([key, el]) => { if (el && room.stations[key]) { const top = docTop(el); list.push({ key, top, at: top - vh * 0.1, win: parseFloat(getComputedStyle(el).paddingTop) || vh * 0.5 }); } });
    if (!lite && contactEl) { const top = docTop(contactEl); list.push({ key: 'contact', top, at: top + (contactEl.offsetHeight - vh) / 2 }); }
    stops = list.sort((a, b) => a.at - b.at);
  }
  refresh(); addEventListener('resize', () => requestAnimationFrame(refresh));

  const sm = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b);
  const pa = { P: new THREE.Vector3(), L: new THREE.Vector3(), ox: 0, oy: 0 }, pb = { P: new THREE.Vector3(), L: new THREE.Vector3(), ox: 0, oy: 0 };
  let waved = false, wavedC = false, time = 0;
  // pose of one stop at scroll s
  function poseOf(stop, s, o) {
    const vh = innerHeight, k = (s - stop.at) / vh;
    o.ox = 0; o.oy = 0;
    if (stop.key === 'studio') {
      const st = stations.studio, kk = sm(0, 0.35, studioP);
      o.P.set(...st.from.p).lerp(tmp.set(...st.to.p), kk);
      o.L.set(...st.from.l).lerp(tmp.set(...st.to.l), kk);
      const ang = (studioP - 0.5) * 0.5;
      o.P.set(o.P.x * Math.cos(ang) + o.P.z * Math.sin(ang), o.P.y, -o.P.x * Math.sin(ang) + o.P.z * Math.cos(ang));
    } else if (stop.key === 'contact') {
      const st = stations.contact, cin = sm(-1, -0.1, k);
      o.P.set(...st.p); o.L.set(...st.l);
      o.P.y += (1 - cin) * 3; o.P.z += (1 - cin) * 4;
      o.ox = -0.3 * innerWidth;
    } else {
      const st = room.stations[stop.key]; st.pose(k, o);
      // portrait screens: pull back along the view line so each corner still fits the width
      const f = Math.pow(THREE.MathUtils.clamp(1.3 / camera.aspect, 1, 2.6), 0.78);
      if (f > 1.001) o.P.sub(o.L).multiplyScalar(f).add(o.L);
      if (st.fixed) return k;
      // the scene rides with the section's open window at the top (it scrolls in and out with it, a little slower)
      const apc = (stop.top - s) + Math.min(stop.win, vh) * 0.5;
      o.oy = THREE.MathUtils.clamp(vh * 0.5 - apc, -vh * 0.9, vh * 0.9);
    }
    return k;
  }
  function updateStop(stop, s) {
    const k = (s - stop.at) / innerHeight;
    if (stop.key === 'studio') {
      const drop = sm(0.0, 0.2, studioP);
      [sAds, sAgent].forEach((st, i) => {
        const d = THREE.MathUtils.clamp(drop * 1.15 - i * 0.15, 0, 1);
        const bounce = d < 1 ? (1 - d) * (1 - d) * 7 : 0;
        st.ch.g.position.y = bounce + Math.abs(Math.sin(d * Math.PI * 2)) * (1 - d) * 0.4;
        const scan = sm(0.15, 0.8, studioP) * 1.75 - 0.02;
        st.plane.constant = scan; st.planeH.constant = -scan;
        st.scanRing.position.y = scan; st.scanRing.material.opacity = scan > 0.02 && scan < 1.7 ? 0.9 : 0;
        st.beam.material.uniforms.uTime.value = time;
        st.beam.material.uniforms.uAmp.value = 0.6 + 0.4 * Math.sin(time * 1.3 + i);
        st.ring2.rotation.z = time * (i ? -0.4 : 0.4);
        st.ch.orbit.rotation.z = Math.sin(time * 1.4) * 0.12;
        st.ch.body.position.y = st.ch.holo.position.y = Math.sin(time * 1.6 + i) * 0.03;
      });
      if (studioP > 0.85 && !waved) { waved = true; wave(gsap, sAds.ch.arm, 2); gsap.delayedCall(0.4, () => wave(gsap, sAgent.ch.arm, 2)); }
      if (studioP < 0.6) waved = false;
      sAds.ch.g.getWorldPosition(anchors.ads); anchors.ads.y += 1.0;
      sAgent.ch.g.getWorldPosition(anchors.agent); anchors.agent.y += 1.0;
    } else if (stop.key === 'contact') {
      if (k > -0.3 && !wavedC) { wavedC = true; wave(gsap, cAds.arm, 3); gsap.delayedCall(0.5, () => wave(gsap, cAgent.arm, 2)); }
      if (k < -0.8) wavedC = false;
      flapPivot.rotation.x = THREE.MathUtils.lerp(flapPivot.rotation.x, cta ? -Math.PI * 0.95 : 0, 0.12);
      if (cta) paperLaunch = Math.min(1, paperLaunch + 0.02); else paperLaunch = Math.max(0, paperLaunch - 0.03);
      const a = time * 0.8;
      const orbitPos = new THREE.Vector3(Math.cos(a) * 3.1, 2.3 + Math.sin(a * 2) * 0.25, Math.sin(a) * 1.8);
      const launch = new THREE.Vector3(0.0, 1.2 + paperLaunch * 5, 0.2 + paperLaunch * 6);
      paper.position.lerpVectors(orbitPos, launch, paperLaunch * paperLaunch);
      const ahead = new THREE.Vector3(Math.cos(a + 0.2) * 3.1, 2.3 + Math.sin((a + 0.2) * 2) * 0.25, Math.sin(a + 0.2) * 1.8);
      paper.lookAt(paperLaunch > 0.05 ? new THREE.Vector3(CX, 10, 10) : ahead.add(contact.position));
      cAds.body.position.y = Math.sin(time * 2) * 0.03; cAgent.body.position.y = Math.sin(time * 2 + 1) * 0.03;
      cAgent.orbit.rotation.z = Math.sin(time * 1.4) * 0.12;
    } else room.stations[stop.key].update(k, time);
  }

  const t0 = performance.now();
  const P = new THREE.Vector3(), L = new THREE.Vector3();
  let last = performance.now(), slow = 0, frames = 0;
  const groupOf = (key) => (key === 'studio' ? 'studio' : key === 'contact' ? 'contact' : 'room');
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || !stops.length || held.size) return;
    const now = performance.now(), dt = now - last; last = now;
    time = (now - t0) / 1000;
    // adaptive quality: if frames keep running slow, step the pixel ratio down (never back up mid-visit)
    if (dt < 200) { frames++; if (dt > 26) slow++; if (frames >= 90) { if (slow > 45 && dpr > minDpr) { dpr = Math.max(minDpr, dpr - 0.25); renderer.setPixelRatio(dpr); resize(); } frames = 0; slow = 0; } }
    pointer.sx += (pointer.x - pointer.sx) * 0.05; pointer.sy += (pointer.y - pointer.sy) * 0.05;
    const s = getScroll ? getScroll() : scrollY, vh = innerHeight;
    // which two stops are we between?
    let ia = 0;
    while (ia < stops.length - 1 && s > stops[ia + 1].at) ia++;
    const A = stops[ia], B = s > A.at && stops[ia + 1] ? stops[ia + 1] : null;
    let t = 0;
    if (B) { const a0 = A.at + vh * 0.25, b0 = B.at - vh * 0.35; t = b0 > a0 ? sm(a0, b0, s) : sm(A.at, B.at, s); }
    poseOf(A, s, pa); updateStop(A, s);
    if (B) { poseOf(B, s, pb); updateStop(B, s); }
    // neighbours keep their own scroll state too, so nothing pops when they come into view
    const prev = stops[ia - 1], next = B ? stops[ia + 2] : stops[ia + 1];
    if (prev) updateStop(prev, s); if (next) updateStop(next, s);
    if (B && t > 0) {
      P.lerpVectors(pa.P, pb.P, t); L.lerpVectors(pa.L, pb.L, t);
      // travelling between two corners: rise a little and pull back, like a crane move along the room
      const lift = Math.sin(t * Math.PI);
      P.y += lift * 1.4; P.z += lift * 2.2;
    } else { P.copy(pa.P); L.copy(pa.L); }
    const ox = B ? THREE.MathUtils.lerp(pa.ox, pb.ox, t) : pa.ox, oy = B ? THREE.MathUtils.lerp(pa.oy, pb.oy, t) : pa.oy;
    // groups and lights: only what the camera is looking at (or travelling between)
    const w = { studio: 0, room: 0, contact: 0 };
    w[groupOf(A.key)] += B ? 1 - t : 1; if (B) w[groupOf(B.key)] += t;
    studio.visible = w.studio > 0.001; contact.visible = w.contact > 0.001; room.root.visible = w.room > 0.001;
    rHemi.intensity = 0.9 * roomLight * w.room; rKey.intensity = 1.6 * roomLight * w.room;
    rKey.position.set(L.x + 4, 10, 7); rKey.target.position.set(L.x, 0, -1);
    if (worldEl) { const z = w.studio > 0.5 ? 'studio' : w.contact > 0.5 ? 'contact' : 'room'; if (worldEl.dataset.zone3d !== z) worldEl.dataset.zone3d = z; }
    P.x += pointer.sx * 0.5; P.y -= pointer.sy * 0.25;
    camera.position.copy(P); camera.lookAt(L);
    camera.setViewOffset(innerWidth, innerHeight, ox, oy, innerWidth, innerHeight);
    renderer.render(scene, camera);
  }
  const ready = (renderer.compileAsync && renderer.extensions.has('KHR_parallel_shader_compile') ? renderer.compileAsync(scene, camera) : Promise.resolve()).catch(() => {}).then(() => { frame(); });

  // visibility: render only while a part of the page that shows the world is on screen
  const vis = new Map();
  const io = new IntersectionObserver((es) => { es.forEach((e) => vis.set(e.target, e.isIntersecting)); visible = [...vis.values()].some(Boolean); }, { threshold: 0 });
  [studioEl, contactEl, ...Object.values(sections)].filter(Boolean).forEach((el) => io.observe(el));

  return {
    ready,
    refresh,
    setStation() {}, // (kept for callers; the camera now follows the scroll position on its own)
    setStudio(p) { studioP = p; },
    setCTA(v) { cta = v; },
    hold(reason, on) { if (on) held.add(reason); else { held.delete(reason); last = performance.now(); } },
    anchors: () => ({ ads: project(anchors.ads), agent: project(anchors.agent) }),
    setTheme,
    cam: () => [camera.position.x, camera.position.y, camera.position.z],
    info: () => ({ dpr: renderer.getPixelRatio(), calls: renderer.info.render.calls, tris: renderer.info.render.triangles, stops: stops.map((x) => x.key), zone: worldEl?.dataset.zone3d }),
  };
}
