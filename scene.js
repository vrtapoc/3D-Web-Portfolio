/*
 * Walls-only layout:
 * - No left wall (open diorama view)
 * - Continuous back wall with door on the left side of it
 * - Giant full-length panoramic bay on the right
 * - Does not move desk/props (walls only)
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/e85884eca00ae0cd9dc9f3d523d1d14a99f376e5/scene.js';

  var H = 6.8;
  var T = 0.18;
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
      if (Math.abs(p.x + 7.5) < 0.6 || Math.abs(p.x - 7.5) < 0.6) {
        kill.push(obj);
        return;
      }
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

    // Footprint — left & front open for camera
    var xL = -6.2; // open edge (no wall)
    var xR = 5.8; // right bay inner line
    var zB = -2.95; // back wall
    var zF = 7.8; // front open edge

    // ---------- BACK WALL (continuous) + DOOR on left side ----------
    var doorW = 1.9;
    var doorH = 4.5;
    // Door placed left of desk (desk is near x=0), so door center around x = -3.8
    var doorX = -3.9;
    var doorX0 = doorX - doorW / 2;
    var doorX1 = doorX + doorW / 2;

    // Back wall spans from open left edge to right bay start
    var backX0 = xL;
    var backX1 = xR;

    // Segment left of door
    if (doorX0 > backX0) {
      addBox(doorX0 - backX0, H, T, (backX0 + doorX0) / 2, H / 2, zB);
    }
    // Above door
    addBox(doorW, H - doorH, T, doorX, doorH + (H - doorH) / 2, zB);
    // Segment right of door → bay
    if (backX1 > doorX1) {
      addBox(backX1 - doorX1, H, T, (doorX1 + backX1) / 2, H / 2, zB);
    }

    // Door frame + panel (on back wall)
    var ft = 0.08;
    addBox(ft, doorH + 0.1, T + 0.04, doorX0, doorH / 2, zB, frameMat);
    addBox(ft, doorH + 0.1, T + 0.04, doorX1, doorH / 2, zB, frameMat);
    addBox(doorW, ft, T + 0.04, doorX, doorH, zB, frameMat);
    addBox(doorW - 0.12, doorH - 0.1, 0.06, doorX, doorH / 2, zB + T / 2 + 0.02, doorMat);
    // Handle
    addBox(0.18, 0.04, 0.04, doorX + doorW * 0.28, doorH * 0.45, zB + T / 2 + 0.06, frameMat);

    // ---------- GIANT RIGHT BAY WINDOW (full depth) ----------
    var bayDepth = 1.8;
    var bayXInner = xR;
    var bayXOuter = xR + bayDepth;

    // Bay runs almost full room depth along Z
    var bayZ0 = zB + 0.2;
    var bayZ1 = zF - 0.4;
    var bayLen = bayZ1 - bayZ0; // ~ major depth span

    // 45° side walls at back and front of bay
    var sideLen = Math.sqrt(bayDepth * bayDepth + bayDepth * bayDepth) * 0.92;

    var sideBack = addBox(T, H, sideLen, 0, H / 2, 0);
    sideBack.position.set((bayXInner + bayXOuter) / 2, H / 2, bayZ0 - 0.05);
    sideBack.rotation.y = Math.PI / 4;

    var sideFront = addBox(T, H, sideLen, 0, H / 2, 0);
    sideFront.position.set((bayXInner + bayXOuter) / 2, H / 2, bayZ1 + 0.05);
    sideFront.rotation.y = -Math.PI / 4;

    // Outer window wall (main run)
    var outerZ0 = bayZ0 + 0.55;
    var outerZ1 = bayZ1 - 0.55;
    var outerLen = Math.max(outerZ1 - outerZ0, 2);

    // Ceiling header / soffit (~0.5m scaled)
    var headerH = 1.05;
    var headerBottom = H - headerH;
    addBox(T, headerH, outerLen, bayXOuter, headerBottom + headerH / 2, (outerZ0 + outerZ1) / 2);

    // Full-length built-in bench
    var benchH = 0.9;
    addBox(
      bayDepth + 0.1,
      benchH,
      outerLen + 0.6,
      (bayXInner + bayXOuter) / 2,
      benchH / 2,
      (outerZ0 + outerZ1) / 2
    );

    // Multi-panel mullions (floor-to-header glass)
    var winBottom = benchH;
    var winTop = headerBottom;
    var winH = winTop - winBottom;
    var paneCount = 5;
    var paneW = outerLen / paneCount;

    for (var i = 0; i <= paneCount; i++) {
      var mz = outerZ0 + i * paneW;
      addBox(0.07, winH, 0.07, bayXOuter, winBottom + winH / 2, mz, frameMat);
    }
    addBox(0.07, 0.07, outerLen, bayXOuter, winBottom, (outerZ0 + outerZ1) / 2, frameMat);
    addBox(0.07, 0.07, outerLen, bayXOuter, winTop, (outerZ0 + outerZ1) / 2, frameMat);
    addBox(0.07, 0.07, outerLen, bayXOuter, winBottom + winH * 0.5, (outerZ0 + outerZ1) / 2, frameMat);

    // Glass panes
    for (var p = 0; p < paneCount; p++) {
      var pz = outerZ0 + paneW * (p + 0.5);
      var glass = new THREE.Mesh(
        new THREE.PlaneGeometry(paneW - 0.1, winH - 0.1),
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

    // Sunset city skyline view
    var c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    var ctx = c.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#1a1528');
    g.addColorStop(0.35, '#c45a2a');
    g.addColorStop(0.55, '#e89040');
    g.addColorStop(0.75, '#f0c070');
    g.addColorStop(1, '#2a2838');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 512);
    // sun
    ctx.beginPath();
    ctx.arc(720, 200, 40, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,220,120,0.9)';
    ctx.fill();
    // buildings
    ctx.fillStyle = 'rgba(18,18,28,0.9)';
    for (var b = 0; b < 28; b++) {
      var bw = 18 + Math.random() * 42;
      var bh = 50 + Math.random() * 220;
      ctx.fillRect(10 + b * 36, 512 - bh - 30, bw, bh);
    }
    var view = new THREE.Mesh(
      new THREE.PlaneGeometry(outerLen - 0.05, winH - 0.05),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) })
    );
    view.position.set(bayXOuter + 0.1, winBottom + winH / 2, (outerZ0 + outerZ1) / 2);
    view.rotation.y = -Math.PI / 2;
    root.add(view);

    // Short solid return at front-right (terminates bay cleanly)
    addBox(T, H, 0.5, xR, H / 2, zF - 0.15);

    // ---------- BASEBOARDS ----------
    var bbH = 0.12;
    // Back wall baseboard (skip door gap roughly)
    addBox(doorX0 - backX0, bbH, T + 0.02, (backX0 + doorX0) / 2, bbH / 2, zB, trimMat);
    addBox(backX1 - doorX1, bbH, T + 0.02, (doorX1 + backX1) / 2, bbH / 2, zB, trimMat);

    // ---------- FLOOR PLATFORM under new footprint (snug) ----------
    // Does not move props; adds a subtle slab edge under open sides only if needed
    // Keep minimal — user asked floor base fit; use thin edge under open left/front
    var floorMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1c,
      roughness: 0.9,
      metalness: 0.04
    });
    // Front lip
    addBox((xR + bayDepth) - xL + 1.2, 0.08, 0.2, (xL + xR + bayDepth) / 2, 0.02, zF + 0.05, floorMat);
    // Left lip
    addBox(0.2, 0.08, zF - zB + 0.4, xL - 0.1, 0.02, (zB + zF) / 2, floorMat);

    scene.add(root);
  }

  function applyView() {
    if (typeof camera === 'undefined' || typeof controls === 'undefined' || !camera || !controls) {
      setTimeout(applyView, 150);
      return;
    }
    if (window.__isoViewApplied) return;
    window.__isoViewApplied = true;

    // Open-left diorama framing — clears left wall so frustum is free
    camera.position.set(-10.5, 11.0, 10.5);
    camera.lookAt(0.2, 1.5, 1.0);
    controls.target.set(0.2, 1.5, 1.0);
    controls.minDistance = 11;
    controls.maxDistance = 28;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI / 2.4;
    controls.minAzimuthAngle = -Math.PI / 1.6;
    controls.maxAzimuthAngle = Math.PI / 3.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.22;
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
      s.src = 'furniture.js?v=walls4';
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
