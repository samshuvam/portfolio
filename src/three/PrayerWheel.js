import * as THREE from 'three';

// A prayer wheel of photographs. A copper drum carries the mantra; curved
// photo panels spiral around it on a helix. Spin it by dragging. Clockwise,
// seen from above, is the proper direction; it moves the near side left.

const MANTRA = 'ༀ་མ་ཎི་པདྨེ་ཧཱུྃ';

function drumTexture() {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#5a2e14');
  grad.addColorStop(0.18, '#b8743a');
  grad.addColorStop(0.5, '#d9a05e');
  grad.addColorStop(0.82, '#b8743a');
  grad.addColorStop(1, '#5a2e14');
  g.fillStyle = grad;
  g.fillRect(0, 0, 2048, 512);
  // Bands.
  g.fillStyle = 'rgba(60,25,8,0.55)';
  g.fillRect(0, 70, 2048, 10);
  g.fillRect(0, 432, 2048, 10);
  // The mantra, repeated around the drum.
  g.fillStyle = '#3d1c08';
  g.font = '400 150px "Noto Serif Tibetan", serif';
  g.textBaseline = 'middle';
  for (let i = 0; i < 2; i++) g.fillText(MANTRA, 40 + i * 1024, 262);
  g.fillStyle = 'rgba(255,230,180,0.25)';
  g.fillRect(0, 230, 2048, 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

export class PrayerWheel {
  constructor(canvas, photos, { mobile = false, onSelect } = {}) {
    this.canvas = canvas;
    this.photos = photos;
    this.onSelect = onSelect;
    this.mobile = mobile;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(mobile ? 50 : 36, 1, 0.1, 100);
    this.camera.position.set(0, 0.2, mobile ? 13 : 12);
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.angle = 0; // radians, total
    this.velocity = 0.12; // radians/s idle drift, clockwise
    this.turns = 0;
    this.lastWhole = 0;
    this.scrollOffset = 0;
    this.hover = -1;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-10, -10);

    const hemi = new THREE.HemisphereLight(0xfff1dd, 0x3a2a1a, 1.4);
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(4, 6, 8);
    const rim = new THREE.DirectionalLight(0xffc98a, 1.2);
    rim.position.set(-6, 2, -4);
    this.scene.add(hemi, key, rim);

    this.buildDrum();
    this.buildPanels();
  }

  buildDrum() {
    const r = this.mobile ? 1.15 : 1.35;
    this.drumTex = drumTexture();
    this.drumTex.repeat.set(1, 1);
    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, 3.4, 64, 1, true),
      new THREE.MeshStandardMaterial({ map: this.drumTex, metalness: 0.75, roughness: 0.35, side: THREE.DoubleSide }),
    );
    this.group.add(drum);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xa8652e, metalness: 0.85, roughness: 0.3 });
    [-1.75, 1.75].forEach((y) => {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.08, r * 1.08, 0.14, 64), capMat);
      cap.position.y = y;
      this.group.add(cap);
    });
    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 24), capMat);
    finial.position.y = 2.1;
    this.group.add(finial);
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 9, 12), new THREE.MeshStandardMaterial({ color: 0x5a3a20, metalness: 0.6, roughness: 0.5 }));
    this.scene.add(axle);
    this.drum = drum;
    this.drumRadius = r;
  }

  buildPanels() {
    const n = this.photos.length;
    const perTurn = this.mobile ? 9 : 12;
    const radius = this.mobile ? 2.7 : 3.3;
    const pitch = this.mobile ? 0.95 : 1.05; // vertical rise per panel row
    const span = (Math.PI * 2) / perTurn;
    const loader = new THREE.TextureLoader();
    this.panels = [];
    const height = this.mobile ? 0.82 : 0.95;
    const totalH = (n / perTurn) * pitch * perTurn * 0.12 + height;
    this.photos.forEach((p, i) => {
      const theta0 = i * span;
      const width = span * 0.86; // arc length fraction
      const geo = new THREE.CylinderGeometry(radius, radius, height, 18, 1, true, theta0 - width / 2, width);
      // Flip UVs horizontally so photos read correctly from outside.
      const uv = geo.attributes.uv;
      for (let k = 0; k < uv.count; k++) uv.setX(k, 1 - uv.getX(k));
      const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(p.color || '#888'), roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      const y = (i / n) * (n / perTurn) * pitch - ((n / perTurn) * pitch) / 2;
      mesh.position.y = y;
      mesh.userData = { index: i, baseY: y };
      this.group.add(mesh);
      this.panels.push(mesh);
      // Cover-fit: crop the photo to the panel's aspect ratio.
      const panelAspect = (radius * width) / height;
      loader.load(p.tex, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        const imgAspect = tex.image.width / tex.image.height;
        if (imgAspect > panelAspect) {
          tex.repeat.set(panelAspect / imgAspect, 1);
          tex.offset.set((1 - tex.repeat.x) / 2, 0);
        } else {
          tex.repeat.set(1, imgAspect / panelAspect);
          tex.offset.set(0, (1 - tex.repeat.y) / 2);
        }
        mat.map = tex;
        mat.color.set('#ffffff');
        mat.needsUpdate = true;
      });
    });
    this.helixHeight = totalH;
  }

  resize(w, h) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.width = w;
    this.height = h;
  }

  setPointer(x, y) {
    this.pointer.set((x / this.width) * 2 - 1, -(y / this.height) * 2 + 1);
  }

  pick() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.panels, false);
    const front = hits.find((h) => h.face && h.face.normal && h.point.z > -0.2);
    return front ? front.object.userData.index : -1;
  }

  // Positive impulse spins clockwise (seen from above).
  spin(impulse) {
    this.velocity += impulse;
  }

  render() {
    const dt = Math.min(0.05, this.clock.getDelta());
    this.velocity *= Math.pow(0.35, dt); // friction
    if (Math.abs(this.velocity) < 0.12 && !this.dragging) this.velocity += (0.12 - this.velocity) * 0.02; // settle to idle drift
    this.angle += this.velocity * dt;
    // Clockwise from above is negative rotation about +Y in three.js.
    this.group.rotation.y = -this.angle;
    this.group.position.y = this.scrollOffset;
    const whole = Math.floor(this.angle / (Math.PI * 2));
    if (whole !== this.lastWhole) {
      if (whole > this.lastWhole) this.turns += 1;
      this.lastWhole = whole;
      this.onTurn?.(this.turns);
    }
    // Hover lift.
    const h = this.pick();
    if (h !== this.hover) this.hover = h;
    this.panels.forEach((m, i) => {
      const target = i === this.hover ? 1.06 : 1;
      m.scale.x += (target - m.scale.x) * 0.15;
      m.scale.z += (target - m.scale.z) * 0.15;
      m.scale.y += (target - m.scale.y) * 0.15;
    });
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.scene.traverse((o) => {
      o.geometry?.dispose?.();
      if (o.material) {
        [].concat(o.material).forEach((m) => {
          m.map?.dispose?.();
          m.dispose();
        });
      }
    });
    this.renderer.dispose();
  }
}
