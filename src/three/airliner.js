import * as THREE from 'three';

// A small twin-engine airliner, built from code. Nose points +X, up is +Y,
// the port (left, red light) wing is -Z, starboard (right, green) is +Z.

const FUSE_LEN = 4;
const R = 0.22;

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.65)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function finTexture(accent) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = accent;
  g.fillRect(0, 0, 256, 256);
  // A soft sun disc, like the one on Nepal's flag, behind the monogram.
  g.fillStyle = 'rgba(255,255,255,0.92)';
  g.beginPath();
  g.arc(128, 132, 70, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = accent;
  g.font = '400 96px "Noto Sans Tirhuta", serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('\u{114AC}\u{114B3}', 128, 140);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function fuselageGeometry() {
  // Profile from tail (-L/2) to nose (+L/2), as [radius, position].
  const half = FUSE_LEN / 2;
  const pts = [];
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = -half + t * FUSE_LEN;
    let r = R;
    const noseStart = half - 0.5;
    const tailStart = -half + 1.15;
    if (y > noseStart) {
      const k = (y - noseStart) / 0.5;
      r = R * Math.sqrt(Math.max(0, 1 - Math.pow(k, 2.2)));
    } else if (y < tailStart) {
      const k = (tailStart - y) / 1.15;
      r = R * (1 - 0.86 * Math.pow(k, 1.35));
    }
    pts.push(new THREE.Vector2(Math.max(r, 0.0005), y));
  }
  const geo = new THREE.LatheGeometry(pts, 40);
  geo.rotateZ(-Math.PI / 2); // +Y (nose) -> +X
  // Upswept tail cone and a slightly drooped nose.
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const tailStart = -half + 1.15;
    if (x < tailStart) {
      const k = (tailStart - x) / 1.15;
      pos.setY(i, pos.getY(i) + 0.17 * Math.pow(k, 1.6));
    }
    if (x > half - 0.55) {
      const k = (x - (half - 0.55)) / 0.55;
      pos.setY(i, pos.getY(i) - 0.035 * k * k);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

function planform(points, thickness, bevel = 0.012) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 4,
  });
  geo.translate(0, 0, -thickness / 2);
  return geo;
}

function wingGeometry(side) {
  // side = -1 for port (-Z), +1 for starboard (+Z). Shape y maps to -z after rotateX(-90deg).
  const s = -side;
  const span = 1.82;
  const sweep = Math.tan((25 * Math.PI) / 180);
  const rootLE = 0.46;
  const rootTE = -0.48;
  const tipLE = rootLE - span * sweep;
  const tipTE = tipLE - 0.28;
  const geo = planform(
    [
      [rootLE, 0],
      [tipLE, s * span],
      [tipTE, s * span],
      [rootTE + 0.18, s * 0.62],
      [rootTE, 0],
    ],
    0.03,
  );
  geo.rotateX(-Math.PI / 2);
  return geo;
}

function wingletGeometry() {
  const geo = planform(
    [
      [0, 0],
      [-0.12, 0.26],
      [-0.2, 0.26],
      [-0.26, 0],
    ],
    0.02,
    0.006,
  );
  return geo;
}

function tailplaneGeometry(side) {
  const s = -side;
  const span = 0.74;
  const sweep = Math.tan((32 * Math.PI) / 180);
  const geo = planform(
    [
      [0.24, 0],
      [0.24 - span * sweep, s * span],
      [0.24 - span * sweep - 0.17, s * span],
      [-0.24, 0],
    ],
    0.022,
    0.008,
  );
  geo.rotateX(-Math.PI / 2);
  return geo;
}

function finGeometry() {
  const h = 0.78;
  const sweep = Math.tan((38 * Math.PI) / 180);
  const geo = planform(
    [
      [0.38, 0],
      [0.38 - h * sweep, h],
      [0.38 - h * sweep - 0.28, h],
      [-0.42, 0],
    ],
    0.03,
    0.01,
  );
  // Map the livery texture across the fin: normalise UVs to the side view.
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (pos.getX(i) - min.x) / (max.x - min.x), (pos.getY(i) - min.y) / (max.y - min.y));
  }
  uv.needsUpdate = true;
  return geo;
}

function nacelleGeometry() {
  const pts = [
    [0.0, 0.33],
    [0.085, 0.335],
    [0.104, 0.31],
    [0.108, 0.22],
    [0.105, 0.0],
    [0.092, -0.16],
    [0.068, -0.24],
    [0.04, -0.26],
    [0.0, -0.27],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(pts, 28);
  geo.rotateZ(-Math.PI / 2);
  return geo;
}

export function createAirliner({ accent = '#f08a24' } = {}) {
  const group = new THREE.Group();
  group.name = 'airliner';

  const mats = {
    body: new THREE.MeshStandardMaterial({ color: 0xf6f5f1, roughness: 0.32, metalness: 0.12 }),
    wing: new THREE.MeshStandardMaterial({ color: 0xd9dde3, roughness: 0.42, metalness: 0.3 }),
    engine: new THREE.MeshStandardMaterial({ color: 0xeceae5, roughness: 0.3, metalness: 0.2 }),
    accent: new THREE.MeshStandardMaterial({ color: new THREE.Color(accent), roughness: 0.38, metalness: 0.1 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x1a1e27, roughness: 0.18, metalness: 0.6 }),
    window: new THREE.MeshStandardMaterial({ color: 0x1b2230, roughness: 0.1, metalness: 0.5, emissive: new THREE.Color(0xffd29a), emissiveIntensity: 0 }),
    gear: new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.5, metalness: 0.6 }),
    tyre: new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.9 }),
  };
  mats.fin = new THREE.MeshStandardMaterial({ map: finTexture(accent), roughness: 0.38, metalness: 0.1 });

  // Fuselage with a darker belly band would be heavier; a clean white body
  // reads better at small sizes.
  const fuselage = new THREE.Mesh(fuselageGeometry(), mats.body);
  group.add(fuselage);

  // Wings, with a little dihedral, and winglets.
  const wingY = -0.1;
  const wingX = 0.18;
  [-1, 1].forEach((side) => {
    const wing = new THREE.Mesh(wingGeometry(side), mats.wing);
    wing.position.set(wingX, wingY, 0);
    wing.rotation.x = side * -0.085;
    group.add(wing);

    const winglet = new THREE.Mesh(wingletGeometry(), mats.accent);
    const span = 1.82;
    const tipLE = 0.46 - span * Math.tan((25 * Math.PI) / 180);
    winglet.position.set(wingX + tipLE - 0.02, wingY + span * Math.sin(0.085) + 0.005, side * span);
    winglet.rotation.x = side * 0.25;
    group.add(winglet);

    // Engine on a pylon under each wing.
    const nacelle = new THREE.Mesh(nacelleGeometry(), mats.engine);
    nacelle.position.set(wingX + 0.42, wingY - 0.2, side * 0.66);
    group.add(nacelle);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 10, 28), mats.accent);
    lip.rotation.y = Math.PI / 2;
    lip.position.set(wingX + 0.42 + 0.328, wingY - 0.2, side * 0.66);
    group.add(lip);
    const fan = new THREE.Mesh(new THREE.CircleGeometry(0.092, 24), mats.dark);
    fan.rotation.y = Math.PI / 2;
    fan.position.set(wingX + 0.42 + 0.3, wingY - 0.2, side * 0.66);
    group.add(fan);
    const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.07, 16), mats.engine);
    spinner.rotation.z = -Math.PI / 2;
    spinner.position.set(wingX + 0.42 + 0.33, wingY - 0.2, side * 0.66);
    group.add(spinner);
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.025), mats.wing);
    pylon.position.set(wingX + 0.3, -0.12, side * 0.66);
    group.add(pylon);
  });

  // Tail: horizontal stabilisers and the livery fin.
  [-1, 1].forEach((side) => {
    const tp = new THREE.Mesh(tailplaneGeometry(side), mats.wing);
    tp.position.set(-1.62, 0.1, 0);
    tp.rotation.x = side * -0.1;
    group.add(tp);
  });
  const fin = new THREE.Mesh(finGeometry(), mats.fin);
  fin.position.set(-1.5, 0.19, 0);
  group.add(fin);

  // Cockpit windshield: a dark band wrapped over the upper nose.
  const shieldGeo = new THREE.CylinderGeometry(0.209, 0.218, 0.075, 28, 1, true, (3 * Math.PI) / 2 - 1.05, 2.1);
  shieldGeo.rotateZ(-Math.PI / 2);
  const cockpit = new THREE.Mesh(shieldGeo, mats.dark);
  cockpit.material.side = THREE.DoubleSide;
  cockpit.position.set(1.665, -0.004, 0);
  group.add(cockpit);

  // Cabin windows, both sides, as one instanced mesh.
  const winGeo = new THREE.CapsuleGeometry(0.013, 0.014, 4, 8);
  const count = 26;
  const windows = new THREE.InstancedMesh(winGeo, mats.window, count * 2);
  const m = new THREE.Matrix4();
  let n = 0;
  for (const side of [-1, 1]) {
    for (let i = 0; i < count; i++) {
      const x = -0.95 + i * 0.092;
      if (Math.abs(x - 0.2) < 0.05) continue; // over-wing exit gap
      m.makeTranslation(x, 0.065, side * (R - 0.004));
      windows.setMatrixAt(n++, m);
    }
  }
  windows.count = n;
  group.add(windows);

  // Landing gear (nose + two mains), hinged so it can retract.
  const gear = new THREE.Group();
  const leg = (x, z) => {
    const g = new THREE.Group();
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 8), mats.gear);
    strut.position.y = -0.13;
    g.add(strut);
    [-0.035, 0.035].forEach((dz) => {
      const tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 16), mats.tyre);
      tyre.rotation.x = Math.PI / 2;
      tyre.position.set(0, -0.27, dz);
      g.add(tyre);
    });
    g.position.set(x, -0.17, z);
    gear.add(g);
    return g;
  };
  const legs = [leg(1.3, 0), leg(0.05, -0.26), leg(0.05, 0.26)];
  group.add(gear);

  // Lights: glow sprites (cheaper than real lights) for nav, strobes, beacon.
  const glowTex = glowTexture();
  const sprite = (color, size) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.scale.setScalar(size);
    group.add(s);
    return s;
  };
  const tipX = wingX + 0.46 - 1.82 * Math.tan((25 * Math.PI) / 180) - 0.12;
  const tipY = wingY + 1.82 * Math.sin(0.085);
  const lights = {
    port: sprite(0xff3b3b, 0.22),
    starboard: sprite(0x3bff7a, 0.22),
    strobeL: sprite(0xffffff, 0.5),
    strobeR: sprite(0xffffff, 0.5),
    tail: sprite(0xffffff, 0.18),
    beaconTop: sprite(0xff2a2a, 0.3),
    beaconBottom: sprite(0xff2a2a, 0.3),
    landing: sprite(0xfff3d6, 0.55),
  };
  lights.port.position.set(tipX, tipY, -1.84);
  lights.starboard.position.set(tipX, tipY, 1.84);
  lights.strobeL.position.set(tipX - 0.05, tipY, -1.86);
  lights.strobeR.position.set(tipX - 0.05, tipY, 1.86);
  lights.tail.position.set(-2.02, 0.2, 0);
  lights.beaconTop.position.set(0.1, R + 0.03, 0);
  lights.beaconBottom.position.set(-0.2, -R - 0.03, 0);
  lights.landing.position.set(wingX + 0.35, wingY - 0.05, 0);

  // ---- controls -----------------------------------------------------------
  let gearAmount = 0;
  const api = {
    group,
    mats,
    setAccent(color) {
      mats.accent.color.set(color);
      mats.fin.map?.dispose();
      mats.fin.map = finTexture(color);
      mats.fin.needsUpdate = true;
    },
    // 0 = retracted, 1 = down and locked
    setGear(amount) {
      gearAmount = THREE.MathUtils.clamp(amount, 0, 1);
      gear.visible = gearAmount > 0.01;
      legs.forEach((l, i) => {
        l.rotation.z = (1 - gearAmount) * (i === 0 ? -1.4 : 1.4);
        l.scale.setScalar(0.4 + 0.6 * gearAmount);
      });
    },
    // night = 0..1; drives cabin glow and how strongly lights read.
    update(time, { night = 0, landing = 0 } = {}) {
      const lightGain = 0.35 + 0.65 * night;
      mats.window.emissiveIntensity = night * 0.9;
      lights.port.material.opacity = lightGain;
      lights.starboard.material.opacity = lightGain;
      lights.tail.material.opacity = lightGain * 0.8;
      const strobePhase = time % 1.4;
      const strobe = strobePhase < 0.05 || (strobePhase > 0.16 && strobePhase < 0.21) ? 1 : 0;
      lights.strobeL.material.opacity = strobe * (0.5 + 0.5 * night);
      lights.strobeR.material.opacity = strobe * (0.5 + 0.5 * night);
      const beacon = Math.max(0, Math.sin(time * Math.PI * 2 * 0.9)) ** 6;
      lights.beaconTop.material.opacity = beacon * lightGain;
      lights.beaconBottom.material.opacity = beacon * lightGain;
      lights.landing.material.opacity = landing * (0.4 + 0.6 * night);
      lights.landing.scale.setScalar(0.3 + 0.5 * landing);
    },
    // engine exhaust points in local space, for contrails
    exhausts: [new THREE.Vector3(wingX + 0.12, wingY - 0.2, -0.66), new THREE.Vector3(wingX + 0.12, wingY - 0.2, 0.66)],
    dispose() {
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
      });
      Object.values(mats).forEach((mat) => {
        mat.map?.dispose();
        mat.dispose();
      });
      glowTex.dispose();
    },
  };
  api.setGear(0);
  return api;
}
