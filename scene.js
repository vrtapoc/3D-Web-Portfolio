/*
 * Readable late-night charcoal room (match reference visibility):
 * - Ambient/Hemisphere fill so walls & floor read as grey, not pure black
 * - Materials #2d2f33 walls, #25272a floor, #1e2023 furniture
 * - Warm desk lamp + soft window amber
 * - Exposure ~1.0
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/e85884eca00ae0cd9dc9f3d523d1d14a99f376e5/scene.js';

  var H = 6.8;
  var T = 0.2;
  var WALL_COLOR = 0x2d2f33;
  var FLOOR_COLOR = 0x25272a;
  var FURN_COLOR = 0x1e2023;

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

  function makeSoftSunset() {
    var c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    var ctx = c.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#1a1520');
    g.addColorStop(0.35, '#c45a2a');
    g.addColorStop(0.55, '#e89040');
    g.addColorStop(0.75, '#f0b060');
    g.addColorStop(1, '#2a2830');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 512);
    ctx.beginPath();
    ctx.arc(760, 230, 42, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,210,120,0.85)';
    ctx.fill();
    ctx.fillStyle = 'rgba(20,18,30,0.88)';
    for (var b = 0; b < 24; b++) {
      var bw = 16 + Math.random() * 36;
      var bh = 50 + Math.random() * 200;
      ctx.fillRect(20 + b * 40, 512 - bh - 20, bw, bh);
    }
    return new THREE.CanvasTexture(c);
  }

  function applyReadableLighting() {
    if (typeof scene === 'undefined' || !scene) return;

    // Neutralize extreme lights from original scene, keep practicals
    scene.traverse(function (obj) {
      if (!obj.isLight) return;
      if (obj.isDirectionalLight) {
        obj.color.setHex(0xff9e4a);
        obj.intensity = 0.55;
        obj.position.set(8, 6, 3);
      }
      if (obj.isAmbientLight) {
        obj.color.setHex(0xd8d8e0);
        obj.intensity = 0.45;
      }
      if (obj.isHemisphereLight) {
        obj.intensity = 0.2;
      }
    });

    // Primary ambient fill — readable charcoal, not void
    var amb = new THREE.AmbientLight(0xd8d8e0, 0.5);
    amb.name = 'readable-ambient';
    scene.add(amb);

    var hemi = new THREE.HemisphereLight(0xc8c8d0, 0x1a1a1e, 0.35);
    hemi.name = 'readable-hemi';
    scene.add(hemi);

    // Soft warm window key (bench top catch)
    var windowKey = new THREE.DirectionalLight(0xff9e4a, 0.9);
    windowKey.position.set(10, 5, 2);
    windowKey.castShadow = false;
    scene.add(windowKey);

    // Desk floor lamp — warm pool on desk / chair area
    var deskLamp = new THREE.PointLight(0xffb347, 2.0, 8);
    deskLamp.position.set(0.8, 2.2, 0.3);
    deskLamp.castShadow = false;
    scene.add(deskLamp);

    // Soft bounce so back wall isn't crushed
    var fill = new THREE.PointLight(0xb0b0c0, 0.35, 16);
    fill.position.set(-2, 4, 3);
    scene.add(fill);

    if (scene.background) scene.background = new THREE.Color(0x1a1a1e);
    if (scene.fog) {
      scene.fog.color = new THREE.Color(0x1a1a1e);
      scene.fog.near = 28;
      scene.fog.far = 60;
    }

    if (typeof renderer !== 'undefined' && renderer) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
    }
  }

  function placeProps() {
    if (typeof scene === 'undefined' || !scene) return;

    if (typeof jukebox !== 'undefined' && jukebox) {
      jukebox.position.set(3.5, 0, -1.55);
      jukebox.rotation.y = Math.PI * 0.9;
    } else {
      scene.traverse(function (obj) {
        if (!obj.isGroup) return;
        if (
          Math.abs(obj.position.x - 2.15) < 0.5 &&
          Math.abs(obj.position.z + 1.75) < 0.6
        ) {
          obj.position.set(3.5, 0, -1.55);
          obj.rotation.y = Math.PI * 0.9;
        }
      });
    }

    // Balloon stays near desk left in reference shot — keep near desk
    scene.traverse(function (obj) {
      if (!obj.isGroup) return;
      if (
        Math.abs(obj.position.x + 1.85) < 0.5 &&
        Math.abs(obj.position.z - 0.4) < 0.5
      ) {
        // leave near desk for readability like reference
        obj.position.set(-1.6, 0, 0.5);
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
      metalness: 0.03
    });
    var floorMat = new THREE.MeshStandardMaterial({
      color: FLOOR_COLOR,
      roughness: 0.7,
      metalness: 0.04
    });
    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x1e2023,
      roughness: 0.55,
      metalness: 0.12
    });
    var doorMat = new THREE.MeshStandardMaterial({
      color: FURN_COLOR,
      roughness: 0.75,
      metalness: 0.06
    });
    var metalMat = new THREE.MeshStandardMaterial({
      color: 0x9a9aa0,
      roughness: 0.4,
      metalness: 0.7
    });
    var benchMat = new THREE.MeshStandardMaterial({
      color: FURN_COLOR,
      roughness: 0.8,
      metalness: 0.04
    });

    function addArch(w, h, d, x, y, z, mat) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || wallMat);
      m.position.set(x, y, z);
      m.castShadow = false;
      m.receiveShadow = true;
      root.add(m);
      return m;
    }

    var xL = -5.4;
    var xR = 5.1;
    var zB = -2.9;
    var zF = 5.1;

    // Floor — readable slate charcoal
    var floor = new THREE.Mesh(
      new THREE.BoxGeometry(xR - xL + 0.8, 0.12, zF - zB + 0.5),
      floorMat
    );
    floor.position.set((xL + xR) / 2, -0.06, (zB + zF) / 2);
    floor.receiveShadow = true;
    floor.castShadow = false;
    root.add(floor);

    // Back wall + door far left
    var doorW = 1.85;
    var doorH = 4.4;
    var doorX = -3.5;
    var doorX0 = doorX - doorW / 2;
    var doorX1 = doorX + doorW / 2;

    if (doorX0 > xL) {
      addArch(doorX0 - xL, H, T, (xL + doorX0) / 2, H / 2, zB);
    }
    addArch(doorW, H - doorH, T, doorX, doorH + (H - doorH) / 2, zB);
    if (xR > doorX1) {
      addArch(xR - doorX1, H, T, (doorX1 + xR) / 2, H / 2, zB);
    }
    addArch(T * 1.1, H, T * 1.1, xR, H / 2, zB);

    var ft = 0.07;
    addArch(ft, doorH + 0.1, T + 0.03, doorX0, doorH / 2, zB, frameMat);
    addArch(ft, doorH + 0.1, T + 0.03, doorX1, doorH / 2, zB, frameMat);
    addArch(doorW, ft, T + 0.03, doorX, doorH, zB, frameMat);
    addArch(doorW - 0.1, doorH - 0.08, 0.05, doorX, doorH / 2, zB + T / 2 + 0.02, doorMat);
    addArch(0.15, 0.035, 0.035, doorX + doorW * 0.28, doorH * 0.45, zB + T / 2 + 0.05, metalMat);

    // Right wall + window + bench
    var winZ0 = zB + 0.7;
    var winZ1 = zF - 0.8;
    var winLen = winZ1 - winZ0;
    var headerH = 1.0;
    var headerBottom = H - headerH;
    var benchH = 0.8;

    addArch(T, headerH, winLen, xR, headerBottom + headerH / 2, (winZ0 + winZ1) / 2);
    addArch(T, benchH, winLen, xR, benchH / 2, (winZ0 + winZ1) / 2);
    addArch(T, H, winZ0 - zB, xR, H / 2, (zB + winZ0) / 2);
    addArch(T, H, zF - winZ1, xR, H / 2, (winZ1 + zF) / 2);

    addArch(1.25, benchH, winLen - 0.2, xR - 0.65, benchH / 2, (winZ0 + winZ1) / 2, benchMat);
    addArch(1.2, 0.05, winLen - 0.25, xR - 0.65, benchH + 0.02, (winZ0 + winZ1) / 2, benchMat);

    var winBottom = benchH + 0.05;
    var winTop = headerBottom;
    var winH = winTop - winBottom;
    var panes = 4;
    var paneW = winLen / panes;

    for (var i = 0; i <= panes; i++) {
      addArch(0.07, winH, 0.07, xR, winBottom + winH / 2, winZ0 + i * paneW, frameMat);
    }
    addArch(0.07, 0.07, winLen, xR, winBottom, (winZ0 + winZ1) / 2, frameMat);
    addArch(0.07, 0.07, winLen, xR, winTop, (winZ0 + winZ1) / 2, frameMat);

    for (var p = 0; p < panes; p++) {
      var glass = new THREE.Mesh(
        new THREE.PlaneGeometry(paneW - 0.1, winH - 0.1),
        new THREE.MeshStandardMaterial({
          color: 0x6688aa,
          transparent: true,
          opacity: 0.22,
          roughness: 0.12,
          metalness: 0.12,
          side: THREE.DoubleSide
        })
      );
      glass.position.set(xR - 0.02, winBottom + winH / 2, winZ0 + paneW * (p + 0.5));
      glass.rotation.y = Math.PI / 2;
      glass.castShadow = false;
      root.add(glass);
    }

    var view = new THREE.Mesh(
      new THREE.PlaneGeometry(winLen - 0.08, winH - 0.08),
      new THREE.MeshBasicMaterial({ map: makeSoftSunset() })
    );
    view.position.set(xR + 0.08, winBottom + winH / 2, (winZ0 + winZ1) / 2);
    view.rotation.y = -Math.PI / 2;
    root.add(view);

    scene.add(root);
  }

  function applyView() {
    if (typeof camera === 'undefined' || typeof controls === 'undefined' || !camera || !controls) {
      setTimeout(applyView, 150);
      return;
    }
    if (window.__isoViewApplied) return;
    window.__isoViewApplied = true;

    controls.target.set(0.2, 1.3, 0.7);
    camera.position.set(-9.0, 8.8, 9.2);
    camera.lookAt(0.2, 1.3, 0.7);

    controls.enablePan = false;
    controls.minDistance = 11;
    controls.maxDistance = 20;
    controls.minAzimuthAngle = -Math.PI / 7;
    controls.maxAzimuthAngle = Math.PI / 5.5;
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
      placeProps();
      applyReadableLighting();
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
      s.src = 'furniture.js?v=read1';
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
