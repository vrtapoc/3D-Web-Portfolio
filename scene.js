/*
 * Loads last known-good scene, then forces isometric cutaway framing
 * + side lounge furniture (no desk rug).
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/e85884eca00ae0cd9dc9f3d523d1d14a99f376e5/scene.js';

  function applyIsometricView() {
    if (typeof camera === 'undefined' || typeof controls === 'undefined' || !camera || !controls) {
      setTimeout(applyIsometricView, 150);
      return;
    }
    if (window.__isoViewApplied) return;
    window.__isoViewApplied = true;

    // Elevated corner angle — reads closer to dollhouse / isometric cutaway
    camera.position.set(9.5, 10.5, 9.5);
    camera.lookAt(0, 1.0, 0.4);
    controls.target.set(0, 1.0, 0.4);
    controls.minDistance = 11;
    controls.maxDistance = 26;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI / 2.5;
    controls.minAzimuthAngle = -Math.PI / 2.2;
    controls.maxAzimuthAngle = Math.PI / 2.2;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.28;
    if (controls.update) controls.update();

    // Soften fog so the open room reads cleaner from above
    if (typeof scene !== 'undefined' && scene && scene.fog) {
      scene.fog.near = 28;
      scene.fog.far = 60;
    }

    // Hide the wall closest to camera side for a cutaway feel (right wall at +x)
    try {
      scene.traverse(function (obj) {
        if (!obj.isMesh) return;
        var p = obj.position;
        // Right wall was placed around x = 7.5
        if (Math.abs(p.x - 7.5) < 0.2 && Math.abs(p.y - 4) < 0.5) {
          obj.visible = false;
        }
      });
    } catch (e) {}
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
        // No desk mat
        if (typeof createOfficeChair === 'function') createOfficeChair();
        createLobbyChair();
      } catch (e) {
        console.warn('Furniture create failed', e);
      }
    }

    if (!document.querySelector('script[data-furniture]')) {
      var s = document.createElement('script');
      s.src = 'furniture.js?v=iso3';
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
        try { init(); } catch (e) { console.warn('init error', e); }
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
