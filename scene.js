/*
 * Dark moody late-night theme + blueprint layout:
 * - No left wall (open cutaway)
 * - Door on back wall far-left
 * - Dim charcoal floor (no bright wood stripes)
 * - Subtle sunset in window only — practicals are the only clear lights
 * - Jukebox back-right facing camera; balloon front-right edge
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/e85884eca00ae0cd9dc9f3d523d1d14a99f376e5/scene.js';

  var H = 6.8;
  var T = 0.2;
  var WALL_COLOR = 0x151518;

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

  function makeDarkFloorTexture() {
    var size = 512;
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#151518';
    ctx.fillRect(0, 0, size, size);
    // Very subtle plank hints only
    for (var x = 0; x < size; x += 42) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(x, 0, 1, size);
      ctx.fillStyle = 'rgba(255,255,255,0.015)';
      ctx.fillRect(x + 1, 0, 40, size);
    }
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 5);
    return tex;
  }

  function makeSoftSunset() {
    var c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    var ctx = c.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 0, 512);
    // Soft, dim sunset — not blinding
    g.addColorStop(0, '#0a0a12');
    g.addColorStop(0.4, '#3a2818');
    g.addColorStop(0.6, '#6a4020');
    g.addColorStop(0.8, '#4a3020');
    g.addColorStop(1, '#121018');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 512);
    ctx.beginPath();
    ctx.arc(760, 240, 36, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,140,70,0.45)';
    ctx.fill();
    ctx.fillStyle = 'rgba(10,10,16,0.9)';
    for (var b = 0; b < 24; b++) {
      var bw = 16 + Math.random() * 36;
      var bh = 50 + Math.random() * 200;
      ctx.fillRect(20 + b * 40, 512 - bh - 20, bw, bh);
    }
    return new THREE.CanvasTexture(c);
  }

  function applyDarkMoodyLighting() {
    if (typeof scene === 'undefined' || !scene) return;

    // Dim / neutralize existing scene lights
    scene.traverse(function (obj) {
      if (!obj.isLight) return;
      if (obj.isDirectionalLight) {
        obj.color.setHex(0x1a1a22);
        obj.intensity = 0.12;
        obj.castShadow = false;
      }
      if (obj.isAmbientLight) {
        obj.color.setHex(0x0c0c10);
        obj.intensity = 0.12;
      }
      if (obj.isPointLight || obj.isSpotLight) {
        // Keep practicals near desk; dim large fills
        if (obj.intensity > 1) obj.intensity *= 0.25;
        else if (obj.intensity > 0.4) obj.intensity *= 0.5;
      }
      if (obj.isHemisphereLight) {
        obj.intensity = 0.08;
      }
    });

    // Very soft window glow only (not a room wash)
    var windowGlow = new THREE.PointLight(0xc07040, 0.18, 14);
    windowGlow.position.set(5.5, 3, 2);
    scene.add(windowGlow);

    if (scene.background) scene.background = new THREE.Color(0x050508);
    if (scene.fog) {
      scene.fog.color = new THREE.Color(0x050508);
      scene.fog.near = 20;
      scene.fog.far = 48;
    }
    if (typeof renderer !== 'undefined' && renderer) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.72; // darker overall
    }
  }

  function placeProps() {
    if (typeof scene === 'undefined' || !scene) return;

    // Jukebox → back-right, facing camera
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

    // Balloon / plant group → front-right edge
    scene.traverse(function (obj) {
      if (!obj.isGroup) return;
      if (
        Math.abs(obj.position.x + 1.85) < 0.5 &&
        Math.abs(obj.position.z - 0.4) < 0.5
      ) {
        obj.position.set(4.0, 0, 4.3);
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
      roughness: 0.94,
      metalness: 0.02
    });
    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x1c1c20,
      roughness: 0.55,
      metalness: 0.15
    });
    var doorMat = new THREE.MeshStandardMaterial({
      color: 0x0e0e10,
      roughness: 0.75,
      metalness: 0.06
    });
    var metalMat = new THREE.MeshStandardMaterial({
      color: 0x8a8a90,
      roughness: 0.4,
      metalness: 0.75
    });
    var benchMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1e,
      roughness: 0.85,
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

    // No left wall — open cutaway
    var xL = -5.4;
    var xR = 5.1;
    var zB = -2.9;
    var zF = 5.1;

    // Dark charcoal floor — subtle only
    var floorTex = makeDarkFloorTexture();
    var floor = new THREE.Mesh(
      new THREE.BoxGeometry(xR - xL + 0.8, 0.12, zF - zB + 0.5),
      new THREE.MeshStandardMaterial({
        map: floorTex,
        color: 0x151518,
        roughness: 0.88,
        metalness: 0.03
      })
    );
    floor.position.set((xL + xR) / 2, -0.06, (zB + zF) / 2);
    floor.receiveShadow = true;
    floor.castShadow = false;
    root.add(floor);

    // ========== BACK WALL + DOOR (far left) ==========
    var doorW = 1.85;
    var doorH = 4.4;
    var doorX = -3.5; // far left of back wall
    var doorX0 = doorX - doorW / 2;
    var doorX1 = doorX + doorW / 2;

    if (doorX0 > xL) {
      addArch(doorX0 - xL, H, T, (xL + doorX0) / 2, H / 2, zB);
    }
    addArch(doorW, H - doorH, T, doorX, doorH + (H - doorH) / 2, zB);
    if (xR > doorX1) {
      addArch(xR - doorX1, H, T, (doorX1 + xR) / 2, H / 2, zB);
    }
    // Corner join to right wall
    addArch(T * 1.1, H, T * 1.1, xR, H / 2, zB);

    var ft = 0.07;
    addArch(ft, doorH + 0.1, T + 0.03, doorX0, doorH / 2, zB, frameMat);
    addArch(ft, doorH + 0.1, T + 0.03, doorX1, doorH / 2, zB, frameMat);
    addArch(doorW, ft, T + 0.03, doorX, doorH, zB, frameMat);
    addArch(doorW - 0.1, doorH - 0.08, 0.05, doorX, doorH / 2, zB + T / 2 + 0.02, doorMat);
    addArch(0.15, 0.035, 0.035, doorX + doorW * 0.28, doorH * 0.45, zB + T / 2 + 0.05, metalMat);

    // ========== RIGHT WALL + WINDOW + BENCH ==========
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

    // Bench — clean, no loose cubes
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
          color: 0x445566,
          transparent: true,
          opacity: 0.18,
          roughness: 0.15,
          metalness: 0.1,
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
      new THREE.MeshBasicMaterial({ map: makeSoftSunset(), transparent: true, opacity: 0.85 })
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
      applyDarkMoodyLighting();
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
      s.src = 'furniture.js?v=dark2';
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
