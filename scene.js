/*
 * Dollhouse cutaway — refined:
 * - 2–3 large deliberate top steps (not dense sawtooth)
 * - Projecting bay window (extruded out with side walls + sill)
 * - Thickness only at true outer cut edges
 * - Lighting / mood unchanged (camera only framing)
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/e85884eca00ae0cd9dc9f3d523d1d14a99f376e5/scene.js';

  function removeOriginalWalls() {
    if (typeof scene === 'undefined' || !scene) return;
    var kill = [];
    scene.traverse(function (obj) {
      if (!obj.isMesh && !(obj.isGroup && obj.name === 'diorama-walls')) return;
      var p = obj.position || { x: 0, y: 0, z: 0 };
      if (Math.abs(p.x + 7.5) < 0.6 || Math.abs(p.x - 7.5) < 0.6) {
        kill.push(obj);
        return;
      }
      if (
        obj.isMesh &&
        obj.geometry &&
        obj.geometry.type === 'PlaneGeometry' &&
        Math.abs(p.z + 3) < 0.4 &&
        Math.abs(p.y - 4) < 2.5
      ) {
        kill.push(obj);
      }
      if (obj.name === 'diorama-walls' || obj.name === 'right-wall-window') {
        kill.push(obj);
      }
    });
    kill.forEach(function (obj) {
      try {
        obj.visible = false;
        if (obj.parent) obj.parent.remove(obj);
      } catch (e) {}
    });
  }

  function buildDioramaWalls() {
    if (typeof THREE === 'undefined' || typeof scene === 'undefined' || !scene) return;
    if (window.__dioramaBuilt) return;
    window.__dioramaBuilt = true;

    var root = new THREE.Group();
    root.name = 'diorama-walls';

    var wallMat = new THREE.MeshStandardMaterial({
      color: 0x383838,
      roughness: 0.95,
      metalness: 0.0
    });
    var edgeMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.92,
      metalness: 0.03
    });
    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x2a2218,
      roughness: 0.5,
      metalness: 0.18
    });

    function box(w, h, d, x, y, z, mat) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || wallMat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      root.add(m);
      return m;
    }

    // =========================================================
    // BACK WALL — 2 large steps only (near left open corner, near right corner)
    // Runs along X at z ≈ -3. Solid continuous wall, not many segments.
    // =========================================================
    var BACK_Z = -3.1;
    var BACK_THICK = 0.42;
    // Three spans: high | mid-step down | lower near right corner
    // Span A: x -7.5 → -1.5  height 7.4
    box(6.0, 7.4, BACK_THICK, -4.5, 3.7, BACK_Z);
    // Span B: x -1.5 → 3.0   height 6.6  (one deliberate step)
    box(4.5, 6.6, BACK_THICK, 0.75, 3.3, BACK_Z);
    // Span C: x 3.0 → 7.5    height 5.8  (second step near corner)
    box(4.5, 5.8, BACK_THICK, 5.25, 2.9, BACK_Z);

    // Thickness visible only on the LEFT outer cut of the back wall (open side)
    box(0.12, 7.4, BACK_THICK + 0.08, -7.45, 3.7, BACK_Z, edgeMat);

    // =========================================================
    // RIGHT WALL — solid with 2–3 steps + projecting bay
    // =========================================================
    var RX = 7.35;
    var R_THICK = 0.42;
    var zBack = -3.0;
    var zFront = 11.5;

    // Window / bay placement
    var bayZ0 = 3.2;
    var bayZ1 = 7.0;
    var bayW = bayZ1 - bayZ0; // ~3.8
    var bayH = 3.9;
    var bayBottom = 1.5;
    var bayOut = 0.85; // how far bay projects outward (+X)

    // --- Right wall segments (few large pieces, not sawtooth) ---
    // 1) Back of right wall (toward back corner) — tall
    var seg1z0 = zBack;
    var seg1z1 = bayZ0;
    box(R_THICK, 7.2, seg1z1 - seg1z0, RX, 3.6, (seg1z0 + seg1z1) / 2);

    // 2) Below bay
    box(R_THICK, bayBottom, bayW, RX, bayBottom / 2, (bayZ0 + bayZ1) / 2);

    // 3) Above bay — one step lower than back section
    var aboveH = 6.2 - (bayBottom + bayH);
    if (aboveH < 0.3) aboveH = 0.8;
    var aboveTop = bayBottom + bayH + aboveH;
    box(R_THICK, aboveH, bayW, RX, bayBottom + bayH + aboveH / 2, (bayZ0 + bayZ1) / 2);

    // 4) Front of right wall after bay — third step, lower
    var seg4z0 = bayZ1;
    var seg4z1 = zFront;
    box(R_THICK, 5.4, seg4z1 - seg4z0, RX, 2.7, (seg4z0 + seg4z1) / 2);

    // Thickness only at FRONT outer cut of right wall (true room boundary)
    box(R_THICK + 0.08, 5.4, 0.12, RX, 2.7, zFront, edgeMat);

    // =========================================================
    // PROJECTING BAY WINDOW (extruded outward with side walls + sill)
    // =========================================================
    var bayX = RX + R_THICK / 2 + bayOut / 2;

    // Bay side walls (visible depth)
    box(bayOut, bayH, 0.12, bayX, bayBottom + bayH / 2, bayZ0, wallMat);
    box(bayOut, bayH, 0.12, bayX, bayBottom + bayH / 2, bayZ1, wallMat);

    // Bay top slab
    box(bayOut, 0.12, bayW, bayX, bayBottom + bayH, (bayZ0 + bayZ1) / 2, wallMat);

    // Bay sill (bottom of projection + slight inward lip)
    box(bayOut + 0.25, 0.1, bayW + 0.1, RX + R_THICK / 2 + bayOut / 2 - 0.05, bayBottom, (bayZ0 + bayZ1) / 2, edgeMat);

    // Outer face of bay (thin rim around glass)
    // Top outer
    box(0.1, 0.14, bayW, RX + R_THICK / 2 + bayOut, bayBottom + bayH, (bayZ0 + bayZ1) / 2);
    // Bottom outer
    box(0.1, 0.14, bayW, RX + R_THICK / 2 + bayOut, bayBottom, (bayZ0 + bayZ1) / 2);
    // Side outers
    box(0.1, bayH, 0.14, RX + R_THICK / 2 + bayOut, bayBottom + bayH / 2, bayZ0);
    box(0.1, bayH, 0.14, RX + R_THICK / 2 + bayOut, bayBottom + bayH / 2, bayZ1);

    // Window frame inside bay
    var frame = box(0.08, bayH - 0.15, bayW - 0.15, RX + R_THICK / 2 + 0.15, bayBottom + bayH / 2, (bayZ0 + bayZ1) / 2, frameMat);

    // Muntins 2x2
    box(0.06, bayH - 0.25, 0.08, RX + R_THICK / 2 + 0.15, bayBottom + bayH / 2, (bayZ0 + bayZ1) / 2, frameMat);
    box(0.06, 0.08, bayW - 0.25, RX + R_THICK / 2 + 0.15, bayBottom + bayH / 2, (bayZ0 + bayZ1) / 2, frameMat);

    // Glass
    var glass = new THREE.Mesh(
      new THREE.PlaneGeometry(bayW - 0.35, bayH - 0.35),
      new THREE.MeshStandardMaterial({
        color: 0x9ec5e0,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        metalness: 0.12,
        side: THREE.DoubleSide
      })
    );
    glass.position.set(RX + R_THICK / 2 + bayOut * 0.55, bayBottom + bayH / 2, (bayZ0 + bayZ1) / 2);
    glass.rotation.y = Math.PI / 2;
    root.add(glass);

    // Outdoor view at outer face of bay
    var c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    var ctx = c.getContext('2d');
    var grd = ctx.createLinearGradient(0, 0, 0, 512);
    grd.addColorStop(0, '#a8c8e0');
    grd.addColorStop(0.5, '#d8e6f0');
    grd.addColorStop(1, '#b8d0a8');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 512, 512);
    for (var i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(30 + Math.random() * 450, 50 + Math.random() * 320, 20 + Math.random() * 55, 0, Math.PI * 2);
      ctx.fillStyle = Math.random() > 0.35 ? 'rgba(140,80,170,0.5)' : 'rgba(70,130,70,0.45)';
      ctx.fill();
    }
    var view = new THREE.Mesh(
      new THREE.PlaneGeometry(bayW - 0.3, bayH - 0.3),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) })
    );
    view.position.set(RX + R_THICK / 2 + bayOut + 0.02, bayBottom + bayH / 2, (bayZ0 + bayZ1) / 2);
    view.rotation.y = -Math.PI / 2;
    root.add(view);

    // Curtain on room side of bay opening
    var curtain = box(0.1, bayH - 0.3, 0.9, RX - R_THICK / 2 - 0.08, bayBottom + bayH / 2, bayZ0 + 0.55,
      new THREE.MeshStandardMaterial({ color: 0xf0ebe3, roughness: 0.88, side: THREE.DoubleSide }));

    scene.add(root);
  }

  function applyView() {
    if (typeof camera === 'undefined' || typeof controls === 'undefined' || !camera || !controls) {
      setTimeout(applyView, 150);
      return;
    }
    if (window.__isoViewApplied) return;
    window.__isoViewApplied = true;

    // Framing only — does not alter scene lights
    camera.position.set(-9.5, 10.5, 9.8);
    camera.lookAt(0, 1.4, 0.5);
    controls.target.set(0, 1.4, 0.5);
    controls.minDistance = 10;
    controls.maxDistance = 26;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI / 2.4;
    controls.minAzimuthAngle = -Math.PI / 1.7;
    controls.maxAzimuthAngle = Math.PI / 3.2;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.25;
    if (controls.update) controls.update();

    setTimeout(function () {
      window.__dioramaBuilt = false;
      removeOriginalWalls();
      buildDioramaWalls();
    }, 250);
  }

  function loadFurniture() {
    if (typeof scene === 'undefined' || !scene) {
      setTimeout(loadFurniture, 200);
      return;
    }
    if (window.__furnitureAdded) return;

    function runCreates() {
      if (window.__furnitureAdded) return;
      if (typeof createLobbyChair !== 'function') {
        setTimeout(runCreates, 100);
        return;
      }
      window.__furnitureAdded = true;
      try {
        if (typeof createOfficeChair === 'function') createOfficeChair();
        createLobbyChair();
      } catch (e) {
        console.warn('Furniture create failed', e);
      }
    }

    if (!document.querySelector('script[data-furniture]')) {
      var s = document.createElement('script');
      s.src = 'furniture.js?v=dio2';
      s.setAttribute('data-furniture', '1');
      s.onload = runCreates;
      document.body.appendChild(s);
    } else {
      runCreates();
    }
  }

  function afterSceneCodeInjected() {
    function ensureInit() {
      if (typeof init === 'function' && typeof scene === 'undefined') {
        try {
          init();
        } catch (e) {
          console.warn('init error', e);
        }
      }
      if (typeof scene === 'undefined') {
        setTimeout(ensureInit, 100);
        return;
      }
      applyView();
      loadFurniture();
    }
    setTimeout(ensureInit, 50);
  }

  fetch(GOOD_SCENE_URL, { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('Failed to fetch good scene: ' + r.status);
      return r.text();
    })
    .then(function (code) {
      var script = document.createElement('script');
      script.textContent = code;
      document.body.appendChild(script);
      afterSceneCodeInjected();
    })
    .catch(function (err) {
      console.error(err);
      var el = document.getElementById('loadingScreen');
      if (el) {
        el.style.opacity = '1';
        el.innerHTML =
          '<div style="color:#fff;padding:2rem;font-family:monospace;text-align:center">Scene load failed. Hard-refresh.<br/>' +
          String(err) +
          '</div>';
      }
    });
})();
