/*
 * Walls-only rebuild to match portfolio mock-up.
 * Does not move or edit any other scene objects.
 *
 * - Uniform flat wall height (no steps)
 * - Continuous perimeter: left → back → bay alcove → right return
 * - Door opening on left wall
 * - Projecting bay window (header, bench, 3 panes)
 * - Baseboards
 * - Charcoal matte material
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/e85884eca00ae0cd9dc9f3d523d1d14a99f376e5/scene.js';

  // Scene-unit scale (existing room ~15 units; original walls were H≈8).
  // Proportions map from mock meters (3.2m ceiling) into this room.
  var H = 6.8; // uniform wall height
  var T = 0.18; // wall thickness
  var WALL_COLOR = 0x1e1e22;

  function removeOriginalWalls() {
    if (typeof scene === 'undefined' || !scene) return;
    var kill = [];
    scene.traverse(function (obj) {
      if (!obj) return;
      if (obj.name === 'diorama-walls' || obj.name === 'right-wall-window') {
        kill.push(obj);
        return;
      }
      if (!obj.isMesh) return;
      var p = obj.position || { x: 0, y: 0, z: 0 };
      // Original left / right stucco planes
      if (Math.abs(p.x + 7.5) < 0.6 || Math.abs(p.x - 7.5) < 0.6) {
        kill.push(obj);
        return;
      }
      // Original back plane
      if (
        obj.geometry &&
        obj.geometry.type === 'PlaneGeometry' &&
        Math.abs(p.z + 3) < 0.45 &&
        Math.abs(p.y - 4) < 3
      ) {
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

  function buildWalls() {
    if (typeof THREE === 'undefined' || typeof scene === 'undefined' || !scene) return;
    if (window.__dioramaBuilt) return;
    window.__dioramaBuilt = true;

    var root = new THREE.Group();
    root.name = 'diorama-walls';

    var wallMat = new THREE.MeshStandardMaterial({
      color: WALL_COLOR,
      roughness: 0.85,
      metalness: 0.05
    });
    var trimMat = new THREE.MeshStandardMaterial({
      color: 0x161618,
      roughness: 0.9,
      metalness: 0.04
    });
    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.45,
      metalness: 0.25
    });
    var doorMat = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.7,
      metalness: 0.08
    });

    function addBox(w, h, d, x, y, z, mat) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || wallMat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      root.add(m);
      return m;
    }

    // Footprint (top-down), aligned to existing room props
    var xL = -6.8; // left wall inner face centerline ~
    var xR = 6.2; // right return
    var zB = -2.95; // back wall
    var zF = 8.2; // front open edge (no front wall)

    // Bay alcove on right-back (45° sides, center parallel to back)
    var bayDepth = 1.7; // ~0.8m scaled
    var bayCenterW = 3.6; // center pane run along Z-parallel (actually along X from back)
    // Bay sits on the right side: from back wall going forward a bit, projecting +X
    var bayZ0 = zB + 0.15;
    var bayZ1 = bayZ0 + bayCenterW;
    var bayXInner = xR;
    var bayXOuter = xR + bayDepth;

    // ---------- LEFT WALL (with door) ----------
    // Runs from front to back at x = xL
    var doorW = 1.9;
    var doorH = 4.5;
    var doorZ = 2.2; // centered along left wall stretch
    var leftLen = zF - zB;
    var leftCenterZ = (zF + zB) / 2;

    // Left wall segments around door
    var leftZ0 = zB;
    var leftZ1 = zF;
    var doorZ0 = doorZ - doorW / 2;
    var doorZ1 = doorZ + doorW / 2;

    // Behind door (toward back)
    addBox(T, H, doorZ0 - leftZ0, xL, H / 2, (leftZ0 + doorZ0) / 2);
    // Above door
    addBox(T, H - doorH, doorW, xL, doorH + (H - doorH) / 2, doorZ);
    // In front of door (toward front)
    addBox(T, H, leftZ1 - doorZ1, xL, H / 2, (doorZ1 + leftZ1) / 2);

    // Door frame + panel
    var frameT = 0.08;
    addBox(T + 0.04, doorH + 0.12, frameT, xL, doorH / 2, doorZ0, frameMat);
    addBox(T + 0.04, doorH + 0.12, frameT, xL, doorH / 2, doorZ1, frameMat);
    addBox(T + 0.04, frameT, doorW, xL, doorH, doorZ, frameMat);
    // Flat door panel
    addBox(0.06, doorH - 0.1, doorW - 0.12, xL - T / 2 - 0.02, doorH / 2, doorZ, doorMat);
    // Handle
    addBox(0.04, 0.04, 0.18, xL - T / 2 - 0.06, doorH * 0.45, doorZ + doorW * 0.28, frameMat);

    // ---------- BACK WALL (straight, uniform height) ----------
    // From left wall to bay start
    var backStartX = xL + T / 2;
    var backEndX = bayXInner;
    var backLen = backEndX - backStartX;
    addBox(backLen, H, T, (backStartX + backEndX) / 2, H / 2, zB);

    // ---------- BAY WINDOW ALCOVE (right-back) ----------
    // 45° outward, center parallel, 45° back in
    // Approximate 45° walls with thin boxes along diagonals in XZ

    // Side wall A: from (bayXInner, bayZ0) outward to (bayXOuter, bayZ0 + bayDepth*0.15)
    // Simpler architectural bay matching mock: three faces
    // 1) Angled left side of bay (back-left of bay)
    var sideLen = Math.sqrt(bayDepth * bayDepth + (bayDepth * 0.85) * (bayDepth * 0.85));
    // Left 45° panel (from inner back toward outer)
    var baySideA = addBox(T, H, sideLen, 0, H / 2, 0);
    baySideA.position.set(
      (bayXInner + bayXOuter) / 2,
      H / 2,
      bayZ0 - 0.15
    );
    baySideA.rotation.y = Math.PI / 4;

    // Right 45° panel
    var baySideB = addBox(T, H, sideLen, 0, H / 2, 0);
    baySideB.position.set(
      (bayXInner + bayXOuter) / 2,
      H / 2,
      bayZ1 + 0.15
    );
    baySideB.rotation.y = -Math.PI / 4;

    // Outer center face of bay (parallel to back wall, holds windows)
    var outerZ0 = bayZ0 + 0.35;
    var outerZ1 = bayZ1 - 0.35;
    var outerLen = outerZ1 - outerZ0;

    // Header / soffit: solid from H down to 2.6m-scaled (~5.5)
    var headerBottom = 5.5;
    addBox(T, H - headerBottom, outerLen, bayXOuter, headerBottom + (H - headerBottom) / 2, (outerZ0 + outerZ1) / 2);

    // Built-in bench 0→0.45m scaled (~0.95)
    var benchH = 0.95;
    addBox(bayDepth + 0.15, benchH, outerLen + 0.5, (bayXInner + bayXOuter) / 2, benchH / 2, (outerZ0 + outerZ1) / 2, wallMat);

    // Mullions / 3 window panels between bench top and header bottom
    var winBottom = benchH;
    var winTop = headerBottom;
    var winH = winTop - winBottom;
    var paneW = outerLen / 3;

    // Vertical mullions
    for (var i = 0; i <= 3; i++) {
      var mz = outerZ0 + i * paneW;
      addBox(0.07, winH, 0.07, bayXOuter, winBottom + winH / 2, mz, frameMat);
    }
    // Horizontal rails
    addBox(0.07, 0.07, outerLen, bayXOuter, winBottom, (outerZ0 + outerZ1) / 2, frameMat);
    addBox(0.07, 0.07, outerLen, bayXOuter, winTop, (outerZ0 + outerZ1) / 2, frameMat);
    addBox(0.07, 0.07, outerLen, bayXOuter, winBottom + winH / 2, (outerZ0 + outerZ1) / 2, frameMat);

    // Glass panes (3)
    for (var p = 0; p < 3; p++) {
      var pz = outerZ0 + paneW * (p + 0.5);
      var glass = new THREE.Mesh(
        new THREE.PlaneGeometry(paneW - 0.12, winH - 0.12),
        new THREE.MeshStandardMaterial({
          color: 0x88aacc,
          transparent: true,
          opacity: 0.28,
          roughness: 0.1,
          metalness: 0.15,
          side: THREE.DoubleSide
        })
      );
      glass.position.set(bayXOuter - 0.02, winBottom + winH / 2, pz);
      glass.rotation.y = Math.PI / 2;
      root.add(glass);
    }

    // Soft exterior view behind bay
    var c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    var ctx = c.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#1a1520');
    g.addColorStop(0.4, '#c47a3a');
    g.addColorStop(0.7, '#e8a050');
    g.addColorStop(1, '#2a2a35');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    // simple city blocks silhouette
    ctx.fillStyle = 'rgba(20,20,28,0.85)';
    for (var b = 0; b < 14; b++) {
      var bw = 20 + Math.random() * 40;
      var bh = 60 + Math.random() * 180;
      ctx.fillRect(15 + b * 35, 512 - bh - 40, bw, bh);
    }
    var view = new THREE.Mesh(
      new THREE.PlaneGeometry(outerLen - 0.1, winH - 0.1),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) })
    );
    view.position.set(bayXOuter + 0.12, winBottom + winH / 2, (outerZ0 + outerZ1) / 2);
    view.rotation.y = -Math.PI / 2;
    root.add(view);

    // ---------- RIGHT RETURN WALL (straight to front) ----------
    var rightZ0 = bayZ1 + 0.2;
    var rightZ1 = zF;
    if (rightZ1 > rightZ0) {
      addBox(T, H, rightZ1 - rightZ0, xR, H / 2, (rightZ0 + rightZ1) / 2);
    }

    // Corner posts for clean thickness at outer cuts
    addBox(T + 0.04, H, T + 0.04, xL, H / 2, zB, wallMat);
    addBox(T + 0.04, H, T + 0.04, xL, H / 2, zF - 0.05, wallMat);
    addBox(T + 0.04, H, T + 0.04, xR, H / 2, zF - 0.05, wallMat);

    // ---------- BASEBOARDS (continuous along walls at floor) ----------
    var bbH = 0.12;
    // Left
    addBox(T + 0.02, bbH, leftLen, xL, bbH / 2, leftCenterZ, trimMat);
    // Back
    addBox(backLen, bbH, T + 0.02, (backStartX + backEndX) / 2, bbH / 2, zB, trimMat);
    // Right return
    if (rightZ1 > rightZ0) {
      addBox(T + 0.02, bbH, rightZ1 - rightZ0, xR, bbH / 2, (rightZ0 + rightZ1) / 2, trimMat);
    }
    // Bay bench already acts as base in alcove

    scene.add(root);
  }

  function applyView() {
    if (typeof camera === 'undefined' || typeof controls === 'undefined' || !camera || !controls) {
      setTimeout(applyView, 150);
      return;
    }
    if (window.__isoViewApplied) return;
    window.__isoViewApplied = true;

    // Framing only — no light changes
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
      buildWalls();
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
      s.src = 'furniture.js?v=walls3';
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
