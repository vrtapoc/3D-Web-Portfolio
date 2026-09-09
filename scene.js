/*
 * Acoustic wall polish: </> neon with front PointLight, top grazing spots,
 * thicker oatmeal cushion, pillows left / books+plant right
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
            Math.abs(obj.position.x - 3.7) < 0.4)
        ) {
          isBalloon = true;
        }
      }
      if (isBalloon) obj.position.set(3.7, 0, 3.5);
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
    box(1.15, benchH, winLen - 0.15, xR - 0.6, benchH / 2, (winZ0 + winZ1) / 2, benchMat);

    var winBottom = benchH + 0.02;
    var winTop = headerBottom;
    var winH = winTop - winBottom;
    var winCY = winBottom + winH / 2;
    var winCZ = (winZ0 + winZ1) / 2;

    // --- Acoustic felt + slats ---
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

    // Top grazing spots
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

    // Neon </> sign
    var neonColor = 0xff2a6a;
    var neonMat = new THREE.MeshStandardMaterial({
      color: neonColor,
      emissive: neonColor,
      emissiveIntensity: 2.0,
      roughness: 0.25,
      metalness: 0.15
    });
    var neonGroup = new THREE.Group();
    neonGroup.position.set(xR - 0.14, winCY + 0.1, winCZ);
    function neonSeg(len, rx, ry, rz, px, py, pz) {
      var m = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, len, 10), neonMat);
      m.rotation.set(rx, ry, rz);
      m.position.set(px, py, pz);
      neonGroup.add(m);
    }
    neonSeg(0.55, 0, 0, Math.PI / 2.6, 0, 0.12, -0.55);
    neonSeg(0.55, 0, 0, -Math.PI / 2.6, 0, -0.12, -0.55);
    neonSeg(0.85, 0, 0, -0.45, 0, 0, -0.05);
    neonSeg(0.55, 0, 0, -Math.PI / 2.6, 0, 0.12, 0.5);
    neonSeg(0.55, 0, 0, Math.PI / 2.6, 0, -0.12, 0.5);
    root.add(neonGroup);

    var neonLight = new THREE.PointLight(neonColor, 1.8, 5.5, 1.3);
    neonLight.name = 'neon-accent';
    neonLight.position.set(xR - 0.55, winCY + 0.1, winCZ);
    root.add(neonLight);
    __neonLight = neonLight;
    var neonFill = new THREE.PointLight(0xff6090, 0.5, 4, 1.4);
    neonFill.position.set(xR - 0.35, winCY - 0.2, winCZ);
    root.add(neonFill);

    // Daybed — thick oatmeal cushion
    var fabricMat = new THREE.MeshStandardMaterial({ color: 0xc4b8a8, roughness: 0.88, metalness: 0.02 });
    var cushionTop = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.18, winLen - 0.28), fabricMat);
    cushionTop.position.set(xR - 0.62, benchH + 0.11, winCZ);
    cushionTop.castShadow = true;
    cushionTop.receiveShadow = true;
    root.add(cushionTop);
    var cushionBevel = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.04, winLen - 0.34),
      new THREE.MeshStandardMaterial({ color: 0xb0a498, roughness: 0.9, metalness: 0.02 })
    );
    cushionBevel.position.set(xR - 0.62, benchH + 0.21, winCZ);
    root.add(cushionBevel);
    var cushionY = benchH + 0.22;

    // Pillows left
    var pillow1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.36, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x5a554c, roughness: 0.9, metalness: 0.02 })
    );
    pillow1.position.set(xR - 0.55, cushionY + 0.2, winCZ - winLen * 0.3);
    pillow1.rotation.y = 0.28;
    pillow1.rotation.z = -0.12;
    pillow1.castShadow = true;
    root.add(pillow1);
    var pillow2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.3, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.88, metalness: 0.02 })
    );
    pillow2.position.set(xR - 0.5, cushionY + 0.18, winCZ - winLen * 0.24);
    pillow2.rotation.y = -0.18;
    pillow2.rotation.z = 0.08;
    pillow2.castShadow = true;
    root.add(pillow2);

    // Books + plant on top (right)
    var bookColors = [0x2a3040, 0x5a3020, 0x1e3a2a];
    var bookBaseZ = winCZ + winLen * 0.28;
    var bookBaseX = xR - 0.5;
    var bookTopY = cushionY;
    for (var bi = 0; bi < 3; bi++) {
      var book = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.04, 0.18),
        new THREE.MeshStandardMaterial({ color: bookColors[bi], roughness: 0.65, metalness: 0.06 })
      );
      book.position.set(bookBaseX, cushionY + 0.03 + bi * 0.042, bookBaseZ);
      book.rotation.y = 0.06 * (bi - 1);
      book.castShadow = true;
      root.add(book);
      bookTopY = cushionY + 0.03 + bi * 0.042 + 0.02;
    }
    var pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.055, 0.12, 12),
      new THREE.MeshStandardMaterial({ color: 0xe8e0d4, roughness: 0.5, metalness: 0.05 })
    );
    pot.position.set(bookBaseX, bookTopY + 0.08, bookBaseZ);
    pot.castShadow = true;
    root.add(pot);
    var soil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.015, 10),
      new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.95 })
    );
    soil.position.set(bookBaseX, bookTopY + 0.14, bookBaseZ);
    root.add(soil);
    var leafMat = new THREE.MeshStandardMaterial({ color: 0x2d6a3a, roughness: 0.7, metalness: 0.02 });
    for (var li = 0; li < 6; li++) {
      var leaf = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.16, 0.012), leafMat);
      var ang = (li / 6) * Math.PI * 2;
      leaf.position.set(
        bookBaseX + Math.cos(ang) * 0.025,
        bookTopY + 0.22,
        bookBaseZ + Math.sin(ang) * 0.025
      );
      leaf.rotation.z = Math.cos(ang) * 0.4;
      leaf.rotation.x = Math.sin(ang) * 0.3;
      root.add(leaf);
    }

    scene.add(root);
  }

  function startNeonLoop() {
    if (window.__neonLoopStarted) return;
    window.__neonLoopStarted = true;
    function tick() {
      requestAnimationFrame(tick);
      var t = performance.now() * 0.001;
      if (__neonLight) {
        __neonLight.intensity = 1.6 + 0.25 * Math.sin(t * 2.2) + 0.12 * Math.sin(t * 5.1);
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
      s.src = 'furniture.js?v=acoustic2';
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
