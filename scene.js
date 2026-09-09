/*
 * Diorama room + rainy night city window
 * - Desk: move group only (monitor/papers stay visible as children)
 * - Balloon: front-right edge
 * - Window: night skyline + animated rain + mullions + cool inward glow
 * - Ambience: balanced dark (not washed out)
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/e85884eca00ae0cd9dc9f3d523d1d14a99f376e5/scene.js';

  var H = 5.8;
  var T = 0.22;
  var WALL_COLOR = 0x141416;

  var xL = -4.8;
  var xR = 4.4;
  var zB = -2.7;
  var zF = 4.2;

  // Rain texture ref for animation
  var __rainTex = null;
  var __windowGlowLight = null;

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

  function createRichDarkWoodFloor() {
    var canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    var ctx = canvas.getContext('2d');
    var planks = 12;
    var plankH = canvas.height / planks;

    ctx.fillStyle = '#0a0908';
    ctx.fillRect(0, 0, 1024, 1024);

    for (var i = 0; i < planks; i++) {
      var y = i * plankH;
      var v = 16 + ((i * 3) % 5);
      ctx.fillStyle = 'rgb(' + (v + 4) + ',' + (v + 1) + ',' + v + ')';
      ctx.fillRect(0, y + 1, 1024, plankH - 2);

      for (var gLine = 0; gLine < 28; gLine++) {
        var gy = y + 2 + Math.random() * (plankH - 4);
        var alpha = 0.04 + Math.random() * 0.07;
        ctx.strokeStyle = 'rgba(0,0,0,' + alpha + ')';
        ctx.lineWidth = 0.8 + Math.random();
        ctx.beginPath();
        ctx.moveTo(0, gy);
        for (var x = 0; x < 1024; x += 32) {
          ctx.lineTo(x, gy + Math.sin(x * 0.02 + i) * 1.2);
        }
        ctx.stroke();
      }

      ctx.fillStyle = '#050403';
      ctx.fillRect(0, y, 1024, 1.5);
    }

    var tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2.2, 2.2);
    tex.anisotropy = 8;
    return tex;
  }

  // ---- Night city skyline (static) ----
  function makeNightCityTexture() {
    var c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    var ctx = c.getContext('2d');

    var g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#04040c');
    g.addColorStop(0.4, '#0a0a16');
    g.addColorStop(0.7, '#10101c');
    g.addColorStop(1, '#161422');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 512);

    // Distant moon glow (very soft)
    ctx.beginPath();
    ctx.arc(820, 90, 28, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,210,255,0.2)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(820, 90, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(230,235,255,0.55)';
    ctx.fill();

    for (var b = 0; b < 30; b++) {
      var bw = 20 + (b % 6) * 9;
      var bh = 80 + ((b * 53) % 300);
      var bx = 8 + b * 34;
      ctx.fillStyle = '#0a0a12';
      ctx.fillRect(bx, 512 - bh, bw, bh);

      for (var wy = 512 - bh + 10; wy < 500; wy += 13) {
        for (var wx = bx + 4; wx < bx + bw - 4; wx += 9) {
          if (Math.random() > 0.52) {
            var bright = 0.2 + Math.random() * 0.55;
            // mostly warm windows, some cool
            if (Math.random() > 0.85) {
              ctx.fillStyle = 'rgba(140,180,255,' + bright + ')';
            } else {
              ctx.fillStyle = 'rgba(255,210,130,' + bright + ')';
            }
            ctx.fillRect(wx, wy, 3, 4);
          }
        }
      }
    }

    // Ground haze
    var haze = ctx.createLinearGradient(0, 400, 0, 512);
    haze.addColorStop(0, 'rgba(20,30,50,0)');
    haze.addColorStop(1, 'rgba(25,35,55,0.4)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 400, 1024, 112);

    var tex = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // ---- Rain streaks (UV-scrolled) ----
  function makeRainTexture() {
    var c = document.createElement('canvas');
    c.width = 256;
    c.height = 512;
    var ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 256, 512);
    for (var i = 0; i < 90; i++) {
      var rx = Math.random() * 256;
      var ry = Math.random() * 512;
      var len = 14 + Math.random() * 32;
      ctx.strokeStyle = 'rgba(170,195,230,' + (0.1 + Math.random() * 0.28) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + 1.2, ry + len);
      ctx.stroke();
    }
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3.5, 2.5);
    return tex;
  }

  function applyBalancedLighting() {
    if (typeof scene === 'undefined' || !scene) return;

    var toRemove = [];
    scene.traverse(function (obj) {
      if (!obj.isLight) return;
      var n = obj.name || '';
      if (n.indexOf('amb-') === 0 || n.indexOf('locked-') === 0 || n.indexOf('window-') === 0) {
        toRemove.push(obj);
        return;
      }
      if (obj.isAmbientLight || obj.isHemisphereLight) obj.intensity = 0.08;
      if (obj.isDirectionalLight) obj.intensity = Math.min(obj.intensity, 0.18);
      if (obj.isPointLight && obj.intensity > 1.5) obj.intensity *= 0.4;
    });
    toRemove.forEach(function (l) {
      if (l.parent) l.parent.remove(l);
    });

    // Slightly cooler ambient for night
    var amb = new THREE.AmbientLight(0xa8b0c0, 0.26);
    amb.name = 'amb-ambient';
    scene.add(amb);

    var hemi = new THREE.HemisphereLight(0xc8d0e0, 0x121218, 0.3);
    hemi.name = 'amb-hemi';
    scene.add(hemi);

    var cameraFill = new THREE.DirectionalLight(0xd0d4e0, 0.32);
    cameraFill.name = 'amb-camera-fill';
    cameraFill.position.set(-5, 5.5, 7);
    scene.add(cameraFill);

    // Soft key from window direction (cool, not harsh sun)
    var windowKey = new THREE.DirectionalLight(0x6a8ab8, 0.55);
    windowKey.name = 'amb-window-key';
    windowKey.position.set(8, 4, 1);
    windowKey.target.position.set(0, 0.4, 0.5);
    windowKey.castShadow = false;
    scene.add(windowKey);
    scene.add(windowKey.target);

    var screenLight = new THREE.PointLight(0x00c4e8, 0.85, 4);
    screenLight.name = 'amb-screen';
    screenLight.position.set(0.15, 2.0, -1.7);
    scene.add(screenLight);

    if (scene.background) scene.background = new THREE.Color(0x06060a);
    if (scene.fog) {
      scene.fog.color = new THREE.Color(0x06060a);
      scene.fog.near = 28;
      scene.fog.far = 55;
    }

    if (typeof renderer !== 'undefined' && renderer) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.9;
      if (renderer.outputColorSpace !== undefined) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
      }
      renderer.shadowMap.enabled = true;
    }
  }

  function placeProps() {
    if (typeof scene === 'undefined' || !scene) return;

    // Desk depth 1.2; back edge near wall
    var deskZ = -1.8;
    var deskX = 0.15;

    // ONLY move desk group — monitor/papers/keyboard/mug are children
    if (typeof desk !== 'undefined' && desk) {
      desk.position.set(deskX, 0, deskZ);
      if (typeof monitor !== 'undefined' && monitor && monitor.parent === desk) {
        monitor.position.set(0, 0, 0);
        monitor.visible = true;
      }
      if (typeof decorations !== 'undefined' && decorations && decorations.parent === desk) {
        decorations.position.set(0, 0, 0);
        decorations.visible = true;
      }
    }

    // Floor lamp (not a desk child)
    scene.traverse(function (obj) {
      if (!obj.isGroup) return;
      if (obj.userData && obj.userData.name === 'lamp') {
        obj.position.set(deskX + 1.55, 0, deskZ + 0.4);
      }
    });
    scene.traverse(function (obj) {
      if (!obj.isGroup || !obj.position) return;
      if (
        Math.abs(obj.position.x - 1.55) < 0.2 &&
        Math.abs(obj.position.z - 0.55) < 0.25 &&
        Math.abs(obj.position.y) < 0.05
      ) {
        if (obj.children && obj.children.length > 3) {
          obj.position.set(deskX + 1.55, 0, deskZ + 0.4);
        }
      }
    });

    // Jukebox right of desk
    if (typeof jukebox !== 'undefined' && jukebox) {
      jukebox.position.set(2.6, 0, -2.05);
      jukebox.rotation.y = Math.PI;
    } else {
      scene.traverse(function (obj) {
        if (!obj.isGroup) return;
        if (
          Math.abs(obj.position.x - 2.15) < 0.5 &&
          Math.abs(obj.position.z + 1.75) < 0.6
        ) {
          obj.position.set(2.6, 0, -2.05);
          obj.rotation.y = Math.PI;
        }
      });
    }

    // Balloon → front-right edge (not near chair)
    scene.traverse(function (obj) {
      if (!obj.isGroup) return;
      var isBalloon = obj.userData && obj.userData.name === 'balloon';
      if (!isBalloon) {
        var hasSphere = false;
        obj.traverse(function (c) {
          if (c.isMesh && c.geometry && c.geometry.type === 'SphereGeometry') hasSphere = true;
        });
        if (
          hasSphere &&
          (Math.abs(obj.position.x + 1.85) < 0.4 ||
            Math.abs(obj.position.x - 3.55) < 0.5 ||
            Math.abs(obj.position.x - 3.7) < 0.4)
        ) {
          isBalloon = true;
        }
      }
      if (isBalloon) {
        obj.position.set(3.7, 0, 3.5);
      }
    });

    // Office chair in front of desk
    scene.traverse(function (obj) {
      if (obj.name === 'office-chair') {
        obj.position.set(deskX + 0.05, 0, deskZ + 1.4);
        obj.rotation.y = Math.PI + 0.08;
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
      roughness: 0.92,
      metalness: 0.02
    });
    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1c,
      roughness: 0.55,
      metalness: 0.2
    });
    var doorMat = new THREE.MeshStandardMaterial({
      color: 0x101012,
      roughness: 0.78,
      metalness: 0.04
    });
    var metalMat = new THREE.MeshStandardMaterial({
      color: 0x9a9aa0,
      roughness: 0.3,
      metalness: 0.8
    });
    var benchMat = new THREE.MeshStandardMaterial({
      color: 0x121214,
      roughness: 0.88,
      metalness: 0.03
    });
    var cushionMat = new THREE.MeshStandardMaterial({
      color: 0x1e1e22,
      roughness: 0.9,
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

    var floorW = xR - xL;
    var floorD = zF - zB;
    var woodTex = createRichDarkWoodFloor();
    var floor = new THREE.Mesh(
      new THREE.BoxGeometry(floorW, 0.16, floorD),
      new THREE.MeshStandardMaterial({
        map: woodTex,
        color: 0x1a1614,
        roughness: 0.55,
        metalness: 0.05
      })
    );
    floor.position.set((xL + xR) / 2, -0.08, (zB + zF) / 2);
    floor.receiveShadow = true;
    root.add(floor);

    var rimMat = new THREE.MeshStandardMaterial({
      color: 0x0c0c0e,
      roughness: 0.9,
      metalness: 0.02
    });
    box(floorW, 0.16, 0.06, (xL + xR) / 2, -0.08, zF + 0.03, rimMat);
    box(0.06, 0.16, floorD + 0.06, xL - 0.03, -0.08, (zB + zF) / 2 + 0.03, rimMat);

    // Back wall + door
    var doorW = 1.6;
    var doorH = 3.8;
    var doorX = -3.2;
    var doorX0 = doorX - doorW / 2;
    var doorX1 = doorX + doorW / 2;

    if (doorX0 > xL) box(doorX0 - xL, H, T, (xL + doorX0) / 2, H / 2, zB);
    box(doorW, H - doorH, T, doorX, doorH + (H - doorH) / 2, zB);
    if (xR > doorX1) box(xR - doorX1, H, T, (doorX1 + xR) / 2, H / 2, zB);
    box(T, H, T, xR, H / 2, zB);

    var panelMat = new THREE.MeshStandardMaterial({
      color: 0x1c1c1e,
      roughness: 0.85,
      metalness: 0.03
    });
    box(xR - xL - 0.3, 0.06, 0.04, (xL + xR) / 2, 1.4, zB + T / 2 + 0.02, panelMat);
    box(xR - xL - 0.3, 0.04, 0.04, (xL + xR) / 2, 0.35, zB + T / 2 + 0.02, panelMat);

    box(0.06, doorH + 0.08, T + 0.02, doorX0, doorH / 2, zB, frameMat);
    box(0.06, doorH + 0.08, T + 0.02, doorX1, doorH / 2, zB, frameMat);
    box(doorW, 0.06, T + 0.02, doorX, doorH, zB, frameMat);
    box(doorW - 0.1, doorH - 0.06, 0.05, doorX, doorH / 2, zB + T / 2 + 0.02, doorMat);
    box(0.14, 0.03, 0.03, doorX + doorW * 0.3, doorH * 0.48, zB + T / 2 + 0.05, metalMat);

    // Right wall opening
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

    // Daybed bench
    box(1.15, benchH, winLen - 0.15, xR - 0.6, benchH / 2, (winZ0 + winZ1) / 2, benchMat);
    box(1.1, 0.07, winLen - 0.2, xR - 0.6, benchH + 0.035, (winZ0 + winZ1) / 2, cushionMat);

    var winBottom = benchH + 0.05;
    var winTop = headerBottom;
    var winH = winTop - winBottom;
    var winCY = winBottom + winH / 2;
    var winCZ = (winZ0 + winZ1) / 2;

    // ---- RAINY NIGHT WINDOW ----
    var cityTex = makeNightCityTexture();
    var rainTex = makeRainTexture();
    __rainTex = rainTex;

    // City skyline (outside)
    var city = new THREE.Mesh(
      new THREE.PlaneGeometry(winLen - 0.06, winH - 0.06),
      new THREE.MeshBasicMaterial({ map: cityTex, toneMapped: false, depthWrite: false })
    );
    city.position.set(xR + 0.1, winCY, winCZ);
    city.rotation.y = -Math.PI / 2;
    root.add(city);

    // Rain overlay (animated)
    var rain = new THREE.Mesh(
      new THREE.PlaneGeometry(winLen - 0.08, winH - 0.08),
      new THREE.MeshBasicMaterial({
        map: rainTex,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        toneMapped: false
      })
    );
    rain.position.set(xR + 0.07, winCY, winCZ);
    rain.rotation.y = -Math.PI / 2;
    root.add(rain);

    // Glass inward face
    var glass = new THREE.Mesh(
      new THREE.PlaneGeometry(winLen - 0.1, winH - 0.1),
      new THREE.MeshStandardMaterial({
        color: 0x6a88aa,
        transparent: true,
        opacity: 0.1,
        roughness: 0.08,
        metalness: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    glass.position.set(xR - 0.02, winCY, winCZ);
    glass.rotation.y = Math.PI / 2;
    glass.castShadow = false;
    root.add(glass);

    // Mullions / frame (3×2 panes)
    var md = 0.07;
    // Outer frame
    box(md, winH, 0.06, xR, winCY, winZ0, frameMat);
    box(md, winH, 0.06, xR, winCY, winZ1, frameMat);
    box(md, 0.06, winLen, xR, winBottom, winCZ, frameMat);
    box(md, 0.06, winLen, xR, winTop, winCZ, frameMat);
    // Verticals
    var paneW = winLen / 3;
    box(md, winH - 0.08, 0.05, xR, winCY, winZ0 + paneW, frameMat);
    box(md, winH - 0.08, 0.05, xR, winCY, winZ0 + paneW * 2, frameMat);
    // Horizontal mid
    box(md, 0.05, winLen - 0.08, xR, winCY, winCZ, frameMat);

    // Sheer side curtains (cheap)
    var curtainMat = new THREE.MeshStandardMaterial({
      color: 0x222228,
      transparent: true,
      opacity: 0.2,
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    [-1, 1].forEach(function (side) {
      var strip = new THREE.Mesh(
        new THREE.PlaneGeometry(0.32, winH * 0.9),
        curtainMat
      );
      strip.position.set(xR - 0.14, winCY - 0.05, winCZ + side * (winLen * 0.42));
      strip.rotation.y = Math.PI / 2;
      root.add(strip);
    });

    // Cool glow onto bench / floor (not too bright)
    var windowGlow = new THREE.PointLight(0x6a8cff, 0.5, 11, 1.3);
    windowGlow.name = 'window-night-glow';
    windowGlow.position.set(xR - 1.3, winCY - 0.3, winCZ);
    root.add(windowGlow);
    __windowGlowLight = windowGlow;

    var sillGlow = new THREE.PointLight(0x4a6aaa, 0.22, 5.5, 1.2);
    sillGlow.name = 'window-sill-glow';
    sillGlow.position.set(xR - 0.7, benchH + 0.3, winCZ);
    root.add(sillGlow);

    scene.add(root);
  }

  function startRainLoop() {
    if (window.__rainLoopStarted) return;
    window.__rainLoopStarted = true;

    function tick() {
      requestAnimationFrame(tick);
      var t = performance.now() * 0.001;
      if (__rainTex) {
        __rainTex.offset.y = (t * 0.32) % 1;
        __rainTex.offset.x = (t * 0.035) % 1;
      }
      if (__windowGlowLight) {
        var pulse =
          0.48 + 0.06 * Math.sin(t * 1.8) + 0.04 * Math.sin(t * 4.7);
        __windowGlowLight.intensity = pulse;
      }
    }
    tick();
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
      applyBalancedLighting();
      startRainLoop();
      setTimeout(placeProps, 500);
      setTimeout(placeProps, 1200);
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
        placeProps();
      } catch (e) {
        console.warn(e);
      }
    }

    if (!document.querySelector('script[data-furniture]')) {
      var s = document.createElement('script');
      s.src = 'furniture.js?v=rain1';
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
