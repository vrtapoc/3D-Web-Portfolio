/*
 * CRITICAL RESTORE
 * Loads the last known-good scene from commit e85884e, then applies
 * hybrid camera + furniture. This keeps the full 3D scene working
 * while avoiding a truncated upload of the large scene file.
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/e85884eca00ae0cd9dc9f3d523d1d14a99f376e5/scene.js';

  function applyHybridCamera() {
    if (typeof camera === 'undefined' || typeof controls === 'undefined' || !camera || !controls) {
      setTimeout(applyHybridCamera, 150);
      return;
    }
    if (window.__hybridCamApplied) return;
    window.__hybridCamApplied = true;

    camera.position.set(0, 6.4, 13.2);
    camera.lookAt(0, 1.2, 0.3);
    controls.target.set(0, 1.2, 0.3);
    controls.minDistance = 9;
    controls.maxDistance = 22;
    controls.minPolarAngle = Math.PI / 5;
    controls.maxPolarAngle = Math.PI / 2.35;
    controls.minAzimuthAngle = -Math.PI / 3.2;
    controls.maxAzimuthAngle = Math.PI / 3.2;
    controls.autoRotateSpeed = 0.35;
    controls.update();
  }

  function loadFurniture() {
    if (typeof scene === 'undefined' || !scene) {
      setTimeout(loadFurniture, 200);
      return;
    }
    if (window.__furnitureAdded) return;
    // furniture.js defines createFloorMat / createOfficeChair / createLobbyChair
    if (typeof createFloorMat === 'function') {
      window.__furnitureAdded = true;
      try {
        createFloorMat();
        createOfficeChair();
        createLobbyChair();
      } catch (e) {
        console.warn('Furniture create failed', e);
      }
    } else {
      // Load furniture.js if not already present
      var s = document.createElement('script');
      s.src = 'furniture.js?v=1';
      s.onload = function () {
        setTimeout(loadFurniture, 50);
      };
      document.body.appendChild(s);
    }
  }

  fetch(GOOD_SCENE_URL, { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('Failed to fetch good scene: ' + r.status);
      return r.text();
    })
    .then(function (code) {
      // Prevent double window.load init conflicts by running immediately
      var script = document.createElement('script');
      script.textContent = code;
      document.body.appendChild(script);

      // Apply upgrades after scene init starts
      setTimeout(applyHybridCamera, 900);
      setTimeout(loadFurniture, 1200);
    })
    .catch(function (err) {
      console.error(err);
      var el = document.getElementById('loadingScreen');
      if (el) {
        el.innerHTML =
          '<div style="color:#fff;padding:2rem;font-family:monospace">Scene restore failed. Hard refresh or contact support.</div>';
      }
    });
})();
