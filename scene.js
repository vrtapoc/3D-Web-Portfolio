/*
 * Clean cutaway + right-wall window:
 * - Hide original left wall
 * - Hide original right wall (too long / no thickness)
 * - Build shorter right wall with thickness + window opening
 * - Window: multi-pane, curtains, outdoor view (reference style)
 * - Original object positions unchanged
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/e85884eca00ae0cd9dc9f3d523d1d14a99f376e5/scene.js';

  function hideOriginalSideWalls() {
    if (typeof scene === 'undefined' || !scene) return;
    try {
      scene.traverse(function (obj) {
        if (!obj.isMesh) return;
        var p = obj.position;
        // Left wall x ≈ -7.5
        if (Math.abs(p.x + 7.5) < 0.35 && Math.abs(p.y - 4) < 2) {
          obj.visible = false;
        }
        // Right wall x ≈ 7.5 — replace with custom cutaway wall
        if (Math.abs(p.x - 7.5) < 0.35 && Math.abs(p.y - 4) < 2) {
          obj.visible = false;
        }
        if (obj.name === 'cutaway-edge' || obj.name === 'cutaway-slab') {
          obj.visible = false;
        }
      });
    } catch (e) {}
  }

  function buildRightWallWithWindow() {
    if (typeof THREE === 'undefined' || typeof scene === 'undefined' || !scene) return;
    if (window.__rightWallBuilt) return;
    window.__rightWallBuilt = true;

    var wallGroup = new THREE.Group();
    wallGroup.name = 'right-wall-window';

    var wallColor = 0x3a3a3a;
    var wallMat = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.95,
      metalness: 0.0
    });
    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x2a2218,
      roughness: 0.55,
      metalness: 0.15
    });
    var sillMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.7,
      metalness: 0.05
    });

    // --- Wall dimensions (shorter than original infinite plane) ---
    // Room sits near z≈0 desk; wall runs along z with thickness on X
    var wallX = 5.6; // closer in so it doesn't dominate
    var wallH = 6.8;
    var wallThick = 0.28;
    var wallLen = 9.5; // shorter run — cuts excess
    var wallZ0 = -2.4; // back edge near back wall
    var wallCenterZ = wallZ0 + wallLen / 2;

    // Window opening size / position on wall
    var winW = 3.4;
    var winH = 3.6;
    var winBottom = 1.35;
    var winCenterZ = wallCenterZ + 0.6; // slightly toward front of right wall

    // Helper: wall panel segment (box)
    function panel(lenZ, height, y, zCenter) {
      var m = new THREE.Mesh(
        new THREE.BoxGeometry(wallThick, height, lenZ),
        wallMat
      );
      m.position.set(wallX, y, zCenter);
      m.castShadow = true;
      m.receiveShadow = true;
      wallGroup.add(m);
    }

    // Split right wall around window opening (like reference cutout)
    // Back segment (behind window)
    var backSegLen = Math.max(0.4, winCenterZ - winW / 2 - wallZ0);
    panel(backSegLen, wallH, wallH / 2, wallZ0 + backSegLen / 2);

    // Front segment (in front of window)
    var frontStart = winCenterZ + winW / 2;
    var frontSegLen = Math.max(0.4, wallZ0 + wallLen - frontStart);
    panel(frontSegLen, wallH, wallH / 2, frontStart + frontSegLen / 2);

    // Above window
    var aboveH = wallH - (winBottom + winH);
    if (aboveH > 0.15) {
      panel(winW, aboveH, winBottom + winH + aboveH / 2, winCenterZ);
    }

    // Below window (sill wall)
    panel(winW, winBottom, winBottom / 2, winCenterZ);

    // Thickness returns at open edges of window (the "edges" in the reference)
    var returnDepth = 0.22;
    function windowReturn(z, isFront) {
      var r = new THREE.Mesh(
        new THREE.BoxGeometry(returnDepth, winH, 0.08),
        wallMat
      );
      r.position.set(wallX - wallThick / 2 - returnDepth / 2, winBottom + winH / 2, z);
      r.castShadow = true;
      wallGroup.add(r);
    }
    windowReturn(winCenterZ - winW / 2, false);
    windowReturn(winCenterZ + winW / 2, true);

    // Top return inside window opening
    var topReturn = new THREE.Mesh(
      new THREE.BoxGeometry(returnDepth, 0.08, winW),
      wallMat
    );
    topReturn.position.set(
      wallX - wallThick / 2 - returnDepth / 2,
      winBottom + winH,
      winCenterZ
    );
    wallGroup.add(topReturn);

    // Window sill
    var sill = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.08, winW + 0.15),
      sillMat
    );
    sill.position.set(wallX - wallThick / 2 - 0.15, winBottom, winCenterZ);
    sill.castShadow = true;
    sill.receiveShadow = true;
    wallGroup.add(sill);

    // --- Window frame + panes ---
    var frameT = 0.07;
    var frameOuter = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, winH + 0.08, winW + 0.08),
      frameMat
    );
    frameOuter.position.set(wallX - wallThick / 2 - 0.02, winBottom + winH / 2, winCenterZ);
    wallGroup.add(frameOuter);

    // 2x2 pane dividers
    var divV = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, winH - 0.1, frameT),
      frameMat
    );
    divV.position.set(wallX - wallThick / 2 - 0.02, winBottom + winH / 2, winCenterZ);
    wallGroup.add(divV);

    var divH = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, frameT, winW - 0.1),
      frameMat
    );
    divH.position.set(wallX - wallThick / 2 - 0.02, winBottom + winH / 2, winCenterZ);
    wallGroup.add(divH);

    // Glass panes (slight blue tint)
    var glassMat = new THREE.MeshStandardMaterial({
      color: 0x87b8d8,
      transparent: true,
      opacity: 0.28,
      roughness: 0.1,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    var glass = new THREE.Mesh(
      new THREE.PlaneGeometry(winW - 0.2, winH - 0.2),
      glassMat
    );
    glass.position.set(wallX - wallThick / 2 - 0.05, winBottom + winH / 2, winCenterZ);
    glass.rotation.y = Math.PI / 2;
    wallGroup.add(glass);

    // Outdoor view plane (trees / sky) behind glass
    var viewCanvas = document.createElement('canvas');
    viewCanvas.width = 512;
    viewCanvas.height = 512;
    var ctx = viewCanvas.getContext('2d');
    // sky gradient
    var grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#b8d4e8');
    grad.addColorStop(0.45, '#dfe9f2');
    grad.addColorStop(1, '#c5d8c0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    // soft purple foliage blobs (wisteria-like)
    function blob(x, y, r, color) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    for (var i = 0; i < 18; i++) {
      blob(
        40 + Math.random() * 430,
        80 + Math.random() * 280,
        30 + Math.random() * 50,
        Math.random() > 0.4 ? 'rgba(150, 90, 180, 0.55)' : 'rgba(90, 140, 90, 0.5)'
      );
    }
    var viewTex = new THREE.CanvasTexture(viewCanvas);
    var viewPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(winW - 0.15, winH - 0.15),
      new THREE.MeshBasicMaterial({ map: viewTex })
    );
    viewPlane.position.set(wallX + 0.15, winBottom + winH / 2, winCenterZ);
    viewPlane.rotation.y = -Math.PI / 2;
    wallGroup.add(viewPlane);

    // Curtains (left side of window, reference style)
    var curtainMat = new THREE.MeshStandardMaterial({
      color: 0xf2f0ea,
      roughness: 0.85,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    var curtainW = 0.85;
    var curtain = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, winH - 0.15, curtainW),
      curtainMat
    );
    curtain.position.set(
      wallX - wallThick / 2 - 0.18,
      winBottom + winH / 2,
      winCenterZ - winW / 2 + curtainW / 2 + 0.1
    );
    curtain.castShadow = true;
    wallGroup.add(curtain);

    // Soft folds as thin vertical strips
    for (var f = 0; f < 4; f++) {
      var fold = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, winH - 0.25, 0.12),
        new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.9 })
      );
      fold.position.set(
        wallX - wallThick / 2 - 0.22,
        winBottom + winH / 2,
        winCenterZ - winW / 2 + 0.25 + f * 0.18
      );
      wallGroup.add(fold);
    }

    // Front cut edge of right wall (visible thickness end)
    var frontCap = new THREE.Mesh(
      new THREE.BoxGeometry(wallThick + 0.04, wallH, 0.1),
      wallMat
    );
    frontCap.position.set(wallX, wallH / 2, wallZ0 + wallLen);
    frontCap.castShadow = true;
    wallGroup.add(frontCap);

    scene.add(wallGroup);
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

    hideOriginalSideWalls();
    buildRightWallWithWindow();
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
      s.src = 'furniture.js?v=win1';
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
