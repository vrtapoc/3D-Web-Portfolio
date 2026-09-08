/*
 * Replace original right wall (do not stack a second wall).
 * New right wall matches back wall size: 15 wide x 8 tall.
 * Window cut into that wall with thickness/returns.
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/e85884eca00ae0cd9dc9f3d523d1d14a99f376e5/scene.js';

  function removeOriginalSideWalls() {
    if (typeof scene === 'undefined' || !scene) return;

    var toRemove = [];
    scene.traverse(function (obj) {
      if (!obj.isMesh) return;
      var p = obj.position;

      // Left wall (open side)
      if (Math.abs(p.x + 7.5) < 0.5) {
        toRemove.push(obj);
        return;
      }

      // Original right wall plane at x ≈ 7.5 (any y)
      if (Math.abs(p.x - 7.5) < 0.5) {
        toRemove.push(obj);
        return;
      }

      // Leftover from older experiments
      if (
        obj.name === 'cutaway-edge' ||
        obj.name === 'cutaway-slab' ||
        obj.name === 'right-wall-window'
      ) {
        toRemove.push(obj);
      }
    });

    // Also remove previous custom right-wall group if present
    var old = scene.getObjectByName('right-wall-window');
    if (old) toRemove.push(old);

    toRemove.forEach(function (obj) {
      try {
        obj.visible = false;
        if (obj.parent) obj.parent.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(function (m) { m.dispose && m.dispose(); });
          else if (obj.material.dispose) obj.material.dispose();
        }
      } catch (e) {}
    });
  }

  function buildRightWallMatchingBack() {
    if (typeof THREE === 'undefined' || typeof scene === 'undefined' || !scene) return;
    if (window.__rightWallBuilt) return;
    window.__rightWallBuilt = true;

    // Match original back wall: PlaneGeometry(15, 8)
    // Original right wall was at (7.5, 4, 4.5) — same 15x8 footprint along Z
    var WALL_LEN = 15; // along Z (same as back wall width)
    var WALL_H = 8;
    var WALL_X = 7.5;
    var WALL_Y = 4; // center height
    var WALL_Z = 4.5; // center depth (same as original right wall)
    var THICK = 0.3;

    var group = new THREE.Group();
    group.name = 'right-wall-window';

    var wallMat = new THREE.MeshStandardMaterial({
      color: 0x383838,
      roughness: 0.95,
      metalness: 0.0
    });
    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x2a2218,
      roughness: 0.5,
      metalness: 0.2
    });
    var sillMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.7,
      metalness: 0.05
    });

    // Window opening (centered on upper half of wall)
    var winW = 4.2; // along Z
    var winH = 4.0;
    var winBottom = 1.6; // from floor
    var winCenterY = winBottom + winH / 2;
    var winCenterZ = WALL_Z; // centered on wall

    var z0 = WALL_Z - WALL_LEN / 2; // -3
    var z1 = WALL_Z + WALL_LEN / 2; // 12

    function addPanel(lenZ, height, yCenter, zCenter) {
      var mesh = new THREE.Mesh(
        new THREE.BoxGeometry(THICK, height, lenZ),
        wallMat
      );
      mesh.position.set(WALL_X, yCenter, zCenter);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    // Back segment (z0 → window start)
    var winZ0 = winCenterZ - winW / 2;
    var winZ1 = winCenterZ + winW / 2;
    var backLen = winZ0 - z0;
    if (backLen > 0.05) addPanel(backLen, WALL_H, WALL_Y, z0 + backLen / 2);

    // Front segment (window end → z1)
    var frontLen = z1 - winZ1;
    if (frontLen > 0.05) addPanel(frontLen, WALL_H, WALL_Y, winZ1 + frontLen / 2);

    // Below window
    addPanel(winW, winBottom, winBottom / 2, winCenterZ);

    // Above window
    var aboveH = WALL_H - (winBottom + winH);
    if (aboveH > 0.05) {
      addPanel(winW, aboveH, winBottom + winH + aboveH / 2, winCenterZ);
    }

    // Window opening returns (visible thickness at cut edges)
    var ret = 0.25;
    function sideReturn(z) {
      var m = new THREE.Mesh(
        new THREE.BoxGeometry(ret, winH, 0.1),
        wallMat
      );
      m.position.set(WALL_X - THICK / 2 - ret / 2, winCenterY, z);
      m.castShadow = true;
      group.add(m);
    }
    sideReturn(winZ0);
    sideReturn(winZ1);

    var topRet = new THREE.Mesh(
      new THREE.BoxGeometry(ret, 0.1, winW),
      wallMat
    );
    topRet.position.set(WALL_X - THICK / 2 - ret / 2, winBottom + winH, winCenterZ);
    group.add(topRet);

    // Sill
    var sill = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.1, winW + 0.2),
      sillMat
    );
    sill.position.set(WALL_X - THICK / 2 - 0.2, winBottom, winCenterZ);
    sill.castShadow = true;
    sill.receiveShadow = true;
    group.add(sill);

    // Frame
    var frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, winH + 0.12, winW + 0.12),
      frameMat
    );
    frame.position.set(WALL_X - THICK / 2 - 0.02, winCenterY, winCenterZ);
    group.add(frame);

    // Pane dividers 2x2
    var divV = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, winH - 0.15, 0.08),
      frameMat
    );
    divV.position.set(WALL_X - THICK / 2 - 0.02, winCenterY, winCenterZ);
    group.add(divV);

    var divH = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.08, winW - 0.15),
      frameMat
    );
    divH.position.set(WALL_X - THICK / 2 - 0.02, winCenterY, winCenterZ);
    group.add(divH);

    // Glass
    var glass = new THREE.Mesh(
      new THREE.PlaneGeometry(winW - 0.25, winH - 0.25),
      new THREE.MeshStandardMaterial({
        color: 0x9ec5e0,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        metalness: 0.15,
        side: THREE.DoubleSide
      })
    );
    glass.position.set(WALL_X - THICK / 2 - 0.06, winCenterY, winCenterZ);
    glass.rotation.y = Math.PI / 2;
    group.add(glass);

    // Outdoor view
    var c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    var ctx = c.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#a8c8e0');
    g.addColorStop(0.5, '#d8e6f0');
    g.addColorStop(1, '#b8d0a8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    for (var i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(
        30 + Math.random() * 450,
        60 + Math.random() * 300,
        25 + Math.random() * 55,
        0,
        Math.PI * 2
      );
      ctx.fillStyle =
        Math.random() > 0.35 ? 'rgba(140,80,170,0.5)' : 'rgba(70,130,70,0.45)';
      ctx.fill();
    }
    var view = new THREE.Mesh(
      new THREE.PlaneGeometry(winW - 0.2, winH - 0.2),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) })
    );
    view.position.set(WALL_X + 0.2, winCenterY, winCenterZ);
    view.rotation.y = -Math.PI / 2;
    group.add(view);

    // Curtains
    var curtainMat = new THREE.MeshStandardMaterial({
      color: 0xf0ebe3,
      roughness: 0.88,
      side: THREE.DoubleSide
    });
    var curtain = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, winH - 0.2, 1.0),
      curtainMat
    );
    curtain.position.set(
      WALL_X - THICK / 2 - 0.2,
      winCenterY,
      winZ0 + 0.55
    );
    curtain.castShadow = true;
    group.add(curtain);

    for (var f = 0; f < 4; f++) {
      var fold = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, winH - 0.3, 0.14),
        new THREE.MeshStandardMaterial({ color: 0xe5e0d8, roughness: 0.9 })
      );
      fold.position.set(
        WALL_X - THICK / 2 - 0.24,
        winCenterY,
        winZ0 + 0.3 + f * 0.2
      );
      group.add(fold);
    }

    scene.add(group);
  }

  function applyView() {
    if (typeof camera === 'undefined' || typeof controls === 'undefined' || !camera || !controls) {
      setTimeout(applyView, 150);
      return;
    }
    if (window.__isoViewApplied) return;
    window.__isoViewApplied = true;

    camera.position.set(-9.5, 10.5, 9.8);
    camera.lookAt(0, 1.4, 0.5);
    controls.target.set(0, 1.4, 0.5);
    controls.minDistance = 10;
    controls.maxDistance = 26;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI / 2.4;
    controls.minAzimuthAngle = -Math.PI / 1.7;
    controls.maxAzimuthAngle = Math.PI / 3.2;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.25;
    if (controls.update) controls.update();

    // Run removal after a short delay so original walls exist, then build replacement
    setTimeout(function () {
      window.__rightWallBuilt = false;
      removeOriginalSideWalls();
      buildRightWallMatchingBack();
    }, 200);
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
        console.warn('Furniture create failed', e);
      }
    }

    if (!document.querySelector('script[data-furniture]')) {
      var s = document.createElement('script');
      s.src = 'furniture.js?v=win2';
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
        } catch (e) {
          console.warn('init error', e);
        }
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
      if (!r.ok) throw new Error('Failed to fetch good scene: ' + r.status);
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
      var el = document.getElementById('loadingScreen');
      if (el) {
        el.style.opacity = '1';
        el.innerHTML =
          '<div style="color:#fff;padding:2rem;font-family:monospace;text-align:center">Scene load failed. Hard-refresh.<br/>' +
          String(err) +
          '</div>';
      }
    });
})();
