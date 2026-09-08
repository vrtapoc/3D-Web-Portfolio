/*
 * Match reference screenshot carefully:
 * - Clean L-shaped cutaway (back + right only)
 * - Horizontal warm wood planks with golden sheen
 * - Large rectangular window + long daybed
 * - Door left on back wall; desk/jukebox on back; balloon at window
 * - Open center floor (no sofa)
 * - Locked warm lighting rig
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/e85884eca00ae0cd9dc9f3d523d1d14a99f376e5/scene.js';

  var H = 5.8;
  var T = 0.22;
  var WALL_COLOR = 0x1e1e22;

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

  // Horizontal planks (run along X) — matches reference floor lines
  function createWoodFloorTexture() {
    var canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    var ctx = canvas.getContext('2d');
    var planks = 14;
    var plankH = canvas.height / planks;

    ctx.fillStyle = '#1a1512';
    ctx.fillRect(0, 0, 1024, 1024);

    for (var i = 0; i < planks; i++) {
      var y = i * plankH;
      var base = 28 + ((i * 7) % 12);
      // warm plank body
      ctx.fillStyle = 'rgb(' + (base + 18) + ',' + (base + 10) + ',' + (base + 4) + ')';
      ctx.fillRect(0, y + 2, 1024, plankH - 3);

      // subtle grain
      for (var g = 0; g < 12; g++) {
        ctx.strokeStyle = 'rgba(50,35,25,' + (0.06 + Math.random() * 0.08) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        var gy = y + 4 + Math.random() * (plankH - 8);
        ctx.moveTo(0, gy);
        ctx.lineTo(1024, gy + (Math.random() - 0.5) * 3);
        ctx.stroke();
      }

      // dark seam
      ctx.fillStyle = '#0a0807';
      ctx.fillRect(0, y, 1024, 2);
    }

    var tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.5, 1.5);
    tex.anisotropy = 8;
    return tex;
  }

  function makeSunset() {
    var c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    var ctx = c.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#2d1a38');
    g.addColorStop(0.3, '#c45826');
    g.addColorStop(0.55, '#fca254');
    g.addColorStop(0.8, '#ffc77d');
    g.addColorStop(1, '#ffe0a0');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 512);

    // soft sun
    ctx.beginPath();
    ctx.arc(720, 200, 50, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,220,140,0.7)';
    ctx.fill();

    // city blocks
    ctx.fillStyle = '#2a2035';
    var heights = [180, 260, 140, 300, 200, 240, 160, 280, 120, 220, 190, 250, 150, 270, 210];
    for (var b = 0; b < heights.length; b++) {
      var bw = 40 + (b % 3) * 8;
      ctx.fillRect(30 + b * 65, 512 - heights[b], bw, heights[b]);
    }
    return new THREE.CanvasTexture(c);
  }

  function applyLockedLighting() {
    if (typeof scene === 'undefined' || !scene) return;

    scene.traverse(function (obj) {
      if (!obj.isLight) return;
      if (obj.name && String(obj.name).indexOf('locked-') === 0) return;
      if (obj.isAmbientLight || obj.isHemisphereLight) obj.intensity = 0.04;
      if (obj.isDirectionalLight) obj.intensity = Math.min(obj.intensity, 0.12);
    });

    var hemi = new THREE.HemisphereLight(0xffeedd, 0x252530, 0.7);
    hemi.name = 'locked-hemi';
    scene.add(hemi);

    var cameraFill = new THREE.DirectionalLight(0xffecd6, 0.75);
    cameraFill.name = 'locked-camera-fill';
    cameraFill.position.set(-5.5, 6.0, 7.5);
    scene.add(cameraFill);

    var sun = new THREE.DirectionalLight(0xff9e48, 4.5);
    sun.name = 'locked-sun';
    sun.position.set(8, 5, 1);
    sun.target.position.set(0, 0.4, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.00015;
    scene.add(sun);
    scene.add(sun.target);

    var windowBounce = new THREE.PointLight(0xff9442, 2.0, 14, 1.1);
    windowBounce.name = 'locked-window-bounce';
    windowBounce.position.set(4.2, 2.0, 1.2);
    scene.add(windowBounce);

    var screenLight = new THREE.PointLight(0x00c4e8, 1.1, 4);
    screenLight.name = 'locked-screen';
    screenLight.position.set(0, 2.0, 0.15);
    scene.add(screenLight);

    if (scene.background) scene.background = new THREE.Color(0x0a0a0c);
    if (scene.fog) {
      scene.fog.color = new THREE.Color(0x0a0a0c);
      scene.fog.near = 28;
      scene.fog.far = 55;
    }

    if (typeof renderer !== 'undefined' && renderer) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      if (renderer.outputColorSpace !== undefined) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
      }
      renderer.shadowMap.enabled = true;
    }
  }

  function placeProps() {
    if (typeof scene === 'undefined' || !scene) return;

    // Jukebox right of desk on back wall, facing camera
    if (typeof jukebox !== 'undefined' && jukebox) {
      jukebox.position.set(2.6, 0, -1.85);
      jukebox.rotation.y = Math.PI;
    } else {
      scene.traverse(function (obj) {
        if (!obj.isGroup) return;
        if (
          Math.abs(obj.position.x - 2.15) < 0.5 &&
          Math.abs(obj.position.z + 1.75) < 0.6
        ) {
          obj.position.set(2.6, 0, -1.85);
          obj.rotation.y = Math.PI;
        }
      });
    }

    // Red balloon at front of window (like reference)
    scene.traverse(function (obj) {
      if (!obj.isGroup) return;
      if (
        Math.abs(obj.position.x + 1.85) < 0.5 &&
        Math.abs(obj.position.z - 0.4) < 0.5
      ) {
        obj.position.set(3.6, 0, 2.8);
      }
    });
  }

  function buildRoom() {
    if (typeof THREE === 'undefined' || typeof scene === 'undefined' || !scene) return;
    if (window.__dioramaBuilt) return;
    window.__dioramaBuilt = true;

    var root = new THREE.Group();
    root.name = 'diorama-walls';

    var wallMat = new THREE.MeshStandardMaterial({
      color: WALL_COLOR,
      roughness: 0.88,
      metalness: 0.04
    });
    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2e,
      roughness: 0.5,
      metalness: 0.15
    });
    var doorMat = new THREE.MeshStandardMaterial({
      color: 0x18181c,
      roughness: 0.7,
      metalness: 0.05
    });
    var metalMat = new THREE.MeshStandardMaterial({
      color: 0xc8c8cc,
      roughness: 0.25,
      metalness: 0.85
    });
    var benchMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1e,
      roughness: 0.8,
      metalness: 0.04
    });
    var cushionMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a42,
      roughness: 0.85,
      metalness: 0.02
    });

    function box(w, h, d, x, y, z, mat) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || wallMat);
      m.position.set(x, y, z);
      m.castShadow = false;
      m.receiveShadow = true;
      root.add(m);
      return m;
    }

    // Compact room footprint closer to reference proportions
    var xL = -4.8;
    var xR = 4.4;
    var zB = -2.7;
    var zF = 4.2;

    // --- Wood floor plinth ---
    var woodTex = createWoodFloorTexture();
    var floor = new THREE.Mesh(
      new THREE.BoxGeometry(xR - xL + 0.6, 0.18, zF - zB + 0.4),
      new THREE.MeshStandardMaterial({
        map: woodTex,
        roughness: 0.35,
        metalness: 0.12
      })
    );
    floor.position.set((xL + xR) / 2, -0.09, (zB + zF) / 2);
    floor.receiveShadow = true;
    root.add(floor);

    // Floor edge thickness (plinth lip) — visible cutaway edge
    box(xR - xL + 0.6, 0.18, 0.08, (xL + xR) / 2, -0.09, zF + 0.16, wallMat);
    box(0.08, 0.18, zF - zB + 0.4, xL - 0.26, -0.09, (zB + zF) / 2, wallMat);

    // --- BACK WALL (full height, straight) ---
    var doorW = 1.6;
    var doorH = 3.8;
    var doorX = -3.2;
    var doorX0 = doorX - doorW / 2;
    var doorX1 = doorX + doorW / 2;

    if (doorX0 > xL) box(doorX0 - xL, H, T, (xL + doorX0) / 2, H / 2, zB);
    box(doorW, H - doorH, T, doorX, doorH + (H - doorH) / 2, zB);
    if (xR > doorX1) box(xR - doorX1, H, T, (doorX1 + xR) / 2, H / 2, zB);
    box(T, H, T, xR, H / 2, zB); // corner

    // Door frame + panel
    box(0.06, doorH + 0.08, T + 0.02, doorX0, doorH / 2, zB, frameMat);
    box(0.06, doorH + 0.08, T + 0.02, doorX1, doorH / 2, zB, frameMat);
    box(doorW, 0.06, T + 0.02, doorX, doorH, zB, frameMat);
    box(doorW - 0.1, doorH - 0.06, 0.05, doorX, doorH / 2, zB + T / 2 + 0.02, doorMat);
    box(0.14, 0.03, 0.03, doorX + doorW * 0.3, doorH * 0.48, zB + T / 2 + 0.05, metalMat);

    // --- RIGHT WALL with large window ---
    var winZ0 = zB + 0.55;
    var winZ1 = zF - 0.55;
    var winLen = winZ1 - winZ0;
    var headerH = 0.9;
    var headerBottom = H - headerH;
    var benchH = 0.75;

    // Header, sill wall, side pillars
    box(T, headerH, winLen, xR, headerBottom + headerH / 2, (winZ0 + winZ1) / 2);
    box(T, benchH, winLen, xR, benchH / 2, (winZ0 + winZ1) / 2);
    box(T, H, winZ0 - zB, xR, H / 2, (zB + winZ0) / 2);
    box(T, H, zF - winZ1, xR, H / 2, (winZ1 + zF) / 2);

    // Long daybed into the room
    box(1.15, benchH, winLen - 0.15, xR - 0.6, benchH / 2, (winZ0 + winZ1) / 2, benchMat);
    box(1.1, 0.07, winLen - 0.2, xR - 0.6, benchH + 0.035, (winZ0 + winZ1) / 2, cushionMat);

    // Small plant-like boxes on bench (subtle, like reference)
    box(0.22, 0.2, 0.22, xR - 0.7, benchH + 0.18, (winZ0 + winZ1) / 2 - 0.8,
      new THREE.MeshStandardMaterial({ color: 0x2a2a28, roughness: 0.7 }));
    box(0.18, 0.15, 0.18, xR - 0.65, benchH + 0.15, (winZ0 + winZ1) / 2 - 0.55,
      new THREE.MeshStandardMaterial({ color: 0x3a3a36, roughness: 0.7 }));

    // Window opening glass + skyline
    var winBottom = benchH + 0.05;
    var winTop = headerBottom;
    var winH = winTop - winBottom;

    // Simple black frame border
    box(0.06, winH, winLen, xR, winBottom + winH / 2, (winZ0 + winZ1) / 2, frameMat);

    var glass = new THREE.Mesh(
      new THREE.PlaneGeometry(winLen - 0.1, winH - 0.08),
      new THREE.MeshStandardMaterial({
        color: 0x88aacc,
        transparent: true,
        opacity: 0.12,
        roughness: 0.08,
        metalness: 0.1,
        side: THREE.DoubleSide
      })
    );
    glass.position.set(xR - 0.02, winBottom + winH / 2, (winZ0 + winZ1) / 2);
    glass.rotation.y = Math.PI / 2;
    glass.castShadow = false;
    root.add(glass);

    var sky = new THREE.Mesh(
      new THREE.PlaneGeometry(winLen - 0.05, winH - 0.05),
      new THREE.MeshBasicMaterial({ map: makeSunset(), toneMapped: false })
    );
    sky.position.set(xR + 0.08, winBottom + winH / 2, (winZ0 + winZ1) / 2);
    sky.rotation.y = -Math.PI / 2;
    root.add(sky);

    scene.add(root);
  }

  function applyView() {
    if (typeof camera === 'undefined' || typeof controls === 'undefined' || !camera || !controls) {
      setTimeout(applyView, 150);
      return;
    }
    if (window.__isoViewApplied) return;
    window.__isoViewApplied = true;

    // Camera angle similar to reference (elevated front-left)
    controls.target.set(0.3, 1.1, 0.4);
    camera.position.set(-7.5, 6.8, 8.5);
    camera.lookAt(0.3, 1.1, 0.4);

    controls.enablePan = false;
    controls.minDistance = 10;
    controls.maxDistance = 18;
    controls.minAzimuthAngle = -Math.PI / 8;
    controls.maxAzimuthAngle = Math.PI / 6;
    controls.minPolarAngle = Math.PI / 3.8;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.1;
    if (controls.update) controls.update();

    setTimeout(function () {
      window.__dioramaBuilt = false;
      removeOriginalWalls();
      trimOriginalFloor();
      buildRoom();
      placeProps();
      applyLockedLighting();
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
      if (typeof createOfficeChair !== 'function') {
        setTimeout(runCreates, 100);
        return;
      }
      window.__furnitureAdded = true;
      try {
        createOfficeChair();
      } catch (e) {
        console.warn(e);
      }
    }

    if (!document.querySelector('script[data-furniture]')) {
      var s = document.createElement('script');
      s.src = 'furniture.js?v=refmatch1';
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
