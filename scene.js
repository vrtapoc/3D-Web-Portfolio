/*
 * Bugfix pass:
 * 1) Flush back wall ↔ bay corner (no gap)
 * 2) Remove front-right floating pillar
 * 3) Walls/frames/bench/header: castShadow=false (props keep shadows)
 * 4) Stricter OrbitControls azimuth/polar + centered target
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

  function trimOriginalFloor() {
    if (typeof scene === 'undefined' || !scene) return;
    scene.traverse(function (obj) {
      if (!obj.isMesh || !obj.geometry) return;
      if (
        obj.geometry.type === 'PlaneGeometry' &&
        Math.abs(obj.position.y) < 0.05 &&
        obj.rotation &&
        Math.abs(obj.rotation.x + Math.PI / 2) < 0.25
      ) {
        obj.visible = false;
      }
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
    var floorMat = new THREE.MeshStandardMaterial({
      color: 0x252528,
      roughness: 0.88,
      metalness: 0.04
    });
    var benchMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2e,
      roughness: 0.82,
      metalness: 0.05
    });

    // Architectural meshes: receive light, do NOT cast floor-cutting shadows
    function addArch(w, h, d, x, y, z, mat) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || wallMat);
      m.position.set(x, y, z);
      m.castShadow = false;
      m.receiveShadow = true;
      root.add(m);
      return m;
    }

    var xL = -5.8;
    var xR = 5.4;
    var zB = -2.95;
    var zF = 5.2;

    // Floor slab
    var floorW = xR + 1.7 - xL + 0.3;
    var floorD = zF - zB + 0.4;
    addArch(floorW, 0.12, floorD, (xL + xR + 1.5) / 2, -0.06, (zB + zF) / 2, floorMat);

    // ---------- BACK WALL + DOOR ----------
    // Extend back wall fully to xR so it meets bay with zero gap
    var doorW = 1.9;
    var doorH = 4.5;
    var doorX = -3.6;
    var doorX0 = doorX - doorW / 2;
    var doorX1 = doorX + doorW / 2;
    var backX0 = xL;
    var backX1 = xR + T / 2; // overlap slightly into bay corner

    if (doorX0 > backX0) {
      addArch(doorX0 - backX0, H, T, (backX0 + doorX0) / 2, H / 2, zB);
    }
    addArch(doorW, H - doorH, T, doorX, doorH + (H - doorH) / 2, zB);
    if (backX1 > doorX1) {
      addArch(backX1 - doorX1, H, T, (doorX1 + backX1) / 2, H / 2, zB);
    }

    // Corner fill block — seals back wall to right bay
    addArch(T * 1.5, H, T * 1.5, xR, H / 2, zB);

    var ft = 0.08;
    addArch(ft, doorH + 0.1, T + 0.04, doorX0, doorH / 2, zB, frameMat);
    addArch(ft, doorH + 0.1, T + 0.04, doorX1, doorH / 2, zB, frameMat);
    addArch(doorW, ft, T + 0.04, doorX, doorH, zB, frameMat);
    addArch(doorW - 0.12, doorH - 0.1, 0.06, doorX, doorH / 2, zB + T / 2 + 0.02, doorMat);
    addArch(0.18, 0.04, 0.04, doorX + doorW * 0.28, doorH * 0.45, zB + T / 2 + 0.06, frameMat);

    var bbH = 0.1;
    if (doorX0 > backX0) {
      addArch(doorX0 - backX0, bbH, T + 0.02, (backX0 + doorX0) / 2, bbH / 2, zB, trimMat);
    }
    if (backX1 > doorX1) {
      addArch(backX1 - doorX1, bbH, T + 0.02, (doorX1 + backX1) / 2, bbH / 2, zB, trimMat);
    }

    // ---------- RIGHT BAY (no front-right floating pillar) ----------
    var bayDepth = 1.6;
    var bayXInner = xR;
    var bayXOuter = xR + bayDepth;
    var bayZ0 = zB; // flush with back wall z
    var bayZ1 = zF - 0.25;

    // Back 45° side — starts AT back wall plane (no gap)
    var sideLen = Math.sqrt(bayDepth * bayDepth + bayDepth * bayDepth) * 0.9;
    var sideBack = addArch(T, H, sideLen, 0, H / 2, 0);
    sideBack.position.set((bayXInner + bayXOuter) / 2, H / 2, bayZ0 + bayDepth * 0.15);
    sideBack.rotation.y = Math.PI / 4;

    // Front 45° return — keep ON the floor footprint (not past edge)
    var sideFront = addArch(T, H, sideLen * 0.75, 0, H / 2, 0);
    sideFront.position.set((bayXInner + bayXOuter) / 2, H / 2, bayZ1 - bayDepth * 0.1);
    sideFront.rotation.y = -Math.PI / 4;

    var outerZ0 = bayZ0 + 0.55;
    var outerZ1 = bayZ1 - 0.45;
    var outerLen = Math.max(outerZ1 - outerZ0, 2);

    var headerH = 1.0;
    var headerBottom = H - headerH;
    addArch(T, headerH, outerLen, bayXOuter, headerBottom + headerH / 2, (outerZ0 + outerZ1) / 2);

    var benchH = 0.85;
    addArch(
      bayDepth * 0.95,
      benchH,
      outerLen + 0.3,
      (bayXInner + bayXOuter) / 2 - 0.05,
      benchH / 2,
      (outerZ0 + outerZ1) / 2,
      benchMat
    );
    addArch(
      bayDepth * 0.92,
      0.04,
      outerLen + 0.25,
      (bayXInner + bayXOuter) / 2 - 0.05,
      benchH + 0.02,
      (outerZ0 + outerZ1) / 2,
      benchMat
    );

    var winBottom = benchH + 0.04;
    var winTop = headerBottom;
    var winH = winTop - winBottom;
    var paneCount = 5;
    var paneW = outerLen / paneCount;

    for (var i = 0; i <= paneCount; i++) {
      addArch(0.07, winH, 0.07, bayXOuter, winBottom + winH / 2, outerZ0 + i * paneW, frameMat);
    }
    addArch(0.07, 0.07, outerLen, bayXOuter, winBottom, (outerZ0 + outerZ1) / 2, frameMat);
    addArch(0.07, 0.07, outerLen, bayXOuter, winTop, (outerZ0 + outerZ1) / 2, frameMat);
    addArch(0.07, 0.07, outerLen, bayXOuter, winBottom + winH * 0.5, (outerZ0 + outerZ1) / 2, frameMat);

    for (var p = 0; p < paneCount; p++) {
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
      glass.position.set(bayXOuter - 0.02, winBottom + winH / 2, outerZ0 + paneW * (p + 0.5));
      glass.rotation.y = Math.PI / 2;
      glass.castShadow = false;
      glass.receiveShadow = true;
      root.add(glass);
    }

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
    ctx.beginPath();
    ctx.arc(720, 200, 40, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,220,120,0.9)';
    ctx.fill();
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
    view.castShadow = false;
    root.add(view);

    // NO front-right terminator pillar (removed — was floating off floor)

    scene.add(root);
  }

  function applyView() {
    if (typeof camera === 'undefined' || typeof controls === 'undefined' || !camera || !controls) {
      setTimeout(applyView, 150);
      return;
    }
    if (window.__isoViewApplied) return;
    window.__isoViewApplied = true;

    // Pivot around room interior center
    controls.target.set(0.2, 1.5, 0.6);
    camera.position.set(-8.5, 8.8, 8.5);
    camera.lookAt(0.2, 1.5, 0.6);

    controls.enablePan = false;
    controls.minDistance = 10;
    controls.maxDistance = 18;
    controls.minAzimuthAngle = -Math.PI / 8; // ~-22°
    controls.maxAzimuthAngle = Math.PI / 6; // ~+30° — stops before right wall exterior
    controls.minPolarAngle = Math.PI / 3.5; // ~51°
    controls.maxPolarAngle = Math.PI / 2.3; // ~78°
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.15;
    if (controls.update) controls.update();

    setTimeout(function () {
      window.__dioramaBuilt = false;
      removeOriginalWalls();
      trimOriginalFloor();
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
      s.src = 'furniture.js?v=bugs4';
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
