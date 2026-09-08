/*
 * Penthouse night layout:
 * - Sofa faces window (furniture.js)
 * - Jukebox in back-right, rotated toward camera
 * - Night city skyline in window
 * - Cooler ambient / moonlight
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/e85884eca00ae0cd9dc9f3d523d1d14a99f376e5/scene.js';

  var H = 6.8;
  var T = 0.2;
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

  function applyNightLighting() {
    if (typeof scene === 'undefined' || !scene) return;
    scene.traverse(function (obj) {
      if (!obj.isLight) return;
      // Dim warm lights; shift directional to cool moonlight
      if (obj.isDirectionalLight) {
        obj.color.setHex(0x1e293b);
        obj.intensity = Math.min(obj.intensity, 0.35);
      }
      if (obj.isAmbientLight) {
        obj.color.setHex(0x0f172a);
        obj.intensity = Math.min(obj.intensity * 0.55, 0.28);
      }
      if (obj.isPointLight) {
        // Keep practicals; slightly reduce non-monitor fills
        if (obj.intensity > 0.6) obj.intensity *= 0.7;
      }
    });
    // Soft moonlight fill from window direction
    if (typeof THREE !== 'undefined') {
      var moon = new THREE.DirectionalLight(0x38bdf8, 0.22);
      moon.position.set(8, 6, 2);
      moon.castShadow = false;
      scene.add(moon);
      var cityFill = new THREE.PointLight(0x60a5fa, 0.25, 18);
      cityFill.position.set(6, 3, 2);
      scene.add(cityFill);
    }
    if (scene.background) scene.background = new THREE.Color(0x09090b);
    if (scene.fog) {
      scene.fog.color = new THREE.Color(0x09090b);
      scene.fog.near = 24;
      scene.fog.far = 55;
    }
  }

  function moveJukeboxToCorner() {
    if (typeof scene === 'undefined' || !scene) return;
    var target = null;
    if (typeof jukebox !== 'undefined' && jukebox) target = jukebox;
    if (!target) {
      scene.traverse(function (obj) {
        if (target) return;
        var n = (obj.name || '').toLowerCase();
        if (n.indexOf('jukebox') !== -1) {
          target = obj;
          return;
        }
        if (
          obj.isGroup &&
          Math.abs(obj.position.x - 2.15) < 0.5 &&
          Math.abs(obj.position.z + 1.75) < 0.6
        ) {
          target = obj;
        }
      });
    }
    if (!target) return;
    // Back-right corner, facing toward camera (front-left)
    target.position.set(3.55, 0, -1.55);
    target.rotation.y = Math.PI * 0.85; // arch toward isometric camera
  }

  function moveBalloonToEdge() {
    // Optional: plant/balloon group near front-right edge if found
    if (typeof scene === 'undefined' || !scene) return;
    scene.traverse(function (obj) {
      if (!obj.isGroup) return;
      if (
        Math.abs(obj.position.x + 1.85) < 0.4 &&
        Math.abs(obj.position.z - 0.4) < 0.4
      ) {
        // balloon/plant was at left of desk — move to front-right edge of floor
        obj.position.set(3.8, 0, 4.2);
      }
    });
  }

  function buildNightSkylineTexture() {
    var c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    var ctx = c.getContext('2d');

    // Deep midnight sky
    var g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#020617');
    g.addColorStop(0.55, '#0f172a');
    g.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 512);

    // Stars
    for (var s = 0; s < 80; s++) {
      ctx.fillStyle = 'rgba(248,250,252,' + (0.3 + Math.random() * 0.6) + ')';
      ctx.fillRect(Math.random() * 1024, Math.random() * 220, 1.5, 1.5);
    }

    // Skyscraper silhouettes + window grids
    for (var b = 0; b < 22; b++) {
      var bx = 20 + b * 46 + Math.random() * 10;
      var bw = 22 + Math.random() * 36;
      var bh = 80 + Math.random() * 260;
      var by = 512 - bh - 20;
      ctx.fillStyle = b % 3 === 0 ? '#020617' : '#0f172a';
      ctx.fillRect(bx, by, bw, bh);

      // Window lights
      var colors = ['#fef08a', '#38bdf8', '#f8fafc', '#fbbf24'];
      for (var wy = by + 8; wy < by + bh - 10; wy += 12) {
        for (var wx = bx + 4; wx < bx + bw - 4; wx += 8) {
          if (Math.random() > 0.35) {
            ctx.fillStyle = colors[(Math.random() * colors.length) | 0];
            ctx.globalAlpha = 0.55 + Math.random() * 0.4;
            ctx.fillRect(wx, wy, 3, 4);
            ctx.globalAlpha = 1;
          }
        }
      }

      // Red spire beacon on some towers
      if (Math.random() > 0.7) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(bx + bw / 2, by - 6, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Soft bokeh near horizon
    for (var i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(248,250,252,' + (0.15 + Math.random() * 0.35) + ')';
      ctx.arc(40 + Math.random() * 940, 380 + Math.random() * 100, 1 + Math.random() * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(c);
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
      color: 0x18181b,
      roughness: 0.9,
      metalness: 0.04
    });
    var benchMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.82,
      metalness: 0.05
    });

    function addArch(w, h, d, x, y, z, mat) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || wallMat);
      m.position.set(x, y, z);
      m.castShadow = false;
      m.receiveShadow = true;
      root.add(m);
      return m;
    }

    var xL = -5.5;
    var xR = 5.0;
    var zB = -2.9;
    var zF = 5.0;

    var bayOut = 1.5;
    var straightX = xR + bayOut * 0.85;
    var frontSolid = 0.75;
    var straightZ0 = zB + bayOut * 0.9;
    var straightZ1 = zF - frontSolid;
    var winLen = Math.max(straightZ1 - straightZ0, 2);

    var floorX0 = xL - 0.15;
    var floorX1 = straightX + T / 2 + 0.12;
    var floorZ0 = zB - 0.15;
    var floorZ1 = zF + 0.05;
    addArch(
      floorX1 - floorX0,
      0.14,
      floorZ1 - floorZ0,
      (floorX0 + floorX1) / 2,
      -0.07,
      (floorZ0 + floorZ1) / 2,
      floorMat
    );

    // Back wall + door
    var doorW = 1.9;
    var doorH = 4.5;
    var doorX = -3.4;
    var doorX0 = doorX - doorW / 2;
    var doorX1 = doorX + doorW / 2;

    if (doorX0 > xL) addArch(doorX0 - xL, H, T, (xL + doorX0) / 2, H / 2, zB);
    addArch(doorW, H - doorH, T, doorX, doorH + (H - doorH) / 2, zB);
    if (xR > doorX1) addArch(xR - doorX1, H, T, (doorX1 + xR) / 2, H / 2, zB);
    addArch(T * 1.2, H, T * 1.2, xR, H / 2, zB);

    var ft = 0.08;
    addArch(ft, doorH + 0.1, T + 0.04, doorX0, doorH / 2, zB, frameMat);
    addArch(ft, doorH + 0.1, T + 0.04, doorX1, doorH / 2, zB, frameMat);
    addArch(doorW, ft, T + 0.04, doorX, doorH, zB, frameMat);
    addArch(doorW - 0.12, doorH - 0.1, 0.06, doorX, doorH / 2, zB + T / 2 + 0.02, doorMat);
    addArch(0.18, 0.04, 0.04, doorX + doorW * 0.28, doorH * 0.45, zB + T / 2 + 0.06, frameMat);

    var bbH = 0.1;
    if (doorX0 > xL) addArch(doorX0 - xL, bbH, T + 0.02, (xL + doorX0) / 2, bbH / 2, zB, trimMat);
    if (xR > doorX1) addArch(xR - doorX1, bbH, T + 0.02, (doorX1 + xR) / 2, bbH / 2, zB, trimMat);

    // Single 45° bay
    var bayAngleLen = Math.sqrt(bayOut * bayOut + bayOut * bayOut);
    var angleWall = addArch(T, H, bayAngleLen, 0, H / 2, 0);
    angleWall.position.set(xR + bayOut * 0.45, H / 2, zB + bayOut * 0.45);
    angleWall.rotation.y = Math.PI / 4;

    var headerH = 1.05;
    var headerBottom = H - headerH;
    addArch(T, headerH, winLen, straightX, headerBottom + headerH / 2, straightZ0 + winLen / 2);

    var benchH = 0.9;
    var benchDepth = 1.35;
    addArch(
      benchDepth,
      benchH,
      winLen + 0.1,
      straightX - T / 2 - benchDepth / 2 + 0.05,
      benchH / 2,
      straightZ0 + winLen / 2,
      benchMat
    );
    addArch(
      benchDepth * 0.98,
      0.04,
      winLen + 0.05,
      straightX - T / 2 - benchDepth / 2 + 0.05,
      benchH + 0.02,
      straightZ0 + winLen / 2,
      benchMat
    );

    var winBottom = benchH + 0.04;
    var winTop = headerBottom;
    var winH = winTop - winBottom;
    var panes = 5;
    var paneW = winLen / panes;

    for (var i = 0; i <= panes; i++) {
      addArch(0.07, winH, 0.07, straightX, winBottom + winH / 2, straightZ0 + i * paneW, frameMat);
    }
    addArch(0.07, 0.07, winLen, straightX, winBottom, straightZ0 + winLen / 2, frameMat);
    addArch(0.07, 0.07, winLen, straightX, winTop, straightZ0 + winLen / 2, frameMat);
    addArch(0.07, 0.07, winLen, straightX, winBottom + winH * 0.55, straightZ0 + winLen / 2, frameMat);

    for (var p = 0; p < panes; p++) {
      var glass = new THREE.Mesh(
        new THREE.PlaneGeometry(paneW - 0.1, winH - 0.1),
        new THREE.MeshStandardMaterial({
          color: 0x6688aa,
          transparent: true,
          opacity: 0.22,
          roughness: 0.1,
          metalness: 0.2,
          side: THREE.DoubleSide
        })
      );
      glass.position.set(straightX - 0.02, winBottom + winH / 2, straightZ0 + paneW * (p + 0.5));
      glass.rotation.y = Math.PI / 2;
      glass.castShadow = false;
      root.add(glass);
    }

    // Night penthouse skyline
    var view = new THREE.Mesh(
      new THREE.PlaneGeometry(winLen - 0.05, winH - 0.05),
      new THREE.MeshBasicMaterial({ map: buildNightSkylineTexture() })
    );
    view.position.set(straightX + 0.08, winBottom + winH / 2, straightZ0 + winLen / 2);
    view.rotation.y = -Math.PI / 2;
    view.castShadow = false;
    root.add(view);

    addArch(T, H, frontSolid, straightX, H / 2, straightZ1 + frontSolid / 2);
    addArch(T + 0.04, H, 0.08, straightX, H / 2, zF - 0.02, wallMat);

    scene.add(root);
  }

  function applyView() {
    if (typeof camera === 'undefined' || typeof controls === 'undefined' || !camera || !controls) {
      setTimeout(applyView, 150);
      return;
    }
    if (window.__isoViewApplied) return;
    window.__isoViewApplied = true;

    controls.target.set(0.2, 1.5, 0.6);
    camera.position.set(-8.5, 8.8, 8.5);
    camera.lookAt(0.2, 1.5, 0.6);

    controls.enablePan = false;
    controls.minDistance = 10;
    controls.maxDistance = 18;
    controls.minAzimuthAngle = -Math.PI / 8;
    controls.maxAzimuthAngle = Math.PI / 6;
    controls.minPolarAngle = Math.PI / 3.5;
    controls.maxPolarAngle = Math.PI / 2.3;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.15;
    if (controls.update) controls.update();

    setTimeout(function () {
      window.__dioramaBuilt = false;
      removeOriginalWalls();
      trimOriginalFloor();
      buildWalls();
      moveJukeboxToCorner();
      moveBalloonToEdge();
      applyNightLighting();
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
      s.src = 'furniture.js?v=night1';
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
