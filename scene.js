/*
 * Reference match pass:
 * - Dark walnut plank floor (procedural albedo + normal)
 * - Left wall + door
 * - Straight uniform walls
 * - Sunset key light through right window
 * - Cool monitor contrast kept from original scene
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/e85884eca00ae0cd9dc9f3d523d1d14a99f376e5/scene.js';

  var H = 6.8;
  var T = 0.2;
  var WALL_COLOR = 0x1a1a1e;

  function removeOriginalWalls() {
    if (typeof scene === 'undefined' || !scene) return;
    var kill = [];
    scene.traverse(function (obj) {
      if (!obj) return;
      if (obj.name === 'diorama-walls') {
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

  function makeWalnutTextures() {
    var size = 1024;
    var albedo = document.createElement('canvas');
    albedo.width = albedo.height = size;
    var a = albedo.getContext('2d');

    // Base espresso / black walnut
    a.fillStyle = '#1a120e';
    a.fillRect(0, 0, size, size);

    var plankW = 48;
    for (var x = 0; x < size; x += plankW) {
      // Plank variation
      var shade = 18 + ((x * 13) % 17);
      a.fillStyle = 'rgb(' + (shade + 8) + ',' + (shade - 2) + ',' + (shade - 6) + ')';
      a.fillRect(x + 1, 0, plankW - 2, size);

      // Grain streaks
      for (var g = 0; g < 40; g++) {
        var gx = x + 4 + Math.random() * (plankW - 8);
        a.strokeStyle = 'rgba(60,40,28,' + (0.08 + Math.random() * 0.12) + ')';
        a.lineWidth = 1 + Math.random();
        a.beginPath();
        a.moveTo(gx, 0);
        a.lineTo(gx + (Math.random() - 0.5) * 6, size);
        a.stroke();
      }

      // Seam / groove
      a.fillStyle = 'rgba(8,6,5,0.85)';
      a.fillRect(x, 0, 2, size);
    }

    // Subtle cross wear
    for (var i = 0; i < 80; i++) {
      a.fillStyle = 'rgba(90,70,50,' + (0.03 + Math.random() * 0.05) + ')';
      a.fillRect(Math.random() * size, Math.random() * size, 20 + Math.random() * 40, 1);
    }

    var normal = document.createElement('canvas');
    normal.width = normal.height = size;
    var n = normal.getContext('2d');
    n.fillStyle = '#8080ff'; // flat normal base
    n.fillRect(0, 0, size, size);
    for (var nx = 0; nx < size; nx += plankW) {
      // Groove as normal perturbation (darker = inward)
      n.fillStyle = '#6060e0';
      n.fillRect(nx, 0, 3, size);
      n.fillStyle = '#a0a0ff';
      n.fillRect(nx + 3, 0, 2, size);
    }

    var rough = document.createElement('canvas');
    rough.width = rough.height = size;
    var r = rough.getContext('2d');
    r.fillStyle = '#4a4a4a'; // ~0.3 roughness grey
    r.fillRect(0, 0, size, size);
    for (var rx = 0; rx < size; rx += plankW) {
      r.fillStyle = '#3a3a3a';
      r.fillRect(rx, 0, 3, size);
      for (var ry = 0; ry < 30; ry++) {
        r.fillStyle = 'rgba(80,80,80,' + Math.random() * 0.3 + ')';
        r.fillRect(rx + 4, Math.random() * size, plankW - 8, 2);
      }
    }

    var map = new THREE.CanvasTexture(albedo);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(6, 6);
    map.anisotropy = 8;

    var nmap = new THREE.CanvasTexture(normal);
    nmap.wrapS = nmap.wrapT = THREE.RepeatWrapping;
    nmap.repeat.set(6, 6);

    var rmap = new THREE.CanvasTexture(rough);
    rmap.wrapS = rmap.wrapT = THREE.RepeatWrapping;
    rmap.repeat.set(6, 6);

    return { map: map, normalMap: nmap, roughnessMap: rmap };
  }

  function makeSunsetSkyline() {
    var c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    var ctx = c.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#1a1520');
    g.addColorStop(0.35, '#c45a2a');
    g.addColorStop(0.55, '#ffa057');
    g.addColorStop(0.75, '#ffd090');
    g.addColorStop(1, '#2a2830');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 512);
    // Sun
    ctx.beginPath();
    ctx.arc(780, 220, 48, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,220,140,0.95)';
    ctx.fill();
    // Buildings
    ctx.fillStyle = 'rgba(18,16,28,0.92)';
    for (var b = 0; b < 26; b++) {
      var bw = 18 + Math.random() * 40;
      var bh = 60 + Math.random() * 220;
      ctx.fillRect(15 + b * 38, 512 - bh - 25, bw, bh);
    }
    return new THREE.CanvasTexture(c);
  }

  function applySunsetLighting() {
    if (typeof scene === 'undefined' || !scene) return;
    scene.traverse(function (obj) {
      if (!obj.isLight) return;
      if (obj.isDirectionalLight) {
        obj.color.setHex(0xffa057);
        obj.intensity = 1.15;
        obj.position.set(10, 8, 4);
        obj.castShadow = true;
      }
      if (obj.isAmbientLight) {
        obj.color.setHex(0x2a2030);
        obj.intensity = 0.22;
      }
    });
    // Strong golden key through window
    var sun = new THREE.DirectionalLight(0xffa057, 1.4);
    sun.position.set(12, 7, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0002;
    scene.add(sun);

    var warmFill = new THREE.PointLight(0xffc080, 0.55, 22);
    warmFill.position.set(5.5, 3.2, 2);
    scene.add(warmFill);

    // Soft bounce
    var bounce = new THREE.HemisphereLight(0xffd0a0, 0x1a1a1e, 0.25);
    scene.add(bounce);

    if (scene.background) scene.background = new THREE.Color(0x0c0c10);
    if (typeof renderer !== 'undefined' && renderer) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.outputColorSpace = THREE.SRGBColorSpace || renderer.outputEncoding;
    }
  }

  function buildWalls() {
    if (typeof THREE === 'undefined' || typeof scene === 'undefined' || !scene) return;
    if (window.__dioramaBuilt) return;
    window.__dioramaBuilt = true;

    var root = new THREE.Group();
    root.name = 'diorama-walls';

    var wallMat = new THREE.MeshStandardMaterial({
      color: WALL_COLOR,
      roughness: 0.92,
      metalness: 0.03
    });
    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2e,
      roughness: 0.5,
      metalness: 0.2
    });
    var doorMat = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.7,
      metalness: 0.08
    });
    var metalMat = new THREE.MeshStandardMaterial({
      color: 0xc0c0c8,
      roughness: 0.35,
      metalness: 0.8
    });
    var benchMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a40,
      roughness: 0.75,
      metalness: 0.05
    });
    var cushionMat = new THREE.MeshStandardMaterial({
      color: 0x5a5a62,
      roughness: 0.85,
      metalness: 0.02
    });

    function addArch(w, h, d, x, y, z, mat) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || wallMat);
      m.position.set(x, y, z);
      m.castShadow = false;
      m.receiveShadow = true;
      root.add(m);
      return m;
    }

    var xL = -5.6;
    var xR = 5.2;
    var zB = -2.9;
    var zF = 5.2;

    // Walnut floor
    var tex = makeWalnutTextures();
    var floorGeo = new THREE.BoxGeometry(xR - xL + 1.2, 0.14, zF - zB + 0.6);
    var floorMat = new THREE.MeshStandardMaterial({
      map: tex.map,
      normalMap: tex.normalMap,
      roughnessMap: tex.roughnessMap,
      roughness: 0.3,
      metalness: 0.04
    });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set((xL + xR) / 2, -0.07, (zB + zF) / 2);
    floor.castShadow = false;
    floor.receiveShadow = true;
    root.add(floor);

    // LEFT WALL + DOOR (callout 3)
    var doorW = 1.85;
    var doorH = 4.4;
    var doorZ = 1.6;
    var doorZ0 = doorZ - doorW / 2;
    var doorZ1 = doorZ + doorW / 2;

    addArch(T, H, doorZ0 - zB, xL, H / 2, (zB + doorZ0) / 2);
    addArch(T, H - doorH, doorW, xL, doorH + (H - doorH) / 2, doorZ);
    addArch(T, H, zF - doorZ1, xL, H / 2, (doorZ1 + zF) / 2);

    var ft = 0.08;
    addArch(T + 0.04, doorH + 0.12, ft, xL, doorH / 2, doorZ0, frameMat);
    addArch(T + 0.04, doorH + 0.12, ft, xL, doorH / 2, doorZ1, frameMat);
    addArch(T + 0.04, ft, doorW, xL, doorH, doorZ, frameMat);
    addArch(0.06, doorH - 0.1, doorW - 0.12, xL + T / 2 + 0.02, doorH / 2, doorZ, doorMat);
    addArch(0.04, 0.04, 0.16, xL + T / 2 + 0.08, doorH * 0.45, doorZ + doorW * 0.28, metalMat);

    // BACK WALL — straight full height
    addArch(xR - xL, H, T, (xL + xR) / 2, H / 2, zB);

    // RIGHT WALL — straight, bay window opening
    var winZ0 = zB + 0.8;
    var winZ1 = zF - 0.9;
    var winLen = winZ1 - winZ0;
    var headerH = 1.0;
    var headerBottom = H - headerH;
    var benchH = 0.85;

    // Solid above/below window + sides
    addArch(T, headerH, winLen, xR, headerBottom + headerH / 2, (winZ0 + winZ1) / 2);
    addArch(T, benchH, winLen, xR, benchH / 2, (winZ0 + winZ1) / 2);
    addArch(T, H, winZ0 - zB, xR, H / 2, (zB + winZ0) / 2);
    addArch(T, H, zF - winZ1, xR, H / 2, (winZ1 + zF) / 2);

    // Bench / daybed cushion into room
    addArch(1.4, 0.12, winLen - 0.2, xR - 0.75, benchH + 0.06, (winZ0 + winZ1) / 2, cushionMat);
    addArch(1.35, benchH, winLen - 0.15, xR - 0.7, benchH / 2, (winZ0 + winZ1) / 2, benchMat);

    // Throw pillows
    var pillowMat = new THREE.MeshStandardMaterial({ color: 0x6a6570, roughness: 0.9 });
    addArch(0.45, 0.35, 0.5, xR - 1.0, benchH + 0.35, (winZ0 + winZ1) / 2 - 0.9, pillowMat);
    addArch(0.4, 0.32, 0.45, xR - 0.95, benchH + 0.32, (winZ0 + winZ1) / 2 + 0.7, pillowMat);

    // Window frames 4 panes
    var winBottom = benchH + 0.12;
    var winTop = headerBottom;
    var winH = winTop - winBottom;
    var panes = 4;
    var paneW = winLen / panes;
    for (var i = 0; i <= panes; i++) {
      addArch(0.08, winH, 0.08, xR, winBottom + winH / 2, winZ0 + i * paneW, frameMat);
    }
    addArch(0.08, 0.08, winLen, xR, winBottom, (winZ0 + winZ1) / 2, frameMat);
    addArch(0.08, 0.08, winLen, xR, winTop, (winZ0 + winZ1) / 2, frameMat);

    for (var p = 0; p < panes; p++) {
      var glass = new THREE.Mesh(
        new THREE.PlaneGeometry(paneW - 0.12, winH - 0.12),
        new THREE.MeshStandardMaterial({
          color: 0x88aacc,
          transparent: true,
          opacity: 0.2,
          roughness: 0.08,
          metalness: 0.15,
          side: THREE.DoubleSide
        })
      );
      glass.position.set(xR - 0.02, winBottom + winH / 2, winZ0 + paneW * (p + 0.5));
      glass.rotation.y = Math.PI / 2;
      glass.castShadow = false;
      root.add(glass);
    }

    var view = new THREE.Mesh(
      new THREE.PlaneGeometry(winLen - 0.1, winH - 0.1),
      new THREE.MeshBasicMaterial({ map: makeSunsetSkyline() })
    );
    view.position.set(xR + 0.1, winBottom + winH / 2, (winZ0 + winZ1) / 2);
    view.rotation.y = -Math.PI / 2;
    root.add(view);

    // Picture lights (warm) above back wall art zone
    for (var pl = 0; pl < 3; pl++) {
      var lx = -1.5 + pl * 1.4;
      var bulb = new THREE.PointLight(0xffe2b0, 0.35, 4);
      bulb.position.set(lx, 4.8, zB + 0.5);
      root.add(bulb);
    }

    // Right wall sconce
    var sconce = new THREE.PointLight(0xffe2b0, 0.4, 5);
    sconce.position.set(xR - 0.3, 3.5, zF - 0.5);
    root.add(sconce);
    addArch(0.08, 0.5, 0.08, xR - 0.12, 3.5, zF - 0.5, metalMat);

    // Credenza right of desk
    var cred = addArch(2.2, 0.85, 0.55, 2.6, 0.42, zB + 0.9, new THREE.MeshStandardMaterial({
      color: 0x121214,
      roughness: 0.6,
      metalness: 0.1
    }));
    cred.castShadow = true;

    scene.add(root);
  }

  function applyView() {
    if (typeof camera === 'undefined' || typeof controls === 'undefined' || !camera || !controls) {
      setTimeout(applyView, 150);
      return;
    }
    if (window.__isoViewApplied) return;
    window.__isoViewApplied = true;

    controls.target.set(0.3, 1.4, 0.8);
    camera.position.set(-9.2, 9.2, 9.5);
    camera.lookAt(0.3, 1.4, 0.8);

    controls.enablePan = false;
    controls.minDistance = 11;
    controls.maxDistance = 20;
    controls.minAzimuthAngle = -Math.PI / 7;
    controls.maxAzimuthAngle = Math.PI / 5;
    controls.minPolarAngle = Math.PI / 3.5;
    controls.maxPolarAngle = Math.PI / 2.3;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.12;
    if (controls.update) controls.update();

    setTimeout(function () {
      window.__dioramaBuilt = false;
      removeOriginalWalls();
      trimOriginalFloor();
      buildWalls();
      applySunsetLighting();
    }, 280);
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
        console.warn(e);
      }
    }

    if (!document.querySelector('script[data-furniture]')) {
      var s = document.createElement('script');
      s.src = 'furniture.js?v=ref1';
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
        } catch (e) {}
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
      if (!r.ok) throw new Error('scene fetch failed');
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
    });
})();
