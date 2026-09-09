/*
 * Framed art logo + furniture rebalance
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/154d0cc8d5d2474c6fc2ed1ca9ccadac0bbea659/scene.js';

  // Desk shifted left ~0.35 from previous 0.15
  var DESK_X = -0.2;
  var DESK_Z = -1.8;
  var DOOR_X = -3.2;
  var ZB = -2.7;
  var T = 0.22;

  function placeFurniture() {
    if (typeof scene === 'undefined' || !scene) return;

    // Desk group + children
    if (typeof desk !== 'undefined' && desk) {
      desk.position.set(DESK_X, 0, DESK_Z);
      if (typeof monitor !== 'undefined' && monitor && monitor.parent === desk) {
        monitor.position.set(0, 0, 0);
        monitor.visible = true;
      }
      if (typeof decorations !== 'undefined' && decorations && decorations.parent === desk) {
        decorations.position.set(0, 0, 0);
        decorations.visible = true;
      }
    }

    // Floor / desk lamp between door and desk
    var lampX = (DOOR_X + DESK_X) / 2; // ~ -1.7
    scene.traverse(function (obj) {
      if (!obj.isGroup) return;
      if (obj.userData && obj.userData.name === 'lamp') {
        obj.position.set(lampX, 0, DESK_Z + 0.35);
        obj.rotation.y = 0.35;
      }
    });
    // Heuristic for lamp group by approximate prior position
    scene.traverse(function (obj) {
      if (!obj.isGroup || !obj.position) return;
      if (
        Math.abs(obj.position.x - 1.55) < 0.3 ||
        Math.abs(obj.position.x - (DESK_X + 1.55)) < 0.3
      ) {
        if (obj.children && obj.children.length > 3) {
          var hasLampish = false;
          obj.traverse(function (c) {
            if (c.isLight) hasLampish = true;
          });
          if (hasLampish || (obj.userData && obj.userData.name === 'lamp')) {
            obj.position.set(lampX, 0, DESK_Z + 0.35);
            obj.rotation.y = 0.35;
          }
        }
      }
    });

    // Jukebox stays back-right, clear of desk
    if (typeof jukebox !== 'undefined' && jukebox) {
      jukebox.position.set(2.6, 0, -2.05);
      jukebox.rotation.y = Math.PI;
    } else {
      scene.traverse(function (obj) {
        if (!obj.isGroup) return;
        if (Math.abs(obj.position.x - 2.15) < 0.6 && Math.abs(obj.position.z + 1.75) < 0.7) {
          obj.position.set(2.6, 0, -2.05);
          obj.rotation.y = Math.PI;
        }
      });
    }

    // Office chair in front of desk
    scene.traverse(function (obj) {
      if (obj.name === 'office-chair') {
        obj.position.set(DESK_X + 0.05, 0, DESK_Z + 1.4);
        obj.rotation.y = Math.PI + 0.08;
      }
    });

    // Balloon stays front-right
    scene.traverse(function (obj) {
      if (!obj.isGroup) return;
      var isBalloon = obj.userData && obj.userData.name === 'balloon';
      if (!isBalloon) {
        var hasSphere = false;
        obj.traverse(function (c) {
          if (c.isMesh && c.geometry && c.geometry.type === 'SphereGeometry') hasSphere = true;
        });
        if (hasSphere && Math.abs(obj.position.x - 3.9) < 0.8) isBalloon = true;
      }
      if (isBalloon) obj.position.set(3.9, -0.28, 3.55);
    });
  }

  function createFramedArtLogo() {
    if (typeof scene === 'undefined' || !scene || typeof THREE === 'undefined') return;
    if (window.__framedArtBuilt) return;
    window.__framedArtBuilt = true;

    var root = new THREE.Group();
    root.name = 'framed-art-logo';

    // Door crack light (keep subtle)
    var doorLight = new THREE.SpotLight(0xffeedd, 1.5, 4.0, Math.PI / 3.5, 0.85, 1.4);
    doorLight.position.set(DOOR_X, 0.04, ZB + 0.06);
    doorLight.target.position.set(DOOR_X, 0, ZB + 1.5);
    root.add(doorLight);
    root.add(doorLight.target);
    var doorFill = new THREE.PointLight(0xffeedd, 0.4, 2.2, 1.6);
    doorFill.position.set(DOOR_X, 0.06, ZB + 0.2);
    root.add(doorFill);
    var crack = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.035),
      new THREE.MeshBasicMaterial({
        color: 0xffeedd,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    crack.rotation.x = -Math.PI / 2;
    crack.position.set(DOOR_X, 0.012, ZB + T / 2 + 0.08);
    root.add(crack);

    // Frame dimensions
    var frameW = 1.8;
    var frameH = 1.3;
    var frameD = 0.04;
    var frameX = DESK_X;
    var frameY = 2.75;
    var frameZ = ZB + T / 2 + 0.03;

    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.8,
      roughness: 0.3
    });
    var matMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2e,
      roughness: 0.9,
      metalness: 0.05
    });

    // Outer frame shell
    var outer = new THREE.Mesh(new THREE.BoxGeometry(frameW, frameH, frameD), frameMat);
    outer.position.set(frameX, frameY, frameZ);
    outer.castShadow = true;
    root.add(outer);

    // Inner mat board (slightly inset)
    var matW = frameW - 0.12;
    var matH = frameH - 0.12;
    var matBoard = new THREE.Mesh(new THREE.BoxGeometry(matW, matH, 0.01), matMat);
    matBoard.position.set(frameX, frameY, frameZ + frameD / 2 + 0.006);
    root.add(matBoard);

    // Bevel lip on frame front
    var lip = 0.035;
    var lipMat = frameMat;
    var topLip = new THREE.Mesh(new THREE.BoxGeometry(frameW, lip, 0.02), lipMat);
    topLip.position.set(frameX, frameY + frameH / 2 - lip / 2, frameZ + frameD / 2 + 0.01);
    root.add(topLip);
    var botLip = new THREE.Mesh(new THREE.BoxGeometry(frameW, lip, 0.02), lipMat);
    botLip.position.set(frameX, frameY - frameH / 2 + lip / 2, frameZ + frameD / 2 + 0.01);
    root.add(botLip);
    var leftLip = new THREE.Mesh(new THREE.BoxGeometry(lip, frameH - lip * 2, 0.02), lipMat);
    leftLip.position.set(frameX - frameW / 2 + lip / 2, frameY, frameZ + frameD / 2 + 0.01);
    root.add(leftLip);
    var rightLip = new THREE.Mesh(new THREE.BoxGeometry(lip, frameH - lip * 2, 0.02), lipMat);
    rightLip.position.set(frameX + frameW / 2 - lip / 2, frameY, frameZ + frameD / 2 + 0.01);
    root.add(rightLip);

    function addArtFace(tex) {
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      // Keep aspect ~ square logo centered in mat
      var artW = matW * 0.72;
      var artH = matH * 0.72;
      var art = new THREE.Mesh(
        new THREE.PlaneGeometry(artW, artH),
        new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          alphaTest: 0.05,
          side: THREE.DoubleSide,
          depthWrite: false,
          toneMapped: false
        })
      );
      art.position.set(frameX, frameY, frameZ + frameD / 2 + 0.014);
      art.userData = {
        interactive: true,
        name: 'logo',
        onClick: function () {
          if (window.showToast) window.showToast('TSCO // BOSS T');
          if (window.playUiSound) window.playUiSound('click');
          console.log('Logo clicked');
        }
      };
      root.add(art);
    }

    function makeCanvasLogo() {
      var c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      var g = c.getContext('2d');
      g.clearRect(0, 0, 512, 512);
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
      var tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      addArtFace(tex);
    }

    var loader = new THREE.TextureLoader();
    loader.load(
      'assets/logo-tsco.png',
      function (tex) { addArtFace(tex); },
      undefined,
      function () { makeCanvasLogo(); }
    );

    // Museum picture light above frame
    var brass = new THREE.MeshStandardMaterial({
      color: 0xb08d57,
      metalness: 0.85,
      roughness: 0.25
    });
    var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 10), brass);
    arm.rotation.z = Math.PI / 2.4;
    arm.position.set(frameX, frameY + frameH / 2 + 0.08, frameZ + 0.12);
    root.add(arm);

    var bar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 12), brass);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(frameX, frameY + frameH / 2 + 0.14, frameZ + 0.2);
    root.add(bar);

    var picSpot = new THREE.SpotLight(0xfff0dd, 1.4, 3.5, Math.PI / 4, 0.8, 1.3);
    picSpot.position.set(frameX, frameY + frameH / 2 + 0.14, frameZ + 0.35);
    picSpot.target.position.set(frameX, frameY, frameZ + 0.05);
    root.add(picSpot);
    root.add(picSpot.target);

    scene.add(root);
  }

  function patchLogoClick() {
    if (window.__logoClickPatched) return;
    if (typeof renderer === 'undefined' || !renderer || !renderer.domElement) {
      setTimeout(patchLogoClick, 200);
      return;
    }
    window.__logoClickPatched = true;
    var ray = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    var last = 0;
    renderer.domElement.addEventListener(
      'pointerdown',
      function (event) {
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
      },
      true
    );
  }

  fetch(GOOD_SCENE_URL, { cache: 'no-cache' })
    .then(function (r) {
      return r.text();
    })
    .then(function (code) {
      var s = document.createElement('script');
      s.textContent = code;
      document.body.appendChild(s);
      var tries = 0;
      function afterReady() {
        tries++;
        if (typeof scene !== 'undefined' && scene && window.__dioramaBuilt) {
          placeFurniture();
          createFramedArtLogo();
          patchLogoClick();
          setTimeout(placeFurniture, 500);
          setTimeout(placeFurniture, 1200);
          return;
        }
        if (tries < 80) setTimeout(afterReady, 200);
      }
      setTimeout(afterReady, 600);
    })
    .catch(function (err) {
      console.error(err);
    });
})();
