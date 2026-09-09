/*
 * Restored scene + back wall decor
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/154d0cc8d5d2474c6fc2ed1ca9ccadac0bbea659/scene.js';

  function createBackWallDecor() {
    if (typeof scene === 'undefined' || !scene || typeof THREE === 'undefined') return;
    if (window.__backWallDecor) return;
    window.__backWallDecor = true;

    var root = new THREE.Group();
    root.name = 'back-wall-decor';

    var doorX = -3.2, doorW = 1.6, zB = -2.7, T = 0.22;
    var deskX = 0.15;

    var bleed = new THREE.Mesh(
      new THREE.PlaneGeometry(doorW * 0.92, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xffe8c8, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false })
    );
    bleed.rotation.x = -Math.PI / 2;
    bleed.position.set(doorX, 0.02, zB + T / 2 + 0.12);
    root.add(bleed);

    var wash = new THREE.Mesh(
      new THREE.PlaneGeometry(doorW * 1.15, 0.55),
      new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
    );
    wash.rotation.x = -Math.PI / 2;
    wash.position.set(doorX, 0.015, zB + T / 2 + 0.4);
    root.add(wash);

    var doorLight = new THREE.PointLight(0xffeedd, 1.2, 3.0, 1.5);
    doorLight.position.set(doorX, 0.12, zB + T / 2 + 0.05);
    root.add(doorLight);

    var doorSpot = new THREE.SpotLight(0xffeedd, 0.9, 4.0, Math.PI / 4, 0.6, 1.2);
    doorSpot.position.set(doorX, 0.15, zB + 0.05);
    doorSpot.target.position.set(doorX, 0, zB + 1.2);
    root.add(doorSpot);
    root.add(doorSpot.target);

    var shelfW = 2.4, shelfD = 0.25, shelfT = 0.04;
    var shelfY = 3.55, shelfX = deskX + 0.35;
    var shelfZ = zB + T / 2 + shelfD / 2 + 0.02;
    var shelfMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4, metalness: 0.1 });
    var shelf = new THREE.Mesh(new THREE.BoxGeometry(shelfW, shelfT, shelfD), shelfMat);
    shelf.position.set(shelfX, shelfY, shelfZ);
    shelf.castShadow = true;
    root.add(shelf);

    var shelfLight = new THREE.PointLight(0xfff4e6, 1.2, 2.5, 1.4);
    shelfLight.position.set(shelfX, shelfY - 0.08, shelfZ - shelfD * 0.2);
    root.add(shelfLight);

    var ledStrip = new THREE.Mesh(
      new THREE.BoxGeometry(shelfW * 0.9, 0.008, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xfff4e6, emissive: 0xfff0d0, emissiveIntensity: 1.4, roughness: 0.4 })
    );
    ledStrip.position.set(shelfX, shelfY - shelfT / 2 - 0.005, shelfZ - shelfD * 0.35);
    root.add(ledStrip);

    var bookColors = [0x1e293b, 0x3f3f46, 0x44403c];
    for (var bi = 0; bi < 3; bi++) {
      var book = new THREE.Mesh(
        new THREE.BoxGeometry(0.22 - bi * 0.02, 0.03, 0.16),
        new THREE.MeshStandardMaterial({ color: bookColors[bi], roughness: 0.75, metalness: 0.05 })
      );
      book.position.set(shelfX - shelfW * 0.32, shelfY + shelfT / 2 + 0.015 + bi * 0.03, shelfZ - 0.02);
      book.rotation.y = (bi - 1) * 0.04;
      root.add(book);
    }

    var cube = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x8a8a90, roughness: 0.25, metalness: 0.85 })
    );
    cube.position.set(shelfX + shelfW * 0.34, shelfY + shelfT / 2 + 0.06, shelfZ - 0.02);
    cube.rotation.y = 0.2;
    root.add(cube);

    var logoY = 2.55, logoX = deskX, logoZ = zB + T / 2 + 0.04;
    var plate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.03, 48),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.25, metalness: 0.75 })
    );
    plate.rotation.x = Math.PI / 2;
    plate.position.set(logoX, logoY, logoZ);
    plate.userData = {
      interactive: true,
      name: 'logo',
      onClick: function () {
        if (window.showToast) window.showToast('TSCO // BOSS T');
        if (window.playUiSound) window.playUiSound('click');
        console.log('Logo clicked');
      }
    };
    root.add(plate);

    function addLogoPlane(tex) {
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      var logoPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.56, 0.52),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })
      );
      logoPlane.position.set(logoX, logoY, logoZ + 0.022);
      logoPlane.userData = plate.userData;
      root.add(logoPlane);
    }

    function makeCanvasLogo() {
      var c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      var g = c.getContext('2d');
      g.fillStyle = '#000'; g.fillRect(0, 0, 512, 512);
      g.fillStyle = '#0d0d0d';
      g.beginPath(); g.ellipse(256, 175, 155, 78, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(256, 210, 195, 55, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 10;
      g.beginPath(); g.ellipse(256, 168, 130, 28, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      g.fillStyle = '#fff';
      g.font = '900 78px Arial Black, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('T', 256, 145);
      g.fillStyle = '#c41e3a';
      g.font = '700 26px Arial, sans-serif';
      g.fillText('~', 256, 168);
      g.fillStyle = '#e8d5c4';
      g.beginPath(); g.ellipse(256, 340, 145, 125, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#b91c1c';
      g.fillRect(118, 285, 28, 40); g.fillRect(366, 285, 28, 40);
      g.fillStyle = '#0a0a0a'; g.fillRect(95, 300, 322, 52);
      g.fillStyle = '#fff';
      g.font = '900 40px Arial Black, sans-serif';
      g.fillText('TSCO', 256, 328);
      var tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      addLogoPlane(tex);
    }

    var loader = new THREE.TextureLoader();
    loader.load('assets/logo-tsco.png', function (tex) { addLogoPlane(tex); }, undefined, function () { makeCanvasLogo(); });

    var halo = new THREE.PointLight(0x38bdf8, 1.5, 1.8, 1.5);
    halo.position.set(logoX, logoY, logoZ - 0.08);
    root.add(halo);

    var rim = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.36, 48),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })
    );
    rim.position.set(logoX, logoY, logoZ + 0.01);
    root.add(rim);

    scene.add(root);
  }

  fetch(GOOD_SCENE_URL, { cache: 'no-cache' })
    .then(function (r) { return r.text(); })
    .then(function (code) {
      var s = document.createElement('script');
      s.textContent = code;
      document.body.appendChild(s);
      var tries = 0;
      function tryDecor() {
        tries++;
        if (typeof scene !== 'undefined' && scene && window.__dioramaBuilt) {
          createBackWallDecor();
          if (!window.__logoClickPatched && typeof renderer !== 'undefined' && renderer) {
            window.__logoClickPatched = true;
            var ray = new THREE.Raycaster();
            var mouse = new THREE.Vector2();
            var last = 0;
            renderer.domElement.addEventListener('pointerdown', function (event) {
              if (performance.now() - last < 280) return;
              try {
                var rect = renderer.domElement.getBoundingClientRect();
                mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
                ray.setFromCamera(mouse, camera);
                var hits = ray.intersectObjects(scene.children, true);
                for (var i = 0; i < hits.length; i++) {
                  var t = hits[i].object;
                  while (t && t !== scene) {
                    if (t.userData && t.userData.name === 'logo' && typeof t.userData.onClick === 'function') {
                      last = performance.now();
                      event.stopImmediatePropagation();
                      t.userData.onClick();
                      return;
                    }
                    t = t.parent;
                  }
                }
              } catch (e) {}
            }, true);
          }
          return;
        }
        if (tries < 80) setTimeout(tryDecor, 200);
      }
      setTimeout(tryDecor, 600);
    })
    .catch(function (err) { console.error(err); });
})();
