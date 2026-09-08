/*
 * Minimal cutaway pass on the last good scene:
 * - Keep every original object position
 * - Hide LEFT wall only (right + back stay)
 * - Do NOT rebuild walls (no overlapping panels)
 * - Add thin edge rims only (floor + open cut) for dollhouse read
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/e85884eca00ae0cd9dc9f3d523d1d14a99f376e5/scene.js';

  function applyCutawayEdgesOnly() {
    if (typeof scene === 'undefined' || !scene || typeof THREE === 'undefined') {
      setTimeout(applyCutawayEdgesOnly, 150);
      return;
    }
    if (window.__cutawayEdgesApplied) return;
    window.__cutawayEdgesApplied = true;

    // 1) Hide LEFT wall only — leave every other original mesh alone
    try {
      scene.traverse(function (obj) {
        if (!obj.isMesh) return;
        var p = obj.position;
        // Original left wall is at x ≈ -7.5, y ≈ 4
        if (Math.abs(p.x + 7.5) < 0.35 && Math.abs(p.y - 4) < 2) {
          obj.visible = false;
        }
      });
    } catch (e) {
      console.warn('left wall hide failed', e);
    }

    // 2) Thin edge rims only (no full replacement walls/floors)
    //    These sit on the open left cut + floor perimeter so the room reads as a slab
    //    without moving any existing props.
    var edgeMat = new THREE.MeshStandardMaterial({
      color: 0x1c1c1c,
      roughness: 0.9,
      metalness: 0.05
    });

    function addEdge(w, h, d, x, y, z) {
      var mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), edgeMat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = 'cutaway-edge';
      scene.add(mesh);
    }

    // Floor front lip (thin)
    addEdge(14.5, 0.06, 0.08, 0, 0.03, 7.2);
    // Floor left open lip (thin) — the cut edge
    addEdge(0.08, 0.06, 14.5, -7.2, 0.03, 0.5);
    // Floor right lip
    addEdge(0.08, 0.06, 14.5, 7.2, 0.03, 0.5);
    // Floor back lip
    addEdge(14.5, 0.06, 0.08, 0, 0.03, -2.7);

    // Vertical edge where left wall was cut away (back-left corner post)
    addEdge(0.1, 7.5, 0.1, -7.2, 3.75, -2.7);
    // Vertical edge at front-left of open side
    addEdge(0.1, 7.5, 0.1, -7.2, 3.75, 7.2);

    // Soften fog slightly; do not change object layout
    if (scene.fog) {
      scene.fog.near = 22;
      scene.fog.far = 55;
    }
  }

  function applyIsometricView() {
    if (typeof camera === 'undefined' || typeof controls === 'undefined' || !camera || !controls) {
      setTimeout(applyIsometricView, 150);
      return;
    }
    if (window.__isoViewApplied) return;
    window.__isoViewApplied = true;

    // Elevated view from open-left side so RIGHT wall stays visible
    // Does not move any scene objects — camera only
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

    applyCutawayEdgesOnly();
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
      s.src = 'furniture.js?v=iso5';
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
