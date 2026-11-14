import * as THREE from 'three';
import { gsap } from 'gsap';
import { ADS, AGENT } from './sprites.js';
import { buildVoxel, wave } from './voxel.js';

// Fixed full-screen world behind the page sheets: "Studio Versi" (scan stage) and the contact vignette.
export function createWorld({ canvas, studioEl, contactEl }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.localClippingEnabled = true;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  const scene = new THREE.Scene();

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

  // ================= CONTACT (at x = 80) =================
  const contact = new THREE.Group(); contact.position.x = 80; scene.add(contact);
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

  // ================= camera stations =================
  const stations = {
    studio: { from: { p: [0, 7.5, 16], l: [0, 0.4, 0] }, to: { p: [0, 2.6, 9.6], l: [0, 1.1, 0] } },
    contact: { p: [80 + 1.0, 3.8, 15.5], l: [80 + 0.2, 0.55, 0] },
  };
  let station = 'studio', studioP = 0, contactIn = 0, visible = false, cta = false;
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
  }

  // ---- outputs for the HTML overlay (counter, card anchors)
  const anchors = { ads: new THREE.Vector3(), agent: new THREE.Vector3() };
  const tmp = new THREE.Vector3();
  function project(v) { tmp.copy(v).project(camera); return { x: (tmp.x * 0.5 + 0.5) * innerWidth, y: (-tmp.y * 0.5 + 0.5) * innerHeight }; }

  let waved = false;
  const t0 = performance.now();
  const P = new THREE.Vector3(), L = new THREE.Vector3();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const time = (performance.now() - t0) / 1000;
    pointer.sx += (pointer.x - pointer.sx) * 0.05; pointer.sy += (pointer.y - pointer.sy) * 0.05;
    const sm = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b);
    if (station === 'studio') {
      const st = stations.studio, k = sm(0, 0.35, studioP);
      P.set(...st.from.p).lerp(new THREE.Vector3(...st.to.p), k);
      L.set(...st.from.l).lerp(new THREE.Vector3(...st.to.l), k);
      // slow orbit as you scroll through the stage
      const ang = (studioP - 0.5) * 0.5;
      P.set(P.x * Math.cos(ang) + P.z * Math.sin(ang), P.y, -P.x * Math.sin(ang) + P.z * Math.cos(ang));
      // drop in (0-0.2), scan (0.15-0.8)
      const drop = sm(0.0, 0.2, studioP);
      [sAds, sAgent].forEach((s, i) => {
        const d = THREE.MathUtils.clamp(drop * 1.15 - i * 0.15, 0, 1);
        const bounce = d < 1 ? (1 - d) * (1 - d) * 7 : 0;
        s.ch.g.position.y = bounce + Math.abs(Math.sin(d * Math.PI * 2)) * (1 - d) * 0.4;
        const scan = sm(0.15, 0.8, studioP) * 1.75 - 0.02;
        s.plane.constant = scan; s.planeH.constant = -scan;
        s.scanRing.position.y = scan; s.scanRing.material.opacity = scan > 0.02 && scan < 1.7 ? 0.9 : 0;
        s.beam.material.uniforms.uTime.value = time;
        s.beam.material.uniforms.uAmp.value = 0.6 + 0.4 * Math.sin(time * 1.3 + i);
        s.ring2.rotation.z = time * (i ? -0.4 : 0.4);
        s.ch.orbit.rotation.z = Math.sin(time * 1.4) * 0.12;
        s.ch.body.position.y = s.ch.holo.position.y = Math.sin(time * 1.6 + i) * 0.03;
      });
      if (studioP > 0.85 && !waved) { waved = true; wave(gsap, sAds.ch.arm, 2); gsap.delayedCall(0.4, () => wave(gsap, sAgent.ch.arm, 2)); }
      if (studioP < 0.6) waved = false;
      sAds.ch.g.getWorldPosition(anchors.ads); anchors.ads.y += 1.0;
      sAgent.ch.g.getWorldPosition(anchors.agent); anchors.agent.y += 1.0;
    } else {
      const st = stations.contact;
      P.set(...st.p); L.set(...st.l);
      P.y += (1 - contactIn) * 3; P.z += (1 - contactIn) * 4;
      flapPivot.rotation.x = THREE.MathUtils.lerp(flapPivot.rotation.x, cta ? -Math.PI * 0.95 : 0, 0.12);
      if (cta) paperLaunch = Math.min(1, paperLaunch + 0.02); else paperLaunch = Math.max(0, paperLaunch - 0.03);
      const a = time * 0.8;
      const orbitPos = new THREE.Vector3(Math.cos(a) * 3.1, 2.3 + Math.sin(a * 2) * 0.25, Math.sin(a) * 1.8);
      const launch = new THREE.Vector3(0.0, 1.2 + paperLaunch * 5, 0.2 + paperLaunch * 6);
      paper.position.lerpVectors(orbitPos, launch, paperLaunch * paperLaunch);
      const ahead = new THREE.Vector3(Math.cos(a + 0.2) * 3.1, 2.3 + Math.sin((a + 0.2) * 2) * 0.25, Math.sin(a + 0.2) * 1.8);
      paper.lookAt(paperLaunch > 0.05 ? new THREE.Vector3(80, 10, 10) : ahead.add(contact.position));
      cAds.body.position.y = Math.sin(time * 2) * 0.03; cAgent.body.position.y = Math.sin(time * 2 + 1) * 0.03;
      cAgent.orbit.rotation.z = Math.sin(time * 1.4) * 0.12;
    }
    P.x += pointer.sx * 0.5; P.y -= pointer.sy * 0.25;
    camera.position.copy(P); camera.lookAt(L);
    const off = station === 'contact' ? -0.3 : 0;
    camera.setViewOffset(innerWidth, innerHeight, innerWidth * off, 0, innerWidth, innerHeight);
    renderer.render(scene, camera);
  }
  const ready = (renderer.compileAsync && renderer.extensions.has('KHR_parallel_shader_compile') ? renderer.compileAsync(scene, camera) : Promise.resolve()).catch(() => {}).then(() => { frame(); });

  // visibility: render only while a stage is on screen
  const vis = new Map();
  const io = new IntersectionObserver((es) => { es.forEach((e) => vis.set(e.target, e.isIntersecting)); visible = [...vis.values()].some(Boolean); }, { threshold: 0 });
  io.observe(studioEl); io.observe(contactEl);

  return {
    ready,
    setStation(s) {
      if (s === station) return;
      station = s; studio.visible = s === 'studio'; contact.visible = s === 'contact';
      if (s === 'contact') { contactIn = 0; gsap.to({ v: 0 }, { v: 1, duration: 1.4, ease: 'smooth', onUpdate() { contactIn = this.targets()[0].v; } }); gsap.delayedCall(0.9, () => { wave(gsap, cAds.arm, 3); gsap.delayedCall(0.5, () => wave(gsap, cAgent.arm, 2)); }); }
    },
    setStudio(p) { studioP = p; },
    setCTA(v) { cta = v; },
    anchors: () => ({ ads: project(anchors.ads), agent: project(anchors.agent) }),
    setTheme,
  };
}
