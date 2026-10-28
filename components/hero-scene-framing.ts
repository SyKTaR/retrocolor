import * as THREE from "three";

// Bounds of the working line, including the painter's entrance, chimney and RAL
// tags. The long conveyor intentionally continues into the white edge fades.
const WORKSHOP_BOUNDS = [
  [[-11.5, 0, -1.85], [13.35, 5.85, 0.3]], // rail and supports
  [[-9.3, 0, -3.1], [-5.2, 3.4, 2.8]], // preparation
  [[-4.65, 0, -2.1], [-0.75, 5.1, 2.1]], // blasting
  [[-0.7, 0, -4.1], [3.9, 4.1, 3]], // painting
  [[3.7, 0, -2.3], [8.2, 6.8, 2.3]], // oven and chimney
  [[9.2, 0, -3.1], [15.2, 5.2, 1]], // inspection and labels
  [[-3, 0, 0.3], [2.4, 3.4, 5.8]], // painter's entrance
] as const;

// Narrow screens prioritize the workers and four active stations; the spare
// table, inspection area and conveyor ends may leave the frame.
const ACTIVE_BOUNDS = [
  [[-7.8, 0, 0.2], [-5.2, 3.4, 2.8]],
  ...WORKSHOP_BOUNDS.slice(2, 5),
  WORKSHOP_BOUNDS[6],
] as const;

// Desktop frames the complete line, as in the design mock-up: rail start (rusty
// parts) to the last plate on the right, inspection area included. The side
// fades only soften the edges; no station is hidden behind them.
const DESKTOP_BOUNDS = [
  [[-11.5, 0, -1.85], [13.35, 5.85, 0.3]],
  ...WORKSHOP_BOUNDS.slice(1, 5),
  [[9.2, 0, -3.1], [15.2, 5.2, 1]],
  WORKSHOP_BOUNDS[6],
] as const;

const MIN_SCENE_HEIGHT = 300;
const DESKTOP_PULLBACK = 1.09;
const DESKTOP_PULLBACK_NARROW = 1.2; // 992-1279px: width-limited, keep the last plate clear of the fade

export function frameWorkshop(
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
  layout: { titleBottom: number; contentBottom: number },
) {
  const portrait = width < 768;
  const compact = width < 992;
  // The canvas covers the hero. Only the H1 is excluded; upper machinery may
  // sit behind the local copy veil, while workers occupy the clear lower area.
  // Overlap is capped by the measured body height, never by viewport guesses.
  const titleBottom = THREE.MathUtils.clamp(layout.titleBottom, 0, height - 1);
  const contentBottom = Math.max(titleBottom, layout.contentBottom);
  const overlap = Math.min(portrait ? 60 : 24, (contentBottom - titleBottom) * 0.5);
  const floor = height - 64;
  // Keep a clear gap under the CTA. On short screens that leaves too little
  // height for the line, so the scene may climb back behind the copy veil.
  const gap = contentBottom + 12 - overlap;
  const climbLimit = contentBottom - Math.min(portrait ? 100 : 80, (contentBottom - titleBottom) * 0.5);
  const wanted = floor - gap < MIN_SCENE_HEIGHT ? Math.max(climbLimit, floor - MIN_SCENE_HEIGHT) : gap;
  const top = Math.min(Math.max(titleBottom + 32, Math.min(gap, wanted)), height - 65);
  const bottom = Math.max(top + 1, floor);
  const availableHeight = bottom - top;
  const aspect = width / availableHeight;
  const target = new THREE.Vector3(compact ? 1 : 1.1, 2.8, 0.4);
  const azimuth = THREE.MathUtils.degToRad(portrait ? 38 : 22);
  const elevation = THREE.MathUtils.degToRad(portrait ? 34 : 36);
  const direction = new THREE.Vector3(
    Math.sin(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    Math.cos(azimuth) * Math.cos(elevation),
  );
  const right = new THREE.Vector3().crossVectors(camera.up, direction).normalize();
  const up = new THREE.Vector3().crossVectors(direction, right).normalize();
  camera.fov = portrait ? 34 : 28;
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const tanH = tanV * aspect;
  // Fit the useful line into the remaining area, retaining the compact mobile
  // bounds rather than shrinking workers to include the long conveyor ends.
  let distance = 24;
  const corners: THREE.Vector3[] = [];
  for (const [min, max] of compact ? ACTIVE_BOUNDS : DESKTOP_BOUNDS) {
    for (const x of [min[0], max[0]]) {
      for (const y of [min[1], max[1]]) {
        for (const z of [min[2], max[2]]) {
          const corner = new THREE.Vector3(x, y, z);
          corners.push(corner);
          const relative = corner.clone().sub(target);
          // Side margin protects against edge fades and mouse parallax: 14% on
          // compact screens, ~24% on desktop so the whole line sits inside the fades.
          distance = Math.max(distance, relative.dot(direction) + Math.max(
            Math.abs(relative.dot(right)) / (tanH * (compact ? 0.86 : 0.76)),
            Math.abs(relative.dot(up)) / (tanV * 0.86),
          ) + 1);
        }
      }
    }
  }
  // Desktop: pull back so the line spans roughly three quarters of the width and
  // the floor fades out inside the frame (design mock-up), not edge to edge.
  if (!compact) distance *= width < 1280 ? DESKTOP_PULLBACK_NARROW : DESKTOP_PULLBACK;
  const base = direction.multiplyScalar(distance);
  camera.far = Math.max(200, distance + 160);
  camera.position.copy(target).add(base);
  camera.lookAt(target);
  camera.setViewOffset(width, availableHeight, 0, -top, width, height);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return { target, base, distance, top, bottom, corners };
}
