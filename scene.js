/*
 * Restored scene + polished back wall decor
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
    var doorW = 1.6;
    var zB = -2.7;
    var T = 0.22;
    var deskX = 0.15;

    // 1. Realistic door light bleed (lights only, no hard geometry)
    var doorZ = zB;
    var doorLight = new THREE.SpotLight(0xffeedd, 1.8, 4.0, Math.PI / 4, 0.8, 1.5);
    doorLight.position.set(doorX, 0.05, doorZ + 0.05);
    doorLight.target.position.set(doorX, 0, doorZ + 1.5);
    root.add(doorLight);
    root.add(doorLight.target);

    var doorFill = new THREE.PointLight(0xffeedd, 0.55, 2.5, 1.6);
    doorFill.position.set(doorX, 0.08, doorZ + 0.15);
    root.add(doorFill);

    // 2. Desk accent backing panel
    var panelW = 3.2;
    var panelH = 3.0;
    var panelD = 0.02;
    var panelX = deskX;
    var panelY = panelH / 2 + 0.12;
    var panelZ = zB + T / 2 + 0.015;

    var panelMat = new THREE.MeshStandardMaterial({
      color: 0x1e1e24,
      roughness: 0.85,
      metalness: 0.1
    });
    var panel = new THREE.Mesh(new THREE.BoxGeometry(panelW, panelH, panelD), panelMat);
    panel.position.set(panelX, panelY, panelZ);
    panel.receiveShadow = true;
    root.add(panel);

    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a30,
      roughness: 0.3,
      metalness: 0.8
    });
    var border = 0.02;
    var topF = new THREE.Mesh(new THREE.BoxGeometry(panelW + border * 2, border, panelD + 0.005), frameMat);
    topF.position.set(panelX, panelY + panelH / 2 + border / 2, panelZ);
    root.add(topF);
    var botF = new THREE.Mesh(new THREE.BoxGeometry(panelW + border * 2, border, panelD + 0.005), frameMat);
    botF.position.set(panelX, panelY - panelH / 2 - border / 2, panelZ);
    root.add(botF);
    var leftF = new THREE.Mesh(new THREE.BoxGeometry(border, panelH, panelD + 0.005), frameMat);
    leftF.position.set(panelX - panelW / 2 - border / 2, panelY, panelZ);
    root.add(leftF);
    var rightF = new THREE.Mesh(new THREE.BoxGeometry(border, panelH, panelD + 0.005), frameMat);
    rightF.position.set(panelX + panelW / 2 + border / 2, panelY, panelZ);
    root.add(rightF);

    // 3. Clean circular logo emblem
    var logoY = 2.7;
    var logoX = deskX;
    var logoZ = panelZ + panelD / 2 + 0.02;

    var badgeMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.8,
      roughness: 0.2
    });
    var badge = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.02, 32), badgeMat);
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
        new THREE.CircleGeometry(0.30, 48),
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

    var halo = new THREE.PointLight(0x38bdf8, 0.8, 1.5, 1.8);
    halo.position.set(logoX, logoY, panelZ - 0.05);
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
