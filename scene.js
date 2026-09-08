/*
 * CRITICAL RESTORE
 * Loads last known-good scene from commit e85884e, then applies
 * hybrid camera + furniture.
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
    if (controls.update) controls.update();
  }

  function loadFurniture() {
    if (typeof scene === 'undefined' || !scene) {
      setTimeout(loadFurniture, 200);
      return;
    }
    if (window.__furnitureAdded) return;

    function runCreates() {
      if (window.__furnitureAdded) return;
      if (typeof createFloorMat !== 'function') {
        setTimeout(runCreates, 100);
        return;
      }
      window.__furnitureAdded = true;
      try {
        createFloorMat();
        createOfficeChair();
        createLobbyChair();
      } catch (e) {
        console.warn('Furniture create failed', e);
      }
    }

    var existing = document.querySelector('script[data-furniture]');
    if (!existing) {
      var s = document.createElement('script');
      s.src = 'furniture.js?v=2';
      s.setAttribute('data-furniture', '1');
      s.onload = runCreates;
      document.body.appendChild(s);
    } else {
      runCreates();
    }
  }

  function afterSceneCodeInjected() {
    // Historical scene registers init on window load — if load already fired, call init now
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
      applyHybridCamera();
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
          '<div style="color:#fff;padding:2rem;font-family:monospace;text-align:center">Scene restore failed. Please hard-refresh.<br/>' +
          String(err) +
          '</div>';
      }
    });
})();
