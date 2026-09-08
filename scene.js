/*
 * Loads last known-good scene, then rebuilds room as isometric cutaway:
 * - LEFT wall hidden (open side)
 * - RIGHT + BACK walls kept
 * - Thick platform floor with visible edges (dollhouse slab)
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/e85884eca00ae0cd9dc9f3d523d1d14a99f376e5/scene.js';

  function buildCutawayGeometry() {
    if (typeof scene === 'undefined' || !scene || typeof THREE === 'undefined') {
      setTimeout(buildCutawayGeometry, 150);
      return;
    }
    if (window.__cutawayBuilt) return;
    window.__cutawayBuilt = true;

    // 1) Hide original infinite-feeling floor plane + LEFT wall; keep right + back
    try {
      scene.traverse(function (obj) {
        if (!obj.isMesh) return;
        var p = obj.position;

        // Original floor: y≈0, rotation on X, large plane
        if (
          obj.geometry &&
          obj.geometry.type === 'PlaneGeometry' &&
          Math.abs(p.y) < 0.05 &&
          obj.rotation &&
          Math.abs(obj.rotation.x + Math.PI / 2) < 0.2
        ) {
          obj.visible = false;
          return;
        }

        // LEFT wall at x ≈ -7.5
        if (Math.abs(p.x + 7.5) < 0.3 && Math.abs(p.y - 4) < 1.5) {
          obj.visible = false;
          return;
        }

        // Keep right wall (x ≈ 7.5) and back wall (z ≈ -3) visible
      });
    } catch (e) {
      console.warn('wall traverse failed', e);
    }

    // 2) Dollhouse platform floor — thick slab with edge thickness like the reference
    var floorW = 12.5;
    var floorD = 11.5;
    var slabH = 0.28;

    var slabMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.88,
      metalness: 0.05
    });
    var edgeMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.06
    });

    var slab = new THREE.Mesh(
      new THREE.BoxGeometry(floorW, slabH, floorD),
      slabMat
    );
    slab.position.set(0.4, -slabH / 2, 2.2);
    slab.receiveShadow = true;
    slab.castShadow = true;
    slab.name = 'cutaway-slab';
    scene.add(slab);

    // Slightly inset top surface for a lip/edge read
    var topSurface = new THREE.Mesh(
      new THREE.BoxGeometry(floorW - 0.12, 0.03, floorD - 0.12),
      new THREE.MeshStandardMaterial({
        color: 0x323232,
        roughness: 0.92,
        metalness: 0.04
      })
    );
    topSurface.position.set(0.4, 0.01, 2.2);
    topSurface.receiveShadow = true;
    scene.add(topSurface);

    // Edge rim strips (front + left open edges get stronger read)
    function rim(w, h, d, x, y, z) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), edgeMat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
    }
    // Front edge
    rim(floorW, 0.08, 0.06, 0.4, 0.02, 2.2 + floorD / 2 - 0.03);
    // Left open edge
    rim(0.06, 0.08, floorD, 0.4 - floorW / 2 + 0.03, 0.02, 2.2);

    // 3) Give remaining walls a little thickness so they feel architectural
    var wallMat = new THREE.MeshStandardMaterial({
      color: 0x383838,
      roughness: 0.95,
      metalness: 0.0
    });

    // Back wall panel with thickness (sits on slab)
    var backThick = new THREE.Mesh(
      new THREE.BoxGeometry(11.2, 7.2, 0.22),
      wallMat
    );
    backThick.position.set(0.3, 3.55, -2.85);
    backThick.receiveShadow = true;
    backThick.castShadow = true;
    scene.add(backThick);

    // Right wall panel with thickness
    var rightThick = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 7.2, 10.5),
      wallMat
    );
    rightThick.position.set(6.4, 3.55, 1.8);
    rightThick.receiveShadow = true;
    rightThick.castShadow = true;
    scene.add(rightThick);

    // Soft outer void so the slab reads as a floating room object
    if (scene.background) {
      scene.background = new THREE.Color(0x121212);
    }
    if (scene.fog) {
      scene.fog.color = new THREE.Color(0x121212);
      scene.fog.near = 32;
      scene.fog.far = 70;
    }
  }

  function applyIsometricView() {
    if (typeof camera === 'undefined' || typeof controls === 'undefined' || !camera || !controls) {
      setTimeout(applyIsometricView, 150);
      return;
    }
    if (window.__isoViewApplied) return;
    window.__isoViewApplied = true;

    // View from the OPEN left side so right wall stays in frame (matches reference L-shape)
    camera.position.set(-10.5, 11.2, 10.2);
    camera.lookAt(0.5, 1.1, 1.2);
    controls.target.set(0.5, 1.1, 1.2);
    controls.minDistance = 12;
    controls.maxDistance = 28;
    controls.minPolarAngle = Math.PI / 5.5;
    controls.maxPolarAngle = Math.PI / 2.45;
    controls.minAzimuthAngle = -Math.PI / 1.8;
    controls.maxAzimuthAngle = Math.PI / 3.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.25;
    if (controls.update) controls.update();

    buildCutawayGeometry();
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
      s.src = 'furniture.js?v=iso4';
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
      applyIsometricView();
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
