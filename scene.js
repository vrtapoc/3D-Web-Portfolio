/*
 * Warm wood studio — locked lighting from mockup
 * - No sofa / rug (open center floor)
 * - Exact wood floor roughness 0.35 / metalness 0.12
 * - Exact light rig: hemi 0.7, camera fill 0.75, sun key 5.0, window bounce 2.2
 * - ACES exposure 1.15
 * - Open left, door on back left, window + bench on right
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/e85884eca00ae0cd9dc9f3d523d1d14a99f376e5/scene.js';

  var H = 6.8;
  var T = 0.2;
  var WALL_COLOR = 0x2b2d33;

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

  // Exact wood floor texture from mockup
  function createExactWoodFloorTexture() {
    var canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    var ctx = canvas.getContext('2d');
    var planks = 16;
    var plankHeight = canvas.height / planks;
    ctx.fillStyle = '#1b1816';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < planks; i++) {
      var y = i * plankHeight;
      var tone = 26 + Math.floor(Math.random() * 10);
      ctx.fillStyle = 'rgb(' + (tone + 5) + ',' + (tone + 2) + ',' + tone + ')';
      ctx.fillRect(0, y + 2, canvas.width, plankHeight - 4);
      ctx.fillStyle = '#0c0a09';
      ctx.fillRect(0, y, canvas.width, 2);
    }
    var albedoMap = new THREE.CanvasTexture(canvas);
    albedoMap.wrapS = THREE.RepeatWrapping;
    albedoMap.wrapT = THREE.RepeatWrapping;
    albedoMap.repeat.set(2, 2);
    return albedoMap;
  }

  function makeSunsetSkyline() {
    var sunsetCanvas = document.createElement('canvas');
    sunsetCanvas.width = 512;
    sunsetCanvas.height = 512;
    var sCtx = sunsetCanvas.getContext('2d');
    var grad = sCtx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#2d1a38');
    grad.addColorStop(0.35, '#c45826');
    grad.addColorStop(0.65, '#fca254');
    grad.addColorStop(1, '#ffc77d');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 512, 512);
    sCtx.fillStyle = '#1e1422';
    for (var b = 0; b < 22; b++) {
      var bw = 16 + Math.random() * 25;
      var bh = 120 + Math.random() * 220;
      sCtx.fillRect(b * 24, 512 - bh, bw, bh);
    }
    return new THREE.CanvasTexture(sunsetCanvas);
  }

  function applyLockedLighting() {
    if (typeof scene === 'undefined' || !scene) return;

    // Dim / neutralize original scene lights so our rig dominates
    scene.traverse(function (obj) {
      if (!obj.isLight) return;
      if (obj.name && String(obj.name).indexOf('locked-') === 0) return;
      if (obj.isAmbientLight || obj.isHemisphereLight) {
        obj.intensity = 0.05;
      }
      if (obj.isDirectionalLight) {
        obj.intensity = Math.min(obj.intensity, 0.15);
      }
    });

    // 1. Soft Warm Ceiling Fill (EXACT)
    var hemiLight = new THREE.HemisphereLight(0xffeedd, 0x252530, 0.7);
    hemiLight.name = 'locked-hemi';
    scene.add(hemiLight);

    // 2. Camera-Angle Soft Fill (EXACT)
    var cameraFill = new THREE.DirectionalLight(0xffecd6, 0.75);
    cameraFill.name = 'locked-camera-fill';
    cameraFill.position.set(-5.5, 6.0, 7.5);
    scene.add(cameraFill);

    // 3. Sunset Sun Key through window (EXACT)
    var sunLight = new THREE.DirectionalLight(0xff9e48, 5.0);
    sunLight.name = 'locked-sun';
    sunLight.position.set(7.5, 4.5, 0);
    sunLight.target.position.set(0, 0.5, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0001;
    scene.add(sunLight);
    scene.add(sunLight.target);

    // 4. Warm Window Sill Bounce (EXACT)
    var windowBounce = new THREE.PointLight(0xff9442, 2.2, 12, 1.2);
    windowBounce.name = 'locked-window-bounce';
    windowBounce.position.set(4.5, 2.2, 1.5);
    scene.add(windowBounce);

    // Cyan screen glow (near desk)
    var screenLight = new THREE.PointLight(0x00c4e8, 1.2, 4);
    screenLight.name = 'locked-screen';
    screenLight.position.set(0, 2.0, 0.2);
    scene.add(screenLight);

    if (scene.background) scene.background = new THREE.Color(0x0e0f12);
    if (scene.fog) {
      scene.fog.color = new THREE.Color(0x0e0f12);
      scene.fog.near = 30;
      scene.fog.far = 65;
    }

    if (typeof renderer !== 'undefined' && renderer) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      if (renderer.outputColorSpace !== undefined) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
      }
      renderer.shadowMap.enabled = true;
      if (THREE.PCFSoftShadowMap) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
  }

  function placeProps() {
    if (typeof scene === 'undefined' || !scene) return;

    // Jukebox back-right, facing forward
    if (typeof jukebox !== 'undefined' && jukebox) {
      jukebox.position.set(3.4, 0, -1.7);
      jukebox.rotation.y = Math.PI * 0.95;
    } else {
      scene.traverse(function (obj) {
        if (!obj.isGroup) return;
        if (
          Math.abs(obj.position.x - 2.15) < 0.5 &&
          Math.abs(obj.position.z + 1.75) < 0.6
        ) {
          obj.position.set(3.4, 0, -1.7);
          obj.rotation.y = Math.PI * 0.95;
        }
      });
    }

    // Balloon toward front-right near window edge
    scene.traverse(function (obj) {
      if (!obj.isGroup) return;
      if (
        Math.abs(obj.position.x + 1.85) < 0.5 &&
        Math.abs(obj.position.z - 0.4) < 0.5
      ) {
        obj.position.set(3.8, 0, 3.2);
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
    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x3b3d44,
      roughness: 0.5,
      metalness: 0.15
    });
    var doorMat = new THREE.MeshStandardMaterial({
      color: 0x222428,
      roughness: 0.65,
      metalness: 0.06
    });
    var metalMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      roughness: 0.2,
      metalness: 0.9
    });
    var benchMat = new THREE.MeshStandardMaterial({
      color: WALL_COLOR,
      roughness: 0.8,
      metalness: 0.04
    });
    var cushionMat = new THREE.MeshStandardMaterial({
      color: 0x60636a,
      roughness: 0.75,
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

    // Open left — no left wall
    var xL = -5.4;
    var xR = 5.1;
    var zB = -2.9;
    var zF = 5.1;

    // Warm wood floor (EXACT material from mockup)
    var woodTexture = createExactWoodFloorTexture();
    var floor = new THREE.Mesh(
      new THREE.BoxGeometry(xR - xL + 0.9, 0.16, zF - zB + 0.5),
      new THREE.MeshStandardMaterial({
        map: woodTexture,
        roughness: 0.35,
        metalness: 0.12
      })
    );
    floor.position.set((xL + xR) / 2, -0.08, (zB + zF) / 2);
    floor.receiveShadow = true;
    floor.castShadow = false;
    root.add(floor);

    // Back wall + door far left
    var doorW = 1.85;
    var doorH = 4.4;
    var doorX = -3.5;
    var doorX0 = doorX - doorW / 2;
    var doorX1 = doorX + doorW / 2;

    if (doorX0 > xL) addArch(doorX0 - xL, H, T, (xL + doorX0) / 2, H / 2, zB);
    addArch(doorW, H - doorH, T, doorX, doorH + (H - doorH) / 2, zB);
    if (xR > doorX1) addArch(xR - doorX1, H, T, (doorX1 + xR) / 2, H / 2, zB);
    addArch(T * 1.1, H, T * 1.1, xR, H / 2, zB);

    var ft = 0.07;
    addArch(ft, doorH + 0.1, T + 0.03, doorX0, doorH / 2, zB, frameMat);
    addArch(ft, doorH + 0.1, T + 0.03, doorX1, doorH / 2, zB, frameMat);
    addArch(doorW, ft, T + 0.03, doorX, doorH, zB, frameMat);
    addArch(doorW - 0.1, doorH - 0.08, 0.05, doorX, doorH / 2, zB + T / 2 + 0.02, doorMat);
    addArch(0.15, 0.035, 0.035, doorX + doorW * 0.28, doorH * 0.45, zB + T / 2 + 0.05, metalMat);

    // Right wall + panoramic window + daybed
    var winZ0 = zB + 0.7;
    var winZ1 = zF - 0.8;
    var winLen = winZ1 - winZ0;
    var headerH = 1.0;
    var headerBottom = H - headerH;
    var benchH = 0.85;

    addArch(T, headerH, winLen, xR, headerBottom + headerH / 2, (winZ0 + winZ1) / 2);
    addArch(T, benchH, winLen, xR, benchH / 2, (winZ0 + winZ1) / 2);
    addArch(T, H, winZ0 - zB, xR, H / 2, (zB + winZ0) / 2);
    addArch(T, H, zF - winZ1, xR, H / 2, (winZ1 + zF) / 2);

    // Daybed bench + cushion (no loose cubes)
    addArch(1.3, benchH, winLen - 0.2, xR - 0.7, benchH / 2, (winZ0 + winZ1) / 2, benchMat);
    addArch(1.25, 0.08, winLen - 0.25, xR - 0.7, benchH + 0.04, (winZ0 + winZ1) / 2, cushionMat);

    // Throw pillows on bench
    addArch(0.45, 0.28, 0.18, xR - 0.85, benchH + 0.28, (winZ0 + winZ1) / 2 - 1.2,
      new THREE.MeshStandardMaterial({ color: 0x8a847a, roughness: 0.8 }));
    addArch(0.4, 0.26, 0.16, xR - 0.85, benchH + 0.26, (winZ0 + winZ1) / 2 - 0.85,
      new THREE.MeshStandardMaterial({ color: 0x484b54, roughness: 0.8 }));

    var winBottom = benchH + 0.08;
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
          color: 0x88aacc,
          transparent: true,
          opacity: 0.18,
          roughness: 0.1,
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
      new THREE.MeshBasicMaterial({ map: makeSunsetSkyline(), toneMapped: false })
    );
    view.position.set(xR + 0.1, winBottom + winH / 2, (winZ0 + winZ1) / 2);
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

    controls.target.set(0.2, 1.2, 0.5);
    camera.position.set(-8.5, 7.8, 9.2);
    camera.lookAt(0.2, 1.2, 0.5);

    controls.enablePan = false;
    controls.minDistance = 11;
    controls.maxDistance = 20;
    controls.minAzimuthAngle = -Math.PI / 7;
    controls.maxAzimuthAngle = Math.PI / 5.5;
    controls.minPolarAngle = Math.PI / 3.5;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.12;
    if (controls.update) controls.update();

    setTimeout(function () {
      window.__dioramaBuilt = false;
      removeOriginalWalls();
      trimOriginalFloor();
      buildWalls();
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
        // createLobbyChair intentionally empty — no sofa
      } catch (e) {
        console.warn(e);
      }
    }

    if (!document.querySelector('script[data-furniture]')) {
      var s = document.createElement('script');
      s.src = 'furniture.js?v=nosofa1';
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
