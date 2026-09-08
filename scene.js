/*
 * AMBIENCE ONLY — no object / sofa / layout changes
 * - Readable charcoal walls
 * - Warm wood floor that catches golden sun
 * - Strong window sun key + soft fills
 * - Rich sunset skyline in window
 * - ACES exposure ~1.12
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/e85884eca00ae0cd9dc9f3d523d1d14a99f376e5/scene.js';

  var H = 5.8;
  var T = 0.22;
  var WALL_COLOR = 0x2e3036; // readable charcoal, not pure black

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

  function createWarmWoodFloorTexture() {
    var canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    var ctx = canvas.getContext('2d');
    var planks = 14;
    var plankH = canvas.height / planks;

    ctx.fillStyle = '#1c1612';
    ctx.fillRect(0, 0, 1024, 1024);

    for (var i = 0; i < planks; i++) {
      var y = i * plankH;
      var base = 32 + ((i * 9) % 14);
      // warmer mid-tone so golden light reads on the floor
      ctx.fillStyle = 'rgb(' + (base + 22) + ',' + (base + 12) + ',' + (base + 4) + ')';
      ctx.fillRect(0, y + 2, 1024, plankH - 3);

      for (var g = 0; g < 14; g++) {
        ctx.strokeStyle = 'rgba(55,38,25,' + (0.07 + Math.random() * 0.1) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        var gy = y + 4 + Math.random() * (plankH - 8);
        ctx.moveTo(0, gy);
        ctx.lineTo(1024, gy + (Math.random() - 0.5) * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#0a0806';
      ctx.fillRect(0, y, 1024, 2);
    }

    var tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.6, 1.6);
    tex.anisotropy = 8;
    return tex;
  }

  function makeRichSunset() {
    var c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    var ctx = c.getContext('2d');

    // Rich golden-hour sky
    var g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#1a1028');
    g.addColorStop(0.25, '#8b3a28');
    g.addColorStop(0.45, '#e07030');
    g.addColorStop(0.62, '#fca254');
    g.addColorStop(0.82, '#ffd090');
    g.addColorStop(1, '#ffe8c0');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 512);

    // Bright sun disk
    ctx.beginPath();
    ctx.arc(780, 210, 55, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,230,160,0.95)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(780, 210, 90, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,180,80,0.25)';
    ctx.fill();

    // Detailed skyline
    ctx.fillStyle = '#1a1528';
    var heights = [200, 280, 160, 320, 220, 260, 180, 300, 140, 240, 210, 270, 170, 290, 230, 190, 250];
    for (var b = 0; b < heights.length; b++) {
      var bw = 36 + (b % 4) * 6;
      var bx = 20 + b * 58;
      ctx.fillRect(bx, 512 - heights[b], bw, heights[b]);
      // window dots on some towers
      if (b % 2 === 0) {
        ctx.fillStyle = 'rgba(255,200,100,0.35)';
        for (var wy = 512 - heights[b] + 12; wy < 500; wy += 14) {
          for (var wx = bx + 6; wx < bx + bw - 6; wx += 10) {
            if (Math.random() > 0.4) ctx.fillRect(wx, wy, 3, 4);
          }
        }
        ctx.fillStyle = '#1a1528';
      }
    }

    return new THREE.CanvasTexture(c);
  }

  function applyAmbience() {
    if (typeof scene === 'undefined' || !scene) return;

    // Soften original lights so our rig leads
    scene.traverse(function (obj) {
      if (!obj.isLight) return;
      if (obj.name && String(obj.name).indexOf('amb-') === 0) return;
      if (obj.isAmbientLight || obj.isHemisphereLight) obj.intensity = 0.06;
      if (obj.isDirectionalLight) obj.intensity = Math.min(obj.intensity, 0.15);
    });

    // Readable room fill — walls stay charcoal grey, not black
    var amb = new THREE.AmbientLight(0xd8d0c8, 0.38);
    amb.name = 'amb-ambient';
    scene.add(amb);

    var hemi = new THREE.HemisphereLight(0xffeedd, 0x2a2a32, 0.65);
    hemi.name = 'amb-hemi';
    scene.add(hemi);

    // Soft fill from camera side
    var cameraFill = new THREE.DirectionalLight(0xffecd6, 0.7);
    cameraFill.name = 'amb-camera-fill';
    cameraFill.position.set(-5.5, 6.0, 7.5);
    scene.add(cameraFill);

    // Strong golden sun through window (hero light for floor sheen)
    var sun = new THREE.DirectionalLight(0xff9e48, 4.8);
    sun.name = 'amb-sun';
    sun.position.set(9, 5.5, 1.5);
    sun.target.position.set(0, 0.3, 0.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.00015;
    scene.add(sun);
    scene.add(sun.target);

    // Warm bounce off window / bench
    var windowBounce = new THREE.PointLight(0xff9442, 2.4, 14, 1.1);
    windowBounce.name = 'amb-window-bounce';
    windowBounce.position.set(4.0, 2.2, 1.5);
    scene.add(windowBounce);

    // Keep monitor cyan readable
    var screenLight = new THREE.PointLight(0x00c4e8, 1.0, 4);
    screenLight.name = 'amb-screen';
    screenLight.position.set(0, 2.0, 0.15);
    scene.add(screenLight);

    if (scene.background) scene.background = new THREE.Color(0x0c0c10);
    if (scene.fog) {
      scene.fog.color = new THREE.Color(0x0c0c10);
      scene.fog.near = 30;
      scene.fog.far = 60;
    }

    if (typeof renderer !== 'undefined' && renderer) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      if (renderer.outputColorSpace !== undefined) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
      }
      renderer.shadowMap.enabled = true;
    }
  }

  function placeProps() {
    // Ambience-only: do not move desk/chair/etc.
    // Only keep prior jukebox/balloon nudges if already present from earlier passes
    if (typeof scene === 'undefined' || !scene) return;
    if (typeof jukebox !== 'undefined' && jukebox) {
      jukebox.position.set(2.6, 0, -1.85);
      jukebox.rotation.y = Math.PI;
    }
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
      color: 0x1c1c20,
      roughness: 0.7,
      metalness: 0.05
    });
    var metalMat = new THREE.MeshStandardMaterial({
      color: 0xc8c8cc,
      roughness: 0.25,
      metalness: 0.85
    });
    var benchMat = new THREE.MeshStandardMaterial({
      color: 0x252528,
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

    var xL = -4.8;
    var xR = 4.4;
    var zB = -2.7;
    var zF = 4.2;

    // Warm wood floor — catches sun sheen
    var woodTex = createWarmWoodFloorTexture();
    var floor = new THREE.Mesh(
      new THREE.BoxGeometry(xR - xL + 0.6, 0.18, zF - zB + 0.4),
      new THREE.MeshStandardMaterial({
        map: woodTex,
        roughness: 0.32,
        metalness: 0.12
      })
    );
    floor.position.set((xL + xR) / 2, -0.09, (zB + zF) / 2);
    floor.receiveShadow = true;
    root.add(floor);

    box(xR - xL + 0.6, 0.18, 0.08, (xL + xR) / 2, -0.09, zF + 0.16, wallMat);
    box(0.08, 0.18, zF - zB + 0.4, xL - 0.26, -0.09, (zB + zF) / 2, wallMat);

    // Back wall + door (same layout — ambience only)
    var doorW = 1.6;
    var doorH = 3.8;
    var doorX = -3.2;
    var doorX0 = doorX - doorW / 2;
    var doorX1 = doorX + doorW / 2;

    if (doorX0 > xL) box(doorX0 - xL, H, T, (xL + doorX0) / 2, H / 2, zB);
    box(doorW, H - doorH, T, doorX, doorH + (H - doorH) / 2, zB);
    if (xR > doorX1) box(xR - doorX1, H, T, (doorX1 + xR) / 2, H / 2, zB);
    box(T, H, T, xR, H / 2, zB);

    box(0.06, doorH + 0.08, T + 0.02, doorX0, doorH / 2, zB, frameMat);
    box(0.06, doorH + 0.08, T + 0.02, doorX1, doorH / 2, zB, frameMat);
    box(doorW, 0.06, T + 0.02, doorX, doorH, zB, frameMat);
    box(doorW - 0.1, doorH - 0.06, 0.05, doorX, doorH / 2, zB + T / 2 + 0.02, doorMat);
    box(0.14, 0.03, 0.03, doorX + doorW * 0.3, doorH * 0.48, zB + T / 2 + 0.05, metalMat);

    // Right wall + window
    var winZ0 = zB + 0.55;
    var winZ1 = zF - 0.55;
    var winLen = winZ1 - winZ0;
    var headerH = 0.9;
    var headerBottom = H - headerH;
    var benchH = 0.75;

    box(T, headerH, winLen, xR, headerBottom + headerH / 2, (winZ0 + winZ1) / 2);
    box(T, benchH, winLen, xR, benchH / 2, (winZ0 + winZ1) / 2);
    box(T, H, winZ0 - zB, xR, H / 2, (zB + winZ0) / 2);
    box(T, H, zF - winZ1, xR, H / 2, (winZ1 + zF) / 2);

    box(1.15, benchH, winLen - 0.15, xR - 0.6, benchH / 2, (winZ0 + winZ1) / 2, benchMat);
    box(1.1, 0.07, winLen - 0.2, xR - 0.6, benchH + 0.035, (winZ0 + winZ1) / 2, cushionMat);

    var winBottom = benchH + 0.05;
    var winTop = headerBottom;
    var winH = winTop - winBottom;

    box(0.06, winH, winLen, xR, winBottom + winH / 2, (winZ0 + winZ1) / 2, frameMat);

    var glass = new THREE.Mesh(
      new THREE.PlaneGeometry(winLen - 0.1, winH - 0.08),
      new THREE.MeshStandardMaterial({
        color: 0xaaccff,
        transparent: true,
        opacity: 0.1,
        roughness: 0.06,
        metalness: 0.08,
        side: THREE.DoubleSide
      })
    );
    glass.position.set(xR - 0.02, winBottom + winH / 2, (winZ0 + winZ1) / 2);
    glass.rotation.y = Math.PI / 2;
    glass.castShadow = false;
    root.add(glass);

    // Rich sunset = main ambience focal point
    var sky = new THREE.Mesh(
      new THREE.PlaneGeometry(winLen - 0.05, winH - 0.05),
      new THREE.MeshBasicMaterial({ map: makeRichSunset(), toneMapped: false })
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
      applyAmbience();
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
        // no sofa
      } catch (e) {
        console.warn(e);
      }
    }

    if (!document.querySelector('script[data-furniture]')) {
      var s = document.createElement('script');
      s.src = 'furniture.js?v=amb1';
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
