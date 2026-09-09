import * as THREE from '/vendor/three.module.js';

// A miniature, explorable studio. All geometry is made here, all textures are local.
export async function createWorld(container) {
  if (!container) throw new Error('The world needs a canvas container.');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (_) { throw new Error('WebGL is unavailable.'); }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.setClearColor(0x071719, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.className = 'world-canvas';
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x071719, 0.0082);
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 190);
  const materials = new Set(), geometries = new Set(), textures = new Set();
  const art = new THREE.Group(); scene.add(art);
  const mobileQuery = matchMedia('(max-width: 760px)');
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 1, height = 1, disposed = false, raf = 0, elapsed = 0, previousTime = 0;
  let qualityCap = 1.25, qualitySample = 0, qualityFrames = 0, averageFrameMs = 0;
  let paused = motionQuery.matches;
  let progress = 0, requestedProgress = 0, exploded = 0, requestedExploded = 0;
  let pointerX = 0, pointerY = 0, currentPointerX = 0, currentPointerY = 0;
  const movers = [], revolvers = [], floats = [], fragments = [];
  const seed = (() => { let x = 918274; return () => { x = (1664525 * x + 1013904223) >>> 0; return x / 4294967296; }; })();
  const geo = g => { geometries.add(g); return g; };
  const material = (color, options = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: .57, metalness: .1, ...options });
    materials.add(m); return m;
  };
  const basic = (color, options = {}) => {
    const m = new THREE.MeshBasicMaterial({ color, ...options }); materials.add(m); return m;
  };
  const ivory = material(0xe5e1c8), paper = material(0xf7efdc), clay = material(0xf36a46), coral = material(0xf24628);
  const teal = material(0x174943), dark = material(0x122d2c), copper = material(0xa95d36, { metalness: .6, roughness: .34 });
  const mint = material(0x92dcc3, { metalness: .32, roughness: .22 }), stone = material(0x53675e), sand = material(0xa19675);
  const amber = material(0xffae42, { emissive: 0xff9a22, emissiveIntensity: 2.8, roughness: .35 });
  const cyan = material(0x9fffee, { emissive: 0x4be4d1, emissiveIntensity: 2, roughness: .23 });
  const orangeLine = basic(0xffbd70), mintLine = basic(0x89ead3), ink = basic(0x071c1b);
  const glass = material(0x73d8cd, { transparent: true, opacity: .36, metalness: .55, roughness: .1, depthWrite: false });
  const cube = geo(new THREE.BoxGeometry(1, 1, 1));
  const cylinder = geo(new THREE.CylinderGeometry(1, 1, 1, 32));
  const sphere = geo(new THREE.IcosahedronGeometry(1, 1));
  const plane = geo(new THREE.PlaneGeometry(1, 1));
  const torusCache = new Map();
  function box(parent, mat, x, y, z, sx, sy, sz, ry = 0) {
    const mesh = new THREE.Mesh(cube, mat); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); mesh.rotation.y = ry;
    mesh.castShadow = !mat.transparent && !mat.isMeshBasicMaterial && mat.emissive.getHex() === 0;
    mesh.receiveShadow = !mat.transparent;
    parent.add(mesh); return mesh;
  }
  function disc(parent, mat, x, y, z, r, h = .1, ry = 0) {
    const mesh = new THREE.Mesh(cylinder, mat); mesh.position.set(x, y, z); mesh.scale.set(r, h, r); mesh.rotation.y = ry;
    parent.add(mesh); return mesh;
  }
  function orb(parent, mat, x, y, z, size = .15) {
    const mesh = new THREE.Mesh(sphere, mat); mesh.position.set(x, y, z); mesh.scale.setScalar(size); parent.add(mesh); return mesh;
  }
  function ring(parent, mat, x, y, z, radius, tube = .045, rx = Math.PI / 2, rz = 0) {
    const key = `${radius}-${tube}`;
    if (!torusCache.has(key)) torusCache.set(key, geo(new THREE.TorusGeometry(radius, tube, 7, 90)));
    const mesh = new THREE.Mesh(torusCache.get(key), mat); mesh.position.set(x, y, z); mesh.rotation.set(rx, 0, rz); parent.add(mesh); return mesh;
  }
  function batch(parent, mat, data, geometry = cube) {
    const mesh = new THREE.InstancedMesh(geometry, mat, data.length);
    mesh.castShadow = !mat.transparent && !mat.isMeshBasicMaterial && mat.emissive.getHex() === 0;
    mesh.receiveShadow = !mat.transparent;
    const dummy = new THREE.Object3D();
    data.forEach((v, index) => {
      dummy.position.set(v[0], v[1], v[2]); dummy.scale.set(v[3], v[4], v[5]);
      dummy.rotation.set(v[6] || 0, v[7] || 0, v[8] || 0); dummy.updateMatrix(); mesh.setMatrixAt(index, dummy.matrix);
    }); mesh.instanceMatrix.needsUpdate = true; parent.add(mesh); return mesh;
  }
  function line(parent, points, color, opacity = 1) {
    const geometry = geo(new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p))));
    const mat = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }); materials.add(mat);
    const mesh = new THREE.Line(geometry, mat); parent.add(mesh); return mesh;
  }
  function shadow(parent, x, y, z, sx, sz, opacity = .45) {
    const mat = basic(0x031510, { transparent: true, opacity, depthWrite: false });
    const mesh = new THREE.Mesh(plane, mat); mesh.rotation.x = -Math.PI / 2; mesh.scale.set(sx, sz, 1); mesh.position.set(x, y, z); parent.add(mesh);
  }
  const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 96;
  const ctx = glowCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(48, 48, 0, 48, 48, 48);
  gradient.addColorStop(0, 'rgba(255,255,255,.85)'); gradient.addColorStop(.15, 'rgba(255,255,255,.32)'); gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 96, 96);
  const glowTexture = new THREE.CanvasTexture(glowCanvas); textures.add(glowTexture);
  function glow(parent, color, x, y, z, size = 1.5, opacity = .5) {
    const mat = new THREE.SpriteMaterial({ map: glowTexture, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
    materials.add(mat); const sprite = new THREE.Sprite(mat); sprite.position.set(x, y, z); sprite.scale.setScalar(size); parent.add(sprite); return sprite;
  }
  scene.add(new THREE.HemisphereLight(0xc9f7e7, 0x172723, 2.3));
  const key = new THREE.DirectionalLight(0xffe0b7, 4.4); key.position.set(-18, 30, 20); scene.add(key);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -33, right: 33, top: 31, bottom: -29, near: 1, far: 100 });
  key.shadow.bias = -.0003; key.shadow.normalBias = .06; key.shadow.camera.updateProjectionMatrix();
  const rim = new THREE.DirectionalLight(0x61cbd1, 3.8); rim.position.set(12, 9, -24); scene.add(rim);
  const side = new THREE.DirectionalLight(0xff7942, .9); side.position.set(-20, 5, -7); scene.add(side);

  // The land is a fabricated object: sliced geology, machining marks, and hanging service conduits.
  function island(x, y, z, sx, sz, number, rotation = 0) {
    const group = new THREE.Group(); group.position.set(x, y, z); group.rotation.y = rotation; art.add(group);
    box(group, stone, 0, -.28, 0, sx, .5, sz);
    box(group, ivory, 0, .06, 0, sx + .15, .18, sz + .15);
    box(group, dark, 0, -.62, 0, sx * .98, .16, sz * .98);
    box(group, sand, .12, -.84, -.12, sx * .87, .27, sz * .91);
    box(group, copper, .18, -1.07, .07, sx * .84, .07, sz * .86);
    box(group, stone, -.1, -1.34, .08, sx * .75, .43, sz * .76);
    const debris = [], fins = [];
    for (let i = 0; i < 16; i++) {
      const xx = (seed() - .5) * sx * .68, zz = (seed() - .5) * sz * .7, h = .6 + seed() * 2.2;
      debris.push([xx, -1.4 - h * .5, zz, .5 + seed() * 1.1, h, .5 + seed()]);
    }
    batch(group, dark, debris);
    for (let i = 0; i < Math.floor(sx * 2); i++) fins.push([-sx / 2 + .25 + i * .5, -.24, sz / 2 + .015, .08, .45, .06]);
    batch(group, copper, fins);
    // Runway pin lights and the central inlaid datum line.
    const lamps = [];
    for (let i = 0; i < 8; i++) lamps.push([-sx / 2 + .45 + i * ((sx - .9) / 7), .185, sz / 2 - .2, .12, .04, .12]);
    batch(group, amber, lamps);
    box(group, teal, 0, .165, 0, sx - .8, .025, .055);
    const badge = document.createElement('canvas'); badge.width = 256; badge.height = 128;
    const bc = badge.getContext('2d'); bc.fillStyle = '#e5e1c8'; bc.fillRect(0, 0, 256, 128); bc.fillStyle = '#183d36';
    bc.font = 'bold 88px monospace'; bc.fillText(String(number).padStart(2, '0'), 18, 96);
    bc.fillRect(182, 24, 45, 6); bc.fillRect(182, 42, 30, 6);
    const texture = new THREE.CanvasTexture(badge); texture.colorSpace = THREE.SRGBColorSpace; textures.add(texture);
    const plaque = new THREE.Mesh(plane, basic(0xffffff, { map: texture })); plaque.scale.set(1.25, .62, 1); plaque.position.set(-sx / 2 + 1, -.16, sz / 2 + .045); group.add(plaque);
    glow(group, 0x45b799, 0, -2.2, 0, Math.max(sx, sz) * 1.3, .16);
    return group;
  }
  const origin = island(0, 0, 0, 11.5, 10.5, 1, -.08);
  const design = island(-14, 1.3, -8, 11, 8, 2, .11);
  const systems = island(12, 1, -10, 10, 8.8, 3, -.15);
  const worlds = island(13, -1.9, 10.5, 11.5, 10.5, 4, .07);
  const launch = island(-12.8, 2.2, 11.7, 9.5, 8.4, 5, -.24);

  // ORIGIN: a coral triumphal arch over a luminous stair, wrapped in an impossible cantilever.
  function arch(parent, mat, x, y, z, outerRadius, innerRadius, leg, depth) {
    const s = new THREE.Shape(); s.moveTo(-outerRadius, 0); s.lineTo(-outerRadius, leg);
    s.absarc(0, leg, outerRadius, Math.PI, 0, true); s.lineTo(outerRadius, 0); s.lineTo(innerRadius, 0); s.lineTo(innerRadius, leg);
    s.absarc(0, leg, innerRadius, 0, Math.PI, false); s.lineTo(-innerRadius, 0); s.closePath();
    const geometry = geo(new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: .055, bevelSize: .055, bevelSegments: 2, steps: 1, curveSegments: 32 }));
    const mesh = new THREE.Mesh(geometry, mat); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  shadow(origin, 0, .17, -.2, 7.5, 5.5, .22);
  box(origin, teal, 0, .46, -.75, 7.4, .58, 4.7);
  const originArch = arch(origin, coral, 0, .72, -.85, 3.2, 2.28, 4.4, 1.4);
  const originArchTrim = arch(origin, copper, 0, .72, -.98, 3.34, 3.2, 4.4, .13);
  fragments.push({ group: originArch, base: originArch.position.clone(), direction: new THREE.Vector3(0, 2.8, 0) });
  fragments.push({ group: originArchTrim, base: originArchTrim.position.clone(), direction: new THREE.Vector3(0, 3.8, -.6) });
  // Doorway light, seemingly too bright to belong to a little model.
  const originArchLight = arch(origin, amber, 0, .72, -.93, 2.27, 2.22, 4.4, .075);
  fragments.push({ group: originArchLight, base: originArchLight.position.clone(), direction: new THREE.Vector3(0, 2.1, .6) });
  for (let i = 0; i < 11; i++) {
    box(origin, paper, 0, .23 + i * .13, 3.8 - i * .39, 3.5, .19 + i * .02, .48);
    box(origin, amber, 0, .332 + i * .14, 3.96 - i * .39, 3.24, .025, .027);
  }
  box(origin, ivory, -3.94, 2.64, -1.5, 1.3, 4.9, 2);
  box(origin, ivory, -.65, 5.36, -1.5, 7.9, .9, 2);
  box(origin, mint, 3.76, 6.58, -1.5, 1.05, 3.2, 2);
  box(origin, paper, 2.2, 8.58, -1.5, 4.3, .67, 2);
  box(origin, teal, -.2, 9.5, -1.5, 1, 2.6, 2);
  box(origin, copper, .76, 11, -1.5, 2.9, .37, 2.3);
  for (let i = 0; i < 5; i++) box(origin, dark, -3.95, .72 + i * .91, -.465, .85, .22, .07);
  ring(origin, copper, .55, 5.3, -.1, 4.5, .035, .96, .3);
  const orbit = new THREE.Group(); orbit.position.set(.55, 5.3, -.1); orbit.rotation.set(.96, 0, .3); origin.add(orbit);
  ring(orbit, mintLine, 0, 0, 0, 4.52, .017, 0);
  orb(orbit, amber, 4.52, 0, 0, .16); glow(orbit, 0xffb763, 4.52, 0, 0, 1.5, .4); revolvers.push({ group: orbit, axis: 'z', speed: .12 });
  const hovering = new THREE.Group(); hovering.position.set(-1.3, 10.3, .2); origin.add(hovering);
  box(hovering, clay, 0, 0, 0, 1.1, 1.1, 1.1, .22); box(hovering, amber, 0, -.6, 0, .82, .03, .82);
  floats.push({ group: hovering, y: 10.3, phase: .5, amount: .16 }); fragments.push({ group: hovering, base: hovering.position.clone(), direction: new THREE.Vector3(-1.2, 2.3, .6) });
  for (const x of [-4.7, 4.7]) {
    box(origin, copper, x, .94, 3.65, .055, 1.5, .055); orb(origin, amber, x, 1.75, 3.65, .12); glow(origin, 0xffad6b, x, 1.75, 3.65, 1.1, .3);
  }

  // DESIGN: real project screens suspended in the architecture, with an offset press and colour library.
  const loader = new THREE.TextureLoader();
  function billboard(parent, url, x, y, z, w, h, ry) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
    box(g, dark, 0, 0, 0, w + .25, h + .47, .23);
    box(g, copper, 0, 0, -.15, w + .42, h + .63, .11);
    box(g, paper, 0, h * .5 + .1, .135, w, .2, .02);
    for (let i = 0; i < 3; i++) orb(g, i === 0 ? coral : (i === 1 ? amber : teal), -w * .5 + .16 + i * .17, h * .5 + .1, .17, .039);
    const screenMaterial = basic(0x6aa89d);
    const screen = new THREE.Mesh(plane, screenMaterial); screen.position.z = .132; screen.scale.set(w, h, 1); g.add(screen);
    loader.load(url, texture => {
      if (disposed) { texture.dispose(); return; }
      texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); textures.add(texture);
      screenMaterial.map = texture; screenMaterial.color.set(0xffffff); screenMaterial.needsUpdate = true; schedule();
    }, undefined, () => {});
    box(g, dark, 0, -h * .5 - .65, -.15, .35, 1.1, .35);
    box(g, copper, 0, -h * .5 - 1.23, .05, w * .46, .15, 1.4);
    fragments.push({ group: g, base: g.position.clone(), direction: new THREE.Vector3(x * .15, 1.9, z * .1) });
    return g;
  }
  billboard(design, '/spectrum/nadir.jpg', -1.8, 4.1, -.75, 5.25, 3.5, .18);
  billboard(design, '/spectrum/fable.jpg', 2.7, 2.86, 1.25, 3.3, 2.2, -.23);
  const swatches = [coral, clay, copper, ivory, mint, teal];
  swatches.forEach((mat, i) => box(design, mat, -3.9 + i * 1.05, .48, 3.18, .89, .49, .7));
  box(design, dark, 2.3, 1.05, -2.23, 2.6, 1.7, 2);
  box(design, paper, 2.3, 2.05, -2.23, 3.1, .27, 2.4);
  box(design, copper, 2.3, 2.5, -2.23, 2.1, .7, 1.5);
  for (let i = 0; i < 7; i++) box(design, paper, -4.8, .31 + i * .095, 1.27, 1.4, .045, 1.9, i * .024);
  ring(design, coral, 3.8, 4.3, -2.2, .85, .12, 0, -.12);
  orb(design, amber, -4.65, 3.55, -2.7, .19); glow(design, 0xffb55d, -4.65, 3.55, -2.7, 2.5, .4);

  // SYSTEMS: ordered data towers, a translucent central core, and a tiny circuit below every machine.
  disc(systems, teal, 0, .32, 0, 3.23, .24);
  ring(systems, copper, 0, .48, 0, 3.25, .047);
  ring(systems, cyan, 0, .5, 0, 2.75, .035);
  const towers = [[-2.2, -1.8, 4.1], [2.3, -1.7, 5.9], [-2.5, 1.7, 2.65], [2.5, 1.4, 3.5]];
  const vents = [], leds = [];
  towers.forEach(([x, z, h], ti) => {
    box(systems, dark, x, h / 2 + .3, z, 1.15, h, 1.15);
    box(systems, mint, x, h + .37, z, 1.32, .16, 1.32);
    for (let row = 0; row < Math.floor(h * 2.5); row++) {
      vents.push([x, .65 + row * .37, z + .589, .77, .16, .027]);
      leds.push([x - .43, .65 + row * .37, z + .61, .055, .055, .055]);
    }
    line(systems, [[x, .2, z], [x, .2, 0], [0, .2, 0]], 0x377b6e);
    orb(systems, amber, x, h + .68, z, .09);
  }); batch(systems, copper, vents); batch(systems, cyan, leds);
  box(systems, glass, 0, 3.1, 0, 2.35, 5.2, 2.35);
  const core = new THREE.Group(); core.position.set(0, 3.8, 0); systems.add(core);
  const nucleus = new THREE.Mesh(geo(new THREE.OctahedronGeometry(.77)), mint); core.add(nucleus);
  ring(core, amber, 0, 0, 0, 1.25, .025, .7, .2);
  ring(core, mintLine, 0, 0, 0, 1.52, .018, 1.2, -.7);
  revolvers.push({ group: core, axis: 'y', speed: .22 });
  glow(systems, 0x47e6d4, 0, 3.8, 0, 5.5, .38);
  for (let i = 0; i < 4; i++) {
    const plate = box(systems, i % 2 ? mint : copper, 0, .85 + i * 1.32, 0, 2.65, .14, 2.65);
    fragments.push({ group: plate, base: plate.position.clone(), direction: new THREE.Vector3(0, (i + 1) * .57, 0) });
  }
  for (const x of [-4.1, 4.1]) for (let i = 0; i < 7; i++) box(systems, cyan, x, .22, -2.8 + i * .88, .12, .035, .34);

  // WORLDS: a playable-looking city sliced into an island, with an elevated railway and a park.
  box(worlds, teal, 0, .22, 0, 10.7, .16, 9.7);
  box(worlds, stone, -.6, .325, 0, 1.1, .05, 9.65);
  box(worlds, stone, 0, .33, .8, 10.7, .05, 1.12);
  box(worlds, mint, 3.6, .34, -2.3, 2.8, .04, 3.7);
  const cityBlocks = [], cityRoof = [], cityWindows = [], trees = [], treeTrunks = [];
  for (let x = -4; x <= 4; x += 2) for (let z = -3.4; z <= 3.4; z += 2.2) {
    if (Math.abs(x + .6) < 1 || Math.abs(z - .8) < 1 || (x > 1 && z < -.3)) continue;
    const h = .6 + seed() * 3.5;
    cityBlocks.push([x, .35 + h / 2, z, 1.35, h, 1.25]); cityRoof.push([x, .4 + h, z, 1.44, .15, 1.34]);
    for (let k = 0; k < Math.floor(h * 2); k++) for (let col = 0; col < 3; col++) cityWindows.push([x - .4 + col * .4, .62 + k * .44, z + .635, .18, .17, .025]);
  }
  batch(worlds, ivory, cityBlocks); batch(worlds, clay, cityRoof); batch(worlds, amber, cityWindows);
  for (let i = 0; i < 17; i++) {
    const x = 1.1 + seed() * 3.8, z = -3.6 + seed() * 2.75, h = .45 + seed() * .6;
    trees.push([x, .68 + h * .3, z, .43, h, .43, 0, seed(), 0]); treeTrunks.push([x, .5, z, .09, .6, .09]);
  } batch(worlds, mint, trees, sphere); batch(worlds, copper, treeTrunks);
  const roadDashes = [];
  for (let i = 0; i < 15; i++) roadDashes.push([-.6, .36, -4.3 + i * .61, .08, .02, .25]);
  batch(worlds, paper, roadDashes);
  arch(worlds, coral, 2.6, .3, -3.1, .78, .53, .85, .34);
  box(worlds, paper, -4.35, 4.5, -3.45, 1.5, .18, 1.5);
  box(worlds, copper, -4.35, 3.42, -3.45, .12, 2.1, .12);
  const worldOrbit = ring(worlds, copper, -.2, 4.4, -.2, 4.88, .025, 1.1, .2);
  const cloud = new THREE.Group(); cloud.position.set(1, 5.5, -.8); worlds.add(cloud);
  batch(cloud, paper, [[0, 0, 0, .85, .5, .6], [.62, -.1, .03, .75, .5, .55], [-.55, -.14, .08, .7, .4, .5]]);
  floats.push({ group: cloud, y: 5.5, phase: 1.4, amount: .14 });
  fragments.push({ group: cloud, base: cloud.position.clone(), direction: new THREE.Vector3(1.6, 2.1, -.3) });

  // LAUNCH: a huge broken-halo gate. A luminous invitation with a physical threshold.
  const gate = new THREE.Group(); gate.position.set(0, 4.55, -.55); launch.add(gate);
  ring(gate, ivory, 0, 0, 0, 3.35, .28, 0);
  ring(gate, copper, 0, 0, -.16, 3.68, .075, 0);
  ring(gate, amber, 0, 0, .02, 3.03, .028, 0);
  ring(gate, mintLine, 0, 0, -.28, 2.83, .02, 0);
  const gateSegments = [];
  for (let i = 0; i < 28; i++) {
    const theta = i / 28 * Math.PI * 2;
    gateSegments.push([Math.sin(theta) * 3.55, Math.cos(theta) * 3.55, .08, .16, .4, .27, 0, 0, -theta]);
  } batch(gate, coral, gateSegments);
  glow(gate, 0x67e6d3, 0, 0, -.2, 6.3, .29);
  const launchCore = new THREE.Mesh(geo(new THREE.OctahedronGeometry(.53, 0)), amber); gate.add(launchCore);
  revolvers.push({ group: launchCore, axis: 'y', speed: .5 });
  ring(gate, copper, 0, 0, .5, .91, .018, .4, .6);
  box(launch, teal, 0, .67, -.5, 5.2, .9, 3);
  box(launch, ivory, -2.4, 1.6, -.7, .7, 2.6, 1.2); box(launch, ivory, 2.4, 1.6, -.7, .7, 2.6, 1.2);
  for (let i = 0; i < 7; i++) box(launch, paper, 0, .27 + i * .16, 3.2 - i * .48, 3.3 - i * .07, .21, .5);
  for (let i = 0; i < 12; i++) {
    const angle = i / 12 * Math.PI * 2;
    line(gate, [[Math.sin(angle) * 1.4, Math.cos(angle) * 1.4, -.2], [Math.sin(angle) * 2.75, Math.cos(angle) * 2.75, -.5]], 0x7ae5ce, .18);
  }

  // Continuous light rail physically connects the five districts. Tiny pods travel along the curves.
  function bridge(a, b, color, lift = 2) {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), vm = va.clone().lerp(vb, .5); vm.y += lift;
    const curve = new THREE.CatmullRomCurve3([va, va.clone().lerp(vm, .55), vm, vm.clone().lerp(vb, .45), vb]);
    const track = new THREE.Mesh(geo(new THREE.TubeGeometry(curve, 55, .045, 5, false)), color); art.add(track);
    const railMat = color === orangeLine ? copper : teal;
    for (const offset of [-.25, .25]) {
      const points = curve.getPoints(50).map(p => p.add(new THREE.Vector3(offset, -.14, 0)));
      const railCurve = new THREE.CatmullRomCurve3(points);
      art.add(new THREE.Mesh(geo(new THREE.TubeGeometry(railCurve, 45, .085, 5, false)), railMat));
    }
    const ties = [];
    for (let i = 0; i < 24; i++) {
      const p = curve.getPoint(i / 23), t = curve.getTangent(i / 23);
      ties.push([p.x, p.y - .18, p.z, .72, .07, .14, 0, Math.atan2(t.x, t.z), 0]);
    } batch(art, copper, ties);
    for (let i = 0; i < 2; i++) {
      const pod = new THREE.Group(); box(pod, paper, 0, .08, 0, .28, .22, .56); box(pod, amber, 0, .21, 0, .18, .035, .23);
      art.add(pod);
      movers.push({ group: pod, curve, offset: i * .5 + seed() * .2, speed: .028 + seed() * .012 });
    }
  }
  bridge([-4.8, .75, -2.5], [-9.5, 1.9, -5.9], orangeLine, 1.4);
  bridge([4.4, 1.05, -3.8], [8.9, 1.8, -6.8], mintLine, 2);
  bridge([13, 1.75, -6], [13, -1.25, 5.6], mintLine, 2.3);
  bridge([8.5, -1.2, 11], [-8.7, 2.9, 11.7], orangeLine, 3.1);
  bridge([-12.8, 2.9, 7.6], [-13.8, 2, -4.2], orangeLine, 1.5);

  // Loose architectural samples float around the islands, making the exploded view meaningful.
  const samplePositions = [[-8, 5, 2], [6, 7, 7], [-4, 8, -7], [19, 3, 1], [-19, 6, 3], [2, -2, 14], [7, 1, -17], [-19, 2, -14]];
  samplePositions.forEach((p, i) => {
    const g = new THREE.Group(); g.position.set(...p); art.add(g);
    const s = .35 + seed() * .45;
    box(g, i % 3 === 0 ? clay : mint, 0, 0, 0, s, s, s, .45);
    box(g, copper, 0, -s * .7, 0, s * 1.3, .065, s * 1.3);
    floats.push({ group: g, y: p[1], phase: i, amount: .18 });
    fragments.push({ group: g, base: g.position.clone(), direction: new THREE.Vector3(p[0] * .16, 1 + seed() * 2, p[2] * .12) });
  });
  // A surveyed orbital grid hangs below the model; a few distant stars establish scale.
  ring(art, copper, 0, -4.5, 0, 24, .012);
  ring(art, mintLine, 0, -4.52, 0, 25, .006);
  const tickData = [];
  for (let i = 0; i < 96; i++) {
    const a = i / 96 * Math.PI * 2;
    tickData.push([Math.sin(a) * 24.5, -4.5, Math.cos(a) * 24.5, .025, .025, i % 8 ? .25 : .65, 0, a, 0]);
  } batch(art, copper, tickData);
  const starPositions = [];
  for (let i = 0; i < 220; i++) starPositions.push((seed() - .5) * 100, (seed() - .3) * 60, (seed() - .5) * 100);
  const starsGeometry = geo(new THREE.BufferGeometry()); starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const starsMaterial = new THREE.PointsMaterial({ color: 0xb7ded0, size: .045, transparent: true, opacity: .45, sizeAttenuation: true, depthWrite: false }); materials.add(starsMaterial);
  const stars = new THREE.Points(starsGeometry, starsMaterial); scene.add(stars);

  // Static architectural parts share GPU batches. Only genuinely moving objects stay separate.
  // This keeps the detailed model inexpensive without reducing its visible geometry.
  const animatedObjects = new Set([...movers, ...revolvers, ...floats, ...fragments].map(item => item.group));
  const staticBatches = new Map(), explosionBatches = [];
  scene.updateMatrixWorld(true);
  const districts = [origin, design, systems, worlds, launch];
  const inverseDistricts = districts.map(d => d.matrixWorld.clone().invert());
  function explosionOffset(worldPosition) {
    let districtIndex = 0, best = Infinity;
    districts.forEach((district, i) => { const distance = (district.position.x - worldPosition.x) ** 2 + (district.position.z - worldPosition.z) ** 2; if (distance < best) { best = distance; districtIndex = i; } });
    const local = worldPosition.clone().applyMatrix4(inverseDistricts[districtIndex]);
    const direction = local.y > .58 ? new THREE.Vector3(local.x * .24, 1.05 + local.y * .36, local.z * .24) : new THREE.Vector3(local.x * .035, local.y * .72 - .2, local.z * .035);
    return direction.applyQuaternion(districts[districtIndex].quaternion);
  }
  art.traverse(object => {
    if (!object.isMesh || object.isInstancedMesh || ![cube, cylinder, sphere].includes(object.geometry)) return;
    for (let parent = object; parent; parent = parent.parent) if (animatedObjects.has(parent)) return;
    const batchKey = `${object.geometry.uuid}-${object.material.uuid}`;
    if (!staticBatches.has(batchKey)) staticBatches.set(batchKey, []);
    staticBatches.get(batchKey).push(object);
  });
  staticBatches.forEach(objects => {
    if (objects.length < 3) return;
    const instance = new THREE.InstancedMesh(objects[0].geometry, objects[0].material, objects.length);
    instance.castShadow = objects.some(object => object.castShadow); instance.receiveShadow = objects.some(object => object.receiveShadow);
    const bases = [], offsets = [];
    objects.forEach((object, index) => {
      instance.setMatrixAt(index, object.matrixWorld); bases.push(object.matrixWorld.clone());
      offsets.push(explosionOffset(new THREE.Vector3().setFromMatrixPosition(object.matrixWorld)));
      object.parent.remove(object);
    });
    explosionBatches.push({ mesh: instance, bases, offsets });
    instance.instanceMatrix.needsUpdate = true; art.add(instance);
  });
  const combinedMeshes = new Set(explosionBatches.map(batch => batch.mesh));
  art.traverse(object => {
    if (!object.isInstancedMesh || combinedMeshes.has(object) || object.parent === art) return;
    for (let parent = object; parent; parent = parent.parent) if (animatedObjects.has(parent)) return;
    const bases = [], offsets = [], inverseRotation = new THREE.Quaternion();
    object.getWorldQuaternion(inverseRotation); inverseRotation.invert();
    for (let i = 0; i < object.count; i++) {
      const matrix = new THREE.Matrix4(); object.getMatrixAt(i, matrix); bases.push(matrix);
      const worldPosition = new THREE.Vector3().setFromMatrixPosition(object.matrixWorld.clone().multiply(matrix));
      offsets.push(explosionOffset(worldPosition).applyQuaternion(inverseRotation));
    }
    explosionBatches.push({ mesh: object, bases, offsets });
  });
  let previousExplosion = -1;
  const explosionMatrix = new THREE.Matrix4();
  const lineBatches = new Map(), glowBatches = new Map(), railBatches = new Map();
  art.traverse(object => {
    for (let parent = object; parent; parent = parent.parent) if (animatedObjects.has(parent)) return;
    if (object.isLine && !object.isLineSegments) {
      const batchKey = `${object.material.color.getHex()}-${object.material.opacity}`;
      if (!lineBatches.has(batchKey)) lineBatches.set(batchKey, []);
      lineBatches.get(batchKey).push(object);
    }
    if (object.isSprite) {
      const bucket = object.scale.x < 3 ? 1.8 : object.scale.x < 8 ? 5.7 : 13;
      if (!glowBatches.has(bucket)) glowBatches.set(bucket, []);
      glowBatches.get(bucket).push(object);
    }
    if (object.isMesh && object.geometry.type === 'TubeGeometry') {
      if (!railBatches.has(object.material)) railBatches.set(object.material, []);
      railBatches.get(object.material).push(object);
    }
  });
  railBatches.forEach((objects, mat) => {
    if (objects.length < 2) return;
    const parts = objects.map(object => object.geometry.toNonIndexed().applyMatrix4(object.matrixWorld));
    const merged = geo(new THREE.BufferGeometry());
    for (const name of ['position', 'normal', 'uv']) {
      const arrays = parts.map(part => part.attributes[name].array), length = arrays.reduce((sum, array) => sum + array.length, 0);
      const values = new Float32Array(length); let offset = 0;
      arrays.forEach(array => { values.set(array, offset); offset += array.length; });
      merged.setAttribute(name, new THREE.BufferAttribute(values, name === 'uv' ? 2 : 3));
    }
    parts.forEach(part => part.dispose()); objects.forEach(object => object.parent.remove(object));
    art.add(new THREE.Mesh(merged, mat));
  });
  lineBatches.forEach(objects => {
    if (objects.length < 2) return;
    const positions = [], v = new THREE.Vector3();
    for (const object of objects) {
      const attribute = object.geometry.attributes.position;
      for (let i = 0; i < attribute.count - 1; i++) {
        v.fromBufferAttribute(attribute, i).applyMatrix4(object.matrixWorld); positions.push(v.x, v.y, v.z);
        v.fromBufferAttribute(attribute, i + 1).applyMatrix4(object.matrixWorld); positions.push(v.x, v.y, v.z);
      }
      object.parent.remove(object);
    }
    const geometry = geo(new THREE.BufferGeometry()); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    art.add(new THREE.LineSegments(geometry, objects[0].material));
  });
  glowBatches.forEach((objects, size) => {
    if (objects.length < 2) return;
    const positions = [], colors = [];
    objects.forEach(object => {
      const p = new THREE.Vector3().setFromMatrixPosition(object.matrixWorld), color = object.material.color;
      positions.push(p.x, p.y, p.z); const strength = object.material.opacity / .4;
      colors.push(color.r * strength, color.g * strength, color.b * strength); object.parent.remove(object);
    });
    const geometry = geo(new THREE.BufferGeometry()); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ map: glowTexture, color: 0xffffff, vertexColors: true, size, transparent: true, opacity: .4, blending: THREE.AdditiveBlending, depthWrite: false }); materials.add(mat);
    art.add(new THREE.Points(geometry, mat));
  });

  const positions = [[34, 28, 43], [-5, 16.2, 13], [29, 18, 12], [31, 15, 33], [5.5, 16.8, 35]];
  const targets = [[0, 2.25, 0], [-13.4, 3.6, -7.8], [11.8, 3.3, -9.6], [12.1, 1, 10.2], [-12.5, 6, 11.5]];
  const cameraPosition = new THREE.Vector3(), cameraTarget = new THREE.Vector3();
  const tempVector = new THREE.Vector3();
  let renderedFrames = 0;
  function resize() {
    if (disposed) return;
    const rect = container.getBoundingClientRect(); width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, qualityCap));
    renderer.setSize(width, height, false); camera.aspect = width / height;
    camera.setViewOffset(width, height, mobileQuery.matches ? 0 : -width * .18, mobileQuery.matches ? height * .105 : 0, width, height);
    camera.updateProjectionMatrix(); schedule();
  }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(container);
  function schedule() { if (!raf && !disposed && !document.hidden) raf = requestAnimationFrame(render); }
  function render(now) {
    raf = 0; if (disposed || document.hidden) return;
    const frameMs = previousTime ? now - previousTime : 16;
    const dt = Math.min(frameMs / 1000, .06); previousTime = now;
    if (!paused && renderedFrames > 8 && frameMs < 500) {
      qualitySample += frameMs; qualityFrames++;
      if (qualitySample >= 1500 && qualityFrames >= 8) {
        averageFrameMs = qualitySample / qualityFrames;
        if (averageFrameMs > 45 && renderer.getPixelRatio() > .65) {
          qualityCap = Math.max(.65, renderer.getPixelRatio() * .8);
          renderer.setPixelRatio(qualityCap); renderer.setSize(width, height, false);
        }
        qualitySample = 0; qualityFrames = 0;
      }
    }
    if (!paused) elapsed += dt;
    const ease = 1 - Math.exp(-dt * 9);
    progress = motionQuery.matches ? requestedProgress : progress + (requestedProgress - progress) * ease;
    exploded = motionQuery.matches ? requestedExploded : exploded + (requestedExploded - exploded) * (1 - Math.exp(-dt * 5));
    if (Math.abs(exploded - requestedExploded) < .001) exploded = requestedExploded;
    currentPointerX += (pointerX - currentPointerX) * ease; currentPointerY += (pointerY - currentPointerY) * ease;
    if (Math.abs(progress - requestedProgress) < .0001) progress = requestedProgress;
    const index = Math.min(3, Math.floor(progress)); let t = progress - index; t = t * t * (3 - 2 * t);
    cameraPosition.fromArray(positions[index]).lerp(tempVector.fromArray(positions[index + 1]), t);
    cameraTarget.fromArray(targets[index]).lerp(tempVector.fromArray(targets[index + 1]), t);
    if (mobileQuery.matches) {
      const factor = progress < .7 ? 1.46 : 1.35;
      cameraPosition.sub(cameraTarget).multiplyScalar(factor).add(cameraTarget);
    }
    cameraPosition.x += currentPointerX * .8;
    cameraPosition.y -= currentPointerY * .5;
    camera.position.copy(cameraPosition); camera.lookAt(cameraTarget);
    for (const item of revolvers) item.group.rotation[item.axis] += paused ? 0 : dt * item.speed;
    for (const item of floats) item.group.position.y = item.y + Math.sin(elapsed * .7 + item.phase) * item.amount;
    for (const item of fragments) {
      item.group.position.x = item.base.x + item.direction.x * exploded;
      item.group.position.z = item.base.z + item.direction.z * exploded;
      item.group.position.y = item.base.y + item.direction.y * exploded + Math.sin(elapsed * .7 + item.base.x) * .12;
    }
    if (exploded !== previousExplosion) {
      for (const item of explosionBatches) {
        item.bases.forEach((matrix, index) => {
          explosionMatrix.copy(matrix);
          explosionMatrix.elements[12] += item.offsets[index].x * exploded;
          explosionMatrix.elements[13] += item.offsets[index].y * exploded;
          explosionMatrix.elements[14] += item.offsets[index].z * exploded;
          item.mesh.setMatrixAt(index, explosionMatrix);
        });
        item.mesh.instanceMatrix.needsUpdate = true;
        item.mesh.computeBoundingSphere();
      }
      previousExplosion = exploded;
      if (exploded === requestedExploded) renderer.shadowMap.needsUpdate = true;
    }
    for (const item of movers) {
      const p = (elapsed * item.speed + item.offset) % 1;
      item.group.position.copy(item.curve.getPoint(p)); item.group.lookAt(item.curve.getPoint((p + .005) % 1));
    }
    renderer.render(scene, camera); renderedFrames++;
    const isSettling = Math.abs(progress - requestedProgress) > .0001 || Math.abs(exploded - requestedExploded) > .001 || Math.abs(currentPointerX - pointerX) > .001 || Math.abs(currentPointerY - pointerY) > .001;
    if (!paused || isSettling) schedule();
  }
  function visibility() { previousTime = 0; if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else schedule(); }
  document.addEventListener('visibilitychange', visibility);
  resize();
  return {
    setProgress(p) { if (Number.isFinite(p)) { const next = THREE.MathUtils.clamp(p, 0, 4); if (next === requestedProgress) return; requestedProgress = next; schedule(); } },
    setPointer(x, y) { if (Number.isFinite(x) && Number.isFinite(y)) { const nextX = THREE.MathUtils.clamp(x, -1, 1), nextY = THREE.MathUtils.clamp(y, -1, 1); if (nextX === pointerX && nextY === pointerY) return; pointerX = nextX; pointerY = nextY; schedule(); } },
    setPaused(value) { if (paused === !!value) return; paused = !!value; previousTime = 0; schedule(); },
    setExploded(value) { const next = value ? 1 : 0; if (next === requestedExploded) return; requestedExploded = next; schedule(); },
    getDebugState() { return { progress, requestedProgress, paused, exploded, width, height, pixelRatio: renderer.getPixelRatio(), averageFrameMs, renderedFrames, drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, camera: camera.position.toArray() }; },
    dispose() {
      if (disposed) return; disposed = true; cancelAnimationFrame(raf); resizeObserver.disconnect(); document.removeEventListener('visibilitychange', visibility);
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); renderer.dispose(); renderer.domElement.remove();
    }
  };
}
