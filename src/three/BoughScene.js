import * as THREE from 'three';

// A long mossy bough in open sky, dressed for one of Nepal's six seasons and
// lit for the time of day. The camera travels along it; life milestones hang
// from it. Inspired by Sylva's sakura bough, rebuilt for Nepal.

const SKIES = {
  dawn: { top: '#7f97cf', mid: '#c7b6d6', bottom: '#f6c7a2', sun: '#ffd2a6', sunI: 1.4, hemi: 0.9, fog: '#d9c3c9' },
  day: { top: '#79b4f0', mid: '#a9d1f5', bottom: '#e7f2fb', sun: '#fff5e6', sunI: 2.2, hemi: 1.15, fog: '#d6e6f3' },
  dusk: { top: '#5d4f86', mid: '#a9708f', bottom: '#f3a07a', sun: '#ffb27a', sunI: 1.6, hemi: 0.8, fog: '#c99a9a' },
  night: { top: '#070b1f', mid: '#141b3c', bottom: '#2a3156', sun: '#9fb2ff', sunI: 0.5, hemi: 0.32, fog: '#1b2142' },
};

const rnd = (seed) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

function canvasTex(draw, size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const leafTex = () =>
  canvasTex((g, s) => {
    g.translate(s / 2, s / 2);
    g.rotate(-Math.PI / 4);
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(0, -s * 0.46);
    g.bezierCurveTo(s * 0.3, -s * 0.2, s * 0.26, s * 0.25, 0, s * 0.46);
    g.bezierCurveTo(-s * 0.26, s * 0.25, -s * 0.3, -s * 0.2, 0, -s * 0.46);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.28)';
    g.lineWidth = s * 0.025;
    g.beginPath();
    g.moveTo(0, -s * 0.42);
    g.lineTo(0, s * 0.44);
    for (let i = -3; i <= 3; i++) {
      g.moveTo(0, i * s * 0.1);
      g.lineTo(s * 0.16, i * s * 0.1 - s * 0.08);
      g.moveTo(0, i * s * 0.1);
      g.lineTo(-s * 0.16, i * s * 0.1 - s * 0.08);
    }
    g.stroke();
  });

const flowerTex = () =>
  canvasTex((g, s) => {
    g.translate(s / 2, s / 2);
    for (let i = 0; i < 5; i++) {
      g.rotate((Math.PI * 2) / 5);
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.ellipse(0, -s * 0.22, s * 0.15, s * 0.24, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.beginPath();
    g.arc(0, 0, s * 0.08, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(255,230,120,0.9)';
    g.lineWidth = s * 0.015;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.cos(a) * s * 0.22, Math.sin(a) * s * 0.22);
      g.stroke();
    }
  });

const petalTex = () =>
  canvasTex((g, s) => {
    g.translate(s / 2, s / 2);
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.ellipse(0, 0, s * 0.22, s * 0.4, 0.3, 0, Math.PI * 2);
    g.fill();
  }, 64);

const glowTex = () =>
  canvasTex((g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.3, 'rgba(255,255,255,0.5)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
  }, 64);

export class BoughScene {
  constructor(canvas, { milestones = 12, mobile = false } = {}) {
    this.canvas = canvas;
    this.mobile = mobile;
    this.milestones = milestones;
    this.L = 10 + milestones * 7;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.3 : 1.6));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(mobile ? 52 : 38, 1, 0.1, 200);
    this.clock = new THREE.Clock();
    this.progress = 0;
    this.pointer = { x: 0, y: 0 };
    this.textures = { leaf: leafTex(), flower: flowerTex(), petal: petalTex(), glow: glowTex() };

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x556644, 1);
    this.sun = new THREE.DirectionalLight(0xffffff, 2);
    this.sun.position.set(-6, 10, 8);
    this.scene.add(this.hemi, this.sun);

    this.buildSky();
    this.buildBough();
    this.anchors = this.computeAnchors();
  }

  buildSky() {
    const geo = new THREE.SphereGeometry(120, 32, 16);
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bottom: { value: new THREE.Color() }, uStars: { value: 0 } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: [
        'uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; uniform float uStars; varying vec3 vP;',
        'float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
        'void main(){',
        '  float h = vP.y;',
        '  vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.6, h)) : mix(mid, bottom, smoothstep(0.0, 0.35, -h));',
        '  if (uStars > 0.0 && h > -0.05) {',
        '    vec3 cell = floor(vP * 260.0);',
        '    float n = hash(cell);',
        '    float star = step(0.9965, n) * (0.5 + 0.5 * hash(cell + 7.0));',
        '    c += vec3(star) * uStars * smoothstep(-0.05, 0.25, h);',
        '  }',
        '  gl_FragColor = vec4(c, 1.0);',
        '  #include <colorspace_fragment>',
        '}',
      ].join('\n'),
    });
    this.sky = new THREE.Mesh(geo, this.skyMat);
    this.scene.add(this.sky);
    this.sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.textures.glow, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.sunSprite.scale.setScalar(26);
    this.scene.add(this.sunSprite);
  }

  branchCurve() {
    const r = rnd(5);
    const pts = [];
    for (let x = -14; x <= this.L + 14; x += 5) {
      pts.push(new THREE.Vector3(x, Math.sin(x * 0.11) * 1.1 + Math.sin(x * 0.043) * 1.4 + (r() - 0.5) * 0.5 - 0.6, Math.sin(x * 0.07) * 0.8));
    }
    return new THREE.CatmullRomCurve3(pts);
  }

  taperedTube(curve, segments, radius, radial, taperFn) {
    const geo = new THREE.TubeGeometry(curve, segments, radius, radial, false);
    const pos = geo.attributes.position;
    const p = new THREE.Vector3();
    const c = new THREE.Vector3();
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      curve.getPointAt(u, c);
      const k = taperFn(u);
      for (let j = 0; j <= radial; j++) {
        const idx = i * (radial + 1) + j;
        p.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(k).add(c);
        pos.setXYZ(idx, p.x, p.y, p.z);
      }
    }
    geo.computeVertexNormals();
    return geo;
  }

  buildBough() {
    const r = rnd(11);
    this.curve = this.branchCurve();
    const barkMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
    this.barkMat = barkMat;
    const geos = [];
    geos.push(this.taperedTube(this.curve, this.mobile ? 300 : 520, 0.5, 9, (u) => 0.75 + 0.25 * Math.sin(u * 40) * 0.1));

    // Offshoots and twigs, remembering where foliage should cluster.
    this.clusters = [];
    const seg = this.mobile ? 2.6 : 1.9;
    for (let x = -10; x < this.L + 10; x += seg + r() * 1.5) {
      const u = (x + 14) / (this.L + 28);
      const base = this.curve.getPointAt(Math.min(1, Math.max(0, u)));
      const up = r() > 0.35 ? 1 : -1;
      const len = 2.2 + r() * 3.2;
      const dir = new THREE.Vector3((r() - 0.3) * 1.6, up * (0.6 + r() * 0.8), (r() - 0.5) * 2.2).normalize();
      const p1 = base.clone().addScaledVector(dir, len * 0.4).add(new THREE.Vector3(0, up * 0.25, 0));
      const p2 = base.clone().addScaledVector(dir, len).add(new THREE.Vector3(r() - 0.5, up * 0.3, r() - 0.5));
      const sub = new THREE.CatmullRomCurve3([base, p1, p2]);
      geos.push(this.taperedTube(sub, 24, 0.17 + r() * 0.08, 6, (t) => 1 - t * 0.75));
      this.clusters.push({ p: p2, r: 0.9 + r() * 0.6 }, { p: p1.clone().lerp(p2, 0.4), r: 0.6 });
      // A twig off the offshoot.
      if (r() > 0.4) {
        const tdir = new THREE.Vector3(r() - 0.5, up * r(), r() - 0.5).normalize();
        const t1 = p1.clone().addScaledVector(tdir, 1.1 + r());
        const twig = new THREE.CatmullRomCurve3([p1, p1.clone().lerp(t1, 0.5).add(new THREE.Vector3(0, 0.15 * up, 0)), t1]);
        geos.push(this.taperedTube(twig, 10, 0.07, 5, (t) => 1 - t * 0.7));
        this.clusters.push({ p: t1, r: 0.55 });
      }
    }

    // Merge into one mesh, with moss on the upward-facing bark.
    let vCount = 0;
    geos.forEach((g) => {
      vCount += g.attributes.position.count;
    });
    const merged = new THREE.BufferGeometry();
    const position = new Float32Array(vCount * 3);
    const normal = new Float32Array(vCount * 3);
    const color = new Float32Array(vCount * 3);
    const indices = [];
    let offset = 0;
    geos.forEach((g) => {
      position.set(g.attributes.position.array, offset * 3);
      normal.set(g.attributes.normal.array, offset * 3);
      const idx = g.index.array;
      for (let i = 0; i < idx.length; i++) indices.push(idx[i] + offset);
      offset += g.attributes.position.count;
      g.dispose();
    });
    merged.setAttribute('position', new THREE.BufferAttribute(position, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
    merged.setAttribute('color', new THREE.BufferAttribute(color, 3));
    merged.setIndex(indices);
    this.bough = new THREE.Mesh(merged, barkMat);
    this.scene.add(this.bough);
  }

  paintBark(season) {
    const pos = this.bough.geometry.attributes.position;
    const nor = this.bough.geometry.attributes.normal;
    const col = this.bough.geometry.attributes.color;
    const bark = new THREE.Color('#6a5442');
    const bark2 = new THREE.Color('#463629');
    const moss = new THREE.Color(season.id === 'shishir' ? '#8b8a72' : season.id === 'hemanta' || season.id === 'sharad' ? '#6f7d3a' : '#4f7d32');
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const ny = nor.getY(i);
      const n = Math.sin(pos.getX(i) * 3.1) * Math.sin(pos.getZ(i) * 2.3 + pos.getY(i) * 4.0);
      c.copy(bark).lerp(bark2, 0.5 + 0.5 * n);
      const m = THREE.MathUtils.smoothstep(ny + n * 0.25, 0.25, 0.85);
      c.lerp(moss, m * (season.id === 'shishir' ? 0.35 : 0.8));
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
  }

  dress(season) {
    // Foliage: leaves, or rhododendron blossoms in spring.
    if (this.foliage) {
      this.scene.remove(this.foliage);
      this.foliage.geometry.dispose();
      this.foliage.material.dispose();
    }
    this.paintBark(season);
    const sc = season.scene;
    const isFlower = season.id === 'basanta';
    const per = Math.round((this.mobile ? 9 : 16) * sc.density);
    const count = Math.max(30, this.clusters.length * per);
    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.MeshStandardMaterial({ map: isFlower ? this.textures.flower : this.textures.leaf, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.7, transparent: false });
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    const r = rnd(23);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const colors = sc.foliage.map((h) => new THREE.Color(h));
    const leafy = isFlower ? [new THREE.Color('#3f6b2f'), new THREE.Color('#5a8a3a')] : null;
    let n = 0;
    this.clusters.forEach((cl) => {
      for (let k = 0; k < per && n < count; k++) {
        const theta = r() * Math.PI * 2;
        const phi = Math.acos(2 * r() - 1);
        const rad = cl.r * Math.cbrt(r());
        p.set(cl.p.x + rad * Math.sin(phi) * Math.cos(theta), cl.p.y + rad * Math.cos(phi) * 0.75, cl.p.z + rad * Math.sin(phi) * Math.sin(theta));
        e.set(r() * Math.PI, r() * Math.PI, r() * Math.PI);
        q.setFromEuler(e);
        const size = (isFlower ? 0.38 : 0.3) + r() * 0.22;
        s.set(size, size, size);
        m.compose(p, q, s);
        mesh.setMatrixAt(n, m);
        // In spring, some instances are the glossy leaves around the blossoms.
        const pick = leafy && r() < 0.35 ? leafy[Math.floor(r() * leafy.length)] : colors[Math.floor(r() * colors.length)];
        mesh.setColorAt(n, pick.clone().offsetHSL((r() - 0.5) * 0.03, 0, (r() - 0.5) * 0.08));
        n++;
      }
    });
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.foliage = mesh;
    this.scene.add(mesh);
    this.buildWeather(season);
  }

  buildWeather(season) {
    ['falling', 'rain', 'flies'].forEach((k) => {
      if (this[k]) {
        this.scene.remove(this[k]);
        this[k].geometry.dispose();
        this[k].material.dispose();
        this[k] = null;
      }
    });
    const sc = season.scene;
    const r = rnd(41);
    // Falling petals / leaves / frost.
    if (sc.falling !== 'drops') {
      const count = this.mobile ? 70 : 140;
      const geo = new THREE.PlaneGeometry(1, 1);
      const frost = sc.falling === 'frost';
      const mat = new THREE.MeshStandardMaterial({
        map: frost ? this.textures.glow : sc.falling === 'petals' ? this.textures.petal : this.textures.leaf,
        alphaTest: frost ? 0.02 : 0.4,
        transparent: frost,
        side: THREE.DoubleSide,
        roughness: 0.8,
        emissive: frost ? new THREE.Color('#ffffff') : new THREE.Color('#000000'),
        emissiveIntensity: frost ? 0.6 : 0,
        depthWrite: !frost,
      });
      const mesh = new THREE.InstancedMesh(geo, mat, count);
      mesh.userData.parts = Array.from({ length: count }, () => ({
        x: r() * 30 - 15,
        y: r() * 14 - 5,
        z: r() * 8 - 2,
        vy: 0.35 + r() * 0.5,
        sway: r() * 6,
        spin: (r() - 0.5) * 3,
        size: frost ? 0.08 + r() * 0.06 : 0.2 + r() * 0.15,
        c: sc.foliage[Math.floor(r() * sc.foliage.length)],
      }));
      mesh.userData.parts.forEach((pt, i) => mesh.setColorAt(i, new THREE.Color(frost ? '#ffffff' : pt.c)));
      mesh.frustumCulled = false;
      this.falling = mesh;
      this.scene.add(mesh);
    }
    // Monsoon rain.
    if (sc.rain > 0.5) {
      const count = this.mobile ? 500 : 1100;
      const pos = new Float32Array(count * 6);
      for (let i = 0; i < count; i++) {
        const x = r() * 40 - 20;
        const y = r() * 20 - 8;
        const z = r() * 14 - 6;
        pos.set([x, y, z, x - 0.05, y - 0.55, z], i * 6);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.LineBasicMaterial({ color: 0xc8d6ea, transparent: true, opacity: 0.45 });
      this.rain = new THREE.LineSegments(geo, mat);
      this.rain.frustumCulled = false;
      this.scene.add(this.rain);
    }
    // Fireflies (jugnu) on summer and monsoon nights.
    if (sc.fireflies > 0) {
      const count = Math.round((this.mobile ? 40 : 90) * sc.fireflies);
      const pos = new Float32Array(count * 3);
      const seeds = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        pos.set([r() * 30 - 15, r() * 8 - 4, r() * 8 - 3], i * 3);
        seeds[i] = r() * 100;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uMap: { value: this.textures.glow }, uNight: { value: 0 }, uScale: { value: this.renderer.getPixelRatio() } },
        vertexShader:
          'attribute float seed; uniform float uTime; uniform float uScale; varying float vA; void main(){ vec3 p = position; p.x += sin(uTime*0.4+seed)*0.6; p.y += sin(uTime*0.7+seed*1.7)*0.4; vA = 0.5 + 0.5*sin(uTime*2.0+seed*3.0); vec4 mv = modelViewMatrix*vec4(p,1.0); gl_PointSize = 70.0*uScale/ -mv.z; gl_Position = projectionMatrix*mv; }',
        fragmentShader: 'uniform sampler2D uMap; uniform float uNight; varying float vA; void main(){ vec4 t = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(1.0,0.93,0.55, t.a*vA*uNight); }',
      });
      this.flies = new THREE.Points(geo, mat);
      this.flies.frustumCulled = false;
      this.scene.add(this.flies);
    }
  }

  light(phase, season) {
    const sky = SKIES[phase];
    const tint = (hex) => {
      const c = new THREE.Color(hex);
      if (season.id === 'barsha') c.lerp(new THREE.Color('#9aa3ad'), 0.35);
      if (season.id === 'shishir') c.lerp(new THREE.Color('#d7dce2'), phase === 'night' ? 0.08 : 0.35);
      if (season.id === 'hemanta') c.lerp(new THREE.Color('#e8d6b8'), 0.15);
      return c;
    };
    this.skyMat.uniforms.top.value.copy(tint(sky.top));
    this.skyMat.uniforms.mid.value.copy(tint(sky.mid));
    this.skyMat.uniforms.bottom.value.copy(tint(sky.bottom));
    this.sun.color.set(sky.sun);
    this.sun.intensity = sky.sunI * (season.id === 'barsha' ? 0.6 : 1);
    this.hemi.intensity = sky.hemi;
    this.hemi.color.set(phase === 'night' ? '#7b8cc7' : '#ffffff');
    this.hemi.groundColor.set(phase === 'night' ? '#1a1f33' : '#6a6a4a');
    const fogC = tint(sky.fog);
    const density = (0.006 + season.scene.fog * 0.05 + (phase === 'dawn' ? 0.01 : 0)) * (phase === 'night' ? 0.45 : 1);
    this.skyMat.uniforms.uStars.value = phase === 'night' ? (season.id === 'barsha' ? 0.25 : 1) : 0;
    this.scene.fog = new THREE.FogExp2(fogC, density);
    this.renderer.toneMappingExposure = phase === 'night' ? 1.1 : 1.0;
    this.night = phase === 'night' ? 1 : 0;
    // Sun or moon glow in the sky behind the bough.
    const sunPos = { dawn: [-40, 4, -70], day: [-30, 40, -70], dusk: [40, 2, -70], night: [30, 30, -70] }[phase];
    this.sunSprite.position.set(...sunPos);
    this.sunSprite.material.color.set(phase === 'night' ? '#cfd8ff' : sky.sun);
    this.sunSprite.material.opacity = phase === 'night' ? 0.5 : season.id === 'barsha' ? 0.35 : 0.9;
    this.sunSprite.scale.setScalar(phase === 'night' ? 16 : 28);
    if (this.rain) {
      this.rain.material.color.set(phase === 'night' ? '#b9c8e6' : '#5f728c');
      this.rain.material.opacity = phase === 'night' ? 0.5 : 0.62;
    }
    if (this.flies) this.flies.material.uniforms.uNight.value = this.night;
  }

  computeAnchors() {
    const out = [];
    for (let i = 0; i < this.milestones; i++) {
      const x = 4 + (i * (this.L - 8)) / Math.max(1, this.milestones - 1);
      const u = (x + 14) / (this.L + 28);
      const p = this.curve.getPointAt(u);
      out.push({ i, x, p });
    }
    return out;
  }

  resize(w, h) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // Screen position of an anchor point, in CSS pixels.
  project(p, w, h, out = { x: 0, y: 0, z: 0 }) {
    const v = p.clone().project(this.camera);
    out.x = (v.x * 0.5 + 0.5) * w;
    out.y = (-v.y * 0.5 + 0.5) * h;
    out.z = v.z;
    return out;
  }

  render() {
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    const camX = 4 + this.progress * (this.L - 8);
    const u = (camX + 14) / (this.L + 28);
    const p = this.curve.getPointAt(Math.min(1, Math.max(0, u)));
    const dist = this.mobile ? 10 : 8.5;
    const target = new THREE.Vector3(camX, p.y + 0.4, p.z);
    this.camera.position.lerp(new THREE.Vector3(camX - 1.5 + this.pointer.x * 0.6, p.y + 1.2 + this.pointer.y * 0.4, p.z + dist), 0.12);
    this.camera.lookAt(target);
    this.sky.position.copy(this.camera.position);

    // Wind in the leaves: gentle whole-cloud sway.
    if (this.foliage) this.foliage.rotation.z = Math.sin(t * 0.6) * 0.004;

    if (this.falling) {
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const e = new THREE.Euler();
      const s = new THREE.Vector3();
      const pos = new THREE.Vector3();
      this.falling.userData.parts.forEach((pt, i) => {
        pt.y -= pt.vy * dt;
        pt.x += Math.sin(t * 0.8 + pt.sway) * dt * 0.6 - dt * 0.25;
        if (pt.y < -7) {
          pt.y = 7 + Math.random() * 3;
          pt.x = Math.random() * 30 - 15;
        }
        pos.set(camX + pt.x, pt.y + p.y, pt.z);
        e.set(t * pt.spin, t * pt.spin * 0.7, pt.sway);
        q.setFromEuler(e);
        s.setScalar(pt.size);
        m.compose(pos, q, s);
        this.falling.setMatrixAt(i, m);
      });
      this.falling.instanceMatrix.needsUpdate = true;
    }
    if (this.rain) {
      this.rain.position.set(camX, p.y + ((-(t * 14) % 6) + 6) % 6 - 3, 0);
    }
    if (this.flies) {
      this.flies.position.set(camX, p.y, 0);
      this.flies.material.uniforms.uTime.value = t;
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.scene.traverse((o) => {
      o.geometry?.dispose?.();
      if (o.material) [].concat(o.material).forEach((m) => m.dispose());
    });
    Object.values(this.textures).forEach((t) => t.dispose());
    this.renderer.dispose();
  }
}
