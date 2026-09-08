/*
 * Floor edge cleanup + desk flush to back wall + balloon at right edge
 * Ambience / wall color / dark wood floor kept
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/e85884eca00ae0cd9dc9f3d523d1d14a99f376e5/scene.js';

  var H = 5.8;
  var T = 0.22;
  var WALL_COLOR = 0x141416;

  // Room bounds (shared by build + placeProps)
  var xL = -4.8;
  var xR = 4.4;
  var zB = -2.7;
  var zF = 4.2;

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

  function makeSunset() {
    var c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    var ctx = c.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#1a1020');
    g.addColorStop(0.35, '#a04828');
    g.addColorStop(0.55, '#d87838');
    g.addColorStop(0.75, '#e8a050');
    g.addColorStop(1, '#c08050');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 512);
    ctx.beginPath();
    ctx.arc(760, 220, 40, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,200,120,0.75)';
    ctx.fill();
    ctx.fillStyle = '#1a1525';
    for (var b = 0; b < 16; b++) {
      var bw = 32 + (b % 3) * 8;
      var bh = 140 + ((b * 37) % 160);
      ctx.fillRect(25 + b * 60, 512 - bh, bw, bh);
    }
    return new THREE.CanvasTexture(c);
  }

  function applyBalancedLighting() {
    if (typeof scene === 'undefined' || !scene) return;

    var toRemove = [];
    scene.traverse(function (obj) {
      if (!obj.isLight) return;
      var n = obj.name || '';
      if (n.indexOf('amb-') === 0 || n.indexOf('locked-') === 0) {
        toRemove.push(obj);
        return;
      }
      if (obj.isAmbientLight || obj.isHemisphereLight) obj.intensity = 0.08;
      if (obj.isDirectionalLight) obj.intensity = Math.min(obj.intensity, 0.2);
      if (obj.isPointLight && obj.intensity > 1.5) obj.intensity *= 0.4;
    });
    toRemove.forEach(function (l) {
      if (l.parent) l.parent.remove(l);
    });

    var amb = new THREE.AmbientLight(0xb8b4b0, 0.28);
    amb.name = 'amb-ambient';
    scene.add(amb);

    var hemi = new THREE.HemisphereLight(0xe8e0d8, 0x1a1a20, 0.32);
    hemi.name = 'amb-hemi';
    scene.add(hemi);

    var cameraFill = new THREE.DirectionalLight(0xe8e0d0, 0.35);
    cameraFill.name = 'amb-camera-fill';
    cameraFill.position.set(-5, 5.5, 7);
    scene.add(cameraFill);

    var sun = new THREE.DirectionalLight(0xff9e48, 1.6);
    sun.name = 'amb-sun';
    sun.position.set(8, 5, 1.5);
    sun.target.position.set(0, 0.3, 0.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.00015;
    scene.add(sun);
    scene.add(sun.target);

    var windowBounce = new THREE.PointLight(0xff9442, 0.9, 10, 1.2);
    windowBounce.name = 'amb-window-bounce';
    windowBounce.position.set(4.0, 2.0, 1.5);
    scene.add(windowBounce);

    var screenLight = new THREE.PointLight(0x00c4e8, 0.7, 3.5);
    screenLight.name = 'amb-screen';
    screenLight.position.set(0, 2.0, -1.6);
    scene.add(screenLight);

    if (scene.background) scene.background = new THREE.Color(0x0a0a0c);
    if (scene.fog) {
      scene.fog.color = new THREE.Color(0x0a0a0c);
      scene.fog.near = 28;
      scene.fog.far = 55;
    }

    if (typeof renderer !== 'undefined' && renderer) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.92;
      if (renderer.outputColorSpace !== undefined) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
      }
      renderer.shadowMap.enabled = true;
    }
  }

  function placeProps() {
    if (typeof scene === 'undefined' || !scene) return;

    // Target: desk tight against back wall (zB = -2.7)
    // Desk depth ~1.2, so desk.z ≈ -1.95 keeps back edge near wall
    var deskZ = -1.95;
    var deskX = 0.15;

    // desk group (keyboard, mouse, mug, papers on desk are children)
    if (typeof desk !== 'undefined' && desk) {
      desk.position.set(deskX, 0, deskZ);
    }

    // monitor is separate group in original scene
    if (typeof monitor !== 'undefined' && monitor) {
      monitor.position.set(deskX, 0, deskZ);
    }

    // floor lamp (right of desk)
    scene.traverse(function (obj) {
      if (!obj.isGroup) return;
      if (obj.userData && obj.userData.name === 'lamp') {
        obj.position.set(deskX + 1.55, 0, deskZ + 0.35);
      }
    });
    // fallback by approx original lamp position
    scene.traverse(function (obj) {
      if (!obj.isGroup || !obj.position) return;
      if (
        Math.abs(obj.position.x - 1.55) < 0.15 &&
        Math.abs(obj.position.z - 0.55) < 0.15 &&
        Math.abs(obj.position.y) < 0.05
      ) {
        obj.position.set(deskX + 1.55, 0, deskZ + 0.35);
      }
    });

    // decorations / papers group if separate
    if (typeof decorations !== 'undefined' && decorations) {
      decorations.position.z = deskZ - 0.15;
    }

    // tablet on desk area
    scene.traverse(function (obj) {
      if (!obj.isGroup || !obj.position) return;
      if (
        Math.abs(obj.position.x - 0.85) < 0.1 &&
        Math.abs(obj.position.y - 1.2) < 0.15 &&
        Math.abs(obj.position.z + 0.25) < 0.15
      ) {
        obj.position.set(deskX + 0.85, 1.2, deskZ - 0.25);
      }
    });

    // Jukebox — right of desk, still near back wall
    if (typeof jukebox !== 'undefined' && jukebox) {
      jukebox.position.set(2.55, 0, -2.0);
      jukebox.rotation.y = Math.PI;
    } else {
      scene.traverse(function (obj) {
        if (!obj.isGroup) return;
        if (
          Math.abs(obj.position.x - 2.15) < 0.4 &&
          Math.abs(obj.position.z + 1.75) < 0.5
        ) {
          obj.position.set(2.55, 0, -2.0);
          obj.rotation.y = Math.PI;
        }
      });
    }

    // Balloon → near right wall edge (front of window bench area)
    scene.traverse(function (obj) {
      if (!obj.isGroup) return;
      var isBalloon =
        (obj.userData && obj.userData.name === 'balloon') ||
        (Math.abs(obj.position.x + 1.85) < 0.3 && Math.abs(obj.position.z - 0.4) < 0.3);
      if (isBalloon) {
        obj.position.set(3.55, 0, 2.6);
      }
    });

    // Office chair from furniture.js
    scene.traverse(function (obj) {
      if (obj.name === 'office-chair') {
        obj.position.set(deskX + 0.05, 0, deskZ + 1.35);
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
      roughness: 0.6,
      metalness: 0.1
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

    // Single clean floor slab — flush to walls, no separate lip pieces that misalign
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

    // Thin underside edge only on open front + open left (visible cutaway rim)
    var rimMat = new THREE.MeshStandardMaterial({
      color: 0x0c0c0e,
      roughness: 0.9,
      metalness: 0.02
    });
    // Front rim
    box(floorW, 0.16, 0.06, (xL + xR) / 2, -0.08, zF + 0.03, rimMat);
    // Left rim
    box(0.06, 0.16, floorD + 0.06, xL - 0.03, -0.08, (zB + zF) / 2 + 0.03, rimMat);

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
        color: 0x6688aa,
        transparent: true,
        opacity: 0.15,
        roughness: 0.1,
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
      // Re-run place after furniture loads
      setTimeout(placeProps, 600);
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
      s.src = 'furniture.js?v=deskback1';
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
