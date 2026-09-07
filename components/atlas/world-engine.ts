import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  worldPeaks,
  worldProvinces,
  terrainHeight,
  regionAt,
  tileKeys,
  TILE_SIZE,
  TILE_SEGMENTS,
} from '@/lib/terrain-world';
import { milestoneAt } from '@/lib/catalog';
import { humanAt, camp } from '@/lib/map-model';
import type { Locale } from '@/lib/types';
export interface WorldView {
  locale: Locale;
  year: number;
  selected: string;
  matches: string[];
}
export function createWorld(
  host: HTMLDivElement,
  labels: HTMLDivElement,
  onSelect: (id: string) => void,
  onError: () => void,
) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#080d12');
  scene.fog = new THREE.FogExp2('#080d12', 0.0048);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor('#080d12');
  renderer.domElement.tabIndex = 0;
  host.insertBefore(renderer.domElement, host.firstChild);
  const camera = new THREE.PerspectiveCamera(47, 1, 0.2, 900);
  camera.position.set(75, 105, 135);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.minDistance = 6;
  controls.maxDistance = 210;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.minPolarAngle = 0.12;
  controls.screenSpacePanning = false;
  controls.zoomToCursor = true;
  controls.listenToKeyEvents(renderer.domElement);
  controls.target.set(0, 4, 0);
  scene.add(new THREE.HemisphereLight('#e1f4ff', '#152327', 2));
  const sun = new THREE.DirectionalLight('#fff3d9', 2.3);
  sun.position.set(-65, 110, -30);
  scene.add(sun);
  const terrainMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    metalness: 0,
    flatShading: false,
  });
  const tiles = new Map<
    string,
    THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>
  >();
  const regionColors = [
    '#40685f',
    '#526763',
    '#49636e',
    '#686857',
    '#456863',
    '#596779',
  ].map((c) => new THREE.Color(c));
  const black = new THREE.Color('#080b11');
  function makeTile(tx: number, tz: number) {
    const geometry = new THREE.PlaneGeometry(
      TILE_SIZE,
      TILE_SIZE,
      TILE_SEGMENTS,
      TILE_SEGMENTS,
    );
    geometry.rotateX(-Math.PI / 2);
    const pos = geometry.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const normal = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + tx * TILE_SIZE + TILE_SIZE / 2,
        z = pos.getZ(i) + tz * TILE_SIZE + TILE_SIZE / 2,
        h = terrainHeight(x, z);
      pos.setY(i, h);
      const domain = regionAt(x, z),
        color = domain < 0 ? black : regionColors[domain % regionColors.length];
      const shade = domain < 0 ? 0.65 + h * 0.025 : 0.68 + h * 0.023;
      colors[i * 3] = color.r * shade;
      colors[i * 3 + 1] = color.g * shade;
      colors[i * 3 + 2] = color.b * shade;
      const n = new THREE.Vector3(
        terrainHeight(x - 0.3, z) - terrainHeight(x + 0.3, z),
        0.6,
        terrainHeight(x, z - 0.3) - terrainHeight(x, z + 0.3),
      ).normalize();
      normal.set([n.x, n.y, n.z], i * 3);
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
    const mesh = new THREE.Mesh(geometry, terrainMaterial);
    mesh.position.set(
      tx * TILE_SIZE + TILE_SIZE / 2,
      0,
      tz * TILE_SIZE + TILE_SIZE / 2,
    );
    scene.add(mesh);
    return mesh;
  }
  let tileCenter = '';
  function stream() {
    const next = `${Math.floor(controls.target.x / TILE_SIZE)},${Math.floor(controls.target.z / TILE_SIZE)}`;
    if (next === tileCenter) return;
    tileCenter = next;
    const wanted = tileKeys(controls.target.x, controls.target.z);
    const keys = new Set(wanted.map((t) => `${t.x},${t.z}`));
    for (const [key, tile] of tiles) {
      if (!keys.has(key)) {
        scene.remove(tile);
        tile.geometry.dispose();
        tiles.delete(key);
      }
    }
    for (const t of wanted) {
      const key = `${t.x},${t.z}`;
      if (!tiles.has(key)) tiles.set(key, makeTile(t.x, t.z));
    }
  }
  const borders = new THREE.Group();
  for (const r of worldProvinces) {
    const vertices: THREE.Vector3[] = [];
    r.points.forEach((p, i) => {
      const q = r.points[(i + 1) % r.points.length];
      const steps = Math.ceil(Math.hypot(q.x - p.x, q.z - p.z) / 0.5);
      for (let s = 0; s < steps; s++) {
        const x = p.x + ((q.x - p.x) * s) / steps,
          z = p.z + ((q.z - p.z) * s) / steps;
        vertices.push(new THREE.Vector3(x, terrainHeight(x, z) + 0.14, z));
      }
    });
    vertices.push(vertices[0].clone());
    borders.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(vertices),
        new THREE.LineBasicMaterial({
          color: '#a5bb91',
          transparent: true,
          opacity: 0.4,
        }),
      ),
    );
  }
  scene.add(borders);
  const textureCache = new Map<string, THREE.CanvasTexture>();
  function glyph(text: string, color: string) {
    const key = text + color;
    if (textureCache.has(key)) return textureCache.get(key)!;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    if (text !== '✓') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(64, 64, 59, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.font = `bold ${text.includes('?') ? 62 : 88}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 66);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textureCache.set(key, texture);
    return texture;
  }
  const pins: {
    peak: (typeof worldPeaks)[number];
    group: THREE.Group;
    actors: THREE.Sprite[];
    flags: THREE.Group[];
    ring: THREE.Mesh;
  }[] = [];
  const hitTargets: THREE.Object3D[] = [];
  for (const peak of worldPeaks) {
    const group = new THREE.Group();
    scene.add(group);
    const routePoints = Array.from({ length: 48 }, (_, i) => {
      const a = i / 47,
        x = peak.x - (1 - a) * 6,
        z = peak.z + (1 - a) * 3;
      return new THREE.Vector3(x, terrainHeight(x, z) + 0.2, z);
    });
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(routePoints),
      new THREE.LineDashedMaterial({
        color: '#f2dab0',
        dashSize: 0.5,
        gapSize: 0.3,
        transparent: true,
        opacity: 0.8,
      }),
    );
    line.computeLineDistances();
    group.add(line);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.15, 40),
      new THREE.MeshBasicMaterial({
        color: '#b3ffce',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(peak.x, terrainHeight(peak.x, peak.z) + 0.25, peak.z);
    group.add(ring);
    const actors = [0, 1].map((i) => {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glyph(i ? '🤖' : '🧍', i ? '#82e5ef' : '#ffc885'),
          depthTest: true,
        }),
      );
      sprite.scale.set(1.6, 1.6, 1);
      group.add(sprite);
      return sprite;
    });
    const flags = [0, 1].map((i) => {
      const flag = new THREE.Group(),
        color = i ? '#82e5ef' : '#ffc885';
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6),
        new THREE.MeshBasicMaterial({ color }),
      );
      pole.position.y = 1.3;
      flag.add(pole);
      const cloth = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 0.9),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
      );
      cloth.position.set(0.7, 2.15, 0);
      flag.add(cloth);
      const check = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glyph('✓', '#17352f'),
          depthTest: true,
        }),
      );
      check.position.set(0.7, 2.15, 0.05);
      check.scale.set(0.8, 0.8, 1);
      flag.add(check);
      group.add(flag);
      return flag;
    });
    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 8, 6),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hit.position.set(peak.x, terrainHeight(peak.x, peak.z), peak.z);
    hit.userData.id = peak.problem.id;
    scene.add(hit);
    hitTargets.push(hit);
    pins.push({ peak, group, actors, flags, ring });
  }
  let view: WorldView = {
    locale: 'en',
    year: 2026,
    selected: 'protein-structure',
    matches: worldPeaks.map((p) => p.problem.id),
  };
  const peakButtons = new Map(
    [...labels.querySelectorAll<HTMLButtonElement>('[data-world-peak]')].map(
      (e) => [e.dataset.worldPeak!, e],
    ),
  );
  const regionLabels = [
    ...labels.querySelectorAll<HTMLElement>('[data-world-region]'),
  ];
  const unknownLabel = labels.querySelector<HTMLElement>(
    '[data-unknown-label]',
  );
  function refresh(next: WorldView) {
    needsRender = true;
    view = next;
    for (const pin of pins) {
      const { peak } = pin,
        records = [
          humanAt(peak.problem, view.year),
          milestoneAt(peak.problem, view.year),
        ];
      pin.ring.visible = peak.problem.id === view.selected;
      pin.actors.forEach((actor, i) => {
        const fraction = camp(records[i]?.status),
          x = peak.x - (1 - fraction) * 6 + (i ? 0.45 : -0.45),
          z = peak.z + (1 - fraction) * 3;
        actor.position.set(x, terrainHeight(x, z) + 1.05, z);
        const unknown = !records[i];
        (actor.material as THREE.SpriteMaterial).map = glyph(
          unknown ? (i ? '🤖?' : '🧍?') : i ? '🤖' : '🧍',
          i ? '#82e5ef' : '#ffc885',
        );
        pin.flags[i].visible = records[i]?.status === 'achieved';
        pin.flags[i].position.set(
          peak.x + (i ? 0.55 : -0.55),
          terrainHeight(peak.x + (i ? 0.55 : -0.55), peak.z),
          peak.z,
        );
      });
    }
  }
  const point = new THREE.Vector3();
  let frame = 0,
    lastLabels = 0,
    stopped = false,
    intersecting = true,
    needsRender = true;
  let flight: { target: THREE.Vector3; position: THREE.Vector3 } | undefined;
  function project(element: HTMLElement, x: number, y: number, z: number) {
    point.set(x, y, z).project(camera);
    const visible =
      point.z < 1 &&
      point.z > -1 &&
      Math.abs(point.x) < 1.15 &&
      Math.abs(point.y) < 1.15;
    element.style.display = visible ? '' : 'none';
    if (visible) {
      element.style.transform = `translate(-50%,-100%) translate(${(point.x * 0.5 + 0.5) * host.clientWidth}px,${(-point.y * 0.5 + 0.5) * host.clientHeight}px)`;
      element.style.zIndex = String(Math.round((1 - point.z) * 10000));
    }
    return visible;
  }
  function drawLabels(now: number) {
    if (now - lastLabels < 45) return;
    lastLabels = now;
    const occupied: { x: number; y: number }[] = [];
    const sorted = [...worldPeaks].sort(
      (a, b) =>
        (b.problem.id === view.selected ? 1 : 0) -
        (a.problem.id === view.selected ? 1 : 0),
    );
    for (const peak of sorted) {
      const button = peakButtons.get(peak.problem.id);
      if (!button) continue;
      const selected = peak.problem.id === view.selected,
        dist = camera.position.distanceTo(
          new THREE.Vector3(peak.x, peak.height, peak.z),
        );
      const match = view.matches.includes(peak.problem.id);
      if (!project(button, peak.x, terrainHeight(peak.x, peak.z) + 2.4, peak.z))
        continue;
      const sx = (point.x * 0.5 + 0.5) * host.clientWidth,
        sy = (-point.y * 0.5 + 0.5) * host.clientHeight;
      const crowded = occupied.some(
        (p) => Math.abs(p.x - sx) < 140 && Math.abs(p.y - sy) < 48,
      );
      const show = selected || (dist < 135 && !crowded);
      button.classList.toggle('dot-only', !show);
      button.style.opacity = match || selected ? '1' : '.25';
      if (show) occupied.push({ x: sx, y: sy });
    }
    worldProvinces.forEach((r, i) => {
      const label = regionLabels[i];
      if (label) {
        project(
          label,
          r.center.x,
          terrainHeight(r.center.x, r.center.z) + 2,
          r.center.z,
        );
        const sx = (point.x * 0.5 + 0.5) * host.clientWidth,
          sy = (-point.y * 0.5 + 0.5) * host.clientHeight;
        const crowded = occupied.some(
          (p) => Math.abs(p.x - sx) < 140 && Math.abs(p.y - sy) < 28,
        );
        const near =
          camera.position.distanceTo(
            new THREE.Vector3(r.center.x, 0, r.center.z),
          ) < 35;
        if (crowded || near) label.style.display = 'none';
        else if (label.style.display !== 'none')
          occupied.push({ x: sx, y: sy });
      }
    });
    if (unknownLabel) {
      const x =
          regionAt(controls.target.x, controls.target.z) < 0
            ? controls.target.x
            : 85,
        z =
          regionAt(controls.target.x, controls.target.z) < 0
            ? controls.target.z
            : -42;
      project(unknownLabel, x, terrainHeight(x, z) + 5, z);
    }
  }
  function animate(now: number) {
    if (stopped) return;
    frame = requestAnimationFrame(animate);
    if (!intersecting || document.hidden) return;
    if (flight) {
      controls.target.lerp(flight.target, 0.1);
      camera.position.lerp(flight.position, 0.1);
      if (camera.position.distanceTo(flight.position) < 0.1) flight = undefined;
    }
    const changed = controls.update();
    const floor = terrainHeight(camera.position.x, camera.position.z) + 2.5;
    if (camera.position.y < floor) {
      camera.position.y = floor;
      needsRender = true;
    }
    if (changed || needsRender || flight) {
      stream();
      renderer.render(scene, camera);
      drawLabels(now);
      needsRender = false;
    }
  }
  function fly(id: string) {
    const p = worldPeaks.find((p) => p.problem.id === id);
    if (!p) return;
    flight = {
      target: new THREE.Vector3(p.x, p.height * 0.65, p.z),
      position: new THREE.Vector3(p.x + 13, p.height + 15, p.z + 24),
    };
  }
  function home() {
    flight = {
      target: new THREE.Vector3(0, 4, 0),
      position: new THREE.Vector3(75, 105, 135),
    };
  }
  const raycaster = new THREE.Raycaster();
  let pointer = { x: 0, y: 0 };
  function down(e: PointerEvent) {
    flight = undefined;
    pointer = { x: e.clientX, y: e.clientY };
  }
  function up(e: PointerEvent) {
    if (Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y) > 5) return;
    const rect = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(
      new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      camera,
    );
    const hit = raycaster.intersectObjects(hitTargets)[0];
    if (hit) onSelect(hit.object.userData.id as string);
  }
  renderer.domElement.addEventListener('pointerdown', down);
  renderer.domElement.addEventListener('pointerup', up);
  function lost(event: Event) {
    event.preventDefault();
    stopped = true;
    cancelAnimationFrame(frame);
    onError();
  }
  renderer.domElement.addEventListener('webglcontextlost', lost);
  const resize = new ResizeObserver(() => {
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(host.clientWidth, host.clientHeight);
    needsRender = true;
  });
  resize.observe(host);
  const observer = new IntersectionObserver((entries) => {
    intersecting = entries[0].isIntersecting;
    needsRender = true;
  });
  observer.observe(host);
  refresh(view);
  stream();
  frame = requestAnimationFrame(animate);
  return {
    refresh,
    fly,
    home,
    zoom(factor: number) {
      flight = undefined;
      camera.position
        .sub(controls.target)
        .multiplyScalar(factor)
        .clampLength(controls.minDistance, controls.maxDistance)
        .add(controls.target);
      controls.update();
      needsRender = true;
    },
    panMode(pan: boolean) {
      controls.mouseButtons.LEFT = pan ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
      controls.touches.ONE = pan ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
    },
    tilt() {
      const offset = camera.position.clone().sub(controls.target),
        s = new THREE.Spherical().setFromVector3(offset);
      s.phi = s.phi > 0.65 ? 0.35 : 1.1;
      camera.position
        .copy(controls.target)
        .add(new THREE.Vector3().setFromSpherical(s));
      controls.update();
      needsRender = true;
    },
    dispose() {
      stopped = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', down);
      renderer.domElement.removeEventListener('pointerup', up);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      scene.traverse((obj) => {
        if (
          obj instanceof THREE.Mesh ||
          obj instanceof THREE.Line ||
          obj instanceof THREE.Sprite
        ) {
          if ('geometry' in obj) obj.geometry.dispose();
          const materials = Array.isArray(obj.material)
            ? obj.material
            : [obj.material];
          materials.forEach((m) => m.dispose());
        }
      });
      textureCache.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
