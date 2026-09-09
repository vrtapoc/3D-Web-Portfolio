/*
 * Floating media console under </bosst> neon + soundbar + underglow
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

  var __neonLight = null;

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
        ctx.strokeStyle = 'rgba(0,0,0,' + (0.04 + Math.random() * 0.07) + ')';
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
      if (obj.isDirectionalLight) obj.intensity = Math.min(obj.intensity, 0.18);
      if (obj.isPointLight && obj.intensity > 1.5 && n.indexOf('neon') < 0) obj.intensity *= 0.4;
    });
    toRemove.forEach(function (l) {
      if (l.parent) l.parent.remove(l);
    });

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
    var windowKey = new THREE.DirectionalLight(0xffc090, 0.35);
    windowKey.name = 'amb-window-key';
    windowKey.position.set(8, 4, 1);
    windowKey.target.position.set(0, 0.4, 0.5);
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
      if (renderer.outputColorSpace !== undefined) renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
    }
  }

  function placeProps() {
    if (typeof scene === 'undefined' || !scene) return;
    var deskZ = -1.8;
    var deskX = 0.15;
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
    if (typeof jukebox !== 'undefined' && jukebox) {
      jukebox.position.set(2.6, 0, -2.05);
      jukebox.rotation.y = Math.PI;
    } else {
      scene.traverse(function (obj) {
        if (!obj.isGroup) return;
        if (Math.abs(obj.position.x - 2.15) < 0.5 && Math.abs(obj.position.z + 1.75) < 0.6) {
          obj.position.set(2.6, 0, -2.05);
          obj.rotation.y = Math.PI;
        }
      });
    }
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
            Math.abs(obj.position.x - 3.7) < 0.5 ||
            Math.abs(obj.position.x - 3.9) < 0.5)
        ) {
          isBalloon = true;
        }
      }
      if (isBalloon) obj.position.set(3.9, 0, 3.6);
    });
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

    var wallMat = new THREE.MeshStandardMaterial({ color: WALL_COLOR, roughness: 0.92, metalness: 0.02 });
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.55, metalness: 0.2 });
    var doorMat = new THREE.MeshStandardMaterial({ color: 0x101012, roughness: 0.78, metalness: 0.04 });
    var metalMat = new THREE.MeshStandardMaterial({ color: 0x9a9aa0, roughness: 0.3, metalness: 0.8 });
    var benchMat = new THREE.MeshStandardMaterial({ color: 0x121214, roughness: 0.88, metalness: 0.03 });

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
      new THREE.MeshStandardMaterial({ map: woodTex, color: 0x1a1614, roughness: 0.55, metalness: 0.05 })
    );
    floor.position.set((xL + xR) / 2, -0.08, (zB + zF) / 2);
    floor.receiveShadow = true;
    root.add(floor);

    var rimMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.9, metalness: 0.02 });
    box(floorW, 0.16, 0.06, (xL + xR) / 2, -0.08, zF + 0.03, rimMat);
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

    var panelMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.85, metalness: 0.03 });
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
    // full-length daybed removed — floating console only

    var winBottom = benchH + 0.02;
    var winTop = headerBottom;
    var winH = winTop - winBottom;
    var winCY = winBottom + winH / 2;
    var winCZ = (winZ0 + winZ1) / 2;

    var felt = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, winH - 0.06, winLen - 0.1),
      new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.98, metalness: 0 })
    );
    felt.position.set(xR - 0.02, winCY, winCZ);
    felt.receiveShadow = true;
    root.add(felt);

    var slatCount = 28;
    var usableZ = winLen - 0.25;
    var gap = usableZ / slatCount;
    var woodMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.7, metalness: 0.05 });
    var slatGeo = new THREE.BoxGeometry(0.05, winH - 0.12, 0.07);
    var slats = new THREE.InstancedMesh(slatGeo, woodMat, slatCount);
    slats.castShadow = true;
    slats.receiveShadow = true;
    var dummy = new THREE.Object3D();
    for (var si = 0; si < slatCount; si++) {
      dummy.position.set(xR - 0.07, winCY, winZ0 + 0.12 + gap * (si + 0.5));
      dummy.updateMatrix();
      slats.setMatrixAt(si, dummy.matrix);
    }
    slats.instanceMatrix.needsUpdate = true;
    root.add(slats);

    var topSpot1 = new THREE.SpotLight(0xffc090, 1.4, 8, Math.PI / 5, 0.55, 1.2);
    topSpot1.position.set(xR - 0.9, winTop - 0.05, winCZ - winLen * 0.22);
    topSpot1.target.position.set(xR - 0.05, winCY - 0.5, winCZ - winLen * 0.22);
    root.add(topSpot1);
    root.add(topSpot1.target);
    var topSpot2 = new THREE.SpotLight(0xffb070, 1.2, 8, Math.PI / 5, 0.55, 1.2);
    topSpot2.position.set(xR - 0.9, winTop - 0.05, winCZ + winLen * 0.22);
    topSpot2.target.position.set(xR - 0.05, winCY - 0.5, winCZ + winLen * 0.22);
    root.add(topSpot2);
    root.add(topSpot2.target);
    var edgeFill = new THREE.PointLight(0xffa060, 0.35, 6, 1.5);
    edgeFill.position.set(xR - 0.4, winTop - 0.2, winCZ);
    root.add(edgeFill);

    function makeNeonLogoTexture() {
      var c = document.createElement('canvas');
      c.width = 1536;
      c.height = 512;
      var ctx = c.getContext('2d');
      ctx.clearRect(0, 0, 1536, 512);
      ctx.font = '900 200px "JetBrains Mono", Consolas, "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 36;
      ctx.fillStyle = '#00c8e0';
      ctx.fillText('</bosst>', 768, 270);
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#00f5ff';
      ctx.fillText('</bosst>', 768, 270);
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#e8ffff';
      ctx.fillText('</bosst>', 768, 270);
      var tex = new THREE.CanvasTexture(c);
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      return tex;
    }

    var neonGroup = new THREE.Group();
    neonGroup.rotation.y = -Math.PI / 2;
    neonGroup.position.set(xR - 0.13, winCY + 0.15, winCZ);

    var plateW = 4.0;
    var plateH = 1.5;
    var plateMat;
    try {
      plateMat = new THREE.MeshPhysicalMaterial({
        color: 0x12141a,
        roughness: 0.12,
        metalness: 0.08,
        transmission: 0.45,
        transparent: true,
        opacity: 0.48,
        thickness: 0.02,
        side: THREE.DoubleSide
      });
    } catch (e) {
      plateMat = new THREE.MeshStandardMaterial({
        color: 0x12141a,
        roughness: 0.15,
        metalness: 0.1,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide
      });
    }
    neonGroup.add(new THREE.Mesh(new THREE.BoxGeometry(plateW, plateH, 0.025), plateMat));

    var chromeMat = new THREE.MeshStandardMaterial({ color: 0xc0c4cc, roughness: 0.25, metalness: 0.9 });
    [[-plateW * 0.46, plateH * 0.4], [plateW * 0.46, plateH * 0.4], [-plateW * 0.46, -plateH * 0.4], [plateW * 0.46, -plateH * 0.4]].forEach(function (xy) {
      var stand = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 10), chromeMat);
      stand.rotation.x = Math.PI / 2;
      stand.position.set(xy[0], xy[1], -0.035);
      neonGroup.add(stand);
      var disc = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.007, 12), chromeMat);
      disc.rotation.x = Math.PI / 2;
      disc.position.set(xy[0], xy[1], -0.06);
      neonGroup.add(disc);
    });

    var logo = new THREE.Mesh(
      new THREE.PlaneGeometry(plateW * 0.9, plateH * 0.75),
      new THREE.MeshBasicMaterial({
        map: makeNeonLogoTexture(),
        transparent: true,
        toneMapped: false,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    logo.position.set(0, 0, 0.015);
    neonGroup.add(logo);

    var neonLight = new THREE.PointLight(0x00f5ff, 2.4, 7.5, 1.2);
    neonLight.name = 'neon-accent';
    neonLight.position.set(0, 0, 0.55);
    neonGroup.add(neonLight);
    __neonLight = neonLight;
    root.add(neonGroup);

    // Floating media console under neon
    var consoleW = 2.8;
    var consoleH = 0.45;
    var consoleD = 0.55;
    var consoleY = 0.3 + consoleH / 2;
    var consoleX = xR - consoleD / 2 - 0.05;
    var consoleZ = winCZ;

    var consoleMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.4,
      metalness: 0.1
    });
    var consoleBody = new THREE.Mesh(
      new THREE.BoxGeometry(consoleD, consoleH, consoleW),
      consoleMat
    );
    consoleBody.position.set(consoleX, consoleY, consoleZ);
    consoleBody.castShadow = true;
    consoleBody.receiveShadow = true;
    root.add(consoleBody);

    var topCap = new THREE.Mesh(
      new THREE.BoxGeometry(consoleD + 0.02, 0.02, consoleW + 0.02),
      new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.35, metalness: 0.15 })
    );
    topCap.position.set(consoleX, consoleY + consoleH / 2 + 0.01, consoleZ);
    root.add(topCap);

    var seamMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
    [-1, 0, 1].forEach(function (si) {
      var seam = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, consoleH * 0.85, 0.01),
        seamMat
      );
      seam.position.set(
        consoleX - consoleD / 2 - 0.002,
        consoleY,
        consoleZ + si * (consoleW / 6)
      );
      root.add(seam);
    });

    var underGlow = new THREE.PointLight(0xffa060, 1.0, 2.0, 1.4);
    underGlow.position.set(consoleX - 0.1, 0.15, consoleZ);
    root.add(underGlow);
    var underGlow2 = new THREE.PointLight(0x00f5ff, 0.25, 1.8, 1.5);
    underGlow2.position.set(consoleX - 0.05, 0.12, consoleZ);
    root.add(underGlow2);

    var barW = 1.4;
    var barH = 0.08;
    var barD = 0.14;
    var soundbar = new THREE.Mesh(
      new THREE.BoxGeometry(barD, barH, barW),
      new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9, metalness: 0.05 })
    );
    soundbar.position.set(
      consoleX - consoleD / 2 + barD / 2 + 0.05,
      consoleY + consoleH / 2 + 0.02 + barH / 2,
      consoleZ
    );
    soundbar.castShadow = true;
    root.add(soundbar);

    var led = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0x00f5ff,
        emissive: 0x00f5ff,
        emissiveIntensity: 2.0,
        roughness: 0.3
      })
    );
    led.position.set(
      soundbar.position.x - barD / 2 - 0.01,
      soundbar.position.y,
      soundbar.position.z
    );
    root.add(led);

    scene.add(root);
  }

  function startNeonLoop() {
    if (window.__neonLoopStarted) return;
    window.__neonLoopStarted = true;
    function tick() {
      requestAnimationFrame(tick);
      var t = performance.now() * 0.001;
      if (__neonLight) {
        __neonLight.intensity = 2.2 + 0.25 * Math.sin(t * 2.2) + 0.12 * Math.sin(t * 5.1);
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
      startNeonLoop();
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
      s.src = 'furniture.js?v=console1';
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
