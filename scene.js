/*
 * Back wall: floating shelf + logo + door light (no accent panel)
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

    var doorX = -3.2;
    var zB = -2.7;
    var T = 0.22;
    var deskX = 0.15;

    // ---------- Door crack light (soft fan onto floor) ----------
    var doorLight = new THREE.SpotLight(0xffeedd, 1.6, 4.0, Math.PI / 3.5, 0.85, 1.4);
    doorLight.position.set(doorX, 0.04, zB + 0.06);
    doorLight.target.position.set(doorX, 0, zB + 1.5);
    root.add(doorLight);
    root.add(doorLight.target);

    var doorFill = new THREE.PointLight(0xffeedd, 0.45, 2.2, 1.6);
    doorFill.position.set(doorX, 0.06, zB + 0.2);
    root.add(doorFill);

    // Soft emissive strip at door threshold (subtle, no hard mat)
    var crack = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.04),
      new THREE.MeshBasicMaterial({
        color: 0xffeedd,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    crack.rotation.x = -Math.PI / 2;
    crack.position.set(doorX, 0.012, zB + T / 2 + 0.08);
    root.add(crack);

    // ---------- Floating shelf (centered above desk, lowered) ----------
    var shelfW = 2.4;
    var shelfD = 0.28;
    var shelfT = 0.05;
    var shelfY = 2.95;
    var shelfX = deskX;
    var shelfZ = zB + T / 2 + shelfD / 2 + 0.02;

    var shelfMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.4,
      metalness: 0.1
    });
    var shelf = new THREE.Mesh(new THREE.BoxGeometry(shelfW, shelfT, shelfD), shelfMat);
    shelf.position.set(shelfX, shelfY, shelfZ);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    root.add(shelf);

    // Under-shelf warm LED
    var shelfLight = new THREE.PointLight(0xffeedd, 1.2, 2.2, 1.4);
    shelfLight.position.set(shelfX, shelfY - 0.1, shelfZ - shelfD * 0.15);
    root.add(shelfLight);

    var ledStrip = new THREE.Mesh(
      new THREE.BoxGeometry(shelfW * 0.88, 0.006, 0.018),
      new THREE.MeshStandardMaterial({
        color: 0xffeedd,
        emissive: 0xffe4c4,
        emissiveIntensity: 1.2,
        roughness: 0.5
      })
    );
    ledStrip.position.set(shelfX, shelfY - shelfT / 2 - 0.004, shelfZ - shelfD * 0.32);
    root.add(ledStrip);

    // Shelf decor: 2 books left, dark cylinder right
    var book1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.035, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75, metalness: 0.05 })
    );
    book1.position.set(shelfX - shelfW * 0.28, shelfY + shelfT / 2 + 0.018, shelfZ - 0.02);
    root.add(book1);

    var book2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.03, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.75, metalness: 0.05 })
    );
    book2.position.set(shelfX - shelfW * 0.28, shelfY + shelfT / 2 + 0.05, shelfZ - 0.02);
    book2.rotation.y = 0.06;
    root.add(book2);

    var cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.12, 20),
      new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.35, metalness: 0.4 })
    );
    cyl.position.set(shelfX + shelfW * 0.3, shelfY + shelfT / 2 + 0.06, shelfZ - 0.02);
    root.add(cyl);

    // ---------- Logo badge (midway between monitor top and shelf) ----------
    var logoY = 2.5;
    var logoX = deskX;
    var logoZ = zB + T / 2 + 0.03;

    var badge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.02, 32),
      new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.2 })
    );
    badge.rotation.x = Math.PI / 2;
    badge.position.set(logoX, logoY, logoZ);
    badge.userData = {
      interactive: true,
      name: 'logo',
      onClick: function () {
        if (window.showToast) window.showToast('TSCO // BOSS T');
        if (window.playUiSound) window.playUiSound('click');
        console.log('Logo clicked');
      }
    };
    root.add(badge);

    function addLogoFace(tex) {
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      var face = new THREE.Mesh(
        new THREE.CircleGeometry(0.22, 48),
        new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          alphaTest: 0.1,
          side: THREE.DoubleSide,
          depthWrite: false,
          toneMapped: false
        })
      );
      face.position.set(logoX, logoY, logoZ + 0.012);
      face.userData = badge.userData;
      root.add(face);
    }

    function makeCanvasLogo() {
      var c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      var g = c.getContext('2d');
      g.clearRect(0, 0, 512, 512);
      g.save();
      g.beginPath();
      g.arc(256, 256, 248, 0, Math.PI * 2);
      g.clip();
      g.fillStyle = '#0a0a0a';
      g.fillRect(0, 0, 512, 512);
      g.fillStyle = '#111';
      g.beginPath();
      g.ellipse(256, 175, 150, 72, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.ellipse(256, 208, 190, 50, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#fff';
      g.lineWidth = 9;
      g.beginPath();
      g.ellipse(256, 165, 125, 26, 0, Math.PI * 1.05, Math.PI * 1.95);
      g.stroke();
      g.fillStyle = '#fff';
      g.font = '900 72px Arial Black, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('T', 256, 142);
      g.fillStyle = '#c41e3a';
      g.font = '700 24px Arial, sans-serif';
      g.fillText('~', 256, 165);
      g.fillStyle = '#e8d5c4';
      g.beginPath();
      g.ellipse(256, 330, 138, 118, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#b91c1c';
      g.fillRect(120, 278, 26, 36);
      g.fillRect(366, 278, 26, 36);
      g.fillStyle = '#0a0a0a';
      g.fillRect(100, 295, 312, 48);
      g.fillStyle = '#fff';
      g.font = '900 38px Arial Black, sans-serif';
      g.fillText('TSCO', 256, 321);
      g.restore();
      var tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      addLogoFace(tex);
    }

    var loader = new THREE.TextureLoader();
    loader.load(
      'assets/logo-tsco.png',
      function (tex) { addLogoFace(tex); },
      undefined,
      function () { makeCanvasLogo(); }
    );

    // Soft warm halo behind badge (wide, low intensity)
    var halo = new THREE.PointLight(0xffeedd, 0.6, 2.5, 1.8);
    halo.position.set(logoX, logoY, zB + 0.05);
    root.add(halo);

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
