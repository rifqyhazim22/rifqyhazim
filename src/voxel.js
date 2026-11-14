import * as THREE from 'three';

// Extrude a 16x20 pixel sprite into voxels. The right arm gets its own pivot so the character can wave.
// opts.mat(color) -> material, opts.edges -> LineBasicMaterial for a hologram outline (optional)
export function buildVoxel(list, { mat, edges = null, s = 0.08, depth = 0.34, shadows = true } = {}) {
  const g = new THREE.Group(), body = new THREE.Group(), orbit = new THREE.Group(), arm = new THREE.Group();
  const holo = new THREE.Group();
  const X = (x) => (x - 8) * s, Y = (y) => (20 - y) * s;
  const shoulder = new THREE.Vector3(X(12.4), Y(10.6), 0);
  arm.position.copy(shoulder);
  const geoCache = new Map();
  const box = (w, h, d) => { const k = `${w}|${h}|${d}`; if (!geoCache.has(k)) geoCache.set(k, new THREE.BoxGeometry(w, h, d)); return geoCache.get(k); };
  const add = (geo, color, pos, parent) => {
    const m = new THREE.Mesh(geo, mat(color));
    m.castShadow = shadows; m.receiveShadow = shadows;
    m.position.copy(pos);
    if (parent === arm) m.position.sub(shoulder);
    parent.add(m);
    if (edges) {
      const l = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edges);
      l.position.copy(m.position); (parent === arm ? arm : holo).add(l);
    }
    return m;
  };
  list.forEach((p, idx) => {
    if (p[0] === 'r') {
      const [, x, y, w, h, c] = p;
      const isArm = x >= 12 && y >= 10 && y <= 12 && w <= 2;
      add(box(w * s, h * s, depth + idx * 0.012), c, new THREE.Vector3(X(x + w / 2), Y(y + h / 2), 0), isArm ? arm : body);
    } else if (p[0] === 'o') {
      const [, x, y, w, h, c] = p, th = 0.35 * s, z = depth / 2 + 0.16;
      [[x + w / 2, y, w * s, th], [x + w / 2, y + h, w * s, th], [x, y + h / 2, th, h * s], [x + w, y + h / 2, th, h * s]].forEach(([cx, cy, bw, bh]) => {
        add(box(bw, bh, 0.03), c, new THREE.Vector3(X(cx), Y(cy), z), body);
      });
    } else {
      const [, cx, cy, r, c] = p;
      const m = new THREE.Mesh(new THREE.SphereGeometry(r * s, 20, 14), mat(c));
      m.castShadow = shadows; m.position.set(X(cx), Y(cy), 0.1); orbit.add(m);
    }
  });
  body.add(arm);
  g.add(body, orbit, holo);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 0.8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }));
  hit.position.y = 0.85; g.add(hit);
  return { g, body, orbit, arm, holo, hit, height: 20 * s };
}

// Wave: raise the arm outwards and wiggle it, then lower. Returns a GSAP timeline when gsap is passed.
export function wave(gsap, arm, times = 3) {
  const tl = gsap.timeline();
  tl.to(arm.rotation, { z: 2.5, duration: 0.35, ease: 'power2.out' });
  for (let i = 0; i < times; i++) tl.to(arm.rotation, { z: 2.05, duration: 0.16, ease: 'sine.inOut', yoyo: true, repeat: 1 });
  tl.to(arm.rotation, { z: 0, duration: 0.45, ease: 'power2.inOut' });
  return tl;
}
