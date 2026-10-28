"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { frameWorkshop } from "./hero-scene-framing";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

// Port of ref/hero-3d-v2.html (r170). All resources belong to this mount.
function createScene(canvas: HTMLCanvasElement, displayFont: string, bodyFont: string) {
  const resources = new Set<{ dispose: () => void }>();
  const cleanups: Array<() => void> = [];
  let disposed = false;
  const track = <T extends { dispose: () => void }>(resource: T): T => {
    resources.add(resource);
    return resource;
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    canvas.style.visibility = "hidden";
    for (const cleanup of cleanups.reverse()) cleanup();
    for (const resource of Array.from(resources).reverse()) resource.dispose();
    resources.clear();
  };

  try {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduce = motionQuery.matches;
    const isSmall = () => canvas.clientWidth < 768;
    const SAND_X = -6.6, BLAST_X = -2.7, PAINT_X = 1.6, OVEN_X = 5.9, CHECK_X = 9.2;

    /* ---------------- Rendu ---------------- */
    const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'high-performance' });
    if (!context) return dispose;
    const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true, powerPreference: 'high-performance' });
    track({ dispose: () => { renderer.dispose(); renderer.forceContextLoss(); } });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall() ? 1.25 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.86;
    renderer.shadowMap.enabled = !isSmall();
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    // Reveal the page's pure white instead of tone-mapping an opaque background.
    scene.background = null;
    scene.fog = new THREE.Fog('#ffffff', 38, 72);
    const pmrem = track(new THREE.PMREMGenerator(renderer));
    const room = track(new RoomEnvironment());
    const environment = track(pmrem.fromScene(room, 0.04));
    scene.environment = environment.texture;
    room.dispose(); resources.delete(room);
    pmrem.dispose(); resources.delete(pmrem);
    scene.environmentIntensity = 0.38;

    const camera = new THREE.PerspectiveCamera(24, 1, 1, 200);
    const camTarget = new THREE.Vector3(1.2, 1.6, 0.8);

    /* Lumières : ciel doux, soleil rasant filtré par des fenêtres, lumière zénithale pour ancrer les ombres */
    scene.add(new THREE.HemisphereLight('#ffffff', '#dce2e8', 0.7));
    const SUN_DIR = new THREE.Vector3(-34, 21, 14).normalize();
    const sun = new THREE.DirectionalLight('#ffffff', 4.2);
    sun.target.position.set(2, 0, 0);
    sun.position.copy(sun.target.position).addScaledVector(SUN_DIR, 70);
    sun.castShadow = !isSmall();
    track(sun.shadow);
    sun.shadow.intensity = 0.72;
    sun.shadow.mapSize.setScalar(2048);
    Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 1, far: 130 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);
    const top = new THREE.DirectionalLight('#ffffff', 0.75);
    top.position.set(4, 30, 9);
    top.castShadow = !isSmall();
    track(top.shadow);
    top.shadow.intensity = 0.45;
    top.shadow.mapSize.setScalar(1024);
    Object.assign(top.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 60 });
    top.shadow.bias = -0.0004; top.shadow.normalBias = 0.03;
    scene.add(top);
    /* Cadre de fenêtres invisible : il ne fait que découper la lumière du soleil en taches sur le sol */
    {
      const shape = new THREE.Shape(); shape.moveTo(-40, -40); shape.lineTo(40, -40); shape.lineTo(40, 40); shape.lineTo(-40, 40); shape.lineTo(-40, -40);
      const pane = (x: number, y: number, w: number, h: number) => { const hp = new THREE.Path(); hp.moveTo(x, y); hp.lineTo(x, y + h); hp.lineTo(x + w, y + h); hp.lineTo(x + w, y); hp.lineTo(x, y); shape.holes.push(hp); };
      for (const [wx, wy] of [[-9.5, -4], [3.5, -2.5]]) for (let c = 0; c < 2; c++) for (let r = 0; r < 2; r++) pane(wx + c * 2.9, wy + r * 3.9, 2.65, 3.6);
      const occ = new THREE.Mesh(track(new THREE.ShapeGeometry(shape)), track(new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: THREE.DoubleSide })));
      occ.castShadow = true; occ.receiveShadow = false;
      occ.position.copy(sun.target.position).addScaledVector(SUN_DIR, 40);
      occ.lookAt(sun.position); occ.rotateZ(0.0);
      scene.add(occ);
    }

    const labelRefreshers: Array<() => void> = [];
    /* ---------------- Helpers ---------------- */
    const geoCache = new Map<string, RoundedBoxGeometry>();
    const RB = (w: number, h: number, d: number, r = 0.08, s = 4) => { const k = [w, h, d, r, s].join(); if (!geoCache.has(k)) geoCache.set(k, track(new RoundedBoxGeometry(w, h, d, s, r))); return geoCache.get(k)!; };
    const M = (color: THREE.ColorRepresentation, rough = 0.62, metal = 0, extra: THREE.MeshStandardMaterialParameters = {}) => track(new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra }));
    function mesh<G extends THREE.BufferGeometry, M extends THREE.Material>(geo: G, mat: M, x = 0, y = 0, z = 0, parent: THREE.Object3D = scene, cast = true) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; }
    const C = {
      floor: '#f6f7f8', gap: '#e5e8eb', white: '#f7f6f3', ink: '#3d3d3d', inkDeep: '#2a2a2a', orange: '#ea5b17', blue: '#2f5aa8', blueSoft: '#d3def0',
      skin: '#f0c4a0', steel: '#b8bdc3', rail: '#f2f1ed', warm: '#f4eee6'
    };
    const MAT = {
      white: M(C.white, 0.55), ink: M(C.ink, 0.5), inkDeep: M(C.inkDeep, 0.6), orange: M(C.orange, 0.45), blue: M(C.blue, 0.55),
      blueSoft: M(C.blueSoft, 0.5), rail: M(C.rail, 0.35, 0.05), steelDark: M('#8d939a', 0.35, 0.8), skin: M(C.skin, 0.65), warm: M(C.warm, 0.55),
      glass: track(new THREE.MeshPhysicalMaterial({ color: '#cfe2ef', roughness: 0.08, metalness: 0, transmission: 0.0, transparent: true, opacity: 0.55, clearcoat: 1 })),
      glow: track(new THREE.MeshStandardMaterial({ color: '#ff8a3d', emissive: '#ff5a10', emissiveIntensity: 2.2, roughness: 0.4 })),
      curtain: track(new THREE.MeshStandardMaterial({ color: '#f08a4b', roughness: 0.3, transparent: true, opacity: 0.5 }))
    };
    const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
      const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); if (!g) throw new Error('Canvas 2D unavailable'); draw(g, w, h);
      const t = track(new THREE.CanvasTexture(c));
      labelRefreshers.push(() => { draw(g, w, h); t.needsUpdate = true; }); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
    }

    /* ---------------- Sol carrelé ---------------- */
    // Fade only the floor, after lighting, by revealing the white background.
    // Raising its base color alone would still leave a grey ACES-lit horizon.
    // Both layers reach zero opacity before the tile grid's physical boundary;
    // shadows and joints retain their contrast in the active workshop footprint.
    function floorMaterial(color: string, roughness: number) {
      const material = M(color, roughness, 0, { transparent: true });
      material.onBeforeCompile = (shader) => {
        shader.vertexShader = 'varying vec2 vFloorPosition;\n' + shader.vertexShader.replace(
          '#include <project_vertex>',
          `#include <project_vertex>
          vec4 floorPosition = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            floorPosition = instanceMatrix * floorPosition;
          #endif
          vFloorPosition = (modelMatrix * floorPosition).xz;`,
        );
        shader.fragmentShader = 'varying vec2 vFloorPosition;\n' + shader.fragmentShader.replace(
          '#include <opaque_fragment>',
          `float floorSides = 1.0 - smoothstep(14.0, 26.0, abs(vFloorPosition.x - 1.5));
          float floorDepth = 1.0 - smoothstep(4.0, 19.0, abs(vFloorPosition.y - 0.4));
          diffuseColor.a *= floorSides * floorDepth;
          #include <opaque_fragment>`,
        );
      };
      material.customProgramCacheKey = () => 'hero-floor-fade-v3';
      return material;
    }
    mesh(track(new THREE.PlaneGeometry(200, 200)).rotateX(-Math.PI / 2), floorMaterial(C.gap, 0.9), 0, -0.02, 0, scene, false);
    {
      const tile = 3.6, n = 16, g = RB(tile - 0.14, 0.24, tile - 0.14, 0.1, 3);
      const im = track(new THREE.InstancedMesh(g, floorMaterial(C.floor, 0.86), n * n));
      const m4 = new THREE.Matrix4(); let i = 0;
      for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) { m4.makeTranslation((a - n / 2) * tile + tile / 2 - 0.4, 0.0, (b - n / 2) * tile + tile / 2 + 0.6); im.setMatrixAt(i++, m4); }
      im.receiveShadow = true; scene.add(im);
    }
    const FLOOR = 0.12;

    /* Marquage au sol : bandes orange le long de la ligne */
    for (const z of [-2.9, 2.9]) mesh(RB(44, 0.03, 0.12, 0.015, 2), M(C.orange, 0.6), 0, FLOOR + 0.01, z, scene, false);
    /* ---------------- Ligne de convoyage aérienne ---------------- */
    const RAIL_Y = 5.5;
    mesh(RB(60, 0.26, 0.34, 0.08), MAT.rail, 0, RAIL_Y, 0);
    mesh(RB(60, 0.06, 0.12, 0.03), MAT.orange, 0, RAIL_Y - 0.16, 0.0, scene, false);
    for (const x of [-11, -4.9, -0.45, 3.5, 8.4, 13, 18]) {
      mesh(RB(0.34, RAIL_Y + 0.5, 0.34, 0.08), MAT.white, x, (RAIL_Y + 0.5) / 2, -1.5);
      mesh(RB(0.3, 0.3, 1.8, 0.08), MAT.white, x, RAIL_Y + 0.35, -0.7);
      mesh(RB(0.7, 0.12, 0.7, 0.05), MAT.ink, x, FLOOR + 0.06, -1.5);
    }

    /* ---------------- Pièces ---------------- */
    const rustTex = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#9a5634'; g.fillRect(0, 0, w, h);
      const rnd = mulberry(7);
      for (let i = 0; i < 900; i++) { const r = rnd() * 16 + 2; g.fillStyle = ['#7a3d22', '#b8693d', '#5e3524', '#a8714e', '#c2804f'][i % 5]; g.globalAlpha = 0.25 + rnd() * 0.5; g.beginPath(); g.arc(rnd() * w, rnd() * h, r, 0, 7); g.fill(); }
      g.globalAlpha = 1;
    });
    rustTex.wrapS = rustTex.wrapT = THREE.RepeatWrapping;
    function mulberry(a: number) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

    const PAINTS = [
      { c: '#ea5b17', ral: 'RAL 2004', name: 'Orange pur' },
      { c: '#2f5aa8', ral: 'RAL 5005', name: 'Bleu de sécurité' },
      { c: '#e7dcc2', ral: 'RAL 1015', name: 'Ivoire clair' },
      { c: '#3b3f45', ral: 'RAL 7016', name: 'Gris anthracite' },
    ];
    const steelC = new THREE.Color(C.steel), whiteC = new THREE.Color('#ffffff');

    function partMaterial() {
      const m = track(new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: rustTex, roughness: 0.95, metalness: 0.2, clearcoat: 0, clearcoatRoughness: 0.15, emissive: '#ff4a00', emissiveIntensity: 0 }));
      const rust = { value: 1 };
      const material = Object.assign(m, { rust });
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uRust = rust;
        sh.fragmentShader = 'uniform float uRust;\n' + sh.fragmentShader.replace('#include <map_fragment>',
          '#ifdef USE_MAP\n  vec4 sampledDiffuseColor = texture2D( map, vMapUv );\n  diffuseColor *= mix( vec4(1.0), sampledDiffuseColor, uRust );\n#endif');
      };
      m.customProgramCacheKey = () => 'rust-part';
      return material;
    }
    function plaque(mat: THREE.Material) {
      const g = new THREE.Group();
      mesh(RB(1.5, 1.9, 0.12, 0.05, 3), mat, 0, -1.05, 0, g);
      mesh(RB(0.5, 0.14, 0.14, 0.05, 2), mat, 0, -0.06, 0, g);
      return g;
    }
    function jante(mat: THREE.Material) {
      const g = new THREE.Group();
      const prof = [[0.62, -0.18], [0.92, -0.2], [0.98, -0.14], [0.9, -0.1], [0.88, 0.1], [0.98, 0.16], [0.92, 0.22], [0.62, 0.2]].map(([x, y]) => new THREE.Vector2(x, y));
      const rim = new THREE.Mesh(track(new THREE.LatheGeometry(prof, 40)), mat); rim.rotation.x = Math.PI / 2; rim.castShadow = rim.receiveShadow = true;
      const wheel = new THREE.Group(); wheel.position.y = -1.08; wheel.add(rim); g.add(wheel);
      const hub = mesh(track(new THREE.CylinderGeometry(0.22, 0.24, 0.32, 24)).rotateX(Math.PI / 2), mat, 0, 0, 0, wheel);
      for (let i = 0; i < 5; i++) { const s = mesh(RB(0.16, 0.66, 0.1, 0.04, 2), mat, 0, 0, 0, wheel); const a = i / 5 * Math.PI * 2; s.position.set(Math.sin(a) * 0.42, Math.cos(a) * 0.42, 0.02); s.rotation.z = -a; }
      mesh(track(new THREE.TorusGeometry(0.1, 0.035, 8, 16)), MAT.steelDark, 0, -0.06, 0, g);
      return g;
    }
    function equerre(mat: THREE.Material) {
      const g = new THREE.Group();
      mesh(RB(0.22, 1.9, 0.9, 0.05, 3), mat, 0, -1.05, 0, g);
      mesh(RB(1.3, 0.22, 0.9, 0.05, 3), mat, 0.54, -1.9, 0, g);
      mesh(RB(0.4, 0.14, 0.14, 0.05, 2), mat, 0, -0.06, 0, g);
      return g;
    }

    /* Étiquette RAL qui apparaît au contrôle */
    function ralTag(p: (typeof PAINTS)[number]) {
      const draw = (g: CanvasRenderingContext2D, w: number, h: number) => {
        g.clearRect(0, 0, w, h);
        g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, 36); g.fill();
        g.strokeStyle = '#ecebe8'; g.lineWidth = 4; g.stroke();
        g.fillStyle = p.c; g.beginPath(); g.roundRect(30, 34, 132, 132, 22); g.fill();
        // Measure the actual loaded font and retain a fixed right-hand margin.
        const fitText = (text: string, x: number, y: number, maxWidth: number, size: number, font: (size: number) => string, color: string) => {
          g.font = font(size);
          while (g.measureText(text).width > maxWidth && size > 12) g.font = font(--size);
          g.fillStyle = color; g.textAlign = 'left'; g.textBaseline = 'middle';
          g.fillText(text, x, y);
        };
        fitText(p.ral, 186, 82, w - 186 - 32, 52,
          size => `${size}px ${displayFont}`, '#1c1b19');
        fitText(p.name, 188, 137, 254, 29,
          size => `500 ${size}px ${bodyFont}`, '#6e6d68');
        // The validation mark owns its space, independently of the label length.
        g.strokeStyle = '#6e6d68'; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(462, 137); g.lineTo(469, 144); g.lineTo(481, 130); g.stroke();
      };
      const tex = canvasTex(512, 200, draw);
      const s = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, toneMapped: false })));
      track(s.geometry);
      s.scale.set(2.56, 1.0, 1); s.renderOrder = 10; return s;
    }

    const tagScene = new THREE.Scene();
    const SPEED = 1.0, SPACING = 4, LINE0 = -26, LINE_LEN = 52;
    type Carrier = {
      root: THREE.Group; sway: THREE.Group; body: THREE.Group; shape: number;
      mat: ReturnType<typeof partMaterial>; paint: THREE.Color; dark: boolean;
      tag: THREE.Sprite; offset: number; seed: number; x: number;
    };
    const carriers: Carrier[] = [];
    const shapes = [plaque, jante, equerre, plaque, jante, equerre, plaque, jante, equerre, plaque, jante, equerre, plaque];
    for (let i = 0; i < LINE_LEN / SPACING; i++) {
      const root = new THREE.Group(); scene.add(root);
      mesh(RB(0.5, 0.22, 0.44, 0.06), MAT.ink, 0, RAIL_Y - 0.24, 0, root);
      mesh(track(new THREE.CylinderGeometry(0.035, 0.035, 1.5, 8)), MAT.steelDark, 0, RAIL_Y - 1.1, 0, root);
      const sway = new THREE.Group(); sway.position.y = RAIL_Y - 1.86; root.add(sway);
      mesh(track(new THREE.TorusGeometry(0.13, 0.03, 8, 20, Math.PI * 1.4)), MAT.steelDark, 0, 0.02, 0, sway).rotation.z = -0.4;
      const mat = partMaterial();
      const p = PAINTS[i % PAINTS.length];
      const body = shapes[i % shapes.length](mat); sway.add(body);
      const tag = ralTag(p); tag.visible = false; tagScene.add(tag);
      carriers.push({ x: LINE0 + i * SPACING, root, sway, body, shape: i % 3, mat, paint: new THREE.Color(p.c), dark: p.c === '#3b3f45', tag, offset: i * SPACING, seed: i * 1.37 });
    }

    /* ---------------- Personnages ---------------- */
    const capsule = (r: number, l: number) => track(new THREE.CapsuleGeometry(r, l, 8, 18));
    const sph = (r: number, ...a: number[]) => track(new THREE.SphereGeometry(r, 32, 20, ...a));
    const torsoGeo = track(new THREE.LatheGeometry([[0, 0], [0.27, 0], [0.31, 0.08], [0.33, 0.24], [0.35, 0.42], [0.34, 0.54], [0.28, 0.62], [0.16, 0.67], [0, 0.69]].map(([x, y]) => new THREE.Vector2(x, y)), 36));
    const ring = (r: number, t: number, m: THREE.Material, y: number, parent: THREE.Object3D, sz = 1) => { const o = mesh(track(new THREE.TorusGeometry(r, t, 10, 36)).rotateX(Math.PI / 2), m, 0, y, 0, parent); o.scale.z = sz; return o; };

    type Arm = { shoulder: THREE.Group; elbow: THREE.Group; hand: THREE.Group; s: number };
    type Worker = {
      g: THREE.Group; body: THREE.Group; pelvis: THREE.Group; spine: THREE.Group; head: THREE.Group;
      legs: Array<{ hip: THREE.Group; knee: THREE.Group; foot: THREE.Group; s: number }>;
      arms: Arm[];
      gait?: { last: THREE.Vector3; distance: number; active: number;
        feet: Array<{ p: THREE.Vector3; from: THREE.Vector3; to: THREE.Vector3;
          progress: number; duration: number; yaw: number; fromYaw: number; toYaw: number }> };
      contactNormal?: THREE.Vector3;
      toolMotion?: { wrist: THREE.Vector3; support: THREE.Vector3; rotation: THREE.Quaternion };
    };

    /* Personnage articulé (bassin, genoux, coudes, poignets) au style jouet arrondi */
    function makeWorker(o: { kind: 'prep' | 'painter'; suit: string; dark?: string; accent: string; glove?: string; vest?: boolean; cap?: string }): Worker {
      const suitM = M(o.suit, 0.82), darkM = M(o.dark || '#2b2b2b', 0.7), accM = M(o.accent, 0.5), gloveM = M(o.glove || '#30302f', 0.8);
      const bootM = M('#2a2a2a', 0.5), soleM = M('#151515', 0.9), reflM = M('#e9edf1', 0.2, 0.6), metalM = M('#c7ccd2', 0.25, 0.9);
      const g = new THREE.Group();
      const body = new THREE.Group(); g.add(body);
      const pelvis = new THREE.Group(); pelvis.position.y = 1.12; body.add(pelvis);
      mesh(RB(0.58, 0.3, 0.38, 0.13), suitM, 0, -0.02, 0, pelvis);
      const legs = [-1, 1].map((s) => {
        const hip = new THREE.Group(); hip.position.set(0.16 * s, -0.1, 0); pelvis.add(hip);
        mesh(capsule(0.13, 0.3), suitM, 0, -0.23, 0, hip);
        const knee = new THREE.Group(); knee.position.y = -0.47; hip.add(knee);
        mesh(capsule(0.115, 0.28), suitM, 0, -0.21, 0, knee);
        ring(0.118, 0.022, reflM, -0.27, knee);
        const foot = new THREE.Group(); foot.position.y = -0.44; knee.add(foot);
        mesh(RB(0.23, 0.17, 0.37, 0.075), bootM, 0, -0.02, 0.05, foot);
        mesh(RB(0.25, 0.05, 0.41, 0.022), soleM, 0, -0.1, 0.05, foot);
        return { hip, knee, foot, s };
      });
      const spine = new THREE.Group(); spine.position.y = 0.1; pelvis.add(spine);
      const chest = mesh(torsoGeo, suitM, 0, 0, 0, spine); chest.scale.z = 0.74;
      ring(0.305, 0.036, darkM, 0.05, spine, 0.74);
      mesh(RB(0.1, 0.07, 0.03, 0.012, 2), metalM, 0, 0.05, 0.242, spine);
      mesh(RB(0.018, 0.46, 0.02, 0.008, 2), darkM, 0, 0.36, 0.252, spine);
      mesh(RB(0.13, 0.13, 0.03, 0.02, 2), suitM, 0.14, 0.44, 0.24, spine);
      mesh(RB(0.14, 0.03, 0.035, 0.012, 2), darkM, 0.14, 0.5, 0.245, spine);
      ring(0.155, 0.05, suitM, 0.645, spine);
      if (o.vest) {
        const v = mesh(torsoGeo, accM, 0, 0.12, 0, spine); v.scale.set(1.045, 0.72, 0.8);
        ring(0.355, 0.024, reflM, 0.27, spine, 0.79); ring(0.36, 0.024, reflM, 0.43, spine, 0.79);
      } else {
        ring(0.352, 0.03, accM, 0.3, spine, 0.75); ring(0.352, 0.016, reflM, 0.3, spine, 0.76);
      }
      mesh(track(new THREE.CylinderGeometry(0.085, 0.09, 0.16, 20)), MAT.skin, 0, 0.73, 0, spine);
      const head = new THREE.Group(); head.position.y = 0.96; spine.add(head);
      mesh(sph(0.24), MAT.skin, 0, 0, 0, head).scale.set(1, 1.07, 1);
      for (const s of [-1, 1]) { mesh(sph(0.05), MAT.skin, 0.236 * s, 0, 0, head); mesh(sph(0.028), MAT.inkDeep, 0.075 * s, 0.035, 0.222, head); mesh(RB(0.07, 0.016, 0.02, 0.008, 2), M('#5a3a28', 0.8), 0.075 * s, 0.1, 0.226, head); }
      mesh(sph(0.036), MAT.skin, 0, -0.015, 0.243, head);
      const glass = track(new THREE.MeshPhysicalMaterial({ color: '#bcd6e8', roughness: 0.05, transparent: true, opacity: 0.45, clearcoat: 1 }));
      if (o.kind === 'painter') {
        mesh(sph(0.272, 0, Math.PI * 2, 0, Math.PI * 0.82), suitM, 0, 0.015, -0.015, head);
        const face = mesh(sph(0.165), MAT.skin, 0, -0.01, 0.15, head); face.scale.set(1, 1.12, 0.62);
        const hem = mesh(track(new THREE.TorusGeometry(0.168, 0.03, 10, 32)), suitM, 0, -0.01, 0.2, head); hem.scale.set(1, 1.14, 1);
        ring(0.27, 0.016, darkM, 0.05, head);
        mesh(RB(0.36, 0.13, 0.05, 0.03, 3), darkM, 0, 0.05, 0.215, head);
        mesh(RB(0.32, 0.1, 0.06, 0.035, 3), glass, 0, 0.05, 0.235, head);
        const resp = mesh(sph(0.12), darkM, 0, -0.11, 0.2, head); resp.scale.set(1.15, 0.85, 0.8);
        for (const s of [-1, 1]) { const f = mesh(track(new THREE.CylinderGeometry(0.066, 0.066, 0.06, 24)), accM, 0.12 * s, -0.12, 0.215, head); f.rotation.set(0, 0, Math.PI / 2); f.rotation.y = s * 0.7; }
      } else {
        mesh(sph(0.258, 0, Math.PI * 2, 0, Math.PI * 0.5), M(o.cap || C.blue, 0.7), 0, 0.03, 0, head);
        const vis = mesh(RB(0.24, 0.025, 0.17, 0.012, 2), M(o.cap || C.blue, 0.7), 0, 0.05, 0.27, head); vis.rotation.x = 0.18;
        for (const s of [-1, 1]) { const e = mesh(track(new THREE.CylinderGeometry(0.088, 0.088, 0.075, 24)), accM, 0.25 * s, 0, 0, head); e.rotation.z = Math.PI / 2; }
        mesh(track(new THREE.TorusGeometry(0.262, 0.018, 8, 30, Math.PI)), darkM, 0, 0.01, 0, head);
        const dm = mesh(sph(0.11), M('#f4f3ef', 0.9), 0, -0.11, 0.2, head); dm.scale.set(1.1, 0.78, 0.72);
        mesh(RB(0.3, 0.07, 0.04, 0.02, 2), glass, 0, 0.04, 0.24, head);
      }
      const arms = [-1, 1].map((s) => {
        const shoulder = new THREE.Group(); shoulder.position.set(0.37 * s, 0.56, 0); spine.add(shoulder);
        mesh(sph(0.125), suitM, 0, 0, 0, shoulder);
        mesh(capsule(0.105, 0.26), suitM, 0, -0.19, 0, shoulder);
        const elbow = new THREE.Group(); elbow.position.y = -0.38; shoulder.add(elbow);
        mesh(capsule(0.095, 0.24), suitM, 0, -0.16, 0, elbow);
        ring(0.098, 0.02, o.vest ? reflM : accM, -0.29, elbow);
        const hand = new THREE.Group(); hand.position.y = -0.36; elbow.add(hand);
        mesh(RB(0.11, 0.15, 0.13, 0.05, 3), gloveM, 0, -0.06, 0, hand);
        const th = mesh(capsule(0.03, 0.06), gloveM, -0.06 * s, -0.04, 0.05, hand); th.rotation.x = 0.6;
        shoulder.rotation.z = 0.08 * s;
        return { shoulder, elbow, hand, s };
      });
      g.traverse((n) => { if (n instanceof THREE.Mesh) { n.castShadow = true; n.receiveShadow = true; } });
      return { g, body, pelvis, spine, legs, arms, head };
    }

    const _q1 = new THREE.Quaternion(), _e = new THREE.Euler();
    /* Two-bone IK. Targets are smoothed before solving; bone lengths stay constant.
       Solve in the joint parent's coordinates so uniform worker scale is respected. */
    const ZERO = new THREE.Vector3();
    const DOWN = new THREE.Vector3(0, -1, 0), UP = new THREE.Vector3(0, 1, 0);
    const ikTarget = new THREE.Vector3(), ikAxis = new THREE.Vector3(), ikPole = new THREE.Vector3();
    const ikElbow = new THREE.Vector3(), ikLower = new THREE.Vector3(), ikQ = new THREE.Quaternion();
    function solveLimb(joint: THREE.Object3D, hinge: THREE.Object3D, worldTarget: THREE.Vector3, upperLength: number, lowerLength: number, pole: THREE.Vector3) {
      joint.parent!.updateWorldMatrix(true, false);
      ikTarget.copy(worldTarget); joint.parent!.worldToLocal(ikTarget);
      ikAxis.subVectors(ikTarget, joint.position);
      const distance = THREE.MathUtils.clamp(ikAxis.length(), 0.025, upperLength + lowerLength - 0.008);
      ikAxis.normalize();
      ikPole.copy(pole).addScaledVector(ikAxis, -pole.dot(ikAxis));
      if (ikPole.lengthSq() < 1e-8) ikPole.set(0, 0, 1).addScaledVector(ikAxis, -ikAxis.z);
      ikPole.normalize();
      const along = (upperLength ** 2 - lowerLength ** 2 + distance ** 2) / (2 * distance);
      const height = Math.sqrt(Math.max(0, upperLength ** 2 - along ** 2));
      ikElbow.copy(joint.position).addScaledVector(ikAxis, along).addScaledVector(ikPole, height);
      ikLower.copy(ikElbow).sub(joint.position).normalize();
      joint.quaternion.setFromUnitVectors(DOWN, ikLower);
      ikLower.copy(joint.position).addScaledVector(ikAxis, distance).sub(ikElbow).normalize();
      ikQ.copy(joint.quaternion).invert(); ikLower.applyQuaternion(ikQ);
      hinge.quaternion.setFromUnitVectors(DOWN, ikLower);
      joint.updateWorldMatrix(false, true);
    }
    const armPole = new THREE.Vector3(), parentQ = new THREE.Quaternion();
    function aimArm(arm: Arm, target: THREE.Vector3) {
      solveLimb(arm.shoulder, arm.elbow, target, 0.38, 0.36, armPole.set(arm.s * 0.55, -1, 0.28));
    }
    function restArm(arm: Arm, swing: number, k: number, elbow = -0.3) {
      _q1.setFromEuler(_e.set(swing, 0, 0.12 * arm.s));
      arm.shoulder.quaternion.slerp(_q1, k);
      _q1.setFromEuler(_e.set(elbow, 0, 0)); arm.elbow.quaternion.slerp(_q1, k);
      arm.hand.quaternion.slerp(_q1.identity(), k);
    }
    const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);
    const ease5 = (t: number) => { t = THREE.MathUtils.clamp(t, 0, 1); return t*t*t*(t*(t*6-15)+10); };
    const dampAngle = (a: number, b: number, k: number) => a + Math.atan2(Math.sin(b-a), Math.cos(b-a)) * k;

    /* ---------------- Postes ---------------- */
    // 01 Ponçage : établi + préparateur
    const sanderGuy = makeWorker({ kind: 'prep', suit: '#45484d', dark: '#26282b', accent: C.orange, vest: true, cap: C.blue });
    sanderGuy.g.position.set(SAND_X - 0.12, FLOOR + 0.08, 0.96); sanderGuy.g.scale.setScalar(1.25); sanderGuy.g.rotation.y = 2.4; scene.add(sanderGuy.g);
    const sander = new THREE.Group(); sander.position.set(0, -0.12, 0.04); sanderGuy.arms[1].hand.add(sander);
    mesh(track(new THREE.CylinderGeometry(0.1, 0.12, 0.2, 24)).rotateX(Math.PI / 2), MAT.ink, 0, 0, 0.02, sander);
    mesh(sph(0.065), MAT.orange, 0, 0.1, -0.02, sander);
    const sanderDisc = mesh(track(new THREE.CylinderGeometry(0.21, 0.21, 0.05, 32)).rotateX(Math.PI / 2), MAT.orange, 0, 0, 0.14, sander);
    mesh(track(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 32)).rotateX(Math.PI / 2), MAT.inkDeep, 0, 0, 0.175, sander);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      mesh(track(new THREE.CircleGeometry(0.018, 8)), MAT.inkDeep, Math.cos(a)*0.15, Math.sin(a)*0.15, 0.028, sanderDisc, false);
    }
    sander.traverse((n) => { if (n instanceof THREE.Mesh) n.castShadow = true; });
    mesh(RB(2.6, 0.08, 2.2, 0.04), MAT.ink, SAND_X - 0.8, FLOOR + 0.04, 1.4, scene, false);
    mesh(RB(1.4, 0.9, 0.8, 0.08), MAT.white, SAND_X - 1.9, FLOOR + 0.45, -2.6);
    mesh(RB(1.5, 0.12, 0.9, 0.05), MAT.orange, SAND_X - 1.9, FLOOR + 0.96, -2.6);

    let blastNozzle: THREE.Group;
    // 02 Sablage : cabine ouverte en façade
    {
      const x = BLAST_X, w = 3.6, d = 3.8, h = 4.7, cab = new THREE.Group(); cab.position.set(x, FLOOR, 0); scene.add(cab);
      const m = MAT.blueSoft;
      mesh(RB(w, h, 0.22, 0.1), m, 0, h / 2, -d / 2, cab);
      for (const s of [-1, 1]) {
        mesh(RB(0.22, h, 0.8, 0.08), m, s * w / 2, h / 2, -d / 2 + 0.4, cab);
        mesh(RB(0.22, h, 0.8, 0.08), m, s * w / 2, h / 2, d / 2 - 0.4, cab);
        mesh(RB(0.22, 0.6, d, 0.08), m, s * w / 2, h - 0.3, 0, cab);
      }
      mesh(RB(w + 0.2, 0.22, d / 2 - 0.2, 0.08), m, 0, h + 0.05, -d / 4 - 0.1, cab);
      mesh(RB(w + 0.2, 0.22, d / 2 - 0.2, 0.08), m, 0, h + 0.05, d / 4 + 0.1, cab);
      mesh(RB(w, 0.95, 0.22, 0.08), MAT.blue, 0, 0.47, d / 2, cab);
      mesh(RB(w - 0.2, 0.06, d - 0.2, 0.03), M('#c9b89a', 0.95), 0, 0.03, 0, cab, false);
      const nozzle = new THREE.Group(); nozzle.position.set(0.9, 2.6, -d / 2 + 0.25); cab.add(nozzle);
      mesh(track(new THREE.CylinderGeometry(0.06, 0.09, 0.5, 12)).rotateX(Math.PI / 2), MAT.ink, 0, 0, 0.2, nozzle);
      mesh(track(new THREE.TorusGeometry(0.5, 0.05, 8, 24, Math.PI)), MAT.ink, 0.5, -0.02, 0, nozzle).rotation.x = Math.PI / 2;
      const lamp = mesh(RB(1.4, 0.08, 0.24, 0.04), track(new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 1.2 })), 0, h - 0.12, -d / 2 + 0.6, cab, false);
      blastNozzle = nozzle;
    }

    // 03 Peinture : mur filtrant + caillebotis + peintre
    {
      const x = PAINT_X, wall = new THREE.Group(); wall.position.set(x, FLOOR, -3.9); scene.add(wall);
      mesh(RB(4.6, 3.8, 0.3, 0.12), MAT.warm, 0, 1.9, 0, wall);
      const fm = M('#f6d8c5', 0.9);
      for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) mesh(RB(1.3, 1.5, 0.1, 0.08), fm, (a - 1) * 1.42, 1.1 + b * 1.62, 0.17, wall);
      mesh(RB(3.4, 0.06, 2.4, 0.03), M('#cfcac2', 0.8), x - 0.9, FLOOR + 0.03, 1.7, scene, false);
    }
    const painter = makeWorker({ kind: 'painter', suit: C.blue, dark: '#20262f', accent: C.orange });
    painter.g.scale.setScalar(1.25);
    scene.add(painter.g);
    const gun = new THREE.Group(); gun.position.set(0, -0.09, 0.03); painter.arms[1].hand.add(gun);
    mesh(RB(0.085, 0.12, 0.26, 0.035, 3), MAT.ink, 0, 0.03, 0.06, gun);
    mesh(RB(0.06, 0.17, 0.075, 0.025, 2), MAT.inkDeep, 0, -0.08, -0.02, gun);
    mesh(track(new THREE.CylinderGeometry(0.022, 0.034, 0.13, 16)).rotateX(Math.PI / 2), MAT.steelDark, 0, 0.04, 0.25, gun);
    mesh(track(new THREE.CylinderGeometry(0.08, 0.066, 0.17, 24)), MAT.orange, 0, 0.17, 0.02, gun);
    mesh(track(new THREE.CylinderGeometry(0.085, 0.085, 0.03, 24)), MAT.ink, 0, 0.26, 0.02, gun);
    const gunTip = new THREE.Object3D(); gunTip.position.set(0, 0.04, 0.33); gun.add(gunTip);
    gun.traverse((n) => { if (n instanceof THREE.Mesh) n.castShadow = true; });

    const ovenStrips: Array<{ pivot: THREE.Group; x: number; z: number; phase: number }> = [];
    const ovenLight = new THREE.PointLight('#ff7a2a', 0, 7, 2);
    // 04 Cuisson : four fermé, rideau à lanières, hublot
    {
      const x = OVEN_X, w = 4.2, d = 4.2, h = 4.8, ov = new THREE.Group(); ov.position.set(x, FLOOR, 0); scene.add(ov);
      const m = MAT.warm;
      mesh(RB(w, h, 0.26, 0.12), m, 0, h / 2, -d / 2, ov);
      mesh(RB(w, h, 0.26, 0.12), m, 0, h / 2, d / 2, ov);
      for (const s of [-1, 1]) {
        mesh(RB(0.26, h, 1.2, 0.1), m, s * w / 2, h / 2, -d / 2 + 0.6, ov);
        mesh(RB(0.26, h, 1.2, 0.1), m, s * w / 2, h / 2, d / 2 - 0.6, ov);
        mesh(RB(0.26, 0.5, d, 0.1), m, s * w / 2, h - 0.25, 0, ov);
        for (let k = 0; k < 7; k++) {
          const pivot = new THREE.Group(); pivot.position.set(s*(w/2+0.02),h-0.55,-0.75+k*0.25); ov.add(pivot);
          mesh(RB(0.04,h-0.6,0.24,0.02,2),MAT.curtain,0,-(h-0.6)/2,0,pivot,false);
          ovenStrips.push({pivot, x:x+s*(w/2+0.02), z:-0.75+k*0.25, phase:k*0.3});
        }
      }
      mesh(RB(w + 0.2, 0.3, d / 2 - 0.2, 0.12), m, 0, h + 0.08, -d / 4 - 0.1, ov);
      mesh(RB(w + 0.2, 0.3, d / 2 - 0.2, 0.12), m, 0, h + 0.08, d / 4 + 0.1, ov);
      mesh(track(new THREE.CylinderGeometry(0.32, 0.32, 1.4, 24)), MAT.white, 1.3, h + 0.8, -1.2, ov);
      mesh(track(new THREE.TorusGeometry(0.34, 0.06, 10, 24)), MAT.orange, 1.3, h + 1.5, -1.2, ov).rotation.x = Math.PI / 2;
      const port = mesh(track(new THREE.CircleGeometry(0.62, 40)), MAT.glow, -0.6, 2.6, d / 2 + 0.14, ov, false);
      mesh(track(new THREE.TorusGeometry(0.66, 0.1, 12, 40)), MAT.ink, -0.6, 2.6, d / 2 + 0.15, ov);
      const disp = canvasTex(256, 128, (g, W, H) => { g.fillStyle = '#2a2a2a'; g.beginPath(); g.roundRect(0, 0, W, H, 22); g.fill(); g.fillStyle = '#ff8a3d'; g.font = `64px ${displayFont}`; g.textBaseline = 'middle'; g.fillText('180°', 28, H / 2 + 4); });
      mesh(track(new THREE.PlaneGeometry(1.0, 0.5)), track(new THREE.MeshStandardMaterial({ map: disp, roughness: 0.4, emissive: '#ffffff', emissiveMap: disp, emissiveIntensity: 0.35 })), 1.05, 2.9, d / 2 + 0.14, ov, false);
      ovenLight.position.set(x - 0.6, 2.6, d / 2 + 1.2); scene.add(ovenLight);
    }
    // 05 Contrôle : desserte de pièces finies
    mesh(RB(2.2, 0.8, 1.2, 0.1), MAT.white, CHECK_X + 1.2, FLOOR + 0.4, -2.4);
    for (let i = 0; i < 3; i++) mesh(RB(1.2, 0.1, 0.9, 0.04), M(PAINTS[i].c, 0.3, 0, {}), CHECK_X + 1.2, FLOOR + 0.86 + i * 0.12, -2.4).rotation.y = i * 0.12 - 0.1;

    /* Flexible air lines, updated in-place: no geometry allocation per frame. */
    function makeHose(tool: THREE.Object3D, w: Worker, anchor: THREE.Vector3, radius: number) {
      const points = Array.from({length:5},()=>new THREE.Vector3());
      const curve = new THREE.CatmullRomCurve3(points);
      const segments=40, sides=8;
      const positions=new Float32Array((segments+1)*(sides+1)*3), normals=new Float32Array(positions.length), indices=[];
      for(let i=0;i<segments;i++) for(let j=0;j<sides;j++) { const a=i*(sides+1)+j,b=a+sides+1; indices.push(a,b,a+1,b,b+1,a+1); }
      const geo=track(new THREE.BufferGeometry());
      geo.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute('normal',new THREE.BufferAttribute(normals,3).setUsage(THREE.DynamicDrawUsage)); geo.setIndex(indices);
      const hose=mesh(geo,M('#373b40',0.82),0,0,0,scene,false); hose.frustumCulled=false;
      const center=new THREE.Vector3(), tangent=new THREE.Vector3(), side=new THREE.Vector3(), normal=new THREE.Vector3();
      return { update() {
        tool.updateWorldMatrix(true,false); points[0].set(0,-0.18,-0.03); tool.localToWorld(points[0]);
        points[1].set(0.68,0.78,0.48); w.g.localToWorld(points[1]);
        points[2].set(w.g.position.x-0.65,FLOOR+0.035,w.g.position.z+0.38);
        points[3].set(anchor.x-0.65,FLOOR+0.035,anchor.z+0.3); points[4].copy(anchor);
        for(let i=0;i<=segments;i++) {
          curve.getPoint(i/segments,center);
          const onPaint = center.x>PAINT_X-2.6 && center.x<PAINT_X+0.8 && center.z>0.5 && center.z<2.9;
          const onSand = center.x>SAND_X-2.1 && center.x<SAND_X+0.5 && center.z>0.3 && center.z<2.5;
          center.y=Math.max(FLOOR+(onSand?0.08:onPaint?0.06:0)+radius+0.003,center.y);
          curve.getTangent(i/segments,tangent); side.crossVectors(tangent,UP);
          if(side.lengthSq()<0.001)side.set(1,0,0);else side.normalize(); normal.crossVectors(side,tangent).normalize();
          for(let j=0;j<=sides;j++) {const a=j/sides*Math.PI*2,idx=(i*(sides+1)+j)*3;
            for(let k=0;k<3;k++){const n=side.getComponent(k)*Math.cos(a)+normal.getComponent(k)*Math.sin(a);positions[idx+k]=center.getComponent(k)+radius*n;normals[idx+k]=n;}
          }
        }
        geo.attributes.position.needsUpdate=true;geo.attributes.normal.needsUpdate=true;
      }};
    }
    const painterHose=makeHose(gun,painter,new THREE.Vector3(PAINT_X-1.25,FLOOR+0.06,2.3),0.022);
    const sanderHose=makeHose(sander,sanderGuy,new THREE.Vector3(SAND_X-1.8,FLOOR+0.06,2.1),0.019);

    /* ---------------- Particules ---------------- */
    function particles(count: number, geo: THREE.BufferGeometry, mat: THREE.Material) {
      const im = track(new THREE.InstancedMesh(geo, mat, count)); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.castShadow = false; im.frustumCulled = false; scene.add(im);
      const P = Array.from({ length: count }, () => ({ life: 0, max: 1, p: new THREE.Vector3(), v: new THREE.Vector3(), s: 1, g: 9, d: 1.2 }));
      let head = 0; const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
      return {
        emit(pos: THREE.Vector3, vel: THREE.Vector3, { life = 1, size = 1, grav = 9, drag = 1.2 } = {}) { const o = P[head]; head = (head + 1) % count; o.p.copy(pos); o.v.copy(vel); o.life = o.max = life; o.s = size; o.g = grav; o.d = drag; },
        update(dt: number) {
          for (let i = 0; i < count; i++) {
            const o = P[i];
            if (o.life > 0) { o.life -= dt; o.v.y -= o.g * dt; o.v.multiplyScalar(Math.exp(-o.d * dt)); o.p.addScaledVector(o.v, dt); if (o.p.y < FLOOR + 0.05) { o.p.y = FLOOR + 0.05; o.v.set(0, 0, 0); } }
            const k = o.life > 0 ? (o.d === 0 ? 1 : Math.min(1, o.life / o.max * 3)) * o.s : 0;
            sc.setScalar(k); m4.compose(o.p, q, sc); im.setMatrixAt(i, m4);
          }
          im.instanceMatrix.needsUpdate = true;
        }
      };
    }
    const grain = track(new THREE.IcosahedronGeometry(0.05, 0));
    const sand = particles(420, grain, M('#d8c39c', 0.9));
    const dust = particles(60, track(new THREE.IcosahedronGeometry(0.32, 1)), track(new THREE.MeshStandardMaterial({ color: '#e7dccb', roughness: 1, transparent: true, opacity: 0.28, depthWrite: false })));
    const sparks = particles(160, track(new THREE.IcosahedronGeometry(0.035, 0)), track(new THREE.MeshStandardMaterial({ color: '#ffb35c', emissive: '#ff8a2a', emissiveIntensity: 2.4 })));
    const sprayMats = PAINTS.map((p) => M(p.c, 0.5));
    const spray = PAINTS.map((p, i) => particles(260, grain, sprayMats[i]));


    /* ---------------- Animation ---------------- */
    const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), tipW = new THREE.Vector3();

    function partState(x: number) {
      const rust = 1 - 0.35 * smooth(SAND_X - 0.9, SAND_X + 0.9, x) - 0.65 * smooth(BLAST_X - 1.4, BLAST_X + 1.1, x);
      const bare = 1 - rust;
      const paint = smooth(PAINT_X - 1.15, PAINT_X + 1.0, x);
      const cure = smooth(OVEN_X - 1.6, OVEN_X + 1.6, x);
      const heat = Math.max(0, 1 - Math.abs(x - OVEN_X) / 2.1);
      return { rust, bare, paint, cure, heat };
    }

    function updateCarrier(c: Carrier, T: number) {
      const x = LINE0 + ((T * SPEED + c.offset) % LINE_LEN + LINE_LEN) % LINE_LEN;
      c.root.position.x = x; c.x = x;
      const st = partState(x), m = c.mat;
      m.rust.value = st.rust;
      m.color.copy(whiteC).lerp(steelC, st.bare).lerp(c.paint, st.paint);
      m.metalness = lerp(lerp(0.2, 0.75, st.bare), c.dark ? 0.25 : 0.05, st.paint);
      m.roughness = lerp(lerp(0.95, 0.38, st.bare), lerp(0.62, 0.26, st.cure), st.paint);
      m.clearcoat = st.paint * st.cure * 0.7;
      m.emissiveIntensity = st.heat * 0.45;
      // balancement : plus marqué à l'entrée des postes
      const kick = Math.exp(-Math.pow((x - BLAST_X - 1.9) * 1.2, 2)) + Math.exp(-Math.pow((x - OVEN_X - 2.2) * 1.2, 2));
      c.sway.rotation.z = Math.sin(T * 1.7 + c.seed) * (0.012 + kick * 0.035);
      c.sway.rotation.y = Math.sin(T * 0.6 + c.seed) * 0.065 + 0.18;
      // étiquette de contrôle
      const tagK = smooth(CHECK_X - 0.6, CHECK_X + 0.4, x) * (1 - smooth(CHECK_X + 3.6, CHECK_X + 4.6, x));
      c.tag.visible = tagK > 0.01;
      if (c.tag.visible) { c.tag.position.set(x, RAIL_Y - 0.9, 0.5); const pop = 1; c.tag.scale.set(2.56 * tagK * pop, 1.0 * tagK * pop, 1); c.tag.material.opacity = tagK; }
    }

    /* ---------------- Character choreography ----------------
       Feet stay in world space during stance. One foot moves at a time, with a
       smooth lift/plant; knees solve back to the anchors. This also handles turns. */
    const footDesired = new THREE.Vector3(), gaitVelocity = new THREE.Vector3(), kneePole = new THREE.Vector3(0, 0, 1);
    function plantFeet(w: Worker, dt: number, floorY: number) {
      const scale = w.g.scale.x;
      w.g.updateWorldMatrix(true, true);
      if (!w.gait) {
        w.gait = { last: w.g.position.clone(), distance: 0, active: -1,
          feet: w.legs.map(l => ({ p: w.g.localToWorld(new THREE.Vector3(l.s*0.17, 0.125, 0.035)),
            from: new THREE.Vector3(), to: new THREE.Vector3(), progress: 1, duration: 0.38,
            yaw: w.g.rotation.y, fromYaw: w.g.rotation.y, toYaw: w.g.rotation.y })) };
      }
      const gait = w.gait;
      gaitVelocity.subVectors(w.g.position, gait.last).divideScalar(Math.max(dt, 1e-5));
      const speed = gaitVelocity.length(); gait.distance += w.g.position.distanceTo(gait.last); gait.last.copy(w.g.position);
      const ankleY = floorY + 0.125 * scale;
      // Start the most-needed step, never drag both feet together.
      let candidate = -1, largest = 0.17;
      for (let i=0; i<2; i++) {
        footDesired.set(w.legs[i].s*0.18, 0.125, i ? 0.07 : -0.04); w.g.localToWorld(footDesired); footDesired.y = ankleY;
        const error = footDesired.distanceTo(gait.feet[i].p);
        if (error > largest) { largest = error; candidate = i; }
      }
      if (gait.active < 0 && candidate >= 0) {
        const f = gait.feet[candidate];
        f.from.copy(f.p); f.to.set(w.legs[candidate].s*0.18, 0.125, candidate ? 0.07 : -0.04); w.g.localToWorld(f.to);
        f.to.addScaledVector(gaitVelocity, 0.24); f.to.y = ankleY;
        f.progress = 0; f.duration = speed > 0.5 ? 0.22 : 0.38;
        f.fromYaw = f.yaw; f.toYaw = w.g.rotation.y; gait.active = candidate;
      }
      for (let i=0; i<2; i++) {
        const l = w.legs[i], f = gait.feet[i];
        if (i === gait.active) {
          f.progress = Math.min(1, f.progress + dt/f.duration);
          const u = ease5(f.progress);
          f.p.lerpVectors(f.from, f.to, u); f.p.y += Math.sin(Math.PI*f.progress)**2 * (speed > 0.5 ? 0.14 : 0.075);
          f.yaw = dampAngle(f.fromYaw, f.toYaw, u);
          if (f.progress === 1) gait.active = -1;
        } else f.p.y = ankleY;
        solveLimb(l.hip, l.knee, f.p, 0.47, 0.44, kneePole);
        l.knee.getWorldQuaternion(parentQ).invert();
        _q1.setFromAxisAngle(UP, f.yaw); l.foot.quaternion.copy(parentQ).multiply(_q1);
      }
      return { speed, phase: gait.distance * 8 };
    }
    function posture(w: Worker, T: number, dt: number, effort: number) {
      const k = damp(5, dt);
      w.body.position.y = -0.065 + Math.sin(T*1.65)*0.005;
      w.pelvis.rotation.z = Math.sin(T*0.9)*0.012;
      w.spine.rotation.x = lerp(w.spine.rotation.x, 0.035 + effort*0.065 + Math.sin(T*1.65)*0.008, k);
      w.spine.rotation.y = lerp(w.spine.rotation.y, effort*0.065, k);
    }
    const ENTER = 6.2;
    const painterHome = new THREE.Vector3(PAINT_X - 0.42, FLOOR + 0.06, 1.4);
    const painterStart = new THREE.Vector3(PAINT_X - 3.6, FLOOR + 0.06, 5.1);
    const lookTmp = new THREE.Vector3(), workPoint = new THREE.Vector3(), wrist = new THREE.Vector3();
    const shoulderW = new THREE.Vector3(), toolDirection = new THREE.Vector3(), toolOffset = new THREE.Vector3();
    const toolMatrix = new THREE.Matrix4(), toolQ = new THREE.Quaternion(), toolOrigin = new THREE.Vector3();
    const supportPoint = new THREE.Vector3();
    const painterTrack = new THREE.Vector3(PAINT_X, 2.6, 0.15);
    const sanderTrack = new THREE.Vector3(SAND_X, 2.5, 0.15);
    let painterBlend = 0, sanderBlend = 0, discSpeed = 0;

    // Pick an actual surface point in part-local space (including its suspension sway).
    function surfacePoint(c: Carrier, time: number, out: THREE.Vector3, sanding = false) {
      const sweep = Math.sin(time * (sanding ? 2.4 : 2.1));
      if (c.shape === 1) {
        const a = time*1.5;
        out.set(Math.cos(a)*0.73, -1.08 + Math.sin(a)*0.73, 0.23);
      } else if (c.shape === 2) out.set(0.04, -1.0 + sweep*0.46, 0.46);
      else out.set(Math.sin(time*1.1)*0.3, -1.03 + sweep*0.6, 0.072);
      c.body.updateWorldMatrix(true, false); return c.body.localToWorld(out);
    }
    function trackHead(w: Worker, point: THREE.Vector3, dt: number) {
      lookTmp.copy(point); w.spine.worldToLocal(lookTmp); lookTmp.sub(w.head.position);
      w.head.rotation.y = dampAngle(w.head.rotation.y, THREE.MathUtils.clamp(Math.atan2(lookTmp.x, lookTmp.z), -0.45, 0.45), damp(7, dt));
      w.head.rotation.x = lerp(w.head.rotation.x, THREE.MathUtils.clamp(-Math.atan2(lookTmp.y, Math.hypot(lookTmp.x, lookTmp.z)), -0.3, 0.32), damp(6, dt));
    }
    function toolPose(w: Worker, tool: THREE.Object3D, target: THREE.Vector3, blend: number, contact: boolean, dt: number) {
      const arm = w.arms[1], scale = w.g.scale.x;
      w.g.updateWorldMatrix(true, true);
      arm.shoulder.getWorldPosition(shoulderW);
      toolDirection.subVectors(target, shoulderW).normalize();
      if (contact && w.contactNormal) toolDirection.copy(w.contactNormal).negate();
      // Keep the tool upright; rotate the wrist, not the tool independently of its grip.
      toolMatrix.lookAt(toolDirection, ZERO, UP); toolQ.setFromRotationMatrix(toolMatrix);
      if (contact) {
        toolOrigin.copy(target).addScaledVector(toolDirection, -0.185*scale);
      } else toolOrigin.copy(shoulderW).addScaledVector(toolDirection, 0.63);
      toolOffset.copy(tool.position).multiplyScalar(scale).applyQuaternion(toolQ);
      wrist.copy(toolOrigin).sub(toolOffset);
      // Anticipation/release is a smooth hand trajectory, not an on/off shoulder pose.
      workPoint.set(0.38, 1.36, 0.38); w.g.localToWorld(workPoint);
      wrist.lerpVectors(workPoint, wrist, blend);
      if (!w.toolMotion) w.toolMotion = { wrist: arm.hand.getWorldPosition(new THREE.Vector3()), support: w.arms[0].hand.getWorldPosition(new THREE.Vector3()), rotation: arm.hand.getWorldQuaternion(new THREE.Quaternion()) };
      w.toolMotion.wrist.lerp(wrist, damp(18, dt));
      w.toolMotion.rotation.slerp(toolQ, damp(14, dt));
      toolQ.copy(w.toolMotion.rotation);
      aimArm(arm, w.toolMotion.wrist);
      arm.elbow.getWorldQuaternion(parentQ).invert(); arm.hand.quaternion.copy(parentQ).multiply(toolQ);
      tool.quaternion.identity();
      w.g.updateWorldMatrix(true, true);
      supportPoint.set(-0.14, contact ? 0.04 : -0.11, contact ? 0.015 : -0.055); tool.localToWorld(supportPoint);
      workPoint.set(-0.35, 1.21, 0.25); w.g.localToWorld(workPoint); supportPoint.lerpVectors(workPoint, supportPoint, blend);
      w.toolMotion.support.lerp(supportPoint, damp(18, dt));
      aimArm(w.arms[0], w.toolMotion.support);
      w.arms[0].elbow.getWorldQuaternion(parentQ).invert(); w.arms[0].hand.quaternion.copy(parentQ).multiply(toolQ);
    }
    function updatePainter(T: number, dt: number) {
      const arrival = ease5(T/ENTER);
      painter.g.position.lerpVectors(painterStart, painterHome, arrival);
      const walking = T < ENTER;
      const walkYaw = Math.atan2(painterHome.x-painterStart.x, painterHome.z-painterStart.z);
      const target = carriers.find(c => c.x > PAINT_X-1.45 && c.x < PAINT_X+1.35);
      if (target) surfacePoint(target, T, workPoint); else workPoint.set(PAINT_X, 2.6, 0.15);
      painterTrack.lerp(workPoint, damp(9, dt));
      const yaw = Math.atan2(painterTrack.x-painter.g.position.x, painterTrack.z-painter.g.position.z);
      if (T < 0.05) painter.g.rotation.y = walkYaw;
      painter.g.rotation.y = dampAngle(painter.g.rotation.y, dampAngle(walkYaw, yaw, smooth(ENTER-1, ENTER+0.25, T)), damp(3.8, dt));
      const activity = target && !walking ? smooth(PAINT_X-1.45, PAINT_X-1.05, target.x)*(1-smooth(PAINT_X+0.85, PAINT_X+1.35, target.x)) : 0;
      painterBlend = lerp(painterBlend, activity, damp(10, dt));
      posture(painter, T, dt, painterBlend);
      const gait = plantFeet(painter, dt, FLOOR+0.06);
      if (walking) {
        const swing = Math.sin(gait.phase)*Math.min(1,gait.speed)*0.22;
        restArm(painter.arms[0], swing, damp(12,dt));
        restArm(painter.arms[1], -0.35-swing*0.45, damp(12,dt), -0.65);
      } else toolPose(painter, gun, painterTrack, painterBlend, false, dt);
      painter.g.updateWorldMatrix(true, true); trackHead(painter, painterTrack, dt);
      const spraying = !!target && painterBlend>0.7 && activity>0.65;
      return { spraying, target: painterTrack, carrier: target, intensity: painterBlend };
    }
    function updateSander(T: number, dt: number) {
      const w = sanderGuy;
      const target = carriers.find(c => Math.abs(c.x-SAND_X)<0.92);
      if (target) {
        surfacePoint(target, T, workPoint, true);
        if (!w.contactNormal) w.contactNormal = new THREE.Vector3();
        w.contactNormal.set(0,0,1).transformDirection(target.body.matrixWorld);
      } else workPoint.set(SAND_X, 2.5, 0.18);
      sanderTrack.lerp(workPoint, damp(13,dt));
      const activity = target ? 1-smooth(0.55,0.92,Math.abs(target.x-SAND_X)) : 0;
      sanderBlend = lerp(sanderBlend, activity, damp(11,dt));
      w.g.position.x = lerp(w.g.position.x, SAND_X-0.1 + (target ? (target.x-SAND_X)*0.4 : 0), damp(3,dt));
      w.g.rotation.y = dampAngle(w.g.rotation.y, Math.atan2(sanderTrack.x-w.g.position.x, sanderTrack.z-w.g.position.z), damp(3.5,dt));
      posture(w, T+0.8, dt, sanderBlend); plantFeet(w, dt, FLOOR+0.08);
      toolPose(w, sander, sanderTrack, sanderBlend, true, dt);
      w.g.updateWorldMatrix(true,true); trackHead(w, sanderTrack, dt);
      discSpeed = lerp(discSpeed, activity>0.3 ? 48 : 0, damp(5,dt));
      sanderDisc.rotation.z += dt*discSpeed;
      workPoint.set(0,0,0.185); sander.localToWorld(workPoint);
      return { sanding: !!target && sanderBlend>0.75 && workPoint.distanceTo(sanderTrack)<0.18, target: workPoint.clone(), intensity: sanderBlend };
    }

    const rnd = mulberry(83);
    const emissionRemainder = new Map<string, number>();
    function emission(key: string, rate: number, dt: number) { const n = (emissionRemainder.get(key)||0)+rate*dt; emissionRemainder.set(key,n%1); return Math.floor(n); }
    /* Éventail du jet (cône translucide de la buse jusqu'à la pièce) */
    function fan(color: THREE.ColorRepresentation, opacity: number, radius: number) {
      const geo = track(new THREE.ConeGeometry(radius, 1, 32, 1, true)); geo.translate(0, -0.5, 0); geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, track(new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, fog: false })));
      m.visible = false; m.renderOrder = 5; scene.add(m); return Object.assign(m, { baseOpacity: opacity });
    }
    const paintFans = PAINTS.map((p) => fan(p.c, 0.085, 0.24));
    const sandFan = fan('#e6d6b8', 0.13, 0.30);
    function aimFan(f: ReturnType<typeof fan>, from: THREE.Vector3, to: THREE.Vector3, on: boolean, T: number) {
      f.visible = on; if (!on) return;
      f.position.copy(from); f.lookAt(to); f.scale.set(1, 1, from.distanceTo(to));
      f.material.opacity = f.baseOpacity * (0.96 + Math.sin(T * 9) * 0.04);
    }
    const _v = new THREE.Vector3(), _p = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3();
    /* Jet orienté : chaque goutte part de la buse, file vers la cible et s'éteint au contact de la pièce */
    function jet(sys: ReturnType<typeof particles>, from: THREE.Vector3, to: THREE.Vector3, count: number, speed: number, spread: number, size: number) {
      const d = _v.subVectors(to, from); const dist = Math.max(0.001, d.length()); d.divideScalar(dist);
      _a.set(0, 1, 0).cross(d); if (_a.lengthSq() < 1e-4) _a.set(1, 0, 0); _a.normalize(); _b.crossVectors(d, _a);
      const lat = spread * speed / dist;
      for (let i = 0; i < count; i++) {
        const r = Math.sqrt(rnd()) * lat, th = rnd() * Math.PI * 2;
        const v = d.clone().multiplyScalar(speed * (0.9 + rnd() * 0.2)).addScaledVector(_a, Math.cos(th) * r).addScaledVector(_b, Math.sin(th) * r);
        sys.emit(from, v, { life: dist / speed * (0.92 + rnd() * 0.08), size: size * (0.7 + rnd() * 0.6), grav: 0, drag: 0 });
      }
    }
    function emitEffects(T: number, dt: number, ps: ReturnType<typeof updatePainter>, ss: ReturnType<typeof updateSander>) {
      let fanIdx = -1;
      if (ps.spraying && ps.carrier) {
        gunTip.getWorldPosition(tipW);
        const idx = carriers.indexOf(ps.carrier) % PAINTS.length; fanIdx = idx;
        aimFan(paintFans[idx], tipW, ps.target, true, T);
        jet(spray[idx], tipW, ps.target, emission("paint", 290*ps.intensity, dt), 7.5, 0.22, 0.34);
      }
      paintFans.forEach((f, i) => { if (i !== fanIdx) f.visible = false; });
      if (ss.sanding) {
        for (let i = 0, n = emission("sparks", 95*ss.intensity, dt); i < n; i++) sparks.emit(ss.target, tmp.set((rnd() - .5) * 4, 0.5 + rnd() * 2.5, 0.6 + rnd() * 2.2), { life: 0.35 + rnd() * 0.25, size: 0.6, grav: 9 });
        if (rnd() < 1-Math.exp(-5*dt)) dust.emit(ss.target, tmp.set((rnd() - .5) * 0.6, 0.4, 0.6), { life: 1.8, size: 0.6 + rnd() * 0.4, grav: -0.05 });
      }
      const inCab = carriers.find((c) => Math.abs(c.x - BLAST_X) < 1.1);
      if (!inCab) sandFan.visible = false;
      if (inCab) {
        const nz = blastNozzle; nz.getWorldPosition(tipW);
        const tgt = _p.set(inCab.x + Math.sin(T * 2.3) * 0.3, RAIL_Y - 2.9 + Math.sin(T * 5) * 0.6, -0.12);
        jet(sand, tipW, tgt, emission("blast", 360, dt), 10, 0.26, 0.65);
        aimFan(sandFan, tipW, tgt, true, T);
        for (let i = 0, n = emission("rebound", 150, dt); i < n; i++) sand.emit(tgt, tmp.set((rnd() - .5) * 2.4, rnd() * 1.6 - 0.4, -0.4 - rnd() * 1.4), { life: 0.6 + rnd() * 0.4, size: 0.6 + rnd() * 0.5, grav: 9 });
        if (rnd() < 1-Math.exp(-8*dt)) dust.emit(tgt.clone().add(tmp.set((rnd() - .5) * 1.4, -0.6, -0.3)), tmp.set((rnd() - .5) * 0.6, 0.3, 0.2), { life: 2.2, size: 0.8 + rnd() * 0.6, grav: -0.06 });
      }
    }


    /* ---------------- Camera, quality and lifecycle ---------------- */
    const hero = canvas.closest<HTMLElement>("[data-hero]");
    const content = hero?.querySelector<HTMLElement>(".hero-inner");
    const title = hero?.querySelector<HTMLElement>(".hero-title");
    const body = hero?.querySelector<HTMLElement>(".hero-body");
    const mouse = new THREE.Vector2(), mouseS = new THREE.Vector2();
    const cameraBase = new THREE.Vector3();
    let composer: EffectComposer | undefined;
    let useAO = false;
    let W = 0, H = 0;
    let frame = 0;
    let T = 0;
    let last = performance.now();
    let visible = false;
    let renderNeeded = true;
    let running = !reduce;
    let accumulator = 0;
    let renderDt = 1 / 60;
    const FIXED_DT = 1 / 60;

    function createComposer() {
      const next = track(new EffectComposer(renderer));
      next.addPass(track(new RenderPass(scene, camera)));
      const gtao = track(new GTAOPass(scene, camera, 1, 1));
      // r170 GTAOPass.dispose omits these two shader materials.
      track(gtao.gtaoMaterial);
      track(gtao.blendMaterial);
      gtao.updateGtaoMaterial({ radius: 0.9, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: 12 });
      gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
      gtao.blendIntensity = 0.75;
      next.addPass(gtao);
      const output = track(new OutputPass());
      // Render targets contain premultiplied alpha. Convert straight RGB through
      // ACES/sRGB, then premultiply again for the canvas/browser compositor.
      // Otherwise the partially transparent floor acquires a dark fringe.
      output.material.fragmentShader = output.material.fragmentShader
        .replace('gl_FragColor = texture2D( tDiffuse, vUv );',
          `gl_FragColor = texture2D( tDiffuse, vUv );
          gl_FragColor.rgb /= max(gl_FragColor.a, 0.00001);`)
        .replace(/\n\s*}\s*$/, '\n gl_FragColor.rgb *= gl_FragColor.a;\n }');
      next.addPass(output);
      return next;
    }

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      accumulator = 0;
    }
    function schedule() {
      if (disposed || !visible || document.hidden || frame || (!running && !renderNeeded && !cameraMoving())) return;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    }
    function resize() {
      if (disposed) return;
      W = Math.max(1, canvas.clientWidth);
      H = Math.max(1, canvas.clientHeight);
      const small = isSmall();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.75));
      renderer.setSize(W, H, false);
      renderer.shadowMap.enabled = !small;
      sun.castShadow = top.castShadow = !small;
      // Free desktop-only shadow buffers when switching to a mobile viewport.
      if (small) {
        for (const light of [sun, top]) {
          light.shadow.map?.dispose();
          light.shadow.map = null;
          light.shadow.mapPass?.dispose();
          light.shadow.mapPass = null;
        }
      }
      useAO = !small && H > 500;
      if (useAO) {
        composer ??= createComposer();
        composer.setPixelRatio(renderer.getPixelRatio());
        composer.setSize(W, H);
      } else if (composer) {
        // Do not retain large render targets after rotating/resizing to mobile.
        for (const pass of composer.passes) {
          if (pass instanceof GTAOPass) {
            pass.gtaoMaterial.dispose(); resources.delete(pass.gtaoMaterial);
            pass.blendMaterial.dispose(); resources.delete(pass.blendMaterial);
          }
          pass.dispose(); resources.delete(pass);
        }
        composer.dispose(); resources.delete(composer);
        composer = undefined;
      }

      const heroTop = hero?.getBoundingClientRect().top ?? 0;
      const titleBottom = title ? title.getBoundingClientRect().bottom - heroTop : H * 0.3;
      // Measure wrappers, not the paragraph / CTA children translated by GSAP.
      const contentBottom = (body ?? content)?.getBoundingClientRect().bottom;
      const framing = frameWorkshop(camera, W, H, {
        titleBottom,
        contentBottom: contentBottom === undefined ? H * 0.55 : contentBottom - heroTop,
      });
      // Clip the full-size canvas through the actual H1, then fade it in under
      // the paragraph. Changing this mask never changes the observed layout.
      canvas.style.maskImage = `linear-gradient(to bottom, transparent ${titleBottom}px, #000 ${titleBottom + 64}px)`;
      camTarget.copy(framing.target);
      cameraBase.copy(framing.base);
      // Camera retreat must not put the entire workshop inside white fog.
      scene.fog = new THREE.Fog('#ffffff', framing.distance + 18, framing.distance + 65);
      renderNeeded = true;
      schedule();
    }

    function step(dt: number) {
      T += dt;
      for (const c of carriers) updateCarrier(c, T);
      const ps = updatePainter(T, dt), ss = updateSander(T, dt);
      emitEffects(T, dt, ps, ss);
      painterHose.update(); sanderHose.update();
      for (const strip of ovenStrips) {
        const proximity = carriers.reduce((m, c) => Math.max(m, Math.exp(-(((c.x - strip.x) / 0.48) ** 2))), 0);
        const centerWeight = 1 - smooth(0.35, 0.95, Math.abs(strip.z));
        const angle = -proximity * centerWeight * 0.3 + Math.sin(T * 2.2 + strip.phase) * 0.006;
        strip.pivot.rotation.z = lerp(strip.pivot.rotation.z, angle, damp(7, dt));
      }
      sand.update(dt); dust.update(dt); sparks.update(dt); spray.forEach((s) => s.update(dt));
      const heat = carriers.reduce((a, c) => Math.max(a, Math.max(0, 1 - Math.abs(c.x - OVEN_X) / 2.2)), 0);
      MAT.glow.emissiveIntensity = 1.4 + heat * 1.6 + Math.sin(T * 3) * 0.15;
      ovenLight.intensity = 6 + heat * 14;
    }
    function cameraMoving() {
      return running && !reduce && mouseS.distanceToSquared(mouse) > 1e-6;
    }
    function render() {
      if (reduce) mouseS.set(0, 0);
      else if (running) mouseS.lerp(mouse, damp(3, renderDt));
      camera.position.copy(camTarget).add(cameraBase).add(tmp.set(mouseS.x * 0.9, -mouseS.y * 0.5, -mouseS.x * 0.5));
      camera.lookAt(camTarget);
      if (useAO && composer) composer.render();
      else renderer.render(scene, camera);
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(tagScene, camera);
      renderer.autoClear = true;
      canvas.style.visibility = "visible";
      renderNeeded = false;
    }
    function loop(now: number) {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      try {
        const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
        last = now;
        renderDt = dt;
        if (running) {
          accumulator += dt;
          while (accumulator >= FIXED_DT) { step(FIXED_DT); accumulator -= FIXED_DT; }
        }
        if (running || renderNeeded || cameraMoving()) render();
        if (running || cameraMoving()) frame = requestAnimationFrame(loop);
      } catch (error) {
        dispose();
        if (process.env.NODE_ENV !== "production") console.warn("Hero 3D unavailable", error);
      }
    }
    const onPointerMove = (event: PointerEvent) => {
      if (reduce || !running || !visible || event.pointerType !== "mouse") return;
      mouse.set(event.clientX / window.innerWidth - 0.5, event.clientY / window.innerHeight - 0.5);
    };
    const onVisibility = () => { stop(); schedule(); };
    const onMotion = () => {
      reduce = motionQuery.matches;
      running = !reduce;
      stop();
      mouse.set(0, 0); mouseS.set(0, 0);
      renderNeeded = true;
      schedule();
    };
    const onContextLost = (event: Event) => { event.preventDefault(); dispose(); };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    motionQuery.addEventListener("change", onMotion);
    canvas.addEventListener("webglcontextlost", onContextLost);
    cleanups.push(() => {
      stop();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotion);
      canvas.removeEventListener("webglcontextlost", onContextLost);
    });
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      stop();
      schedule();
    });
    observer.observe(hero ?? canvas);
    cleanups.push(() => observer.disconnect());
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    if (content) resizeObserver.observe(content);
    if (title) resizeObserver.observe(title);
    if (body) resizeObserver.observe(body);
    cleanups.push(() => resizeObserver.disconnect());
    // Redraw every canvas label if fonts settle after the boot timeout.
    void document.fonts.ready.then(() => {
      if (disposed) return;
      labelRefreshers.forEach((refresh) => refresh());
      resize();
    });
    // A settled frame for reduced motion; otherwise retain the painter's entrance.
    for (const carrier of carriers) updateCarrier(carrier, 0);
    if (reduce) for (let i = 0; i < 600; i++) step(FIXED_DT);
    else step(FIXED_DT);
    resize();
  } catch (error) {
    dispose();
    if (process.env.NODE_ENV !== "production") console.warn("Hero 3D unavailable", error);
  }
  return dispose;
}

export default function HeroScene() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let teardown: (() => void) | undefined;
    let fontTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelFontWait: (() => void) | undefined;
    // Each mount owns its canvas/context, including StrictMode's effect replay.
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.visibility = "hidden";
    const style = getComputedStyle(document.body);
    const displayFont = style.getPropertyValue("--font--display").trim() || '"Archivo Black", sans-serif';
    const bodyFont = style.getPropertyValue("--font-geist-sans").trim() || 'Geist, sans-serif';

    async function boot(host: HTMLDivElement) {
      try {
        await Promise.race([
          Promise.all([
            document.fonts.ready,
            document.fonts.load(`64px ${displayFont}`),
            document.fonts.load(`500 34px ${bodyFont}`),
          ]),
          new Promise<void>((resolve) => { fontTimer = setTimeout(resolve, 1500); }),
          new Promise<void>((resolve) => { cancelFontWait = resolve; }),
        ]);
      } catch {
        // System fallback fonts keep canvas labels usable if a local font fails.
      } finally {
        clearTimeout(fontTimer);
      }
      if (cancelled) return;
      host.appendChild(canvas);
      teardown = createScene(canvas, displayFont, bodyFont);
    }
    void boot(host);
    return () => {
      cancelled = true;
      clearTimeout(fontTimer);
      cancelFontWait?.();
      teardown?.();
      canvas.remove();
    };
  }, []);

  return <div ref={hostRef} className="hero-scene-canvas" aria-hidden="true" />;
}
